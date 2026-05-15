import { callFireworks } from "@/lib/ai-router";
import { redditAgent } from "./redditAgent";
import { narrativeAgent } from "./narrativeAgent";
import { positioningAgent } from "./positioningAgent";
import { competitorIntelligenceAgent } from "./competitorIntelligenceAgent";
import { communitySentimentAgent } from "./communitySentimentAgent";
import { loadSkillPrompt } from "./loadSkill";
import type { AgentEventCallback } from "@/lib/agent-events";
import { withAgentEvent } from "@/lib/agent-events";
import type { ReportType } from "@/lib/types";

export type SpecializedAgentName =
  | "strategist"
  | "copywriter"
  | "seo"
  | "conversion"
  | "distribution"
  | "reddit"
  | "narrative"
  | "positioning"
  | "competitor"
  | "sentiment";

export type SpecializedAgentOutputs = Record<string, string>;

const AGENT_MAX_TOKENS = 800;
const AGENT_TEMPERATURE = 0.7;

const BASE_AGENT_PROMPT = `You are part of an elite AI growth team auditing a startup doing $1M–$10M/year.

You will receive scraped website content.

Rules:
- Be brutally honest. If something is weak, say it clearly
- Every insight MUST reference something specific from the website (a headline, feature, CTA, etc.)
- NO generic advice that could apply to any startup
- NO buzzwords: "leverage", "supercharge", "unlock", "data-driven", "next-level"
- Keep the output concise, sharp, and slightly aggressive
- Maximum 3 bullets — quality over quantity
- Each bullet must be something the founder can do TODAY
- Mention the product name explicitly in every bullet`;

const STRATEGIST_PROMPT_INLINE = `${BASE_AGENT_PROMPT}

You are the Strategist Agent. You think like a CMO who has scaled 20+ startups.

Use the Ad Creative Matrix to evaluate positioning:
- Hook Analysis: Is the website using a Question, Bold Claim, Social Proof, Pain Point, or Curiosity Gap approach? Which would convert better?
- Offer Clarity: Is there a clear offer (Free Trial, Demo, Lead Magnet)? Is it compelling enough?
- Urgency: Is there any reason to act NOW? Score 0-10
- Visual Direction: Does the site's visual approach match its target market?

Focus on:
- What is the biggest positioning gap? Reference the actual headline and suggest a rewrite
- Who is the real ICP vs. who the site seems to target? Be specific about the mismatch
- What GTM move would move the needle fastest? (Pick ONE, not three)
- Apply the "5-Second Test": Can a visitor answer "What, Who, Why, What Next?" in 5 seconds?

Call out what's broken. Return a clean strategy summary with tactical bullets.`;

/** Loads the Strategist knowledge from SKILL.md at runtime, falls back to inline prompt */
function getStrategistPrompt(): string {
  const skill = loadSkillPrompt("strategist", STRATEGIST_PROMPT_INLINE);
  // If loaded from SKILL.md, prepend the shared base rules
  return skill === STRATEGIST_PROMPT_INLINE ? skill : `${BASE_AGENT_PROMPT}\n\n${skill}`;
}

const COPYWRITER_PROMPT = `${BASE_AGENT_PROMPT}

You are the Copywriter Agent. You write copy that converts, not copy that sounds nice.

You MUST use these proven frameworks in your analysis and suggestions:

**PAS (Problem → Agitate → Solution):**
- Identify the problem the product solves from the website
- Show how to agitate it (what happens if they DON'T fix it)
- Present the product as the solution

**AIDA (Attention → Interest → Desire → Action):**
- Grade the current website copy on each stage (A/I/D/A)
- Suggest improvements for the weakest stage

**The 4 U's for Headlines** — evaluate the current headline:
- Useful: Does it promise a benefit? (score 0-10)
- Urgent: Is there a reason to read NOW? (score 0-10)
- Ultra-specific: Does it use concrete numbers? (score 0-10)
- Unique: Is this a fresh angle? (score 0-10)

**Hook Categories for Virality** — suggest hooks using these formats:
- Contrarian: "Stop doing X. Here's why."
- Curiosity Gap: "This one thing changed how I..."
- Social Proof: "100K+ founders use this to..."
- Hot Take: "[Popular opinion] is dead."

**Emotional Triggers** — identify which emotion to target:
- Fear, Greed, Vanity, Authority, or Belonging

Rules: Lead with benefits NOT features. Use "you" more than "we". One idea per sentence. Concrete > Abstract.

Return punchy copy rewrites and messaging bullets. Include both a "safe" version and a "bold" version.`;

