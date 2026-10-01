import "server-only";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(entry: {
  businessId: string | null;
  actor: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await db.insert(activityLogs).values(entry);
  } catch (err) {
    console.error("[activity] failed to log", entry.action, err);
  }
}
