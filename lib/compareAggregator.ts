import { callFireworks } from "@/lib/ai-router";
import type { SpecializedAgentOutputs } from "./agents";
import type { CriticResult, CompareScores } from "./types";

const COMPARE_MAX_TOKENS = 3500;
const COMPARE_TEMPERATURE = 0.7;

const COMPARE_SYSTEM_PROMPT = `You are a ruthless competitive intelligence analyst. You have received full marketing analysis reports for two competing products. Your job is to produce a clear, opinionated head-to-head battle card. Do not be diplomatic — pick a winner for each dimension and explain why. Format your output in clearly labeled sections. Be specific, cite actual details from the analyses, never be generic.

You MUST structure your response with exactly these sections:

## 🏆 Executive Summary
Who wins overall and why. 2-3 sentences. Be ruthlessly honest.

## 📊 Head-to-Head Scores
Score each dimension 1-10 for BOTH sites. Format as a table:
| Dimension | Site 1 | Site 2 | Winner |
|---|---|---|---|
| Messaging Clarity | X | Y | Site N |
| SEO Strength | X | Y | Site N |
| Conversion Optimization | X | Y | Site N |
| Distribution Strategy | X | Y | Site N |
| Community Presence | X | Y | Site N |
| Overall Growth Potential | X | Y | Site N |

## 💪 Your Strengths (Site 1)
What Site 1 does better — 3-5 bullet points. Reference actual website elements.

## 🎯 Competitor Strengths (Site 2)
What Site 2 does better — 3-5 bullet points. Reference actual website elements.

## 🚨 Critical Gaps
What Site 1 must fix immediately to close the gap. Max 3 bullets, each with an exact action.

## 💡 Your Unfair Advantage
ONE thing that makes Site 1 uniquely defensible against Site 2. Be specific.

## ⚔️ Battle Plan
3 specific actions to take THIS WEEK to outperform Site 2. Each must include:
- The exact action
- Which platform or channel
- Why it targets Site 2's weakness specifically`;

function truncateContent(content: string, maxWords: number): string {
  const words = content.split(/\s+/);
  if (words.length <= maxWords) return content;
  return words.slice(0, maxWords).join(" ") + " [truncated]";
}

export function parseCompareScores(markdown: string): CompareScores {
  const defaultScore = { site1: 5, site2: 5 };

  function extractScore(dimension: string): { site1: number; site2: number } {
    // Match table row: | Dimension | X | Y | ... |
    const pattern = new RegExp(
      `\\|\\s*${dimension}\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)\\s*\\|`,
      "i"
    );
    const match = markdown.match(pattern);
    if (match) {
      return {
        site1: Math.min(10, Math.max(1, parseInt(match[1], 10))),
        site2: Math.min(10, Math.max(1, parseInt(match[2], 10)))
      };
    }
    return defaultScore;
  }

  return {
    messagingClarity: extractScore("Messaging Clarity"),
    seoStrength: extractScore("SEO Strength"),
    conversionOptimization: extractScore("Conversion Optimization"),
    distributionStrategy: extractScore("Distribution Strategy"),
    communityPresence: extractScore("Community Presence"),
    overallGrowthPotential: extractScore("Overall Growth Potential")
  };
}

export function determineWinner(scores: CompareScores): "site1" | "site2" | "tie" {
  let site1Total = 0;
  let site2Total = 0;

  for (const key of Object.keys(scores) as (keyof CompareScores)[]) {
    site1Total += scores[key].site1;
    site2Total += scores[key].site2;
  }

  if (site1Total > site2Total) return "site1";
  if (site2Total > site1Total) return "site2";
  return "tie";
}

export async function compareAggregator(
  site1Content: string,
  site2Content: string,
  site1Agents: SpecializedAgentOutputs,
  site2Agents: SpecializedAgentOutputs,
  site1Critic: CriticResult,
  site2Critic: CriticResult,
  productName1: string,
  productName2: string
): Promise<string> {
  const sections = [
    `=== SITE 1: ${productName1} ===`,
    "",
    "Website Content (truncated):",
    truncateContent(site1Content, 800),
    "",
    "Strategist:", site1Agents.strategist,
    "Copywriter:", site1Agents.copywriter,
    "SEO:", site1Agents.seo,
    "Conversion:", site1Agents.conversion,
    "Distribution:", site1Agents.distribution,
    "Reddit:", site1Agents.reddit,
    "",
    "Quality Audit:", JSON.stringify(site1Critic, null, 2),
    "",
    `=== SITE 2: ${productName2} ===`,
    "",
    "Website Content (truncated):",
    truncateContent(site2Content, 800),
    "",
    "Strategist:", site2Agents.strategist,
    "Copywriter:", site2Agents.copywriter,
    "SEO:", site2Agents.seo,
    "Conversion:", site2Agents.conversion,
    "Distribution:", site2Agents.distribution,
    "Reddit:", site2Agents.reddit,
    "",
    "Quality Audit:", JSON.stringify(site2Critic, null, 2),
    "",
    `Site 1 is "${productName1}". Site 2 is "${productName2}".`,
    `The founder owns Site 1 and wants to beat Site 2.`
  ];

  return callFireworks(COMPARE_SYSTEM_PROMPT, sections.join("\n"), {
    maxTokens: COMPARE_MAX_TOKENS,
    temperature: COMPARE_TEMPERATURE
  });
}
