#!/usr/bin/env npx tsx
/**
 * Demo: MCP Server Tools
 * Test all MCP server tools programmatically
 *
 * Run: npx tsx demo-mcp-tools.ts
 */

import { CONFIG } from './lib/config.js';
import { api } from './lib/api.js';

const MCP_URL = CONFIG.mcpServerUrl;
const DEPLOYER = '0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465';

/**
 * Call an MCP tool via JSON-RPC
 */
async function callMcpTool<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${MCP_URL}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: `tools/${method}`,
      params,
    }),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`MCP Error: ${JSON.stringify(result.error)}`);
  }
  return result.result;
}

/**
 * List available MCP tools
 */
async function listTools(): Promise<unknown[]> {
  const response = await fetch(`${MCP_URL}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {},
    }),
  });

  const result = await response.json();
  return result.result?.tools || [];
}

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - MCP Server Tools Demo');
  console.log('='.repeat(60));
  console.log(`MCP Server URL: ${MCP_URL}\n`);

  // ===== Check MCP Server =====
  console.log('--- Checking MCP Server ---');
  try {
    const tools = await listTools();
    console.log(`Available tools: ${tools.length}`);
    tools.forEach((tool: any) => {
      console.log(`  - ${tool.name}: ${tool.description?.slice(0, 50) || 'No description'}...`);
    });
  } catch (error) {
    console.error('MCP Server not responding. Make sure it is running:');
    console.log('  pnpm --filter @twinkle/mcp-server dev');
    console.log('\nContinuing with simulated tool calls...\n');
  }

  // ===== Tool 1: twinkle_check_balance =====
  console.log('\n--- Tool: twinkle_check_balance ---');
  console.log('Purpose: Check MNEE token balance for an address');
  console.log('Usage: AI agent checks if user has sufficient funds');

  try {
    const balance = await callMcpTool('twinkle_check_balance', {
      address: DEPLOYER,
    });
    console.log(`Result: ${JSON.stringify(balance, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { balance: "1009761.93", address: "0x61D3..." }');
  }

  // ===== Tool 2: twinkle_get_paywall =====
  console.log('\n--- Tool: twinkle_get_paywall ---');
  console.log('Purpose: Get paywall details by ID');
  console.log('Usage: AI agent checks price and status before payment');

  // Get a real paywall ID
  const paywalls = await api.getPaywalls({ limit: 1 });
  const paywallId = paywalls[0]?.id || '0x1234...';

  try {
    const paywall = await callMcpTool('twinkle_get_paywall', {
      paywallId,
    });
    console.log(`Result: ${JSON.stringify(paywall, null, 2)}`);
  } catch (error) {
    console.log(`Simulated result for ${paywallId.slice(0, 18)}...:`);
    console.log('  { exists: true, price: "10", creator: "0x61D3...", x402Enabled: true }');
  }

  // ===== Tool 3: twinkle_check_unlock =====
  console.log('\n--- Tool: twinkle_check_unlock ---');
  console.log('Purpose: Verify if user has unlocked content');
  console.log('Usage: AI agent checks access before serving content');

  try {
    const unlock = await callMcpTool('twinkle_check_unlock', {
      paywallId,
      address: DEPLOYER,
    });
    console.log(`Result: ${JSON.stringify(unlock, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { unlocked: true, unlockedAt: "2026-01-11T..." }');
  }

  // ===== Tool 4: twinkle_create_payment_intent =====
  console.log('\n--- Tool: twinkle_create_payment_intent ---');
  console.log('Purpose: Generate EIP-712 typed data for signing');
  console.log('Usage: AI agent prepares x402 payment authorization');

  try {
    const intent = await callMcpTool('twinkle_create_payment_intent', {
      payer: DEPLOYER,
      requestId: '0x' + '0'.repeat(64),
      amount: '1000000000000000000', // 1 MNEE
      validFor: 3600,
    });
    console.log(`Result: ${JSON.stringify(intent, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { domain: {...}, types: {...}, message: {...}, nonce: "12345..." }');
  }

  // ===== Tool 5: twinkle_get_payment_request =====
  console.log('\n--- Tool: twinkle_get_payment_request ---');
  console.log('Purpose: Get x402 payment request details');
  console.log('Usage: AI agent retrieves payment requirements');

  try {
    const request = await callMcpTool('twinkle_get_payment_request', {
      requestId: '0x' + '0'.repeat(64),
    });
    console.log(`Result: ${JSON.stringify(request, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { found: false } or { payTo: "0x...", amount: "10", paywallId: "0x..." }');
  }

  // ===== Tool 6: twinkle_get_plan =====
  console.log('\n--- Tool: twinkle_get_plan ---');
  console.log('Purpose: Get subscription plan details');
  console.log('Usage: AI agent displays plan options to user');

  const plans = await api.getPlans({ limit: 1 });
  const planId = plans[0]?.id || '0x5678...';

  try {
    const plan = await callMcpTool('twinkle_get_plan', {
      planId,
    });
    console.log(`Result: ${JSON.stringify(plan, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { exists: true, price: "5", interval: "2592000", active: true }');
  }

  // ===== Tool 7: twinkle_check_subscription =====
  console.log('\n--- Tool: twinkle_check_subscription ---');
  console.log('Purpose: Check if user is subscribed to a plan');
  console.log('Usage: AI agent verifies subscription status');

  try {
    const sub = await callMcpTool('twinkle_check_subscription', {
      planId,
      address: DEPLOYER,
    });
    console.log(`Result: ${JSON.stringify(sub, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { subscribed: true, expiresAt: "2026-02-11T...", active: true }');
  }

  // ===== Tool 8: twinkle_get_subscription =====
  console.log('\n--- Tool: twinkle_get_subscription ---');
  console.log('Purpose: Get full subscription details');
  console.log('Usage: AI agent retrieves subscription history');

  try {
    const fullSub = await callMcpTool('twinkle_get_subscription', {
      planId,
      address: DEPLOYER,
    });
    console.log(`Result: ${JSON.stringify(fullSub, null, 2)}`);
  } catch (error) {
    console.log('Simulated result:');
    console.log('  { startTime: "...", lastPayment: "...", renewalCount: 3 }');
  }

  // ===== AI Agent Integration Example =====
  console.log('\n' + '='.repeat(60));
  console.log('AI Agent Integration Example');
  console.log('='.repeat(60));

  console.log(`
Example conversation flow:

User: "I want to read the premium article about AI trends"

AI Agent:
1. Calls twinkle_get_paywall(articleId) -> price: 5 MNEE
2. Calls twinkle_check_unlock(articleId, userAddress) -> unlocked: false
3. Calls twinkle_check_balance(userAddress) -> balance: 100 MNEE
4. Says: "This article costs 5 MNEE. You have 100 MNEE. Proceed?"

User: "Yes, pay for it"

AI Agent:
1. Calls twinkle_create_payment_intent(...)
2. Signs the EIP-712 data with user's wallet
3. Sends X-PAYMENT header to content server
4. Receives HTTP 200 with content
5. Delivers article to user

User: "Thanks! Subscribe me to the monthly plan"

AI Agent:
1. Calls twinkle_get_plan(monthlyPlanId) -> price: 10 MNEE/month
2. Confirms with user
3. Calls subscribe transaction
4. Confirms: "You're now subscribed! Next billing: Feb 11"
`);

  // ===== Summary =====
  console.log('='.repeat(60));
  console.log('MCP Tools Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nMCP Server enables AI agents to:');
  console.log('- Check balances and access status');
  console.log('- Create and sign payment authorizations');
  console.log('- Manage subscriptions');
  console.log('- All without exposing private keys');
}

main().catch(console.error);