const SEO_PROMPT = `${BASE_AGENT_PROMPT}

You are the SEO Agent. You combine traditional SEO with AI search optimization.

**On-Page SEO Scorecard** — audit these elements:
- Title Tag: Is it 50-60 chars with keyword front-loaded?
- Meta Description: Is it 150-160 chars with a CTA?
- H1 Tag: Is there exactly ONE per page with the primary keyword?
- Header Hierarchy: Is it logical H1 → H2 → H3?
- URL Structure: Is it short and keyword-rich?
- Internal Links: Are there 3-5 relevant internal links?

**Keyword Research** using this process:
1. Extract seed keywords from the product's features and benefits
2. Generate long-tail expansions: "[seed] for [audience]", "best [seed]", "how to [seed]"
3. Identify question keywords: "what is", "how to", "vs", "alternative to"
4. Classify by search intent: Informational / Commercial / Transactional

**Generative Engine Optimization (GEO):**
- Is the content structured for AI extraction (bullets, tables, FAQs)?
- Are there direct answers that ChatGPT/Perplexity could surface?
- Is there proper schema markup for rich results?
- Are there E-E-A-T signals (Experience, Expertise, Authoritativeness, Trust)?

**Content Strategy:**
- Suggest 2-3 specific blog post titles using proven templates
- Identify one Pillar Page opportunity with 3-5 cluster topics
- Spot the #1 keyword the product should own (and WHY)

Return SEO opportunities as concise bullets with reasoning. Include specific keyword suggestions with estimated intent match.`;

const CONVERSION_PROMPT = `${BASE_AGENT_PROMPT}

You are the Conversion Agent. You audit landing pages like a CRO consultant billing $500/hour.

You MUST apply these CRO frameworks:

**LIFT Model** — evaluate each factor:
1. Value Proposition: Is the unique value IMMEDIATELY clear within 5 seconds? (score 0-10)
2. Relevance: Does the page match visitor intent? (score 0-10)
3. Clarity: Can a 12-year-old understand the message? (score 0-10)
4. Urgency: Is there any reason to act NOW vs. later? (score 0-10)
5. Anxiety: What fears/doubts does the visitor have? Are they addressed? (score 0-10)
6. Distraction: What elements pull attention AWAY from the primary CTA? (list them)

**AIDA Landing Page Audit:**
- Attention: Does the hero grab attention in <3 seconds?
- Interest: Does the subhead create curiosity or identify a pain point?
- Desire: Are benefits > features? Is there social proof?
- Action: Is the CTA clear, singular, and frictionless?

**CTA Optimization:**
- Specificity: "Start My Free Trial" > "Sign Up" > "Submit" — what does the current CTA say?
- Value Echo: Does the CTA echo the value prop?
- Visual Hierarchy: Is the CTA the most visually dominant element?
- Friction Score: How many steps before the user gets value?

**Trust Signal Checklist** — score the page:
- [ ] Logo bar / "As seen in"
- [ ] Testimonials with real names + photos
- [ ] Case study numbers (quantified results)
- [ ] Security badges / certifications
- [ ] Money-back guarantee or free trial
- [ ] Customer count or usage stats

**Mobile CRO:**
- Are CTA buttons thumb-friendly (48px+)?
- Is there a sticky CTA on scroll?
- Are forms using appropriate mobile keyboard types?

Return findings as: Critical Conversion Killers → High-Impact Opportunities → Quick Wins.
Each finding: quote the specific element, explain WHY it hurts (reference framework), give an exact rewrite.`;

