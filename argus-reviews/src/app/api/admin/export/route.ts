import { NextResponse } from "next/server";
import { listExportRows, toCsv } from "@/lib/export";
import { getAdminContext } from "@/lib/session";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const rows = await listExportRows({ businessId: ctx.business.id, limit: 5000 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${ctx.business.slug}-reviews-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
