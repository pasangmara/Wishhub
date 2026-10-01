import { getObject } from "@/lib/storage";

/** Public branding assets only (logos / covers). Review photos are never served here. */
export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[...key]">) {
  const { key } = await ctx.params;
  const path = key.join("/");
  if (!path.startsWith("branding/")) return new Response(null, { status: 404 });
  const obj = await getObject(path).catch(() => null);
  if (!obj) return new Response(null, { status: 404 });
  return new Response(obj.body as BodyInit, {
    headers: {
      "content-type": obj.contentType,
      // Keys are content-unique (uuid), so they can be cached forever.
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
