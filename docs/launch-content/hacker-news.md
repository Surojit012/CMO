# 🟠 Show HN Post — Hacker News

**Framework**: Technical honesty + genuine questions
**Emotional Trigger**: Authority (tech depth) + Belonging (HN community)
**Best time to post**: Weekday mornings 8–10 AM EST (HN traffic peak)
**Engagement tips**: HN despises self-promotion. Lead with what you learned, not what you're selling. Answer every comment — especially critical ones — with substance and humility. If someone finds a bug, thank them and fix it live. Don't ask for upvotes anywhere. If the post gets traction, write a follow-up blog post with deeper technical details.

---

## Title

Show HN: CMO – 5 AI agents analyze any website and generate a growth strategy

## Body

Hi HN,

I built CMO (cmo-five.vercel.app) — a tool where you paste a URL, and 5 specialized AI agents analyze the site and return a growth strategy. It takes about 60 seconds.

**What it does**: Each agent handles a different marketing discipline — strategic positioning, SEO, copywriting, conversion optimization, and distribution. They run in parallel and a "Chief Agent" synthesizes the outputs into a single structured report.

**Stack**:
- Next.js 16 on Vercel (Turbopack, serverless functions with 60s timeout)
- Fireworks AI for inference (Llama/Qwen models — chose over OpenAI for cost and speed on parallel calls)
- Jina Reader API for scraping (prepend `r.jina.ai/` to any URL, returns clean markdown)
- Privy for auth + embedded crypto wallets (payments in USDC)
- Vercel KV for storage (replaced file-based storage after ENOENT errors on serverless)
- n8n for autonomous daily analysis flows

**Architecture decisions I'm unsure about**:

1. **Multi-agent vs. single prompt**: I use 5 separate agents with ~800-token system prompts, each with domain-specific marketing frameworks injected. A single prompt with all frameworks produced noticeably worse output — less specific, more generic. But 5 agents means 5× the inference cost and managing Promise.allSettled across potentially flaky API calls. Is there a smarter pattern here?

2. **Framework injection in system prompts**: Each agent's system prompt includes specific marketing frameworks (e.g., the LIFT Model for conversion analysis, PAS for copywriting). This makes outputs much more structured and actionable, but the prompts are long (~800 tokens each). I'm not sure if retrieval-augmented prompts would be better than static injection.

3. **Pay-per-use crypto**: I charge $5 USDC per analysis after 3 free runs. Privy handles wallet creation on login (email/Google → embedded wallet). It works, but I wonder if the Web3 payment layer is adding unnecessary friction vs. just using Stripe.

4. **Execution layer**: After generating strategy, users can hit buttons to generate tweet threads, blog posts, or ad copy. Each platform needs its own prompt with different constraints (tweet = 280 chars, blog = 1500 words, Meta ad = specific field lengths). This feature doubled the codebase complexity. Would it have been better to ship without it?

**What works well**:
- Parallel agent execution is fast (~8-12s for all 5 agents via Fireworks)
- Jina Reader handles 90%+ of URLs cleanly, including SPAs
- The anti-generic rules in the Chief Agent prompt ("reject any recommendation that could apply to any startup") actually work — outputs reference specific elements found on the analyzed site

**What doesn't work well**:
- Some websites return thin content after scraping (especially highly dynamic SPAs with auth walls). The output quality degrades proportionally.
- Token budget management across 5 agents + aggregator is tricky. Occasionally the Chief Agent's context window gets cramped and it truncates sections.
- The autonomous mode (daily re-analysis via n8n webhooks) is fragile — depends on external webhook reliability.

**Honest questions for HN**:
- For those building multi-agent systems: how do you handle agent output quality variance? Some agents occasionally produce gold, sometimes generic output, even with the same input.
- Is pay-per-use with USDC a real business model, or should I just add Stripe and stop overthinking it?
- Any recommendations for more reliable web scraping than Jina for edge cases?

Free to use (3 analyses, no signup): cmo-five.vercel.app

Source isn't open yet, but I'm considering it. Would open-sourcing the agent prompts be useful/interesting to this community?
