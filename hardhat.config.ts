import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC_URL = process.env.ARC_TESTNET_RPC_URL || "";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config = defineConfig({
  plugins: [hardhatEthers],
  solidity: "0.8.20",
  networks: {
    arcTestnet: {
      type: "http",
      url: RPC_URL,
      chainId: 5042002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
    },
  },
});

export default config;
