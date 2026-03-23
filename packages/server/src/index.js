#!/usr/bin/env node
/**
 * Mnemo REST API Server
 * Lightweight HTTP server — no Express, no dependencies beyond @mnemoai/core.
 *
 * Usage:
 *   npx @mnemoai/server                              # default port 18100
 *   MNEMO_PORT=8080 npx @mnemoai/server               # custom port
 *   OPENAI_API_KEY=sk-... npx @mnemoai/server          # with OpenAI
 *
 * Endpoints:
 *   POST   /store    { text, category?, importance?, scope? }
 *   POST   /recall   { query, limit?, scopeFilter?, category? }
 *   DELETE /memories/:id
 *   GET    /stats
 *   GET    /health
 */

import { createServer } from "node:http";
import { createMnemo } from "@mnemoai/core";

const PORT = parseInt(process.env.MNEMO_PORT || "18100", 10);
const DB_PATH = process.env.MNEMO_DB_PATH || "./mnemo-data";

// ── Config from env ──
const config = {
  embedding: {
    provider: "openai-compatible",
    apiKey: process.env.OPENAI_API_KEY || process.env.MNEMO_API_KEY || "ollama",
    baseURL: process.env.MNEMO_EMBEDDING_BASE_URL || undefined,
    model: process.env.MNEMO_EMBEDDING_MODEL || "text-embedding-3-small",
    dimensions: parseInt(process.env.MNEMO_EMBEDDING_DIMENSIONS || "1536", 10),
  },
  dbPath: DB_PATH,
  storageBackend: process.env.MNEMO_STORAGE_BACKEND || undefined,
  storageConfig: process.env.MNEMO_STORAGE_CONFIG
    ? JSON.parse(process.env.MNEMO_STORAGE_CONFIG)
    : undefined,
};

// ── Init ──
console.log(`[mnemo-server] Initializing with dbPath=${DB_PATH}...`);
const mnemo = await createMnemo(config);
console.log(`[mnemo-server] Ready.`);

// ── Helpers ──
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

// ── Routes ──
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    json(res, 204, null);
    return;
  }

  try {
    // POST /store
    if (method === "POST" && path === "/store") {
      const body = await readBody(req);
      if (!body.text) {
        json(res, 400, { error: "text is required" });
        return;
      }
      const result = await mnemo.store({
        text: body.text,
        category: body.category,
        importance: body.importance,
        scope: body.scope,
      });
      json(res, 201, result);
      return;
    }

    // POST /recall
    if (method === "POST" && path === "/recall") {
      const body = await readBody(req);
      if (!body.query) {
        json(res, 400, { error: "query is required" });
        return;
      }
      const results = await mnemo.recall(body.query, {
        limit: body.limit,
        scopeFilter: body.scopeFilter,
        category: body.category,
      });
      json(res, 200, { results });
      return;
    }

    // DELETE /memories/:id
    if (method === "DELETE" && path.startsWith("/memories/")) {
      const id = decodeURIComponent(path.slice("/memories/".length));
      if (!id) {
        json(res, 400, { error: "memory id is required" });
        return;
      }
      const deleted = await mnemo.delete(id);
      json(res, 200, { deleted });
      return;
    }

    // GET /stats
    if (method === "GET" && path === "/stats") {
      const stats = await mnemo.stats();
      json(res, 200, stats);
      return;
    }

    // GET /health
    if (method === "GET" && path === "/health") {
      json(res, 200, { status: "ok", version: "0.1.0" });
      return;
    }

    // 404
    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(`[mnemo-server] Error:`, err.message);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[mnemo-server] Listening on http://localhost:${PORT}`);
  console.log(`[mnemo-server] Endpoints:`);
  console.log(`  POST   /store     { text, category?, importance?, scope? }`);
  console.log(`  POST   /recall    { query, limit?, scopeFilter?, category? }`);
  console.log(`  DELETE /memories/:id`);
  console.log(`  GET    /stats`);
  console.log(`  GET    /health`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[mnemo-server] Shutting down...");
  await mnemo.close();
  server.close();
  process.exit(0);
});
