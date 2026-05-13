"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "@/components/ThemeProvider";

type ProvidersProps = {
  children: React.ReactNode;
};

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] }
  }
};

export function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  if (!appId || appId === "your_privy_app_id") {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet", "google"],
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        embeddedWallets: {
          ethereum: {
             createOnLogin: "all-users"
          }
        },
        appearance: {
          theme: "dark",
          accentColor: "#676FFF"
        }
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </PrivyProvider>
  );
}
