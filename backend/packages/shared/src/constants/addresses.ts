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
    TwinkleCore: '0x68Ab986EBd3A3307E04b0384fB483e528D16D013',
    TwinklePay: '0xa3DB430aFD3e92b4991842A3D167E8487E9a8bFF',
    TwinkleSplit: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF',
    TwinkleEscrow: '0x19AF229901db0ae11fafc536606b592a3524e28d',
    TwinkleSubscription: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8',
    TwinkleX402: '0x348356f71539CCc13695a4868541B9bC18764A0F',
    MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
    SablierLockup: '0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73',
  },
  [CHAIN_IDS.SEPOLIA]: {
    TwinkleCore: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8',
    TwinklePay: '0x348356f71539CCc13695a4868541B9bC18764A0F',
    TwinkleSplit: '0xdF74B5bAf4F9F85AdE8dFc8F19D5cF47F3b14aA2',
    TwinkleEscrow: '0x57526eBA750E9E216955f7Ea89917c759169016c',
    TwinkleSubscription: '0x8ABb57F7a5d74C0B54aF030A7988a5dD18fC4907',
    TwinkleX402: '0x1EDc124D1608Cca16F7B27B4027EFaF40AE3BC62',
    TestMNEE: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF',
    SablierLockup: '0x6b0307b4338f2963A62106028E3B074C2c0510DA',
  },
} as const;

/**
 * Deployment start blocks per chain
 */
export const START_BLOCKS = {
  [CHAIN_IDS.MAINNET]: 24216601,
  [CHAIN_IDS.SEPOLIA]: 10026346,
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
