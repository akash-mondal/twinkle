// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleEscrow.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TestEscrow is Script {
    // Sepolia deployed addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_ESCROW = 0xA2A859dF3e7D590Cab1fd64A34D0A868879adBe5;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        // Use a dummy client address (deployer cannot be both client and freelancer)
        address testClient = address(0xdEADbeEF00000000000000000000000000000001);

        console.log("=== Testing TwinkleEscrow on Sepolia ===");
        console.log("Deployer (freelancer):", deployer);
        console.log("Test Client:", testClient);

        ITestMNEE mnee = ITestMNEE(TESTMNEE_PROXY);
        TwinkleEscrow escrow = TwinkleEscrow(TWINKLE_ESCROW);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Check current MNEE balance (should have from previous tests)
        uint256 balance = mnee.balanceOf(deployer);
        console.log("\n--- Step 1: Check MNEE Balance ---");
        console.log("Current MNEE Balance:", balance / 1e18, "MNEE");

        // Approve escrow contract
        mnee.approve(TWINKLE_ESCROW, type(uint256).max);
        console.log("Approved TwinkleEscrow to spend MNEE");

        // 2. Create an escrow project with milestones
        console.log("\n--- Step 2: Create Escrow Project ---");
        bytes32 projectId = keccak256(abi.encodePacked("escrow-project-1", block.timestamp));

        // Create milestone amounts (3 milestones)
        uint128[] memory milestoneAmounts = new uint128[](3);
        milestoneAmounts[0] = 100 * 1e18; // 100 MNEE
        milestoneAmounts[1] = 200 * 1e18; // 200 MNEE
        milestoneAmounts[2] = 100 * 1e18; // 100 MNEE

        // Stream durations (0 = instant release, >0 = streamed over N days)
        uint32[] memory streamDurations = new uint32[](3);
        streamDurations[0] = 0;  // Instant release
        streamDurations[1] = 30; // 30-day stream
        streamDurations[2] = 0;  // Instant release

        // createProject(id, client, splitAddress, disputeResolution, arbitrator, arbitratorFeeBps, approvalTimeoutDays, milestoneAmounts, streamDurations)
        escrow.createProject(
            projectId,
            testClient,                              // client address
            address(0),                              // no split
            TwinkleEscrow.DisputeResolution.None,    // no dispute resolution
            address(0),                              // no arbitrator
            0,                                       // no arbitrator fee
            14,                                      // 14 day approval timeout
            milestoneAmounts,
            streamDurations
        );
        console.log("Project created with ID:", vm.toString(projectId));
        console.log("Total amount: 400 MNEE across 3 milestones");

        // 3. Check project details
        console.log("\n--- Step 3: Project Details ---");
        (
            address freelancer,
            address client,
            TwinkleEscrow.ProjectStatus status,
            uint256 totalAmount,
            uint256 fundedAmount,
            uint256 releasedAmount,
            uint256 milestoneCount
        ) = escrow.getProject(projectId);

        console.log("Freelancer:", freelancer);
        console.log("Client:", client);
        console.log("Total Amount:", totalAmount / 1e18, "MNEE");
        console.log("Funded Amount:", fundedAmount / 1e18, "MNEE");
        console.log("Released Amount:", releasedAmount / 1e18, "MNEE");
        console.log("Milestone Count:", milestoneCount);
        console.log("Status:", uint256(status), "(0=AwaitingFunding)");

        // 4. Check milestone details
        console.log("\n--- Step 4: Milestone Details ---");
        TwinkleEscrow.Milestone[] memory milestones = escrow.getMilestones(projectId);
        for (uint8 i = 0; i < 3; i++) {
            TwinkleEscrow.Milestone memory m = milestones[i];
            console.log("Milestone", i);
            console.log("  Amount:", m.amount / 1e18, "MNEE");
            console.log("  Stream Duration:", m.streamDurationDays, "days");
            console.log("  Status:", uint256(m.status), "(0=Pending)");
        }

        // Note: To fully test funding and milestone approval, we would need:
        // - A separate transaction from the client address to fund the project
        // - The client would need to call approveMilestone
        // For now, we've validated the project creation works

        console.log("\n--- Final State ---");
        uint256 finalBalance = mnee.balanceOf(deployer);
        console.log("Final MNEE Balance:", finalBalance / 1e18, "MNEE");

        vm.stopBroadcast();

        console.log("\n=== Escrow Test Complete! ===");
        console.log("Note: Full escrow flow requires client to fund project from a different wallet.");
    }
}
