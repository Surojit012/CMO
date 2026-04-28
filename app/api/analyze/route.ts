import { NextRequest, NextResponse } from "next/server";

import { generateGrowthAnalysis } from "@/lib/ai";
import { encrypt } from "@/lib/encryption";
import { getMemoryContext, storeAnalysis } from "@/lib/memory";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { fetchWebsiteContent } from "@/lib/scraper";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyzeErrorResponse, AnalyzeRequest, AnalyzeSuccessResponse } from "@/lib/types";
import { parseAndValidateUrl } from "@/lib/url";
import type { AgentEvent } from "@/lib/agent-events";

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
  /* ── Validation (returns plain JSON on error) ──────────── */
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

  /* ── SSE Stream ────────────────────────────────────────── */
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Helper: enqueue an SSE frame
      const send = (eventName: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send an SSE comment immediately to prime the HTTP connection.
      // This forces Vercel to start streaming instead of buffering.
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Run the full pipeline as a detached async IIFE.
      // start() returns synchronously so the Response is sent immediately.
      (async () => {
        try {
          send("agent", { agent: "system", status: "thinking", message: "Scraping website content…", timestamp: Date.now() });

          const extracted = await fetchWebsiteContent(url.toString());
          send("agent", { agent: "system", status: "done", message: "Website scraped successfully.", timestamp: Date.now() });

          send("agent", { agent: "system", status: "thinking", message: "Loading memory context…", timestamp: Date.now() });
          const memory = await getMemoryContext(url.toString(), url.hostname);
          send("agent", { agent: "system", status: "done", message: "Memory loaded.", timestamp: Date.now() });

          const analysisId = crypto.randomUUID();

          // Run the full agent pipeline with live events
          const { markdown, analysis, agents } = await generateGrowthAnalysis(
            { url: url.toString(), ...extracted },
            memory,
            (evt: AgentEvent) => { send("agent", evt); }
          );

          // Persist results
          await storeAnalysis({
            id: analysisId,
            userId: userId!,
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

          // Send final result
          send("result", responsePayload);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown server error.";
          send("error", { error: message || "Analysis failed." });
        } finally {
          controller.close();
        }
      })();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive"
    }
  });
}
