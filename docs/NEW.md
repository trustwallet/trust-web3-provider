## Adding a new chain

Run the generate command

```bash
bun run generate awesomeNewChain
```

This will generate all the boilerplate structure for your new chain:

```
📦 newChain
├─ tests
├─ exceptions
├─ types
├─ index.ts
├─ NewChainProvider.ts
└─ package.json
```

Then you can build it using the command

```bash
bun run build:packages
```
