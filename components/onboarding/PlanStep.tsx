"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, TrendingUp, Crown, CreditCard } from "lucide-react";

type PlanStepProps = {
  onSelect: (plan: string) => void;
  onBack: () => void;
};

type Plan = {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  icon: typeof Zap;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "weekly",
    name: "Starter",
    description: "Perfect for testing CMO on a single project.",
    price: "$9",
    period: "/ week",
    features: [
      "5 growth analyses per week",
      "3 AI agents included",
      "Basic SEO + Copy reports",
      "Email report delivery",
    ],
    icon: Zap,
  },
  {
    id: "monthly",
    name: "Growth",
    description: "For founders who ship weekly and iterate fast.",
    price: "$29",
    period: "/ month",
    features: [
      "Unlimited growth analyses",
      "All 8 AI agents",
      "Market audit reports",
      "Daily Telegram briefings",
      "Autonomous mode",
    ],
    icon: TrendingUp,
    popular: true,
  },
  {
    id: "yearly",
    name: "Scale",
    description: "Best value. Lock in the rate for a full year.",
    price: "$249",
    period: "/ year",
    features: [
      "Everything in Growth",
      "Priority agent compute",
      "Outreach engine access",
      "Compare mode",
      "API access",
      "White-label exports",
    ],
    icon: Crown,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function PlanStep({ onSelect, onBack }: PlanStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Requirements quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      key: "frequency",
      question: "How often will you run analyses?",
      options: [
        { label: "A few times to test", value: "low" },
        { label: "Weekly", value: "medium" },
        { label: "Daily / automated", value: "high" },
      ],
    },
    {
      key: "agents",
      question: "How many agents do you need?",
      options: [
        { label: "Just SEO + Copy", value: "few" },
        { label: "Most of them", value: "most" },
        { label: "All 8 agents", value: "all" },
      ],
    },
    {
      key: "budget",
      question: "What fits your budget?",
      options: [
        { label: "Pay only when I use it", value: "payperuse" },
        { label: "Under $30/month", value: "low" },
        { label: "I want the best value", value: "high" },
      ],
    },
  ];

  const getSuggestedPlan = (): string => {
    const { frequency, agents, budget } = answers;
    if (budget === "payperuse") return "payperuse";
    if (frequency === "high" || agents === "all" || budget === "high") return "yearly";
    if (frequency === "medium" || agents === "most") return "monthly";
    return "weekly";
  };

  const allAnswered = Object.keys(answers).length === questions.length;
  const suggestedPlan = allAnswered ? getSuggestedPlan() : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-3xl mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Choose your plan
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Pick a plan, or{" "}
          <button
            onClick={() => setShowQuiz(!showQuiz)}
            className="text-white underline underline-offset-2 decoration-zinc-700 hover:decoration-white transition-colors"
          >
            let us recommend one
          </button>{" "}
          based on your needs.
        </p>
      </motion.div>

      {/* Quiz */}
      {showQuiz && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-5"
        >
          {questions.map((q, qi) => (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: qi * 0.1 }}
            >
              <p className="text-xs font-medium text-zinc-400 mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.value }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all duration-200 ${
                      answers[q.key] === opt.value
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-white/[0.06] text-zinc-500 hover:border-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          {suggestedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-3 border-t border-white/[0.06]"
            >
              <p className="text-xs text-zinc-500">
                Based on your answers, we recommend:{" "}
                <span className="text-white font-semibold">
                  {suggestedPlan === "payperuse"
                    ? "Pay Per Use"
                    : PLANS.find((p) => p.id === suggestedPlan)?.name || "Growth"}
                </span>
              </p>
              <button
                onClick={() => onSelect(suggestedPlan)}
                className="mt-3 rounded-lg bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-zinc-200 transition"
              >
                Use recommended plan
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Plan Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <motion.button
              key={plan.id}
              variants={cardVariants}
              onClick={() => {
                setSelectedPlan(plan.id);
                onSelect(plan.id);
              }}
              className={`relative text-left rounded-2xl border p-5 transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? "bg-white/[0.08] border-white/20 ring-1 ring-white/10"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                  Popular
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                  isSelected ? "bg-white/15" : "bg-white/[0.04]"
                }`}>
                  <plan.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">{plan.name}</span>
              </div>

              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">{plan.description}</p>

              <div className="flex items-baseline gap-0.5 mb-4">
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-zinc-600">{plan.period}</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-zinc-400">
                    <Check className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Pay Per Use */}
      <motion.div variants={itemVariants} className="mt-4">
        <button
          onClick={() => {
            setSelectedPlan("payperuse");
            onSelect("payperuse");
          }}
          className={`w-full flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
            selectedPlan === "payperuse"
              ? "bg-white/[0.06] border-white/20"
              : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              selectedPlan === "payperuse" ? "bg-white/15" : "bg-white/[0.04]"
            }`}>
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Pay Per Use</p>
              <p className="text-[11px] text-zinc-500">No commitment. Pay only for the compute you use.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">From $0.10</p>
            <p className="text-[10px] text-zinc-600">per agent</p>
          </div>
        </button>
      </motion.div>

      {/* Back */}
      <motion.div variants={itemVariants} className="mt-6 text-center">
        <button onClick={onBack} className="text-xs text-zinc-600 hover:text-zinc-400 transition">
          Back
        </button>
      </motion.div>
    </motion.div>
  );
}
