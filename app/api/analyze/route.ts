import { NextRequest, NextResponse } from "next/server";

import { generateGrowthAnalysis } from "@/lib/ai";
import { encrypt } from "@/lib/encryption";
import { getMemoryContext, storeAnalysis } from "@/lib/memory";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { fetchWebsiteContent } from "@/lib/scraper";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyzeErrorResponse, AnalyzeRequest, AnalyzeSuccessResponse } from "@/lib/types";
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
  try {
    const userId = getPrivyUserIdFromRequest(req);
    const sessionId = req.headers.get("x-cmo-session-id") || null;

    if (!userId) {
      return NextResponse.json<AnalyzeErrorResponse>({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "A website URL is required." },
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

    const extracted = await fetchWebsiteContent(url.toString());
    const memory = await getMemoryContext(url.toString(), url.hostname);
    const analysisId = crypto.randomUUID();
    const { markdown, analysis, agents } = await generateGrowthAnalysis(
      {
        url: url.toString(),
        ...extracted
      },
      memory
    );

    await storeAnalysis({
      id: analysisId,
      userId,
      encryptedOutput: encrypt(
        JSON.stringify({
          websiteUrl: url.toString(),
          hostname: url.hostname,
          extractedContent: extracted,
          aiOutput: {
            markdown,
            analysis,
            agents
          },
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
      extracted
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
