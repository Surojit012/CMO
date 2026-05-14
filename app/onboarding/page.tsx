"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleField } from "@/components/onboarding/ParticleField";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { PlanStep } from "@/components/onboarding/PlanStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";

type ProfileData = {
  name: string;
  email: string;
  telegram: string;
  twitter: string;
  projectName: string;
};

const pageVariants = {
  enter: { opacity: 0, x: 60, scale: 0.98 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -60, scale: 0.98 },
};

const pageTransition = {
  duration: 0.4,
  ease: "easeInOut" as const,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    telegram: "",
    twitter: "",
    projectName: "",
  });
  const [selectedPlan, setSelectedPlan] = useState("payperuse");

  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePlanSelect = useCallback((plan: string) => {
    setSelectedPlan(plan);
    setStep(2);
  }, []);

  const handleFinish = useCallback(() => {
    // Save onboarding data
    localStorage.setItem("cmo_onboarding_complete", "true");
    localStorage.setItem(
      "cmo_onboarding_data",
      JSON.stringify({ profile, plan: selectedPlan })
    );
    router.push("/app");
  }, [profile, selectedPlan, router]);

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Particle background */}
      <ParticleField />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/[0.04]">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step indicator */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              animate={{
                width: step === i ? 24 : 8,
                opacity: step >= i ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full bg-white"
            />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 z-50">
        <span className="text-sm font-bold text-white tracking-tight">CMO</span>
        <span className="ml-1.5 text-[9px] font-medium text-zinc-600 tracking-widest uppercase">
          Setup
        </span>
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-6 z-50">
        <span className="text-xs font-mono text-zinc-600">
          {step + 1}
          <span className="text-zinc-800">/</span>3
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-5 py-20">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="profile"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <ProfileStep
                data={profile}
                onChange={handleProfileChange}
                onNext={() => setStep(1)}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="plan"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <PlanStep
                onSelect={handlePlanSelect}
                onBack={() => setStep(0)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="welcome"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <WelcomeStep
                userName={profile.name}
                selectedPlan={selectedPlan}
                onFinish={handleFinish}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
