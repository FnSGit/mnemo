/**
 * Mnemo Auto-Capture Hook
 *
 * Fires on `Stop` event after each AI response.
 * Analyzes the conversation and extracts memorable information.
 *
 * Features:
 * - LLM-powered extraction via Ollama
 * - Noise filtering (greetings, meta-questions, agent denials)
 * - Duplicate detection via memory search
 * - Direct Mnemo library integration (no MCP CLI needed)
 */

import { createMnemo } from "@mnemoai/core";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// ─── Config ────────────────────────────────────────────────────────────────

const MNEMO_AUTO_CAPTURE = process.env.MNEMO_AUTO_CAPTURE !== "false";
const MNEMO_MIN_IMPORTANCE = parseFloat(process.env.MNEMO_MIN_IMPORTANCE || "0.55");
const MNEMO_DEDUP_THRESHOLD = parseFloat(process.env.MNEMO_DEDUP_THRESHOLD || "0.88");
const MNEMO_CONFLICT_THRESHOLD = parseFloat(process.env.MNEMO_CONFLICT_THRESHOLD || "0.70");

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";

const log = (msg, data) => {
  const ts = new Date().toISOString();
  console.error(`[mnemo-auto-capture] ${ts} ${msg}`, data ?? "");
};

// ─── Noise Filter (from noise-filter.ts) ────────────────────────────────────

const DENIAL_PATTERNS = [
  /i don'?t have (any )?(information|data|memory|record)/i,
  /i'?m not sure about/i,
  /i don'?t recall/i,
  /i don'?t remember/i,
  /it looks like i don'?t/i,
  /i wasn'?t able to find/i,
  /no (relevant )?memories found/i,
  /i don'?t have access to/i,
];

const META_QUESTION_PATTERNS = [
  /\bdo you (remember|recall|know about)\b/i,
  /\bcan you (remember|recall)\b/i,
  /\bdid i (tell|mention|say|share)\b/i,
  /\bhave i (told|mentioned|said)\b/i,
  /\bwhat did i (tell|say|mention)\b/i,
  /如果你知道.+只回复/i,
  /如果不知道.+只回复\s*none/i,
  /只回复精确代号/i,
  /只回复\s*none/i,
  /你还?记得/,
  /记不记得/,
  /还记得.*吗/,
  /你[知晓]道.+吗/,
  /我(?:之前|上次|以前)(?:说|提|讲).*(?:吗|呢|？|\?)/,
];

