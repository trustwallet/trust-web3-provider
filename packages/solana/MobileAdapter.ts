import { IRequestArguments } from '@trustwallet/web3-provider-core';
import { SolanaProvider } from './SolanaProvider';
import { isVersionedTransaction } from './adapter/solana';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { ConnectOptions } from './types/SolanaProvider';
import * as bs58 from 'bs58';

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle
 */
export class MobileAdapter {
  private provider!: SolanaProvider;
  private useLegacySign = false;

  constructor(provider: SolanaProvider, useLegacySign = false) {
    this.provider = provider;
    this.useLegacySign = useLegacySign;
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
    if (this.useLegacySign) {
      return (await this.legacySign<T>(tx)) as T;
    }

    const data = JSON.stringify(tx);

    let version: string | number = 'legacy';
    let rawMessage: string;

    if (isVersionedTransaction(tx)) {
      version = tx.version;
      rawMessage = Buffer.from(tx.message.serialize()).toString('base64');
    } else {
      rawMessage = Buffer.from(tx.serializeMessage()).toString('base64');
    }

    const raw = Buffer.from(
      tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
    ).toString('base64');

    const signatureEncoded = await this.provider.internalRequest<string>({
      method: 'signRawTransaction',
      params: {
        data,
        raw,
        rawMessage,
        version,
      },
    });

    return this.provider.mapSignedTransaction<T>(tx, signatureEncoded);
  }

  async legacySign<T extends Transaction | VersionedTransaction>(tx: T) {
    const data = JSON.stringify(tx);

    const version =
      typeof (tx as VersionedTransaction).version !== 'number'
        ? 'legacy'
        : (tx as VersionedTransaction).version;

    const raw = bs58.encode(
      version === 'legacy'
        ? (tx as Transaction).serializeMessage()
        : version === 0
        ? (tx as VersionedTransaction).message.serialize()
        : tx.serialize(),
    );

    try {
      const signatureEncoded = await this.provider.internalRequest<string>({
        method: 'signRawTransaction',
        params: { data, raw, version },
      });

      return this.provider.mapSignedTransaction<T>(tx, signatureEncoded);
    } catch (error) {
      console.log(`<== Error: ${error}`);
    }
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
