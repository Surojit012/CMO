import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — CMO",
  description: "Set up your AI growth team in 60 seconds.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
