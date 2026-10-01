import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/session";
import { reviewUrl } from "@/lib/share";

export async function GET(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "png" ? "png" : "svg";
  const download = searchParams.get("download") === "1";
  const url = reviewUrl(ctx.business.slug, "qr");
  const color = { dark: "#0f172a", light: "#ffffff" };
  const filename = `${ctx.business.slug}-review-qr.${format}`;
  const headers: Record<string, string> = { "cache-control": "private, max-age=300" };
  if (download) headers["content-disposition"] = `attachment; filename="${filename}"`;

  if (format === "png") {
    const png = await QRCode.toBuffer(url, { type: "png", width: 1200, margin: 2, errorCorrectionLevel: "M", color });
    return new Response(new Uint8Array(png), { headers: { ...headers, "content-type": "image/png" } });
  }
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color });
  return new Response(svg, { headers: { ...headers, "content-type": "image/svg+xml" } });
}
