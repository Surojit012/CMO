# CMO Project Architecture

## Technical Stack
- **Framework:** Next.js 15 (App Router)
- **Authentication:** [Privy](https://www.privy.io/) (Email, Social, Wallets)
- **Rate Limiting/Billing:** Arc Smart Contract (Quotas & Billing) + Upstash Redis (Memory Storage)
- **AI Router:** Dual-provider routing system (`lib/ai-router.ts`)
- **LLM SDK:** OpenAI SDK (configured for Fireworks AI and Groq)
- **Scraper:** [Jina Reader](https://r.jina.ai/)
- **Cron:** Vercel Cron Jobs (`0 9 * * *`)

## AI Provider Logic
The system uses a smart router to balance speed and intelligence:

| Provider | Model | Use Case |
| :--- | :--- | :--- |
| **Fireworks AI** | `llama-v3p3-70b-instruct` | Heavy lifting: Specialists, Aggregator, Reddit Search |
| **Groq** | `llama-3.3-70b-versatile` | Speed: Execution buttons, Quick ad copy, Blog draft generations |

## Core Components

### 1. Multi-Agent System (`lib/agents/`)
A parallel execution pipeline where multiple specialists analyze the same website context simultaneously:
- **Strategist:** Positioning, audience, and GTM strategy.
- **Copywriter:** hooks, angles, and messaging hooks.
- **SEO Agent:** Keywords, search intent, and ranking opportunities.
- **Conversion Agent:** UX improvements and landing page friction fixes.
- **Distribution Agent:** Growth loops and platform-specific plays.
- **Reddit Monitoring Agent:** (NEW) Autonomous search for live discussions and pain points.

### 2. Chief Aggregator (`lib/aggregator.ts`)
The synthesis layer. It receives the raw reports from all 6 specialists and combines them into one coherent, non-redundant growth plan formatted in markdown.

### 3. Autonomous Engine (`app/api/cron/`)
A scheduled worker that runs daily at 9 AM UTC. 
- Fetches users with "Autonomous Mode" enabled.
- Re-scrapes their site and triggers the full AI pipeline.
- Saves the report and fires a UI notification.

### 4. Memory Layer (`lib/memory.ts`)
Stores historical analyses and learns from user feedback (Thumbs Up/Down) to reinforce positive patterns in future generations.

### 5. Content Publishing Layer (`lib/publishers/`)
Integration with developer and professional platforms for one-click distribution:
- **Dev.to:** REST API integration for technical blog posts.
- **Hashnode:** GraphQL API integration for developer-focused publications.

## Data Flow
`User Input` -> `Arc Smart Contract (Quota Check)` -> `Scraper (Jina)` -> `AI Router (Fireworks)` -> `6x Parallel Specialists` -> `AI Router (Fireworks)` -> `Chief Aggregator` -> `Memory Storage` -> `UI Display`
