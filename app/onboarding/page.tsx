"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { PlanStep } from "@/components/onboarding/PlanStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { FundWalletModal } from "@/components/onboarding/FundWalletModal";
import { payForSubscription } from "@/lib/arc-payment";
import { Loader2 } from "lucide-react";

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
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    telegram: "",
    twitter: "",
    projectName: "",
  });
  const [selectedPlan, setSelectedPlan] = useState("payperuse");
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const processPaymentAndProceed = useCallback(async (plan: string, required: number) => {
    if (!wallets?.[0]) return;
    setIsProcessing(true);
    try {
      const provider = await wallets[0].getEthereumProvider();
      const result = await payForSubscription(provider, wallets[0].address, required.toString());
      if (result.success) {
        setStep(2);
      } else if (result.error === "insufficient_balance") {
        setRequiredAmount(required);
        setFundModalOpen(true);
      } else {
        alert("Payment failed: " + result.error);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred during payment.");
    } finally {
      setIsProcessing(false);
    }
  }, [wallets]);

  const handlePlanSelect = useCallback((plan: string) => {
    setSelectedPlan(plan);
    
    const prices: Record<string, number> = {
      weekly: 9,
      monthly: 29,
      yearly: 249,
      payperuse: 0
    };
    
    const required = prices[plan] || 0;
    
    if (required > 0 && wallets?.[0]?.address) {
      processPaymentAndProceed(plan, required);
    } else {
      setStep(2);
    }
  }, [wallets, processPaymentAndProceed]);

  const handleFundSuccess = useCallback(() => {
    setFundModalOpen(false);
    const prices: Record<string, number> = { weekly: 9, monthly: 29, yearly: 249, payperuse: 0 };
    processPaymentAndProceed(selectedPlan, prices[selectedPlan] || 0);
  }, [selectedPlan, processPaymentAndProceed]);

  const handleFinish = useCallback(async () => {
    // Save to local storage for quick checks
    localStorage.setItem("cmo_onboarding_complete", "true");
    localStorage.setItem(
      "cmo_onboarding_data",
      JSON.stringify({ profile, plan: selectedPlan })
    );

    // Save to Supabase via API if logged in
    if (user?.id) {
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            walletAddress: wallets?.[0]?.address || null,
            profile,
            plan: selectedPlan,
          }),
        });
        if (res.ok) {
          localStorage.setItem("cmo_onboarding_synced", "true");
        }
      } catch (error) {
        console.error("Failed to save onboarding to database", error);
      }
    }

    router.push("/app");
  }, [profile, selectedPlan, router, user, wallets]);

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">

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

      <FundWalletModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        onSuccess={handleFundSuccess}
        address={wallets?.[0]?.address || ""}
        requiredAmount={requiredAmount}
      />

      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
          <p className="text-white font-medium">Processing payment...</p>
        </div>
      )}
    </div>
  );
}
