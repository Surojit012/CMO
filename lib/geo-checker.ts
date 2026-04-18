type Importance = "critical" | "high" | "medium";

export type CheckResult = {
  name: string;
  passed: boolean;
  importance: Importance;
  fix: string;
};

export type GeoReadinessResult = {
  score: number;
  passed: number;
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: CheckResult[];
  topFixes: string[];
};

const REQUEST_TIMEOUT_MS = 12000;
const AI_CRAWLER_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

function normalizeUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function gradeFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function stripHtml(input: string): string {
  return (input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWords(input: string): string[] {
  return (input || "")
    .replace(/[#>*`_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/plain, text/html, application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkAIGEOReadiness(
  url: string,
  scrapedContent: string
): Promise<GeoReadinessResult> {
  const checks: CheckResult[] = [];
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    return {
      score: 0,
      passed: 0,
      total: 15,
      grade: "F",
      checks: [
        {
          name: "Input URL validity",
          passed: false,
          importance: "critical",
          fix: "Provide a valid website URL before running AI/GEO checks.",
        },
      ],
      topFixes: ["Provide a valid website URL before running AI/GEO checks."],
    };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(normalizedUrl);
  } catch {
    return {
      score: 0,
      passed: 0,
      total: 15,
      grade: "F",
      checks: [
        {
          name: "Input URL validity",
          passed: false,
          importance: "critical",
          fix: "Use a complete URL such as https://example.com for accurate AI/GEO analysis.",
        },
      ],
      topFixes: ["Use a complete URL such as https://example.com for accurate AI/GEO analysis."],
    };
  }

  const origin = urlObj.origin;
  const [pageResponse, robotsResponse, sitemapResponse, llmsResponse] = await Promise.all([
    fetchText(normalizedUrl),
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
    fetchText(`${origin}/llms.txt`),
  ]);

  const pageHtml = pageResponse.text || "";
  const pageText = stripHtml(pageHtml);
  const scrapedWords = extractWords(scrapedContent);

  const robotsTxt = robotsResponse.text.toLowerCase();
  const wildcardDisallowAll = /user-agent:\s*\*[\s\S]*?disallow:\s*\/(?:\s|$)/i.test(robotsTxt);
  const aiSpecificDisallow = AI_CRAWLER_BOTS.some((bot) => {
    const pattern = new RegExp(
      `user-agent:\\s*${escapeRegExp(bot)}[\\s\\S]*?disallow:\\s*\\/`,
      "i"
    );
    return pattern.test(robotsTxt);
  });
  const robotsAllowsAi = robotsResponse.ok && !wildcardDisallowAll && !aiSpecificDisallow;
  checks.push({
    name: "robots.txt exists and allows AI crawlers",
    passed: robotsAllowsAi,
    importance: "critical",
    fix: "Add /robots.txt and allow GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, and Google-Extended to crawl key pages.",
  });

  const sitemapExists =
    sitemapResponse.ok &&
    /<(urlset|sitemapindex)\b/i.test(sitemapResponse.text);
  checks.push({
    name: "sitemap.xml exists",
    passed: sitemapExists,
    importance: "critical",
    fix: "Publish /sitemap.xml with all indexable URLs and submit it in search console tools.",
  });

  const llmsExists = llmsResponse.ok && llmsResponse.text.trim().length > 20;
  checks.push({
    name: "llms.txt exists (new AI crawler standard)",
    passed: llmsExists,
    importance: "critical",
    fix: "Create /llms.txt at your root with product summary, core pages, docs, pricing, and contact links for LLM crawlers.",
  });

  const canonicalMatch =
    pageHtml.match(
      /<link[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
    ) ||
    pageHtml.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i
    );
  let canonicalPassed = false;
  if (canonicalMatch?.[1]) {
    try {
      const canonicalUrl = new URL(canonicalMatch[1], normalizedUrl);
      canonicalPassed = canonicalUrl.hostname === urlObj.hostname;
    } catch {
      canonicalPassed = false;
    }
  }
  checks.push({
    name: "Canonical URL set correctly",
    passed: canonicalPassed,
    importance: "high",
    fix: "Set one canonical URL per page using <link rel=\"canonical\" href=\"https://yourdomain/...\"> and keep host/protocol consistent.",
  });

  const langMatch = pageHtml.match(/<html[^>]*\blang=["']([a-zA-Z-]+)["'][^>]*>/i);
  checks.push({
    name: "Language attribute set (html lang=\"en\")",
    passed: Boolean(langMatch?.[1]),
    importance: "high",
    fix: "Add a language attribute on the html tag (for example <html lang=\"en\">).",
  });

  const descriptionMatch =
    pageHtml.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
    ) ||
    pageHtml.match(
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i
    );
  const descriptionLength = descriptionMatch?.[1]?.trim().length ?? 0;
  checks.push({
    name: "Meta description exists and is 150-160 chars",
    passed: descriptionLength >= 150 && descriptionLength <= 160,
    importance: "high",
    fix: "Write a unique meta description between 150 and 160 characters summarizing value and audience.",
  });

  const jsFreeWordCount = extractWords(pageText).length;
  checks.push({
    name: "Page loads without JS (for crawlers)",
    passed: pageResponse.ok && jsFreeWordCount >= 60,
    importance: "critical",
    fix: "Ensure core copy and links are server-rendered so crawlers can read content without executing JavaScript.",
  });

  const h1Matches = [...pageHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    stripHtml(m[1])
  );
  checks.push({
    name: "Clear H1 heading exists",
    passed: h1Matches.some((h1) => h1.length > 8),
    importance: "critical",
    fix: "Add a single clear H1 that states the main outcome your product delivers.",
  });

  const headingOrder = [...pageHtml.matchAll(/<h([1-3])\b/gi)].map((m) => Number(m[1]));
  const h1Index = headingOrder.indexOf(1);
  const h2Index = headingOrder.indexOf(2);
  const h3Index = headingOrder.indexOf(3);
  const hierarchyPassed =
    h1Index !== -1 && h2Index !== -1 && h3Index !== -1 && h1Index < h2Index && h2Index < h3Index;
  checks.push({
    name: "Heading hierarchy (H1→H2→H3)",
    passed: hierarchyPassed,
    importance: "high",
    fix: "Use semantic heading order (H1 then H2 sections then H3 subsections) to help crawlers map page structure.",
  });

  checks.push({
    name: "Content depth (>500 words)",
    passed: scrapedWords.length > 500,
    importance: "high",
    fix: "Expand core pages to 500+ words with concrete use cases, proof points, and implementation details.",
  });

  const faqExists = /(\bfaq\b|frequently asked questions|^#+\s*faq)/im.test(
    `${scrapedContent}\n${pageText}`
  );
  checks.push({
    name: "FAQ section exists (great for AI answers)",
    passed: faqExists,
    importance: "medium",
    fix: "Add an FAQ section with concise Q&A blocks targeting real buyer objections and comparison queries.",
  });

  const hasSchemaMarkup =
    /application\/ld\+json/i.test(pageHtml) ||
    /schema\.org/i.test(pageHtml) ||
    /itemtype=["'][^"']*schema\.org/i.test(pageHtml);
  checks.push({
    name: "Structured data / Schema.org markup present",
    passed: hasSchemaMarkup,
    importance: "high",
    fix: "Add JSON-LD schema (Organization, Product, FAQPage, Article where relevant) so LLMs can parse entities and facts.",
  });

  const first100Words = scrapedWords.slice(0, 100).join(" ").toLowerCase();
  const valuePropSignals = [
    /\b(helps?|helping)\b/,
    /\b(platform|tool|software|product)\b/,
    /\bfor\b/,
    /\b(automate|simplif|accelerat|reduce|improve|grow)\b/,
  ];
  const signalHits = valuePropSignals.reduce((count, signal) => {
    return signal.test(first100Words) ? count + 1 : count;
  }, 0);
  checks.push({
    name: "Clear value proposition in first 100 words",
    passed: first100Words.length > 0 && signalHits >= 2,
    importance: "critical",
    fix: "Rewrite the first paragraph to clearly state who the product is for, what outcome it delivers, and why it is different.",
  });

  const hasAuthorEntityInfo = /(\babout\b|\bteam\b|founder|author|written by|company|contact|inc\.|llc|ltd|copyright|©)/i.test(
    `${scrapedContent}\n${pageText}`
  );
  checks.push({
    name: "Author/entity information present",
    passed: hasAuthorEntityInfo,
    importance: "high",
    fix: "Add visible company/author details with entity signals (team page, about section, contact, legal footer).",
  });

  const hasLastUpdated = /(last updated|updated on|published on|modified on|updated:|20\d{2}[-/]\d{1,2}[-/]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},\s+20\d{2})/i.test(
    `${scrapedContent}\n${pageText}`
  );
  checks.push({
    name: "Last updated date visible",
    passed: hasLastUpdated,
    importance: "medium",
    fix: "Show a visible 'Last updated' date on key pages so AI systems can trust freshness.",
  });

  const total = checks.length;
  const passed = checks.filter((check) => check.passed).length;
  const score = Math.round((passed / total) * 100);
  const grade = gradeFromScore(score);

  const importanceRank: Record<Importance, number> = {
    critical: 3,
    high: 2,
    medium: 1,
  };

  const topFixes = checks
    .filter((check) => !check.passed)
    .sort((a, b) => importanceRank[b.importance] - importanceRank[a.importance])
    .map((check) => check.fix)
    .filter((fix, index, allFixes) => allFixes.indexOf(fix) === index)
    .slice(0, 3);

  return {
    score,
    passed,
    total,
    grade,
    checks,
    topFixes,
  };
}
