#!/bin/bash
# ===========================================
# Twinkle Health Check Tests
# ===========================================
# Tests health endpoints and infrastructure connectivity
# Usage: ./scripts/test-health.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

echo "========================================"
echo "Twinkle Health Check Tests"
echo "========================================"
echo ""

# Helper function
check() {
    local description=$1
    local command=$2
    local expected=$3

    echo -n "Checking: $description... "

    result=$(eval "$command" 2>/dev/null) || result=""

    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}OK${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $(echo "$result" | head -c 100)"
        ((FAILED++))
        return 1
    fi
}

check_service() {
    local name=$1
    local url=$2

    echo -n "Checking: $name health... "

    response=$(curl -s -w "%{http_code}" "$url/health" 2>/dev/null) || response=""
    status_code="${response: -3}"
    body="${response::-3}"

    if [ "$status_code" == "200" ]; then
        status=$(echo "$body" | jq -r '.status' 2>/dev/null) || status=""
        if [ "$status" == "healthy" ]; then
            echo -e "${GREEN}HEALTHY${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${YELLOW}DEGRADED${NC}"
            echo "  Status: $status"
            ((WARNINGS++))
            return 0
        fi
    elif [ "$status_code" == "503" ]; then
        echo -e "${RED}UNHEALTHY${NC}"
        ((FAILED++))
        return 1
    else
        echo -e "${RED}NOT REACHABLE${NC} (HTTP $status_code)"
        ((FAILED++))
        return 1
    fi
}

echo "========================================"
echo "1. Infrastructure"
echo "========================================"

# PostgreSQL
echo -n "Checking: PostgreSQL... "
if docker-compose ps postgres 2>/dev/null | grep -q "healthy\|running"; then
    pg_result=$(docker-compose exec -T postgres pg_isready -U twinkle 2>/dev/null) || pg_result=""
    if [[ "$pg_result" == *"accepting connections"* ]]; then
        echo -e "${GREEN}OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}CONTAINER UP, DB NOT READY${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}NOT RUNNING${NC}"
    echo "  Run: docker-compose up -d postgres"
    ((FAILED++))
fi

# Redis
echo -n "Checking: Redis... "
if docker-compose ps redis 2>/dev/null | grep -q "healthy\|running"; then
    redis_result=$(docker-compose exec -T redis redis-cli ping 2>/dev/null) || redis_result=""
    if [[ "$redis_result" == *"PONG"* ]]; then
        echo -e "${GREEN}OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}CONTAINER UP, REDIS NOT RESPONDING${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}NOT RUNNING${NC}"
    echo "  Run: docker-compose up -d redis"
    ((FAILED++))
fi

echo ""
echo "========================================"
echo "2. Services"
echo "========================================"

# API
check_service "API (port 3000)" "http://localhost:3000"

# Facilitator
check_service "Facilitator (port 3001)" "http://localhost:3001"

echo ""
echo "========================================"
echo "3. Dependencies Health Details"
echo "========================================"

# API dependencies
echo -e "${BLUE}API Dependencies:${NC}"
api_health=$(curl -s http://localhost:3000/health 2>/dev/null) || api_health="{}"

redis_status=$(echo "$api_health" | jq -r '.checks.redis.status' 2>/dev/null) || redis_status="unknown"
redis_latency=$(echo "$api_health" | jq -r '.checks.redis.latency' 2>/dev/null) || redis_latency="?"
echo "  Redis: $redis_status (${redis_latency}ms)"

db_status=$(echo "$api_health" | jq -r '.checks.database.status' 2>/dev/null) || db_status="unknown"
db_latency=$(echo "$api_health" | jq -r '.checks.database.latency' 2>/dev/null) || db_latency="?"
echo "  Database: $db_status (${db_latency}ms)"

# Facilitator dependencies
echo -e "${BLUE}Facilitator Dependencies:${NC}"
fac_health=$(curl -s http://localhost:3001/health 2>/dev/null) || fac_health="{}"

redis_status=$(echo "$fac_health" | jq -r '.checks.redis.status' 2>/dev/null) || redis_status="unknown"
redis_latency=$(echo "$fac_health" | jq -r '.checks.redis.latency' 2>/dev/null) || redis_latency="?"
echo "  Redis: $redis_status (${redis_latency}ms)"

rpc_status=$(echo "$fac_health" | jq -r '.checks.rpc.status' 2>/dev/null) || rpc_status="unknown"
rpc_latency=$(echo "$fac_health" | jq -r '.checks.rpc.latency' 2>/dev/null) || rpc_latency="?"
echo "  RPC: $rpc_status (${rpc_latency}ms)"

settlement=$(echo "$fac_health" | jq -r '.settlementEnabled' 2>/dev/null) || settlement="unknown"
echo "  Settlement Enabled: $settlement"

echo ""
echo "========================================"
echo "4. Metrics Endpoints"
echo "========================================"

echo -n "Checking: API metrics... "
api_metrics=$(curl -s http://localhost:3000/metrics 2>/dev/null) || api_metrics=""
if [[ "$api_metrics" == *"http_request"* ]]; then
    echo -e "${GREEN}OK${NC}"
    ((PASSED++))
else
    echo -e "${RED}NOT AVAILABLE${NC}"
    ((FAILED++))
fi

echo -n "Checking: Facilitator metrics... "
fac_metrics=$(curl -s http://localhost:3001/metrics 2>/dev/null) || fac_metrics=""
if [[ "$fac_metrics" == *"http_request"* ]]; then
    echo -e "${GREEN}OK${NC}"
    ((PASSED++))
else
    echo -e "${RED}NOT AVAILABLE${NC}"
    ((FAILED++))
fi

echo ""
echo "========================================"
echo "5. Environment Configuration"
echo "========================================"

# Check for required env vars (without exposing values)
echo -n "Checking: DATABASE_URL... "
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}SET${NC}"
    ((PASSED++))
else
    echo -e "${RED}NOT SET${NC}"
    ((FAILED++))
fi

echo -n "Checking: REDIS_URL... "
if [ -n "$REDIS_URL" ]; then
    echo -e "${GREEN}SET${NC}"
    ((PASSED++))
else
    echo -e "${RED}NOT SET${NC}"
    ((FAILED++))
fi

echo -n "Checking: PONDER_RPC_URL_11155111... "
if [ -n "$PONDER_RPC_URL_11155111" ]; then
    echo -e "${GREEN}SET${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}NOT SET${NC} (required for blockchain operations)"
    ((WARNINGS++))
fi

echo -n "Checking: FACILITATOR_PRIVATE_KEY... "
if [ -n "$FACILITATOR_PRIVATE_KEY" ]; then
    echo -e "${GREEN}SET${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}NOT SET${NC} (settlement will be disabled)"
    ((WARNINGS++))
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}Some checks failed! See above for details.${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Some checks had warnings. Review above.${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
fi
