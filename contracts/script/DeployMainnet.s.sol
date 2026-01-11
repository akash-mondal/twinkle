// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinklePay.sol";
import "../src/twinkle/TwinkleSplit.sol";
import "../src/twinkle/TwinkleEscrow.sol";
import "../src/twinkle/TwinkleSubscription.sol";
import "../src/twinkle/TwinkleX402.sol";

/**
 * @title DeployMainnet
 * @notice Deploys all Twinkle contracts to Ethereum Mainnet
 * @dev Run with: forge script script/DeployMainnet.s.sol:DeployMainnet --rpc-url $ETH_RPC_URL --broadcast --verify
 */
contract DeployMainnet is Script {
    // Mainnet addresses (verified)
    address constant MNEE_TOKEN = 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF;
    address constant SABLIER_LOCKUP = 0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Treasury address - SET THIS TO YOUR MULTISIG OR TREASURY
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        // Facilitator address for x402 - SET THIS TO YOUR FACILITATOR WALLET
        address facilitator = vm.envOr("FACILITATOR_ADDRESS", deployer);

        console.log("=== Mainnet Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Treasury:", treasury);
        console.log("Facilitator:", facilitator);
        console.log("MNEE Token:", MNEE_TOKEN);
        console.log("Sablier V3 Lockup:", SABLIER_LOCKUP);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy TwinkleCore
        TwinkleCore core = new TwinkleCore(
            MNEE_TOKEN,       // MNEE token
            treasury,         // Treasury for fees
            SABLIER_LOCKUP    // Sablier V3 Lockup for streaming
        );
        console.log("TwinkleCore deployed at:", address(core));

        // 2. Deploy TwinklePay
        TwinklePay pay = new TwinklePay(address(core));
        console.log("TwinklePay deployed at:", address(pay));

        // 3. Deploy TwinkleSplit
        TwinkleSplit split = new TwinkleSplit(address(core));
        console.log("TwinkleSplit deployed at:", address(split));

        // 4. Deploy TwinkleEscrow
        TwinkleEscrow escrow = new TwinkleEscrow(address(core));
        console.log("TwinkleEscrow deployed at:", address(escrow));

        // 5. Deploy TwinkleSubscription
        TwinkleSubscription subscription = new TwinkleSubscription(address(core));
        console.log("TwinkleSubscription deployed at:", address(subscription));

        // 6. Deploy TwinkleX402
        TwinkleX402 x402 = new TwinkleX402(
            address(core),
            facilitator,      // Facilitator wallet for settling payments
            address(pay)      // TwinklePay for paywall integration
        );
        console.log("TwinkleX402 deployed at:", address(x402));

        // 7. Register contracts in TwinkleCore
        core.registerContract(keccak256("TwinklePay"), address(pay));
        core.registerContract(keccak256("TwinkleSplit"), address(split));
        core.registerContract(keccak256("TwinkleEscrow"), address(escrow));
        core.registerContract(keccak256("TwinkleSubscription"), address(subscription));
        core.registerContract(keccak256("TwinkleX402"), address(x402));

        vm.stopBroadcast();

        console.log("");
        console.log("=== MAINNET DEPLOYMENT SUMMARY ===");
        console.log("Chain ID: 1 (Ethereum Mainnet)");
        console.log("");
        console.log("External Dependencies:");
        console.log("  MNEE Token:      ", MNEE_TOKEN);
        console.log("  Sablier Lockup:  ", SABLIER_LOCKUP);
        console.log("");
        console.log("Twinkle Contracts:");
        console.log("  TwinkleCore:         ", address(core));
        console.log("  TwinklePay:          ", address(pay));
        console.log("  TwinkleSplit:        ", address(split));
        console.log("  TwinkleEscrow:       ", address(escrow));
        console.log("  TwinkleSubscription: ", address(subscription));
        console.log("  TwinkleX402:         ", address(x402));
        console.log("");
        console.log("Configuration:");
        console.log("  Treasury:     ", treasury);
        console.log("  Facilitator:  ", facilitator);
        console.log("");
        console.log("IMPORTANT: Update backend/packages/shared/src/constants/addresses.ts");
        console.log("with the above addresses before running the backend on mainnet.");
    }
}
