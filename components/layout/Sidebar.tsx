"use client";

import { useEffect, useState } from "react";
import { usePrivy, useToken } from "@privy-io/react-auth";
import { X, Loader2, Settings, ChevronUp, Bell, Download, Key, HelpCircle } from "lucide-react";
import type { HistorySession, SavedReport } from "@/components/HistorySidebar";

function relativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

type ActiveTab = "analysis" | "audit" | "outreach";

type SidebarProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSessionSelect: (session: HistorySession, specificAnalysis?: SavedReport) => void;
  activeSessionId?: string;
  isOpen: boolean;
  onClose: () => void;
  autonomousEnabled: boolean;
  autonomousLoading: boolean;
  onAutonomousToggle: () => void;
  autonomousUrl: string;
};

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const MODE_ITEMS: { key: ActiveTab; label: string; icon: string }[] = [
  { key: "analysis", label: "Growth Analysis", icon: "📊" },
  { key: "audit",    label: "Market Audit",    icon: "🔍" },
  { key: "outreach", label: "Outreach Engine", icon: "📡" },
];

function getTypeLabel(type: string) {
  switch (type) {
    case "analysis": return "Growth";
    case "audit":    return "Audit";
    case "outreach": return "Outreach";
    default:         return "Report";
  }
}

export function Sidebar({
  activeTab,
  onTabChange,
  onSessionSelect,
  activeSessionId,
  isOpen,
  onClose,
  autonomousEnabled,
  autonomousLoading,
  onAutonomousToggle,
  autonomousUrl,
}: SidebarProps) {
  const { user } = usePrivy();
  const { getAccessToken } = useToken();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/history", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const rawReports: SavedReport[] = data.savedReports || [];

        const groups: Record<string, SavedReport[]> = {};
        for (const r of rawReports) {
          const key = extractDomain(r.url) + "::" + (r.session_id || "legacy-" + r.url);
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        }

        const compiled: HistorySession[] = Object.entries(groups).map(([groupKey, analyses]) => {
          analyses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return {
            sessionId: groupKey,
            title: extractDomain(analyses[0].url),
            createdAt: analyses[analyses.length - 1].created_at,
            urlAnalyzed: analyses[0].url,
            analyses,
          };
        });

        compiled.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSessions(compiled);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        Sidebar panel — 280px wide, full height under navbar.
        Uses flex-col + overflow-hidden so ONLY the middle zone scrolls.
      */}
      <aside
        className={`
          fixed top-[52px] left-0 bottom-0 z-50
          w-[280px] flex flex-col overflow-hidden
          bg-[#09090b] border-r border-white/5
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:sticky lg:top-[52px] lg:z-auto lg:h-[calc(100vh-52px)] lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* ── TOP SECTION — sticky, never scrolls ─────── */}
        <div className="flex-shrink-0 p-4 space-y-1">
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>

          {MODE_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { onTabChange(item.key); onClose(); }}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === item.key
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex-shrink-0 h-px bg-white/5" />

        {/* ── MIDDLE SECTION — scrollable history list ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-4 pb-2">
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-600 mb-3">
            Recent
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-zinc-700 text-center py-4">No sessions yet</p>
          ) : (
            <div className="space-y-1">
              {sessions.slice(0, 20).map((session) => {
                const isActive = activeSessionId === session.sessionId;
                const types = [...new Set(session.analyses.map((a) => a.type))];
                return (
                  <button
                    key={session.sessionId}
                    onClick={() => { onSessionSelect(session, session.analyses[0]); onClose(); }}
                    className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? "bg-white/5 border border-white/10"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-300 truncate">{session.title}</span>
                      <span className="text-[10px] text-zinc-700 ml-2 shrink-0">{relativeTime(session.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {types.map((t) => (
                        <span key={t} className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                          {getTypeLabel(t)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── BOTTOM SECTION — sticky, never scrolls ─── */}
        <div className="flex-shrink-0 border-t border-white/5">
          {/* Autonomous Mode */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${autonomousEnabled ? "bg-emerald-400" : "bg-zinc-700"}`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${autonomousEnabled ? "bg-emerald-500" : "bg-zinc-600"}`} />
              </span>
              <div>
                <p className="text-xs font-medium text-zinc-300">Autonomous</p>
                <p className="text-[10px] text-zinc-600">{autonomousEnabled ? "Running daily" : "Paused"}</p>
              </div>
            </div>
            <button
              onClick={onAutonomousToggle}
              disabled={autonomousLoading || !autonomousUrl}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ${
                autonomousEnabled ? "bg-emerald-500" : "bg-zinc-800"
              } ${autonomousLoading ? "opacity-50" : ""}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${autonomousEnabled ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Settings */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-3.5 h-3.5 shrink-0" />
                Settings
              </div>
              <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${settingsOpen ? "" : "rotate-180"}`} />
            </button>

            {/* Settings Panel */}
            <div className={`overflow-hidden transition-all duration-200 ${settingsOpen ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
              <div className="space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                {/* Email notifications */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/5 transition">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="text-[11px] font-medium text-zinc-400">Email reports</span>
                  </div>
                  <button className="relative inline-flex h-4 w-7 shrink-0 rounded-full border border-white/10 bg-zinc-800 transition-colors">
                    <span className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition translate-x-0" />
                  </button>
                </div>

                {/* Export data */}
                <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-300 transition">
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  Export all reports
                </button>

                {/* API key */}
                <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-300 transition">
                  <Key className="w-3.5 h-3.5 text-zinc-600" />
                  API access
                </button>

                {/* Support */}
                <a
                  href="https://t.me/+your_group"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-300 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                  Support / Feedback
                </a>

                {/* Version */}
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[9px] font-medium tracking-wider uppercase text-zinc-700">CMO v0.1.0 · Arc Testnet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
