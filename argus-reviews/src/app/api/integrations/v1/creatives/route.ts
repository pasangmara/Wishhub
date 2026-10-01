import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { creativePosts, reviews } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { authenticateIntegration, unauthorized } from "@/lib/integration-auth";
import { creativeCreateSchema, serializeCreative } from "./schema";

/** POST /api/integrations/v1/creatives — n8n reports a generated creative for a review. */
export async function POST(req: Request) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const parsed = creativeCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 422 });
  const d = parsed.data;

  const [review] = await db
    .select({ consent: reviews.consentToPublish })
    .from(reviews)
    .where(and(eq(reviews.id, d.review_id), eq(reviews.businessId, business.id)))
    .limit(1);
  if (!review) return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
  if (!review.consent) return NextResponse.json({ success: false, error: "Guest did not consent to public use" }, { status: 409 });

  const now = new Date();
  const [post] = await db
    .insert(creativePosts)
    .values({
      businessId: business.id,
      reviewId: d.review_id,
      template: d.template ?? "external",
      caption: d.caption ?? null,
      imageUrl: d.image_url ?? null,
      status: d.status,
      approvedAt: d.status !== "DRAFT" ? now : null,
      publishedAt: d.status === "PUBLISHED" ? now : null,
    })
    .returning();
  await logActivity({ businessId: business.id, actor: "integration", action: "creative.created", entity: "creative", entityId: post.id });
  return NextResponse.json({ success: true, creative: serializeCreative(post) }, { status: 201 });
}
