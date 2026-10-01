"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Drawer } from "@/components/admin/overlay";
import { CUSTOMER_STATUS_STYLES, Pill, Stars } from "@/components/admin/ui";
import type { CustomerStatus } from "@/db/schema";
import { whatsappNumber } from "@/lib/contact";
import type { CustomerDetail, CustomerRow } from "@/lib/customer-queries";
import { formatDate, timeAgo } from "@/lib/format";
import { setCustomerStatus } from "../review-actions";
import { loadCustomer } from "./actions";

export function CustomersTable({ rows: initial, selected }: { rows: CustomerRow[]; selected: CustomerDetail | null }) {
  const [rows, setRows] = useState(initial);
  const [detail, setDetail] = useState<CustomerDetail | null>(selected);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setRows(initial);
  }

  async function open(id: string) {
    setLoadingId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("customer", id);
    window.history.replaceState(null, "", url);
    const d = await loadCustomer(id);
    setLoadingId(null);
    setDetail(d);
  }

  const close = useCallback(() => {
    setDetail(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("customer");
    window.history.replaceState(null, "", url);
  }, []);

  function changeStatus(status: CustomerStatus) {
    if (!detail) return;
    const prev = detail.status;
    setDetail({ ...detail, status });
    setRows((rs) => rs.map((r) => (r.id === detail.id ? { ...r, status } : r)));
    startTransition(async () => {
      const res = await setCustomerStatus(detail.id, status);
      if (!res.ok) {
        setDetail((d) => (d ? { ...d, status: prev } : d));
        setRows((rs) => rs.map((r) => (r.id === detail.id ? { ...r, status: prev } : r)));
      }
    });
  }

  const wa = whatsappNumber(detail?.phone);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-left text-sm">
          <thead className="hidden border-b border-line-soft bg-paper/60 text-xs font-semibold uppercase tracking-wide text-ink-400 md:table-header-group">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Customer</th>
              <th className="px-3 py-2.5 font-semibold">Contact</th>
              <th className="px-3 py-2.5 text-center font-semibold">Reviews</th>
              <th className="px-3 py-2.5 font-semibold">Avg</th>
              <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Last feedback</th>
              <th className="px-3 py-2.5 font-semibold">Last visit</th>
              <th className="px-5 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => open(c.id)}
                className={`cursor-pointer transition hover:bg-paper ${loadingId === c.id ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3.5 sm:px-5">
                  <button type="button" className="text-left font-semibold text-ink-900 outline-none focus-visible:underline" onClick={(e) => { e.stopPropagation(); open(c.id); }}>
                    {c.name || "Unnamed guest"}
                  </button>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-400">#{c.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 truncate text-xs text-ink-500 md:hidden">
                    {c.phone || c.email || "No contact"} · {c.totalReviews} review{c.totalReviews === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="hidden max-w-[200px] px-3 py-3.5 text-ink-500 md:table-cell">
                  <p className="truncate">{c.phone ?? ""}</p>
                  <p className="truncate">{c.email ?? ""}</p>
                  {!c.phone && !c.email ? <span className="text-ink-400">—</span> : null}
                </td>
                <td className="hidden px-3 py-3.5 text-center font-semibold text-ink-900 md:table-cell">{c.totalReviews}</td>
                <td className="hidden px-3 py-3.5 md:table-cell">
                  {c.averageRating ? (
                    <span className="font-semibold text-ink-900">
                      {c.averageRating.toFixed(1)} <span className="text-amber-500">★</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="hidden max-w-[260px] truncate px-3 py-3.5 text-ink-500 xl:table-cell">{c.lastFeedback ?? "—"}</td>
                <td className="hidden whitespace-nowrap px-3 py-3.5 text-ink-500 md:table-cell">{c.lastVisit ? timeAgo(c.lastVisit) : "—"}</td>
                <td className="px-4 py-3.5 text-right sm:px-5 md:text-left">
                  <Pill status={c.status} map={CUSTOMER_STATUS_STYLES} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={Boolean(detail)} onClose={close} title="Customer">
        {detail ? (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs text-ink-400">#{detail.id.slice(0, 8).toUpperCase()}</p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-ink-900">{detail.name || "Unnamed guest"}</h3>
              <div className="mt-2 space-y-1 text-sm text-ink-500">
                {detail.phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{detail.phone}</p> : null}
                {detail.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{detail.email}</p> : null}
                <p className="text-xs text-ink-400">First seen {formatDate(detail.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {wa ? (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white hover:brightness-105">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : (
                <span className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-ink-400">No phone</span>
              )}
              {detail.email ? (
                <a href={`mailto:${detail.email}`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-forest-900 text-sm font-semibold text-white hover:bg-forest-800">
                  <Mail className="h-4 w-4" /> Email
                </a>
              ) : (
                <span className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-ink-400">No email</span>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Status</p>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-line-soft p-1">
                {(Object.keys(CUSTOMER_STATUS_STYLES) as CustomerStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    onClick={() => changeStatus(s)}
                    aria-pressed={detail.status === s}
                    className={`min-h-[36px] rounded-lg text-xs font-semibold transition ${
                      detail.status === s ? "bg-white text-ink-900 shadow-soft" : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {CUSTOMER_STATUS_STYLES[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Review history ({detail.reviews.length})
              </p>
              <ul className="space-y-2">
                {detail.reviews.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/reviews?review=${r.id}`} className="block rounded-2xl border border-line p-3.5 transition hover:border-ink-400">
                      <div className="flex items-center justify-between">
                        <Stars rating={r.rating} />
                        <span className="text-xs text-ink-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-sm text-ink-700">{r.feedback}</p>
                      {r.serviceType ? <p className="mt-1 text-xs text-ink-400">{r.serviceType}</p> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
