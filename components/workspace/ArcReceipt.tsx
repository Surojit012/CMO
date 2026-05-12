"use client";

import { ExternalLink, Zap } from "lucide-react";
import type { ArcReceipt as ArcReceiptType } from "@/lib/types";

type ArcReceiptProps = { receipt: ArcReceiptType };

export function ArcReceipt({ receipt }: ArcReceiptProps) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] overflow-hidden animate-card-entrance">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
        <Zap className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
          Settled on Arc Testnet
        </span>
      </div>

      {/* Table */}
      <div className="px-5 py-3">
        <div className="space-y-0">
          {receipt.jobs.map((job, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
              <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${job.status === "settled" ? "bg-emerald-400" : job.status === "failed" ? "bg-red-400" : "bg-zinc-700"}`} />
                <span className="text-xs text-zinc-400">{job.agentName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-zinc-600">{job.cost} USDC</span>
                {job.txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${job.txHash}`} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-zinc-400 transition">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
          <span className="text-[11px] text-zinc-600">{receipt.settledCount}/{receipt.jobCount} settled</span>
          <span className="text-xs font-semibold text-zinc-300">{receipt.totalCost}</span>
        </div>
      </div>
    </div>
  );
}
