/**
 * Twinkle Contract Configuration
 * Ethereum Mainnet
 */

export const CHAIN_ID = 1; // Ethereum Mainnet

export const CONTRACTS = {
  TwinkleCore: '0x68Ab986EBd3A3307E04b0384fB483e528D16D013',
  TwinklePay: '0xa3DB430aFD3e92b4991842A3D167E8487E9a8bFF',
  TwinkleSplit: '0xDEe5671FcFC26207295E4352E8bDf6785519e4EF',
  TwinkleEscrow: '0x19AF229901db0ae11fafc536606b592a3524e28d',
  TwinkleSubscription: '0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8',
  TwinkleX402: '0x348356f71539CCc13695a4868541B9bC18764A0F',
  MNEE: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// MNEE token info
export const MNEE_TOKEN = {
  address: CONTRACTS.MNEE,
  symbol: 'MNEE',
  decimals: 18,
  name: 'MNEE Stablecoin',
};
