import type { ActionRequest, ActionType, StoredAnalysisForExecution } from "./types";
import { callTextModel } from "./llm";

const EXECUTION_SYSTEM_PROMPT = `You are the execution layer for an AI growth system.

Your job is to turn a growth recommendation into execution-ready marketing assets.

Rules:
- Be specific to the supplied website and recommendation
- Write content that is ready to use with minimal editing
- Avoid generic filler
- Keep tone sharp, tactical, and modern
- Do not explain what you are doing
- Output only the requested asset`;

function buildExecutionContext(record: StoredAnalysisForExecution, request: ActionRequest) {
  return [
    `Website URL: ${record.websiteUrl}`,
    `Page title: ${record.extractedContent.title || "N/A"}`,
    `Meta description: ${record.extractedContent.metaDescription || "N/A"}`,
    `Extracted content: ${record.extractedContent.visibleText || "N/A"}`,
    "",
    "Full growth analysis:",
    record.aiOutput.markdown,
    "",
    `Selected section: ${request.section}`,
    `Selected recommendation: ${request.sourceText}`
  ].join("\n");
}

async function generateTweetThread(record: StoredAnalysisForExecution, request: ActionRequest) {
  return callTextModel(
    `${EXECUTION_SYSTEM_PROMPT}

Create a high-conviction X/Twitter thread.

Format:
- 1 hook tweet
- 5 to 7 follow-up tweets
- short lines
- founder / growth-operator tone
- end with a soft CTA`,
    buildExecutionContext(record, request)
  );
}

async function generateAdCopy(record: StoredAnalysisForExecution, request: ActionRequest) {
  return callTextModel(
    `${EXECUTION_SYSTEM_PROMPT}

Create performance-style ad copy.

Format:
- 3 ad variants
- each variant includes:
  Headline:
  Body:
  CTA:

Keep each variant distinct in angle.`,
    buildExecutionContext(record, request)
  );
}

async function generateBlogPost(record: StoredAnalysisForExecution, request: ActionRequest) {
  return callTextModel(
    `${EXECUTION_SYSTEM_PROMPT}

Create a concise blog post draft.

Format:
- Title
- Intro
- 3 to 5 sections with subheads
- Closing CTA

Make it publishable as a first draft.`,
    buildExecutionContext(record, request)
  );
}

async function generateContentPlan(record: StoredAnalysisForExecution, request: ActionRequest) {
  return callTextModel(
    `${EXECUTION_SYSTEM_PROMPT}

Create a 7-day content and distribution plan.

Format:
- Day 1 to Day 7
- each day includes channel, post angle, and CTA

Optimize for execution speed and audience relevance.`,
    buildExecutionContext(record, request)
  );
}

export async function executeAction(record: StoredAnalysisForExecution, request: ActionRequest) {
  const handlers: Record<ActionType, (record: StoredAnalysisForExecution, request: ActionRequest) => Promise<string>> = {
    tweet_thread: generateTweetThread,
    ad_copy: generateAdCopy,
    blog_post: generateBlogPost,
    content_plan: generateContentPlan
  };

  const handler = handlers[request.actionType];

  if (!handler) {
    throw new Error("Unsupported action type.");
  }

  return handler(record, request);
}
