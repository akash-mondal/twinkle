#!/bin/bash
# Twinkle Protocol Backend - End-to-End Testing Script
# Executes REAL transactions on Sepolia testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contract addresses (Sepolia)
TWINKLE_CORE="0x0DF0E3024350ea0992a7485aDbDE425a79983c09"
TWINKLE_PAY="0xAE1a483ce67a796FcdC7C986CbB556f2975bE190"
TWINKLE_SPLIT="0x987c621118D66A1F58C032EBdDe8F4f3385B71E4"
TWINKLE_ESCROW="0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931"
TWINKLE_SUBSCRIPTION="0xa4436C50743FF1eD0C38318A32F502b2A5F899E6"
TWINKLE_X402="0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
TESTMNEE="0xF730d47c3003eCaE2608C452BCD5b0edf825e51C"

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$(dirname "$BACKEND_DIR")/contracts"

if [ -f "$CONTRACTS_DIR/.env" ]; then
    source "$CONTRACTS_DIR/.env"
    echo -e "${GREEN}Loaded environment from contracts/.env${NC}"
else
    echo -e "${RED}Error: contracts/.env not found${NC}"
    echo "Please create .env file with PRIVATE_KEY and SEPOLIA_RPC_URL"
    exit 1
fi

# Validate required env vars
if [ -z "$PRIVATE_KEY" ] || [ -z "$SEPOLIA_RPC_URL" ]; then
    echo -e "${RED}Error: PRIVATE_KEY and SEPOLIA_RPC_URL must be set${NC}"
    exit 1
fi

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${BLUE}Deployer address: $DEPLOYER${NC}"

# Check MNEE balance
MNEE_BALANCE=$(cast call $TESTMNEE "balanceOf(address)(uint256)" $DEPLOYER --rpc-url $SEPOLIA_RPC_URL)
echo -e "${BLUE}MNEE Balance: $(cast --from-wei $MNEE_BALANCE) tMNEE${NC}"

# ============================================================================
# Phase 1: TwinklePay Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 1: TwinklePay Tests ===${NC}\n"

# Generate unique paywall ID
PAYWALL_ID=$(cast keccak "test-paywall-$(date +%s)")
echo -e "${BLUE}Paywall ID: $PAYWALL_ID${NC}"

