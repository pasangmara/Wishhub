"use client";

import { Ban, Camera, Check, Mail, MessageCircle, Phone, ShieldCheck, ShieldOff, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Drawer } from "@/components/admin/overlay";
import { Pill, REVIEW_STATUS_STYLES, Stars } from "@/components/admin/ui";
import type { ReviewStatus } from "@/db/schema";
import { RATING_LABELS } from "@/lib/business-types";
import { whatsappNumber } from "@/lib/contact";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import type { ReviewRow } from "@/lib/review-queries";
import { markReviewSeen, setReviewStatus } from "../review-actions";

const ACTIONS: { status: ReviewStatus; label: string; icon: typeof Check; cls: string }[] = [
  { status: "APPROVED", label: "Approve", icon: Check, cls: "hover:bg-emerald-50 hover:text-emerald-700" },
  { status: "FEATURED", label: "Feature", icon: Star, cls: "hover:bg-amber-50 hover:text-amber-700" },
  { status: "FOLLOW_UP", label: "Follow-up", icon: MessageCircle, cls: "hover:bg-orange-50 hover:text-orange-700" },
  { status: "REJECTED", label: "Reject", icon: Ban, cls: "hover:bg-rose-50 hover:text-rose-700" },
];

const SOURCE_LABEL: Record<string, string> = { qr: "QR code", whatsapp: "WhatsApp", email: "Email", website: "Website", direct: "Direct link" };

