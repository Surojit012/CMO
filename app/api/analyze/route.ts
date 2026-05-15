import { NextRequest, NextResponse } from "next/server";

import { generateGrowthAnalysis } from "@/lib/ai";
import { encrypt } from "@/lib/encryption";
import { getMemoryContext, storeAnalysis } from "@/lib/memory";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { fetchWebsiteContent } from "@/lib/scraper";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyzeErrorResponse, AnalyzeRequest, AnalyzeSuccessResponse, ReportType } from "@/lib/types";
import { REPORT_AGENT_MAP } from "@/lib/types";
import { parseAndValidateUrl } from "@/lib/url";

export const maxDuration = 60;

function getErrorStatus(message: string) {
  if (message.includes("timed out")) {
    return 504;
  }

  if (message.includes("fetch failed") || message.includes("did not return an HTML page")) {
    return 502;
  }

  if (message.includes("GROQ_API_KEY")) {
    return 500;
  }

  return 500;
}

export async function POST(req: NextRequest) {
  let userId: string | null;
  try {
    userId = await getPrivyUserIdFromRequest(req);
  } catch {
    userId = null;
  }

  const sessionId = req.headers.get("x-cmo-session-id") || null;

  if (!userId) {
    return NextResponse.json<AnalyzeErrorResponse>({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json()) as Partial<AnalyzeRequest>;
  const rawUrl = body.url?.trim();
  const reportType = body.reportType as ReportType | undefined;
  const competitorUrlRaw = body.competitorUrl?.trim();
  
  const VALID_AGENTS = ['strategist', 'copywriter', 'seo', 'conversion', 'distribution', 'reddit', 'critic', 'aggregator', 'narrative', 'positioning', 'competitor', 'sentiment'];
  let selectedAgents = body.selectedAgents;
  
  // If a report type is specified, use its agent map as default
  if (reportType && REPORT_AGENT_MAP[reportType]) {
    selectedAgents = REPORT_AGENT_MAP[reportType];
  } else if (!Array.isArray(selectedAgents) || selectedAgents.length === 0) {
    selectedAgents = ['strategist', 'copywriter', 'seo', 'conversion', 'distribution', 'reddit', 'critic', 'aggregator'];
  } else {
    // Filter out any invalid strings and ensure at least 1 valid agent remains
    selectedAgents = selectedAgents.filter(a => VALID_AGENTS.includes(a));
    if (selectedAgents.length === 0) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "Invalid agent selection. Please select at least one valid agent." },
        { status: 400 }
      );
    }
  }

  if (!rawUrl) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "A website URL is required." },
      { status: 400 }
    );
  }

  // Validate competitor URL if Battle Card report type
  if (reportType === "competitor-battle-card" && !competitorUrlRaw) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "A competitor URL is required for Battle Card reports." },
      { status: 400 }
    );
  }

  let url: URL;

  try {
    url = parseAndValidateUrl(rawUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid URL.";
    return NextResponse.json<AnalyzeErrorResponse>({ error: message }, { status: 400 });
  }

  try {
    // Scrape primary URL
    const extracted = await fetchWebsiteContent(url.toString());
    const memory = await getMemoryContext(url.toString(), url.hostname);
    const analysisId = crypto.randomUUID();

    // Scrape competitor URL for battle card reports
    let competitorContent: string | undefined;
    if (competitorUrlRaw && reportType === "competitor-battle-card") {
      try {
        const competitorUrl = parseAndValidateUrl(competitorUrlRaw);
        const competitorExtracted = await fetchWebsiteContent(competitorUrl.toString());
        competitorContent = [
          `Website URL: ${competitorUrl.toString()}`,
          `Title: ${competitorExtracted.title || "N/A"}`,
          `Meta description: ${competitorExtracted.metaDescription || "N/A"}`,
          `Extracted visible text:`,
          competitorExtracted.visibleText || "N/A"
        ].join("\n\n");
      } catch (err) {
        console.warn("Failed to scrape competitor URL:", err);
        competitorContent = `Competitor URL: ${competitorUrlRaw} (scrape failed)`;
      }
    }

    // Extract user wallet address for Arc nanopayment job descriptions
    const userWalletAddress = req.headers.get("x-user-wallet-address") || undefined;

    const { markdown, analysis, agents, arcReceipt } = await generateGrowthAnalysis(
      { url: url.toString(), ...extracted },
      memory,
      undefined,       // onEvent — not used in API route (no SSE)
      userWalletAddress,
      selectedAgents,
      reportType,
      competitorContent
    );

    await storeAnalysis({
      id: analysisId,
      userId,
      encryptedOutput: encrypt(
        JSON.stringify({
          websiteUrl: url.toString(),
          hostname: url.hostname,
          extractedContent: extracted,
          aiOutput: { markdown, analysis, agents },
          feedback: null
        })
      ),
      timestamp: new Date().toISOString()
    });

    const responsePayload: AnalyzeSuccessResponse = {
      analysisId,
      url: url.toString(),
      markdown,
      analysis,
      agents,
      extracted,
      arcReceipt,
      selectedAgents,
      reportType,
      competitorUrl: competitorUrlRaw,
    };

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabaseServer.from("saved_reports").insert({
          id: analysisId,
          user_id: userId,
          session_id: sessionId,
          url: url.toString(),
          type: "analysis",
          data: responsePayload as any
        });
      } catch (err) {
        console.error("Supabase insert error [analyze]:", err);
      }
    }

    return NextResponse.json<AnalyzeSuccessResponse>(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: message || "Analysis failed." },
      { status: getErrorStatus(message) }
    );
  }
}

