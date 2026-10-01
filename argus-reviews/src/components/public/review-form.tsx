"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { PublicBusiness } from "@/lib/business";
import { RATING_LABELS } from "@/lib/business-types";
import { parseContact } from "@/lib/contact";

type Props = {
  business: Pick<PublicBusiness, "slug" | "name" | "features" | "form">;
  /** Admin live preview: fully interactive but never submits. */
  preview?: boolean;
};

type Result = { rating: number; show_google_review: boolean; google_review_url: string | null };

type PhotoState =
  | { status: "idle" }
  | { status: "uploading"; previewUrl: string }
  | { status: "ready"; previewUrl: string; token: string }
  | { status: "error"; previewUrl?: string; message: string };

const FEEDBACK_MAX = 2000;

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function readSource() {
  if (typeof window === "undefined") return "direct";
  return new URLSearchParams(window.location.search).get("s") ?? "direct";
}

/** Downscale on-device before upload: much faster on mobile data. */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.75l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 17.18l-5.66 2.98 1.08-6.3L2.85 9.4l6.32-.92L12 2.75z"
        fill={filled ? "var(--accent)" : "transparent"}
        stroke={filled ? "var(--accent)" : "#cbd5e1"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRow({
  value,
  onChange,
  size,
  label,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  size: "lg" | "sm";
  label: string;
  name: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const big = size === "lg";
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex items-center ${big ? "justify-center gap-1 @xl:gap-2" : "gap-0.5"}`}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}${big ? ` – ${RATING_LABELS[n]}` : ""}`}
          name={name}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`group flex items-center justify-center rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 active:scale-90 ${
            big ? "h-14 w-14 @xl:h-16 @xl:w-16" : "h-10 w-10"
          }`}
        >
          <StarIcon
            filled={n <= shown}
            className={`${big ? "h-11 w-11 @xl:h-12 @xl:w-12" : "h-7 w-7"} transition-transform duration-150 ${
              n <= value ? "animate-pop" : ""
            } ${n <= shown ? "scale-100" : "scale-95"}`}
          />
        </button>
      ))}
    </div>
  );
}

const inputCls =
  "block w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[16px] text-ink-900 shadow-[0_1px_0_rgb(15_23_42/0.02)] outline-none transition placeholder:text-ink-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--brand)_14%,transparent)]";

