#!/usr/bin/env node
/**
 * Build MCP Server as Standalone Bundle
 *
 * Bundles the MCP server with all dependencies into a single JS file.
 * This allows the plugin to work without node_modules in most cases.
 *
 * Note: Native modules (LanceDB, etc.) are kept external and must be
 * installed separately or available in the system.
 *
 * Usage: node scripts/build-mcp.mjs
 */

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const pluginRoot = resolve(__dirname, "..");
const coreRoot = resolve(__dirname, "../../../core");
const mcpDir = resolve(pluginRoot, "mcp");
const outputFile = resolve(mcpDir, "server.js");

// Clean output
if (existsSync(outputFile)) {
  rmSync(outputFile);
}
if (!existsSync(mcpDir)) {
  mkdirSync(mcpDir, { recursive: true });
}

console.log("Building MCP server bundle...");
console.log(`  Core: ${coreRoot}`);
console.log(`  Output: ${outputFile}`);

try {
  await build({
    entryPoints: [resolve(coreRoot, "src/mcp-server.ts")],
    bundle: true,
    outfile: outputFile,
    format: "esm",
    platform: "node",
    target: "node18",
    sourcemap: false,
    minify: false,
    // Native modules that cannot be bundled
    external: [
      // LanceDB - native bindings
      "@lancedb/lancedb",
      "@lancedb/vector",
      // Other storage backends with native deps
      "@qdrant/js-client-rest",
      "chromadb",
      "pg",
      "pg-native",
      "better-sqlite3",
      // Node built-ins (already available)
      "node:fs",
      "node:fs/promises",
      "node:path",
      "node:os",
      "node:util",
      "node:stream",
      "node:events",
      "node:crypto",
      "node:http",
      "node:https",
      "node:url",
      "node:buffer",
      "node:process",
      "node:child_process",
      "node:readline",
    ],
    // Define environment variables
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    // Tree shaking
    treeShaking: true,
    // Metafile for analysis
    metafile: false,
    // Log level
    logLevel: "info",
  });

  const size = statSync(outputFile).size;
  console.log("✅ MCP server bundled successfully!");
  console.log(`   Output: ${outputFile}`);
  console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);

} catch (error) {
  console.error("❌ Build failed:", error.message);
  if (error.errors) {
    error.errors.forEach(e => console.error(`   ${e.text}`));
  }
  process.exit(1);
}