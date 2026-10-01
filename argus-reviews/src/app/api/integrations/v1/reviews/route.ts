import { NextResponse } from "next/server";
import type { ReviewStatus } from "@/db/schema";
import { listExportRows } from "@/lib/export";
import { authenticateIntegration, unauthorized } from "@/lib/integration-auth";
import { REVIEW_STATUSES } from "@/lib/validation";

/** GET /api/integrations/v1/reviews?since=2026-01-01T00:00:00Z&status=APPROVED&limit=100 */
export async function GET(req: Request) {
  const business = await authenticateIntegration(req);
  if (!business) return unauthorized();
  const sp = new URL(req.url).searchParams;

  const sinceRaw = sp.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : undefined;
  if (since && Number.isNaN(since.getTime())) {
    return NextResponse.json({ success: false, error: "`since` must be an ISO date" }, { status: 400 });
  }
  const statusRaw = sp.get("status")?.toUpperCase();
  if (statusRaw && !(REVIEW_STATUSES as readonly string[]).includes(statusRaw)) {
    return NextResponse.json({ success: false, error: `status must be one of ${REVIEW_STATUSES.join(", ")}` }, { status: 400 });
  }
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 100, 1), 500);

  const rows = await listExportRows({ businessId: business.id, since, status: statusRaw as ReviewStatus | undefined, limit });
  return NextResponse.json({ success: true, count: rows.length, reviews: rows });
}