const DISTRIBUTION_PROMPT = `${BASE_AGENT_PROMPT}

You are the Distribution Agent. You know exactly WHERE and HOW to get eyeballs on a product.

Use these platform-specific frameworks:

**Platform Strategy:**
- Twitter/X: Best under 100 chars. Sound like a person, not a brand. Hot takes and threads convert best.
- LinkedIn: Lead with business outcomes or data points. Document/carousel PDFs for B2B.
- Reddit: Identify specific subreddits where the ICP hangs out. Provide value first, promote subtly.
- Meta (FB/IG): Lead with hook in first 3 seconds. UGC-style outperforms polished ads.
- Product Hunt: Timing, maker comment strategy, early upvote coordination.

**The 3-3-3 Testing Framework:**
Suggest 3 variations for:
- 3 Hooks: Different opening angles (pain, gain, curiosity)
- 3 Offers: Different value propositions or incentives
- 3 Audiences: Different targeting segments

**Distribution Channels (be SPECIFIC):**
- Don't say "use Twitter" — say which hashtags, which influencers to engage, what thread angle to use
- Don't say "try Reddit" — name the exact subreddits, the post format, and the engagement strategy
- Don't say "content marketing" — name the exact blog post title, the distribution chain, the amplification tactic

**Growth Loops:**
- Identify ONE viral/referral loop that could compound (e.g., "invite = unlock feature", "share report = get credit")
- Identify ONE unfair advantage competitors are NOT using

Return actionable distribution ideas with exact platform + format + angle.`;

/**
 * Calls a specialist agent with an optional strategist brief injected into
 * the system prompt. When provided, the brief gives the agent awareness of
 * the strategic direction (ICP, positioning gaps, GTM) established by the
 * Strategist in Step 1.
 */
async function callAgent(
  systemPrompt: string,
  websiteContent: string,
  strategistBrief?: string
) {
  const enrichedPrompt = strategistBrief
    ? `${systemPrompt}\n\n---\n\n## Strategic Context (from the Strategist Agent — use this to align your recommendations)\n\n${strategistBrief}`
    : systemPrompt;

  return callFireworks(enrichedPrompt, websiteContent, {
    maxTokens: AGENT_MAX_TOKENS,
    temperature: AGENT_TEMPERATURE
  });
}

async function extractProductInfo(websiteContent: string) {
  const result = await callFireworks(
    "Extract the product name and a concise 1-sentence description from the website content. Return in JSON format: { \"name\": \"...\", \"description\": \"...\" }",
    websiteContent,
    {
      responseFormat: { type: "json_object" }
    }
  );

  try {
    return JSON.parse(result) as { name: string; description: string };
  } catch (e) {
    return { name: "this product", description: "an AI solution" };
  }
}

/* ─────────────── Individual Agent Runners ─────────────── */

export function runStrategistAgent(websiteContent: string) {
  return callAgent(getStrategistPrompt(), websiteContent);
}

export function runCopywriterAgent(websiteContent: string, strategistBrief?: string) {
  return callAgent(COPYWRITER_PROMPT, websiteContent, strategistBrief);
}

export function runSeoAgent(websiteContent: string, strategistBrief?: string) {
  return callAgent(SEO_PROMPT, websiteContent, strategistBrief);
}

export function runConversionAgent(websiteContent: string, strategistBrief?: string) {
  return callAgent(CONVERSION_PROMPT, websiteContent, strategistBrief);
}

export function runDistributionAgent(websiteContent: string, strategistBrief?: string) {
  return callAgent(DISTRIBUTION_PROMPT, websiteContent, strategistBrief);
}

