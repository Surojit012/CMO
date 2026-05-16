import { NextRequest, NextResponse } from "next/server";
import { checkAIGEOReadiness } from "@/lib/geo-checker";
import { supabaseServer } from "@/lib/supabase";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { storeMarketAudit } from "@/lib/market-audit-bridge";

export const maxDuration = 60; // 60 seconds max execution time for Vercel Hobby

const SYSTEM_PROMPT = `You are a senior market analyst and startup advisor with 20 years of experience.

You will receive:
1. Scraped website content
2. Real-time research data from web searches

Your job: produce a comprehensive, action-oriented market audit as a JSON object.

## ABSOLUTE RULES

### For QUANTITATIVE / RESEARCH-DEPENDENT fields:
These fields require external data. If the research data genuinely doesn't contain the answer, you may use "data unavailable":
- marketSnapshot.addressableMarket
- marketSnapshot.marketLeader
- marketSnapshot.marketLeaderShare
- marketSnapshot.competitorCount
- pricingIntelligence.competitors[].price

### For ALL OTHER FIELDS — you MUST synthesize an answer:
You are a senior analyst. You have the website content. You can deduce:
- Who the ICP is (from the language, design, features described)
- What the messaging angle should be (from their current copy)
- SWOT analysis (from the product description and competitive landscape)
- Founder Score (evaluate product quality, distribution channels, monetization clarity, defensibility)
- Moat analysis (what makes them defensible or not)
- Risk radar (every product has risks — identify them)
- Growth opportunities (find angles they're missing)
- Quick wins (tactical improvements)
- Battle card (how to sell against competitors)
- SEO gaps (keyword opportunities in their space)

⚠️ NEVER return "data unavailable", "N/A", "unknown", or empty strings for strategic fields.
⚠️ NEVER return 0 for founderScore unless the product literally does not exist.
⚠️ Every array (competitors, riskRadar, quickWins, growthOpportunities, seoGaps, battleCard.competitors) MUST have at least 3 entries.

## SCORING GUIDELINES for founderScore:
- A live, working product with clear features = product score 40-80
- Any organic traffic or social presence = distribution score 30-60
- Clear pricing or monetization = monetisation score 40-70
- Network effects, data moats, brand = defensibility score 20-60
- Overall = weighted average, minimum 15 for any live product

Return ONLY valid JSON with this exact structure:
{
  "productName": "string",
  "tagline": "string — synthesize from website hero section",
  "category": "string — e.g. 'Sports Media', 'SaaS', 'E-commerce'",
  "date": "string — today's date",
  "marketSnapshot": {
    "addressableMarket": "string — dollar figure or 'data unavailable'",
    "marketLeader": "string — name or 'data unavailable'",
    "marketLeaderShare": "string — percentage or 'data unavailable'",
    "competitorCount": "string — number or 'data unavailable'",
    "competitorCountLabel": "string — e.g. 'Active Competitors'"
  },
  "competitors": [
    {
      "name": "string",
      "positioning": "string",
      "focus": "string",
      "monetisation": "string",
      "ux": "string",
      "transparency": "string",
      "highlight": "string",
      "highlightType": "good | bad | neutral"
    }
  ],
  "differentiatorRadar": [
    { "label": "string", "score": "number 1-10", "max": 10 }
  ],
  "swot": {
    "strengths": ["string — minimum 3"],
    "weaknesses": ["string — minimum 3"],
    "opportunities": ["string — minimum 3"],
    "threats": ["string — minimum 3"]
  },
  "growthOpportunities": [
    {
      "rank": "number",
      "tag": "string",
      "tagType": "Revenue | Acquisition | Product | Retention | Trust",
      "title": "string",
      "description": "string — 2-3 sentences"
    }
  ],
  "verdict": {
    "summary": "string — 3-4 sentence strategic summary",
    "coreOpportunity": "string — biggest untapped opportunity",
    "criticalGap": "string — most urgent weakness",
    "technicalIssues": ["string — minimum 2"],
    "monetisationPath": "string — recommended path to revenue"
  },
  "founderScore": {
    "overall": "number 15-100",
    "product": "number 15-100",
    "distribution": "number 15-100",
    "monetisation": "number 15-100",
    "defensibility": "number 15-100",
    "interpretation": "string — 2-3 sentence analysis"
  },
  "icp": {
    "title": "string — persona name like 'The Growth-Hungry Founder'",
    "description": "string — 2-3 sentence persona description",
    "age": "string — age range",
    "role": "string",
    "painPoint": "string — primary pain",
    "whereTheyHangOut": ["string — minimum 3 channels"],
    "budgetRange": "string",
    "decisionTrigger": "string"
  },
  "messagingAngle": {
    "oneLiner": "string — one powerful sentence",
    "tagline": "string — short memorable phrase",
    "heroHeadline": "string — homepage hero headline",
    "subheadline": "string — supporting line",
    "reasoning": "string — why this messaging works"
  },
  "pricingIntelligence": {
    "competitors": [
      {
        "name": "string",
        "price": "string",
        "model": "string"
      }
    ],
    "recommendedPrice": "string",
    "recommendedModel": "string",
    "pricingGap": "string — strategic pricing insight"
  },
  "seoGaps": [
    {
      "keyword": "string",
      "difficulty": "low | medium | high",
      "volume": "string",
      "currentRanker": "string",
      "blogTitleIdea": "string"
    }
  ],
  "quickWins": [
    {
      "task": "string",
      "deadline": "string — e.g. 'This week', '48 hours'",
      "impact": "high | medium | low",
      "effort": "high | medium | low",
      "howTo": "string — 2-3 sentence execution guide"
    }
  ],
  "moatScore": {
    "score": "number 1-10",
    "type": "string — e.g. 'Brand Moat', 'Network Effect', 'Data Moat', 'None Yet'",
    "defensibility": "string — 2-3 sentence analysis",
    "risks": ["string — minimum 2"],
    "suggestions": ["string — minimum 2"]
  },
  "riskRadar": [
    {
      "risk": "string",
      "severity": "critical | high | medium",
      "timeline": "string — e.g. '0-3 months', '3-6 months'",
      "mitigation": "string — how to address it"
    }
  ],
  "battleCard": {
    "competitors": [
      {
        "name": "string",
        "whenMentioned": "string — scenario when prospect mentions this competitor",
        "ourResponse": "string — sales script response",
        "keyDifferentiator": "string"
      }
    ]
  }
}

Be specific, opinionated, and actionable. No generic advice. Write like a $500/hr consultant.`;

