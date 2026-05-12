/**
 * In-memory job tracker for a single analysis session.
 *
 * Tracks all ERC-8183 nanopayment jobs created during one
 * `generateGrowthAnalysis()` run and produces a receipt.
 */

export type TrackedJob = {
  agentName: string;
  jobId: string | null;
  cost: string;
  txHash: string | null;
  status: "settled" | "failed" | "skipped";
  timestamp: number;
};

export type SessionReceipt = {
  totalCost: string;
  jobCount: number;
  settledCount: number;
  jobs: TrackedJob[];
  arcScanLinks: string[];
};

const ARC_SCAN_BASE = "https://testnet.arcscan.app";

export class JobTracker {
  private jobs: TrackedJob[] = [];

  /**
   * Record a completed (or failed) agent job.
   */
  trackJob(
    agentName: string,
    jobId: string | null,
    cost: string,
    txHash: string | null,
    settled: boolean
  ): void {
    this.jobs.push({
      agentName,
      jobId,
      cost,
      txHash,
      status: settled ? "settled" : txHash ? "failed" : "skipped",
      timestamp: Date.now(),
    });
  }

  /**
   * Build a session receipt summarizing all tracked jobs.
   */
  getSessionReceipt(): SessionReceipt {
    const settledJobs = this.jobs.filter((j) => j.status === "settled");
    const totalCost = settledJobs
      .reduce((sum, j) => sum + parseFloat(j.cost), 0)
      .toFixed(2);

    const arcScanLinks = settledJobs
      .filter((j) => j.txHash)
      .map((j) => `${ARC_SCAN_BASE}/tx/${j.txHash}`);

    return {
      totalCost: `${totalCost} USDC`,
      jobCount: this.jobs.length,
      settledCount: settledJobs.length,
      jobs: [...this.jobs],
      arcScanLinks,
    };
  }

  /**
   * Clear all tracked jobs (call at start of each new analysis session).
   */
  reset(): void {
    this.jobs = [];
  }
}