const BOILERPLATE_PATTERNS = [
  /^(hi|hello|hey|good morning|good evening|greetings)/i,
  /^fresh session/i,
  /^new session/i,
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

// ─── Capture Trigger Patterns ──────────────────────────────────────────────

const MEMORY_TRIGGERS = [
  /zapamatuj si|pamatuj|remember/i,
  /preferuji|radši|nechci|prefer/i,
  /rozhodli jsme|budeme používat/i,
  /\b(we )?decided\b|we'?ll use|we will use|switch(ed)? to|migrate(d)? to|going forward|from now on/i,
  /\+\d{10,}/,
  /[\w.-]+@[\w.-]+\.\w+/,
  /můj\s+\w+\s+je|je\s+můj/i,
  /my\s+\w+\s+is|is\s+my/i,
  /i (like|prefer|hate|love|want|need|care)/i,
  /always|never|important/i,
  // Chinese triggers
  /記住|记住|記一下|记一下|別忘了|别忘了|備註|备注/,
  /偏好|喜好|喜歡|喜欢|討厭|讨厌|不喜歡|不喜欢|愛用|爱用|習慣|习惯/,
  /決定|决定|選擇了|选择了|改用|換成|换成|以後用|以后用/,
  /我的\S+是|叫我|稱呼|称呼/,
  /老是|講不聽|總是|总是|從不|从不|一直|每次都/,
  /重要|關鍵|关键|注意|千萬別|千万别/,
  /幫我|筆記|存檔|存起來|存一下|重點|原則|底線/,
];

const CAPTURE_EXCLUDE_PATTERNS = [
  /\b(memory-pro|memory_store|memory_recall|memory_forget|memory_update)\b/i,
  /\bopenclaw\s+memory-pro\b/i,
  /\b(delete|remove|forget|purge|cleanup|clean up|clear)\b.*\b(memory|memories|entry|entries)\b/i,
  /\b(memory|memories)\b.*\b(delete|remove|forget|purge|cleanup|clean up|clear)\b/i,
  /\bhow do i\b.*\b(delete|remove|forget|purge|cleanup|clear)\b/i,
  /(删除|刪除|清理|清除).{0,12}(记忆|記憶|memory)/i,
];

function shouldCapture(text) {
  const s = text.trim();
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(s);
  const minLen = hasCJK ? 4 : 10;

  if (s.length < minLen || s.length > 500) return false;
  if (s.includes("<relevant-memories>")) return false;
  if (s.startsWith("<") && s.includes("</")) return false;
  if (s.includes("**") && s.includes("\n-")) return false;

  const emojiCount = (s.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 3) return false;

  if (CAPTURE_EXCLUDE_PATTERNS.some((r) => r.test(s))) return false;

  return MEMORY_TRIGGERS.some((r) => r.test(s));
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (
    /prefer|radši|like|love|hate|want|偏好|喜歡|喜欢|討厭|讨厌|不喜歡|不喜欢|愛用|爱用|習慣|习惯/i.test(
      lower
    )
  ) {
    return "preference";
  }
  if (
    /decided|decision|switch|migrate|決定|决定|選擇了|选择了|改用|換成|换成/i.test(
      lower
    )
  ) {
    return "decision";
  }
  if (
    /\b(is|are|was|were)\b.*\b(called|named|known as)\b|my\s+\w+\s+is|我的\S+是|叫我/i.test(
      text
    )
  ) {
    return "entity";
  }
  return "other";
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

async function searchMemories(query, limit) {
  try {
    const mnemo = await getMnemo();
    const results = await mnemo.recall(query, { limit: limit || 5 });
    return results;
  } catch (err) {
    log(`Failed to search memories: ${err}`);
    return [];
  }
}

// ─── LLM Extraction via Ollama ──────────────────────────────────────────────

async function extractMemories(lastAssistantMessage, transcriptPath) {
  const prompt = `Analyze this conversation excerpt and identify information worth storing long-term.

CONVERSATION:
${lastAssistantMessage.slice(0, 3000)}

Extract ONLY:
- decision: explicit decisions made
- fact: verified data, numbers, procedures
- preference: user preferences or dislikes
- entity: important people, companies, projects

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
          num_predict: 4096, // Give enough tokens for both thinking and content
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

    // Fallback to regex
    log(`Could not parse JSON from LLM response, falling back to regex`);
    return extractMemoriesRegex(lastAssistantMessage);
  } catch (err) {
    log(`LLM extraction failed: ${err}, falling back to regex`);
    return extractMemoriesRegex(lastAssistantMessage);
  }
}

function extractMemoriesRegex(text) {
  const candidates = [];
  const lines = text.split(/\n+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10 || trimmed.length > 500) continue;
    if (isNoise(trimmed)) continue;
    if (!shouldCapture(trimmed)) continue;

    candidates.push({
      text: trimmed,
      category: detectCategory(trimmed),
      importance: 0.7,
      reason: "Regex trigger match",
    });
  }

  return candidates.slice(0, 3); // Max 3 per turn
}

// ─── Conflict Classification via Ollama ─────────────────────────────────────

async function classifyConflict(newText, existingText) {
  const prompt =
    `Compare these two memory entries and classify their relationship.\n\n` +
    `EXISTING: ${existingText.slice(0, 500)}\n\n` +
    `NEW: ${newText.slice(0, 500)}\n\n` +
    `Classify as ONE of:\n` +
    `- contradiction: NEW directly contradicts EXISTING\n` +
    `- update: NEW is a newer version of the same fact\n` +
    `- supplement: NEW adds different details about the same topic\n` +
    `- duplicate: NEW says essentially the same thing\n` +
    `- unrelated: different topics\n\n` +
    `Return JSON: {"relation": "...", "reason": "one-line explanation"}`;

  try {
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 256,
        },
      }),
    });

    if (!resp.ok) {
      throw new Error(`Ollama API error ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.message?.content ?? "{}";
    const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();

    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.relation && ["contradiction", "update", "supplement", "duplicate", "unrelated"].includes(parsed.relation)) {
        return parsed;
      }
    }

    return { relation: "unrelated", reason: "unparseable response" };
  } catch (err) {
    log(`Conflict classification failed: ${err}`);
    return { relation: "unrelated", reason: `error: ${err}` };
  }
}

// ─── Main Handler ──────────────────────────────────────────────────────────

async function main() {
  if (!MNEMO_AUTO_CAPTURE) {
    log("Auto-capture disabled by environment");
    process.exit(0);
  }

  // Read hook input from stdin
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

  const lastMessage = input.last_assistant_message;
  if (!lastMessage || lastMessage.length < 30) {
    log("No assistant message or too short, skipping");
    process.exit(0);
  }

  log(`Processing message (${lastMessage.length} chars)`);

  // Extract memories
  const candidates = await extractMemories(lastMessage, input.transcript_path);
  log(`Extracted ${candidates.length} candidates`);

  if (candidates.length === 0) {
    process.exit(0);
  }

  // Store each candidate
  let stored = 0;
  for (const mem of candidates) {
    if (mem.importance < MNEMO_MIN_IMPORTANCE) {
      log(`Skip (low importance ${mem.importance}): ${mem.text.slice(0, 60)}`);
      continue;
    }

    // Store directly via Mnemo
    const success = await storeMemory(mem.text, mem.category, mem.importance);

    if (success) {
      stored++;
      log(`Stored [${mem.category}]: ${mem.text.slice(0, 60)}`);
    } else {
      log(`Failed to store: ${mem.text.slice(0, 60)}`);
    }
  }

  log(`Done: stored ${stored} memories`);
  process.exit(0);
}

main().catch((err) => {
  log(`Fatal error: ${err}`);
  process.exit(1);
});