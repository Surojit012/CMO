import { callFireworks } from "@/lib/ai-router";

/* ─────────────────────────────────────────────────────────
 * Competitor Intelligence Agent — Protocol Battle Analyst
 * ─────────────────────────────────────────────────────────
 * Analyzes a competitor protocol's website, narrative, and
 * positioning. Returns a structured intelligence brief.
 *
 * Used in: Competitor Battle Card, Launch Readiness Report,
 *          Weekly Pulse (lightweight mode)
 * Provider: Fireworks AI (depth over speed)
 * ──────────────────────────────────────────────────────── */

const COMPETITOR_PROMPT = `You are a crypto competitor intelligence analyst. You think like a protocol's head of strategy preparing a board deck. Factual, structured, no editorializing.

You will receive website content from TWO protocols:
1. The PRIMARY protocol (the user's protocol)
2. The COMPETITOR protocol

Your job:
1. Build a competitor profile — what they claim to do, their token utility, target audience, and key marketing claims
2. Identify the competitor's narrative weaknesses — where their story falls apart, where they're vague, where they overpromise
3. Find specific areas where the primary protocol clearly wins
4. Create a battle card summary — a 3-sentence executive brief a founder could use in a pitch

Return your analysis in this structure:

**Competitor Profile**
- Name: [extracted from competitor site]
- Category: [what space they claim to own]
- Token Utility: [how their token creates value, or "unclear" if vague]
- Target Audience: [who they're building for]
- Key Claims: [their 3 biggest marketing claims, quoted from site]

**Narrative Weaknesses**
- [Weakness 1 — reference specific competitor text]
- [Weakness 2 — reference specific competitor text]
- [Weakness 3 — reference specific competitor text]

**Where You Win**
- [Advantage 1 — specific comparison]
- [Advantage 2 — specific comparison]
- [Advantage 3 — specific comparison]

**Battle Card Summary**
3-sentence executive brief. Factual. No hype. What a founder needs to know before a meeting where this competitor comes up.

Rules:
- Voice: intelligence analyst. Factual. No editorializing.
- Every claim must reference specific text from one of the two sites
- If the competitor is actually stronger in an area, say so honestly
- NO buzzwords, NO generic competitive advice
- Keep output concise and evidence-based`;

const LIGHTWEIGHT_PROMPT = `You are a crypto competitor scanner. Quick-scan a protocol's website and return a 3-bullet summary of what changed or what's notable. Keep it under 200 words. Be factual, reference specific text.`;

export async function competitorIntelligenceAgent(
  primaryContent: string,
  competitorContent: string,
  lightweight = false
): Promise<string> {
  if (lightweight) {
    const result = await callFireworks(
      LIGHTWEIGHT_PROMPT,
      `Protocol website content:\n\n${competitorContent}`,
      { maxTokens: 300, temperature: 0.5 }
    );
    return result;
  }

  const combinedContent = [
    "=== PRIMARY PROTOCOL (the user's protocol) ===",
    primaryContent,
    "",
    "=== COMPETITOR PROTOCOL ===",
    competitorContent,
  ].join("\n\n");

  const result = await callFireworks(COMPETITOR_PROMPT, combinedContent, {
    maxTokens: 1200,
    temperature: 0.7,
  });

  return result;
}
