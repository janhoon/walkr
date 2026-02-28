import { watch as fsWatch } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Walkthrough } from "@walkr/core";

const WATCH_DEBOUNCE_MS = 200;

const isWalkthrough = (value: unknown): value is Walkthrough => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeWalkthrough = value as Partial<Walkthrough>;
  return typeof maybeWalkthrough.url === "string" && Array.isArray(maybeWalkthrough.steps);
};

export const loadScriptWalkthrough = async (scriptPath: string): Promise<Walkthrough> => {
  const scriptUrl = pathToFileURL(scriptPath);
  scriptUrl.searchParams.set("t", String(Date.now()));

  const importedModule = (await import(scriptUrl.href)) as { default?: unknown };
  if (!isWalkthrough(importedModule.default)) {
    throw new Error("Script default export must be a Walkthrough");
  }

  return importedModule.default;
};

export const watchScript = (scriptPath: string, callback: () => void): (() => void) => {
  const absolutePath = resolve(scriptPath);
  let debounceTimer: NodeJS.Timeout | null = null;

  const watcher = fsWatch(absolutePath, () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      console.log(`[walkr] File change detected: ${absolutePath}`);
      callback();
    }, WATCH_DEBOUNCE_MS);
  });

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    watcher.close();
  };
};

export const watch = (
  scriptPath: string,
  onChange: (walkthrough: Walkthrough) => void,
): (() => void) => {
  const absolutePath = resolve(scriptPath);

  const reload = async (): Promise<void> => {
    try {
      const walkthrough = await loadScriptWalkthrough(absolutePath);
      onChange(walkthrough);
    } catch (error) {
      console.error(`[walkr] Failed to load script ${absolutePath}`, error);
    }
  };

  void reload();

  const stopWatching = watchScript(absolutePath, () => {
    void reload();
  });

  return () => {
    stopWatching();
  };
};
