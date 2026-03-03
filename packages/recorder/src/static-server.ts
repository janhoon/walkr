import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import { createRequire } from "node:module";
import * as net from "node:net";
import { dirname, extname, join, resolve } from "node:path";

import type { Walkthrough } from "@walkrstudio/core";

const PROXY_PREFIX = "/__target__";

interface StudioServer {
  port: number;
  url: string;
  close: () => void;
}

function rewriteWalkthroughUrl(
  walkthrough: Walkthrough,
  targetOrigin: string,
): Walkthrough & { originalUrl: string } {
  return {
    ...walkthrough,
    originalUrl: walkthrough.url,
    url: walkthrough.url.replace(targetOrigin, PROXY_PREFIX),
  };
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        reject(new Error("Failed to get free port"));
        return;
      }
      const port = addr.port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

/**
 * Rewrite absolute paths in proxied text responses so that sub-resource
 * requests (scripts, styles, fetches) route back through the proxy.
 */
function rewriteAbsolutePaths(content: string, contentType: string): string {
  if (contentType.includes("html")) {
    let html = content
      .replace(
        /((?:src|href|action|poster|formaction|icon|manifest|ping|background)\s*=\s*)(["'])\/(?!\/|__target__)/gi,
        `$1$2${PROXY_PREFIX}/`,
      )
      .replace(/\burl\(\s*["']?\/(?!\/|__target__)/g, (m) => m.replace("/", `${PROXY_PREFIX}/`))
      .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]*\/)/g, `$1${PROXY_PREFIX}/$2`)
      .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]+\.\w{2,})/g, `$1${PROXY_PREFIX}/$2`);

    if (!/<base\b/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, `$1<base href="${PROXY_PREFIX}/">`);
    }

    return html;
  }

  if (contentType.includes("css")) {
    return content
      .replace(/\burl\(\s*["']?\/(?!\/|__target__)/g, (m) => m.replace("/", `${PROXY_PREFIX}/`))
      .replace(/(@import\s+["'])\/(?!\/|__target__)/g, `$1${PROXY_PREFIX}/`);
  }

  // First, strip full localhost origin URLs (e.g. axios baseURL: "http://localhost:8080")
  // so that API calls route through the proxy instead of bypassing it.
  content = content.replace(/(["'`])https?:\/\/localhost:\d+/g, `$1`);

  return content
    .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]*\/)/g, `$1${PROXY_PREFIX}/$2`)
    .replace(/(["'`])\/(?!\/|__target__)([a-zA-Z@._][\w@._-]+\.\w{2,})/g, `$1${PROXY_PREFIX}/$2`);
}

function isTextResponse(contentType: string): boolean {
  return (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("css")
  );
}

function ensureStudioBuild(studioRoot: string): void {
  const distIndex = resolve(studioRoot, "dist", "index.html");
  if (fs.existsSync(distIndex)) return;

  execSync("npx vite build", {
    cwd: studioRoot,
    stdio: "inherit",
  });

  if (!fs.existsSync(distIndex)) {
    throw new Error(`Studio build failed: ${distIndex} not found after vite build`);
  }
}

function proxyRequest(
  targetOrigin: string,
  targetPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void {
  const targetUrl = new URL(targetPath, targetOrigin);
  const transport = targetUrl.protocol === "https:" ? https : http;

  const headers: Record<string, string | string[] | undefined> = { ...req.headers };
  headers.host = targetUrl.host;
  headers["accept-encoding"] = "identity";
  // Rewrite Origin so the target's CORS middleware accepts the request
  const reqOrigin = headers.origin as string | undefined;
  if (reqOrigin) {
    headers.origin = targetOrigin;
  }

  const proxyReq = transport.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      // Rewrite CORS allow-origin to match the studio's origin
      if (reqOrigin && proxyRes.headers["access-control-allow-origin"]) {
        proxyRes.headers["access-control-allow-origin"] = reqOrigin;
      }

      const contentType = proxyRes.headers["content-type"] ?? "";

      if (isTextResponse(contentType)) {
        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          const rewritten = rewriteAbsolutePaths(raw, contentType);
          const responseHeaders = { ...proxyRes.headers };
          delete responseHeaders["content-length"];
          delete responseHeaders["content-encoding"];
          responseHeaders["cache-control"] = "no-store";
          delete responseHeaders.etag;
          res.writeHead(proxyRes.statusCode ?? 200, responseHeaders);
          res.end(rewritten);
        });
      } else {
        const responseHeaders = { ...proxyRes.headers };
        responseHeaders["cache-control"] = "no-store";
        delete responseHeaders.etag;
        res.writeHead(proxyRes.statusCode ?? 200, responseHeaders);
        proxyRes.pipe(res);
      }
    },
  );

  proxyReq.on("error", (err) => {
    res.writeHead(502);
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(proxyReq);
}

export async function startStaticServer(walkthrough: Walkthrough): Promise<StudioServer> {
  const require = createRequire(import.meta.url);
  const studioRoot = dirname(require.resolve("@walkrstudio/studio/package.json"));

  ensureStudioBuild(studioRoot);

  let targetOrigin = "";
  try {
    targetOrigin = new URL(walkthrough.url).origin;
  } catch {}

  const proxied = targetOrigin ? rewriteWalkthroughUrl(walkthrough, targetOrigin) : walkthrough;
  const walkthroughJson = JSON.stringify(proxied, null, 2);

  const distDir = resolve(studioRoot, "dist");
  const port = await getFreePort();

  const server = http.createServer((req, res) => {
    const urlPath = req.url?.split("?")[0] ?? "/";

    // Serve walkthrough.json from memory
    if (urlPath === "/walkthrough.json") {
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(walkthroughJson);
      return;
    }

    // Proxy /__target__/* to target origin
    if (targetOrigin && urlPath.startsWith(PROXY_PREFIX)) {
      const targetPath = urlPath.slice(PROXY_PREFIX.length) || "/";
      proxyRequest(targetOrigin, targetPath, req, res);
      return;
    }

    // Serve static files from dist
    let filePath = join(distDir, urlPath === "/" ? "index.html" : urlPath);

    // SPA fallback: if file doesn't exist and no extension, serve index.html
    if (!fs.existsSync(filePath)) {
      const ext = extname(filePath);
      if (!ext) {
        filePath = join(distDir, "index.html");
      }
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = join(filePath, "index.html");
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
    }

    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] ?? "application/octet-stream";

    res.writeHead(200, {
      "content-type": mime,
      "content-length": stat.size,
      "cache-control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  return {
    port,
    url: `http://127.0.0.1:${port}`,
    close() {
      server.close();
    },
  };
}
