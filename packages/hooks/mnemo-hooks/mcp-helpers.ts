// SPDX-License-Identifier: MIT
/**
 * Mnemo MCP Integration Helpers
 *
 * Direct invocation of Mnemo MCP tools from hooks.
 * Uses child process to call the MCP server directly.
 */

import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import os from "node:os";

// MCP server path
const MCP_SERVER_PATH = process.env.MNEMO_MCP_SERVER_PATH ||
  path.join(os.homedir(), "develop/projects/TypeJavaScript-projects/mnemo/packages/core/src/mcp-server.ts");

// MCP server process cache
let mcpProcess: ChildProcess | null = null;
let requestId = 0;

interface MCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Call an MCP tool directly via stdio JSON-RPC
 */
export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // For now, we use a simpler approach: direct script invocation
    // This avoids the complexity of managing a persistent MCP process

    const proc = spawn("node", [
      "--import", "jiti/register",
      MCP_SERVER_PATH
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Send JSON-RPC request
    const request = {
      jsonrpc: "2.0",
      id: ++requestId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    proc.stdin.write(JSON.stringify(request) + "\n");
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse JSON-RPC response from stdout
        const lines = stdout.trim().split("\n");
        for (const line of lines) {
          try {
            const resp = JSON.parse(line) as MCPResponse;
            if (resp.result) {
              resolve(resp.result);
              return;
            }
            if (resp.error) {
              reject(new Error(resp.error.message));
              return;
            }
          } catch {
            // Not JSON, skip
          }
        }
        resolve(stdout);
      } catch (err) {
        reject(err);
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Store a memory directly
 */
export async function storeMemory(params: {
  text: string;
  category?: "preference" | "fact" | "decision" | "entity" | "other";
  importance?: number;
  scope?: string;
}): Promise<void> {
  await callMCPTool("memory_store", {
    text: params.text,
    category: params.category || "other",
    importance: params.importance || 0.7,
    scope: params.scope,
  });
}

/**
 * Search memories directly
 */
export async function searchMemories(params: {
  query: string;
  limit?: number;
  scope?: string;
  category?: string;
}): Promise<Array<{
  id: string;
  text: string;
  score: number;
  category: string;
}>> {
  const result = await callMCPTool("memory_search", {
    query: params.query,
    limit: params.limit || 5,
    scope: params.scope,
    category: params.category,
  }) as { content: Array<{ type: string; text: string }> };

  // Parse the text response
  const text = result.content?.[0]?.text || "";
  const memories: Array<{ id: string; text: string; score: number; category: string }> = [];

  // Parse format: "1. [id] [category:scope] text (score%)"
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+\[([^\]]+)\]\s+\[([^\]:]+)[^\]]*\]\s+(.+?)\s+\((\d+)%\)/);
    if (match) {
      memories.push({
        id: match[1],
        category: match[2],
        text: match[3],
        score: parseInt(match[4]) / 100,
      });
    }
  }

  return memories;
}

/**
 * Check if MCP server is available
 */
export async function checkMCPServer(): Promise<boolean> {
  try {
    await callMCPTool("memory_stats", {});
    return true;
  } catch {
    return false;
  }
}