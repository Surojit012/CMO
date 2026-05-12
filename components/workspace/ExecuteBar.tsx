"use client";

import { useState } from "react";
import { useToken } from "@privy-io/react-auth";
import type { ExecuteAction, ExecuteResponse, AnalyzeErrorResponse } from "@/lib/types";

const ACTIONS: { action: ExecuteAction; label: string }[] = [
  { action: "generateTweetThread", label: "Generate Tweet Thread" },
  { action: "generateAdCopy", label: "Generate Ad Copy" },
  { action: "generateBlogPost", label: "Generate Blog Post" },
  { action: "generateContentPlan", label: "Generate 30-Day Plan" },
];

type ExecuteBarProps = { strategyContext: string };

export function ExecuteBar({ strategyContext }: ExecuteBarProps) {
  const { getAccessToken } = useToken();
  const [loadingAction, setLoadingAction] = useState<ExecuteAction | null>(null);
  const [results, setResults] = useState<Partial<Record<ExecuteAction, string>>>({});
  const [openAction, setOpenAction] = useState<ExecuteAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExecute(action: ExecuteAction) {
    setLoadingAction(action);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, context: strategyContext }),
      });
      const data = (await response.json()) as ExecuteResponse | AnalyzeErrorResponse;
      if (!response.ok || "error" in data) throw new Error("error" in data ? data.error : "Execution failed.");
      setResults((c) => ({ ...c, [action]: data.output }));
      setOpenAction(action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      setLoadingAction(null);
    }
  }

  const isContextMissing = !strategyContext.trim();

  return (
    <div className="space-y-4">
      {/* Button row */}
      <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4">
        <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-600 mb-3">Execute Strategy</p>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((config) => (
            <button
              key={config.action}
              onClick={() => handleExecute(config.action)}
              disabled={loadingAction !== null || isContextMissing}
              className="rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loadingAction === config.action ? "Generating..." : config.label}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>

      {/* Results */}
      {ACTIONS.map((config) => {
        const output = results[config.action];
        if (!output) return null;
        const isOpen = openAction === config.action;
        return (
          <div key={config.action} className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] overflow-hidden animate-card-entrance">
            <button
              onClick={() => setOpenAction(isOpen ? null : config.action)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition"
            >
              <span className="text-sm font-medium text-zinc-300">{config.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(output); }}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-400 hover:text-white transition"
              >
                Copy
              </button>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-white/5">
                <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400 font-mono">{output}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
