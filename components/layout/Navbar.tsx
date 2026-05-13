"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Menu, Wallet, ChevronDown, RefreshCw, Copy, Check, ExternalLink } from "lucide-react";

type NavbarProps = {
  userLabel: string;
  balance: string;
  balanceSymbol: string;
  walletAddress?: string;
  freeAnalyses?: number;
  onLogout: () => void;
  onMenuToggle: () => void;
  showMenuButton?: boolean;
  onRefreshBalance?: () => void;
  onFundWallet?: () => void;
  isRefreshing?: boolean;
};

export function Navbar({
  userLabel,
  balance,
  balanceSymbol,
  walletAddress,
  freeAnalyses = 0,
  onLogout,
  onMenuToggle,
  showMenuButton = false,
  onRefreshBalance,
  onFundWallet,
  isRefreshing = false,
}: NavbarProps) {
  const [walletOpen, setWalletOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "No wallet";

  const needsFunding = parseFloat(balance) < 5;
  const balanceNum = Number(balance).toFixed(2);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-[52px] px-4 sm:px-6 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5">
      {/* Left */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em] text-white transition hover:opacity-80 sm:text-[15px]"
        >
          CMO
        </Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Beta
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Wallet Button + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setWalletOpen(!walletOpen)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 border ${
              walletOpen
                ? "bg-white/10 border-white/15 text-white"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-mono">{balanceNum} {balanceSymbol}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${walletOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] origin-top-right transition-all duration-200 ${
              walletOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40">
              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${freeAnalyses > 0 ? "bg-emerald-500" : "bg-zinc-600"}`} />
                  <span className="text-xs font-medium text-zinc-300">
                    {freeAnalyses > 0 ? `${freeAnalyses} free analyses left` : "Pay per analysis"}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Arc Testnet</span>
              </div>

              {/* Balance Card */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 mb-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600 mb-2">Balance</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white font-mono">{balanceNum}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-500">{balanceSymbol}</span>
                    {onRefreshBalance && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRefreshBalance(); }}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition disabled:opacity-40"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      </button>
                    )}
                  </div>
                </div>
                {needsFunding && (
                  <p className="mt-2 text-[11px] text-amber-500/80">Need at least $5 USDC to run analyses</p>
                )}
              </div>

              {/* Wallet Address */}
              {walletAddress && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 mb-3">
                  <span className="font-mono text-xs text-zinc-500 truncate mr-2">{shortAddress}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              {/* Pricing */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 mb-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600 mb-2">Pricing</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Growth Analysis</span>
                    <span className="text-xs font-mono text-zinc-300">$1.35 USDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Market Audit</span>
                    <span className="text-xs font-mono text-zinc-300">$15.00 USDC</span>
                  </div>
                </div>
              </div>

              {/* Fund Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWalletOpen(false);
                  if (onFundWallet) onFundWallet();
                  else window.dispatchEvent(new Event("open-fund-modal"));
                }}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Fund Wallet
              </button>

              {/* Faucet link */}
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition"
              >
                <ExternalLink className="w-3 h-3" />
                Get free testnet USDC
              </a>
            </div>
          </div>
        </div>

        {/* User */}
        <span className="max-w-[100px] truncate text-xs text-zinc-600 hidden sm:inline">
          {userLabel}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
