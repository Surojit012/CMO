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
      "highlightType": "good"
    }
  ],
  "differentiatorRadar": [
    { "label": "string", "score": 8, "max": 10 }
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
  },
  "founderScore": {
    "overall": 80,
    "product": 80,
    "distribution": 80,
    "monetisation": 80,
    "defensibility": 80,
    "interpretation": "string"
  },
  "icp": {
    "title": "string",
    "description": "string",
    "age": "string",
    "role": "string",
    "painPoint": "string",
    "whereTheyHangOut": ["string"],
    "budgetRange": "string",
    "decisionTrigger": "string"
  },
  "messagingAngle": {
    "oneLiner": "string",
    "tagline": "string",
    "heroHeadline": "string",
    "subheadline": "string",
    "reasoning": "string"
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
    "pricingGap": "string"
  },
  "seoGaps": [
    {
      "keyword": "string",
      "difficulty": "low",
      "volume": "string",
      "currentRanker": "string",
      "blogTitleIdea": "string"
    }
  ],
  "quickWins": [
    {
      "task": "string",
      "deadline": "string",
      "impact": "high",
      "effort": "high",
      "howTo": "string"
    }
  ],
  "moatScore": {
    "score": 8,
    "type": "string",
    "defensibility": "string",
    "risks": ["string"],
    "suggestions": ["string"]
  },
  "riskRadar": [
    {
      "risk": "string",
      "severity": "critical",
      "timeline": "string",
      "mitigation": "string"
    }
  ],
  "battleCard": {
    "competitors": [
      {
        "name": "string",
        "whenMentioned": "string",
        "ourResponse": "string",
        "keyDifferentiator": "string"
      }
    ]
  }
}

Be specific. Use real numbers where possible.
Research the competitive landscape deeply.
No generic advice.`;

const userMessage = `Website URL: https://cardsense-smoky.vercel.app/
Website Content: Nothing.

REAL-TIME RESEARCH DATA:
Competitor Intelligence: Data unavailable
Market Size Data: Data unavailable
Pricing Intelligence: Data unavailable
Alternatives & Comparisons: Data unavailable

Instructions: Use ONLY facts, no hallucinations. Make a market audit.`;

async function test() {
  const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer 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`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  const text = await aiResponse.text();
  console.log(text);
}
test();
