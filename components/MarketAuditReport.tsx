import React, { useMemo, useState } from 'react';

export type MarketAuditData = {
  productName: string;
  tagline: string;
  category: string;
  date: string;
  url?: string; // Passed from parent
  marketSnapshot: {
    addressableMarket: string;
    marketLeader: string;
    marketLeaderShare: string;
    competitorCount: string;
    competitorCountLabel: string;
  };
  competitors: Array<{
    name: string;
    positioning: string;
    focus: string;
    monetisation: string;
    ux: string;
    transparency: string;
    highlight: string;
    highlightType: 'good' | 'bad' | 'neutral';
  }>;
  differentiatorRadar: Array<{ label: string; score: number; max: number }>;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  growthOpportunities: Array<{
    rank: number;
    tag: string;
    tagType: 'Revenue' | 'Acquisition' | 'Product' | 'Retention' | 'Trust';
    title: string;
    description: string;
  }>;
  verdict: {
    summary: string;
    coreOpportunity: string;
    criticalGap: string;
    technicalIssues: string[];
    monetisationPath: string;
  };
  founderScore: {
    overall: number;
    product: number;
    distribution: number;
    monetisation: number;
    defensibility: number;
    interpretation: string;
  };
  icp: {
    title: string;
    description: string;
    age: string;
    role: string;
    painPoint: string;
    whereTheyHangOut: string[];
    budgetRange: string;
    decisionTrigger: string;
  };
  messagingAngle: {
    oneLiner: string;
    tagline: string;
    heroHeadline: string;
    subheadline: string;
    reasoning: string;
  };
  pricingIntelligence: {
    competitors: Array<{
      name: string;
      price: string;
      model: string;
    }>;
    recommendedPrice: string;
    recommendedModel: string;
    pricingGap: string;
  };
  seoGaps: Array<{
    keyword: string;
    difficulty: 'low' | 'medium' | 'high';
    volume: string;
    currentRanker: string;
    blogTitleIdea: string;
  }>;
  quickWins: Array<{
    task: string;
    deadline: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    howTo: string;
  }>;
  moatScore: {
    score: number;
    type: string;
    defensibility: string;
    risks: string[];
    suggestions: string[];
  };
  riskRadar: Array<{
    risk: string;
    severity: 'critical' | 'high' | 'medium';
    timeline: string;
    mitigation: string;
  }>;
  geoScore: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    passed: number;
    total: number;
    checks: Array<{
      name: string;
      passed: boolean;
      importance: 'critical' | 'high' | 'medium';
      fix: string;
    }>;
    topFixes: string[];
  };
  battleCard: {
    competitors: Array<{
      name: string;
      whenMentioned: string;
      ourResponse: string;
      keyDifferentiator: string;
    }>;
  };
};

const GEO_CHECK_GROUPS = {
  Technical: [
    "robots.txt exists and allows AI crawlers",
    "sitemap.xml exists",
    "llms.txt exists (new AI crawler standard)",
    "Canonical URL set correctly",
    "Language attribute set (html lang=\"en\")",
    "Meta description exists and is 150-160 chars",
    "Page loads without JS (for crawlers)",
  ],
  Content: [
    "Clear H1 heading exists",
    "Heading hierarchy (H1→H2→H3)",
    "Content depth (>500 words)",
    "FAQ section exists (great for AI answers)",
    "Structured data / Schema.org markup present",
  ],
  "AI Optimization": [
    "Clear value proposition in first 100 words",
    "Author/entity information present",
    "Last updated date visible",
  ],
} as const;

function getGeoRingColor(score: number): string {
  if (score >= 70) return "border-green-500 text-green-600";
  if (score >= 40) return "border-orange-500 text-orange-600";
  return "border-red-500 text-red-600";
}

function isUnavailableValue(value?: string): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "string" ||
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "unknown" ||
    normalized === "not available" ||
    normalized === "data unavailable" ||
    normalized.includes("data unavailable")
  );
}

function withFallback(value: string | undefined, fallback: string): { value: string; isFallback: boolean } {
  if (isUnavailableValue(value)) {
    return { value: fallback, isFallback: true };
  }
  return { value: (value || "").trim(), isFallback: false };
}

