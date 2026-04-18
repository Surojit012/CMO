import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const { ethers } = await network.connect();

  const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS || process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS;
  if (!USDC_ADDRESS) {
    throw new Error("ARC_USDC_ADDRESS is not defined in .env.local");
  }

  console.log("Deploying CMOPayment contract to Arc Testnet using Hardhat...");
  const CMOPayment = await ethers.getContractFactory("CMOPayment");
  
  const paymentContract = await CMOPayment.deploy(USDC_ADDRESS);
  await paymentContract.waitForDeployment();
  
  const deployedAddress = await paymentContract.getAddress();
  console.log(`🎉 CMOPayment successfully deployed via Hardhat to: ${deployedAddress}`);

  // Automatically update .env.local
  const envPath = path.resolve(process.cwd(), ".env.local");
  const upsertEnvVar = (content: string, key: string, value: string) => {
    const keyRegex = new RegExp(`^${key}=.*$`, "m");
    if (keyRegex.test(content)) {
      return content.replace(keyRegex, `${key}=${value}`);
    }
    const suffix = content.endsWith("\n") ? "" : "\n";
    return `${content}${suffix}${key}=${value}\n`;
  };

  if (fs.existsSync(envPath)) {
    let currentEnv = fs.readFileSync(envPath, "utf-8");
    currentEnv = upsertEnvVar(currentEnv, "CMO_CONTRACT_ADDRESS", deployedAddress);
    currentEnv = upsertEnvVar(currentEnv, "NEXT_PUBLIC_CMO_CONTRACT_ADDRESS", deployedAddress);
    fs.writeFileSync(envPath, currentEnv);
    console.log("✅ Updated CMO_CONTRACT_ADDRESS and NEXT_PUBLIC_CMO_CONTRACT_ADDRESS in .env.local");
  } else {
    fs.writeFileSync(
      envPath,
      `CMO_CONTRACT_ADDRESS=${deployedAddress}\nNEXT_PUBLIC_CMO_CONTRACT_ADDRESS=${deployedAddress}\n`
    );
    console.log("✅ Created .env.local with CMO_CONTRACT_ADDRESS and NEXT_PUBLIC_CMO_CONTRACT_ADDRESS");
  }

  console.log(`\nNEW_CMO_CONTRACT_ADDRESS=${deployedAddress}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
