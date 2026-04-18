import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — CMO",
  description:
    "Insights on AI-powered growth, marketing automation, and startup strategy from the CMO team.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
