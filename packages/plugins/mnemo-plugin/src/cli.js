#!/usr/bin/env node
/**
 * Mnemo MCP Server - Standalone Entry Point
 *
 * This is the npx entry point for the Mnemo MCP server.
 * It handles dependency checking, reranker service management, and graceful error messages.
 *
 * Usage:
 *   npx @mnemoai/claude-plugin
 *   npx @mnemoai/claude-plugin --version
 *   npx @mnemoai/claude-plugin --help
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync } from "node:fs";
import { homedir } from "node:os";
import { spawn, execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse CLI args
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Mnemo MCP Server - AI Memory for Claude Code

Usage:
  npx @mnemoai/claude-plugin        Start MCP server (stdio mode)
  npx @mnemoai/claude-plugin --version
  npx @mnemoai/claude-plugin --help

Environment Variables:
  MNEMO_DB_PATH              Database storage path (default: ~/.mnemo/lancedb)
  OPENAI_API_KEY             OpenAI API key for embeddings
  OLLAMA_BASE_URL            Ollama endpoint (default: http://localhost:11434)
  OLLAMA_MODEL               Ollama model for extraction (default: qwen3.5:9b)

Documentation:
  https://docs.m-nemo.ai
`);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  // Read version from package.json
  try {
    const pkgPath = resolve(__dirname, "../package.json");
    const pkg = await import(pkgPath, { assert: { type: "json" } });
    console.log(`@mnemoai/claude-plugin v${pkg.default.version}`);
  } catch {
    console.log("@mnemoai/claude-plugin v0.3.0");
  }
  process.exit(0);
}

// Check for required dependencies
async function checkDependencies() {
  const missing = [];

  // Check LanceDB
  try {
    await import("@lancedb/lancedb");
  } catch {
    missing.push("@lancedb/lancedb");
  }

  // Check apache-arrow (LanceDB dependency)
  try {
    await import("apache-arrow");
  } catch {
    missing.push("apache-arrow");
  }

  if (missing.length > 0) {
    console.error(`
┌─────────────────────────────────────────────────────────────┐
│  Missing Dependencies                                        │
├─────────────────────────────────────────────────────────────┤
│  The following packages are required but not installed:     │
│                                                             │
│    ${missing.join("\n    ")}
│                                                             │
│  Install with:                                              │
│    npm install ${missing.join(" ")}
│                                                             │
│  Or let npx auto-install them.                              │
└─────────────────────────────────────────────────────────────┘
`);
    process.exit(1);
  }
}

// ============================================================================
// Configuration Loading
// ============================================================================

const DEFAULT_RERANKER_PATH = "~/.local/share/sentence-reranker";
const DEFAULT_RERANKER_PORT = 18797;

function expandPath(path) {
  if (path.startsWith("~/")) {
    return resolve(homedir(), path.slice(2));
  }
  return path;
}

function loadMcpConfig() {
  const mnemoPath = join(homedir(), ".mnemo", "mnemo.json");
  const openclawPath = join(homedir(), ".openclaw", "openclaw.json");

  const configPath = existsSync(mnemoPath) ? mnemoPath : openclawPath;

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const raw = readFileSync(configPath, "utf8");
    const json = JSON.parse(raw);
    return json?.plugins?.entries?.["mnemo-memory"]?.config || null;
  } catch (err) {
    console.error(`[mnemo] Failed to load config: ${err.message}`);
    return null;
  }
}

// ============================================================================
// Reranker Service Management
// ============================================================================

/**
 * Check if reranker service is healthy
 */
