"use client";

import { Check, Copy, Download, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useCopy } from "@/components/admin/share-link-card";
import { CREATIVE_STATUS_STYLES, Pill, Stars, btn } from "@/components/admin/ui";
import type { CreativeStatus } from "@/db/schema";
import { timeAgo } from "@/lib/format";
import { createCreative, deleteCreative, updateCreative } from "./actions";

type Post = { id: string; caption: string | null; imageUrl: string | null; status: CreativeStatus; createdAt: string; reviewId: string | null; rating: number | null; name: string | null };
type Candidate = { id: string; rating: number; feedback: string; status: string; name: string | null; createdAt: string };

export function CreativesBoard({ posts, candidates, highlight }: { posts: Post[]; candidates: Candidate[]; highlight: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {candidates.length ? (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Ready to create <span className="text-ink-400">({candidates.length})</span></h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
            {candidates.map((c) => (
              <div
                key={c.id}
                className={`flex w-[280px] shrink-0 snap-start flex-col rounded-2xl border bg-white p-4 shadow-soft sm:w-auto ${highlight === c.id ? "border-amber-300 ring-4 ring-amber-100" : "border-line"}`}
              >
                <div className="flex items-center justify-between">
                  <Stars rating={c.rating} />
                  <span className="text-xs text-ink-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-700">“{c.feedback}”</p>
                <p className="mt-2 text-xs font-semibold text-ink-500">{c.name || "Anonymous guest"}</p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await createCreative(c.id);
                      setError(r.ok ? null : r.error);
                    })
                  }
                  className={`${btn.primary} mt-3 w-full`}
                >
                  <Plus className="h-4 w-4" /> Create post
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Posts <span className="text-ink-400">({posts.length})</span></h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} highlighted={highlight === p.id} onError={setError} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PostCard({ post, highlighted, onError }: { post: Post; highlighted: boolean; onError: (e: string | null) => void }) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [status, setStatus] = useState(post.status);
  const [pending, start] = useTransition();
  const { copied, copy } = useCopy();
  const dirty = caption !== (post.caption ?? "");
  const generated = `/api/admin/creatives/${post.id}/image`;
  const img = post.imageUrl || generated;

  function save(next?: CreativeStatus) {
    start(async () => {
      const r = await updateCreative(post.id, { caption: dirty ? caption : undefined, status: next });
      if (!r.ok) onError(r.error);
      else {
        onError(null);
        if (next) setStatus(next);
      }
    });
  }

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-soft ${highlighted ? "border-amber-300 ring-4 ring-amber-100" : "border-line"}`}>
      <a href={img} target="_blank" rel="noopener" className="block aspect-square bg-line-soft">
        <img src={img} alt={`Quote card for ${post.name ?? "guest"} review`} loading="lazy" className="h-full w-full object-cover" />
      </a>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <Pill status={status} map={CREATIVE_STATUS_STYLES} />
          <span className="text-xs text-ink-400">{timeAgo(post.createdAt)}</span>
        </div>
        <label className="sr-only" htmlFor={`cap-${post.id}`}>Caption</label>
        <textarea
          id={`cap-${post.id}`}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          className="mt-3 w-full flex-1 resize-y rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm leading-relaxed text-ink-700 outline-none focus:border-forest-700"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {status === "DRAFT" ? (
            <button type="button" disabled={pending} onClick={() => save("APPROVED")} className={btn.primary}>
              <Check className="h-4 w-4" /> Approve
            </button>
          ) : status === "APPROVED" ? (
            <button type="button" disabled={pending} onClick={() => save("PUBLISHED")} className={btn.primary}>
              <Send className="h-4 w-4" /> Mark published
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => save("DRAFT")} className={btn.secondary}>
              <Undo2 className="h-4 w-4" /> Back to draft
            </button>
          )}
          {dirty ? (
            <button type="button" disabled={pending} onClick={() => save()} className={btn.secondary}>Save</button>
          ) : null}
          <div className="ml-auto flex gap-0.5">
            <button type="button" title="Copy caption" onClick={() => copy(caption, "cap")} className={btn.ghost} aria-label="Copy caption">
              {copied === "cap" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <a href={post.imageUrl || `${generated}?download=1`} title="Download image" className={btn.ghost} aria-label="Download image">
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              title="Delete"
              aria-label="Delete post"
              disabled={pending}
              onClick={() => {
                if (confirm("Delete this post?")) start(async () => void (await deleteCreative(post.id)));
              }}
              className={`${btn.ghost} hover:text-rose-600`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
