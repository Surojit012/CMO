/**
 * lib/arc/hooks/useSwap.ts
 * React hook — connects the UI to the Arc swap backend.
 *
 * USAGE:
 *   const { swap, getEstimate, estimate, result, isLoading, error } = useSwap();
 *
 *   // On amount change:
 *   getEstimate("USDC", "EURC", "10.00");
 *
 *   // On swap button click:
 *   swap("USDC", "EURC", "10.00");
 */

"use client";

import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { executeSwap } from "@/lib/arc/swap";
import { ARC_CHAIN_ID } from "@/lib/arc/tokens";
import type { SwapToken, SwapResult, SwapEstimate } from "@/lib/arc/swap";

export function useSwap() {
  const { wallets } = useWallets();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SwapResult | null>(null);
  const [estimate, setEstimate] = useState<SwapEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // getEstimate — calls the /api/swap/quote GET endpoint.
  // Lightweight, wallet-free, triggered on every amount keypress.
  // ─────────────────────────────────────────────────────────────────────────
  const getEstimate = useCallback(
    async (tokenIn: SwapToken, tokenOut: SwapToken, amountIn: string) => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setEstimate(null);
        return;
      }

      try {
        const params = new URLSearchParams({ tokenIn, tokenOut, amountIn });
        const res = await fetch(`/api/swap/quote?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn("[useSwap] Quote error:", body);
          return;
        }

        const data: SwapEstimate & Record<string, unknown> = await res.json();
        setEstimate({
          amountOut: data.amountOut,
          rate: data.rate,
          fees: data.fees,
          priceImpact: data.priceImpact as string | undefined,
        });
      } catch (err) {
        console.error("[useSwap] getEstimate error:", err);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // swap — validates server-side first, then executes client-side with signing
  // ─────────────────────────────────────────────────────────────────────────
  const swap = useCallback(
    async (tokenIn: SwapToken, tokenOut: SwapToken, amountIn: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        // 1. Get connected wallet from Privy
        const wallet = wallets[0];
        if (!wallet) throw new Error("No wallet connected. Please connect a wallet first.");

        // 2. Ensure the wallet is on Arc Testnet before submitting
        await wallet.switchChain(ARC_CHAIN_ID);

        // 3. Server-side validation (does NOT execute — just validates & logs)
        const validationRes = await fetch("/api/swap/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenIn,
            tokenOut,
            amountIn,
            userAddress: wallet.address,
          }),
        });

        const validationBody = await validationRes.json();
        if (!validationRes.ok || !validationBody.validated) {
          throw new Error(validationBody.error ?? "Server validation failed.");
        }

        // 4. Get the EIP-1193 provider from Privy — signing happens HERE
        const provider = await wallet.getEthereumProvider();
        const userAddress = wallet.address;

        // 5. Execute swap client-side (wallet prompt will appear to user)
        const swapResult = await executeSwap({
          tokenIn,
          tokenOut,
          amountIn,
          walletProvider: provider,
          userAddress,
        });

        setResult(swapResult);

        if (!swapResult.success) {
          setError(swapResult.error ?? "Swap failed.");
        }
      } catch (err: any) {
        const message = err?.message ?? "Unexpected error during swap.";
        setError(message);
        setResult({ success: false, error: message, tokenIn, tokenOut, amountIn });
      } finally {
        setIsLoading(false);
      }
    },
    [wallets]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // reset — clear state between swaps
  // ─────────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setEstimate(null);
  }, []);

  return {
    swap,
    getEstimate,
    reset,
    estimate,
    result,
    isLoading,
    error,
  };
}
