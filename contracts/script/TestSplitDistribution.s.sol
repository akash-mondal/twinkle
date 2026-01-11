// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinklePay.sol";
import "../src/twinkle/TwinkleSplit.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title TestSplitDistribution
 * @notice End-to-end test of split distribution flow on Sepolia
 * @dev Tests: Create split → Receive funds → Distribute → Verify balances
 *
 * Run with: forge script script/TestSplitDistribution.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
 */
contract TestSplitDistribution is Script {
    // Deployed Sepolia addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x0DF0E3024350ea0992a7485aDbDE425a79983c09;
    address constant TWINKLE_PAY = 0xAE1a483ce67a796FcdC7C986CbB556f2975bE190;
    address constant TWINKLE_SPLIT = 0x987c621118D66A1F58C032EBdDe8F4f3385B71E4;

    ITestMNEE mnee;
    TwinkleCore core;
    TwinklePay pay;
    TwinkleSplit split;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        mnee = ITestMNEE(TESTMNEE_PROXY);
        core = TwinkleCore(TWINKLE_CORE);
        pay = TwinklePay(TWINKLE_PAY);
        split = TwinkleSplit(TWINKLE_SPLIT);

        console.log("========================================");
        console.log("  SPLIT DISTRIBUTION E2E TEST");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("TwinkleSplit:", TWINKLE_SPLIT);

        // Define recipients (use deterministic addresses for testing)
        address recipient1 = address(0x1111111111111111111111111111111111111111);
        address recipient2 = address(0x2222222222222222222222222222222222222222);
        address recipient3 = address(0x3333333333333333333333333333333333333333);

        address[] memory recipients = new address[](3);
        recipients[0] = recipient1;
        recipients[1] = recipient2;
        recipients[2] = recipient3;

        uint256[] memory percentages = new uint256[](3);
        percentages[0] = 500000;  // 50%
        percentages[1] = 300000;  // 30%
        percentages[2] = 200000;  // 20%

        // Record initial balances
        uint256 r1BalanceBefore = mnee.balanceOf(recipient1);
        uint256 r2BalanceBefore = mnee.balanceOf(recipient2);
        uint256 r3BalanceBefore = mnee.balanceOf(recipient3);

        console.log("\n[STEP 1] Initial recipient balances:");
        console.log("  Recipient 1 (50%):", r1BalanceBefore / 1e18, "MNEE");
        console.log("  Recipient 2 (30%):", r2BalanceBefore / 1e18, "MNEE");
        console.log("  Recipient 3 (20%):", r3BalanceBefore / 1e18, "MNEE");

        vm.startBroadcast(deployerPrivateKey);

        // Step 2: Create split
        console.log("\n[STEP 2] Creating split...");

        bytes32 splitId = keccak256(abi.encodePacked("split-test-", block.timestamp, blockhash(block.number - 1)));

        split.createSplit(
            splitId,
            recipients,
            percentages,
            true  // mutable
        );

        console.log("Split created with ID:", vm.toString(splitId));
        console.log("Percentages: 50% / 30% / 20%");

        // Step 3: Send funds to split
        console.log("\n[STEP 3] Sending 100 MNEE to split...");

        uint256 fundAmount = 100 * 1e18;

        // Approve split contract
        mnee.approve(TWINKLE_SPLIT, fundAmount);

        // Send funds using receiveFunds
        split.receiveFunds(splitId, fundAmount);

        console.log("Funds sent: 100 MNEE");

        // Step 4: Distribute
        console.log("\n[STEP 4] Distributing to recipients...");

        split.distribute(splitId, recipients, percentages);

        console.log("Distribution complete!");

        vm.stopBroadcast();

        // Step 5: Verify balances
        console.log("\n[STEP 5] Verifying recipient balances...");

        uint256 r1BalanceAfter = mnee.balanceOf(recipient1);
        uint256 r2BalanceAfter = mnee.balanceOf(recipient2);
        uint256 r3BalanceAfter = mnee.balanceOf(recipient3);

        uint256 r1Received = r1BalanceAfter - r1BalanceBefore;
        uint256 r2Received = r2BalanceAfter - r2BalanceBefore;
        uint256 r3Received = r3BalanceAfter - r3BalanceBefore;

        console.log("\nReceived amounts:");
        console.log("  Recipient 1 (50%):", r1Received / 1e18, "MNEE");
        console.log("  Recipient 2 (30%):", r2Received / 1e18, "MNEE");
        console.log("  Recipient 3 (20%):", r3Received / 1e18, "MNEE");

        // Calculate expected (after 2.5% platform fee)
        uint256 netAmount = fundAmount - (fundAmount * 250 / 10000); // 97.5 MNEE
        uint256 expected1 = netAmount * 500000 / 1e6; // 48.75 MNEE
        uint256 expected2 = netAmount * 300000 / 1e6; // 29.25 MNEE
        uint256 expected3 = netAmount * 200000 / 1e6; // 19.50 MNEE

        console.log("\nExpected amounts (after 2.5% fee):");
        console.log("  Recipient 1:", expected1 / 1e18, "MNEE");
        console.log("  Recipient 2:", expected2 / 1e18, "MNEE");
        console.log("  Recipient 3:", expected3 / 1e18, "MNEE");

        // Verify
        bool success = true;
        if (r1Received != expected1) {
            console.log("ERROR: Recipient 1 mismatch!");
            success = false;
        }
        if (r2Received != expected2) {
            console.log("ERROR: Recipient 2 mismatch!");
            success = false;
        }
        if (r3Received != expected3) {
            console.log("ERROR: Recipient 3 mismatch!");
            success = false;
        }

        console.log("\n========================================");
        if (success) {
            console.log("  SPLIT DISTRIBUTION TEST: PASSED");
        } else {
            console.log("  SPLIT DISTRIBUTION TEST: FAILED");
        }
        console.log("========================================");
    }
}
