import "server-only";
import { createHmac } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { logActivity } from "./activity";
import { listExportRows } from "./export";

export type WebhookEvent = "review.created" | "review.status_changed" | "creative.updated" | "test";

export function signWebhook(body: string, secret: string, timestamp: number) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

async function resolveTarget(businessId: string) {
  const [row] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.businessId, businessId), eq(integrations.kind, "n8n")))
    .limit(1);
  if (row?.enabled && row.webhookUrl) return { url: row.webhookUrl, secret: row.webhookSecret };
  if (row && !row.enabled) return null;
  if (process.env.N8N_WEBHOOK_URL) {
    return { url: process.env.N8N_WEBHOOK_URL, secret: process.env.N8N_WEBHOOK_SECRET || null };
  }
  return null;
}

/**
 * Sends an event to the business's automation webhook (n8n).
 * Called from `after()` so customers and admins never wait on it.
 */
export async function deliverWebhook(
  businessId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
  opts: { throwOnError?: boolean } = {},
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  const target = await resolveTarget(businessId);
  if (!target) return { delivered: false, error: "No webhook configured" };

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ event, sent_at: new Date(timestamp * 1000).toISOString(), data });
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "ARGUS-Webhooks/1.0",
    "x-argus-event": event,
    "x-argus-timestamp": String(timestamp),
  };
  if (target.secret) headers["x-argus-signature"] = `sha256=${signWebhook(body, target.secret, timestamp)}`;

  let result: { delivered: boolean; status?: number; error?: string };
  try {
    const res = await fetch(target.url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
    result = { delivered: res.ok, status: res.status, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    result = { delivered: false, error: err instanceof Error ? err.message : "Request failed" };
  }

  await logActivity({
    businessId,
    actor: "system",
    action: result.delivered ? "webhook.delivered" : "webhook.failed",
    entity: "webhook",
    entityId: typeof data.review_id === "string" ? data.review_id : undefined,
    meta: { event, status: result.status, error: result.error },
  });
  if (opts.throwOnError && !result.delivered) throw new Error(result.error);
  return result;
}

export async function deliverReviewEvent(businessId: string, reviewId: string, event: WebhookEvent) {
  const [row] = await listExportRows({ businessId, reviewIds: [reviewId], limit: 1 });
  if (!row) return;
  await deliverWebhook(businessId, event, row as unknown as Record<string, unknown>);
}
