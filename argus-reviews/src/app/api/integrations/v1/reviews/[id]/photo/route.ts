import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { authenticateIntegration, unauthorized } from "@/lib/integration-auth";
import { getObject } from "@/lib/storage";

export async function GET(req: Request, ctx: RouteContext<"/api/integrations/v1/reviews/[id]/photo">) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const [row] = await db
    .select({ key: reviews.photoUrl, consent: reviews.consentToPublish })
    .from(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, business.id)))
    .limit(1);
  if (!row?.key) return new Response(null, { status: 404 });
  const obj = await getObject(row.key);
  if (!obj) return new Response(null, { status: 404 });
  return new Response(obj.body as BodyInit, {
    headers: { "content-type": obj.contentType, "cache-control": "private, no-store", "x-argus-consent": String(row.consent) },
  });
}
