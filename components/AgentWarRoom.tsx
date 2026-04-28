"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent-events";

/* ── Agent metadata ──────────────────────────────────────── */
const AGENT_META: Record<string, { label: string; icon: string; color: string }> = {
  system:       { label: "System",       icon: "⚙️",  color: "#71717a" },
  strategist:   { label: "Strategist",   icon: "🎯",  color: "#0ea5e9" },
  copywriter:   { label: "Copywriter",   icon: "✍️",  color: "#a855f7" },
  seo:          { label: "SEO Agent",    icon: "🔍",  color: "#22c55e" },
  conversion:   { label: "Conversion",   icon: "📊",  color: "#f59e0b" },
  distribution: { label: "Distribution", icon: "📢",  color: "#ef4444" },
  reddit:       { label: "Reddit Intel", icon: "🔴",  color: "#ff4500" },
  critic:       { label: "Critic",       icon: "🔎",  color: "#6366f1" },
  aggregator:   { label: "Aggregator",   icon: "🧠",  color: "#14b8a6" },
};

function getMeta(agent: string) {
  return AGENT_META[agent] ?? { label: agent, icon: "🤖", color: "#71717a" };
}

/* ── Component ───────────────────────────────────────────── */
type AgentWarRoomProps = {
  events: AgentEvent[];
};

export function AgentWarRoom({ events }: AgentWarRoomProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deduplicate events by message to avoid rendering the same event twice
  const uniqueEvents = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      const key = `${e.agent}:${e.status}:${e.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events]);

  // Timer
  useEffect(() => {
    setElapsedSeconds(0);
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Entrance animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setCardVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [uniqueEvents.length]);

  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(1, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

  // Derive active (thinking) agents for the status bar
  const activeAgents = useMemo(() => {
    const thinking = new Set<string>();
    for (const e of uniqueEvents) {
      if (e.status === "thinking") thinking.add(e.agent);
      if (e.status === "done" || e.status === "error") thinking.delete(e.agent);
    }
    return Array.from(thinking);
  }, [uniqueEvents]);

  const completedCount = uniqueEvents.filter((e) => e.status === "done").length;
  const totalExpected = 18; // rough total events
  const progress = Math.min((completedCount / totalExpected) * 100, 95);

  return (
    <div className="flex justify-center">
      <div
        className={[
          "w-full max-w-[520px] rounded-[20px] border border-zinc-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300 ease-out overflow-hidden",
          cardVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-900">
              Agent War Room
            </span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-zinc-400">
            {mm}:{ss}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-6 h-px bg-zinc-100">
          <div
            className="h-px bg-zinc-900 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Active agents bar */}
        {activeAgents.length > 0 && (
          <div className="flex items-center gap-1.5 px-6 pt-2.5 pb-1 flex-wrap">
            {activeAgents.map((agent) => {
              const meta = getMeta(agent);
              return (
                <span
                  key={agent}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: meta.color + "12", color: meta.color }}
                >
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Event feed */}
        <div
          ref={scrollRef}
          className="max-h-[340px] overflow-y-auto scroll-smooth px-6 pt-2 pb-5 space-y-0"
        >
          {uniqueEvents.map((event, i) => {
            const meta = getMeta(event.agent);
            const isDone = event.status === "done";
            const isSystem = event.agent === "system";

            return (
              <div
                key={`${event.agent}-${event.status}-${i}`}
                className="war-room-event py-2"
                style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Status indicator */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px]" style={{ backgroundColor: meta.color + "18" }}>
                        ✓
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                        {meta.icon}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Agent label */}
                    {!isSystem && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    )}

                    {/* Message */}
                    <p
                      className={[
                        "text-[12.5px] leading-[1.5]",
                        isDone ? "text-zinc-400" : "text-zinc-700",
                        isSystem ? "text-zinc-400 italic" : ""
                      ].join(" ")}
                    >
                      {event.message}
                      {!isDone && (
                        <span className="war-room-ellipsis ml-0.5 text-zinc-400">...</span>
                      )}
                    </p>

                    {/* Preview snippet */}
                    {isDone && event.preview && !isSystem && (
                      <p className="mt-0.5 text-[11px] leading-[1.5] text-zinc-300 italic line-clamp-2">
                        "{event.preview}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes warRoomFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes warRoomEllipsis {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        .war-room-event {
          animation: warRoomFadeIn 280ms ease-out both;
        }
        .war-room-ellipsis {
          animation: warRoomEllipsis 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
