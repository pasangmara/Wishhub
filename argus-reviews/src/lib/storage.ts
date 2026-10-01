import "server-only";
import { AwsClient } from "aws4fetch";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Tiny storage abstraction.
 *  - local: files on disk (development / single VM)
 *  - s3:    any S3-compatible bucket (Supabase Storage S3 endpoint, Cloudflare R2, AWS S3)
 * Objects are always served through the app (never via public bucket URLs),
 * so review photos stay private to authenticated admins.
 */
export type StoredObject = { body: Uint8Array; contentType: string };

const KEY_RE = /^[a-z0-9][a-z0-9/_\-.]{0,200}$/i;

function assertKey(key: string) {
  if (!KEY_RE.test(key) || key.includes("..")) throw new Error("Invalid storage key");
}

function driver() {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

function localPath(key: string) {
  const root = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

let s3: AwsClient | null = null;
function s3Client() {
  if (!s3) {
    const { S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } = process.env;
    if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error("S3 credentials are not configured");
    s3 = new AwsClient({
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
      region: S3_REGION || "auto",
      service: "s3",
    });
  }
  return s3;
}

function s3Url(key: string) {
  const endpoint = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !bucket) throw new Error("S3_ENDPOINT / S3_BUCKET are not configured");
  return `${endpoint}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  assertKey(key);
  if (driver() === "s3") {
    const res = await s3Client().fetch(s3Url(key), {
      method: "PUT",
      body: body as BodyInit,
      headers: { "content-type": contentType },
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  await writeFile(`${file}.meta`, contentType);
}

export async function getObject(key: string): Promise<StoredObject | null> {
  assertKey(key);
  if (driver() === "s3") {
    const res = await s3Client().fetch(s3Url(key));
    if (!res.ok) return null;
    return {
      body: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") || "application/octet-stream",
    };
  }
  try {
    const file = localPath(key);
    const [body, contentType] = await Promise.all([
      readFile(file),
      readFile(`${file}.meta`, "utf8").catch(() => "application/octet-stream"),
    ]);
    return { body: new Uint8Array(body), contentType };
  } catch {
    return null;
  }
}
