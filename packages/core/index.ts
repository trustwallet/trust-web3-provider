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

  constructor(params: { strategy: AdapterStrategyType; handler: IHandler }) {
    const adapter =
      params.strategy === AdapterStrategy.CALLBACK
        ? new CallbackAdapter()
        : new PromiseAdapter();

    adapter.setHandler(params.handler);
    this.setAdapter(adapter);
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
}

export * from './Provider';