function generateLlmsTxtContent(data: MarketAuditData, url: string): string {
  const safeUrl = (url || "").trim();
  const normalizedUrl = safeUrl ? (safeUrl.startsWith("http") ? safeUrl : `https://${safeUrl}`) : "https://yourdomain.com";
  const host = (() => {
    try {
      return new URL(normalizedUrl).origin;
    } catch {
      return normalizedUrl;
    }
  })();

  return `# ${data.productName}

> ${data.tagline}

## Product Summary
${data.productName} is a ${data.category} product focused on helping users solve clear business problems quickly.

## Core Pages
- Home: ${host}
- Pricing: ${host}/pricing
- Docs: ${host}/docs
- Blog: ${host}/blog
- Contact: ${host}/contact

## Key Facts
- Category: ${data.category}
- Primary audience: ${data.icp?.role || "Founders and growth teams"}
- Core promise: ${data.messagingAngle?.oneLiner || data.tagline}

## Freshness
- Last reviewed: ${new Date().toISOString().slice(0, 10)}
- Update cadence: Monthly

## Contact
- Website: ${host}
- Support: ${host}/contact
`;
}

export function MarketAuditReportSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-pulse space-y-12">
      <div className="space-y-4">
        <div className="h-6 w-24 bg-blue-100 rounded-full"></div>
        <div className="h-12 w-3/4 bg-zinc-200 rounded-lg"></div>
        <div className="h-4 w-1/2 bg-zinc-100 rounded"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-50 rounded-2xl border border-zinc-100"></div>
        ))}
      </div>
      <div className="space-y-8">
        <div className="h-8 w-48 bg-zinc-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-zinc-50 rounded-2xl border border-zinc-100"></div>
          ))}
        </div>
      </div>
      <div className="h-64 bg-zinc-50 rounded-2xl border border-zinc-100"></div>
    </div>
  );
}

