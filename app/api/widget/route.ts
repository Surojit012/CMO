import { NextResponse } from "next/server";
import { getLatestAnalysisByHostname } from "@/lib/memory";
import { parseAndValidateUrl } from "@/lib/url";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return new NextResponse("console.error('CMO Widget: Missing url parameter');", {
        status: 400,
        headers: { "Content-Type": "application/javascript" }
      });
    }

    let targetUrl;
    try {
      targetUrl = parseAndValidateUrl(rawUrl).hostname;
    } catch {
      return new NextResponse("console.error('CMO Widget: Invalid URL provided');", {
        status: 400,
        headers: { "Content-Type": "application/javascript" }
      });
    }

    const latestAnalysis = await getLatestAnalysisByHostname(targetUrl);

    let score = 85; // Default score
    if (latestAnalysis) {
      const { aiOutput } = latestAnalysis.payload;
      if (aiOutput && aiOutput.analysis) {
        const { analysis } = aiOutput;
        const criticalCount = analysis.criticalIssues?.length || 0;
        const fixCount = analysis.conversionFixes?.length || 0;
        score = 100 - (criticalCount * 10) - (fixCount * 5);
        score = Math.max(0, Math.min(100, score)); // Clamp between 0 and 100
      }
    }

    const jsSnippet = `
(function() {
  const url = "${targetUrl}";
  const score = ${score};
  
  const style = document.createElement('style');
  style.innerHTML = \\\`
    .cmo-growth-badge {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #09090b;
      color: #f4f4f5;
      padding: 8px 16px;
      border-radius: 9999px;
      font-family: 'Avenir Next', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      font-weight: bold;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      z-index: 999999;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .cmo-growth-badge:hover {
      background: #18181b;
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    .cmo-growth-badge svg {
      width: 18px;
      height: 18px;
    }
    .cmo-score-pill {
      background: #ffffff;
      color: #09090b;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
    }
  \\\`;
  document.head.appendChild(style);

  const badge = document.createElement('a');
  badge.href = "https://trycmo.com?ref=widget&domain=" + encodeURIComponent(url);
  badge.target = "_blank";
  badge.rel = "noopener noreferrer";
  badge.className = "cmo-growth-badge";
  
  badge.innerHTML = \\\`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    <span>CMO Audited</span>
    <span class="cmo-score-pill">\\\${score}/100</span>
  \\\`;

  document.body.appendChild(badge);
})();
    `.trim();

    return new NextResponse(jsSnippet, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });

  } catch (error: any) {
    console.error("CMO Widget Error:", error);
    return new NextResponse("console.error('CMO Widget: Internal server error');", {
      status: 500,
      headers: { "Content-Type": "application/javascript" }
    });
  }
}
