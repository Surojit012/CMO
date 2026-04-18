import { callFireworks } from "@/lib/ai-router";
import { loadSkillPrompt } from "./loadSkill";

/* ─────────────────────────────────────────────────────────
 * Reddit Intelligence Agent
 * ─────────────────────────────────────────────────────────
 * Knowledge base: .agents/skills/reddit-intel/SKILL.md
 *
 * This agent operates in two phases:
 *   Phase 1 — Extract high-intent keywords from product info
 *   Phase 2 — Analyze scraped Reddit posts for engagement opportunities
 *
 * The SKILL.md contains the complete rules, constraints, and examples.
 * It is loaded at runtime and appended to the system prompts so that
 * edits to the skill file take effect without code changes.
 * ──────────────────────────────────────────────────────── */

const KEYWORD_PROMPT_INLINE = "You are a master at extraction. Extract 3-5 high-intent keywords for Reddit search that would capture conversations where people are looking for a solution like this product. Return only the keywords separated by commas.";

function buildAnalysisPrompt(productName: string): string {
  return `You are a Reddit intelligence agent for a growth team.
You have been given Reddit posts related to a product: ${productName}.
Your job is to:
1. Identify posts where this product could be mentioned or recommended
2. Find pain points people are complaining about that this product solves
3. Suggest exact subreddits to target for organic growth
4. Write 2 sample Reddit comments the founder could post naturally (not spammy)

Be specific. Reference actual post titles. No generic advice.`;
}

/** Loads the reddit-intel SKILL.md knowledge and appends it to system prompts */
function getSkillContext(): string {
  const skill = loadSkillPrompt("reddit-intel", "");
  return skill ? `\n\n---\n\n## Agent Knowledge Base\n\n${skill}` : "";
}

export async function redditAgent(productName: string, productDescription: string) {
  const skillContext = getSkillContext();

  // Phase 1: Extract keywords using AI (enriched with SKILL.md rules)
  const keywordsRaw = await callFireworks(
    KEYWORD_PROMPT_INLINE + skillContext,
    `Product: ${productName}\nDescription: ${productDescription}`,
    { maxTokens: 50 }
  );

  const keywords = keywordsRaw.split(",").map((k: string) => k.trim()).filter(Boolean);

  // Take the top 2 keywords to keep it focused and fast
  const searchKeywords = keywords.slice(0, 2);

  const fetchReddit = async (url: string) => {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (CMO AI Growth Team; +https://example.com)"
        }
      });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  };

  const allPosts: any[] = [];

  for (const keyword of searchKeywords) {
    const urls = [
      `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=10`,
      `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=hot&limit=10`,
      `https://www.reddit.com/r/startups/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=5`
    ];

    const results = await Promise.all(urls.map(u => fetchReddit(u)));

    results.forEach(data => {
      if (data?.data?.children) {
        data.data.children.forEach((child: any) => {
          const p = child.data;
          allPosts.push({
            title: p.title,
            subreddit: p.subreddit,
            url: `https://reddit.com${p.permalink}`,
            upvotes: p.ups,
            comments: p.num_comments
          });
        });
      }
    });
  }

  // Remove duplicates
  const uniquePosts = Array.from(new Set(allPosts.map(p => p.url)))
    .map(url => allPosts.find(p => p.url === url))
    .slice(0, 15);

  if (uniquePosts.length === 0) {
    return "No relevant Reddit discussions found.";
  }

  const redditContext = uniquePosts.map(p => 
    `Title: ${p.title}\nSubreddit: r/${p.subreddit}\nURL: ${p.url}\nUpvotes: ${p.upvotes}\nComments: ${p.comments}`
  ).join("\n\n---\n\n");

  // Phase 2: Analyze Reddit posts (enriched with SKILL.md rules)
  const result = await callFireworks(
    buildAnalysisPrompt(productName) + skillContext,
    `Product Details:\nName: ${productName}\nDescription: ${productDescription}\n\nReddit Data:\n${redditContext}`,
    { maxTokens: 1000, temperature: 0.7 }
  );

  return result;
}

