// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleEscrow.sol";
import "./mocks/MockSablier.sol";

interface ITestMNEE {
    function faucet(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title TwinkleEscrowTest
 * @notice Fork tests for complete escrow flow with Sablier streaming
 * @dev Uses vm.prank() to simulate multiple wallets
 */
contract TwinkleEscrowTest is Test {
    // Deployed Sepolia addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x0DF0E3024350ea0992a7485aDbDE425a79983c09;
    address constant TWINKLE_ESCROW = 0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931;
    address constant SABLIER_LOCKUP = 0x6b0307b4338f2963A62106028E3B074C2c0510DA;

    ITestMNEE mnee;
    TwinkleCore core;
    TwinkleEscrow escrow;

    // Test actors
    address deployer = 0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465;
    address client = address(0x1111111111111111111111111111111111111111);
    address freelancer = address(0x2222222222222222222222222222222222222222);
    address treasury;

    function setUp() public {
        // Fork Sepolia at current block
        vm.createSelectFork(vm.envString("SEPOLIA_RPC_URL"));

        mnee = ITestMNEE(TESTMNEE_PROXY);
        core = TwinkleCore(TWINKLE_CORE);
        escrow = TwinkleEscrow(TWINKLE_ESCROW);
        treasury = core.treasury();

        // Use deal to set token balances directly (bypasses faucet cooldown)
        // For upgradeable proxy, we need to deal to the implementation's storage
        deal(TESTMNEE_PROXY, client, 10000 * 1e18);
        deal(TESTMNEE_PROXY, freelancer, 1000 * 1e18);

        // Approve escrow contract
        vm.prank(client);
        mnee.approve(TWINKLE_ESCROW, type(uint256).max);

        vm.prank(freelancer);
        mnee.approve(TWINKLE_ESCROW, type(uint256).max);
    }

    function testCompleteEscrowFlow_InstantRelease() public {
        // 1. Freelancer creates project
        bytes32 projectId = keccak256(abi.encodePacked("test-project-instant", block.timestamp));

        uint128[] memory amounts = new uint128[](2);
        amounts[0] = 100 * 1e18; // Milestone 1: 100 MNEE
        amounts[1] = 200 * 1e18; // Milestone 2: 200 MNEE

        uint32[] memory durations = new uint32[](2);
        durations[0] = 0; // Instant release
        durations[1] = 0; // Instant release

        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0), // No split
            TwinkleEscrow.DisputeResolution.None,
            address(0), // No arbitrator
            0, // No deposit
            14, // 14 day auto-approval
            amounts,
            durations
        );

        // Verify project created
        (
            address pFreelancer,
            address pClient,
            TwinkleEscrow.ProjectStatus status,
            uint256 totalAmount,
            uint256 fundedAmount,
            uint256 releasedAmount,
            uint256 milestoneCount
        ) = escrow.getProject(projectId);

        assertEq(pFreelancer, freelancer, "Freelancer should match");
        assertEq(pClient, client, "Client should match");
        assertEq(uint(status), uint(TwinkleEscrow.ProjectStatus.AwaitingFunding), "Status should be AwaitingFunding");
        assertEq(totalAmount, 300 * 1e18, "Total should be 300 MNEE");
        assertEq(milestoneCount, 2, "Should have 2 milestones");

        // 2. Client funds the project
        uint256 clientBalBefore = mnee.balanceOf(client);
        uint256 escrowBalBefore = mnee.balanceOf(TWINKLE_ESCROW);

        vm.prank(client);
        escrow.fundProject(projectId);

        uint256 clientBalAfter = mnee.balanceOf(client);
        uint256 escrowBalAfter = mnee.balanceOf(TWINKLE_ESCROW);

        assertEq(clientBalBefore - clientBalAfter, 300 * 1e18, "Client should pay 300 MNEE");
        assertEq(escrowBalAfter - escrowBalBefore, 300 * 1e18, "Escrow should receive 300 MNEE");

        // Verify status updated
        (, , status, , fundedAmount, , ) = escrow.getProject(projectId);
        assertEq(uint(status), uint(TwinkleEscrow.ProjectStatus.Active), "Status should be Active");
        assertEq(fundedAmount, 300 * 1e18, "Funded amount should be 300 MNEE");

        // 3. Freelancer requests milestone 1 completion
        vm.prank(freelancer);
        escrow.requestMilestone(projectId, 0);

        // Verify milestone status using struct
        TwinkleEscrow.Milestone memory m0 = escrow.getMilestone(projectId, 0);
        assertEq(m0.amount, 100 * 1e18, "Milestone amount should be 100 MNEE");
        assertEq(uint(m0.status), uint(TwinkleEscrow.MilestoneStatus.Requested), "Status should be Requested");

        // 4. Client approves milestone 1
        uint256 freelancerBalBefore = mnee.balanceOf(freelancer);
        uint256 treasuryBalBefore = mnee.balanceOf(treasury);

        vm.prank(client);
        escrow.approveMilestone(projectId, 0);

        uint256 freelancerBalAfter = mnee.balanceOf(freelancer);
        uint256 treasuryBalAfter = mnee.balanceOf(treasury);

        // Verify milestone released
        m0 = escrow.getMilestone(projectId, 0);
        assertEq(uint(m0.status), uint(TwinkleEscrow.MilestoneStatus.Complete), "Status should be Complete");

        // Verify payments (2.5% fee)
        uint256 fee = core.calculateFee(100 * 1e18);
        uint256 netAmount = 100 * 1e18 - fee;

        assertEq(treasuryBalAfter - treasuryBalBefore, fee, "Treasury should receive 2.5 MNEE fee");
        assertEq(freelancerBalAfter - freelancerBalBefore, netAmount, "Freelancer should receive 97.5 MNEE");

        // 5. Complete milestone 2
        vm.prank(freelancer);
        escrow.requestMilestone(projectId, 1);

        freelancerBalBefore = mnee.balanceOf(freelancer);

        vm.prank(client);
        escrow.approveMilestone(projectId, 1);

        freelancerBalAfter = mnee.balanceOf(freelancer);

        // Verify milestone 2 released
        TwinkleEscrow.Milestone memory m1 = escrow.getMilestone(projectId, 1);
        assertEq(uint(m1.status), uint(TwinkleEscrow.MilestoneStatus.Complete), "Milestone 2 should be Complete");

        fee = core.calculateFee(200 * 1e18);
        netAmount = 200 * 1e18 - fee;
        assertEq(freelancerBalAfter - freelancerBalBefore, netAmount, "Freelancer should receive 195 MNEE");

        // 6. Verify project completed
        (, , status, , , releasedAmount, ) = escrow.getProject(projectId);
        assertEq(uint(status), uint(TwinkleEscrow.ProjectStatus.Completed), "Project should be Completed");
        assertEq(releasedAmount, 300 * 1e18, "Released amount should be 300 MNEE");

        emit log_string("[PASS] Complete instant release escrow flow verified");
    }

