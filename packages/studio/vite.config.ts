import { watch as fsWatch, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

function walkthroughHmr(): Plugin {
  const jsonPath = resolve(__dirname, "public", "walkthrough.json");
  return {
    name: "walkr-walkthrough-hmr",
    configureServer(server) {
      let last = "";
      const watcher = fsWatch(jsonPath, () => {
        try {
          const content = readFileSync(jsonPath, "utf-8");
          if (content === last) return;
          last = content;
          server.ws.send({
            type: "custom",
            event: "walkthrough:update",
            data: JSON.parse(content),
          });
        } catch {
          // file may be mid-write
        }
      });
      server.httpServer?.on("close", () => watcher.close());
    },
  };
}

let proxyTarget = process.env.WALKR_PROXY_TARGET ?? "";
if (!proxyTarget) {
  try {
    proxyTarget = readFileSync(resolve(__dirname, ".walkr-proxy-target"), "utf-8").trim();
  } catch {
    // No proxy target file — proxy disabled
  }
}
const PREFIX = "/__target__";

/**
 * Rewrite absolute paths in proxied text responses so that sub-resource
 * requests (scripts, styles, fetches) route back through the proxy.
 *
 * Content-type-aware to avoid corrupting JS regex literals like `/"/g`
 * which the old blanket regex would turn into `"/__target__/g`.
 */
function rewriteAbsolutePaths(content: string, contentType: string): string {
  // HTML: targeted attribute rewriting + conservative general patterns
  if (contentType.includes("html")) {
    return (
      content
        // HTML attributes: src="/x", href="/x", action="/x", etc.
        .replace(
          /((?:src|href|action|poster|formaction|icon|manifest|ping|background)\s*=\s*)(["'])\/(?!\/|__target__)/gi,
          `$1$2${PREFIX}/`,
        )
        // Inline style url()
        .replace(/\burl\(\s*["']?\/(?!\/|__target__)/g, (m) => m.replace("/", `${PREFIX}/`))
        // Quoted deep paths (contain /): "/assets/chunk.js" → "/__target__/assets/chunk.js"
        .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]*\/)/g, `$1${PREFIX}/$2`)
        // Quoted root files with extension: "/favicon.ico" → "/__target__/favicon.ico"
        .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]+\.\w{2,})/g, `$1${PREFIX}/$2`)
    );
  }

  // CSS: url() and @import
  if (contentType.includes("css")) {
    return content
      .replace(/\burl\(\s*["']?\/(?!\/|__target__)/g, (m) => m.replace("/", `${PREFIX}/`))
      .replace(/(@import\s+["'])\/(?!\/|__target__)/g, `$1${PREFIX}/`);
  }

  // JS/JSON/other text: conservative patterns only.
  // Only match paths with depth ("/segment/...") or file extensions ("/file.ext").
  // This avoids corrupting regex flags like .replace(/"/g, ...) where "/g" would match.
  return content
    .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]*\/)/g, `$1${PREFIX}/$2`)
    .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]+\.\w{2,})/g, `$1${PREFIX}/$2`);
}

function isTextResponse(contentType: string): boolean {
  return (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("css")
  );
}

export default defineConfig({
  plugins: [react(), walkthroughHmr()],
  server: {
    port: 3000,
    proxy: proxyTarget
      ? {
          [PREFIX]: {
            target: proxyTarget,
            changeOrigin: true,
            rewrite: (path) => path.replace(new RegExp(`^${PREFIX}`), ""),
            // We handle the response ourselves so we can rewrite paths
            selfHandleResponse: true,
            configure: (proxy) => {
              // Ask target not to compress so we can rewrite text
              proxy.on("proxyReq", (proxyReq) => {
                proxyReq.setHeader("accept-encoding", "identity");
              });

              proxy.on("proxyRes", (proxyRes, _req: IncomingMessage, res: ServerResponse) => {
                const contentType = proxyRes.headers["content-type"] ?? "";

                if (isTextResponse(contentType)) {
                  // Buffer text response, rewrite paths, then send
                  const chunks: Buffer[] = [];
                  proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
                  proxyRes.on("end", () => {
                    const raw = Buffer.concat(chunks).toString("utf-8");
                    const rewritten = rewriteAbsolutePaths(raw, contentType);
                    const headers = { ...proxyRes.headers };
                    delete headers["content-length"];
                    delete headers["content-encoding"];
                    // Prevent browser from caching rewritten responses
                    headers["cache-control"] = "no-store";
                    delete headers.etag;
                    res.writeHead(proxyRes.statusCode ?? 200, headers);
                    res.end(rewritten);
                  });
                } else {
                  // Binary responses (images, fonts) pass through unchanged
                  const headers = { ...proxyRes.headers };
                  headers["cache-control"] = "no-store";
                  delete headers.etag;
                  res.writeHead(proxyRes.statusCode ?? 200, headers);
                  proxyRes.pipe(res);
                }
              });
            },
          },
        }
      : {},
  },
});
