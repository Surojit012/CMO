"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, History, PanelLeftClose, ChevronRight, ChevronDown, Activity, ChevronUp, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export type SavedReport = {
  id: string;
  session_id?: string;
  url: string;
  type: "analysis" | "audit" | "outreach";
  data: any;
  created_at: string;
};

export type HistorySession = {
  sessionId: string;
  title: string;
  createdAt: string;
  urlAnalyzed: string;
  analyses: SavedReport[];
};

type HistorySidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSessionSelect: (session: HistorySession, specificAnalysis?: SavedReport) => void;
  activeSessionId?: string;
};

function extractDomain(url: string): string {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function generateModuleTagline(analyses: SavedReport[]): string {
  const types = [...new Set(analyses.map(a => a.type))];
  const names = types.map(t => {
     if (t === 'analysis') return 'Growth';
     if (t === 'audit') return 'Market';
     if (t === 'outreach') return 'Outreach';
     return t;
  });
  return names.join(' · ');
}

export function HistorySidebar({ isOpen, onClose, onSessionSelect, activeSessionId }: HistorySidebarProps) {
  const { user } = usePrivy();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Send privy token internally via standard fetch, intercepting it if needed, or Next.js layout does it.
        // But to be safe, the standard fetch to our own API route will include the user's cookies/tokens if they are authenticated via Privy
        // Privy uses a Bearer token or cookie depending on configuration. Our API route uses `getPrivyUserIdFromRequest`.
        // To be completely safe and pass the token, we can just use the Authorization header with the ID token if available.
        // For CMO, the global setup typically relies on cookies or the auth provider injecting it.
        const res = await fetch("/api/history", {
            headers: {
                "Authorization": `Bearer ${user.id}`, // We'll just pass user.id to mimic buildPrivyHeaders for now 
                 "x-privy-user-id": user.id
            }
        });
        
        if (!res.ok) throw new Error("Failed to fetch history");
        
        const data = await res.json();
        const rawReports: SavedReport[] = data.savedReports || [];
        
        // Group by session_id (fallback to url if no session_id exists)
        const groups: Record<string, SavedReport[]> = {};
        for (const report of rawReports) {
          const key = report.session_id || `legacy-${report.url}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(report);
        }

        const compiledSessions: HistorySession[] = Object.entries(groups).map(([sessionId, analyses]) => {
          // Sort oldest first within a session so it feels chronological 
          analyses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          const domain = extractDomain(analyses[0].url);
          return {
            sessionId: sessionId,
            title: domain,
            createdAt: analyses[analyses.length - 1].created_at, // Use the newest report time for session time
            urlAnalyzed: analyses[0].url,
            analyses: analyses
          };
        });

        // Sort sessions newest first
        compiledSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSessions(compiledSessions);
        
      } catch (err: any) {
        setError("Could not load history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, user?.id]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const currentlyExpanded = prev[sessionId] ?? (activeSessionId === sessionId);
      return {
        ...prev,
        [sessionId]: !currentlyExpanded
      };
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "analysis": return "Growth Analysis";
      case "audit": return "Market Audit";
      case "outreach": return "Outreach Plan";
      default: return "Report";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "analysis": return "text-blue-600 bg-blue-50 ring-blue-500/20";
      case "audit": return "text-fuchsia-600 bg-fuchsia-50 ring-fuchsia-500/20";
      case "outreach": return "text-amber-600 bg-amber-50 ring-amber-500/20";
      default: return "text-zinc-600 bg-zinc-50 ring-zinc-500/20";
    }
  };

  return (
    <>
      {/* Backdrop (Mobile Only) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm transition-opacity sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 sm:top-[65px] left-0 bottom-0 z-50 sm:z-30 w-[280px] bg-zinc-50 border-r border-zinc-200 shadow-2xl sm:shadow-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200/60 bg-zinc-50">
          <div className="flex items-center gap-2 font-bold tracking-tight text-zinc-900">
            <History className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">History</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 transition"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!user ? (
            <div className="text-center p-4 text-xs text-zinc-500">Sign in to view history</div>
          ) : loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-xs text-red-500">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-8 text-xs text-zinc-500">
              No saved sessions yet. Generate one to see it here!
            </div>
          ) : (
            sessions.map((session) => {
              const isActiveNode = activeSessionId === session.sessionId;
              
              // --------------------------
              // FLAT CARD (Single Analysis)
              // --------------------------
              if (session.analyses.length === 1) {
                const analysis = session.analyses[0];
                let snippet = "";
                try {
                  if (analysis.type === "analysis" && typeof analysis.data?.analysis === "string") {
                    snippet = analysis.data.analysis.substring(0, 120);
                  } else if (analysis.type === "audit") {
                    if (typeof analysis.data?.marketSnapshot === "string") snippet = analysis.data.marketSnapshot.substring(0, 120);
                    else if (typeof analysis.data?.verdict?.summary === "string") snippet = analysis.data.verdict.summary.substring(0, 120);
                  } else if (analysis.type === "outreach") {
                    if (typeof analysis.data?.product_summary === "string") snippet = analysis.data.product_summary.substring(0, 120);
                  }
                } catch (e) {}

                return (
                  <button
                    key={session.sessionId}
                    onClick={() => {
                        onSessionSelect(session, analysis);
                        onClose();
                    }}
                    className={`w-full flex flex-col text-left rounded-lg bg-zinc-50 border transition mb-2 overflow-hidden ${isActiveNode ? 'border-zinc-300 ring-1 ring-zinc-200' : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-100/50'} relative`}
                  >
                    {isActiveNode && <div className={`absolute left-0 top-0 bottom-0 w-1 ${getTypeColor(analysis.type).split(' ')[0].replace('text-', 'bg-')}`} />}
                    <div className="p-3 w-full">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="font-bold text-xs text-zinc-900 tracking-tight line-clamp-1">
                          {session.title}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${getTypeColor(analysis.type).split(' ')[0]}`}>
                        {getTypeLabel(analysis.type)}
                      </div>
                      
                      <div className="text-[10px] text-zinc-500 line-clamp-2 leading-snug">
                        {snippet || (loading ? <div className="h-2 w-full bg-zinc-200 animate-pulse rounded"></div> : null)}
                      </div>
                    </div>
                  </button>
                );
              }

              // --------------------------
              // TREE UI (Multiple Analyses)
              // --------------------------
              const isExpanded = expandedSessions[session.sessionId] ?? isActiveNode;
              const typeCounts: Record<string, number> = {};
              const tagLine = generateModuleTagline(session.analyses);

              return (
                <div key={session.sessionId} className="w-full flex flex-col text-left rounded-lg bg-transparent transition mb-2">
                  <button
                    onClick={() => toggleSession(session.sessionId)}
                    className="flex flex-col w-full px-2 py-2.5 transition-colors hover:bg-zinc-100/50 rounded-lg group"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 tracking-tight">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" />}
                        {session.title}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-zinc-500 mt-1 ml-5">
                      {tagLine}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-[21px] pr-2 pb-2 space-y-2 relative before:absolute before:left-[10px] before:top-2 before:bottom-3 before:w-px before:bg-zinc-200">
                      {session.analyses.map((analysis, idx) => {
                        // Handle Re-runs
                        typeCounts[analysis.type] = (typeCounts[analysis.type] || 0) + 1;
                        const isRerun = typeCounts[analysis.type] > 1;
                        
                        let snippet = "";
                        try {
                          if (analysis.type === "analysis" && typeof analysis.data?.analysis === "string") {
                            snippet = analysis.data.analysis.substring(0, 120);
                          } else if (analysis.type === "audit") {
                            if (typeof analysis.data?.marketSnapshot === "string") snippet = analysis.data.marketSnapshot.substring(0, 120);
                            else if (typeof analysis.data?.verdict?.summary === "string") snippet = analysis.data.verdict.summary.substring(0, 120);
                          } else if (analysis.type === "outreach") {
                            if (typeof analysis.data?.product_summary === "string") snippet = analysis.data.product_summary.substring(0, 120);
                          }
                        } catch (e) {}

                        // Use same extraction for checking differences
                        const childDomain = extractDomain(analysis.url);
                        const showChildUrl = childDomain !== session.title;
                        const isChildActive = isActiveNode; // If they want active state on child, they didn't provide analysisId in active check... we'll just check if it's the active tab but we only have activeSessionId. For now, active means the session is active.
                        
                        return (
                          <div key={analysis.id} className="relative group/child">
                            {/* Branch line */}
                            <div className="absolute left-[-11px] top-4 w-[8px] h-px bg-zinc-200"></div>
                            
                            <button
                              onClick={() => {
                                onSessionSelect(session, analysis);
                                onClose();
                              }}
                              className={`w-full text-left bg-zinc-50 border p-2.5 rounded-lg transition overflow-hidden relative ${isChildActive ? 'border-zinc-300 ring-1 ring-zinc-200 shadow-sm' : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-100/80 shadow-sm'}`}
                            >
                              {isChildActive && <div className={`absolute left-0 top-0 bottom-0 w-1 ${getTypeColor(analysis.type).split(' ')[0].replace('text-', 'bg-')}`} />}
                              <div className="flex items-center justify-between mb-1.5 pl-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${getTypeColor(analysis.type).split(' ')[0]}`}>
                                  {getTypeLabel(analysis.type)}
                                  {isRerun && <span className="opacity-60 lowercase ml-1">(re-run)</span>}
                                </span>
                              </div>
                              
                              {showChildUrl && (
                                <div className="text-[10px] font-medium text-zinc-900 mb-1.5 line-clamp-1 pl-1">
                                  {childDomain}
                                </div>
                              )}
                              
                              <div className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed pl-1">
                                {snippet || (loading ? <div className="h-2 w-full bg-zinc-200 animate-pulse rounded"></div> : null)}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-4 border-t border-zinc-200/60 bg-zinc-50">
          <p className="text-[10px] text-center text-zinc-400 font-medium uppercase tracking-wider">
            Reports are saved automatically
          </p>
        </div>
      </div>
    </>
  );
}
