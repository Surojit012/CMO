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
  Newspaper,
  Clock,
  ArrowUpRight,
  Brain,
  Zap,
  Search,
  Megaphone,
  BarChart3,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { posts } from "@/lib/blog-data";

export default function BlogPage() {
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PageNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center px-5 pt-32 pb-16 text-center sm:pt-40 sm:pb-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <Newspaper className="h-3.5 w-3.5" />
            Blog
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Insights on <span className="text-zinc-400">AI growth.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl mx-auto text-sm leading-relaxed text-zinc-400 sm:text-lg sm:leading-8">
            Deep dives into multi-agent architecture, growth engineering, SEO, and what we're building at CMO.
          </motion.p>
        </motion.div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-5 pb-12 sm:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto max-w-4xl"
          >
            <Link href={`/blog/${featured.slug}`} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 transition hover:border-white/20 hover:bg-zinc-900/80 sm:p-12 block">
              <div className="absolute top-6 right-6 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                Featured
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  {featured.category}
                </span>
                <Clock className="h-3 w-3" />
                {featured.date} · {featured.readTime}
              </div>
              <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl md:text-3xl group-hover:text-zinc-200 transition">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                {featured.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition group-hover:gap-2.5">
                Read article <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* Post Grid */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 md:grid-cols-3"
        >
          {rest.map((post) => (
            <motion.div
              variants={fadeUp}
              key={post.slug}
              className="h-full"
            >
              <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition hover:border-white/20 hover:bg-zinc-900/80">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                <post.Icon className="h-3.5 w-3.5 text-zinc-400" />
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {post.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug group-hover:text-zinc-200 transition sm:text-base">
                {post.title}
              </h3>
              <p className="mt-3 flex-1 text-xs leading-5 text-zinc-400">
                {post.excerpt.slice(0, 120)}...
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </div>
                <span>{post.date}</span>
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-2xl sm:p-14"
        >
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Stay in the loop.</h2>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            Follow us on X for the latest updates, growth tips, and product launches.
          </p>
          <a
            href="https://x.com/surojitpvt"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 sm:mt-10"
          >
            Follow @surojitpvt <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>
      </section>

      <PageFooter />
    </div>
  );
}
