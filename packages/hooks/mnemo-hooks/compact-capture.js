/**
 * Mnemo Compact-Capture Hook
 *
 * Fires on `PreCompact` event before context compaction.
 * Performs deep extraction of memorable information before conversation is compressed.
 *
 * Features:
 * - Scans up to 200 recent messages
 * - Captures all operation details, numbers, versions
 * - Last chance to preserve conversation before compression
 * - LLM-powered comprehensive extraction via Ollama
 * - Direct Mnemo library integration
 */

import { createMnemo } from "@mnemoai/core";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// ─── Config ────────────────────────────────────────────────────────────────

const MNEMO_COMPACT_CAPTURE = process.env.MNEMO_COMPACT_CAPTURE !== "false";
const MNEMO_COMPACT_MIN_IMPORTANCE = parseFloat(process.env.MNEMO_COMPACT_MIN_IMPORTANCE || "0.5");
const MNEMO_COMPACT_MAX_MEMORIES = parseInt(process.env.MNEMO_COMPACT_MAX_MEMORIES || "10", 10);

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";

const log = (msg, data) => {
  const ts = new Date().toISOString();
  console.error(`[mnemo-compact-capture] ${ts} ${msg}`, data ?? "");
};

// ─── Noise Filter ──────────────────────────────────────────────────────────

const DENIAL_PATTERNS = [
  /i don'?t have (any )?(information|data|memory|record)/i,
  /i'?m not sure about/i,
  /i don'?t recall/i,
  /no (relevant )?memories found/i,
];

const META_QUESTION_PATTERNS = [
  /\bdo you (remember|recall|know about)\b/i,
  /你还?记得/,
  /记不记得/,
];

const BOILERPLATE_PATTERNS = [
  /^(hi|hello|hey|good morning|good evening|greetings)/i,
  /^fresh session/i,
  /^HEARTBEAT/i,
];

function isNoise(text) {
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;
  if (DENIAL_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (META_QUESTION_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (BOILERPLATE_PATTERNS.some((p) => p.test(trimmed))) return true;
  return false;
}

// ─── LLM Deep Extraction via Ollama ────────────────────────────────────────

async function extractMemoriesDeep(transcriptText) {
  const prompt = `This is a FULL conversation before context compaction. Do a DEEP scan and extract ALL important facts, decisions, numbers, versions, counts, file paths, and operation results. Be comprehensive — this is your last chance to capture this conversation before it's compressed.

CONVERSATION:
${transcriptText.slice(0, 12000)}

Extract:
- decision: explicit decisions made (investments, configs, strategies, architecture)
- fact: verified data, numbers, procedures, API endpoints, version numbers, counts, file paths, bug fix details
- preference: user preferences or dislikes
- entity: important people, companies, projects with key attributes

IMPORTANT: Always capture specific numbers, version strings, counts, and file paths with importance ≥ 0.65.

Return JSON array: [{"text": "...", "category": "decision|fact|preference|entity", "importance": 0.0-1.0, "reason": "..."}]

IMPORTANT: Output ONLY the JSON array, no other text. If nothing worth storing, return empty array [].`;

  try {
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 8192, // Larger budget for deep extraction
        },
      }),
    });

    if (!resp.ok) {
      throw new Error(`Ollama API error ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.message?.content ?? "";

    // Try multiple extraction patterns for JSON
    let parsed = null;

    // Pattern 1: Direct JSON array
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        parsed = JSON.parse(arrayMatch[0]);
      } catch {}
    }

    // Pattern 2: JSON in code block
    if (!parsed) {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          const cleaned = codeBlockMatch[1].trim();
          const jsonArrayMatch = cleaned.match(/\[[\s\S]*?\]/);
          if (jsonArrayMatch) {
            parsed = JSON.parse(jsonArrayMatch[0]);
          }
        } catch {}
      }
    }

    if (parsed && Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch (err) {
    log(`LLM extraction failed: ${err}`);
    return [];
  }
}

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

async function storeMemory(text, category, importance) {
  try {
    const mnemo = await getMnemo();
    await mnemo.store({
      text,
      category: category || "other",
      importance: importance || 0.7,
    });
    return true;
  } catch (err) {
    log(`Failed to store memory: ${err}`);
    return false;
  }
}

// ─── Transcript Reading ─────────────────────────────────────────────────────

async function readTranscript(transcriptPath) {
  try {
    const raw = await fs.readFile(transcriptPath, "utf-8");
    // Parse transcript format (JSONL or JSON array)
    const lines = raw.trim().split("\n");
    const messages = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.message?.content) {
          const content = entry.message.content;
          if (typeof content === "string") {
            messages.push(content);
          } else if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "text" && block.text) {
                messages.push(block.text);
              }
            }
          }
        }
      } catch {
        // Not JSON, treat as plain text
        messages.push(line);
      }
    }

    return messages.join("\n\n");
  } catch (err) {
    log(`Failed to read transcript: ${err}`);
    return "";
  }
}

// ─── Main Handler ──────────────────────────────────────────────────────────

async function main() {
  if (!MNEMO_COMPACT_CAPTURE) {
    log("Compact-capture disabled by environment");
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

  const transcriptPath = input.transcript_path;
  if (!transcriptPath) {
    log("No transcript path provided, skipping");
    process.exit(0);
  }

  log(`Reading transcript: ${transcriptPath}`);

  // Read transcript
  const transcriptText = await readTranscript(transcriptPath);
  if (transcriptText.length < 100) {
    log("Transcript too short, skipping");
    process.exit(0);
  }

  log(`Transcript length: ${transcriptText.length} chars`);

  // Deep extraction
  const candidates = await extractMemoriesDeep(transcriptText);
  log(`Extracted ${candidates.length} candidates`);

  if (candidates.length === 0) {
    process.exit(0);
  }

  // Store memories
  let stored = 0;
  for (const mem of candidates.slice(0, MNEMO_COMPACT_MAX_MEMORIES)) {
    if (mem.importance < MNEMO_COMPACT_MIN_IMPORTANCE) {
      continue;
    }

    const success = await storeMemory(mem.text, mem.category, mem.importance);

    if (success) {
      stored++;
      log(`Stored [${mem.category}]: ${mem.text.slice(0, 60)}`);
    }
  }

  log(`Done: stored ${stored} memories from compact`);
  process.exit(0);
}

main().catch((err) => {
  log(`Fatal error: ${err}`);
  process.exit(1);
});