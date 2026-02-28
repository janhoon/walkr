import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const cliRequire = createRequire(import.meta.url);

/**
 * Custom ESM resolve hook that allows user walkthrough scripts to
 * import @walkrstudio/* packages from the CLI's own node_modules.
 *
 * Without this, pnpm's strict hoisting prevents the user's script
 * from finding packages that are dependencies of the CLI but not
 * direct dependencies of the user's project.
 */
export function resolve(
  specifier: string,
  context: { parentURL?: string },
  nextResolve: (specifier: string, context: { parentURL?: string }) => { url: string },
): { url: string; shortCircuit?: boolean } {
  if (specifier.startsWith("@walkrstudio/")) {
    try {
      const resolved = cliRequire.resolve(specifier);
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    } catch {
      // Fall through to default resolution
    }
  }
  return nextResolve(specifier, context);
}
