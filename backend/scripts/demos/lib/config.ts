/**
 * Twinkle Protocol Demo Configuration
 * Contract addresses and service URLs for Sepolia testnet
 */

export const CONFIG = {
  // Chain configuration
  chainId: 11155111,
  chainName: 'Sepolia',

  // RPC URL - Set via environment variable
  rpcUrl: process.env.RPC_URL || (() => {
    throw new Error('RPC_URL environment variable is required');
  })(),

  // Service URLs
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  facilitatorUrl: process.env.FACILITATOR_URL || 'http://localhost:3001',
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3002',

  // Contract addresses (Sepolia V5.1)
  contracts: {
    TwinkleCore: '0x0DF0E3024350ea0992a7485aDbDE425a79983c09' as `0x${string}`,
    TwinklePay: '0xAE1a483ce67a796FcdC7C986CbB556f2975bE190' as `0x${string}`,
    TwinkleSplit: '0x987c621118D66A1F58C032EBdDe8F4f3385B71E4' as `0x${string}`,
    TwinkleEscrow: '0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931' as `0x${string}`,
    TwinkleSubscription: '0xa4436C50743FF1eD0C38318A32F502b2A5F899E6' as `0x${string}`,
    TwinkleX402: '0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3' as `0x${string}`,
    TestMNEE: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C' as `0x${string}`,
    SablierLockup: '0x6b0307b4338f2963A62106028E3B074C2c0510DA' as `0x${string}`,
  },

  // Test wallet - Set via environment variable
  testPrivateKey: process.env.TEST_PRIVATE_KEY || (() => {
    throw new Error('TEST_PRIVATE_KEY environment variable is required');
  })(),

  // Default settings
  defaults: {
    validityPeriod: 3600, // 1 hour in seconds
    paywallPrice: 10n * 10n ** 18n, // 10 MNEE (18 decimals)
    subscriptionPrice: 5n * 10n ** 18n, // 5 MNEE per period
  },
} as const;

export type ContractName = keyof typeof CONFIG.contracts;
