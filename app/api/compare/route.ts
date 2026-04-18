import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteContent } from "@/lib/scraper";
import { runAllAgents } from "@/lib/agents";
import { runCriticPass } from "@/lib/critic";
import { extractProductName } from "@/lib/ai";
import { compareAggregator, parseCompareScores, determineWinner } from "@/lib/compareAggregator";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { parseAndValidateUrl } from "@/lib/url";
import type { CompareRequest, CompareSuccessResponse, AnalyzeErrorResponse } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Partial<CompareRequest>;
    const rawUrl1 = body.url1?.trim();
    const rawUrl2 = body.url2?.trim();

    if (!rawUrl1 || !rawUrl2) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "Both URL fields are required for comparison." },
        { status: 400 }
      );
    }

    let url1: URL;
    let url2: URL;

    try {
      url1 = parseAndValidateUrl(rawUrl1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid URL for Site 1.";
      return NextResponse.json<AnalyzeErrorResponse>({ error: `Site 1: ${message}` }, { status: 400 });
    }

    try {
      url2 = parseAndValidateUrl(rawUrl2);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid URL for Site 2.";
      return NextResponse.json<AnalyzeErrorResponse>({ error: `Site 2: ${message}` }, { status: 400 });
    }

    // Step 1: Scrape both sites in parallel
    const [site1Content, site2Content] = await Promise.all([
      fetchWebsiteContent(url1.toString()),
      fetchWebsiteContent(url2.toString())
    ]);

    // Step 2: Extract product names
    const productName1 = extractProductName(site1Content.visibleText, url1.toString());
    const productName2 = extractProductName(site2Content.visibleText, url2.toString());

    console.log(`[Compare] Site 1: ${productName1} (${url1.toString()})`);
    console.log(`[Compare] Site 2: ${productName2} (${url2.toString()})`);

    // Step 3: Run agents SEQUENTIALLY (not parallel) to avoid Fireworks rate limits.
    // Each site uses 6 parallel Fireworks calls internally. Running both sites
    // simultaneously would be 12+ concurrent calls, exceeding Tier 1 limits.
    console.log(`[Compare] Analyzing Site 1: ${productName1}...`);
    const site1Agents = await runAllAgents(site1Content.visibleText);
    
    console.log(`[Compare] Analyzing Site 2: ${productName2}...`);
    const site2Agents = await runAllAgents(site2Content.visibleText);

    // Step 4: Run critic pass on both outputs (Groq — separate rate limit, safe to parallel)
    const [site1Critic, site2Critic] = await Promise.all([
      runCriticPass(site1Agents, site1Content.visibleText, productName1, url1.toString()),
      runCriticPass(site2Agents, site2Content.visibleText, productName2, url2.toString())
    ]);

    console.log(`[Compare/Critic] Site 1 quality: ${site1Critic.overall_quality_score}/10`);
    console.log(`[Compare/Critic] Site 2 quality: ${site2Critic.overall_quality_score}/10`);

    // Step 5: Run compare aggregator
    const markdown = await compareAggregator(
      site1Content.visibleText,
      site2Content.visibleText,
      site1Agents,
      site2Agents,
      site1Critic,
      site2Critic,
      productName1,
      productName2
    );

    // Step 6: Parse scores and determine winner
    const scores = parseCompareScores(markdown);
    const winner = determineWinner(scores);

    const response: CompareSuccessResponse = {
      url1: url1.toString(),
      url2: url2.toString(),
      productName1,
      productName2,
      winner,
      scores,
      markdown,
      critic1Summary: site1Critic.summary,
      critic2Summary: site2Critic.summary
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison failed.";
    console.error("[Compare] Error:", message);
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: message },
      { status: 500 }
    );
  }
}
