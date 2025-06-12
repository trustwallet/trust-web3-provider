import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { SolanaProvider } from '../SolanaProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';
import { window } from './mocks/window';
import { IHandlerParams } from '@trustwallet/web3-provider-core/adapter/CallbackAdapter';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { StandardConnect } from '@wallet-standard/features';
import {
  SolanaSignMessage,
  SolanaSignTransaction,
} from '@solana/wallet-standard-features';

// Mock window to allow solana adapter to work
global.window = window;

let Solana = new SolanaProvider();
const account = '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R';
const signature =
  '5LrcE2f6uvydKRquEJ8xp19heGxSvqsVbcqUeFoiWbXe8JNip7ftPQNTAVPyTK7ijVdpkzmKKaAQR7MWMmujAhXD';

function transaction() {
  const accountPublicKey = new PublicKey(account);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: accountPublicKey,
      toPubkey: accountPublicKey,
      lamports: 100,
    }),
  );

  transaction.feePayer = accountPublicKey;
  transaction.recentBlockhash = '6VdVbpsv7b5cSekEimjMTddydrikUsbeXQcizEk6LqSn';

  return transaction;
}

afterEach(() => {
  Solana = new SolanaProvider();
});

test('Solana Provider → connect -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: handler,
  }).registerProvider(Solana);

  await window.wallet.features[StandardConnect].connect();

  //await Solana.getInstanceWithAdapter().connect();

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'requestAccounts',
      network: 'solana',
    }),
  );
});

test('Solana Provider → signMessage -> payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: handler,
  }).registerProvider(Solana);

  const accountConnect = await window.wallet.features[
    StandardConnect
  ].connect();

  await window.wallet.features[SolanaSignMessage].signMessage({
    account: accountConnect.accounts[0],
    message: Buffer.from('Random message'),
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'signMessage',
      network: 'solana',
      params: {
        data: `0x${Buffer.from('Random message').toString('hex')}`,
        originalMethod: 'signMessage',
      },
    }),
  );
});

test('Solana Provider → signTransaction -> payload is correct for legacy', async () => {
  const handler = jest.fn((_params: IHandlerParams) => {
    if (_params.name === 'requestAccounts') {
      return Promise.resolve([account]);
    } else {
      return Promise.resolve(signature);
    }
  });

  const transactionPayload = transaction();

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: handler,
  }).registerProvider(Solana);

  const accountConnect = await window.wallet.features[
    StandardConnect
  ].connect();

  await window.wallet.features[SolanaSignTransaction].signTransaction({
    account: accountConnect.accounts[0],
    transaction: transactionPayload.serialize({ verifySignatures: false }),
  });

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signRawTransaction',
      network: 'solana',
      params: expect.objectContaining({
        raw: Buffer.from(
          transactionPayload.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          }),
        ).toString('base64'),

        rawMessage: Buffer.from(transactionPayload.serializeMessage()).toString(
          'base64',
        ),

        version: 'legacy',

        data: JSON.stringify(
          VersionedTransaction.deserialize(
            transactionPayload.serialize({ verifySignatures: false }),
          ),
        ),
      }),
    }),
  );
});
