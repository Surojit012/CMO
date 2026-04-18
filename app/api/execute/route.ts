import { NextRequest, NextResponse } from "next/server";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { callTextModel } from "@/lib/llm";

const ACTION_PROMPTS: Record<string, string> = {
  generateTweetThread: `Based on this growth strategy, write a viral 7-tweet thread.
Tweet 1 should be a hook. Tweets 2-6 should each share one insight. Tweet 7 should be a CTA.
Format: Tweet 1/7: ... Tweet 2/7: ... etc.
Be specific, punchy, and avoid generic advice.`,

  generateAdCopy: `Based on this growth strategy, write 3 ad variations.
Ad 1: Google Search Ad (headline + description)
Ad 2: Meta/Facebook Ad (hook + body + CTA)
Ad 3: LinkedIn Ad (professional tone, problem + solution)
Be specific to this product. No generic copy.`,

  generateBlogPost: `Based on this growth strategy, write a full SEO blog post.
Include: Title, Meta description, Introduction, 4-5 sections with subheadings, Conclusion, CTA.
Make it specific to this product. Minimum 800 words.`,

  generateContentPlan: `Based on this growth strategy, create a 30-day content calendar.
Format as:
Week 1: [theme]
- Day 1: [platform] - [content idea]
- Day 3: [platform] - [content idea]
- Day 5: [platform] - [content idea]
Week 2: [theme]
... and so on for 4 weeks.
Be specific to this product.`
};

export async function POST(request: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { action, context } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required." },
        { status: 400 }
      );
    }

    if (!context || !context.trim()) {
      return NextResponse.json(
        { error: "Please run an analysis first." },
        { status: 400 }
      );
    }

    const actionPrompt = ACTION_PROMPTS[action];
    if (!actionPrompt) {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }

    const output = await callTextModel(
      actionPrompt,
      `Growth Strategy Context:\n${context}`,
      { maxTokens: 1000, temperature: 0.7 }
    );

    return NextResponse.json({ ok: true, output });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Action execution failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}