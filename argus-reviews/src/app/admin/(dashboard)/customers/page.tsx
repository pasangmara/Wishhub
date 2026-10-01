import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, btn } from "@/components/admin/ui";
import type { CustomerStatus } from "@/db/schema";
import { getCustomerDetail, listCustomers } from "@/lib/customer-queries";
import { requireAdmin } from "@/lib/session";
import { CUSTOMER_STATUSES } from "@/lib/validation";
import { CustomersTable } from "./customers-table";

export const metadata: Metadata = { title: "Customers" };

const TABS: { key: CustomerStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "ACTIVE", label: "Active" },
  { key: "FOLLOW_UP", label: "Follow-up" },
  { key: "COMPLETED", label: "Completed" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const s = one(sp.status)?.toUpperCase();
  const status = (CUSTOMER_STATUSES as readonly string[]).includes(s ?? "") ? (s as CustomerStatus) : undefined;
  const q = one(sp.q)?.trim().slice(0, 100) || undefined;
  const page = Number(one(sp.page)) || 1;
  const selectedId = one(sp.customer);

  const [list, selected] = await Promise.all([
    listCustomers(ctx.business.id, { status, q, page }),
    selectedId ? getCustomerDetail(ctx.business.id, selectedId) : Promise.resolve(null),
  ]);

  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, q, ...patch })) if (v !== undefined && v !== "" && v !== "ALL") p.set(k, String(v));
    const str = p.toString();
    return str ? `/admin/customers?${str}` : "/admin/customers";
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">Customers</h1>
        <p className="mt-1 text-sm text-ink-500">
          Guests who shared their details with their feedback. They never need an account.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => {
            const active = (t.key === "ALL" && !status) || t.key === status;
            return (
              <Link
                key={t.key}
                href={href({ status: t.key === "ALL" ? undefined : t.key, page: undefined })}
                className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition ${
                  active ? "bg-forest-900 text-white" : "border border-line bg-white text-ink-500 hover:text-ink-900"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <form action="/admin/customers" className="relative lg:w-80">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            name="q"
            defaultValue={q}
            aria-label="Search customers"
            placeholder="Search name, phone or email"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[15px] outline-none focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10"
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState
            title={q || status ? "No customers match" : "No customers yet"}
            body={q || status ? "Try a different search or filter." : "When guests leave their name, phone or email with a review, they appear here."}
          />
        ) : (
          <CustomersTable rows={list.rows} selected={selected} />
        )}
      </Card>

      {list.pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-ink-500">
            Page {list.page} of {list.pages} · {list.total} customers
          </span>
          <div className="flex gap-2">
            {list.page > 1 ? <Link href={href({ page: list.page - 1 })} className={btn.secondary}>Previous</Link> : null}
            {list.page < list.pages ? <Link href={href({ page: list.page + 1 })} className={btn.secondary}>Next</Link> : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
