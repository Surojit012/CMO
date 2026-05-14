import { ethers } from "ethers";

const CMO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CMO_CONTRACT_ADDRESS || "";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_RPC_URL =
  typeof window === "undefined"
    ? (process.env.ARC_RPC_URL || process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network")
    : (process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network");
const BALANCE_RETRY_ATTEMPTS = 3;
const BALANCE_RETRY_DELAY_MS = 500;
const TX_RETRY_ATTEMPTS = 4;
const TX_RETRY_DELAY_MS = 1500;
const POST_TX_SETTLE_DELAY_MS = 1200;
const TX_CONFIRM_TIMEOUT_MS = 25000;

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
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown transaction error.";
}

function isRetryableTxError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return [
    "txpool is full",
    "transaction creation failed",
    "replacement transaction underpriced",
    "already known",
    "nonce",
    "temporarily unavailable",
    "network error",
    "timeout"
  ].some((pattern) => message.includes(pattern));
}

function toUserFacingPaymentError(error: unknown) {
  const message = getErrorMessage(error);

  if (isRetryableTxError(error)) {
    return "Arc is temporarily congested. Please wait a few seconds and try again.";
  }

  return message;
}

async function waitForTransactionReceipt(tx: any) {
  const browserWait = tx.wait(1);
  const rpcWait = arcProvider.waitForTransaction(tx.hash, 1, TX_CONFIRM_TIMEOUT_MS);

  try {
    const receipt = await Promise.race([
      browserWait,
      rpcWait,
      wait(TX_CONFIRM_TIMEOUT_MS).then(() => null)
    ]);

    if (receipt) {
      return receipt;
    }

    console.warn("Transaction confirmation timed out, continuing with tx hash:", tx.hash);
    return null;
  } catch (error) {
    if (tx?.hash) {
      console.warn("Transaction confirmation fallback used for tx hash:", tx.hash, error);
      return null;
    }

    throw error;
  }
}