async function searchTavily(query: string, depth: 'basic' | 'advanced' = 'advanced'): Promise<string> {
  try {
    const response = await fetch(
      'https://api.tavily.com/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: depth,
          max_results: 8,
          include_answer: true
        })
      }
    );
    const data = await response.json();
    const answer = data.answer || '';
    const results = data.results
      ?.map((r: any) => `${r.title}: ${r.content}`)
      .join('\n') || '';
    return `${answer}\n${results}`.trim();
  } catch (err) {
    console.error('Tavily search failed:', err);
    return '';
  }
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

/**
 * Validates that the LLM response has actually filled in strategic sections.
 */
function isAuditComplete(audit: any): boolean {
  const unavailable = (v: any) => {
    if (v === undefined || v === null) return true;
    if (typeof v === 'number') return v === 0;
    if (typeof v === 'string') {
      const n = v.trim().toLowerCase();
      return n === '' || n === 'string' || n === 'data unavailable' || n === 'n/a' || n === 'unknown' || n === 'not available';
    }
    return false;
  };

  let failures = 0;
  if (unavailable(audit.founderScore?.interpretation)) failures++;
  if (audit.founderScore?.overall === 0 || unavailable(audit.founderScore?.overall)) failures++;
  if (unavailable(audit.icp?.title)) failures++;
  if (unavailable(audit.icp?.painPoint)) failures++;
  if (unavailable(audit.messagingAngle?.oneLiner)) failures++;
  if (unavailable(audit.messagingAngle?.heroHeadline)) failures++;
  if (unavailable(audit.moatScore?.defensibility)) failures++;
  if (unavailable(audit.verdict?.summary)) failures++;
  if (!Array.isArray(audit.riskRadar) || audit.riskRadar.length === 0) failures++;
  if (!Array.isArray(audit.quickWins) || audit.quickWins.length === 0) failures++;
  if (!Array.isArray(audit.growthOpportunities) || audit.growthOpportunities.length === 0) failures++;

  return failures <= 2;
}

/**
 * Primary: Groq — LLaMA 3.3 70B Versatile (free, fast, better JSON compliance than 3.1)
 */
async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

/**
 * Fallback: Fireworks — LLaMA 3.3 70B (free tier)
 */
