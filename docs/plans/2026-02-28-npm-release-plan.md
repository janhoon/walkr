# npm Packaging & release-please Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up npm publishing under the `@walkrstudio` scope with automated releases via release-please and GitHub Actions.

**Architecture:** release-please manifest mode tracks independent versions for 5 publishable packages. Two GitHub Actions workflows: one creates release PRs and GitHub Releases, the other publishes to npm on release. pnpm handles `workspace:*` → real version conversion at publish time.

**Tech Stack:** release-please, GitHub Actions, pnpm publish, npm granular access tokens

---

### Task 1: Rename package scopes to @walkrstudio

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/engine/package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/playwright/package.json`
- Modify: `packages/create-walkr/package.json`

**Step 1: Update packages/core/package.json**

Change `name` from `@walkr/core` to `@walkrstudio/core`. Add `publishConfig`.

```json
{
  "name": "@walkrstudio/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "biome check src",
    "type-check": "tsc -p tsconfig.json --noEmit",
    "dev": "tsc -p tsconfig.json --watch"
  }
}
```

**Step 2: Update packages/engine/package.json**

Rename to `@walkrstudio/engine`. Update dependency on core. Add `publishConfig`, `exports`, and `files`.

```json
{
  "name": "@walkrstudio/engine",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@walkrstudio/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.2"
  }
}
```

**Step 3: Update packages/cli/package.json**

Rename to `@walkrstudio/cli`. Update deps. Keep bin name as `walkr` so `npx walkr` still works. Add `publishConfig`.

```json
{
  "name": "@walkrstudio/cli",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "walkr": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "biome check src",
    "type-check": "tsc -p tsconfig.json --noEmit",
    "dev": "tsc -p tsconfig.json --watch"
  },
  "dependencies": {
    "@walkrstudio/core": "workspace:*"
  },
  "peerDependencies": {
    "@walkrstudio/playwright": "workspace:*"
  },
  "peerDependenciesMeta": {
    "@walkrstudio/playwright": {
      "optional": true
    }
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "@walkrstudio/playwright": "workspace:*"
  }
}
```

**Step 4: Update packages/playwright/package.json**

Rename to `@walkrstudio/playwright`. Update dep on core. Add `publishConfig` and `exports`.

```json
{
  "name": "@walkrstudio/playwright",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@walkrstudio/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0"
  },
  "peerDependencies": {
    "@playwright/test": "^1.50.0"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "biome check src",
    "type-check": "tsc -p tsconfig.json --noEmit",
    "dev": "tsc -p tsconfig.json --watch"
  }
}
```

**Step 5: Rename create-walkr to create-walkrstudio**

Rename the directory from `packages/create-walkr` to `packages/create-walkrstudio`. Update `package.json`:

```json
{
  "name": "create-walkrstudio",
  "version": "0.1.0",
  "description": "Scaffold a new Walkr project",
  "type": "module",
  "bin": {
    "create-walkrstudio": "./src/index.js"
  },
  "files": [
    "src"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: rename packages to @walkrstudio scope"
```

---

### Task 2: Update all import statements and internal references

**Files:**
- Modify: `packages/engine/src/player.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/playwright/src/capture.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/playwright/src/embed.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/playwright/src/encoder.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/cli/src/export.ts` — `@walkr/core` → `@walkrstudio/core`, `@walkr/playwright` → `@walkrstudio/playwright`
- Modify: `packages/cli/src/dev.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/cli/src/watch.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/studio/src/App.tsx` — `@walkr/core` → `@walkrstudio/core`, `@walkr/engine` → `@walkrstudio/engine`
- Modify: `packages/studio/src/components/StepPanel.tsx` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/studio/src/components/Timeline.tsx` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/studio/src/types.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `examples/ace-demo/demo.ts` — `@walkr/core` → `@walkrstudio/core`
- Modify: `packages/create-walkrstudio/src/index.js` — `@walkr/core` → `@walkrstudio/core`

**Step 1: Find-and-replace all `@walkr/` imports to `@walkrstudio/`**

In every `.ts`, `.tsx`, and `.js` file, replace:
- `"@walkr/core"` → `"@walkrstudio/core"`
- `"@walkr/engine"` → `"@walkrstudio/engine"`
- `"@walkr/playwright"` → `"@walkrstudio/playwright"`
- `"@walkr/cli"` → `"@walkrstudio/cli"`

**Step 2: Update private package deps (studio, ace-demo)**

`packages/studio/package.json` — update workspace deps:
- `"@walkr/core": "workspace:*"` → `"@walkrstudio/core": "workspace:*"`
- `"@walkr/engine": "workspace:*"` → `"@walkrstudio/engine": "workspace:*"`

`examples/ace-demo/package.json` — update workspace deps:
- `"@walkr/core": "workspace:*"` → `"@walkrstudio/core": "workspace:*"`
- `"@walkr/cli": "workspace:*"` → `"@walkrstudio/cli": "workspace:*"`

**Step 3: Update knip.json**

Change the `ignoreDependencies` entry:
- `"@walkr/playwright"` → `"@walkrstudio/playwright"`

**Step 4: Verify build passes**

Run: `pnpm install && pnpm build`
Expected: All packages build successfully.

Run: `pnpm type-check`
Expected: No type errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: update all imports and deps to @walkrstudio scope"
```

---

### Task 3: Create release-please configuration

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`

**Step 1: Create release-please-config.json**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    "packages/core": {
      "release-type": "node",
      "component": "core"
    },
    "packages/engine": {
      "release-type": "node",
      "component": "engine"
    },
    "packages/cli": {
      "release-type": "node",
      "component": "cli"
    },
    "packages/playwright": {
      "release-type": "node",
      "component": "playwright"
    },
    "packages/create-walkrstudio": {
      "release-type": "node",
      "component": "create-walkrstudio"
    }
  }
}
```

**Step 2: Create .release-please-manifest.json**

```json
{
  "packages/core": "0.1.0",
  "packages/engine": "0.1.0",
  "packages/cli": "0.1.0",
  "packages/playwright": "0.1.0",
  "packages/create-walkrstudio": "0.1.0"
}
```

**Step 3: Commit**

```bash
git add release-please-config.json .release-please-manifest.json
git commit -m "chore: add release-please manifest configuration"
```

---

### Task 4: Create GitHub Actions workflows

**Files:**
- Create: `.github/workflows/release-please.yml`
- Create: `.github/workflows/npm-publish.yml`

**Step 1: Create .github/workflows/release-please.yml**

```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Step 2: Create .github/workflows/npm-publish.yml**

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          registry-url: "https://registry.npmjs.org"

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - name: Determine package from tag
        id: pkg
        run: |
          TAG="${{ github.event.release.tag_name }}"
          # Tags are like: core-v0.2.0, engine-v0.1.1, create-walkrstudio-v0.1.0
          COMPONENT="${TAG%-v*}"
          VERSION="${TAG##*-v}"
          case "$COMPONENT" in
            core)                PKG_DIR="packages/core" ;;
            engine)              PKG_DIR="packages/engine" ;;
            cli)                 PKG_DIR="packages/cli" ;;
            playwright)          PKG_DIR="packages/playwright" ;;
            create-walkrstudio)  PKG_DIR="packages/create-walkrstudio" ;;
            *)
              echo "Unknown component: $COMPONENT"
              exit 1
              ;;
          esac
          echo "pkg_dir=$PKG_DIR" >> "$GITHUB_OUTPUT"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          echo "Publishing $COMPONENT v$VERSION from $PKG_DIR"

      - name: Publish
        working-directory: ${{ steps.pkg.outputs.pkg_dir }}
        run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Step 3: Commit**

```bash
git add .github/workflows/release-please.yml .github/workflows/npm-publish.yml
git commit -m "ci: add release-please and npm publish workflows"
```

---

### Task 5: Verify everything and push

**Step 1: Run full check**

Run: `pnpm install && pnpm check`
Expected: All lint, type-check, and knip passes.

**Step 2: Push all commits**

```bash
git push
```

**Step 3: Remind about NPM_TOKEN secret**

User must add `NPM_TOKEN` to GitHub repo settings:
1. Go to npmjs.com → Access Tokens → Generate New Token (Granular)
2. Give it publish permission for `@walkrstudio` scope
3. Go to GitHub repo → Settings → Secrets and variables → Actions
4. Add `NPM_TOKEN` with the token value
