import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { adminUsers, businessMembers, businesses, type Business } from "@/db/schema";
import { SESSION_COOKIE, verifySession } from "./auth";

export type AdminContext = {
  user: { id: string; email: string; name: string | null };
  business: Business;
  role: "OWNER" | "STAFF";
  memberships: { businessId: string; name: string; role: "OWNER" | "STAFF" }[];
};

/** Resolves the signed-in admin + the business they are managing. Cached per request. */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const [user] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.uid))
    .limit(1);
  if (!user) return null;

  const rows = await db
    .select({ business: businesses, role: businessMembers.role })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(eq(businessMembers.userId, user.id))
    .orderBy(asc(businessMembers.createdAt));
  if (rows.length === 0) return null;

  const active = rows.find((r) => r.business.id === session.bid) ?? rows[0];
  return {
    user,
    business: active.business,
    role: active.role,
    memberships: rows.map((r) => ({ businessId: r.business.id, name: r.business.name, role: r.role })),
  };
});

/** For pages and server actions: redirects to login when not authenticated. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  return ctx;
}

export async function isMember(userId: string, businessId: string) {
  const [row] = await db
    .select({ id: businessMembers.id })
    .from(businessMembers)
    .where(and(eq(businessMembers.userId, userId), eq(businessMembers.businessId, businessId)))
    .limit(1);
  return Boolean(row);
}
