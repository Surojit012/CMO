"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, RefreshCcw } from "lucide-react";
import { getWalletBalanceWithMeta } from "@/lib/arc-payment";

type FundWalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  address: string;
  requiredAmount: number;
};

export function FundWalletModal({ isOpen, onClose, onSuccess, address, requiredAmount }: FundWalletModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [fundedSuccess, setFundedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll for balance
  useEffect(() => {
    if (!isOpen || !address || fundedSuccess) return;

    let isChecking = false;
    const checkBalance = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await getWalletBalanceWithMeta(address);
        const numBalance = parseFloat(res.formattedBalance);
        setBalance(numBalance);
        
        if (numBalance >= requiredAmount) {
          setFundedSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (e) {
        // silent
      } finally {
        isChecking = false;
      }
    };

    checkBalance();
    const interval = setInterval(checkBalance, 10000);
    return () => clearInterval(interval);
  }, [isOpen, address, requiredAmount, fundedSuccess, onSuccess]);

  if (!isOpen || !mounted) return null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>

        {fundedSuccess ? (
          <div className="space-y-4 py-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Wallet Funded!</h3>
            <p className="text-sm text-zinc-400">Your plan has been activated.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white">Fund Your Wallet</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                You need <strong className="text-white">${requiredAmount} USDC</strong> to start this plan. 
                Your current balance is <strong className="text-white">${balance !== null ? balance.toFixed(2) : "..."}</strong>.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <ol className="list-decimal list-inside space-y-4 text-sm font-medium text-zinc-300 marker:text-zinc-600">
                <li>
                  Go to{" "}
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline underline-offset-2 hover:text-zinc-300 transition"
                  >
                    faucet.circle.com
                  </a>
                </li>
                <li>Select <strong>Arc Testnet</strong></li>
                <li className="flex flex-col gap-2">
                  <span>Paste your wallet address:</span>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-zinc-900 p-2">
                    <span className="mr-2 truncate font-mono text-[10px] text-zinc-400">{address || "Loading..."}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded-md bg-white/[0.05] p-1.5 transition-colors hover:bg-white/[0.1] text-zinc-300 hover:text-white"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>}
                    </button>
                  </div>
                </li>
                <li>Request testnet USDC</li>
              </ol>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 py-2.5 rounded-lg border border-emerald-500/20">
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
              Polling balance automatically...
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
