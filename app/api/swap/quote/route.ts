/**
 * app/api/swap/quote/route.ts
 * GET /api/swap/quote
 *
 * Lightweight price estimation endpoint — called on every keystroke
 * in the swap amount input. No wallet required, no transaction.
 *
 * Query params:
 *   tokenIn   — "USDC" | "EURC"
 *   tokenOut  — "USDC" | "EURC"
 *   amountIn  — e.g. "10.00"
 *
 * Returns:
 *   { tokenIn, tokenOut, amountIn, amountOut, rate, fees, note }
 *
 * NOTE: The rate here uses a static 0.3% fee estimate (matching typical
 * Circle App Kit fees). When you wire in a live kit.swap dry-run, replace
 * the calculation block with the SDK call.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidSwapPair } from "@/lib/arc/tokens";

const SWAP_FEE_RATE = 0.003; // 0.3%

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tokenIn = searchParams.get("tokenIn");
  const tokenOut = searchParams.get("tokenOut");
  const amountIn = searchParams.get("amountIn");

  // ── Validation ──────────────────────────────────────────────────────────
  if (!tokenIn || !tokenOut || !amountIn) {
    return NextResponse.json(
      { error: "Missing required params: tokenIn, tokenOut, amountIn" },
      { status: 400 }
    );
  }

  if (!["USDC", "EURC"].includes(tokenIn) || !["USDC", "EURC"].includes(tokenOut)) {
    return NextResponse.json(
      { error: "Invalid tokens. Arc Testnet only supports USDC and EURC." },
      { status: 400 }
    );
  }

  if (tokenIn === tokenOut) {
    return NextResponse.json(
      { error: "tokenIn and tokenOut must be different." },
      { status: 400 }
    );
  }

  if (!isValidSwapPair(tokenIn, tokenOut)) {
    return NextResponse.json(
      {
        error: `Unsupported pair: ${tokenIn} → ${tokenOut}. Arc Testnet only supports USDC ↔ EURC.`,
      },
      { status: 400 }
    );
  }

  const parsedAmount = parseFloat(amountIn);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "amountIn must be a positive number." },
      { status: 400 }
    );
  }

  // ── Quote calculation ────────────────────────────────────────────────────
  // USDC and EURC are both USD-adjacent stablecoins (~1:1 on Arc Testnet).
  // The 0.3% fee is a conservative estimate matching Circle's typical rates.
  // Replace with a live kit.swap dry-run when the SDK exposes that API.
  const feeAmount = parsedAmount * SWAP_FEE_RATE;
  const amountOut = (parsedAmount - feeAmount).toFixed(6);

  const exchangeRate = (1 - SWAP_FEE_RATE).toFixed(4);
  const rate =
    tokenIn === "USDC"
      ? `1 USDC ≈ ${exchangeRate} EURC`
      : `1 EURC ≈ ${exchangeRate} USDC`;

  return NextResponse.json({
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    rate,
    fees: [
      {
        token: tokenIn,
        amount: feeAmount.toFixed(6),
        type: "provider",
      },
    ],
    note: "Estimated rate. Final amount confirmed on execution.",
  });
}
