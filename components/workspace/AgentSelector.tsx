"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import type { ReportType } from "@/lib/types";
import { REPORT_AGENT_MAP } from "@/lib/types";

export type AgentConfig = {
  name: string;
  cost: number;
  key: string;
};

/** All available agents across all report types */
const ALL_AGENTS: AgentConfig[] = [
  // Legacy agents
  { key: "strategist", name: "Strategist", cost: 0.2 },
  { key: "copywriter", name: "Copywriter", cost: 0.2 },
  { key: "seo", name: "SEO", cost: 0.2 },
  { key: "conversion", name: "Conversion", cost: 0.2 },
  { key: "distribution", name: "Distribution", cost: 0.2 },
  { key: "reddit", name: "Reddit", cost: 0.15 },
  { key: "critic", name: "Critic", cost: 0.1 },
  { key: "aggregator", name: "Aggregator", cost: 0.1 },
  // Crypto-native agents
  { key: "narrative", name: "Narrative", cost: 0.3 },
  { key: "positioning", name: "Positioning", cost: 0.25 },
  { key: "competitor", name: "Competitor", cost: 0.4 },
  { key: "sentiment", name: "Sentiment", cost: 0.2 },
];

type AgentSelectorProps = {
  selectedAgents: string[];
  onSelectionChange: (agents: string[]) => void;
  activePlan: string;
  reportType?: ReportType;
};

/**
 * Returns the list of agents available for a given report type.
 * Falls back to legacy agents when no report type is specified.
 */
function getAgentsForReport(reportType?: ReportType): AgentConfig[] {
  if (!reportType) {
    // Legacy mode — show original 8 agents
    return ALL_AGENTS.filter(a =>
      ["strategist", "copywriter", "seo", "conversion", "distribution", "reddit", "critic", "aggregator"].includes(a.key)
    );
  }

  const agentKeys = REPORT_AGENT_MAP[reportType] || [];
  return ALL_AGENTS.filter(a => agentKeys.includes(a.key));
}

export function AgentSelector({ selectedAgents, onSelectionChange, activePlan, reportType }: AgentSelectorProps) {
  const isStarterPlan = activePlan === "weekly";
  const allowedAgentsForStarter = reportType
    ? REPORT_AGENT_MAP[reportType]?.slice(0, 3) || [] // First 3 agents for starter plan
    : ["strategist", "copywriter", "seo"];

  const availableAgents = getAgentsForReport(reportType);

  const toggleAgent = useCallback(
    (key: string) => {
      if (isStarterPlan && !allowedAgentsForStarter.includes(key)) return;
      if (selectedAgents.includes(key)) {
        // Don't allow deselecting the last agent
        if (selectedAgents.length <= 1) return;
        onSelectionChange(selectedAgents.filter((a) => a !== key));
      } else {
        onSelectionChange([...selectedAgents, key]);
      }
    },
    [selectedAgents, onSelectionChange, isStarterPlan, allowedAgentsForStarter]
  );

  const selectAll = () => {
    if (isStarterPlan) {
      onSelectionChange(allowedAgentsForStarter);
    } else {
      onSelectionChange(availableAgents.map((a) => a.key));
    }
  };
  const clearAll = () => onSelectionChange([availableAgents[0]?.key || "strategist"]); // Keep at least one

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-500">
          Select Agents
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="text-[10px] font-medium text-zinc-600 hover:text-zinc-300 transition"
          >
            Select all
          </button>
          <button
            onClick={clearAll}
            className="text-[10px] font-medium text-zinc-600 hover:text-zinc-300 transition"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableAgents.map((agent) => {
          const isSelected = selectedAgents.includes(agent.key);
          const isDisabled = isStarterPlan && !allowedAgentsForStarter.includes(agent.key);

          return (
            <button
              key={agent.key}
              onClick={() => toggleAgent(agent.key)}
              disabled={isDisabled}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${
                isSelected
                  ? "bg-white/10 border-white/20 text-white"
                  : isDisabled
                  ? "bg-transparent border-white/[0.03] text-zinc-700 cursor-not-allowed"
                  : "bg-transparent border-white/[0.06] text-zinc-500 hover:border-white/10 hover:text-zinc-400"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {agent.name}
              {!isDisabled && (
                <>
                  <span className="text-zinc-600 ml-0.5">·</span>
                  <span className={isSelected ? "text-zinc-400" : "text-zinc-600"}>
                    {agent.cost.toFixed(2)}
                  </span>
                </>
              )}
              {isDisabled && (
                <span className="text-zinc-700 ml-1 text-[10px]">(Locked)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getAgentPrice(selectedAgents: string[]): number {
  return ALL_AGENTS.filter((a) => selectedAgents.includes(a.key)).reduce(
    (sum, a) => sum + a.cost,
    0
  );
}

export function getAllAgentKeys(reportType?: ReportType): string[] {
  return getAgentsForReport(reportType).map((a) => a.key);
}
