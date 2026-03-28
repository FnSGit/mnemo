#!/usr/bin/env node
/**
 * Build Mnemo Plugin as Standalone npx Package
 *
 * This script creates a self-contained bundle that can be run via npx.
 * All JavaScript dependencies are bundled except native modules.
 *
 * Output:
 *   bin/mnemo-mcp.js  - CLI entry point with shebang
 *   bin/server.js     - Bundled MCP server
 *
 * Usage: node scripts/build-bundle.mjs
 */

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";
import { existsSync, mkdirSync, rmSync, statSync, chmodSync, copyFileSync, writeFileSync, cpSync } from "node:fs";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const pluginRoot = resolve(__dirname, "..");
const coreRoot = resolve(__dirname, "../../../core");
const binDir = resolve(pluginRoot, "bin");
const mcpDir = resolve(pluginRoot, "mcp");

// Native modules that cannot be bundled
const nativeModules = [
  "@lancedb/lancedb",
  "@lancedb/vector",
  "apache-arrow",
  // Other storage backends
  "@qdrant/js-client-rest",
  "chromadb",
  "pg",
  "pg-native",
  "better-sqlite3",
];

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║  Mnemo Plugin Build - npx Bundle                          ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

const results = [];

// ============================================================================
// Step 1: Clean and create output directory
// ============================================================================

function prepareOutput() {
  console.log("[1/5] Preparing output directory...");
  
  if (existsSync(binDir)) {
    rmSync(binDir, { recursive: true });
  }
  mkdirSync(binDir, { recursive: true });
  
  console.log("      ✓ Created bin/\n");
}

// ============================================================================
// Step 2: Build MCP server bundle
// ============================================================================

async function buildMcpServer() {
  console.log("[2/5] Building MCP server bundle...");
  
  const outfile = resolve(binDir, "server.js");
  const entryPoint = resolve(coreRoot, "src/mcp-server.ts");
  
  if (!existsSync(entryPoint)) {
    throw new Error(`MCP server source not found: ${entryPoint}`);
  }
  
  await build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    sourcemap: false,
    minify: false,
    external: nativeModules,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    treeShaking: true,
    logLevel: "warning",
    banner: {
      js: "// Bundled by esbuild - @mnemoai/claude-plugin",
    },
  });
  
  const size = statSync(outfile).size;
  results.push({ file: "bin/server.js", size });
  console.log(`      ✓ bin/server.js (${(size / 1024).toFixed(1)} KB)\n`);
}

// ============================================================================
// Step 3: Copy CLI entry point
// ============================================================================

function copyCliEntry() {
  console.log("[3/5] Setting up CLI entry point...");

  const srcFile = resolve(pluginRoot, "src/cli.js");
  const destFile = resolve(binDir, "mnemo-mcp.js");

  if (!existsSync(srcFile)) {
    throw new Error(`CLI source not found: ${srcFile}`);
  }

  // Copy CLI to bin/
  copyFileSync(srcFile, destFile);

  // Make executable
  chmodSync(destFile, 0o755);

  const size = statSync(destFile).size;
  results.push({ file: "bin/mnemo-mcp.js", size });
  console.log(`      ✓ bin/mnemo-mcp.js (${(size / 1024).toFixed(1)} KB, executable)\n`);
}

// ============================================================================
// Step 4: Copy non-code assets
// ============================================================================

function copyAssets() {
  console.log("[4/5] Copying plugin assets...");

  // .claude-plugin/plugin.json
  const pluginDir = resolve(binDir, "../.claude-plugin");
  if (existsSync(pluginDir)) {
    console.log("      ✓ .claude-plugin/ exists");
  }

  // hooks/
  const hooksDir = resolve(binDir, "../hooks");
  if (existsSync(hooksDir)) {
    console.log("      ✓ hooks/ exists");
  }

  // skills/
  const skillsDir = resolve(binDir, "../skills");
  if (existsSync(skillsDir)) {
    console.log("      ✓ skills/ exists");
  }

  // reranker/ - Python Reranker service files
  const rerankerSrc = resolve(pluginRoot, "reranker");
  const rerankerDest = resolve(binDir, "reranker");
  if (existsSync(rerankerSrc)) {
    if (existsSync(rerankerDest)) {
      rmSync(rerankerDest, { recursive: true });
    }
    mkdirSync(rerankerDest, { recursive: true });

    // Copy individual files
    const files = ["pyproject.toml", "reranker.py", "reranker.sh"];
    for (const file of files) {
      const src = resolve(rerankerSrc, file);
      const dest = resolve(rerankerDest, file);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        // Make .sh executable
        if (file.endsWith(".sh")) {
          chmodSync(dest, 0o755);
        }
      }
    }
    console.log("      ✓ bin/reranker/ (Python service files)");
  } else {
    console.log("      ⚠ reranker/ not found, will generate on install");
  }

  console.log("");
}

// ============================================================================
// Step 5: Verify and print summary
// ============================================================================

async function verifyBuild() {
  console.log("[5/5] Verifying build...");
  
  // Check that all files exist
  const requiredFiles = [
    resolve(binDir, "mnemo-mcp.js"),
    resolve(binDir, "server.js"),
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
  }
  
  // Test --version
  try {
    const version = execSync("node bin/mnemo-mcp.js --version", {
      cwd: pluginRoot,
      encoding: "utf-8",
    }).trim();
    console.log(`      ✓ CLI works: ${version}\n`);
  } catch (err) {
    console.log(`      ⚠ CLI test failed: ${err.message}\n`);
  }
}

function printSummary() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Build Summary");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  File                        Size");
  console.log("───────────────────────────────────────────────────────────");
  
  for (const r of results) {
    const size = (r.size / 1024).toFixed(1).padStart(8);
    console.log(`  ${r.file.padEnd(28)} ${size} KB`);
  }
  
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  console.log("───────────────────────────────────────────────────────────");
  console.log(`  ${"Total".padEnd(28)} ${(totalSize / 1024).toFixed(1)} KB`);
  console.log("═══════════════════════════════════════════════════════════");
  
  console.log(`
✅ Build complete!

📦 Usage:
   npx @mnemoai/claude-plugin           # Run MCP server
   npx @mnemoai/claude-plugin --version # Show version

📋 Claude Code config (.mcp.json):
   {
     "mcpServers": {
       "memory": {
         "command": "npx",
         "args": ["@mnemoai/claude-plugin"]
       }
     }
   }
`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  try {
    prepareOutput();
    await buildMcpServer();
    copyCliEntry();
    copyAssets();
    await verifyBuild();
    printSummary();
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error(`   ${e.text}`));
    }
    process.exit(1);
  }
}

main();