# trust-web3-provider — Integration & Development Skill

A modular TypeScript library that provides standardized Web3 provider interfaces for wallets to connect with dApps across multiple blockchains.

**Repo**: `@trustwallet/web3-provider-*`
**Version**: 4.x (monorepo, Bun workspaces)
**Supported chains**: Ethereum, Solana, Cosmos, Bitcoin, Aptos, TON, Tron

---

## Architecture

```
dApp → request() → ChainProvider → Adapter → Handler (your wallet code)
                        ↓
              (Promise or Callback strategy)
```

- **`Web3Provider`** — orchestrator; holds the adapter and routes requests
- **`BaseProvider`** — abstract base for all chain providers (extends EventEmitter)
- **`PromiseAdapter`** — handler returns a `Promise<T>` directly
- **`CallbackAdapter`** — handler stores `params.id`, resolves later via `sendResponse(id, result)`
- **`MobileAdapter`** — transforms RPC method names to mobile-friendly equivalents (enabled by default)

---

## Installation

```bash
# Core (always required)
npm i @trustwallet/web3-provider-core

# Add the chains you need
npm i @trustwallet/web3-provider-ethereum
npm i @trustwallet/web3-provider-solana
npm i @trustwallet/web3-provider-cosmos
npm i @trustwallet/web3-provider-bitcoin
npm i @trustwallet/web3-provider-aptos
npm i @trustwallet/web3-provider-ton
npm i @trustwallet/web3-provider-tron
```

---

## Quick Start

### Promise mode (recommended)

```typescript
import { Web3Provider, AdapterStrategy, IHandlerParams } from '@trustwallet/web3-provider-core';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';

const ethereum = new EthereumProvider({
  chainId: '0x1',
  rpcUrl: 'https://eth.drpc.org',
});

new Web3Provider({
  strategy: AdapterStrategy.PROMISES,
  handler: async (params: IHandlerParams) => {
    // params.network   → 'ethereum' | 'solana' | 'cosmos' | ...
    // params.name      → method name (e.g. 'eth_requestAccounts')
    // params.params    → method arguments
    // params.object    → same as params (backward compat alias)
    console.log(`[${params.network}] ${params.name}`, params.params);
    return yourWalletImplementation(params);
  },
}).registerProvider(ethereum);

window.ethereum = ethereum;
```

### Callback mode (for async/mobile bridges)

```typescript
import { Web3Provider, AdapterStrategy, IHandlerParams } from '@trustwallet/web3-provider-core';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';

const web3 = new Web3Provider({ strategy: AdapterStrategy.CALLBACK });
const ethereum = new EthereumProvider();
web3.registerProvider(ethereum);

web3.setHandler((params: IHandlerParams) => {
  // params.id is defined in CALLBACK mode — must be passed to sendResponse/sendError
  nativeBridge.postMessage({ id: params.id, method: params.name, params: params.params });
});

// Later, when the native side responds:
web3.sendResponse(requestId, result);  // resolve the pending promise
web3.sendError(requestId, error);      // reject the pending promise
```

---

## Handler Routing Pattern

The handler receives all requests from all registered providers. Route by `params.network` and `params.name`:

```typescript
async function handler(params: IHandlerParams) {
  const { network, name, params: args } = params;

  if (network === 'ethereum') {
    return handleEthereum(name, args);
  }
  if (network === 'solana') {
    return handleSolana(name, args);
  }
  throw new Error(`Unsupported network: ${network}`);
}

async function handleEthereum(method: string, args: unknown) {
  switch (method) {
    case 'requestAccounts':          // MobileAdapter maps eth_requestAccounts → requestAccounts
    case 'eth_requestAccounts':
      return ['0xYourAddress...'];

    case 'signPersonalMessage':      // MobileAdapter maps personal_sign → signPersonalMessage
      // args: [message_hex, address]
      return yourSigner.signPersonalMessage(args[0]);

    case 'signMessage':              // eth_sign
      return yourSigner.signMessage(args[0], args[1]);

    case 'eth_sendTransaction':
    case 'sendTransaction':          // MobileAdapter name
      return yourSigner.sendTransaction(args[0]);

    case 'signTypedMessage':         // eth_signTypedData_v4
      return yourSigner.signTypedData(args[0], args[1]);

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}
```

### MobileAdapter method name mappings (Ethereum)