    /**
     * @notice Test Sablier streaming escrow flow using MockSablier
     * @dev Uses MockSablier to bypass real Sablier's token allowlist requirement
     */
    function testCompleteEscrowFlow_SablierStreaming() public {
        // Deploy MockSablier
        MockSablier mockSablier = new MockSablier();

        // Deploy fresh TwinkleCore with MockSablier
        TwinkleCore localCore = new TwinkleCore(
            TESTMNEE_PROXY,
            treasury,
            address(mockSablier)
        );
        localCore.setPlatformFee(250); // 2.5% fee

        // Deploy fresh TwinkleEscrow with local core
        TwinkleEscrow localEscrow = new TwinkleEscrow(address(localCore));

        // Register escrow as operator
        localCore.setOperator(address(localEscrow), true);

        // Approve local escrow for both actors
        vm.prank(client);
        mnee.approve(address(localEscrow), type(uint256).max);

        vm.prank(freelancer);
        mnee.approve(address(localEscrow), type(uint256).max);

        // Create project with streaming milestone
        bytes32 projectId = keccak256(abi.encodePacked("test-project-stream-mock", block.timestamp));

        uint128[] memory amounts = new uint128[](2);
        amounts[0] = 100 * 1e18; // Milestone 1: 100 MNEE (instant)
        amounts[1] = 200 * 1e18; // Milestone 2: 200 MNEE (30-day stream)

        uint32[] memory durations = new uint32[](2);
        durations[0] = 0;  // Instant release
        durations[1] = 30; // 30-day stream

        vm.prank(freelancer);
        localEscrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14,
            amounts,
            durations
        );