async function sendTransactionWithRetry(send: () => Promise<any>, label: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= TX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const tx = await send();
      const receipt = await waitForTransactionReceipt(tx);
      await wait(POST_TX_SETTLE_DELAY_MS);
      return { tx, receipt };
    } catch (error) {
      lastError = error;
      console.error(label + " attempt " + attempt + " failed:", error);

      if (attempt === TX_RETRY_ATTEMPTS || !isRetryableTxError(error)) {
        throw error;
      }

      await wait(TX_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(label + " failed.");
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

/** Nanopayment price: sum of all 8 agent costs */
const NANOPAYMENT_PRICE_USDC = "1.35";

/** Server wallet that receives nanopayment transfers */
const SERVER_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_CMO_SERVER_WALLET
  || process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS
  || "0x34e20D873994ddE2e918b2ddCF88815Fae46FF93"; // CMO deployer wallet

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

    // 0. Check if user is on a subscription plan
    if (typeof window !== "undefined") {
      try {
        const data = localStorage.getItem("cmo_onboarding_data");
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.plan && ["weekly", "monthly", "yearly"].includes(parsed.plan)) {
            console.log(`User is on ${parsed.plan} plan. Bypassing nanopayment.`);
            return {
              success: true,
              paid: false,
              remaining: 9999,
              newBalance: await getWalletBalance(address)
            };
          }
        }
      } catch (e) {
        console.error("Failed to parse plan data from localStorage", e);
      }
    }

    // 1. Check remaining free analyses
    const freeRemaining = await cmoContract.getRemainingFree(address);
    console.log("Free remaining:", freeRemaining.toString());

    if (freeRemaining > BigInt(0)) {
      const wouldUseFree = await cmoContract.useAnalysis.staticCall(address);
      if (wouldUseFree) {
        try {
          const { tx: freeUseTx } = await sendTransactionWithRetry(() => cmoContract.useAnalysis(address), "useAnalysis");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refresh-wallet-stats", { detail: { remaining: Number(freeRemaining) - 1 } }));
          }
          return {
            success: true,
            paid: false,
            remaining: Number(freeRemaining) - 1,
            txHash: freeUseTx.hash
          };
        } catch (err: any) {
          console.error("Free use failed:", err);
          return { success: false, paid: false, remaining: 0, error: toUserFacingPaymentError(err) };
        }
      }
    }

    // 2. Nanopayment pricing — direct USDC transfer to server wallet
    const decimals: number = Number(await usdcContract.decimals());
    const nanopaymentAmount = ethers.parseUnits(NANOPAYMENT_PRICE_USDC, decimals);
    console.log("Nanopayment price:", NANOPAYMENT_PRICE_USDC, "USDC (", nanopaymentAmount.toString(), "raw)");

    // 3. Check balance
    const balanceBefore: bigint = await usdcContract.balanceOf(address);
    console.log("Balance before:", ethers.formatUnits(balanceBefore, decimals));

    if (balanceBefore < nanopaymentAmount) {
      return { success: false, paid: false, remaining: 0, error: "insufficient_balance" };
    }

    // 4. Transfer USDC directly to server wallet
    if (!SERVER_WALLET_ADDRESS) {
      throw new Error("Server wallet address not configured");
    }

    console.log("Transferring", NANOPAYMENT_PRICE_USDC, "USDC to", SERVER_WALLET_ADDRESS);
    const { tx: paymentTx, receipt } = await sendTransactionWithRetry(
      () => usdcContract.transfer(SERVER_WALLET_ADDRESS, nanopaymentAmount),
      "nanopayment-transfer"
    );
    const txHash = receipt?.hash || paymentTx.hash;
    console.log("Nanopayment tx hash:", txHash);

    // 5. Verify deduction
    const balanceAfter: bigint = await usdcContract.balanceOf(address);
    const charged = balanceBefore - balanceAfter;
    console.log("Charged:", ethers.formatUnits(charged, decimals), "USDC");

    if (charged < nanopaymentAmount) {
      console.error("Payment verification failed:", {
        charged: charged.toString(),
        expected: nanopaymentAmount.toString()
      });
      throw new Error("Payment verification failed — please try again");
    }

    // 6. Refresh balance
    const newBalance = await getWalletBalance(address);
    console.log("New balance after payment:", newBalance);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refresh-wallet-stats", { detail: { newBalance, remaining: 0 } }));
    }

    return { success: true, paid: true, remaining: 0, txHash, newBalance };

  } catch (err: any) {
    console.error("checkAndPayIfNeeded error:", err);
    return { success: false, paid: false, remaining: 0, error: toUserFacingPaymentError(err) };
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
      console.log('Approving max allowance for audit payments');
      const { tx: approveTx } = await sendTransactionWithRetry(
        () => usdcContract.approve(CMO_CONTRACT_ADDRESS!, ethers.MaxUint256),
        'approveAudit'
      );
      console.log('Approved for audit:', approveTx.hash);
    }

    // Execute $15 payment
    console.log('Executing payForAudit...');
    const { tx: paymentTx, receipt } = await sendTransactionWithRetry(
      () => cmoContract.payForAudit(address),
      'payForAudit'
    );
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
      error: toUserFacingPaymentError(err) 
    };
  }
}

export async function payForSubscription(
  walletClient: any,
  address: string,
  amountInUSDC: string
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

    const decimals: number = Number(await usdcContract.decimals());
    const paymentAmount = ethers.parseUnits(amountInUSDC, decimals);

    const balanceBefore: bigint = await usdcContract.balanceOf(address);
    
    if (balanceBefore < paymentAmount) {
      return { success: false, error: "insufficient_balance" };
    }

    if (!SERVER_WALLET_ADDRESS) {
      throw new Error("Server wallet address not configured");
    }

    console.log(`Transferring ${amountInUSDC} USDC for subscription to`, SERVER_WALLET_ADDRESS);
    const { tx: paymentTx, receipt } = await sendTransactionWithRetry(
      () => usdcContract.transfer(SERVER_WALLET_ADDRESS, paymentAmount),
      "subscription-transfer"
    );
    const txHash = receipt?.hash || paymentTx.hash;

    const newBalance = await getWalletBalance(address);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refresh-wallet-stats", { detail: { newBalance, remaining: 0 } }));
    }

    return { success: true, txHash };
  } catch (err: any) {
    console.error("Subscription payment error:", err);
    return { success: false, error: toUserFacingPaymentError(err) };
  }
}