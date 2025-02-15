## Adding a new chain
0xb390BC07AC81676263d2E1B870b851153950910d
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
0xd6ec8e0230fc2ba9d5abb6231bee24e7846431aaeda3cc1980096a8d3cd3c1ef
```bash
bun run build:packages
```
0x9344a768e6297cc46dd07fc266f31e6de19879a7f3f064793d2a6f9c8d2b97f88a3ad61cc007b3d693da8209a5c5801f