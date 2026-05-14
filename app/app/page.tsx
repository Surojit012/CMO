"use client";

import { usePrivy, useToken, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/ChatContainer";
import { NewReportBanner } from "@/components/NewReportBanner";
import { DailyReportModal } from "@/components/DailyReportModal";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { ManagePlanModal } from "@/components/ManagePlanModal";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { WalletPanel } from "@/components/WalletPanel";
import { getWalletBalanceWithMeta, getRemainingFreeAnalyses } from "@/lib/arc-payment";
import type { HistorySession, SavedReport } from "@/components/HistorySidebar";

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
  const { wallets } = useWallets();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated && user?.id) {
      const isComplete = localStorage.getItem("cmo_onboarding_complete");
      const isSynced = localStorage.getItem("cmo_onboarding_synced");

      if (!isComplete) {
        router.push("/onboarding");
      } else if (!isSynced) {
        // Silent background sync for users who onboarded before we added the database
        try {
          const rawData = localStorage.getItem("cmo_onboarding_data");
          if (rawData) {
            const parsed = JSON.parse(rawData);
            fetch("/api/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                walletAddress: wallets?.[0]?.address || null,
                profile: parsed.profile,
                plan: parsed.plan,
              }),
            }).then(res => {
              if (res.ok) localStorage.setItem("cmo_onboarding_synced", "true");
            }).catch(() => {});
          } else {
             // If they don't have data at all, force them back through to collect it
             router.push("/onboarding");
          }
        } catch (e) {}
      }
    }
  }, [ready, authenticated, user, wallets, router]);
  const [hasNewReportBadge, setHasNewReportBadge] = useState(false);
  const [externalReport, setExternalReport] = useState<string | null>(null);
  const [dailyReportModal, setDailyReportModal] = useState<{ markdown: string; timestamp: string } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "audit" | "outreach">("analysis");

  // Wallet state lifted for Navbar
  const [balance, setBalance] = useState("0.00");
  const [balanceSymbol, setBalanceSymbol] = useState("USDC");
  const [freeAnalyses, setFreeAnalyses] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Autonomous mode state
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);
  const [autonomousLoading, setAutonomousLoading] = useState(false);
  const [autonomousUrl, setAutonomousUrl] = useState("");

  const wallet = wallets?.[0];
  const walletAddress = wallet?.address;

  const refreshBalance = useCallback(async (manual = false) => {
    if (!walletAddress) return;
    if (manual) setIsRefreshing(true);
    try {
      const result = await getWalletBalanceWithMeta(walletAddress);
      setBalance(result.formattedBalance);
      setBalanceSymbol(result.symbol || "USDC");
      const freeResult = await getRemainingFreeAnalyses(walletAddress);
      setFreeAnalyses(freeResult);
    } catch { /* silent */ }
    finally { if (manual) setIsRefreshing(false); }
  }, [walletAddress]);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    refreshBalance();
    const interval = setInterval(() => refreshBalance(), 15000);

    const handler = () => refreshBalance(true);
    window.addEventListener("refresh-wallet-stats", handler);
    return () => { clearInterval(interval); window.removeEventListener("refresh-wallet-stats", handler); };
  }, [authenticated, walletAddress, refreshBalance]);

  // Fetch autonomous state on mount
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
        if (data.enabled !== undefined) setAutonomousEnabled(data.enabled);
        if (data.url) setAutonomousUrl(data.url);
      } catch {}
    })();
  }, [authenticated, user?.id]);

  // Toggle autonomous mode
  const handleAutonomousToggle = useCallback(async () => {
    if (!user?.id || !autonomousUrl) return;
    setAutonomousLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          enabled: !autonomousEnabled,
          url: autonomousUrl,
        }),
      });
      if (res.ok) {
        setAutonomousEnabled(!autonomousEnabled);
      }
    } catch { /* silent */ }
    finally { setAutonomousLoading(false); }
  }, [user?.id, autonomousEnabled, autonomousUrl]);

  // Handle history session click — load the saved report
  const handleSessionSelect = useCallback((session: HistorySession, specificAnalysis?: SavedReport) => {
    const report = specificAnalysis || session.analyses[0];
    if (!report) return;

    // Set the correct tab based on report type
    if (report.type === "audit") {
      setActiveTab("audit");
    } else if (report.type === "outreach") {
      setActiveTab("outreach");
    } else {
      setActiveTab("analysis");
    }

    // Load the report data into the workspace
    if (report.data) {
      const reportContent = typeof report.data === "string" ? report.data : JSON.stringify(report.data);
      setExternalReport(reportContent);
    }

    // Track the autonomous URL from the last analyzed site
    if (session.urlAnalyzed) {
      setAutonomousUrl(session.urlAnalyzed);
    }

    // Close sidebar on mobile
    setSidebarOpen(false);
  }, []);

  if (!appId || appId === "your_privy_app_id") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 bg-zinc-950">
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 bg-zinc-950">
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
    <main className="min-h-screen bg-zinc-950">
      <Navbar
        userLabel={getUserLabel(user)}
        balance={balance}
        balanceSymbol={balanceSymbol}
        walletAddress={walletAddress}
        freeAnalyses={freeAnalyses}
        onLogout={logout}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={true}
        onRefreshBalance={() => refreshBalance(true)}
        isRefreshing={isRefreshing}
        onFundWallet={() => window.dispatchEvent(new Event("open-fund-modal"))}
      />

      {/* Hidden WalletPanel — kept for fund modal functionality */}
      <div className="hidden"><WalletPanel /></div>

      {/* Layout: Sidebar + Workspace — both scroll independently */}
      <div className="flex pt-[52px] min-h-screen">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSessionSelect={handleSessionSelect}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          autonomousEnabled={autonomousEnabled}
          autonomousLoading={autonomousLoading}
          onAutonomousToggle={handleAutonomousToggle}
          autonomousUrl={autonomousUrl}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenPlans={() => setPlanModalOpen(true)}
        />

        {/* Main content — scrolls independently */}
        <div className="flex-1 min-w-0 overflow-y-auto">
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

      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <ManagePlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
      />
    </main>
  );
}
