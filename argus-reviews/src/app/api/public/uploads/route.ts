import { randomUUID } from "node:crypto";
import { and, count, eq, gte, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewMedia } from "@/db/schema";
import { findActiveBusinessBySlug } from "@/lib/business";
import { MAX_UPLOAD_BYTES, optimizeImage } from "@/lib/images";
import { putObject } from "@/lib/storage";
import { signPhotoToken } from "@/lib/tokens";

const MAX_PENDING_UPLOADS_PER_HOUR = 300;

/**
 * Public photo upload (Premium plan only). Returns a short-lived signed token
 * that the review submission references. The image itself stays private.
 */
export async function POST(req: Request) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ success: false, error: "That photo is too large. Please choose one under 8 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid upload." }, { status: 400 });
  }
  const slug = String(form.get("business_slug") || "");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: "Please choose a photo." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, error: "That photo is too large. Please choose one under 8 MB." }, { status: 413 });
  }

  const business = slug ? await findActiveBusinessBySlug(slug) : null;
  if (!business) return NextResponse.json({ success: false, error: "This review link is unavailable." }, { status: 404 });
  if (business.plan !== "premium") {
    return NextResponse.json({ success: false, error: "Photo upload is not available." }, { status: 403 });
  }

  // Coarse abuse guard: cap unattached uploads per business per hour.
  const [{ n }] = await db
    .select({ n: count() })
    .from(reviewMedia)
    .where(
      and(
        eq(reviewMedia.businessId, business.id),
        isNull(reviewMedia.reviewId),
        gte(reviewMedia.createdAt, new Date(Date.now() - 3_600_000)),
      ),
    );
  if (n >= MAX_PENDING_UPLOADS_PER_HOUR) {
    return NextResponse.json({ success: false, error: "Uploads are busy right now. Please submit without a photo." }, { status: 429 });
  }

  let optimized;
  try {
    optimized = await optimizeImage(new Uint8Array(await file.arrayBuffer()), { maxSize: 1600, quality: 80 });
  } catch {
    return NextResponse.json({ success: false, error: "We couldn't read that image. Please choose a JPG or PNG photo." }, { status: 415 });
  }

  const key = `reviews/${business.id}/${randomUUID()}.webp`;
  await putObject(key, optimized.data, optimized.mime);
  await db.insert(reviewMedia).values({
    businessId: business.id,
    storageKey: key,
    mime: optimized.mime,
    width: optimized.width,
    height: optimized.height,
    bytes: optimized.bytes,
  });

  return NextResponse.json({ success: true, photo_token: await signPhotoToken({ key, bid: business.id }) });
}
