"use client";

import { useEffect, useState } from "react";
import { usePrivy, useToken } from "@privy-io/react-auth";
import { Copy, ChevronDown, ChevronUp, Check, RefreshCw, SlidersHorizontal, ArrowRight } from "lucide-react";
import type { OutreachPlan, OutreachCommunity, OutreachPhase, PostTemplate } from "@/lib/outreach-types";
import type { AnalyzeSuccessResponse } from "@/lib/types";

// Helper components
function FitScoreBar({ score }: { score: number }) {
  const colorClass = score >= 80 ? "bg-fit-green" : score >= 60 ? "bg-fit-amber" : "bg-fit-red";
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setWidth(score);
    }, 100);
  }, [score]);

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-bold w-6">{score}</div>
      <div className="h-2 flex-1 rounded-full bg-zinc-200 overflow-hidden">
        <div 
          className={`h-full animate-fit-bar rounded-full ${score >= 80 ? 'bg-[#22c55e]' : score >= 60 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`} 
          style={{ width: `${width}%`, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} 
        />
      </div>
    </div>
  );
}

function CommunityBadge({ platform }: { platform: string }) {
  const getBadgeColor = () => {
    switch(platform.toLowerCase()) {
      case 'reddit': return 'bg-orange-100 text-orange-700 ring-orange-200';
      case 'hackernews': return 'bg-orange-500 text-white ring-orange-600';
      case 'indiehackers': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'discord': return 'bg-indigo-100 text-indigo-700 ring-indigo-200';
      case 'twitter': return 'bg-sky-100 text-sky-700 ring-sky-200';
      default: return 'bg-zinc-100 text-zinc-700 ring-zinc-200';
    }
  };

  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${getBadgeColor()}`}>
      {platform}
    </span>
  );
}

function ExpandableSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl ring-1 ring-black/5 bg-white overflow-hidden shadow-sm">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-zinc-50 hover:bg-zinc-100/50 transition"
      >
        <span className="font-semibold text-zinc-900 text-sm">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-black/5">
          {children}
        </div>
      )}
    </div>
  );
}

function PostTemplateEditor({ template }: { template: PostTemplate }) {
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState(template.body);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  
  const allTitles = [template.title, ...(template.alt_titles || [])].filter(Boolean);

  const handleCopy = () => {
    const textToCopy = `Title: ${allTitles[currentTitleIndex]}\n\n${content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg ring-1 ring-zinc-200 bg-zinc-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-100 border-b border-zinc-200">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          {template.type.replace('_', ' ')}
        </span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 bg-white rounded shadow-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="p-3">
        {allTitles.length > 1 && (
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Title</label>
            <div className="flex gap-1">
              {allTitles.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTitleIndex(idx)}
                  className={`w-2 h-2 rounded-full ${idx === currentTitleIndex ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                />
              ))}
            </div>
          </div>
        )}
        
        <input 
          type="text" 
          value={allTitles[currentTitleIndex]}
          readOnly
          className="w-full text-sm font-semibold bg-white border border-zinc-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 mb-2"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full text-xs sm:text-sm bg-white border border-zinc-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
        />
        <div className="text-right text-[10px] text-zinc-400 mt-1">
          {content.length} characters
        </div>
      </div>
    </div>
  );
}

function MetricsDashboard({ analysisId, targets }: { analysisId: string; targets: OutreachPlan["kpi_targets"] }) {
  const metrics = [
    { key: "site_visitors", label: "Site Visitors", target: targets.site_visitors },
    { key: "free_uses", label: "Free Uses", target: targets.free_uses },
    { key: "paid_conversions", label: "Paid Convers", target: targets.paid_conversions },
    { key: "feedback_messages", label: "Feedback Msgs", target: targets.feedback_messages },
    { key: "communities_active", label: "Communities", target: targets.communities_active },
    { key: "case_studies", label: "Case Studies", target: targets.case_studies }
  ];

  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`outreach_metrics_${analysisId}`);
    if (saved) {
      try { setValues(JSON.parse(saved)); } catch (e) {}
    } else {
      setValues(Object.fromEntries(metrics.map(m => [m.key, 0])));
    }
  }, [analysisId, targets]);

  const updateMetric = (key: string, val: string) => {
    const num = parseInt(val) || 0;
    const next = { ...values, [key]: num };
    setValues(next);
    localStorage.setItem(`outreach_metrics_${analysisId}`, JSON.stringify(next));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {metrics.map(m => {
        const current = values[m.key] || 0;
        const progress = Math.min(100, Math.round((current / (m.target || 1)) * 100));
        
        return (
          <div key={m.key} className="bg-white rounded-xl p-3 ring-1 ring-black/5 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{m.label}</div>
            <div className="flex items-end gap-1 mb-2">
              <input
                type="number"
                value={current}
                onChange={(e) => updateMetric(m.key, e.target.value)}
                className="w-14 text-xl font-bold bg-transparent border-b border-dashed border-zinc-300 focus:outline-none focus:border-zinc-800 p-0"
              />
              <span className="text-xs text-zinc-400 mb-1">/ {m.target}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-800 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyTracker({ analysisId, tasks }: { analysisId: string; tasks: OutreachPlan["weekly_tasks"] }) {
  const [week, setWeek] = useState(1);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`outreach_tracker_${analysisId}`);
    if (saved) {
      try { setCompleted(JSON.parse(saved)); } catch (e) {}
    }
  }, [analysisId]);

  const toggleTask = (day: string) => {
    const key = `w${week}_${day}`;
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    localStorage.setItem(`outreach_tracker_${analysisId}`, JSON.stringify(next));
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
  
  const weekProgress = days.filter(d => completed[`w${week}_${d}`]).length / 5 * 100;

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 shadow-sm overflow-hidden">
      <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
        <select 
          value={week} 
          onChange={(e) => setWeek(Number(e.target.value))}
          className="bg-white border border-zinc-200 rounded-md text-sm font-semibold px-2 py-1"
        >
          {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">{weekProgress}%</span>
          <div className="w-20 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${weekProgress}%` }} />
          </div>
        </div>
      </div>
      <div className="p-2 sm:p-3 space-y-1">
        {days.map(day => (
          <label key={day} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition">
            <div className="pt-0.5">
              <input 
                type="checkbox" 
                checked={completed[`w${week}_${day}`] || false}
                onChange={() => toggleTask(day)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{day}</div>
              <div className={`text-sm ${completed[`w${week}_${day}`] ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                {tasks[day]}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 max-h-full overflow-y-auto w-full px-4 sm:px-6">
      <div className="h-20 bg-zinc-100 animate-skeleton-pulse rounded-2xl"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 bg-zinc-100 animate-skeleton-pulse rounded-xl"></div>
        ))}
      </div>
      
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-zinc-100 animate-skeleton-pulse rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export function OutreachPlanView({ analysisData, tone: passedTone = "casual", sessionId }: { analysisData: AnalyzeSuccessResponse, tone?: string, sessionId?: string }) {
  const { user } = usePrivy();
  const { getAccessToken } = useToken();
  const [plan, setPlan] = useState<OutreachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState(passedTone);

  const fetchPlan = async (forceRegenerate = false) => {
    if (!analysisData) return;
    
    // Check local storage first if not forcing
    const cacheKey = `outreach_plan_${analysisData.analysisId}_${tone}`;
    if (!forceRegenerate) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setPlan(JSON.parse(cached));
          return;
        } catch (e) {}
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (sessionId) headers["x-cmo-session-id"] = sessionId;

      const res = await fetch("/api/outreach", {
        method: "POST",
        headers,
        body: JSON.stringify({ analysisData, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate outreach plan.");
      
      setPlan(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(false);
  }, [analysisData.analysisId]);

  // Debounced tone change
  useEffect(() => {
    if (!plan && !loading) return; 
    
    const timeout = setTimeout(() => {
      // If we change tone, force a regenerate
      if (plan && !loading) {
         fetchPlan(true);
      }
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [tone]);

  if (loading && !plan) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 text-red-600 rounded-2xl w-full mx-4 sm:mx-6 shadow-sm border border-red-100">
        <p className="font-semibold mb-4">{error}</p>
        <button 
          onClick={() => fetchPlan(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8 w-full px-4 sm:px-6 pb-24 overflow-y-auto relative h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-[-0.02em] mb-2">{plan.product_summary}</h1>
          <p className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-700">Target ICP:</span> {plan.icp}
          </p>
        </div>
        
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <button 
            onClick={() => fetchPlan(true)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-full transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Regenerating..." : "Regenerate Plan"}
          </button>
          
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full ring-1 ring-zinc-200 shadow-sm">
            <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="text-xs font-bold text-zinc-700 bg-transparent focus:outline-none"
            >
              <option value="casual">Casual Tone</option>
              <option value="professional">Professional Tone</option>
              <option value="provocative">Provocative Tone</option>
              <option value="vulnerable">Vulnerable Tone</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-t border-zinc-200/50" />

      {/* Community Match Cards */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
          🎯 Top Community Matches
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {plan.communities.map((c, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-black/5 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-bold text-zinc-900 hover:underline flex items-center gap-1 group">
                    {c.name} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                  <p className="text-xs text-zinc-500 mt-0.5">{c.audience_size}</p>
                </div>
                <CommunityBadge platform={c.platform} />
              </div>
              
              <div className="mb-4">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Fit Score</div>
                <FitScoreBar score={c.fit_score} />
              </div>
              
              <div className="space-y-3 mt-auto">
                <div className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-lg ring-1 ring-zinc-100">
                  <span className="font-semibold text-zinc-900 text-xs uppercase block mb-1">Why</span>
                  {c.fit_reason}
                </div>
                <div className="text-xs text-zinc-500 flex gap-2">
                  <span className="text-amber-500 font-bold shrink-0">⚠️ Rule</span>
                  <span className="italic">{c.rules_note}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Tracker */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 mb-4">📅 Weekly Rhythm</h2>
        <WeeklyTracker analysisId={analysisData.analysisId} tasks={plan.weekly_tasks} />
      </section>

      {/* Phased Timeline */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 mb-4">🚀 8-Week Execution Plan</h2>
        <div className="space-y-4">
          {plan.phases.map((phase, idx) => (
            <ExpandableSection 
              key={idx} 
              title={`Phase ${phase.phase_number}: ${phase.title} (${phase.weeks})`}
              defaultOpen={idx === 0}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Goal</h4>
                  <p className="text-sm text-zinc-800 font-medium">{phase.goal}</p>
                </div>
                
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Actions</h4>
                  <ul className="space-y-2">
                    {phase.actions.map((action, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-700">
                        <span className="text-blue-500">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {phase.post_template && (
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Ready-To-Post Template</h4>
                    <PostTemplateEditor template={phase.post_template} />
                  </div>
                )}
              </div>
            </ExpandableSection>
          ))}
        </div>
      </section>

      {/* Viral Angles Appendix */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 ring-1 ring-indigo-100">
        <h2 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
          🌪️ Viral Angles
        </h2>
        <ul className="space-y-3">
          {plan.viral_angles.map((angle, idx) => (
            <li key={idx} className="bg-white/80 rounded-xl p-3 text-sm font-medium text-indigo-950 shadow-sm ring-1 ring-indigo-100/50">
              {angle}
            </li>
          ))}
        </ul>
      </section>
      
    </div>
  );
}
