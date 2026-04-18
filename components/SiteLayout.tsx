"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Twitter,
  Github,
  Check,
  ArrowLeft,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function PageNavbar() {
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

export function PageFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-xs text-zinc-500 sm:flex-row sm:text-sm">
        <p className="font-semibold text-zinc-400">CMO — Your AI Growth Team</p>
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
      <p className="mt-6 text-center text-[10px] text-zinc-700 sm:text-xs">Built on Arc Testnet · Powered by Privy</p>
    </footer>
  );
}

export { motion, fadeUp, staggerContainer, Link, ArrowRight, ArrowLeft, Check, Twitter, Github };
