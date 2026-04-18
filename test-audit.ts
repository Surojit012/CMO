import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
  console.log("NVIDIA Key loaded:", !!process.env.NVIDIA_API_KEY);
  
  const SYSTEM_PROMPT = `You are a senior market analyst and startup advisor.
Analyze the provided website content and return a comprehensive market audit as a JSON object.

Return ONLY valid JSON with this exact structure:
{
  "productName": "string",
  "tagline": "string",
  "category": "string",
  "date": "string",
  "marketSnapshot": {
    "addressableMarket": "string",
    "marketLeader": "string",
    "marketLeaderShare": "string",
    "competitorCount": "string",
    "competitorCountLabel": "string"
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
      "highlightType": "good" | "bad" | "neutral"
    }
  ],
  "differentiatorRadar": [
    { "label": "string", "score": 10, "max": 10 }
  ],
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "growthOpportunities": [
    {
      "rank": 1,
      "tag": "string",
      "tagType": "Revenue",
      "title": "string",
      "description": "string"
    }
  ],
  "verdict": {
    "summary": "string",
    "coreOpportunity": "string",
    "criticalGap": "string",
    "technicalIssues": ["string"],
    "monetisationPath": "string"
  }
}

Be specific. Use real numbers where possible.
Research the competitive landscape deeply.
No generic advice.`;

  console.log("Scraping...");
  const url = "https://cardsense-smoky.vercel.app/";
  const jina = await fetch(`https://r.jina.ai/${url}`);
  let content = await jina.text();
  console.log("Scraped length:", content.length);

  console.log("Calling NVIDIA NIM...");
  const userMessage = `Website URL: ${url}\nWebsite content: ${content}\nRun a full market audit.`;

  const aiResponse = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    }
  );

  const aiData = await aiResponse.json();
  console.log("Raw AI Data:", JSON.stringify(aiData, null, 2));

  const resContent = aiData.choices?.[0]?.message?.content || '{}';
  console.log("Success! Parsing...");
  try {
    const json = JSON.parse(resContent);
    console.log("Parsed keys:", Object.keys(json));
    console.log("Product Name:", json.productName);
  } catch(e) {
    console.error("Parse error:", e);
    console.log(resContent);
  }
}

test().catch(console.error);
