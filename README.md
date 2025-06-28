## Tech Stack

Below is the core technology stack used, along with links to their documentation:

- [Bun](https://bun.sh/docs) - Fast JavaScript runtime and package manager
- [Moon](https://moonrepo.dev/docs/install) - Monorepo management, organization, orchestration, and notification tool for the web ecosystem
- [Solid](https://docs.solidjs.com/quick-start) - UI library
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite) - CSS Framework
- [Tanstack Start](https://tanstack.com/start/latest/docs/framework/solid/overview)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/guide/)

## Prerequisites

Before getting started, make sure you have the following tools installed:

- [Bun](https://bun.sh/docs/installation)
- [Moon](https://moonrepo.dev/docs/install)

## Recommended VS Code Extensions

These extensions enhance development specifically for this stack:

- [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Bun for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Common CLI Commands

Any command ran with moon can be executed from any directory within the monorepo.

#### General

```bash
# To install dependencies of the application
bun install

# To update dependencies to their latest version
bun update --latest

# Format your code
moon :format
```

#### Web App

```bash
# Build the app in release mode
moon web:build

# Run the app in development mode
moon web:dev

# Serve the built app
moon web:preview
```