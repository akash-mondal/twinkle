/**
 * Contract ABI exports
 * Auto-generated from Foundry build output
 */

import TwinkleCoreAbi from './TwinkleCore.json' with { type: 'json' };
import TwinklePayAbi from './TwinklePay.json' with { type: 'json' };
import TwinkleSplitAbi from './TwinkleSplit.json' with { type: 'json' };
import TwinkleEscrowAbi from './TwinkleEscrow.json' with { type: 'json' };
import TwinkleSubscriptionAbi from './TwinkleSubscription.json' with { type: 'json' };
import TwinkleX402Abi from './TwinkleX402.json' with { type: 'json' };

export {
  TwinkleCoreAbi,
  TwinklePayAbi,
  TwinkleSplitAbi,
  TwinkleEscrowAbi,
  TwinkleSubscriptionAbi,
  TwinkleX402Abi,
};

/**
 * All ABIs as a single object for dynamic access
 */
export const ABIS = {
  TwinkleCore: TwinkleCoreAbi,
  TwinklePay: TwinklePayAbi,
  TwinkleSplit: TwinkleSplitAbi,
  TwinkleEscrow: TwinkleEscrowAbi,
  TwinkleSubscription: TwinkleSubscriptionAbi,
  TwinkleX402: TwinkleX402Abi,
} as const;

export type ContractName = keyof typeof ABIS;
