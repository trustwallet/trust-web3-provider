import { IRequestArguments } from './types';
import { RPCError } from './exceptions/RPCError';
import type { EthereumProvider } from './EthereumProvider';

export interface RPC {
  call<T>(payload: {
    jsonrpc: string;
    method: string;
    params: IRequestArguments['params'];
  }): Promise<T>;
}

// Methods that must never be tunneled to an RPC node — they're wallet-side
// (EIP-1474 wallet_*, EIP-758 subscriptions, filter family). RPC nodes reject
// them with a confusing 400; reject explicitly here.
const NATIVE_RPC_DENYLIST_PREFIXES = ['wallet_'];
const NATIVE_RPC_DENYLIST_EXACT = new Set<string>([
  'eth_subscribe',
  'eth_unsubscribe',
  'eth_newFilter',
  'eth_newBlockFilter',
  'eth_newPendingTransactionFilter',
  'eth_uninstallFilter',
]);

/**
 * RPC implementation that tunnels JSON-RPC reads through the native bridge
 * instead of fetch(). This avoids the page's `connect-src` CSP — which blocks
 * Trust's RPC subdomain on dApps like Uniswap and aborts the swap flow before
 * `eth_sendTransaction` is ever reached. Native HTTP is outside the WebView's
 * policy boundary, so any method works.
 */
export class NativeRPC implements RPC {
  #provider: EthereumProvider;

  constructor(provider: EthereumProvider) {
    this.#provider = provider;
  }

  async call<T>(payload: {
    jsonrpc: string;
    method: string;
    params: IRequestArguments['params'];
  }): Promise<T> {
    const method = payload.method;
    if (
      NATIVE_RPC_DENYLIST_EXACT.has(method) ||
      NATIVE_RPC_DENYLIST_PREFIXES.some((p) => method.startsWith(p))
    ) {
      throw new RPCError(
        4200,
        `EthereumProvider does not support calling ${method}`,
      );
    }

    return this.#provider.internalRequest<T>({
      method: 'rpcCall',
      params: {
        method: payload.method,
        params: payload.params,
        jsonrpc: payload.jsonrpc,
      },
    });
  }
}

export class RPCServer implements RPC {
  #rpcUrl: string;

  constructor(rpcUrl: string) {
    this.#rpcUrl = rpcUrl;
  }

  async getBlockNumber() {
    const json = await this.call({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
    });

    return json.result;
  }

  async getBlockByNumber(number: number) {
    const json = await this.call({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [number, false],
    });

    return json.result;
  }

  getFilterLogs(filter: string) {
    return this.call({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [filter],
    });
  }

  async call(payload: {
    jsonrpc: string;
    method: string;
    params: IRequestArguments['params'];
  }) {
    const response = await fetch(this.#rpcUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: new Date().getTime() + Math.floor(Math.random() * 1000),
        ...payload,
      }),
    });

    const json = await response.json();

    if (!json.result && json.error) {
      throw new Error(json.error.message || 'rpc error');
    }

    return json.result;
  }
}
