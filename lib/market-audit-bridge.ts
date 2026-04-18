import { Redis } from "@upstash/redis";

/* ─────────────────────────────────────────────────────────
 * Market Audit ↔ Core Pipeline Bridge (Redis)
 * ─────────────────────────────────────────────────────────
 *
 * Creates a read-only (from the core agents' perspective)
 * data bridge between the independent Market Audit pipeline
 * and the core Growth Analysis agents:
 *
 *             Market Audit Pipeline
 *        (Jina + Tavily + Groq/Fireworks/NVIDIA)
 *                      │
 *                storeMarketAudit()
 *                      │
 *                      ▼
 *           Redis: market-audit:<hostname>
 *              (24-hour TTL, read-only)
 *                      │
 *          ┌───────────┼───────────┐
 *          ▼           ▼           ▼
 *     Strategist    SEO Agent   Aggregator
 *    (competitive  (SEO gaps,  (Market Position
 *     context)     keywords)    section)
 *
 * The core agents CONSUME this data but never WRITE to it.
 * Both pipelines remain independently triggerable.
 *
 * ──────────────────────────────────────────────────────── */

/** Compact summary stored in Redis — not the full audit payload */
export type MarketAuditSummary = {
  productName: string;
  category: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitors: Array<{
    name: string;
    positioning: string;
    highlight: string;
  }>;
  seoGaps: Array<{
    keyword: string;
    difficulty: string;
    blogTitleIdea: string;
  }>;
  founderScore: number;
  moatType: string;
  verdict: string;
  storedAt: string; // ISO timestamp
};

const MARKET_AUDIT_KEY = (url: string) => `market-audit:${normalizeUrl(url)}`;
const TTL_SECONDS = 60 * 60 * 24; // 24 hours

/** Normalize URL for consistent Redis key lookup */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase().trim();
  }
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
}

/**
 * Store a compact summary of the Market Audit in Redis.
 * Called by the Market Audit API route after successful audit completion.
 *
 * We store a SUMMARY, not the full audit — keeps Redis payload small
 * and provides only what the core agents need for context.
 */
export async function storeMarketAudit(
  websiteUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullAudit: any
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const summary: MarketAuditSummary = {
    productName: fullAudit.productName || "Unknown",
    category: fullAudit.category || "Unknown",
    swot: {
      strengths: (fullAudit.swot?.strengths || []).slice(0, 3),
      weaknesses: (fullAudit.swot?.weaknesses || []).slice(0, 3),
      opportunities: (fullAudit.swot?.opportunities || []).slice(0, 3),
      threats: (fullAudit.swot?.threats || []).slice(0, 3)
    },
    competitors: (fullAudit.competitors || []).slice(0, 3).map((c: any) => ({
      name: c.name || "Unknown",
      positioning: c.positioning || "",
      highlight: c.highlight || ""
    })),
    seoGaps: (fullAudit.seoGaps || []).slice(0, 5).map((g: any) => ({
      keyword: g.keyword || "",
      difficulty: g.difficulty || "medium",
      blogTitleIdea: g.blogTitleIdea || ""
    })),
    founderScore: fullAudit.founderScore?.overall || 0,
    moatType: fullAudit.moatScore?.type || "None",
    verdict: fullAudit.verdict?.summary || "",
    storedAt: new Date().toISOString()
  };

  try {
    await redis.set(MARKET_AUDIT_KEY(websiteUrl), JSON.stringify(summary), { ex: TTL_SECONDS });
    console.log(`[market-audit-bridge] Stored summary for ${normalizeUrl(websiteUrl)}`);
  } catch (err) {
    console.error("[market-audit-bridge] Failed to store audit:", err);
  }
}

/**
 * Read Market Audit summary from Redis for a given URL.
 * Returns null if no audit data exists or has expired (24h TTL).
 *
 * Used by:
 *  - Strategist Agent: competitive positioning context
 *  - SEO Agent: keyword gaps and content opportunities
 *  - Chief Aggregator: Market Position section in final report
 */
export async function getMarketAuditContext(websiteUrl: string): Promise<MarketAuditSummary | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get<string>(MARKET_AUDIT_KEY(websiteUrl));
    if (!raw) return null;

    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return data as MarketAuditSummary;
  } catch (err) {
    console.error("[market-audit-bridge] Failed to read audit:", err);
    return null;
  }
}

/**
 * Format Market Audit summary for the Strategist and SEO agents.
 * Kept under ~300 words to avoid context bloat.
 */
export function formatMarketAuditForAgents(audit: MarketAuditSummary): string {
  const competitorLines = audit.competitors
    .map((c) => `- **${c.name}**: ${c.positioning}. ${c.highlight}`)
    .join("\n");

  const seoLines = audit.seoGaps
    .slice(0, 3)
    .map((g) => `- "${g.keyword}" (${g.difficulty} difficulty) → Blog idea: "${g.blogTitleIdea}"`)
    .join("\n");

  return [
    `## 📊 Market Audit Intelligence (from previous market audit)`,
    ``,
    `**Product**: ${audit.productName} (${audit.category})`,
    `**Founder Score**: ${audit.founderScore}/100 | **Moat**: ${audit.moatType}`,
    ``,
    `**SWOT Summary**:`,
    `- Strengths: ${audit.swot.strengths.slice(0, 2).join("; ")}`,
    `- Weaknesses: ${audit.swot.weaknesses.slice(0, 2).join("; ")}`,
    `- Opportunities: ${audit.swot.opportunities.slice(0, 2).join("; ")}`,
    `- Threats: ${audit.swot.threats.slice(0, 2).join("; ")}`,
    ``,
    `**Top Competitors**:`,
    competitorLines,
    ``,
    `**SEO Gaps**:`,
    seoLines,
    ``,
    `**Verdict**: ${audit.verdict}`,
    ``,
    `_Audit date: ${audit.storedAt}_`
  ].join("\n");
}

/**
 * Format Market Audit summary for the Aggregator's "Market Position" section.
 * More detailed than the agent version — includes full SWOT.
 */
export function formatMarketAuditForAggregator(audit: MarketAuditSummary): string {
  const competitorLines = audit.competitors
    .map((c) => `- **${c.name}**: ${c.positioning}. ${c.highlight}`)
    .join("\n");

  return [
    `## Market Audit Data (from independent Market Audit pipeline)`,
    ``,
    `Product: ${audit.productName} | Category: ${audit.category}`,
    `Founder Score: ${audit.founderScore}/100 | Moat: ${audit.moatType}`,
    ``,
    `SWOT:`,
    `Strengths: ${audit.swot.strengths.join("; ")}`,
    `Weaknesses: ${audit.swot.weaknesses.join("; ")}`,
    `Opportunities: ${audit.swot.opportunities.join("; ")}`,
    `Threats: ${audit.swot.threats.join("; ")}`,
    ``,
    `Competitors:`,
    competitorLines,
    ``,
    `SEO Gaps:`,
    ...audit.seoGaps.map((g) => `- "${g.keyword}" (${g.difficulty}) → "${g.blogTitleIdea}"`),
    ``,
    `Strategic Verdict: ${audit.verdict}`
  ].join("\n");
}
