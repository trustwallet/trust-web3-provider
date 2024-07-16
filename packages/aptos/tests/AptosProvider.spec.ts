import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { AptosProvider } from '../AptosProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';

let aptos = new AptosProvider();
const account = '0x0000000000000000000000000000000000000000';

afterEach(() => {
  aptos = new AptosProvider();
});

// Mock window
Object.assign(globalThis.window || {}, {
  location: {
    protocol: 'https',
    hostname: 'trust',
  },
});

test('Aptos -> connect()', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([account])),
  }).registerProvider(aptos);

  const accounts = await aptos.connect();
  expect(accounts).toEqual([account]);
});

test('Aptos -> signMessage()', async () => {
  const handler = jest.fn(() => Promise.resolve(JSON.stringify([account])));

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(aptos);

  aptos.setConfig({
    network: 'n',
    address: '123',
    chainId: '1',
  });

  await aptos.signMessage({
    address: '1',
    application: '2',
    message: '3',
    nonce: '4',
    chainId: '1',
  });

  expect(handler).toBeCalledTimes(2);
  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signMessage',
    }),
  );
});