| dApp calls                  | Handler receives             |
|-----------------------------|------------------------------|
| `eth_requestAccounts`       | `requestAccounts`            |
| `personal_sign`             | `signPersonalMessage`        |
| `eth_sign`                  | `signMessage`                |
| `eth_sendTransaction`       | `sendTransaction`            |
| `eth_signTypedData_v1`      | `signTypedMessage`           |
| `eth_signTypedData_v3`      | `signTypedMessage`           |
| `eth_signTypedData_v4`      | `signTypedMessage`           |
| `wallet_addEthereumChain`   | `addEthereumChain`           |
| `wallet_switchEthereumChain`| `switchEthereumChain`        |
| `wallet_watchAsset`         | `watchAsset`                 |
| `wallet_requestPermissions` | `requestPermissions`         |

Set `disableMobileAdapter: true` to receive raw RPC method names instead.

---

## Chain-specific Setup

### Ethereum (EIP-1193)

```typescript
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';

const ethereum = new EthereumProvider({
  chainId: '0x1',          // hex chain ID
  rpcUrl: 'https://...',   // fallback RPC for read calls
  overwriteMetamask: false, // set true to spoof isMetaMask
  isTrust: true,
  disableMobileAdapter: false,
  supportedMethods: [],    // allow-list; empty = all allowed
  unsupportedMethods: [],  // deny-list
});

// Runtime mutations
ethereum.setChainId('0x38');       // switch chain
ethereum.setRPCUrl('https://...');
ethereum.setAddress('0x...');      // update current account
ethereum.setOverwriteMetamask(true);

// Static reads (no handler needed)
ethereum.getChainId();       // '0x1'
ethereum.getAddress();       // '0x...' (set after eth_requestAccounts)
ethereum.getNetworkVersion(); // 1

// Events (EIP-1193)
ethereum.on('connect', ({ chainId }) => {});
ethereum.on('chainChanged', (chainId) => {});
ethereum.on('accountsChanged', (accounts) => {});
ethereum.on('disconnect', (error) => {});
```

### Solana (Wallet Standard)

```typescript
import { SolanaProvider } from '@trustwallet/web3-provider-solana';

const solana = new SolanaProvider({
  cluster: 'https://api.mainnet-beta.solana.com',
  isTrust: true,
  enableAdapter: true,       // register with Wallet Standard
  useLegacySign: false,
  disableMobileAdapter: false,
});

// Methods (called by dApps via Wallet Standard or window.solana)
await solana.connect();
await solana.disconnect();
await solana.signTransaction(tx);
await solana.signAllTransactions([tx1, tx2]);
await solana.signAndSendTransaction(tx, { skipPreflight: false });
await solana.signMessage(uint8ArrayMessage);
await solana.signRawTransactionMulti([tx]);
```

Handler method names for Solana:
- `connect` → `connect`
- `disconnect` → `disconnect`
- `signTransaction` → `signTransaction`
- `signAllTransactions` → `signAllTransactions`
- `signMessage` → `signMessage`
- `signAndSendTransaction` → `signAndSendTransaction`

### Cosmos (Keplr-compatible)

```typescript
import { CosmosProvider } from '@trustwallet/web3-provider-cosmos';

const cosmos = new CosmosProvider({
  isKeplr: true,   // expose as window.keplr
  isTrust: true,
  disableMobileAdapter: false,
});

// Methods available to dApps
await cosmos.enable('cosmoshub-4');
await cosmos.enable(['cosmoshub-4', 'osmosis-1']);
const key = await cosmos.getKey('cosmoshub-4');
await cosmos.signAmino('cosmoshub-4', signer, signDoc);
await cosmos.signDirect('cosmoshub-4', signerAddress, signDoc);
const offlineSigner = cosmos.getOfflineSigner('cosmoshub-4');
const offlineSignerDirect = cosmos.getOfflineSignerDirect('cosmoshub-4');
const offlineSignerAmino = cosmos.getOfflineSignerAmino('cosmoshub-4');
await cosmos.sendTx('cosmoshub-4', txBytes, BroadcastMode.Sync);
await cosmos.signArbitrary('cosmoshub-4', signerAddress, 'hello');
```

### Bitcoin

```typescript
import { BitcoinProvider } from '@trustwallet/web3-provider-bitcoin';

const bitcoin = new BitcoinProvider({ enableAdapter: true });

// Methods
await bitcoin.connect();
await bitcoin.requestAccounts();
await bitcoin.getAccounts();
await bitcoin.signMessage({ message: 'hello', address: '...' });
await bitcoin.signPSBT({ psbt: '...hex...', signInputs: {} });
await bitcoin.pushPSBT({ psbt: '...hex...' });
bitcoin.isConnected();
```

