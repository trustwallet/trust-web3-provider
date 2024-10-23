import { IRequestArguments } from './types';
export interface RPC {
  call<T>(payload: {
    jsonrpc: string;
    method: string;
    params: IRequestArguments['params'];
  }): Promise<T>;
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
