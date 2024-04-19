import { IRequestArguments } from '@trustwallet/web3-provider-core';
import { CosmosProvider } from './CosmosProvider';

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle
 */
export class MobileAdapter {
  private provider!: CosmosProvider;

  constructor(provider: CosmosProvider) {
    this.provider = provider;
  }

  /**
   * Mobile adapter maps some cosmos methods to existing mobile method names
   * @param args
   * @param next
   * @returns
   */
  async request<T>(
    args: IRequestArguments,
    next: () => Promise<T>,
  ): Promise<T> {
    if (args.method === 'getKey') {
      const res = await this.provider.internalRequest<string>({
        method: 'requestAccounts',
        params: args.params,
      });

      const account = JSON.parse(res);

      return {
        algo: 'secp256k1',
        address: account.address,
        bech32Address: account.address,
        pubKey: Buffer.from(account.pubKey, 'hex'),
      } as unknown as T;
    }

    const map: Record<string, string> = {
      signAmino: 'signTransaction',
      signDirect: 'signTransaction',
      signArbitrary: 'signMessage',
      sendTx: 'sendTransaction',
    };

    if (map[args.method]) {
      return this.provider.internalRequest({
        method: map[args.method],
        params: args.params,
      });
    }

    return next();
  }
}
