# npm Packaging & release-please Design

**Date:** 2026-02-28
**Status:** Approved

## Goal

Set up npm packaging for all publishable Walkr packages under the `@walkrstudio` scope, with automated releases via release-please and GitHub Actions.

## Decisions

- **npm scope:** `@walkrstudio` (public access)
- **Versioning:** Independent per package
- **Release branch:** `main` only
- **Commit convention:** Conventional Commits with package scopes
- **Release tool:** release-please manifest mode

## Package Mapping

| Current name | npm name | Published |
|---|---|---|
| `@walkr/core` | `@walkrstudio/core` | Yes |
| `@walkr/engine` | `@walkrstudio/engine` | Yes |
| `@walkr/cli` | `@walkrstudio/cli` | Yes |
| `@walkr/playwright` | `@walkrstudio/playwright` | Yes |
| `create-walkr` | `create-walkrstudio` | Yes |
| `@walkr/studio` | unchanged | No (private) |
| `@walkr/example-ace-demo` | unchanged | No (private) |

## Architecture

### release-please manifest mode

Two config files at the repo root:

- **`release-please-config.json`** — Declares each package's path, release type (`node`), and component name. Uses `separate-pull-requests: false` to group all pending releases into one PR.
- **`.release-please-manifest.json`** — Tracks current version of each package. Starts at `0.1.0` for all.

### GitHub Actions workflows

1. **`release-please.yml`** — Triggers on push to `main`. Runs the `googleapis/release-please-action`. Creates/updates a Release PR with changelog entries. When the Release PR is merged, creates GitHub Releases with git tags.

2. **`npm-publish.yml`** — Triggers on `release: published` events. Determines which package was released from the tag name, builds it, and runs `pnpm publish` (which auto-converts `workspace:*` to real versions).

### npm auth

Requires an `NPM_TOKEN` repository secret — a granular access token from npmjs.com with publish permission for the `@walkrstudio` scope.

## Package.json changes

Each publishable package needs:
- `name` renamed to `@walkrstudio/*` scope
- `"publishConfig": { "access": "public" }` added
- Internal `workspace:*` deps renamed to match new scope names

`create-walkr` becomes `create-walkrstudio` with bin entry updated.

## Conventional Commits

release-please parses commit messages to determine version bumps:

- `feat(core): add X` → minor bump for `@walkrstudio/core`
- `fix(engine): fix Y` → patch bump for `@walkrstudio/engine`
- `feat!: breaking` or `BREAKING CHANGE:` footer → major bump
- Unscoped commits are attributed to all packages

Component names in release-please config map commit scopes to packages:
- `core` → `packages/core`
- `engine` → `packages/engine`
- `cli` → `packages/cli`
- `playwright` → `packages/playwright`
- `create-walkrstudio` → `packages/create-walkrstudio`
