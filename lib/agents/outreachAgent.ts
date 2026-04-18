import { OutreachPlan } from "../outreach-types";
import { AnalyzeSuccessResponse } from "../types";
import { callFireworks } from "../ai-router";
import { loadSkillPrompt } from "./loadSkill";
import { storeOutreachCommunities } from "../outreach-bridge";

/* ─────────────────────────────────────────────────────────
 * Community Outreach Agent
 * ─────────────────────────────────────────────────────────
 * Knowledge base: .agents/skills/outreach/SKILL.md
 *
 * Generates structured community outreach playbooks with
 * target communities, phased rollout, post templates,
 * weekly tasks, and KPI targets.
 *
 * DATA BRIDGE: After generating a plan, the top 3 communities
 * are stored in Redis (outreach:communities:<url>) for:
 *  - Strategist Agent: upstream context on next Growth Analysis run
 *  - Chief Aggregator: community awareness in the growth report
 *
 * The SKILL.md is loaded at runtime so edits to the
 * knowledge file take effect without code changes.
 * ──────────────────────────────────────────────────────── */

const OUTREACH_SYSTEM_PROMPT_INLINE = `You are the Community Outreach Agent inside CMO, an AI growth tool for indie founders and bootstrapped SaaS builders.

You receive a JSON object containing the full CMO analysis of a website: the product's core value, ICP, viral hooks, SEO keywords, and distribution ideas.

Your job is to return a structured JSON object (no markdown, no explanation, pure JSON) containing:

{
  "product_summary": "one sentence description of what this product does",
  "icp": "one sentence description of who needs it most",
  "communities": [
    {
      "name": "exact community name (e.g. 'r/SaaS' for Reddit, '#buildinpublic' for Twitter)",
      "platform": "Reddit | HackerNews | IndieHackers | Discord | Twitter | Forum",
      "url": "direct link to community (or best guess/search url if exact unknown)",
      "audience_size": "e.g. '250k members', '1M followers' (include the unit)",
      "fit_score": 87,
      "fit_reason": "one sentence explaining why this community is a match",
      "rules_note": "one sentence on self-promo rules or how to approach this community"
    }
  ],
  "phases": [
    {
      "phase_number": 1,
      "title": "Lurk & earn credibility",
      "weeks": "Weeks 1-2",
      "goal": "one sentence goal",
      "actions": ["action 1", "action 2", "action 3"],
      "post_template": {
        "community": "best community for this phase",
        "type": "feedback_ask | origin_story | value_post",
        "title": "post title",
        "alt_titles": ["alt title 1", "alt title 2", "alt title 3"],
        "body": "full post body, personalized to this specific product"
      }
    }
  ],
  "weekly_tasks": {
    "monday": "specific task",
    "tuesday": "specific task",
    "wednesday": "specific task",
    "thursday": "specific task",
    "friday": "specific task"
  },
  "kpi_targets": {
    "site_visitors": 500,
    "free_uses": 100,
    "paid_conversions": 15,
    "feedback_messages": 50,
    "communities_active": 3,
    "case_studies": 1
  },
  "viral_angles": [
    "a compelling one-liner angle specific to this product's price, story, or mechanism"
  ]
}

Return ONLY valid JSON. No backticks. No markdown. No explanation before or after.
Ensure all phases and alt_titles (generate 3 alternative titles for each post_template) are included.
Provide 6-8 communities total, ranked by fit_score descending.
Provide 4 phases total.
Provide 3 viral angles total.`;

/** Builds the full outreach system prompt, enriched with SKILL.md knowledge */
function getOutreachSystemPrompt(): string {
  const skill = loadSkillPrompt("outreach", "");
  if (!skill) return OUTREACH_SYSTEM_PROMPT_INLINE;
  return `${OUTREACH_SYSTEM_PROMPT_INLINE}\n\n---\n\n## Agent Knowledge Base\n\n${skill}`;
}

function extractJSON(content: string): string {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.substring(firstBrace, lastBrace + 1);
  }

  return content;
}

export async function generateOutreachPlan(
  cmoAnalysis: AnalyzeSuccessResponse,
  tone?: string,
  websiteUrl?: string
): Promise<OutreachPlan> {
  const basePrompt = `Here is the CMO analysis output for this website:\n\n${JSON.stringify(cmoAnalysis.analysis, null, 2)}\n\nWebsite Content (extracted):\n${cmoAnalysis.extracted.title}\n${cmoAnalysis.extracted.metaDescription}\n${cmoAnalysis.extracted.visibleText.substring(0, 5000)}\n\nGenerate the full community outreach plan.`;
  
  const userPromptStr = tone ? `${basePrompt}\n\nPlease adjust the tone of the post_template bodies to be more ${tone}.` : basePrompt;

  const result = await callFireworks(getOutreachSystemPrompt(), userPromptStr, {
    maxTokens: 4096,
    temperature: 0.7,
    responseFormat: { type: "json_object" }
  });
  
  const jsonStr = extractJSON(result);
  
  try {
    const plan = JSON.parse(jsonStr) as OutreachPlan;

    // Data bridge: Store top 3 communities in Redis for the core pipeline.
    // This runs fire-and-forget — we don't block the response on Redis writes.
    if (websiteUrl && plan.communities?.length > 0) {
      storeOutreachCommunities(websiteUrl, plan.communities).catch((err) =>
        console.error("[outreach] Bridge store failed:", err)
      );
    }

    return plan;
  } catch (e) {
    console.error("Failed to parse outreach plan JSON:", jsonStr);
    throw new Error("Invalid output from AI agent.");
  }
}