async function checkRerankerHealth(port = DEFAULT_RERANKER_PORT, timeout = 2000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Check if reranker is installed
 */
function checkRerankerInstalled(rerankerPath) {
  const expandedPath = expandPath(rerankerPath);
  const rerankerPy = join(expandedPath, "reranker.py");
  const rerankerSh = join(expandedPath, "reranker.sh");

  return existsSync(rerankerPy) && existsSync(rerankerSh);
}

/**
 * Install reranker service from packaged files
 */
async function installReranker(rerankerPath) {
  const expandedPath = expandPath(rerankerPath);

  console.log(`[mnemo] Installing local reranker to: ${expandedPath}`);

  // Create directory
  if (!existsSync(expandedPath)) {
    mkdirSync(expandedPath, { recursive: true });
  }

  // Find packaged reranker files
  // In development: src/../reranker/
  // In production: bundled at same level as cli.js
  const possibleSources = [
    resolve(__dirname, "..", "reranker"),  // Production bundle
    resolve(__dirname, "..", "..", "reranker"),  // Development
  ];

  let sourceDir = null;
  for (const dir of possibleSources) {
    if (existsSync(join(dir, "reranker.py")) && existsSync(join(dir, "reranker.sh"))) {
      sourceDir = dir;
      break;
    }
  }

  if (sourceDir) {
    // Copy packaged files
    console.log("[mnemo] Copying packaged reranker files...");

    // Copy pyproject.toml
    copyFileSync(
      join(sourceDir, "pyproject.toml"),
      join(expandedPath, "pyproject.toml")
    );

    // Copy reranker.py
    copyFileSync(
      join(sourceDir, "reranker.py"),
      join(expandedPath, "reranker.py")
    );

    // Copy reranker.sh
    copyFileSync(
      join(sourceDir, "reranker.sh"),
      join(expandedPath, "reranker.sh")
    );

    console.log("[mnemo] ✓ Files copied");
  } else {
    // Fallback: generate files inline
    console.log("[mnemo] Generating reranker files (packaged files not found)...");

    // Create pyproject.toml
    const pyproject = `[project]
name = "sentence-reranker"
version = "1.0.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.22.0",
    "sentence-transformers>=2.2.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
`;
    writeFileSync(join(expandedPath, "pyproject.toml"), pyproject);

    // Create minimal reranker.py
    const rerankerPy = `#!/usr/bin/env python3
"""Sentence-Transformers Cross-Encoder Reranker Service"""
import logging, os
from typing import List, Optional
from functools import lru_cache
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import CrossEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
app = FastAPI(title="Sentence-Transformers Reranker API")

class RerankRequest(BaseModel):
    model: str
    query: str
    documents: List[str]
    top_n: Optional[int] = 3

class RerankResult(BaseModel):
    index: int
    relevance_score: float
    document: Optional[str] = None

class RerankResponse(BaseModel):
    results: List[RerankResult]

SUPPORTED_MODELS = {
    "BAAI/bge-reranker-v2-m3": {"max_length": 512, "description": "Multilingual, best accuracy"},
    "BAAI/bge-reranker-base": {"max_length": 512, "description": "English only, faster"},
    "jinaai/jina-reranker-v2-base-multilingual": {"max_length": 1024, "description": "Multilingual"},
}

@lru_cache(maxsize=4)
def get_model(model_name: str) -> CrossEncoder:
    logger.info(f"Loading model: {model_name}")
    return CrossEncoder(model_name, max_length=SUPPORTED_MODELS.get(model_name, {}).get("max_length", 512))

@app.on_event("startup")
async def startup():
    try: get_model("BAAI/bge-reranker-v2-m3")
    except Exception as e: logger.warning(f"Could not pre-load default model: {e}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "sentence-transformers-reranker", "supported_models": list(SUPPORTED_MODELS.keys())}

@app.post("/v1/rerank", response_model=RerankResponse)
async def rerank(request: RerankRequest):
    if not request.documents: raise HTTPException(400, "No documents provided")
    model = get_model(request.model)
    pairs = [(request.query, doc) for doc in request.documents]
    scores = model.predict(pairs)
    results = [RerankResult(index=i, relevance_score=float(s), document=request.documents[i]) for i, s in enumerate(scores)]
    results.sort(key=lambda x: x.relevance_score, reverse=True)
    return RerankResponse(results=results[:request.top_n])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("RERANKER_PORT", 18797)))
`;
    writeFileSync(join(expandedPath, "reranker.py"), rerankerPy);

    // Create minimal reranker.sh
    const rerankerSh = `#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PORT=\${RERANKER_PORT:-18797}
export HF_ENDPOINT="\${HF_ENDPOINT:-https://hf-mirror.com}"

if [ -f /tmp/sentence-reranker.pid ] && kill -0 $(cat /tmp/sentence-reranker.pid) 2>/dev/null; then
    echo "Service running"; exit 0
fi

cd "$SCRIPT_DIR"
nohup uv run python reranker.py > /tmp/sentence-reranker.log 2>&1 &
echo $! > /tmp/sentence-reranker.pid
sleep 3
curl -s "http://localhost:$PORT/health" && echo "Started on port $PORT"
`;
    writeFileSync(join(expandedPath, "reranker.sh"), rerankerSh);
  }

  // Make reranker.sh executable
  try {
    execSync(`chmod +x "${join(expandedPath, "reranker.sh")}"`);
  } catch {
    // Ignore chmod errors on some filesystems
  }

  // Install dependencies
  console.log("[mnemo] Installing Python dependencies...");

  // Check if uv is available
  let hasUv = false;
  try {
    execSync("which uv", { stdio: "ignore" });
    hasUv = true;
  } catch {
    // uv not installed, will use pip
  }

  try {
    if (hasUv) {
      console.log("[mnemo] Using uv to install dependencies...");
      execSync("uv sync", { cwd: expandedPath, stdio: "inherit" });
    } else {
      console.log("[mnemo] Using pip to install dependencies...");
      const venvPath = join(expandedPath, ".venv");
      if (!existsSync(venvPath)) {
        execSync(`python3 -m venv "${venvPath}"`, { cwd: expandedPath, stdio: "inherit" });
      }
      execSync(`"${join(venvPath, "bin", "pip")}" install fastapi uvicorn sentence-transformers`, {
        cwd: expandedPath,
        stdio: "inherit"
      });
    }
    console.log("[mnemo] ✓ Dependencies installed");
    return true;
  } catch (err) {
    console.error(`[mnemo] Failed to install dependencies: ${err.message}`);
    console.log("[mnemo] You may need to run manually: cd " + expandedPath + " && uv sync");
    return false;
  }
}

/**
 * Start reranker service
 */
async function startRerankerService(rerankerPath, port = DEFAULT_RERANKER_PORT) {
  const expandedPath = expandPath(rerankerPath);
  const rerankerSh = join(expandedPath, "reranker.sh");

  if (!existsSync(rerankerSh)) {
    console.log(`[mnemo] Reranker script not found: ${rerankerSh}`);
    return false;
  }

  return new Promise((resolve) => {
    console.log(`[mnemo] Starting reranker service...`);

    const child = spawn("bash", [rerankerSh, "start"], {
      cwd: expandedPath,
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        RERANKER_PORT: String(port),
      },
    });

    child.unref();

    setTimeout(async () => {
      const healthy = await checkRerankerHealth(port);
      if (healthy) {
        console.log(`[mnemo] ✓ Reranker service running on port ${port}`);
      } else {
        console.log(`[mnemo] ⚠ Reranker service still starting...`);
      }
      resolve(healthy);
    }, 5000);
  });
}

