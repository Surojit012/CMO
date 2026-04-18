# AI Growth System MVP

## 1. Product Spec

### Product Summary
AI Growth System is an AI CMO for early-stage companies. A user pastes their website URL, and the system analyzes the site, extracts positioning signals, and generates a growth dashboard powered by a team of specialized AI agents.

The product should feel less like a chatbot and more like an elite growth team delivering a fast, opinionated teardown with actionable next steps.

### Target Users
- Startup founders
- Indie hackers
- SaaS builders
- Web3 projects

### Core Problem
Early-stage teams know they need growth, but they usually lack:
- Clear positioning feedback
- Strategic growth priorities
- High-quality content angles
- SEO direction
- Conversion optimization expertise
- Distribution playbooks

They do not want another generic AI summary. They want a sharp, usable plan that tells them what to do next.

### Core Value Proposition
Paste your URL and get an instant AI-powered growth team that audits your site and returns:
- A strategic growth direction
- Stronger messaging and hooks
- SEO opportunities
- Landing page conversion fixes
- Distribution ideas tailored to the product

### MVP Scope

#### Input
- Website URL

#### Processing
- Fetch raw HTML from the website
- Extract visible page content, title, meta description, headings, and key CTA text
- Run an analysis pass to infer:
  - Product category
  - Target audience
  - Positioning
  - Value proposition
  - Offer clarity
  - Conversion friction

#### Agent Outputs
- Strategist Agent
  - Growth strategy
  - Top priorities
  - Fastest growth opportunities
- Copywriter Agent
  - Messaging angles
  - Hooks
  - Content ideas
- SEO Agent
  - Keyword themes
  - Blog/content opportunities
  - On-page SEO gaps
- Conversion Agent
  - Landing page issues
  - CTA and messaging fixes
  - Trust and clarity recommendations
- Distribution Agent
  - Recommended channels
  - Campaign ideas
  - Audience acquisition angles

#### Output Format
A dashboard with five sections:
- Growth Strategy
- Viral Content Ideas
- SEO Opportunities
- Landing Page Fixes
- Distribution Plan

