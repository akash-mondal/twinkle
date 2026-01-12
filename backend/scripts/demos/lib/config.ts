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
    TwinkleCore: '0x1ca179Ef926bECa70680F7a7E4C12bF3D0Deb92c' as `0x${string}`,
    TwinklePay: '0xb06A5210F981241467383B25D02983C19263D519' as `0x${string}`,
    TwinkleSplit: '0x6dde461dd5DA6D458394364915bF9d519445644C' as `0x${string}`,
    TwinkleEscrow: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C' as `0x${string}`,
    TwinkleSubscription: '0x5801a405f42A86d66d17df7662911da89e8b0A08' as `0x${string}`,
    TwinkleX402: '0x7BF61F6325E9e8DceB710aeDb817004d71908957' as `0x${string}`,
    MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF' as `0x${string}`,
    SablierLockup: '0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73' as `0x${string}`,
  },
  11155111: {
    // Sepolia Testnet
    TwinkleCore: '0x0DF0E3024350ea0992a7485aDbDE425a79983c09' as `0x${string}`,
    TwinklePay: '0xAE1a483ce67a796FcdC7C986CbB556f2975bE190' as `0x${string}`,
    TwinkleSplit: '0x987c621118D66A1F58C032EBdDe8F4f3385B71E4' as `0x${string}`,
    TwinkleEscrow: '0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931' as `0x${string}`,
    TwinkleSubscription: '0xa4436C50743FF1eD0C38318A32F502b2A5F899E6' as `0x${string}`,
    TwinkleX402: '0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3' as `0x${string}`,
    TestMNEE: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C' as `0x${string}`,
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
  chainName: chainId === 1 ? 'Mainnet' : 'Sepolia',

  // RPC URL - Required for on-chain transactions
  rpcUrl: process.env.RPC_URL || (chainId === 1
    ? 'https://ethereum.publicnode.com'
    : 'https://ethereum-sepolia.publicnode.com'),

  // Service URLs - Default to deployed VPS
  apiUrl: process.env.API_URL || 'http://159.89.160.130/api',
  facilitatorUrl: process.env.FACILITATOR_URL || 'http://159.89.160.130/facilitator',
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3002',

  // Contract addresses
  contracts: {
    ...contracts,
    // Alias for MNEE token (works for both mainnet and testnet)
    TestMNEE: mneeAddress,
  },

  // Test wallet - Required for on-chain transactions
  testPrivateKey: process.env.TEST_PRIVATE_KEY || '0xec0838b3e14efa09c8af7a940b24c6d50117c705848b7217c49f9bf3b20b12d4',

  // Default settings
  defaults: {
    validityPeriod: 3600, // 1 hour in seconds
    paywallPrice: 10n * 10n ** 18n, // 10 MNEE (18 decimals)
    subscriptionPrice: 5n * 10n ** 18n, // 5 MNEE per period
  },
} as const;

export type ContractName = keyof typeof CONFIG.contracts;
