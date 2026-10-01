"use client";

import { useActionState } from "react";
import { SaveBar } from "@/components/admin/save-bar";
import { inputCls, labelCls } from "@/components/admin/ui";
import { BUSINESS_TYPES, BUSINESS_TYPE_KEYS, getTypeConfig } from "@/lib/business-types";
import { saveBusinessInfo, saveReviewSettings, type SaveState } from "../settings-actions";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function BusinessInfoForm({
  initial,
  slug,
}: {
  initial: { name: string; type: string; phone: string; email: string; websiteUrl: string; address: string; openingHours: string };
  slug: string;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveBusinessInfo, {});
  return (
    <Section title="Business information" description="Used on your review page and in share messages.">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bi-name" className={labelCls}>Business name</label>
            <input id="bi-name" name="name" defaultValue={initial.name} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="bi-type" className={labelCls}>Business type</label>
            <select id="bi-type" name="type" defaultValue={initial.type} className={inputCls}>
              {BUSINESS_TYPE_KEYS.map((k) => (
                <option key={k} value={k}>{BUSINESS_TYPES[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bi-phone" className={labelCls}>Phone</label>
            <input id="bi-phone" name="phone" type="tel" defaultValue={initial.phone} className={inputCls} />
          </div>
          <div>
            <label htmlFor="bi-email" className={labelCls}>Email</label>
            <input id="bi-email" name="email" type="email" defaultValue={initial.email} className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="bi-web" className={labelCls}>Website</label>
          <input id="bi-web" name="websiteUrl" type="url" placeholder="https://" defaultValue={initial.websiteUrl} className={inputCls} />
        </div>
        <div>
          <label htmlFor="bi-address" className={labelCls}>Address</label>
          <input id="bi-address" name="address" defaultValue={initial.address} className={inputCls} />
        </div>
        <div>
          <label htmlFor="bi-hours" className={labelCls}>Opening hours</label>
          <input id="bi-hours" name="openingHours" placeholder="e.g. Every day · 12 PM – 11 PM" defaultValue={initial.openingHours} className={inputCls} />
        </div>
        <div>
          <span className={labelCls}>Review link</span>
          <p className="rounded-xl bg-paper px-3.5 py-2.5 font-mono text-sm text-ink-500">/r/{slug}</p>
          <p className="mt-1.5 text-xs text-ink-400">Your link never changes, so printed QR codes keep working.</p>
        </div>
        <div className="border-t border-line-soft pt-4">
          <SaveBar state={state} pending={pending} />
        </div>
      </form>
    </Section>
  );
}

export function ReviewSettingsForm({ showDetailQuestions, googleReviewUrl, type }: { showDetailQuestions: boolean; googleReviewUrl: string; type: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveReviewSettings, {});
  const cfg = getTypeConfig(type);
  return (
    <Section title="Review settings" description="Keep the form short — guests finish in under a minute.">
      <form action={action} className="space-y-5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition hover:border-ink-400">
          <input type="checkbox" name="showDetailQuestions" defaultChecked={showDetailQuestions} className="mt-0.5 h-5 w-5 accent-forest-900" />
          <span>
            <span className="block text-sm font-semibold text-ink-900">Ask two quick follow-up questions</span>
            <span className="mt-0.5 block text-sm text-ink-500">{cfg.detailQuestions.map((q) => q.label).join(" · ")}</span>
          </span>
        </label>
        <div>
          <label htmlFor="rs-google" className={labelCls}>Google Review URL</label>
          <input id="rs-google" name="googleReviewUrl" type="url" defaultValue={googleReviewUrl} placeholder="https://g.page/r/…/review" className={inputCls} />
          <p className="mt-1.5 text-xs text-ink-400">
            After a 4–5 star review, guests are invited (never forced) to also post on Google. Lower ratings stay private so you can follow up.
          </p>
        </div>
        <div className="border-t border-line-soft pt-4">
          <SaveBar state={state} pending={pending} />
        </div>
      </form>
    </Section>
  );
}
