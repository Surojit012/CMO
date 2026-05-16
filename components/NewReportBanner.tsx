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
    <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-zinc-950 p-3 shadow-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-4 duration-500 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg sm:h-10 sm:w-10 sm:text-xl">
          {reportData.hasNewReport ? "📊" : "📄"}
        </span>
        <div className="flex flex-col">
          <p className="text-[13px] font-semibold text-white sm:text-sm">
            {reportData.hasNewReport ? "Your weekly protocol report is ready" : "Today's Protocol Report"}
          </p>
          <p className="text-[11px] text-zinc-400 sm:text-xs">
            Generated on {new Date(reportData.timestamp).toLocaleDateString()} at {new Date(reportData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleViewReport}
        disabled={loading}
        className="w-full rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-100 disabled:opacity-50 sm:w-auto sm:px-5"
      >
        {loading ? "Loading..." : (reportData.hasNewReport ? "View AI Report" : "Open Report")}
      </button>
    </div>
  );
}