export function MarketAuditReport({ data, url }: { data: MarketAuditData; url: string }) {
  if (!data) return null;

  // Render a clean fallback UI instead of crashing React if the AI hallucinates missing keys
  if (!data.founderScore || !data.marketSnapshot || !data.verdict) {
    return (
      <div className="w-full max-w-5xl mx-auto rounded-3xl bg-red-50 border border-red-200 p-8 text-center text-red-800">
        <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <h3 className="text-xl font-bold mb-2">Audit Generation Incomplete</h3>
        <p className="max-w-xl mx-auto">The AI agent failed to correctly format part of the market report. If you were charged, please contact support.</p>
      </div>
    );
  }

  const [llmsTxtContent, setLlmsTxtContent] = useState("");
  const [llmsCopied, setLlmsCopied] = useState(false);
  const reportUrl = url || data.url || "";
  const llmsPublicUrl = reportUrl
    ? `${reportUrl.startsWith("http") ? reportUrl : `https://${reportUrl}`}/llms.txt`
    : "https://yourdomain.com/llms.txt";
  const geoScore = data.geoScore || {
    score: 0,
    grade: "F" as const,
    passed: 0,
    total: 15,
    checks: [],
    topFixes: [],
  };
  const competitorsCountFallback =
    Array.isArray(data.competitors) && data.competitors.length > 0
      ? `${data.competitors.length}`
      : "Count not verified";
  const marketSnapshotCards = [
    {
      label: "Addressable Market",
      ...withFallback(data.marketSnapshot.addressableMarket, "Not enough external data"),
    },
    {
      label: "Market Leader",
      ...withFallback(data.marketSnapshot.marketLeader, "Leader not identified"),
    },
    {
      label: "Leader Share",
      ...withFallback(data.marketSnapshot.marketLeaderShare, "Share not verified"),
    },
    {
      label: withFallback(data.marketSnapshot.competitorCountLabel, "Active Competitors").value,
      ...withFallback(data.marketSnapshot.competitorCount, competitorsCountFallback),
    },
  ];
  const unavailableMarketFields = [
    data.marketSnapshot.addressableMarket,
    data.marketSnapshot.marketLeader,
    data.marketSnapshot.marketLeaderShare,
    data.marketSnapshot.competitorCount,
  ].filter((value) => isUnavailableValue(value)).length;
  const showMarketDataNotice = unavailableMarketFields >= 3;

  const groupedGeoChecks = useMemo(() => {
    const grouped: Record<string, typeof geoScore.checks> = {
      Technical: [],
      Content: [],
      "AI Optimization": [],
    };

    const groupedNames = new Set<string>();
    (Object.entries(GEO_CHECK_GROUPS) as Array<[string, readonly string[]]>).forEach(
      ([groupName, groupChecks]) => {
        grouped[groupName] = geoScore.checks.filter((check) => groupChecks.includes(check.name));
        groupChecks.forEach((name) => groupedNames.add(name));
      }
    );

    const uncategorized = geoScore.checks.filter((check) => !groupedNames.has(check.name));
    if (uncategorized.length > 0) {
      grouped.Technical = [...grouped.Technical, ...uncategorized];
    }

    return grouped;
  }, [geoScore.checks]);

  const llmsCheckFailed = geoScore.checks.some(
    (check) => check.name === "llms.txt exists (new AI crawler standard)" && !check.passed
  );

  const handleGenerateLlmsTxt = () => {
    setLlmsTxtContent(generateLlmsTxtContent(data, reportUrl));
    setLlmsCopied(false);
  };

  const handleCopyLlmsTxt = async () => {
    if (!llmsTxtContent) return;
    await navigator.clipboard.writeText(llmsTxtContent);
    setLlmsCopied(true);
    setTimeout(() => setLlmsCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-16">
      
      {/* EXPORT BUTTON */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      </div>
      
      {/* SECTION 1 — HEADER */}
      <section className="text-center md:text-left space-y-5">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 tracking-wide uppercase">
          Market Audit
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-950">
          {data.productName}
        </h1>
        <p className="text-xl text-zinc-600 font-medium max-w-3xl">
          {data.tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-sm font-medium text-zinc-500">
          <span className="truncate max-w-[250px]">{reportUrl || "URL unavailable"}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
          <span>{data.category}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
          <span>{data.date}</span>
        </div>
      </section>

      {/* SECTION 2 — AI/GEO READINESS */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 md:p-10 shadow-sm">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-5">AI/GEO Readiness Score</h2>
            <div className={`relative flex h-56 w-56 items-center justify-center rounded-full border-[10px] ${getGeoRingColor(geoScore.score)}`}>
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black leading-none">{geoScore.grade}</span>
                <span className="mt-2 text-2xl font-bold text-zinc-900">{geoScore.score}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">out of 100</span>
              </div>
            </div>
            <p className="mt-5 text-base font-semibold text-zinc-700">
              {geoScore.passed}/{geoScore.total || 15} checks passed
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {(Object.keys(groupedGeoChecks) as Array<keyof typeof groupedGeoChecks>).map((groupName) => {
              const checks = groupedGeoChecks[groupName];
              if (!checks?.length) return null;

              return (
                <div key={groupName} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-4">{groupName}</h3>
                  <div className="space-y-3">
                    {checks.map((check, index) => (
                      <div
                        key={`${check.name}-${index}`}
                        className={`rounded-xl border p-4 ${
                          check.passed
                            ? "border-green-200 bg-green-50"
                            : check.importance === "critical"
                            ? "border-red-300 bg-red-50"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 text-sm font-bold ${
                              check.passed ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {check.passed ? "✅" : "❌"}
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-zinc-900">{check.name}</p>
                            {!check.passed && (
                              <p className={`text-xs ${check.importance === "critical" ? "text-red-700 font-semibold" : "text-zinc-600"}`}>
                                Fix: {check.fix}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {llmsCheckFailed && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-blue-900">llms.txt missing</h3>
                <p className="text-sm text-blue-800">
                  Generate a ready-to-paste <code className="font-semibold">llms.txt</code> file, place it at your site root, and make it available at <code className="font-semibold">/llms.txt</code>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerateLlmsTxt}
                    className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Generate llms.txt
                  </button>
                  {llmsTxtContent && (
                    <button
                      onClick={handleCopyLlmsTxt}
                      className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      {llmsCopied ? "Copied" : "Copy to clipboard"}
                    </button>
                  )}
                </div>
                {llmsTxtContent && (
                  <>
                    <pre className="max-h-64 overflow-auto rounded-xl border border-blue-200 bg-white p-4 text-xs text-zinc-800">
                      <code>{llmsTxtContent}</code>
                    </pre>
                    <ol className="list-decimal pl-5 text-xs text-blue-900 space-y-1">
                      <li>Save this content as <code>llms.txt</code>.</li>
                      <li>Upload it to your website root.</li>
                      <li>Confirm it loads publicly at <code>{llmsPublicUrl}</code>.</li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h3 className="text-sm font-bold text-zinc-900 mb-3">Top 3 Fixes</h3>
            {geoScore.topFixes.length > 0 ? (
              <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-700">
                {geoScore.topFixes.map((fix, idx) => (
                  <li key={`${fix}-${idx}`}>{fix}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-zinc-600">Great baseline. No major GEO blockers found.</p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 0 — FOUNDER SCORE */}
      <section className="bg-white rounded-3xl border border-zinc-200 p-8 md:p-12 shadow-sm text-center">
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-8">Founder Score</h2>
        <div className="flex flex-col items-center">
          <div className={`relative flex h-48 w-48 items-center justify-center rounded-full border-8 ${
            data.founderScore.overall >= 70 ? 'border-green-500 text-green-600' :
            data.founderScore.overall >= 40 ? 'border-orange-500 text-orange-600' :
            'border-red-500 text-red-600'
          }`}>
            <span className="text-6xl font-black">{data.founderScore.overall}</span>
            <span className="absolute bottom-6 text-sm font-bold uppercase tracking-wider text-zinc-400">/ 100</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-12 max-w-4xl">
            {[
              { label: "Product", score: data.founderScore.product },
              { label: "Distribution", score: data.founderScore.distribution },
              { label: "Monetisation", score: data.founderScore.monetisation },
              { label: "Defensibility", score: data.founderScore.defensibility }
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-zinc-600">{item.label}</span>
                  <span className="text-zinc-950">{item.score}</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.score >= 70 ? 'bg-green-500' :
                      item.score >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <p className="mt-10 text-lg font-medium text-zinc-600 max-w-2xl leading-relaxed">
            "{data.founderScore.interpretation}"
          </p>
        </div>
      </section>

      {/* SECTION 2 — MARKET SNAPSHOT */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Market Snapshot</h2>
        {showMarketDataNotice ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            External market signals are limited for this domain right now. Core strategic recommendations still use on-site content.
          </div>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {marketSnapshotCards.map((card) => (
            <div key={card.label} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col">
              <p className="text-sm font-medium text-zinc-500 mb-2">{card.label}</p>
              <p className={`text-lg sm:text-xl font-bold leading-snug ${card.isFallback ? "text-zinc-500" : "text-zinc-950"}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ICP CARD */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Ideal Customer Profile</h2>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start shadow-sm">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-950 mb-2">{data.icp.title}</h3>
              <p className="text-zinc-600 leading-relaxed max-w-3xl">{data.icp.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400"></span> Role: {data.icp.role}
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400"></span> Age: {data.icp.age}
              </span>
              <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-100">
                ⚠️ Pain: {data.icp.painPoint}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Where they hang out</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.icp.whereTheyHangOut.map((place, i) => (
                    <span key={i} className="inline-block bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-2 py-1 text-xs font-medium">#{place}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Budget Range</span>
                <span className="font-semibold text-zinc-900">{data.icp.budgetRange}</span>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Decision Trigger</span>
                <span className="font-medium text-zinc-800">{data.icp.decisionTrigger}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — COMPETITIVE POSITIONING */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Competitive Positioning</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.competitors.map((comp, idx) => {
            const isAnalyzedProduct = comp.name.toLowerCase() === data.productName.toLowerCase();
            return (
              <div 
                key={idx} 
                className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm border ${isAnalyzedProduct ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-200'}`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-zinc-950">{comp.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{comp.positioning}</p>
                </div>
                
                <div className="space-y-3 flex-grow text-sm">
                  <div className="flex flex-col py-2 border-t border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-400 uppercase mb-1">Focus</span>
                    <span className="font-medium text-zinc-800">{comp.focus}</span>
                  </div>
                  <div className="flex flex-col py-2 border-t border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-400 uppercase mb-1">Monetisation</span>
                    <span className="font-medium text-zinc-800">{comp.monetisation}</span>
                  </div>
                  <div className="flex flex-col py-2 border-t border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-400 uppercase mb-1">UX</span>
                    <span className="font-medium text-zinc-800">{comp.ux}</span>
                  </div>
                  <div className="flex flex-col py-2 border-t border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-400 uppercase mb-1">Transparency</span>
                    <span className="font-medium text-zinc-800">{comp.transparency}</span>
                  </div>
                </div>

                <div className={`mt-5 px-3 py-2.5 rounded-lg text-sm font-medium text-center ${
                  comp.highlightType === 'good' ? 'bg-green-50 text-green-700 border border-green-200' :
                  comp.highlightType === 'bad' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {comp.highlight}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MESSAGING ANGLE */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Messaging Angle</h2>
        <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/30 p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
            Paste this on your homepage
          </div>
          
          <div className="space-y-8 mt-2">
            <div className="group relative">
              <span className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">One-Liner</span>
              <div className="flex items-start justify-between gap-4">
                <p className="text-xl font-bold text-zinc-900">{data.messagingAngle.oneLiner}</p>
                <button onClick={() => navigator.clipboard.writeText(data.messagingAngle.oneLiner)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-md shadow-sm border border-zinc-200 text-xs font-semibold text-zinc-600 print:hidden">Copy</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-blue-100/50">
              <div className="group relative">
                <span className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Hero Headline</span>
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-2xl font-black text-zinc-950 leading-tight">{data.messagingAngle.heroHeadline}</h4>
                  <button onClick={() => navigator.clipboard.writeText(data.messagingAngle.heroHeadline)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-md shadow-sm border border-zinc-200 text-xs font-semibold text-zinc-600 print:hidden">Copy</button>
                </div>
              </div>
              <div className="group relative">
                <span className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Subheadline</span>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-medium text-zinc-600 leading-snug">{data.messagingAngle.subheadline}</p>
                  <button onClick={() => navigator.clipboard.writeText(data.messagingAngle.subheadline)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-md shadow-sm border border-zinc-200 text-xs font-semibold text-zinc-600 print:hidden">Copy</button>
                </div>
              </div>
            </div>

            <div className="group relative pt-6 border-t border-blue-100/50">
              <span className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Tagline</span>
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-bold italic text-zinc-800">"{data.messagingAngle.tagline}"</p>
                <button onClick={() => navigator.clipboard.writeText(data.messagingAngle.tagline)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-md shadow-sm border border-zinc-200 text-xs font-semibold text-zinc-600 print:hidden">Copy</button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-blue-100 mt-6">
              <span className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Why this works</span>
              <p className="text-sm text-zinc-600 leading-relaxed">{data.messagingAngle.reasoning}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING INTELLIGENCE */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Pricing Intelligence</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Competitor</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Model</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Price Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.pricingIntelligence.competitors.map((comp, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium text-zinc-900">{comp.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{comp.model}</td>
                  <td className="px-6 py-4 font-mono text-zinc-700">{comp.price}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
              <tr>
                <td className="px-6 py-5 font-bold text-emerald-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Your Recommended Pricing
                </td>
                <td className="px-6 py-5 font-semibold text-emerald-800">{data.pricingIntelligence.recommendedModel}</td>
                <td className="px-6 py-5 font-mono font-bold text-emerald-900">{data.pricingIntelligence.recommendedPrice}</td>
              </tr>
            </tfoot>
          </table>
          <div className="p-6 bg-zinc-950 text-white">
            <span className="block text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Pricing Gap strategy</span>
            <p className="text-sm text-zinc-300 leading-relaxed">{data.pricingIntelligence.pricingGap}</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — DIFFERENTIATOR RADAR */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Differentiator Radar</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 space-y-6">
          {data.differentiatorRadar.map((metric, idx) => {
            const percentage = (metric.score / metric.max) * 100;
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-1/3 md:w-1/4 text-sm font-semibold text-zinc-800 text-right truncate pr-4">
                  {metric.label}
                </div>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-bold text-zinc-950 text-right">
                  {metric.score}/{metric.max}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEO GAPS */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">SEO Content Gaps</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Target Keyword</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Volume</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Difficulty</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Current Ranker</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Blog Title Idea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.seoGaps.map((gap, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 font-bold text-zinc-900">{gap.keyword}</td>
                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs">{gap.volume}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        gap.difficulty === 'low' ? 'bg-green-100 text-green-700' :
                        gap.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {gap.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 italic text-xs truncate max-w-[150px]">{gap.currentRanker}</td>
                    <td className="px-6 py-4 font-medium text-blue-700">{gap.blogTitleIdea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5 — SWOT ANALYSIS */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">SWOT Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-sm">S</span>
              Strengths
            </h3>
            <ul className="space-y-2">
              {data.swot.strengths.map((item, i) => (
                <li key={i} className="text-sm text-green-900 flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-sm">W</span>
              Weaknesses
            </h3>
            <ul className="space-y-2">
              {data.swot.weaknesses.map((item, i) => (
                <li key={i} className="text-sm text-red-900 flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-sm">O</span>
              Opportunities
            </h3>
            <ul className="space-y-2">
              {data.swot.opportunities.map((item, i) => (
                <li key={i} className="text-sm text-blue-900 flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-200 text-sm">T</span>
              Threats
            </h3>
            <ul className="space-y-2">
              {data.swot.threats.map((item, i) => (
                <li key={i} className="text-sm text-orange-900 flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* QUICK WINS */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Quick Wins This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.quickWins.map((win, i) => (
            <div key={i} className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm border-2 ${
              win.impact === 'high' ? 'border-green-400' : 
              win.impact === 'medium' ? 'border-orange-300' : 
              'border-zinc-200'
            }`}>
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="whitespace-nowrap">{win.deadline}</span>
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end mt-px">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${win.impact==='high'?'bg-green-100 text-green-700':win.impact==='medium'?'bg-orange-100 text-orange-700':'bg-zinc-100 text-zinc-600'}`}>Impact: {win.impact}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${win.effort==='low'?'bg-green-100 text-green-700':win.effort==='medium'?'bg-orange-100 text-orange-700':'bg-red-100 text-red-700'}`}>Effort: {win.effort}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-3 leading-snug">{win.task}</h3>
              <div className="flex-grow flex flex-col bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">How to execute</span>
                <p className="text-sm text-zinc-700 leading-relaxed font-medium line-clamp-6">{win.howTo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MOAT ANALYSIS */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Moat Analysis</h2>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="flex flex-col items-center shrink-0 w-48">
             <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-indigo-500 text-indigo-600 mb-4">
               <span className="text-4xl font-black">{data.moatScore.score}</span>
               <span className="absolute bottom-4 text-[10px] font-bold uppercase tracking-wider text-indigo-400">/ 10</span>
             </div>
             <span className="text-center text-sm font-bold uppercase tracking-widest text-zinc-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{data.moatScore.type}</span>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-950 mb-2">Defensibility Overview</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{data.moatScore.defensibility}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Vulnerabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {data.moatScore.risks.map((risk, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 mr-2"></span>{risk}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">How to strengthen</h4>
                <ul className="space-y-2">
                  {data.moatScore.suggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-zinc-700 flex items-start">
                      <span className="text-green-500 mr-2">✔</span>
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RISK RADAR */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Risk Radar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.riskRadar.sort((a,b) => {
             const val = { critical: 3, high: 2, medium: 1 };
             return val[b.severity] - val[a.severity];
          }).map((item, i) => (
             <div key={i} className="rounded-2xl bg-zinc-950 p-6 border border-zinc-800 flex flex-col">
               <div className="flex flex-col items-start gap-3 mb-4">
                 <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                   item.severity === 'critical' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                   item.severity === 'high' ? 'bg-orange-500 text-white' :
                   'bg-yellow-500 text-black'
                 }`}>
                   {item.severity} Risk
                 </span>
                 <p className="text-xs font-mono text-zinc-500 break-words w-full whitespace-normal leading-snug">{item.timeline}</p>
               </div>
               <h3 className="text-lg font-bold text-white mb-4 leading-snug">{item.risk}</h3>
               <div className="flex-grow flex flex-col pt-4 border-t border-zinc-800 mt-auto">
                 <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Mitigation Plan</span>
                 <p className="text-sm text-zinc-300 leading-relaxed font-medium line-clamp-6">{item.mitigation}</p>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — TOP GROWTH OPPORTUNITIES */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-6">Top Growth Opportunities</h2>
        <div className="space-y-4">
          {data.growthOpportunities.map((opp, idx) => {
            const tagColors = {
              Revenue: "bg-emerald-100 text-emerald-700 border border-emerald-200",
              Acquisition: "bg-blue-100 text-blue-700 border border-blue-200",
              Product: "bg-indigo-100 text-indigo-700 border border-indigo-200",
              Retention: "bg-purple-100 text-purple-700 border border-purple-200",
              Trust: "bg-amber-100 text-amber-700 border border-amber-200",
            };
            const tagClass = tagColors[opp.tagType as keyof typeof tagColors] || "bg-zinc-100 text-zinc-700 border border-zinc-200";

            return (
              <div key={idx} className="flex gap-4 md:gap-6 rounded-2xl bg-white border border-zinc-200 p-6">
                <div className="hidden sm:block text-4xl font-black text-zinc-100 pt-1">
                  {String(opp.rank).padStart(2, '0')}
                </div>
                <div>
                  <div className="mb-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${tagClass}`}>
                      {opp.tagType} · {opp.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-950 mb-2">{opp.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{opp.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7 — VERDICT */}
      <section className="rounded-3xl bg-zinc-950 text-white p-8 md:p-12 mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white text-center">The Verdict</h2>
        <p className="text-lg text-zinc-300 font-medium leading-relaxed mb-10 text-center max-w-4xl mx-auto">
          {data.verdict.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-bold tracking-widest text-blue-400 uppercase mb-2">Core Opportunity</h4>
              <p className="text-base text-zinc-200 leading-relaxed">{data.verdict.coreOpportunity}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-2">Critical Gap</h4>
              <p className="text-base text-zinc-200 leading-relaxed">{data.verdict.criticalGap}</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-bold tracking-widest text-orange-400 uppercase mb-3">Critical Issues to Fix</h4>
              <ul className="space-y-3">
                {data.verdict.technicalIssues.map((issue, i) => (
                  <li key={i} className="flex items-start text-sm text-zinc-200">
                    <svg className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">Monetisation Path</h4>
              <p className="text-base text-zinc-200 leading-relaxed">{data.verdict.monetisationPath}</p>
            </div>
          </div>
        </div>
      </section>

      {/* BATTLE CARD */}
      <section className="rounded-3xl bg-zinc-950 p-8 md:p-12 mb-12 shadow-xl border border-zinc-800">
        <div className="text-center mb-10 text-white">
           <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 tracking-wide uppercase mb-3">Objection Handling</span>
           <h2 className="text-2xl md:text-3xl font-bold">Sales Battle Card</h2>
        </div>
        
        <div className="space-y-6">
          {data.battleCard.competitors.map((comp, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 relative group">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-full md:w-1/3">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">When they mention</span>
                  <h3 className="text-xl font-black text-white">{comp.name}</h3>
                  <p className="text-sm text-zinc-400 italic mt-2">"{comp.whenMentioned}"</p>
                </div>
                
                <div className="hidden md:flex items-center justify-center shrink-0">
                  <svg className="h-6 w-6 text-blue-500 opacity-50 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>

                <div className="w-full md:w-1/2 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Say this</span>
                  <p className="text-base text-zinc-100 font-medium leading-relaxed bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                    "{comp.ourResponse}"
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-2 text-sm">
                   <span className="text-emerald-400">★</span>
                   <span className="text-zinc-300 font-medium"><span className="text-zinc-500">Key Differentiator:</span> {comp.keyDifferentiator}</span>
                 </div>
                 <button onClick={() => navigator.clipboard.writeText(comp.ourResponse)} className="shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-white transition-colors print:hidden">
                   Copy Script
                 </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
