import 'dotenv/config';
/**
 * Twinkle Demo Configuration
 * Contract addresses and service URLs
 * Supports mainnet (default) and Sepolia testnet
 */

// Get chain ID from environment (default to mainnet)
const chainId = parseInt(process.env.CHAIN_ID || '1', 10);

// Contract addresses per chain
const CONTRACTS = {
  1: {
    // Ethereum Mainnet
    TwinkleCore: '0x68Ab986EBd3A3307E04b0384fB483e528D16D013' as `0x${string}`,
    TwinklePay: '0xa3DB430aFD3e92b4991842A3D167E8487E9a8bFF' as `0x${string}`,
    TwinkleSplit: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF' as `0x${string}`,
    TwinkleEscrow: '0x19AF229901db0ae11fafc536606b592a3524e28d' as `0x${string}`,
    TwinkleSubscription: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8' as `0x${string}`,
    TwinkleX402: '0x348356f71539CCc13695a4868541B9bC18764A0F' as `0x${string}`,
    MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF' as `0x${string}`,
    SablierLockup: '0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73' as `0x${string}`,
  },
  11155111: {
    // Sepolia Testnet
    TwinkleCore: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8' as `0x${string}`,
    TwinklePay: '0x348356f71539CCc13695a4868541B9bC18764A0F' as `0x${string}`,
    TwinkleSplit: '0xdF74B5bAf4F9F85AdE8dFc8F19D5cF47F3b14aA2' as `0x${string}`,
    TwinkleEscrow: '0x57526eBA750E9E216955f7Ea89917c759169016c' as `0x${string}`,
    TwinkleSubscription: '0x8ABb57F7a5d74C0B54aF030A7988a5dD18fC4907' as `0x${string}`,
    TwinkleX402: '0x1EDc124D1608Cca16F7B27B4027EFaF40AE3BC62' as `0x${string}`,
    TestMNEE: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF' as `0x${string}`,
    SablierLockup: '0x6b0307b4338f2963A62106028E3B074C2c0510DA' as `0x${string}`,
  },
} as const;

// Get contracts for current chain
const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] || CONTRACTS[1];

// Get MNEE address based on chain
const mneeAddress = chainId === 1
  ? (contracts as typeof CONTRACTS[1]).MNEE
  : (contracts as typeof CONTRACTS[11155111]).TestMNEE;

export const CONFIG = {
  // Chain configuration
  chainId,
  chainName: chainId === 1 ? 'Mainnet (Real MNEE)' : 'Sepolia (Test MNEE)',

  // RPC URL - Required for on-chain transactions
  rpcUrl: process.env.RPC_URL || (chainId === 1
    ? 'https://ethereum.publicnode.com'
    : 'https://ethereum-sepolia.publicnode.com'),

  // Service URLs - Default to deployed VPS with chain-specific routes
  apiUrl: process.env.API_URL || `http://159.89.160.130/api/${chainId}`,
  facilitatorUrl: process.env.FACILITATOR_URL || `http://159.89.160.130/facilitator/${chainId}`,
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3002',

  // Contract addresses
  contracts: {
    ...contracts,
    // Alias for MNEE token (works for both mainnet and testnet)
    TestMNEE: mneeAddress,
  },

  // Test wallet - Required for on-chain transactions
  // SECURITY: Private key must be provided via environment variable
  testPrivateKey: (process.env.TEST_PRIVATE_KEY as `0x${string}`),
  testPrivateKey2: (process.env.TEST_PRIVATE_KEY_2 as `0x${string}`),

  // Default settings
  defaults: {
    validityPeriod: 3600, // 1 hour in seconds
    paywallPrice: 10n * 10n ** 18n, // 10 MNEE (18 decimals)
    subscriptionPrice: 5n * 10n ** 18n, // 5 MNEE per period
  },
} as const;

export type ContractName = keyof typeof CONFIG.contracts;
