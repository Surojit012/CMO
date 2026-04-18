"use client";

import { useEffect, useState } from "react";

import type {
  AnalyzeErrorResponse,
  ExecuteAction,
  ExecuteResponse
} from "@/lib/types";

type ExecuteButtonsProps = {
  strategyContext: string;
  userId: string;
};

type ActionConfig = {
  action: ExecuteAction;
  label: string;
};

const ACTIONS: ActionConfig[] = [
  { action: "generateTweetThread", label: "Generate Tweet Thread" },
  { action: "generateAdCopy", label: "Generate Ad Copy" },
  { action: "generateBlogPost", label: "Generate Blog Post" },
  { action: "generateContentPlan", label: "Generate 30-Day Plan" }
];

type PublishPlatform = "devto" | "hashnode";

type PublishStatus = {
  status: "idle" | "loading" | "success" | "error";
  url?: string;
  error?: string;
};

export function ExecuteButtons({ strategyContext, userId }: ExecuteButtonsProps) {
  const [analysisContext, setAnalysisContext] = useState("");
  const [loadingAction, setLoadingAction] = useState<ExecuteAction | null>(null);
  const [results, setResults] = useState<Partial<Record<ExecuteAction, string>>>({});
  const [openAction, setOpenAction] = useState<ExecuteAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [publishStatuses, setPublishStatuses] = useState<Record<PublishPlatform, PublishStatus>>({
    devto: { status: "idle" },
    hashnode: { status: "idle" }
  });

  useEffect(() => {
    if (strategyContext?.trim()) {
      setAnalysisContext(strategyContext);
    }
  }, [strategyContext]);

  async function handleExecute(action: ExecuteAction) {
    setLoadingAction(action);
    setError(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
          "x-privy-user-id": userId
        },
        body: JSON.stringify({
          action,
          context: analysisContext
        })
      });

      const data = (await response.json()) as ExecuteResponse | AnalyzeErrorResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Execution failed.");
      }

      setResults((current) => ({
        ...current,
        [action]: data.output
      }));
      setOpenAction(action);
    } catch (executeError) {
      setError(executeError instanceof Error ? executeError.message : "Execution failed.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handlePublish(platform: PublishPlatform) {
    const content = results["generateBlogPost"];
    if (!content) return;

    setPublishStatuses(prev => ({ ...prev, [platform]: { status: "loading" } }));

    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Publishing failed");
      }

      setPublishStatuses(prev => ({ 
        ...prev, 
        [platform]: { status: "success", url: data.url } 
      }));
    } catch (err) {
      setPublishStatuses(prev => ({ 
        ...prev, 
        [platform]: { status: "error", error: err instanceof Error ? err.message : "Failed" } 
      }));
    }
  }

  const hasBlogPost = !!results["generateBlogPost"];

  const isContextMissing = !analysisContext.trim();

  return (
    <div className="space-y-3 rounded-[20px] bg-zinc-50 px-3 py-3 ring-1 ring-black/5 sm:space-y-4 sm:rounded-[26px] sm:px-4 sm:py-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Execute Strategy
        </p>
        <p className="text-sm text-zinc-600">
          Turn this growth plan into ready-to-use assets with one click.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((config) => (
          <button
            key={config.action}
            type="button"
            disabled={loadingAction !== null || isContextMissing}
            title={isContextMissing ? "Run an analysis first" : undefined}
            onClick={() => handleExecute(config.action)}
            className="rounded-full bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {loadingAction === config.action ? "Generating..." : config.label}
          </button>
        ))}
      </div>

      {hasBlogPost && (
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Distribute Blog Post</p>
          <div className="flex flex-wrap gap-2">
            <PublishButton 
              platform="Dev.to" 
              status={publishStatuses.devto} 
              onClick={() => handlePublish("devto")} 
              colorClass="bg-emerald-600 hover:bg-emerald-700" 
            />
            <PublishButton 
              platform="Hashnode" 
              status={publishStatuses.hashnode} 
              onClick={() => handlePublish("hashnode")} 
              colorClass="bg-blue-600 hover:bg-blue-700" 
            />
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {ACTIONS.map((config) => {
          const output = results[config.action];
          if (!output) return null;
          const isOpen = openAction === config.action;

          return (
            <div key={config.action} className="rounded-xl bg-white px-3 py-3 ring-1 ring-black/5 shadow-sm sm:rounded-2xl sm:px-4 sm:py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <button
                  type="button"
                  onClick={() => setOpenAction(isOpen ? null : config.action)}
                  className="text-left text-sm font-semibold text-zinc-900"
                >
                  {config.label}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                >
                  Copy
                </button>
              </div>
              {isOpen && (
                <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-zinc-700 font-mono bg-zinc-50 p-2.5 rounded-lg ring-1 ring-black/5 sm:mt-4 sm:text-xs sm:leading-6 sm:p-3 sm:rounded-xl">{output}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublishButton({ 
  platform, 
  status, 
  onClick, 
  colorClass 
}: { 
  platform: string; 
  status: PublishStatus; 
  onClick: () => void; 
  colorClass: string; 
}) {
  if (status.status === "success" && status.url) {
    return (
      <a 
        href={status.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="rounded-full bg-zinc-900 px-3 py-2 text-[11px] font-bold text-white transition animate-in fade-in"
      >
        View on {platform} ✅
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={status.status === "loading"}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-[11px] font-bold text-white transition disabled:opacity-50 ${colorClass}`}
    >
      {status.status === "loading" ? "Publishing..." : status.status === "error" ? "Failed ❌ Try again" : `Publish to ${platform}`}
    </button>
  );
}
