"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

type WelcomeStepProps = {
  userName: string;
  selectedPlan: string;
  onFinish: () => void;
};

const planLabels: Record<string, string> = {
  weekly: "Explorer (Weekly)",
  monthly: "Protocol (Monthly)",
  yearly: "Ecosystem (Yearly)",
  payperuse: "Pay Per Use",
};

const terminalLines = [
  { text: "Initializing CMO workspace...", delay: 0 },
  { text: "Connecting crypto intelligence agents...", delay: 600 },
  { text: "  ✓ Narrative Agent ready", delay: 1000 },
  { text: "  ✓ Positioning Agent ready", delay: 1300 },
  { text: "  ✓ Competitor Intelligence ready", delay: 1600 },
  { text: "  ✓ Community Sentiment ready", delay: 1900 },
  { text: "  ✓ Reddit Intel ready", delay: 2200 },
  { text: "  ✓ Critic ready", delay: 2500 },
  { text: "  ✓ Aggregator ready", delay: 2700 },
  { text: "  ✓ Arc nanopayments ready", delay: 2900 },
  { text: "Setting up weekly protocol briefings...", delay: 3300 },
  { text: "Workspace configured. You're all set.", delay: 3800 },
];

export function WelcomeStep({ userName, selectedPlan, onFinish }: WelcomeStepProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    terminalLines.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, line.delay)
      );
    });

    timers.push(setTimeout(() => setShowCta(true), 4400));

    return () => timers.forEach(clearTimeout);
  }, []);

  const firstName = userName.split(" ")[0] || "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] mb-4"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome, {firstName}.
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Your <span className="text-zinc-300 font-medium">{planLabels[selectedPlan] || selectedPlan}</span> workspace is being set up.
        </p>
      </motion.div>

      {/* Terminal animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
      >
        {/* Terminal header */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.04]">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="ml-2 text-[10px] text-zinc-600 font-mono">cmo-setup</span>
        </div>

        {/* Terminal body */}
        <div className="p-4 font-mono text-xs space-y-1 min-h-[240px]">
          {terminalLines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`${
                line.text.startsWith("  ✓")
                  ? "text-emerald-400/80 pl-2"
                  : "text-zinc-400"
              }`}
            >
              {!line.text.startsWith("  ") && (
                <span className="text-zinc-600 mr-2">$</span>
              )}
              {line.text}
            </motion.div>
          ))}

          {/* Blinking cursor */}
          {visibleLines < terminalLines.length && (
            <div className="flex items-center gap-1 text-zinc-600">
              <span>$</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block w-2 h-4 bg-zinc-500"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* CTA */}
      {showCta && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <button
            onClick={onFinish}
            className="w-full h-12 rounded-xl bg-white text-black text-sm font-semibold transition-all duration-200 hover:bg-zinc-200 flex items-center justify-center gap-2 group"
          >
            Launch CMO
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
