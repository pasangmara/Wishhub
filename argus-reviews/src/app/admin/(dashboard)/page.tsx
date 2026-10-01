import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityChart } from "@/components/admin/activity-chart";
import { ShareLinkCard } from "@/components/admin/share-link-card";
import { Card, EmptyState, Pill, Stars } from "@/components/admin/ui";
import { getOverviewStats, getRecentReviews, getReviewActivity } from "@/lib/admin-queries";
import { timeAgo, truncate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { shareProps } from "@/lib/share-props";

export const metadata: Metadata = { title: "Overview" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function OverviewPage() {
  const ctx = await requireAdmin();
  const bid = ctx.business.id;
  const [stats, recent, activity] = await Promise.all([
    getOverviewStats(bid),
    getRecentReviews(bid, 6),
    getReviewActivity(bid, 30),
  ]);

  const tiles = [
    { label: "Total Reviews", value: stats.total.toLocaleString(), sub: `${stats.last7} this week`, href: "/admin/reviews" },
    { label: "Average Rating", value: stats.total ? stats.average.toFixed(1) : "–", sub: "out of 5", stars: true },
    { label: "5-Star Reviews", value: stats.fiveStar.toLocaleString(), sub: stats.total ? `${Math.round((stats.fiveStar / stats.total) * 100)}% of all` : "—", href: "/admin/reviews?rating=5" },
    { label: "Pending Follow-ups", value: stats.followUp.toLocaleString(), sub: "Lower ratings to contact", href: "/admin/reviews?status=FOLLOW_UP", warn: stats.followUp > 0 },
    { label: "Featured", value: stats.featured.toLocaleString(), sub: "Ready to showcase", href: "/admin/reviews?status=FEATURED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-ink-500">{greeting()}{ctx.user.name ? `, ${ctx.user.name.split(" ")[0]}` : ""}</p>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[32px]">{ctx.business.name}</h1>
      </div>

      <ShareLinkCard {...shareProps(ctx.business)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*]:min-w-0">
        {tiles.map((t, i) => {
          const inner = (
            <div
              className={`h-full animate-fade-up rounded-2xl border bg-white p-4 shadow-soft transition sm:p-5 ${
                t.warn ? "border-orange-200" : "border-line"
              } ${t.href ? "hover:-translate-y-0.5 hover:shadow-lift" : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t.label}</p>
              <p className={`mt-2 text-[28px] font-bold leading-none tracking-tight ${t.warn ? "text-orange-600" : "text-ink-900"}`}>{t.value}</p>
              <div className="mt-2 text-xs text-ink-400">{t.stars ? <Stars rating={Math.round(stats.average)} /> : t.sub}</div>
            </div>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className={i === 4 ? "col-span-2 lg:col-span-1" : ""}>
              {inner}
            </Link>
          ) : (
            <div key={t.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <h2 className="text-[15px] font-semibold text-ink-900">Recent Reviews</h2>
            <Link href="/admin/reviews" className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No reviews yet" body="Share your review link with guests — new feedback will appear here." />
          ) : (
            <ul className="divide-y divide-line-soft">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reviews?review=${r.id}`} className="flex gap-3 px-5 py-3.5 transition hover:bg-paper">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-semibold text-ink-900">{r.name || "Anonymous guest"}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="mt-1 truncate text-sm text-ink-500">{truncate(r.feedback, 110)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Pill status={r.status} />
                      <span className="text-xs text-ink-400">{timeAgo(r.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0 p-5 lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Review Activity</h2>
          <ActivityChart data={activity} />
        </Card>
      </div>
    </div>
  );
}
