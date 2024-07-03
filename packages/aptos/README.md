# Trust Web3 Provider

```


,---.     |
|---|,---.|--- ,---.,---.
|   ||   ||    |   |`---.
`   '|---'`--- `---'`---'
     |

```

### Aptos JavaScript Provider Implementation

### Config Object

```typescript
const config: {
  isTrust?: boolean;
  network?: string;
  chainId?: string | null;
} = {};
```

### Usage

```typescript
const aptos = new AptosProvider(config);
```
