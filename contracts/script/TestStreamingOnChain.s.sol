// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleEscrow.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface ISablierLockupView {
    function getRecipient(uint256 streamId) external view returns (address);
    function getSender(uint256 streamId) external view returns (address);
    function getDepositedAmount(uint256 streamId) external view returns (uint128);
    function withdrawableAmountOf(uint256 streamId) external view returns (uint128);
}

/**
 * @title TestStreamingOnChain
 * @notice Execute actual streaming milestone on Sepolia to verify Sablier V3 integration
 * @dev Creates a project with streaming milestone, funds it, and approves to create stream
 *
 * IMPORTANT: This requires TWO funded wallets
 * - PRIVATE_KEY: Freelancer wallet (creates project)
 * - CLIENT_PRIVATE_KEY: Client wallet (funds and approves)
 *
 * Run with: forge script script/TestStreamingOnChain.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
 */
contract TestStreamingOnChain is Script {
    // Deployed Sepolia addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x0DF0E3024350ea0992a7485aDbDE425a79983c09;
    address constant TWINKLE_ESCROW = 0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931;
    address constant SABLIER_LOCKUP = 0x6b0307b4338f2963A62106028E3B074C2c0510DA;

    ITestMNEE mnee;
    TwinkleCore core;
    TwinkleEscrow escrow;
    ISablierLockupView sablier;

    function run() external {
        // Get both private keys
        uint256 freelancerPrivateKey = vm.envUint("PRIVATE_KEY");
        address freelancer = vm.addr(freelancerPrivateKey);

        // For client, we'll use a second private key if available, otherwise derive one
        uint256 clientPrivateKey;
        address client;

        try vm.envUint("CLIENT_PRIVATE_KEY") returns (uint256 pk) {
            clientPrivateKey = pk;
            client = vm.addr(clientPrivateKey);
        } catch {
            // If no CLIENT_PRIVATE_KEY, we'll use freelancer as both (for demo purposes)
            // This won't work for the full flow but will show the setup
            console.log("WARNING: CLIENT_PRIVATE_KEY not set. Using alternate test approach.");
            clientPrivateKey = freelancerPrivateKey;
            client = address(0x1234567890123456789012345678901234567890);
        }

        mnee = ITestMNEE(TESTMNEE_PROXY);
        core = TwinkleCore(TWINKLE_CORE);
        escrow = TwinkleEscrow(TWINKLE_ESCROW);
        sablier = ISablierLockupView(SABLIER_LOCKUP);

        console.log("========================================");
        console.log("  SABLIER V3 STREAMING ON-CHAIN TEST");
        console.log("========================================");
        console.log("Freelancer:", freelancer);
        console.log("Client:", client);
        console.log("Sablier V3:", SABLIER_LOCKUP);
        console.log("TwinkleEscrow:", TWINKLE_ESCROW);

        // Step 1: Freelancer creates project with streaming milestone
        console.log("\n[STEP 1] Freelancer creates project with streaming milestone...");

        vm.startBroadcast(freelancerPrivateKey);

        bytes32 projectId = keccak256(abi.encodePacked("sablier-stream-test-", block.timestamp, blockhash(block.number - 1)));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 200 * 1e18; // 200 MNEE with 7-day stream

        uint32[] memory durations = new uint32[](1);
        durations[0] = 7; // 7-day stream duration

        escrow.createProject(
            projectId,
            client,                                         // client
            address(0),                                     // no split
            TwinkleEscrow.DisputeResolution.None,          // no disputes
            address(0),                                     // no arbitrator
            0,                                              // no arbitrator fee
            7,                                              // 7-day auto-approval
            amounts,
            durations
        );

        console.log("Project created with ID:", vm.toString(projectId));

        vm.stopBroadcast();

        // Step 2: Client funds the project
        console.log("\n[STEP 2] Client funds project...");

        vm.startBroadcast(clientPrivateKey);

        // Approve escrow to spend MNEE
        mnee.approve(TWINKLE_ESCROW, type(uint256).max);
        console.log("Client approved escrow");

        uint256 clientBalance = mnee.balanceOf(client);
        console.log("Client MNEE balance:", clientBalance / 1e18);

        if (clientBalance >= 200 * 1e18) {
            escrow.fundProject(projectId);
            console.log("Project funded with 200 MNEE");
        } else {
            console.log("ERROR: Client needs more MNEE. Use faucet first.");
            console.log("Run: cast send TESTMNEE_PROXY 'faucet(address,uint256)' CLIENT_ADDRESS 500000000000000000000");
            vm.stopBroadcast();
            return;
        }

        vm.stopBroadcast();

        // Step 3: Freelancer requests milestone
        console.log("\n[STEP 3] Freelancer requests milestone...");

        vm.startBroadcast(freelancerPrivateKey);

        escrow.requestMilestone(projectId, 0);
        console.log("Milestone 0 requested");

        vm.stopBroadcast();

        // Step 4: Client approves milestone (creates Sablier stream)
        console.log("\n[STEP 4] Client approves milestone (creates Sablier stream)...");

        vm.startBroadcast(clientPrivateKey);

        escrow.approveMilestone(projectId, 0);
        console.log("Milestone 0 approved - Sablier stream should be created!");

        vm.stopBroadcast();

        // Step 5: Verify stream was created
        console.log("\n[STEP 5] Verifying stream...");

        TwinkleEscrow.Milestone memory milestone = escrow.getMilestone(projectId, 0);

        if (milestone.streamId > 0) {
            console.log("SUCCESS! Stream created with ID:", milestone.streamId);
            console.log("View on Sablier: https://app.sablier.com/stream/SEP:0x6b0307b4338f2963A62106028E3B074C2c0510DA-", milestone.streamId);

            // Get stream details
            address streamRecipient = sablier.getRecipient(milestone.streamId);
            uint128 depositedAmount = sablier.getDepositedAmount(milestone.streamId);

            console.log("\nStream Details:");
            console.log("  Recipient:", streamRecipient);
            console.log("  Deposited Amount:", depositedAmount / 1e18, "MNEE");
            console.log("  Duration: 7 days");
        } else {
            console.log("WARNING: Stream ID is 0. Check transaction logs.");
        }

        console.log("\n========================================");
        console.log("  ON-CHAIN SABLIER TEST COMPLETE");
        console.log("========================================");
    }
}
