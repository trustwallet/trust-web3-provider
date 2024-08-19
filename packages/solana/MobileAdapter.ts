import { IRequestArguments } from '@trustwallet/web3-provider-core';
import { SolanaProvider } from './SolanaProvider';
import { isVersionedTransaction } from './adapter/solana';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { ConnectOptions } from './types/SolanaProvider';

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle
 */
export class MobileAdapter {
  private provider!: SolanaProvider;

  constructor(provider: SolanaProvider) {
    this.provider = provider;
  }

  async connect(
    options?: ConnectOptions | undefined,
  ): Promise<{ publicKey: PublicKey }> {
    const addresses = await this.provider.internalRequest<string[]>({
      method: 'requestAccounts',
      params: { options },
    });

    this.provider.emit('connect');
    return { publicKey: new PublicKey(addresses[0]) };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {

    let rawMessage: string;
    if (isVersionedTransaction(tx)) {
      rawMessage = SolanaProvider.bufferToHex(tx.message.serialize());
    } else {
      rawMessage = SolanaProvider.bufferToHex(tx.serializeMessage());
    }

    const response = await this.provider.internalRequest<{ signature: string }>({
      method: 'signTransaction',
      params: { message: rawMessage },
    });

    return this.provider.mapSignedTransaction<T>(tx, response.signature);
  }

  /**
   * Mobile adapter maps some solana methods to existing mobile method names
   * @param args
   * @param next
   * @returns
   */
  async request<T>(
    args: IRequestArguments,
    next: () => Promise<T>,
  ): Promise<T> {
    switch (args.method) {
      case 'signTransaction': {
        return this.signTransaction<Transaction | VersionedTransaction>(
          args.params as Transaction | VersionedTransaction,
        ) as unknown as T;
      }

      case 'connect': {
        return this.connect(
          (args?.params as { options: ConnectOptions })?.options,
        ) as unknown as T;
      }
    }

    return next();
  }
}
