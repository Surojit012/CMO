import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — CMO",
  description:
    "Learn how CMO works — from the 7-agent architecture to the Market Audit engine. API docs, agent details, and integration guides.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
