#!/usr/bin/env node
/**
 * Install script for mnemo-plugin
 *
 * This script bundles the plugin with all necessary dependencies
 * for use in Claude Code.
 *
 * Usage: node scripts/install-bundle.mjs [output-dir]
 */

import { cpSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pluginRoot = dirname(__dirname);  // scripts/.. = plugin root
const pluginVersion = "0.3.0";
// Cache structure: cache/<marketplace>/<plugin>/<version>
const defaultOutput = resolve(homedir(), ".claude", "plugins", "cache", "mnemo-plugin", "mnemo-plugin", pluginVersion);

const outputDir = process.argv[2] || defaultOutput;

console.log("╔════════════════════════════════════════╗");
console.log("║  Mnemo Plugin Installer                ║");
console.log("╚════════════════════════════════════════╝\n");

console.log(`Source: ${pluginRoot}`);
console.log(`Target: ${outputDir}\n`);

// Clean output directory
if (existsSync(outputDir)) {
  console.log("[1/4] Cleaning existing installation...");
  rmSync(outputDir, { recursive: true });
}
mkdirSync(outputDir, { recursive: true });

// Copy plugin files
console.log("[2/4] Copying plugin files...");

// Copy .claude-plugin directory (contains plugin.json only)
const claudePluginSrc = resolve(pluginRoot, ".claude-plugin");
if (existsSync(claudePluginSrc)) {
  cpSync(claudePluginSrc, resolve(outputDir, ".claude-plugin"), { recursive: true });
  console.log(`      ✓ .claude-plugin/`);
} else {
  console.log(`      ⚠ .claude-plugin/ (not found)`);
}

// Copy component directories (default locations, auto-discovered)
const dirs = ["hooks", "mcp", "skills"];
for (const dir of dirs) {
  const src = resolve(pluginRoot, dir);
  if (existsSync(src)) {
    cpSync(src, resolve(outputDir, dir), { recursive: true });
    console.log(`      ✓ ${dir}/`);
  } else {
    console.log(`      ⚠ ${dir}/ (not found)`);
  }
}

const files = [".mcp.json", "package.json", "README.md"];
for (const file of files) {
  const src = resolve(pluginRoot, file);
  if (existsSync(src)) {
    cpSync(src, resolve(outputDir, file));
    console.log(`      ✓ ${file}`);
  }
}

// Copy LanceDB and dependencies
console.log("\n[3/4] Copying dependencies...");

// Find monorepo root (where node_modules is)
let monorepoRoot = resolve(pluginRoot, "..", "..");
while (!existsSync(resolve(monorepoRoot, "node_modules", "@lancedb"))) {
  const parent = resolve(monorepoRoot, "..");
  if (parent === monorepoRoot) break;
  monorepoRoot = parent;
}

const nodeModulesSrc = resolve(monorepoRoot, "node_modules");
const nodeModulesDest = resolve(outputDir, "node_modules");
mkdirSync(nodeModulesDest, { recursive: true });

// Required dependencies for LanceDB
const dependencies = [
  "@lancedb",
  "apache-arrow",
  "tslib",
  "flatbuffers",
  "reflect-metadata",
];

for (const dep of dependencies) {
  const src = resolve(nodeModulesSrc, dep);
  if (existsSync(src)) {
    cpSync(src, resolve(nodeModulesDest, dep), { recursive: true });
    console.log(`      ✓ ${dep}/`);
  } else {
    console.log(`      ⚠ ${dep}/ (not found)`);
  }
}

// Update installed_plugins.json and settings.json
console.log("\n[4/4] Registering plugin...");

const home = homedir();
const installedPluginsPath = resolve(home, ".claude", "plugins", "installed_plugins.json");
const settingsPath = resolve(home, ".claude", "settings.json");

// Update installed_plugins.json
try {
  const installedPlugins = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
  installedPlugins.plugins["mnemo-plugin@mnemo-plugin"] = [
    {
      scope: "user",
      installPath: outputDir,
      version: pluginVersion,
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
  writeFileSync(installedPluginsPath, JSON.stringify(installedPlugins, null, 2));
  console.log(`      ✓ installed_plugins.json updated`);
} catch (err) {
  console.log(`      ⚠ Failed to update installed_plugins.json: ${err.message}`);
}

// Update settings.json
try {
  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  if (!settings.enabledPlugins) {
    settings.enabledPlugins = {};
  }
  // Remove any old mnemo-plugin entries
  for (const key of Object.keys(settings.enabledPlugins)) {
    if (key.startsWith("mnemo-plugin@")) {
      delete settings.enabledPlugins[key];
    }
  }
  settings.enabledPlugins["mnemo-plugin@mnemo-plugin"] = true;

  // Register marketplace
  if (!settings.extraKnownMarketplaces) {
    settings.extraKnownMarketplaces = {};
  }
  settings.extraKnownMarketplaces["mnemo-plugin"] = {
    source: {
      source: "file",
      path: resolve(homedir(), ".claude", "plugins", "cache", "mnemo-plugin")
    }
  };

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`      ✓ settings.json updated`);
} catch (err) {
  console.log(`      ⚠ Failed to update settings.json: ${err.message}`);
}

// Summary
console.log("\n═══════════════════════════════════════════════════════");
console.log("✅ Installation complete!\n");
console.log("Plugin installed to:");
console.log(`  ${outputDir}\n`);
console.log("Run /reload-plugins in Claude Code to activate.\n");