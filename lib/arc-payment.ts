import { ethers } from "ethers";

const CMO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CMO_CONTRACT_ADDRESS || "";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_RPC_URL =
  typeof window === "undefined"
    ? (process.env.ARC_RPC_URL || process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network")
    : (process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network");
const BALANCE_RETRY_ATTEMPTS = 3;
const BALANCE_RETRY_DELAY_MS = 500;

if (!CMO_CONTRACT_ADDRESS) {
  console.warn("⚠️ Missing CMO contract address in environment.");
}

const CMO_ABI = [
  "function useAnalysis(address user) returns (bool)",
  "function payForAnalysis(address user) returns (bool)",
  "function useAudit(address user) returns (bool)",
  "function payForAudit(address user) returns (bool)",
  "function getRemainingFree(address user) view returns (uint256)",
  "function getRemainingFreeAnalyses(address user) view returns (uint256)",
  "function getRemainingFreeAudits(address user) view returns (uint256)",
  "function pricePerAnalysis() view returns (uint256)",
  "function analysisPrice() view returns (uint256)",
  "function auditPrice() view returns (uint256)",
  "function analysisCount(address user) view returns (uint256)",
  "function auditCount(address user) view returns (uint256)"
];

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export const arcProvider = new ethers.JsonRpcProvider(ARC_RPC_URL);

export const ARC_PAYMENT_DEBUG = {
  rpcUrl: ARC_RPC_URL,
  usdcAddress: USDC_ADDRESS
};

export type WalletBalanceMeta = {
  formattedBalance: string;
  rawBalance: string;
  symbol: string;
  decimals: number;
  lastUpdatedAt: string;
  error?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getWalletBalanceWithMeta(address: string): Promise<WalletBalanceMeta> {
  if (!address) {
    return {
      formattedBalance: "0.00",
      rawBalance: "0",
      symbol: "USDC",
      decimals: 0,
      lastUpdatedAt: new Date().toISOString(),
      error: "Wallet address is missing."
    };
  }

  let lastError = "Unable to read wallet balance.";

  for (let attempt = 1; attempt <= BALANCE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, arcProvider);
      const decimals = await usdcContract.decimals();
      console.log("Decimals:", decimals);

      const balance = await usdcContract.balanceOf(address);
      console.log("Raw balance:", balance.toString());

      const formatted = ethers.formatUnits(balance, Number(decimals));
      console.log("Formatted:", formatted);

      return {
        formattedBalance: formatted,
        rawBalance: balance.toString(),
        symbol: "USDC",
        decimals: Number(decimals),
        lastUpdatedAt: new Date().toISOString()
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown balance read error.";
      console.error(`Balance read attempt ${attempt} failed:`, lastError);

      if (attempt < BALANCE_RETRY_ATTEMPTS) {
        await wait(BALANCE_RETRY_DELAY_MS);
      }
    }
  }

  return {
    formattedBalance: "0.00",
    rawBalance: "0",
    symbol: "USDC",
    decimals: 0,
    lastUpdatedAt: new Date().toISOString(),
    error: `Balance read failed after ${BALANCE_RETRY_ATTEMPTS} attempts: ${lastError}`
  };
}

export async function getWalletBalance(address: string): Promise<string> {
  const result = await getWalletBalanceWithMeta(address);
  return result.formattedBalance;
}

export async function getRemainingFreeAnalyses(address: string): Promise<number> {
  if (!address) return 0;
  const cmoContract = new ethers.Contract(CMO_CONTRACT_ADDRESS!, CMO_ABI, arcProvider);
  const remaining = await cmoContract.getRemainingFree(address, { blockTag: "latest" });
  return Number(remaining);
}

export async function getPricePerAnalysisFormattedFixed2(): Promise<string> {
  return "$5.00";
}

export async function checkAndPayIfNeeded(
  walletClient: any,
  address: string
): Promise<{
  success: boolean;
  paid: boolean;
  remaining: number;
  txHash?: string;
  newBalance?: string;
  error?: string;
}> {
  try {
    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();

    const cmoContract = new ethers.Contract(CMO_CONTRACT_ADDRESS!, CMO_ABI, signer);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

    // 1. Check remaining free analyses
    const freeRemaining = await cmoContract.getRemainingFree(address);
    console.log("Free remaining:", freeRemaining.toString());

    if (freeRemaining > BigInt(0)) {
      const wouldUseFree = await cmoContract.useAnalysis.staticCall(address);
      if (wouldUseFree) {
        try {
          const tx = await cmoContract.useAnalysis(address);
          await tx.wait();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("refresh-wallet-stats"));
          }
          return { success: true, paid: false, remaining: Number(freeRemaining) - 1 };
        } catch (err: any) {
          console.error("Free use failed:", err);
          return { success: false, paid: false, remaining: 0, error: err.message };
        }
      }
    }

    // 2. Free limit hit — read price from contract
    const decimals: number = Number(await usdcContract.decimals());
    console.log("USDC decimals:", decimals);

    const pricePerAnalysis: bigint = await cmoContract.pricePerAnalysis();
    console.log("Contract price raw:", pricePerAnalysis.toString());
    console.log("Contract price formatted:", ethers.formatUnits(pricePerAnalysis, decimals));

    // 3. Check balance
    const balanceBefore: bigint = await usdcContract.balanceOf(address);
    console.log("Balance before raw:", balanceBefore.toString());
    console.log("Balance before formatted:", ethers.formatUnits(balanceBefore, decimals));

    if (balanceBefore < pricePerAnalysis) {
      return { success: false, paid: false, remaining: 0, error: "insufficient_balance" };
    }

    // 4. Check and set allowance
    const allowance: bigint = await usdcContract.allowance(address, CMO_CONTRACT_ADDRESS!);
    console.log("Current allowance raw:", allowance.toString());

    if (allowance < pricePerAnalysis) {
      console.log("Approving exact contract price:", pricePerAnalysis.toString());
      const approveTx = await usdcContract.approve(CMO_CONTRACT_ADDRESS!, pricePerAnalysis);
      await approveTx.wait();
      console.log("Approve tx hash:", approveTx.hash);
    } else {
      console.log("Allowance sufficient — skipping approve");
    }

    // 5. Execute payment
    console.log("Executing payForAnalysis...");
    const paymentTx = await cmoContract.payForAnalysis(address);
    const receipt = await paymentTx.wait(1);
    const txHash = receipt?.hash || paymentTx.hash;
    console.log("Payment tx hash:", txHash);

    // 6. Verify actual deduction using contract price directly
    const balanceAfter: bigint = await usdcContract.balanceOf(address);
    const charged = balanceBefore - balanceAfter;
    console.log("Charged raw:", charged.toString());
    console.log("Expected raw:", pricePerAnalysis.toString());
    console.log("Actually charged formatted:", ethers.formatUnits(charged, decimals));

    // FIX: compare against pricePerAnalysis directly — not against hardcoded 1 USDC
    if (charged < pricePerAnalysis) {
      console.error("Payment verification failed:", {
        charged: charged.toString(),
        expected: pricePerAnalysis.toString()
      });
      throw new Error("Payment verification failed — please try again");
    }

    // 7. Refresh balance
    const newBalance = await getWalletBalance(address);
    console.log("New balance after payment:", newBalance);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refresh-wallet-stats", { detail: { newBalance } }));
    }

    return { success: true, paid: true, remaining: 0, txHash, newBalance };

  } catch (err: any) {
    console.error("checkAndPayIfNeeded error:", err);
    return { success: false, paid: false, remaining: 0, error: err.message };
  }
}

