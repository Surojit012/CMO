"use client";

import { OutreachPlanView } from "@/components/OutreachPlanView";
import type { AnalyzeSuccessResponse } from "@/lib/types";

type OutreachViewProps = {
  context: AnalyzeSuccessResponse | null;
  sessionId: string;
  onSwitchToAnalysis: () => void;
};

export function OutreachView({ context, sessionId, onSwitchToAnalysis }: OutreachViewProps) {
  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-300 mb-2">No active context found.</h2>
        <p className="text-sm text-zinc-600 max-w-sm mb-6">
          Run a Growth Analysis first to unlock your outreach plan.
        </p>
        <button
          onClick={onSwitchToAnalysis}
          className="rounded-full bg-white/10 border border-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition"
        >
          Go to Growth Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in dark-override">
      <OutreachPlanView analysisData={context} sessionId={sessionId} />
    </div>
  );
}
