import type { Wallet, WalletAccount } from '@wallet-standard/base';
import {
  StandardEvents,
  type StandardEventsFeature,
  type StandardEventsListeners,
  type StandardEventsNames,
  type StandardEventsOnMethod,
} from '@wallet-standard/features';
import { TrustBitcoinWalletAccount } from './account';
import { icon } from './icon';
import { BITCOIN_CHAINS } from './bitcoin';
import type IBitcoinProvider from '../types/BitcoinProvider';

export const TrustNamespace = 'trust:';

export type TrustFeature = {
  [TrustNamespace]: {
    trust: IBitcoinProvider;
  };
};

// Bitcoin-specific feature for connecting
export const BitcoinConnect = 'bitcoin:connect';
export type BitcoinAddressPurpose = 'ordinals' | 'payment';

export interface BitcoinConnectInput {
  readonly purposes?: BitcoinAddressPurpose[];
}

export interface BitcoinConnectOutput {
  readonly accounts: readonly WalletAccount[];
}

export type BitcoinConnectMethod = (
  input?: BitcoinConnectInput,
) => Promise<BitcoinConnectOutput>;

export type BitcoinConnectFeature = {
  [BitcoinConnect]: {
    version: '1.0.0';
    connect: BitcoinConnectMethod;
  };
};

// Bitcoin-specific feature for disconnecting
export const BitcoinDisconnect = 'bitcoin:disconnect';

export type BitcoinDisconnectMethod = () => void;

export type BitcoinDisconnectFeature = {
  [BitcoinDisconnect]: {
    version: '1.0.0';
    disconnect: BitcoinDisconnectMethod;
  };
};

// Bitcoin-specific feature for signing messages
export const BitcoinSignMessage = 'bitcoin:signMessage';
export type BitcoinSignMessageMethod = (
  ...inputs: BitcoinSignMessageInput[]
) => Promise<BitcoinSignMessageOutput[]>;

export interface BitcoinSignMessageInput {
  readonly account: WalletAccount;
  readonly message: Uint8Array;
}

export interface BitcoinSignMessageOutput {
  readonly signedMessage: Uint8Array;
  readonly signature: Uint8Array;
}

export type BitcoinSignMessageFeature = {
  [BitcoinSignMessage]: {
    version: '1.0.0';
    signMessage: BitcoinSignMessageMethod;
  };
};

// Bitcoin-specific feature for signing transactions
export const BitcoinSignTransaction = 'bitcoin:signTransaction';

export type BitcoinSigHash =
  | 'ALL'
  | 'NONE'
  | 'SINGLE'
  | 'ALL|ANYONECANPAY'
  | 'NONE|ANYONECANPAY'
  | 'SINGLE|ANYONECANPAY';

export interface BitcoinInputToSign {
  readonly account: WalletAccount;
  readonly signingIndexes: readonly number[];
  readonly sigHash?: BitcoinSigHash;
}

export interface BitcoinSignTransactionInput {
  readonly psbt: Uint8Array;
  readonly inputsToSign: readonly BitcoinInputToSign[];
  readonly chain?: string;
}

export interface BitcoinSignTransactionOutput {
  readonly signedPsbt: Uint8Array;
}

export type BitcoinSignTransactionMethod = (
  ...inputs: BitcoinSignTransactionInput[]
) => Promise<BitcoinSignTransactionOutput[]>;

export type BitcoinSignTransactionFeature = {
  [BitcoinSignTransaction]: {
    version: '1.0.0';
    signTransaction: BitcoinSignTransactionMethod;
  };
};

// Bitcoin-specific feature for signing and sending transactions
export const BitcoinSignAndSendTransaction = 'bitcoin:signAndSendTransaction';

export interface BitcoinSignAndSendTransactionInput
  extends Omit<BitcoinSignTransactionInput, 'chain'> {
  readonly chain: string; // Required for signAndSend
}

export interface BitcoinSignAndSendTransactionOutput {
  readonly txid: string;
}

export type BitcoinSignAndSendTransactionMethod = (
  ...inputs: BitcoinSignAndSendTransactionInput[]
) => Promise<BitcoinSignAndSendTransactionOutput[]>;

export type BitcoinSignAndSendTransactionFeature = {
  [BitcoinSignAndSendTransaction]: {
    version: '1.0.0';
    signAndSendTransaction: BitcoinSignAndSendTransactionMethod;
  };
};

export class TrustBitcoinWallet implements Wallet {
  readonly #listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};
  readonly #version = '1.0.0' as const;
  readonly #name = 'Trust' as const;
  readonly #icon = icon;
  #accounts: TrustBitcoinWalletAccount[] = [];
  readonly #trust: IBitcoinProvider;

  get version() {
    return this.#version;
  }

  get name() {
    return this.#name;
  }

  get icon() {
    return this.#icon;
  }

  get chains() {
    return BITCOIN_CHAINS.slice();
  }

