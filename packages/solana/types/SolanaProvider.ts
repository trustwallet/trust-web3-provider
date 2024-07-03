import {
  SolanaSignInInput,
  SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  SendOptions,
  TransactionSignature,
} from '@solana/web3.js';
import { TrustEventEmitter } from '../adapter/window';
import { TrustWallet } from '../adapter/wallet';

export interface ISolanaProviderConfig {
  isTrust?: boolean;
  enableAdapter?: boolean;
  cluster?: string;
  disableMobileAdapter?: boolean;
  useLegacySign?: boolean;
}

export interface ConnectOptions {
  onlyIfTrusted?: boolean | undefined;
}

export default interface ISolanaProvider extends TrustEventEmitter {
  publicKey: PublicKey | null;
  connect(options?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{ signature: TransactionSignature }>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput>;
  getInstanceWithAdapter(): TrustWallet;
}