export function ReviewForm({ business, preview = false }: Props) {
  const ids = useId();
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [service, setService] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<PhotoState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; feedback?: string; contact?: string; form?: string }>({});
  const [result, setResult] = useState<Result | null>(null);

  const submissionId = useRef<string>("");
  const uploadPromise = useRef<Promise<string | null> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    submissionId.current = newSubmissionId();
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const previewUrl = "previewUrl" in photo ? photo.previewUrl : undefined;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPickRating(n: number) {
    setRating(n);
    setErrors((e) => ({ ...e, rating: undefined }));
  }

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhoto({ status: "error", message: "Please choose a photo (JPG, PNG or WebP)." });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPhoto({ status: "error", message: "That photo is too large. Please choose one under 15 MB." });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPhoto({ status: "uploading", previewUrl });
    if (preview) {
      setPhoto({ status: "ready", previewUrl, token: "preview" });
      return;
    }
    // Upload in the background while the guest keeps typing.
    const p = (async () => {
      try {
        const blob = await compressImage(file);
        const fd = new FormData();
        fd.append("business_slug", business.slug);
        fd.append("file", blob, "photo.jpg");
        const res = await fetch("/api/public/uploads", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.photo_token) throw new Error(data.error || "Upload failed");
        setPhoto((cur) => (cur.status === "uploading" && cur.previewUrl === previewUrl ? { status: "ready", previewUrl, token: data.photo_token } : cur));
        return data.photo_token as string;
      } catch (err) {
        setPhoto((cur) =>
          "previewUrl" in cur && cur.previewUrl === previewUrl
            ? { status: "error", previewUrl, message: err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Upload failed. You can try again or submit without a photo." }
            : cur,
        );
        return null;
      }
    })();
    uploadPromise.current = p;
  }

  function removePhoto() {
    uploadPromise.current = null;
    setPhoto({ status: "idle" });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const nextErrors: typeof errors = {};
    if (!rating) nextErrors.rating = "Please choose a star rating.";
    if (feedback.trim().length < 2) nextErrors.feedback = "Please tell us a little about your experience.";
    const parsed = parseContact(contact);
    if (contact.trim() && !parsed.email && !parsed.phone) nextErrors.contact = "Please enter a valid phone number or email.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.feedback && !nextErrors.rating) feedbackRef.current?.focus();
      return;
    }

    setSubmitting(true);
    if (preview) {
      await new Promise((r) => setTimeout(r, 500));
      setResult({ rating, show_google_review: rating >= 4, google_review_url: "#" });
      setSubmitting(false);
      return;
    }

    try {
      let photoToken: string | null = null;
      if (photo.status === "ready") photoToken = photo.token;
      else if (photo.status === "uploading" && uploadPromise.current) photoToken = await uploadPromise.current;

      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          business_slug: business.slug,
          rating,
          feedback: feedback.trim(),
          name: name.trim() || null,
          phone: parsed.phone,
          email: parsed.email,
          service_type: service,
          answers: Object.keys(answers).length ? answers : null,
          photo_token: photoToken,
          consent_to_publish: consent,
          source: readSource(),
          submission_id: submissionId.current,
          website: (document.getElementById(`${ids}-hp`) as HTMLInputElement | null)?.value || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErrors({ form: data.error || "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "We couldn't reach the server. Please check your connection and try again." });
      setSubmitting(false);
    }
  }

  if (result) {
    const positive = result.rating >= 4;
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="animate-fade-up rounded-[28px] border border-line bg-white px-6 py-10 text-center shadow-lift outline-none @xl:px-10"
        role="status"
        aria-live="polite"
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full animate-pop"
          style={{ background: "color-mix(in srgb, var(--brand) 12%, white)" }}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              className="check-draw"
              stroke="var(--brand)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {positive ? (
          <>
            <h2 className="mt-5 font-display text-[28px] font-semibold text-ink-900">Thank you!</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
              We&apos;re glad you had a great experience.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-5 font-display text-[26px] font-semibold text-ink-900">Thank you for your feedback.</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-500">Your feedback helps us improve.</p>
          </>
        )}

        {result.show_google_review && result.google_review_url ? (
          <div className="mt-8 rounded-3xl bg-paper px-5 py-6">
            <p className="text-[15px] font-medium text-ink-700">Would you like to share your experience on Google?</p>
            <a
              href={result.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-soft transition hover:shadow-lift active:scale-[0.98]"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Review us on Google
              <span aria-hidden>→</span>
            </a>
          </div>
        ) : null}

        <p className="mt-8 text-sm text-ink-400">You can close this page now.</p>
      </div>
    );
  }

  const ratingLabel = rating ? RATING_LABELS[rating] : "Tap a star to rate";
  const detailQuestions = business.form.detail_questions.slice(0, 2);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="animate-fade-up rounded-[28px] border border-line bg-white p-5 shadow-lift @xl:p-8"
      aria-busy={submitting}
    >
      {/* Rating */}
      <fieldset>
        <legend className="sr-only">Your rating</legend>
        <StarRow value={rating} onChange={onPickRating} size="lg" label="Your rating" name="rating" />
        <p
          className={`mt-2 h-6 text-center text-[15px] font-semibold transition-colors ${rating ? "" : "text-ink-400"}`}
          style={rating ? { color: "var(--brand)" } : undefined}
          aria-live="polite"
        >
          {ratingLabel}
        </p>
        {errors.rating ? <p className="mt-1 text-center text-sm font-medium text-red-600">{errors.rating}</p> : null}
      </fieldset>

      {rating > 0 && detailQuestions.length > 0 ? (
        <div className="mt-4 animate-fade-up space-y-1 rounded-2xl bg-paper px-4 py-3">
          {detailQuestions.map((q) => (
            <div key={q.key} className="flex flex-wrap items-center justify-between gap-x-3">
              <span className="text-sm font-medium text-ink-700">{q.label}</span>
              <StarRow
                value={answers[q.key] ?? 0}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
                size="sm"
                label={q.label}
                name={`q-${q.key}`}
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Feedback */}
      <div className="mt-6">
        <label htmlFor={`${ids}-feedback`} className="mb-2 block text-[15px] font-semibold text-ink-900">
          {business.form.feedback_prompt}
        </label>
        <textarea
          ref={feedbackRef}
          id={`${ids}-feedback`}
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value.slice(0, FEEDBACK_MAX));
            if (errors.feedback) setErrors((x) => ({ ...x, feedback: undefined }));
          }}
          rows={4}
          maxLength={FEEDBACK_MAX}
          placeholder={business.form.feedback_placeholder}
          aria-invalid={Boolean(errors.feedback)}
          aria-describedby={errors.feedback ? `${ids}-feedback-err` : undefined}
          className={`${inputCls} min-h-[124px] resize-y leading-relaxed`}
        />
        {errors.feedback ? (
          <p id={`${ids}-feedback-err`} className="mt-1.5 text-sm font-medium text-red-600">
            {errors.feedback}
          </p>
        ) : null}
      </div>

      {/* Service (optional, one tap) */}
      {business.form.service_options.length ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink-500">
            {business.form.service_label} <span className="text-ink-400">(optional)</span>
          </p>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 @xl:mx-0 @xl:flex-wrap @xl:overflow-visible @xl:px-0">
            {business.form.service_options.map((opt) => {
              const active = service === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setService(active ? null : opt)}
                  className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition active:scale-95 ${
                    active ? "border-transparent" : "border-line bg-white text-ink-700 hover:border-ink-400"
                  }`}
                  style={active ? { background: "var(--brand)", color: "var(--brand-ink)" } : undefined}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Optional contact */}
      <div className="mt-6 grid gap-4 @xl:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className="mb-2 block text-sm font-semibold text-ink-900">
            Your name <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
            placeholder="e.g. Rahim"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-contact`} className="mb-2 block text-sm font-semibold text-ink-900">
            Phone or email <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id={`${ids}-contact`}
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              if (errors.contact) setErrors((x) => ({ ...x, contact: undefined }));
            }}
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            placeholder="So we can thank you"
            aria-invalid={Boolean(errors.contact)}
            className={inputCls}
          />
          {errors.contact ? <p className="mt-1.5 text-sm font-medium text-red-600">{errors.contact}</p> : null}
        </div>
      </div>

      {/* Photo (premium) */}
      {business.features.photo_upload ? (
        <div className="mt-5">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            id={`${ids}-photo`}
            onChange={(e) => onPhotoSelected(e.target.files?.[0])}
          />
          {photo.status === "idle" || (photo.status === "error" && !photo.previewUrl) ? (
            <label
              htmlFor={`${ids}-photo`}
              className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/60 px-4 text-[15px] font-semibold text-ink-700 transition hover:border-ink-400 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Add a photo <span className="font-normal text-ink-400">(optional)</span>
            </label>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper/60 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line-soft">
                {"previewUrl" in photo && photo.previewUrl ? (
                  <img src={photo.previewUrl} alt="Your photo" className="h-full w-full object-cover" />
                ) : null}
                {photo.status === "uploading" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-400 border-t-transparent" />
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                {photo.status === "uploading" ? <p className="font-medium text-ink-700">Uploading…</p> : null}
                {photo.status === "ready" ? <p className="font-medium text-ink-700">Photo added</p> : null}
                {photo.status === "error" ? <p className="font-medium text-red-600">{photo.message}</p> : null}
                <div className="mt-1 flex gap-4">
                  <label htmlFor={`${ids}-photo`} className="cursor-pointer font-semibold" style={{ color: "var(--brand)" }}>
                    Change
                  </label>
                  <button type="button" onClick={removePhoto} className="font-semibold text-ink-500">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          {photo.status === "error" && !photo.previewUrl ? (
            <p className="mt-1.5 text-sm font-medium text-red-600">{photo.message}</p>
          ) : null}
        </div>
      ) : null}

      {/* Consent */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl p-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md accent-[var(--brand)]"
        />
        <span className="text-sm leading-relaxed text-ink-500">
          I agree that my feedback may be used by this business on its website and social media.
        </span>
      </label>

      {/* Honeypot (hidden from humans) */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${ids}-hp`}>Website</label>
        <input id={`${ids}-hp`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form ? (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold shadow-soft transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            Submitting…
          </>
        ) : (
          <>
            Submit Feedback <span aria-hidden>→</span>
          </>
        )}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-400">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" />
        </svg>
        Secure • Takes less than a minute
      </p>
    </form>
  );
}
