/**
 * ERC-8183 Nanopayment Service for CMO Agent Runs
 *
 * Creates ONE consolidated ERC-8183 job per analysis session:
 *   createJob → setBudget → approve USDC → fund → submit → complete
 *
 * Per-agent cost breakdown is embedded in the job description.
 * Only 7 blockchain transactions per session (~15-20s on Arc Testnet).
 *
 * Server-side only — NEVER import this file in client components.
 */

import {
  createWalletClient,
  http,
  keccak256,
  toHex,
  parseUnits,
  decodeEventLog,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, arcPublicClient } from "./client";

// ─── Constants ───────────────────────────────────────────────────────────────

const AGENTIC_COMMERCE_CONTRACT =
  "0x0747EEf0706327138c69792bF28Cd525089e4583" as Address;
const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as Address;

/** Agent pricing in USDC (6 decimals) */
export const AGENT_PRICES: Record<string, string> = {
  strategist: "0.20",
  copywriter: "0.20",
  seo: "0.20",
  conversion: "0.20",
  distribution: "0.20",
  reddit: "0.15",
  critic: "0.10",
  aggregator: "0.10",
};

const ALL_AGENTS = ["strategist", "copywriter", "seo", "conversion", "distribution", "reddit", "critic", "aggregator"] as const;

// ─── ABI ─────────────────────────────────────────────────────────────────────

const agenticCommerceAbi = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    type: "function",
    name: "setBudget",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverable", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "complete",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "client", type: "address" },
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "evaluator", type: "address" },
      { indexed: false, name: "expiredAt", type: "uint256" },
      { indexed: false, name: "hook", type: "address" },
    ],
    anonymous: false,
  },
] as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type SessionSettlementResult = {
  jobId: string | null;
  txHash: string | null;
  totalCost: string;
  settled: boolean;
  agentBreakdown: Array<{ agentName: string; cost: string }>;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export class NanopaymentService {
  private walletClient;
  private account;
  private enabled: boolean;

  constructor() {
    const privateKey = process.env.CMO_SERVER_WALLET_PRIVATE_KEY
      || process.env.DEPLOYER_PRIVATE_KEY;

    if (!privateKey) {
      console.warn("⚠️ No CMO server wallet key found — nanopayments disabled");
      this.enabled = false;
      this.account = null as any;
      this.walletClient = null as any;
      return;
    }

    this.enabled = true;
    this.account = privateKeyToAccount(privateKey as Hex);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: arcTestnet,
      transport: http("https://rpc.testnet.arc.network"),
    });
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Settle ONE consolidated ERC-8183 job for the entire analysis session.
   *
   * Creates a single job with the total cost of all agents. The job description
   * includes per-agent cost breakdown. Only 7 blockchain transactions total.
   *
   * Lifecycle: createJob → setBudget → approve → fund → submit → complete
   */
  async settleSessionJob(
    deliverableContent: string,
    userWalletAddress?: string
  ): Promise<SessionSettlementResult> {
    const agentBreakdown = ALL_AGENTS.map((name) => ({
      agentName: name,
      cost: AGENT_PRICES[name] ?? "0.20",
    }));
    const totalCostNum = agentBreakdown.reduce((sum, a) => sum + parseFloat(a.cost), 0);
    const totalCost = totalCostNum.toFixed(2);

    if (!this.enabled) {
      console.warn("⚡ Nanopayments disabled — skipping session settlement");
      return { jobId: null, txHash: null, totalCost, settled: false, agentBreakdown };
    }

    let jobId: bigint | null = null;

    try {
      const amount = parseUnits(totalCost, 6);
      const serverAddress = this.account.address;
      const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Build descriptive job description with per-agent breakdown
      const costLines = agentBreakdown.map((a) => `${a.agentName}: ${a.cost} USDC`).join(", ");
      const description = [
        `CMO Growth Analysis Session`,
        userWalletAddress ? `User: ${userWalletAddress}` : null,
        `Agents: ${costLines}`,
        `Total: ${totalCost} USDC`,
      ].filter(Boolean).join(" | ");

      // Step 1: createJob
      console.log("⚡ [Arc] Creating ERC-8183 session job...");
      const createJobHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "createJob",
        args: [
          serverAddress,
          serverAddress,
          expiredAt,
          description,
          "0x0000000000000000000000000000000000000000" as Address,
        ],
      });

      const createReceipt = await arcPublicClient.waitForTransactionReceipt({
        hash: createJobHash,
      });
      jobId = this.extractJobId(createReceipt);
      console.log(`⚡ [Arc] Job created: ${jobId}`);

      // Step 2: setBudget
      console.log("⚡ [Arc] Setting budget...");
      const setBudgetHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "setBudget",
        args: [jobId, amount, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: setBudgetHash });

      // Step 3: approve USDC
      console.log("⚡ [Arc] Approving USDC...");
      const approveHash = await this.walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AGENTIC_COMMERCE_CONTRACT, amount],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 4: fund escrow
      console.log("⚡ [Arc] Funding escrow...");
      const fundHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "fund",
        args: [jobId, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: fundHash });

      // Step 5: submit deliverable (keccak256 of combined agent output)
      console.log("⚡ [Arc] Submitting deliverable...");
      const deliverableHash = keccak256(toHex(deliverableContent));
      const submitHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "submit",
        args: [jobId, deliverableHash, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: submitHash });

      // Step 6: complete
      console.log("⚡ [Arc] Completing job...");
      const reasonHash = keccak256(toHex("approved"));
      const completeHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "complete",
        args: [jobId, reasonHash, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: completeHash });

      console.log(`✅ [Arc] Session job settled: ${completeHash} (${totalCost} USDC)`);

      return {
        jobId: jobId.toString(),
        txHash: completeHash,
        totalCost,
        settled: true,
        agentBreakdown,
      };
    } catch (error) {
      console.warn(
        "⚠️ Arc session settlement failed:",
        error instanceof Error ? error.message : error
      );
      return {
        jobId: jobId?.toString() ?? null,
        txHash: null,
        totalCost,
        settled: false,
        agentBreakdown,
      };
    }
  }

  /**
   * Extract jobId from a createJob transaction receipt.
   */
  private extractJobId(receipt: any): bigint {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: agenticCommerceAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "JobCreated") {
          return (decoded.args as any).jobId;
        }
      } catch {
        continue;
      }
    }
    throw new Error("Could not parse JobCreated event from transaction receipt");
  }
}

// Singleton instance for server-side use
export const nanopaymentService = new NanopaymentService();
