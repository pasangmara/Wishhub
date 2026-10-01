"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { customers, reviews, type CustomerStatus, type ReviewStatus } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/session";
import { CUSTOMER_STATUSES, REVIEW_STATUSES } from "@/lib/validation";
import { deliverReviewEvent } from "@/lib/webhooks";

export type ActionResult = { ok: true; status?: string } | { ok: false; error: string };

export async function setReviewStatus(reviewId: string, status: ReviewStatus): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status" };

  const [review] = await db
    .select({ id: reviews.id, status: reviews.status, consent: reviews.consentToPublish, customerId: reviews.customerId })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, ctx.business.id)))
    .limit(1);
  if (!review) return { ok: false, error: "Review not found" };
  if (status === "FEATURED" && !review.consent) {
    return { ok: false, error: "This guest didn't give permission to feature their feedback publicly." };
  }
  if (review.status === status) return { ok: true, status };

  await db.update(reviews).set({ status }).where(eq(reviews.id, review.id));

  // Keep the customer's follow-up flag in sync with how the business handles the review.
  if (review.customerId) {
    if (status === "FOLLOW_UP") {
      await db.update(customers).set({ status: "FOLLOW_UP" }).where(eq(customers.id, review.customerId));
    } else if (review.status === "FOLLOW_UP") {
      await db
        .update(customers)
        .set({ status: "ACTIVE" })
        .where(and(eq(customers.id, review.customerId), eq(customers.status, "FOLLOW_UP")));
    }
  }

  const businessId = ctx.business.id;
  after(async () => {
    await logActivity({
      businessId,
      actor: ctx.user.email,
      action: "review.status_changed",
      entity: "review",
      entityId: review.id,
      meta: { from: review.status, to: status },
    });
    await deliverReviewEvent(businessId, review.id, "review.status_changed");
  });

  revalidatePath("/admin", "layout");
  return { ok: true, status };
}

/** Opening a NEW review marks it as reviewed (silently, no webhook). */
export async function markReviewSeen(reviewId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const updated = await db
    .update(reviews)
    .set({ status: "REVIEWED" })
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, ctx.business.id), eq(reviews.status, "NEW")))
    .returning({ id: reviews.id });
  return { ok: true, status: updated.length ? "REVIEWED" : undefined };
}

export async function setCustomerStatus(customerId: string, status: CustomerStatus): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status" };
  const updated = await db
    .update(customers)
    .set({ status })
    .where(and(eq(customers.id, customerId), eq(customers.businessId, ctx.business.id)))
    .returning({ id: customers.id });
  if (!updated.length) return { ok: false, error: "Customer not found" };
  await logActivity({ businessId: ctx.business.id, actor: ctx.user.email, action: "customer.status_changed", entity: "customer", entityId: customerId, meta: { to: status } });
  revalidatePath("/admin/customers");
  return { ok: true, status };
}
