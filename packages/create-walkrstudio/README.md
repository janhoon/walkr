# create-walkrstudio

Scaffold a new Walkr project.

## Usage

```bash
npm create walkrstudio@latest my-demo
```

Or interactively:

```bash
npm create walkrstudio@latest
# prompts for project name
```

This creates a project directory with:

```
my-demo/
  demo.ts          # starter walkthrough script
  package.json     # dependencies and dev/export scripts
  tsconfig.json    # TypeScript config
  .gitignore
  README.md
```

## What's included

- `@walkrstudio/core` as a dependency
- TypeScript configured for Node 18+ / ES modules
- npm scripts:
  - `pnpm dev` — start the Studio preview with `walkr dev demo.ts`
  - `pnpm export` — export to MP4 with `walkr export demo.ts`

## Next steps

```bash
cd my-demo
pnpm install
npx walkr dev demo.ts
```

Edit `demo.ts` to point at your app's URL and add your walkthrough steps. See the [@walkrstudio/core README](../core/README.md) for the full step API.
