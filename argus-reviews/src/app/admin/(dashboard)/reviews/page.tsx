import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, btn } from "@/components/admin/ui";
import { countByStatus } from "@/lib/admin-queries";
import { getTypeConfig } from "@/lib/business-types";
import { getReview, listReviews } from "@/lib/review-queries";
import { requireAdmin } from "@/lib/session";
import { REVIEW_STATUSES } from "@/lib/validation";
import type { ReviewStatus } from "@/db/schema";
import { ReviewsList } from "./reviews-list";

export const metadata: Metadata = { title: "Reviews" };

const TABS: { key: ReviewStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "FOLLOW_UP", label: "Follow-up" },
  { key: "APPROVED", label: "Approved" },
  { key: "FEATURED", label: "Featured" },
  { key: "REVIEWED", label: "Reviewed" },
  { key: "REJECTED", label: "Rejected" },
];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const statusParam = one(sp.status)?.toUpperCase();
  const status = (REVIEW_STATUSES as readonly string[]).includes(statusParam ?? "") ? (statusParam as ReviewStatus) : undefined;
  const ratingNum = Number(one(sp.rating));
  const rating = ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined;
  const q = one(sp.q)?.trim().slice(0, 100) || undefined;
  const page = Number(one(sp.page)) || 1;
  const selectedId = one(sp.review);

  const [list, counts, selected] = await Promise.all([
    listReviews(ctx.business.id, { status, rating, q, page }),
    countByStatus(ctx.business.id),
    selectedId ? getReview(ctx.business.id, selectedId) : Promise.resolve(null),
  ]);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const questions = Object.fromEntries(getTypeConfig(ctx.business.type).detailQuestions.map((q) => [q.key, q.label]));

  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, rating, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && v !== "ALL") p.set(k, String(v));
    const s = p.toString();
    return s ? `/admin/reviews?${s}` : "/admin/reviews";
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">Reviews</h1>
          <p className="mt-1 text-sm text-ink-500">Approve, feature, or follow up on guest feedback.</p>
        </div>
        <a href="/api/admin/export" className={btn.secondary}>
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const active = (t.key === "ALL" && !status) || t.key === status;
          const n = t.key === "ALL" ? all : counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={qs({ status: t.key === "ALL" ? undefined : t.key, page: undefined })}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
                active ? "bg-forest-900 text-white" : "border border-line bg-white text-ink-500 hover:text-ink-900"
              }`}
            >
              {t.label}
              <span className={`text-xs ${active ? "text-white/70" : "text-ink-400"}`}>{n}</span>
            </Link>
          );
        })}
      </div>

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" action="/admin/reviews">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">Search reviews</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search feedback, name, phone or email"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[15px] outline-none focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10"
          />
        </label>
        <div className="flex gap-2">
          <select
            name="rating"
            defaultValue={rating ?? ""}
            aria-label="Filter by rating"
            className="h-11 flex-1 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink-700 sm:flex-none"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <button className={btn.primary}>Filter</button>
        </div>
      </form>

      <Card className="overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState
            title={q || status || rating ? "No reviews match these filters" : "No reviews yet"}
            body={q || status || rating ? "Try clearing the filters." : "Share your review link with guests — new feedback will appear here."}
          >
            {q || status || rating ? (
              <Link href="/admin/reviews" className={`${btn.secondary} mt-4`}>
                Clear filters
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <ReviewsList rows={list.rows} selected={selected} questions={questions} />
        )}
      </Card>

      {list.pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-ink-500">
            Page {list.page} of {list.pages} · {list.total} reviews
          </span>
          <div className="flex gap-2">
            {list.page > 1 ? (
              <Link href={qs({ page: list.page - 1 })} className={btn.secondary}>
                Previous
              </Link>
            ) : null}
            {list.page < list.pages ? (
              <Link href={qs({ page: list.page + 1 })} className={btn.secondary}>
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
