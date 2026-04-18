"use client";

import { usePrivy } from "@privy-io/react-auth";
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
  const [hasNewReportBadge, setHasNewReportBadge] = useState(false);
  const [externalReport, setExternalReport] = useState<string | null>(null);
  const [dailyReportModal, setDailyReportModal] = useState<{ markdown: string, timestamp: string } | null>(null);

  useEffect(() => {
    if (!authenticated || !user?.id) return;

    async function checkReport() {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/autonomous?userId=${user.id}`);
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
    <main className="min-h-screen relative">
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="ml-1 text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-950 transition hover:opacity-80 sm:ml-2 sm:text-[14px]"
          >
            C M O
          </Link>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 ring-1 ring-zinc-200">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <WalletPanel />
          <div className="relative flex h-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs text-zinc-700 shadow-sm ring-1 ring-zinc-200/80 backdrop-blur sm:gap-3 sm:px-4 sm:py-2 sm:text-sm">
            {hasNewReportBadge && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-zinc-950"></span>
              </span>
            )}
            <span className="max-w-[100px] truncate sm:max-w-[220px]">{getUserLabel(user)}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800 sm:px-3 sm:text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="mx-auto w-full max-w-[700px] px-3 mt-3 sm:px-5 sm:mt-4">
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
