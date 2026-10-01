import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { creativePosts } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { authenticateIntegration, unauthorized } from "@/lib/integration-auth";
import { creativePatchSchema, serializeCreative } from "../schema";

/** PATCH /api/integrations/v1/creatives/{id} — update caption / image / approval / publish state. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/integrations/v1/creatives/[id]">) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const parsed = creativePatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 422 });
  const d = parsed.data;

  const set: Partial<typeof creativePosts.$inferInsert> = {};
  if (d.caption !== undefined) set.caption = d.caption;
  if (d.image_url !== undefined) set.imageUrl = d.image_url;
  if (d.status) {
    set.status = d.status;
    if (d.status === "APPROVED") set.approvedAt = new Date();
    if (d.status === "PUBLISHED") set.publishedAt = new Date();
  }
  const [post] = await db
    .update(creativePosts)
    .set(set)
    .where(and(eq(creativePosts.id, id), eq(creativePosts.businessId, business.id)))
    .returning();
  if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await logActivity({ businessId: business.id, actor: "integration", action: "creative.updated", entity: "creative", entityId: id, meta: { status: d.status } });
  return NextResponse.json({ success: true, creative: serializeCreative(post) });
}
