/**
 * Twinkle Contract Addresses
 * Deployed on Ethereum Mainnet and Sepolia Testnet
 */

export const CHAIN_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

/**
 * Contract addresses per chain
 */
export const CONTRACTS = {
  [CHAIN_IDS.MAINNET]: {
    TwinkleCore: '0x1ca179Ef926bECa70680F7a7E4C12bF3D0Deb92c',
    TwinklePay: '0xb06A5210F981241467383B25D02983C19263D519',
    TwinkleSplit: '0x6dde461dd5DA6D458394364915bF9d519445644C',
    TwinkleEscrow: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C',
    TwinkleSubscription: '0x5801a405f42A86d66d17df7662911da89e8b0A08',
    TwinkleX402: '0x7BF61F6325E9e8DceB710aeDb817004d71908957',
    MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
    SablierLockup: '0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73',
  },
  [CHAIN_IDS.SEPOLIA]: {
    TwinkleCore: '0x0DF0E3024350ea0992a7485aDbDE425a79983c09',
    TwinklePay: '0xAE1a483ce67a796FcdC7C986CbB556f2975bE190',
    TwinkleSplit: '0x987c621118D66A1F58C032EBdDe8F4f3385B71E4',
    TwinkleEscrow: '0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931',
    TwinkleSubscription: '0xa4436C50743FF1eD0C38318A32F502b2A5F899E6',
    TwinkleX402: '0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3',
    TestMNEE: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C',
    SablierLockup: '0x6b0307b4338f2963A62106028E3B074C2c0510DA',
  },
} as const;

/**
 * Deployment start blocks per chain
 */
export const START_BLOCKS = {
  [CHAIN_IDS.MAINNET]: 24213265,
  [CHAIN_IDS.SEPOLIA]: 10016000,
} as const;

/**
 * Supported chain IDs (chains with deployed contracts)
 */
export type SupportedChainId = keyof typeof CONTRACTS;

/**
 * Helper to get contracts for a specific chain
 */
export function getContracts(chainId: SupportedChainId) {
  const contracts = CONTRACTS[chainId];
  if (!contracts) {
    throw new Error(`No contracts deployed on chain ${chainId}`);
  }
  return contracts;
}

/**
 * Helper to get start block for a specific chain
 */
export function getStartBlock(chainId: SupportedChainId): number {
  const startBlock = START_BLOCKS[chainId];
  if (!startBlock) {
    throw new Error(`No start block configured for chain ${chainId}`);
  }
  return startBlock;
}

/**
 * Mainnet contract addresses (convenience export)
 */
export const MAINNET_CONTRACTS = CONTRACTS[CHAIN_IDS.MAINNET];

/**
 * Sepolia contract addresses (convenience export)
 */
export const SEPOLIA_CONTRACTS = CONTRACTS[CHAIN_IDS.SEPOLIA];

/**
 * Get the current chain ID from environment (defaults to mainnet)
 */
export function getCurrentChainId(): number {
  return parseInt(process.env.CHAIN_ID || '1', 10);
}

/**
 * Get contracts for current chain (from CHAIN_ID env var)
 */
export function getCurrentContracts() {
  const chainId = getCurrentChainId();
  return getContracts(chainId as SupportedChainId);
}
