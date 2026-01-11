import { createConfig } from "ponder";
import { http } from "viem";

// Local ABI imports
import TwinkleCoreAbi from "./abis/TwinkleCore.json";
import TwinklePayAbi from "./abis/TwinklePay.json";
import TwinkleSplitAbi from "./abis/TwinkleSplit.json";
import TwinkleEscrowAbi from "./abis/TwinkleEscrow.json";
import TwinkleSubscriptionAbi from "./abis/TwinkleSubscription.json";
import TwinkleX402Abi from "./abis/TwinkleX402.json";

// Inline contract addresses (Sepolia)
const SEPOLIA_CONTRACTS = {
  TwinkleCore: "0x0DF0E3024350ea0992a7485aDbDE425a79983c09" as const,
  TwinklePay: "0xAE1a483ce67a796FcdC7C986CbB556f2975bE190" as const,
  TwinkleSplit: "0x987c621118D66A1F58C032EBdDe8F4f3385B71E4" as const,
  TwinkleEscrow: "0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931" as const,
  TwinkleSubscription: "0xa4436C50743FF1eD0C38318A32F502b2A5F899E6" as const,
  TwinkleX402: "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3" as const,
};

const START_BLOCK = 10016000;
const CHAIN_ID = 11155111;

export default createConfig({
  networks: {
    sepolia: {
      chainId: CHAIN_ID,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    TwinkleCore: {
      network: "sepolia",
      abi: TwinkleCoreAbi,
      address: SEPOLIA_CONTRACTS.TwinkleCore,
      startBlock: START_BLOCK,
    },
    TwinklePay: {
      network: "sepolia",
      abi: TwinklePayAbi,
      address: SEPOLIA_CONTRACTS.TwinklePay,
      startBlock: START_BLOCK,
    },
    TwinkleSplit: {
      network: "sepolia",
      abi: TwinkleSplitAbi,
      address: SEPOLIA_CONTRACTS.TwinkleSplit,
      startBlock: START_BLOCK,
    },
    TwinkleEscrow: {
      network: "sepolia",
      abi: TwinkleEscrowAbi,
      address: SEPOLIA_CONTRACTS.TwinkleEscrow,
      startBlock: START_BLOCK,
    },
    TwinkleSubscription: {
      network: "sepolia",
      abi: TwinkleSubscriptionAbi,
      address: SEPOLIA_CONTRACTS.TwinkleSubscription,
      startBlock: START_BLOCK,
    },
    TwinkleX402: {
      network: "sepolia",
      abi: TwinkleX402Abi,
      address: SEPOLIA_CONTRACTS.TwinkleX402,
      startBlock: START_BLOCK,
    },
  },
});
