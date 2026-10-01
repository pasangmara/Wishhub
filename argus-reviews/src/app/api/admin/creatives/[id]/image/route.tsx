import { and, eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { db } from "@/db";
import { creativePosts, customers, reviews } from "@/db/schema";
import { initials, readableOn, safeHex } from "@/lib/color";
import { getAdminContext } from "@/lib/session";
import { getObject } from "@/lib/storage";

async function logoDataUri(url: string | null) {
  if (!url?.startsWith("/api/assets/")) return null;
  const obj = await getObject(url.replace("/api/assets/", "")).catch(() => null);
  if (!obj) return null;
  // Satori can't decode WebP — convert to PNG.
  const png = await sharp(obj.body).resize(168, 168, { fit: "cover" }).png().toBuffer().catch(() => null);
  return png ? `data:image/png;base64,${png.toString("base64")}` : null;
}

/** 1080×1080 quote card for social posts (Facebook / Instagram / LinkedIn). */
export async function GET(req: Request, ctx: RouteContext<"/api/admin/creatives/[id]/image">) {
  const admin = await getAdminContext();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });

  const [row] = await db
    .select({ feedback: reviews.feedback, rating: reviews.rating, name: customers.name })
    .from(creativePosts)
    .innerJoin(reviews, eq(reviews.id, creativePosts.reviewId))
    .leftJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(creativePosts.id, id), eq(creativePosts.businessId, admin.business.id)))
    .limit(1);
  if (!row) return new Response(null, { status: 404 });

  const b = admin.business;
  const brand = safeHex(b.primaryColor, "#14532d");
  const accent = safeHex(b.secondaryColor, "#f97316");
  const ink = readableOn(brand);
  const quote = row.feedback.length > 260 ? `${row.feedback.slice(0, 257).trimEnd()}…` : row.feedback;
  const fontSize = quote.length > 180 ? 46 : quote.length > 100 ? 54 : 64;
  const logo = await logoDataUri(b.logoUrl);
  const download = new URL(req.url).searchParams.get("download") === "1";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: brand, color: ink, padding: 90, position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 520, height: 520, borderRadius: 999, background: accent, opacity: 0.18, display: "flex" }} />
        <div style={{ position: "absolute", left: -120, bottom: -200, width: 460, height: 460, borderRadius: 999, background: "#ffffff", opacity: 0.06, display: "flex" }} />
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <svg key={n} width="52" height="52" viewBox="0 0 24 24">
              <path d="M12 2.75l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 17.18l-5.66 2.98 1.08-6.3L2.85 9.4l6.32-.92L12 2.75z" fill={n <= row.rating ? accent : "rgba(255,255,255,0.25)"} />
            </svg>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 180, lineHeight: 1, color: accent, marginTop: 40, height: 110 }}>“</div>
        <div style={{ display: "flex", flex: 1, fontSize, lineHeight: 1.3, fontWeight: 600, letterSpacing: -0.5 }}>{quote}</div>
        {row.name ? <div style={{ display: "flex", fontSize: 34, opacity: 0.85, marginTop: 30 }}>— {row.name}</div> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 60, paddingTop: 40, borderTop: `2px solid ${ink === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.15)"}` }}>
          {logo ? (
            <img src={logo} alt="" width={84} height={84} style={{ borderRadius: 999, background: "#fff" }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: 999, background: accent, color: readableOn(accent), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 700 }}>
              {initials(b.name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>{b.name}</div>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.7 }}>Guest review</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "cache-control": "private, no-store",
        ...(download ? { "content-disposition": `attachment; filename="${b.slug}-post-${id.slice(0, 8)}.png"` } : {}),
      },
    },
  );
}