  get features(): BitcoinConnectFeature &
    BitcoinDisconnectFeature &
    StandardEventsFeature &
    BitcoinSignMessageFeature &
    BitcoinSignTransactionFeature &
    BitcoinSignAndSendTransactionFeature &
    TrustFeature {
    return {
      [BitcoinConnect]: {
        version: '1.0.0',
        connect: this.#connect,
      },
      [BitcoinDisconnect]: {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      [StandardEvents]: {
        version: '1.0.0',
        on: this.#on,
      },
      [BitcoinSignMessage]: {
        version: '1.0.0',
        signMessage: this.#signMessage,
      },
      [BitcoinSignTransaction]: {
        version: '1.0.0',
        signTransaction: this.#signTransaction,
      },
      [BitcoinSignAndSendTransaction]: {
        version: '1.0.0',
        signAndSendTransaction: this.#signAndSendTransaction,
      },
      [TrustNamespace]: {
        trust: this.#trust,
      },
    };
  }

  get accounts() {
    return this.#accounts;
  }

  constructor(trust: IBitcoinProvider) {
    if (new.target === TrustBitcoinWallet) {
      Object.freeze(this);
    }

    this.#trust = trust;

    trust.on('connect', this.#connected, this);
    trust.on('disconnect', this.#disconnected, this);
    trust.on('accountsChanged', this.#accountsChanged, this);

    this.#connected();
  }

  #on: StandardEventsOnMethod = (event, listener) => {
    this.#listeners[event]?.push(listener) ||
      (this.#listeners[event] = [listener]);
    return (): void => this.#off(event, listener);
  };

  #emit<E extends StandardEventsNames>(
    event: E,
    ...args: Parameters<StandardEventsListeners[E]>
  ): void {
    // eslint-disable-next-line prefer-spread
    this.#listeners[event]?.forEach((listener) => listener.apply(null, args));
  }

  #off<E extends StandardEventsNames>(
    event: E,
    listener: StandardEventsListeners[E],
  ): void {
    this.#listeners[event] = this.#listeners[event]?.filter(
      (existingListener) => listener !== existingListener,
    );
  }

  #connected = () => {
    const accounts = this.#trust.getAccounts();
    if (accounts && accounts.length > 0) {
      this.#accounts = accounts.map((account) => {
        // Convert hex public key to Uint8Array
        const publicKeyHex = account.publicKey.replace('0x', '');
        const publicKey = new Uint8Array(
          publicKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
        );

        return new TrustBitcoinWalletAccount({
          address: account.address,
          publicKey,
        });
      });
      this.#emit('change', { accounts: this.accounts });
    }
  };

  #disconnected = () => {
    if (this.#accounts.length > 0) {
      this.#accounts = [];
      this.#emit('change', { accounts: this.accounts });
    }
  };

  #accountsChanged = (accounts: any) => {
    if (accounts && accounts.length > 0) {
      this.#connected();
    } else {
      this.#disconnected();
    }
  };

  #connect: BitcoinConnectMethod = async (input) => {
    if (this.#accounts.length === 0) {
      await this.#trust.connect();
    }

    this.#connected();

    return { accounts: this.accounts };
  };

  #disconnect: BitcoinDisconnectMethod = () => {
    this.#trust.disconnect();
  };

  #signMessage: BitcoinSignMessageMethod = async (...inputs) => {
    const outputs: BitcoinSignMessageOutput[] = [];

    for (const input of inputs) {
      const { account, message } = input;

      if (!this.#accounts.find((acc) => acc.address === account.address)) {
        throw new Error('invalid account');
      }

      // Use the first account's address if available
      const address = this.#accounts[0]?.address || account.address;

      const { signature } = await this.#trust.signMessage({
        message: Buffer.from(message),
        address,
      });

      outputs.push({
        signedMessage: message,
        signature,
      });
    }

    return outputs;
  };

  #signTransaction: BitcoinSignTransactionMethod = async (...inputs) => {
    const outputs: BitcoinSignTransactionOutput[] = [];

    for (const input of inputs) {
      const { psbt, inputsToSign, chain } = input;

      // Validate that at least one account is valid
      for (const { account } of inputsToSign) {
        if (!this.#accounts.find((acc) => acc.address === account.address)) {
          throw new Error('invalid account');
        }
      }

      // Validate chain if provided
      if (chain && !this.chains.includes(chain as any)) {
        throw new Error('invalid chain');
      }

      // Convert PSBT Uint8Array to base64 (standard PSBT format)
      const psbtBase64 = Buffer.from(psbt).toString('base64');

      // Sign the PSBT
      const signedPsbtBase64 = await this.#trust.signPSBT({
        psbtHex: psbtBase64,
        options: {},
      });

      // Convert back to Uint8Array
      const signedPsbt = new Uint8Array(Buffer.from(signedPsbtBase64, 'base64'));

      outputs.push({ signedPsbt });
    }

    return outputs;
  };

  #signAndSendTransaction: BitcoinSignAndSendTransactionMethod = async (...inputs) => {
    const outputs: BitcoinSignAndSendTransactionOutput[] = [];

    for (const input of inputs) {
      const { psbt, inputsToSign, chain } = input;

      // Validate that at least one account is valid
      for (const { account } of inputsToSign) {
        if (!this.#accounts.find((acc) => acc.address === account.address)) {
          throw new Error('invalid account');
        }
      }

      // Validate chain (required for signAndSend)
      if (!chain) {
        throw new Error('chain is required for signAndSendTransaction');
      }
      if (!this.chains.includes(chain as any)) {
        throw new Error('invalid chain');
      }

      // Convert PSBT Uint8Array to base64 (standard PSBT format)
      const psbtBase64 = Buffer.from(psbt).toString('base64');

      // Sign the PSBT
      const signedPsbtBase64 = await this.#trust.signPSBT({
        psbtHex: psbtBase64,
        options: { autoFinalized: true },
      });

      // Broadcast the signed transaction
      const { txid } = await this.#trust.pushPSBT({
        psbtHex: signedPsbtBase64,
      });

      outputs.push({ txid });
    }

    return outputs;
  };
}
