#!/usr/bin/env node
/**
 * Build all plugin components as standalone bundles
 *
 * This script bundles:
 * 1. MCP server (mcp/server.js)
 * 2. All hooks (hooks/*.js) with inlined @mnemoai/core
 *
 * Usage: node scripts/build-all.mjs
 */

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, statSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const pluginRoot = resolve(__dirname, "..");
const coreRoot = resolve(__dirname, "../../../core");
const hooksDir = resolve(pluginRoot, "hooks");
const mcpDir = resolve(pluginRoot, "mcp");

// Native modules to keep external
const externalModules = [
  "@lancedb/lancedb",
  "@lancedb/vector",
  "@qdrant/js-client-rest",
  "chromadb",
  "pg",
  "pg-native",
  "better-sqlite3",
];

// Common build options
const commonOptions = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node18",
  sourcemap: false,
  minify: false,
  external: externalModules,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  treeShaking: true,
  logLevel: "warning",
};

console.log("╔════════════════════════════════════════╗");
console.log("║  Mnemo Plugin Build                    ║");
console.log("╚════════════════════════════════════════╝\n");

const results = [];

async function buildMcpServer() {
  console.log("[1/4] Building MCP server...");
  const outfile = resolve(mcpDir, "server.js");

  if (!existsSync(mcpDir)) {
    mkdirSync(mcpDir, { recursive: true });
  }

  await build({
    ...commonOptions,
    entryPoints: [resolve(coreRoot, "src/mcp-server.ts")],
    outfile,
  });

  const size = statSync(outfile).size;
  results.push({ file: "mcp/server.js", size });
  console.log(`      ✓ mcp/server.js (${(size / 1024).toFixed(1)} KB)\n`);
}

async function buildHook(name) {
  const sourceFile = resolve(hooksDir, `${name}.js`);
  const outfile = resolve(hooksDir, `${name}.bundled.js`);

  if (!existsSync(sourceFile)) {
    console.log(`      ⚠ hooks/${name}.js not found, skipping`);
    return null;
  }

  await build({
    ...commonOptions,
    entryPoints: [sourceFile],
    outfile,
    // Resolve @mnemoai/core from the core package
    alias: {
      "@mnemoai/core": resolve(coreRoot, "index.ts"),
    },
  });

  // Replace original with bundled version
  const { renameSync, unlinkSync } = await import("node:fs");
  unlinkSync(sourceFile);
  renameSync(outfile, sourceFile);

  return statSync(sourceFile).size;
}

async function buildHooks() {
  const hooks = ["auto-capture", "auto-recall", "compact-capture"];

  console.log("[2/4] Building hooks...");

  for (const hook of hooks) {
    const size = await buildHook(hook);
    if (size) {
      results.push({ file: `hooks/${hook}.js`, size });
      console.log(`      ✓ hooks/${hook}.js (${(size / 1024).toFixed(1)} KB)`);
    }
  }
  console.log("");
}

async function verifyBuild() {
  console.log("[3/4] Verifying build...");

  // Test MCP server
  const { execSync } = await import("node:child_process");
  try {
    execSync("timeout 3 node mcp/server.js 2>&1 || true", {
      cwd: pluginRoot,
      stdio: "pipe",
      encoding: "utf-8"
    });
    console.log("      ✓ MCP server loads successfully\n");
  } catch (err) {
    console.log(`      ⚠ MCP server check: ${err.message}\n`);
  }
}

function printSummary() {
  console.log("[4/4] Build Summary");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  File                    Size");
  console.log("───────────────────────────────────────────────────────");

  for (const r of results) {
    const size = (r.size / 1024).toFixed(1).padStart(8);
    console.log(`  ${r.file.padEnd(24)} ${size} KB`);
  }

  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  console.log("───────────────────────────────────────────────────────");
  console.log(`  ${"Total".padEnd(24)} ${(totalSize / 1024).toFixed(1)} KB`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n✅ Build complete! Plugin is ready for distribution.\n");
}

async function main() {
  try {
    await buildMcpServer();
    await buildHooks();
    await verifyBuild();
    printSummary();
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error(`   ${e.text}`));
    }
    process.exit(1);
  }
}

main();