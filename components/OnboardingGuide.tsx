"use client";

import { useEffect, useState } from "react";

type OnboardingGuideProps = {
  step: "input" | "waiting" | "done";
};

export function OnboardingGuide({ step }: OnboardingGuideProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed onboarding
    const hasSeen = localStorage.getItem("cmo_onboarding_seen");
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-50 w-[300px] sm:max-w-sm rounded-2xl bg-zinc-950 p-5 shadow-2xl ring-1 ring-white/10 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-2 tracking-wide">
            {step === "input" && "👋 Welcome to CMO"}
            {step === "waiting" && "⚙️ Agents at work"}
            {step === "done" && "🚀 Almost done!"}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {step === "input" && "Drop your landing page URL in the bar below to get your first autonomous growth audit. It only takes 15 seconds."}
            {step === "waiting" && "Our 6 specialized AI agents are currently crawling your site, analyzing competitors, and finding conversion leaks."}
            {step === "done" && "Scroll back down and enable Autonomous Mode to get these insights pushed to your Telegram every single morning."}
          </p>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem("cmo_onboarding_seen", "true");
          }}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step === 'input' ? 'bg-emerald-500' : 'bg-emerald-500/20'}`}></div>
        <div className={`h-1.5 flex-1 rounded-full ${step === 'waiting' ? 'bg-emerald-500' : step === 'done' ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}></div>
        <div className={`h-1.5 flex-1 rounded-full ${step === 'done' ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
      </div>
    </div>
  );
}
