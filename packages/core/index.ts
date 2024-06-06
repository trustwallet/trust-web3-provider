import { BaseProvider, IBaseProvider } from './Provider';
import {
  AdapterStrategy,
  AdapterStrategyType,
  IHandler,
  type Adapter,
} from './adapter/Adapter';
import { CallbackAdapter } from './adapter/CallbackAdapter';
import { PromiseAdapter } from './adapter/PromiseAdapter';

/**
 * Trust web3 Provider
 *
 *
 */
export class Web3Provider {
  #adapter!: Adapter;

  constructor(params: { strategy: AdapterStrategyType; handler?: IHandler }) {
    const adapter =
      params.strategy === AdapterStrategy.CALLBACK
        ? new CallbackAdapter()
        : new PromiseAdapter();

    if (params.handler) {
      adapter.setHandler(params.handler);
    }

    this.setAdapter(adapter);
  }

  setHandler(handler: IHandler) {
    this.#adapter.setHandler(handler);
  }

  private setAdapter(adapter: Adapter) {
    this.#adapter = adapter;
    return this;
  }

  registerProvider(provider: BaseProvider) {
    provider.setAdapter(this.#adapter);
    return this;
  }

  registerProviders(providers: BaseProvider[]) {
    providers.forEach((provider) => this.registerProvider(provider));
    return this;
  }

  sendResponse(requestId: string, response: any) {
    if (this.#adapter.getStrategy() === 'CALLBACK') {
      (this.#adapter as CallbackAdapter).sendResponse(requestId, response);
    }
  }

  sendError(requestId: string, error: any) {
    if (this.#adapter.getStrategy() === 'CALLBACK') {
      (this.#adapter as CallbackAdapter).sendError(requestId, error);
    }
  }
}

export * from './Provider';
