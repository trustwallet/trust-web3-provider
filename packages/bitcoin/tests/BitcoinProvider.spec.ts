import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { BitcoinProvider } from '../BitcoinProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';
import type { BtcAccount } from '../types/BitcoinProvider';

let bitcoin = new BitcoinProvider();
const mockAccount: BtcAccount = {
  address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  publicKey: '0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
};

afterEach(() => {
  bitcoin = new BitcoinProvider();
});

(global as any).window = {};

// Mock window
Object.assign(global.window, {
  location: {
    protocol: 'https',
    hostname: 'trust',
  },
});

test('Bitcoin -> connect()', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  const accounts = await bitcoin.connect();
  expect(accounts).toEqual([mockAccount]);
  expect(bitcoin.isConnected()).toBe(true);
});

test('Bitcoin -> disconnect()', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  await bitcoin.connect();
  expect(bitcoin.isConnected()).toBe(true);

  bitcoin.disconnect();
  expect(bitcoin.isConnected()).toBe(false);
  expect(bitcoin.getAccounts()).toEqual([]);
});

test('Bitcoin -> requestAccounts()', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  const accounts = await bitcoin.requestAccounts();
  expect(accounts).toEqual([mockAccount]);
  expect(bitcoin.getAccounts()).toEqual([mockAccount]);
});

test('Bitcoin -> getNetwork()', () => {
  expect(bitcoin.getNetwork()).toBe('bitcoin');
});

test('Bitcoin -> signMessage() with string', async () => {
  const handler = jest.fn(() => Promise.resolve(JSON.stringify([mockAccount])));
  const mockSignature = '0x1234567890abcdef';

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: (request: any) => {
      if (request.name === 'signMessage') {
        return Promise.resolve(mockSignature);
      }
      return Promise.resolve(JSON.stringify([mockAccount]));
    },
  }).registerProvider(bitcoin);

  const response = await bitcoin.signMessage({
    message: 'Hello Bitcoin',
    address: mockAccount.address,
  });

  expect(response.signature).toBeInstanceOf(Uint8Array);
  expect(response.signature.length).toBeGreaterThan(0);
});

test('Bitcoin -> signMessage() with Buffer', async () => {
  const mockSignature = '0x1234567890abcdef';

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: (request: any) => {
      if (request.name === 'signMessage') {
        expect(request.params.message).toMatch(/^0x/);
        expect(request.params.address).toBe(mockAccount.address);
        expect(request.params.originalMethod).toBe('signMessage');
        return Promise.resolve(mockSignature);
      }
      return Promise.resolve(JSON.stringify([mockAccount]));
    },
  }).registerProvider(bitcoin);

  const message = Buffer.from('Hello Bitcoin');
  const response = await bitcoin.signMessage({
    message,
    address: mockAccount.address,
  });

  expect(response.signature).toBeInstanceOf(Uint8Array);
});

test('Bitcoin -> signMessage() with Uint8Array', async () => {
  const mockSignature = '0x1234567890abcdef';

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: (request: any) => {
      if (request.name === 'signMessage') {
        return Promise.resolve(mockSignature);
      }
      return Promise.resolve(JSON.stringify([mockAccount]));
    },
  }).registerProvider(bitcoin);

  const message = new Uint8Array([72, 101, 108, 108, 111]);
  const response = await bitcoin.signMessage({
    message,
    address: mockAccount.address,
  });

  expect(response.signature).toBeInstanceOf(Uint8Array);
});

test('Bitcoin -> signPSBT()', async () => {
  const mockPSBT = '70736274ff01007d...';
  const mockSignedPSBT = '70736274ff01007d...signed';

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: (request: any) => {
      if (request.name === 'signPSBT') {
        expect(request.params.psbtHex).toBe(mockPSBT);
        expect(request.params.options).toEqual({ autoFinalized: true });
        return Promise.resolve(mockSignedPSBT);
      }
      return Promise.resolve(JSON.stringify([mockAccount]));
    },
  }).registerProvider(bitcoin);

  const signedPSBT = await bitcoin.signPSBT({
    psbtHex: mockPSBT,
    options: { autoFinalized: true },
  });

  expect(signedPSBT).toBe(mockSignedPSBT);
});

test('Bitcoin -> signPSBT() without options', async () => {
  const mockPSBT = '70736274ff01007d...';
  const mockSignedPSBT = '70736274ff01007d...signed';

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: (request: any) => {
      if (request.name === 'signPSBT') {
        expect(request.params.psbtHex).toBe(mockPSBT);
        expect(request.params.options).toBeUndefined();
        return Promise.resolve(mockSignedPSBT);
      }
      return Promise.resolve(JSON.stringify([mockAccount]));
    },
  }).registerProvider(bitcoin);

  const signedPSBT = await bitcoin.signPSBT({
    psbtHex: mockPSBT,
  });

  expect(signedPSBT).toBe(mockSignedPSBT);
});

test('Bitcoin -> bufferToHex()', () => {
  const buffer = Buffer.from('Hello');
  const hex = BitcoinProvider.bufferToHex(buffer);
  expect(hex).toBe('0x48656c6c6f');

  const uint8Array = new Uint8Array([72, 101, 108, 108, 111]);
  const hex2 = BitcoinProvider.bufferToHex(uint8Array);
  expect(hex2).toBe('0x48656c6c6f');

  const string = 'Hello';
  const hex3 = BitcoinProvider.bufferToHex(string);
  expect(hex3).toBe('0x48656c6c6f');
});

test('Bitcoin -> hexToUint8Array()', () => {
  const hex = '0x48656c6c6f';
  const uint8Array = BitcoinProvider.hexToUint8Array(hex);
  expect(uint8Array).toBeInstanceOf(Uint8Array);
  expect(Array.from(uint8Array)).toEqual([72, 101, 108, 108, 111]);

  const hexWithoutPrefix = '48656c6c6f';
  const uint8Array2 = BitcoinProvider.hexToUint8Array(hexWithoutPrefix);
  expect(Array.from(uint8Array2)).toEqual([72, 101, 108, 108, 111]);
});

test('Bitcoin -> getAccounts() returns empty array initially', () => {
  expect(bitcoin.getAccounts()).toEqual([]);
});

test('Bitcoin -> accountsChanged event on requestAccounts', async () => {
  const handler = jest.fn();

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  bitcoin.on('accountsChanged', handler);

  await bitcoin.requestAccounts();

  expect(handler).toHaveBeenCalledWith([mockAccount]);
});

test('Bitcoin -> connect event on connect()', async () => {
  const handler = jest.fn();

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  bitcoin.on('connect', handler);

  await bitcoin.connect();

  expect(handler).toHaveBeenCalled();
});

test('Bitcoin -> disconnect event on disconnect()', async () => {
  const handler = jest.fn();

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve(JSON.stringify([mockAccount])),
  }).registerProvider(bitcoin);

  bitcoin.on('disconnect', handler);

  await bitcoin.connect();
  bitcoin.disconnect();

  expect(handler).toHaveBeenCalled();
});
