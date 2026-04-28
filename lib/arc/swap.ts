/**
 * lib/arc/swap.ts
 * Core swap logic for Arc Testnet using Circle's App Kit SDK.
 *
 * KEY ARCHITECTURE DECISIONS:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. No private keys ever touch this file or the server.
 *    Wallet signing happens exclusively client-side via the Privy provider.
 *
 * 2. AppKit is instantiated here (not in client.ts) so KIT_KEY is resolved
 *    at call-time from the runtime environment, not at build time.
 *
 * 3. This module is imported DIRECTLY from client components (useSwap hook).
 *    The API route at app/api/swap/execute/route.ts only validates params —
 *    it cannot receive window.ethereum so it never runs the swap itself.
 *
 * 4. Only USDC ↔ EURC pairs are accepted. Any other pair is rejected early
 *    with a clear error message before the SDK is even called.
 * ─────────────────────────────────────────────────────────────────────────
 */

"use client";

import { createWalletClient, custom } from "viem";
import { arcTestnet } from "./client";
import { isValidSwapPair, getExplorerTxUrl } from "./tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SwapToken = "USDC" | "EURC";

export interface SwapParams {
  /** Token being sold */
  tokenIn: SwapToken;
  /** Token being bought */
  tokenOut: SwapToken;
  /** Human-readable amount, e.g. "10.50" */
  amountIn: string;
  /**
   * EIP-1193 provider injected from the frontend (window.ethereum
   * obtained via Privy's wallet.getEthereumProvider()).
   * Never stored server-side.
   */
  walletProvider: any;
  /** Connected wallet address (0x…) */
  userAddress: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  amountIn: string;
  amountOut?: string;
  tokenIn: SwapToken;
  tokenOut: SwapToken;
  fees?: Array<{ token: string; amount: string; type: string }>;
  error?: string;
}

export interface SwapEstimate {
  amountOut: string;
  priceImpact?: string;
  fees?: Array<{ token: string; amount: string; type: string }>;
  /** Human-readable exchange rate, e.g. "1 USDC = 0.9971 EURC" */
  rate: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the App Kit instance lazily so KIT_KEY is read at runtime. */
function getKit() {
  // Dynamically import to prevent SSR issues with the browser-only SDK
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppKit } = require("@circle-fin/app-kit") as typeof import("@circle-fin/app-kit");
  return new AppKit();
}

/** Returns the viem adapter factory lazily. */
function getViemAdapter() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createViemAdapter } = require("@circle-fin/adapter-viem-v2") as typeof import("@circle-fin/adapter-viem-v2");
  return createViemAdapter;
}

function buildWalletClient(walletProvider: any, userAddress: string) {
  return createWalletClient({
    account: userAddress as `0x${string}`,
    chain: arcTestnet,
    transport: custom(walletProvider),
  });
}

function validateSwapInputs(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
): string | null {
  if (tokenIn === tokenOut) {
    return "Cannot swap a token for itself.";
  }
  if (!isValidSwapPair(tokenIn, tokenOut)) {
    return `Unsupported pair: ${tokenIn} → ${tokenOut}. Arc Testnet only supports USDC ↔ EURC.`;
  }
  const amount = parseFloat(amountIn);
  if (isNaN(amount) || amount <= 0) {
    return "Invalid amount — must be a positive number.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// estimateSwap — get a quote without executing
// ---------------------------------------------------------------------------

/**
 * Calls kit.swap with the configured pair to get a pre-execution quote.
 *
 * Falls back gracefully if the SDK returns no amountOut — this can happen
 * when the App Kit server is temporarily unavailable.
 */
export async function estimateSwap(
  tokenIn: SwapToken,
  tokenOut: SwapToken,
  amountIn: string,
  walletProvider: any,
  userAddress: string
): Promise<SwapEstimate> {
  const validationError = validateSwapInputs(tokenIn, tokenOut, amountIn);
  if (validationError) {
    throw new Error(validationError);
  }

  const kit = getKit();
  const createViemAdapter = getViemAdapter();

  const walletClient = buildWalletClient(walletProvider, userAddress);
  const adapter = createViemAdapter({ walletClient });

  const kitKey = process.env.NEXT_PUBLIC_KIT_KEY || process.env.KIT_KEY;
  if (!kitKey) {
    throw new Error("KIT_KEY is not configured. Add it to .env.local.");
  }

  const estimate = await kit.swap({
    from: { adapter, chain: "Arc_Testnet" },
    tokenIn,
    tokenOut,
    amountIn,
    config: {
      kitKey,
    },
  });

  const amountOut = estimate.amountOut ?? "0";
  const parsedIn = parseFloat(amountIn);
  const parsedOut = parseFloat(amountOut);
  const exchangeRate =
    parsedIn > 0 ? (parsedOut / parsedIn).toFixed(4) : "0.0000";
  const rate = `1 ${tokenIn} = ${exchangeRate} ${tokenOut}`;

  return {
    amountOut,
    fees: estimate.fees as Array<{ token: string; amount: string; type: string }> | undefined,
    rate,
    priceImpact: undefined,
  };
}

// ---------------------------------------------------------------------------
// executeSwap — build wallet client, run swap, return structured result
// ---------------------------------------------------------------------------

/**
 * Executes the swap on-chain.
 *
 * Signing occurs inside this function via the EIP-1193 walletProvider
 * (obtained from Privy's wallet.getEthereumProvider()).
 * No private key is ever read, stored, or transmitted here.
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const { tokenIn, tokenOut, amountIn, walletProvider, userAddress } = params;

  // Early validation — surface clear errors before hitting the SDK
  const validationError = validateSwapInputs(tokenIn, tokenOut, amountIn);
  if (validationError) {
    return { success: false, error: validationError, tokenIn, tokenOut, amountIn };
  }

  const kitKey = process.env.NEXT_PUBLIC_KIT_KEY || process.env.KIT_KEY;
  if (!kitKey) {
    return {
      success: false,
      error: "KIT_KEY is not configured. Add NEXT_PUBLIC_KIT_KEY to .env.local and restart the dev server.",
      tokenIn,
      tokenOut,
      amountIn,
    };
  }

  try {
    const kit = getKit();
    const createViemAdapter = getViemAdapter();

    const walletClient = buildWalletClient(walletProvider, userAddress);
    const adapter = createViemAdapter({ walletClient });

    const result = await kit.swap({
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn,
      config: { kitKey },
    });

    const txHash = result.txHash as string | undefined;

    return {
      success: true,
      txHash,
      explorerUrl: txHash ? getExplorerTxUrl(txHash) : undefined,
      amountIn: (result.amountIn as string | undefined) ?? amountIn,
      amountOut: result.amountOut as string | undefined,
      tokenIn: (result.tokenIn as SwapToken | undefined) ?? tokenIn,
      tokenOut: (result.tokenOut as SwapToken | undefined) ?? tokenOut,
      fees: result.fees as Array<{ token: string; amount: string; type: string }> | undefined,
    };
  } catch (err: any) {
    console.error("[executeSwap] Error:", err);

    // Surface a clean user-facing message while preserving the raw error in logs
    const userMessage =
      err?.code === 4001 || err?.message?.toLowerCase().includes("user rejected")
        ? "Transaction rejected by user."
        : err?.message ?? "Swap failed. Please try again.";

    return {
      success: false,
      error: userMessage,
      tokenIn,
      tokenOut,
      amountIn,
    };
  }
}
