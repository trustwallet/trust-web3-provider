## Contributing

### Fork and set up your local env

Install bun

```bash
curl https://bun.sh/install | bash
```

Install deps

```bash
bun install
```

### Useful scripts

Build packages

```bash
bun run build:packages
```

Run tests

```bash
bun run test
```

Run tests watch mode

```bash
bun run test:watch
```

### Test locally

If you wish to test a package inside the extension, let's say solana:

```bash
cd packages/solana
npm link
```

Then you can run in the extension workspace:

```bash
npm link @trustwallet/web3-provider-solana
```

---

## Adding a new chain

[Adding a new chain](/docs/NEW.md)