async function callFireworks(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) throw new Error("FIREWORKS_API_KEY is not configured");

  const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'accounts/fireworks/models/deepseek-v4-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Fireworks API error:', response.status, errorBody);
    throw new Error(`Fireworks API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

/**
 * Last resort fallback: NVIDIA NIM
 */
async function callNvidia(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured");

  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    }
  );

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

function buildUserPrompt(url: string, scrapedContent: string, researchData: {
  competitorData: string;
  marketData: string;
  pricingData: string;
  alternativesData: string;
  reviewsData: string;
}): string {
  return `
Website URL: ${url}

Website Content (scraped):
${scrapedContent}

REAL-TIME RESEARCH DATA (use this for accuracy):

Competitor Intelligence:
${researchData.competitorData || 'No data found'}

Market Size & Industry Data:
${researchData.marketData || 'No data found'}

Pricing Intelligence:
${researchData.pricingData || 'No data found'}

Alternatives & Comparisons:
${researchData.alternativesData || 'No data found'}

User Reviews & Sentiment:
${researchData.reviewsData || 'No data found'}

CRITICAL REMINDERS:
1. For quantitative fields (market size, competitor prices): use research data. Say "data unavailable" ONLY if genuinely missing.
2. For ALL strategic fields (ICP, messaging, SWOT, moat, risk, growth, quick wins, founder score, battle card, verdict): you MUST produce substantive analysis based on the website content. NEVER say "data unavailable" for these.
3. founderScore.overall MUST be a realistic number (15-85 for most products). A live website = minimum 15.
4. Every array must have at least 3 items.
5. Return ONLY the JSON object. No markdown, no explanation, no wrapping.
`;
}

function extractJSON(content: string): string {
  // Strip markdown code fences if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Find the JSON object boundaries
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.substring(firstBrace, lastBrace + 1);
  }

  return content;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getPrivyUserIdFromRequest(req);
    const sessionId = req.headers.get("x-cmo-session-id") || null;
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Scrape website
    let scrapedContent = "Failed to scrape content.";
    try {
      const jinaResponse = await fetchWithTimeout(`https://r.jina.ai/${url}`, {
        headers: { Accept: "text/plain" },
      }, 15000);

      if (jinaResponse.ok) {
        scrapedContent = await jinaResponse.text();
        if (scrapedContent.length > 80000) {
          scrapedContent = scrapedContent.substring(0, 80000) + "\n\n...[TRUNCATED]";
        }
      } else {
        console.warn(`Jina scrape failed for ${url} with status ${jinaResponse.status}`);
      }
    } catch (scrapeError) {
      console.warn(`Jina scrape network error for ${url}:`, scrapeError);
    }

    const productName = url
      .replace('https://', '')
      .replace('http://', '')
      .replace('www.', '')
      .split('.')[0];

    console.log('Searching for:', productName);

    // Step 2: GEO checks + Tavily research in parallel
    const [
      geoScore,
      competitorData,
      marketData,
      pricingData,
      alternativesData,
      reviewsData
    ] = await Promise.all([
      checkAIGEOReadiness(url, scrapedContent),
      searchTavily(`${productName} competitors alternatives 2025 2026`, 'advanced'),
      searchTavily(`${productName} market size industry trends TAM`, 'advanced'),
      searchTavily(`${productName} pricing plans how much does it cost`, 'advanced'),
      searchTavily(`best alternatives to ${productName} comparison review`, 'advanced'),
      searchTavily(`${productName} reviews user feedback pros cons`, 'advanced')
    ]);

    console.log('Tavily + GEO checks complete');

    const userPrompt = buildUserPrompt(url, scrapedContent, {
      competitorData,
      marketData,
      pricingData,
      alternativesData,
      reviewsData
    });

    // Step 3: Call LLMs with fallback chain: Groq → Fireworks → NVIDIA
    const providers = [
      { name: 'Groq', fn: callGroq },
      { name: 'Fireworks', fn: callFireworks },
      { name: 'NVIDIA', fn: callNvidia },
    ];

    let parsedAudit: any = null;

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name}...`);
        const content = await provider.fn(SYSTEM_PROMPT, userPrompt);
        const jsonStr = extractJSON(content);
        const parsed = JSON.parse(jsonStr);

        if (isAuditComplete(parsed)) {
          console.log(`${provider.name}: audit complete ✓`);
          parsedAudit = parsed;
          break;
        } else {
          console.warn(`${provider.name}: audit incomplete, trying next provider...`);
          // Keep as fallback if all providers fail validation
          if (!parsedAudit) parsedAudit = parsed;
        }
      } catch (err) {
        console.error(`${provider.name} failed:`, err);
      }
    }

    if (!parsedAudit) {
      return NextResponse.json(
        { error: "All AI providers failed. Please try again." },
        { status: 502 }
      );
    }

    // Step 4: Enrich with metadata
    if (!parsedAudit.date || parsedAudit.date === "string") {
      parsedAudit.date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    parsedAudit.url = url;
    parsedAudit.geoScore = geoScore;

    // Data bridge: Store compact summary in Redis for the core Growth Analysis pipeline.
    // Fire-and-forget — we don't block the API response on Redis writes.
    storeMarketAudit(url, parsedAudit).catch((err) =>
      console.error("[market-audit] Bridge store failed:", err)
    );

    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const auditId = `audit-${crypto.randomUUID()}`; // Using a prefixed UUID just defensively
      try {
        await supabaseServer.from("saved_reports").insert({
          user_id: userId,
          session_id: sessionId,
          url: url,
          type: "audit",
          data: parsedAudit
        });
      } catch (err) {
        console.error("Supabase insert error [audit]:", err);
      }
    }

    return NextResponse.json(parsedAudit);
  } catch (error) {
    console.error("Market audit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during the market audit." },
      { status: 500 }
    );
  }
}
