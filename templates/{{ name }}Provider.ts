

import { BaseProvider } from '@trustwallet/web3-provider-core';
import type I{{name}}Provider from './types/{{name}}Provider';
import type { I{{name}}ProviderConfig } from './types/{{name}}Provider';

export class {{name}}Provider
  extends BaseProvider
  implements I{{name}}Provider
{
  static NETWORK = '{{name}}';

  constructor(config?: I{{ name }}ProviderConfig) {
    super();
    // Your constructor logic here for setting config
  }

  getNetwork(): string {
    return {{name}}Provider.NETWORK;
  }
}
