import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret, secretKey } from "./secret";

/** Short-lived token proving a photo was uploaded for a specific business. */
export async function signPhotoToken(payload: { key: string; bid: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(secretKey("photo"));
}

export async function verifyPhotoToken(token: string): Promise<{ key: string; bid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey("photo"), { algorithms: ["HS256"] });
    if (typeof payload.key !== "string" || typeof payload.bid !== "string") return null;
    return { key: payload.key, bid: payload.bid };
  } catch {
    return null;
  }
}

export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  return createHmac("sha256", getAuthSecret()).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function clientIp(headers: Headers) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip");
}
