import {
  BaseProvider,
  IRequestArguments,
} from '@trustwallet/web3-provider-core';
import type { ISolanaProviderConfig } from './types/SolanaProvider';
import {
  SolanaSignInInput,
  SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  SendOptions,
  Connection,
} from '@solana/web3.js';
import { initialize } from './adapter/initialize';
import { ONTOWallet } from './adapter/wallet';
import { isVersionedTransaction } from './adapter/solana';
import * as bs58 from 'bs58';
import { MobileAdapter } from './MobileAdapter';
import { ISolanaProvider } from './adapter/window';

export class SolanaProvider extends BaseProvider implements ISolanaProvider {
  static NETWORK = 'solana';

  private mobileAdapter!: MobileAdapter;

  #disableMobileAdapter: boolean = false;

  #enableAdapter = true;

  #isConnected = false

  connection!: Connection;

  publicKey!: PublicKey | null;

  isONTO: boolean = true;
  isPhantom: Boolean = true;

  static bufferToHex(buffer: Buffer | Uint8Array | string) {
    return '0x' + Buffer.from(buffer).toString('hex');
  }

  static messageToBuffer(message: string | Buffer) {
    let buffer = Buffer.from([]);
    try {
      if (typeof message === 'string') {
        buffer = Buffer.from(message.replace('0x', ''), 'hex');
      } else {
        buffer = Buffer.from(message);
      }
    } catch (err) {
      console.log(`messageToBuffer error: ${err}`);
    }

    return buffer;
  }

  constructor(config?: ISolanaProviderConfig) {
    super();

    if (config) {
      if (typeof config.enableAdapter !== 'undefined') {
        this.#enableAdapter = config.enableAdapter;
      }

      if (typeof config.cluster !== 'undefined') {
        this.connection = new Connection(config.cluster, 'confirmed');
      }

      if (typeof config.disableMobileAdapter !== 'undefined') {
        this.#disableMobileAdapter = config.disableMobileAdapter;
      }

      if (typeof config.isOnto !== 'undefined') {
        this.isONTO = config.isOnto;
      }
    }

    if (this.#enableAdapter) {
      initialize(this);
    }

    if (!this.#disableMobileAdapter) {
      this.mobileAdapter = new MobileAdapter(this);
    }
  }

  getInstanceWithAdapter(): ONTOWallet {
    return new ONTOWallet(this);
  }

  async connect(
    options?: { onlyIfTrusted?: boolean | undefined } | undefined,
  ): Promise<{ publicKey: PublicKey }> {
    const res = await this.#privateRequest<{ publicKey: PublicKey }>({
      method: 'connect',
      params: { options },
    });

    this.publicKey = res.publicKey;
    this.#isConnected = true

    return res;
  }

  async getAccount(): Promise<string> {
    const res = await this.connect()
    return res.publicKey.toBase58();
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.publicKey = null;
      this.emit('disconnect');
      this.#isConnected = false
      resolve();
    });
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions | undefined,
  ): Promise<{ signature: string }> {
    const signedTx = await this.signTransaction(transaction);

    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize(),
      options,
    );

    return { signature: signature };
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    return this.#privateRequest({ method: 'signTransaction', params: tx });
  }

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }

  async signRawTransactionMulti<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ) {
    const signaturesEncoded = await this.#privateRequest<string[]>({
      method: 'signRawTransactionMulti',
      params: {
        transactions: transactions.map((tx) => {
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
            tx.serialize({
              requireAllSignatures: false,
              verifySignatures: false,
            }),
          ).toString('base64');

          return { data, raw, rawMessage, version };
        }),
      },
    });

    return signaturesEncoded.map((signature, i) =>
      this.mapSignedTransaction(transactions[i], signature),
    );
  }

  async signMessage(
    message: Uint8Array,
  ): Promise<{ signature: Uint8Array; publicKey: string | undefined }> {
    const data = SolanaProvider.bufferToHex(message);

    const res = await this.#privateRequest<string>({
      method: 'signMessage',
      params: { data },
    });

    return {
      signature: Buffer.from(SolanaProvider.messageToBuffer(res).buffer),
      publicKey: this.publicKey?.toBase58(),
    };
  }

  signIn(input?: SolanaSignInInput | undefined): Promise<SolanaSignInOutput> {
    throw new Error('Method not implemented.');
  }

  getNetwork(): string {
    return SolanaProvider.NETWORK;
  }

  mapSignedTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    signatureEncoded: string,
  ) {
    transaction.addSignature(this.publicKey!, bs58.decode(signatureEncoded));
    return transaction;
  }

  #privateRequest<T>(args: IRequestArguments): Promise<T> {
    const next = () => {
      return this.internalRequest(args) as Promise<T>;
    };

    if (this.mobileAdapter) {
      return this.mobileAdapter.request(args, next);
    }

    return next();
  }

  request<T>(_args: IRequestArguments): Promise<T> {
    throw new Error('Not implemented');
  }

  /**
   * Call request handler directly
   * @param args
   * @returns
   */
  internalRequest<T>(args: IRequestArguments): Promise<T> {
    return super.request<T>(args);
  }

  isConnected(): Boolean { return this.#isConnected }

  connected(): Boolean { return this.#isConnected }
}
