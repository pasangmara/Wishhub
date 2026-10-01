import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];

export type OptimizedImage = { data: Uint8Array; width: number; height: number; bytes: number; mime: string };

/** Auto-orients, resizes, strips EXIF/GPS metadata, and re-encodes as WebP. */
export async function optimizeImage(
  input: Uint8Array,
  opts: { maxSize?: number; quality?: number; fit?: "inside" | "cover"; height?: number } = {},
): Promise<OptimizedImage> {
  const { maxSize = 1600, quality = 80, fit = "inside" } = opts;
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: maxSize, height: opts.height ?? maxSize, fit, withoutEnlargement: true })
    .webp({ quality, effort: 4 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height, bytes: info.size, mime: "image/webp" };
}
