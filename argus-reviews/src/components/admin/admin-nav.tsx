"use client";

import { LayoutDashboard, MessageSquareText, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: (p: string) => p === "/admin" },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText, match: (p: string) => p.startsWith("/admin/reviews") },
  { href: "/admin/customers", label: "Customers", icon: Users, match: (p: string) => p.startsWith("/admin/customers") },
  { href: "/admin/creatives", label: "Creatives", icon: Sparkles, match: (p: string) => p.startsWith("/admin/creatives") },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    match: (p: string) => ["/admin/settings", "/admin/branding", "/admin/integrations"].some((x) => p.startsWith(x)),
  },
];

export function SideNav({ followUps }: { followUps: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition md:justify-center lg:justify-start ${
              active ? "bg-forest-900 text-white shadow-soft" : "text-ink-500 hover:bg-white hover:text-ink-900"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            <span className="md:sr-only lg:not-sr-only">{label}</span>
            {label === "Reviews" && followUps > 0 ? (
              <span
                className={`ml-auto rounded-full px-1.5 text-[11px] font-bold leading-5 md:absolute md:right-1 md:top-1 lg:static ${
                  active ? "bg-white/20 text-white" : "bg-ember-500 text-white"
                }`}
                title={`${followUps} need follow-up`}
              >
                {followUps}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                active ? "text-forest-900" : "text-ink-400"
              }`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-mint-100" : ""}`}>
                <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
