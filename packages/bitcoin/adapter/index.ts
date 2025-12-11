export {
  TrustBitcoinWallet,
  TrustNamespace,
  BitcoinConnect,
  BitcoinDisconnect,
  BitcoinSignMessage,
  BitcoinSignTransaction,
  BitcoinSignAndSendTransaction,
} from './wallet';
export type {
  TrustFeature,
  BitcoinAddressPurpose,
  BitcoinConnectInput,
  BitcoinConnectOutput,
  BitcoinConnectMethod,
  BitcoinConnectFeature,
  BitcoinDisconnectMethod,
  BitcoinDisconnectFeature,
  BitcoinSignMessageMethod,
  BitcoinSignMessageInput,
  BitcoinSignMessageOutput,
  BitcoinSignMessageFeature,
  BitcoinSigHash,
  BitcoinInputToSign,
  BitcoinSignTransactionMethod,
  BitcoinSignTransactionInput,
  BitcoinSignTransactionOutput,
  BitcoinSignTransactionFeature,
  BitcoinSignAndSendTransactionMethod,
  BitcoinSignAndSendTransactionInput,
  BitcoinSignAndSendTransactionOutput,
  BitcoinSignAndSendTransactionFeature,
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
