import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { TonProvider } from '../TonProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';
import { IHandlerParams } from '@trustwallet/web3-provider-core/adapter/CallbackAdapter';

let Ton = new TonProvider();
const account = '0:123';

afterEach(() => {
  Ton = new TonProvider();
});

test('Ton Connect → tonConnect_connect', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([{ address: account }])),
  }).registerProvider(Ton);

  const accounts = await Ton.send('tonConnect_connect');
  expect(accounts).toEqual([{ address: account }]);
});

test('Ton Connect → tonConnect_connect → mobile adapter', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ address: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  await Ton.send('tonConnect_connect');

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'requestAccounts' }),
  );
});

test('Ton Connect → ton_rawSign', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ address: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  await Ton.send('ton_rawSign', { message: '123' });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signMessage',
      object: { message: '123' },
    }),
  );
});

test('Ton Connect → ton_sendTransaction', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ address: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  await Ton.send('ton_sendTransaction', [{ data: '123' }]);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signTransaction',
      object: { data: '123' },
    }),
  );
});

test('Ton Connect → tonConnect_sendTransaction', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ address: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  await Ton.send('tonConnect_sendTransaction', { data: '123' });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signTransaction',
      object: { data: '123' },
    }),
  );
});

test('Ton Connect → ton_requestAccounts', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ nonBounceable: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  const res = await Ton.send('ton_requestAccounts');

  expect(res).toEqual([account]);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'requestAccounts',
    }),
  );
});

test('Ton Connect → ton_requestWallets', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify([{ nonBounceable: account }])),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(Ton);

  const res = await Ton.send('ton_requestWallets');

  expect(res).toEqual([{ address: account, version: 'v4R2' }]);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'requestAccounts',
    }),
  );
});
