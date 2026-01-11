// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/twinkle/TwinkleX402.sol";
import "../src/twinkle/TwinkleCore.sol";

/**
 * @title MockMNEE
 * @notice Simple mock ERC20 for testing TwinkleX402
 */
contract MockMNEE is ERC20 {
    bool private _paused;
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public frozen;

    constructor() ERC20("Mock MNEE", "mMNEE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function paused() external view returns (bool) {
        return _paused;
    }

    function setPaused(bool paused_) external {
        _paused = paused_;
    }

    function setBlacklisted(address account, bool status) external {
        blacklisted[account] = status;
    }

    function setFrozen(address account, bool status) external {
        frozen[account] = status;
    }
}

/**
 * @title TwinkleX402Test
 * @notice Comprehensive tests for x402 HTTP Payment Protocol
 */
contract TwinkleX402Test is Test {
    // Contracts
    TwinkleCore public core;
    TwinkleX402 public x402;
    MockMNEE public mnee;

    // Addresses
    address public owner;
    address public facilitator;
    address public contentProvider;
    address public aiAgent;
    address public treasury;

    // Agent private key for signing
    uint256 public constant AGENT_PRIVATE_KEY = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;

    // Test constants
    uint256 public constant PAYMENT_AMOUNT = 100 * 1e18; // 100 MNEE
    uint256 public constant INITIAL_BALANCE = 10000 * 1e18; // 10,000 MNEE

    function setUp() public {
        owner = address(this);
        facilitator = makeAddr("facilitator");
        contentProvider = makeAddr("contentProvider");
        aiAgent = vm.addr(AGENT_PRIVATE_KEY);
        treasury = makeAddr("treasury");

        // Deploy MockMNEE
        mnee = new MockMNEE();

        // Deploy TwinkleCore (use address(1) as placeholder for Sablier since we don't need it)
        core = new TwinkleCore(address(mnee), treasury, address(1));
        core.setPlatformFee(250); // 2.5%

        // Deploy TwinkleX402
        x402 = new TwinkleX402(
            address(core),
            facilitator,
            address(0) // No TwinklePay for these tests
        );

        // Fund the AI agent
        mnee.mint(aiAgent, INITIAL_BALANCE);
        mnee.mint(contentProvider, INITIAL_BALANCE);

        // AI Agent approves TwinkleX402
        vm.prank(aiAgent);
        mnee.approve(address(x402), type(uint256).max);
    }

    // ============ Payment Request Tests ============

    function testCreatePaymentRequest() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        (
            address payTo,
            uint128 amount,
            bytes32 paywallId,
            uint40 validUntil,
            bool settled
        ) = x402.getPaymentRequest(requestId);

        assertEq(payTo, contentProvider);
        assertEq(amount, PAYMENT_AMOUNT);
        assertEq(paywallId, bytes32(0));
        assertGt(validUntil, block.timestamp);
        assertFalse(settled);

        emit log_named_bytes32("[PASS] Payment request created", requestId);
    }

    function testCreatePaymentRequest_RevertIfZeroRecipient() public {
        vm.expectRevert(TwinkleX402.InvalidRecipient.selector);
        x402.createPaymentRequest(
            address(0),
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );
    }

    function testCreatePaymentRequest_RevertIfAmountTooSmall() public {
        vm.expectRevert(TwinkleX402.AmountTooSmall.selector);
        x402.createPaymentRequest(
            contentProvider,
            uint128(1e14), // Below MIN_PAYMENT_AMOUNT
            bytes32(0),
            1 hours
        );
    }

    function testCreatePaymentRequest_RevertIfValidityTooLong() public {
        vm.expectRevert(TwinkleX402.ValidityTooLong.selector);
        x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            25 hours // Exceeds MAX_VALIDITY_PERIOD
        );
    }

    function testCancelPaymentRequest() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        x402.cancelPaymentRequest(requestId);

        (, , , , bool settled) = x402.getPaymentRequest(requestId);
        assertTrue(settled);

        emit log_string("[PASS] Payment request cancelled");
    }

    function testCancelPaymentRequest_RevertIfNotCreator() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        vm.prank(aiAgent);
        vm.expectRevert(TwinkleX402.NotRequestCreator.selector);
        x402.cancelPaymentRequest(requestId);
    }

    // ============ Settlement Tests ============

    function testSettle_WithValidSignature() public {
        // Create payment request
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        // Create payment intent
        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        // Sign the intent
        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        // Record balances before
        uint256 agentBalanceBefore = mnee.balanceOf(aiAgent);
        uint256 providerBalanceBefore = mnee.balanceOf(contentProvider);
        uint256 treasuryBalanceBefore = mnee.balanceOf(treasury);

        // Settle as facilitator
        vm.prank(facilitator);
        bytes32 accessProofId = x402.settle(requestId, intent, signature);

        // Verify balances
        uint256 expectedFee = (PAYMENT_AMOUNT * 250) / 10000; // 2.5%
        uint256 expectedProviderAmount = PAYMENT_AMOUNT - expectedFee;

        assertEq(mnee.balanceOf(aiAgent), agentBalanceBefore - PAYMENT_AMOUNT);
        assertEq(mnee.balanceOf(contentProvider), providerBalanceBefore + expectedProviderAmount);
        assertEq(mnee.balanceOf(treasury), treasuryBalanceBefore + expectedFee);

        // Verify access proof exists
        assertTrue(x402.isAccessProofValid(accessProofId));

        // Verify request is settled
        (, , , , bool settled) = x402.getPaymentRequest(requestId);
        assertTrue(settled);

        emit log_named_bytes32("[PASS] Settlement successful, access proof", accessProofId);
        emit log_named_uint("[PASS] Platform fee collected", expectedFee);
    }

    function testSettle_RevertIfInvalidSignature() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        // Sign with wrong key
        bytes memory badSignature = _signIntent(intent, 0xBAD);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.InvalidSignature.selector);
        x402.settle(requestId, intent, badSignature);
    }

    function testSettle_RevertIfNotFacilitator() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(aiAgent); // Not facilitator
        vm.expectRevert(TwinkleX402.NotFacilitator.selector);
        x402.settle(requestId, intent, signature);
    }

    function testSettle_RevertIfRequestExpired() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 2 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        // Warp past request expiry
        vm.warp(block.timestamp + 2 hours);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.RequestExpired.selector);
        x402.settle(requestId, intent, signature);
    }

    function testSettle_RevertIfIntentExpired() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            2 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 30 minutes, // Intent expires before request
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        // Warp past intent expiry but before request expiry
        vm.warp(block.timestamp + 1 hours);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.IntentExpired.selector);
        x402.settle(requestId, intent, signature);
    }

    function testSettle_RevertIfNonceAlreadyUsed() public {
        // First settlement
        bytes32 requestId1 = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent1 = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId1,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1 // Same nonce
        });

        bytes memory signature1 = _signIntent(intent1, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        x402.settle(requestId1, intent1, signature1);

        // Second settlement with same nonce
        bytes32 requestId2 = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent2 = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId2,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1 // Same nonce - should fail
        });

        bytes memory signature2 = _signIntent(intent2, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.IntentNonceUsed.selector);
        x402.settle(requestId2, intent2, signature2);

        emit log_string("[PASS] Replay protection working");
    }

    function testSettle_RevertIfAlreadySettled() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        x402.settle(requestId, intent, signature);

        // Try to settle again with different nonce
        TwinkleX402.PaymentIntent memory intent2 = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 2
        });

        bytes memory signature2 = _signIntent(intent2, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.RequestAlreadySettled.selector);
        x402.settle(requestId, intent2, signature2);
    }

    // ============ AP2 Tests ============

    function testSettleWithAP2() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        TwinkleX402.AgentPaymentInfo memory agentInfo = TwinkleX402.AgentPaymentInfo({
            agentId: keccak256("claude-4"),
            agentType: "claude",
            sessionId: keccak256("session-123"),
            metadata: ""
        });

        vm.prank(facilitator);
        bytes32 accessProofId = x402.settleWithAP2(requestId, intent, signature, agentInfo);

        assertTrue(x402.isAccessProofValid(accessProofId));
        assertEq(x402.totalAgentPayments(), 1);

        emit log_string("[PASS] AP2 settlement successful");
        emit log_named_uint("[PASS] Total agent payments", x402.totalAgentPayments());
    }

    // ============ Batch Settlement Tests ============

    function testSettleBatch() public {
        uint256 batchSize = 3;
        bytes32[] memory requestIds = new bytes32[](batchSize);
        TwinkleX402.PaymentIntent[] memory intents = new TwinkleX402.PaymentIntent[](batchSize);
        bytes[] memory signatures = new bytes[](batchSize);

        // Use unique nonces that won't conflict with other tests
        uint256 baseNonce = 1000000;

        for (uint256 i = 0; i < batchSize; i++) {
            // Advance block to ensure unique request nonces
            vm.roll(block.number + 1);
            vm.warp(block.timestamp + 1);

            requestIds[i] = x402.createPaymentRequest(
                contentProvider,
                uint128(PAYMENT_AMOUNT),
                bytes32(0),
                1 hours
            );

            intents[i] = TwinkleX402.PaymentIntent({
                payer: aiAgent,
                requestId: requestIds[i],
                amount: PAYMENT_AMOUNT,
                validUntil: block.timestamp + 1 hours,
                nonce: baseNonce + i // Unique nonces
            });

            signatures[i] = _signIntent(intents[i], AGENT_PRIVATE_KEY);
        }

        uint256 agentBalanceBefore = mnee.balanceOf(aiAgent);

        vm.prank(facilitator);
        bytes32[] memory accessProofIds = x402.settleBatch(requestIds, intents, signatures);

        assertEq(accessProofIds.length, batchSize);
        assertEq(mnee.balanceOf(aiAgent), agentBalanceBefore - (PAYMENT_AMOUNT * batchSize));

        for (uint256 i = 0; i < batchSize; i++) {
            assertTrue(x402.isAccessProofValid(accessProofIds[i]));
        }

        emit log_named_uint("[PASS] Batch settlement successful, count", batchSize);
    }

    function testSettleBatch_RevertIfEmpty() public {
        bytes32[] memory requestIds = new bytes32[](0);
        TwinkleX402.PaymentIntent[] memory intents = new TwinkleX402.PaymentIntent[](0);
        bytes[] memory signatures = new bytes[](0);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.BatchEmpty.selector);
        x402.settleBatch(requestIds, intents, signatures);
    }

    function testSettleBatch_RevertIfTooLarge() public {
        bytes32[] memory requestIds = new bytes32[](21);
        TwinkleX402.PaymentIntent[] memory intents = new TwinkleX402.PaymentIntent[](21);
        bytes[] memory signatures = new bytes[](21);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.BatchTooLarge.selector);
        x402.settleBatch(requestIds, intents, signatures);
    }

    // ============ Access Proof Tests ============

    function testAccessProofExpiry() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        bytes32 accessProofId = x402.settle(requestId, intent, signature);

        // Should be valid initially
        assertTrue(x402.isAccessProofValid(accessProofId));

        // Warp past default validity (30 days)
        vm.warp(block.timestamp + 31 days);

        // Should be invalid now
        assertFalse(x402.isAccessProofValid(accessProofId));

        emit log_string("[PASS] Access proof expiry working");
    }

    function testRevokeAccessProof() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        bytes32 accessProofId = x402.settle(requestId, intent, signature);

        assertTrue(x402.isAccessProofValid(accessProofId));

        // Revoke
        vm.prank(facilitator);
        x402.revokeAccessProof(accessProofId);

        assertFalse(x402.isAccessProofValid(accessProofId));

        emit log_string("[PASS] Access proof revocation working");
    }

    function testRevokeAccessProof_RevertIfAlreadyRevoked() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        bytes32 accessProofId = x402.settle(requestId, intent, signature);

        vm.prank(facilitator);
        x402.revokeAccessProof(accessProofId);

        vm.prank(facilitator);
        vm.expectRevert(TwinkleX402.AccessProofAlreadyRevoked.selector);
        x402.revokeAccessProof(accessProofId);
    }

    function testSetAccessProofValidity() public {
        uint256 newValidity = 7 days;

        vm.prank(facilitator);
        x402.setAccessProofValidity(newValidity);

        assertEq(x402.accessProofValidity(), newValidity);

        emit log_string("[PASS] Access proof validity updated");
    }

    // ============ Verify Intent Tests ============

    function testVerifyIntent_Valid() public {
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        (bool valid, string memory reason) = x402.verifyIntent(requestId, intent, signature);

        assertTrue(valid);
        assertEq(reason, "");

        emit log_string("[PASS] Intent verification working");
    }

    function testVerifyIntent_InsufficientBalance() public {
        // Create agent with insufficient balance using a known private key
        uint256 poorAgentKey = 0xDEAD;
        address poorAgent = vm.addr(poorAgentKey); // Derive address from key

        vm.prank(poorAgent);
        mnee.approve(address(x402), type(uint256).max);
        // Don't give poorAgent any tokens

        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: poorAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 9999 // Unique nonce
        });

        bytes memory signature = _signIntent(intent, poorAgentKey);

        (bool valid, string memory reason) = x402.verifyIntent(requestId, intent, signature);

        assertFalse(valid);
        assertEq(reason, "Insufficient balance");
    }

    function testVerifyIntent_InsufficientAllowance() public {
        // Create agent with no allowance using a known private key
        uint256 noAllowanceKey = 0xBEEF;
        address noAllowanceAgent = vm.addr(noAllowanceKey); // Derive address from key

        mnee.mint(noAllowanceAgent, INITIAL_BALANCE);
        // Don't approve - agent has balance but no allowance

        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: noAllowanceAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 8888 // Unique nonce
        });

        bytes memory signature = _signIntent(intent, noAllowanceKey);

        (bool valid, string memory reason) = x402.verifyIntent(requestId, intent, signature);

        assertFalse(valid);
        assertEq(reason, "Insufficient allowance - agent must approve TwinkleX402");
    }

    // ============ Stats Tests ============

    function testGetStats() public {
        // Settle a payment
        bytes32 requestId = x402.createPaymentRequest(
            contentProvider,
            uint128(PAYMENT_AMOUNT),
            bytes32(0),
            1 hours
        );

        TwinkleX402.PaymentIntent memory intent = TwinkleX402.PaymentIntent({
            payer: aiAgent,
            requestId: requestId,
            amount: PAYMENT_AMOUNT,
            validUntil: block.timestamp + 1 hours,
            nonce: 1
        });

        bytes memory signature = _signIntent(intent, AGENT_PRIVATE_KEY);

        vm.prank(facilitator);
        x402.settle(requestId, intent, signature);

        (uint256 totalSettled, uint256 totalFeesCollected) = x402.getStats();

        uint256 expectedFee = (PAYMENT_AMOUNT * 250) / 10000;

        assertEq(totalSettled, PAYMENT_AMOUNT);
        assertEq(totalFeesCollected, expectedFee);

        emit log_named_uint("[PASS] Total settled", totalSettled);
        emit log_named_uint("[PASS] Total fees collected", totalFeesCollected);
    }

    // ============ Helper Functions ============

    function _signIntent(
        TwinkleX402.PaymentIntent memory intent,
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(
            x402.PAYMENT_INTENT_TYPEHASH(),
            intent.payer,
            intent.requestId,
            intent.amount,
            intent.validUntil,
            intent.nonce
        ));

        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            x402.DOMAIN_SEPARATOR(),
            structHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
