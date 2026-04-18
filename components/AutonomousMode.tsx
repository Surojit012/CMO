"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

type AutonomousModeProps = {
  initialUrl?: string;
};

export function AutonomousMode({ initialUrl }: AutonomousModeProps) {
  const { user, authenticated } = usePrivy();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      if (!authenticated || !user?.id) return;
      
      try {
        const res = await fetch(`/api/autonomous?userId=${user.id}`);
        const data = await res.json();
        // Here we just check if reports exist for simplicity or check users.json
        // Let's assume we want to store setting state. For brevity, we check local state.
      } catch (err) {
        console.error("Failed to check autonomous status:", err);
      }
    }
    checkStatus();
  }, [authenticated, user?.id]);

  async function handleToggle() {
    if (!authenticated || !user?.id || !initialUrl) return;

    const nextEnabled = !enabled;
    setLoading(true);

    try {
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          websiteUrl: initialUrl,
          enabled: nextEnabled
        })
      });

      if (res.ok) {
        setEnabled(nextEnabled);
      }
    } catch (err) {
      console.error("Failed to toggle autonomous mode:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) return null;

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-black/5 transition-all hover:ring-black/10 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-3 w-3 items-center justify-center`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${enabled ? 'bg-emerald-400' : 'bg-zinc-300'}`}></span>
            <span className={`relative inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-zinc-950 sm:text-sm">Autonomous Mode</h4>
            <p className="text-[11px] text-zinc-500 sm:text-xs">CMO analyzes your site every day at 9am UTC automatically.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {enabled ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Running Daily
            </span>
          ) : (
            <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Paused
            </span>
          )}
          
          <button
            onClick={handleToggle}
            disabled={loading || !initialUrl}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${enabled ? "bg-zinc-950" : "bg-zinc-200"} ${loading ? "opacity-50" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {enabled && (
        <div className="mt-2 flex flex-col justify-between items-start gap-4 rounded-xl bg-blue-50/50 p-4 ring-1 ring-blue-500/10 sm:flex-row sm:items-center">
          <div>
            <h5 className="text-xs font-semibold text-blue-900 mb-0.5">Want real-time alerts?</h5>
            <p className="text-[11px] text-blue-700/80">Connect CMO to Telegram to get your daily report sent straight to your phone.</p>
          </div>
          <a
            href={`https://t.me/CMOGrowthBot?start=${user?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-blue-700 shadow-sm"
          >
            <svg className="mr-2 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Connect Telegram
          </a>
        </div>
      )}
    </>
  );
}