/* ─────────────────────────────────────────────────────────
 * Inter-Agent Communication Flow
 * ─────────────────────────────────────────────────────────
 *
 *  DATA BRIDGES (Redis, read-only):
 *    - Outreach communities  → injected into websiteContent
 *    - Market Audit summary  → injected into Strategist + SEO
 *
 *  STEP 1 (Sequential):
 *    ┌─────────────────┐     ┌─────────────────────┐
 *    │ Strategist Agent │     │ extractProductInfo() │
 *    │  (runs FIRST)    │     │  (runs in parallel)  │
 *    │  + market audit  │     └──────────┬──────────┘
 *    │    context        │               │
 *    └────────┬────────┘                ▼
 *             │                    productInfo
 *             ▼
 *       strategistBrief
 *
 *  STEP 2 (Parallel — all receive strategistBrief):
 *    ┌──────────┬────────┬────────────┬──────────────┬────────┐
 *    │Copywriter│  SEO   │ Conversion │ Distribution │ Reddit │
 *    │  Agent   │ Agent  │   Agent    │    Agent     │ Agent  │
 *    │          │+audit  │            │              │        │
 *    └──────────┴────────┴────────────┴──────────────┴────────┘
 *              All 5 inject strategistBrief into system prompt
 *              SEO also receives market audit keyword gaps
 *
 *  STEP 3: All 6 outputs → Chief Aggregator
 *          (+ outreach context + market audit context)
 *
 * ──────────────────────────────────────────────────────── */
export async function runAllAgents(
  websiteContent: string,
  marketAuditSummary?: string,
  onEvent?: AgentEventCallback,
  selectedAgents?: string[]
): Promise<SpecializedAgentOutputs> {
  const isSelected = (agent: SpecializedAgentName) => 
    !selectedAgents || selectedAgents.includes(agent);

  // Step 1: Run Strategist + product info extraction in parallel.
  const [strategist, productInfo] = await Promise.all([
    isSelected("strategist")
      ? withAgentEvent(
          "strategist",
          "Analyzing positioning, ICP, and GTM strategy…",
          "Brief ready — broadcasting to the team.",
          () => runStrategistAgent(websiteContent),
          onEvent
        )
      : Promise.resolve("Strategist Agent was skipped by user selection."),
    withAgentEvent(
      "system",
      "Extracting product identity…",
      "Product identified.",
      () => extractProductInfo(websiteContent),
      onEvent
    )
  ]);

  // Step 2: Inject the Strategist's output into all remaining agents.
  const seoContext = marketAuditSummary
    ? `${strategist}\n\n${marketAuditSummary}`
    : strategist;

  const [copywriter, seo, conversion, distribution, reddit] = await Promise.all([
    isSelected("copywriter")
      ? withAgentEvent(
          "copywriter",
          "@Strategist — got the brief. Crafting hooks with PAS framework…",
          "Copy analysis complete.",
          () => runCopywriterAgent(websiteContent, strategist),
          onEvent
        )
      : Promise.resolve("Copywriter Agent was skipped by user selection."),
    isSelected("seo")
      ? withAgentEvent(
          "seo",
          "@Strategist — received. Running keyword analysis + GEO audit…",
          "SEO opportunities identified.",
          () => runSeoAgent(websiteContent, seoContext),
          onEvent
        )
      : Promise.resolve("SEO Agent was skipped by user selection."),
    isSelected("conversion")
      ? withAgentEvent(
          "conversion",
          "@Strategist — locked in. Auditing landing page with LIFT model…",
          "Conversion audit complete.",
          () => runConversionAgent(websiteContent, strategist),
          onEvent
        )
      : Promise.resolve("Conversion Agent was skipped by user selection."),
    isSelected("distribution")
      ? withAgentEvent(
          "distribution",
          "@Strategist — ICP noted. Mapping growth channels…",
          "Distribution plan mapped.",
          () => runDistributionAgent(websiteContent, strategist),
          onEvent
        )
      : Promise.resolve("Distribution Agent was skipped by user selection."),
    isSelected("reddit")
      ? withAgentEvent(
          "reddit",
          "Searching Reddit for live discussions about this product…",
          "Reddit scan complete.",
          () => redditAgent(productInfo.name || "this product", productInfo.description || "an AI solution"),
          onEvent
        )
      : Promise.resolve("Reddit Agent was skipped by user selection.")
  ]);

  return {
    strategist,
    copywriter,
    seo,
    conversion,
    distribution,
    reddit
  };
}

