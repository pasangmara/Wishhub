"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifyPassword } from "@/lib/auth";
import { getAdminContext, isMember } from "@/lib/session";

export type LoginState = { error?: string; email?: string };

// Per-instance brute-force damping (good enough for MVP; swap for a shared store at scale).
const attempts = new Map<string, { n: number; until: number }>();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

// A real bcrypt hash so unknown emails take the same time as wrong passwords.
const DUMMY_HASH = "$2b$12$LA8m6BIocnaixCnBZDxChuboCGV732GefUtwF1o.bBZGSNbyfnPA6";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(formData.get("email") ?? "") };
  const { email, password, next } = parsed.data;

  const gate = attempts.get(email);
  if (gate && gate.until > Date.now()) {
    return { error: "Too many attempts. Please wait a minute and try again.", email };
  }

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    const n = (gate?.n ?? 0) + 1;
    attempts.set(email, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return { error: "Incorrect email or password.", email };
  }
  attempts.delete(email);

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession({ uid: user.id }), sessionCookieOptions());
  await logActivity({ businessId: null, actor: user.email, action: "admin.login" });

  const dest = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  redirect(dest);
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function switchBusinessAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const businessId = String(formData.get("businessId") ?? "");
  if (!(await isMember(ctx.user.id, businessId))) return;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession({ uid: ctx.user.id, bid: businessId }), sessionCookieOptions());
  redirect("/admin");
}
