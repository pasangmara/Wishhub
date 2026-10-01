"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { API_KEY_PREFIX } from "@/lib/integration-auth";
import { requireAdmin } from "@/lib/session";
import { randomToken, sha256 } from "@/lib/tokens";
import { deliverWebhook } from "@/lib/webhooks";

export type IntegrationState = { ok?: boolean; error?: string; savedAt?: number; apiKey?: string; secret?: string; test?: string };

async function ensureRow(businessId: string) {
  const [row] = await db.select().from(integrations).where(eq(integrations.businessId, businessId)).limit(1);
  if (row) return row;
  const [created] = await db
    .insert(integrations)
    .values({ businessId, kind: "n8n", enabled: true, webhookSecret: `whsec_${randomToken(24)}` })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(integrations).where(eq(integrations.businessId, businessId)).limit(1))[0];
}

const webhookSchema = z.object({
  webhookUrl: z
    .string()
    .trim()
    .max(500)
    .transform((v) => v || null)
    .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), "Webhook URL must start with https://"),
  enabled: z.boolean(),
});

export async function saveWebhook(_prev: IntegrationState, fd: FormData): Promise<IntegrationState> {
  const ctx = await requireAdmin();
  const parsed = webhookSchema.safeParse({ webhookUrl: String(fd.get("webhookUrl") ?? ""), enabled: fd.get("enabled") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const row = await ensureRow(ctx.business.id);
  await db.update(integrations).set(parsed.data).where(eq(integrations.id, row.id));
  await logActivity({ businessId: ctx.business.id, actor: ctx.user.email, action: "integration.updated" });
  revalidatePath("/admin/integrations");
  return { ok: true, savedAt: Date.now() };
}

export async function rotateSecret(): Promise<IntegrationState> {
  const ctx = await requireAdmin();
  const row = await ensureRow(ctx.business.id);
  const secret = `whsec_${randomToken(24)}`;
  await db.update(integrations).set({ webhookSecret: secret }).where(eq(integrations.id, row.id));
  revalidatePath("/admin/integrations");
  return { ok: true, secret };
}

export async function generateApiKey(): Promise<IntegrationState> {
  const ctx = await requireAdmin();
  const row = await ensureRow(ctx.business.id);
  const key = `${API_KEY_PREFIX}${randomToken(30)}`;
  await db.update(integrations).set({ apiKeyHash: sha256(key), apiKeyPrefix: key.slice(0, 14) }).where(eq(integrations.id, row.id));
  await logActivity({ businessId: ctx.business.id, actor: ctx.user.email, action: "integration.api_key_generated" });
  revalidatePath("/admin/integrations");
  return { ok: true, apiKey: key };
}

export async function revokeApiKey(): Promise<IntegrationState> {
  const ctx = await requireAdmin();
  await db.update(integrations).set({ apiKeyHash: null, apiKeyPrefix: null }).where(eq(integrations.businessId, ctx.business.id));
  revalidatePath("/admin/integrations");
  return { ok: true };
}

export async function sendTestEvent(): Promise<IntegrationState> {
  const ctx = await requireAdmin();
  const res = await deliverWebhook(ctx.business.id, "test", {
    message: "Hello from ARGUS 👋 Your webhook is connected.",
    business: ctx.business.name,
    business_slug: ctx.business.slug,
  });
  revalidatePath("/admin/integrations");
  return res.delivered ? { ok: true, test: `Delivered (HTTP ${res.status})` } : { error: `Test failed: ${res.error ?? "unknown error"}` };
}
