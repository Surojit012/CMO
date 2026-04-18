import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — CMO",
  description:
    "Simple, transparent pricing. 3 free analyses, then $5 USDC per analysis. No subscriptions, no credit card required.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
