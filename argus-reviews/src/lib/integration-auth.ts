import "server-only";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, integrations, type Business } from "@/db/schema";
import { sha256 } from "./tokens";

export const API_KEY_PREFIX = "argus_sk_";

/** Resolves the business for an integration API key (Authorization: Bearer argus_sk_…). */
export async function authenticateIntegration(req: Request): Promise<Business | null> {
  const header = req.headers.get("authorization") ?? "";
  const key = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : req.headers.get("x-api-key")?.trim();
  if (!key || !key.startsWith(API_KEY_PREFIX) || key.length > 200) return null;
  const [row] = await db
    .select({ business: businesses })
    .from(integrations)
    .innerJoin(businesses, eq(businesses.id, integrations.businessId))
    .where(and(eq(integrations.apiKeyHash, sha256(key)), eq(integrations.enabled, true)))
    .limit(1);
  return row?.business ?? null;
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Invalid or missing API key. Send Authorization: Bearer <key>." },
    { status: 401, headers: { "www-authenticate": "Bearer" } },
  );
}
