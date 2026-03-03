#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire, register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Register a custom ESM resolve hook so user walkthrough scripts can
// import @walkrstudio/* packages from the CLI's node_modules, even
// under strict package managers like pnpm.
register("./resolve-hook.js", import.meta.url);

import { devCommand } from "./dev.js";
import { type ExportOptions, exportCommand } from "./export.js";

function findPkgJson(startDir: string, name: string): string | undefined {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    try {
      const raw = readFileSync(join(dir, "package.json"), "utf-8");
      const pkg = JSON.parse(raw) as { name?: string; version?: string };
      if (pkg.name === name) return pkg.version;
    } catch {
      // no package.json here
    }
    dir = dirname(dir);
  }
  return undefined;
}

function readPkgVersion(name: string): string {
  const cliRequire = createRequire(import.meta.url);
  const resolvers = [cliRequire];

  // Also try resolving from studio's directory to find transitive deps (e.g. engine)
  try {
    resolvers.push(createRequire(cliRequire.resolve("@walkrstudio/studio/package.json")));
  } catch {}

  for (const req of resolvers) {
    // Try resolving <name>/package.json directly (works when no exports field blocks it)
    try {
      const raw = readFileSync(req.resolve(`${name}/package.json`), "utf-8");
      return (JSON.parse(raw) as { version: string }).version;
    } catch {}

    // Fallback: resolve the package entry and walk up to find its package.json
    try {
      return findPkgJson(dirname(req.resolve(name)), name) ?? "n/a";
    } catch {}
  }

  return "n/a";
}

/** CLI's own version, read from its package.json relative to this file. */
const CLI_VERSION =
  findPkgJson(dirname(fileURLToPath(import.meta.url)), "@walkrstudio/cli") ?? "n/a";

const USAGE = `\
Usage: walkr <command> [options]

Commands:
  walkr dev <script>                  Start Walkr Studio with live script reload
  walkr export <script> [options]     Export walkthrough as video or embed

Dev options:
  --port      <n>                     Dev server port (default: 5174)

Export options:
  --format    mp4|gif|webm|embed      Output format (default: mp4)
  --output    <path>                  Output file path (default: output.<ext>)
  --width     <n>                     Video width in px (default: 1920)
  --height    <n>                     Video height in px (default: 1080)
  --realtime                          Use real-time screencast instead of virtual time

Examples:
  walkr dev demo.ts
  walkr export demo.ts --format gif --output demo.gif
  walkr export demo.ts --format embed --output demo.html
`;

interface ParsedArgs {
  command: string | null;
  scriptPath: string | null;
  port: number | undefined;
  exportOptions: ExportOptions;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const result: ParsedArgs = {
    command: null,
    scriptPath: null,
    port: undefined,
    exportOptions: {},
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      result.version = true;
      continue;
    }
    if (arg === "--port") {
      result.port = parseInt(args[++i], 10);
      continue;
    }
    if (arg === "--format") {
      result.exportOptions.format = args[++i] as ExportOptions["format"];
      continue;
    }
    if (arg === "--output") {
      result.exportOptions.output = args[++i];
      continue;
    }
    if (arg === "--width") {
      result.exportOptions.width = parseInt(args[++i], 10);
      continue;
    }
    if (arg === "--height") {
      result.exportOptions.height = parseInt(args[++i], 10);
      continue;
    }
    if (arg === "--realtime") {
      result.exportOptions.realtime = true;
      continue;
    }

    if (!result.command) {
      result.command = arg;
    } else if (!result.scriptPath) {
      result.scriptPath = arg;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.version) {
    const deps = [
      "@walkrstudio/core",
      "@walkrstudio/engine",
      "@walkrstudio/studio",
      "@walkrstudio/recorder",
    ] as const;
    const all = ["@walkrstudio/cli", ...deps] as const;
    const maxLen = Math.max(...all.map((p) => p.length));
    console.log(`${"@walkrstudio/cli".padEnd(maxLen)}  ${CLI_VERSION}`);
    for (const name of deps) {
      console.log(`${name.padEnd(maxLen)}  ${readPkgVersion(name)}`);
    }
    return;
  }

  if (parsed.help || !parsed.command) {
    console.log(USAGE);
    return;
  }

  if (parsed.command === "dev") {
    if (!parsed.scriptPath) {
      console.error("Error: walkr dev requires a script path.\n");
      console.error("  Example: walkr dev demo.ts");
      process.exit(1);
    }
    await devCommand(parsed.scriptPath, parsed.port);
    return;
  }

  if (parsed.command === "export") {
    if (!parsed.scriptPath) {
      console.error("Error: walkr export requires a script path.\n");
      console.error("  Example: walkr export demo.ts --format mp4");
      process.exit(1);
    }
    await exportCommand(parsed.scriptPath, parsed.exportOptions);
    return;
  }

  console.error(`Error: unknown command "${parsed.command}"\n`);
  console.error(USAGE);
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
