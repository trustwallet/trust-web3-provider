import { BaseProvider } from '@trustwallet/web3-provider-core';
import type ITonProvider from './types/TonProvider';
import type { ITonProviderConfig } from './types/TonProvider';
import { MobileAdapter } from './MobileAdapter';

export class TonProvider extends BaseProvider implements ITonProvider {
  static NETWORK = 'ton';
  private mobileAdapter!: MobileAdapter;

  version = 'v4R2';

  constructor(config?: ITonProviderConfig) {
    super();

    if (config) {
      if (config.version) {
        this.version = config.version;
      }
    }

    if (!config?.disableMobileAdapter) {
      this.mobileAdapter = new MobileAdapter(this);
    }
  }

  disconnect() {
    return this.send('tonConnect_disconnect', {});
  }

  isConnected(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async send<T>(method: string, params?: unknown[] | object): Promise<T> {
    const next = () => {
      return this.internalRequest<T>(method, params) as Promise<T>;
    };

    if (this.mobileAdapter) {
      return await this.mobileAdapter.request<T>(method, params);
    }

    return await next();
  }

  internalRequest<T>(
    method: string,
    params: object | unknown[] | undefined,
  ): Promise<T> {
    return super.request<T>({
      method,
      params,
    });
  }

  getNetwork(): string {
    return TonProvider.NETWORK;
  }
}