export function ReviewsList({
  rows: initialRows,
  selected: initialSelected,
  questions,
}: {
  rows: ReviewRow[];
  selected: ReviewRow | null;
  questions: Record<string, string>;
}) {
  // Opening a review deep link counts as reading it.
  const seen = (r: ReviewRow): ReviewRow => (r.id === initialSelected?.id && r.status === "NEW" ? { ...r, status: "REVIEWED" } : r);
  const [rows, setRows] = useState(() => initialRows.map(seen));
  const [prevInitial, setPrevInitial] = useState(initialRows);
  if (prevInitial !== initialRows) {
    setPrevInitial(initialRows);
    setRows(initialRows);
  }
  const [openId, setOpenId] = useState<string | null>(initialSelected?.id ?? null);
  const [extra, setExtra] = useState<ReviewRow | null>(initialSelected ? seen(initialSelected) : null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const [pending, startTransition] = useTransition();

  const open = rows.find((r) => r.id === openId) ?? (extra?.id === openId ? extra : null);

  const patch = useCallback((id: string, status: ReviewStatus) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setExtra((x) => (x && x.id === id ? { ...x, status } : x));
  }, []);

  function showToast(msg: string, tone: "ok" | "err" = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  }

  function changeStatus(row: ReviewRow, status: ReviewStatus) {
    if (status === "FEATURED" && !row.consent) {
      showToast("This guest didn't give permission to feature their feedback.", "err");
      return;
    }
    const prev = row.status;
    patch(row.id, status);
    startTransition(async () => {
      const res = await setReviewStatus(row.id, status);
      if (!res.ok) {
        patch(row.id, prev);
        showToast(res.error, "err");
      } else {
        showToast(`Marked as ${REVIEW_STATUS_STYLES[status].label.toLowerCase()}`);
      }
    });
  }

  function openReview(row: ReviewRow) {
    setOpenId(row.id);
    const url = new URL(window.location.href);
    url.searchParams.set("review", row.id);
    window.history.replaceState(null, "", url);
    if (row.status === "NEW") {
      patch(row.id, "REVIEWED");
      markReviewSeen(row.id).catch(() => patch(row.id, "NEW"));
    }
  }

  const close = useCallback(() => {
    setOpenId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("review");
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    if (initialSelected?.status === "NEW") markReviewSeen(initialSelected.id).catch(() => {});
  }, [initialSelected]);

  return (
    <>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_96px_minmax(0,2.4fr)_minmax(0,0.9fr)_88px_100px_148px] gap-4 border-b border-line-soft bg-paper/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400 lg:grid">
        <span>Customer</span>
        <span>Rating</span>
        <span>Feedback</span>
        <span>Visit</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-line-soft">
        {rows.map((r) => (
          <li
            key={r.id}
            className={`group relative grid cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3.5 transition hover:bg-paper sm:px-5 lg:grid-cols-[minmax(0,1.3fr)_96px_minmax(0,2.4fr)_minmax(0,0.9fr)_88px_100px_148px] lg:items-center lg:gap-4 ${
              r.status === "NEW" ? "bg-sky-50/30" : ""
            }`}
            onClick={() => openReview(r)}
          >
            <div className="flex min-w-0 items-center gap-2">
              {r.status === "NEW" ? <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-label="Unread" /> : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openReview(r);
                }}
                className="truncate text-left text-sm font-semibold text-ink-900 outline-none after:absolute after:inset-0 focus-visible:underline"
              >
                {r.customer?.name || "Anonymous guest"}
              </button>
              {r.hasPhoto ? <Camera className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-label="Has photo" /> : null}
            </div>
            <div className="justify-self-end lg:justify-self-start">
              <Stars rating={r.rating} />
            </div>
            <p className="col-span-2 truncate text-sm text-ink-500 lg:col-span-1">{r.feedback}</p>
            <span className="hidden truncate text-sm text-ink-500 lg:block">{r.serviceType ?? "—"}</span>
            <span className="hidden text-sm text-ink-500 lg:block" title={formatDateTime(r.createdAt)}>
              {timeAgo(r.createdAt)}
            </span>
            <div className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1">
              <Pill status={r.status} />
              <span className="text-xs text-ink-400 lg:hidden">
                {r.serviceType ? `${r.serviceType} · ` : ""}
                {timeAgo(r.createdAt)}
              </span>
            </div>
            <div className="relative z-10 hidden justify-end gap-0.5 lg:flex">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                const active = r.status === a.status;
                const disabled = a.status === "FEATURED" && !r.consent;
                return (
                  <button
                    key={a.status}
                    type="button"
                    title={disabled ? "No consent to feature" : a.label}
                    aria-label={`${a.label} review from ${r.customer?.name || "anonymous guest"}`}
                    aria-pressed={active}
                    disabled={pending || disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(r, a.status);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition disabled:cursor-not-allowed disabled:opacity-30 ${a.cls} ${
                      active ? "bg-line-soft text-ink-900" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <Drawer
        open={Boolean(open)}
        onClose={close}
        title="Review details"
        footer={
          open ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                const active = open.status === a.status;
                const disabled = a.status === "FEATURED" && !open.consent;
                return (
                  <button
                    key={a.status}
                    type="button"
                    disabled={pending || disabled}
                    title={disabled ? "Guest didn't consent to public use" : undefined}
                    onClick={() => changeStatus(open, a.status)}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? "border-forest-900 bg-forest-900 text-white" : "border-line bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {a.label}
                  </button>
                );
              })}
            </div>
          ) : null
        }
      >
        {open ? <ReviewDetail review={open} questions={questions} /> : null}
      </Drawer>

      {toast ? (
        <div
          role="status"
          className={`fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-fade-up rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lift md:bottom-8 ${
            toast.tone === "err" ? "bg-rose-600" : "bg-ink-900"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </>
  );
}

function ReviewDetail({ review: r, questions }: { review: ReviewRow; questions: Record<string, string> }) {
  const wa = whatsappNumber(r.customer?.phone);
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Stars rating={r.rating} size="md" />
          <p className="mt-1 text-sm font-semibold text-ink-700">{RATING_LABELS[r.rating]}</p>
        </div>
        <Pill status={r.status} />
      </div>

      <blockquote className="rounded-2xl bg-paper px-4 py-4 text-[15px] leading-relaxed text-ink-900 whitespace-pre-wrap">
        {r.feedback}
      </blockquote>

      {r.answers && Object.keys(r.answers).length ? (
        <div className="space-y-2">
          {Object.entries(r.answers).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className="text-ink-500">{questions[k] ?? k}</span>
              <Stars rating={v} />
            </div>
          ))}
        </div>
      ) : null}

      {r.hasPhoto ? (
        <a href={`/api/admin/media/${r.id}`} target="_blank" rel="noopener" className="block overflow-hidden rounded-2xl border border-line">
          <img src={`/api/admin/media/${r.id}`} alt="Photo shared by the guest" className="max-h-80 w-full object-cover" loading="lazy" />
        </a>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Visit</dt>
          <dd className="mt-0.5 text-ink-900">{r.serviceType ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Received</dt>
          <dd className="mt-0.5 text-ink-900" title={formatDateTime(r.createdAt)}>
            {formatDate(r.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Source</dt>
          <dd className="mt-0.5 text-ink-900">{SOURCE_LABEL[r.source] ?? r.source}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Public use</dt>
          <dd className={`mt-0.5 inline-flex items-center gap-1 font-medium ${r.consent ? "text-emerald-700" : "text-ink-500"}`}>
            {r.consent ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {r.consent ? "Consent given" : "No consent"}
          </dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-line p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Guest</p>
        {r.customer ? (
          <>
            <p className="mt-1 font-semibold text-ink-900">{r.customer.name || "Name not shared"}</p>
            <div className="mt-1 space-y-0.5 text-sm text-ink-500">
              {r.customer.phone ? <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{r.customer.phone}</p> : null}
              {r.customer.email ? <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{r.customer.email}</p> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {wa ? (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3.5 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/20">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : null}
              {r.customer.email ? (
                <a href={`mailto:${r.customer.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-50 px-3.5 text-sm font-semibold text-sky-700 hover:bg-sky-100">
                  <Mail className="h-4 w-4" /> Email
                </a>
              ) : null}
              <Link href={`/admin/customers?customer=${r.customer.id}`} className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-sm font-semibold text-ink-700 hover:border-ink-400">
                View history
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-500">Anonymous — no contact details shared.</p>
        )}
      </div>

      {r.consent && (r.status === "APPROVED" || r.status === "FEATURED") ? (
        <Link href={`/admin/creatives?review=${r.id}`} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-50">
          <Sparkles className="h-4 w-4" /> Turn into a social post
        </Link>
      ) : null}
    </div>
  );
}
