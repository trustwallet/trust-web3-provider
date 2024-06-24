import { test, expect, jest, afterEach } from 'bun:test';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { EthereumProvider } from '../EthereumProvider';
import { AdapterStrategy } from '@trustwallet/web3-provider-core/adapter/Adapter';
import { RPCError } from '../exceptions/RPCError';
import { IHandlerParams } from '@trustwallet/web3-provider-core/adapter/CallbackAdapter';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { RPC } from '../RPCServer';

let ethereum = new EthereumProvider();
const account = '0x0000000000000000000000000000000000000000';

afterEach(() => {
  ethereum = new EthereumProvider();
});

// Direct methods
test('Ethereum Provider → eth_requestAccounts', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([account]),
  }).registerProvider(ethereum);

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  expect(accounts).toEqual([account]);
});

test('Ethereum Provider → eth_requestAccounts callback', async () => {
  const provider = new Web3Provider({
    strategy: AdapterStrategy.CALLBACK,
  }).registerProvider(ethereum);

  provider.setHandler((params: IHandlerParams) => {
    provider.sendResponse(params.id!, [account]);
  });

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  expect(accounts).toEqual([account]);
});

test('Ethereum Provider → unsupported method returns error', async () => {
  const method = 'eth_newFilter';
  const ethereum = new EthereumProvider({ unsupportedMethods: [method] });

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([]),
  }).registerProvider(ethereum);

  expect(ethereum.request({ method })).rejects.toThrow(
    new RPCError(4200, `EthereumProvider does not support calling ${method}`),
  );
});

test('Ethereum Provider → Static Request → eth_accounts → should be empty', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([]),
  }).registerProvider(ethereum);

  const res = await ethereum.request<string[]>({ method: 'eth_accounts' });
  expect(res).toEqual([]);
});

test('Ethereum Provider → Static Request → eth_accounts → should return address', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([account]),
  }).registerProvider(ethereum);

  await ethereum.request({ method: 'eth_requestAccounts' });

  const res = await ethereum.request<string[]>({ method: 'eth_accounts' });
  expect(res).toEqual([account]);
});

test('Ethereum Provider → Static Request → net_version → should return chainId undefined', async () => {
  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([]),
  }).registerProvider(ethereum);

  expect(await ethereum.request({ method: 'net_version' })).toEqual(undefined);
});

test('Ethereum Provider → Static Request → net_version → should return chainId decimal', async () => {
  const ethereum = new EthereumProvider({ chainId: '0x9' });

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([]),
  }).registerProvider(ethereum);

  expect(await ethereum.request<number>({ method: 'net_version' })).toEqual(9);
});

test('Ethereum Provider → Static Request → eth_chainId → should return chainId hex', async () => {
  const ethereum = new EthereumProvider({ chainId: '0x9' });

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler: () => Promise.resolve([]),
  }).registerProvider(ethereum);

  expect(await ethereum.request<string>({ method: 'eth_chainId' })).toEqual(
    '0x9',
  );
});

