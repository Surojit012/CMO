# Arc Testnet Swap DEX — Backend Documentation

## Network Details

| Property | Value |
|---|---|
| Network | Arc Testnet |
| Chain ID | 5042002 |
| RPC | `https://rpc.testnet.arc.network` |
| Gas currency | USDC |
| Explorer | `https://testnet.arcscan.app` |
| Supported pairs | **USDC ↔ EURC only** |

---

## Install dependencies (run once in CMO-main)

```bash
cd /Users/surojitpvt/Downloads/CMO-main
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2
```

`viem` is already installed (`^2.47.5` in package.json).

---

## Environment variables

Add to `.env.local` (already scaffolded at the bottom of the file):

```
KIT_KEY=your_circle_console_kit_key
NEXT_PUBLIC_KIT_KEY=your_circle_console_kit_key
ARC_EXPLORER=https://testnet.arcscan.app
```

Get a free KIT_KEY at: **https://developers.circle.com → Console → Kit Keys**  
Get test tokens at: **https://faucet.circle.com** (supports Arc Testnet — gives USDC & EURC)

---

## File structure created

```
CMO-main/
├── lib/arc/
│   ├── client.ts          # Arc Testnet viem chain + public client
│   ├── tokens.ts          # Token registry + swap-pair whitelist
│   ├── swap.ts            # Core swap logic (executeSwap, estimateSwap)
│   └── hooks/
│       └── useSwap.ts     # React hook for UI components
└── app/api/swap/
    ├── quote/route.ts     # GET  /api/swap/quote  — price estimate
    └── execute/route.ts   # POST /api/swap/execute — validation layer
```

---

## Architecture

```
UI Component
    │
    ├── getEstimate("USDC","EURC","10") ──► GET /api/swap/quote
    │                                         returns { amountOut, rate, fees }
    │
    └── swap("USDC","EURC","10")
            │
            ├─ 1. wallet.switchChain(5042002)  [Privy]
            ├─ 2. POST /api/swap/execute       [server validates + logs]
            ├─ 3. wallet.getEthereumProvider() [Privy EIP-1193]
            └─ 4. executeSwap()                [client-side, triggers wallet prompt]
                      │
                      └─ kit.swap({ from: { adapter, chain: "Arc_Testnet" }, ... })
                                │
                                └─ Signs + broadcasts on-chain via Circle App Kit
```

**Key invariant:** Private keys never touch the server. All signing happens in the browser via the Privy-provided EIP-1193 provider.

---

## Usage in any UI component

```tsx
import { useSwap } from "@/lib/arc/hooks/useSwap";

export function SwapWidget() {
  const { swap, getEstimate, estimate, result, isLoading, error, reset } = useSwap();

  // On amount input change:
  // getEstimate("USDC", "EURC", "10.00");

  // On swap button click:
  // swap("USDC", "EURC", "10.00");

  return (
    <>
      {estimate && <p>You receive: {estimate.amountOut} EURC ({estimate.rate})</p>}
      {isLoading && <p>Swapping…</p>}
      {result?.success && (
        <a href={result.explorerUrl} target="_blank">View on ArcScan ↗</a>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </>
  );
}
```

---

## Constraints enforced at every layer

- Only `USDC → EURC` and `EURC → USDC` pairs accepted (Arc Testnet limitation)
- Same-token swaps rejected immediately with a clear error
- Amount must be `> 0`
- Wallet must be on Chain ID `5042002` before swap executes (auto-switched via Privy)
- No smart contracts deployed — Circle App Kit handles everything
- No private keys ever stored or transmitted server-side
