/**
 * ERC-8183 Nanopayment Service for CMO Agent Runs
 *
 * Each agent run creates an onchain job on Arc Testnet:
 *   createJob → setBudget → approve USDC → fund → run agent → submit → complete
 *
 * Server-side only — NEVER import this file in client components.
 */

import {
  createWalletClient,
  http,
  keccak256,
  toHex,
  parseUnits,
  formatUnits,
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
const AGENT_PRICES: Record<string, string> = {
  strategist: "0.20",
  copywriter: "0.20",
  seo: "0.20",
  conversion: "0.20",
  distribution: "0.20",
  reddit: "0.15",
  critic: "0.10",
  aggregator: "0.10",
};

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
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "client", type: "address" },
          { name: "provider", type: "address" },
          { name: "evaluator", type: "address" },
          { name: "description", type: "string" },
          { name: "budget", type: "uint256" },
          { name: "expiredAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "hook", type: "address" },
        ],
      },
    ],
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

export type AgentJobResult = {
  output: string;
  jobId: string | null;
  txHash: string | null;
  cost: string;
  agentName: string;
  settled: boolean;
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

  /**
   * Run a single agent job through the full ERC-8183 lifecycle.
   *
   * 1. createJob  2. setBudget  3. approve USDC  4. fund
   * 5. execute agent  6. submit deliverable  7. complete
   *
   * If any onchain step fails, the agent output is still returned.
   */
  async runAgentJob(
    agentName: string,
    agentOutputFn: () => Promise<string>,
    userWalletAddress?: string
  ): Promise<AgentJobResult> {
    const price = AGENT_PRICES[agentName] ?? "0.20";
    const cost = price;

    // If nanopayments are disabled, just run the agent
    if (!this.enabled) {
      const output = await agentOutputFn();
      return { output, jobId: null, txHash: null, cost, agentName, settled: false };
    }

    let jobId: bigint | null = null;
    let finalTxHash: string | null = null;

    try {
      const amount = parseUnits(price, 6);
      const serverAddress = this.account.address;
      const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const description = `CMO agent: ${agentName}${userWalletAddress ? ` (user: ${userWalletAddress})` : ""}`;

      // Step 1: createJob
      const createJobHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "createJob",
        args: [
          serverAddress,                                        // provider
          serverAddress,                                        // evaluator
          expiredAt,                                            // expiredAt
          description,                                          // description
          "0x0000000000000000000000000000000000000000" as Address, // hook (none)
        ],
      });

      const createReceipt = await arcPublicClient.waitForTransactionReceipt({
        hash: createJobHash,
      });

      // Extract jobId from JobCreated event
      jobId = this.extractJobId(createReceipt);
      console.log(`🔗 Arc job created: ${jobId} (agent: ${agentName})`);

      // Step 2: setBudget
      const setBudgetHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "setBudget",
        args: [jobId, amount, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: setBudgetHash });

      // Step 3: approve USDC
      const approveHash = await this.walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AGENTIC_COMMERCE_CONTRACT, amount],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 4: fund escrow
      const fundHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "fund",
        args: [jobId, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: fundHash });

      // Step 5: Run the agent
      const output = await agentOutputFn();

      // Step 6: submit deliverable (keccak256 of agent output)
      const deliverableHash = keccak256(toHex(output));
      const submitHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "submit",
        args: [jobId, deliverableHash, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: submitHash });

      // Step 7: complete (evaluator approves)
      const reasonHash = keccak256(toHex("approved"));
      const completeHash = await this.walletClient.writeContract({
        address: AGENTIC_COMMERCE_CONTRACT,
        abi: agenticCommerceAbi,
        functionName: "complete",
        args: [jobId, reasonHash, "0x" as Hex],
      });
      await arcPublicClient.waitForTransactionReceipt({ hash: completeHash });

      finalTxHash = completeHash;
      console.log(`✅ Arc job settled: ${finalTxHash} (agent: ${agentName}, cost: ${cost} USDC)`);

      return {
        output,
        jobId: jobId.toString(),
        txHash: finalTxHash,
        cost,
        agentName,
        settled: true,
      };
    } catch (error) {
      console.warn(
        `⚠️ Arc nanopayment failed for ${agentName}:`,
        error instanceof Error ? error.message : error
      );

      // Graceful degradation: still run the agent if we haven't yet
      try {
        const output = await agentOutputFn();
        return {
          output,
          jobId: jobId?.toString() ?? null,
          txHash: finalTxHash,
          cost,
          agentName,
          settled: false,
        };
      } catch (agentError) {
        // If the agent itself failed, re-throw
        throw agentError;
      }
    }
  }

  /**
   * Calculate total cost for a set of agents.
   */
  static calculateTotalCost(agentNames: string[]): string {
    let total = 0;
    for (const name of agentNames) {
      total += parseFloat(AGENT_PRICES[name] ?? "0.20");
    }
    return `${total.toFixed(2)} USDC`;
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
