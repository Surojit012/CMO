"use client";

import {
  PageNavbar,
  PageFooter,
  motion,
  fadeUp,
  staggerContainer,
  Link,
  ArrowRight,
} from "@/components/SiteLayout";
import {
  BookOpen,
  Layers,
  Brain,
  PenLine,
  Search,
  Zap,
  Megaphone,
  CircleDot,
  Users,
  Network,
  BarChart3,
  Database,
  RefreshCw,
  Code2,
  Terminal,
  Workflow,
  Shield,
} from "lucide-react";

const agents = [
  { Icon: Brain, name: "Strategist", role: "Runs first. Establishes ICP, positioning, and GTM direction. Output is injected into all downstream agents.", trigger: "Step 1 (Sequential)" },
  { Icon: PenLine, name: "Copywriter", role: "PAS & AIDA frameworks. Generates viral hooks, ad copy, hero rewrites, and bold messaging angles. Receives Strategist brief.", trigger: "Step 2 (Parallel)" },
  { Icon: Search, name: "SEO Agent", role: "On-page audit, keyword clustering, GEO readiness, and blog title generation. Receives Strategist brief + Market Audit SEO gaps.", trigger: "Step 2 (Parallel)" },
  { Icon: Zap, name: "Conversion Agent", role: "LIFT Model CRO audit. Scores CTAs, trust signals, urgency, and mobile UX — then provides BEFORE → AFTER rewrites.", trigger: "Step 2 (Parallel)" },
  { Icon: Megaphone, name: "Distribution Agent", role: "Platform-specific growth plays with exact subreddits, hashtags, newsletters, influencers, and growth loops.", trigger: "Step 2 (Parallel)" },
  { Icon: CircleDot, name: "Reddit Intel Agent", role: "Extracts keywords from product description, scrapes live Reddit threads, identifies engagement opportunities, writes natural comments.", trigger: "Step 2 (Parallel)" },
  { Icon: Users, name: "Outreach Agent", role: "Generates a structured community outreach playbook — 6-8 communities, 4 phased rollout, post templates, weekly tasks, KPI targets.", trigger: "Separate trigger" },
];

