import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { secretKey } from "./secret";

export const SESSION_COOKIE = "argus_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { uid: string; bid?: string };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setIssuer("argus")
    .setAudience("argus-admin")
    .sign(secretKey("session"));
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey("session"), {
      issuer: "argus",
      audience: "argus-admin",
      algorithms: ["HS256"],
    });
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, bid: typeof payload.bid === "string" ? payload.bid : undefined };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
