"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { creativePosts, customers, reviews, type CreativeStatus } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { defaultCaption } from "@/lib/creatives";
import { requireAdmin } from "@/lib/session";
import { deliverWebhook } from "@/lib/webhooks";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createCreative(reviewId: string): Promise<Result> {
  const ctx = await requireAdmin();
  const [r] = await db
    .select({ id: reviews.id, feedback: reviews.feedback, rating: reviews.rating, consent: reviews.consentToPublish, name: customers.name })
    .from(reviews)
    .leftJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, ctx.business.id)))
    .limit(1);
  if (!r) return { ok: false, error: "Review not found" };
  if (!r.consent) return { ok: false, error: "The guest didn't consent to public use of this review." };

  const [post] = await db
    .insert(creativePosts)
    .values({
      businessId: ctx.business.id,
      reviewId: r.id,
      template: "quote-card",
      caption: defaultCaption({ feedback: r.feedback, name: r.name, rating: r.rating, businessName: ctx.business.name, type: ctx.business.type }),
      status: "DRAFT",
    })
    .returning({ id: creativePosts.id });
  await logActivity({ businessId: ctx.business.id, actor: ctx.user.email, action: "creative.created", entity: "creative", entityId: post.id });
  revalidatePath("/admin/creatives");
  return { ok: true, id: post.id };
}

export async function updateCreative(id: string, patch: { caption?: string; status?: CreativeStatus }): Promise<Result> {
  const ctx = await requireAdmin();
  const set: Partial<typeof creativePosts.$inferInsert> = {};
  if (typeof patch.caption === "string") set.caption = patch.caption.slice(0, 2200);
  if (patch.status) {
    if (!["DRAFT", "APPROVED", "PUBLISHED"].includes(patch.status)) return { ok: false, error: "Unknown status" };
    set.status = patch.status;
    if (patch.status === "APPROVED") set.approvedAt = new Date();
    if (patch.status === "PUBLISHED") set.publishedAt = new Date();
    if (patch.status === "DRAFT") {
      set.approvedAt = null;
      set.publishedAt = null;
    }
  }
  const updated = await db
    .update(creativePosts)
    .set(set)
    .where(and(eq(creativePosts.id, id), eq(creativePosts.businessId, ctx.business.id)))
    .returning({ id: creativePosts.id, reviewId: creativePosts.reviewId, status: creativePosts.status, caption: creativePosts.caption });
  if (!updated.length) return { ok: false, error: "Post not found" };

  if (patch.status) {
    const businessId = ctx.business.id;
    const post = updated[0];
    after(() =>
      deliverWebhook(businessId, "creative.updated", {
        creative_id: post.id,
        review_id: post.reviewId,
        status: post.status,
        caption: post.caption,
      }).then(() => undefined),
    );
  }
  revalidatePath("/admin/creatives");
  return { ok: true, id };
}

export async function deleteCreative(id: string): Promise<Result> {
  const ctx = await requireAdmin();
  await db.delete(creativePosts).where(and(eq(creativePosts.id, id), eq(creativePosts.businessId, ctx.business.id)));
  revalidatePath("/admin/creatives");
  return { ok: true };
}
