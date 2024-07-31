import { TonProvider } from './TonProvider';

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle
 */
export class MobileAdapter {
  provider: TonProvider;

  constructor(provider: TonProvider) {
    this.provider = provider;
  }

  async request<T>(method: string, params?: unknown[] | object): Promise<T> {
    switch (method) {
      case 'tonConnect_connect':
      case 'tonConnect_reconnect': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );
        return JSON.parse(res);
      }

      case 'ton_rawSign':
        return this.provider.internalRequest<T>('signMessage', params);

      case 'ton_sendTransaction':
      case 'tonConnect_sendTransaction':
        return this.provider.internalRequest<T>('signTransaction', params);

      case 'ton_requestAccounts': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );

        const [{ nonBounceable }] = JSON.parse(res);
        return [nonBounceable] as T;
      }

      case 'ton_requestWallets': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );

        const [{ nonBounceable, publicKey }] = JSON.parse(res);

        return [
          {
            address: nonBounceable,
            publicKey,
            version: this.provider.version,
          },
        ] as T;
      }

      default:
        return this.provider.internalRequest(method, params);
    }
  }
}
