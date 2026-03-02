#!/usr/bin/env node
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(input) {
  return input.trim().replace(/[<>:"/\\|?*]/g, "-");
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function directoryExists(dir) {
  try {
    await access(dir);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyDir(dir) {
  if (!(await directoryExists(dir))) {
    await mkdir(dir, { recursive: true });
    return;
  }
  const entries = await readdir(dir);
  if (entries.length > 0) {
    throw new Error(
      `Directory "${path.basename(dir)}" already exists and is not empty.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

function buildPackageJson(name, description) {
  const pkg = {
    name,
    private: true,
    type: "module",
    scripts: {
      dev: "walkr dev walkthrough.ts",
      export:
        "walkr export walkthrough.ts --format mp4 --output output.mp4",
    },
    dependencies: {
      "@walkrstudio/core": "^0.2.0",
      "@walkrstudio/engine": "^0.2.0",
    },
    devDependencies: {
      typescript: "^5.8.2",
    },
  };
  if (description) {
    pkg.description = description;
  }
  return pkg;
}

function walkthroughSource(description) {
  const descLine = description
    ? `\n  description: ${JSON.stringify(description)},`
    : "";
  return `import {
  walkr,
  moveTo,
  click,
  type,
  highlight,
  wait,
  waitForSelector,
} from "@walkrstudio/core";

export default walkr({
  url: "https://example.com",
  title: "My First Walkthrough",${descLine}
  viewport: { width: 1280, height: 720 },
  steps: [
    // Wait for the page to be ready
    waitForSelector("input[name=email]"),

    // Move the cursor to the email input and click it
    moveTo("input[name=email]", { duration: 600 }),
    click("input[name=email]"),

    // Type an email address
    type("hello@example.com", { selector: "input[name=email]", delay: 40 }),

    wait(300),

    // Highlight the submit button
    highlight(".submit-btn", {
      color: "#22d3ee",
      duration: 1200,
      spotlight: true,
    }),

    // Click submit
    moveTo(".submit-btn", { duration: 400 }),
    click(".submit-btn"),
  ],
});
`;
}

function tsconfigSource() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["walkthrough.ts"],
    },
    null,
    2,
  );
}

function readmeSource(name) {
  return `# ${name}

A [Walkr](https://github.com/janhoon/walkr) walkthrough project.

## Getting started

\`\`\`bash
npm install
\`\`\`

## Development

Start the Walkr Studio preview:

\`\`\`bash
npm run dev
# or directly:
npx walkr dev walkthrough.ts
\`\`\`

## Export

Export the walkthrough to MP4:

\`\`\`bash
npm run export
\`\`\`

## Project structure

\`\`\`
${name}/
├── walkthrough.ts   # your walkthrough definition
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Learn more

Edit \`walkthrough.ts\` to point at your app's URL and customise the steps.
See the [\`@walkrstudio/core\` docs](https://github.com/janhoon/walkr/tree/main/packages/core) for the full step API.
`;
}

function gitignoreSource() {
  return `node_modules/
dist/
*.log
output.*
`;
}

// ---------------------------------------------------------------------------
// Scaffold
// ---------------------------------------------------------------------------

async function scaffold(name, description) {
  const targetDir = path.resolve(process.cwd(), name);
  await ensureEmptyDir(targetDir);

  await Promise.all([
    writeFile(
      path.join(targetDir, "package.json"),
      `${JSON.stringify(buildPackageJson(name, description), null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(targetDir, "walkthrough.ts"),
      walkthroughSource(description),
      "utf8",
    ),
    writeFile(
      path.join(targetDir, "tsconfig.json"),
      `${tsconfigSource()}\n`,
      "utf8",
    ),
    writeFile(
      path.join(targetDir, "README.md"),
      readmeSource(name),
      "utf8",
    ),
    writeFile(
      path.join(targetDir, ".gitignore"),
      gitignoreSource(),
      "utf8",
    ),
  ]);

  console.log();
  console.log(`  ✨ Created walkr project: ${name}`);
  console.log();
  console.log("  Next steps:");
  console.log();
  console.log(`    cd ${name}`);
  console.log("    npm install");
  console.log("    npx walkr dev walkthrough.ts");
  console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log();
  console.log("  create-walkrstudio");
  console.log();

  // Project name — from argv or interactive prompt
  let name = sanitize(process.argv[2] ?? "");
  if (!name) {
    name = sanitize(await prompt("  Project name: "));
  }
  if (!name) {
    throw new Error("Project name is required.");
  }

  // Optional description — only prompt interactively (skip when name was passed as arg)
  let description = "";
  if (!process.argv[2]) {
    description = (await prompt("  Description (optional): ")).trim();
  }

  await scaffold(name, description);
}

main().catch((error) => {
  console.error(
    `\n  Error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
