import type IEthereumProvider from './types/EthereumProvider';

import type { IRequestArguments } from './types';

import { BaseProvider } from '@trustwallet/web3-provider-core';
import type { IEthereumProviderConfig } from './types/EthereumProvider';
import { RPCError } from './exceptions/RPCError';
import { MobileAdapter } from './MobileAdapter';
import { RPCServer } from './RPCServer';

export class EthereumProvider
  extends BaseProvider
  implements IEthereumProvider
{
  static NETWORK = 'ethereum';

  // should be hex
  #chainId!: string;

  #rpcUrl!: string;

  #disableMobileAdapter: boolean = false;

  #overwriteMetamask = false;

  #address!: string;

  private mobileAdapter!: MobileAdapter;

  #rpc!: RPCServer;

  isTrust: boolean = true;

  isTrustWallet: boolean = true;

  providers: object[] | null = null;

  constructor(config?: IEthereumProviderConfig) {
    super();

    if (config) {
      if (config.chainId) {
        this.#chainId = config.chainId;
      }

      if (config.rpc) {
        this.#rpcUrl = config.rpc;
      }

      if (typeof config.overwriteMetamask !== 'undefined') {
        this.#overwriteMetamask = config.overwriteMetamask;
      }

      if (typeof config.disableMobileAdapter !== 'undefined') {
        this.#disableMobileAdapter = config.disableMobileAdapter;
      }

      if (typeof config.isTrust !== 'undefined') {
        this.isTrust = config.isTrust;
        this.isTrustWallet = config.isTrust;
      }

      this.#rpc = new RPCServer(this.#rpcUrl);
    }

    if (!this.#disableMobileAdapter) {
      this.mobileAdapter = new MobileAdapter(this);
    }

    this.on('onResponseReady', this.onResponseReady.bind(this));

    this.connect();
  }

  /**
   * Emit connect event with ProviderConnectInfo
   */
  private connect() {
    this.emit('connect', { chainId: this.#chainId });
  }

  /**
   * @deprecated
   * @returns
   */
  public enable(): Promise<string[]> {
    return this.request<string[]>({ method: 'eth_requestAccounts' });
  }

  /**
   * sendAsync
   *
   * @deprecated
   * @param args
   * @param callback
   */
  sendAsync(
    args: IRequestArguments,
    callback: (error: any | null, data: unknown | null) => void,
  ): void {
    if (Array.isArray(args)) {
      Promise.all(args.map((payload) => this.request(payload)))
        .then((data) => callback(null, data))
        .catch((error) => callback(error, null));
    } else {
      this.request(args)
        .then((data) => callback(null, data))
        .catch((error) => callback(error, null));
    }
  }

  /**
   * @deprecated Use request() method instead.
   */
  _send(payload: IRequestArguments) {
    const response: { result: any; jsonrpc: string } = {
      jsonrpc: '2.0',
      result: null,
    };

    switch (payload.method) {
      case 'eth_accounts':
      case 'eth_coinbase':
      case 'net_version':
      case 'eth_chainId':
        response.result = this.handleStaticRequests({
          method: 'eth_accounts',
        }) as any;
        break;

      default:
        throw new RPCError(
          4200,
          `Trust does not support calling ${payload.method} synchronously without a callback. Please provide a callback parameter to call ${payload.method} asynchronously.`,
        );
    }

    return response;
  }

  /**
   * @deprecated Use request() method instead.
   */
  send(methodOrPayload: unknown, callbackOrArgs?: unknown): unknown {
    if (
      typeof methodOrPayload === 'string' &&
      (!callbackOrArgs || Array.isArray(callbackOrArgs))
    ) {
      const context = this;

      return new Promise((resolve, reject) => {
        try {
          const req = context.request({
            method: methodOrPayload,
            params: callbackOrArgs as unknown[],
          });

          if (req instanceof Promise) {
            req.then(resolve).catch(reject);
          } else {
            resolve(req);
          }
        } catch (error) {
          reject(error);
        }
      });
    } else if (
      methodOrPayload &&
      typeof methodOrPayload === 'object' &&
      typeof callbackOrArgs === 'function'
    ) {
      return this.request(methodOrPayload as IRequestArguments).then(
        callbackOrArgs as (...args: unknown[]) => void,
      );
    }

    return this._send(methodOrPayload as IRequestArguments);
  }

  internalRequest<T>(args: IRequestArguments): Promise<T> {
    return super.request<T>(args);
  }

  /**
   * request order is
   *
   *  mobileAdapter (if enabled)
   *      -----> staticHandler
   *                -----> client handler (internalRequest)
   *
   * @param args
   * @returns
   */
  request<T>(args: IRequestArguments): Promise<T> {
    const next = () => {
      return this.internalRequest(args) as Promise<T>;
    };

    if (this.mobileAdapter) {
      const req = this.handleStaticRequests(args, () =>
        this.mobileAdapter.request(args),
      );

      if (req instanceof Promise) {
        return req;
      } else {
        return Promise.resolve(req) as Promise<T>;
      }
    }

    return this.handleStaticRequests(args, next) as Promise<T>;
  }

  /**
   * Methods that don't require reaching the handler
   * @param args
   * @param next
   * @returns
   */
  private handleStaticRequests<T>(
    args: IRequestArguments,
    next?: () => Promise<T>,
  ): Promise<T> | T | undefined {
    switch (args.method) {
      case 'net_version':
        return (this.#chainId
          ? parseInt(this.#chainId)
          : undefined) as unknown as unknown as T;
      case 'eth_chainId':
        return this.#chainId as unknown as T;
      case 'eth_accounts':
      case 'eth_coinbase':
        return (this.#address ? [this.#address] : []) as unknown as T;
    }
    if (next) {
      return next();
    }
  }

  /**
   * The provider needs to be stateful for certain request such as
   * storing the user's address after a eth_requestAccounts, this is for
   * mobile compatibility
   *
   * @param req
   * @param response
   * @returns
   */
  private onResponseReady(req: IRequestArguments, response: unknown) {
    if (!response) {
      return;
    }

    switch (req.method) {
      case 'eth_requestAccounts':
      case 'requestAccounts':
        this.#address = (response as string[])[0];
    }
  }

  getNetwork() {
    return EthereumProvider.NETWORK;
  }

  get connected(): boolean {
    return true;
  }

  get isMetaMask(): boolean {
    return this.#overwriteMetamask;
  }

  getChainId() {
    return this.#chainId;
  }

  getNetworkVersion() {
    return this.handleStaticRequests({
      method: 'net_version ',
    }) as number | undefined;
  }

  public setChainId(chainId: string) {
    this.#chainId = chainId;
  }

  public setRPCUrl(rpcUrl: string) {
    this.#rpcUrl = rpcUrl;
  }

  public getRPC() {
    return this.#rpc;
  }

  public setOverwriteMetamask(overwriteMetamask: boolean) {
    this.#overwriteMetamask = overwriteMetamask;
  }

  public getAddress() {
    return this.#address;
  }

  public setAddress(address: string) {
    this.#address = address;
  }

  setRPC(rpc: any) {
    this.#rpc = rpc;
  }
}
