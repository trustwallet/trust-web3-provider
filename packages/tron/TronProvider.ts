import { BaseProvider } from '@trustwallet/web3-provider-core';
import type ITronProvider from './types/TronProvider';
import type { ITronProviderConfig } from './types/TronProvider';
import { TronWeb } from 'tronweb';
import { SignedTransaction, Transaction } from 'tronweb/lib/esm/types';

interface IRequestArguments {
  readonly method: string;
  readonly params?: unknown[] | object;
}

export class TronProvider extends BaseProvider implements ITronProvider {
  static NETWORK = 'tron';

  ready = false;

  tronWeb!: TronWeb;

  #config!: ITronProviderConfig;

  #node!: string;

  constructor(config?: ITronProviderConfig) {
    super();

    if (config) {
      this.#config = config;
    }

    this.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        window.postMessage(
          {
            message: {
              action: 'disconnect',
              data: {},
            },
          },
          '*',
        );
      } else {
        this.tronWeb.setAddress(accounts[0]);
        window.postMessage(
          {
            message: {
              action: 'accountsChanged',
              data: {
                address: accounts[0],
              },
            },
          },
          '*',
        );
      }
    });
  }

  getNetwork(): string {
    return TronProvider.NETWORK;
  }

  #internalRequest<T>(args: IRequestArguments): Promise<T> {
    return super.request<T>(args);
  }

  request(args: IRequestArguments): Promise<any> {
    const { method, params } = args;

    switch (method) {
      case 'tron_requestAccounts':
        return this.#requestAccounts();
    }

    return Promise.resolve(null);
  }

  setNode(url: string) {
    this.#node = url;
    this.tronWeb = new TronWeb({ fullHost: url });
  }

  async signMessage() {
    throw new Error('Not implemented signMessage');
  }

  async signMessageV2(
    data: string | Uint8Array | Array<number>,
  ): Promise<string> {
    return await this.#internalRequest<string>({
      method: 'signMessage',
      params: {
        data,
        isEthSign: false,
      },
    });
  }

  async sign<T extends SignedTransaction | Transaction | string>(
    transaction: T,
  ): Promise<any> {
    if (typeof transaction === 'object') {
      const result = await this.#internalRequest<string>({
        method: 'signTransaction',
        params: {
          transaction,
          raw: false,
        },
      });

      return result;
    } else if (typeof transaction === 'string') {
      return this.signMessageV2(transaction);
    } else {
      console.error('tx is not an object');
      throw new Error('Invalid TX format');
    }
  }

  async signTransactionOffline() {
    console.log('signTransactionOffline CALLED');
  }

  async #requestAccounts() {
    try {
      const accounts = await this.#internalRequest<string[]>({
        method: 'requestAccounts',
        params: {},
      });

      if (accounts) {
        this.ready = true;

        this.tronWeb.trx.signMessageV2 = this.signMessageV2.bind(this) as any;
        this.tronWeb.trx.sign = this.sign.bind(this);

        this.tronWeb.setAddress(accounts[0]);

        window.postMessage(
          {
            message: {
              action: 'connect',
              data: {},
            },
          },
          '*',
        );

        return { code: 200 };
      }
    } catch (e) {
      console.error(e);

      return { code: 4001 };
    }
  }

  connect() {
    return this.#requestAccounts();
  }
}
