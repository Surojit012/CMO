"use client";

import { useState, useEffect } from "react";
import { usePrivy, useToken } from "@privy-io/react-auth";

type NewReportBannerProps = {
  onViewReport?: (markdown: string, timestamp: string) => void;
};

export function NewReportBanner({ onViewReport }: NewReportBannerProps) {
  const { user, authenticated } = usePrivy();
  const { getAccessToken } = useToken();
  const [reportData, setReportData] = useState<{ hasNewReport: boolean; timestamp: string; output: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !user?.id) return;

    async function checkReport() {
      const u = user;
      if (!u?.id) return;
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/autonomous`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const data = await res.json();
        if (data.output) {
          setReportData(data);
        }
      } catch (err) {
        console.error("Check report error:", err);
      }
    }

    checkReport();
  }, [authenticated, user]);

  async function handleViewReport() {
    const u = user;
    if (!u?.id || !reportData) return;

    setLoading(true);

    try {
      if (reportData.hasNewReport) {
        // Mark as seen
        const token = await getAccessToken();
        await fetch("/api/autonomous", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        setReportData(prev => prev ? { ...prev, hasNewReport: false } : null);
      }

      // Pass the markdown and timestamp up to the page
      onViewReport?.(reportData.output, reportData.timestamp);
    } catch (err) {
      console.error("Failed to mark report seen:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!reportData?.output) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-full bg-zinc-950/95 px-4 py-2 shadow-md ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-300 sm:mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs">
          {reportData.hasNewReport ? "📊" : "📄"}
        </span>
        <p className="text-[12px] font-medium text-zinc-300 truncate sm:text-[13px]">
          {reportData.hasNewReport ? "Your daily growth report is ready" : "Today's Daily Report"}
          <span className="hidden sm:inline text-zinc-500 ml-1.5">
            · {new Date(reportData.timestamp).toLocaleDateString()}
          </span>
        </p>
      </div>
      
      <button
        onClick={handleViewReport}
        disabled={loading}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50 sm:px-4 sm:py-1.5 sm:text-xs"
      >
        {loading ? "..." : "View AI Report"}
      </button>
    </div>
  );
}
