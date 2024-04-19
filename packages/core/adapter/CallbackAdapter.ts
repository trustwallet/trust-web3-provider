import { v4 as uuidv4 } from 'uuid';

import { IRequestArguments } from '../Provider';

import { Adapter, AdapterStrategy, IAdapterRequestParams } from './Adapter';

export interface ICallbackAdapterRequestParams extends IAdapterRequestParams {
  id: string;
}

export interface IHandlerParams {
  id?: ICallbackAdapterRequestParams['id'];
  network: string;
  name: IAdapterRequestParams['method'];
  params: IAdapterRequestParams['params'];
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
      const id = uuidv4();
      this.callback.set(id, { reject, resolve });
      super.request({ ...params, id }, network);
    });
  }

  public sendResponse(requestId: string, response: any) {
    if (this.callback.has(requestId)) {
      const callback = this.callback.get(requestId);
      this.callback.delete(requestId);
      callback?.resolve(response);
    } else {
      console.error(`Unable to find callback for requestId: ${requestId}`);
    }
  }

  public sendError(requestId: string, error: any) {
    if (this.callback.has(requestId)) {
      const callback = this.callback.get(requestId);
      this.callback.delete(requestId);
      callback?.reject(error);
    } else {
      console.error(`Unable to find callback for requestId: ${requestId}`);
    }
  }
}
