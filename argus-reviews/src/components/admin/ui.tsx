import type { ReactNode } from "react";

export const REVIEW_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-sky-50 text-sky-700 ring-sky-600/15" },
  REVIEWED: { label: "Reviewed", cls: "bg-slate-100 text-slate-600 ring-slate-500/15" },
  APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  FEATURED: { label: "Featured", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-700 ring-rose-600/15" },
  FOLLOW_UP: { label: "Follow-up", cls: "bg-orange-50 text-orange-700 ring-orange-600/20" },
};

export const CUSTOMER_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-sky-50 text-sky-700 ring-sky-600/15" },
  ACTIVE: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  FOLLOW_UP: { label: "Follow-up", cls: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  COMPLETED: { label: "Completed", cls: "bg-slate-100 text-slate-600 ring-slate-500/15" },
};

export const CREATIVE_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600 ring-slate-500/15" },
  APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  PUBLISHED: { label: "Published", cls: "bg-violet-50 text-violet-700 ring-violet-600/15" },
};

export function Pill({ status, map = REVIEW_STATUS_STYLES }: { status: string; map?: Record<string, { label: string; cls: string }> }) {
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 ring-slate-500/15" };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M12 2.75l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 17.18l-5.66 2.98 1.08-6.3L2.85 9.4l6.32-.92L12 2.75z"
            fill={n <= rating ? "#f59e0b" : "#e2e8f0"}
          />
        </svg>
      ))}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white shadow-soft ${className}`}>{children}</section>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-50 text-forest-700">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-ink-900">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p> : null}
      {children}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-forest-900 px-4 text-sm font-semibold text-white transition hover:bg-forest-800 active:scale-[0.98] disabled:opacity-60",
  secondary:
    "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink-700 transition hover:border-ink-400 hover:text-ink-900 active:scale-[0.98] disabled:opacity-60",
  ghost:
    "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-500 transition hover:bg-line-soft hover:text-ink-900 disabled:opacity-50",
};

export const inputCls =
  "block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10";

export const labelCls = "mb-1.5 block text-sm font-semibold text-ink-900";
