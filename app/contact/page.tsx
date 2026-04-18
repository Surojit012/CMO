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
  MessageCircle,
  Twitter,
  Mail,
  Bug,
  Lightbulb,
  Handshake,
  ArrowUpRight,
  Clock,
  Zap,
} from "lucide-react";

const channels = [
  {
    Icon: Twitter,
    title: "X (Twitter)",
    handle: "@surojitpvt",
    desc: "Best for quick questions, feedback, and feature requests. DMs are open.",
    link: "https://x.com/surojitpvt",
    linkText: "Message on X",
    primary: true,
  },
  {
    Icon: Mail,
    title: "Email",
    handle: "surojitguha58648@gmail.com",
    desc: "For partnership inquiries, enterprise requests, and detailed feedback.",
    link: "mailto:surojitguha58648@gmail.com",
    linkText: "Send email",
    primary: false,
  },
];

const topics = [
  {
    Icon: Bug,
    title: "Bug Reports",
    desc: "Found something broken? Send us a screenshot + the URL you were analyzing. We fix bugs within 24 hours.",
    response: "< 24h",
  },
  {
    Icon: Lightbulb,
    title: "Feature Requests",
    desc: "Want a new agent, integration, or output format? We prioritize based on community demand.",
    response: "48h",
  },
  {
    Icon: Handshake,
    title: "Partnerships",
    desc: "Building something complementary? We're open to integrations, co-marketing, and affiliate partnerships.",
    response: "48h",
  },
  {
    Icon: Zap,
    title: "Enterprise & API Access",
    desc: "Need bulk analyses, white-label, or direct API access? Let's talk about custom plans.",
    response: "48h",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PageNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center px-5 pt-32 pb-16 text-center sm:pt-40 sm:pb-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <MessageCircle className="h-3.5 w-3.5" />
            Get in touch
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            We'd love to <span className="text-zinc-400">hear from you.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl mx-auto text-sm leading-relaxed text-zinc-400 sm:text-lg sm:leading-8">
            Whether it's a bug, a feature request, or just feedback on your growth report — we read every message and respond fast.
          </motion.p>
        </motion.div>
      </section>

      {/* Contact Channels */}
      <section className="px-5 pb-16 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2"
        >
          {channels.map((ch) => (
            <motion.a
              variants={fadeUp}
              key={ch.title}
              href={ch.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col rounded-3xl border p-8 transition sm:p-10 ${
                ch.primary
                  ? "border-white/20 bg-zinc-900/80 ring-1 ring-white/10 hover:bg-zinc-900"
                  : "border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ch.Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{ch.title}</h3>
              <p className="mt-1 text-sm font-semibold text-zinc-300">{ch.handle}</p>
              <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{ch.desc}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition group-hover:gap-2">
                {ch.linkText} <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* What we can help with */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl"
        >
          <motion.h2 variants={fadeUp} className="text-center text-2xl font-bold text-white sm:text-3xl">
            What we can help with
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-center text-sm text-zinc-500 sm:text-base">
            Pick a topic so we can route you to the right person
          </motion.p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {topics.map((t) => (
              <motion.div
                variants={fadeUp}
                key={t.title}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition hover:border-white/20 hover:bg-zinc-900/80 sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <t.Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {t.response}
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Quick reach */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-2xl sm:p-14"
        >
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Fastest way to reach us?</h2>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            DM <span className="font-semibold text-white">@surojitpvt</span> on X. We typically respond within 2 hours.
          </p>
          <a
            href="https://x.com/surojitpvt"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 sm:mt-10"
          >
            DM @surojitpvt <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>
      </section>

      <PageFooter />
    </div>
  );
}
