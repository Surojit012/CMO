"use client";

import { Check, ExternalLink } from "lucide-react";

type AgentStatus = "pending" | "running" | "complete";

export type AgentRow = {
  name: string;
  status: AgentStatus;
  cost: string;
  txHash?: string | null;
};

type ProgressTrackerProps = {
  url: string;
  agents: AgentRow[];
  elapsedSeconds: number;
};

export function ProgressTracker({ url, agents, elapsedSeconds }: ProgressTrackerProps) {
  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(1, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");
  const completedCount = agents.filter((a) => a.status === "complete").length;
  const progress = agents.length > 0 ? (completedCount / agents.length) * 100 : 0;

  return (
    <div className="flex justify-center animate-fade-in">
      <div className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] bg-zinc-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">Analyzing</span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-zinc-600">{mm}:{ss}</span>
        </div>
        <div className="px-5 pb-3">
          <span className="inline-block font-mono text-xs text-zinc-500 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1 truncate max-w-full">{url}</span>
        </div>
        <div className="mx-5 h-px bg-white/5">
          <div className="h-px bg-white transition-[width] duration-700 ease-out" style={{ width: `${Math.min(progress, 95)}%` }} />
        </div>
        <div className="px-5 py-4 space-y-0">
          {agents.map((agent, i) => (
            <div key={agent.name} className="flex items-center justify-between py-2.5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3">
                {agent.status === "complete" ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10"><Check className="w-2.5 h-2.5 text-white" /></span>
                ) : agent.status === "running" ? (
                  <span className="flex h-4 w-4 items-center justify-center"><span className="h-2 w-2 rounded-full bg-white animate-pulse-glow" /></span>
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-zinc-700" /></span>
                )}
                <span className={`text-xs font-medium ${agent.status === "complete" ? "text-zinc-400" : agent.status === "running" ? "text-white" : "text-zinc-600"}`}>{agent.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-zinc-600">{agent.cost}</span>
                {agent.txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${agent.txHash}`} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-zinc-400 transition">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
