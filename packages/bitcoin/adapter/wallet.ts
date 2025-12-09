import type { Wallet } from '@wallet-standard/base';
import {
  StandardConnect,
  type StandardConnectFeature,
  type StandardConnectMethod,
  StandardDisconnect,
  type StandardDisconnectFeature,
  type StandardDisconnectMethod,
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

// Bitcoin-specific feature for signing messages
export const BitcoinSignMessage = 'bitcoin:signMessage';
export type BitcoinSignMessageMethod = (
  input: BitcoinSignMessageInput,
) => Promise<BitcoinSignMessageOutput>;

export interface BitcoinSignMessageInput {
  account: TrustBitcoinWalletAccount;
  message: string | Uint8Array;
  address: string;
}

export interface BitcoinSignMessageOutput {
  signature: Uint8Array;
}

export type BitcoinSignMessageFeature = {
  [BitcoinSignMessage]: {
    version: '1.0.0';
    signMessage: BitcoinSignMessageMethod;
  };
};

// Bitcoin-specific feature for signing PSBTs
export const BitcoinSignPSBT = 'bitcoin:signPSBT';
export type BitcoinSignPSBTMethod = (
  input: BitcoinSignPSBTInput,
) => Promise<BitcoinSignPSBTOutput>;

export interface BitcoinSignPSBTInput {
  account: TrustBitcoinWalletAccount;
  psbtHex: string;
  options?: {
    autoFinalized?: boolean;
  };
}

export interface BitcoinSignPSBTOutput {
  psbtHex: string;
}

export type BitcoinSignPSBTFeature = {
  [BitcoinSignPSBT]: {
    version: '1.0.0';
    signPSBT: BitcoinSignPSBTMethod;
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

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    BitcoinSignMessageFeature &
    BitcoinSignPSBTFeature &
    TrustFeature {
    return {
      [StandardConnect]: {
        version: '1.0.0',
        connect: this.#connect,
      },
      [StandardDisconnect]: {
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
      [BitcoinSignPSBT]: {
        version: '1.0.0',
        signPSBT: this.#signPSBT,
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

  #connect: StandardConnectMethod = async ({ silent } = {}) => {
    if (this.#accounts.length === 0) {
      await this.#trust.connect();
    }

    this.#connected();

    return { accounts: this.accounts };
  };

  #disconnect: StandardDisconnectMethod = async () => {
    await this.#trust.disconnect();
  };

  #signMessage: BitcoinSignMessageMethod = async (input) => {
    const { account, message, address } = input;

    if (!this.#accounts.find((acc) => acc.address === account.address)) {
      throw new Error('invalid account');
    }

    const messageToSign =
      typeof message === 'string' ? message : Buffer.from(message);

    const { signature } = await this.#trust.signMessage({
      message: messageToSign,
      address,
    });

    return { signature };
  };

  #signPSBT: BitcoinSignPSBTMethod = async (input) => {
    const { account, psbtHex, options } = input;

    if (!this.#accounts.find((acc) => acc.address === account.address)) {
      throw new Error('invalid account');
    }

    const signedPsbtHex = await this.#trust.signPSBT({
      psbtHex,
      options,
    });

    return { psbtHex: signedPsbtHex };
  };
}