### Evolved Goals (Originally Non-Goals for V1)
- ~~No login/auth~~ -> **Implemented:** [Privy](https://www.privy.io/) Web3 Wallet & Email Auth
- ~~No billing~~ -> **Implemented:** Arc Testnet Smart Contract for USDC Payments & Quotas
- ~~No multi-page scraping~~ -> *Multi-page depth scraping is in development roadmap.*
- ~~No historical project storage~~ -> **Implemented:** Upstash Redis memory layer tracks past analyses.
- ~~No collaborative features~~
- ~~No custom analytics integrations~~

### Product Principles
- Sharp over verbose
- Opinionated over generic
- Actionable over academic
- Fast over exhaustive
- Minimal UX over feature-heavy UX

### Functional Requirements

#### Frontend
- Single-page experience
- URL input field
- Submit action
- Loading state while analysis runs
- Dashboard layout for output sections
- Responsive layout for desktop and mobile

#### Backend
- API endpoint to accept URL
- Basic URL validation
- Fetch HTML for target website
- Parse core content from homepage HTML
- Create structured site summary
- Call OpenAI API for each agent or use one orchestrated prompt that returns agent-separated sections
- Return normalized JSON for UI rendering

#### AI Layer
- Use OpenAI API
- Generate outputs in a strict JSON schema
- Keep agent outputs distinct in voice and responsibility
- Avoid vague recommendations by grounding prompts in extracted site content

#### Scraping Layer
- Use basic HTML fetch only
- Parse:
  - Page title
  - Meta description
  - H1/H2
  - Main body text
  - Buttons/CTA copy
  - Links if useful

### Recommended MVP Architecture

#### Frontend
- Next.js App Router
- Route: `/`
- Optional route: `/api/analyze` if using Next full-stack

#### Backend
- Node.js server logic through Next.js route handlers or a lightweight Express server
- Modules:
  - `url-validator`
  - `site-fetcher`
  - `site-parser`
  - `prompt-builder`
  - `agent-orchestrator`
  - `response-normalizer`

#### Response Shape
```json
{
  "input": {
    "url": "https://example.com"
  },
  "analysis": {
    "productSummary": "",
    "audience": "",
    "positioning": "",
    "valueProposition": ""
  },
  "agents": {
    "strategist": {
      "summary": "",
      "priorities": [],
      "experiments": []
    },
    "copywriter": {
      "hooks": [],
      "contentIdeas": []
    },
    "seo": {
      "keywordThemes": [],
      "opportunities": []
    },
    "conversion": {
      "issues": [],
      "fixes": []
    },
    "distribution": {
      "channels": [],
      "plays": []
    }
  }
}
```

### Success Criteria For MVP
- A user can paste a URL and get a full dashboard in one run
- Output feels tailored to the site, not template-generated
- Page is fast and simple enough to demo in under 30 seconds
- Recommendations are concrete enough to act on immediately

### Risks
- Weak site extraction from JavaScript-heavy websites
- Generic AI output if prompts are under-constrained
- Slow response time if agent orchestration is split into too many calls

### MVP Recommendation
For version one, use a single OpenAI call with a structured prompt that simulates the five agents and returns sectioned JSON. This keeps cost, latency, and complexity lower while preserving the "team of agents" product narrative in the UI.

## 2. User Flow

### Primary Flow
1. User lands on homepage
2. User sees a strong headline, short explanation, and a URL input field
3. User pastes website URL
4. User clicks `Analyze`
5. System validates URL
6. System fetches homepage HTML
7. System extracts site content and builds a structured context summary
8. System sends context to AI agent orchestration layer
9. System receives structured output
10. User sees dashboard with five sections
11. User scans recommendations and acts on them

### System Flow
1. Receive URL
2. Normalize URL
3. Fetch HTML
4. Parse content blocks
5. Build site summary object
6. Send summary to OpenAI with strict output schema
7. Validate returned JSON
8. Return dashboard payload to frontend

### Edge Cases
- Invalid URL
  - Show inline validation message
- Website fetch fails
  - Show retry state with a concise error
- Site has thin content
  - Return best-effort analysis and mention limited signal
- AI response malformed
  - Retry once server-side, then return fallback error

## 3. UI Wireframe Structure

### Page Structure
```text
+--------------------------------------------------------------+
| Logo / Wordmark                                             |
| "Your AI Growth Team, Instantly"                            |
| Short subheading                                            |
|                                                              |
| [ Website URL.......................................... ]    |
| [ Analyze Site ]                                            |
|                                                              |
| Optional helper text: "Built for startups, SaaS, and Web3"  |
+--------------------------------------------------------------+

After submit:

+--------------------------------------------------------------+
| Header                                                      |
| URL analyzed: example.com                                   |
| Status badge: Analysis complete                             |
+--------------------------------------------------------------+

+---------------------------+----------------------------------+
| Growth Strategy           | Viral Content Ideas              |
| - positioning verdict     | - hooks                          |
| - priorities              | - content concepts               |
| - growth plays            | - campaign angles                |
+---------------------------+----------------------------------+

+---------------------------+----------------------------------+
| SEO Opportunities         | Landing Page Fixes               |
| - keyword themes          | - friction points                |
| - blog ideas              | - CTA fixes                      |
| - quick wins              | - trust improvements             |
+---------------------------+----------------------------------+

+--------------------------------------------------------------+
| Distribution Plan                                            |
| - channels                                                   |
| - why these channels                                         |
| - campaign ideas                                             |
+--------------------------------------------------------------+
```

### UX Notes
- Keep the homepage above the fold
- Make the URL input the visual focal point
- Loading state should feel premium, like agents are working
- Output should read like a strategic audit, not like chat bubbles
- Use cards, labels, and strong typography rather than long paragraphs

### Suggested Content Hierarchy
- Hero
- URL input
- Loading state
- Results header
- Five dashboard sections

## 4. Component Breakdown

### Top-Level Components

#### `PageShell`
- Wraps the page
- Applies layout width, spacing, and background

#### `HeroSection`
- Headline
- Subheadline
- Trust/context line

#### `UrlInputForm`
- URL input
- Submit button
- Validation state
- Disabled/loading behavior

#### `AnalysisStatus`
- Shows analyzing, success, or error state
- Displays analyzed domain

#### `ResultsDashboard`
- Parent container for all output cards
- Receives normalized analysis payload

### Dashboard Components

#### `StrategyCard`
- Strategic summary
- Top priorities
- Experiment ideas

#### `ContentIdeasCard`
- Hooks
- Viral angles
- Post ideas

#### `SeoCard`
- Keyword themes
- Blog opportunities
- Quick wins

#### `ConversionCard`
- Friction points
- Recommended fixes
- CTA improvements

#### `DistributionCard`
- Channel recommendations
- Distribution rationale
- Campaign plays

### Optional Supporting Components

#### `SectionCard`
- Reusable styled card wrapper

#### `BulletList`
- Renders concise recommendation lists

#### `EmptyState`
- Displayed before any URL is submitted

#### `ErrorState`
- Displayed when fetch or analysis fails

#### `LoadingState`
- Skeletons or progress messaging for agent analysis

### Backend Modules

#### `analyzeWebsite`
- Main orchestration function

#### `fetchSiteHtml`
- Fetches homepage HTML

#### `parseSiteContent`
- Extracts title, headings, body text, CTA copy

#### `buildSiteContext`
- Converts raw extraction into structured product context

#### `generateGrowthReport`
- Calls OpenAI with the system prompt and schema

#### `validateGrowthReport`
- Validates response shape before returning to UI

## Recommended Build Order
1. Build homepage with URL input and empty dashboard shell
2. Add API route with mocked JSON response
3. Connect frontend to mocked response
4. Add HTML fetch and parsing
5. Replace mock with OpenAI-generated structured output
6. Polish loading, error, and dashboard presentation

## Suggested MVP Copy

### Headline
Your AI Growth Team, On Demand

### Subheadline
Paste your website and get a sharp growth strategy, conversion fixes, SEO opportunities, and distribution plays in minutes.

### CTA
Analyze Site

## Final Recommendation
Ship this as a single-page analyzer with one URL input and one powerful result view. The product strength will come from the quality and specificity of the output, not from extra features. The fastest path to a compelling MVP is a beautiful front end, a clean analysis pipeline, and tightly structured AI prompts.