# 1.1 Create Paywall
echo -e "\n${GREEN}1.1 Creating paywall (10 MNEE, x402 enabled)...${NC}"
TX_HASH=$(cast send $TWINKLE_PAY \
  "createPaywall(bytes32,uint96,address,bool)" \
  $PAYWALL_ID \
  $(cast --to-wei 10) \
  0x0000000000000000000000000000000000000000 \
  true \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Created paywall. TX: $TX_HASH${NC}"

# Verify paywall was created
PAYWALL=$(cast call $TWINKLE_PAY "getPaywall(bytes32)(address,uint96,address,uint32,bool,bool)" $PAYWALL_ID --rpc-url $SEPOLIA_RPC_URL)
echo -e "${BLUE}Paywall details: $PAYWALL${NC}"

# 1.2 Approve MNEE for TwinklePay
echo -e "\n${GREEN}1.2 Approving MNEE for TwinklePay...${NC}"
cast send $TESTMNEE \
  "approve(address,uint256)" \
  $TWINKLE_PAY \
  $(cast --to-wei 1000) \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY > /dev/null 2>&1
echo -e "${GREEN}Approved MNEE${NC}"

# 1.3 Pay for Paywall (Unlock)
echo -e "\n${GREEN}1.3 Paying for paywall (unlocking)...${NC}"
TX_HASH=$(cast send $TWINKLE_PAY \
  "pay(bytes32)" \
  $PAYWALL_ID \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Paid for paywall. TX: $TX_HASH${NC}"

# Verify unlock
IS_UNLOCKED=$(cast call $TWINKLE_PAY "isUnlocked(bytes32,address)(bool)" $PAYWALL_ID $DEPLOYER --rpc-url $SEPOLIA_RPC_URL)
echo -e "${BLUE}Is unlocked: $IS_UNLOCKED${NC}"

# 1.4 Direct Payment
echo -e "\n${GREEN}1.4 Sending direct payment (5 MNEE)...${NC}"
TX_HASH=$(cast send $TWINKLE_PAY \
  "payDirect(address,uint96)" \
  $DEPLOYER \
  $(cast --to-wei 5) \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Direct payment sent. TX: $TX_HASH${NC}"

# ============================================================================
# Phase 2: TwinkleSubscription Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 2: TwinkleSubscription Tests ===${NC}\n"

# Generate unique plan ID
PLAN_ID=$(cast keccak "test-plan-$(date +%s)")
echo -e "${BLUE}Plan ID: $PLAN_ID${NC}"

# 2.1 Create Subscription Plan
echo -e "\n${GREEN}2.1 Creating subscription plan (5 MNEE/30 days, 7 day trial)...${NC}"
TX_HASH=$(cast send $TWINKLE_SUBSCRIPTION \
  "createPlan(bytes32,uint96,uint32,uint16,address)" \
  $PLAN_ID \
  $(cast --to-wei 5) \
  30 \
  7 \
  0x0000000000000000000000000000000000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Created plan. TX: $TX_HASH${NC}"

# Verify plan
PLAN=$(cast call $TWINKLE_SUBSCRIPTION "getPlan(bytes32)(address,uint96,uint32,uint16,bool,uint32,address)" $PLAN_ID --rpc-url $SEPOLIA_RPC_URL)
echo -e "${BLUE}Plan details: $PLAN${NC}"

# 2.2 Approve MNEE for Subscription
echo -e "\n${GREEN}2.2 Approving MNEE for TwinkleSubscription...${NC}"
cast send $TESTMNEE \
  "approve(address,uint256)" \
  $TWINKLE_SUBSCRIPTION \
  $(cast --to-wei 100) \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY > /dev/null 2>&1
echo -e "${GREEN}Approved MNEE${NC}"

# 2.3 Subscribe to Plan
echo -e "\n${GREEN}2.3 Subscribing to plan...${NC}"
TX_HASH=$(cast send $TWINKLE_SUBSCRIPTION \
  "subscribe(bytes32)" \
  $PLAN_ID \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Subscribed. TX: $TX_HASH${NC}"

# ============================================================================
# Phase 3: TwinkleSplit Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 3: TwinkleSplit Tests ===${NC}\n"

# Generate unique split ID
SPLIT_ID=$(cast keccak "test-split-$(date +%s)")
echo -e "${BLUE}Split ID: $SPLIT_ID${NC}"

# 3.1 Create Revenue Split (single recipient for simplicity)
echo -e "\n${GREEN}3.1 Creating revenue split (100% to deployer)...${NC}"
TX_HASH=$(cast send $TWINKLE_SPLIT \
  "createSplit(bytes32,address[],uint256[],bool)" \
  $SPLIT_ID \
  "[$DEPLOYER]" \
  "[1000000]" \
  false \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Created split. TX: $TX_HASH${NC}"

# 3.2 Approve MNEE for Split
echo -e "\n${GREEN}3.2 Approving MNEE for TwinkleSplit...${NC}"
cast send $TESTMNEE \
  "approve(address,uint256)" \
  $TWINKLE_SPLIT \
  $(cast --to-wei 100) \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY > /dev/null 2>&1
echo -e "${GREEN}Approved MNEE${NC}"

# 3.3 Receive Funds to Split
echo -e "\n${GREEN}3.3 Depositing 10 MNEE to split...${NC}"
TX_HASH=$(cast send $TWINKLE_SPLIT \
  "receiveFunds(bytes32,uint256)" \
  $SPLIT_ID \
  $(cast --to-wei 10) \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Deposited funds. TX: $TX_HASH${NC}"

# 3.4 Distribute Funds
echo -e "\n${GREEN}3.4 Distributing split funds...${NC}"
TX_HASH=$(cast send $TWINKLE_SPLIT \
  "distribute(bytes32,address[],uint256[])" \
  $SPLIT_ID \
  "[$DEPLOYER]" \
  "[1000000]" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Distributed funds. TX: $TX_HASH${NC}"

# ============================================================================
# Phase 4: TwinkleX402 Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 4: TwinkleX402 Tests ===${NC}\n"

# 4.1 Create Payment Request
echo -e "\n${GREEN}4.1 Creating x402 payment request (10 MNEE, 1 hour validity)...${NC}"
TX_HASH=$(cast send $TWINKLE_X402 \
  "createPaymentRequest(address,uint128,bytes32,uint40)" \
  $DEPLOYER \
  $(cast --to-wei 10) \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  3600 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --json 2>/dev/null | jq -r '.transactionHash')
echo -e "${GREEN}Created payment request. TX: $TX_HASH${NC}"

# Get the request ID from the transaction logs
echo -e "${BLUE}Note: x402 settlement requires EIP-712 signature (use test-x402-settle.ts)${NC}"

# ============================================================================
# Summary
# ============================================================================

echo -e "\n${YELLOW}=== Test Summary ===${NC}\n"
echo -e "${GREEN}TwinklePay Tests: COMPLETED${NC}"
echo -e "  - Paywall ID: $PAYWALL_ID"
echo -e "  - Paywall unlocked: $IS_UNLOCKED"
echo -e ""
echo -e "${GREEN}TwinkleSubscription Tests: COMPLETED${NC}"
echo -e "  - Plan ID: $PLAN_ID"
echo -e ""
echo -e "${GREEN}TwinkleSplit Tests: COMPLETED${NC}"
echo -e "  - Split ID: $SPLIT_ID"
echo -e ""
echo -e "${GREEN}TwinkleX402 Tests: PARTIAL${NC}"
echo -e "  - Payment request created"
echo -e "  - Settlement requires TypeScript script"
echo -e ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Verify indexer captured all events"
echo -e "  2. Test API endpoints with curl"
echo -e "  3. Run test-x402-settle.ts for x402 settlement"
echo -e "  4. Test MCP server tools"

# Save test IDs for later reference
echo -e "\n${BLUE}Saving test IDs to test-ids.env...${NC}"
cat > "$SCRIPT_DIR/test-ids.env" << EOF
# Generated test IDs from $(date)
PAYWALL_ID=$PAYWALL_ID
PLAN_ID=$PLAN_ID
SPLIT_ID=$SPLIT_ID
DEPLOYER=$DEPLOYER
EOF
echo -e "${GREEN}Test IDs saved!${NC}"
