# 📣 Reddit Launch Posts (3 Subreddits)

**Framework**: Before-After-Bridge (all posts) + Identity Hook
**Emotional Trigger**: Belonging + Authority
**Best time to post**: Tuesday or Thursday, 9-11 AM EST
**Engagement tips**: Post from your personal account (not a brand account). Reply to every comment within the first 3 hours. Be genuinely helpful — answer questions about the tech stack, share struggles. Never be defensive about criticism.

---

## 1. r/SaaS

### Title

I spent 4 hours a day doing marketing for my SaaS. Built a tool that does it in 60 seconds. Here's what I learned.

### Body

I'm a solo founder. Shipping code is the easy part. Marketing is where I've always struggled — not because I don't understand it, but because it takes *forever*.

Every day I was doing the same loop:
- Open Ahrefs → find keyword opportunities → write them down
- Go to my landing page → squint at the CTA → try a new version
- Browse Reddit → look for relevant threads → write "not promotional" comments
- Open Twitter → try to write something that doesn't sound desperate
- Read some blog about growth strategy → feel overwhelmed → close the tab

Four hours gone. Every day.

**What I built**: CMO (cmo-five.vercel.app) — 5 AI agents that run in parallel when you paste a URL. Each one handles a different marketing discipline:

1. **Strategist** — positioning, audience, growth direction
2. **SEO** — keywords, blog opportunities, ranking analysis
3. **Copywriter** — viral hooks, ad copy, messaging angles
4. **Conversion** — landing page fixes, CTA rewrites (with before/after scoring)
5. **Distribution** — channels, communities, content loops

The output isn't generic. Each agent uses specific frameworks (LIFT Model for conversion, PAS for copy, etc.) and every recommendation references something it found on your actual site.

**The part I'm most proud of**: the execution layer. You can hit "Generate Tweet Thread" and it writes one. "Write Blog Post" — 1,500 words. "Create Meta Ad" — full creative with targeting suggestion.

**Business model**: 3 free analyses, then $5 per use. No subscription. You pay with USDC through an embedded wallet (Privy). I wanted to test whether pay-per-use with crypto could work for SaaS-adjacent tools.

I would genuinely love feedback — especially from folks who've tried other AI marketing tools. What's missing? What would make you use this more than once?

---

## 2. r/indiehackers

### Title

I charge $5 in USDC per use (not monthly) for my AI marketing tool. Here's why I chose crypto over Stripe.

### Body

Quick context: I built CMO (cmo-five.vercel.app), a tool where you paste a URL and 5 AI agents give you a full growth strategy. This post is about the tech and business decisions, not a product pitch.

**Why pay-per-use instead of SaaS subscription**:

Most AI marketing tools charge $49-$199/month. The problem is — you don't need them every day. I use my own tool maybe 3-4 times a week. A subscription feels like waste.

$5 per analysis made more sense. You use it when you need it. No recurring charge guilt.

**Why USDC instead of Stripe**:

Three reasons:
1. **No chargebacks**. Stripe chargebacks on $5 transactions eat your margin alive.
2. **Global access**. I don't need to deal with Stripe Atlas, tax jurisdictions, or "not available in your country" problems.
3. **Instant settlement**. Money shows up in the contract immediately.

**Why Privy for wallets**:

I tried RainbowKit, wagmi, and plain ethers.js. The problem is onboarding — if your users don't have a wallet, you've lost them.

Privy creates an embedded wallet on login. Users sign in with Google or email. They see their USDC balance. They click pay. Done. No MetaMask popup. No "what network am I on?"

**Why Arc Testnet**:

It's cheap, fast, and the team is responsive. For a product that processes $5 transactions, gas fees matter. On Arc Testnet, they're basically zero.

**The multi-agent architecture**:

This was the hardest technical decision. A single LLM prompt produces generic slop. Five specialized agents with different system prompts, each targeting a specific marketing discipline, produce dramatically better output.

Each agent has domain-specific frameworks injected into its system prompt (PAS for copywriting, LIFT Model for conversion, etc.). They run in parallel via Promise.allSettled, and a "Chief Agent" synthesizes their outputs into a cohesive strategy.

**Current numbers**: [INSERT: users, analyses run, conversion rate, etc.]

**What I'd do differently**: I underestimated how much work the execution layer would be. Generating tweet threads, blog posts, and ad copy from strategy outputs required its own set of prompts and a whole secondary UI flow.

Questions for this community:
- Has anyone done pay-per-use crypto billing? What were the gotchas?
- Would you pay for an AI tool per-use or do you prefer subscriptions?

---

## 3. r/webdev

### Title

How I built 5 AI agents that run in parallel and return a result in 60 seconds (Next.js + Fireworks AI + Jina)

### Body

I built a tool called CMO (cmo-five.vercel.app) that analyzes any website and generates a growth strategy. The interesting part (for this sub) is the architecture — not the marketing angle.

**Stack**:
- **Framework**: Next.js 16 (Turbopack), deployed on Vercel
- **AI**: Fireworks AI (running Llama/Qwen models — much cheaper than OpenAI for parallel agent calls)
- **Web Scraping**: Jina Reader API (returns clean markdown from any URL, handles SPAs)
- **Auth + Wallets**: Privy (embedded crypto wallets, but also handles normal email/Google login)
- **Storage**: Vercel KV for session data and payment records
- **Automation**: n8n for autonomous daily analysis flows

**The multi-agent pattern**:

Instead of one big prompt, I have 5 specialized agents:

```
const agentPromises = [
  runAgent("strategist", scrapedContent),
  runAgent("seo", scrapedContent),
  runAgent("copywriter", scrapedContent),
  runAgent("conversion", scrapedContent),
  runAgent("distribution", scrapedContent),
];

const results = await Promise.allSettled(agentPromises);
```

Each agent has a ~800-token system prompt loaded with domain-specific frameworks. The SEO agent knows about keyword clustering and E-E-A-T. The conversion agent uses the LIFT Model. The copywriter agent uses PAS and the 4 U's.

After all 5 return, a "Chief Agent" (aggregator) synthesizes their outputs into a single structured markdown response. The Chief Agent has anti-generic rules — it rejects any recommendation that could apply to "any startup" and forces product-specific outputs.

**Scraping challenge**:

The hardest part was getting useful content from arbitrary URLs. Many sites are SPAs, have anti-bot measures, or just return garbage HTML.

Jina Reader API solved 90% of this. You prepend `https://r.jina.ai/` to any URL and it returns clean markdown. For the other 10%, I fall back to a basic fetch + cheerio parse.

**Execution layer**:

The strategy output includes action buttons — "Generate Tweet Thread," "Write Blog Post," "Create Meta Ad." Each one calls a separate API route that takes the strategy context and generates platform-specific content. This was the most underestimated part of the build. Each platform has different formatting needs, character limits, and tone expectations.

**Performance**:
- Agent execution: ~8-12 seconds total (all 5 in parallel via Fireworks)
- Total response time including scraping: ~15-20 seconds
- Frontend streaming: Results render progressively as markdown

**What I'd do differently**:
- Token budget management is tricky. Each agent gets 800 max tokens, but the Chief Agent needs enough context window to process all 5 outputs (~4000 tokens input). Fireworks handles this well but it's something to plan for.
- Vercel serverless has a 10-second default timeout. I had to bump to 60s for the `/api/analyze` route (via `maxDuration`).

Repo isn't open source (yet), but happy to answer architecture questions.
