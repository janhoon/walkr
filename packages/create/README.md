# @walkrstudio/create

Scaffold a new [Walkr](https://github.com/janhoon/walkr) walkthrough project.

## Usage

```bash
npm create @walkrstudio@latest my-project
```

Or interactively:

```bash
npm create @walkrstudio@latest
# ➜ prompts for project name and optional description
```

You can also use npx:

```bash
npx create-walkrstudio my-project
```

## What you get

```
my-project/
├── walkthrough.ts   # starter walkthrough using @walkrstudio/core
├── package.json     # dependencies & dev/export scripts
├── tsconfig.json    # TypeScript config (ES2022 / NodeNext)
├── .gitignore
└── README.md
```

### Dependencies

- `@walkrstudio/core` — step definitions and walkthrough builder
- `@walkrstudio/engine` — playback engine

### Scripts

| Script         | Command                                              |
| -------------- | ---------------------------------------------------- |
| `npm run dev`  | `walkr dev walkthrough.ts` — live Studio preview     |
| `npm run export` | `walkr export walkthrough.ts` — export to MP4      |

## Next steps

```bash
cd my-project
npm install
npx walkr dev walkthrough.ts
```

Edit `walkthrough.ts` to point at your app's URL and add your walkthrough steps.
See the [`@walkrstudio/core` README](../core/README.md) for the full step API.
