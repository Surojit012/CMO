export type AgentEventStatus = "thinking" | "done" | "error";

export type AgentEvent = {
  agent: string;
  status: AgentEventStatus;
  message: string;
  preview?: string;
  timestamp: number;
};

export type AgentEventCallback = (event: AgentEvent) => void;

/** Helper: emit a "thinking" event, run the work, emit a "done" event, return result */
export async function withAgentEvent<T>(
  agentName: string,
  thinkingMessage: string,
  doneMessage: string,
  work: () => Promise<T>,
  onEvent?: AgentEventCallback
): Promise<T> {
  onEvent?.({ agent: agentName, status: "thinking", message: thinkingMessage, timestamp: Date.now() });
  const result = await work();
  const preview = typeof result === "string" ? result.slice(0, 140) + "…" : undefined;
  onEvent?.({ agent: agentName, status: "done", message: doneMessage, preview, timestamp: Date.now() });
  return result;
}
