import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { BusinessInfoForm, ReviewSettingsForm } from "./settings-forms";
import { SettingsTabs } from "./settings-tabs";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireAdmin();
  const b = ctx.business;
  return (
    <div>
      <SettingsTabs />
      <div className="grid gap-6 xl:grid-cols-2">
        <BusinessInfoForm
          initial={{
            name: b.name,
            type: b.type,
            phone: b.phone ?? "",
            email: b.email ?? "",
            websiteUrl: b.websiteUrl ?? "",
            address: b.address ?? "",
            openingHours: b.openingHours ?? "",
          }}
          slug={b.slug}
        />
        <div className="space-y-6">
          <ReviewSettingsForm
            showDetailQuestions={b.settings?.showDetailQuestions !== false}
            googleReviewUrl={b.googleReviewUrl ?? ""}
            type={b.type}
          />
          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink-900">Plan</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${b.plan === "premium" ? "bg-amber-50 text-amber-700" : "bg-line-soft text-ink-500"}`}>
                {b.plan}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              {b.plan === "premium"
                ? "Guests can add a photo with their review."
                : "Upgrade to Premium to let guests add a photo with their review."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
