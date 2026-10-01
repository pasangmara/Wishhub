"use client";

import { Check, Copy, Download, ExternalLink, Mail, QrCode } from "lucide-react";
import { useCallback, useState } from "react";
import { Modal } from "./overlay";

type Props = {
  url: string;
  qrUrl: string;
  whatsappHref: string;
  emailHref: string;
  businessName: string;
  compact?: boolean;
};

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (text: string, key = "default") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
  }, []);
  return { copied, copy };
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.43 9.43 0 01-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 016.68 2.77 9.38 9.38 0 012.76 6.68c0 5.2-4.24 9.44-9.45 9.44zm8.04-17.48A11.33 11.33 0 0012.05.7C5.78.7.67 5.8.67 12.07c0 2 .52 3.96 1.52 5.69L.57 23.7l6.08-1.6a11.34 11.34 0 005.4 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.35-8.05z" />
    </svg>
  );
}

export function ShareLinkCard({ url, qrUrl, whatsappHref, emailHref, businessName, compact = false }: Props) {
  const { copied, copy } = useCopy();
  const [qrOpen, setQrOpen] = useState(false);
  const displayUrl = url.replace(/^https?:\/\//, "");

  const action =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition active:scale-[0.97]";

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-forest-900 p-5 text-white shadow-lift sm:p-7">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-brand opacity-20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-ember-500 opacity-15 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-100/80">Your review link</p>
        {!compact ? (
          <p className="mt-1.5 max-w-lg text-sm text-white/70">
            Send this to guests after their visit. One link — no app, no sign-up.
          </p>
        ) : null}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 pl-4 ring-1 ring-white/15">
          <span className="min-w-0 flex-1 truncate font-mono text-[14px] sm:text-[15px]" title={url}>
            {displayUrl}
          </span>
          <button
            type="button"
            onClick={() => copy(url, "link")}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-forest-900 transition hover:bg-mint-50 active:scale-95"
          >
            {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "link" ? "Copied" : "Copy Link"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a href={url} target="_blank" rel="noopener" className={`${action} border-white/15 bg-white/5 hover:bg-white/10`}>
            <ExternalLink className="h-4 w-4" /> Open
          </a>
          <button type="button" onClick={() => setQrOpen(true)} className={`${action} border-white/15 bg-white/5 hover:bg-white/10`}>
            <QrCode className="h-4 w-4" /> QR Code
          </button>
          <a href={whatsappHref} target="_blank" rel="noopener" className={`${action} border-white/15 bg-white/5 hover:bg-white/10`}>
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a href={emailHref} className={`${action} border-white/15 bg-white/5 hover:bg-white/10`}>
            <Mail className="h-4 w-4" /> Email
          </a>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Review QR code">
        <div className="rounded-2xl border border-line bg-white p-4">
          <img src={`${qrUrl}?format=svg`} alt={`QR code for ${businessName} review link`} className="mx-auto aspect-square w-full max-w-[280px]" />
        </div>
        <p className="mt-3 text-center text-sm text-ink-500">
          Print it on tables, bills, menus, the counter or reception.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`${qrUrl}?format=png&download=1`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">
            <Download className="h-4 w-4" /> PNG
          </a>
          <a href={`${qrUrl}?format=svg&download=1`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-700 hover:border-ink-400">
            <Download className="h-4 w-4" /> SVG (print)
          </a>
        </div>
      </Modal>
    </section>
  );
}
