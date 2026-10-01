import type { Metadata } from "next";
import { ShareLinkCard } from "@/components/admin/share-link-card";
import { requireAdmin } from "@/lib/session";
import { embedScriptSnippet, reviewUrl, websiteButtonSnippet } from "@/lib/share";
import { shareProps } from "@/lib/share-props";
import { SettingsTabs } from "../settings-tabs";
import { CodeSnippet } from "./code-snippet";

export const metadata: Metadata = { title: "Share Link" };

export default async function SharePage() {
  const ctx = await requireAdmin();
  const b = ctx.business;
  const websiteUrl = reviewUrl(b.slug, "website");
  return (
    <div>
      <SettingsTabs />
      <div className="space-y-6">
        <ShareLinkCard {...shareProps(b)} />
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-[15px] font-semibold text-ink-900">Website button</h2>
            <p className="mt-1 text-sm text-ink-500">Paste this anywhere on your website. It opens your review page.</p>
            <div className="my-5 flex justify-center rounded-xl bg-paper py-6">
              <span dangerouslySetInnerHTML={{ __html: websiteButtonSnippet(websiteUrl, b.primaryColor) }} />
            </div>
            <CodeSnippet code={websiteButtonSnippet(websiteUrl, b.primaryColor)} />
          </section>
          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-[15px] font-semibold text-ink-900">Floating review button</h2>
            <p className="mt-1 text-sm text-ink-500">
              One line of code adds a small “Share your experience” button to the corner of every page.
            </p>
            <div className="mt-5">
              <CodeSnippet code={embedScriptSnippet(b.slug)} />
            </div>
            <p className="mt-3 text-xs text-ink-400">Works with WordPress, Wix, Squarespace, Shopify and custom sites.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
