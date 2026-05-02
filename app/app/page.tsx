"use client";

import { usePrivy, useToken } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatContainer } from "@/components/ChatContainer";
import { NewReportBanner } from "@/components/NewReportBanner";
import { DailyReportModal } from "@/components/DailyReportModal";

import { WalletPanel } from "@/components/WalletPanel";

function getUserLabel(user: ReturnType<typeof usePrivy>["user"]) {
  if (!user) {
    return "Unknown user";
  }

  if (user.email?.address) {
    return user.email.address;
  }

  if (user.wallet?.address) {
    return user.wallet.address;
  }

  return user.id;
}

export default function Home() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { getAccessToken } = useToken();
  const [hasNewReportBadge, setHasNewReportBadge] = useState(false);
  const [externalReport, setExternalReport] = useState<string | null>(null);
  const [dailyReportModal, setDailyReportModal] = useState<{ markdown: string, timestamp: string } | null>(null);

  useEffect(() => {
    if (!authenticated || !user?.id) return;

    async function checkReport() {
      if (!user?.id) return;
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/autonomous`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const data = await res.json();
        // Just used for the little pinging red dot on the profile icon
        setHasNewReportBadge(data.hasNewReport);
      } catch (err) {
        console.error("Failed to check report status:", err);
      }
    }

    checkReport();
  }, [authenticated, user?.id]);

  if (!appId || appId === "your_privy_app_id") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.10)] ring-1 ring-black/5">
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-950 leading-none">CMO</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 ring-1 ring-zinc-200">
              Beta
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
            Privy app ID required
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> in <code>.env.local</code> to enable login.
          </p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-zinc-500">Loading authentication...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.10)] ring-1 ring-black/5">
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-950 leading-none">CMO</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 ring-1 ring-zinc-200">
              Beta
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">Login to CMO</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sign in to run AI growth analysis, execute assets, and track your usage history.
          </p>
          <button
            type="button"
            onClick={login}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Login to CMO
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative bg-[#fafafa]">
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-zinc-100 bg-white/90 px-4 py-2.5 backdrop-blur-xl sm:px-6 sm:py-3">
        <Link 
          href="/" 
          className="text-[13px] font-bold uppercase tracking-[0.22em] text-zinc-950 transition hover:opacity-70 sm:text-[14px]"
        >
          C M O
        </Link>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <WalletPanel />
          <div className="relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 transition sm:gap-2.5 sm:px-3.5">
            {hasNewReportBadge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-zinc-950"></span>
              </span>
            )}
            <span className="max-w-[80px] truncate text-[12px] sm:max-w-[160px]">{getUserLabel(user)}</span>
            <button
              type="button"
              onClick={logout}
              className="text-[11px] font-medium text-zinc-400 transition hover:text-zinc-900 sm:text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="mx-auto w-full max-w-[700px] px-3 mt-2 sm:px-5 sm:mt-3">
        <NewReportBanner 
          onViewReport={(markdown, timestamp) => {
            setDailyReportModal({ markdown, timestamp });
            setHasNewReportBadge(false);
          }} 
        />
      </div>

      <ChatContainer 
        userId={user?.id || ""} 
        externalReport={externalReport}
        onReportLoaded={() => setExternalReport(null)}
      />

      {dailyReportModal && (
        <DailyReportModal 
          markdown={dailyReportModal.markdown} 
          timestamp={dailyReportModal.timestamp}
          onClose={() => setDailyReportModal(null)} 
        />
      )}
    </main>
  );
}
