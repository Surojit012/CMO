import { NextRequest, NextResponse } from "next/server";
import { isValidSwapPair } from "@/lib/arc/tokens";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { tokenIn, tokenOut, amountIn, userAddress } = body;

  // ── Field presence ───────────────────────────────────────────────────────
  if (!tokenIn || !tokenOut || !amountIn || !userAddress) {
    return NextResponse.json(
      { error: "Missing required fields: tokenIn, tokenOut, amountIn, userAddress" },
      { status: 400 }
    );
  }

  // ── Token whitelist ───────────────────────────────────────────────────────
  if (!["USDC", "EURC"].includes(tokenIn as string)) {
    return NextResponse.json(
      { error: `Invalid tokenIn "${tokenIn}". Only USDC and EURC are supported on Arc Testnet.` },
      { status: 400 }
    );
  }

  if (!["USDC", "EURC"].includes(tokenOut as string)) {
    return NextResponse.json(
      { error: `Invalid tokenOut "${tokenOut}". Only USDC and EURC are supported on Arc Testnet.` },
      { status: 400 }
    );
  }

  // ── Same-token guard ──────────────────────────────────────────────────────
  if (tokenIn === tokenOut) {
    return NextResponse.json(
      { error: "tokenIn and tokenOut must be different." },
      { status: 400 }
    );
  }

  // ── Valid pair check ──────────────────────────────────────────────────────
  if (!isValidSwapPair(tokenIn as string, tokenOut as string)) {
    return NextResponse.json(
      {
        error: `Unsupported pair: ${tokenIn} → ${tokenOut}. Arc Testnet only supports USDC ↔ EURC.`,
      },
      { status: 400 }
    );
  }

  // ── Amount validation ─────────────────────────────────────────────────────
  const parsedAmount = parseFloat(amountIn as string);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "amountIn must be a positive number." },
      { status: 400 }
    );
  }

  // ── Address format ────────────────────────────────────────────────────────
  if (!/^0x[0-9a-fA-F]{40}$/.test(userAddress as string)) {
    return NextResponse.json(
      { error: "userAddress must be a valid Ethereum address (0x…)." },
      { status: 400 }
    );
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  console.log(
    `[Swap Attempt] ${new Date().toISOString()} | ${userAddress} | ${amountIn} ${tokenIn} → ${tokenOut}`
  );

  return NextResponse.json({
    validated: true,
    message:
      "Params validated. Proceed with client-side execution via executeSwap().",
    params: { tokenIn, tokenOut, amountIn, userAddress },
  });
}
