"use client";

import React from "react";
import type { CompareSuccessResponse, CompareScores } from "@/lib/types";

type ComparisonReportProps = {
  data: CompareSuccessResponse;
};

const DIMENSION_LABELS: Record<keyof CompareScores, string> = {
  messagingClarity: "Messaging Clarity",
  seoStrength: "SEO Strength",
  conversionOptimization: "Conversion Optimization",
  distributionStrategy: "Distribution Strategy",
  communityPresence: "Community Presence",
  overallGrowthPotential: "Overall Growth Potential"
};

function ScoreBar({ label, site1, site2 }: { label: string; site1: number; site2: number }) {
  const site1Width = (site1 / 10) * 100;
  const site2Width = (site2 / 10) * 100;
  const winner = site1 > site2 ? "site1" : site2 > site1 ? "site2" : "tie";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-700">{label}</span>
        <div className="flex items-center gap-3">
          <span className={`font-bold tabular-nums ${winner === "site1" ? "text-zinc-950" : "text-zinc-400"}`}>
            {site1}
          </span>
          <span className="text-zinc-300">vs</span>
          <span className={`font-bold tabular-nums ${winner === "site2" ? "text-zinc-950" : "text-zinc-400"}`}>
            {site2}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-2 flex-1 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              winner === "site1" ? "bg-zinc-950" : "bg-zinc-300"
            }`}
            style={{ width: `${site1Width}%` }}
          />
        </div>
        <div className="h-2 flex-1 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              winner === "site2" ? "bg-zinc-950" : "bg-zinc-300"
            }`}
            style={{ width: `${site2Width}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function WinnerBadge({ winner, name1, name2 }: { winner: "site1" | "site2" | "tie"; name1: string; name2: string }) {
  if (winner === "tie") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 py-3 ring-1 ring-zinc-200/60">
        <span className="text-lg">🤝</span>
        <span className="text-sm font-bold text-zinc-700">Too close to call</span>
      </div>
    );
  }

  const winnerName = winner === "site1" ? name1 : name2;
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 shadow-lg">
      <span className="text-lg">🏆</span>
      <span className="text-sm font-bold text-white">Winner: {winnerName}</span>
    </div>
  );
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function MarkdownSection({ markdown }: { markdown: string }) {
  // Simple markdown-to-html for the battle card sections
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];

  let currentSection: string | null = null;
  let currentItems: string[] = [];

  const flushSection = () => {
    if (currentSection && currentItems.length > 0) {
      elements.push(
        <div key={currentSection} className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-900">{currentSection}</h3>
          <ul className="space-y-1.5 pl-4">
            {currentItems.map((item, i) => (
              <li key={i} className="list-disc text-xs leading-5 text-zinc-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    currentItems = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentSection = headingMatch[1];
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      currentItems.push(bulletMatch[1]);
      continue;
    }

    // Non-bullet text under a heading
    const trimmed = line.trim();
    if (trimmed && currentSection && !trimmed.startsWith("|")) {
      currentItems.push(trimmed);
    }
  }
  flushSection();

  return <div className="space-y-6">{elements}</div>;
}

export function ComparisonReport({ data }: ComparisonReportProps) {
  const hostname1 = extractHostname(data.url1);
  const hostname2 = extractHostname(data.url2);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Winner Badge */}
      <div className="flex justify-center">
        <WinnerBadge
          winner={data.winner}
          name1={data.productName1}
          name2={data.productName2}
        />
      </div>

      {/* Two-column header */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl p-4 text-center ring-1 ${
          data.winner === "site1"
            ? "bg-zinc-950 text-white ring-zinc-800"
            : "bg-zinc-50 text-zinc-700 ring-zinc-200"
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Your Site</p>
          <p className="mt-1 text-sm font-bold truncate">{data.productName1}</p>
          <p className="mt-0.5 text-[11px] opacity-60 truncate">{hostname1}</p>
        </div>
        <div className={`rounded-2xl p-4 text-center ring-1 ${
          data.winner === "site2"
            ? "bg-zinc-950 text-white ring-zinc-800"
            : "bg-zinc-50 text-zinc-700 ring-zinc-200"
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Competitor</p>
          <p className="mt-1 text-sm font-bold truncate">{data.productName2}</p>
          <p className="mt-0.5 text-[11px] opacity-60 truncate">{hostname2}</p>
        </div>
      </div>

      {/* Score Bars */}
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Head-to-Head</h3>
          <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-950" />
              {data.productName1}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
              {data.productName2}
            </div>
          </div>
        </div>
        {(Object.keys(DIMENSION_LABELS) as (keyof CompareScores)[]).map((key) => (
          <ScoreBar
            key={key}
            label={DIMENSION_LABELS[key]}
            site1={data.scores[key].site1}
            site2={data.scores[key].site2}
          />
        ))}
      </div>

      {/* Battle Card Content */}
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm">
        <MarkdownSection markdown={data.markdown} />
      </div>

      {/* Quality footnote */}
      <p className="text-center text-[10px] text-zinc-400">
        Quality scores — {data.productName1}: {data.critic1Summary} · {data.productName2}: {data.critic2Summary}
      </p>
    </div>
  );
}