/* ─────────────────────────────────────────────────────────
 * Crypto-Native Report Pipeline
 * ─────────────────────────────────────────────────────────
 * Routes to the correct agent combination based on reportType.
 * Falls back to the legacy runAllAgents for backward compat.
 * ──────────────────────────────────────────────────────── */
export async function runAgentsForReport(
  reportType: ReportType,
  websiteContent: string,
  onEvent?: AgentEventCallback,
  selectedAgents?: string[],
  competitorContent?: string
): Promise<SpecializedAgentOutputs> {
  const outputs: Record<string, string> = {};
  const isSelected = (agent: string) =>
    !selectedAgents || selectedAgents.includes(agent);

  // Extract product info for Reddit agent
  const productInfo = await withAgentEvent(
    "system",
    "Extracting product identity…",
    "Product identified.",
    () => extractProductInfo(websiteContent),
    onEvent
  );

  switch (reportType) {
    case "token-narrative": {
      // Sequential: Narrative first → then Positioning + Copywriter in parallel
      if (isSelected("narrative")) {
        outputs.narrative = await withAgentEvent(
          "narrative" as any,
          "Analyzing protocol narrative and story clarity…",
          "Narrative audit complete.",
          () => narrativeAgent(websiteContent),
          onEvent
        );
      }

      const parallel = await Promise.all([
        isSelected("positioning")
          ? withAgentEvent(
              "positioning" as any,
              "Evaluating protocol positioning and category ownership…",
              "Positioning analysis complete.",
              () => positioningAgent(websiteContent),
              onEvent
            )
          : Promise.resolve("Positioning Agent skipped."),
        isSelected("copywriter")
          ? withAgentEvent(
              "copywriter",
              "Crafting crypto-native copy rewrites…",
              "Copy analysis complete.",
              () => runCopywriterAgent(websiteContent, outputs.narrative),
              onEvent
            )
          : Promise.resolve("Copywriter Agent skipped."),
      ]);
      outputs.positioning = parallel[0];
      outputs.copywriter = parallel[1];
      break;
    }

    case "competitor-battle-card": {
      if (!competitorContent) {
        throw new Error("Competitor URL content is required for Battle Card report.");
      }

      // Run competitor + SEO + positioning in parallel
      const [competitor, seo, positioning] = await Promise.all([
        isSelected("competitor")
          ? withAgentEvent(
              "competitor" as any,
              "Running head-to-head competitor intelligence…",
              "Competitor analysis complete.",
              () => competitorIntelligenceAgent(websiteContent, competitorContent),
              onEvent
            )
          : Promise.resolve("Competitor Agent skipped."),
        isSelected("seo")
          ? withAgentEvent(
              "seo",
              "Analyzing SEO gaps and discoverability…",
              "SEO analysis complete.",
              () => runSeoAgent(websiteContent),
              onEvent
            )
          : Promise.resolve("SEO Agent skipped."),
        isSelected("positioning")
          ? withAgentEvent(
              "positioning" as any,
              "Scoring positioning differentiation…",
              "Positioning complete.",
              () => positioningAgent(websiteContent, competitorContent),
              onEvent
            )
          : Promise.resolve("Positioning Agent skipped."),
      ]);
      outputs.competitor = competitor;
      outputs.seo = seo;
      outputs.positioning = positioning;
      break;
    }

    case "community-health": {
      // Reddit first (provides data for sentiment), then sentiment + distribution in parallel
      if (isSelected("reddit")) {
        outputs.reddit = await withAgentEvent(
          "reddit",
          "Scanning Reddit for community discussions…",
          "Reddit scan complete.",
          () => redditAgent(productInfo.name || "this protocol", productInfo.description || "a crypto protocol"),
          onEvent
        );
      }

      const [sentiment, distribution] = await Promise.all([
        isSelected("sentiment")
          ? withAgentEvent(
              "sentiment" as any,
              "Analyzing community sentiment and health…",
              "Sentiment analysis complete.",
              () => communitySentimentAgent(outputs.reddit || "No Reddit data available."),
              onEvent
            )
          : Promise.resolve("Sentiment Agent skipped."),
        isSelected("distribution")
          ? withAgentEvent(
              "distribution",
              "Mapping crypto community distribution channels…",
              "Distribution plan mapped.",
              () => runDistributionAgent(websiteContent),
              onEvent
            )
          : Promise.resolve("Distribution Agent skipped."),
      ]);
      outputs.sentiment = sentiment;
      outputs.distribution = distribution;
      break;
    }

    case "launch-readiness": {
      // All agents — Narrative first, then everything else in parallel
      if (isSelected("narrative")) {
        outputs.narrative = await withAgentEvent(
          "narrative" as any,
          "Analyzing protocol narrative for launch readiness…",
          "Narrative audit complete.",
          () => narrativeAgent(websiteContent),
          onEvent
        );
      }

      // Reddit next (provides data for sentiment)
      if (isSelected("reddit")) {
        outputs.reddit = await withAgentEvent(
          "reddit",
          "Scanning Reddit for community sentiment…",
          "Reddit scan complete.",
          () => redditAgent(productInfo.name || "this protocol", productInfo.description || "a crypto protocol"),
          onEvent
        );
      }

      // Remaining agents in parallel
      const [positioning, competitor, sentiment, seo, copywriter] = await Promise.all([
        isSelected("positioning")
          ? withAgentEvent("positioning" as any, "Evaluating positioning…", "Positioning done.", () => positioningAgent(websiteContent), onEvent)
          : Promise.resolve("Positioning skipped."),
        isSelected("competitor") && competitorContent
          ? withAgentEvent("competitor" as any, "Scanning competitor…", "Competitor done.", () => competitorIntelligenceAgent(websiteContent, competitorContent), onEvent)
          : Promise.resolve("Competitor scan skipped (no competitor URL)."),
        isSelected("sentiment")
          ? withAgentEvent("sentiment" as any, "Analyzing sentiment…", "Sentiment done.", () => communitySentimentAgent(outputs.reddit || "No Reddit data."), onEvent)
          : Promise.resolve("Sentiment skipped."),
        isSelected("seo")
          ? withAgentEvent("seo", "Running SEO audit…", "SEO done.", () => runSeoAgent(websiteContent), onEvent)
          : Promise.resolve("SEO skipped."),
        isSelected("copywriter")
          ? withAgentEvent("copywriter", "Crafting copy…", "Copy done.", () => runCopywriterAgent(websiteContent, outputs.narrative), onEvent)
          : Promise.resolve("Copywriter skipped."),
      ]);
      outputs.positioning = positioning;
      outputs.competitor = competitor;
      outputs.sentiment = sentiment;
      outputs.seo = seo;
      outputs.copywriter = copywriter;
      break;
    }

    case "weekly-pulse": {
      // Lightweight versions — Reddit first, then sentiment + competitor in parallel
      if (isSelected("reddit")) {
        outputs.reddit = await withAgentEvent(
          "reddit",
          "Quick-scanning Reddit for weekly pulse…",
          "Reddit pulse captured.",
          () => redditAgent(productInfo.name || "this protocol", productInfo.description || "a crypto protocol"),
          onEvent
        );
      }

      const [sentiment, competitor] = await Promise.all([
        isSelected("sentiment")
          ? withAgentEvent(
              "sentiment" as any,
              "Quick-reading community sentiment…",
              "Sentiment pulse done.",
              () => communitySentimentAgent(outputs.reddit || "No Reddit data.", true),
              onEvent
            )
          : Promise.resolve("Sentiment skipped."),
        isSelected("competitor") && competitorContent
          ? withAgentEvent(
              "competitor" as any,
              "Quick-scanning competitor changes…",
              "Competitor pulse done.",
              () => competitorIntelligenceAgent(websiteContent, competitorContent, true),
              onEvent
            )
          : Promise.resolve("Competitor pulse skipped."),
      ]);
      outputs.sentiment = sentiment;
      outputs.competitor = competitor;
      break;
    }
  }

  return outputs;
}
