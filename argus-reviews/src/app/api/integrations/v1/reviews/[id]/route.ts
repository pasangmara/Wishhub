import { and, eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { listExportRows } from "@/lib/export";
import { authenticateIntegration, unauthorized } from "@/lib/integration-auth";
import { REVIEW_STATUSES } from "@/lib/validation";
import { deliverReviewEvent } from "@/lib/webhooks";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request, ctx: RouteContext<"/api/integrations/v1/reviews/[id]">) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const [row] = await listExportRows({ businessId: business.id, reviewIds: [id], limit: 1 });
  if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, review: row });
}

const patchSchema = z.object({ status: z.enum(REVIEW_STATUSES) });

export async function PATCH(req: Request, ctx: RouteContext<"/api/integrations/v1/reviews/[id]">) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: `Body must be { "status": one of ${REVIEW_STATUSES.join(", ")} }` }, { status: 422 });
  }

  const [current] = await db
    .select({ status: reviews.status, consent: reviews.consentToPublish })
    .from(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, business.id)))
    .limit(1);
  if (!current) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (parsed.data.status === "FEATURED" && !current.consent) {
    return NextResponse.json({ success: false, error: "Guest did not consent to public use" }, { status: 409 });
  }

  await db.update(reviews).set({ status: parsed.data.status }).where(eq(reviews.id, id));
  after(async () => {
    await logActivity({ businessId: business.id, actor: "integration", action: "review.status_changed", entity: "review", entityId: id, meta: { from: current.status, to: parsed.data.status } });
    if (current.status !== parsed.data.status) await deliverReviewEvent(business.id, id, "review.status_changed");
  });
  const [row] = await listExportRows({ businessId: business.id, reviewIds: [id], limit: 1 });
  return NextResponse.json({ success: true, review: row });
}
