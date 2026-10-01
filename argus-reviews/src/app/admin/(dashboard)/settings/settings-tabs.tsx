"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings", label: "General" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/settings/share", label: "Share Link" },
  { href: "/admin/integrations", label: "Integrations" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">Settings</h1>
      <nav className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" aria-label="Settings sections">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition ${
                active ? "border-forest-900 text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