const sections = [
  {
    id: "architecture",
    Icon: Layers,
    title: "Architecture Overview",
    content: `CMO uses a sequential-then-parallel multi-agent architecture:

**Step 1 (Sequential):** The Strategist Agent runs first, alone, to establish ICP, positioning, and GTM direction.

**Step 2 (Parallel):** The Strategist's output is injected into 5 remaining agents (Copywriter, SEO, Conversion, Distribution, Reddit) as strategic context. All 5 run in parallel via Promise.all().

**Step 3 (Convergence):** All 6 outputs are sent to the Chief Aggregator, which produces one unified, non-redundant growth report.

**Data Bridges (Redis):** The Outreach Agent and Market Audit pipeline store their outputs in Redis. On the next Growth Analysis run, this data is automatically fetched and injected into the Strategist, SEO Agent, and Aggregator.`,
  },
  {
    id: "pipelines",
    Icon: Workflow,
    title: "3 Analysis Pipelines",
    content: `**1. Growth Analysis** — The core pipeline. 7 AI specialists + Chief Aggregator produce an 8-section growth report (Critical Issues, Growth Strategy, Viral Hooks, SEO Opportunities, Conversion Fixes, Distribution Plan, Reddit Opportunities, Unfair Advantage).

**2. Market Audit** — Independent pipeline with Jina scraping, 5 Tavily deep research queries, and a multi-LLM fallback chain (Groq → Fireworks → NVIDIA). Produces SWOT, competitors, founder score, moat analysis, pricing intel, battle cards, and SEO gaps.

**3. Community Outreach** — Generates a complete outreach playbook with target communities, phased rollout (4 phases), post templates, weekly task cadence, KPI targets, and viral angles.`,
  },
  {
    id: "memory",
    Icon: Database,
    title: "Memory System",
    content: `CMO stores every analysis in Redis (Upstash) as encrypted payloads. The memory system:

- **Stores feedback:** Thumbs-up/down on each report
- **Pattern extraction:** Identifies what works (positive patterns) and what doesn't (negative patterns)
- **Similarity scoring:** Finds past analyses of similar websites using hostname token matching
- **Context injection:** Past patterns and similar analyses are injected into the agent prompts to improve output quality over time`,
  },
  {
    id: "data-bridges",
    Icon: Network,
    title: "Data Bridges",
    content: `Two Redis data bridges connect the independent pipelines:

**Outreach → Core Pipeline:** After the Outreach Agent generates a community plan, the top 3 recommended communities are stored in Redis (7-day TTL). On the next Growth Analysis run, the Strategist and Aggregator receive this community intelligence.

**Market Audit → Core Pipeline:** After a Market Audit completes, a compact summary (SWOT, competitors, SEO gaps, founder score) is stored in Redis (24-hour TTL). On the next Growth Analysis run, the Strategist, SEO Agent, and Aggregator receive this competitive context. The Aggregator adds a "📈 Market Position" section to the report.`,
  },
  {
    id: "execution",
    Icon: Terminal,
    title: "Execution Layer",
    content: `CMO doesn't just strategize — it generates executable content:

- **Tweet threads:** Ready-to-post Twitter/X threads based on viral hooks
- **Ad copy:** Facebook/Google ad copy with multiple hook angles
- **Blog posts:** Full blog drafts targeting recommended SEO keywords
- **30-day content plans:** Structured content calendar with topics, platforms, and formats
- **One-click publish:** Direct publishing to Dev.to and Hashnode via API integration`,
  },
  {
    id: "payments",
    Icon: Shield,
    title: "ERC-8183 Nanopayments",
    content: `CMO uses Arc's Agentic Commerce Protocol (ERC-8183) for transparent, per-agent micro-billing:

**How it works:** Each analysis session creates ONE consolidated on-chain job. The job description embeds a per-agent cost breakdown (e.g., Strategist: $0.20, Critic: $0.10). Only 7 blockchain transactions per session (~15-20s on Arc Testnet).

**Settlement lifecycle:** createJob → setBudget → approve USDC → fund escrow → submit deliverable → complete. The deliverable hash is a keccak256 of the combined agent output, permanently anchored on-chain.

**Agent pricing:** Strategist, Copywriter, SEO, Conversion, Distribution: $0.20 each. Reddit Intel: $0.15. Critic, Aggregator: $0.10 each. A full 8-agent run costs ~$1.35 USDC.

**Wallet:** Privy creates an embedded wallet automatically on sign-in (email, Google, or existing wallet). USDC balance is displayed in the navbar with live refresh. 3 free analyses for new users before payment is required.`,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PageNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center px-5 pt-32 pb-16 text-center sm:pt-40 sm:pb-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <BookOpen className="h-3.5 w-3.5" />
            Documentation
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            How CMO <span className="text-zinc-400">works.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl mx-auto text-sm leading-relaxed text-zinc-400 sm:text-lg sm:leading-8">
            Deep dive into the 7-agent architecture, 3 analysis pipelines, memory system, data bridges, and execution layer.
          </motion.p>
        </motion.div>
      </section>

      {/* Quick Nav */}
      <section className="px-5 pb-16 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-3"
        >
          {sections.map((s) => (
            <motion.a
              variants={fadeUp}
              key={s.id}
              href={`#${s.id}`}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition hover:border-white/20 hover:bg-zinc-900/80"
            >
              <s.Icon className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-white" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{s.title}</span>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* Sections */}
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="px-5 py-12 sm:px-8 sm:py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <s.Icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">{s.title}</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
              {s.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mt-4 first:mt-0 text-sm leading-7 text-zinc-400">
                  {paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              ))}
            </div>
          </motion.div>
        </section>
      ))}

      {/* Agent Detail Table */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto max-w-4xl"
        >
          <motion.h2 variants={fadeUp} className="text-center text-xl font-bold text-white sm:text-2xl mb-8">
            Agent Reference
          </motion.h2>
          <div className="space-y-3">
            {agents.map((a, i) => (
              <motion.div
                variants={fadeUp}
                key={i}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6 transition hover:border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <a.Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white">{a.name}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                        {a.trigger}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-zinc-400 sm:text-sm sm:leading-6">{a.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Aggregator */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-white/20 bg-white/5 p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Network className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">Chief Aggregator</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      Step 3 (Convergence)
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-400 sm:text-sm sm:leading-6">
                    Receives all 7 agent outputs + website context + outreach communities + market audit data. Produces one unified, non-redundant growth report with 8 mandatory sections. 
                    Enforces specificity rules — every bullet must reference the product by name and be actionable today.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* API Note */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="h-5 w-5 text-zinc-400" />
            <h3 className="text-lg font-bold text-white">API Endpoints</h3>
          </div>
          <div className="space-y-3 font-mono text-xs sm:text-sm">
            {[
              { method: "POST", path: "/api/analyze", desc: "Growth Analysis (7 agents + aggregator)" },
              { method: "POST", path: "/api/market-audit", desc: "Market Audit (Jina + Tavily + LLM chain)" },
              { method: "POST", path: "/api/outreach", desc: "Community Outreach plan generator" },
              { method: "POST", path: "/api/execute", desc: "Content execution (tweets, ads, blog)" },
              { method: "POST", path: "/api/publish", desc: "One-click publish to Dev.to / Hashnode" },
              { method: "GET", path: "/api/history", desc: "User analysis history" },
              { method: "POST", path: "/api/feedback", desc: "Submit thumbs-up/down feedback" },
            ].map((ep, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${ep.method === "GET" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {ep.method}
                </span>
                <span className="text-zinc-300">{ep.path}</span>
                <span className="ml-auto text-zinc-500 font-sans text-xs hidden sm:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-2xl sm:p-14"
        >
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to try it?</h2>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">3 free analyses. No setup required.</p>
          <Link
            href="/app"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 sm:mt-10"
          >
            Launch CMO <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      <PageFooter />
    </div>
  );
}
