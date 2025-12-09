export {
  TrustBitcoinWallet,
  TrustNamespace,
  BitcoinSignMessage,
  BitcoinSignPSBT,
} from './wallet';
export type {
  TrustFeature,
  BitcoinSignMessageMethod,
  BitcoinSignMessageInput,
  BitcoinSignMessageOutput,
  BitcoinSignMessageFeature,
  BitcoinSignPSBTMethod,
  BitcoinSignPSBTInput,
  BitcoinSignPSBTOutput,
  BitcoinSignPSBTFeature,
} from './wallet';
export { TrustBitcoinWalletAccount } from './account';
export { registerWallet, DEPRECATED_registerWallet } from './register';
export { initialize } from './initialize';
export { icon } from './icon';
export {
  BITCOIN_MAINNET_CHAIN,
  BITCOIN_TESTNET_CHAIN,
  BITCOIN_CHAINS,
  isBitcoinChain,
} from './bitcoin';
export type { BitcoinChain } from './bitcoin';
export type { TrustBitcoinEvent, TrustBitcoinEventEmitter } from './window';
