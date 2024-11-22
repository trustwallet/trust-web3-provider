import { RPCError } from '../exceptions/RPCError';
import { IRequestArguments } from '../Provider';

import { Adapter, AdapterStrategy, IAdapterRequestParams } from './Adapter';

export interface ICallbackAdapterRequestParams extends IAdapterRequestParams {
  id: number;
}

export interface IHandlerParams {
  id?: ICallbackAdapterRequestParams['id'];
  network: string;
  name: IAdapterRequestParams['method'];
  params: IAdapterRequestParams['params'];

  // Retro compatibility with apps
  object: IAdapterRequestParams['params'];
}

interface ICallbackEntry {
  resolve: (value: unknown) => void;
  reject: (error?: any) => any;
}

/**
 * CallbackAdapter
 *
 * Adapter implementation that uses callbacks and requires
 * sendResponse() to resolve the web3 promise or sendError() to reject it
 */
export class CallbackAdapter extends Adapter {
  constructor() {
    super(AdapterStrategy.CALLBACK);
  }

  private callback: Map<string, ICallbackEntry> = new Map();

  async request(params: IRequestArguments, network: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = new Date().getTime() + Math.floor(Math.random() * 1000);
      this.callback.set(id.toString(), { reject, resolve });
      super.request({ ...params, id }, network);
    });
  }

  public sendResponse(requestId: number, response: any) {
    if (this.callback.has(requestId.toString())) {
      const callback = this.callback.get(requestId.toString());
      this.callback.delete(requestId.toString());
      callback?.resolve(response);
    } else {
      console.error(`Unable to find callback for requestId: ${requestId}`);
    }
  }

  public sendError(requestId: number, error: any) {
    if (this.callback.has(requestId.toString())) {
      const callback = this.callback.get(requestId.toString());
      this.callback.delete(requestId.toString());

      let errorParsed = error;

      // Parse error strings from mobile
      if (
        typeof errorParsed === 'string' &&
        !isNaN(parseInt(errorParsed, 10))
      ) {
        errorParsed = new RPCError(parseInt(errorParsed, 10), errorParsed);
      }

      callback?.reject(errorParsed);
    } else {
      console.error(`Unable to find callback for requestId: ${requestId}`);
    }
  }
}
