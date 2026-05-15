"use client";

import { useState, FormEvent } from "react";
import { AgentSelector, getAgentPrice, getAllAgentKeys } from "./AgentSelector";
import type { ReportType } from "@/lib/types";
import { REPORT_TYPE_LABELS, REPORT_TYPE_PRICES } from "@/lib/types";

type EmptyStateProps = {
  activeTab: ReportType;
  compareMode: boolean;
  onCompareModeChange: (mode: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  compareUrl: string;
  onCompareUrlChange: (value: string) => void;
  onSubmit: (url: string) => void;
  onCompareSubmit: () => void;
  onButtonClick?: () => void;
  buttonLabel: string;
  disabled: boolean;
  buttonLoading: boolean;
  showPaymentUpsell: boolean;
  hasSufficientBalance: boolean;
  usdcBalance: string;
  walletAddress?: string;
  onFundWallet: () => void;
  isFundingSetup: boolean;
  freeRemaining: number | null;
  /* Agent selector */
  selectedAgents: string[];
  onAgentSelectionChange: (agents: string[]) => void;
  activePlan: string;
};

/** Report type specific hero content */
const REPORT_HEROES: Record<ReportType, { title: string; subtitle: string; placeholder: string }> = {
  "token-narrative": {
    title: "Audit your protocol's story.",
    subtitle: "Narrative clarity, positioning gaps, and market meta alignment.",
    placeholder: "https://your-protocol.xyz",
  },
  "competitor-battle-card": {
    title: "Build your battle card.",
    subtitle: "Head-to-head competitive intelligence against any protocol.",
    placeholder: "Your protocol — e.g., https://uniswap.org",
  },
  "community-health": {
    title: "Check community pulse.",
    subtitle: "Sentiment analysis, pain points, and health score from Reddit.",
    placeholder: "https://your-protocol.xyz",
  },
  "launch-readiness": {
    title: "Pre-launch readiness check.",
    subtitle: "Full-spectrum audit: narrative, positioning, community, SEO, copy.",
    placeholder: "https://your-protocol.xyz",
  },
  "weekly-pulse": {
    title: "Get your weekly pulse.",
    subtitle: "Quick-scan: community sentiment, competitor moves, Reddit chatter.",
    placeholder: "https://your-protocol.xyz",
  },
};

export function EmptyState({
  activeTab,
  compareMode,
  onCompareModeChange,
  inputValue,
  onInputChange,
  compareUrl,
  onCompareUrlChange,
  onSubmit,
  onCompareSubmit,
  onButtonClick,
  buttonLabel,
  disabled,
  buttonLoading,
  showPaymentUpsell,
  hasSufficientBalance,
  usdcBalance,
  walletAddress,
  onFundWallet,
  isFundingSetup,
  freeRemaining,
  selectedAgents,
  onAgentSelectionChange,
  activePlan,
}: EmptyStateProps) {
  const price = getAgentPrice(selectedAgents);
  const hero = REPORT_HEROES[activeTab];
  const reportPrice = REPORT_TYPE_PRICES[activeTab];
  const needsCompetitor = activeTab === "competitor-battle-card";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    if (needsCompetitor && compareUrl.trim()) {
      onCompareSubmit();
    } else {
      onSubmit(inputValue.trim());
    }
  };

  // Build dynamic CTA label
  let ctaLabel = buttonLabel;
  const isSubscribed = ["weekly", "monthly", "yearly"].includes(activePlan);

  if (showPaymentUpsell) {
    if (isSubscribed) {
      ctaLabel = `Run ${REPORT_TYPE_LABELS[activeTab]} (Included)`;
    } else if (hasSufficientBalance) {
      ctaLabel = `Run — ${reportPrice} USDC`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="w-full max-w-[560px] space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            {hero.title}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
            {hero.subtitle}
          </p>
          <span className="inline-block rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-[11px] font-mono text-zinc-400">
            {reportPrice} USDC per report
          </span>
        </div>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              inputMode="url"
              placeholder={hero.placeholder}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={disabled}
              className="w-full h-12 sm:h-14 rounded-full bg-zinc-900/60 border border-white/[0.06] px-5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Competitor URL — Battle Card only */}
          {needsCompetitor && (
            <div className="space-y-2 animate-slide-up">
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  VS
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <input
                type="text"
                inputMode="url"
                placeholder="Competitor — e.g., https://competitor-protocol.xyz"
                value={compareUrl}
                onChange={(e) => onCompareUrlChange(e.target.value)}
                disabled={disabled}
                className="w-full h-12 sm:h-14 rounded-full bg-zinc-900/60 border border-white/[0.06] px-5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition disabled:opacity-50"
              />
            </div>
          )}

          {/* Agent Selector */}
          <div className="pt-2">
            <AgentSelector
              selectedAgents={selectedAgents}
              onSelectionChange={onAgentSelectionChange}
              activePlan={activePlan}
              reportType={activeTab}
            />
          </div>

          {/* Insufficient balance warning */}
          {showPaymentUpsell && !hasSufficientBalance && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center space-y-3 animate-slide-up">
              <p className="text-xs text-zinc-400">
                {freeRemaining === 0
                  ? "You've used your free analyses"
                  : `${REPORT_TYPE_LABELS[activeTab]} requires ${reportPrice} USDC`}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xs text-zinc-600">
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "No wallet"}
                </span>
                <span className="font-mono text-sm text-white font-medium">
                  {usdcBalance} USDC
                </span>
                <button
                  type="button"
                  onClick={onFundWallet}
                  disabled={isFundingSetup}
                  className="rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/15 transition disabled:opacity-50"
                >
                  {isFundingSetup ? "Preparing..." : "Fund Wallet"}
                </button>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            type={onButtonClick ? "button" : "submit"}
            onClick={onButtonClick ? () => onButtonClick() : undefined}
            disabled={disabled || buttonLoading || (!onButtonClick && !inputValue.trim()) || (needsCompetitor && !compareUrl.trim())}
            className="w-full h-12 sm:h-14 rounded-full bg-white text-black text-sm font-semibold transition hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {buttonLoading ? "Processing..." : ctaLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
