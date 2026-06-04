## Publishing

> **Important:** Before publishing, please read the [CONTRIBUTING](CONTRIBUTING.md) guide to understand the commit conventions and versioning workflow.

Package publishing and releases are handled by a separate, maintainer-operated release pipeline outside this repository. This repository contains the source and CI (build + test) only — the workflow here does **not** publish packages or create releases.

### Release process

1. **Open a Pull Request** with your changes.
2. Make sure your commits follow the [commit conventions](CONTRIBUTING.md) so the version is determined correctly.
3. **Get the PR reviewed and merged into `main`.**
4. A maintainer triggers the release pipeline to publish the new version.

> **Important for Android and iOS:** You must build the project locally and commit the bundled files before a release.
