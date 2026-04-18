import { callGroq } from "@/lib/ai-router";
import type { CriticResult, CriticAgentVerdict } from "@/lib/types";
import type { SpecializedAgentOutputs } from "./agents";

const CRITIC_SYSTEM_PROMPT = `You are a ruthless marketing analysis auditor. Your job is to quality-check AI-generated marketing reports before they reach the final aggregator.

For each agent output provided, you must check for:
1. HALLUCINATION — Does the output reference a wrong product name, made-up statistics, or invented brand names not present in the website content?
2. VAGUENESS — Does the output contain generic advice with no specific action (e.g. "improve your SEO" with no keywords)?
3. REPETITION — Does this output repeat points already covered by another agent?
4. RELEVANCE — Is the advice actually relevant to the product/URL provided?

Respond ONLY in this exact JSON format, nothing else:
{
  "strategist": { 
    "confidence": 8, 
    "flags": [],
    "hallucinations": [],
    "approved": true 
  },
  "copywriter": { 
    "confidence": 5, 
    "flags": ["vague CTA advice", "generic hook not tailored to product"],
    "hallucinations": ["refers to product as 'Strategist Agent'"],
    "approved": false 
  },
  "seo": { "confidence": 8, "flags": [], "hallucinations": [], "approved": true },
  "conversion": { "confidence": 8, "flags": [], "hallucinations": [], "approved": true },
  "distribution": { "confidence": 8, "flags": [], "hallucinations": [], "approved": true },
  "reddit": { "confidence": 8, "flags": [], "hallucinations": [], "approved": true },
  "overall_quality_score": 7,
  "summary": "One sentence summary of overall quality"
}

Confidence is 1-10. approved=true if confidence >= 6 and no hallucinations detected.`;

const DEFAULT_VERDICT: CriticAgentVerdict = {
  confidence: 7,
  flags: [],
  hallucinations: [],
  approved: true,
};

function getDefaultCriticResult(): CriticResult {
  return {
    strategist: { ...DEFAULT_VERDICT },
    copywriter: { ...DEFAULT_VERDICT },
    seo: { ...DEFAULT_VERDICT },
    conversion: { ...DEFAULT_VERDICT },
    distribution: { ...DEFAULT_VERDICT },
    reddit: { ...DEFAULT_VERDICT },
    overall_quality_score: 7,
    summary: "Critic pass skipped — defaulting to approved.",
  };
}

function truncateContent(content: string, maxWords: number): string {
  const words = content.split(/\s+/);
  if (words.length <= maxWords) return content;
  return words.slice(0, maxWords).join(" ") + " [truncated]";
}

export async function runCriticPass(
  agentOutputs: SpecializedAgentOutputs,
  websiteContent: string,
  productName: string,
  url: string
): Promise<CriticResult> {
  try {
    const userPrompt = [
      `The product being analyzed is: ${productName} at ${url}`,
      "",
      "--- ORIGINAL WEBSITE CONTENT (truncated) ---",
      truncateContent(websiteContent, 500),
      "",
      "--- STRATEGIST AGENT OUTPUT ---",
      agentOutputs.strategist,
      "",
      "--- COPYWRITER AGENT OUTPUT ---",
      agentOutputs.copywriter,
      "",
      "--- SEO AGENT OUTPUT ---",
      agentOutputs.seo,
      "",
      "--- CONVERSION AGENT OUTPUT ---",
      agentOutputs.conversion,
      "",
      "--- DISTRIBUTION AGENT OUTPUT ---",
      agentOutputs.distribution,
      "",
      "--- REDDIT AGENT OUTPUT ---",
      agentOutputs.reddit,
    ].join("\n");

    const raw = await callGroq(CRITIC_SYSTEM_PROMPT, userPrompt, {
      maxTokens: 800,
      temperature: 0.3,
    });

    // Extract JSON from the response (handle markdown fenced blocks)
    let jsonStr = raw;
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fencedMatch) {
      jsonStr = fencedMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as CriticResult;

    // Validate that all required agent keys exist
    const agentKeys = ["strategist", "copywriter", "seo", "conversion", "distribution", "reddit"] as const;
    for (const key of agentKeys) {
      if (!parsed[key] || typeof parsed[key].confidence !== "number") {
        console.warn(`[Critic] Missing or malformed verdict for "${key}", using default.`);
        parsed[key] = { ...DEFAULT_VERDICT };
      }
    }

    if (typeof parsed.overall_quality_score !== "number") {
      parsed.overall_quality_score = 7;
    }
    if (typeof parsed.summary !== "string") {
      parsed.summary = "Quality check completed.";
    }

    return parsed;
  } catch (error) {
    console.error(
      `[Critic] Critic pass failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`
    );
    return getDefaultCriticResult();
  }
}
