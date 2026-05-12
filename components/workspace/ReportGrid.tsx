"use client";

import type { GrowthResponse, GrowthSection, ActionType, GeneratedAssetMap } from "@/lib/types";

function parseHighlights(text: string) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-zinc-200">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

type ReportCardProps = {
  label: string;
  items: string[];
  className?: string;
};

function ReportCard({ label, items, className = "" }: ReportCardProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-5 animate-card-entrance ${className}`}>
      <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-600 mb-4">{label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2.5 text-sm text-zinc-400 leading-relaxed">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
            <div className="min-w-0">{parseHighlights(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ReportGridProps = {
  content: GrowthResponse;
  url?: string;
  analysisId: string;
  onAction?: (analysisId: string, section: GrowthSection, sourceText: string, actionType: ActionType) => void;
  onViewOutreach?: () => void;
  generatedAssets?: GeneratedAssetMap;
  actionPendingKeys?: string[];
};

export function ReportGrid({ content, url, analysisId, onViewOutreach }: ReportGridProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      {url && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1">{url}</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">Analysis complete</span>
          </div>
        </div>
      )}

      {/* Critical Issues — full width */}
      <ReportCard label="Critical Issues" items={content.criticalIssues} className="stagger-1 border-red-500/10" />

      {/* Two column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard label="Growth Strategy" items={content.growthStrategy} className="stagger-2" />
        <ReportCard label="Viral Hooks" items={content.viralHooks} className="stagger-3" />
        <ReportCard label="SEO Opportunities" items={content.seoOpportunities} className="stagger-4" />
        <ReportCard label="Conversion Fixes" items={content.conversionFixes} className="stagger-5" />
        <ReportCard label="Distribution Plan" items={content.distributionPlan} className="stagger-6" />
        <ReportCard label="Reddit Opportunities" items={content.redditOpportunities} className="stagger-7" />
      </div>

      {/* Unfair Advantage — full width */}
      <ReportCard label="Unfair Advantage" items={content.unfairAdvantage} className="stagger-8" />

      {/* Outreach CTA */}
      {onViewOutreach && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-1">Take the next step</p>
            <p className="text-xs text-zinc-600">Generate a complete community outreach plan based on this analysis.</p>
          </div>
          <button onClick={onViewOutreach} className="shrink-0 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15 transition">
            Generate Outreach Plan →
          </button>
        </div>
      )}
    </div>
  );
}
