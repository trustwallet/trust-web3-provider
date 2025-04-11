import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { TronProvider } from '../TronProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';

let Tron = new TronProvider();
const account = '0x0000000000000000000000000000000000000000';

afterEach(() => {
  Tron = new TronProvider();
  Tron.setNode('https://foo.baz');
});

// Direct methods
test('Tron Awesome test', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([account]),
  }).registerProvider(Tron);

  const accounts = await Tron.request({
    method: 'tron_requestAccounts',
  });
});
