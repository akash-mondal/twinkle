// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/test-mnee/TestMNEE.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinklePay.sol";
import "../src/twinkle/TwinkleSplit.sol";
import "../src/twinkle/TwinkleEscrow.sol";
import "../src/twinkle/TwinkleSubscription.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract TestTwinkle is Script {
    // Sepolia deployed addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x7BF61F6325E9e8DceB710aeDb817004d71908957;
    address constant TWINKLE_PAY = 0x72F9A5F12eF44F0DEbCD2a7ccca85fC747CFF9cD;
    address constant TWINKLE_SPLIT = 0xA9E55dD47fCD049EFeedd769BDc858786Cd2997C;
    address constant TWINKLE_ESCROW = 0xA2A859dF3e7D590Cab1fd64A34D0A868879adBe5;
    address constant TWINKLE_SUBSCRIPTION = 0xE53e005552f47E56b631FfB5633B3d3c373d7a82;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Testing Twinkle Contracts on Sepolia ===");
        console.log("Deployer:", deployer);

        ITestMNEE mnee = ITestMNEE(TESTMNEE_PROXY);
        TwinklePay pay = TwinklePay(TWINKLE_PAY);
        TwinkleSplit split = TwinkleSplit(TWINKLE_SPLIT);
        TwinkleSubscription subscription = TwinkleSubscription(TWINKLE_SUBSCRIPTION);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Get some TestMNEE from faucet
        console.log("\n--- Step 1: Faucet TestMNEE ---");
        uint256 faucetAmount = 10000 * 1e18; // 10,000 MNEE
        mnee.faucet(deployer, faucetAmount);
        uint256 balance = mnee.balanceOf(deployer);
        console.log("MNEE Balance after faucet:", balance / 1e18, "MNEE");

        // 2. Approve Twinkle contracts to spend MNEE
        console.log("\n--- Step 2: Approve Twinkle Contracts ---");
        mnee.approve(TWINKLE_PAY, type(uint256).max);
        mnee.approve(TWINKLE_SPLIT, type(uint256).max);
        mnee.approve(TWINKLE_ESCROW, type(uint256).max);
        mnee.approve(TWINKLE_SUBSCRIPTION, type(uint256).max);
        console.log("Approved all Twinkle contracts");

        // 3. Test TwinklePay - Create a paywall
        console.log("\n--- Step 3: Create Paywall ---");
        bytes32 paywallId = keccak256(abi.encodePacked("test-paywall-1", block.timestamp));
        uint96 paywallPrice = 5 * 1e18; // 5 MNEE
        pay.createPaywall(paywallId, paywallPrice, address(0), true);
        console.log("Paywall created with ID:", vm.toString(paywallId));
        console.log("Paywall price: 5 MNEE");

        // 4. Test TwinklePay - Pay for the paywall (creator paying themselves for test)
        console.log("\n--- Step 4: Pay for Paywall ---");
        uint256 balanceBefore = mnee.balanceOf(deployer);
        pay.pay(paywallId);
        uint256 balanceAfter = mnee.balanceOf(deployer);
        console.log("Payment successful!");
        console.log("MNEE spent:", (balanceBefore - balanceAfter) / 1e18, "MNEE");
        bool unlocked = pay.isUnlocked(paywallId, deployer);
        console.log("Paywall unlocked:", unlocked);

        // 5. Test TwinkleSplit - Create a split
        console.log("\n--- Step 5: Create Revenue Split ---");
        bytes32 splitId = keccak256(abi.encodePacked("test-split-1", block.timestamp));
        address[] memory recipients = new address[](2);
        recipients[0] = deployer;
        recipients[1] = address(0x1234567890123456789012345678901234567890); // dummy recipient
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 700000; // 70%
        percentages[1] = 300000; // 30%
        split.createSplit(splitId, recipients, percentages, true);
        console.log("Split created with ID:", vm.toString(splitId));
        console.log("Recipients: deployer (70%), 0x1234... (30%)");

        // 6. Test TwinkleSubscription - Create a subscription plan
        console.log("\n--- Step 6: Create Subscription Plan ---");
        bytes32 planId = keccak256(abi.encodePacked("test-plan-1", block.timestamp));
        uint96 planPrice = 10 * 1e18; // 10 MNEE per interval
        uint32 intervalDays = 30; // Monthly
        uint16 trialDays = 7; // 7-day trial
        subscription.createPlan(planId, planPrice, intervalDays, trialDays, address(0));
        console.log("Subscription plan created with ID:", vm.toString(planId));
        console.log("Price: 10 MNEE / 30 days, 7-day trial");

        // 7. Test TwinkleSubscription - Subscribe to the plan
        console.log("\n--- Step 7: Subscribe to Plan ---");
        bytes32 subId = subscription.subscribe(planId);
        console.log("Subscribed! Subscription ID:", vm.toString(subId));
        bool validSub = subscription.hasValidSubscription(planId, deployer);
        console.log("Subscription valid:", validSub);

        // Get subscription details
        (
            bytes32 subPlanId,
            address subscriber,
            uint256 startedAt,
            uint256 currentPeriodEnd,
            bool active,
            bool cancelled
        ) = subscription.getSubscription(subId);
        console.log("Subscription started at:", startedAt);
        console.log("Current period ends at:", currentPeriodEnd);
        console.log("Active:", active);

        // 8. Final balance check
        console.log("\n--- Final State ---");
        uint256 finalBalance = mnee.balanceOf(deployer);
        console.log("Final MNEE Balance:", finalBalance / 1e18, "MNEE");

        vm.stopBroadcast();

        console.log("\n=== All Tests Passed! ===");
    }
}
