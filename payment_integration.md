# ARC Payment Integration Architecture

## 1. Overview
We did **not** install a specific "ARC SDK" for the payment flows. Since ARC Testnet is an EVM-compatible blockchain, we successfully integrated ARC payments using standard Web3 libraries (like `ethers` and `hardhat`) connecting to the ARC Testnet RPC URL.

## 2. Architecture Flow

The payment flow consists of three main components:

1. **Smart Contract (Solidity)**: Handles logic, limits, and USDC transfers.
2. **Hardhat Toolchain**: Used for compiling and deploying the contract to the ARC network.
3. **Frontend Integration (`ethers.js`)**: Communicates with the contract and the user's wallet.

### Step-by-Step Payment Flow
When a user initiates an action that requires a payment (like triggering an analysis or an audit):

1. **Check Quotas**: The frontend calls the smart contract to check if the user has any free uses remaining (`getRemainingFree`).
   - *If they have free uses*, it calls `useAnalysis` which increments their usage count and proceeds.
2. **Check Price & Balance**: If no free uses remain, the frontend queries the contract for the current price (e.g., $5.00 in USDC) and checks the user's USDC balance.
   - *If the balance is insufficient*, the flow aborts with an error.
3. **Check & Approve Allowance**: The frontend checks the ERC-20 token allowance. If the contract doesn't have permission to spend the user's USDC, an `approve` transaction is triggered for `ethers.MaxUint256`.
4. **Execute Payment**: The frontend triggers the payment function (`payForAnalysis` or `payForAudit`) on the contract. The contract uses `transferFrom` to pull the USDC from the user to the contract owner.
5. **Verify Deduction**: After the transaction settles, the frontend checks the wallet's new balance to verify the correct amount was deducted, completing the payment flow successfully.

---

## 3. How to Manually Implement This in Other Projects

If you need to replicate this architecture in a new project, follow these steps:

### Phase 1: Smart Contract Setup
1. **Initialize Hardhat**: Run `npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers` and `npx hardhat init`.
2. **Configure Network**: In `hardhat.config.ts`, add the ARC network settings:
   ```typescript
   networks: {
     arcTestnet: {
       url: "https://rpc.testnet.arc.network", // ARC RPC URL
       chainId: 5042002,                       // ARC Chain ID
       accounts: [process.env.PRIVATE_KEY]
     }
   }
   ```
3. **Write the Contract**: Create a Solidity contract that interfaces with an ERC-20 token (like USDC) using `transferFrom`.
4. **Deploy**: Write a deployment script in `scripts/deploy.ts` and run it:
   ```bash
   npx hardhat run scripts/deploy.ts --network arcTestnet
   ```

### Phase 2: Frontend Integration
1. **Install Web3 Library**: Install `ethers` (`npm install ethers`).
2. **Define Constants**: Store your deployed contract address, the ARC RPC URL, and the USDC contract address in your environment variables.
3. **Create the Payment Client**: 
   - Instantiate a provider (`new ethers.BrowserProvider(walletClient)`).
   - Instantiate your contract instances for both your custom contract and the USDC token using their ABIs.
4. **Implement Payment Logic**:
   - Query `usdcContract.balanceOf(address)` to ensure funds.
   - Query `usdcContract.allowance(address, contractAddress)` to ensure spend permission.
   - If allowance is low, call `usdcContract.approve(contractAddress, amount)`.
   - Call your custom contract's payment function.
   - Wait for the receipt: `await tx.wait()`.
