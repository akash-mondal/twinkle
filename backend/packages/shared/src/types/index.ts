export * from './contracts.js';
export * from './api.js';

/**
 * Common address type
 */
export type Address = `0x${string}`;

/**
 * Common hex string type
 */
export type Hex = `0x${string}`;

/**
 * Event log base type
 */
export interface EventLog {
  address: Address;
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}

/**
 * Indexed event with common fields
 */
export interface IndexedEvent {
  id: string;
  txHash: Hex;
  blockNumber: number;
  blockTimestamp: number;
  logIndex: number;
  chainId: number;
}
