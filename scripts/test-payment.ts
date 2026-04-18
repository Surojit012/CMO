import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const RPC_URL = process.env.ARC_TESTNET_RPC_URL;
  const ADDRESS = process.env.DEPLOYER_ADDRESS;
  const PK = process.env.DEPLOYER_PRIVATE_KEY;
  const CONTRACT = process.env.CMO_CONTRACT_ADDRESS;
  const USDC = process.env.ARC_USDC_ADDRESS;

  if (!PK || !CONTRACT || !USDC) {
    throw new Error("Missing required credentials in .env.local");
  }

  console.log("=====================================");
  console.log(" 🧪 TESTING CMO SMART CONTRACT");
  console.log("=====================================");
  console.log(`Wallet Address:  ${ADDRESS}`);
  console.log(`Contract Address: ${CONTRACT}`);
  console.log(`Chain RPC URL:   ${RPC_URL}`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PK, provider);
  
  const cmoAbi = [
    "function useAnalysis(address user) external returns (bool)",
    "function payForAnalysis(address user) external returns (bool)",
    "function getRemainingFree(address user) external view returns (uint256)",
    "function getTimeUntilReset(address user) external view returns (uint256)",
    "function pricePerAnalysis() external view returns (uint256)"
  ];
  
  const usdcAbi = ["function balanceOf(address) view returns (uint256)"];
  
  const cmo = new ethers.Contract(CONTRACT, cmoAbi, wallet);
  const usdcContract = new ethers.Contract(USDC, usdcAbi, provider);

  const bal = await usdcContract.balanceOf(ADDRESS!);
  console.log(`\nUSDC Balance: ${ethers.formatUnits(bal, 6)} USDC`);

  const free = await cmo.getRemainingFree(ADDRESS!);
  console.log(`Free Analyses Left: ${free}`);

  const price = await cmo.pricePerAnalysis();
  console.log(`Paid Analysis Price: ${ethers.formatUnits(price, 6)} USDC\n`);

  console.log("Testing interaction...");
  
  if (free > BigInt(0)) {
    console.log("Using 1 free analysis on-chain...");
    const tx = await cmo.useAnalysis(ADDRESS!);
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Free analysis successfully registered on Arc Testnet.");
    
    const newFree = await cmo.getRemainingFree(ADDRESS!);
    console.log(`Updated Free Analyses Left: ${newFree}`);
  } else {
    console.log("No free analyses remaining.");
    console.log("In the frontend, this will trigger the 'Approve USDC' popup to pay.");
  }

  console.log("\n=====================================");
  console.log(" ✅ TEST PASSED SUCCESSFULLY");
  console.log("=====================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exitCode = 1;
});
