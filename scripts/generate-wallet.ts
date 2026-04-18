import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Generating a random wallet using ethers...");
  const wallet = ethers.Wallet.createRandom();

  console.log("==========================================");
  console.log("🔐 New Wallet Generated Successfully!");
  console.log("==========================================");
  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log("==========================================");

  const envPath = path.resolve(process.cwd(), ".env.local");
  
  const envAdditions = `
# Arc Testnet Deployment Wallet Config
DEPLOYER_ADDRESS=${wallet.address}
DEPLOYER_PRIVATE_KEY=${wallet.privateKey}
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
`;

  if (fs.existsSync(envPath)) {
    let currentEnv = fs.readFileSync(envPath, "utf-8");
    
    // Clean up empty placeholder lines mapping to private keys from previous steps
    currentEnv = currentEnv.replace(/DEPLOYER_PRIVATE_KEY=your_wallet_private_key\n?/g, "");
    currentEnv = currentEnv.replace(/ARC_TESTNET_RPC_URL=https:\/\/rpc\.testnet\.arc\.network\n?/g, "");
    currentEnv = currentEnv.replace(/ARC_CHAIN_ID=5042002\n?/g, "");
    currentEnv = currentEnv.replace(/ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000\n?/g, "");
    
    fs.writeFileSync(envPath, currentEnv + envAdditions);
  } else {
    fs.writeFileSync(envPath, envAdditions);
  }

  console.log("✅ Successfully appended deployment credentials directly to .env.local!");
  console.log("⚠️ IMPORTANT: Go to https://faucet.arc.network (or standard testnet faucet) to fund this new wallet address before running the deployment script!");
}

main().catch(console.error);
