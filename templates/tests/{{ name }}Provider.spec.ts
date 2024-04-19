import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { {{name}}Provider } from '../{{name}}Provider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';

let {{name}} = new {{name}}Provider();
const account = '0x0000000000000000000000000000000000000000';

afterEach(() => {
  {{name}} = new {{name}}Provider();
});

// Direct methods
test('{{name}} Awesome test', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([account]),
  }).registerProvider({{name}});

  const accounts = await {{name}}.request({ method: 'test_method' });
  expect(accounts).toEqual([account]);
});
