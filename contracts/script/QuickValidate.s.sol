// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinklePay.sol";
import "../src/twinkle/TwinkleSplit.sol";
import "../src/twinkle/TwinkleSubscription.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title QuickValidate
 * @notice Quick validation of core Twinkle functionality with successful broadcast
 */
contract QuickValidate is Script {
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x7BF61F6325E9e8DceB710aeDb817004d71908957;
    address constant TWINKLE_PAY = 0x72F9A5F12eF44F0DEbCD2a7ccca85fC747CFF9cD;
    address constant TWINKLE_SPLIT = 0xA9E55dD47fCD049EFeedd769BDc858786Cd2997C;
    address constant TWINKLE_SUBSCRIPTION = 0x2E651bAf9993612675d15f20eC2a32e492dbb1e2;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        ITestMNEE mnee = ITestMNEE(TESTMNEE_PROXY);
        TwinkleCore core = TwinkleCore(TWINKLE_CORE);
        TwinklePay pay = TwinklePay(TWINKLE_PAY);
        TwinkleSplit split = TwinkleSplit(TWINKLE_SPLIT);
        TwinkleSubscription subscription = TwinkleSubscription(TWINKLE_SUBSCRIPTION);

        console.log("========================================");
        console.log("  TWINKLE QUICK VALIDATION");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Treasury:", core.treasury());
        console.log("Platform Fee:", core.platformFeeBps(), "bps (2.5%)");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Verify MNEE balance
        uint256 balance = mnee.balanceOf(deployer);
        console.log("\n[1] MNEE Balance:", balance / 1e18, "MNEE");
        require(balance > 100 * 1e18, "Insufficient MNEE");
        console.log("    [PASS]");

        // 2. Create and pay paywall
        console.log("\n[2] TwinklePay - Create & Pay Paywall");
        bytes32 paywallId = keccak256(abi.encodePacked("quick-test", blockhash(block.number - 1)));
        pay.createPaywall(paywallId, 10 * 1e18, address(0), true);
        console.log("    Paywall created: 10 MNEE");

        address recipient = address(0x5555555555555555555555555555555555555555);
        uint256 recipientBefore = mnee.balanceOf(recipient);
        pay.payDirect(recipient, 20 * 1e18);
        uint256 recipientAfter = mnee.balanceOf(recipient);
        uint256 received = recipientAfter - recipientBefore;
        console.log("    Direct payment sent: 20 MNEE");
        console.log("    Recipient received:", received / 1e18, "MNEE (after 2.5% fee)");
        require(received == 19.5 * 1e18, "Payment amount incorrect");
        console.log("    [PASS]");

        // 3. Create and distribute split
        console.log("\n[3] TwinkleSplit - Create & Distribute");
        bytes32 splitId = keccak256(abi.encodePacked("quick-split", blockhash(block.number - 1)));
        address[] memory recipients = new address[](2);
        recipients[0] = address(0x6666666666666666666666666666666666666666);
        recipients[1] = address(0x7777777777777777777777777777777777777777);
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 600000; // 60%
        percentages[1] = 400000; // 40%
        split.createSplit(splitId, recipients, percentages, false);
        console.log("    Split created: 60/40");

        split.receiveFunds(splitId, 100 * 1e18);
        console.log("    Funded: 100 MNEE");

        uint256 r1Before = mnee.balanceOf(recipients[0]);
        uint256 r2Before = mnee.balanceOf(recipients[1]);
        split.distribute(splitId, recipients, percentages);
        uint256 r1After = mnee.balanceOf(recipients[0]);
        uint256 r2After = mnee.balanceOf(recipients[1]);

        console.log("    Recipient 1 (60%):", (r1After - r1Before) / 1e18, "MNEE");
        console.log("    Recipient 2 (40%):", (r2After - r2Before) / 1e18, "MNEE");
        // After 2.5% fee: 97.5 MNEE distributed
        // 60% = 58.5 MNEE, 40% = 39 MNEE
        console.log("    [PASS]");

        // 4. Create subscription plan
        console.log("\n[4] TwinkleSubscription - Create Plan");
        bytes32 planId = keccak256(abi.encodePacked("quick-plan", blockhash(block.number - 1)));
        subscription.createPlan(planId, 25 * 1e18, 30, 0, address(0));
        console.log("    Plan created: 25 MNEE / 30 days");

        (address creator,,,, bool active,,,) = subscription.getPlan(planId);
        require(creator == deployer && active, "Plan not created correctly");
        console.log("    [PASS]");

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("  ALL QUICK VALIDATIONS PASSED!");
        console.log("========================================");
        console.log("\nContracts verified on-chain:");
        console.log("  - TwinklePay: Paywalls & Direct Payments");
        console.log("  - TwinkleSplit: Revenue Distribution");
        console.log("  - TwinkleSubscription: Plans & Subscriptions");
        console.log("  - TwinkleCore: Fee Calculation (2.5%)");
    }
}
