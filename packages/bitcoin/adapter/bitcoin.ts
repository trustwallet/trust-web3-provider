import type { IdentifierString } from '@wallet-standard/base';

/** Bitcoin Mainnet */
export const BITCOIN_MAINNET_CHAIN = 'bitcoin:mainnet';

/** Bitcoin Testnet */
export const BITCOIN_TESTNET_CHAIN = 'bitcoin:testnet';

/** Array of all Bitcoin chains */
export const BITCOIN_CHAINS = [BITCOIN_MAINNET_CHAIN] as const;

/** Type of all Bitcoin chains */
export type BitcoinChain = (typeof BITCOIN_CHAINS)[number];

/**
 * Check if a chain corresponds with one of the Bitcoin chains.
 */
export function isBitcoinChain(chain: IdentifierString): chain is BitcoinChain {
  return BITCOIN_CHAINS.includes(chain as BitcoinChain);
}
