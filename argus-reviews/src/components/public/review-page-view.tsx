import type { CSSProperties, ReactNode } from "react";
import type { PublicBusiness } from "@/lib/business";
import { initials, readableOn, safeHex } from "@/lib/color";

type Props = {
  business: Pick<
    PublicBusiness,
    "name" | "logo_url" | "cover_image_url" | "primary_color" | "secondary_color" | "headline" | "description"
  >;
  children: ReactNode;
  /** Used by the admin live preview: renders inside a phone frame instead of the full viewport. */
  embedded?: boolean;
};

/** Pure presentational shell of the public review page (no hooks) — shared with the admin live preview. */
export function ReviewPageView({ business, children, embedded = false }: Props) {
  const brand = safeHex(business.primary_color, "#14532d");
  const accent = safeHex(business.secondary_color, "#f97316");
  const style = {
    "--brand": brand,
    "--brand-ink": readableOn(brand),
    "--accent": accent,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`relative isolate overflow-hidden bg-paper ${embedded ? "min-h-full" : "min-h-dvh"}`}
    >
      {/* Subtle decorative shapes — static, no animation cost */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.10] blur-2xl"
          style={{ background: brand }}
        />
        <div
          className="absolute -left-28 top-[46%] h-64 w-64 rounded-full opacity-[0.08] blur-2xl"
          style={{ background: accent }}
        />
        <svg className="absolute right-6 top-40 h-24 w-24 opacity-[0.07]" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke={brand} strokeWidth="2" strokeDasharray="4 7" />
        </svg>
      </div>

      {business.cover_image_url ? (
        <div className="mx-auto max-w-xl px-0 sm:px-4 sm:pt-4">
          <div className="relative h-40 overflow-hidden sm:h-48 sm:rounded-3xl">
            <img
              src={business.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/25" />
          </div>
        </div>
      ) : null}

      <main
        className={`mx-auto flex w-full max-w-xl flex-col px-4 pb-10 sm:px-6 ${
          business.cover_image_url ? "-mt-11" : "pt-10 sm:pt-14"
        }`}
      >
        <header className="flex flex-col items-center text-center">
          <div className="animate-fade-in">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={`${business.name} logo`}
                width={88}
                height={88}
                className="h-[88px] w-[88px] rounded-full border-4 border-white bg-white object-cover shadow-lift"
                fetchPriority="high"
              />
            ) : (
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-white font-display text-3xl font-semibold shadow-lift"
                style={{ background: brand, color: readableOn(brand) }}
                aria-label={business.name}
              >
                {initials(business.name)}
              </div>
            )}
          </div>
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: brand }}>
            {business.name}
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-[34px]">
            {business.headline}
          </h1>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-ink-500">{business.description}</p>
        </header>

        <div className="mt-7">{children}</div>

        <footer className="mt-8 text-center text-xs text-ink-400">
          Powered by <span className="font-semibold tracking-wide text-ink-500">ARGUS</span>
        </footer>
      </main>
    </div>
  );
}
