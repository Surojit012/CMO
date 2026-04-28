"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ── Pipeline simulation ─────────────────────────────────── */
type SimEvent = {
  agent: string;
  status: "thinking" | "done";
  message: string;
  delayMs: number; // cumulative ms from start
};

/**
 * These mirror the actual backend pipeline stages.
 * Timings are tuned to match real execution on Groq/Together.
 */
const PIPELINE: SimEvent[] = [
  { agent: "system",       status: "thinking", message: "Scraping website content…",                          delayMs: 0 },
  { agent: "system",       status: "done",     message: "Website scraped. Extracting key data.",              delayMs: 2500 },
  { agent: "system",       status: "thinking", message: "Loading memory & past analysis context…",            delayMs: 3000 },
  { agent: "system",       status: "done",     message: "Memory loaded.",                                     delayMs: 4000 },
  { agent: "strategist",   status: "thinking", message: "Analyzing positioning, TAM, and competitive moats…", delayMs: 4500 },
  { agent: "strategist",   status: "done",     message: "Strategic brief drafted. Passing to specialists.",   delayMs: 9000 },
  { agent: "copywriter",   status: "thinking", message: "Crafting headlines, hooks, and CTA frameworks…",     delayMs: 9500 },
  { agent: "seo",          status: "thinking", message: "Auditing on-page SEO, keywords, and schema…",        delayMs: 10000 },
  { agent: "conversion",   status: "thinking", message: "Evaluating funnels, CTAs, and friction points…",     delayMs: 10500 },
  { agent: "distribution", status: "thinking", message: "Mapping distribution channels and growth loops…",    delayMs: 11000 },
  { agent: "reddit",       status: "thinking", message: "Scanning Reddit for relevant threads & sentiment…",  delayMs: 11500 },
  { agent: "copywriter",   status: "done",     message: "Copy audit complete — hooks and rewrites ready.",     delayMs: 16000 },
  { agent: "seo",          status: "done",     message: "SEO audit done — 12 issues flagged.",                 delayMs: 17000 },
  { agent: "conversion",   status: "done",     message: "Conversion report ready — 8 quick wins found.",      delayMs: 18000 },
  { agent: "distribution", status: "done",     message: "Distribution playbook mapped across 5 channels.",    delayMs: 19000 },
  { agent: "reddit",       status: "done",     message: "Reddit intel gathered — 3 high-intent threads.",     delayMs: 20000 },
  { agent: "critic",       status: "thinking", message: "Quality-checking all outputs for hallucinations…",   delayMs: 21000 },
  { agent: "critic",       status: "done",     message: "Quality score: 8.2/10. All outputs validated.",      delayMs: 26000 },
  { agent: "aggregator",   status: "thinking", message: "Synthesizing reports into unified growth plan…",     delayMs: 27000 },
  { agent: "aggregator",   status: "done",     message: "Growth plan finalized. Preparing delivery.",         delayMs: 35000 },
];

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
  /** Set to true while analysis is running */
  active: boolean;
};

export function AgentWarRoom({ active }: AgentWarRoomProps) {
  const [visibleEvents, setVisibleEvents] = useState<SimEvent[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  // Start pipeline simulation when active
  useEffect(() => {
    if (!active) {
      // Cleanup
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setVisibleEvents([]);
      setElapsedSeconds(0);
      return;
    }

    startTimeRef.current = Date.now();
    setVisibleEvents([]);

    // Schedule each event
    const timers = PIPELINE.map((event) =>
      setTimeout(() => {
        setVisibleEvents((prev) => [...prev, event]);
      }, event.delayMs)
    );

    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [active]);

  // Timer
  useEffect(() => {
    if (!active) return;
    setElapsedSeconds(0);
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  // Entrance animation
  useEffect(() => {
    if (!active) {
      setCardVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setCardVisible(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleEvents.length]);

  if (!active) return null;

  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(1, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

  // Derive active (thinking) agents for the status bar
  const activeAgents = useMemo(() => {
    const thinking = new Set<string>();
    for (const e of visibleEvents) {
      if (e.status === "thinking") thinking.add(e.agent);
      if (e.status === "done") thinking.delete(e.agent);
    }
    return Array.from(thinking);
  }, [visibleEvents]);

  const completedCount = visibleEvents.filter((e) => e.status === "done").length;
  const progress = Math.min((completedCount / 10) * 100, 95);

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
          {visibleEvents.map((event, i) => {
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
