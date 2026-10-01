import { and, desc, eq, like } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { activityLogs, integrations } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { appUrl } from "@/lib/share";
import { SettingsTabs } from "../settings/settings-tabs";
import { IntegrationsPanel } from "./integrations-panel";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const ctx = await requireAdmin();
  const [row] = await db.select().from(integrations).where(eq(integrations.businessId, ctx.business.id)).limit(1);
  const deliveries = await db
    .select({ id: activityLogs.id, action: activityLogs.action, meta: activityLogs.meta, createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(and(eq(activityLogs.businessId, ctx.business.id), like(activityLogs.action, "webhook.%")))
    .orderBy(desc(activityLogs.createdAt))
    .limit(8);

  return (
    <div>
      <SettingsTabs />
      <IntegrationsPanel
        baseUrl={appUrl()}
        webhookUrl={row?.webhookUrl ?? ""}
        enabled={row?.enabled ?? true}
        secret={row?.webhookSecret ?? null}
        apiKeyPrefix={row?.apiKeyPrefix ?? null}
        envFallback={Boolean(process.env.N8N_WEBHOOK_URL)}
        deliveries={deliveries.map((d) => ({
          id: d.id,
          ok: d.action === "webhook.delivered",
          event: String((d.meta as Record<string, unknown> | null)?.event ?? ""),
          detail: String((d.meta as Record<string, unknown> | null)?.status ?? (d.meta as Record<string, unknown> | null)?.error ?? ""),
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
