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
    <div className="flex items-center gap-2">
      <div className={`relative flex h-2 w-2 items-center justify-center`}>
        {enabled && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75`}></span>}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}></span>
      </div>
      <span className={`text-[11px] sm:text-xs font-medium ${enabled ? 'text-zinc-700' : 'text-zinc-400'}`}>
        {enabled ? 'Auto' : 'Auto'}
      </span>
      <button
        onClick={handleToggle}
        disabled={loading || !initialUrl}
        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-zinc-950" : "bg-zinc-200"} ${loading ? "opacity-50" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-3" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
