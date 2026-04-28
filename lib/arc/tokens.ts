/**
 * lib/arc/tokens.ts
 * Token metadata and swap-pair whitelist for Arc Testnet.
 *
 * Arc Testnet only supports USDC ↔ EURC swaps — this is a hard
 * constraint of the testnet environment and is enforced at every
 * layer (client, server, and hook).
 */

export const ARC_TOKENS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    logoUrl: "/tokens/usdc.svg",
    description: "Circle's USD stablecoin",
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 18,
    logoUrl: "/tokens/eurc.svg",
    description: "Circle's Euro stablecoin",
  },
} as const;

export type ArcToken = keyof typeof ARC_TOKENS;

/**
 * All valid swap pairs on Arc Testnet.
 * Only USDC ↔ EURC is supported.
 */
export const SWAP_PAIRS: [ArcToken, ArcToken][] = [
  ["USDC", "EURC"],
  ["EURC", "USDC"],
];

export const ARC_EXPLORER = "https://testnet.arcscan.app";
export const ARC_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_CHAIN_ID = 5042002;

/**
 * Returns the ArcScan URL for a given transaction hash.
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${ARC_EXPLORER}/tx/${txHash}`;
}

/**
 * Returns true when the given [tokenIn, tokenOut] pair is
 * supported on Arc Testnet.
 */
export function isValidSwapPair(
  tokenIn: string,
  tokenOut: string
): tokenIn is ArcToken {
  return SWAP_PAIRS.some(([a, b]) => a === tokenIn && b === tokenOut);
}
