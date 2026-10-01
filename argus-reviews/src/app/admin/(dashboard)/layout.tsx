import { and, count, eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { ArgusLogo, ArgusMark } from "@/components/argus-logo";
import { BottomNav, SideNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/session";
import { initials } from "@/lib/color";
import { logoutAction, switchBusinessAction } from "../auth-actions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · ARGUS" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const ctx = await requireAdmin();
  const [{ n: followUps }] = await db
    .select({ n: count() })
    .from(reviews)
    .where(and(eq(reviews.businessId, ctx.business.id), eq(reviews.status, "FOLLOW_UP")));

  const businessSwitcher =
    ctx.memberships.length > 1 ? (
      <form action={switchBusinessAction} className="flex items-center gap-2">
        <select
          name="businessId"
          defaultValue={ctx.business.id}
          aria-label="Switch business"
          className="min-w-0 flex-1 truncate rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink-700"
        >
          {ctx.memberships.map((m) => (
            <option key={m.businessId} value={m.businessId}>
              {m.name}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink-700 hover:border-ink-400">
          Go
        </button>
      </form>
    ) : null;

  return (
    <div className="min-h-dvh bg-paper">
      {/* Sidebar: full on desktop, icon rail on tablet */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-line bg-paper px-3 py-5 md:flex lg:w-[248px] lg:px-4">
        <Link href="/admin" className="mb-8 flex items-center px-1.5">
          <span className="lg:hidden">
            <ArgusMark />
          </span>
          <span className="hidden lg:inline-flex">
            <ArgusLogo />
          </span>
        </Link>
        <SideNav followUps={followUps} />
        <div className="mt-auto space-y-3">
          <div className="hidden rounded-2xl border border-line bg-white p-3 lg:block">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: ctx.business.primaryColor }}>
                {initials(ctx.business.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{ctx.business.name}</p>
                <p className="truncate text-xs text-ink-400">{ctx.user.email}</p>
              </div>
            </div>
            {businessSwitcher ? <div className="mt-3">{businessSwitcher}</div> : null}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-500 transition hover:bg-white hover:text-ink-900 md:justify-center lg:justify-start"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span className="md:sr-only lg:not-sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <ArgusMark className="h-7 w-7" />
          <span className="max-w-[180px] truncate text-sm font-semibold text-ink-900">{ctx.business.name}</span>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-500" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </header>

      <div className="md:pl-[76px] lg:pl-[248px]">
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8 lg:px-10">
          {businessSwitcher ? <div className="mb-4 md:hidden">{businessSwitcher}</div> : null}
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