/**
 * Manage local reranker service based on config
 */
async function manageLocalReranker() {
  const config = loadMcpConfig();

  // Check if local reranker is enabled in config
  const localReranker = config?.localReranker;
  if (!localReranker?.enabled) {
    // Not enabled, skip
    return;
  }

  const rerankerPath = localReranker.path || DEFAULT_RERANKER_PATH;
  const port = localReranker.port || DEFAULT_RERANKER_PORT;

  console.log("[mnemo] Local reranker enabled in config");

  // Check if already running
  if (await checkRerankerHealth(port)) {
    console.log("[mnemo] ✓ Reranker service already running");
    return;
  }

  // Check if installed
  if (!checkRerankerInstalled(rerankerPath)) {
    console.log("[mnemo] Reranker not installed, installing...");
    const installed = await installReranker(rerankerPath);
    if (!installed) {
      console.log("[mnemo] ⚠ Failed to install reranker, will use fallback");
      return;
    }
  }

  // Start the service
  await startRerankerService(rerankerPath, port);
}

// Main entry
async function main() {
  await checkDependencies();

  // Manage local reranker if enabled in config
  await manageLocalReranker();

  // Load the bundled MCP server
  const serverPath = resolve(__dirname, "server.js");

  if (!existsSync(serverPath)) {
    console.error("Error: MCP server bundle not found.");
    console.error("Please run: npm run build");
    process.exit(1);
  }

  // Import and start the server
  await import(serverPath);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});