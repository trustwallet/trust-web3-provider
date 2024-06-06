# Trust Web3 Provider

```
//   ___ ___       ___  __   ___
//  |__   |  |__| |__  |__) |__  |  |  |\/|
//  |___  |  |  | |___ |  \ |___ \__/  |  |
//
```

### Ethereum JavaScript Provider Implementation

### Config Object

```typescript
const config: {
  rpc?: string;
  chainId?: string;
  overwriteMetamask?: boolean;
  supportedMethods?: string[];
  unsupportedMethods?: string[];
  disableMobileAdapter?: boolean;
  isTrust?: boolean;
} = {};
```

### Usage

```typescript
const ethereum = new EthereumProvider(config);
```