export async function getRemainingFreeAudits(address: string): Promise<number> {
  return 0;
}

export async function checkAndPayForAudit(
  walletClient: any,
  address: string
): Promise<{
  success: boolean;
  paid: boolean;
  remaining: number;
  txHash?: string;
  newBalance?: string;
  error?: string;
}> {
  try {
    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();

    const cmoContract = new ethers.Contract(CMO_CONTRACT_ADDRESS!, CMO_ABI, signer);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

    // Always paid — no free audits
    const auditPrice: bigint = await cmoContract.auditPrice();
    console.log('Audit price raw:', auditPrice.toString());

    const balanceBefore: bigint = await usdcContract.balanceOf(address);
    console.log('Balance before:', balanceBefore.toString());

    if (balanceBefore < auditPrice) {
      return { 
        success: false, 
        paid: false, 
        remaining: 0, 
        error: 'insufficient_balance' 
      };
    }

    // Check and set allowance
    const allowance: bigint = await usdcContract.allowance(
      address, 
      CMO_CONTRACT_ADDRESS!
    );
    console.log('Current allowance:', allowance.toString());

    if (allowance < auditPrice) {
      console.log('Approving audit price:', auditPrice.toString());
      const approveTx = await usdcContract.approve(
        CMO_CONTRACT_ADDRESS!, 
        auditPrice
      );
      await approveTx.wait();
      console.log('Approved for audit');
    }

    // Execute $15 payment
    console.log('Executing payForAudit...');
    const paymentTx = await cmoContract.payForAudit(address);
    const receipt = await paymentTx.wait(1);
    const txHash = receipt?.hash || paymentTx.hash;
    console.log('Audit payment tx:', txHash);

    // Verify deduction
    const balanceAfter: bigint = await usdcContract.balanceOf(address);
    const charged = balanceBefore - balanceAfter;
    console.log('Charged:', charged.toString());
    console.log('Expected:', auditPrice.toString());

    if (charged < auditPrice) {
      throw new Error('Audit payment verification failed — please try again');
    }

    const newBalance = await getWalletBalance(address);
    console.log('New balance:', newBalance);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refresh-wallet-stats', { 
        detail: { newBalance } 
      }));
    }

    return { 
      success: true, 
      paid: true, 
      remaining: 0, 
      txHash, 
      newBalance 
    };

  } catch (err: any) {
    console.error('checkAndPayForAudit error:', err);
    return { 
      success: false, 
      paid: false, 
      remaining: 0, 
      error: err.message 
    };
  }
}