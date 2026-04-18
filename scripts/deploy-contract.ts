const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const solc = require("solc");

async function main() {
  const RPC_URL = process.env.ARC_TESTNET_RPC_URL;
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS;

  if (!RPC_URL || !PRIVATE_KEY || PRIVATE_KEY === "your_wallet_private_key" || !USDC_ADDRESS) {
    console.error("Missing critical environment variables required for deployment.");
    console.error("Please configure ARC_TESTNET_RPC_URL, DEPLOYER_PRIVATE_KEY, and ARC_USDC_ADDRESS.");
    process.exit(1);
  }

  console.log(`Connecting to Arc Testnet via ethers...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Deployer Account: ${wallet.address}`);

  const contractPath = path.resolve(__dirname, "../contracts/CMOPayment.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "CMOPayment.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  console.log("Compiling smart contract using solc...");
  const compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));

  if (compiledCode.errors) {
    const isFatal = compiledCode.errors.some((error: any) => error.severity === "error");
    compiledCode.errors.forEach((error: any) => console.log(error.formattedMessage));
    if (isFatal) {
      console.error("Failed to compile contract!");
      process.exit(1);
    }
  }

  const contractFile = compiledCode.contracts["CMOPayment.sol"]["CMOPayment"];
  const abi = contractFile.abi;
  const bytecode = contractFile.evm.bytecode.object;

  console.log("Contract compiled successfully. Deploying to Arc Testnet...");
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // Deploying contract passing the USDC address constructor parameter
  const contract = await factory.deploy(USDC_ADDRESS);
  await contract.waitForDeployment();
  
  const deployedAddress = await contract.getAddress();
  console.log(`\n🎉 Success! CMOPayment deployed to testnet at: ${deployedAddress}`);
  console.log(`\nNext Steps: Ensure you copy this address and paste it into CMO_CONTRACT_ADDRESS in .env.local!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
