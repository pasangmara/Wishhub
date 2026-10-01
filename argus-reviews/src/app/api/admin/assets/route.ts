import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, optimizeImage } from "@/lib/images";
import { getAdminContext } from "@/lib/session";
import { putObject } from "@/lib/storage";

/** Admin upload for branding images (logo / cover). Returns a public URL served by /api/assets. */
export async function POST(req: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "cover" ? "cover" : "logo";
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ success: false, error: "Choose an image." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: "Image must be under 8 MB." }, { status: 413 });

  let img;
  try {
    img = await optimizeImage(new Uint8Array(await file.arrayBuffer()), kind === "logo" ? { maxSize: 400, fit: "cover", quality: 88 } : { maxSize: 1800, height: 900, quality: 80 });
  } catch {
    return NextResponse.json({ success: false, error: "That file isn't a supported image." }, { status: 415 });
  }
  const key = `branding/${ctx.business.id}/${kind}-${randomUUID()}.webp`;
  await putObject(key, img.data, img.mime);
  return NextResponse.json({ success: true, url: `/api/assets/${key}` });
}
