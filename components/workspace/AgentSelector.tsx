"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";

export type AgentConfig = {
  name: string;
  cost: number;
  key: string;
};

const AGENTS: AgentConfig[] = [
  { key: "strategist", name: "Strategist", cost: 0.2 },
  { key: "copywriter", name: "Copywriter", cost: 0.2 },
  { key: "seo", name: "SEO", cost: 0.2 },
  { key: "conversion", name: "Conversion", cost: 0.2 },
  { key: "distribution", name: "Distribution", cost: 0.2 },
  { key: "reddit", name: "Reddit", cost: 0.15 },
  { key: "critic", name: "Critic", cost: 0.1 },
  { key: "aggregator", name: "Aggregator", cost: 0.1 },
];

type AgentSelectorProps = {
  selectedAgents: string[];
  onSelectionChange: (agents: string[]) => void;
};

export function AgentSelector({ selectedAgents, onSelectionChange }: AgentSelectorProps) {
  const toggleAgent = useCallback(
    (key: string) => {
      if (selectedAgents.includes(key)) {
        // Don't allow deselecting the last agent
        if (selectedAgents.length <= 1) return;
        onSelectionChange(selectedAgents.filter((a) => a !== key));
      } else {
        onSelectionChange([...selectedAgents, key]);
      }
    },
    [selectedAgents, onSelectionChange]
  );

  const selectAll = () => onSelectionChange(AGENTS.map((a) => a.key));
  const clearAll = () => onSelectionChange([AGENTS[0].key]); // Keep at least one

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
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
        {AGENTS.map((agent) => {
          const isSelected = selectedAgents.includes(agent.key);
          return (
            <button
              key={agent.key}
              onClick={() => toggleAgent(agent.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${
                isSelected
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/[0.06] text-zinc-500 hover:border-white/10 hover:text-zinc-400"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {agent.name}
              <span className="text-zinc-600 ml-0.5">·</span>
              <span className={isSelected ? "text-zinc-400" : "text-zinc-600"}>
                {agent.cost.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getAgentPrice(selectedAgents: string[]): number {
  return AGENTS.filter((a) => selectedAgents.includes(a.key)).reduce(
    (sum, a) => sum + a.cost,
    0
  );
}

export function getAllAgentKeys(): string[] {
  return AGENTS.map((a) => a.key);
}
