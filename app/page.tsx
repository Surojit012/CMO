"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Target,
  Anchor,
  Search,
  Zap,
  Megaphone,
  Link2,
  Bot,
  Rocket,
  Brain,
  PenLine,
  CircleDot,
  Upload,
  RefreshCw,
  Gem,
  Settings,
  Check,
  X,
  ArrowRight,
  ArrowDown,
  Twitter,
  Github,
  Users,
  BarChart3,
  Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─────────────── Framer Motion Variants ─────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

/* ─────────────── 1 · NAVBAR ─────────────── */
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3 bg-zinc-950/70 backdrop-blur-xl border-b border-white/5 sm:px-8 sm:py-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-base font-bold tracking-[0.2em] text-white sm:text-lg">CMO</Link>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link href="/pricing" className="hidden text-xs font-medium text-zinc-400 transition hover:text-white sm:block sm:text-sm">Pricing</Link>
        <Link href="/docs" className="hidden text-xs font-medium text-zinc-400 transition hover:text-white sm:block sm:text-sm">Docs</Link>
        <Link href="/blog" className="hidden text-xs font-medium text-zinc-400 transition hover:text-white sm:block sm:text-sm">Blog</Link>
        <Link href="/contact" className="hidden text-xs font-medium text-zinc-400 transition hover:text-white sm:block sm:text-sm">Contact</Link>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 sm:px-5 sm:py-2 sm:text-sm"
        >
          Launch App <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </nav>
  );
}

