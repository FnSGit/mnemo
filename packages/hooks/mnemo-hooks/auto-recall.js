/**
 * Mnemo Auto-Recall Hook
 *
 * Fires on `SessionStart` event when a new session begins.
 * Queries memory for relevant context and injects it into the session.
 *
 * Features:
 * - Query-aware memory retrieval
 * - Project-specific memory filtering
 * - Injects memories as context block
 * - Direct Mnemo library integration
 */

import { createMnemo } from "@mnemoai/core";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// ─── Config ────────────────────────────────────────────────────────────────

const MNEMO_AUTO_RECALL = process.env.MNEMO_AUTO_RECALL !== "false";
const MNEMO_RECALL_LIMIT = parseInt(process.env.MNEMO_RECALL_LIMIT || "5", 10);
const MNEMO_MIN_SCORE = parseFloat(process.env.MNEMO_MIN_SCORE || "0.3");

const log = (msg, data) => {
  const ts = new Date().toISOString();
  console.error(`[mnemo-auto-recall] ${ts} ${msg}`, data ?? "");
};

// ─── Mnemo Direct Integration ─────────────────────────────────────────────

let mnemoInstance = null;

async function getMnemo() {
  if (!mnemoInstance) {
    const dbPath = path.join(os.homedir(), ".mnemo", "memory-db");
    const ollamaBase = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    mnemoInstance = await createMnemo({
      preset: "ollama",
      dbPath,
      embedding: {
        provider: "openai-compatible",
        apiKey: "ollama",
        baseURL: `${ollamaBase}/v1`,
        model: "dengcao/bge-m3:567m",
        dimensions: 1024,
      },
    });
  }
  return mnemoInstance;
}

async function searchMemories(query, limit) {
  try {
    const mnemo = await getMnemo();
    const results = await mnemo.recall(query, { limit: limit || 5 });
    // Normalize results to expected format
    return results.map((r) => ({
      id: r.id,
      category: r.category || "other",
      scope: r.scope || "global",
      text: r.text,
      score: r.score || 0.5,
    }));
  } catch (err) {
    log(`Memory search failed: ${err}`);
    return [];
  }
}

// ─── Project Context Detection ─────────────────────────────────────────────

async function detectProjectContext(cwd) {
  const context = {
    name: path.basename(cwd),
    language: "unknown",
    framework: "unknown",
    keywords: [],
  };

  try {
    // Check package.json for Node/JS projects
    const pkgPath = path.join(cwd, "package.json");
    try {
      const pkgRaw = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw);
      context.language = "javascript";

      // Detect framework
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) context.framework = "react";
      else if (deps.vue) context.framework = "vue";
      else if (deps.next) context.framework = "next";
      else if (deps.express) context.framework = "express";
      else if (deps.typescript) context.language = "typescript";

      context.keywords = [pkg.name, context.framework];
    } catch {
      // Not a Node project
    }

    // Check for Python
    try {
      await fs.access(path.join(cwd, "pyproject.toml"));
      context.language = "python";
    } catch {}

    // Check for Go
    try {
      await fs.access(path.join(cwd, "go.mod"));
      context.language = "go";
    } catch {}

  } catch (err) {
    log(`Project detection error: ${err}`);
  }

  return context;
}

// ─── Memory Context Injection ──────────────────────────────────────────────

function formatMemoryContext(memories) {
  if (memories.length === 0) return "";

  const lines = [
    "<relevant-memories>",
    "The following memories from previous conversations may be relevant:",
    "",
  ];

  // Group by category
  const grouped = new Map();
  for (const mem of memories) {
    const cat = mem.category || "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(mem);
  }

  for (const [category, items] of grouped) {
    lines.push(`### ${category.toUpperCase()}`);
    for (const mem of items) {
      lines.push(`- ${mem.text}`);
    }
    lines.push("");
  }

  lines.push("</relevant-memories>");
  lines.push("");

  return lines.join("\n");
}

// ─── Main Handler ──────────────────────────────────────────────────────────

async function main() {
  if (!MNEMO_AUTO_RECALL) {
    log("Auto-recall disabled by environment");
    process.exit(0);
  }

  // Read hook input
  let input = {};
  try {
    const stdin = await new Promise((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
    });
    if (stdin.trim()) {
      input = JSON.parse(stdin);
    }
  } catch (err) {
    log(`Failed to parse stdin: ${err}`);
  }

  const cwd = input.cwd || process.cwd();
  log(`Session start in: ${cwd}`);

  // Detect project context
  const projectContext = await detectProjectContext(cwd);
  log(`Detected: ${projectContext.language}/${projectContext.framework}`);

  // Build query based on project context
  const queries = [];

  // Query 1: Project-specific preferences
  if (projectContext.name) {
    queries.push(`preferences about ${projectContext.name} project`);
  }

  // Query 2: Language/framework preferences
  if (projectContext.language !== "unknown") {
    queries.push(`${projectContext.language} preferences and conventions`);
  }
  if (projectContext.framework !== "unknown") {
    queries.push(`${projectContext.framework} configuration and setup`);
  }

  // Query 3: General coding preferences
  queries.push("coding style and preferences");

  // Search and collect memories
  const allMemories = [];
  const seenIds = new Set();

  for (const query of queries) {
    const results = await searchMemories(query, MNEMO_RECALL_LIMIT);
    for (const mem of results) {
      if (!seenIds.has(mem.id) && mem.score >= MNEMO_MIN_SCORE) {
        seenIds.add(mem.id);
        allMemories.push(mem);
      }
    }
  }

  log(`Found ${allMemories.length} relevant memories`);

  // Format and output context
  if (allMemories.length > 0) {
    const context = formatMemoryContext(allMemories.slice(0, MNEMO_RECALL_LIMIT));

    // Output the context block
    // This will be prepended to the session
    console.log(context);
  }

  process.exit(0);
}

main().catch((err) => {
  log(`Fatal error: ${err}`);
  process.exit(1);
});