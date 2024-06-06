## Using the library

# 1. Run

```bash
npm i @trustwallet/web3-provider-core
```

# 2. Install your desired chain

Let's use for example, ethereum

```bash
npm i @trustwallet/web3-provider-ethereum
```

# 3. Example usage

```typescript
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';

const ethereum = new EthereumProvider();

new Web3Provider({
  strategy: AdapterStrategy.PROMISES,
  handler: (params: IHandlerParams) => {},
}).registerProvider(ethereum);

// Register the ethereum provider
window.ethereum = ethereum;
```

dApps that use EIP-1193 will be able to connect to your wallet now.

---

## Find more about the chains

- Cosmos [Docs](/packages/cosmos/README.md)
- Solana - _Wallet Standard fully compatible_ [Docs](/packages/solana/README.md)
- Ethereum _EIP-1193_ [Docs](/packages/ethereum/README.md)

### Using the callback Adapter

```typescript
const provider = new Web3Provider({
  strategy: AdapterStrategy.CALLBACK,
}).registerProvider(ethereum);

const handler = (params: IHandlerParams) => {
  provider.sendResponse(params.id, ['0x0....']);
};

provider.setHandler(handler);
```
