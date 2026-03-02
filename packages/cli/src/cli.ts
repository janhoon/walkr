#!/usr/bin/env node
import { register } from "node:module";

// Register a custom ESM resolve hook so user walkthrough scripts can
// import @walkrstudio/* packages from the CLI's node_modules, even
// under strict package managers like pnpm.
register("./resolve-hook.js", import.meta.url);

import { devCommand } from "./dev.js";
import { type ExportOptions, exportCommand } from "./export.js";

export const VERSION = "0.1.0";

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
    console.log(`walkr v${VERSION}`);
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
