"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "@/components/admin/share-link-card";

export function CodeSnippet({ code }: { code: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative">
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-ink-900 p-4 pr-24 font-mono text-xs leading-relaxed text-mint-100">{code}</pre>
      <button
        type="button"
        onClick={() => copy(code, "code")}
        className="absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-lg bg-white/10 px-2.5 text-xs font-semibold text-white hover:bg-white/20"
      >
        {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === "code" ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
