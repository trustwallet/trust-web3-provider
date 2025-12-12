## Contributing

### Commit Conventions and PR Naming

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically determine version bumps and generate releases based on commit messages. It's crucial to follow the commit message convention to ensure proper versioning.

#### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

- **feat:** A new feature (triggers a **minor** version bump, e.g., 1.0.0 → 1.1.0)
- **fix:** A bug fix (triggers a **patch** version bump, e.g., 1.0.0 → 1.0.1)
- **docs:** Documentation only changes (no version bump)
- **style:** Code style changes (formatting, missing semi-colons, etc.) (no version bump)
- **refactor:** Code changes that neither fix a bug nor add a feature (no version bump)
- **perf:** Performance improvements (triggers a **patch** version bump)
- **test:** Adding or updating tests (no version bump)
- **chore:** Changes to build process or auxiliary tools (no version bump)

#### Breaking Changes

To trigger a **major** version bump (e.g., 1.0.0 → 2.0.0), include `BREAKING CHANGE:` in the commit body or footer, or add `!` after the type/scope:

```bash
feat!: remove support for legacy API
```

or

```bash
feat: update authentication flow

BREAKING CHANGE: The old auth method is no longer supported
```

#### Examples

```bash
feat: add Bitcoin provider support
fix: resolve connection timeout in Solana provider
docs: update installation instructions
feat(ethereum)!: change method signature for sendTransaction
```

#### Pull Request Titles

PR titles should also follow the same convention, as they may be used in the commit history when squash merging:

```
feat: add support for new blockchain
fix: resolve memory leak in provider
```

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

[Adding a new chain](/docs/ADD_NEW_CHAIN.md)

---

## Publishing

[Publishing guide](/docs/PUBLISHING.md)
