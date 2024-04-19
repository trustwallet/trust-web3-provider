import { IRequestArguments } from '../Provider';
import { Adapter, AdapterStrategy, IAdapterRequestParams } from './Adapter';

export class PromiseAdapter extends Adapter {
  constructor() {
    super(AdapterStrategy.PROMISES);
  }

  request(params: IRequestArguments, network: string): Promise<any> {
    return super.request(params as IAdapterRequestParams, network);
  }
}
