"use client";

import { usePrivy, useToken } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { ChatContainer } from "@/components/ChatContainer";
import { NewReportBanner } from "@/components/NewReportBanner";
import { DailyReportModal } from "@/components/DailyReportModal";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { WalletPanel } from "@/components/WalletPanel";

function getUserLabel(user: ReturnType<typeof usePrivy>["user"]) {
  if (!user) return "Unknown user";
  if (user.email?.address) return user.email.address;
  if (user.wallet?.address) return user.wallet.address;
  return user.id;
}

export default function Home() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { getAccessToken } = useToken();
  const [hasNewReportBadge, setHasNewReportBadge] = useState(false);
  const [externalReport, setExternalReport] = useState<string | null>(null);
  const [dailyReportModal, setDailyReportModal] = useState<{ markdown: string; timestamp: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "audit" | "outreach">("analysis");

  useEffect(() => {
    if (!authenticated || !user?.id) return;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/autonomous", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        setHasNewReportBadge(data.hasNewReport);
      } catch {}
    })();
  }, [authenticated, user?.id]);

  if (!appId || appId === "your_privy_app_id") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 bg-[#09090b]">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-8 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-white mb-4">CMO</p>
          <h1 className="text-2xl font-semibold text-white">Privy app ID required</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Set <code className="text-zinc-400">NEXT_PUBLIC_PRIVY_APP_ID</code> in <code className="text-zinc-400">.env.local</code>
          </p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 bg-[#09090b]">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-8 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-white mb-2">CMO</p>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Beta</span>
          <h1 className="mt-6 text-3xl font-semibold text-white">Login to CMO</h1>
          <p className="mt-3 text-sm text-zinc-500">Sign in to run AI growth analysis.</p>
          <button onClick={login} className="mt-7 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition">
            Login to CMO
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] relative">
      <Navbar
        userLabel={getUserLabel(user)}
        balance="0.00"
        balanceSymbol="USDC"
        onLogout={logout}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={true}
      />
      <div className="hidden"><WalletPanel /></div>

      <div className="flex pt-[52px]">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSessionSelect={() => {}}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          autonomousEnabled={false}
          autonomousLoading={false}
          onAutonomousToggle={() => {}}
          autonomousUrl=""
        />

        <div className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-[820px] px-4 pt-4 sm:px-6">
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
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isHistoryOpen={sidebarOpen}
            onHistoryClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

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
