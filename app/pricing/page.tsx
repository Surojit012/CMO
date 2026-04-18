"use client";

import {
  PageNavbar,
  PageFooter,
  motion,
  fadeUp,
  staggerContainer,
  Link,
  ArrowRight,
  Check,
} from "@/components/SiteLayout";
import {
  Zap,
  Shield,
  CreditCard,
  HelpCircle,
  Brain,
  Bot,
  Search,
  PenLine,
  Megaphone,
  CircleDot,
  Users,
  Network,
  BarChart3,
  RefreshCw,
} from "lucide-react";

/* ─────────────── FAQ Data ─────────────── */
const faqs = [
  {
    q: "Do I need a crypto wallet?",
    a: "No. CMO uses Privy embedded wallets — you sign in with email or Google. A wallet is auto-created for you. No MetaMask, no seed phrases.",
  },
  {
    q: "What does $5 USDC per analysis include?",
    a: "One complete growth analysis: 7 AI agents run in parallel, a Chief Aggregator produces the unified report, plus you get execution buttons (tweet threads, ad copy, blog posts, content plans).",
  },
  {
    q: "Can I use CMO for competitor analysis?",
    a: "Absolutely. Drop in any URL — yours, a competitor's, or any website. The 7 agents analyze whatever URL you give them.",
  },
  {
    q: "What happens after 3 free analyses?",
    a: "You'll be prompted to fund your embedded wallet with USDC on Arc Testnet. Each additional analysis costs $5 USDC. No subscription, no auto-renewals.",
  },
  {
    q: "Is the Market Audit separate?",
    a: "Yes. The Market Audit is a separate pipeline with Tavily deep research, competitor intelligence, SWOT, and GEO scoring. It costs $15 USDC per audit.",
  },
  {
    q: "What if I'm not satisfied?",
    a: "Each report has thumbs-up/down feedback. CMO learns from your feedback via its Redis memory system and improves future reports for similar websites.",
  },
];

/* ─────────────── Included Features ─────────────── */
const freeFeatures = [
  "Full 7-agent growth analysis",
  "Chief Aggregator report",
  "Execution buttons (tweets, ads, blog)",
  "Community outreach playbook",
  "Reddit intelligence",
  "Memory system (learns from feedback)",
];

const paidFeatures = [
  "Everything in Free Trial",
  "Unlimited analyses",
  "Market Audit engine (SWOT, competitors, pricing intel)",
  "Autonomous daily re-analysis at 9 AM UTC",
  "GEO readiness scoring",
  "Priority LLM chain (Groq → Fireworks → NVIDIA)",
  "30-day content plan generator",
  "One-click publish to Dev.to & Hashnode",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PageNavbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-32 pb-16 text-center sm:pt-40 sm:pb-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <CreditCard className="h-3.5 w-3.5" />
            No subscriptions. Ever.
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Simple, transparent <span className="text-zinc-400">pricing.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl mx-auto text-sm leading-relaxed text-zinc-400 sm:text-lg sm:leading-8">
            Start free. Pay per analysis when you're ready. No credit card, no subscriptions, no hidden fees. Just $5 USDC on-chain.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="px-5 pb-20 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2"
        >
          {/* Free Tier */}
          <motion.div variants={fadeUp} className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-zinc-500">Free Trial</p>
            <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
              3 <span className="text-lg font-bold text-zinc-400">analyses</span>
            </p>
            <p className="mt-2 text-sm text-zinc-500">No credit card required</p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-400">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="mt-10 flex items-center justify-center gap-1.5 rounded-full border border-white/20 py-3 text-center text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {/* Paid Tier */}
          <motion.div variants={fadeUp} className="relative rounded-3xl border border-white/20 bg-zinc-900/80 p-8 ring-1 ring-white/10 sm:p-10">
            <div className="absolute -top-3 right-6 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Most Popular
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-white">Pay Per Use</p>
            <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
              $5 <span className="text-lg font-bold text-zinc-400">USDC / analysis</span>
            </p>
            <p className="mt-2 text-sm text-zinc-500">On-chain via Arc Testnet</p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-400">
              {paidFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="mt-10 flex items-center justify-center gap-1.5 rounded-full bg-white py-3 text-center text-sm font-bold text-black transition hover:bg-zinc-200"
            >
              Launch app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* What's Included */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-5xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Every analysis includes
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-zinc-500 sm:text-base">
            7 AI specialists + 1 Chief Aggregator — working in parallel on your URL
          </motion.p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { Icon: Brain, name: "Strategist", desc: "ICP, positioning, GTM direction" },
              { Icon: PenLine, name: "Copywriter", desc: "PAS & AIDA copy frameworks" },
              { Icon: Search, name: "SEO Agent", desc: "Keywords, GEO, on-page audit" },
              { Icon: Zap, name: "Conversion", desc: "LIFT Model CRO analysis" },
              { Icon: Megaphone, name: "Distribution", desc: "Channel-specific growth plays" },
              { Icon: CircleDot, name: "Reddit Intel", desc: "Live thread scraping" },
              { Icon: Users, name: "Outreach", desc: "Community playbook generator" },
              { Icon: Network, name: "Aggregator", desc: "Unified growth report" },
            ].map((a, i) => (
              <motion.div
                variants={fadeUp}
                key={i}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 text-left transition hover:border-white/20 hover:bg-zinc-900/80"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <a.Icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-white">{a.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Additional Engines */}
      <section className="px-5 pb-20 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2"
        >
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
            <BarChart3 className="h-6 w-6 text-white" />
            <h3 className="mt-4 text-lg font-bold text-white">Market Audit Engine</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Full competitive intelligence — SWOT analysis, founder score, ICP profiling, moat analysis, pricing intel, 
              battle cards, and SEO gaps. Powered by 5 Tavily deep research queries + multi-LLM fallback chain (Groq → Fireworks → NVIDIA).
            </p>
            <p className="mt-4 text-xs text-zinc-500">$15 USDC per audit</p>
          </motion.div>
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
            <RefreshCw className="h-6 w-6 text-white" />
            <h3 className="mt-4 text-lg font-bold text-white">Autonomous Mode</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              CMO re-analyzes your tracked URLs every day at 9 AM UTC via CRON. Fresh growth intelligence 
              delivered to your dashboard without lifting a finger. Memory system ensures each report improves.
            </p>
            <p className="mt-4 text-xs text-zinc-500">Included with paid analyses</p>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl"
        >
          <motion.h2 variants={fadeUp} className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Frequently asked questions
          </motion.h2>
          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                variants={fadeUp}
                key={i}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition hover:border-white/20"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{faq.q}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Start with 3 free analyses.</h2>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">No credit card. No setup. No commitment.</p>
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
