import { NextRequest, NextResponse } from "next/server";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { generateOutreachPlan } from "@/lib/agents/outreachAgent";
import { supabaseServer } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(req);
    const sessionId = req.headers.get("x-cmo-session-id") || null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { analysisData, tone } = body;

    if (!analysisData || !analysisData.analysis) {
      return NextResponse.json(
        { error: "CMO analysis data is required." },
        { status: 400 }
      );
    }

    const outreachPlan = await generateOutreachPlan(analysisData, tone, analysisData.url);

    // Validate the plan has basic required contents
    if (!outreachPlan.communities || !outreachPlan.phases) {
      throw new Error("Generated plan missing expected structure.");
    }

    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabaseServer.from("saved_reports").insert({
          user_id: userId,
          session_id: sessionId,
          url: analysisData.url || "",
          type: "outreach",
          data: outreachPlan
        });
      } catch (err) {
        console.error("Supabase insert error [outreach]:", err);
      }
    }

    return NextResponse.json(outreachPlan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("Outreach generation error:", error);
    return NextResponse.json(
      { error: message || "Failed to generate outreach plan." },
      { status: 500 }
    );
  }
}
