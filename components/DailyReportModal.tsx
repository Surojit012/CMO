"use client";

import { useEffect } from "react";
import { Download, X } from "lucide-react";
import { parseGrowthMarkdown } from "@/lib/parsers";
import type { GrowthSection } from "@/lib/types";

function parseHighlights(text: string) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-zinc-200">
          {content}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type DailyReportModalProps = {
  markdown: string;
  onClose: () => void;
  timestamp: string;
};

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const sectionTitles: Record<GrowthSection, string> = {
  criticalIssues: "🚨 Daily Anomaly Detection",
  growthStrategy: "🎯 Today's Action Item",
  viralHooks: "🪝 Fresh Daily Hooks",
  seoOpportunities: "🔍 Keyword Checks",
  conversionFixes: "⚡ Quick UI Tweaks",
  distributionPlan: "📢 Daily Distribution",
  redditOpportunities: "🔴 Today's Target Subreddits",
  unfairAdvantage: "💡 Unfair Advantage",
};

export function DailyReportModal({ markdown, onClose, timestamp }: DailyReportModalProps) {
  const parsed = parseGrowthMarkdown(markdown);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDownload = () => {
    downloadTextFile(`daily-report-${new Date().toISOString().split('T')[0]}.md`, markdown);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-lg">📄</span>
            <div>
              <h2 className="text-sm font-bold text-white">Daily Automated Report</h2>
              <p className="text-[11px] text-zinc-500 font-medium">Generated {new Date(timestamp).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download .md</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notion-style Document Content */}
        <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-12 md:px-20 lg:px-24 scroll-smooth">
          <article className="mx-auto max-w-2xl space-y-12 pb-20">
            <header className="mb-10 space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Daily Check-in
              </h1>
              <p className="text-sm text-zinc-500 font-medium pb-4 border-b border-white/5">
                Actionable focus areas discovered in the last 24 hours.
              </p>
            </header>

            {(Object.entries(parsed) as [GrowthSection, string[]][]).map(([key, items]) => {
              if (!items || items.length === 0) return null;
              
              return (
                <section key={key} className="space-y-4">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    {sectionTitles[key] || key}
                  </h3>
                  <div className="space-y-4 text-zinc-400">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3 text-[14px] sm:text-[15px] leading-relaxed">
                        <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                        <div>{parseHighlights(item)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
}
