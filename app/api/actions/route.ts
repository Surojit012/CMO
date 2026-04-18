import { NextRequest, NextResponse } from "next/server";

import { executeAction } from "@/lib/actions";
import { getAnalysisById } from "@/lib/memory";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import type { ActionRequest, ActionResponse, AnalyzeErrorResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json<AnalyzeErrorResponse>({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ActionRequest>;

    if (!body.analysisId || !body.section || !body.sourceText || !body.actionType) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "analysisId, section, sourceText, and actionType are required." },
        { status: 400 }
      );
    }

    const analysis = await getAnalysisById(body.analysisId, userId);

    if (!analysis) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    const output = await executeAction(analysis, {
      analysisId: body.analysisId,
      section: body.section,
      sourceText: body.sourceText,
      actionType: body.actionType
    });

    return NextResponse.json<ActionResponse>({
      ok: true,
      analysisId: body.analysisId,
      section: body.section,
      sourceText: body.sourceText,
      actionType: body.actionType,
      output
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action execution failed.";
    return NextResponse.json<AnalyzeErrorResponse>({ error: message }, { status: 500 });
  }
}