"use client";

import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, Send, Webhook } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { useCopy } from "@/components/admin/share-link-card";
import { btn, inputCls, labelCls } from "@/components/admin/ui";
import { timeAgo } from "@/lib/format";
import { generateApiKey, revokeApiKey, rotateSecret, saveWebhook, sendTestEvent, type IntegrationState } from "./actions";

type Delivery = { id: string; ok: boolean; event: string; detail: string; createdAt: string };

function CopyField({ value, label, secret = false }: { value: string; label: string; secret?: boolean }) {
  const { copied, copy } = useCopy();
  const [shown, setShown] = useState(!secret);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-paper py-1 pl-3.5 pr-1">
      <code className="min-w-0 flex-1 truncate text-[13px] text-ink-700" aria-label={label}>
        {shown ? value : "•".repeat(Math.min(32, value.length))}
      </code>
      {secret ? (
        <button type="button" onClick={() => setShown((s) => !s)} className={btn.ghost} aria-label={shown ? "Hide" : "Reveal"}>
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : null}
      <button type="button" onClick={() => copy(value, label)} className={btn.ghost} aria-label={`Copy ${label}`}>
        {copied === label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

const ENDPOINTS = [
  ["GET", "/api/integrations/v1/reviews?since=ISO_DATE&status=APPROVED", "List reviews (Google Sheets fields)"],
  ["GET", "/api/integrations/v1/reviews/{id}", "One review"],
  ["PATCH", "/api/integrations/v1/reviews/{id}", "Update status { status }"],
  ["GET", "/api/integrations/v1/reviews/{id}/photo", "Guest photo (if any)"],
  ["POST", "/api/integrations/v1/creatives", "Create post { review_id, caption, image_url, status }"],
  ["PATCH", "/api/integrations/v1/creatives/{id}", "Update post { caption, image_url, status }"],
];

export function IntegrationsPanel(props: {
  baseUrl: string;
  webhookUrl: string;
  enabled: boolean;
  secret: string | null;
  apiKeyPrefix: string | null;
  envFallback: boolean;
  deliveries: Delivery[];
}) {
  const [state, action, pending] = useActionState<IntegrationState, FormData>(saveWebhook, {});
  const [busy, start] = useTransition();
  const [result, setResult] = useState<IntegrationState>({});
  const run = (fn: () => Promise<IntegrationState>) => start(async () => setResult(await fn()));
  const secret = result.secret ?? props.secret;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ea4b71]/10 text-[#ea4b71]">
            <Webhook className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink-900">n8n webhook</h2>
            <p className="text-sm text-ink-500">We POST every new review here — instantly, in the background.</p>
          </div>
        </div>
        <form action={action} className="mt-5 space-y-4">
          <div>
            <label htmlFor="webhookUrl" className={labelCls}>Webhook URL</label>
            <input id="webhookUrl" name="webhookUrl" type="url" defaultValue={props.webhookUrl} placeholder="https://your-n8n.app.n8n.cloud/webhook/argus-reviews" className={inputCls} />
            {props.envFallback && !props.webhookUrl ? (
              <p className="mt-1.5 text-xs text-ink-400">Empty = uses the server default (N8N_WEBHOOK_URL).</p>
            ) : null}
          </div>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
            <input type="checkbox" name="enabled" defaultChecked={props.enabled} className="h-5 w-5 accent-forest-900" /> Send events
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Save"}</button>
            <button type="button" disabled={busy} onClick={() => run(sendTestEvent)} className={btn.secondary}>
              <Send className="h-4 w-4" /> Send test event
            </button>
            {state.savedAt && !pending ? <span className="text-sm font-semibold text-emerald-700">Saved</span> : null}
            {state.error ? <span className="text-sm font-medium text-rose-600">{state.error}</span> : null}
          </div>
          {result.test ? <p className="text-sm font-semibold text-emerald-700">{result.test}</p> : null}
          {result.error ? <p className="text-sm font-medium text-rose-600">{result.error}</p> : null}
        </form>

        <div className="mt-6 border-t border-line-soft pt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-900">Signing secret</span>
            <button type="button" disabled={busy} onClick={() => run(rotateSecret)} className={btn.ghost}>
              <RefreshCw className="h-3.5 w-3.5" /> Rotate
            </button>
          </div>
          {secret ? <CopyField value={secret} label="signing secret" secret /> : <p className="text-sm text-ink-400">Created when you save a webhook.</p>}
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            Each request includes <code>X-Argus-Event</code>, <code>X-Argus-Timestamp</code> and <code>X-Argus-Signature: sha256=HMAC(secret, timestamp + &quot;.&quot; + body)</code>.
            Events: <code>review.created</code>, <code>review.status_changed</code>, <code>creative.updated</code>, <code>test</code>.
          </p>
        </div>

        <div className="mt-6 border-t border-line-soft pt-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">Recent deliveries</p>
          {props.deliveries.length ? (
            <ul className="space-y-1.5 text-sm">
              {props.deliveries.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${d.ok ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <code className="text-ink-700">{d.event}</code>
                  <span className="truncate text-ink-400">{d.detail}</span>
                  <span className="ml-auto shrink-0 text-xs text-ink-400">{timeAgo(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-400">No deliveries yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-forest-800">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink-900">API access</h2>
            <p className="text-sm text-ink-500">Let n8n read reviews and write back creative/post status.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {result.apiKey ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="mb-2 text-sm font-semibold text-amber-800">Copy your key now — it won&apos;t be shown again.</p>
              <CopyField value={result.apiKey} label="API key" />
            </div>
          ) : props.apiKeyPrefix ? (
            <p className="text-sm text-ink-700">
              Active key: <code className="rounded bg-paper px-1.5 py-0.5">{props.apiKeyPrefix}…</code>
            </p>
          ) : (
            <p className="text-sm text-ink-500">No API key yet.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => run(generateApiKey)} className={btn.primary}>
              {props.apiKeyPrefix || result.apiKey ? "Regenerate key" : "Generate API key"}
            </button>
            {props.apiKeyPrefix && !result.apiKey ? (
              <button type="button" disabled={busy} onClick={() => confirm("Revoke this key? n8n will lose access.") && run(revokeApiKey)} className={btn.secondary}>
                Revoke
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 border-t border-line-soft pt-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">Endpoints</p>
          <p className="mb-3 text-xs text-ink-400">
            Base URL <code>{props.baseUrl}</code> · Header <code>Authorization: Bearer &lt;key&gt;</code>
          </p>
          <ul className="space-y-2">
            {ENDPOINTS.map(([m, path, desc]) => (
              <li key={m + path} className="rounded-xl bg-paper px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[10px] font-bold leading-4 ${m === "GET" ? "bg-sky-100 text-sky-700" : m === "POST" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{m}</span>
                  <code className="min-w-0 break-all text-xs text-ink-700">{path}</code>
                </div>
                <p className="mt-0.5 pl-11 text-xs text-ink-400">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
