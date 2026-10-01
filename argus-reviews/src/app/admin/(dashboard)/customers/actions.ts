"use server";

import { getCustomerDetail } from "@/lib/customer-queries";
import { requireAdmin } from "@/lib/session";

export async function loadCustomer(id: string) {
  const ctx = await requireAdmin();
  return getCustomerDetail(ctx.business.id, id);
}
