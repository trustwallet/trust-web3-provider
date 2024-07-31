# Trust Web3 Provider

```
    ___       ___       ___
   /\  \     /\  \     /\__\
   \:\  \   /::\  \   /:| _|_
   /::\__\ /:/\:\__\ /::|/\__\
  /:/\/__/ \:\/:/  / \/|::/  /
  \/__/     \::/  /    |:/  /
             \/__/     \/__/
```

### Ton JavaScript Provider Implementation

### Config Object

```typescript
const config: {
  isTrust?: boolean;
  disableMobileAdapter?: boolean;
  version?: string;
} = {};
```

### Usage

```typescript
const ton = new TonProvider(config);
```

### Bridge usage

```typescript
const bridgeConfig: {
  isWalletBrowser: boolean;
  walletInfo: WalletInfo;
  deviceInfo: DeviceInfo;
} = {};

const bridge = new TonBridge(ton, bridgeConfig);
```
