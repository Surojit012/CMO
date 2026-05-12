"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePrivy, useToken, useWallets } from "@privy-io/react-auth";

import {
  ARC_PAYMENT_DEBUG,
  getRemainingFreeAnalyses,
  getWalletBalanceWithMeta
} from "@/lib/arc-payment";

const FREE_ANALYSIS_LIMIT = 3;

export function WalletPanel() {
  const { ready, authenticated } = usePrivy();
  const { getAccessToken } = useToken();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState("0.00");
  const [balanceSymbol, setBalanceSymbol] = useState("USDC");
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [freeAnalyses, setFreeAnalyses] = useState(0);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [fundedSuccess, setFundedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wallet = wallets?.[0];
  const address = wallet?.address;
  const walletReady = Boolean(address);
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet";
  // Used only for UI copy/disabled states.
  const needsFunding = parseFloat(balance) < 5;
  const statusLabel = freeAnalyses > 0 ? (freeAnalyses + " FREE TRIALS REMAINING") : "Pay  per analysis";
  const statusDotClass = freeAnalyses > 0 ? "bg-green-500" : "bg-zinc-900";

  async function refreshStats(manual = false, overrideBalance?: string, overrideFreeAnalyses?: number) {
    if (!address) return;

    if (manual) {
      setIsRefreshing(true);
    }

    try {
      if (overrideBalance) {
        setBalance(overrideBalance);
        setBalanceSymbol("USDC");
        setLastUpdatedAt(new Date().toISOString());
        setBalanceError(null);
      } else {
        const balanceResult = await getWalletBalanceWithMeta(address);
        console.log("[WalletPanel] Balance fetch result:", {
          formatted: balanceResult.formattedBalance,
          raw: balanceResult.rawBalance,
          decimals: balanceResult.decimals,
          symbol: balanceResult.symbol,
          error: balanceResult.error ?? "none",
          timestamp: balanceResult.lastUpdatedAt
        });
        setBalance(balanceResult.formattedBalance);
        setBalanceSymbol(balanceResult.symbol || "USDC");
        setLastUpdatedAt(balanceResult.lastUpdatedAt);
        setBalanceError(balanceResult.error ?? null);
      }

      if (typeof overrideFreeAnalyses === "number") {
        setFreeAnalyses(overrideFreeAnalyses);
        setStatsError(null);
      } else {
        const token = await getAccessToken();
        const [freeResult, historyResult] = await Promise.allSettled([
          getRemainingFreeAnalyses(address),
          fetch("/api/history", {
            headers: token ? { Authorization: "Bearer " + token } : undefined
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch history");
            }

            const data = await response.json();
            return Array.isArray(data.savedReports) ? data.savedReports : [];
          })
        ]);

        const chainRemaining = freeResult.status === "fulfilled" ? freeResult.value : null;
        const inferredRemaining = historyResult.status === "fulfilled"
          ? Math.max(0, FREE_ANALYSIS_LIMIT - historyResult.value.filter((report: { type?: string }) => report.type === "analysis").length)
          : null;

        if (chainRemaining !== null && inferredRemaining !== null) {
          setFreeAnalyses(Math.min(chainRemaining, inferredRemaining));
          setStatsError(null);
        } else if (chainRemaining !== null) {
          setFreeAnalyses(chainRemaining);
          setStatsError(null);
        } else if (inferredRemaining !== null) {
          setFreeAnalyses(inferredRemaining);
          setStatsError(null);
        } else {
          setStatsError("Usage stats temporarily unavailable.");
        }
      }
    } catch (e) {
      console.error(e);
      setBalanceError("Couldn’t refresh balance. Retry.");
    } finally {
      if (manual) {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    if (!ready || !authenticated || !address) return;

    void refreshStats();
    const interval = setInterval(() => {
      void refreshStats();
    }, 15000);

    const handleRefreshEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const newBalance = detail.newBalance as string | undefined;
      const remaining = detail.remaining as number | undefined;
      void refreshStats(true, newBalance, remaining);
    };
    window.addEventListener("refresh-wallet-stats", handleRefreshEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-wallet-stats", handleRefreshEvent);
    };
  }, [ready, authenticated, address]);

  useEffect(() => {
    if (showFundModal) {
      const currentBal = parseFloat(balance);
      if (initialBalance === null) {
        setInitialBalance(currentBal);
      } else if (currentBal > initialBalance) {
        setFundedSuccess(true);
        const timer = setTimeout(() => {
          setShowFundModal(false);
          setFundedSuccess(false);
          setInitialBalance(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setInitialBalance(null);
      setFundedSuccess(false);
    }
  }, [balance, showFundModal, initialBalance]);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowFundModal(true);
      setIsDesktopExpanded(true);
      setIsMobileSheetOpen(true);
    };

    window.addEventListener("open-fund-modal", handleOpenModal);
    return () => window.removeEventListener("open-fund-modal", handleOpenModal);
  }, []);

  if (!ready || !authenticated) return null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openFundModal = () => {
    setShowFundModal(true);
  };

  const refreshButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void refreshStats(true);
      }}
      disabled={isRefreshing}
      title="Refresh wallet balance"
      className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={isRefreshing ? "animate-spin" : ""}
      >
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    </button>
  );

  const walletDetailCard = (
    <div className="w-full sm:w-[360px] rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusDotClass}`} />
          <p className="text-sm font-semibold text-zinc-900">{statusLabel}</p>
        </div>
        {freeAnalyses > 0 && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {freeAnalyses} / {FREE_ANALYSIS_LIMIT} free
          </p>
        )}
      </div>
      {freeAnalyses > 0 && (
        <p className="mb-3 text-[11px] font-medium text-zinc-500">Trial never resets</p>
      )}

      <div className="mb-3 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-zinc-900">Market Audit</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">$15 USDC per report</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">No free tier</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">Balance</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {balance} {balanceSymbol}
          </p>
          {refreshButton}
        </div>
        {needsFunding ? (
          <p className="mt-1 text-[11px] text-amber-600">You need at least $5 USDC to continue.</p>
        ) : null}
        {balanceError ? <p className="mt-1 text-[11px] text-amber-600">{balanceError}</p> : null}
        {lastUpdatedAt ? (
          <p className="mt-1 text-[11px] text-zinc-500">Updated: {new Date(lastUpdatedAt).toLocaleTimeString()}</p>
        ) : null}
        {statsError ? <p className="mt-1 text-[11px] text-zinc-500">{statsError}</p> : null}
      </div>

      {walletReady ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200/70 bg-white p-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">{shortAddress}</span>
          <button
            onClick={handleCopy}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100"
            title="Copy address"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={copied ? "text-green-500" : "text-zinc-500"}
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3">
          <p className="text-sm font-medium text-zinc-700">Initializing wallet...</p>
          <p className="mt-1 text-xs text-zinc-500">We’re preparing your wallet address for funding.</p>
        </div>
      )}

      {needsFunding ? (
        <button
          onClick={openFundModal}
          className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Fund Wallet
        </button>
      ) : null}
      {needsFunding ? (
        <p className="mt-2 text-center text-[11px] font-medium text-zinc-500">
          You need at least $5 USDC to continue.
        </p>
      ) : null}
      <details className="mt-2 rounded-lg bg-zinc-50 px-2 py-1 text-[10px] text-zinc-500">
        <summary className="cursor-pointer select-none">Debug details</summary>
        <p className="mt-1 break-all">Token: {ARC_PAYMENT_DEBUG.usdcAddress}</p>
        <p className="break-all">RPC: {ARC_PAYMENT_DEBUG.rpcUrl}</p>
      </details>

    </div>
  );

  return (
    <>
      <div className="relative z-40 hidden sm:block">
        <div>
          <div
            onClick={() => setIsDesktopExpanded((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-white/90 ring-1 ring-zinc-200/80 px-3 py-1.5 text-xs text-zinc-800 shadow-sm backdrop-blur hover:bg-white transition flex-shrink-0 sm:gap-3 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
            <span className="font-semibold text-zinc-900 hidden md:inline">
              {freeAnalyses > 0 ? `${freeAnalyses} free analyses left` : "$1.35 Analysis · $15 Audit"}
            </span>
            <span className="font-semibold text-zinc-900 md:hidden">
              {freeAnalyses > 0 ? `${freeAnalyses} free` : "Wallet"}
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              {Number(balance).toFixed(2)} {balanceSymbol}
              {refreshButton}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${isDesktopExpanded ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div
            className={`absolute right-0 top-full origin-top-right transition duration-200 ${
              isDesktopExpanded
                ? "mt-2 scale-100 opacity-100"
                : "pointer-events-none mt-0 scale-95 opacity-0"
            }`}
          >
            {walletDetailCard}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-44 right-3 z-[60] sm:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSheetOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur"
        >
          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
          Wallet
          {freeAnalyses > 0 && <span className="text-[10px] text-zinc-500">{freeAnalyses} free</span>}
        </button>
      </div>

      {mounted && isMobileSheetOpen ? createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/30 sm:hidden"
          onClick={() => setIsMobileSheetOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-zinc-200 bg-white p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">Wallet</p>
              <button
                onClick={() => setIsMobileSheetOpen(false)}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
            {walletDetailCard}
          </div>
        </div>,
        document.body
      ) : null}

      {mounted && showFundModal ? createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowFundModal(false)}
        >
          <div
            className="w-full max-w-sm space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {fundedSuccess ? (
              <div className="space-y-4 py-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-green-500">Wallet funded! ✅</h3>
                <p className="text-sm text-zinc-500">You are ready to run advanced analyses.</p>
              </div>
            ) : walletReady ? (
              <>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900">Fund Your Wallet</h3>
                  <p className="mt-1 text-sm text-zinc-500">Follow these steps to get free testnet USDC:</p>
                </div>

                <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm font-medium text-zinc-800 marker:text-zinc-500">
                    <li>
                      Go to{" "}
                      <a
                        href="https://faucet.circle.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 transition hover:underline"
                      >
                        faucet.circle.com
                      </a>
                    </li>
                    <li>
                      Select <strong>Arc Testnet</strong>
                    </li>
                    <li className="mt-1 flex flex-col gap-2">
                      <span>Paste your wallet address:</span>
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2">
                        <span className="mr-2 truncate font-mono text-[10px] sm:text-[11px]">{address}</span>
                        <button
                          onClick={handleCopy}
                          className="shrink-0 rounded-md bg-zinc-100 p-1.5 transition-colors hover:bg-zinc-200"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                        </button>
                      </div>
                    </li>
                    <li>Request testnet USDC</li>
                    <li>Return here. Balance updates automatically.</li>
                  </ol>
                </div>

                <button
                  onClick={() => setShowFundModal(false)}
                  className="w-full rounded-xl border border-transparent py-3 font-medium text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
                >
                  Close
                </button>

                <div className="rounded-md bg-zinc-50 py-2.5 text-center text-xs font-medium">
                  <span className="flex items-center justify-center gap-2 text-orange-500">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-spin"
                    >
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    </svg>
                    Polling balance every 15s...
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900">Initializing wallet...</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    We’re preparing your wallet address. Once it appears, you can fund it from the Arc faucet.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-500">
                    If this takes too long, close this modal and click <strong>Fund Wallet</strong> again.
                  </p>
                </div>
                <button
                  onClick={() => setShowFundModal(false)}
                  className="w-full rounded-xl border border-transparent py-3 font-medium text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