/* ─────────────── 2 · HERO ─────────────── */
function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-20 text-center">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center"
      >
        <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
          </span>
          Built on Arc · Settled in USDC
        </motion.div>
        
        <motion.h1 
          variants={fadeUp} 
          className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Marketing Intelligence <span className="text-zinc-400">for Crypto Protocols.</span>
        </motion.h1>
        
        <motion.p variants={fadeUp} className="mt-8 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-lg sm:leading-8">
          Audit your narrative. Track competitors. Monitor your community. Every report settled as a nanopayment on Arc.
        </motion.p>
        
        <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 sm:text-base"
          >
            Launch Your Protocol Intelligence <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        <motion.p variants={fadeUp} className="mt-8 text-xs font-medium tracking-wide text-zinc-500 sm:text-sm">
          Pay-per-report in USDC · ERC-8183 nanopayments · Arc Testnet
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ─────────────── 3 · DEMO PREVIEW ─────────────── */
function Demo() {
  return (
    <section className="relative px-5 pb-20 sm:px-8">
      <motion.div 
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-3xl"
      >
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl overflow-hidden">
          {/* browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="ml-3 flex-1 rounded-md bg-zinc-800 px-3 py-1 text-[10px] text-zinc-500 sm:text-xs text-center">cmo.app — Protocol Intelligence</span>
          </div>
          {/* mock output */}
          <div className="space-y-4 p-4 text-xs text-zinc-300 sm:space-y-5 sm:p-6 sm:text-sm">
            <MockSection Icon={Target} title="Narrative Audit" items={[
              `Core narrative scores 4/10 on clarity — hero says "decentralized infrastructure" but features describe a bridge aggregator`,
              `Positioning conflict: headline claims DeFi category but token utility section reads like a DePIN protocol`,
              `Suggested rewrite: "[Protocol] is the cross-chain bridge for DeFi protocols that need sub-second finality"`
            ]} />
            <MockSection Icon={Anchor} title="Competitor Battle Card" items={[
              `Competitor claims "gasless transactions" but requires ETH for contract deployments — exploit this in positioning`,
              `Your token utility is 3x clearer than competitor's — lead with utility comparison in pitch decks`
            ]} />
            <MockSection Icon={Search} title="Community Health" items={[
              `Dominant sentiment: BULLISH — community excited about v2 launch, but top pain point is unclear token distribution timeline`,
              `Recommendation: Post transparent vesting schedule this week to convert sentiment into retention`
            ]} />
            <MockSection Icon={Zap} title="Launch Readiness" items={[
              `Readiness Score: 6/10 — narrative and positioning are solid but community engagement is below threshold`,
              `Critical: Add protocol comparison page before launch to differentiate from 3 similar protocols in the same category`
            ]} />
            <MockSection Icon={Megaphone} title="Weekly Pulse" items={[
              `Reddit: 12 new mentions in r/defi and r/ethereum this week — sentiment shifted from neutral to bullish after AMA`,
              `Competitor launched new feature — quick-scan shows their narrative is still confused, your positioning window is open`
            ]} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
function MockSection({ Icon, title, items }: { Icon: LucideIcon; title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 font-semibold text-white">
        <Icon className="h-4 w-4 text-white" />
        {title}
      </h3>
      <ul className="space-y-1 pl-6">
        {items.map((item, i) => <li key={i} className="list-disc text-zinc-400 leading-5">{item}</li>)}
      </ul>
    </div>
  );
}

/* ─────────────── 4 · HOW IT WORKS ─────────────── */
function HowItWorks() {
  const steps: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Link2, title: "Drop your protocol URL", desc: "Paste your protocol's website — or a competitor's — and pick a report type." },
    { Icon: Bot, title: "Crypto-native agents analyze in parallel", desc: "Narrative, Positioning, Competitor Intelligence, Community Sentiment, and Reddit Intel agents fire simultaneously — then a Chief Aggregator synthesizes their outputs into one report." },
    { Icon: Rocket, title: "Get your protocol intelligence", desc: "Receive a unified, evidence-based report with narrative scores, battle cards, community health checks, and launch readiness assessments." },
  ];
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-4xl text-center"
      >
        <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">How it works</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-sm text-zinc-500 sm:text-base">From URL to protocol intelligence in 60 seconds</motion.p>
        <div className="mt-12 grid gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => (
            <motion.div variants={fadeUp} key={i} className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-left sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 sm:h-12 sm:w-12">
                <s.Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <p className="absolute top-5 right-5 text-xs font-bold text-zinc-700 sm:top-6 sm:right-6">0{i + 1}</p>
              <h3 className="mt-4 text-base font-bold text-white sm:text-lg">{s.title}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-400 sm:text-sm sm:leading-6">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────── 5 · AGENTS ─────────────── */
function Agents() {
  const agents: { Icon: LucideIcon; name: string; desc: string }[] = [
    { Icon: Brain, name: "Narrative Agent", desc: "Analyzes how your protocol tells its story. Scores narrative clarity, finds messaging gaps, and aligns against current crypto market meta." },
    { Icon: PenLine, name: "Positioning Agent", desc: "Identifies your category ownership, ICP definition, and differentiation score. Writes a one-sentence positioning statement that sticks." },
    { Icon: Search, name: "Competitor Intelligence", desc: "Head-to-head protocol analysis. Builds battle cards with competitor weaknesses, your advantages, and a 3-sentence executive brief." },
    { Icon: Zap, name: "Community Sentiment", desc: "Scores community health from Reddit discussions. Extracts dominant sentiment, pain points, and actionable recommendations." },
    { Icon: CircleDot, name: "Reddit Intel", desc: "Scrapes live Reddit threads for protocol discussions, pain points, and engagement opportunities." },
    { Icon: Megaphone, name: "SEO & Distribution", desc: "On-page audit, keyword clustering, and platform-specific distribution plays for protocol visibility." },
    { Icon: Users, name: "Copywriter", desc: "Crypto-native copy rewrites. Generates tighter headlines, bolder CTAs, and messaging that resonates with protocol communities." },
  ];
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-5xl text-center"
      >
        <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">7 crypto-native agents. 1 Chief Aggregator.</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 max-w-xl mx-auto text-sm text-zinc-500 sm:text-base">All agents fire in parallel, then a Chief Aggregator synthesizes their outputs into one unified, evidence-based protocol intelligence report.</motion.p>
        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {agents.map((a, i) => (
            <motion.div variants={fadeUp} key={i} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 text-left transition hover:border-white/20 hover:bg-zinc-900/80 sm:p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 sm:h-10 sm:w-10">
                <a.Icon className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-white sm:text-base">{a.name}</h3>
              <p className="mt-1.5 text-xs leading-5 text-zinc-400 sm:text-sm">{a.desc}</p>
            </motion.div>
          ))}
        </div>
        {/* Aggregator callout */}
        <motion.div variants={fadeUp} className="mt-6 mx-auto max-w-lg rounded-2xl border border-white/20 bg-white/5 p-5 sm:p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white sm:text-base">Chief Aggregator</h3>
              <p className="text-xs text-zinc-400 sm:text-sm">Receives all specialist reports + protocol context. Produces one sharp, non-redundant protocol intelligence report.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────── 6 · FEATURES BENTO GRID ─────────────── */
function Features() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-5xl"
      >
        <motion.h2 variants={fadeUp} className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">Everything your protocol needs</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-center text-sm text-zinc-500 sm:text-base">Not just analysis — actionable intelligence built in</motion.p>
        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 md:grid-cols-3">
          <BentoCard title="Competitor Battle Cards" desc="Full competitive intelligence — head-to-head protocol analysis, narrative weaknesses, positioning gaps, and executive battle card summaries. Powered by multi-LLM analysis chain." className="md:col-span-2" Icon={BarChart3} />
          <BentoCard title="Community Health Check" desc="Scores community sentiment, identifies pain points, and delivers actionable recommendations from Reddit discussions and protocol forums." Icon={Users} />
          <BentoCard title="Reddit Intelligence" desc="Scrapes live Reddit threads for protocol discussions and sentiment. Suggests exact subreddits and identifies community engagement opportunities." Icon={CircleDot} />
          <BentoCard title="Weekly Pulse" desc="CMO auto-generates a weekly pulse report — community sentiment shifts, competitor moves, and Reddit chatter. Protocol intelligence on autopilot." Icon={RefreshCw} />
          <BentoCard title="Execution Layer" desc="Not just analysis — generates tweet threads, ad copy, blog posts, and content plans. One-click publish to Dev.to and Hashnode." className="md:col-span-2" Icon={Settings} />
          <BentoCard title="Memory System" desc="Stores past analyses in Redis. Learns from your thumbs-up/down feedback to reinforce what works and avoid what doesn't." Icon={Brain} />
          <BentoCard title="ERC-8183 Nanopayments" desc="Pay per-report in USDC via Arc's Agentic Commerce Protocol. One consolidated on-chain job per session — full cost transparency." Icon={Gem} />
          <BentoCard title="GEO Readiness" desc="Checks if your site is optimized for AI search engines like ChatGPT, Perplexity, and Google AI Overviews." className="md:col-span-1" Icon={Search} />
          <BentoCard title="Quality Auditor" desc="Every output passes through a Groq-powered Critic before synthesis. Hallucinations, vague claims, and wrong product names are flagged and suppressed automatically." className="md:col-span-1" Icon={Check} />
        </div>
      </motion.div>
    </section>
  );
}
function BentoCard({ title, desc, Icon, className = "" }: { title: string; desc: string; Icon: LucideIcon; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={`group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition hover:border-white/20 hover:bg-zinc-900/80 sm:p-8 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <h3 className="mt-3 text-base font-bold text-white sm:text-lg">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-400 sm:text-sm sm:leading-6">{desc}</p>
    </motion.div>
  );
}

/* ─────────────── helper SVG icons for table ─────────────── */
function CheckIcon() {
  return <Check className="mx-auto h-4 w-4 text-white" />;
}
function XIcon() {
  return <X className="mx-auto h-4 w-4 text-zinc-600" />;
}

/* ─────────────── 7 · PRICING ─────────────── */
function Pricing() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Simple, transparent pricing</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-sm text-zinc-500 sm:text-base">Plans in USDC. Settled on Arc.</motion.p>
        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6">
          {/* Free */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-left sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Free Trial</p>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">3 <span className="text-base font-bold text-zinc-400 sm:text-lg">reports</span></p>
            <ul className="mt-6 space-y-2.5 text-xs text-zinc-400 sm:text-sm">
              {["Full feature access", "All crypto-native agents", "5 report types", "Community health checks", "Execution buttons"].map((f, i) => (
                <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-white shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 flex items-center justify-center gap-1.5 rounded-full border border-white/20 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5">
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
          {/* Paid */}
          <motion.div variants={fadeUp} className="relative rounded-2xl border border-white/20 bg-zinc-900/80 p-6 text-left ring-1 ring-white/10 sm:p-8">
            <div className="absolute -top-3 right-6 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Popular</div>
            <p className="text-xs font-bold uppercase tracking-wider text-white">Pay Per Report</p>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">0.50 USDC <span className="text-base font-bold text-zinc-400 sm:text-lg">— 5.00 USDC / report</span></p>
            <ul className="mt-6 space-y-2.5 text-xs text-zinc-400 sm:text-sm">
              {["ERC-8183 nanopayments", "Per-report USDC billing", "On-chain cost transparency", "Privy embedded wallet", "Plans available too"].map((f, i) => (
                <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-white shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-center text-sm font-bold text-black transition hover:bg-zinc-200">
              Launch app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
        <motion.p variants={fadeUp} className="mt-8 text-xs text-zinc-600">ERC-8183 Nanopayments on Arc Testnet · Powered by Privy</motion.p>
      </motion.div>
    </section>
  );
}

/* ─────────────── 8 · COMPARISON TABLE ─────────────── */
function Comparison() {
  const rows = [
    { feature: "7 parallel AI agents", cmo: true, okara: false, agency: true, diy: false },
    { feature: "Chief Aggregator synthesis", cmo: true, okara: false, agency: false, diy: false },
    { feature: "Market audit + SWOT", cmo: true, okara: false, agency: true, diy: false },
    { feature: "Community outreach engine", cmo: true, okara: false, agency: false, diy: false },
    { feature: "Reddit intelligence", cmo: true, okara: true, agency: false, diy: false },
    { feature: "Execution layer", cmo: true, okara: false, agency: true, diy: false },
    { feature: "Memory / learning", cmo: true, okara: false, agency: false, diy: false },
    { feature: "Web3 payments", cmo: true, okara: false, agency: false, diy: false },
    { feature: "Autonomous daily mode", cmo: true, okara: true, agency: false, diy: false },
  ];
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Why CMO beats everything else</h2>
        <div className="mt-12 overflow-x-auto sm:mt-16">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/20 text-zinc-400">
                <th className="pb-3 pr-4 font-medium">Feature</th>
                <th className="pb-3 px-3 font-bold text-white text-center">CMO</th>
                <th className="pb-3 px-3 font-medium text-center">Okara.ai</th>
                <th className="pb-3 px-3 font-medium text-center">Agency</th>
                <th className="pb-3 pl-3 font-medium text-center">DIY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-white/10">
                  <td className="py-3 pr-4 text-zinc-300">{r.feature}</td>
                  <td className="py-3 px-3 text-center">{r.cmo ? <CheckIcon /> : <XIcon />}</td>
                  <td className="py-3 px-3 text-center">{r.okara ? <CheckIcon /> : <XIcon />}</td>
                  <td className="py-3 px-3 text-center">{r.agency ? <CheckIcon /> : <XIcon />}</td>
                  <td className="py-3 pl-3 text-center">{r.diy ? <CheckIcon /> : <XIcon />}</td>
                </tr>
              ))}
              <tr className="border-b border-white/10">
                <td className="py-3 pr-4 text-zinc-300">Cost</td>
                <td className="py-3 px-3 text-center font-bold text-white">~1.35 USDC</td>
                <td className="py-3 px-3 text-center text-zinc-400">$99/mo</td>
                <td className="py-3 px-3 text-center text-zinc-400">$5k+/mo</td>
                <td className="py-3 pl-3 text-center text-zinc-400">Hours/day</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────── 9 · FINAL CTA ─────────────── */
function FinalCta() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div 
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-2xl sm:p-14"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Start auditing your protocol today.</h2>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">3 free reports. No credit card. No setup.</p>
        <Link
          href="/app"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 sm:mt-10 sm:px-10 sm:text-base"
        >
          Launch CMO <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}

/* ─────────────── 10 · FOOTER ─────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-xs text-zinc-500 sm:flex-row sm:text-sm">
        <p className="font-semibold text-zinc-400">CMO — Protocol Intelligence Suite</p>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
          <Link href="/docs" className="transition hover:text-white">Docs</Link>
          <Link href="/blog" className="transition hover:text-white">Blog</Link>
          <Link href="/contact" className="transition hover:text-white">Contact</Link>
          <Link href="/app" className="transition hover:text-white">App</Link>
          <a href="https://x.com/surojitpvt" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="https://github.com/Surojit012" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-zinc-700 sm:text-xs">ERC-8183 Nanopayments on Arc Testnet · Powered by Privy</p>
    </footer>
  );
}

/* ─────────────── PAGE ─────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Hero />
      <Demo />
      <HowItWorks />
      <Agents />
      <Features />
      <Pricing />
      <Comparison />
      <FinalCta />
      <Footer />
    </div>
  );
}
