"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { PlanStep } from "@/components/onboarding/PlanStep";
import { FundWalletModal } from "@/components/onboarding/FundWalletModal";
import { payForSubscription } from "@/lib/arc-payment";

type ManagePlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ManagePlanModal({ isOpen, onClose }: ManagePlanModalProps) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen && !fundModalOpen) return null;

  const processPaymentAndSave = async (plan: string, required: number) => {
    if (!wallets?.[0]) return;
    setIsProcessing(true);
    try {
      const provider = await wallets[0].getEthereumProvider();
      const result = await payForSubscription(provider, wallets[0].address, required.toString());
      if (result.success) {
        await savePlan(plan);
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
  };

  const handlePlanSelect = async (plan: string) => {
    setSelectedPlan(plan);
    const prices: Record<string, number> = { weekly: 9, monthly: 29, yearly: 249, payperuse: 0 };
    const required = prices[plan] || 0;
    
    if (required > 0 && wallets?.[0]?.address) {
      await processPaymentAndSave(plan, required);
    } else {
      await savePlan(plan);
    }
  };

  const handleFundSuccess = async () => {
    setFundModalOpen(false);
    if (selectedPlan) {
      const prices: Record<string, number> = { weekly: 9, monthly: 29, yearly: 249, payperuse: 0 };
      await processPaymentAndSave(selectedPlan, prices[selectedPlan] || 0);
    }
  };

  const savePlan = async (plan: string) => {
    const rawData = localStorage.getItem("cmo_onboarding_data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const updatedData = { ...parsed, plan };

    localStorage.setItem("cmo_onboarding_data", JSON.stringify(updatedData));
    
    if (user?.id) {
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            walletAddress: wallets?.[0]?.address || null,
            profile: updatedData.profile || {},
            plan,
          }),
        });
      } catch (e) {
        console.error("Failed to update plan", e);
      }
    }
    
    // Trigger a refresh event for WalletPanel if necessary
    window.dispatchEvent(new CustomEvent("refresh-wallet-stats"));
    onClose();
  };

  return (
    <>
      {isOpen && !fundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-zinc-950 p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 hide-scrollbar">
            <button onClick={onClose} className="absolute right-6 top-6 z-10 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <PlanStep onSelect={handlePlanSelect} onBack={onClose} />
          </div>
        </div>
      )}

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
    </>
  );
}
