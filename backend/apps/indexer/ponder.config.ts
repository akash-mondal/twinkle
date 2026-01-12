import { createConfig } from "ponder";
import { http } from "viem";

// Local ABI imports
import TwinkleCoreAbi from "./abis/TwinkleCore.json";
import TwinklePayAbi from "./abis/TwinklePay.json";
import TwinkleSplitAbi from "./abis/TwinkleSplit.json";
import TwinkleEscrowAbi from "./abis/TwinkleEscrow.json";
import TwinkleSubscriptionAbi from "./abis/TwinkleSubscription.json";
import TwinkleX402Abi from "./abis/TwinkleX402.json";

// Contract addresses per chain
const CONTRACTS = {
  1: {
    // Ethereum Mainnet
    TwinkleCore: "0x1ca179Ef926bECa70680F7a7E4C12bF3D0Deb92c" as const,
    TwinklePay: "0xb06A5210F981241467383B25D02983C19263D519" as const,
    TwinkleSplit: "0x6dde461dd5DA6D458394364915bF9d519445644C" as const,
    TwinkleEscrow: "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C" as const,
    TwinkleSubscription: "0x5801a405f42A86d66d17df7662911da89e8b0A08" as const,
    TwinkleX402: "0x7BF61F6325E9e8DceB710aeDb817004d71908957" as const,
  },
  11155111: {
    // Sepolia Testnet
    TwinkleCore: "0x0DF0E3024350ea0992a7485aDbDE425a79983c09" as const,
    TwinklePay: "0xAE1a483ce67a796FcdC7C986CbB556f2975bE190" as const,
    TwinkleSplit: "0x987c621118D66A1F58C032EBdDe8F4f3385B71E4" as const,
    TwinkleEscrow: "0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931" as const,
    TwinkleSubscription: "0xa4436C50743FF1eD0C38318A32F502b2A5F899E6" as const,
    TwinkleX402: "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3" as const,
  },
} as const;

// Start blocks per chain
const START_BLOCKS = {
  1: 24213265, // Mainnet deployment block
  11155111: 10016000, // Sepolia deployment block
} as const;

// Get chain configuration from environment (default to mainnet)
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "1", 10) as 1 | 11155111;
const networkName = CHAIN_ID === 1 ? "mainnet" : "sepolia";
const contracts = CONTRACTS[CHAIN_ID];
const startBlock = START_BLOCKS[CHAIN_ID];

// Get RPC URL for the chain
const rpcUrl = process.env.RPC_URL || process.env[`PONDER_RPC_URL_${CHAIN_ID}`];

export default createConfig({
  networks: {
    [networkName]: {
      chainId: CHAIN_ID,
      transport: http(rpcUrl),
    },
  },
  contracts: {
    TwinkleCore: {
      network: networkName,
      abi: TwinkleCoreAbi,
      address: contracts.TwinkleCore,
      startBlock,
    },
    TwinklePay: {
      network: networkName,
      abi: TwinklePayAbi,
      address: contracts.TwinklePay,
      startBlock,
    },
    TwinkleSplit: {
      network: networkName,
      abi: TwinkleSplitAbi,
      address: contracts.TwinkleSplit,
      startBlock,
    },
    TwinkleEscrow: {
      network: networkName,
      abi: TwinkleEscrowAbi,
      address: contracts.TwinkleEscrow,
      startBlock,
    },
    TwinkleSubscription: {
      network: networkName,
      abi: TwinkleSubscriptionAbi,
      address: contracts.TwinkleSubscription,
      startBlock,
    },
    TwinkleX402: {
      network: networkName,
      abi: TwinkleX402Abi,
      address: contracts.TwinkleX402,
      startBlock,
    },
  },
});
