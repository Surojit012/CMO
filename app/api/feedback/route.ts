import { NextRequest, NextResponse } from "next/server";

import { storeFeedback } from "@/lib/memory";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import type {
  AnalyzeErrorResponse,
  FeedbackRequest,
  FeedbackResponse
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json<AnalyzeErrorResponse>({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<FeedbackRequest>;

    if (!body.analysisId || !body.feedback) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "analysisId and feedback are required." },
        { status: 400 }
      );
    }

    if (!["positive", "negative"].includes(body.feedback)) {
      return NextResponse.json<AnalyzeErrorResponse>(
        { error: "feedback must be positive or negative." },
        { status: 400 }
      );
    }

    await storeFeedback(body.analysisId, body.feedback, userId);

    return NextResponse.json<FeedbackResponse>({
      ok: true,
      analysisId: body.analysisId,
      feedback: body.feedback
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to store feedback.";
    const status = message === "Analysis not found." ? 404 : 500;

    return NextResponse.json<AnalyzeErrorResponse>({ error: message }, { status });
  }
}
