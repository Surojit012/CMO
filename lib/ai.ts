import type { GrowthResponse, MemoryContext, CriticResult, ArcReceipt } from "./types";
import { aggregateAgentOutputs } from "./aggregator";
import { runAllAgents } from "./agents";
import { runCriticPass, getDefaultCriticResult } from "./critic";
import { getOutreachContext, formatOutreachContext } from "./outreach-bridge";
import {
  getMarketAuditContext,
  formatMarketAuditForAgents,
  formatMarketAuditForAggregator
} from "./market-audit-bridge";
import type { AgentEventCallback } from "./agent-events";
import { nanopaymentService } from "./arc/nanopayments";

type WebsiteContext = {
  url: string;
  title: string;
  metaDescription: string;
  visibleText: string;
};

type MultiAgentAnalysis = {
  markdown: string;
  analysis: GrowthResponse;
  agents: {
    strategist: string;
    copywriter: string;
    seo: string;
    conversion: string;
    distribution: string;
    reddit: string;
  };
  critic: CriticResult;
  productName: string;
  arcReceipt?: ArcReceipt;
};

/**
 * Extracts the product name from scraped website content.
 * Looks for og:title, <title>, or first <h1> in the raw text.
 * Falls back to the hostname from the URL.
 */
export function extractProductName(content: string, url?: string): string {
  // Try og:title
  const ogMatch = content.match(/og:title["']?\s*(?:content=)["']([^"']+)["']/i);
  if (ogMatch?.[1]?.trim()) return ogMatch[1].trim();

  // Try <title> tag
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]?.trim()) return titleMatch[1].trim();

  // Try first H1
  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match?.[1]?.trim()) return h1Match[1].trim();

  // Try the "Title:" line injected by buildWebsiteContextPrompt
  const titleLineMatch = content.match(/^Title:\s*(.+)$/m);
  if (titleLineMatch?.[1]?.trim() && titleLineMatch[1].trim() !== "N/A") {
    return titleLineMatch[1].trim();
  }

  // Fallback to hostname
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch { /* ignore */ }
  }

  return "this product";
}

import { parseGrowthMarkdown } from "./parsers";

function validateGrowthResponse(response: GrowthResponse) {
  const sections = Object.values(response);
  const allEmpty = sections.every((items) => items.length === 0);

  if (allEmpty) {
    throw new Error("The AI response was missing one or more required sections.");
  }

  return response;
}

function buildWebsiteContextPrompt(context: WebsiteContext) {
  return [
    `Website URL: ${context.url}`,
    `Title: ${context.title || "N/A"}`,
    `Meta description: ${context.metaDescription || "N/A"}`,
    `Extracted visible text:`,
    context.visibleText || "N/A"
  ].join("\n\n");
}

function buildMemoryPrompt(memory: MemoryContext) {
  const similarAnalysesText =
    memory.similarAnalyses.length > 0
      ? memory.similarAnalyses
        .map(
          (entry, index) =>
            [
              `Similar analysis ${index + 1}:`,
              `Website: ${entry.websiteUrl}`,
              `Timestamp: ${entry.timestamp}`,
              `Feedback: ${entry.feedback ?? "none"}`,
              entry.markdown
            ].join("\n")
        )
        .join("\n\n")
      : "No similar analyses found.";

  const positivePatterns =
    memory.positivePatterns.length > 0
      ? memory.positivePatterns.map((pattern) => `- ${pattern}`).join("\n")
      : "- No positive pattern history yet.";

  const negativePatterns =
    memory.negativePatterns.length > 0
      ? memory.negativePatterns.map((pattern) => `- ${pattern}`).join("\n")
      : "- No negative pattern history yet.";

  return [
    "Memory context:",
    `Total analyses stored: ${memory.stats.totalAnalyses}`,
    `Positive feedback count: ${memory.stats.positiveFeedback}`,
    `Negative feedback count: ${memory.stats.negativeFeedback}`,
    "",
    "Similar website analyses:",
    similarAnalysesText,
    "",
    "Patterns from positive feedback to reinforce:",
    positivePatterns,
    "",
    "Patterns from negative feedback to avoid:",
    negativePatterns
  ].join("\n");
}

