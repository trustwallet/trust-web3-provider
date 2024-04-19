import {
  IHandlerParams,
  ICallbackAdapterRequestParams,
} from './CallbackAdapter';

export const AdapterStrategy = {
  PROMISES: 'PROMISES',
  CALLBACK: 'CALLBACK',
} as const;

interface IAdapter {}

export interface IAdapterRequestParams {
  params?: unknown[] | object;
  method: string;
}

export type IHandler = (params: IHandlerParams) => Promise<any>;

export type AdapterStrategyType = keyof typeof AdapterStrategy;

/**
 * Abstract adapter
 */
export abstract class Adapter {
  /**
   * Strategy to wait for wallet's response
   */
  #strategy!: AdapterStrategyType;

  /**
   * Function that will handle requests on wallet side
   */
  #handler!: IHandler;

  static isCallbackAdapterRequest(
    params: IAdapterRequestParams | ICallbackAdapterRequestParams,
  ): params is ICallbackAdapterRequestParams {
    return (params as ICallbackAdapterRequestParams).id !== undefined;
  }

  constructor(strategy: AdapterStrategyType) {
    this.setStrategy(strategy);
  }

  setHandler(remoteHandler: IHandler) {
    this.#handler = remoteHandler;
    return this;
  }

  request(
    params: IAdapterRequestParams | ICallbackAdapterRequestParams,
    network: string,
  ): Promise<any> {
    if (!this.#handler) {
      throw new Error('No handler defined for Adapter');
    }

    if (Adapter.isCallbackAdapterRequest(params)) {
      return this.#handler({
        network,
        id: params.id,
        name: params.method,
        params: params.params,
      });
    }

    return this.#handler({
      name: params.method,
      network,
      params: params.params,
    });
  }

  setStrategy(strategy: AdapterStrategyType) {
    this.#strategy = strategy;
    return this;
  }

  getStrategy() {
    return this.#strategy;
  }
}
