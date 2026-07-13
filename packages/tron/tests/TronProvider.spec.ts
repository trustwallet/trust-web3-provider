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

test('constructor with nodeURL creates the TronWeb instance', () => {
  const provider = new TronProvider({ nodeURL: 'https://foo.baz' });

  expect(provider.tronWeb).toBeDefined();
  expect(provider.getNetwork()).toEqual('tron');
});

test('constructor without config leaves TronWeb unset until setNode', () => {
  const provider = new TronProvider();

  expect(provider.tronWeb).toBeUndefined();

  provider.setNode('https://foo.baz');
  expect(provider.tronWeb).toBeDefined();
});

test('sign re-hydrates a string response into the signed-tx object', async () => {
  const signedTx = {
    txID: 'abc',
    raw_data_hex: '0a02',
    signature: ['deadbeef'],
  };

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify(signedTx)),
  }).registerProvider(Tron);

  const result = await Tron.sign({ raw_data: {}, raw_data_hex: '0a02' } as any);

  expect(result).toEqual(signedTx);
});

test('sign passes through an object response unchanged', async () => {
  const signedTx = { txID: 'abc', signature: ['deadbeef'] };

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(signedTx),
  }).registerProvider(Tron);

  const result = await Tron.sign({ raw_data: {} } as any);

  expect(result).toEqual(signedTx);
});
