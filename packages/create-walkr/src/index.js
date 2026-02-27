#!/usr/bin/env node
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";

function sanitizeProjectName(input) {
  return input.trim();
}

async function askProjectName() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question("Project name: ");
    return sanitizeProjectName(answer);
  } finally {
    rl.close();
  }
}

async function directoryExists(targetDir) {
  try {
    await access(targetDir);
    return true;
  } catch {
    return false;
  }
}

async function ensureTargetDirectory(targetDir) {
  if (!(await directoryExists(targetDir))) {
    await mkdir(targetDir, { recursive: true });
    return;
  }

  const entries = await readdir(targetDir);
  if (entries.length > 0) {
    throw new Error(`Directory "${path.basename(targetDir)}" already exists and is not empty.`);
  }
}

function buildPackageJson(projectName) {
  return {
    name: projectName,
    private: true,
    type: "module",
    scripts: {
      dev: "npx walkr dev demo.ts",
      export: "npx walkr export demo.ts --format mp4 --output output.mp4"
    },
    dependencies: {
      "@walkr/core": "^0.1.0"
    },
    devDependencies: {
      "@tsconfig/node18": "^18.2.4",
      typescript: "^5.8.2"
    }
  };
}

function demoSource() {
  return `import { walkr, moveTo, click, type, highlight, wait } from "@walkr/core";

export default walkr({
  url: "https://example.com",
  title: "My first Walkr demo",
  steps: [
    moveTo(640, 400, { duration: 700 }),
    click(640, 400),
    type("hello@example.com", { selector: "input[name=email]", delay: 30 }),
    highlight(".submit-btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
    wait(400),
  ],
});
`;
}

function tsconfigSource() {
  return JSON.stringify(
    {
      extends: "@tsconfig/node18/tsconfig.json",
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        strict: true,
        noEmit: true
      },
      include: ["demo.ts"]
    },
    null,
    2
  );
}

function readmeSource(projectName) {
  return `# Getting started with Walkr

## Run locally

\`pnpm install\`

\`pnpm dev\`

## Export

\`pnpm export\`

Project: ${projectName}
`;
}

async function scaffoldProject(projectName) {
  const targetDir = path.resolve(process.cwd(), projectName);
  await ensureTargetDirectory(targetDir);

  await Promise.all([
    writeFile(
      path.join(targetDir, "package.json"),
      `${JSON.stringify(buildPackageJson(projectName), null, 2)}\n`,
      "utf8"
    ),
    writeFile(path.join(targetDir, "demo.ts"), demoSource(), "utf8"),
    writeFile(path.join(targetDir, "tsconfig.json"), `${tsconfigSource()}\n`, "utf8"),
    writeFile(path.join(targetDir, ".gitignore"), "node_modules\ndist\n*.log\noutput.*\n", "utf8"),
    writeFile(path.join(targetDir, "README.md"), readmeSource(projectName), "utf8")
  ]);

  console.log(`✨ Created walkr project: ${projectName}`);
  console.log(`Next: cd ${projectName} && pnpm install && walkr dev demo.ts`);
}

async function main() {
  const argName = sanitizeProjectName(process.argv[2] ?? "");
  const projectName = argName || (await askProjectName());

  if (!projectName) {
    throw new Error("Project name is required.");
  }

  await scaffoldProject(projectName);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
