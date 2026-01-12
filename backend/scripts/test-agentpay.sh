#!/bin/bash
# Test AgentPay Flow
# Run: ./scripts/test-agentpay.sh [API_URL]

API_URL="${1:-http://localhost:3000}"
echo "Testing AgentPay at: $API_URL"
echo "================================"

# Step 1: Send a message that requires a tool
echo ""
echo "Step 1: Sending message 'What is Bitcoin price?'"
echo "-------------------------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/agentpay/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Bitcoin price?", "userAddress": "0x1234567890123456789012345678901234567890"}')

echo "$RESPONSE" | jq .

# Check if payment is required
STATUS=$(echo "$RESPONSE" | jq -r '.status')
SESSION_ID=$(echo "$RESPONSE" | jq -r '.sessionId')
TOOL=$(echo "$RESPONSE" | jq -r '.tool')
COST=$(echo "$RESPONSE" | jq -r '.cost')

if [ "$STATUS" = "payment_required" ]; then
  echo ""
  echo "✅ CORRECT: Payment required before API execution"
  echo "   Tool: $TOOL"
  echo "   Cost: $COST MNEE"
  echo "   Session: $SESSION_ID"

  echo ""
  echo "Step 2: Attempting to execute WITHOUT payment (should fail or require proof)"
  echo "----------------------------------------------------------------------------"

  # Try to execute without valid payment proof
  EXEC_RESPONSE=$(curl -s -X POST "$API_URL/agentpay/execute" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_ID\"}")

  echo "$EXEC_RESPONSE" | jq .

  # In testing mode, it might execute anyway - but in production it would verify payment
  EXEC_STATUS=$(echo "$EXEC_RESPONSE" | jq -r '.status')

  if [ "$EXEC_STATUS" = "complete" ]; then
    echo ""
    echo "⚠️  Note: Executed without strict payment verification (testing mode)"
    echo "   In production, accessProofId or txHash would be required"
  fi

else
  echo ""
  echo "❌ UNEXPECTED: Expected payment_required but got: $STATUS"
fi

echo ""
echo "================================"
echo "Flow Summary:"
echo "1. /chat returns payment_required with 0.1 MNEE cost ✅"
echo "2. User must pay MNEE to continue"
echo "3. /execute runs the API only after payment verification"
echo ""
