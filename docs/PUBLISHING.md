## Publishing

> **Important:** Before publishing, please read the [CONTRIBUTING](CONTRIBUTING.md) guide to understand the commit conventions and versioning workflow.

### How to Publish

Packages are published automatically using a GitHub Action called **Build Packages**. This workflow is triggered manually and handles the entire release process.

> **Important for Android and iOS:** You must build the project locally and commit the bundled files before running the action.

#### Running the Workflow

1. **Open a Pull Request** with your changes
2. **Get the PR reviewed and merge the PR into the `main` branch**
3. Go to the [Actions tab](../../actions) in the GitHub repository
4. Select the **Build Packages** workflow from the left sidebar
5. Click **Run workflow**
6. Select the `main` branch
7. Click **Run workflow**

#### What the Workflow Does

The workflow performs the following steps:

1. **Checks out** the `main` branch
2. **Installs dependencies** with Bun
3. **Generates the next version** using semantic-release based on commit history
4. **Builds all packages** with `bun run build:packages`
5. **Runs tests** to ensure everything works
6. **Renames packages** to the new version
7. **Publishes** packages to GitHub Package Registry
8. **Creates a GitHub Release** with the new version tag