        // Fund project
        vm.prank(client);
        localEscrow.fundProject(projectId);

        // Advance block to bypass flash loan protection
        vm.roll(block.number + 2);

        // Complete milestone 1 (instant)
        vm.prank(freelancer);
        localEscrow.requestMilestone(projectId, 0);

        vm.prank(client);
        localEscrow.approveMilestone(projectId, 0);

        // Advance block for next milestone
        vm.roll(block.number + 2);

        // Complete milestone 2 (streaming)
        vm.prank(freelancer);
        localEscrow.requestMilestone(projectId, 1);

        uint256 freelancerBalBefore = mnee.balanceOf(freelancer);

        vm.prank(client);
        localEscrow.approveMilestone(projectId, 1);

        // Verify streaming milestone created a Sablier stream
        TwinkleEscrow.Milestone memory m1 = localEscrow.getMilestone(projectId, 1);

        // For streaming milestones, status should be Streaming (not Complete)
        assertEq(uint(m1.status), uint(TwinkleEscrow.MilestoneStatus.Streaming), "Milestone should be Streaming");
        assertEq(m1.streamDurationDays, 30, "Stream duration should be 30 days");

        // Streaming milestones MUST have streamId > 0
        assertGt(m1.streamId, 0, "Sablier stream should be created with valid ID");
        emit log_named_uint("[PASS] Sablier stream created with ID", m1.streamId);

        // Freelancer balance shouldn't change immediately (funds are in stream)
        uint256 freelancerBalAfter = mnee.balanceOf(freelancer);
        assertEq(freelancerBalAfter, freelancerBalBefore, "Freelancer shouldn't receive funds immediately");

        // Warp time to test stream withdrawal (15 days = 50% of 30-day stream)
        vm.warp(block.timestamp + 15 days);

        // Calculate expected withdrawable amount
        // Net amount after 2.5% fee: 200 * 0.975 = 195 MNEE
        // After 15 days (50%): 195 * 0.5 = 97.5 MNEE
        uint256 fee = localCore.calculateFee(200 * 1e18);
        uint256 netAmount = 200 * 1e18 - fee;
        uint256 expectedWithdrawable = netAmount / 2; // 50% after 15 days

        uint128 withdrawable = mockSablier.withdrawableAmountOf(m1.streamId);
        assertApproxEqAbs(withdrawable, expectedWithdrawable, 1e15, "Should have ~50% withdrawable after 15 days");
        emit log_named_uint("[PASS] Withdrawable amount after 15 days", withdrawable);

        // Freelancer withdraws from stream
        vm.prank(freelancer);
        mockSablier.withdrawMax(m1.streamId, freelancer);

        uint256 freelancerBalAfterWithdraw = mnee.balanceOf(freelancer);
        assertGt(freelancerBalAfterWithdraw, freelancerBalAfter, "Freelancer should receive funds from stream");
        emit log_named_uint("[PASS] Freelancer withdrew from stream", freelancerBalAfterWithdraw - freelancerBalAfter);

        // Warp to end of stream
        vm.warp(block.timestamp + 16 days);

        // Withdraw remaining
        vm.prank(freelancer);
        mockSablier.withdrawMax(m1.streamId, freelancer);

        uint256 freelancerFinalBal = mnee.balanceOf(freelancer);
        emit log_named_uint("[PASS] Freelancer final balance after full stream", freelancerFinalBal);

        // Verify total received equals net amount
        uint256 totalReceived = freelancerFinalBal - freelancerBalBefore;
        assertApproxEqAbs(totalReceived, netAmount, 1e15, "Total received should equal net amount");

