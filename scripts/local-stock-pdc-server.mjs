#!/usr/bin/env node

/**
 * Local Stock PDC operator server.
 *
 * This serves the existing Stock PDC pages and reuses their Pages Function
 * logic locally. Its data-refresh endpoint runs the engine on this computer;
 * it never dispatches a GitHub Action and never reads Cloudflare secrets.
 */
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { onRequestGet, onRequestPost } from "../functions/stock-pdc/[[path]].js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const engineRoot = path.join(repoRoot, "stock-pdc-engine");
const localStateRoot = path.join(repoRoot, ".local-stock-pdc");
const kvRoot = path.join(localStateRoot, "kv");
const port = Number(process.env.LOCAL_STOCK_PDC_PORT || 8788);
const host = process.env.LOCAL_STOCK_PDC_HOST || "127.0.0.1";
const dataRefreshPaths = new Set([
  "/stock-pdc/decision/api/data-refresh",
  "/stock-pdc/decision-demo/api/data-refresh"
]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

function parseEnvFile(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

async function localEnv() {
  let fileValues = {};
  try {
    fileValues = parseEnvFile(await fs.readFile(path.join(repoRoot, ".env.local"), "utf8"));
  } catch (caught) {
    if (caught?.code !== "ENOENT") throw caught;
  }
  // The remote dispatch token is intentionally unavailable to this local
  // server: refreshes must run through the local engine, never GitHub Actions.
  delete fileValues.STOCK_PDC_GITHUB_TOKEN;
  const values = { ...process.env, ...fileValues };
  delete values.STOCK_PDC_GITHUB_TOKEN;
  values.AUTH_KV = new FileKv(kvRoot);
  return values;
}

class FileKv {
  constructor(root) {
    this.root = root;
  }

  fileFor(key) {
    return path.join(this.root, `${Buffer.from(String(key)).toString("base64url")}.txt`);
  }

  async get(key, type) {
    try {
      const value = await fs.readFile(this.fileFor(key), "utf8");
      return type === "json" ? JSON.parse(value) : value;
    } catch (caught) {
      if (caught?.code === "ENOENT") return null;
      throw caught;
    }
  }

  async put(key, value) {
    await fs.mkdir(this.root, { recursive: true });
    const target = this.fileFor(key);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporary, String(value), "utf8");
    await fs.rename(temporary, target);
  }

  async delete(key) {
    try {
      await fs.unlink(this.fileFor(key));
    } catch (caught) {
      if (caught?.code !== "ENOENT") throw caught;
    }
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function commandOutput(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${path.basename(command)} exited with code ${code}. ${output.slice(-1200)}`));
    });
  });
}

let activeRefresh = null;

async function runLocalMarketRefresh() {
  if (activeRefresh) return null;
  activeRefresh = (async () => {
    const python = process.env.STOCK_PDC_PYTHON || "python3";
    await commandOutput(python, ["scripts/run_latest_pdc.py", "--top", "20", "--variants", "a"], { cwd: engineRoot });
    await commandOutput(process.execPath, ["scripts/sync-stock-pdc-rank-flow.mjs"], { cwd: repoRoot });
  })();
  try {
    await activeRefresh;
  } finally {
    activeRefresh = null;
  }
  return true;
}

async function staticResponse(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const requested = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = path.resolve(repoRoot, requested);
  if (candidate !== repoRoot && !candidate.startsWith(`${repoRoot}${path.sep}`)) return new Response("Not found", { status: 404 });
  let target = candidate;
  try {
    const info = await fs.stat(target);
    if (info.isDirectory()) target = path.join(target, "index.html");
    const body = await fs.readFile(target);
    return new Response(body, { status: 200, headers: { "content-type": mimeTypes[path.extname(target)] || "application/octet-stream" } });
  } catch (caught) {
    if (caught?.code === "ENOENT") return new Response("Not found", { status: 404 });
    throw caught;
  }
}

function nodeRequestToWeb(request, origin) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else if (value !== undefined) headers.set(key, value);
  }
  const body = ["GET", "HEAD"].includes(request.method || "GET") ? undefined : request;
  return new Request(new URL(request.url || "/", origin), {
    method: request.method,
    headers,
    body,
    duplex: body ? "half" : undefined
  });
}

async function writeWebResponse(response, reply) {
  reply.statusCode = response.status;
  response.headers.forEach((value, key) => reply.setHeader(key, value));
  reply.end(Buffer.from(await response.arrayBuffer()));
}

const env = await localEnv();
const server = createServer(async (request, reply) => {
  try {
    const origin = `http://${host}:${port}`;
    const url = new URL(request.url || "/", origin);
    if (request.method === "POST" && dataRefreshPaths.has(url.pathname)) {
      // Reuse the existing access-code check before allowing a local process to
      // consume market-data or model resources. With the dispatch secret removed
      // above, an authorized request deliberately returns the manual-only 503.
      const authorizationProbe = await onRequestPost({
        request: nodeRequestToWeb(request, origin),
        env,
        next: () => staticResponse(url.pathname)
      });
      if (authorizationProbe.status !== 503) {
        await writeWebResponse(authorizationProbe, reply);
        return;
      }
      if (activeRefresh) {
        await writeWebResponse(json({ error: "本地全市场行情刷新正在运行；请等待完成后刷新页面。" }, 409), reply);
        return;
      }
      await runLocalMarketRefresh();
      await writeWebResponse(json({
        ok: true,
        status: "LOCAL_COMPLETED",
        message: "本地全市场行情与 Hawkeye 已刷新完成。现在可开始 PDC；公网展示不会自动发布。"
      }), reply);
      return;
    }
    const webRequest = nodeRequestToWeb(request, origin);
    const context = { request: webRequest, env, next: () => staticResponse(url.pathname) };
    const response = request.method === "GET" || request.method === "HEAD"
      ? await onRequestGet(context)
      : await onRequestPost(context);
    await writeWebResponse(response, reply);
  } catch (caught) {
    await writeWebResponse(json({ error: `Local Stock PDC server error: ${String(caught?.message || caught)}` }, 500), reply);
  }
});

server.listen(port, host, () => {
  console.log(`Local Stock PDC is ready at http://${host}:${port}/stock-pdc/decision/`);
});
