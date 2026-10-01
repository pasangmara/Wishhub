import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getAdminContext } from "@/lib/session";
import { getObject } from "@/lib/storage";

/** Review photos are private: only members of the owning business can view them. */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/media/[reviewId]">) {
  const admin = await getAdminContext();
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { reviewId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(reviewId)) return new NextResponse(null, { status: 404 });

  const [row] = await db
    .select({ key: reviews.photoUrl })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, admin.business.id)))
    .limit(1);
  if (!row?.key) return new NextResponse(null, { status: 404 });

  const obj = await getObject(row.key);
  if (!obj) return new NextResponse(null, { status: 404 });
  return new Response(obj.body as BodyInit, {
    headers: { "content-type": obj.contentType, "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff" },
  });
}
