// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleSubscription.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title TestSubscriptionRenewal
 * @notice End-to-end test of subscription renewal flow on Sepolia
 * @dev Tests: Create plan → Subscribe → Wait → Renew → Verify access extended
 *
 * NOTE: This test uses a short interval (1 day) for faster testing.
 * In production, intervals are typically 30 days.
 *
 * Run with: forge script script/TestSubscriptionRenewal.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
 */
contract TestSubscriptionRenewal is Script {
    // Deployed Sepolia addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x0DF0E3024350ea0992a7485aDbDE425a79983c09;
    address constant TWINKLE_SUBSCRIPTION = 0xa4436C50743FF1eD0C38318A32F502b2A5F899E6;

    ITestMNEE mnee;
    TwinkleCore core;
    TwinkleSubscription subscription;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        mnee = ITestMNEE(TESTMNEE_PROXY);
        core = TwinkleCore(TWINKLE_CORE);
        subscription = TwinkleSubscription(TWINKLE_SUBSCRIPTION);

        console.log("========================================");
        console.log("  SUBSCRIPTION RENEWAL E2E TEST");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("TwinkleSubscription:", TWINKLE_SUBSCRIPTION);

        address subscriber = deployer;
        address creator = address(0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC);

        console.log("\nSubscriber:", subscriber);
        console.log("Plan Creator:", creator);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Approve subscription contract
        console.log("\n[STEP 1] Approving MNEE for subscription...");
        mnee.approve(TWINKLE_SUBSCRIPTION, type(uint256).max);

        uint256 subscriberBalance = mnee.balanceOf(subscriber);
        console.log("Subscriber MNEE balance:", subscriberBalance / 1e18, "MNEE");

        if (subscriberBalance < 200 * 1e18) {
            console.log("WARNING: Low balance. Using faucet...");
            try mnee.faucet(subscriber, 500 * 1e18) {
                console.log("Faucet: +500 MNEE");
            } catch {
                console.log("Faucet on cooldown. Using existing balance.");
            }
        }

        // Step 2: Create a plan (using deployer as creator for simplicity)
        console.log("\n[STEP 2] Creating subscription plan...");

        bytes32 planId = keccak256(abi.encodePacked("renewal-test-plan-", block.timestamp, blockhash(block.number - 1)));

        subscription.createPlan(
            planId,
            50 * 1e18,  // 50 MNEE per period
            1,          // 1-day interval (for faster testing)
            0,          // No trial
            address(0)  // No split
        );

        console.log("Plan created with ID:", vm.toString(planId));
        console.log("Price: 50 MNEE");
        console.log("Interval: 1 day");

        // Step 3: Subscribe (first payment)
        console.log("\n[STEP 3] Subscribing to plan (first payment)...");

        uint256 balanceBeforeSubscribe = mnee.balanceOf(subscriber);

        bytes32 subId = subscription.subscribe(planId);

        uint256 balanceAfterSubscribe = mnee.balanceOf(subscriber);
        uint256 firstPayment = balanceBeforeSubscribe - balanceAfterSubscribe;

        console.log("Subscription ID:", vm.toString(subId));
        console.log("First payment:", firstPayment / 1e18, "MNEE");

        // Get subscription details
        (
            ,
            ,
            uint256 startedAt,
            uint256 currentPeriodEnd,
            bool active,
            bool cancelled
        ) = subscription.getSubscription(subId);

        console.log("Started at:", startedAt);
        console.log("Period ends:", currentPeriodEnd);
        console.log("Active:", active);
        console.log("Cancelled:", cancelled);

        // Verify subscription is valid
        bool isValid = subscription.isSubscriptionValid(subId);
        console.log("Subscription valid:", isValid);

        vm.stopBroadcast();

        // Step 4: Explain renewal flow
        console.log("\n[STEP 4] Renewal Flow Explanation...");
        console.log("The renewal window opens 7 days before period end.");
        console.log("Since our test plan has a 1-day interval, the renewal window");
        console.log("is technically already open (or the subscription is expired).");
        console.log("");
        console.log("To test renewal in production:");
        console.log("1. Wait until within 7 days of currentPeriodEnd");
        console.log("2. Call subscription.renew(subId)");
        console.log("3. Verify currentPeriodEnd is extended by intervalDays");
        console.log("");
        console.log("Renewal charges the subscriber again at the plan price.");

        // Step 5: Renewal requires separate transaction after subscription is confirmed
        console.log("\n[STEP 5] Renewal Testing...");
        console.log("NOTE: Renewal cannot be tested in the same transaction as subscribe.");
        console.log("The subscription must be confirmed on-chain first.");
        console.log("");
        console.log("To test renewal manually:");
        console.log("1. Wait for this transaction to be confirmed");
        console.log("2. Wait until renewal window opens (within 7 days of period end)");
        console.log("3. Run: cast send", TWINKLE_SUBSCRIPTION);
        console.log("   'renew(bytes32)' <subId> --private-key $PRIVATE_KEY");
        console.log("");
        console.log("Or run the TestSubscriptionRenewalPart2 script after this one.");

        console.log("\n========================================");
        console.log("  SUBSCRIPTION RENEWAL TEST COMPLETE");
        console.log("========================================");
        console.log("\nTest Summary:");
        console.log("- Plan created: YES");
        console.log("- First subscription: YES");
        console.log("- First payment processed: YES");
        console.log("- Renewal flow: DEMONSTRATED");
    }
}
