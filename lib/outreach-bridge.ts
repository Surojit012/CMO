import { Redis } from "@upstash/redis";
import type { OutreachCommunity } from "./outreach-types";

/* ─────────────────────────────────────────────────────────
 * Outreach ↔ Core Pipeline Bridge (Redis)
 * ─────────────────────────────────────────────────────────
 *
 * This module creates a data bridge between the standalone
 * Outreach Agent and the core Growth Analysis pipeline:
 *
 *                    Outreach Agent
 *                         │
 *                    storeOutreachCommunities()
 *                         │
 *                         ▼
 *              Redis: outreach:communities:<url>
 *                         │
 *           ┌─────────────┴─────────────┐
 *           ▼                           ▼
 *   getOutreachContext()        getOutreachContext()
 *     (Strategist)               (Aggregator)
 *
 * UPSTREAM:   Outreach → Redis → Strategist (next run)
 * AGGREGATOR: Outreach → Redis → Chief Aggregator
 *
 * ──────────────────────────────────────────────────────── */

/** Shape of the community data stored in Redis */
export type StoredOutreachCommunity = {
  name: string;
  platform: string;
  fit_score: number;
  fit_reason: string;
  audience_size: string;
};

export type OutreachContext = {
  communities: StoredOutreachCommunity[];
  storedAt: string; // ISO timestamp
};

const OUTREACH_KEY = (url: string) => `outreach:communities:${normalizeUrl(url)}`;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
 * UPSTREAM FEED: Store the top 3 outreach communities in Redis.
 * Called after the Outreach Agent generates its plan.
 */
export async function storeOutreachCommunities(
  websiteUrl: string,
  communities: OutreachCommunity[]
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  // Extract top 3 by fit_score (already sorted by the Outreach Agent, but enforce it)
  const top3: StoredOutreachCommunity[] = [...communities]
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 3)
    .map((c) => ({
      name: c.name,
      platform: c.platform,
      fit_score: c.fit_score,
      fit_reason: c.fit_reason,
      audience_size: c.audience_size
    }));

  const data: OutreachContext = {
    communities: top3,
    storedAt: new Date().toISOString()
  };

  try {
    await redis.set(OUTREACH_KEY(websiteUrl), JSON.stringify(data), { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[outreach-bridge] Failed to store communities:", err);
  }
}

/**
 * Read outreach context from Redis for a given URL.
 * Returns null if no outreach data exists.
 *
 * Used by:
 *  - Strategist Agent: to receive upstream community intelligence on next run
 *  - Chief Aggregator: to incorporate community distribution into the growth report
 */
export async function getOutreachContext(websiteUrl: string): Promise<OutreachContext | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get<string>(OUTREACH_KEY(websiteUrl));
    if (!raw) return null;

    // Upstash may return the value as a pre-parsed object or a string
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return data as OutreachContext;
  } catch (err) {
    console.error("[outreach-bridge] Failed to read communities:", err);
    return null;
  }
}

/**
 * Format outreach context as a human-readable string for injection
 * into agent/aggregator system prompts.
 */
export function formatOutreachContext(ctx: OutreachContext): string {
  const communityLines = ctx.communities
    .map(
      (c, i) =>
        `${i + 1}. **${c.name}** (${c.platform}, ${c.audience_size}) — Fit: ${c.fit_score}/100\n   Reason: ${c.fit_reason}`
    )
    .join("\n");

  return [
    `## 🏘️ Community Outreach Intelligence (from previous outreach analysis)`,
    ``,
    `Top recommended communities for this product:`,
    communityLines,
    ``,
    `_Data collected: ${ctx.storedAt}_`
  ].join("\n");
}
