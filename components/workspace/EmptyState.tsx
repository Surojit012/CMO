"use client";

import { useState, FormEvent } from "react";
import { AgentSelector, getAgentPrice, getAllAgentKeys } from "./AgentSelector";

type EmptyStateProps = {
  activeTab: "analysis" | "audit";
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
}: EmptyStateProps) {
  const price = getAgentPrice(selectedAgents);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    if (compareMode) {
      onCompareSubmit();
    } else {
      onSubmit(inputValue.trim());
    }
  };

  // Build dynamic CTA label
  let ctaLabel = buttonLabel;
  if (activeTab === "analysis" && !compareMode && showPaymentUpsell && hasSufficientBalance) {
    ctaLabel = `Analyze — ${price.toFixed(2)} USDC`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="w-full max-w-[560px] space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            {activeTab === "audit"
              ? "Deep competitive intelligence."
              : compareMode
              ? "Compare two sites."
              : "Drop in a URL."}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
            {activeTab === "audit"
              ? "$15 USDC per report · AI-powered market intelligence"
              : compareMode
              ? "Enter your site and a competitor. Get a head-to-head battle card."
              : "8 AI agents audit your site and return a growth strategy."}
          </p>
        </div>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              inputMode="url"
              placeholder={
                activeTab === "audit"
                  ? "Enter any website URL to audit..."
                  : compareMode
                  ? "Your site — e.g., https://trycmo.com"
                  : "https://yoursite.com"
              }
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={disabled}
              className="w-full h-12 sm:h-14 rounded-full bg-zinc-900/60 border border-white/[0.06] px-5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Compare mode second input */}
          {compareMode && activeTab === "analysis" && (
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
                placeholder="Competitor — e.g., https://okara.ai"
                value={compareUrl}
                onChange={(e) => onCompareUrlChange(e.target.value)}
                disabled={disabled}
                className="w-full h-12 sm:h-14 rounded-full bg-zinc-900/60 border border-white/[0.06] px-5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition disabled:opacity-50"
              />
            </div>
          )}

          {/* Agent Selector — only for growth analysis, not audit */}
          {activeTab === "analysis" && !compareMode && (
            <div className="pt-2">
              <AgentSelector
                selectedAgents={selectedAgents}
                onSelectionChange={onAgentSelectionChange}
              />
            </div>
          )}

          {/* Compare mode toggle — analysis only */}
          {activeTab === "analysis" && (
            <div className="flex justify-center pt-1">
              <div className="flex items-center rounded-full bg-white/[0.03] border border-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => onCompareModeChange(false)}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${
                    !compareMode
                      ? "bg-white/10 text-white"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => onCompareModeChange(true)}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${
                    compareMode
                      ? "bg-white/10 text-white"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  Compare
                </button>
              </div>
            </div>
          )}

          {/* Insufficient balance warning */}
          {showPaymentUpsell && !hasSufficientBalance && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center space-y-3 animate-slide-up">
              <p className="text-xs text-zinc-400">
                {activeTab === "audit"
                  ? "Market Audits require $15 USDC"
                  : freeRemaining === 0
                  ? "You've used your 3 free analyses"
                  : "Fund your wallet to continue"}
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
            disabled={disabled || buttonLoading || (!onButtonClick && !inputValue.trim())}
            className="w-full h-12 sm:h-14 rounded-full bg-white text-zinc-950 text-sm font-semibold transition hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {buttonLoading ? "Processing..." : ctaLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
