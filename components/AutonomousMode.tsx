"use client";

import { useState, useEffect } from "react";
import { usePrivy, useToken } from "@privy-io/react-auth";

type AutonomousModeProps = {
  initialUrl?: string;
};

export function AutonomousMode({ initialUrl }: AutonomousModeProps) {
  const { user, authenticated } = usePrivy();
  const { getAccessToken } = useToken();
  const [enabled, setEnabled] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [telegramConnectToken, setTelegramConnectToken] = useState("");

  useEffect(() => {
    async function checkStatus() {
      if (!authenticated || !user?.id) return;
      
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/autonomous`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const data = await res.json();
        if (typeof data.enabled === "boolean") {
          setEnabled(data.enabled);
        }
        if (typeof data.hasTelegram === "boolean") {
          setHasTelegram(data.hasTelegram);
        }
        if (typeof data.telegramConnectToken === "string") {
          setTelegramConnectToken(data.telegramConnectToken);
        }
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
      const token = await getAccessToken();
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
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
    </>
  );
}
