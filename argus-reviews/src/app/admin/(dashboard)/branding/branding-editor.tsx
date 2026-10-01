"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { ReviewForm } from "@/components/public/review-form";
import { ReviewPageView } from "@/components/public/review-page-view";
import { SaveBar } from "@/components/admin/save-bar";
import { Card, inputCls, labelCls } from "@/components/admin/ui";
import type { PublicBusiness } from "@/lib/business";
import { saveBranding, type SaveState } from "../settings-actions";

type Draft = {
  name: string;
  headline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  coverImageUrl: string;
  googleReviewUrl: string;
};

const PRESETS = [
  { primary: "#14532d", secondary: "#f97316", label: "Forest & orange" },
  { primary: "#0f3d3e", secondary: "#e0a458", label: "Teal & sand" },
  { primary: "#7c2d12", secondary: "#f59e0b", label: "Spice" },
  { primary: "#1e293b", secondary: "#10b981", label: "Navy & emerald" },
  { primary: "#831843", secondary: "#fb7185", label: "Berry" },
];

function ImageField({
  label,
  kind,
  value,
  onChange,
  hint,
}: {
  label: string;
  kind: "logo" | "cover";
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/admin/assets", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok || !data?.url) setError(data?.error || "Upload failed");
    else onChange(data.url);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-3">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-line bg-paper ${kind === "logo" ? "h-16 w-16 rounded-full" : "h-16 w-28 rounded-xl"}`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-ink-400" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/*" className="sr-only" id={`upload-${kind}`} onChange={(e) => upload(e.target.files?.[0])} />
          <label htmlFor={`upload-${kind}`} className="inline-flex min-h-[36px] cursor-pointer items-center rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-ink-700 hover:border-ink-400">
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </label>
          {value ? (
            <button type="button" onClick={() => onChange("")} className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-sm font-semibold text-ink-500 hover:text-rose-600">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-ink-400">{error ? <span className="text-rose-600">{error}</span> : hint}</p>
    </div>
  );
}

function ColorField({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-1.5 pr-3 focus-within:border-forest-700">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={`${label} picker`} />
        <input id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent font-mono text-sm uppercase outline-none" maxLength={7} />
      </div>
    </div>
  );
}

export function BrandingEditor({ initial, publicBusiness }: { initial: Draft; publicBusiness: PublicBusiness }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveBranding, {});
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const preview = {
    ...publicBusiness,
    name: draft.name || publicBusiness.name,
    headline: draft.headline || publicBusiness.headline,
    description: draft.description || publicBusiness.description,
    primary_color: /^#[0-9a-f]{6}$/i.test(draft.primaryColor) ? draft.primaryColor : publicBusiness.primary_color,
    secondary_color: /^#[0-9a-f]{6}$/i.test(draft.secondaryColor) ? draft.secondaryColor : publicBusiness.secondary_color,
    logo_url: draft.logoUrl || null,
    cover_image_url: draft.coverImageUrl || null,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <form action={action}>
        <Card className="space-y-5 p-5 sm:p-6">
          <input type="hidden" name="logoUrl" value={draft.logoUrl} />
          <input type="hidden" name="coverImageUrl" value={draft.coverImageUrl} />
          <div>
            <label htmlFor="name" className={labelCls}>Business name</label>
            <input id="name" name="name" value={draft.name} onChange={(e) => set("name")(e.target.value)} className={inputCls} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageField label="Logo" kind="logo" value={draft.logoUrl} onChange={set("logoUrl")} hint="Square image, at least 200×200." />
            <ImageField label="Cover image" kind="cover" value={draft.coverImageUrl} onChange={set("coverImageUrl")} hint="Optional. Wide photo of your space or food." />
          </div>
          <div>
            <span className={labelCls}>Colours</span>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  title={p.label}
                  onClick={() => setDraft((d) => ({ ...d, primaryColor: p.primary, secondaryColor: p.secondary }))}
                  className="flex h-9 items-center gap-1 rounded-full border border-line bg-white px-2 hover:border-ink-400"
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: p.primary }} />
                  <span className="h-5 w-5 rounded-full" style={{ background: p.secondary }} />
                  <span className="sr-only">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary colour" name="primaryColor" value={draft.primaryColor} onChange={set("primaryColor")} />
              <ColorField label="Accent colour" name="secondaryColor" value={draft.secondaryColor} onChange={set("secondaryColor")} />
            </div>
          </div>
          <div>
            <label htmlFor="headline" className={labelCls}>Headline</label>
            <input id="headline" name="headline" value={draft.headline} onChange={(e) => set("headline")(e.target.value)} placeholder={publicBusiness.headline} maxLength={140} className={inputCls} />
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>Description</label>
            <textarea id="description" name="description" value={draft.description} onChange={(e) => set("description")(e.target.value)} placeholder={publicBusiness.description} maxLength={300} rows={2} className={inputCls} />
          </div>
          <div>
            <label htmlFor="googleReviewUrl" className={labelCls}>Google Review URL</label>
            <input id="googleReviewUrl" name="googleReviewUrl" type="url" value={draft.googleReviewUrl} onChange={(e) => set("googleReviewUrl")(e.target.value)} placeholder="https://g.page/r/…/review" className={inputCls} />
            <p className="mt-1.5 text-xs text-ink-400">Shown only to guests who rate 4 or 5 stars.</p>
          </div>
          <div className="border-t border-line-soft pt-5">
            <SaveBar state={state} pending={pending} />
          </div>
        </Card>
      </form>

      <div className="xl:sticky xl:top-8 xl:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Live preview</p>
        <div className="mx-auto w-full max-w-[380px] rounded-[40px] border-[10px] border-ink-900 bg-ink-900 shadow-lift">
          <div className="h-[680px] overflow-y-auto rounded-[30px] bg-paper no-scrollbar">
            <ReviewPageView business={preview} embedded>
              <ReviewForm business={preview} preview />
            </ReviewPageView>
          </div>
        </div>
      </div>
    </div>
  );
}