        emit log_string("[PASS] Complete Sablier streaming escrow flow verified with MockSablier");
    }

    function testEscrowWithArbitrator() public {
        address arbitrator = address(0x3333333333333333333333333333333333333333);
        uint16 arbitratorDeposit = 50; // Use smaller value that fits uint16

        bytes32 projectId = keccak256(abi.encodePacked("test-project-arb", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 500 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        // Freelancer creates project with arbitrator
        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.Arbitrator,
            arbitrator,
            arbitratorDeposit,
            14,
            amounts,
            durations
        );

        // Verify arbitrator set
        (address pFreelancer, address pClient, , , , , ) = escrow.getProject(projectId);
        assertEq(pFreelancer, freelancer, "Freelancer should match");
        assertEq(pClient, client, "Client should match");

        emit log_string("[PASS] Project with arbitrator created successfully");
    }

    function testAutoApprovalTimeout() public {
        bytes32 projectId = keccak256(abi.encodePacked("test-auto-approve", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 100 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        // Create with 7-day auto-approval
        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            7, // 7 days auto-approval
            amounts,
            durations
        );

        vm.prank(client);
        escrow.fundProject(projectId);

        vm.prank(freelancer);
        escrow.requestMilestone(projectId, 0);

        // Warp time past auto-approval period
        vm.warp(block.timestamp + 8 days);

        // Trigger auto-approval
        uint256 freelancerBalBefore = mnee.balanceOf(freelancer);

        escrow.triggerAutoApproval(projectId, 0);

        uint256 freelancerBalAfter = mnee.balanceOf(freelancer);

        // Verify milestone was auto-approved
        TwinkleEscrow.Milestone memory m0 = escrow.getMilestone(projectId, 0);
        assertEq(uint(m0.status), uint(TwinkleEscrow.MilestoneStatus.Complete), "Milestone should be Complete after auto-approval");

        // Verify freelancer received funds
        uint256 fee = core.calculateFee(100 * 1e18);
        uint256 netAmount = 100 * 1e18 - fee;
        assertEq(freelancerBalAfter - freelancerBalBefore, netAmount, "Freelancer should receive 97.5 MNEE");

        emit log_string("[PASS] Auto-approval timeout triggered successfully");
    }

    function testCannotFundTwice() public {
        bytes32 projectId = keccak256(abi.encodePacked("test-double-fund", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 100 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14,
            amounts,
            durations
        );

        vm.prank(client);
        escrow.fundProject(projectId);

        // Try to fund again - should revert
        vm.prank(client);
        vm.expectRevert();
        escrow.fundProject(projectId);

        emit log_string("[PASS] Cannot fund project twice");
    }

    function testOnlyClientCanFund() public {
        bytes32 projectId = keccak256(abi.encodePacked("test-only-client-fund", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 100 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14,
            amounts,
            durations
        );

        // Freelancer tries to fund - should revert
        vm.prank(freelancer);
        vm.expectRevert();
        escrow.fundProject(projectId);

        // Random address tries to fund - should revert
        vm.prank(address(0x9999));
        vm.expectRevert();
        escrow.fundProject(projectId);

        emit log_string("[PASS] Only client can fund project");
    }

    function testOnlyFreelancerCanRequestCompletion() public {
        bytes32 projectId = keccak256(abi.encodePacked("test-only-freelancer-request", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 100 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14,
            amounts,
            durations
        );

        vm.prank(client);
        escrow.fundProject(projectId);

        // Client tries to request completion - should revert
        vm.prank(client);
        vm.expectRevert();
        escrow.requestMilestone(projectId, 0);

        emit log_string("[PASS] Only freelancer can request milestone completion");
    }

    function testOnlyClientCanApprove() public {
        bytes32 projectId = keccak256(abi.encodePacked("test-only-client-approve", block.timestamp));

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 100 * 1e18;

        uint32[] memory durations = new uint32[](1);
        durations[0] = 0;

        vm.prank(freelancer);
        escrow.createProject(
            projectId,
            client,
            address(0),
            TwinkleEscrow.DisputeResolution.None,
            address(0),
            0,
            14,
            amounts,
            durations
        );

        vm.prank(client);
        escrow.fundProject(projectId);

        vm.prank(freelancer);
        escrow.requestMilestone(projectId, 0);

        // Freelancer tries to approve - should revert
        vm.prank(freelancer);
        vm.expectRevert();
        escrow.approveMilestone(projectId, 0);

        emit log_string("[PASS] Only client can approve milestone");
    }

    function testFeeCalculation() public view {
        // Verify 2.5% fee
        uint256 amount = 1000 * 1e18;
        uint256 fee = core.calculateFee(amount);
        uint256 expectedFee = 25 * 1e18; // 2.5%

        assertEq(fee, expectedFee, "Fee should be 2.5%");
        assertEq(core.platformFeeBps(), 250, "Fee should be 250 bps");
    }
}
