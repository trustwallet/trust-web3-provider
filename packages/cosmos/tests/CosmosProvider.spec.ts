import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';
import { IHandlerParams } from '@trustwallet/web3-provider-core/adapter/CallbackAdapter';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { CosmosProvider } from '../CosmosProvider';
import { StdSignDoc } from '@cosmjs/amino';
import { DirectSignDoc } from '@cosmos-kit/core';
import { BroadcastMode } from '../types/CosmosProvider';

let cosmos = new CosmosProvider();
const chainId = 'atom';

const account = 'cosmos1utt2qsfwr7pmqjw87aaf6rpgx049zel779e5ur';
const pubKey = Buffer.from('hello world').toString('hex');

afterEach(() => {
  cosmos = new CosmosProvider();
});

test('Cosmos Provider → initialization config is ok', async () => {
  cosmos = new CosmosProvider({ isKeplr: true });
  expect(cosmos.isKeplr).toBeTrue();

  cosmos = new CosmosProvider({ isKeplr: false });
  expect(cosmos.isKeplr).toBeFalse();
});

test('Cosmos Provider → getKey -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify({ address: account, pubKey })),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(cosmos);

  await cosmos.getKey(chainId);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      network: CosmosProvider.NETWORK,
      params: { chainId },
    }),
  );
});

test('Cosmos Provider → signAmino -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify({ address: account, pubKey })),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(cosmos);

  await cosmos.signAmino(chainId, account, {
    foo: 'bar',
  } as unknown as StdSignDoc);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      network: CosmosProvider.NETWORK,
      name: 'signTransaction',
      params: { chainId, sign_doc: { foo: 'bar' } },
    }),
  );
});

test('Cosmos Provider → signDirect -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve(JSON.stringify({ address: account, pubKey })),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(cosmos);

  const payload = {
    bodyBytes: Buffer.from('bar'),
    authInfoBytes: Buffer.from('bar'),
    chainId,
    accountNumber: null,
  };

  await cosmos.signDirect(chainId, account, payload);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signTransaction',
      network: CosmosProvider.NETWORK,
      params: {
        signerAddress: account,
        chainId,
        sign_doc: {
          bodyBytes: CosmosProvider.bufferToHex(payload.bodyBytes),
          authInfoBytes: CosmosProvider.bufferToHex(payload.authInfoBytes),
        },
      },
    }),
  );
});

test('Cosmos Provider → signArbitrary -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(cosmos);

  const payload = 'hello world';
  await cosmos.signArbitrary(chainId, account, payload);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signMessage',
      network: CosmosProvider.NETWORK,
      params: {
        signerAddress: account,
        chainId,
        data: CosmosProvider.bufferToHex(payload),
      },
    }),
  );
});

test('Cosmos Provider → sendTx -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve('0x0'));

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(cosmos);

  const payload = Buffer.from('mock tx');
  await cosmos.sendTx(chainId, payload, 'block' as BroadcastMode);

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'sendTransaction',
      network: CosmosProvider.NETWORK,
      params: {
        chainId,
        raw: payload.toString('base64'),
        mode: 'block',
      },
    }),
  );
});

test('Cosmos Provider → getOfflineSignerAmino', async () => {
  const signer = cosmos.getOfflineSignerAmino(chainId);

  expect(signer).toHaveProperty('getAccounts');
  expect(signer).toHaveProperty('sign');
  expect(signer).toHaveProperty('signAmino');
});

test('Cosmos Provider → getOfflineSignerDirect', async () => {
  const signer = cosmos.getOfflineSignerDirect(chainId);

  expect(signer).toHaveProperty('getAccounts');
  expect(signer).toHaveProperty('signDirect');
});
