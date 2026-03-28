#!/usr/bin/env node
/**
 * Mnemo Plugin Setup Script
 *
 * Checks prerequisites and provides installation guidance.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(color, msg) {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0], 10);
  if (major >= 18) {
    log("green", `✓ Node.js ${version} (>= 18 required)`);
    return true;
  } else {
    log("red", `✗ Node.js ${version} (>= 18 required)`);
    return false;
  }
}

async function checkOllama() {
  try {
    const { stdout } = await execAsync("ollama list");
    log("green", "✓ Ollama is installed");

    // Check for required models
    const models = stdout.toLowerCase();
    const hasEmbedding = models.includes("bge-m3") || models.includes("bge");
    const hasLLM = models.includes("qwen") || models.includes("llama");

    if (hasEmbedding) {
      log("green", "  ✓ Embedding model available (bge-m3 or similar)");
    } else {
      log("yellow", "  ! No embedding model found. Run: ollama pull dengcao/bge-m3:567m");
    }

    if (hasLLM) {
      log("green", "  ✓ LLM model available (qwen or llama)");
    } else {
      log("yellow", "  ! No LLM model found. Run: ollama pull qwen3.5:9b");
    }

    return true;
  } catch {
    log("red", "✗ Ollama is not installed or not running");
    log("blue", "  Install: https://ollama.ai");
    return false;
  }
}

async function checkMnemoCore() {
  // Check if @mnemoai/core is built
  const corePath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..", "..", "..", "core"
  );

  try {
    const distPath = path.join(corePath, "dist");
    await fs.access(distPath);
    log("green", "✓ @mnemoai/core is built");
    return true;
  } catch {
    log("yellow", "! @mnemoai/core not built");
    log("blue", "  Run: npm run build --workspace=@mnemoai/core");
    return false;
  }
}

async function checkDatabase() {
  const dbPath = path.join(os.homedir(), ".mnemo", "memory-db");
  try {
    await fs.access(dbPath);
    log("green", "✓ Memory database exists");
    return true;
  } catch {
    log("yellow", "! Memory database not initialized");
    log("blue", "  Will be created automatically on first use");
    return true; // Not a fatal error
  }
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("blue", "  Mnemo Plugin Setup Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const results = await Promise.all([
    checkNodeVersion(),
    checkOllama(),
    checkMnemoCore(),
    checkDatabase(),
  ]);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (results.every(Boolean)) {
    log("green", "\n✓ All checks passed! Plugin is ready to use.\n");
  } else {
    log("yellow", "\n! Some checks failed. Follow the instructions above.\n");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(console.error);