import type { GrowthResponse } from "./types";

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSection(markdown: string, headings: string[]) {
  for (const heading of headings) {
    const pattern = new RegExp(
      `(?:##|#)\\s+${escapeRegExp(heading)}\\s*([\\s\\S]*?)(?=\\n(?:##|#)\\s+|$)`,
      "i"
    );
    const match = markdown.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    return match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^(?:[-*+]|\d+\.)\s/.test(line))
      .map((line) => line.replace(/^(?:[-*+]|\d+\.)\s+/, "").trim())
      .filter(Boolean);
  }

  return [];
}

export function parseGrowthMarkdown(markdown: string): GrowthResponse {
  return {
    criticalIssues: extractSection(markdown, ["🚨 Critical Issues", "Critical Issues"]),
    growthStrategy: extractSection(markdown, ["🎯 Growth Strategy", "Growth Strategy"]),
    viralHooks: extractSection(markdown, ["🪝 Viral Hooks", "Viral Hooks"]),
    seoOpportunities: extractSection(markdown, ["🔍 SEO Opportunities", "SEO Opportunities"]),
    conversionFixes: extractSection(markdown, ["⚡ Conversion Fixes", "Conversion Fixes"]),
    distributionPlan: extractSection(markdown, ["📢 Distribution Plan", "Distribution Plan"]),
    redditOpportunities: extractSection(markdown, ["🔴 Reddit Opportunities", "Reddit Opportunities"]),
    unfairAdvantage: extractSection(markdown, ["💡 Unfair Advantage", "Unfair Advantage"])
  };
}
