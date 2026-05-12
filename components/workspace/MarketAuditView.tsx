"use client";

import type { Message } from "@/lib/types";
import { MarketAuditReport } from "@/components/MarketAuditReport";

type MarketAuditViewProps = {
  messages: Message[];
  currentStep: string | null;
};

export function MarketAuditView({ messages }: MarketAuditViewProps) {
  const auditMessage = [...messages].reverse().find(
    (m): m is Extract<Message, { role: "assistant" }> =>
      m.role === "assistant" && "type" in m && m.type === "audit" && "auditData" in m && !!m.auditData
  );

  if (auditMessage && "auditData" in auditMessage && auditMessage.auditData) {
    return (
      <div className="animate-fade-in dark-override">
        <MarketAuditReport data={auditMessage.auditData} url="" />
      </div>
    );
  }

  return null;
}