/* ─────────────────────────────────────────────────────────
 * Growth Analysis Pipeline (with Data Bridges + Nanopayments)
 * ─────────────────────────────────────────────────────────
 *
 *  1. Fetch outreach + market audit context from Redis (parallel)
 *  2. Inject into websiteContent → Strategist sees both upstream
 *  3. Pass market audit summary to runAllAgents → SEO agent
 *  4. Run all 6 agents (Strategist-first, then 5 in parallel)
 *  5. Critic pass
 *  6. Aggregator
 *  7. Fire-and-forget: settle ERC-8183 nanopayment jobs in background
 *  8. Return unified growth report + Arc payment receipt
 *
 * ──────────────────────────────────────────────────────── */
export async function generateGrowthAnalysis(
  context: WebsiteContext,
  memory: MemoryContext,
  onEvent?: AgentEventCallback,
  userWalletAddress?: string,
  selectedAgents?: string[]
): Promise<MultiAgentAnalysis> {
  // Step 1: Fetch both data bridges from Redis in parallel (non-blocking)
  onEvent?.({ agent: "system", status: "thinking", message: "Fetching outreach & market data…", timestamp: Date.now() });
  const [outreachCtx, auditCtx] = await Promise.all([
    getOutreachContext(context.url).catch(() => null),
    getMarketAuditContext(context.url).catch(() => null)
  ]);
  onEvent?.({ agent: "system", status: "done", message: "Data bridges loaded.", timestamp: Date.now() });

  // Step 2: Build the base website content with memory
  const baseContent = [buildWebsiteContextPrompt(context), buildMemoryPrompt(memory)].join("\n\n");

  // Step 3: Enrich websiteContent with bridge data for the Strategist
  const enrichments: string[] = [];
  if (outreachCtx) enrichments.push(formatOutreachContext(outreachCtx));
  if (auditCtx) enrichments.push(formatMarketAuditForAgents(auditCtx));

  const websiteContent = enrichments.length > 0
    ? `${baseContent}\n\n${enrichments.join("\n\n")}`
    : baseContent;

  // Step 4: Extract product name for hallucination checking
  const productName = extractProductName(websiteContent, context.url);

  // Step 5: Run all agents (unchanged — no blocking on payments)
  const marketAuditForSeo = auditCtx ? formatMarketAuditForAgents(auditCtx) : undefined;
  const agentOutputs = await runAllAgents(websiteContent, marketAuditForSeo, onEvent, selectedAgents);

  // Step 6: Critic Pass
  let criticResult = getDefaultCriticResult();
  const baseAgentsRan = !selectedAgents || selectedAgents.some(a => ['strategist', 'copywriter', 'seo', 'conversion', 'distribution', 'reddit'].includes(a));
  
  if ((!selectedAgents || selectedAgents.includes("critic")) && baseAgentsRan) {
    onEvent?.({ agent: "critic", status: "thinking", message: "Auditing all outputs for hallucinations and quality…", timestamp: Date.now() });
    criticResult = await runCriticPass(agentOutputs, websiteContent, productName, context.url);
    onEvent?.({
      agent: "critic",
      status: "done",
      message: `Quality score: ${criticResult.overall_quality_score}/10. ${criticResult.summary}`,
      timestamp: Date.now()
    });
    console.log(`[Critic] Quality Score: ${criticResult.overall_quality_score}/10 | Product: ${productName}`);
    console.log(`[Critic] Summary: ${criticResult.summary}`);
    for (const agent of ["strategist", "copywriter", "seo", "conversion", "distribution", "reddit"] as const) {
      const v = criticResult[agent];
      if (!v.approved) {
        console.warn(`[Critic] ⚠️ ${agent} NOT approved (confidence: ${v.confidence}) — flags: ${v.flags.join(", ")} | hallucinations: ${v.hallucinations.join(", ")}`);
      }
    }
  } else {
    onEvent?.({ agent: "critic", status: "done", message: "Critic Agent skipped by user.", timestamp: Date.now() });
  }

  // Step 7: Aggregate
  let markdown = "";
  if (!selectedAgents || selectedAgents.includes("aggregator")) {
    onEvent?.({ agent: "aggregator", status: "thinking", message: "Synthesizing all specialist reports into a unified growth plan…", timestamp: Date.now() });
    const outreachForAggregator = outreachCtx ? formatOutreachContext(outreachCtx) : undefined;
    const auditForAggregator = auditCtx ? formatMarketAuditForAggregator(auditCtx) : undefined;
    markdown = await aggregateAgentOutputs(
      websiteContent,
      agentOutputs,
      outreachForAggregator,
      auditForAggregator,
      undefined,
      criticResult,
      productName
    );
    onEvent?.({ agent: "aggregator", status: "done", message: "Growth plan finalized.", timestamp: Date.now() });
  } else {
    onEvent?.({ agent: "aggregator", status: "done", message: "Aggregator skipped by user.", timestamp: Date.now() });
    const parts = [];
    if (selectedAgents.includes("strategist")) parts.push(`## 🗺️ Strategy\n\n${agentOutputs.strategist}`);
    if (selectedAgents.includes("copywriter")) parts.push(`## ✍️ Copywriting\n\n${agentOutputs.copywriter}`);
    if (selectedAgents.includes("seo")) parts.push(`## 🔍 SEO\n\n${agentOutputs.seo}`);
    if (selectedAgents.includes("conversion")) parts.push(`## ⚡ Conversion\n\n${agentOutputs.conversion}`);
    if (selectedAgents.includes("distribution")) parts.push(`## 📢 Distribution\n\n${agentOutputs.distribution}`);
    if (selectedAgents.includes("reddit")) parts.push(`## 🔴 Reddit\n\n${agentOutputs.reddit}`);
    markdown = parts.length > 0 ? parts.join("\n\n---\n\n") : "No agents were selected to run.";
  }

  // Step 8: Settle consolidated ERC-8183 nanopayment job (AWAITED)
  // One onchain job for the entire session — 7 txs total (~15-20s on Arc Testnet)
  onEvent?.({ agent: "system", status: "thinking", message: "Settling ERC-8183 nanopayment on Arc Testnet…", timestamp: Date.now() });
  const settlementResult = await nanopaymentService.settleSessionJob(markdown, userWalletAddress, selectedAgents);
  onEvent?.({
    agent: "system",
    status: "done",
    message: settlementResult.settled
      ? `⚡ Settled ${settlementResult.totalCost} USDC on Arc Testnet`
      : "Settlement skipped (Arc RPC unavailable)",
    timestamp: Date.now()
  });

  // Build receipt from real settlement data
  const arcReceipt: ArcReceipt = {
    totalCost: `${settlementResult.totalCost} USDC`,
    jobCount: 1,
    settledCount: settlementResult.settled ? 1 : 0,
    jobs: settlementResult.agentBreakdown.map((a) => ({
      agentName: a.agentName,
      jobId: settlementResult.jobId,
      cost: a.cost,
      txHash: settlementResult.txHash,
      status: settlementResult.settled ? "settled" as const : "skipped" as const,
      timestamp: Date.now(),
    })),
    arcScanLinks: settlementResult.txHash
      ? [`https://testnet.arcscan.app/tx/${settlementResult.txHash}`]
      : [],
  };

  console.log(
    settlementResult.settled
      ? `⚡ Arc receipt: ${arcReceipt.totalCost} | Job: ${settlementResult.jobId} | Tx: ${settlementResult.txHash}`
      : `⚠️ Arc settlement skipped — receipt shows 0 settled`
  );

  return {
    markdown,
    analysis: validateGrowthResponse(parseGrowthMarkdown(markdown)),
    agents: agentOutputs,
    critic: criticResult,
    productName,
    arcReceipt
  };
}
