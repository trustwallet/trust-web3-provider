import { EventEmitter } from 'events';
import type { CallbackAdapter } from './adapter/CallbackAdapter';
import type { PromiseAdapter } from './adapter/PromiseAdapter';
import { Adapter, AdapterStrategy } from './adapter/Adapter';

export interface IRequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface IBaseProvider {
  sendResponse(requestId: string, response: any): void;
  sendError(requestId: string, response: any): void;
  setAdapter(adapter: Adapter): IBaseProvider;
  request(args: IRequestArguments): Promise<unknown>;
}

/**
 * Base provider
 *
 * All providers should extend this one
 */
export abstract class BaseProvider
  extends EventEmitter
  implements IBaseProvider
{
  adapter!: CallbackAdapter | PromiseAdapter;

  setAdapter(adapter: CallbackAdapter | PromiseAdapter) {
    this.adapter = adapter;
    return this;
  }

  /**
   *
   * @param args
   */
  async request<T>(args: IRequestArguments): Promise<T> {
    if (!this.adapter) {
      throw new Error('No adapter set');
    }

    const res = await this.adapter.request(args, this.getNetwork());

    // Emit internally the response
    this.emit('onResponseReady', args, res);

    return res as T;
  }

  abstract getNetwork(): string;

  /**
   * Send Response if the adapter is on callback mode
   * @param requestId
   * @param response
   */
  sendResponse(requestId: string, response: any) {
    if (!this.adapter) {
      throw new Error('Adapter not found');
    }

    if (this.adapter.getStrategy() !== AdapterStrategy.CALLBACK) {
      throw new Error('Trying to send callback request on promisified adapter');
    }

    (this.adapter as CallbackAdapter).sendResponse(requestId, response);
  }

  /**
   * Send error
   * @param requestId
   * @param response
   */
  sendError(requestId: string, response: any) {
    if (!this.adapter) {
      throw new Error('Adapter not found');
    }

    if (this.adapter.getStrategy() !== AdapterStrategy.CALLBACK) {
      throw new Error('Trying to send callback request on promisified adapter');
    }

    (this.adapter as CallbackAdapter).sendError(requestId, response);
  }
}