### Aptos

```typescript
import { AptosProvider } from '@trustwallet/web3-provider-aptos';

const aptos = new AptosProvider({ network: 'mainnet', chainId: '1' });

await aptos.connect();
await aptos.disconnect();
const account = await aptos.account();
const network = await aptos.network();
await aptos.signMessage({ message: 'hello', nonce: 'random' });
await aptos.signTransaction(txPayload);
await aptos.signAndSubmitTransaction(txPayload);
```

### TON

```typescript
import { TonProvider } from '@trustwallet/web3-provider-ton';

const ton = new TonProvider({ version: 'v4R2', disableMobileAdapter: false });

await ton.send('ton_requestAccounts', {});
await ton.send('ton_sendTransaction', { to: '...', value: '...' });
await ton.disconnect();
ton.isConnected();
```

### Tron

```typescript
import { TronProvider } from '@trustwallet/web3-provider-tron';

const tron = new TronProvider();
// Wraps TronWeb — exposes window.tronWeb compatible interface
await tron.connect();
await tron.sign(transaction);
await tron.signMessageV2(data);
tron.setNode(nodeUrl);
```

---

## Multi-Chain Setup

```typescript
import { Web3Provider, AdapterStrategy, IHandlerParams } from '@trustwallet/web3-provider-core';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';
import { SolanaProvider } from '@trustwallet/web3-provider-solana';
import { CosmosProvider } from '@trustwallet/web3-provider-cosmos';
import { BitcoinProvider } from '@trustwallet/web3-provider-bitcoin';

const web3 = new Web3Provider({
  strategy: AdapterStrategy.PROMISES,
  handler: async (params: IHandlerParams) => {
    switch (params.network) {
      case 'ethereum': return handleEthereum(params);
      case 'solana':   return handleSolana(params);
      case 'cosmos':   return handleCosmos(params);
      case 'bitcoin':  return handleBitcoin(params);
      default: throw new Error(`Unknown network: ${params.network}`);
    }
  },
});

const ethereum = new EthereumProvider({ chainId: '0x1' });
const solana = new SolanaProvider({ enableAdapter: true });
const cosmos = new CosmosProvider({ isKeplr: true });
const bitcoin = new BitcoinProvider({ enableAdapter: true });

web3.registerProviders([ethereum, solana, cosmos, bitcoin]);

// Expose to dApps
window.ethereum = ethereum;
window.solana = solana;
window.keplr = cosmos;
```

---

## Building a New Chain Provider

### Step 1 — Generate boilerplate (in the monorepo)

```bash
bun run generate myChain
```

Generated structure:
```
packages/myChain/
├── MyChainProvider.ts    ← main provider class
├── MobileAdapter.ts      ← optional mobile method mapping
├── index.ts
├── types/
│   └── MyChainProvider.ts
├── exceptions/
│   └── RPCError.ts
└── tests/
    └── MyChainProvider.spec.ts
```

### Step 2 — Implement the provider

```typescript
import { BaseProvider, IRequestArguments } from '@trustwallet/web3-provider-core';
import type { IMyChainProviderConfig } from './types/MyChainProvider';

export class MyChainProvider extends BaseProvider {
  static NETWORK = 'mychain';

  constructor(config?: IMyChainProviderConfig) {
    super();
    // store config, initialize state
  }

  // Required: return the network identifier used in IHandlerParams.network
  getNetwork(): string {
    return MyChainProvider.NETWORK;
  }

  // Implement chain-specific public API
  async connect(): Promise<{ address: string }> {
    return this.request({ method: 'connect' });
  }

  async signMessage(message: string): Promise<string> {
    return this.request({ method: 'signMessage', params: [message] });
  }

  async sendTransaction(tx: object): Promise<string> {
    return this.request({ method: 'sendTransaction', params: [tx] });
  }
}
```

### Step 3 — Define types

```typescript
// types/MyChainProvider.ts
export interface IMyChainProviderConfig {
  isTrust?: boolean;
  disableMobileAdapter?: boolean;
  rpcUrl?: string;
}
```

### Step 4 — (Optional) MobileAdapter