test('Ethereum Provider → Mobile Adapter → eth_sign → should adapt to signPersonalMessage', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'eth_sign',
    params: ['0x0', 'hello world'],
  });
  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'signPersonalMessage' }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_sign → signPersonalMessage payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'eth_sign',
    params: ['0x0', `0x${Buffer.from('hello world').toString('hex')}`],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        data: `0x${Buffer.from('hello world').toString('hex')}`,
        address: '0x0',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_sign → should adapt to signMessage', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'eth_sign',
    params: [account, Buffer.from([1, 2, 255, 3, 5]).toString('hex')],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'signMessage' }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_sign → signMessage payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const payload = Buffer.from([1, 2, 255, 3, 5]).toString('hex');

  await ethereum.request<string>({
    method: 'eth_sign',
    params: ['0x0', payload],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        data: `0x${payload}`,
        address: '0x0',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → personal_sign → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'eth_requestAccounts',
  });

  await ethereum.request<string>({
    method: 'personal_sign',
    params: [account, '0x123'],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        data: `0x123`,
        address: account,
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → personal_sign → params are swapped', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({ method: 'eth_requestAccounts' });

  await ethereum.request<string>({
    method: 'personal_sign',
    params: ['0x123', account],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        data: `0x123`,
        address: account,
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → personal_ecRecover → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) => Promise.resolve());

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'personal_ecRecover',
    params: ['message', 'signature'],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        signature: 'signature',
        message: 'message',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_signTypedData_v1 → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const chainId = '1';
  ethereum.setChainId(chainId);

  const payload = [
    {
      type: 'string',
      name: 'Message',
      value: 'Hi, Alice!',
    },
    {
      type: 'uint32',
      name: 'A number',
      value: '1337',
    },
  ];

  await ethereum.request<string>({ method: 'eth_requestAccounts' });

  await ethereum.request<string>({
    method: 'eth_signTypedData',
    params: [account, JSON.stringify(payload)],
  });

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signTypedMessage',
      network: 'ethereum',
      params: {
        data: '0x',
        raw: JSON.stringify(payload),
        address: account,
        version: 'V1',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_signTypedData_v3 → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const chainId = '1';
  ethereum.setChainId(chainId);

  const payload = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
    primaryType: 'Mail',
    domain: {
      name: 'Ether Mail',
      version: '1',
      chainId,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
      from: {
        name: 'Cow',
        wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      },
      to: {
        name: 'Bob',
        wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      },
      contents: 'Hello, Bob!',
    },
  };

  await ethereum.request<string>({ method: 'eth_requestAccounts' });

  await ethereum.request<string>({
    method: 'eth_signTypedData_v3',
    params: [account, JSON.stringify(payload)],
  });

  const hash = `0x${TypedDataUtils.eip712Hash(
    payload as any,
    SignTypedDataVersion.V3,
  ).toString('hex')}`;

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signTypedMessage',
      network: 'ethereum',
      params: {
        data: hash,
        raw: JSON.stringify(payload),
        address: account,
        version: 'V3',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_signTypedData_v4 → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const chainId = '1';
  ethereum.setChainId(chainId);

  const payload = {
    domain: {
      chainId,
      name: 'Ether Mail',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      version: '1',
    },
    message: {
      contents: 'Hello, Bob!',
      from: {
        name: 'Cow',
        wallets: [
          '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
        ],
      },
      to: [
        {
          name: 'Bob',
          wallets: [
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
            '0xB0B0b0b0b0b0B000000000000000000000000000',
          ],
        },
      ],
      attachment: '0x',
    },
    primaryType: 'Mail',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Group: [
        { name: 'name', type: 'string' },
        { name: 'members', type: 'Person[]' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person[]' },
        { name: 'contents', type: 'string' },
        { name: 'attachment', type: 'bytes' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallets', type: 'address[]' },
      ],
    },
  };

  await ethereum.request<string>({ method: 'eth_requestAccounts' });

  await ethereum.request<string>({
    method: 'eth_signTypedData_v4',
    params: [account, JSON.stringify(payload)],
  });

  const hash = `0x${TypedDataUtils.eip712Hash(
    payload as any,
    SignTypedDataVersion.V4,
  ).toString('hex')}`;

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signTypedMessage',
      network: 'ethereum',
      params: {
        data: hash,
        raw: JSON.stringify(payload),
        address: account,
        version: 'V4',
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → eth_sendTransaction → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const chainId = '1';
  ethereum.setChainId(chainId);

  await ethereum.request<string>({ method: 'eth_requestAccounts' });

  const params = {
    from: account,
    to: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb',
    value: '0x0',
    gasLimit: '0x5208',
    gasPrice: '0x2540be400',
    type: '0x0',
  };

  await ethereum.request<string>({
    method: 'eth_sendTransaction',
    params: [params],
  });

  expect(handler).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      name: 'signTransaction',
      network: 'ethereum',
      params,
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → wallet_watchAsset → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const params = {
    type: 'ERC20',
    options: {
      address: account,
      symbol: 'TWT',
      decimals: 6,
    },
  };

  await ethereum.request<string>({
    method: 'wallet_watchAsset',
    params: params,
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'watchAsset',
      network: 'ethereum',
      params: {
        type: params.type,
        contract: params.options.address,
        symbol: params.options.symbol,
        decimals: params.options.decimals,
      },
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → wallet_addEthereumChain → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const params = {
    chainId: '0x53a',
    rpcUrls: ['http://127.0.0.1:8546'],
    chainName: 'Localhost 8546',
    nativeCurrency: { name: 'TEST', decimals: 18, symbol: 'TEST' },
    blockExplorerUrls: null,
  };

  await ethereum.request<string>({
    method: 'wallet_addEthereumChain',
    params: [params],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'addEthereumChain',
      network: 'ethereum',
      params,
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → wallet_switchEthereumChain → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const params = {
    chainId: '0x53a',
  };

  await ethereum.request<string>({
    method: 'wallet_switchEthereumChain',
    params: [params],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'switchEthereumChain',
      network: 'ethereum',
      params,
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → should fallback to RPC handler', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([account]),
  );

  const rpcHandler = jest.fn((_: any) => Promise.resolve([account]));

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  const rpcInstance = new (class MockedRpc implements RPC {
    call<T>(payload: {
      jsonrpc: string;
      method: string;
      params: object | unknown[] | undefined;
    }): Promise<T> {
      return rpcHandler(payload) as Promise<T>;
    }
  })();

  ethereum.setRPC(rpcInstance);

  await ethereum.request<string>({
    method: 'eth_blockNumber',
    params: [],
  });

  expect(rpcHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'eth_blockNumber',
      params: [],
      jsonrpc: '2.0',
    }),
  );
});

test('Ethereum Provider → Mobile Adapter → permissions attaches address → payload is correct', async () => {
  const handler = jest.fn((_params: IHandlerParams) =>
    Promise.resolve([
      {
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: [account],
          },
        ],
        id: 'eM3kFsO5sXX4ygvoDNJya',
        date: 1719244991262,
        invoker: 'https://app.galxe.com',
        parentCapability: 'eth_accounts',
      },
    ]),
  );

  new Web3Provider({
    strategy: AdapterStrategy.PROMISES,
    handler,
  }).registerProvider(ethereum);

  await ethereum.request<string>({
    method: 'wallet_requestPermissions',
  });

  await ethereum.request<string>({
    method: 'personal_sign',
    params: [account, '0x123'],
  });

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        data: `0x123`,
        address: account,
      },
    }),
  );
});
