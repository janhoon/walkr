# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing.

## For Contributors

### When to add a changeset

Any time you make a change that should result in a new package version (bug fix, feature, breaking change), add a changeset before merging your PR.

### How to add a changeset

```bash
pnpm changeset
```

This will prompt you to:

1. **Select packages** — pick which packages your change affects
2. **Choose bump type** — major / minor / patch
3. **Write a summary** — a short description of the change (this goes into CHANGELOG.md)

A new markdown file will be created in `.changeset/`. Commit it with your PR.

### Example

```bash
$ pnpm changeset
🦋  Which packages would you like to include? @walkrstudio/core
🦋  Which packages should have a major bump? (none)
🦋  Which packages should have a minor bump? @walkrstudio/core
🦋  Summary: Added support for conditional steps
```

## How Releases Work

1. PRs with changesets merge into `main`
2. The GitHub Action detects pending changesets and opens a **"Version Packages"** PR
3. That PR bumps versions, updates CHANGELOGs, and removes consumed changesets
4. When the Version Packages PR is merged, the action publishes all updated packages to npm

All `@walkrstudio/*` packages are **linked** — they always version together (lockstep). A change to any package bumps them all to the same version.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm changeset` | Create a new changeset |
| `pnpm version` | Apply changesets and bump versions (CI does this) |
| `pnpm release` | Build and publish to npm (CI does this) |
