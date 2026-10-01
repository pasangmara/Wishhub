import "server-only";
import { and, count, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { businesses, customers, reviewMedia, reviews, type Business, type CustomerStatus } from "@/db/schema";
import { shouldShowGoogleReview } from "./business-types";
import { findActiveBusinessBySlug, positiveThreshold } from "./business";
import { verifyPhotoToken } from "./tokens";
import type { PublicReviewInput } from "./validation";

export const RATE_LIMIT_PER_HOUR = 8;

export type CreateReviewResult =
  | {
      ok: true;
      business_id: string;
      review_id: string;
      rating: number;
      show_google_review: boolean;
      google_review_url: string | null;
      duplicate?: boolean;
    }
  | { ok: false; status: number; error: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function responseFor(business: Business, reviewId: string, rating: number) {
  const show = shouldShowGoogleReview(rating, business.googleReviewUrl, positiveThreshold(business));
  return {
    ok: true as const,
    business_id: business.id,
    review_id: reviewId,
    rating,
    show_google_review: show,
    google_review_url: show ? business.googleReviewUrl : null,
  };
}

/**
 * Finds (by phone or email) or creates the business-owned customer record.
 * Customers never have accounts — this is purely the business's guest list.
 */
async function upsertCustomer(
  tx: Tx,
  businessId: string,
  input: { name: string | null; phone: string | null; email: string | null },
  lowRating: boolean,
): Promise<string | null> {
  const { name, phone, email } = input;
  if (!name && !phone && !email) return null;

  const matchers = [];
  if (phone) matchers.push(eq(customers.phone, phone));
  if (email) matchers.push(eq(customers.email, email));

  if (matchers.length) {
    const found = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.businessId, businessId), or(...matchers)))
      .limit(2);
    const existing = found.find((c) => phone && c.phone === phone) ?? found[0];
    if (existing) {
      const nextStatus: CustomerStatus = lowRating ? "FOLLOW_UP" : existing.status === "FOLLOW_UP" ? "FOLLOW_UP" : "ACTIVE";
      const patch: Partial<typeof customers.$inferInsert> = { status: nextStatus };
      if (name && !existing.name) patch.name = name;
      // Only fill a missing contact field if no other customer already owns it.
      if (phone && !existing.phone && !found.some((c) => c.phone === phone)) patch.phone = phone;
      if (email && !existing.email && !found.some((c) => c.email === email)) patch.email = email;
      await tx.update(customers).set(patch).where(eq(customers.id, existing.id));
      return existing.id;
    }
  }

  const [created] = await tx
    .insert(customers)
    .values({ businessId, name, phone, email, status: lowRating ? "FOLLOW_UP" : "NEW" })
    .onConflictDoNothing()
    .returning({ id: customers.id });
  if (created) return created.id;

  // Lost a race with a concurrent submission using the same contact — reuse that row.
  const [again] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), or(...matchers)))
    .limit(1);
  return again?.id ?? null;
}

export async function createReview(
  input: PublicReviewInput,
  ctx: { ipHash: string | null },
): Promise<CreateReviewResult> {
  const business = await findActiveBusinessBySlug(input.business_slug);
  if (!business) return { ok: false, status: 404, error: "This review link is unavailable." };

  // Idempotency: a retried/double-submitted form returns the original review.
  if (input.submission_id) {
    const [prev] = await db
      .select({ id: reviews.id, rating: reviews.rating, businessId: reviews.businessId })
      .from(reviews)
      .where(eq(reviews.submissionId, input.submission_id))
      .limit(1);
    if (prev) {
      if (prev.businessId !== business.id) return { ok: false, status: 409, error: "Duplicate submission." };
      return { ...responseFor(business, prev.id, prev.rating), duplicate: true };
    }
  }

  if (ctx.ipHash) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.businessId, business.id),
          eq(reviews.ipHash, ctx.ipHash),
          gte(reviews.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
        ),
      );
    if (n >= RATE_LIMIT_PER_HOUR) {
      return { ok: false, status: 429, error: "Thanks! We've already received several reviews from you. Please try again later." };
    }
  }

  let photoKey: string | null = null;
  if (input.photo_token) {
    if (business.plan !== "premium") return { ok: false, status: 400, error: "Photo upload is not available." };
    const token = await verifyPhotoToken(input.photo_token);
    if (!token || token.bid !== business.id) return { ok: false, status: 400, error: "Your photo upload expired. Please add it again." };
    photoKey = token.key;
  }

  const lowRating = input.rating < positiveThreshold(business);
  const answers =
    input.answers && Object.keys(input.answers).length ? Object.fromEntries(Object.entries(input.answers).slice(0, 3)) : null;

  try {
    const reviewId = await db.transaction(async (tx) => {
      const customerId = await upsertCustomer(
        tx,
        business.id,
        { name: input.name, phone: input.phone, email: input.email },
        lowRating,
      );

      const [review] = await tx
        .insert(reviews)
        .values({
          businessId: business.id,
          customerId,
          rating: input.rating,
          feedback: input.feedback,
          serviceType: input.service_type,
          answers,
          photoUrl: photoKey,
          consentToPublish: input.consent_to_publish,
          source: input.source,
          // Lower ratings land directly in the private follow-up queue.
          status: lowRating ? "FOLLOW_UP" : "NEW",
          submissionId: input.submission_id ?? null,
          ipHash: ctx.ipHash,
        })
        .returning({ id: reviews.id });

      if (photoKey) {
        const linked = await tx
          .update(reviewMedia)
          .set({ reviewId: review.id })
          .where(
            and(eq(reviewMedia.storageKey, photoKey), eq(reviewMedia.businessId, business.id), isNull(reviewMedia.reviewId)),
          )
          .returning({ id: reviewMedia.id });
        if (!linked.length) throw new PhotoError();
      }
      return review.id;
    });

    return responseFor(business, reviewId, input.rating);
  } catch (err) {
    if (err instanceof PhotoError) return { ok: false, status: 400, error: "Your photo upload expired. Please add it again." };
    // Unique violation on submission_id = concurrent duplicate submit.
    if (input.submission_id && pgCode(err) === "23505") {
      const [prev] = await db
        .select({ id: reviews.id, rating: reviews.rating })
        .from(reviews)
        .where(and(eq(reviews.submissionId, input.submission_id), eq(reviews.businessId, business.id)))
        .limit(1);
      if (prev) return { ...responseFor(business, prev.id, prev.rating), duplicate: true };
    }
    throw err;
  }
}

class PhotoError extends Error {}

function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

export async function getBusinessById(id: string) {
  const [b] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return b ?? null;
}
