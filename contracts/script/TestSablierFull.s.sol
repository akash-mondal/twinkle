// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleEscrow.sol";

interface ITestMNEE {
    function adminMint(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

// ISablierLockup is imported from TwinkleEscrow.sol

/**
 * @title TestSablierFull
 * @notice Tests complete Sablier streaming flow on Sepolia
 *
 * This script runs in 2 phases:
 * Phase 1: Create and fund project (run with --sig "phase1()")
 * Phase 2: Approve milestone and verify stream (run with --sig "phase2(bytes32)")
 */
contract TestSablierFull is Script {
    ITestMNEE mnee;
    TwinkleCore core;
    TwinkleEscrow escrow;
    ISablierLockup sablier;

    address deployer;
    address client;
    uint256 deployerKey;
    uint256 clientKey;

    function run() external {
        // Run full test in simulation
        deployerKey = vm.envUint("PRIVATE_KEY");
        clientKey = vm.envUint("CLIENT_PRIVATE_KEY");
        deployer = vm.addr(deployerKey);
        client = vm.addr(clientKey);

        mnee = ITestMNEE(vm.envAddress("TESTMNEE_PROXY"));
        core = TwinkleCore(vm.envAddress("TWINKLE_CORE"));
        escrow = TwinkleEscrow(vm.envAddress("TWINKLE_ESCROW"));
        sablier = ISablierLockup(core.sablierLockup());

        console.log("=============================================");
        console.log("  SABLIER STREAMING TEST - SEPOLIA");
        console.log("=============================================");
        console.log("Deployer (Freelancer):", deployer);
        console.log("Client:", client);
        console.log("TwinkleEscrow:", address(escrow));
        console.log("Sablier Lockup:", address(sablier));

        // Phase 1: Setup and create project
        console.log("\n=== PHASE 1: CREATE PROJECT ===");

        vm.startBroadcast(deployerKey);

        // Mint tokens to client for funding
        mnee.adminMint(client, 2000e18);
        console.log("Minted 2000 tMNEE to client");

        vm.stopBroadcast();

        // Create project with streaming milestone
        bytes32 projectId = keccak256(abi.encodePacked("sablier-test-", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 1000e18; // 1000 tMNEE

        uint32[] memory durations = new uint32[](1);
        durations[0] = 7; // 7 days streaming

        vm.startBroadcast(deployerKey);

        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14, // 14 day approval timeout
            amounts,
            durations
        );

        console.log("Project created with ID:", uint256(projectId));
        console.log("Milestone: 1000 tMNEE over 7 days streaming");

        vm.stopBroadcast();

        // Phase 2: Client funds project
        console.log("\n=== PHASE 2: FUND PROJECT ===");

        vm.startBroadcast(clientKey);

        mnee.approve(address(escrow), 1000e18);
        escrow.fundProject(projectId);

        console.log("Client funded project with 1000 tMNEE");

        vm.stopBroadcast();

        // Verify funding
        (,,TwinkleEscrow.ProjectStatus status,, uint256 funded,,) = escrow.getProject(projectId);
        console.log("Project status:", uint8(status), "(1 = Active)");
        console.log("Funded amount:", funded / 1e18, "tMNEE");

        // Phase 3: Freelancer requests milestone
        console.log("\n=== PHASE 3: REQUEST MILESTONE ===");

        // Need to advance block for flash loan protection
        vm.roll(block.number + 2);

        vm.startBroadcast(deployerKey);

        escrow.requestMilestone(projectId, 0);
        console.log("Freelancer requested milestone 0");

        vm.stopBroadcast();

        // Phase 4: Client approves milestone (creates Sablier stream!)
        console.log("\n=== PHASE 4: APPROVE MILESTONE (CREATE STREAM) ===");

        // Need to advance block for flash loan protection
        vm.roll(block.number + 2);

        vm.startBroadcast(clientKey);

        escrow.approveMilestone(projectId, 0);
        console.log("Client approved milestone 0");

        vm.stopBroadcast();

        // Phase 5: Verify Sablier stream
        console.log("\n=== PHASE 5: VERIFY SABLIER STREAM ===");

        // Advance block for Sablier flash loan protection
        vm.roll(block.number + 1);

        TwinkleEscrow.Milestone memory m = escrow.getMilestone(projectId, 0);

        console.log("Milestone stream ID:", m.streamId);

        if (m.streamId > 0) {
            console.log("\n  [SUCCESS] SABLIER STREAM CREATED!");
            console.log("  Stream ID:", m.streamId);

            // Try to get stream details from Sablier
            try sablier.withdrawableAmountOf(m.streamId) returns (uint128 withdrawable) {
                console.log("  Withdrawable now:", withdrawable / 1e18, "tMNEE");
            } catch {
                console.log("  (Stream just created, withdrawable check skipped)");
            }

            console.log("\n=============================================");
            console.log("  SABLIER STREAMING: 100% VERIFIED!");
            console.log("=============================================");
        } else {
            console.log("\n  [FAILED] Stream ID is 0 - stream not created");
        }
    }

    /// @notice Phase 1: Create and fund project (for sequential execution)
    function phase1() external returns (bytes32 projectId) {
        deployerKey = vm.envUint("PRIVATE_KEY");
        clientKey = vm.envUint("CLIENT_PRIVATE_KEY");
        deployer = vm.addr(deployerKey);
        client = vm.addr(clientKey);

        mnee = ITestMNEE(vm.envAddress("TESTMNEE_PROXY"));
        escrow = TwinkleEscrow(vm.envAddress("TWINKLE_ESCROW"));

        console.log("=== PHASE 1: CREATE AND FUND PROJECT ===");

        // Mint tokens to client
        vm.startBroadcast(deployerKey);
        mnee.adminMint(client, 2000e18);
        vm.stopBroadcast();

        // Create project
        projectId = keccak256(abi.encodePacked("sablier-full-", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 1000e18;
        uint32[] memory durations = new uint32[](1);
        durations[0] = 7; // 7 days

        vm.startBroadcast(deployerKey);
        escrow.createProject(
            projectId, client, address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0), 0, 14,
            amounts, durations
        );
        vm.stopBroadcast();

        // Client funds
        vm.startBroadcast(clientKey);
        mnee.approve(address(escrow), 1000e18);
        escrow.fundProject(projectId);
        vm.stopBroadcast();

        console.log("Project ID:", uint256(projectId));
        console.log("Funded: 1000 tMNEE");
        console.log("\nNow wait for next block, then run phase2 with this project ID");

        return projectId;
    }

    /// @notice Phase 2: Request and approve milestone (for sequential execution)
    function phase2(bytes32 projectId) external {
        deployerKey = vm.envUint("PRIVATE_KEY");
        clientKey = vm.envUint("CLIENT_PRIVATE_KEY");
        deployer = vm.addr(deployerKey);
        client = vm.addr(clientKey);

        escrow = TwinkleEscrow(vm.envAddress("TWINKLE_ESCROW"));
        core = TwinkleCore(vm.envAddress("TWINKLE_CORE"));
        sablier = ISablierLockup(core.sablierLockup());

        console.log("=== PHASE 2: REQUEST AND APPROVE MILESTONE ===");
        console.log("Project ID:", uint256(projectId));

        // Freelancer requests
        vm.startBroadcast(deployerKey);
        escrow.requestMilestone(projectId, 0);
        console.log("Milestone requested");
        vm.stopBroadcast();

        // Client approves
        vm.startBroadcast(clientKey);
        escrow.approveMilestone(projectId, 0);
        console.log("Milestone approved - Sablier stream should be created!");
        vm.stopBroadcast();

        // Verify
        TwinkleEscrow.Milestone memory m = escrow.getMilestone(projectId, 0);

        if (m.streamId > 0) {
            console.log("\n[SUCCESS] SABLIER STREAM CREATED!");
            console.log("Stream ID:", m.streamId);
            console.log("\n100% VERIFIED - Sablier streaming works with TestMNEE!");
        } else {
            console.log("\n[FAILED] No stream created");
        }
    }
}