```typescript
// MobileAdapter.ts
import { MyChainProvider } from './MyChainProvider';
import type { IRequestArguments } from '@trustwallet/web3-provider-core';

export class MobileAdapter {
  constructor(private provider: MyChainProvider) {}

  request(args: IRequestArguments): Promise<unknown> {
    // Map dApp RPC method names to wallet-native names
    const mapped = this.mapMethod(args);
    return this.provider.internalRequest(mapped);
  }

  private mapMethod(args: IRequestArguments): IRequestArguments {
    const methodMap: Record<string, string> = {
      'mychain_connect': 'connect',
      'mychain_signMessage': 'signMessage',
    };
    return { ...args, method: methodMap[args.method] ?? args.method };
  }
}
```

### Step 5 — Build

```bash
bun run build:packages
```

The generate script automatically registers the package in `scripts/packages.ts` and adds it to iOS/Android bundles.

---

## Error Handling

```typescript
import { RPCError } from '@trustwallet/web3-provider-core';

// In your handler, throw RPCError for standard EIP-1193 error codes
handler: async (params) => {
  if (userDenied) {
    throw new RPCError(4001, 'User rejected the request');
  }
  if (methodUnsupported) {
    throw new RPCError(4200, `Method not supported: ${params.name}`);
  }
};

// EIP-1193 standard codes
// 4001 — User rejected
// 4100 — Unauthorized
// 4200 — Unsupported method
// 4900 — Disconnected
// 4901 — Chain disconnected
// -32700 — Parse error
// -32600 — Invalid request
// -32601 — Method not found
// -32602 — Invalid params
// -32603 — Internal error
```

---

## Events Reference

All providers extend `EventEmitter`. Standard events:

```typescript
// Ethereum (EIP-1193)
ethereum.emit('connect', { chainId: '0x1' });
ethereum.emit('disconnect', rpcError);
ethereum.emit('chainChanged', '0x38');     // hex string
ethereum.emit('accountsChanged', ['0x...']);
ethereum.emit('message', { type: 'eth_subscription', data: ... });

// Emit these when the wallet changes state
function onChainSwitch(newChainId: string) {
  ethereum.setChainId(newChainId);
  ethereum.emit('chainChanged', newChainId);
}

function onAccountChange(address: string) {
  ethereum.setAddress(address);
  ethereum.emit('accountsChanged', [address]);
}
```

---

## Key Types

```typescript
import {
  Web3Provider,
  BaseProvider,
  AdapterStrategy,
  IHandlerParams,
  IRequestArguments,
  IBaseProvider,
} from '@trustwallet/web3-provider-core';

// The params your handler receives
interface IHandlerParams {
  id?: number;           // set in CALLBACK mode — pass to sendResponse/sendError
  network: string;       // 'ethereum' | 'solana' | 'cosmos' | ...
  name: string;          // method name (possibly mobile-adapted)
  params: unknown[] | object;   // method arguments
  object: unknown[] | object;   // alias for params (backward compat)
}

// A request from a dApp
interface IRequestArguments {
  method: string;
  params?: unknown[] | object;
}
```

---

## Common Pitfalls

| Problem | Fix |
|---------|-----|
| `No adapter set, maybe you forgot to register the provider?` | Call `web3.registerProvider(provider)` before any requests |
| `No handler defined for Adapter` | Pass `handler` in the constructor or call `web3.setHandler(fn)` |
| `Trying to send callback request on promisified adapter` | Only call `sendResponse`/`sendError` when using `AdapterStrategy.CALLBACK` |
| MobileAdapter intercepts methods unexpectedly | Set `disableMobileAdapter: true` in provider config |
| `eth_accounts` returns `[]` | Call `eth_requestAccounts` first; provider caches address after success |
| Handler never called for chain methods | Verify the provider is registered with the same `Web3Provider` instance |

---

## Build & Dev (monorepo)

```bash
bun run build:packages   # build all chain packages
bun run build:source     # clean rebuild with type declarations
bun run test             # run all tests (vitest)
bun run lint             # eslint
bun run generate <name>  # scaffold a new chain package
npm run dev              # watch mode
```

Package structure per chain:
```
packages/<chain>/
├── <Chain>Provider.ts     # main class (extends BaseProvider)
├── MobileAdapter.ts       # method name mapping for mobile
├── RPCServer.ts           # optional: fallback RPC calls
├── index.ts
├── types/
├── exceptions/
│   └── RPCError.ts
└── tests/
```
