"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { SaveState } from "@/app/admin/(dashboard)/settings-actions";
import { btn } from "./ui";

export function SaveBar({ state, pending, label = "Save changes" }: { state: SaveState; pending: boolean; label?: string }) {
  const [dismissed, setDismissed] = useState<number | undefined>();
  const showSaved = Boolean(state.savedAt) && state.savedAt !== dismissed;
  useEffect(() => {
    if (!state.savedAt) return;
    const t = setTimeout(() => setDismissed(state.savedAt), 2500);
    return () => clearTimeout(t);
  }, [state.savedAt]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {state.error ? (
        <p role="alert" className="mr-auto text-sm font-medium text-rose-600">
          {state.error}
        </p>
      ) : null}
      {showSaved && !pending ? (
        <span role="status" className="inline-flex animate-fade-in items-center gap-1 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4" /> Saved
        </span>
      ) : null}
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
