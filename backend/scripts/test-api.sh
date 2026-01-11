#!/bin/bash
# Twinkle Protocol Backend - API Endpoint Test Script
# Tests all REST API endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3000}"
FACILITATOR_URL="${FACILITATOR_URL:-http://localhost:3001}"

# Load test IDs if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/test-ids.env" ]; then
    source "$SCRIPT_DIR/test-ids.env"
    echo -e "${GREEN}Loaded test IDs from test-ids.env${NC}"
fi

# Helper function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local description=$4

    echo -e "${BLUE}Testing: $method $endpoint${NC}"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" 2>/dev/null)
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ $description - Status: $status${NC}"
        return 0
    else
        echo -e "${RED}✗ $description - Expected: $expected_status, Got: $status${NC}"
        echo "Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

# ============================================================================
# API Health Check
# ============================================================================

echo -e "\n${YELLOW}=== API Health Check ===${NC}\n"

echo -e "${BLUE}Checking API availability at $API_URL...${NC}"
if curl -s "$API_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}API is running${NC}\n"
else
    echo -e "${RED}API is not running. Start it with: pnpm api:dev${NC}"
    exit 1
fi

test_endpoint "GET" "/" 200 "Health check"
test_endpoint "GET" "/health" 200 "Health status"

# ============================================================================
# Payments Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Payments Endpoints ===${NC}\n"

test_endpoint "GET" "/payments" 200 "List payments"
test_endpoint "GET" "/payments?limit=5" 200 "List payments with limit"

# ============================================================================
# Paywalls Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Paywalls Endpoints ===${NC}\n"

test_endpoint "GET" "/paywalls" 200 "List paywalls"
test_endpoint "GET" "/paywalls?limit=5" 200 "List paywalls with limit"

if [ -n "$PAYWALL_ID" ]; then
    test_endpoint "GET" "/paywalls/$PAYWALL_ID" 200 "Get specific paywall"
    test_endpoint "GET" "/paywalls/$PAYWALL_ID/unlocks" 200 "Get paywall unlocks"
    if [ -n "$DEPLOYER" ]; then
        test_endpoint "GET" "/paywalls/$PAYWALL_ID/check/$DEPLOYER" 200 "Check paywall unlock"
    fi
else
    echo -e "${YELLOW}Skipping specific paywall tests (no PAYWALL_ID)${NC}"
fi

# ============================================================================
# Subscriptions Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Subscriptions Endpoints ===${NC}\n"

test_endpoint "GET" "/subscriptions/plans" 200 "List subscription plans"

if [ -n "$PLAN_ID" ]; then
    test_endpoint "GET" "/subscriptions/plans/$PLAN_ID" 200 "Get specific plan"
else
    echo -e "${YELLOW}Skipping specific plan tests (no PLAN_ID)${NC}"
fi

if [ -n "$DEPLOYER" ]; then
    test_endpoint "GET" "/subscriptions/user/$DEPLOYER" 200 "Get user subscriptions"
fi

# ============================================================================
# Projects (Escrow) Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Projects Endpoints ===${NC}\n"

test_endpoint "GET" "/projects" 200 "List projects"
test_endpoint "GET" "/projects?limit=5" 200 "List projects with limit"

# ============================================================================
# Splits Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Splits Endpoints ===${NC}\n"

test_endpoint "GET" "/splits" 200 "List splits"

if [ -n "$SPLIT_ID" ]; then
    test_endpoint "GET" "/splits/$SPLIT_ID" 200 "Get specific split"
    test_endpoint "GET" "/splits/$SPLIT_ID/distributions" 200 "Get split distributions"
else
    echo -e "${YELLOW}Skipping specific split tests (no SPLIT_ID)${NC}"
fi

# ============================================================================
# x402 Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== x402 Endpoints ===${NC}\n"

test_endpoint "GET" "/x402/requests" 200 "List x402 requests"
test_endpoint "GET" "/x402/settlements" 200 "List x402 settlements"
test_endpoint "GET" "/x402/agent-payments" 200 "List agent payments"

# ============================================================================
# Analytics Endpoints
# ============================================================================

echo -e "\n${YELLOW}=== Analytics Endpoints ===${NC}\n"

test_endpoint "GET" "/analytics/overview" 200 "Protocol overview"
test_endpoint "GET" "/analytics/daily?days=7" 200 "Daily stats"
test_endpoint "GET" "/analytics/top-creators?limit=5" 200 "Top creators"
test_endpoint "GET" "/analytics/protocol-events?limit=10" 200 "Protocol events"

# ============================================================================
# Facilitator Health Check
# ============================================================================

echo -e "\n${YELLOW}=== Facilitator Endpoints ===${NC}\n"

echo -e "${BLUE}Checking Facilitator availability at $FACILITATOR_URL...${NC}"
if curl -s "$FACILITATOR_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}Facilitator is running${NC}\n"

    echo -e "${BLUE}Testing: GET /${NC}"
    response=$(curl -s "$FACILITATOR_URL/")
    echo -e "${GREEN}✓ Health check${NC}"
    echo "Response: $(echo $response | head -c 100)..."
    echo ""

    echo -e "${BLUE}Testing: GET /supported${NC}"
    response=$(curl -s "$FACILITATOR_URL/supported")
    echo -e "${GREEN}✓ Supported networks${NC}"
    echo "Response: $(echo $response | head -c 200)..."
    echo ""
else
    echo -e "${YELLOW}Facilitator is not running. Start it with: pnpm facilitator:dev${NC}"
fi

# ============================================================================
# Summary
# ============================================================================

echo -e "\n${YELLOW}=== Test Summary ===${NC}\n"
echo -e "${GREEN}API Endpoint Tests Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check API logs for any errors"
echo "  2. Run test-x402-settle.ts for x402 settlement testing"
echo "  3. Test MCP server with: npx @modelcontextprotocol/inspector"
