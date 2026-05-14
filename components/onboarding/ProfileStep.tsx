"use client";

import { motion } from "framer-motion";
import { User, AtSign, Send, Twitter, FolderOpen } from "lucide-react";

type ProfileStepProps = {
  data: {
    name: string;
    email: string;
    telegram: string;
    twitter: string;
    projectName: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
};

const fields = [
  { key: "name", label: "Full Name", placeholder: "John Doe", icon: User, required: true },
  { key: "email", label: "Email", placeholder: "you@company.com", icon: AtSign, required: true },
  { key: "telegram", label: "Telegram", placeholder: "@username", icon: Send, required: true },
  { key: "twitter", label: "Twitter / X", placeholder: "@handle", icon: Twitter, required: false },
  { key: "projectName", label: "Project Name", placeholder: "My Startup", icon: FolderOpen, required: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function ProfileStep({ data, onChange, onNext }: ProfileStepProps) {
  const canProceed = data.name.trim() && data.email.trim() && data.telegram.trim();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] mb-4">
          <User className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Tell us about you
        </h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">
          We&apos;ll use this to personalize your growth reports and send daily briefings.
        </p>
      </motion.div>

      <motion.div variants={containerVariants} className="space-y-3">
        {fields.map((field) => (
          <motion.div key={field.key} variants={itemVariants} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <field.icon className="w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors duration-200" />
            </div>
            <input
              type={field.key === "email" ? "email" : "text"}
              placeholder={field.placeholder}
              value={(data as Record<string, string>)[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
            />
            {!field.required && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-700 font-medium uppercase tracking-widest">
                Optional
              </span>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full h-12 rounded-xl bg-white text-black text-sm font-semibold transition-all duration-200 hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        <p className="text-center text-[10px] text-zinc-700 mt-3">
          Your data is stored securely and never shared.
        </p>
      </motion.div>
    </motion.div>
  );
}
