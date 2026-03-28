// hooks/auto-capture.js
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { join as join2 } from "node:path";
import { homedir as homedir2 } from "node:os";
import { appendFile as appendFile2, readFile as readFile2, mkdir as mkdir2 } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { join as join3, dirname } from "node:path";
import { appendFile as appendFile3, readFile as readFile3, mkdir as mkdir3 } from "node:fs/promises";
import { homedir as homedir5 } from "node:os";
import { join as join5, dirname as dirname3 } from "node:path";
import { appendFile as appendFile5, mkdir as mkdir4, readFile as readFile4, writeFile } from "node:fs/promises";
import { join as join8 } from "node:path";
import { mkdir as mkdir5, readFile as readFile5, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir8 } from "node:os";
import { join as join9 } from "node:path";
import { dirname as dirname5, join as join10 } from "node:path";
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync3 } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { verify, createPublicKey, createHash } from "node:crypto";
import { hostname, arch, cpus, platform } from "node:os";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash as createHash2 } from "node:crypto";
import { readFileSync as readFileSync2, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { join as join4, dirname as dirname2 } from "node:path";
import { appendFile as appendFile4 } from "node:fs/promises";
import { homedir as homedir6 } from "node:os";
import { join as join6 } from "node:path";
import { homedir as homedir7 } from "node:os";
import { join as join7, dirname as dirname4 } from "node:path";
import os from "node:os";
import path2 from "node:path";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
function clamp01(value, fallback) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}
function clampCount(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}
function computeEmotionalSalience(text, category, importance) {
  let score = 0.35;
  if (category === "decision") score += 0.15;
  if (category === "preference") score += 0.1;
  if (category === "reflection") score += 0.1;
  if (typeof importance === "number" && importance > 0.8) score += 0.1;
  if (typeof importance === "number" && importance > 0.9) score += 0.05;
  for (const { pattern, boost } of SALIENCE_BOOSTERS) {
    if (pattern.test(text)) score += boost;
  }
  for (const { pattern, dampen } of SALIENCE_DAMPENERS) {
    if (pattern.test(text)) score -= dampen;
  }
  return Math.min(1, Math.max(0, score));
}
function calibrateEmotion(text, rawValence) {
  if (!Number.isFinite(rawValence)) return 0.5;
  const hasStrongEmotion = STRONG_EMOTION_PATTERNS.some((p) => p.test(text));
  const digitChars = (text.match(/\d/g) || []).length;
  const digitRatio = text.length > 0 ? digitChars / text.length : 0;
  const hasFactualSignals = digitRatio > 0.3 || FACTUAL_PATTERNS.some((p) => p.test(text));
  let calibrated = rawValence;
  if (hasStrongEmotion && rawValence >= 0.4 && rawValence <= 0.6) {
    calibrated = rawValence <= 0.5 ? 0.3 : 0.7;
  }
  if (hasFactualSignals && !hasStrongEmotion) {
    if (calibrated < 0.45) calibrated = 0.45;
    if (calibrated > 0.55) calibrated = 0.55;
  }
  return Math.min(1, Math.max(0, calibrated));
}
function normalizeTier(value) {
  switch (value) {
    case "core":
    case "working":
    case "peripheral":
      return value;
    default:
      return "working";
  }
}
function reverseMapLegacyCategory(oldCategory, text = "") {
  switch (oldCategory) {
    case "preference":
      return "preferences";
    case "entity":
      return "entities";
    case "decision":
      return "events";
    case "other":
      return "patterns";
    case "fact":
      if (/\b(my |i am |i'm |name is |叫我|我的|我是)\b/i.test(text) && text.length < 200) {
        return "profile";
      }
      return "cases";
    default:
      return "patterns";
  }
}
function defaultOverview(text) {
  return `- ${text}`;
}
function normalizeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function parseSmartMetadata(rawMetadata, entry = {}) {
  let parsed = {};
  if (rawMetadata) {
    try {
      const obj = JSON.parse(rawMetadata);
      if (obj && typeof obj === "object") {
        parsed = obj;
      }
    } catch {
      parsed = {};
    }
  }
  const text = entry.text ?? "";
  const timestamp = typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now();
  const memoryCategory = reverseMapLegacyCategory(entry.category, text);
  const l0 = normalizeText(parsed.l0_abstract, text);
  const l2 = normalizeText(parsed.l2_content, text);
  const normalized = {
    ...parsed,
    l0_abstract: l0,
    l1_overview: normalizeText(parsed.l1_overview, defaultOverview(l0)),
    l2_content: l2,
    memory_category: typeof parsed.memory_category === "string" ? parsed.memory_category : memoryCategory,
    tier: normalizeTier(parsed.tier),
    access_count: clampCount(parsed.access_count, 0),
    confidence: clamp01(parsed.confidence, 0.7),
    last_accessed_at: clampCount(parsed.last_accessed_at, timestamp),
    source_session: typeof parsed.source_session === "string" ? parsed.source_session : void 0,
    emotional_salience: clamp01(
      parsed.emotional_salience,
      computeEmotionalSalience(text, entry.category, entry.importance)
    )
  };
  return normalized;
}
function buildSmartMetadata(entry, patch = {}) {
  const base = parseSmartMetadata(entry.metadata, entry);
  const text = entry.text ?? "";
  const rawSalience = clamp01(
    patch.emotional_salience ?? base.emotional_salience,
    base.emotional_salience
  );
  const calibratedSalience = calibrateEmotion(text, rawSalience);
  return {
    ...base,
    ...patch,
    l0_abstract: normalizeText(patch.l0_abstract, base.l0_abstract),
    l1_overview: normalizeText(patch.l1_overview, base.l1_overview),
    l2_content: normalizeText(patch.l2_content, base.l2_content),
    memory_category: typeof patch.memory_category === "string" ? patch.memory_category : base.memory_category,
    tier: normalizeTier(patch.tier ?? base.tier),
    access_count: clampCount(patch.access_count, base.access_count),
    confidence: clamp01(patch.confidence, base.confidence),
    last_accessed_at: clampCount(
      patch.last_accessed_at,
      base.last_accessed_at || entry.timestamp || Date.now()
    ),
    source_session: typeof patch.source_session === "string" ? patch.source_session : base.source_session,
    emotional_salience: calibratedSalience
  };
}
function stringifySmartMetadata(metadata) {
  const capped = { ...metadata };
  if (Array.isArray(capped.sources) && capped.sources.length > MAX_SOURCES) {
    capped.sources = capped.sources.slice(-MAX_SOURCES);
  }
  if (Array.isArray(capped.history) && capped.history.length > MAX_HISTORY) {
    capped.history = capped.history.slice(-MAX_HISTORY);
  }
  if (Array.isArray(capped.relations) && capped.relations.length > MAX_RELATIONS) {
    capped.relations = capped.relations.slice(0, MAX_RELATIONS);
  }
  return JSON.stringify(capped);
}
function toLifecycleMemory(id, entry) {
  const metadata = parseSmartMetadata(entry.metadata, entry);
  const createdAt = typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now();
  return {
    id,
    importance: typeof entry.importance === "number" && Number.isFinite(entry.importance) ? entry.importance : 0.7,
    confidence: metadata.confidence,
    tier: metadata.tier,
    accessCount: metadata.access_count,
    createdAt,
    lastAccessedAt: metadata.last_accessed_at || createdAt,
    emotionalSalience: metadata.emotional_salience
  };
}
function getDecayableFromEntry(entry) {
  const meta = parseSmartMetadata(entry.metadata, entry);
  const createdAt = typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now();
  const memory = {
    id: entry.id ?? "",
    importance: typeof entry.importance === "number" && Number.isFinite(entry.importance) ? entry.importance : 0.7,
    confidence: meta.confidence,
    tier: meta.tier,
    accessCount: meta.access_count,
    createdAt,
    lastAccessedAt: meta.last_accessed_at || createdAt,
    emotionalSalience: meta.emotional_salience
  };
  return { memory, meta };
}
var SALIENCE_BOOSTERS;
var SALIENCE_DAMPENERS;
var STRONG_EMOTION_PATTERNS;
var FACTUAL_PATTERNS;
var MAX_SOURCES;
var MAX_HISTORY;
var MAX_RELATIONS;
var init_smart_metadata = __esm({
  "packages/core/src/smart-metadata.ts"() {
    SALIENCE_BOOSTERS = [
      // Decisions and commitments
      { pattern: /\b(决定|决策|confirmed|decided|commit|approved|批了|拍板|定了)\b/i, boost: 0.3 },
      // Strong emotions
      { pattern: /\b(震惊|惊喜|愤怒|失望|兴奋|amazing|shocked|frustrated|excited|worried|担心)\b/i, boost: 0.25 },
      // First-time events
      { pattern: /\b(第一次|首次|first time|first ever|从未|never before)\b/i, boost: 0.25 },
      // Financial significance
      { pattern: /\b(\d+万|\d+亿|\$[\d,.]+[MBK]|估值|valuation|投资|持仓)\b/i, boost: 0.2 },
      // People and relationships (user-configurable entity names)
      { pattern: /\b(colleague|partner|mentor|friend|manager|teammate)\b/i, boost: 0.15 },
      // Lessons learned / mistakes
      { pattern: /\b(教训|踩坑|pitfall|lesson|mistake|bug|故障|挂了|崩了)\b/i, boost: 0.2 },
      // Preferences and identity
      { pattern: /\b(喜欢|讨厌|偏好|prefer|hate|love|always|never)\b/i, boost: 0.15 },
      // Exclamation / emphasis (emotional weight)
      { pattern: /[!！]{2,}|‼️|⚠️|🔴|💀/, boost: 0.1 }
    ];
    SALIENCE_DAMPENERS = [
      { pattern: /\b(heartbeat|HEARTBEAT_OK)\b/i, dampen: 0.2 },
      { pattern: /\b(cron|restart|gateway|status)\b/i, dampen: 0.1 },
      { pattern: /\b(debug|stack trace|npm|node_modules|\.tsx?|\.jsx?)\b/i, dampen: 0.1 },
      { pattern: /^\[?(Updated|Added|Removed|Fixed|Set)\]?\s.{0,30}$/i, dampen: 0.15 }
      // short auto-generated entries only
    ];
    STRONG_EMOTION_PATTERNS = [
      /太好了|太棒了|amazing|incredible|wonderful|fantastic|excellent/i,
      /terrible|horrible|awful|disgusting|devastating/i,
      /fuck|shit|damn|靠|卧槽|我去|妈的/i,
      /哈哈哈|lol|lmao|rofl|😂|🤣/i,
      /[!！]{3,}/,
      /heartbroken|ecstatic|furious|thrilled|terrified/i,
      /崩溃|暴怒|狂喜|绝望|震惊|兴奋死了/i
    ];
    FACTUAL_PATTERNS = [
      /估值|revenue|valuation|profit|loss|margin/i,
      /[$￥€£]/,
      /%/
    ];
    MAX_SOURCES = 20;
    MAX_HISTORY = 50;
    MAX_RELATIONS = 16;
  }
});
var PREFIX;
var isDebug;
var defaultLogger;
var _logger;
var log;
var init_logger = __esm({
  "packages/core/src/logger.ts"() {
    PREFIX = "[mnemo]";
    isDebug = () => !!process.env.MNEMO_DEBUG;
    defaultLogger = {
      debug(msg, ...args) {
        if (isDebug()) console.debug(PREFIX, msg, ...args);
      },
      info(msg, ...args) {
        console.log(PREFIX, msg, ...args);
      },
      warn(msg, ...args) {
        console.warn(PREFIX, msg, ...args);
      },
      error(msg, ...args) {
        console.error(PREFIX, msg, ...args);
      }
    };
    _logger = defaultLogger;
    log = {
      debug: (msg, ...args) => _logger.debug(msg, ...args),
      info: (msg, ...args) => _logger.info(msg, ...args),
      warn: (msg, ...args) => _logger.warn(msg, ...args),
      error: (msg, ...args) => _logger.error(msg, ...args)
    };
  }
});
function registerAdapter(name, factory) {
  _registry.set(name, factory);
}
function createAdapter(name, config) {
  const factory = _registry.get(name);
  if (!factory) {
    throw new Error(
      `Storage adapter "${name}" not found. Available: ${[..._registry.keys()].join(", ") || "(none)"}. Did you forget to call registerAdapter()?`
    );
  }
  return factory(config);
}
function listAdapters() {
  return [..._registry.keys()];
}
var _registry;
var init_storage_adapter = __esm({
  "packages/core/src/storage-adapter.ts"() {
    _registry = /* @__PURE__ */ new Map();
  }
});
var audit_log_exports = {};
__export(audit_log_exports, {
  audit: () => audit,
  auditCreate: () => auditCreate,
  auditDelete: () => auditDelete,
  auditExpire: () => auditExpire,
  auditRecall: () => auditRecall,
  auditUpdate: () => auditUpdate,
  readAuditLog: () => readAuditLog,
  setAuditEnabled: () => setAuditEnabled
});
async function ensureDir() {
  if (_initialized) return;
  try {
    await mkdir(AUDIT_DIR, { recursive: true });
    _currentFile = getLogFileName();
    _initialized = true;
  } catch {
    _enabled = false;
  }
}
function getLogFileName() {
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return join2(AUDIT_DIR, `audit-${date}.jsonl`);
}
async function audit(entry) {
  if (!_enabled) return;
  try {
    await ensureDir();
    const expectedFile = getLogFileName();
    if (expectedFile !== _currentFile) {
      _currentFile = expectedFile;
    }
    try {
      const stats = await stat(_currentFile);
      if (stats.size > MAX_FILE_SIZE) {
        const rotatedName = _currentFile.replace(".jsonl", `-${Date.now()}.jsonl`);
        _currentFile = rotatedName;
      }
    } catch {
    }
    const line = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || (/* @__PURE__ */ new Date()).toISOString()
    }) + "\n";
    await appendFile(_currentFile, line);
  } catch {
  }
}
function auditCreate(memoryId, actor, scope, reason, textPreview) {
  audit({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: "create",
    actor,
    memoryIds: [memoryId],
    scope,
    reason,
    details: textPreview ? textPreview.slice(0, 200) : void 0
  }).catch(() => {
  });
}
function auditDelete(memoryIds, actor, reason) {
  audit({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: memoryIds.length > 1 ? "bulk_delete" : "delete",
    actor,
    memoryIds,
    reason
  }).catch(() => {
  });
}
function auditUpdate(memoryId, actor, reason, details) {
  audit({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: "update",
    actor,
    memoryIds: [memoryId],
    reason,
    details
  }).catch(() => {
  });
}
function auditExpire(memoryId, actor, reason, details) {
  audit({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: "expire",
    actor,
    memoryIds: [memoryId],
    reason,
    details
  }).catch(() => {
  });
}
function auditRecall(memoryIds, actor, query) {
  audit({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: "recall",
    actor,
    memoryIds,
    reason: "retrieval",
    details: query ? query.slice(0, 200) : void 0
  }).catch(() => {
  });
}
async function readAuditLog(startDate, endDate) {
  await ensureDir();
  const entries = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const filePath = join2(AUDIT_DIR, `audit-${dateStr}.jsonl`);
    try {
      const content = await readFile(filePath, "utf8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
        }
      }
    } catch {
    }
    current.setDate(current.getDate() + 1);
  }
  return entries;
}
function setAuditEnabled(enabled) {
  _enabled = enabled;
}
var AUDIT_DIR;
var MAX_FILE_SIZE;
var _initialized;
var _currentFile;
var _enabled;
var init_audit_log = __esm({
  "packages/core/src/audit-log.ts"() {
    AUDIT_DIR = join2(homedir2(), ".mnemo", "audit");
    MAX_FILE_SIZE = 10 * 1024 * 1024;
    _initialized = false;
    _currentFile = "";
    _enabled = true;
  }
});
var wal_recovery_exports = {};
__export(wal_recovery_exports, {
  recoverPendingWrites: () => recoverPendingWrites,
  walAppend: () => walAppend,
  walMarkCommitted: () => walMarkCommitted,
  walMarkFailed: () => walMarkFailed
});
async function ensureWalDir() {
  await mkdir2(dirname(WAL_PATH), { recursive: true });
}
async function walAppend(entry) {
  await ensureWalDir();
  const line = JSON.stringify(entry) + "\n";
  await appendFile2(WAL_PATH, line, "utf8");
}
async function walMarkCommitted(ts) {
  const entry = {
    ts,
    action: "write",
    text: "",
    scope: "",
    category: "",
    groupId: "",
    importance: 0,
    status: "committed"
  };
  await ensureWalDir();
  await appendFile2(WAL_PATH, JSON.stringify(entry) + "\n", "utf8");
}
async function walMarkFailed(ts, error) {
  const entry = {
    ts,
    action: "write",
    text: "",
    scope: "",
    category: "",
    groupId: "",
    importance: 0,
    status: "failed",
    error
  };
  await ensureWalDir();
  await appendFile2(WAL_PATH, JSON.stringify(entry) + "\n", "utf8");
}
async function recoverPendingWrites() {
  if (!existsSync(WAL_PATH)) {
    return { recovered: 0, failed: 0 };
  }
  let raw;
  try {
    raw = await readFile2(WAL_PATH, "utf8");
  } catch {
    return { recovered: 0, failed: 0 };
  }
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const statusMap = /* @__PURE__ */ new Map();
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const existing = statusMap.get(entry.ts);
      if (!existing || entry.status !== "pending") {
        statusMap.set(entry.ts, entry);
      }
    } catch {
    }
  }
  const oneHourAgo = Date.now() - 60 * 60 * 1e3;
  const pending = [];
  for (const entry of statusMap.values()) {
    if (entry.status === "pending") {
      const entryTime = new Date(entry.ts).getTime();
      if (entryTime < oneHourAgo) {
        pending.push(entry);
      }
    }
  }
  if (pending.length === 0) {
    return { recovered: 0, failed: 0 };
  }
  const graphitiBase = process.env.GRAPHITI_BASE_URL || "http://127.0.0.1:18799";
  let recovered = 0;
  let failed = 0;
  for (const entry of pending) {
    try {
      const response = await fetch(`${graphitiBase}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[${entry.category}] ${entry.text}`,
          group_id: entry.groupId,
          reference_time: entry.ts,
          source: `lancedb-pro-store-${entry.groupId}`,
          category: entry.category
        }),
        signal: AbortSignal.timeout(15e3)
      });
      if (response.ok) {
        await walMarkCommitted(entry.ts);
        recovered++;
      } else {
        await walMarkFailed(entry.ts, `HTTP ${response.status}`);
        failed++;
      }
    } catch (err) {
      await walMarkFailed(entry.ts, String(err));
      failed++;
    }
  }
  log.info(
    `WAL recovery \u2014 recovered=${recovered}, failed=${failed}, total_pending=${pending.length}`
  );
  return { recovered, failed };
}
var WAL_PATH;
var init_wal_recovery = __esm({
  "packages/core/src/wal-recovery.ts"() {
    init_logger();
    WAL_PATH = join3(homedir3(), ".openclaw", "memory", "graphiti-wal.jsonl");
  }
});
var lancedb_exports = {};
__export(lancedb_exports, {
  LanceDBAdapter: () => LanceDBAdapter
});
function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9\-_.:@ \u4e00-\u9fff\u3400-\u4dbf]/g, "");
}
async function loadLanceDB() {
  if (!_lancedb) {
    _lancedb = await import("@lancedb/lancedb");
  }
  return _lancedb;
}
var _lancedb;
var TABLE_NAME;
var LanceDBAdapter;
var init_lancedb = __esm({
  "packages/core/src/adapters/lancedb.ts"() {
    init_storage_adapter();
    _lancedb = null;
    TABLE_NAME = "memories";
    LanceDBAdapter = class {
      name = "lancedb";
      db = null;
      table = null;
      ftsReady = false;
      vectorDim = 0;
      async connect(dbPath) {
        const lancedb = await loadLanceDB();
        this.db = await lancedb.connect(dbPath);
      }
      async ensureTable(vectorDimensions) {
        this.vectorDim = vectorDimensions;
        try {
          this.table = await this.db.openTable(TABLE_NAME);
        } catch {
          const lancedb = await loadLanceDB();
          const schemaEntry = {
            id: "__schema__",
            text: "",
            vector: new Array(vectorDimensions).fill(0),
            timestamp: 0,
            scope: "global",
            importance: 0,
            category: "other",
            metadata: "{}"
          };
          try {
            this.table = await this.db.createTable(TABLE_NAME, [schemaEntry]);
            await this.table.delete('id = "__schema__"');
          } catch (err) {
            if (String(err).includes("already exists")) {
              this.table = await this.db.openTable(TABLE_NAME);
            } else {
              throw err;
            }
          }
        }
        const sample = await this.table.query().limit(1).toArray();
        if (sample.length > 0 && sample[0]?.vector?.length) {
          const existing = sample[0].vector.length;
          if (existing !== vectorDimensions) {
            throw new Error(
              `Vector dimension mismatch: table=${existing}, config=${vectorDimensions}`
            );
          }
        }
        await this.ensureFullTextIndex();
      }
      async add(records) {
        if (!this.table) throw new Error("Table not initialized");
        await this.table.add(records);
      }
      async update(id, record) {
        if (!this.table) throw new Error("Table not initialized");
        await this.table.delete(`id = '${sanitize(id)}'`);
        await this.table.add([record]);
      }
      async delete(filter) {
        if (!this.table) throw new Error("Table not initialized");
        await this.table.delete(filter);
      }
      async vectorSearch(vector, limit2, minScore = 0, scopeFilter) {
        if (!this.table) throw new Error("Table not initialized");
        let query = this.table.vectorSearch(vector).distanceType("cosine").limit(limit2 * 3);
        if (scopeFilter?.length) {
          const scopeExpr = scopeFilter.map((s) => `'${sanitize(s)}'`).join(", ");
          query = query.where(`scope IN (${scopeExpr})`);
        }
        const raw = await query.toArray();
        return raw.map((row) => {
          const distance = row._distance ?? row.distance ?? 1;
          const score = 1 / (1 + distance);
          return { record: this.toRecord(row), score };
        }).filter((r) => r.score >= minScore).slice(0, limit2);
      }
      async fullTextSearch(queryText, limit2, scopeFilter) {
        if (!this.table || !this.ftsReady) return [];
        let query = this.table.search(queryText, "fts").limit(limit2 * 2);
        if (scopeFilter?.length) {
          const scopeExpr = scopeFilter.map((s) => `'${sanitize(s)}'`).join(", ");
          query = query.where(`scope IN (${scopeExpr})`);
        }
        const raw = await query.toArray();
        return raw.map((row) => {
          const score = row._relevance_score ?? row.score ?? 0.5;
          return { record: this.toRecord(row), score };
        }).slice(0, limit2);
      }
      async query(options) {
        if (!this.table) throw new Error("Table not initialized");
        let q = this.table.query();
        if (options.select?.length) {
          q = q.select(options.select);
        }
        if (options.where) {
          q = q.where(options.where);
        }
        if (options.limit) {
          q = q.limit(options.limit);
        }
        const raw = await q.toArray();
        return raw.map((row) => this.toRecord(row));
      }
      async count(filter) {
        if (!this.table) throw new Error("Table not initialized");
        let q = this.table.query();
        if (filter) q = q.where(filter);
        const rows = await q.toArray();
        return rows.length;
      }
      async ensureFullTextIndex() {
        if (!this.table) return;
        try {
          const indices = await this.table.listIndices();
          const hasFts = indices?.some(
            (idx) => idx.indexType === "FTS" || idx.columns?.includes("text")
          );
          if (!hasFts) {
            const lancedb = await loadLanceDB();
            await this.table.createIndex("text", {
              config: lancedb.Index.fts()
            });
          }
          this.ftsReady = true;
        } catch {
          this.ftsReady = false;
        }
      }
      hasFullTextSearch() {
        return this.ftsReady;
      }
      async close() {
        this.table = null;
        this.db = null;
      }
      // ── Helpers ──
      toRecord(row) {
        return {
          id: row.id,
          text: row.text,
          vector: row.vector ? Array.from(row.vector) : [],
          timestamp: row.timestamp ?? 0,
          scope: row.scope ?? "global",
          importance: row.importance ?? 0.5,
          category: row.category ?? "other",
          metadata: row.metadata ?? "{}",
          ...row
          // preserve extra fields
        };
      }
    };
    registerAdapter("lancedb", () => new LanceDBAdapter());
  }
});
var qdrant_exports = {};
__export(qdrant_exports, {
  QdrantAdapter: () => QdrantAdapter
});
var COLLECTION;
var QdrantAdapter;
var init_qdrant = __esm({
  "packages/core/src/adapters/qdrant.ts"() {
    init_storage_adapter();
    COLLECTION = "mnemo_memories";
    QdrantAdapter = class {
      name = "qdrant";
      client = null;
      url = "http://localhost:6333";
      apiKey;
      vectorDim = 0;
      constructor(config) {
        if (config?.url) this.url = config.url;
        if (config?.apiKey) this.apiKey = config.apiKey;
      }
      async connect() {
        const { QdrantClient } = await import("@qdrant/js-client-rest");
        this.client = new QdrantClient({
          url: this.url,
          ...this.apiKey ? { apiKey: this.apiKey } : {}
        });
      }
      async ensureTable(vectorDimensions) {
        this.vectorDim = vectorDimensions;
        const collections = await this.client.getCollections();
        const exists = collections.collections.some((c) => c.name === COLLECTION);
        if (!exists) {
          await this.client.createCollection(COLLECTION, {
            vectors: { size: vectorDimensions, distance: "Cosine" }
          });
          await this.client.createPayloadIndex(COLLECTION, {
            field_name: "scope",
            field_schema: "keyword"
          });
          await this.client.createPayloadIndex(COLLECTION, {
            field_name: "category",
            field_schema: "keyword"
          });
        }
      }
      async add(records) {
        const points = records.map((r) => ({
          id: r.id,
          vector: r.vector,
          payload: {
            text: r.text,
            timestamp: r.timestamp,
            scope: r.scope,
            importance: r.importance,
            category: r.category,
            metadata: r.metadata
          }
        }));
        await this.client.upsert(COLLECTION, { points });
      }
      async update(id, record) {
        await this.add([record]);
      }
      async delete(filter) {
        const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
        if (idMatch) {
          await this.client.delete(COLLECTION, {
            points: [idMatch[1]]
          });
        }
      }
      async vectorSearch(vector, limit2, minScore = 0, scopeFilter) {
        const filter = scopeFilter?.length ? { must: [{ key: "scope", match: { any: scopeFilter } }] } : void 0;
        const results = await this.client.search(COLLECTION, {
          vector,
          limit: limit2,
          with_payload: true,
          score_threshold: minScore,
          ...filter ? { filter } : {}
        });
        return results.map((r) => ({
          record: this.toRecord(r.id, r.payload),
          score: r.score
        }));
      }
      async fullTextSearch(_query, _limit, _scopeFilter) {
        return [];
      }
      async query(options) {
        const filter = options.where ? this.parseFilter(options.where) : void 0;
        const result = await this.client.scroll(COLLECTION, {
          limit: options.limit || 100,
          with_payload: true,
          with_vectors: true,
          ...filter ? { filter } : {}
        });
        return result.points.map((p) => this.toRecord(p.id, p.payload, p.vector));
      }
      async count(filter) {
        const result = await this.client.count(COLLECTION, {
          ...filter ? { filter: this.parseFilter(filter) } : {},
          exact: true
        });
        return result.count;
      }
      async ensureFullTextIndex() {
      }
      hasFullTextSearch() {
        return false;
      }
      async close() {
        this.client = null;
      }
      // ── Helpers ──
      toRecord(id, payload, vector) {
        return {
          id,
          text: payload.text ?? "",
          vector: vector ? Array.from(vector) : [],
          timestamp: payload.timestamp ?? 0,
          scope: payload.scope ?? "global",
          importance: payload.importance ?? 0.5,
          category: payload.category ?? "other",
          metadata: payload.metadata ?? "{}"
        };
      }
      parseFilter(where) {
        const scopeMatch = where.match(/scope\s+IN\s*\(([^)]+)\)/i);
        if (scopeMatch) {
          const scopes = scopeMatch[1].split(",").map((s) => s.trim().replace(/'/g, ""));
          return { must: [{ key: "scope", match: { any: scopes } }] };
        }
        return void 0;
      }
    };
    registerAdapter("qdrant", (config) => new QdrantAdapter(config));
  }
});
var chroma_exports = {};
__export(chroma_exports, {
  ChromaAdapter: () => ChromaAdapter
});
var COLLECTION2;
var ChromaAdapter;
var init_chroma = __esm({
  "packages/core/src/adapters/chroma.ts"() {
    init_storage_adapter();
    COLLECTION2 = "mnemo_memories";
    ChromaAdapter = class {
      name = "chroma";
      client = null;
      collection = null;
      config;
      constructor(config) {
        this.config = config || {};
      }
      async connect(dbPath) {
        const chroma = await import("chromadb");
        if (this.config.url) {
          this.client = new chroma.ChromaClient({ path: this.config.url });
        } else {
          this.client = new chroma.ChromaClient({ path: dbPath || this.config.path });
        }
      }
      async ensureTable(vectorDimensions) {
        this.collection = await this.client.getOrCreateCollection({
          name: COLLECTION2,
          metadata: { "hnsw:space": "cosine" }
        });
      }
      async add(records) {
        if (!this.collection) throw new Error("Collection not initialized");
        await this.collection.upsert({
          ids: records.map((r) => r.id),
          embeddings: records.map((r) => r.vector),
          documents: records.map((r) => r.text),
          metadatas: records.map((r) => ({
            timestamp: r.timestamp,
            scope: r.scope,
            importance: r.importance,
            category: r.category,
            metadata: r.metadata
          }))
        });
      }
      async update(id, record) {
        await this.add([record]);
      }
      async delete(filter) {
        if (!this.collection) throw new Error("Collection not initialized");
        const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
        if (idMatch) {
          await this.collection.delete({ ids: [idMatch[1]] });
        }
      }
      async vectorSearch(vector, limit2, minScore = 0, scopeFilter) {
        if (!this.collection) throw new Error("Collection not initialized");
        const where = scopeFilter?.length ? { scope: { $in: scopeFilter } } : void 0;
        const results = await this.collection.query({
          queryEmbeddings: [vector],
          nResults: limit2,
          ...where ? { where } : {}
        });
        if (!results.ids?.[0]) return [];
        return results.ids[0].map((id, i) => {
          const distance = results.distances?.[0]?.[i] ?? 1;
          const score = 1 - distance;
          const meta = results.metadatas?.[0]?.[i] || {};
          return {
            record: {
              id,
              text: results.documents?.[0]?.[i] ?? "",
              vector: [],
              // Chroma doesn't return vectors by default
              timestamp: meta.timestamp ?? 0,
              scope: meta.scope ?? "global",
              importance: meta.importance ?? 0.5,
              category: meta.category ?? "other",
              metadata: meta.metadata ?? "{}"
            },
            score
          };
        }).filter((r) => r.score >= minScore);
      }
      async fullTextSearch(query, limit2, scopeFilter) {
        if (!this.collection) return [];
        const where = scopeFilter?.length ? { scope: { $in: scopeFilter } } : void 0;
        const results = await this.collection.query({
          queryTexts: [query],
          nResults: limit2,
          ...where ? { where } : {}
        });
        if (!results.ids?.[0]) return [];
        return results.ids[0].map((id, i) => {
          const distance = results.distances?.[0]?.[i] ?? 1;
          const meta = results.metadatas?.[0]?.[i] || {};
          return {
            record: {
              id,
              text: results.documents?.[0]?.[i] ?? "",
              vector: [],
              timestamp: meta.timestamp ?? 0,
              scope: meta.scope ?? "global",
              importance: meta.importance ?? 0.5,
              category: meta.category ?? "other",
              metadata: meta.metadata ?? "{}"
            },
            score: 1 - distance
          };
        });
      }
      async query(options) {
        if (!this.collection) throw new Error("Collection not initialized");
        const result = await this.collection.get({
          limit: options.limit || 100,
          include: ["documents", "metadatas", "embeddings"]
        });
        return (result.ids || []).map((id, i) => {
          const meta = result.metadatas?.[i] || {};
          return {
            id,
            text: result.documents?.[i] ?? "",
            vector: result.embeddings?.[i] ?? [],
            timestamp: meta.timestamp ?? 0,
            scope: meta.scope ?? "global",
            importance: meta.importance ?? 0.5,
            category: meta.category ?? "other",
            metadata: meta.metadata ?? "{}"
          };
        });
      }
      async count() {
        if (!this.collection) return 0;
        return await this.collection.count();
      }
      async ensureFullTextIndex() {
      }
      hasFullTextSearch() {
        return true;
      }
      async close() {
        this.collection = null;
        this.client = null;
      }
    };
    registerAdapter("chroma", (config) => new ChromaAdapter(config));
  }
});
var pgvector_exports = {};
__export(pgvector_exports, {
  PGVectorAdapter: () => PGVectorAdapter
});
var TABLE;
var PGVectorAdapter;
var init_pgvector = __esm({
  "packages/core/src/adapters/pgvector.ts"() {
    init_storage_adapter();
    TABLE = "mnemo_memories";
    PGVectorAdapter = class {
      name = "pgvector";
      pool = null;
      vectorDim = 0;
      connectionString;
      constructor(config) {
        this.connectionString = config?.connectionString || "postgres://localhost:5432/mnemo";
      }
      async connect(dbPath) {
        const { Pool } = await import("pg");
        this.pool = new Pool({
          connectionString: dbPath || this.connectionString
        });
        await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");
      }
      async ensureTable(vectorDimensions) {
        this.vectorDim = vectorDimensions;
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        vector vector(${vectorDimensions}),
        timestamp BIGINT DEFAULT 0,
        scope TEXT DEFAULT 'global',
        importance REAL DEFAULT 0.5,
        category TEXT DEFAULT 'other',
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `);
        await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_vector_idx
      ON ${TABLE} USING hnsw (vector vector_cosine_ops)
    `).catch(() => {
        });
        await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_text_idx
      ON ${TABLE} USING gin (to_tsvector('simple', text))
    `).catch(() => {
        });
        await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_scope_idx ON ${TABLE} (scope)
    `).catch(() => {
        });
      }
      async add(records) {
        for (const r of records) {
          await this.pool.query(
            `INSERT INTO ${TABLE} (id, text, vector, timestamp, scope, importance, category, metadata)
         VALUES ($1, $2, $3::vector, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text,
           vector = EXCLUDED.vector,
           timestamp = EXCLUDED.timestamp,
           scope = EXCLUDED.scope,
           importance = EXCLUDED.importance,
           category = EXCLUDED.category,
           metadata = EXCLUDED.metadata`,
            [r.id, r.text, `[${r.vector.join(",")}]`, r.timestamp, r.scope, r.importance, r.category, r.metadata]
          );
        }
      }
      async update(id, record) {
        await this.add([record]);
      }
      async delete(filter) {
        const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
        if (idMatch) {
          await this.pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [idMatch[1]]);
        } else {
          await this.pool.query(`DELETE FROM ${TABLE} WHERE ${filter}`);
        }
      }
      async vectorSearch(vector, limit2, minScore = 0, scopeFilter) {
        const vectorStr = `[${vector.join(",")}]`;
        let query = `
      SELECT *, 1 - (vector <=> $1::vector) AS score
      FROM ${TABLE}
      WHERE 1 - (vector <=> $1::vector) >= $2
    `;
        const params = [vectorStr, minScore];
        if (scopeFilter?.length) {
          query += ` AND scope = ANY($3)`;
          params.push(scopeFilter);
        }
        query += ` ORDER BY vector <=> $1::vector LIMIT $${params.length + 1}`;
        params.push(limit2);
        const result = await this.pool.query(query, params);
        return result.rows.map((row) => ({
          record: this.toRecord(row),
          score: parseFloat(row.score)
        }));
      }
      async fullTextSearch(queryText, limit2, scopeFilter) {
        let query = `
      SELECT *, ts_rank(to_tsvector('simple', text), plainto_tsquery('simple', $1)) AS score
      FROM ${TABLE}
      WHERE to_tsvector('simple', text) @@ plainto_tsquery('simple', $1)
    `;
        const params = [queryText];
        if (scopeFilter?.length) {
          query += ` AND scope = ANY($2)`;
          params.push(scopeFilter);
        }
        query += ` ORDER BY score DESC LIMIT $${params.length + 1}`;
        params.push(limit2);
        const result = await this.pool.query(query, params);
        return result.rows.map((row) => ({
          record: this.toRecord(row),
          score: parseFloat(row.score)
        }));
      }
      async query(options) {
        let query = `SELECT * FROM ${TABLE}`;
        if (options.where) query += ` WHERE ${options.where}`;
        query += ` LIMIT ${options.limit || 100}`;
        const result = await this.pool.query(query);
        return result.rows.map((row) => this.toRecord(row));
      }
      async count(filter) {
        let query = `SELECT COUNT(*) FROM ${TABLE}`;
        if (filter) query += ` WHERE ${filter}`;
        const result = await this.pool.query(query);
        return parseInt(result.rows[0].count);
      }
      async ensureFullTextIndex() {
      }
      hasFullTextSearch() {
        return true;
      }
      async close() {
        if (this.pool) {
          await this.pool.end();
          this.pool = null;
        }
      }
      // ── Helpers ──
      toRecord(row) {
        return {
          id: row.id,
          text: row.text,
          vector: row.vector ? typeof row.vector === "string" ? JSON.parse(row.vector) : Array.from(row.vector) : [],
          timestamp: parseInt(row.timestamp) || 0,
          scope: row.scope ?? "global",
          importance: parseFloat(row.importance) || 0.5,
          category: row.category ?? "other",
          metadata: typeof row.metadata === "object" ? JSON.stringify(row.metadata) : row.metadata ?? "{}"
        };
      }
    };
    registerAdapter("pgvector", (config) => new PGVectorAdapter(config));
  }
});
function isNoise(text, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;
  if (opts.filterDenials && DENIAL_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (opts.filterMetaQuestions && META_QUESTION_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (opts.filterBoilerplate && BOILERPLATE_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (DIAGNOSTIC_ARTIFACT_PATTERNS.some((p) => p.test(trimmed))) return true;
  return false;
}
function filterNoise(items, getText, options) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return items.filter((item) => !isNoise(getText(item), opts));
}
var DENIAL_PATTERNS;
var META_QUESTION_PATTERNS;
var BOILERPLATE_PATTERNS;
var DIAGNOSTIC_ARTIFACT_PATTERNS;
var DEFAULT_OPTIONS;
var init_noise_filter = __esm({
  "packages/core/src/noise-filter.ts"() {
    DENIAL_PATTERNS = [
      /i don'?t have (any )?(information|data|memory|record)/i,
      /i'?m not sure about/i,
      /i don'?t recall/i,
      /i don'?t remember/i,
      /it looks like i don'?t/i,
      /i wasn'?t able to find/i,
      /no (relevant )?memories found/i,
      /i don'?t have access to/i
    ];
    META_QUESTION_PATTERNS = [
      /\bdo you (remember|recall|know about)\b/i,
      /\bcan you (remember|recall)\b/i,
      /\bdid i (tell|mention|say|share)\b/i,
      /\bhave i (told|mentioned|said)\b/i,
      /\bwhat did i (tell|say|mention)\b/i,
      /如果你知道.+只回复/i,
      /如果不知道.+只回复\s*none/i,
      /只回复精确代号/i,
      /只回复\s*none/i,
      // Chinese recall / meta-question patterns
      /你还?记得/,
      /记不记得/,
      /还记得.*吗/,
      /你[知晓]道.+吗/,
      /我(?:之前|上次|以前)(?:说|提|讲).*(?:吗|呢|？|\?)/
    ];
    BOILERPLATE_PATTERNS = [
      /^(hi|hello|hey|good morning|good evening|greetings)/i,
      /^fresh session/i,
      /^new session/i,
      /^HEARTBEAT/i
    ];
    DIAGNOSTIC_ARTIFACT_PATTERNS = [
      /\bquery\s*->\s*(none|no explicit solution|unknown|not found)\b/i,
      /\buser asked for\b.*\b(none|no explicit solution|unknown|not found)\b/i,
      /\bno explicit solution\b/i
    ];
    DEFAULT_OPTIONS = {
      filterDenials: true,
      filterMetaQuestions: true,
      filterBoilerplate: true
    };
  }
});
var access_tracker_exports = {};
__export(access_tracker_exports, {
  AccessTracker: () => AccessTracker,
  buildUpdatedMetadata: () => buildUpdatedMetadata,
  computeEffectiveHalfLife: () => computeEffectiveHalfLife,
  parseAccessMetadata: () => parseAccessMetadata
});
function clampAccessCount(value) {
  if (!Number.isFinite(value)) return MIN_ACCESS_COUNT;
  return Math.min(
    MAX_ACCESS_COUNT,
    Math.max(MIN_ACCESS_COUNT, Math.floor(value))
  );
}
function parseAccessMetadata(metadata) {
  if (metadata === void 0 || metadata === "") {
    return { accessCount: 0, lastAccessedAt: 0 };
  }
  let parsed;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return { accessCount: 0, lastAccessedAt: 0 };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { accessCount: 0, lastAccessedAt: 0 };
  }
  const obj = parsed;
  const rawCountAny = obj.accessCount ?? obj.access_count;
  const rawCount = typeof rawCountAny === "number" ? rawCountAny : Number(rawCountAny ?? 0);
  const rawLastAny = obj.lastAccessedAt ?? obj.last_accessed_at;
  const rawLastAccessed = typeof rawLastAny === "number" ? rawLastAny : Number(rawLastAny ?? 0);
  return {
    accessCount: clampAccessCount(rawCount),
    lastAccessedAt: Number.isFinite(rawLastAccessed) && rawLastAccessed >= 0 ? rawLastAccessed : 0
  };
}
function buildUpdatedMetadata(existingMetadata, accessDelta) {
  let existing = {};
  if (existingMetadata !== void 0 && existingMetadata !== "") {
    try {
      const parsed = JSON.parse(existingMetadata);
      if (typeof parsed === "object" && parsed !== null) {
        existing = { ...parsed };
      }
    } catch {
    }
  }
  const prev = parseAccessMetadata(existingMetadata);
  const newCount = clampAccessCount(prev.accessCount + accessDelta);
  const now = Date.now();
  return JSON.stringify({
    ...existing,
    // Write both camelCase and snake_case for compatibility.
    accessCount: newCount,
    lastAccessedAt: now,
    access_count: newCount,
    last_accessed_at: now
  });
}
function computeEffectiveHalfLife(baseHalfLife, accessCount, lastAccessedAt, reinforcementFactor, maxMultiplier) {
  if (reinforcementFactor === 0 || accessCount <= 0) {
    return baseHalfLife;
  }
  const now = Date.now();
  const daysSinceLastAccess = Math.max(
    0,
    (now - lastAccessedAt) / (1e3 * 60 * 60 * 24)
  );
  const accessFreshness = Math.exp(
    -daysSinceLastAccess * (Math.LN2 / ACCESS_DECAY_HALF_LIFE_DAYS)
  );
  const effectiveAccessCount = accessCount * accessFreshness;
  const extension = baseHalfLife * reinforcementFactor * Math.log1p(effectiveAccessCount);
  const result = baseHalfLife + extension;
  const cap = baseHalfLife * maxMultiplier;
  return Math.min(result, cap);
}
var MIN_ACCESS_COUNT;
var MAX_ACCESS_COUNT;
var ACCESS_DECAY_HALF_LIFE_DAYS;
var AccessTracker;
var init_access_tracker = __esm({
  "packages/core/src/access-tracker.ts"() {
    MIN_ACCESS_COUNT = 0;
    MAX_ACCESS_COUNT = 1e4;
    ACCESS_DECAY_HALF_LIFE_DAYS = 30;
    AccessTracker = class {
      pending = /* @__PURE__ */ new Map();
      debounceTimer = null;
      flushPromise = null;
      debounceMs;
      store;
      logger;
      constructor(options) {
        this.store = options.store;
        this.logger = options.logger;
        this.debounceMs = options.debounceMs ?? 5e3;
      }
      /**
       * Record one access for each of the given memory IDs.
       * Synchronous — only updates the in-memory pending map.
       */
      recordAccess(ids) {
        for (const id of ids) {
          const current = this.pending.get(id) ?? 0;
          this.pending.set(id, current + 1);
        }
        this.resetTimer();
      }
      /**
       * Return a snapshot of all pending (id -> delta) entries.
       */
      getPendingUpdates() {
        return new Map(this.pending);
      }
      /**
       * Flush pending access deltas to the store.
       *
       * If a flush is already in progress, awaits the current flush to complete.
       * If new pending data accumulated during the in-flight flush, a follow-up
       * flush is automatically triggered.
       */
      async flush() {
        this.clearTimer();
        if (this.flushPromise) {
          await this.flushPromise;
          if (this.pending.size > 0) {
            return this.flush();
          }
          return;
        }
        if (this.pending.size === 0) return;
        this.flushPromise = this.doFlush();
        try {
          await this.flushPromise;
        } finally {
          this.flushPromise = null;
        }
        if (this.pending.size > 0) {
          this.resetTimer();
        }
      }
      /**
       * Tear down the tracker — cancel timers and clear pending state.
       */
      destroy() {
        this.clearTimer();
        if (this.pending.size > 0) {
          this.logger.warn(
            `access-tracker: destroying with ${this.pending.size} pending writes`
          );
        }
        this.pending.clear();
      }
      // --------------------------------------------------------------------------
      // Internal helpers
      // --------------------------------------------------------------------------
      async doFlush() {
        const batch = new Map(this.pending);
        this.pending.clear();
        for (const [id, delta] of batch) {
          try {
            const current = await this.store.getById(id);
            if (!current) continue;
            const updatedMeta = buildUpdatedMetadata(current.metadata, delta);
            await this.store.update(id, { metadata: updatedMeta });
          } catch (err) {
            const existing = this.pending.get(id) ?? 0;
            this.pending.set(id, existing + delta);
            this.logger.warn(
              `access-tracker: write-back failed for ${id.slice(0, 8)}:`,
              err
            );
          }
        }
      }
      resetTimer() {
        this.clearTimer();
        this.debounceTimer = setTimeout(() => {
          void this.flush();
        }, this.debounceMs);
      }
      clearTimer() {
        if (this.debounceTimer !== null) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
      }
    };
  }
});
var query_tracker_exports = {};
__export(query_tracker_exports, {
  getRecentQueries: () => getRecentQueries,
  recordQuery: () => recordQuery
});
function recordQuery(data) {
  const line = JSON.stringify(data) + "\n";
  const doWrite = async () => {
    if (!dirEnsured) {
      await mkdir3(dirname3(TRACKING_PATH), { recursive: true });
      dirEnsured = true;
    }
    await appendFile3(TRACKING_PATH, line, "utf8");
  };
  doWrite().catch(() => {
  });
}
async function getRecentQueries(n = 100) {
  try {
    const raw = await readFile3(TRACKING_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const recent = lines.slice(-n);
    return recent.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
var TRACKING_PATH;
var dirEnsured;
var init_query_tracker = __esm({
  "packages/core/src/query-tracker.ts"() {
    TRACKING_PATH = join5(homedir5(), ".openclaw", "memory", "query-tracking.jsonl");
    dirEnsured = false;
  }
});
var self_improvement_files_exports = {};
__export(self_improvement_files_exports, {
  DEFAULT_ERRORS_TEMPLATE: () => DEFAULT_ERRORS_TEMPLATE,
  DEFAULT_LEARNINGS_TEMPLATE: () => DEFAULT_LEARNINGS_TEMPLATE,
  appendSelfImprovementEntry: () => appendSelfImprovementEntry,
  buildLearningsContext: () => buildLearningsContext,
  ensureSelfImprovementLearningFiles: () => ensureSelfImprovementLearningFiles,
  loadLearnings: () => loadLearnings
});
async function withFileWriteQueue(filePath, action) {
  const previous = fileWriteQueues.get(filePath) ?? Promise.resolve();
  let release;
  const lock = new Promise((resolve) => {
    release = resolve;
  });
  const next = previous.then(() => lock);
  fileWriteQueues.set(filePath, next);
  await previous;
  try {
    return await action();
  } finally {
    release?.();
    if (fileWriteQueues.get(filePath) === next) {
      fileWriteQueues.delete(filePath);
    }
  }
}
function todayYmd() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
}
async function nextLearningId(filePath, prefix) {
  const date = todayYmd();
  let count = 0;
  try {
    const content = await readFile4(filePath, "utf-8");
    const matches = content.match(new RegExp(`\\[${prefix}-${date}-\\d{3}\\]`, "g"));
    count = matches?.length ?? 0;
  } catch {
  }
  return `${prefix}-${date}-${String(count + 1).padStart(3, "0")}`;
}
async function ensureSelfImprovementLearningFiles(baseDir) {
  const learningsDir = join8(baseDir, ".learnings");
  await mkdir4(learningsDir, { recursive: true });
  const ensureFile = async (filePath, content) => {
    try {
      const existing = await readFile4(filePath, "utf-8");
      if (existing.trim().length > 0) return;
    } catch {
    }
    await writeFile(filePath, `${content.trim()}
`, "utf-8");
  };
  await ensureFile(join8(learningsDir, "LEARNINGS.md"), DEFAULT_LEARNINGS_TEMPLATE);
  await ensureFile(join8(learningsDir, "ERRORS.md"), DEFAULT_ERRORS_TEMPLATE);
}
async function loadLearnings(baseDir) {
  const learningsDir = join8(baseDir, ".learnings");
  const entries = [];
  for (const [type, fileName] of [["learning", "LEARNINGS.md"], ["error", "ERRORS.md"]]) {
    let content;
    try {
      content = await readFile4(join8(learningsDir, fileName), "utf-8");
    } catch {
      continue;
    }
    const sections = content.split(/^## \[/m).slice(1);
    for (const section of sections) {
      const idMatch = section.match(/^([A-Z]+-\d{8}-\d{3})\]/);
      if (!idMatch) continue;
      const id = idMatch[1];
      const extractField = (heading) => {
        const re = new RegExp(`### ${heading}\\s*\\n([\\s\\S]*?)(?=###|---|$)`, "m");
        const m = section.match(re);
        return m ? m[1].trim() : "";
      };
      const loggedMatch = section.match(/\*\*Logged\*\*:\s*(.+)/);
      const priorityMatch = section.match(/\*\*Priority\*\*:\s*(.+)/);
      const statusMatch = section.match(/\*\*Status\*\*:\s*(.+)/);
      const areaMatch = section.match(/\*\*Area\*\*:\s*(.+)/);
      entries.push({
        id,
        type,
        summary: extractField("Summary"),
        details: extractField("Details"),
        suggestedAction: extractField("Suggested Action"),
        area: areaMatch?.[1]?.trim() || "",
        priority: priorityMatch?.[1]?.trim() || "medium",
        status: statusMatch?.[1]?.trim() || "pending",
        loggedAt: loggedMatch?.[1]?.trim() || ""
      });
    }
  }
  return entries;
}
async function buildLearningsContext(baseDir, maxEntries = 5) {
  const entries = await loadLearnings(baseDir);
  if (entries.length === 0) return "";
  const actionable = entries.filter(
    (e) => e.status !== "resolved" && e.status !== "dismissed" && e.suggestedAction !== "-"
  );
  const recent = actionable.slice(-maxEntries).reverse();
  if (recent.length === 0) return "";
  const lines = recent.map(
    (e) => `- [${e.id}] ${e.summary}${e.suggestedAction ? ` \u2192 Action: ${e.suggestedAction}` : ""}`
  );
  return [
    "Past learnings (apply these when extracting memories):",
    ...lines
  ].join("\n");
}
async function appendSelfImprovementEntry(params) {
  const {
    baseDir,
    type,
    summary,
    details = "",
    suggestedAction = "",
    category = "best_practice",
    area = "config",
    priority = "medium",
    status = "pending",
    source = "mnemo/self_improvement_log"
  } = params;
  await ensureSelfImprovementLearningFiles(baseDir);
  const learningsDir = join8(baseDir, ".learnings");
  const fileName = type === "learning" ? "LEARNINGS.md" : "ERRORS.md";
  const filePath = join8(learningsDir, fileName);
  const idPrefix = type === "learning" ? "LRN" : "ERR";
  const id = await withFileWriteQueue(filePath, async () => {
    const entryId = await nextLearningId(filePath, idPrefix);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const titleSuffix = type === "learning" ? ` ${category}` : "";
    const entry = [
      `## [${entryId}]${titleSuffix}`,
      "",
      `**Logged**: ${nowIso}`,
      `**Priority**: ${priority}`,
      `**Status**: ${status}`,
      `**Area**: ${area}`,
      "",
      "### Summary",
      summary.trim(),
      "",
      "### Details",
      details.trim() || "-",
      "",
      "### Suggested Action",
      suggestedAction.trim() || "-",
      "",
      "### Metadata",
      `- Source: ${source}`,
      "---",
      ""
    ].join("\n");
    const prev = await readFile4(filePath, "utf-8").catch(() => "");
    const separator = prev.trimEnd().length > 0 ? "\n\n" : "";
    await appendFile5(filePath, `${separator}${entry}`, "utf-8");
    return entryId;
  });
  return { id, filePath };
}
var DEFAULT_LEARNINGS_TEMPLATE;
var DEFAULT_ERRORS_TEMPLATE;
var fileWriteQueues;
var init_self_improvement_files = __esm({
  "packages/core/src/self-improvement-files.ts"() {
    DEFAULT_LEARNINGS_TEMPLATE = `# Learnings

Append structured entries:
- LRN-YYYYMMDD-XXX for corrections / best practices / knowledge gaps
- Include summary, details, suggested action, metadata, and status`;
    DEFAULT_ERRORS_TEMPLATE = `# Errors

Append structured entries:
- ERR-YYYYMMDD-XXX for command/tool/integration failures
- Include symptom, context, probable cause, and prevention`;
    fileWriteQueues = /* @__PURE__ */ new Map();
  }
});
var value_exports = {};
__export(value_exports, {
  HasPropertyKey: () => HasPropertyKey,
  IsArray: () => IsArray,
  IsAsyncIterator: () => IsAsyncIterator,
  IsBigInt: () => IsBigInt,
  IsBoolean: () => IsBoolean,
  IsDate: () => IsDate,
  IsFunction: () => IsFunction,
  IsIterator: () => IsIterator,
  IsNull: () => IsNull,
  IsNumber: () => IsNumber,
  IsObject: () => IsObject,
  IsRegExp: () => IsRegExp,
  IsString: () => IsString,
  IsSymbol: () => IsSymbol,
  IsUint8Array: () => IsUint8Array,
  IsUndefined: () => IsUndefined
});
function HasPropertyKey(value, key) {
  return key in value;
}
function IsAsyncIterator(value) {
  return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.asyncIterator in value;
}
function IsArray(value) {
  return Array.isArray(value);
}
function IsBigInt(value) {
  return typeof value === "bigint";
}
function IsBoolean(value) {
  return typeof value === "boolean";
}
function IsDate(value) {
  return value instanceof globalThis.Date;
}
function IsFunction(value) {
  return typeof value === "function";
}
function IsIterator(value) {
  return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.iterator in value;
}
function IsNull(value) {
  return value === null;
}
function IsNumber(value) {
  return typeof value === "number";
}
function IsObject(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsString(value) {
  return typeof value === "string";
}
function IsSymbol(value) {
  return typeof value === "symbol";
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined(value) {
  return value === void 0;
}
var init_value = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/guard/value.mjs"() {
  }
});
function ArrayType(value) {
  return value.map((value2) => Visit(value2));
}
function DateType(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit(value[key]);
  }
  return result;
}
function Visit(value) {
  return IsArray(value) ? ArrayType(value) : IsDate(value) ? DateType(value) : IsUint8Array(value) ? Uint8ArrayType(value) : IsRegExp(value) ? RegExpType(value) : IsObject(value) ? ObjectType(value) : value;
}
function Clone(value) {
  return Visit(value);
}
var init_value2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/clone/value.mjs"() {
    init_value();
  }
});
function CloneType(schema, options) {
  return options === void 0 ? Clone(schema) : Clone({ ...options, ...schema });
}
var init_type = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/clone/type.mjs"() {
    init_value2();
  }
});
var init_clone = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/clone/index.mjs"() {
    init_type();
    init_value2();
  }
});
function IsObject2(value) {
  return value !== null && typeof value === "object";
}
function IsArray2(value) {
  return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
}
function IsUndefined2(value) {
  return value === void 0;
}
function IsNumber2(value) {
  return typeof value === "number";
}
var init_guard = __esm({
  "node_modules/@sinclair/typebox/build/esm/value/guard/guard.mjs"() {
  }
});
var init_guard2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/value/guard/index.mjs"() {
    init_guard();
  }
});
var TypeSystemPolicy;
var init_policy = __esm({
  "node_modules/@sinclair/typebox/build/esm/system/policy.mjs"() {
    init_guard2();
    (function(TypeSystemPolicy2) {
      TypeSystemPolicy2.InstanceMode = "default";
      TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
      TypeSystemPolicy2.AllowArrayObject = false;
      TypeSystemPolicy2.AllowNaN = false;
      TypeSystemPolicy2.AllowNullVoid = false;
      function IsExactOptionalProperty(value, key) {
        return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
      }
      TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
      function IsObjectLike(value) {
        const isObject = IsObject2(value);
        return TypeSystemPolicy2.AllowArrayObject ? isObject : isObject && !IsArray2(value);
      }
      TypeSystemPolicy2.IsObjectLike = IsObjectLike;
      function IsRecordLike(value) {
        return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
      }
      TypeSystemPolicy2.IsRecordLike = IsRecordLike;
      function IsNumberLike(value) {
        return TypeSystemPolicy2.AllowNaN ? IsNumber2(value) : Number.isFinite(value);
      }
      TypeSystemPolicy2.IsNumberLike = IsNumberLike;
      function IsVoidLike(value) {
        const isUndefined = IsUndefined2(value);
        return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
      }
      TypeSystemPolicy2.IsVoidLike = IsVoidLike;
    })(TypeSystemPolicy || (TypeSystemPolicy = {}));
  }
});
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray(value) ? ImmutableArray(value) : IsDate(value) ? ImmutableDate(value) : IsUint8Array(value) ? ImmutableUint8Array(value) : IsRegExp(value) ? ImmutableRegExp(value) : IsObject(value) ? ImmutableObject(value) : value;
}
var init_immutable = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/create/immutable.mjs"() {
    init_value();
  }
});
function CreateType(schema, options) {
  const result = options !== void 0 ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone(result);
    default:
      return result;
  }
}
var init_type2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/create/type.mjs"() {
    init_policy();
    init_immutable();
    init_value2();
  }
});
var init_create = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/create/index.mjs"() {
    init_type2();
  }
});
var TypeBoxError;
var init_error = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/error/error.mjs"() {
    TypeBoxError = class extends Error {
      constructor(message) {
        super(message);
      }
    };
  }
});
var init_error2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/error/index.mjs"() {
    init_error();
  }
});
var TransformKind;
var ReadonlyKind;
var OptionalKind;
var Hint;
var Kind;
var init_symbols = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/symbols/symbols.mjs"() {
    TransformKind = /* @__PURE__ */ Symbol.for("TypeBox.Transform");
    ReadonlyKind = /* @__PURE__ */ Symbol.for("TypeBox.Readonly");
    OptionalKind = /* @__PURE__ */ Symbol.for("TypeBox.Optional");
    Hint = /* @__PURE__ */ Symbol.for("TypeBox.Hint");
    Kind = /* @__PURE__ */ Symbol.for("TypeBox.Kind");
  }
});
var init_symbols2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/symbols/index.mjs"() {
    init_symbols();
  }
});
function IsReadonly(value) {
  return IsObject(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional(value) {
  return IsObject(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any");
}
function IsArgument(value) {
  return IsKindOf(value, "Argument");
}
function IsArray3(value) {
  return IsKindOf(value, "Array");
}
function IsAsyncIterator2(value) {
  return IsKindOf(value, "AsyncIterator");
}
function IsBigInt2(value) {
  return IsKindOf(value, "BigInt");
}
function IsBoolean2(value) {
  return IsKindOf(value, "Boolean");
}
function IsComputed(value) {
  return IsKindOf(value, "Computed");
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor");
}
function IsDate2(value) {
  return IsKindOf(value, "Date");
}
function IsFunction2(value) {
  return IsKindOf(value, "Function");
}
function IsInteger(value) {
  return IsKindOf(value, "Integer");
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect");
}
function IsIterator2(value) {
  return IsKindOf(value, "Iterator");
}
function IsKindOf(value, kind) {
  return IsObject(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralValue(value) {
  return IsBoolean(value) || IsNumber(value) || IsString(value);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal");
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey");
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult");
}
function IsNever(value) {
  return IsKindOf(value, "Never");
}
function IsNot(value) {
  return IsKindOf(value, "Not");
}
function IsNull2(value) {
  return IsKindOf(value, "Null");
}
function IsNumber3(value) {
  return IsKindOf(value, "Number");
}
function IsObject3(value) {
  return IsKindOf(value, "Object");
}
function IsPromise(value) {
  return IsKindOf(value, "Promise");
}
function IsRecord(value) {
  return IsKindOf(value, "Record");
}
function IsRef(value) {
  return IsKindOf(value, "Ref");
}
function IsRegExp2(value) {
  return IsKindOf(value, "RegExp");
}
function IsString2(value) {
  return IsKindOf(value, "String");
}
function IsSymbol2(value) {
  return IsKindOf(value, "Symbol");
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral");
}
function IsThis(value) {
  return IsKindOf(value, "This");
}
function IsTransform(value) {
  return IsObject(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple");
}
function IsUndefined3(value) {
  return IsKindOf(value, "Undefined");
}
function IsUnion(value) {
  return IsKindOf(value, "Union");
}
function IsUint8Array2(value) {
  return IsKindOf(value, "Uint8Array");
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown");
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void");
}
function IsKind(value) {
  return IsObject(value) && Kind in value && IsString(value[Kind]);
}
function IsSchema(value) {
  return IsAny(value) || IsArgument(value) || IsArray3(value) || IsBoolean2(value) || IsBigInt2(value) || IsAsyncIterator2(value) || IsComputed(value) || IsConstructor(value) || IsDate2(value) || IsFunction2(value) || IsInteger(value) || IsIntersect(value) || IsIterator2(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull2(value) || IsNumber3(value) || IsObject3(value) || IsPromise(value) || IsRecord(value) || IsRef(value) || IsRegExp2(value) || IsString2(value) || IsSymbol2(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined3(value) || IsUnion(value) || IsUint8Array2(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value);
}
var init_kind = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/guard/kind.mjs"() {
    init_value();
    init_symbols2();
  }
});
var type_exports = {};
__export(type_exports, {
  IsAny: () => IsAny2,
  IsArgument: () => IsArgument2,
  IsArray: () => IsArray4,
  IsAsyncIterator: () => IsAsyncIterator3,
  IsBigInt: () => IsBigInt3,
  IsBoolean: () => IsBoolean3,
  IsComputed: () => IsComputed2,
  IsConstructor: () => IsConstructor2,
  IsDate: () => IsDate3,
  IsFunction: () => IsFunction3,
  IsImport: () => IsImport,
  IsInteger: () => IsInteger2,
  IsIntersect: () => IsIntersect2,
  IsIterator: () => IsIterator3,
  IsKind: () => IsKind2,
  IsKindOf: () => IsKindOf2,
  IsLiteral: () => IsLiteral2,
  IsLiteralBoolean: () => IsLiteralBoolean,
  IsLiteralNumber: () => IsLiteralNumber,
  IsLiteralString: () => IsLiteralString,
  IsLiteralValue: () => IsLiteralValue2,
  IsMappedKey: () => IsMappedKey2,
  IsMappedResult: () => IsMappedResult2,
  IsNever: () => IsNever2,
  IsNot: () => IsNot2,
  IsNull: () => IsNull3,
  IsNumber: () => IsNumber4,
  IsObject: () => IsObject4,
  IsOptional: () => IsOptional2,
  IsPromise: () => IsPromise2,
  IsProperties: () => IsProperties,
  IsReadonly: () => IsReadonly2,
  IsRecord: () => IsRecord2,
  IsRecursive: () => IsRecursive,
  IsRef: () => IsRef2,
  IsRegExp: () => IsRegExp3,
  IsSchema: () => IsSchema2,
  IsString: () => IsString3,
  IsSymbol: () => IsSymbol3,
  IsTemplateLiteral: () => IsTemplateLiteral2,
  IsThis: () => IsThis2,
  IsTransform: () => IsTransform2,
  IsTuple: () => IsTuple2,
  IsUint8Array: () => IsUint8Array3,
  IsUndefined: () => IsUndefined4,
  IsUnion: () => IsUnion2,
  IsUnionLiteral: () => IsUnionLiteral,
  IsUnknown: () => IsUnknown2,
  IsUnsafe: () => IsUnsafe2,
  IsVoid: () => IsVoid2,
  TypeGuardUnknownTypeError: () => TypeGuardUnknownTypeError
});
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString(value))
    return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema2(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined(value) || IsBigInt(value);
}
function IsOptionalNumber(value) {
  return IsUndefined(value) || IsNumber(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined(value) || IsBoolean(value);
}
function IsOptionalString(value) {
  return IsUndefined(value) || IsString(value);
}
function IsOptionalPattern(value) {
  return IsUndefined(value) || IsString(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined(value) || IsString(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined(value) || IsSchema2(value);
}
function IsReadonly2(value) {
  return IsObject(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional2(value) {
  return IsObject(value) && value[OptionalKind] === "Optional";
}
function IsAny2(value) {
  return IsKindOf2(value, "Any") && IsOptionalString(value.$id);
}
function IsArgument2(value) {
  return IsKindOf2(value, "Argument") && IsNumber(value.index);
}
function IsArray4(value) {
  return IsKindOf2(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema2(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator3(value) {
  return IsKindOf2(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsBigInt3(value) {
  return IsKindOf2(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean3(value) {
  return IsKindOf2(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed2(value) {
  return IsKindOf2(value, "Computed") && IsString(value.target) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema));
}
function IsConstructor2(value) {
  return IsKindOf2(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsDate3(value) {
  return IsKindOf2(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction3(value) {
  return IsKindOf2(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsImport(value) {
  return IsKindOf2(value, "Import") && HasPropertyKey(value, "$defs") && IsObject(value.$defs) && IsProperties(value.$defs) && HasPropertyKey(value, "$ref") && IsString(value.$ref) && value.$ref in value.$defs;
}
function IsInteger2(value) {
  return IsKindOf2(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema2(schema));
}
function IsIntersect2(value) {
  return IsKindOf2(value, "Intersect") && (IsString(value.type) && value.type !== "object" ? false : true) && IsArray(value.allOf) && value.allOf.every((schema) => IsSchema2(schema) && !IsTransform2(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator3(value) {
  return IsKindOf2(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsKindOf2(value, kind) {
  return IsObject(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralString(value) {
  return IsLiteral2(value) && IsString(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral2(value) && IsNumber(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral2(value) && IsBoolean(value.const);
}
function IsLiteral2(value) {
  return IsKindOf2(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue2(value.const);
}
function IsLiteralValue2(value) {
  return IsBoolean(value) || IsNumber(value) || IsString(value);
}
function IsMappedKey2(value) {
  return IsKindOf2(value, "MappedKey") && IsArray(value.keys) && value.keys.every((key) => IsNumber(key) || IsString(key));
}
function IsMappedResult2(value) {
  return IsKindOf2(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever2(value) {
  return IsKindOf2(value, "Never") && IsObject(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot2(value) {
  return IsKindOf2(value, "Not") && IsSchema2(value.not);
}
function IsNull3(value) {
  return IsKindOf2(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber4(value) {
  return IsKindOf2(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject4(value) {
  return IsKindOf2(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise2(value) {
  return IsKindOf2(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema2(value.item);
}
function IsRecord2(value) {
  return IsKindOf2(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject(schema.patternProperties) && IsSchema2(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRecursive(value) {
  return IsObject(value) && Hint in value && value[Hint] === "Recursive";
}
function IsRef2(value) {
  return IsKindOf2(value, "Ref") && IsOptionalString(value.$id) && IsString(value.$ref);
}
function IsRegExp3(value) {
  return IsKindOf2(value, "RegExp") && IsOptionalString(value.$id) && IsString(value.source) && IsString(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString3(value) {
  return IsKindOf2(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol3(value) {
  return IsKindOf2(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral2(value) {
  return IsKindOf2(value, "TemplateLiteral") && value.type === "string" && IsString(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis2(value) {
  return IsKindOf2(value, "This") && IsOptionalString(value.$id) && IsString(value.$ref);
}
function IsTransform2(value) {
  return IsObject(value) && TransformKind in value;
}
function IsTuple2(value) {
  return IsKindOf2(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber(value.minItems) && IsNumber(value.maxItems) && value.minItems === value.maxItems && // empty
  (IsUndefined(value.items) && IsUndefined(value.additionalItems) && value.minItems === 0 || IsArray(value.items) && value.items.every((schema) => IsSchema2(schema)));
}
function IsUndefined4(value) {
  return IsKindOf2(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnionLiteral(value) {
  return IsUnion2(value) && value.anyOf.every((schema) => IsLiteralString(schema) || IsLiteralNumber(schema));
}
function IsUnion2(value) {
  return IsKindOf2(value, "Union") && IsOptionalString(value.$id) && IsObject(value) && IsArray(value.anyOf) && value.anyOf.every((schema) => IsSchema2(schema));
}
function IsUint8Array3(value) {
  return IsKindOf2(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown2(value) {
  return IsKindOf2(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe2(value) {
  return IsKindOf2(value, "Unsafe");
}
function IsVoid2(value) {
  return IsKindOf2(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind2(value) {
  return IsObject(value) && Kind in value && IsString(value[Kind]) && !KnownTypes.includes(value[Kind]);
}
function IsSchema2(value) {
  return IsObject(value) && (IsAny2(value) || IsArgument2(value) || IsArray4(value) || IsBoolean3(value) || IsBigInt3(value) || IsAsyncIterator3(value) || IsComputed2(value) || IsConstructor2(value) || IsDate3(value) || IsFunction3(value) || IsInteger2(value) || IsIntersect2(value) || IsIterator3(value) || IsLiteral2(value) || IsMappedKey2(value) || IsMappedResult2(value) || IsNever2(value) || IsNot2(value) || IsNull3(value) || IsNumber4(value) || IsObject4(value) || IsPromise2(value) || IsRecord2(value) || IsRef2(value) || IsRegExp3(value) || IsString3(value) || IsSymbol3(value) || IsTemplateLiteral2(value) || IsThis2(value) || IsTuple2(value) || IsUndefined4(value) || IsUnion2(value) || IsUint8Array3(value) || IsUnknown2(value) || IsUnsafe2(value) || IsVoid2(value) || IsKind2(value));
}
var TypeGuardUnknownTypeError;
var KnownTypes;
var init_type3 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/guard/type.mjs"() {
    init_value();
    init_symbols2();
    init_error2();
    TypeGuardUnknownTypeError = class extends TypeBoxError {
    };
    KnownTypes = [
      "Argument",
      "Any",
      "Array",
      "AsyncIterator",
      "BigInt",
      "Boolean",
      "Computed",
      "Constructor",
      "Date",
      "Enum",
      "Function",
      "Integer",
      "Intersect",
      "Iterator",
      "Literal",
      "MappedKey",
      "MappedResult",
      "Not",
      "Null",
      "Number",
      "Object",
      "Promise",
      "Record",
      "Ref",
      "RegExp",
      "String",
      "Symbol",
      "TemplateLiteral",
      "This",
      "Tuple",
      "Undefined",
      "Union",
      "Uint8Array",
      "Unknown",
      "Void"
    ];
  }
});
var init_guard3 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/guard/index.mjs"() {
    init_kind();
    init_type3();
    init_value();
  }
});
var init_helpers = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/helpers/helpers.mjs"() {
  }
});
var init_helpers2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/helpers/index.mjs"() {
    init_helpers();
  }
});
var PatternBoolean;
var PatternNumber;
var PatternString;
var PatternNever;
var PatternBooleanExact;
var PatternNumberExact;
var PatternStringExact;
var PatternNeverExact;
var init_patterns = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/patterns/patterns.mjs"() {
    PatternBoolean = "(true|false)";
    PatternNumber = "(0|[1-9][0-9]*)";
    PatternString = "(.*)";
    PatternNever = "(?!.*)";
    PatternBooleanExact = `^${PatternBoolean}$`;
    PatternNumberExact = `^${PatternNumber}$`;
    PatternStringExact = `^${PatternString}$`;
    PatternNeverExact = `^${PatternNever}$`;
  }
});
var init_patterns2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/patterns/index.mjs"() {
    init_patterns();
  }
});
var init_format = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/registry/format.mjs"() {
  }
});
var init_type4 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/registry/type.mjs"() {
  }
});
var init_registry = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/registry/index.mjs"() {
    init_format();
    init_type4();
  }
});
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}
var init_set = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/sets/set.mjs"() {
  }
});
var init_sets = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/sets/index.mjs"() {
    init_set();
  }
});
function Any(options) {
  return CreateType({ [Kind]: "Any" }, options);
}
var init_any = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/any/any.mjs"() {
    init_create();
    init_symbols2();
  }
});
var init_any2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/any/index.mjs"() {
    init_any();
  }
});
function Array2(items, options) {
  return CreateType({ [Kind]: "Array", type: "array", items }, options);
}
var init_array = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/array/array.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_array2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/array/index.mjs"() {
    init_array();
  }
});
function Argument(index) {
  return CreateType({ [Kind]: "Argument", index });
}
var init_argument = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/argument/argument.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_argument2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/argument/index.mjs"() {
    init_argument();
  }
});
function AsyncIterator(items, options) {
  return CreateType({ [Kind]: "AsyncIterator", type: "AsyncIterator", items }, options);
}
var init_async_iterator = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/async-iterator/async-iterator.mjs"() {
    init_symbols2();
    init_type2();
  }
});
var init_async_iterator2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/async-iterator/index.mjs"() {
    init_async_iterator();
  }
});
function Computed(target, parameters, options) {
  return CreateType({ [Kind]: "Computed", target, parameters }, options);
}
var init_computed = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/computed/computed.mjs"() {
    init_create();
    init_symbols();
  }
});
var init_computed2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/computed/index.mjs"() {
    init_computed();
  }
});
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}
var init_discard = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/discard/discard.mjs"() {
  }
});
var init_discard2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/discard/index.mjs"() {
    init_discard();
  }
});
function Never(options) {
  return CreateType({ [Kind]: "Never", not: {} }, options);
}
var init_never = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/never/never.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_never2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/never/index.mjs"() {
    init_never();
  }
});
var init_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-key.mjs"() {
  }
});
function MappedResult(properties) {
  return CreateType({
    [Kind]: "MappedResult",
    properties
  });
}
var init_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-result.mjs"() {
    init_type2();
    init_symbols2();
  }
});
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind]: "Constructor", type: "Constructor", parameters, returns }, options);
}
var init_constructor = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/constructor/constructor.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_constructor2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/constructor/index.mjs"() {
    init_constructor();
  }
});
function Function2(parameters, returns, options) {
  return CreateType({ [Kind]: "Function", type: "Function", parameters, returns }, options);
}
var init_function = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/function/function.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_function2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/function/index.mjs"() {
    init_function();
  }
});
function UnionCreate(T, options) {
  return CreateType({ [Kind]: "Union", anyOf: T }, options);
}
var init_union_create = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/union/union-create.mjs"() {
    init_type2();
    init_symbols2();
  }
});
function IsUnionOptional(types) {
  return types.some((type) => IsOptional(type));
}
function RemoveOptionalFromRest(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType(left) : left);
}
function RemoveOptionalFromType(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types, options) {
  const isOptional = IsUnionOptional(types);
  return isOptional ? Optional(UnionCreate(RemoveOptionalFromRest(types), options)) : UnionCreate(RemoveOptionalFromRest(types), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}
var init_union_evaluated = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/union/union-evaluated.mjs"() {
    init_type2();
    init_symbols2();
    init_discard2();
    init_never2();
    init_optional2();
    init_union_create();
    init_kind();
  }
});
var init_union_type = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/union/union-type.mjs"() {
  }
});
function Union(types, options) {
  return types.length === 0 ? Never(options) : types.length === 1 ? CreateType(types[0], options) : UnionCreate(types, options);
}
var init_union = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/union/union.mjs"() {
    init_never2();
    init_type2();
    init_union_create();
  }
});
var init_union2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/union/index.mjs"() {
    init_union_evaluated();
    init_union_type();
    init_union();
  }
});
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index; scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index; scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
  }
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}
var TemplateLiteralParserError;
var init_parse = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/parse.mjs"() {
    init_error2();
    TemplateLiteralParserError = class extends TypeBoxError {
    };
  }
});
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}
var TemplateLiteralFiniteError;
var init_finite = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/finite.mjs"() {
    init_parse();
    init_error2();
    TemplateLiteralFiniteError = class extends TypeBoxError {
    };
  }
});
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}
var TemplateLiteralGenerateError;
var init_generate = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/generate.mjs"() {
    init_finite();
    init_parse();
    init_error2();
    TemplateLiteralGenerateError = class extends TypeBoxError {
    };
  }
});
function Literal(value, options) {
  return CreateType({
    [Kind]: "Literal",
    const: value,
    type: typeof value
  }, options);
}
var init_literal = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/literal/literal.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_literal2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/literal/index.mjs"() {
    init_literal();
  }
});
function Boolean2(options) {
  return CreateType({ [Kind]: "Boolean", type: "boolean" }, options);
}
var init_boolean = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/boolean/boolean.mjs"() {
    init_symbols2();
    init_create();
  }
});
var init_boolean2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/boolean/index.mjs"() {
    init_boolean();
  }
});
function BigInt(options) {
  return CreateType({ [Kind]: "BigInt", type: "bigint" }, options);
}
var init_bigint = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/bigint/bigint.mjs"() {
    init_symbols2();
    init_create();
  }
});
var init_bigint2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/bigint/index.mjs"() {
    init_bigint();
  }
});
function Number2(options) {
  return CreateType({ [Kind]: "Number", type: "number" }, options);
}
var init_number = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/number/number.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_number2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/number/index.mjs"() {
    init_number();
  }
});
function String2(options) {
  return CreateType({ [Kind]: "String", type: "string" }, options);
}
var init_string = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/string/string.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_string2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/string/index.mjs"() {
    init_string();
  }
});
function* FromUnion(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean2() : trim === "number" ? yield Number2() : trim === "bigint" ? yield BigInt() : trim === "string" ? yield String2() : yield (() => {
    const literals = trim.split("|").map((literal) => Literal(literal.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2; i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0; i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}
var init_syntax = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/syntax.mjs"() {
    init_literal2();
    init_boolean2();
    init_bigint2();
    init_number2();
    init_string2();
    init_union2();
    init_never2();
  }
});
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit2(schema, acc) {
  return IsTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion(schema) ? `(${schema.anyOf.map((schema2) => Visit2(schema2, acc)).join("|")})` : IsNumber3(schema) ? `${acc}${PatternNumber}` : IsInteger(schema) ? `${acc}${PatternNumber}` : IsBigInt2(schema) ? `${acc}${PatternNumber}` : IsString2(schema) ? `${acc}${PatternString}` : IsLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean2(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit2(schema, "")).join("")}$`;
}
var TemplateLiteralPatternError;
var init_pattern = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/pattern.mjs"() {
    init_patterns2();
    init_symbols2();
    init_error2();
    init_kind();
    TemplateLiteralPatternError = class extends TypeBoxError {
    };
  }
});
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}
var init_union3 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/union.mjs"() {
    init_union2();
    init_literal2();
    init_generate();
  }
});
function TemplateLiteral(unresolved, options) {
  const pattern = IsString(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind]: "TemplateLiteral", type: "string", pattern }, options);
}
var init_template_literal = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/template-literal.mjs"() {
    init_type2();
    init_syntax();
    init_pattern();
    init_value();
    init_symbols2();
  }
});
var init_template_literal2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/template-literal/index.mjs"() {
    init_finite();
    init_generate();
    init_syntax();
    init_parse();
    init_pattern();
    init_union3();
    init_template_literal();
  }
});
function FromTemplateLiteral(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion2(types) {
  const result = [];
  for (const type of types)
    result.push(...IndexPropertyKeys(type));
  return result;
}
function FromLiteral(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type) {
  return [...new Set(IsTemplateLiteral(type) ? FromTemplateLiteral(type) : IsUnion(type) ? FromUnion2(type.anyOf) : IsLiteral(type) ? FromLiteral(type.const) : IsNumber3(type) ? ["[number]"] : IsInteger(type) ? ["[number]"] : [])];
}
var init_indexed_property_keys = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-property-keys.mjs"() {
    init_template_literal2();
    init_kind();
  }
});
function FromProperties(type, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult(type, mappedResult, options) {
  return FromProperties(type, mappedResult.properties, options);
}
function IndexFromMappedResult(type, mappedResult, options) {
  const properties = FromMappedResult(type, mappedResult, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-result.mjs"() {
    init_mapped2();
    init_indexed_property_keys();
    init_indexed2();
  }
});
function FromRest(types, key) {
  return types.map((type) => IndexFromPropertyKey(type, key));
}
function FromIntersectRest(types) {
  return types.filter((type) => !IsNever(type));
}
function FromIntersect(types, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest(types, key)));
}
function FromUnionRest(types) {
  return types.some((L) => IsNever(L)) ? [] : types;
}
function FromUnion3(types, key) {
  return UnionEvaluated(FromUnionRest(FromRest(types, key)));
}
function FromTuple(types, key) {
  return key in types ? types[key] : key === "[number]" ? UnionEvaluated(types) : Never();
}
function FromArray(type, key) {
  return key === "[number]" ? type : Never();
}
function FromProperty(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type, propertyKey) {
  return IsIntersect(type) ? FromIntersect(type.allOf, propertyKey) : IsUnion(type) ? FromUnion3(type.anyOf, propertyKey) : IsTuple(type) ? FromTuple(type.items ?? [], propertyKey) : IsArray3(type) ? FromArray(type.items, propertyKey) : IsObject3(type) ? FromProperty(type.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type, propertyKey));
}
function FromSchema(type, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type, propertyKeys));
}
function Index(type, key, options) {
  if (IsRef(type) || IsRef(key)) {
    const error = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema(type) || !IsSchema(key))
      throw new TypeBoxError(error);
    return Computed("Index", [type, key]);
  }
  if (IsMappedResult(key))
    return IndexFromMappedResult(type, key, options);
  if (IsMappedKey(key))
    return IndexFromMappedKey(type, key, options);
  return CreateType(IsSchema(key) ? FromSchema(type, IndexPropertyKeys(key)) : FromSchema(type, key), options);
}
var init_indexed = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/indexed/indexed.mjs"() {
    init_type2();
    init_error2();
    init_computed2();
    init_never2();
    init_intersect2();
    init_union2();
    init_indexed_property_keys();
    init_indexed_from_mapped_key();
    init_indexed_from_mapped_result();
    init_kind();
  }
});
function MappedIndexPropertyKey(type, key, options) {
  return { [key]: Index(type, [key], Clone(options)) };
}
function MappedIndexPropertyKeys(type, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type, left, options) };
  }, {});
}
function MappedIndexProperties(type, mappedKey, options) {
  return MappedIndexPropertyKeys(type, mappedKey.keys, options);
}
function IndexFromMappedKey(type, mappedKey, options) {
  const properties = MappedIndexProperties(type, mappedKey, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-key.mjs"() {
    init_indexed();
    init_mapped2();
    init_value2();
  }
});
var init_indexed2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/indexed/index.mjs"() {
    init_indexed_from_mapped_key();
    init_indexed_from_mapped_result();
    init_indexed_property_keys();
    init_indexed();
  }
});
function Iterator(items, options) {
  return CreateType({ [Kind]: "Iterator", type: "Iterator", items }, options);
}
var init_iterator = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/iterator/iterator.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_iterator2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/iterator/index.mjs"() {
    init_iterator();
  }
});
function RequiredArray(properties) {
  return globalThis.Object.keys(properties).filter((key) => !IsOptional(properties[key]));
}
function _Object(properties, options) {
  const required = RequiredArray(properties);
  const schema = required.length > 0 ? { [Kind]: "Object", type: "object", required, properties } : { [Kind]: "Object", type: "object", properties };
  return CreateType(schema, options);
}
var Object2;
var init_object = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/object/object.mjs"() {
    init_type2();
    init_symbols2();
    init_kind();
    Object2 = _Object;
  }
});
var init_object2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/object/index.mjs"() {
    init_object();
  }
});
function Promise2(item, options) {
  return CreateType({ [Kind]: "Promise", type: "Promise", item }, options);
}
var init_promise = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/promise/promise.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_promise2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/promise/index.mjs"() {
    init_promise();
  }
});
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}
var init_readonly = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/readonly/readonly.mjs"() {
    init_type2();
    init_symbols2();
    init_discard2();
    init_readonly_from_mapped_result();
    init_kind();
  }
});
function FromProperties2(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult2(R, F) {
  return FromProperties2(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult2(R, F);
  return MappedResult(P);
}
var init_readonly_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/readonly/readonly-from-mapped-result.mjs"() {
    init_mapped2();
    init_readonly();
  }
});
var init_readonly2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/readonly/index.mjs"() {
    init_readonly_from_mapped_result();
    init_readonly();
  }
});
function Tuple(types, options) {
  return CreateType(types.length > 0 ? { [Kind]: "Tuple", type: "array", items: types, additionalItems: false, minItems: types.length, maxItems: types.length } : { [Kind]: "Tuple", type: "array", minItems: types.length, maxItems: types.length }, options);
}
var init_tuple = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/tuple/tuple.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_tuple2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/tuple/index.mjs"() {
    init_tuple();
  }
});
function FromMappedResult3(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult3(K, R);
}
function FromRest2(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties3(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return (
    // unevaluated modifier types
    IsOptional(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : (
      // unevaluated mapped types
      IsMappedResult(T) ? FromMappedResult3(K, T.properties) : IsMappedKey(T) ? FromMappedKey(K, T.keys) : (
        // unevaluated types
        IsConstructor(T) ? Constructor(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction2(T) ? Function2(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator2(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator2(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect(T) ? Intersect(FromRest2(K, T.allOf), options) : IsUnion(T) ? Union(FromRest2(K, T.anyOf), options) : IsTuple(T) ? Tuple(FromRest2(K, T.items ?? []), options) : IsObject3(T) ? Object2(FromProperties3(K, T.properties), options) : IsArray3(T) ? Array2(FromSchemaType(K, T.items), options) : IsPromise(T) ? Promise2(FromSchemaType(K, T.item), options) : T
      )
    )
  );
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map, options) {
  const K = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const RT = map({ [Kind]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object2(R, options);
}
var init_mapped = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/mapped/mapped.mjs"() {
    init_symbols2();
    init_discard2();
    init_array2();
    init_async_iterator2();
    init_constructor2();
    init_function2();
    init_indexed2();
    init_intersect2();
    init_iterator2();
    init_literal2();
    init_object2();
    init_optional2();
    init_promise2();
    init_readonly2();
    init_tuple2();
    init_union2();
    init_sets();
    init_mapped_result();
    init_kind();
  }
});
var init_mapped2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/mapped/index.mjs"() {
    init_mapped_key();
    init_mapped_result();
    init_mapped();
  }
});
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}
var init_optional = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/optional/optional.mjs"() {
    init_type2();
    init_symbols2();
    init_discard2();
    init_optional_from_mapped_result();
    init_kind();
  }
});
function FromProperties4(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult4(R, F) {
  return FromProperties4(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult4(R, F);
  return MappedResult(P);
}
var init_optional_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/optional/optional-from-mapped-result.mjs"() {
    init_mapped2();
    init_optional();
  }
});
var init_optional2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/optional/index.mjs"() {
    init_optional_from_mapped_result();
    init_optional();
  }
});
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject3(schema));
  const clonedUnevaluatedProperties = IsSchema(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind]: "Intersect", allOf: T }, options);
}
var init_intersect_create = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-create.mjs"() {
    init_type2();
    init_symbols2();
    init_kind();
  }
});
function IsIntersectOptional(types) {
  return types.every((left) => IsOptional(left));
}
function RemoveOptionalFromType2(type) {
  return Discard(type, [OptionalKind]);
}
function RemoveOptionalFromRest2(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType2(left) : left);
}
function ResolveIntersect(types, options) {
  return IsIntersectOptional(types) ? Optional(IntersectCreate(RemoveOptionalFromRest2(types), options)) : IntersectCreate(RemoveOptionalFromRest2(types), options);
}
function IntersectEvaluated(types, options = {}) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types, options);
}
var init_intersect_evaluated = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-evaluated.mjs"() {
    init_symbols2();
    init_type2();
    init_discard2();
    init_never2();
    init_optional2();
    init_intersect_create();
    init_kind();
  }
});
var init_intersect_type = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-type.mjs"() {
  }
});
function Intersect(types, options) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types, options);
}
var init_intersect = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intersect/intersect.mjs"() {
    init_type2();
    init_never2();
    init_intersect_create();
    init_kind();
  }
});
var init_intersect2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intersect/index.mjs"() {
    init_intersect_evaluated();
    init_intersect_type();
    init_intersect();
  }
});
function Ref(...args) {
  const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind]: "Ref", $ref }, options);
}
var init_ref = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/ref/ref.mjs"() {
    init_error2();
    init_type2();
    init_symbols2();
  }
});
var init_ref2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/ref/index.mjs"() {
    init_ref();
  }
});
function FromComputed(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect2(types) {
  return Intersect(FromRest3(types));
}
function FromUnion4(types) {
  return Union(FromRest3(types));
}
function FromPromise(type) {
  return Awaited(type);
}
function FromRest3(types) {
  return types.map((type) => Awaited(type));
}
function Awaited(type, options) {
  return CreateType(IsComputed(type) ? FromComputed(type.target, type.parameters) : IsIntersect(type) ? FromIntersect2(type.allOf) : IsUnion(type) ? FromUnion4(type.anyOf) : IsPromise(type) ? FromPromise(type.item) : IsRef(type) ? FromRef(type.$ref) : type, options);
}
var init_awaited = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/awaited/awaited.mjs"() {
    init_type2();
    init_computed2();
    init_intersect2();
    init_union2();
    init_ref2();
    init_kind();
  }
});
var init_awaited2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/awaited/index.mjs"() {
    init_awaited();
  }
});
function FromRest4(types) {
  const result = [];
  for (const L of types)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect3(types) {
  const propertyKeysArray = FromRest4(types);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion5(types) {
  const propertyKeysArray = FromRest4(types);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple2(types) {
  return types.map((_, indexer) => indexer.toString());
}
function FromArray2(_) {
  return ["[number]"];
}
function FromProperties5(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type) {
  return IsIntersect(type) ? FromIntersect3(type.allOf) : IsUnion(type) ? FromUnion5(type.anyOf) : IsTuple(type) ? FromTuple2(type.items ?? []) : IsArray3(type) ? FromArray2(type.items) : IsObject3(type) ? FromProperties5(type.properties) : IsRecord(type) ? FromPatternProperties(type.patternProperties) : [];
}
var includePatternProperties;
var init_keyof_property_keys = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-keys.mjs"() {
    init_sets();
    init_kind();
    includePatternProperties = false;
  }
});
function FromComputed2(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef2($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type, options) {
  const propertyKeys = KeyOfPropertyKeys(type);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number2() : Literal(L));
}
function KeyOf(type, options) {
  return IsComputed(type) ? FromComputed2(type.target, type.parameters) : IsRef(type) ? FromRef2(type.$ref) : IsMappedResult(type) ? KeyOfFromMappedResult(type, options) : KeyOfFromType(type, options);
}
var init_keyof = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/keyof/keyof.mjs"() {
    init_type2();
    init_literal2();
    init_number2();
    init_computed2();
    init_ref2();
    init_keyof_property_keys();
    init_union2();
    init_keyof_from_mapped_result();
    init_kind();
  }
});
function FromProperties6(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone(options));
  return result;
}
function FromMappedResult5(mappedResult, options) {
  return FromProperties6(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult5(mappedResult, options);
  return MappedResult(properties);
}
var init_keyof_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-from-mapped-result.mjs"() {
    init_mapped2();
    init_keyof();
    init_value2();
  }
});
var init_keyof_property_entries = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-entries.mjs"() {
  }
});
var init_keyof2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/keyof/index.mjs"() {
    init_keyof_from_mapped_result();
    init_keyof_property_entries();
    init_keyof_property_keys();
    init_keyof();
  }
});
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object2(P, options);
  return R;
}
var init_composite = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/composite/composite.mjs"() {
    init_intersect2();
    init_indexed2();
    init_keyof2();
    init_object2();
    init_sets();
    init_kind();
  }
});
var init_composite2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/composite/index.mjs"() {
    init_composite();
  }
});
function Date2(options) {
  return CreateType({ [Kind]: "Date", type: "Date" }, options);
}
var init_date = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/date/date.mjs"() {
    init_symbols2();
    init_type2();
  }
});
var init_date2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/date/index.mjs"() {
    init_date();
  }
});
function Null(options) {
  return CreateType({ [Kind]: "Null", type: "null" }, options);
}
var init_null = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/null/null.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_null2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/null/index.mjs"() {
    init_null();
  }
});
function Symbol2(options) {
  return CreateType({ [Kind]: "Symbol", type: "symbol" }, options);
}
var init_symbol = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/symbol/symbol.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_symbol2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/symbol/index.mjs"() {
    init_symbol();
  }
});
function Undefined(options) {
  return CreateType({ [Kind]: "Undefined", type: "undefined" }, options);
}
var init_undefined = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/undefined/undefined.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_undefined2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/undefined/index.mjs"() {
    init_undefined();
  }
});
function Uint8Array2(options) {
  return CreateType({ [Kind]: "Uint8Array", type: "Uint8Array" }, options);
}
var init_uint8array = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/uint8array/uint8array.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_uint8array2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/uint8array/index.mjs"() {
    init_uint8array();
  }
});
function Unknown(options) {
  return CreateType({ [Kind]: "Unknown" }, options);
}
var init_unknown = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/unknown/unknown.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_unknown2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/unknown/index.mjs"() {
    init_unknown();
  }
});
function FromArray3(T) {
  return T.map((L) => FromValue(L, false));
}
function FromProperties7(value) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value))
    Acc[K] = Readonly(FromValue(value[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue(value, root) {
  return IsAsyncIterator(value) ? ConditionalReadonly(Any(), root) : IsIterator(value) ? ConditionalReadonly(Any(), root) : IsArray(value) ? Readonly(Tuple(FromArray3(value))) : IsUint8Array(value) ? Uint8Array2() : IsDate(value) ? Date2() : IsObject(value) ? ConditionalReadonly(Object2(FromProperties7(value)), root) : IsFunction(value) ? ConditionalReadonly(Function2([], Unknown()), root) : IsUndefined(value) ? Undefined() : IsNull(value) ? Null() : IsSymbol(value) ? Symbol2() : IsBigInt(value) ? BigInt() : IsNumber(value) ? Literal(value) : IsBoolean(value) ? Literal(value) : IsString(value) ? Literal(value) : Object2({});
}
function Const(T, options) {
  return CreateType(FromValue(T, true), options);
}
var init_const = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/const/const.mjs"() {
    init_any2();
    init_bigint2();
    init_date2();
    init_function2();
    init_literal2();
    init_null2();
    init_object2();
    init_symbol2();
    init_tuple2();
    init_readonly2();
    init_undefined2();
    init_uint8array2();
    init_unknown2();
    init_create();
    init_value();
  }
});
var init_const2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/const/index.mjs"() {
    init_const();
  }
});
function ConstructorParameters(schema, options) {
  return IsConstructor(schema) ? Tuple(schema.parameters, options) : Never(options);
}
var init_constructor_parameters = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/constructor-parameters.mjs"() {
    init_tuple2();
    init_never2();
    init_kind();
  }
});
var init_constructor_parameters2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/index.mjs"() {
    init_constructor_parameters();
  }
});
function Enum(item, options) {
  if (IsUndefined(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value) => Literal(value));
  return Union(anyOf, { ...options, [Hint]: "Enum" });
}
var init_enum = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/enum/enum.mjs"() {
    init_literal2();
    init_symbols2();
    init_union2();
    init_value();
  }
});
var init_enum2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/enum/index.mjs"() {
    init_enum();
  }
});
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message) {
  throw new ExtendsResolverError(message);
}
function IsStructuralRight(right) {
  return type_exports.IsNever(right) || type_exports.IsIntersect(right) || type_exports.IsUnion(right) || type_exports.IsUnknown(right) || type_exports.IsAny(right);
}
function StructuralRight(left, right) {
  return type_exports.IsNever(right) ? FromNeverRight(left, right) : type_exports.IsIntersect(right) ? FromIntersectRight(left, right) : type_exports.IsUnion(right) ? FromUnionRight(left, right) : type_exports.IsUnknown(right) ? FromUnknownRight(left, right) : type_exports.IsAny(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny(left, right) {
  return type_exports.IsIntersect(right) ? FromIntersectRight(left, right) : type_exports.IsUnion(right) && right.anyOf.some((schema) => type_exports.IsAny(schema) || type_exports.IsUnknown(schema)) ? ExtendsResult.True : type_exports.IsUnion(right) ? ExtendsResult.Union : type_exports.IsUnknown(right) ? ExtendsResult.True : type_exports.IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return type_exports.IsUnknown(left) ? ExtendsResult.False : type_exports.IsAny(left) ? ExtendsResult.Union : type_exports.IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray4(left, right) {
  return type_exports.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !type_exports.IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromAsyncIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !type_exports.IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromBigInt(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return type_exports.IsLiteralBoolean(left) ? ExtendsResult.True : type_exports.IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : !type_exports.IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromDate(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : !type_exports.IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit3(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return type_exports.IsLiteral(left) && value_exports.IsNumber(left.const) ? ExtendsResult.True : type_exports.IsNumber(left) || type_exports.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger(left, right) {
  return type_exports.IsInteger(right) || type_exports.IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit3(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect4(left, right) {
  return left.allOf.some((schema) => Visit3(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !type_exports.IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.items, right.items));
}
function FromLiteral2(left, right) {
  return type_exports.IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsString(right) ? FromStringRight(left, right) : type_exports.IsNumber(right) ? FromNumberRight(left, right) : type_exports.IsInteger(right) ? FromIntegerRight(left, right) : type_exports.IsBoolean(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!type_exports.IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot(left, right) {
  return type_exports.IsNot(left) ? Visit3(UnwrapTNot(left), right) : type_exports.IsNot(right) ? Visit3(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return type_exports.IsLiteralNumber(left) ? ExtendsResult.True : type_exports.IsNumber(left) || type_exports.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsInteger(right) || type_exports.IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && type_exports.IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (type_exports.IsString(schema.properties.description.anyOf[0]) && type_exports.IsUndefined(schema.properties.description.anyOf[1]) || type_exports.IsString(schema.properties.description.anyOf[1]) && type_exports.IsUndefined(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit3(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit3(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function2([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit3(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit3(left, right) === ExtendsResult.False ? ExtendsResult.False : type_exports.IsOptional(left) && !type_exports.IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return type_exports.IsUnknown(left) ? ExtendsResult.False : type_exports.IsAny(left) ? ExtendsResult.Union : type_exports.IsNever(left) || type_exports.IsLiteralString(left) && IsObjectStringLike(right) || type_exports.IsLiteralNumber(left) && IsObjectNumberLike(right) || type_exports.IsLiteralBoolean(left) && IsObjectBooleanLike(right) || type_exports.IsSymbol(left) && IsObjectSymbolLike(right) || type_exports.IsBigInt(left) && IsObjectBigIntLike(right) || type_exports.IsString(left) && IsObjectStringLike(right) || type_exports.IsSymbol(left) && IsObjectSymbolLike(right) || type_exports.IsNumber(left) && IsObjectNumberLike(right) || type_exports.IsInteger(left) && IsObjectNumberLike(right) || type_exports.IsBoolean(left) && IsObjectBooleanLike(right) || type_exports.IsUint8Array(left) && IsObjectUint8ArrayLike(right) || type_exports.IsDate(left) && IsObjectDateLike(right) || type_exports.IsConstructor(left) && IsObjectConstructorLike(right) || type_exports.IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : type_exports.IsRecord(left) && type_exports.IsString(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : type_exports.IsRecord(left) && type_exports.IsNumber(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : !type_exports.IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !type_exports.IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (type_exports.IsOptional(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise2(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !type_exports.IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit3(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number2() : PatternStringExact in schema.patternProperties ? String2() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : PatternStringExact in schema.patternProperties ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return type_exports.IsLiteralString(left) && type_exports.IsNumber(Key) && IntoBooleanResult(Visit3(left, Value)) === ExtendsResult.True ? ExtendsResult.True : type_exports.IsUint8Array(left) && type_exports.IsNumber(Key) ? Visit3(left, Value) : type_exports.IsString(left) && type_exports.IsNumber(Key) ? Visit3(left, Value) : type_exports.IsArray(left) && type_exports.IsNumber(Key) ? Visit3(left, Value) : type_exports.IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : !type_exports.IsRecord(right) ? ExtendsResult.False : Visit3(RecordValue(left), RecordValue(right));
}
function FromRegExp(left, right) {
  const L = type_exports.IsRegExp(left) ? String2() : left;
  const R = type_exports.IsRegExp(right) ? String2() : right;
  return Visit3(L, R);
}
function FromStringRight(left, right) {
  return type_exports.IsLiteral(left) && value_exports.IsString(left.const) ? ExtendsResult.True : type_exports.IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral2(left, right) {
  return type_exports.IsTemplateLiteral(left) ? Visit3(TemplateLiteralToUnion(left), right) : type_exports.IsTemplateLiteral(right) ? Visit3(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return type_exports.IsArray(right) && left.items !== void 0 && left.items.every((schema) => Visit3(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return type_exports.IsNever(left) ? ExtendsResult.True : type_exports.IsUnknown(left) ? ExtendsResult.False : type_exports.IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : type_exports.IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !type_exports.IsTuple(right) ? ExtendsResult.False : value_exports.IsUndefined(left.items) && !value_exports.IsUndefined(right.items) || !value_exports.IsUndefined(left.items) && value_exports.IsUndefined(right.items) ? ExtendsResult.False : value_exports.IsUndefined(left.items) && !value_exports.IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit3(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsRecord(right) ? FromRecordRight(left, right) : type_exports.IsVoid(right) ? FromVoidRight(left, right) : type_exports.IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit3(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion6(left, right) {
  return left.anyOf.every((schema) => Visit3(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown(left, right) {
  return type_exports.IsNever(right) ? FromNeverRight(left, right) : type_exports.IsIntersect(right) ? FromIntersectRight(left, right) : type_exports.IsUnion(right) ? FromUnionRight(left, right) : type_exports.IsAny(right) ? FromAnyRight(left, right) : type_exports.IsString(right) ? FromStringRight(left, right) : type_exports.IsNumber(right) ? FromNumberRight(left, right) : type_exports.IsInteger(right) ? FromIntegerRight(left, right) : type_exports.IsBoolean(right) ? FromBooleanRight(left, right) : type_exports.IsArray(right) ? FromArrayRight(left, right) : type_exports.IsTuple(right) ? FromTupleRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return type_exports.IsUndefined(left) ? ExtendsResult.True : type_exports.IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid(left, right) {
  return type_exports.IsIntersect(right) ? FromIntersectRight(left, right) : type_exports.IsUnion(right) ? FromUnionRight(left, right) : type_exports.IsUnknown(right) ? FromUnknownRight(left, right) : type_exports.IsAny(right) ? FromAnyRight(left, right) : type_exports.IsObject(right) ? FromObjectRight(left, right) : type_exports.IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit3(left, right) {
  return (
    // resolvable
    type_exports.IsTemplateLiteral(left) || type_exports.IsTemplateLiteral(right) ? FromTemplateLiteral2(left, right) : type_exports.IsRegExp(left) || type_exports.IsRegExp(right) ? FromRegExp(left, right) : type_exports.IsNot(left) || type_exports.IsNot(right) ? FromNot(left, right) : (
      // standard
      type_exports.IsAny(left) ? FromAny(left, right) : type_exports.IsArray(left) ? FromArray4(left, right) : type_exports.IsBigInt(left) ? FromBigInt(left, right) : type_exports.IsBoolean(left) ? FromBoolean(left, right) : type_exports.IsAsyncIterator(left) ? FromAsyncIterator(left, right) : type_exports.IsConstructor(left) ? FromConstructor(left, right) : type_exports.IsDate(left) ? FromDate(left, right) : type_exports.IsFunction(left) ? FromFunction(left, right) : type_exports.IsInteger(left) ? FromInteger(left, right) : type_exports.IsIntersect(left) ? FromIntersect4(left, right) : type_exports.IsIterator(left) ? FromIterator(left, right) : type_exports.IsLiteral(left) ? FromLiteral2(left, right) : type_exports.IsNever(left) ? FromNever(left, right) : type_exports.IsNull(left) ? FromNull(left, right) : type_exports.IsNumber(left) ? FromNumber(left, right) : type_exports.IsObject(left) ? FromObject(left, right) : type_exports.IsRecord(left) ? FromRecord(left, right) : type_exports.IsString(left) ? FromString(left, right) : type_exports.IsSymbol(left) ? FromSymbol(left, right) : type_exports.IsTuple(left) ? FromTuple3(left, right) : type_exports.IsPromise(left) ? FromPromise2(left, right) : type_exports.IsUint8Array(left) ? FromUint8Array(left, right) : type_exports.IsUndefined(left) ? FromUndefined(left, right) : type_exports.IsUnion(left) ? FromUnion6(left, right) : type_exports.IsUnknown(left) ? FromUnknown(left, right) : type_exports.IsVoid(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[Kind]}'`)
    )
  );
}
function ExtendsCheck(left, right) {
  return Visit3(left, right);
}
var ExtendsResolverError;
var ExtendsResult;
var init_extends_check = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/extends-check.mjs"() {
    init_any2();
    init_function2();
    init_number2();
    init_string2();
    init_unknown2();
    init_template_literal2();
    init_patterns2();
    init_symbols2();
    init_error2();
    init_guard3();
    ExtendsResolverError = class extends TypeBoxError {
    };
    (function(ExtendsResult2) {
      ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
      ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
      ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
    })(ExtendsResult || (ExtendsResult = {}));
  }
});
function FromProperties8(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone(options));
  return Acc;
}
function FromMappedResult6(Left, Right, True, False, options) {
  return FromProperties8(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult6(Left, Right, True, False, options);
  return MappedResult(P);
}
var init_extends_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-result.mjs"() {
    init_mapped2();
    init_extends();
    init_value2();
  }
});
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}
var init_extends = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/extends.mjs"() {
    init_type2();
    init_union2();
    init_extends_check();
    init_extends_from_mapped_key();
    init_extends_from_mapped_result();
    init_kind();
  }
});
function FromPropertyKey(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone(options))
  };
}
function FromPropertyKeys(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey2(K, U, L, R, options) {
  return FromPropertyKeys(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey2(T, U, L, R, options);
  return MappedResult(P);
}
var init_extends_from_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-key.mjs"() {
    init_mapped2();
    init_literal2();
    init_extends();
    init_value2();
  }
});
var init_extends_undefined = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/extends-undefined.mjs"() {
  }
});
var init_extends2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extends/index.mjs"() {
    init_extends_check();
    init_extends_from_mapped_key();
    init_extends_from_mapped_result();
    init_extends_undefined();
    init_extends();
  }
});
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}
var init_exclude_from_template_literal = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-template-literal.mjs"() {
    init_exclude();
    init_template_literal2();
  }
});
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}
var init_exclude = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/exclude/exclude.mjs"() {
    init_type2();
    init_union2();
    init_never2();
    init_extends2();
    init_exclude_from_mapped_result();
    init_exclude_from_template_literal();
    init_kind();
  }
});
function FromProperties9(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult7(R, T) {
  return FromProperties9(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult7(R, T);
  return MappedResult(P);
}
var init_exclude_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-mapped-result.mjs"() {
    init_mapped2();
    init_exclude();
  }
});
var init_exclude2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/exclude/index.mjs"() {
    init_exclude_from_mapped_result();
    init_exclude_from_template_literal();
    init_exclude();
  }
});
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}
var init_extract_from_template_literal = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-template-literal.mjs"() {
    init_extract();
    init_template_literal2();
  }
});
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}
var init_extract = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extract/extract.mjs"() {
    init_type2();
    init_union2();
    init_never2();
    init_extends2();
    init_extract_from_mapped_result();
    init_extract_from_template_literal();
    init_kind();
  }
});
function FromProperties10(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult8(R, T) {
  return FromProperties10(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult8(R, T);
  return MappedResult(P);
}
var init_extract_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-mapped-result.mjs"() {
    init_mapped2();
    init_extract();
  }
});
var init_extract2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/extract/index.mjs"() {
    init_extract_from_mapped_result();
    init_extract_from_template_literal();
    init_extract();
  }
});
function InstanceType(schema, options) {
  return IsConstructor(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_instance_type = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/instance-type/instance-type.mjs"() {
    init_type2();
    init_never2();
    init_kind();
  }
});
var init_instance_type2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/instance-type/index.mjs"() {
    init_instance_type();
  }
});
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}
var init_readonly_optional = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/readonly-optional/readonly-optional.mjs"() {
    init_readonly2();
    init_optional2();
  }
});
var init_readonly_optional2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/readonly-optional/index.mjs"() {
    init_readonly_optional();
  }
});
function RecordCreateFromPattern(pattern, T, options) {
  return CreateType({ [Kind]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object2(result, { ...options, [Hint]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union(key)), type, options);
}
function FromLiteralKey(key, type, options) {
  return RecordCreateFromKeys([key.toString()], type, options);
}
function FromRegExpKey(key, type, options) {
  return RecordCreateFromPattern(key.source, type, options);
}
function FromStringKey(key, type, options) {
  const pattern = IsUndefined(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern, type, options);
}
function FromAnyKey(_, type, options) {
  return RecordCreateFromPattern(PatternStringExact, type, options);
}
function FromNeverKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNeverExact, type, options);
}
function FromBooleanKey(_key, type, options) {
  return Object2({ true: type, false: type }, options);
}
function FromIntegerKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function FromNumberKey(_, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function Record(key, type, options = {}) {
  return IsUnion(key) ? FromUnionKey(key.anyOf, type, options) : IsTemplateLiteral(key) ? FromTemplateLiteralKey(key, type, options) : IsLiteral(key) ? FromLiteralKey(key.const, type, options) : IsBoolean2(key) ? FromBooleanKey(key, type, options) : IsInteger(key) ? FromIntegerKey(key, type, options) : IsNumber3(key) ? FromNumberKey(key, type, options) : IsRegExp2(key) ? FromRegExpKey(key, type, options) : IsString2(key) ? FromStringKey(key, type, options) : IsAny(key) ? FromAnyKey(key, type, options) : IsNever(key) ? FromNeverKey(key, type, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey2(type) {
  const pattern = RecordPattern(type);
  return pattern === PatternStringExact ? String2() : pattern === PatternNumberExact ? Number2() : String2({ pattern });
}
function RecordValue2(type) {
  return type.patternProperties[RecordPattern(type)];
}
var init_record = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/record/record.mjs"() {
    init_type2();
    init_symbols2();
    init_never2();
    init_number2();
    init_object2();
    init_string2();
    init_union2();
    init_template_literal2();
    init_patterns2();
    init_indexed2();
    init_value();
    init_kind();
  }
});
var init_record2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/record/index.mjs"() {
    init_record();
  }
});
function FromConstructor2(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromFunction2(args, type) {
  type.parameters = FromTypes(args, type.parameters);
  type.returns = FromType(args, type.returns);
  return type;
}
function FromIntersect5(args, type) {
  type.allOf = FromTypes(args, type.allOf);
  return type;
}
function FromUnion7(args, type) {
  type.anyOf = FromTypes(args, type.anyOf);
  return type;
}
function FromTuple4(args, type) {
  if (IsUndefined(type.items))
    return type;
  type.items = FromTypes(args, type.items);
  return type;
}
function FromArray5(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromAsyncIterator2(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromIterator2(args, type) {
  type.items = FromType(args, type.items);
  return type;
}
function FromPromise3(args, type) {
  type.item = FromType(args, type.item);
  return type;
}
function FromObject2(args, type) {
  const mappedProperties = FromProperties11(args, type.properties);
  return { ...type, ...Object2(mappedProperties) };
}
function FromRecord2(args, type) {
  const mappedKey = FromType(args, RecordKey2(type));
  const mappedValue = FromType(args, RecordValue2(type));
  const result = Record(mappedKey, mappedValue);
  return { ...type, ...result };
}
function FromArgument(args, argument) {
  return argument.index in args ? args[argument.index] : Unknown();
}
function FromProperty2(args, type) {
  const isReadonly = IsReadonly(type);
  const isOptional = IsOptional(type);
  const mapped = FromType(args, type);
  return isReadonly && isOptional ? ReadonlyOptional(mapped) : isReadonly && !isOptional ? Readonly(mapped) : !isReadonly && isOptional ? Optional(mapped) : mapped;
}
function FromProperties11(args, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty2(args, properties[key]) };
  }, {});
}
function FromTypes(args, types) {
  return types.map((type) => FromType(args, type));
}
function FromType(args, type) {
  return IsConstructor(type) ? FromConstructor2(args, type) : IsFunction2(type) ? FromFunction2(args, type) : IsIntersect(type) ? FromIntersect5(args, type) : IsUnion(type) ? FromUnion7(args, type) : IsTuple(type) ? FromTuple4(args, type) : IsArray3(type) ? FromArray5(args, type) : IsAsyncIterator2(type) ? FromAsyncIterator2(args, type) : IsIterator2(type) ? FromIterator2(args, type) : IsPromise(type) ? FromPromise3(args, type) : IsObject3(type) ? FromObject2(args, type) : IsRecord(type) ? FromRecord2(args, type) : IsArgument(type) ? FromArgument(args, type) : type;
}
function Instantiate(type, args) {
  return FromType(args, CloneType(type));
}
var init_instantiate = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/instantiate/instantiate.mjs"() {
    init_type();
    init_unknown2();
    init_readonly_optional2();
    init_readonly2();
    init_optional2();
    init_object2();
    init_record2();
    init_value();
    init_kind();
  }
});
var init_instantiate2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/instantiate/index.mjs"() {
    init_instantiate();
  }
});
function Integer(options) {
  return CreateType({ [Kind]: "Integer", type: "integer" }, options);
}
var init_integer = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/integer/integer.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_integer2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/integer/index.mjs"() {
    init_integer();
  }
});
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}
var init_intrinsic_from_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic-from-mapped-key.mjs"() {
    init_mapped2();
    init_intrinsic();
    init_literal2();
    init_value2();
  }
});
function ApplyUncapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value) {
  return value.toUpperCase();
}
function ApplyLowercase(value) {
  return value.toLowerCase();
}
function FromTemplateLiteral3(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite = IsTemplateLiteralExpressionFinite(expression);
  if (!finite)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value) => Literal(value));
  const mapped = FromRest5(literals, mode);
  const union = Union(mapped);
  return TemplateLiteral([union], options);
}
function FromLiteralValue(value, mode) {
  return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
}
function FromRest5(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return (
    // Intrinsic-Mapped-Inference
    IsMappedKey(schema) ? IntrinsicFromMappedKey(schema, mode, options) : (
      // Standard-Inference
      IsTemplateLiteral(schema) ? FromTemplateLiteral3(schema, mode, options) : IsUnion(schema) ? Union(FromRest5(schema.anyOf, mode), options) : IsLiteral(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : (
        // Default Type
        CreateType(schema, options)
      )
    )
  );
}
var init_intrinsic = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic.mjs"() {
    init_type2();
    init_template_literal2();
    init_intrinsic_from_mapped_key();
    init_literal2();
    init_union2();
    init_kind();
  }
});
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}
var init_capitalize = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/capitalize.mjs"() {
    init_intrinsic();
  }
});
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}
var init_lowercase = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/lowercase.mjs"() {
    init_intrinsic();
  }
});
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}
var init_uncapitalize = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/uncapitalize.mjs"() {
    init_intrinsic();
  }
});
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}
var init_uppercase = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/uppercase.mjs"() {
    init_intrinsic();
  }
});
var init_intrinsic2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/intrinsic/index.mjs"() {
    init_capitalize();
    init_intrinsic_from_mapped_key();
    init_intrinsic();
    init_lowercase();
    init_uncapitalize();
    init_uppercase();
  }
});
function FromProperties12(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult9(mappedResult, propertyKeys, options) {
  return FromProperties12(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult9(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-result.mjs"() {
    init_mapped2();
    init_omit();
    init_value2();
  }
});
function FromIntersect6(types, propertyKeys) {
  return types.map((type) => OmitResolve(type, propertyKeys));
}
function FromUnion8(types, propertyKeys) {
  return types.map((type) => OmitResolve(type, propertyKeys));
}
function FromProperty3(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties13(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty3(T, K2), properties);
}
function FromObject3(type, propertyKeys, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties13(properties, propertyKeys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function OmitResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect6(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion8(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject3(type, propertyKeys, type.properties) : Object2({});
}
function Omit(type, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? OmitFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? OmitFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type, typeKey], options) : CreateType({ ...OmitResolve(type, propertyKeys), ...options });
}
var init_omit = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/omit/omit.mjs"() {
    init_type2();
    init_discard();
    init_symbols();
    init_computed2();
    init_literal2();
    init_indexed2();
    init_intersect2();
    init_union2();
    init_object2();
    init_omit_from_mapped_key();
    init_omit_from_mapped_result();
    init_kind();
    init_value();
  }
});
function FromPropertyKey2(type, key, options) {
  return { [key]: Omit(type, [key], Clone(options)) };
}
function FromPropertyKeys2(type, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey2(type, LK, options) };
  }, {});
}
function FromMappedKey3(type, mappedKey, options) {
  return FromPropertyKeys2(type, mappedKey.keys, options);
}
function OmitFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey3(type, mappedKey, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-key.mjs"() {
    init_mapped2();
    init_omit();
    init_value2();
  }
});
var init_omit2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/omit/index.mjs"() {
    init_omit_from_mapped_key();
    init_omit_from_mapped_result();
    init_omit();
  }
});
function FromProperties14(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult10(mappedResult, propertyKeys, options) {
  return FromProperties14(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult10(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-result.mjs"() {
    init_mapped2();
    init_pick();
    init_value2();
  }
});
function FromIntersect7(types, propertyKeys) {
  return types.map((type) => PickResolve(type, propertyKeys));
}
function FromUnion9(types, propertyKeys) {
  return types.map((type) => PickResolve(type, propertyKeys));
}
function FromProperties15(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject4(Type2, keys, properties) {
  const options = Discard(Type2, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties15(properties, keys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys2(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function PickResolve(type, propertyKeys) {
  return IsIntersect(type) ? Intersect(FromIntersect7(type.allOf, propertyKeys)) : IsUnion(type) ? Union(FromUnion9(type.anyOf, propertyKeys)) : IsObject3(type) ? FromObject4(type, propertyKeys, type.properties) : Object2({});
}
function Pick(type, key, options) {
  const typeKey = IsArray(key) ? UnionFromPropertyKeys2(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type) ? PickFromMappedResult(type, propertyKeys, options) : IsMappedKey(key) ? PickFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type, typeKey], options) : CreateType({ ...PickResolve(type, propertyKeys), ...options });
}
var init_pick = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/pick/pick.mjs"() {
    init_type2();
    init_discard();
    init_computed2();
    init_intersect2();
    init_literal2();
    init_object2();
    init_union2();
    init_indexed2();
    init_symbols();
    init_kind();
    init_value();
    init_pick_from_mapped_key();
    init_pick_from_mapped_result();
  }
});
function FromPropertyKey3(type, key, options) {
  return {
    [key]: Pick(type, [key], Clone(options))
  };
}
function FromPropertyKeys3(type, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey3(type, leftKey, options) };
  }, {});
}
function FromMappedKey4(type, mappedKey, options) {
  return FromPropertyKeys3(type, mappedKey.keys, options);
}
function PickFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey4(type, mappedKey, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_key = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-key.mjs"() {
    init_mapped2();
    init_pick();
    init_value2();
  }
});
var init_pick2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/pick/index.mjs"() {
    init_pick_from_mapped_key();
    init_pick_from_mapped_result();
    init_pick();
  }
});
function FromComputed3(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef3($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties16(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject5(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties16(properties);
  return Object2(mappedProperties, options);
}
function FromRest6(types) {
  return types.map((type) => PartialResolve(type));
}
function PartialResolve(type) {
  return (
    // Mappable
    IsComputed(type) ? FromComputed3(type.target, type.parameters) : IsRef(type) ? FromRef3(type.$ref) : IsIntersect(type) ? Intersect(FromRest6(type.allOf)) : IsUnion(type) ? Union(FromRest6(type.anyOf)) : IsObject3(type) ? FromObject5(type, type.properties) : (
      // Intrinsic
      IsBigInt2(type) ? type : IsBoolean2(type) ? type : IsInteger(type) ? type : IsLiteral(type) ? type : IsNull2(type) ? type : IsNumber3(type) ? type : IsString2(type) ? type : IsSymbol2(type) ? type : IsUndefined3(type) ? type : (
        // Passthrough
        Object2({})
      )
    )
  );
}
function Partial(type, options) {
  if (IsMappedResult(type)) {
    return PartialFromMappedResult(type, options);
  } else {
    return CreateType({ ...PartialResolve(type), ...options });
  }
}
var init_partial = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/partial/partial.mjs"() {
    init_type2();
    init_computed2();
    init_optional2();
    init_object2();
    init_intersect2();
    init_union2();
    init_ref2();
    init_discard2();
    init_symbols2();
    init_partial_from_mapped_result();
    init_kind();
  }
});
function FromProperties17(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone(options));
  return Acc;
}
function FromMappedResult11(R, options) {
  return FromProperties17(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult11(R, options);
  return MappedResult(P);
}
var init_partial_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/partial/partial-from-mapped-result.mjs"() {
    init_mapped2();
    init_partial();
    init_value2();
  }
});
var init_partial2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/partial/index.mjs"() {
    init_partial_from_mapped_result();
    init_partial();
  }
});
function FromComputed4(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef4($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties18(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject6(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties18(properties);
  return Object2(mappedProperties, options);
}
function FromRest7(types) {
  return types.map((type) => RequiredResolve(type));
}
function RequiredResolve(type) {
  return (
    // Mappable
    IsComputed(type) ? FromComputed4(type.target, type.parameters) : IsRef(type) ? FromRef4(type.$ref) : IsIntersect(type) ? Intersect(FromRest7(type.allOf)) : IsUnion(type) ? Union(FromRest7(type.anyOf)) : IsObject3(type) ? FromObject6(type, type.properties) : (
      // Intrinsic
      IsBigInt2(type) ? type : IsBoolean2(type) ? type : IsInteger(type) ? type : IsLiteral(type) ? type : IsNull2(type) ? type : IsNumber3(type) ? type : IsString2(type) ? type : IsSymbol2(type) ? type : IsUndefined3(type) ? type : (
        // Passthrough
        Object2({})
      )
    )
  );
}
function Required(type, options) {
  if (IsMappedResult(type)) {
    return RequiredFromMappedResult(type, options);
  } else {
    return CreateType({ ...RequiredResolve(type), ...options });
  }
}
var init_required = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/required/required.mjs"() {
    init_type2();
    init_computed2();
    init_object2();
    init_intersect2();
    init_union2();
    init_ref2();
    init_symbols2();
    init_discard2();
    init_required_from_mapped_result();
    init_kind();
  }
});
function FromProperties19(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult12(R, options) {
  return FromProperties19(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult12(R, options);
  return MappedResult(P);
}
var init_required_from_mapped_result = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/required/required-from-mapped-result.mjs"() {
    init_mapped2();
    init_required();
  }
});
var init_required2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/required/index.mjs"() {
    init_required_from_mapped_result();
    init_required();
  }
});
function DereferenceParameters(moduleProperties, types) {
  return types.map((type) => {
    return IsRef(type) ? Dereference(moduleProperties, type.$ref) : FromType2(moduleProperties, type);
  });
}
function Dereference(moduleProperties, ref) {
  return ref in moduleProperties ? IsRef(moduleProperties[ref]) ? Dereference(moduleProperties, moduleProperties[ref].$ref) : FromType2(moduleProperties, moduleProperties[ref]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed5(moduleProperties, target, parameters) {
  const dereferenced = DereferenceParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromArray6(moduleProperties, type) {
  return Array2(FromType2(moduleProperties, type));
}
function FromAsyncIterator3(moduleProperties, type) {
  return AsyncIterator(FromType2(moduleProperties, type));
}
function FromConstructor3(moduleProperties, parameters, instanceType) {
  return Constructor(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, instanceType));
}
function FromFunction3(moduleProperties, parameters, returnType) {
  return Function2(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, returnType));
}
function FromIntersect8(moduleProperties, types) {
  return Intersect(FromTypes2(moduleProperties, types));
}
function FromIterator3(moduleProperties, type) {
  return Iterator(FromType2(moduleProperties, type));
}
function FromObject7(moduleProperties, properties) {
  return Object2(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType2(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord3(moduleProperties, type) {
  const [value, pattern] = [FromType2(moduleProperties, RecordValue2(type)), RecordPattern(type)];
  const result = CloneType(type);
  result.patternProperties[pattern] = value;
  return result;
}
function FromTransform(moduleProperties, transform) {
  return IsRef(transform) ? { ...Dereference(moduleProperties, transform.$ref), [TransformKind]: transform[TransformKind] } : transform;
}
function FromTuple5(moduleProperties, types) {
  return Tuple(FromTypes2(moduleProperties, types));
}
function FromUnion10(moduleProperties, types) {
  return Union(FromTypes2(moduleProperties, types));
}
function FromTypes2(moduleProperties, types) {
  return types.map((type) => FromType2(moduleProperties, type));
}
function FromType2(moduleProperties, type) {
  return (
    // Modifiers
    IsOptional(type) ? CreateType(FromType2(moduleProperties, Discard(type, [OptionalKind])), type) : IsReadonly(type) ? CreateType(FromType2(moduleProperties, Discard(type, [ReadonlyKind])), type) : (
      // Transform
      IsTransform(type) ? CreateType(FromTransform(moduleProperties, type), type) : (
        // Types
        IsArray3(type) ? CreateType(FromArray6(moduleProperties, type.items), type) : IsAsyncIterator2(type) ? CreateType(FromAsyncIterator3(moduleProperties, type.items), type) : IsComputed(type) ? CreateType(FromComputed5(moduleProperties, type.target, type.parameters)) : IsConstructor(type) ? CreateType(FromConstructor3(moduleProperties, type.parameters, type.returns), type) : IsFunction2(type) ? CreateType(FromFunction3(moduleProperties, type.parameters, type.returns), type) : IsIntersect(type) ? CreateType(FromIntersect8(moduleProperties, type.allOf), type) : IsIterator2(type) ? CreateType(FromIterator3(moduleProperties, type.items), type) : IsObject3(type) ? CreateType(FromObject7(moduleProperties, type.properties), type) : IsRecord(type) ? CreateType(FromRecord3(moduleProperties, type)) : IsTuple(type) ? CreateType(FromTuple5(moduleProperties, type.items || []), type) : IsUnion(type) ? CreateType(FromUnion10(moduleProperties, type.anyOf), type) : type
      )
    )
  );
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType2(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}
var init_compute = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/module/compute.mjs"() {
    init_create();
    init_clone();
    init_discard2();
    init_array2();
    init_awaited2();
    init_async_iterator2();
    init_constructor2();
    init_indexed2();
    init_function2();
    init_intersect2();
    init_iterator2();
    init_keyof2();
    init_object2();
    init_omit2();
    init_pick2();
    init_never2();
    init_partial2();
    init_record2();
    init_required2();
    init_tuple2();
    init_union2();
    init_symbols2();
    init_kind();
  }
});
function Module(properties) {
  return new TModule(properties);
}
var TModule;
var init_module = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/module/module.mjs"() {
    init_create();
    init_symbols2();
    init_compute();
    TModule = class {
      constructor($defs) {
        const computed = ComputeModuleProperties($defs);
        const identified = this.WithIdentifiers(computed);
        this.$defs = identified;
      }
      /** `[Json]` Imports a Type by Key. */
      Import(key, options) {
        const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
        return CreateType({ [Kind]: "Import", $defs, $ref: key });
      }
      // prettier-ignore
      WithIdentifiers($defs) {
        return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
          return { ...result, [key]: { ...$defs[key], $id: key } };
        }, {});
      }
    };
  }
});
var init_module2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/module/index.mjs"() {
    init_module();
  }
});
function Not(type, options) {
  return CreateType({ [Kind]: "Not", not: type }, options);
}
var init_not = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/not/not.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_not2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/not/index.mjs"() {
    init_not();
  }
});
function Parameters(schema, options) {
  return IsFunction2(schema) ? Tuple(schema.parameters, options) : Never();
}
var init_parameters = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/parameters/parameters.mjs"() {
    init_tuple2();
    init_never2();
    init_kind();
  }
});
var init_parameters2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/parameters/index.mjs"() {
    init_parameters();
  }
});
function Recursive(callback, options = {}) {
  if (IsUndefined(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint]: "Recursive", ...thisType }, options);
}
var Ordinal;
var init_recursive = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/recursive/recursive.mjs"() {
    init_type();
    init_type2();
    init_value();
    init_symbols2();
    Ordinal = 0;
  }
});
var init_recursive2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/recursive/index.mjs"() {
    init_recursive();
  }
});
function RegExp2(unresolved, options) {
  const expr = IsString(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}
var init_regexp = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/regexp/regexp.mjs"() {
    init_type2();
    init_value();
    init_symbols2();
  }
});
var init_regexp2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/regexp/index.mjs"() {
    init_regexp();
  }
});
function RestResolve(T) {
  return IsIntersect(T) ? T.allOf : IsUnion(T) ? T.anyOf : IsTuple(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}
var init_rest = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/rest/rest.mjs"() {
    init_kind();
  }
});
var init_rest2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/rest/index.mjs"() {
    init_rest();
  }
});
function ReturnType(schema, options) {
  return IsFunction2(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_return_type = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/return-type/return-type.mjs"() {
    init_type2();
    init_never2();
    init_kind();
  }
});
var init_return_type2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/return-type/index.mjs"() {
    init_return_type();
  }
});
var init_anyschema = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/schema/anyschema.mjs"() {
  }
});
var init_schema = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/schema/schema.mjs"() {
  }
});
var init_schema2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/schema/index.mjs"() {
    init_anyschema();
    init_schema();
  }
});
var init_static = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/static/static.mjs"() {
  }
});
var init_static2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/static/index.mjs"() {
    init_static();
  }
});
function Transform(schema) {
  return new TransformDecodeBuilder(schema);
}
var TransformDecodeBuilder;
var TransformEncodeBuilder;
var init_transform = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/transform/transform.mjs"() {
    init_symbols2();
    init_kind();
    TransformDecodeBuilder = class {
      constructor(schema) {
        this.schema = schema;
      }
      Decode(decode) {
        return new TransformEncodeBuilder(this.schema, decode);
      }
    };
    TransformEncodeBuilder = class {
      constructor(schema, decode) {
        this.schema = schema;
        this.decode = decode;
      }
      EncodeTransform(encode2, schema) {
        const Encode = (value) => schema[TransformKind].Encode(encode2(value));
        const Decode = (value) => this.decode(schema[TransformKind].Decode(value));
        const Codec = { Encode, Decode };
        return { ...schema, [TransformKind]: Codec };
      }
      EncodeSchema(encode2, schema) {
        const Codec = { Decode: this.decode, Encode: encode2 };
        return { ...schema, [TransformKind]: Codec };
      }
      Encode(encode2) {
        return IsTransform(this.schema) ? this.EncodeTransform(encode2, this.schema) : this.EncodeSchema(encode2, this.schema);
      }
    };
  }
});
var init_transform2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/transform/index.mjs"() {
    init_transform();
  }
});
function Unsafe(options = {}) {
  return CreateType({ [Kind]: options[Kind] ?? "Unsafe" }, options);
}
var init_unsafe = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/unsafe/unsafe.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_unsafe2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/unsafe/index.mjs"() {
    init_unsafe();
  }
});
function Void(options) {
  return CreateType({ [Kind]: "Void", type: "void" }, options);
}
var init_void = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/void/void.mjs"() {
    init_type2();
    init_symbols2();
  }
});
var init_void2 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/void/index.mjs"() {
    init_void();
  }
});
var type_exports3 = {};
__export(type_exports3, {
  Any: () => Any,
  Argument: () => Argument,
  Array: () => Array2,
  AsyncIterator: () => AsyncIterator,
  Awaited: () => Awaited,
  BigInt: () => BigInt,
  Boolean: () => Boolean2,
  Capitalize: () => Capitalize,
  Composite: () => Composite,
  Const: () => Const,
  Constructor: () => Constructor,
  ConstructorParameters: () => ConstructorParameters,
  Date: () => Date2,
  Enum: () => Enum,
  Exclude: () => Exclude,
  Extends: () => Extends,
  Extract: () => Extract,
  Function: () => Function2,
  Index: () => Index,
  InstanceType: () => InstanceType,
  Instantiate: () => Instantiate,
  Integer: () => Integer,
  Intersect: () => Intersect,
  Iterator: () => Iterator,
  KeyOf: () => KeyOf,
  Literal: () => Literal,
  Lowercase: () => Lowercase,
  Mapped: () => Mapped,
  Module: () => Module,
  Never: () => Never,
  Not: () => Not,
  Null: () => Null,
  Number: () => Number2,
  Object: () => Object2,
  Omit: () => Omit,
  Optional: () => Optional,
  Parameters: () => Parameters,
  Partial: () => Partial,
  Pick: () => Pick,
  Promise: () => Promise2,
  Readonly: () => Readonly,
  ReadonlyOptional: () => ReadonlyOptional,
  Record: () => Record,
  Recursive: () => Recursive,
  Ref: () => Ref,
  RegExp: () => RegExp2,
  Required: () => Required,
  Rest: () => Rest,
  ReturnType: () => ReturnType,
  String: () => String2,
  Symbol: () => Symbol2,
  TemplateLiteral: () => TemplateLiteral,
  Transform: () => Transform,
  Tuple: () => Tuple,
  Uint8Array: () => Uint8Array2,
  Uncapitalize: () => Uncapitalize,
  Undefined: () => Undefined,
  Union: () => Union,
  Unknown: () => Unknown,
  Unsafe: () => Unsafe,
  Uppercase: () => Uppercase,
  Void: () => Void
});
var init_type5 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/type/type.mjs"() {
    init_any2();
    init_argument2();
    init_array2();
    init_async_iterator2();
    init_awaited2();
    init_bigint2();
    init_boolean2();
    init_composite2();
    init_const2();
    init_constructor2();
    init_constructor_parameters2();
    init_date2();
    init_enum2();
    init_exclude2();
    init_extends2();
    init_extract2();
    init_function2();
    init_indexed2();
    init_instance_type2();
    init_instantiate2();
    init_integer2();
    init_intersect2();
    init_intrinsic2();
    init_iterator2();
    init_keyof2();
    init_literal2();
    init_mapped2();
    init_module2();
    init_never2();
    init_not2();
    init_null2();
    init_number2();
    init_object2();
    init_omit2();
    init_optional2();
    init_parameters2();
    init_partial2();
    init_pick2();
    init_promise2();
    init_readonly2();
    init_readonly_optional2();
    init_record2();
    init_recursive2();
    init_ref2();
    init_regexp2();
    init_required2();
    init_rest2();
    init_return_type2();
    init_string2();
    init_symbol2();
    init_template_literal2();
    init_transform2();
    init_tuple2();
    init_uint8array2();
    init_undefined2();
    init_union2();
    init_unknown2();
    init_unsafe2();
    init_void2();
  }
});
var Type;
var init_type6 = __esm({
  "node_modules/@sinclair/typebox/build/esm/type/type/index.mjs"() {
    init_type5();
    Type = type_exports3;
  }
});
var init_esm = __esm({
  "node_modules/@sinclair/typebox/build/esm/index.mjs"() {
    init_clone();
    init_create();
    init_error2();
    init_guard3();
    init_helpers2();
    init_patterns2();
    init_registry();
    init_sets();
    init_symbols2();
    init_any2();
    init_array2();
    init_argument2();
    init_async_iterator2();
    init_awaited2();
    init_bigint2();
    init_boolean2();
    init_composite2();
    init_const2();
    init_constructor2();
    init_constructor_parameters2();
    init_date2();
    init_enum2();
    init_exclude2();
    init_extends2();
    init_extract2();
    init_function2();
    init_indexed2();
    init_instance_type2();
    init_instantiate2();
    init_integer2();
    init_intersect2();
    init_iterator2();
    init_intrinsic2();
    init_keyof2();
    init_literal2();
    init_module2();
    init_mapped2();
    init_never2();
    init_not2();
    init_null2();
    init_number2();
    init_object2();
    init_omit2();
    init_optional2();
    init_parameters2();
    init_partial2();
    init_pick2();
    init_promise2();
    init_readonly2();
    init_readonly_optional2();
    init_record2();
    init_recursive2();
    init_ref2();
    init_regexp2();
    init_required2();
    init_rest2();
    init_return_type2();
    init_schema2();
    init_static2();
    init_string2();
    init_symbol2();
    init_template_literal2();
    init_transform2();
    init_tuple2();
    init_uint8array2();
    init_undefined2();
    init_union2();
    init_unknown2();
    init_unsafe2();
    init_void2();
    init_type6();
  }
});
function parseReflectionMetadata(metadataRaw) {
  if (!metadataRaw) return {};
  try {
    const parsed = JSON.parse(metadataRaw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function isReflectionEntry(entry) {
  if (entry.category === "reflection") return true;
  const metadata = parseReflectionMetadata(entry.metadata);
  return metadata.type === "memory-reflection" || metadata.type === "memory-reflection-event" || metadata.type === "memory-reflection-item";
}
function getDisplayCategoryTag(entry) {
  if (!isReflectionEntry(entry)) return `${entry.category}:${entry.scope}`;
  return `reflection:${entry.scope}`;
}
var init_reflection_metadata = __esm({
  "packages/core/src/reflection-metadata.ts"() {
  }
});
var tools_exports = {};
__export(tools_exports, {
  MEMORY_CATEGORIES: () => MEMORY_CATEGORIES2,
  registerAllMemoryTools: () => registerAllMemoryTools,
  registerMemoryForgetTool: () => registerMemoryForgetTool,
  registerMemoryListTool: () => registerMemoryListTool,
  registerMemoryRecallTool: () => registerMemoryRecallTool,
  registerMemoryStatsTool: () => registerMemoryStatsTool,
  registerMemoryStoreTool: () => registerMemoryStoreTool,
  registerMemoryUpdateTool: () => registerMemoryUpdateTool,
  registerSelfImprovementExtractSkillTool: () => registerSelfImprovementExtractSkillTool,
  registerSelfImprovementLogTool: () => registerSelfImprovementLogTool,
  registerSelfImprovementReviewTool: () => registerSelfImprovementReviewTool
});
function stringEnum(values) {
  return Type.Unsafe({
    type: "string",
    enum: [...values]
  });
}
function resolveAgentId(runtimeAgentId, fallback) {
  if (typeof runtimeAgentId === "string" && runtimeAgentId.trim().length > 0) return runtimeAgentId;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  return void 0;
}
function clampInt3(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
function clamp013(value, fallback = 0.7) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}
function sanitizeMemoryForSerialization(results) {
  return results.map((r) => ({
    id: r.entry.id,
    text: r.entry.text,
    category: getDisplayCategoryTag(r.entry),
    rawCategory: r.entry.category,
    scope: r.entry.scope,
    importance: r.entry.importance,
    score: r.score,
    sources: r.sources
  }));
}
function parseAgentIdFromSessionKey(sessionKey) {
  if (!sessionKey) return void 0;
  const m = /^agent:([^:]+):/.exec(sessionKey);
  return m?.[1];
}
function resolveRuntimeAgentId(staticAgentId, runtimeCtx) {
  if (!runtimeCtx || typeof runtimeCtx !== "object") return staticAgentId;
  const ctx = runtimeCtx;
  const ctxAgentId = typeof ctx.agentId === "string" ? ctx.agentId : void 0;
  const ctxSessionKey = typeof ctx.sessionKey === "string" ? ctx.sessionKey : void 0;
  return ctxAgentId || parseAgentIdFromSessionKey(ctxSessionKey) || staticAgentId;
}
function resolveToolContext(base, runtimeCtx) {
  return {
    ...base,
    agentId: resolveRuntimeAgentId(base.agentId, runtimeCtx)
  };
}
async function sleep2(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
async function retrieveWithRetry(retriever, params) {
  let results = await retriever.retrieve(params);
  if (results.length === 0) {
    await sleep2(75);
    results = await retriever.retrieve(params);
  }
  return results;
}
function resolveWorkspaceDir(toolCtx, fallback) {
  const runtime = toolCtx;
  const runtimePath = typeof runtime?.workspaceDir === "string" ? runtime.workspaceDir.trim() : "";
  if (runtimePath) return runtimePath;
  if (fallback && fallback.trim()) return fallback;
  return join9(homedir8(), ".openclaw", "workspace");
}
function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function registerSelfImprovementLogTool(api, context) {
  api.registerTool(
    (toolCtx) => ({
      name: "self_improvement_log",
      label: "Self-Improvement Log",
      description: "Log structured learning/error entries into .learnings for governance and later distillation.",
      parameters: Type.Object({
        type: stringEnum(["learning", "error"]),
        summary: Type.String({ description: "One-line summary" }),
        details: Type.Optional(Type.String({ description: "Detailed context or error output" })),
        suggestedAction: Type.Optional(Type.String({ description: "Concrete action to prevent recurrence" })),
        category: Type.Optional(Type.String({ description: "learning category (correction/best_practice/knowledge_gap) when type=learning" })),
        area: Type.Optional(Type.String({ description: "frontend|backend|infra|tests|docs|config or custom area" })),
        priority: Type.Optional(Type.String({ description: "low|medium|high|critical" }))
      }),
      async execute(_toolCallId, params) {
        const {
          type,
          summary,
          details = "",
          suggestedAction = "",
          category = "best_practice",
          area = "config",
          priority = "medium"
        } = params;
        try {
          const workspaceDir = resolveWorkspaceDir(toolCtx, context.workspaceDir);
          const { id: entryId, filePath } = await appendSelfImprovementEntry({
            baseDir: workspaceDir,
            type,
            summary,
            details,
            suggestedAction,
            category,
            area,
            priority,
            source: "mnemo/self_improvement_log"
          });
          const fileName = type === "learning" ? "LEARNINGS.md" : "ERRORS.md";
          return {
            content: [{ type: "text", text: `Logged ${type} entry ${entryId} to .learnings/${fileName}` }],
            details: { action: "logged", type, id: entryId, filePath }
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to log self-improvement entry: ${error instanceof Error ? error.message : String(error)}` }],
            details: { error: "self_improvement_log_failed", message: String(error) }
          };
        }
      }
    }),
    { name: "self_improvement_log" }
  );
}
function registerSelfImprovementExtractSkillTool(api, context) {
  api.registerTool(
    (toolCtx) => ({
      name: "self_improvement_extract_skill",
      label: "Extract Skill From Learning",
      description: "Create a new skill scaffold from a learning entry and mark the source learning as promoted_to_skill.",
      parameters: Type.Object({
        learningId: Type.String({ description: "Learning ID like LRN-YYYYMMDD-001" }),
        skillName: Type.String({ description: "Skill folder name, lowercase with hyphens" }),
        sourceFile: Type.Optional(stringEnum(["LEARNINGS.md", "ERRORS.md"])),
        outputDir: Type.Optional(Type.String({ description: "Relative output dir under workspace (default: skills)" }))
      }),
      async execute(_toolCallId, params) {
        const { learningId, skillName, sourceFile = "LEARNINGS.md", outputDir = "skills" } = params;
        try {
          if (!/^(LRN|ERR)-\d{8}-\d{3}$/.test(learningId)) {
            return {
              content: [{ type: "text", text: "Invalid learningId format. Use LRN-YYYYMMDD-001 / ERR-..." }],
              details: { error: "invalid_learning_id" }
            };
          }
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
            return {
              content: [{ type: "text", text: "Invalid skillName. Use lowercase letters, numbers, and hyphens only." }],
              details: { error: "invalid_skill_name" }
            };
          }
          const workspaceDir = resolveWorkspaceDir(toolCtx, context.workspaceDir);
          await ensureSelfImprovementLearningFiles(workspaceDir);
          const learningsPath = join9(workspaceDir, ".learnings", sourceFile);
          const learningBody = await readFile5(learningsPath, "utf-8");
          const escapedLearningId = escapeRegExp(learningId.trim());
          const entryRegex = new RegExp(`## \\[${escapedLearningId}\\][\\s\\S]*?(?=\\n## \\[|$)`, "m");
          const match = learningBody.match(entryRegex);
          if (!match) {
            return {
              content: [{ type: "text", text: `Learning entry ${learningId} not found in .learnings/${sourceFile}` }],
              details: { error: "learning_not_found", learningId, sourceFile }
            };
          }
          const summaryMatch = match[0].match(/### Summary\n([\s\S]*?)\n###/m);
          const summary = (summaryMatch?.[1] ?? "Summarize the source learning here.").trim();
          const safeOutputDir = outputDir.replace(/\\/g, "/").split("/").filter((segment) => segment && segment !== "." && segment !== "..").join("/");
          const skillDir = join9(workspaceDir, safeOutputDir || "skills", skillName);
          await mkdir5(skillDir, { recursive: true });
          const skillPath = join9(skillDir, "SKILL.md");
          const skillTitle = skillName.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
          const skillContent = [
            "---",
            `name: ${skillName}`,
            `description: "Extracted from learning ${learningId}. Replace with a concise description."`,
            "---",
            "",
            `# ${skillTitle}`,
            "",
            "## Why",
            summary,
            "",
            "## When To Use",
            "- [TODO] Define trigger conditions",
            "",
            "## Steps",
            "1. [TODO] Add repeatable workflow steps",
            "2. [TODO] Add verification steps",
            "",
            "## Source Learning",
            `- Learning ID: ${learningId}`,
            `- Source File: .learnings/${sourceFile}`,
            ""
          ].join("\n");
          await writeFile2(skillPath, skillContent, "utf-8");
          const promotedMarker = `**Status**: promoted_to_skill`;
          const skillPathMarker = `- Skill-Path: ${safeOutputDir || "skills"}/${skillName}`;
          let updatedEntry = match[0];
          updatedEntry = updatedEntry.includes("**Status**:") ? updatedEntry.replace(/\*\*Status\*\*:\s*.+/m, promotedMarker) : `${updatedEntry.trimEnd()}
${promotedMarker}
`;
          if (!updatedEntry.includes("Skill-Path:")) {
            updatedEntry = `${updatedEntry.trimEnd()}
${skillPathMarker}
`;
          }
          const updatedLearningBody = learningBody.replace(match[0], updatedEntry);
          await writeFile2(learningsPath, updatedLearningBody, "utf-8");
          return {
            content: [{ type: "text", text: `Extracted skill scaffold to ${safeOutputDir || "skills"}/${skillName}/SKILL.md and updated ${learningId}.` }],
            details: {
              action: "skill_extracted",
              learningId,
              sourceFile,
              skillPath: `${safeOutputDir || "skills"}/${skillName}/SKILL.md`
            }
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to extract skill: ${error instanceof Error ? error.message : String(error)}` }],
            details: { error: "self_improvement_extract_skill_failed", message: String(error) }
          };
        }
      }
    }),
    { name: "self_improvement_extract_skill" }
  );
}
function registerSelfImprovementReviewTool(api, context) {
  api.registerTool(
    (toolCtx) => ({
      name: "self_improvement_review",
      label: "Self-Improvement Review",
      description: "Summarize governance backlog from .learnings files (pending/high-priority/promoted counts).",
      parameters: Type.Object({}),
      async execute() {
        try {
          const workspaceDir = resolveWorkspaceDir(toolCtx, context.workspaceDir);
          await ensureSelfImprovementLearningFiles(workspaceDir);
          const learningsDir = join9(workspaceDir, ".learnings");
          const files = ["LEARNINGS.md", "ERRORS.md"];
          const stats = { pending: 0, high: 0, promoted: 0, total: 0 };
          for (const f of files) {
            const content = await readFile5(join9(learningsDir, f), "utf-8").catch(() => "");
            stats.total += (content.match(/^## \[/gm) || []).length;
            stats.pending += (content.match(/\*\*Status\*\*:\s*pending/gi) || []).length;
            stats.high += (content.match(/\*\*Priority\*\*:\s*(high|critical)/gi) || []).length;
            stats.promoted += (content.match(/\*\*Status\*\*:\s*promoted(_to_skill)?/gi) || []).length;
          }
          const text = [
            "Self-Improvement Governance Snapshot:",
            `- Total entries: ${stats.total}`,
            `- Pending: ${stats.pending}`,
            `- High/Critical: ${stats.high}`,
            `- Promoted: ${stats.promoted}`,
            "",
            "Recommended loop:",
            "1) Resolve high-priority pending entries",
            "2) Distill reusable rules into AGENTS.md / SOUL.md / TOOLS.md",
            "3) Extract repeatable patterns as skills"
          ].join("\n");
          return {
            content: [{ type: "text", text }],
            details: { action: "review", stats }
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to review self-improvement backlog: ${error instanceof Error ? error.message : String(error)}` }],
            details: { error: "self_improvement_review_failed", message: String(error) }
          };
        }
      }
    }),
    { name: "self_improvement_review" }
  );
}
function registerMemoryRecallTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const runtimeContext = resolveToolContext(context, toolCtx);
      return {
        name: "memory_recall",
        label: "Memory Recall",
        description: "Search through long-term memories using hybrid retrieval (vector + keyword search). Use when you need context about user preferences, past decisions, or previously discussed topics.",
        parameters: Type.Object({
          query: Type.String({
            description: "Search query for finding relevant memories"
          }),
          limit: Type.Optional(
            Type.Number({
              description: "Max results to return (default: 5, max: 20)"
            })
          ),
          scope: Type.Optional(
            Type.String({
              description: "Specific memory scope to search in (optional)"
            })
          ),
          category: Type.Optional(stringEnum(MEMORY_CATEGORIES2))
        }),
        async execute(_toolCallId, params) {
          const {
            query,
            limit: limit2 = 5,
            scope,
            category
          } = params;
          try {
            const safeLimit = clampInt3(limit2, 1, 20);
            const agentId = runtimeContext.agentId;
            let scopeFilter = runtimeContext.scopeManager.getAccessibleScopes(agentId);
            if (scope) {
              if (runtimeContext.scopeManager.isAccessible(scope, agentId)) {
                scopeFilter = [scope];
              } else {
                return {
                  content: [
                    { type: "text", text: `Access denied to scope: ${scope}` }
                  ],
                  details: {
                    error: "scope_access_denied",
                    requestedScope: scope
                  }
                };
              }
            }
            const results = await retrieveWithRetry(runtimeContext.retriever, {
              query,
              limit: safeLimit,
              scopeFilter,
              category,
              source: "manual"
            });
            if (results.length === 0) {
              return {
                content: [{ type: "text", text: "No relevant memories found." }],
                details: { count: 0, query, scopes: scopeFilter }
              };
            }
            const now = Date.now();
            await Promise.allSettled(
              results.map((result) => {
                const meta = parseSmartMetadata(result.entry.metadata, result.entry);
                return runtimeContext.store.patchMetadata(
                  result.entry.id,
                  {
                    access_count: meta.access_count + 1,
                    last_accessed_at: now
                  },
                  scopeFilter
                );
              })
            );
            const text = results.map((r, i) => {
              const categoryTag = getDisplayCategoryTag(r.entry);
              return `${i + 1}. [${r.entry.id}] [${categoryTag}] ${r.entry.text}`;
            }).join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${results.length} memories:

${text}`
                }
              ],
              details: {
                count: results.length,
                memories: sanitizeMemoryForSerialization(results),
                query,
                scopes: scopeFilter,
                retrievalMode: runtimeContext.retriever.getConfig().mode
              }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Memory recall failed: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "recall_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_recall" }
  );
}
function registerMemoryStoreTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const runtimeContext = resolveToolContext(context, toolCtx);
      return {
        name: "memory_store",
        label: "Memory Store",
        description: "Save important information in long-term memory. Use for preferences, facts, decisions, and other notable information.",
        parameters: Type.Object({
          text: Type.String({ description: "Information to remember" }),
          importance: Type.Optional(
            Type.Number({ description: "Importance score 0-1 (default: 0.7)" })
          ),
          category: Type.Optional(stringEnum(MEMORY_CATEGORIES2)),
          scope: Type.Optional(
            Type.String({
              description: "Memory scope (optional, defaults to agent scope)"
            })
          )
        }),
        async execute(_toolCallId, params) {
          const {
            text,
            importance = 0.7,
            category = "other",
            scope
          } = params;
          try {
            const agentId = runtimeContext.agentId;
            let targetScope = scope || runtimeContext.scopeManager.getDefaultScope(agentId);
            if (!runtimeContext.scopeManager.isAccessible(targetScope, agentId)) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Access denied to scope: ${targetScope}`
                  }
                ],
                details: {
                  error: "scope_access_denied",
                  requestedScope: targetScope
                }
              };
            }
            if (isNoise(text)) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Skipped: text detected as noise (greeting, boilerplate, or meta-question)`
                  }
                ],
                details: { action: "noise_filtered", text: text.slice(0, 60) }
              };
            }
            const safeImportance = clamp013(importance, 0.7);
            const vector = await runtimeContext.embedder.embedPassage(text);
            let existing = [];
            try {
              existing = await runtimeContext.store.vectorSearch(vector, 1, 0.1, [
                targetScope
              ]);
            } catch (err) {
              log.warn(
                `duplicate pre-check failed, continue store: ${String(err)}`
              );
            }
            if (existing.length > 0 && existing[0].score > 0.98) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Similar memory already exists: "${existing[0].entry.text}"`
                  }
                ],
                details: {
                  action: "duplicate",
                  existingId: existing[0].entry.id,
                  existingText: existing[0].entry.text,
                  existingScope: existing[0].entry.scope,
                  similarity: existing[0].score
                }
              };
            }
            const entry = await runtimeContext.store.store({
              text,
              vector,
              importance: safeImportance,
              category,
              scope: targetScope,
              metadata: stringifySmartMetadata(
                buildSmartMetadata(
                  {
                    text,
                    category,
                    importance: safeImportance
                  },
                  {
                    l0_abstract: text,
                    l1_overview: `- ${text}`,
                    l2_content: text
                  }
                )
              )
            });
            if (context.mdMirror) {
              await context.mdMirror(
                { text, category, scope: targetScope, timestamp: entry.timestamp },
                { source: "memory_store", agentId }
              );
            }
            return {
              content: [
                {
                  type: "text",
                  text: `Stored: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}" in scope '${targetScope}'`
                }
              ],
              details: {
                action: "created",
                id: entry.id,
                scope: entry.scope,
                category: entry.category,
                importance: entry.importance
              }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Memory storage failed: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "store_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_store" }
  );
}
function registerMemoryForgetTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const agentId = resolveAgentId(toolCtx?.agentId, context.agentId) ?? "main";
      return {
        name: "memory_forget",
        label: "Memory Forget",
        description: "Delete specific memories. Supports both search-based and direct ID-based deletion.",
        parameters: Type.Object({
          query: Type.Optional(
            Type.String({ description: "Search query to find memory to delete" })
          ),
          memoryId: Type.Optional(
            Type.String({ description: "Specific memory ID to delete" })
          ),
          scope: Type.Optional(
            Type.String({
              description: "Scope to search/delete from (optional)"
            })
          )
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, runtimeCtx) {
          const { query, memoryId, scope } = params;
          try {
            const agentId2 = resolveRuntimeAgentId(context.agentId, runtimeCtx);
            let scopeFilter = context.scopeManager.getAccessibleScopes(agentId2);
            if (scope) {
              if (context.scopeManager.isAccessible(scope, agentId2)) {
                scopeFilter = [scope];
              } else {
                return {
                  content: [
                    { type: "text", text: `Access denied to scope: ${scope}` }
                  ],
                  details: {
                    error: "scope_access_denied",
                    requestedScope: scope
                  }
                };
              }
            }
            if (memoryId) {
              const deleted = await context.store.delete(memoryId, scopeFilter);
              if (deleted) {
                return {
                  content: [
                    { type: "text", text: `Memory ${memoryId} forgotten.` }
                  ],
                  details: { action: "deleted", id: memoryId }
                };
              } else {
                return {
                  content: [
                    {
                      type: "text",
                      text: `Memory ${memoryId} not found or access denied.`
                    }
                  ],
                  details: { error: "not_found", id: memoryId }
                };
              }
            }
            if (query) {
              const results = await retrieveWithRetry(context.retriever, {
                query,
                limit: 5,
                scopeFilter
              });
              if (results.length === 0) {
                return {
                  content: [
                    { type: "text", text: "No matching memories found." }
                  ],
                  details: { found: 0, query }
                };
              }
              if (results.length === 1 && results[0].score > 0.9) {
                const deleted = await context.store.delete(
                  results[0].entry.id,
                  scopeFilter
                );
                if (deleted) {
                  return {
                    content: [
                      {
                        type: "text",
                        text: `Forgotten: "${results[0].entry.text}"`
                      }
                    ],
                    details: { action: "deleted", id: results[0].entry.id }
                  };
                }
              }
              const list = results.map(
                (r) => `- [${r.entry.id.slice(0, 8)}] ${r.entry.text.slice(0, 60)}${r.entry.text.length > 60 ? "..." : ""}`
              ).join("\n");
              return {
                content: [
                  {
                    type: "text",
                    text: `Found ${results.length} candidates. Specify memoryId to delete:
${list}`
                  }
                ],
                details: {
                  action: "candidates",
                  candidates: sanitizeMemoryForSerialization(results)
                }
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: "Provide either 'query' to search for memories or 'memoryId' to delete specific memory."
                }
              ],
              details: { error: "missing_param" }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Memory deletion failed: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "delete_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_forget" }
  );
}
function registerMemoryUpdateTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const agentId = resolveAgentId(toolCtx?.agentId, context.agentId) ?? "main";
      return {
        name: "memory_update",
        label: "Memory Update",
        description: "Update an existing memory in-place. Preserves original timestamp. Use when correcting outdated info or adjusting importance/category without losing creation date.",
        parameters: Type.Object({
          memoryId: Type.String({
            description: "ID of the memory to update (full UUID or 8+ char prefix)"
          }),
          text: Type.Optional(
            Type.String({
              description: "New text content (triggers re-embedding)"
            })
          ),
          importance: Type.Optional(
            Type.Number({ description: "New importance score 0-1" })
          ),
          category: Type.Optional(stringEnum(MEMORY_CATEGORIES2))
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, runtimeCtx) {
          const { memoryId, text, importance, category } = params;
          try {
            if (!text && importance === void 0 && !category) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Nothing to update. Provide at least one of: text, importance, category."
                  }
                ],
                details: { error: "no_updates" }
              };
            }
            const agentId2 = resolveRuntimeAgentId(context.agentId, runtimeCtx);
            const scopeFilter = context.scopeManager.getAccessibleScopes(agentId2);
            let resolvedId = memoryId;
            const uuidLike = /^[0-9a-f]{8}(-[0-9a-f]{4}){0,4}/i.test(memoryId);
            if (!uuidLike) {
              const results = await retrieveWithRetry(context.retriever, {
                query: memoryId,
                limit: 3,
                scopeFilter
              });
              if (results.length === 0) {
                return {
                  content: [
                    {
                      type: "text",
                      text: `No memory found matching "${memoryId}".`
                    }
                  ],
                  details: { error: "not_found", query: memoryId }
                };
              }
              if (results.length === 1 || results[0].score > 0.85) {
                resolvedId = results[0].entry.id;
              } else {
                const list = results.map(
                  (r) => `- [${r.entry.id.slice(0, 8)}] ${r.entry.text.slice(0, 60)}${r.entry.text.length > 60 ? "..." : ""}`
                ).join("\n");
                return {
                  content: [
                    {
                      type: "text",
                      text: `Multiple matches. Specify memoryId:
${list}`
                    }
                  ],
                  details: {
                    action: "candidates",
                    candidates: sanitizeMemoryForSerialization(results)
                  }
                };
              }
            }
            let newVector;
            if (text) {
              if (isNoise(text)) {
                return {
                  content: [
                    {
                      type: "text",
                      text: "Skipped: updated text detected as noise"
                    }
                  ],
                  details: { action: "noise_filtered" }
                };
              }
              newVector = await context.embedder.embedPassage(text);
            }
            const updates = {};
            if (text) updates.text = text;
            if (newVector) updates.vector = newVector;
            if (importance !== void 0)
              updates.importance = clamp013(importance, 0.7);
            if (category) updates.category = category;
            const updated = await context.store.update(
              resolvedId,
              updates,
              scopeFilter
            );
            if (!updated) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Memory ${resolvedId.slice(0, 8)}... not found or access denied.`
                  }
                ],
                details: { error: "not_found", id: resolvedId }
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: `Updated memory ${updated.id.slice(0, 8)}...: "${updated.text.slice(0, 80)}${updated.text.length > 80 ? "..." : ""}"`
                }
              ],
              details: {
                action: "updated",
                id: updated.id,
                scope: updated.scope,
                category: updated.category,
                importance: updated.importance,
                fieldsUpdated: Object.keys(updates)
              }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Memory update failed: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "update_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_update" }
  );
}
function registerMemoryStatsTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const agentId = resolveAgentId(toolCtx?.agentId, context.agentId) ?? "main";
      return {
        name: "memory_stats",
        label: "Memory Statistics",
        description: "Get statistics about memory usage, scopes, and categories.",
        parameters: Type.Object({
          scope: Type.Optional(
            Type.String({
              description: "Specific scope to get stats for (optional)"
            })
          )
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, runtimeCtx) {
          const { scope } = params;
          try {
            const agentId2 = resolveRuntimeAgentId(context.agentId, runtimeCtx);
            let scopeFilter = context.scopeManager.getAccessibleScopes(agentId2);
            if (scope) {
              if (context.scopeManager.isAccessible(scope, agentId2)) {
                scopeFilter = [scope];
              } else {
                return {
                  content: [
                    { type: "text", text: `Access denied to scope: ${scope}` }
                  ],
                  details: {
                    error: "scope_access_denied",
                    requestedScope: scope
                  }
                };
              }
            }
            const stats = await context.store.stats(scopeFilter);
            const scopeManagerStats = context.scopeManager.getStats();
            const retrievalConfig = context.retriever.getConfig();
            const text = [
              `Memory Statistics:`,
              `\u2022 Total memories: ${stats.totalCount}`,
              `\u2022 Available scopes: ${scopeManagerStats.totalScopes}`,
              `\u2022 Retrieval mode: ${retrievalConfig.mode}`,
              `\u2022 FTS support: ${context.store.hasFtsSupport ? "Yes" : "No"}`,
              ``,
              `Memories by scope:`,
              ...Object.entries(stats.scopeCounts).map(
                ([s, count]) => `  \u2022 ${s}: ${count}`
              ),
              ``,
              `Memories by category:`,
              ...Object.entries(stats.categoryCounts).map(
                ([c, count]) => `  \u2022 ${c}: ${count}`
              )
            ].join("\n");
            return {
              content: [{ type: "text", text }],
              details: {
                stats,
                scopeManagerStats,
                retrievalConfig: {
                  ...retrievalConfig,
                  rerankApiKey: retrievalConfig.rerankApiKey ? "***" : void 0
                },
                hasFtsSupport: context.store.hasFtsSupport
              }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get memory stats: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "stats_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_stats" }
  );
}
function registerMemoryListTool(api, context) {
  api.registerTool(
    (toolCtx) => {
      const agentId = resolveAgentId(toolCtx?.agentId, context.agentId) ?? "main";
      return {
        name: "memory_list",
        label: "Memory List",
        description: "List recent memories with optional filtering by scope and category.",
        parameters: Type.Object({
          limit: Type.Optional(
            Type.Number({
              description: "Max memories to list (default: 10, max: 50)"
            })
          ),
          scope: Type.Optional(
            Type.String({ description: "Filter by specific scope (optional)" })
          ),
          category: Type.Optional(stringEnum(MEMORY_CATEGORIES2)),
          offset: Type.Optional(
            Type.Number({
              description: "Number of memories to skip (default: 0)"
            })
          )
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, runtimeCtx) {
          const {
            limit: limit2 = 10,
            scope,
            category,
            offset = 0
          } = params;
          try {
            const safeLimit = clampInt3(limit2, 1, 50);
            const safeOffset = clampInt3(offset, 0, 1e3);
            const agentId2 = resolveRuntimeAgentId(context.agentId, runtimeCtx);
            let scopeFilter = context.scopeManager.getAccessibleScopes(agentId2);
            if (scope) {
              if (context.scopeManager.isAccessible(scope, agentId2)) {
                scopeFilter = [scope];
              } else {
                return {
                  content: [
                    { type: "text", text: `Access denied to scope: ${scope}` }
                  ],
                  details: {
                    error: "scope_access_denied",
                    requestedScope: scope
                  }
                };
              }
            }
            const entries = await context.store.list(
              scopeFilter,
              category,
              safeLimit,
              safeOffset
            );
            if (entries.length === 0) {
              return {
                content: [{ type: "text", text: "No memories found." }],
                details: {
                  count: 0,
                  filters: {
                    scope,
                    category,
                    limit: safeLimit,
                    offset: safeOffset
                  }
                }
              };
            }
            const text = entries.map((entry, i) => {
              const date = new Date(entry.timestamp).toISOString().split("T")[0];
              const categoryTag = getDisplayCategoryTag(entry);
              return `${safeOffset + i + 1}. [${entry.id}] [${categoryTag}] ${entry.text.slice(0, 100)}${entry.text.length > 100 ? "..." : ""} (${date})`;
            }).join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Recent memories (showing ${entries.length}):

${text}`
                }
              ],
              details: {
                count: entries.length,
                memories: entries.map((e) => ({
                  id: e.id,
                  text: e.text,
                  category: getDisplayCategoryTag(e),
                  rawCategory: e.category,
                  scope: e.scope,
                  importance: e.importance,
                  timestamp: e.timestamp
                })),
                filters: {
                  scope,
                  category,
                  limit: safeLimit,
                  offset: safeOffset
                }
              }
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to list memories: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              details: { error: "list_failed", message: String(error) }
            };
          }
        }
      };
    },
    { name: "memory_list" }
  );
}
function registerAllMemoryTools(api, context, options = {}) {
  registerMemoryRecallTool(api, context);
  registerMemoryStoreTool(api, context);
  registerMemoryForgetTool(api, context);
  registerMemoryUpdateTool(api, context);
  if (options.enableManagementTools) {
    registerMemoryStatsTool(api, context);
    registerMemoryListTool(api, context);
  }
  if (options.enableSelfImprovementTools !== false) {
    registerSelfImprovementLogTool(api, context);
    if (options.enableManagementTools) {
      registerSelfImprovementExtractSkillTool(api, context);
      registerSelfImprovementReviewTool(api, context);
    }
  }
}
var MEMORY_CATEGORIES2;
var init_tools = __esm({
  "packages/core/src/tools.ts"() {
    init_esm();
    init_noise_filter();
    init_smart_metadata();
    init_self_improvement_files();
    init_reflection_metadata();
    init_logger();
    MEMORY_CATEGORIES2 = [
      "preference",
      "fact",
      "decision",
      "entity",
      "reflection",
      "other"
    ];
  }
});
var reflection_retry_exports = {};
__export(reflection_retry_exports, {
  classifyReflectionRetry: () => classifyReflectionRetry,
  computeReflectionRetryDelayMs: () => computeReflectionRetryDelayMs,
  isReflectionNonRetryError: () => isReflectionNonRetryError,
  isTransientReflectionUpstreamError: () => isTransientReflectionUpstreamError,
  runWithReflectionTransientRetryOnce: () => runWithReflectionTransientRetryOnce
});
function toErrorMessage(error) {
  if (error instanceof Error) {
    const msg = `${error.name}: ${error.message}`.trim();
    return msg || "Error";
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
function clipSingleLine(text, maxLen = 260) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen - 3)}...`;
}
function isTransientReflectionUpstreamError(error) {
  const msg = toErrorMessage(error);
  return REFLECTION_TRANSIENT_PATTERNS.some((pattern) => pattern.test(msg));
}
function isReflectionNonRetryError(error) {
  const msg = toErrorMessage(error);
  return REFLECTION_NON_RETRY_PATTERNS.some((pattern) => pattern.test(msg));
}
function classifyReflectionRetry(input) {
  const normalizedError = clipSingleLine(toErrorMessage(input.error), 260);
  if (!input.inReflectionScope) {
    return { retryable: false, reason: "not_reflection_scope", normalizedError };
  }
  if (input.retryCount > 0) {
    return { retryable: false, reason: "retry_already_used", normalizedError };
  }
  if (input.usefulOutputChars > 0) {
    return { retryable: false, reason: "useful_output_present", normalizedError };
  }
  if (isReflectionNonRetryError(input.error)) {
    return { retryable: false, reason: "non_retry_error", normalizedError };
  }
  if (isTransientReflectionUpstreamError(input.error)) {
    return { retryable: true, reason: "transient_upstream_failure", normalizedError };
  }
  return { retryable: false, reason: "non_transient_error", normalizedError };
}
function computeReflectionRetryDelayMs(random = Math.random) {
  const raw = random();
  const clamped = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
  return 1e3 + Math.floor(clamped * 2e3);
}
async function runWithReflectionTransientRetryOnce(params) {
  try {
    return await params.execute();
  } catch (error) {
    const decision = classifyReflectionRetry({
      inReflectionScope: params.scope === "reflection" || params.scope === "distiller",
      retryCount: params.retryState.count,
      usefulOutputChars: 0,
      error
    });
    if (!decision.retryable) throw error;
    const delayMs = computeReflectionRetryDelayMs(params.random);
    params.retryState.count += 1;
    params.onLog?.(
      "warn",
      `memory-${params.scope}: transient upstream failure detected (${params.runner}); retrying once in ${delayMs}ms (${decision.reason}). error=${decision.normalizedError}`
    );
    await (params.sleep ?? DEFAULT_SLEEP)(delayMs);
    try {
      const result = await params.execute();
      params.onLog?.("info", `memory-${params.scope}: retry succeeded (${params.runner})`);
      return result;
    } catch (retryError) {
      params.onLog?.(
        "warn",
        `memory-${params.scope}: retry exhausted (${params.runner}). error=${clipSingleLine(toErrorMessage(retryError), 260)}`
      );
      throw retryError;
    }
  }
}
var REFLECTION_TRANSIENT_PATTERNS;
var REFLECTION_NON_RETRY_PATTERNS;
var DEFAULT_SLEEP;
var init_reflection_retry = __esm({
  "packages/core/src/reflection-retry.ts"() {
    REFLECTION_TRANSIENT_PATTERNS = [
      /unexpected eof/i,
      /\beconnreset\b/i,
      /\beconnaborted\b/i,
      /\betimedout\b/i,
      /\bepipe\b/i,
      /connection reset/i,
      /socket hang up/i,
      /socket (?:closed|disconnected)/i,
      /connection (?:closed|aborted|dropped)/i,
      /early close/i,
      /stream (?:ended|closed) unexpectedly/i,
      /temporar(?:y|ily).*unavailable/i,
      /upstream.*unavailable/i,
      /service unavailable/i,
      /bad gateway/i,
      /gateway timeout/i,
      /\b(?:http|status)\s*(?:502|503|504)\b/i,
      /\btimed out\b/i,
      /\btimeout\b/i,
      /\bund_err_(?:socket|headers_timeout|body_timeout)\b/i,
      /network error/i,
      /fetch failed/i
    ];
    REFLECTION_NON_RETRY_PATTERNS = [
      /\b401\b/i,
      /\bunauthorized\b/i,
      /invalid api key/i,
      /invalid[_ -]?token/i,
      /\bauth(?:entication)?_?unavailable\b/i,
      /insufficient (?:credit|credits|balance)/i,
      /\bbilling\b/i,
      /\bquota exceeded\b/i,
      /payment required/i,
      /model .*not found/i,
      /no such model/i,
      /unknown model/i,
      /context length/i,
      /context window/i,
      /request too large/i,
      /payload too large/i,
      /too many tokens/i,
      /token limit/i,
      /prompt too long/i,
      /session expired/i,
      /invalid session/i,
      /refusal/i,
      /content policy/i,
      /safety policy/i,
      /content filter/i,
      /disallowed/i
    ];
    DEFAULT_SLEEP = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }
});
var session_recovery_exports = {};
__export(session_recovery_exports, {
  resolveReflectionSessionSearchDirs: () => resolveReflectionSessionSearchDirs,
  stripResetSuffix: () => stripResetSuffix
});
function asNonEmptyString(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : void 0;
}
function stripResetSuffix(fileName) {
  const resetIndex = fileName.indexOf(".reset.");
  return resetIndex === -1 ? fileName : fileName.slice(0, resetIndex);
}
function deriveOpenClawHomeFromWorkspacePath(workspacePath) {
  const normalized = workspacePath.trim().replace(/[\\/]+$/, "");
  if (!normalized) return void 0;
  const matched = normalized.match(/^(.*?)[\\/]workspace(?:[\\/].*)?$/);
  if (!matched || !matched[1]) return void 0;
  const home = matched[1].trim();
  return home.length ? home : void 0;
}
function deriveOpenClawHomeFromSessionFilePath(sessionFilePath) {
  const normalized = sessionFilePath.trim();
  if (!normalized) return void 0;
  const matched = normalized.match(/^(.*?)[\\/]agents[\\/][^\\/]+[\\/]sessions(?:[\\/][^\\/]+)?$/);
  if (!matched || !matched[1]) return void 0;
  const home = matched[1].trim();
  return home.length ? home : void 0;
}
function listConfiguredAgentIds(cfg) {
  try {
    const root = cfg;
    const agents = root.agents;
    const list = agents?.list;
    if (!Array.isArray(list)) return [];
    const ids = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const id = asNonEmptyString(item.id);
      if (id) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}
function resolveReflectionSessionSearchDirs(params) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const addDir = (value) => {
    const dir = asNonEmptyString(value);
    if (!dir || seen.has(dir)) return;
    seen.add(dir);
    out.push(dir);
  };
  const addHome = (homes, value) => {
    const home = asNonEmptyString(value);
    if (!home || homes.includes(home)) return;
    homes.push(home);
  };
  const addAgentId = (agentIds2, value) => {
    const agentId = asNonEmptyString(value);
    if (!agentId || agentId.includes("/") || agentId.includes("\\") || agentIds2.includes(agentId)) return;
    agentIds2.push(agentId);
  };
  const previousSessionEntry = params.context.previousSessionEntry || {};
  const sessionEntry = params.context.sessionEntry || {};
  const sessionEntries = [previousSessionEntry, sessionEntry];
  if (params.currentSessionFile) addDir(dirname5(params.currentSessionFile));
  for (const entry of sessionEntries) {
    const file = asNonEmptyString(entry.sessionFile);
    if (file) addDir(dirname5(file));
    addDir(asNonEmptyString(entry.sessionsDir));
    addDir(asNonEmptyString(entry.sessionDir));
  }
  addDir(join10(params.workspaceDir, "sessions"));
  const openclawHomes = [];
  addHome(openclawHomes, asNonEmptyString(process.env.OPENCLAW_HOME));
  addHome(openclawHomes, deriveOpenClawHomeFromWorkspacePath(params.workspaceDir));
  if (params.currentSessionFile) {
    addHome(openclawHomes, deriveOpenClawHomeFromSessionFilePath(params.currentSessionFile));
  }
  for (const entry of sessionEntries) {
    const entryFile = asNonEmptyString(entry.sessionFile);
    if (entryFile) addHome(openclawHomes, deriveOpenClawHomeFromSessionFilePath(entryFile));
  }
  try {
    const root = params.cfg;
    const agents = root.agents;
    const defaults2 = agents?.defaults;
    const defaultWorkspace = asNonEmptyString(defaults2?.workspace);
    if (defaultWorkspace) addHome(openclawHomes, deriveOpenClawHomeFromWorkspacePath(defaultWorkspace));
    const list = agents?.list;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const workspace = asNonEmptyString(item.workspace);
        if (workspace) addHome(openclawHomes, deriveOpenClawHomeFromWorkspacePath(workspace));
      }
    }
  } catch {
  }
  const agentIds = [];
  addAgentId(agentIds, params.sourceAgentId);
  addAgentId(agentIds, asNonEmptyString(params.context.agentId));
  for (const entry of sessionEntries) {
    addAgentId(agentIds, asNonEmptyString(entry.agentId));
  }
  for (const configuredId of listConfiguredAgentIds(params.cfg)) {
    addAgentId(agentIds, configuredId);
  }
  addAgentId(agentIds, "main");
  for (const home of openclawHomes) {
    for (const agentId of agentIds) {
      addDir(join10(home, "agents", agentId, "sessions"));
    }
  }
  return out;
}
var init_session_recovery = __esm({
  "packages/core/src/session-recovery.ts"() {
  }
});
var reflection_slices_exports = {};
__export(reflection_slices_exports, {
  extractReflectionLearningGovernanceCandidates: () => extractReflectionLearningGovernanceCandidates,
  extractReflectionLessons: () => extractReflectionLessons,
  extractReflectionMappedMemories: () => extractReflectionMappedMemories,
  extractReflectionMappedMemoryItems: () => extractReflectionMappedMemoryItems,
  extractReflectionSliceItems: () => extractReflectionSliceItems,
  extractReflectionSlices: () => extractReflectionSlices,
  extractSectionMarkdown: () => extractSectionMarkdown,
  isPlaceholderReflectionSliceLine: () => isPlaceholderReflectionSliceLine,
  normalizeReflectionSliceLine: () => normalizeReflectionSliceLine,
  parseSectionBullets: () => parseSectionBullets,
  sanitizeReflectionSliceLines: () => sanitizeReflectionSliceLines
});
function extractSectionMarkdown(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const headingNeedle = `## ${heading}`.toLowerCase();
  let inSection = false;
  const collected = [];
  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();
    if (lower.startsWith("## ")) {
      if (inSection && lower !== headingNeedle) break;
      inSection = lower === headingNeedle;
      continue;
    }
    if (!inSection) continue;
    collected.push(raw);
  }
  return collected.join("\n").trim();
}
function parseSectionBullets(markdown, heading) {
  const lines = extractSectionMarkdown(markdown, heading).split(/\r?\n/);
  const collected = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const normalized = line.slice(2).trim();
      if (normalized) collected.push(normalized);
    }
  }
  return collected;
}
function isPlaceholderReflectionSliceLine(line) {
  const normalized = line.replace(/\*\*/g, "").trim();
  if (!normalized) return true;
  if (/^\(none( captured)?\)$/i.test(normalized)) return true;
  if (/^(invariants?|reflections?|derived)[:：]$/i.test(normalized)) return true;
  if (/apply this session'?s deltas next run/i.test(normalized)) return true;
  if (/apply this session'?s distilled changes next run/i.test(normalized)) return true;
  if (/investigate why embedded reflection generation failed/i.test(normalized)) return true;
  return false;
}
function normalizeReflectionSliceLine(line) {
  return line.replace(/\*\*/g, "").replace(/^(invariants?|reflections?|derived)[:：]\s*/i, "").trim();
}
function sanitizeReflectionSliceLines(lines) {
  return lines.map(normalizeReflectionSliceLine).filter((line) => !isPlaceholderReflectionSliceLine(line));
}
function isInvariantRuleLike(line) {
  return /^(always|never|when\b|if\b|before\b|after\b|prefer\b|avoid\b|require\b|only\b|do not\b|must\b|should\b)/i.test(line) || /\b(must|should|never|always|prefer|avoid|required?)\b/i.test(line);
}
function isDerivedDeltaLike(line) {
  return /^(this run|next run|going forward|follow-up|re-check|retest|verify|confirm|avoid repeating|adjust|change|update|retry|keep|watch)\b/i.test(line) || /\b(this run|next run|delta|change|adjust|retry|re-check|retest|verify|confirm|avoid repeating|follow-up)\b/i.test(line);
}
function isOpenLoopAction(line) {
  return /^(investigate|verify|confirm|re-check|retest|update|add|remove|fix|avoid|keep|watch|document)\b/i.test(line);
}
function extractReflectionLessons(reflectionText) {
  return sanitizeReflectionSliceLines(parseSectionBullets(reflectionText, "Lessons & pitfalls (symptom / cause / fix / prevention)"));
}
function extractReflectionLearningGovernanceCandidates(reflectionText) {
  const section = extractSectionMarkdown(reflectionText, "Learning governance candidates (.learnings / promotion / skill extraction)");
  if (!section) return [];
  const entryBlocks = section.split(/(?=^###\s+Entry\b)/gim).map((block) => block.trim()).filter(Boolean);
  const parsed = entryBlocks.map(parseReflectionGovernanceEntry).filter((entry) => entry !== null);
  if (parsed.length > 0) return parsed;
  const fallbackBullets = sanitizeReflectionSliceLines(
    parseSectionBullets(reflectionText, "Learning governance candidates (.learnings / promotion / skill extraction)")
  );
  if (fallbackBullets.length === 0) return [];
  return [{
    priority: "medium",
    status: "pending",
    area: "config",
    summary: "Reflection learning governance candidates",
    details: fallbackBullets.map((line) => `- ${line}`).join("\n"),
    suggestedAction: "Review the governance candidates, promote durable rules to AGENTS.md / SOUL.md / TOOLS.md when stable, and extract a skill if the pattern becomes reusable."
  }];
}
function parseReflectionGovernanceEntry(block) {
  const body = block.replace(/^###\s+Entry\b[^\n]*\n?/i, "").trim();
  if (!body) return null;
  const readField = (label) => {
    const match = body.match(new RegExp(`^\\*\\*${label}\\*\\*:\\s*(.+)$`, "im"));
    const value = match?.[1]?.trim();
    return value ? value : void 0;
  };
  const readSection = (label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = body.match(new RegExp(`^###\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=^###\\s+|$)`, "im"));
    const value = match?.[1]?.trim();
    return value ? value : void 0;
  };
  const summary = readSection("Summary");
  if (!summary) return null;
  return {
    priority: readField("Priority"),
    status: readField("Status"),
    area: readField("Area"),
    summary,
    details: readSection("Details"),
    suggestedAction: readSection("Suggested Action")
  };
}
function extractReflectionMappedMemories(reflectionText) {
  return extractReflectionMappedMemoryItems(reflectionText).map(({ text, category, heading }) => ({ text, category, heading }));
}
function extractReflectionMappedMemoryItems(reflectionText) {
  const mappedSections = [
    {
      heading: "User model deltas (about the human)",
      category: "preference",
      mappedKind: "user-model"
    },
    {
      heading: "Agent model deltas (about the assistant/system)",
      category: "preference",
      mappedKind: "agent-model"
    },
    {
      heading: "Lessons & pitfalls (symptom / cause / fix / prevention)",
      category: "fact",
      mappedKind: "lesson"
    },
    {
      heading: "Decisions (durable)",
      category: "decision",
      mappedKind: "decision"
    }
  ];
  return mappedSections.flatMap(({ heading, category, mappedKind }) => {
    const lines = sanitizeReflectionSliceLines(parseSectionBullets(reflectionText, heading));
    const groupSize = lines.length;
    return lines.map((text, ordinal) => ({ text, category, heading, mappedKind, ordinal, groupSize }));
  });
}
function extractReflectionSlices(reflectionText) {
  const invariantSection = parseSectionBullets(reflectionText, "Invariants");
  const derivedSection = parseSectionBullets(reflectionText, "Derived");
  const mergedSection = parseSectionBullets(reflectionText, "Invariants & Reflections");
  const invariantsPrimary = sanitizeReflectionSliceLines(invariantSection).filter(isInvariantRuleLike);
  const derivedPrimary = sanitizeReflectionSliceLines(derivedSection).filter(isDerivedDeltaLike);
  const invariantLinesLegacy = sanitizeReflectionSliceLines(
    mergedSection.filter((line) => /invariant|stable|policy|rule/i.test(line))
  ).filter(isInvariantRuleLike);
  const reflectionLinesLegacy = sanitizeReflectionSliceLines(
    mergedSection.filter((line) => /reflect|inherit|derive|change|apply/i.test(line))
  ).filter(isDerivedDeltaLike);
  const openLoopLines = sanitizeReflectionSliceLines(parseSectionBullets(reflectionText, "Open loops / next actions")).filter(isOpenLoopAction).filter(isDerivedDeltaLike);
  const durableDecisionLines = sanitizeReflectionSliceLines(parseSectionBullets(reflectionText, "Decisions (durable)")).filter(isInvariantRuleLike);
  const invariants = invariantsPrimary.length > 0 ? invariantsPrimary : invariantLinesLegacy.length > 0 ? invariantLinesLegacy : durableDecisionLines;
  const derived = derivedPrimary.length > 0 ? derivedPrimary : [...reflectionLinesLegacy, ...openLoopLines];
  return {
    invariants: invariants.slice(0, 8),
    derived: derived.slice(0, 10)
  };
}
function extractReflectionSliceItems(reflectionText) {
  const slices = extractReflectionSlices(reflectionText);
  const invariantGroupSize = slices.invariants.length;
  const derivedGroupSize = slices.derived.length;
  const invariantItems = slices.invariants.map((text, ordinal) => ({
    text,
    itemKind: "invariant",
    section: "Invariants",
    ordinal,
    groupSize: invariantGroupSize
  }));
  const derivedItems = slices.derived.map((text, ordinal) => ({
    text,
    itemKind: "derived",
    section: "Derived",
    ordinal,
    groupSize: derivedGroupSize
  }));
  return [...invariantItems, ...derivedItems];
}
var init_reflection_slices = __esm({
  "packages/core/src/reflection-slices.ts"() {
  }
});
var reflection_event_store_exports = {};
__export(reflection_event_store_exports, {
  REFLECTION_SCHEMA_VERSION: () => REFLECTION_SCHEMA_VERSION,
  buildReflectionEventPayload: () => buildReflectionEventPayload,
  createReflectionEventId: () => createReflectionEventId
});
function createReflectionEventId(params) {
  const safeRunAt = Number.isFinite(params.runAt) ? Math.max(0, Math.floor(params.runAt)) : Date.now();
  const datePart = new Date(safeRunAt).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const digest = createHash3("sha1").update(`${safeRunAt}|${params.sessionKey}|${params.sessionId}|${params.agentId}|${params.command}`).digest("hex").slice(0, 8);
  return `refl-${datePart}-${digest}`;
}
function buildReflectionEventPayload(params) {
  const eventId = params.eventId || createReflectionEventId({
    runAt: params.runAt,
    sessionKey: params.sessionKey,
    sessionId: params.sessionId,
    agentId: params.agentId,
    command: params.command
  });
  const metadata = {
    type: "memory-reflection-event",
    reflectionVersion: REFLECTION_SCHEMA_VERSION,
    stage: "reflect-store",
    eventId,
    sessionKey: params.sessionKey,
    sessionId: params.sessionId,
    agentId: params.agentId,
    command: params.command,
    storedAt: params.runAt,
    usedFallback: params.usedFallback,
    errorSignals: params.toolErrorSignals.map((signal) => signal.signatureHash),
    ...params.sourceReflectionPath ? { sourceReflectionPath: params.sourceReflectionPath } : {}
  };
  const text = [
    `reflection-event \xB7 ${params.scope}`,
    `eventId=${eventId}`,
    `session=${params.sessionId}`,
    `agent=${params.agentId}`,
    `command=${params.command}`,
    `usedFallback=${params.usedFallback ? "true" : "false"}`
  ].join("\n");
  return {
    kind: "event",
    text,
    metadata
  };
}
var REFLECTION_SCHEMA_VERSION;
var init_reflection_event_store = __esm({
  "packages/core/src/reflection-event-store.ts"() {
    REFLECTION_SCHEMA_VERSION = 4;
  }
});
function getReflectionItemDecayDefaults(itemKind) {
  if (itemKind === "invariant") {
    return {
      midpointDays: REFLECTION_INVARIANT_DECAY_MIDPOINT_DAYS,
      k: REFLECTION_INVARIANT_DECAY_K,
      baseWeight: REFLECTION_INVARIANT_BASE_WEIGHT,
      quality: REFLECTION_INVARIANT_QUALITY
    };
  }
  return {
    midpointDays: REFLECTION_DERIVED_DECAY_MIDPOINT_DAYS,
    k: REFLECTION_DERIVED_DECAY_K,
    baseWeight: REFLECTION_DERIVED_BASE_WEIGHT,
    quality: REFLECTION_DERIVED_QUALITY
  };
}
function buildReflectionItemPayloads(params) {
  return params.items.map((item) => {
    const defaults2 = getReflectionItemDecayDefaults(item.itemKind);
    const metadata = {
      type: "memory-reflection-item",
      reflectionVersion: 4,
      stage: "reflect-store",
      eventId: params.eventId,
      itemKind: item.itemKind,
      section: item.section,
      ordinal: item.ordinal,
      groupSize: item.groupSize,
      agentId: params.agentId,
      sessionKey: params.sessionKey,
      sessionId: params.sessionId,
      storedAt: params.runAt,
      usedFallback: params.usedFallback,
      errorSignals: params.toolErrorSignals.map((signal) => signal.signatureHash),
      decayModel: "logistic",
      decayMidpointDays: defaults2.midpointDays,
      decayK: defaults2.k,
      baseWeight: defaults2.baseWeight,
      quality: defaults2.quality,
      ...params.sourceReflectionPath ? { sourceReflectionPath: params.sourceReflectionPath } : {}
    };
    return {
      kind: item.itemKind === "invariant" ? "item-invariant" : "item-derived",
      text: item.text,
      metadata
    };
  });
}
var REFLECTION_INVARIANT_DECAY_MIDPOINT_DAYS;
var REFLECTION_INVARIANT_DECAY_K;
var REFLECTION_INVARIANT_BASE_WEIGHT;
var REFLECTION_INVARIANT_QUALITY;
var REFLECTION_DERIVED_DECAY_MIDPOINT_DAYS;
var REFLECTION_DERIVED_DECAY_K;
var REFLECTION_DERIVED_BASE_WEIGHT;
var REFLECTION_DERIVED_QUALITY;
var init_reflection_item_store = __esm({
  "packages/core/src/reflection-item-store.ts"() {
    REFLECTION_INVARIANT_DECAY_MIDPOINT_DAYS = 45;
    REFLECTION_INVARIANT_DECAY_K = 0.22;
    REFLECTION_INVARIANT_BASE_WEIGHT = 1.1;
    REFLECTION_INVARIANT_QUALITY = 1;
    REFLECTION_DERIVED_DECAY_MIDPOINT_DAYS = 7;
    REFLECTION_DERIVED_DECAY_K = 0.65;
    REFLECTION_DERIVED_BASE_WEIGHT = 1;
    REFLECTION_DERIVED_QUALITY = 0.95;
  }
});
var reflection_mapped_metadata_exports = {};
__export(reflection_mapped_metadata_exports, {
  buildReflectionMappedMetadata: () => buildReflectionMappedMetadata,
  getReflectionMappedDecayDefaults: () => getReflectionMappedDecayDefaults
});
function getReflectionMappedDecayDefaults(kind) {
  return REFLECTION_MAPPED_DECAY_DEFAULTS[kind];
}
function buildReflectionMappedMetadata(params) {
  const defaults2 = getReflectionMappedDecayDefaults(params.mappedItem.mappedKind);
  return {
    type: "memory-reflection-mapped",
    reflectionVersion: 4,
    stage: "reflect-store",
    eventId: params.eventId,
    mappedKind: params.mappedItem.mappedKind,
    mappedCategory: params.mappedItem.category,
    section: params.mappedItem.heading,
    ordinal: params.mappedItem.ordinal,
    groupSize: params.mappedItem.groupSize,
    agentId: params.agentId,
    sessionKey: params.sessionKey,
    sessionId: params.sessionId,
    storedAt: params.runAt,
    usedFallback: params.usedFallback,
    errorSignals: params.toolErrorSignals.map((signal) => signal.signatureHash),
    decayModel: "logistic",
    decayMidpointDays: defaults2.midpointDays,
    decayK: defaults2.k,
    baseWeight: defaults2.baseWeight,
    quality: defaults2.quality,
    ...params.sourceReflectionPath ? { sourceReflectionPath: params.sourceReflectionPath } : {}
  };
}
var REFLECTION_MAPPED_DECAY_DEFAULTS;
var init_reflection_mapped_metadata = __esm({
  "packages/core/src/reflection-mapped-metadata.ts"() {
    REFLECTION_MAPPED_DECAY_DEFAULTS = {
      decision: { midpointDays: 45, k: 0.25, baseWeight: 1.1, quality: 1 },
      "user-model": { midpointDays: 21, k: 0.3, baseWeight: 1, quality: 0.95 },
      "agent-model": { midpointDays: 10, k: 0.35, baseWeight: 0.95, quality: 0.93 },
      lesson: { midpointDays: 7, k: 0.45, baseWeight: 0.9, quality: 0.9 }
    };
  }
});
function computeReflectionLogistic(ageDays, midpointDays, k) {
  const safeAgeDays = Number.isFinite(ageDays) ? Math.max(0, ageDays) : 0;
  const safeMidpointDays = Number.isFinite(midpointDays) && midpointDays > 0 ? midpointDays : 1;
  const safeK = Number.isFinite(k) && k > 0 ? k : 0.1;
  return 1 / (1 + Math.exp(safeK * (safeAgeDays - safeMidpointDays)));
}
function computeReflectionScore(input) {
  const logistic = computeReflectionLogistic(input.ageDays, input.midpointDays, input.k);
  const baseWeight = Number.isFinite(input.baseWeight) && input.baseWeight > 0 ? input.baseWeight : 1;
  const quality = Number.isFinite(input.quality) ? Math.max(0, Math.min(1, input.quality)) : 1;
  const fallbackFactor = input.usedFallback ? REFLECTION_FALLBACK_SCORE_FACTOR : 1;
  return logistic * baseWeight * quality * fallbackFactor;
}
function normalizeReflectionLineForAggregation(line) {
  return String(line).trim().replace(/\s+/g, " ").toLowerCase();
}
var REFLECTION_FALLBACK_SCORE_FACTOR;
var init_reflection_ranking = __esm({
  "packages/core/src/reflection-ranking.ts"() {
    REFLECTION_FALLBACK_SCORE_FACTOR = 0.75;
  }
});
var reflection_store_exports = {};
__export(reflection_store_exports, {
  DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS: () => DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS,
  DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS: () => DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS,
  REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT: () => REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT,
  REFLECTION_DERIVE_LOGISTIC_K: () => REFLECTION_DERIVE_LOGISTIC_K,
  REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS: () => REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS,
  buildReflectionStorePayloads: () => buildReflectionStorePayloads,
  computeDerivedLineQuality: () => computeDerivedLineQuality,
  getReflectionDerivedDecayDefaults: () => getReflectionDerivedDecayDefaults,
  getReflectionInvariantDecayDefaults: () => getReflectionInvariantDecayDefaults,
  loadAgentReflectionSlicesFromEntries: () => loadAgentReflectionSlicesFromEntries,
  loadReflectionMappedRowsFromEntries: () => loadReflectionMappedRowsFromEntries,
  storeReflectionToLanceDB: () => storeReflectionToLanceDB
});
function buildReflectionStorePayloads(params) {
  const slices = extractReflectionSlices(params.reflectionText);
  const eventId = params.eventId || createReflectionEventId({
    runAt: params.runAt,
    sessionKey: params.sessionKey,
    sessionId: params.sessionId,
    agentId: params.agentId,
    command: params.command
  });
  const payloads = [
    buildReflectionEventPayload({
      eventId,
      scope: params.scope,
      sessionKey: params.sessionKey,
      sessionId: params.sessionId,
      agentId: params.agentId,
      command: params.command,
      toolErrorSignals: params.toolErrorSignals,
      runAt: params.runAt,
      usedFallback: params.usedFallback,
      sourceReflectionPath: params.sourceReflectionPath
    })
  ];
  const itemPayloads = buildReflectionItemPayloads({
    items: extractReflectionSliceItems(params.reflectionText),
    eventId,
    agentId: params.agentId,
    sessionKey: params.sessionKey,
    sessionId: params.sessionId,
    runAt: params.runAt,
    usedFallback: params.usedFallback,
    toolErrorSignals: params.toolErrorSignals,
    sourceReflectionPath: params.sourceReflectionPath
  });
  payloads.push(...itemPayloads);
  if (params.writeLegacyCombined !== false && (slices.invariants.length > 0 || slices.derived.length > 0)) {
    payloads.push(buildLegacyCombinedPayload({
      slices,
      scope: params.scope,
      sessionKey: params.sessionKey,
      sessionId: params.sessionId,
      agentId: params.agentId,
      command: params.command,
      toolErrorSignals: params.toolErrorSignals,
      runAt: params.runAt,
      usedFallback: params.usedFallback,
      sourceReflectionPath: params.sourceReflectionPath
    }));
  }
  return { eventId, slices, payloads };
}
function buildLegacyCombinedPayload(params) {
  const dateYmd = new Date(params.runAt).toISOString().split("T")[0];
  const deriveQuality = computeDerivedLineQuality(params.slices.derived.length);
  const deriveBaseWeight = params.usedFallback ? REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT : 1;
  return {
    kind: "combined-legacy",
    text: [
      `reflection \xB7 ${params.scope} \xB7 ${dateYmd}`,
      `Session Reflection (${new Date(params.runAt).toISOString()})`,
      `Session Key: ${params.sessionKey}`,
      `Session ID: ${params.sessionId}`,
      "",
      "Invariants:",
      ...params.slices.invariants.length > 0 ? params.slices.invariants.map((x) => `- ${x}`) : ["- (none captured)"],
      "",
      "Derived:",
      ...params.slices.derived.length > 0 ? params.slices.derived.map((x) => `- ${x}`) : ["- (none captured)"]
    ].join("\n"),
    metadata: {
      type: "memory-reflection",
      stage: "reflect-store",
      reflectionVersion: 3,
      sessionKey: params.sessionKey,
      sessionId: params.sessionId,
      agentId: params.agentId,
      command: params.command,
      storedAt: params.runAt,
      invariants: params.slices.invariants,
      derived: params.slices.derived,
      usedFallback: params.usedFallback,
      errorSignals: params.toolErrorSignals.map((s) => s.signatureHash),
      decayModel: "logistic",
      decayMidpointDays: REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS,
      decayK: REFLECTION_DERIVE_LOGISTIC_K,
      deriveBaseWeight,
      deriveQuality,
      deriveSource: params.usedFallback ? "fallback" : "normal",
      ...params.sourceReflectionPath ? { sourceReflectionPath: params.sourceReflectionPath } : {}
    }
  };
}
async function storeReflectionToLanceDB(params) {
  const { eventId, slices, payloads } = buildReflectionStorePayloads(params);
  const storedKinds = [];
  const dedupeThreshold = Number.isFinite(params.dedupeThreshold) ? Number(params.dedupeThreshold) : 0.97;
  for (const payload of payloads) {
    const vector = await params.embedPassage(payload.text);
    if (payload.kind === "combined-legacy") {
      const existing = await params.vectorSearch(vector, 1, 0.1, [params.scope]);
      if (existing.length > 0 && existing[0].score > dedupeThreshold) {
        continue;
      }
    }
    await params.store({
      text: payload.text,
      vector,
      category: "reflection",
      scope: params.scope,
      importance: resolveReflectionImportance(payload.kind),
      metadata: JSON.stringify(payload.metadata)
    });
    storedKinds.push(payload.kind);
  }
  return { stored: storedKinds.length > 0, eventId, slices, storedKinds };
}
function resolveReflectionImportance(kind) {
  if (kind === "event") return 0.55;
  if (kind === "item-invariant") return 0.82;
  if (kind === "item-derived") return 0.78;
  return 0.75;
}
function loadAgentReflectionSlicesFromEntries(params) {
  const now = Number.isFinite(params.now) ? Number(params.now) : Date.now();
  const deriveMaxAgeMs = Number.isFinite(params.deriveMaxAgeMs) ? Math.max(0, Number(params.deriveMaxAgeMs)) : DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS;
  const invariantMaxAgeMs = Number.isFinite(params.invariantMaxAgeMs) ? Math.max(0, Number(params.invariantMaxAgeMs)) : void 0;
  const reflectionRows = params.entries.map((entry) => ({ entry, metadata: parseReflectionMetadata(entry.metadata) })).filter(({ metadata }) => isReflectionMetadataType(metadata.type) && isOwnedByAgent(metadata, params.agentId)).sort((a, b) => b.entry.timestamp - a.entry.timestamp).slice(0, 160);
  const itemRows = reflectionRows.filter(({ metadata }) => metadata.type === "memory-reflection-item");
  const legacyRows = reflectionRows.filter(({ metadata }) => metadata.type === "memory-reflection");
  const invariantCandidates = buildInvariantCandidates(itemRows, legacyRows);
  const derivedCandidates = buildDerivedCandidates(itemRows, legacyRows);
  const invariants = rankReflectionLines(invariantCandidates, {
    now,
    maxAgeMs: invariantMaxAgeMs,
    limit: 8
  });
  const derived = rankReflectionLines(derivedCandidates, {
    now,
    maxAgeMs: deriveMaxAgeMs,
    limit: 10
  });
  return { invariants, derived };
}
function buildInvariantCandidates(itemRows, legacyRows) {
  const itemCandidates = itemRows.filter(({ metadata }) => metadata.itemKind === "invariant").flatMap(({ entry, metadata }) => {
    const lines = sanitizeReflectionSliceLines([entry.text]);
    if (lines.length === 0) return [];
    const defaults2 = getReflectionItemDecayDefaults("invariant");
    const timestamp = metadataTimestamp(metadata, entry.timestamp);
    return lines.map((line) => ({
      line,
      timestamp,
      midpointDays: readPositiveNumber(metadata.decayMidpointDays, defaults2.midpointDays),
      k: readPositiveNumber(metadata.decayK, defaults2.k),
      baseWeight: readPositiveNumber(metadata.baseWeight, defaults2.baseWeight),
      quality: readClampedNumber(metadata.quality, defaults2.quality, 0.2, 1),
      usedFallback: metadata.usedFallback === true
    }));
  });
  if (itemCandidates.length > 0) return itemCandidates;
  return legacyRows.flatMap(({ entry, metadata }) => {
    const defaults2 = getReflectionItemDecayDefaults("invariant");
    const timestamp = metadataTimestamp(metadata, entry.timestamp);
    const lines = sanitizeReflectionSliceLines(toStringArray(metadata.invariants));
    return lines.map((line) => ({
      line,
      timestamp,
      midpointDays: defaults2.midpointDays,
      k: defaults2.k,
      baseWeight: defaults2.baseWeight,
      quality: defaults2.quality,
      usedFallback: metadata.usedFallback === true
    }));
  });
}
function buildDerivedCandidates(itemRows, legacyRows) {
  const itemCandidates = itemRows.filter(({ metadata }) => metadata.itemKind === "derived").flatMap(({ entry, metadata }) => {
    const lines = sanitizeReflectionSliceLines([entry.text]);
    if (lines.length === 0) return [];
    const defaults2 = getReflectionItemDecayDefaults("derived");
    const timestamp = metadataTimestamp(metadata, entry.timestamp);
    return lines.map((line) => ({
      line,
      timestamp,
      midpointDays: readPositiveNumber(metadata.decayMidpointDays, defaults2.midpointDays),
      k: readPositiveNumber(metadata.decayK, defaults2.k),
      baseWeight: readPositiveNumber(metadata.baseWeight, defaults2.baseWeight),
      quality: readClampedNumber(metadata.quality, defaults2.quality, 0.2, 1),
      usedFallback: metadata.usedFallback === true
    }));
  });
  if (itemCandidates.length > 0) return itemCandidates;
  return legacyRows.flatMap(({ entry, metadata }) => {
    const timestamp = metadataTimestamp(metadata, entry.timestamp);
    const lines = sanitizeReflectionSliceLines(toStringArray(metadata.derived));
    if (lines.length === 0) return [];
    const defaults2 = {
      midpointDays: REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS,
      k: REFLECTION_DERIVE_LOGISTIC_K,
      baseWeight: resolveLegacyDeriveBaseWeight(metadata),
      quality: computeDerivedLineQuality(lines.length)
    };
    return lines.map((line) => ({
      line,
      timestamp,
      midpointDays: readPositiveNumber(metadata.decayMidpointDays, defaults2.midpointDays),
      k: readPositiveNumber(metadata.decayK, defaults2.k),
      baseWeight: readPositiveNumber(metadata.deriveBaseWeight, defaults2.baseWeight),
      quality: readClampedNumber(metadata.deriveQuality, defaults2.quality, 0.2, 1),
      usedFallback: metadata.usedFallback === true
    }));
  });
}
function rankReflectionLines(candidates, options) {
  const lineScores = /* @__PURE__ */ new Map();
  for (const candidate of candidates) {
    const timestamp = Number.isFinite(candidate.timestamp) ? candidate.timestamp : options.now;
    if (Number.isFinite(options.maxAgeMs) && options.maxAgeMs >= 0 && options.now - timestamp > options.maxAgeMs) {
      continue;
    }
    const ageDays = Math.max(0, (options.now - timestamp) / 864e5);
    const score = computeReflectionScore({
      ageDays,
      midpointDays: candidate.midpointDays,
      k: candidate.k,
      baseWeight: candidate.baseWeight,
      quality: candidate.quality,
      usedFallback: candidate.usedFallback
    });
    if (!Number.isFinite(score) || score <= 0) continue;
    const key = normalizeReflectionLineForAggregation(candidate.line);
    if (!key) continue;
    const current = lineScores.get(key);
    if (!current) {
      lineScores.set(key, { line: candidate.line, score, latestTs: timestamp });
      continue;
    }
    current.score += score;
    if (timestamp > current.latestTs) {
      current.latestTs = timestamp;
      current.line = candidate.line;
    }
  }
  return [...lineScores.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.latestTs !== a.latestTs) return b.latestTs - a.latestTs;
    return a.line.localeCompare(b.line);
  }).slice(0, options.limit).map((item) => item.line);
}
function isReflectionMetadataType(type) {
  return type === "memory-reflection-item" || type === "memory-reflection";
}
function isOwnedByAgent(metadata, agentId) {
  const owner = typeof metadata.agentId === "string" ? metadata.agentId.trim() : "";
  if (!owner) return true;
  return owner === agentId || owner === "main";
}
function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}
function metadataTimestamp(metadata, fallbackTs) {
  const storedAt = Number(metadata.storedAt);
  if (Number.isFinite(storedAt) && storedAt > 0) return storedAt;
  return Number.isFinite(fallbackTs) ? fallbackTs : Date.now();
}
function readPositiveNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}
function readClampedNumber(value, fallback, min, max) {
  const num = Number(value);
  const resolved = Number.isFinite(num) ? num : fallback;
  return Math.max(min, Math.min(max, resolved));
}
function computeDerivedLineQuality(nonPlaceholderLineCount) {
  const n = Number.isFinite(nonPlaceholderLineCount) ? Math.max(0, Math.floor(nonPlaceholderLineCount)) : 0;
  if (n <= 0) return 0.2;
  return Math.min(1, 0.55 + Math.min(6, n) * 0.075);
}
function resolveLegacyDeriveBaseWeight(metadata) {
  const explicit = Number(metadata.deriveBaseWeight);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.max(0.1, Math.min(1.2, explicit));
  }
  if (metadata.usedFallback === true) {
    return REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT;
  }
  return 1;
}
function loadReflectionMappedRowsFromEntries(params) {
  const now = Number.isFinite(params.now) ? Number(params.now) : Date.now();
  const maxAgeMs = Number.isFinite(params.maxAgeMs) ? Math.max(0, Number(params.maxAgeMs)) : DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS;
  const maxPerKind = Number.isFinite(params.maxPerKind) ? Math.max(1, Math.floor(Number(params.maxPerKind))) : 10;
  const weighted = params.entries.map((entry) => ({ entry, metadata: parseReflectionMetadata(entry.metadata) })).filter(({ metadata }) => metadata.type === "memory-reflection-mapped" && isOwnedByAgent(metadata, params.agentId)).flatMap(({ entry, metadata }) => {
    const mappedKind = parseMappedKind(metadata.mappedKind);
    if (!mappedKind) return [];
    const lines = sanitizeReflectionSliceLines([entry.text]);
    if (lines.length === 0) return [];
    const defaults2 = getReflectionMappedDecayDefaults(mappedKind);
    const timestamp = metadataTimestamp(metadata, entry.timestamp);
    return lines.map((line) => ({
      text: line,
      mappedKind,
      timestamp,
      midpointDays: readPositiveNumber(metadata.decayMidpointDays, defaults2.midpointDays),
      k: readPositiveNumber(metadata.decayK, defaults2.k),
      baseWeight: readPositiveNumber(metadata.baseWeight, defaults2.baseWeight),
      quality: readClampedNumber(metadata.quality, defaults2.quality, 0.2, 1),
      usedFallback: metadata.usedFallback === true
    }));
  });
  const grouped = /* @__PURE__ */ new Map();
  for (const item of weighted) {
    if (now - item.timestamp > maxAgeMs) continue;
    const ageDays = Math.max(0, (now - item.timestamp) / 864e5);
    const score = computeReflectionScore({
      ageDays,
      midpointDays: item.midpointDays,
      k: item.k,
      baseWeight: item.baseWeight,
      quality: item.quality,
      usedFallback: item.usedFallback
    });
    if (!Number.isFinite(score) || score <= 0) continue;
    const normalized = normalizeReflectionLineForAggregation(item.text);
    if (!normalized) continue;
    const key = `${item.mappedKind}::${normalized}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, { text: item.text, score, latestTs: item.timestamp, kind: item.mappedKind });
      continue;
    }
    current.score += score;
    if (item.timestamp > current.latestTs) {
      current.latestTs = item.timestamp;
      current.text = item.text;
    }
  }
  const sortedByKind = (kind) => [...grouped.values()].filter((row) => row.kind === kind).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.latestTs !== a.latestTs) return b.latestTs - a.latestTs;
    return a.text.localeCompare(b.text);
  }).slice(0, maxPerKind).map((row) => row.text);
  return {
    userModel: sortedByKind("user-model"),
    agentModel: sortedByKind("agent-model"),
    lesson: sortedByKind("lesson"),
    decision: sortedByKind("decision")
  };
}
function parseMappedKind(value) {
  if (value === "user-model" || value === "agent-model" || value === "lesson" || value === "decision") {
    return value;
  }
  return null;
}
function getReflectionDerivedDecayDefaults() {
  return {
    midpointDays: REFLECTION_DERIVED_DECAY_MIDPOINT_DAYS,
    k: REFLECTION_DERIVED_DECAY_K
  };
}
function getReflectionInvariantDecayDefaults() {
  return {
    midpointDays: REFLECTION_INVARIANT_DECAY_MIDPOINT_DAYS,
    k: REFLECTION_INVARIANT_DECAY_K
  };
}
var REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS;
var REFLECTION_DERIVE_LOGISTIC_K;
var REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT;
var DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS;
var DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS;
var init_reflection_store = __esm({
  "packages/core/src/reflection-store.ts"() {
    init_reflection_slices();
    init_reflection_metadata();
    init_reflection_event_store();
    init_reflection_item_store();
    init_reflection_mapped_metadata();
    init_reflection_ranking();
    REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS = 3;
    REFLECTION_DERIVE_LOGISTIC_K = 1.2;
    REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT = 0.35;
    DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1e3;
    DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1e3;
  }
});
var memory_upgrader_exports = {};
__export(memory_upgrader_exports, {
  MemoryUpgrader: () => MemoryUpgrader,
  createMemoryUpgrader: () => createMemoryUpgrader
});
function reverseMapCategory(oldCategory, text) {
  switch (oldCategory) {
    case "preference":
      return "preferences";
    case "entity":
      return "entities";
    case "decision":
      return "events";
    case "other":
      return "patterns";
    case "fact":
      if (/\b(my |i am |i'm |name is |叫我|我的|我是)\b/i.test(text) && text.length < 200) {
        return "profile";
      }
      return "cases";
    default:
      return "patterns";
  }
}
function buildUpgradePrompt(text, category) {
  return `You are a memory librarian. Given a raw memory text and its category, produce a structured 3-layer summary.

**Category**: ${category}

**Raw memory text**:
"""
${text.slice(0, 2e3)}
"""

Return ONLY valid JSON (no markdown fences):
{
  "l0_abstract": "One sentence (\u226430 words) summarizing the core fact/preference/event",
  "l1_overview": "A structured markdown summary (2-5 bullet points)",
  "l2_content": "The full original text, cleaned up if needed",
  "resolved_category": "${category}"
}

Rules:
- l0_abstract must be a single concise sentence, suitable as a search index key
- l1_overview should use markdown bullet points to structure the information
- l2_content should preserve the original meaning; may clean up formatting
- resolved_category: if the text is clearly about personal identity/profile info (name, age, role, etc.), set to "profile"; if it's a reusable problem-solution pair, set to "cases"; otherwise keep "${category}"
- Respond in the SAME language as the raw memory text`;
}
function simpleEnrich(text, category) {
  const firstSentence = text.match(/^[^.!?。！？\n]+[.!?。！？]?/)?.[0] || text;
  const l0 = firstSentence.slice(0, 100).trim();
  const l1 = `- ${l0}`;
  return {
    l0_abstract: l0,
    l1_overview: l1,
    l2_content: text
  };
}
function createMemoryUpgrader(store, llm, options = {}) {
  return new MemoryUpgrader(store, llm, options);
}
var MemoryUpgrader;
var init_memory_upgrader = __esm({
  "packages/core/src/memory-upgrader.ts"() {
    init_smart_metadata();
    init_logger();
    MemoryUpgrader = class {
      constructor(store, llm, options = {}) {
        this.store = store;
        this.llm = llm;
        this.options = options;
        this.log = options.log ?? ((msg) => log.info(msg));
      }
      log;
      /**
       * Check if a memory entry is in legacy format (needs upgrade).
       * Legacy = no metadata, or metadata lacks `memory_category`.
       */
      isLegacyMemory(entry) {
        if (!entry.metadata) return true;
        try {
          const meta = JSON.parse(entry.metadata);
          return !meta.memory_category;
        } catch {
          return true;
        }
      }
      /**
       * Scan and count legacy memories without modifying them.
       */
      async countLegacy(scopeFilter) {
        const allMemories = await this.store.list(scopeFilter, void 0, 1e4, 0);
        let legacy = 0;
        const byCategory = {};
        for (const entry of allMemories) {
          if (this.isLegacyMemory(entry)) {
            legacy++;
            byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
          }
        }
        return { total: allMemories.length, legacy, byCategory };
      }
      /**
       * Main upgrade entry point.
       * Scans all memories, filters legacy ones, and enriches them.
       */
      async upgrade(options = {}) {
        const batchSize = options.batchSize ?? this.options.batchSize ?? 10;
        const noLlm = options.noLlm ?? this.options.noLlm ?? false;
        const dryRun = options.dryRun ?? this.options.dryRun ?? false;
        const limit2 = options.limit ?? this.options.limit;
        const result = {
          totalLegacy: 0,
          upgraded: 0,
          skipped: 0,
          errors: []
        };
        this.log("memory-upgrader: scanning memories...");
        const allMemories = await this.store.list(
          options.scopeFilter ?? this.options.scopeFilter,
          void 0,
          1e4,
          0
        );
        const legacyMemories = allMemories.filter((m) => this.isLegacyMemory(m));
        result.totalLegacy = legacyMemories.length;
        result.skipped = allMemories.length - legacyMemories.length;
        if (legacyMemories.length === 0) {
          this.log("memory-upgrader: no legacy memories found \u2014 all memories are already in new format");
          return result;
        }
        this.log(
          `memory-upgrader: found ${legacyMemories.length} legacy memories out of ${allMemories.length} total`
        );
        if (dryRun) {
          const byCategory = {};
          for (const m of legacyMemories) {
            byCategory[m.category] = (byCategory[m.category] || 0) + 1;
          }
          this.log(
            `memory-upgrader: [DRY-RUN] would upgrade ${legacyMemories.length} memories`
          );
          this.log(`memory-upgrader: [DRY-RUN] breakdown: ${JSON.stringify(byCategory)}`);
          return result;
        }
        const toProcess = limit2 ? legacyMemories.slice(0, limit2) : legacyMemories;
        for (let i = 0; i < toProcess.length; i += batchSize) {
          const batch = toProcess.slice(i, i + batchSize);
          this.log(
            `memory-upgrader: processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toProcess.length / batchSize)} (${batch.length} memories)`
          );
          for (const entry of batch) {
            try {
              await this.upgradeEntry(entry, noLlm);
              result.upgraded++;
            } catch (err) {
              const errMsg = `Failed to upgrade ${entry.id}: ${String(err)}`;
              result.errors.push(errMsg);
              this.log(`memory-upgrader: ERROR \u2014 ${errMsg}`);
            }
          }
          this.log(
            `memory-upgrader: progress \u2014 ${result.upgraded} upgraded, ${result.errors.length} errors`
          );
        }
        this.log(
          `memory-upgrader: upgrade complete \u2014 ${result.upgraded} upgraded, ${result.skipped} already new, ${result.errors.length} errors`
        );
        return result;
      }
      /**
       * Upgrade a single legacy memory entry.
       */
      async upgradeEntry(entry, noLlm) {
        let newCategory = reverseMapCategory(entry.category, entry.text);
        let enriched;
        if (!noLlm && this.llm) {
          try {
            const prompt = buildUpgradePrompt(entry.text, newCategory);
            const llmResult = await this.llm.completeJson(prompt);
            if (!llmResult) {
              throw new Error("LLM returned null");
            }
            enriched = {
              l0_abstract: llmResult.l0_abstract || simpleEnrich(entry.text, newCategory).l0_abstract,
              l1_overview: llmResult.l1_overview || simpleEnrich(entry.text, newCategory).l1_overview,
              l2_content: llmResult.l2_content || entry.text
            };
            if (llmResult.resolved_category) {
              const validCategories = /* @__PURE__ */ new Set([
                "profile",
                "preferences",
                "entities",
                "events",
                "cases",
                "patterns"
              ]);
              if (validCategories.has(llmResult.resolved_category)) {
                newCategory = llmResult.resolved_category;
              }
            }
          } catch (err) {
            this.log(
              `memory-upgrader: LLM enrichment failed for ${entry.id}, falling back to simple \u2014 ${String(err)}`
            );
            enriched = simpleEnrich(entry.text, newCategory);
          }
        } else {
          enriched = simpleEnrich(entry.text, newCategory);
        }
        const existingMeta = entry.metadata ? (() => {
          try {
            return JSON.parse(entry.metadata);
          } catch {
            return {};
          }
        })() : {};
        const newMetadata = {
          ...buildSmartMetadata(
            { ...entry, metadata: JSON.stringify(existingMeta) },
            {
              l0_abstract: enriched.l0_abstract,
              l1_overview: enriched.l1_overview,
              l2_content: enriched.l2_content,
              memory_category: newCategory,
              tier: "working",
              access_count: 0,
              confidence: 0.7
            }
          ),
          upgraded_from: entry.category,
          upgraded_at: Date.now()
        };
        await this.store.update(entry.id, {
          // Update text to L0 abstract for better search indexing
          text: enriched.l0_abstract,
          metadata: stringifySmartMetadata(newMetadata)
        });
      }
    };
  }
});
init_smart_metadata();
init_logger();
var PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAe8cshR0FAlDoILPw0aW1AyUNGbQXSOZaQKEZ7T2mXV8=";
var ACTIVATION_URL = process.env.MNEMO_ACTIVATION_URL || "https://activation.m-nemo.ai";
var KEY_CACHE_PATH = join(homedir(), ".mnemo", "pro-key.json");
var _cachedResult = null;
var _cachedPayload = null;
var _warnedOnce = false;
function getMachineFingerprint() {
  const cpu = cpus()[0]?.model || "unknown";
  const raw = `${hostname()}:${arch()}:${cpu}:${platform()}`;
  return createHash("sha256").update(raw).digest("hex");
}
function verifyKey(key) {
  const dotIdx = key.indexOf(".");
  if (dotIdx < 1) return null;
  try {
    const payloadBuf = Buffer.from(key.slice(0, dotIdx), "base64");
    const signatureBuf = Buffer.from(key.slice(dotIdx + 1), "base64");
    const pubKeyObj = createPublicKey({
      key: Buffer.from(PUBLIC_KEY_B64, "base64"),
      format: "der",
      type: "spki"
    });
    const valid = verify(null, payloadBuf, pubKeyObj, signatureBuf);
    if (!valid) return null;
    const payload = JSON.parse(payloadBuf.toString("utf8"));
    if (payload.expires) {
      if (new Date(payload.expires).getTime() < Date.now()) return null;
    }
    if (payload.machine_id) {
      const localFP = getMachineFingerprint();
      if (payload.machine_id !== localFP) return null;
    }
    return payload;
  } catch {
    return null;
  }
}
async function autoActivate(token) {
  try {
    const machine_id = getMachineFingerprint();
    const resp = await fetch(`${ACTIVATION_URL}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, machine_id }),
      signal: AbortSignal.timeout(1e4)
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 409) {
        log.warn(
          `License token already activated on another device. Visit https://m-nemo.ai/pro/migrate to transfer.`
        );
      } else {
        log.warn(`Activation failed: ${err.error || resp.status}`);
      }
      return null;
    }
    const { key } = await resp.json();
    try {
      mkdirSync(join(homedir(), ".mnemo"), { recursive: true });
      writeFileSync(KEY_CACHE_PATH, JSON.stringify({ key, token, activated: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch {
    }
    return key;
  } catch (err) {
    log.warn(`Activation request failed (offline?): ${err}`);
    return null;
  }
}
function loadCachedKey() {
  try {
    const data = JSON.parse(readFileSync(KEY_CACHE_PATH, "utf8"));
    return data.key || null;
  } catch {
    return null;
  }
}
function isProLicensed() {
  if (_cachedResult !== null) return _cachedResult;
  const explicitKey = process.env.MNEMO_PRO_KEY?.trim();
  if (explicitKey) {
    const payload = verifyKey(explicitKey);
    if (payload) {
      _cachedPayload = payload;
      _cachedResult = true;
      return true;
    }
  }
  const cachedKey = loadCachedKey();
  if (cachedKey) {
    const payload = verifyKey(cachedKey);
    if (payload) {
      _cachedPayload = payload;
      _cachedResult = true;
      return true;
    }
  }
  const token = process.env.MNEMO_LICENSE_TOKEN?.trim();
  if (token) {
    autoActivate(token).then((key) => {
      if (key) {
        const payload = verifyKey(key);
        if (payload) {
          _cachedPayload = payload;
          _cachedResult = true;
          log.info(`Pro license activated for ${payload.licensee} (${payload.plan})`);
        }
      }
    }).catch(() => {
    });
  }
  _cachedResult = false;
  return false;
}
function requirePro(featureName) {
  if (isProLicensed()) return true;
  if (!_warnedOnce && process.env.MNEMO_DEBUG) {
    log.info(
      `Pro features disabled \u2014 set MNEMO_PRO_KEY or MNEMO_LICENSE_TOKEN to enable. Core functionality is fully available. https://m-nemo.ai/pro`
    );
    _warnedOnce = true;
  }
  return false;
}
init_logger();
init_storage_adapter();
var _auditCreate = null;
var _auditUpdate = null;
var _auditDelete = null;
var _auditExpire = null;
if (requirePro("audit-log")) {
  Promise.resolve().then(() => (init_audit_log(), audit_log_exports)).then((mod) => {
    _auditCreate = mod.auditCreate;
    _auditUpdate = mod.auditUpdate;
    _auditDelete = mod.auditDelete;
    _auditExpire = mod.auditExpire;
  }).catch(() => {
  });
}
var walAppend2 = null;
var walMarkCommitted2 = null;
var walMarkFailed2 = null;
if (requirePro("wal")) {
  Promise.resolve().then(() => (init_wal_recovery(), wal_recovery_exports)).then((mod) => {
    walAppend2 = mod.walAppend;
    walMarkCommitted2 = mod.walMarkCommitted;
    walMarkFailed2 = mod.walMarkFailed;
  }).catch(() => {
  });
}
var DEDUP_SIMILARITY_THRESHOLD = 0.92;
var CONFLICT_SIMILARITY_THRESHOLD = 0.7;
var _adaptersLoaded = false;
async function ensureAdaptersLoaded() {
  if (_adaptersLoaded) return;
  _adaptersLoaded = true;
  const dbg = !!process.env.MNEMO_DEBUG;
  try {
    await Promise.resolve().then(() => (init_lancedb(), lancedb_exports));
  } catch (e) {
    if (dbg) log.debug("adapter lancedb not available:", e);
  }
  try {
    await Promise.resolve().then(() => (init_qdrant(), qdrant_exports));
  } catch (e) {
    if (dbg) log.debug("adapter qdrant not available:", e);
  }
  try {
    await Promise.resolve().then(() => (init_chroma(), chroma_exports));
  } catch (e) {
    if (dbg) log.debug("adapter chroma not available:", e);
  }
  try {
    await Promise.resolve().then(() => (init_pgvector(), pgvector_exports));
  } catch (e) {
    if (dbg) log.debug("adapter pgvector not available:", e);
  }
}
var lancedbImportPromise = null;
var loadLanceDB2 = async () => {
  if (!lancedbImportPromise) {
    lancedbImportPromise = import("@lancedb/lancedb");
  }
  try {
    return await lancedbImportPromise;
  } catch (err) {
    throw new Error(
      `mnemo: failed to load LanceDB. ${String(err)}`,
      { cause: err }
    );
  }
};
function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
function escapeSqlLiteral(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9\-_.:@ \u4e00-\u9fff\u3400-\u4dbf]/g, "");
}
function normalizeSearchText(value) {
  return value.toLowerCase().trim();
}
function scoreLexicalHit(query, candidates) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;
  let score = 0;
  for (const candidate of candidates) {
    const normalized = normalizeSearchText(candidate.text);
    if (!normalized) continue;
    if (normalized.includes(normalizedQuery)) {
      score = Math.max(score, Math.min(0.95, 0.72 + normalizedQuery.length * 0.02) * candidate.weight);
    }
  }
  return score;
}
var TABLE_NAME2 = "memories";
var MemoryStore = class {
  constructor(config) {
    this.config = config;
  }
  db = null;
  table = null;
  initPromise = null;
  ftsIndexCreated = false;
  updateQueue = Promise.resolve();
  semanticGateInstance = null;
  /** When using a non-LanceDB adapter, this holds the active adapter instance */
  _adapter = null;
  /** True when using the adapter path (non-LanceDB backends) */
  get usingAdapter() {
    return this._adapter !== null;
  }
  /** Inject a SemanticGate instance (created externally with an Embedder). */
  setSemanticGate(gate) {
    this.semanticGateInstance = gate;
  }
  get dbPath() {
    return this.config.dbPath;
  }
  /** Get the active adapter (null if using legacy LanceDB path) */
  get adapter() {
    return this._adapter;
  }
  /** Whether BM25 full-text search is available */
  get hasFtsSupport() {
    if (this._adapter) return this._adapter.hasFullTextSearch();
    return this.ftsIndexCreated;
  }
  async ensureInitialized() {
    if (this.table || this._adapter) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.doInitialize().catch((err) => {
      this.initPromise = null;
      throw err;
    });
    return this.initPromise;
  }
  async doInitialize() {
    const backend = this.config.storageBackend;
    if (backend && backend !== "lancedb") {
      await ensureAdaptersLoaded();
      const available = listAdapters();
      if (!available.includes(backend)) {
        throw new Error(
          `Storage backend "${backend}" not available. Installed: ${available.join(", ")}. Check that the adapter is properly imported.`
        );
      }
      this._adapter = createAdapter(backend, this.config.storageConfig);
      await this._adapter.connect(this.config.dbPath);
      await this._adapter.ensureTable(this.config.vectorDim);
      this.ftsIndexCreated = this._adapter.hasFullTextSearch();
      return;
    }
    const lancedb = await loadLanceDB2();
    let db;
    try {
      db = await lancedb.connect(this.config.dbPath);
    } catch (err) {
      const e = err;
      const code = e.code || "";
      const message = e.message || String(err);
      throw new Error(
        `Failed to open LanceDB at "${this.config.dbPath}": ${code} ${message}
  Fix: Verify the path exists and is writable. Check parent directory permissions.`
      );
    }
    let table;
    try {
      table = await db.openTable(TABLE_NAME2);
      try {
        const sample2 = await table.query().limit(1).toArray();
        if (sample2.length > 0 && !("scope" in sample2[0])) {
          log.warn(
            "Adding scope column for backward compatibility with existing data"
          );
        }
      } catch (err) {
        log.warn("Could not check table schema:", err);
      }
    } catch (_openErr) {
      const schemaEntry = {
        id: "__schema__",
        text: "",
        vector: Array.from({ length: this.config.vectorDim }).fill(
          0
        ),
        category: "other",
        scope: "global",
        importance: 0,
        timestamp: 0,
        metadata: "{}"
      };
      try {
        table = await db.createTable(TABLE_NAME2, [schemaEntry]);
        await table.delete('id = "__schema__"');
      } catch (createErr) {
        if (String(createErr).includes("already exists")) {
          table = await db.openTable(TABLE_NAME2);
        } else {
          throw createErr;
        }
      }
    }
    const sample = await table.query().limit(1).toArray();
    if (sample.length > 0 && sample[0]?.vector?.length) {
      const existingDim = sample[0].vector.length;
      if (existingDim !== this.config.vectorDim) {
        throw new Error(
          `Vector dimension mismatch: table=${existingDim}, config=${this.config.vectorDim}. Create a new table/dbPath or set matching embedding.dimensions.`
        );
      }
    }
    try {
      await this.createFtsIndex(table);
      this.ftsIndexCreated = true;
    } catch (err) {
      log.warn(
        "Failed to create FTS index, falling back to vector-only search:",
        err
      );
      this.ftsIndexCreated = false;
    }
    this.db = db;
    this.table = table;
  }
  async createFtsIndex(table) {
    try {
      const indices = await table.listIndices();
      const hasFtsIndex = indices?.some(
        // TODO: type this — LanceDB index type lacks proper typings for indexType/columns
        (idx) => idx.indexType === "FTS" || idx.columns?.includes("text")
      );
      if (!hasFtsIndex) {
        const lancedb = await loadLanceDB2();
        await table.createIndex("text", {
          // TODO: type this — LanceDB dynamic import doesn't expose Index type
          config: lancedb.Index.fts()
        });
      }
    } catch (err) {
      throw new Error(
        `FTS index creation failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  async store(entry) {
    await this.ensureInitialized();
    if (this.config.semanticGate !== false && this.semanticGateInstance) {
      try {
        const passed = await this.semanticGateInstance.shouldPass(entry.vector, entry.text);
        if (!passed) {
          return {
            ...entry,
            id: "__filtered__",
            timestamp: Date.now(),
            metadata: entry.metadata || "{}"
          };
        }
      } catch {
      }
    }
    if (this.config.deduplication !== false && entry.vector && entry.vector.length > 0) {
      try {
        const scopeFilter = entry.scope ? [entry.scope] : void 0;
        const similar = await this.vectorSearch(entry.vector, 3, 0.3, scopeFilter);
        for (const match of similar) {
          const cosineSim = 2 - 1 / match.score;
          if (cosineSim > DEDUP_SIMILARITY_THRESHOLD) {
            const existingMeta = parseSmartMetadata(match.entry.metadata, match.entry);
            const accessCount = (existingMeta.access_count ?? 0) + 1;
            const updates = {};
            if (entry.text.length > match.entry.text.length) {
              updates.text = entry.text;
            }
            if (entry.importance > match.entry.importance) {
              updates.importance = entry.importance;
            }
            const patchedMeta = {
              ...existingMeta,
              access_count: accessCount,
              updatedAt: Date.now()
            };
            updates.metadata = stringifySmartMetadata(patchedMeta);
            await this.update(match.entry.id, updates, scopeFilter);
            return {
              ...match.entry,
              id: match.entry.id,
              timestamp: match.entry.timestamp,
              metadata: updates.metadata
            };
          }
        }
      } catch {
      }
    }
    if (this.config.deduplication !== false && entry.vector && entry.vector.length > 0) {
      try {
        const similar = await this.vectorSearch(entry.vector, 3, 0.3);
        for (const match of similar) {
          const cosineSim = 2 - 1 / match.score;
          if (cosineSim > CONFLICT_SIMILARITY_THRESHOLD && cosineSim <= DEDUP_SIMILARITY_THRESHOLD) {
            const oldText = match.entry.text || "";
            const newText = entry.text || "";
            const hasContradictionSignal = /改成|变成|更新为|换成|不再|取消了|changed to|updated to|no longer|switched to/i.test(newText) || oldText.match(/\d+/) && newText.match(/\d+/) && cosineSim > 0.8;
            if (hasContradictionSignal) {
              _auditExpire?.(
                match.entry.id,
                match.entry.scope || "global",
                "contradiction",
                `old: "${match.entry.text?.slice(0, 100)}" \u2192 new: "${newText.slice(0, 100)}"`
              );
              const existingMeta = parseSmartMetadata(match.entry.metadata, match.entry);
              const oldImportance = match.entry.importance ?? 0.7;
              existingMeta.expired_at = (/* @__PURE__ */ new Date()).toISOString();
              existingMeta.expired_reason = `superseded: ${newText.slice(0, 80)}`;
              await this.update(
                match.entry.id,
                {
                  importance: Math.max(0.05, oldImportance * 0.1),
                  metadata: stringifySmartMetadata(existingMeta)
                }
              );
            }
          }
        }
      } catch {
      }
    }
    const fullEntry = {
      ...entry,
      id: randomUUID(),
      timestamp: Date.now(),
      metadata: entry.metadata || "{}"
    };
    const walTs = new Date(fullEntry.timestamp).toISOString();
    if (walAppend2) {
      await walAppend2({
        ts: walTs,
        action: "write",
        text: fullEntry.text,
        scope: fullEntry.scope || "default",
        category: fullEntry.category || "fact",
        groupId: "lancedb",
        importance: fullEntry.importance ?? 0.7,
        status: "pending"
      }).catch(() => {
      });
    }
    try {
      if (this._adapter) {
        await this._adapter.add([fullEntry]);
      } else {
        await this.table.add([fullEntry]);
      }
      walMarkCommitted2?.(walTs).catch(() => {
      });
    } catch (err) {
      walMarkFailed2?.(walTs, String(err)).catch(() => {
      });
      const e = err;
      const code = e.code || "";
      const message = e.message || String(err);
      throw new Error(
        `Failed to store memory in "${this.config.dbPath}": ${code} ${message}`
      );
    }
    _auditCreate?.(fullEntry.id, fullEntry.scope, fullEntry.scope, "store", fullEntry.text?.slice(0, 200));
    const textLen = (fullEntry.text || "").length;
    const entryImportance = typeof fullEntry.importance === "number" ? fullEntry.importance : 0.7;
    if (process.env.GRAPHITI_ENABLED === "true" && entryImportance >= 0.5 && textLen >= 20) {
      const graphitiBase = process.env.GRAPHITI_BASE_URL || "http://127.0.0.1:18799";
      const scope = fullEntry.scope || "default";
      const groupId = scope.startsWith("agent:") ? scope.split(":")[1] || "default" : "default";
      const graphitiWalTs = `graphiti-${walTs}`;
      if (walAppend2) {
        walAppend2({
          ts: graphitiWalTs,
          action: "write",
          text: fullEntry.text,
          scope,
          category: fullEntry.category || "fact",
          groupId,
          importance: entryImportance,
          status: "pending"
        }).catch(() => {
        });
      }
      fetch(`${graphitiBase}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[${fullEntry.category || "fact"}] ${fullEntry.text}`,
          group_id: groupId,
          reference_time: walTs,
          source: `lancedb-pro-store-${groupId}`,
          category: fullEntry.category || "fact"
        }),
        signal: AbortSignal.timeout(15e3)
      }).then(() => {
        walMarkCommitted2?.(graphitiWalTs).catch(() => {
        });
      }).catch((err) => {
        walMarkFailed2?.(graphitiWalTs, String(err)).catch(() => {
        });
      });
    }
    return fullEntry;
  }
  /**
   * Import a pre-built entry while preserving its id/timestamp.
   * Used for re-embedding / migration / A/B testing across embedding models.
   * Intentionally separate from `store()` to keep normal writes simple.
   */
  async importEntry(entry) {
    await this.ensureInitialized();
    if (!entry.id || typeof entry.id !== "string") {
      throw new Error("importEntry requires a stable id");
    }
    const vector = entry.vector || [];
    if (!Array.isArray(vector) || vector.length !== this.config.vectorDim) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.config.vectorDim}, got ${Array.isArray(vector) ? vector.length : "non-array"}`
      );
    }
    const full = {
      ...entry,
      scope: entry.scope || "global",
      importance: Number.isFinite(entry.importance) ? entry.importance : 0.7,
      timestamp: Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now(),
      metadata: entry.metadata || "{}"
    };
    await this.table.add([full]);
    return full;
  }
  async hasId(id) {
    await this.ensureInitialized();
    if (this._adapter) {
      const results = await this._adapter.query({ where: `id = '${escapeSqlLiteral(id)}'`, limit: 1 });
      return results.length > 0;
    }
    const safeId = escapeSqlLiteral(id);
    const res = await this.table.query().select(["id"]).where(`id = '${safeId}'`).limit(1).toArray();
    return res.length > 0;
  }
  async getById(id, scopeFilter) {
    await this.ensureInitialized();
    if (this._adapter) {
      const results = await this._adapter.query({ where: `id = '${escapeSqlLiteral(id)}'`, limit: 1 });
      if (results.length === 0) return null;
      const r = results[0];
      return { id: r.id, text: r.text, vector: r.vector, category: r.category, scope: r.scope, importance: r.importance, timestamp: r.timestamp, metadata: r.metadata };
    }
    const safeId = escapeSqlLiteral(id);
    const rows = await this.table.query().where(`id = '${safeId}'`).limit(1).toArray();
    if (rows.length === 0) return null;
    const row = rows[0];
    const rowScope = row.scope ?? "global";
    if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
      return null;
    }
    return {
      id: row.id,
      text: row.text,
      vector: Array.from(row.vector),
      category: row.category,
      scope: rowScope,
      importance: Number(row.importance),
      timestamp: Number(row.timestamp),
      metadata: row.metadata || "{}"
    };
  }
  async vectorSearch(vector, limit2 = 5, minScore = 0.3, scopeFilter) {
    await this.ensureInitialized();
    if (this._adapter) {
      const results2 = await this._adapter.vectorSearch(vector, limit2, minScore, scopeFilter);
      return results2.map((r) => ({
        entry: { id: r.record.id, text: r.record.text, vector: r.record.vector, category: r.record.category, scope: r.record.scope, importance: r.record.importance, timestamp: r.record.timestamp, metadata: r.record.metadata },
        score: r.score
      }));
    }
    const safeLimit = clampInt(limit2, 1, 20);
    const fetchLimit = Math.min(safeLimit * 10, 200);
    let query = this.table.vectorSearch(vector).distanceType("cosine").limit(fetchLimit);
    if (scopeFilter && scopeFilter.length > 0) {
      const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
      query = query.where(`(${scopeConditions}) OR scope IS NULL`);
    }
    const results = await query.toArray();
    const mapped = [];
    for (const row of results) {
      const distance = Number(row._distance ?? 0);
      const score = 1 / (1 + distance);
      if (score < minScore) continue;
      const rowScope = row.scope ?? "global";
      if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
        continue;
      }
      mapped.push({
        entry: {
          id: row.id,
          text: row.text,
          vector: row.vector,
          category: row.category,
          scope: rowScope,
          importance: Number(row.importance),
          timestamp: Number(row.timestamp),
          metadata: row.metadata || "{}"
        },
        score
      });
      if (mapped.length >= safeLimit) break;
    }
    return mapped;
  }
  async bm25Search(query, limit2 = 5, scopeFilter) {
    await this.ensureInitialized();
    if (this._adapter) {
      const results = await this._adapter.fullTextSearch(query, limit2, scopeFilter);
      return results.map((r) => ({
        entry: { id: r.record.id, text: r.record.text, vector: r.record.vector, category: r.record.category, scope: r.record.scope, importance: r.record.importance, timestamp: r.record.timestamp, metadata: r.record.metadata },
        score: r.score
      }));
    }
    const safeLimit = clampInt(limit2, 1, 20);
    if (!this.ftsIndexCreated) {
      return this.lexicalFallbackSearch(query, safeLimit, scopeFilter);
    }
    try {
      let searchQuery = this.table.search(query, "fts").limit(safeLimit);
      if (scopeFilter && scopeFilter.length > 0) {
        const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
        searchQuery = searchQuery.where(
          `(${scopeConditions}) OR scope IS NULL`
        );
      }
      const results = await searchQuery.toArray();
      const mapped = [];
      for (const row of results) {
        const rowScope = row.scope ?? "global";
        if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
          continue;
        }
        const rawScore = row._score != null ? Number(row._score) : 0;
        const normalizedScore = rawScore > 0 ? 1 / (1 + Math.exp(-rawScore / 5)) : 0.5;
        mapped.push({
          entry: {
            id: row.id,
            text: row.text,
            vector: row.vector,
            category: row.category,
            scope: rowScope,
            importance: Number(row.importance),
            timestamp: Number(row.timestamp),
            metadata: row.metadata || "{}"
          },
          score: normalizedScore
        });
      }
      if (mapped.length > 0) {
        return mapped;
      }
      return this.lexicalFallbackSearch(query, safeLimit, scopeFilter);
    } catch (err) {
      log.warn("BM25 search failed, falling back to empty results:", err);
      return this.lexicalFallbackSearch(query, safeLimit, scopeFilter);
    }
  }
  async lexicalFallbackSearch(query, limit2, scopeFilter) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    let searchQuery = this.table.query().select([
      "id",
      "text",
      "vector",
      "category",
      "scope",
      "importance",
      "timestamp",
      "metadata"
    ]);
    if (scopeFilter && scopeFilter.length > 0) {
      const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
      searchQuery = searchQuery.where(`(${scopeConditions}) OR scope IS NULL`);
    }
    const rows = await searchQuery.toArray();
    const matches = [];
    for (const row of rows) {
      const rowScope = row.scope ?? "global";
      if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
        continue;
      }
      const entry = {
        id: row.id,
        text: row.text,
        vector: row.vector,
        category: row.category,
        scope: rowScope,
        importance: Number(row.importance),
        timestamp: Number(row.timestamp),
        metadata: row.metadata || "{}"
      };
      const metadata = parseSmartMetadata(entry.metadata, entry);
      const score = scoreLexicalHit(trimmedQuery, [
        { text: entry.text, weight: 1 },
        { text: metadata.l0_abstract, weight: 0.98 },
        { text: metadata.l1_overview, weight: 0.92 },
        { text: metadata.l2_content, weight: 0.96 }
      ]);
      if (score <= 0) continue;
      matches.push({ entry, score });
    }
    return matches.sort((a, b) => b.score - a.score || b.entry.timestamp - a.entry.timestamp).slice(0, limit2);
  }
  async delete(id, scopeFilter) {
    await this.ensureInitialized();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const prefixRegex = /^[0-9a-f]{8,}$/i;
    const isFullId = uuidRegex.test(id);
    const isPrefix = !isFullId && prefixRegex.test(id);
    if (!isFullId && !isPrefix) {
      throw new Error(`Invalid memory ID format: ${id}`);
    }
    let candidates;
    if (isFullId) {
      candidates = await this.table.query().where(`id = '${id}'`).limit(1).toArray();
    } else {
      const all = await this.table.query().select(["id", "scope"]).limit(1e3).toArray();
      candidates = all.filter((r) => r.id.startsWith(id));
      if (candidates.length > 1) {
        throw new Error(
          `Ambiguous prefix "${id}" matches ${candidates.length} memories. Use a longer prefix or full ID.`
        );
      }
    }
    if (candidates.length === 0) {
      return false;
    }
    const resolvedId = candidates[0].id;
    const rowScope = candidates[0].scope ?? "global";
    if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
      throw new Error(`Memory ${resolvedId} is outside accessible scopes`);
    }
    _auditDelete?.([resolvedId], rowScope, "user-request");
    if (this._adapter) {
      await this._adapter.delete(`id = '${escapeSqlLiteral(resolvedId)}'`);
    } else {
      await this.table.delete(`id = '${resolvedId}'`);
    }
    return true;
  }
  async list(scopeFilter, category, limit2 = 20, offset = 0) {
    await this.ensureInitialized();
    let query = this.table.query();
    const conditions = [];
    if (scopeFilter && scopeFilter.length > 0) {
      const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
      conditions.push(`((${scopeConditions}) OR scope IS NULL)`);
    }
    if (category) {
      conditions.push(`category = '${escapeSqlLiteral(category)}'`);
    }
    if (conditions.length > 0) {
      query = query.where(conditions.join(" AND "));
    }
    const results = await query.select([
      "id",
      "text",
      "category",
      "scope",
      "importance",
      "timestamp",
      "metadata"
    ]).toArray();
    return results.map(
      (row) => ({
        id: row.id,
        text: row.text,
        vector: [],
        // Don't include vectors in list results for performance
        category: row.category,
        scope: row.scope ?? "global",
        importance: Number(row.importance),
        timestamp: Number(row.timestamp),
        metadata: row.metadata || "{}"
      })
    ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(offset, offset + limit2);
  }
  async stats(scopeFilter) {
    await this.ensureInitialized();
    let query = this.table.query();
    if (scopeFilter && scopeFilter.length > 0) {
      const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
      query = query.where(`((${scopeConditions}) OR scope IS NULL)`);
    }
    const results = await query.select(["scope", "category"]).toArray();
    const scopeCounts = {};
    const categoryCounts = {};
    for (const row of results) {
      const scope = row.scope ?? "global";
      const category = row.category;
      scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    return {
      totalCount: results.length,
      scopeCounts,
      categoryCounts
    };
  }
  async update(id, updates, scopeFilter) {
    await this.ensureInitialized();
    return this.runSerializedUpdate(async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const prefixRegex = /^[0-9a-f]{8,}$/i;
      const isFullId = uuidRegex.test(id);
      const isPrefix = !isFullId && prefixRegex.test(id);
      if (!isFullId && !isPrefix) {
        throw new Error(`Invalid memory ID format: ${id}`);
      }
      let rows;
      if (isFullId) {
        const safeId = escapeSqlLiteral(id);
        rows = await this.table.query().where(`id = '${safeId}'`).limit(1).toArray();
      } else {
        const all = await this.table.query().select([
          "id",
          "text",
          "vector",
          "category",
          "scope",
          "importance",
          "timestamp",
          "metadata"
        ]).limit(1e3).toArray();
        rows = all.filter((r) => r.id.startsWith(id));
        if (rows.length > 1) {
          throw new Error(
            `Ambiguous prefix "${id}" matches ${rows.length} memories. Use a longer prefix or full ID.`
          );
        }
      }
      if (rows.length === 0) return null;
      const row = rows[0];
      const rowScope = row.scope ?? "global";
      if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(rowScope)) {
        throw new Error(`Memory ${id} is outside accessible scopes`);
      }
      const original = {
        id: row.id,
        text: row.text,
        vector: Array.from(row.vector),
        category: row.category,
        scope: rowScope,
        importance: Number(row.importance),
        timestamp: Number(row.timestamp),
        metadata: row.metadata || "{}"
      };
      const updated = {
        ...original,
        text: updates.text ?? original.text,
        vector: updates.vector ?? original.vector,
        category: updates.category ?? original.category,
        scope: rowScope,
        importance: updates.importance ?? original.importance,
        timestamp: original.timestamp,
        // preserve original
        metadata: updates.metadata ?? original.metadata
      };
      _auditUpdate?.(
        original.id,
        rowScope,
        "memory-update",
        JSON.stringify({
          old: { text: original.text?.slice(0, 200), importance: original.importance, category: original.category },
          new: { text: updated.text?.slice(0, 200), importance: updated.importance, category: updated.category }
        })
      );
      const rollbackCandidate = await this.getById(original.id).catch(() => null) ?? original;
      const resolvedId = escapeSqlLiteral(row.id);
      await this.table.delete(`id = '${resolvedId}'`);
      try {
        await this.table.add([updated]);
      } catch (addError) {
        const current = await this.getById(original.id).catch(() => null);
        if (current) {
          throw new Error(
            `Failed to update memory ${id}: write failed after delete, but an existing record was preserved. Write error: ${addError instanceof Error ? addError.message : String(addError)}`
          );
        }
        try {
          await this.table.add([rollbackCandidate]);
        } catch (rollbackError) {
          throw new Error(
            `Failed to update memory ${id}: write failed after delete, and rollback also failed. Write error: ${addError instanceof Error ? addError.message : String(addError)}. Rollback error: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`
          );
        }
        throw new Error(
          `Failed to update memory ${id}: write failed after delete, latest available record restored. Write error: ${addError instanceof Error ? addError.message : String(addError)}`
        );
      }
      return updated;
    });
  }
  async runSerializedUpdate(action) {
    const previous = this.updateQueue;
    let release;
    const lock = new Promise((resolve) => {
      release = resolve;
    });
    this.updateQueue = previous.then(() => lock);
    await previous;
    try {
      return await action();
    } finally {
      release?.();
    }
  }
  async patchMetadata(id, patch, scopeFilter) {
    const existing = await this.getById(id, scopeFilter);
    if (!existing) return null;
    const metadata = buildSmartMetadata(existing, patch);
    return this.update(
      id,
      { metadata: stringifySmartMetadata(metadata) },
      scopeFilter
    );
  }
  async bulkDelete(scopeFilter, beforeTimestamp) {
    await this.ensureInitialized();
    const conditions = [];
    if (scopeFilter.length > 0) {
      const scopeConditions = scopeFilter.map((scope) => `scope = '${escapeSqlLiteral(scope)}'`).join(" OR ");
      conditions.push(`(${scopeConditions})`);
    }
    if (beforeTimestamp) {
      conditions.push(`timestamp < ${beforeTimestamp}`);
    }
    if (conditions.length === 0) {
      throw new Error(
        "Bulk delete requires at least scope or timestamp filter for safety"
      );
    }
    const whereClause = conditions.join(" AND ");
    const countResults = await this.table.query().where(whereClause).toArray();
    const deleteCount = countResults.length;
    if (deleteCount > 0) {
      await this.table.delete(whereClause);
    }
    return deleteCount;
  }
  /** Last FTS error for diagnostics */
  _lastFtsError = null;
  get lastFtsError() {
    return this._lastFtsError;
  }
  /** Get FTS index health status */
  getFtsStatus() {
    return {
      available: this.ftsIndexCreated,
      lastError: this._lastFtsError
    };
  }
  /** Rebuild FTS index (drops and recreates). Useful for recovery after corruption. */
  async rebuildFtsIndex() {
    await this.ensureInitialized();
    try {
      const indices = await this.table.listIndices();
      for (const idx of indices) {
        if (idx.indexType === "FTS" || idx.columns?.includes("text")) {
          try {
            await this.table.dropIndex(idx.name || "text");
          } catch (err) {
            log.warn(`dropIndex(${idx.name || "text"}) failed:`, err);
          }
        }
      }
      await this.createFtsIndex(this.table);
      this.ftsIndexCreated = true;
      this._lastFtsError = null;
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._lastFtsError = msg;
      this.ftsIndexCreated = false;
      return { success: false, error: msg };
    }
  }
};
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
var uuid4 = function() {
  const { crypto: crypto2 } = globalThis;
  if (crypto2?.randomUUID) {
    uuid4 = crypto2.randomUUID.bind(crypto2);
    return crypto2.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
};
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error.stack = err.stack;
        if (err.cause && !error.cause)
          error.cause = err.cause;
        if (err.name)
          error.name = err.name;
        return error;
      }
    } catch {
    }
    try {
      return new Error(JSON.stringify(err));
    } catch {
    }
  }
  return new Error(err);
};
var OpenAIError = class extends Error {
};
var APIError = class _APIError extends OpenAIError {
  constructor(status, error, message, headers) {
    super(`${_APIError.makeMessage(status, error, message)}`);
    this.status = status;
    this.headers = headers;
    this.requestID = headers?.get("x-request-id");
    this.error = error;
    const data = error;
    this.code = data?.["code"];
    this.param = data?.["param"];
    this.type = data?.["type"];
  }
  static makeMessage(status, error, message) {
    const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
    if (status && msg) {
      return `${status} ${msg}`;
    }
    if (status) {
      return `${status} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status, errorResponse, message, headers) {
    if (!status || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) });
    }
    const error = errorResponse?.["error"];
    if (status === 400) {
      return new BadRequestError(status, error, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, error, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, error, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, error, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error, message, headers);
    }
    if (status === 429) {
      return new RateLimitError(status, error, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, error, message, headers);
    }
    return new _APIError(status, error, message, headers);
  }
};
var APIUserAbortError = class extends APIError {
  constructor({ message } = {}) {
    super(void 0, void 0, message || "Request was aborted.", void 0);
  }
};
var APIConnectionError = class extends APIError {
  constructor({ message, cause }) {
    super(void 0, void 0, message || "Connection error.", void 0);
    if (cause)
      this.cause = cause;
  }
};
var APIConnectionTimeoutError = class extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
};
var BadRequestError = class extends APIError {
};
var AuthenticationError = class extends APIError {
};
var PermissionDeniedError = class extends APIError {
};
var NotFoundError = class extends APIError {
};
var ConflictError = class extends APIError {
};
var UnprocessableEntityError = class extends APIError {
};
var RateLimitError = class extends APIError {
};
var InternalServerError = class extends APIError {
};
var LengthFinishReasonError = class extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the length limit was reached`);
  }
};
var ContentFilterFinishReasonError = class extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the request was rejected by the content filter`);
  }
};
var InvalidWebhookSignatureError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var isArray = (val) => (isArray = Array.isArray, isArray(val));
var isReadonlyArray = isArray;
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function isObj(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}
var validatePositiveInteger = (name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new OpenAIError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new OpenAIError(`${name} must be a positive integer`);
  }
  return n;
};
var safeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return void 0;
  }
};
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var VERSION = "6.32.0";
var isRunningInBrowser = () => {
  return (
    // @ts-ignore
    typeof window !== "undefined" && // @ts-ignore
    typeof window.document !== "undefined" && // @ts-ignore
    typeof navigator !== "undefined"
  );
};
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
var getPlatformProperties = () => {
  const detectedPlatform = getDetectedPlatform();
  if (detectedPlatform === "deno") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version
    };
  }
  if (detectedPlatform === "node") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var normalizeArch = (arch2) => {
  if (arch2 === "x32")
    return "x32";
  if (arch2 === "x86_64" || arch2 === "x64")
    return "x64";
  if (arch2 === "arm")
    return "arm";
  if (arch2 === "aarch64" || arch2 === "arm64")
    return "arm64";
  if (arch2)
    return `other:${arch2}`;
  return "unknown";
};
var normalizePlatform = (platform2) => {
  platform2 = platform2.toLowerCase();
  if (platform2.includes("ios"))
    return "iOS";
  if (platform2 === "android")
    return "Android";
  if (platform2 === "darwin")
    return "MacOS";
  if (platform2 === "win32")
    return "Windows";
  if (platform2 === "freebsd")
    return "FreeBSD";
  if (platform2 === "openbsd")
    return "OpenBSD";
  if (platform2 === "linux")
    return "Linux";
  if (platform2)
    return `Other:${platform2}`;
  return "Unknown";
};
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream = globalThis.ReadableStream;
  if (typeof ReadableStream === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";
var has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
var hex_table = /* @__PURE__ */ (() => {
  const array = [];
  for (let i = 0; i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }
  return array;
})();
var limit = 1024;
var encode = (str2, _defaultEncoder, charset, _kind, format) => {
  if (str2.length === 0) {
    return str2;
  }
  let string = str2;
  if (typeof str2 === "symbol") {
    string = Symbol.prototype.toString.call(str2);
  } else if (typeof str2 !== "string") {
    string = String(str2);
  }
  if (charset === "iso-8859-1") {
    return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
      return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
    });
  }
  let out = "";
  for (let j = 0; j < string.length; j += limit) {
    const segment = string.length >= limit ? string.slice(j, j + limit) : string;
    const arr = [];
    for (let i = 0; i < segment.length; ++i) {
      let c = segment.charCodeAt(i);
      if (c === 45 || // -
      c === 46 || // .
      c === 95 || // _
      c === 126 || // ~
      c >= 48 && c <= 57 || // 0-9
      c >= 65 && c <= 90 || // a-z
      c >= 97 && c <= 122 || // A-Z
      format === RFC1738 && (c === 40 || c === 41)) {
        arr[arr.length] = segment.charAt(i);
        continue;
      }
      if (c < 128) {
        arr[arr.length] = hex_table[c];
        continue;
      }
      if (c < 2048) {
        arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
        continue;
      }
      if (c < 55296 || c >= 57344) {
        arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        continue;
      }
      i += 1;
      c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
      arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
    }
    out += arr.join("");
  }
  return out;
};
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}
var array_prefix_generators = {
  brackets(prefix) {
    return String(prefix) + "[]";
  },
  comma: "comma",
  indices(prefix, key) {
    return String(prefix) + "[" + key + "]";
  },
  repeat(prefix) {
    return String(prefix);
  }
};
var push_to_array = function(arr, value_or_array) {
  Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
};
var toISOString;
var defaults = {
  addQueryPrefix: false,
  allowDots: false,
  allowEmptyArrays: false,
  arrayFormat: "indices",
  charset: "utf-8",
  charsetSentinel: false,
  delimiter: "&",
  encode: true,
  encodeDotInKeys: false,
  encoder: encode,
  encodeValuesOnly: false,
  format: default_format,
  formatter: default_formatter,
  /** @deprecated */
  indices: false,
  serializeDate(date) {
    return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
var sentinel = {};
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder) {
      const key_value = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder) {
      obj = maybe_map(obj, encoder);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "brackets" });
}
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
var encodeUTF8_;
function encodeUTF8(str2) {
  let encoder;
  return (encodeUTF8_ ?? (encoder = new globalThis.TextEncoder(), encodeUTF8_ = encoder.encode.bind(encoder)))(str2);
}
var decodeUTF8_;
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}
var _LineDecoder_buffer;
var _LineDecoder_carriageReturnIndex;
var LineDecoder = class {
  constructor() {
    _LineDecoder_buffer.set(this, void 0);
    _LineDecoder_carriageReturnIndex.set(this, void 0);
    __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
    __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
  }
  decode(chunk) {
    if (chunk == null) {
      return [];
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
    const lines = [];
    let patternIndex;
    while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
      if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
        continue;
      }
      if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
        lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
        __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        continue;
      }
      const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
      const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
      lines.push(line);
      __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
      __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
    }
    return lines;
  }
  flush() {
    if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
      return [];
    }
    return this.decode("\n");
  }
};
_LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return void 0;
};
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap();
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
var formatRequestDetails = (details) => {
  if (details.options) {
    details.options = { ...details.options };
    delete details.options["headers"];
  }
  if (details.headers) {
    details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
      name,
      name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
    ]));
  }
  if ("retryOfRequestLogID" in details) {
    if (details.retryOfRequestLogID) {
      details.retryOf = details.retryOfRequestLogID;
    }
    delete details.retryOfRequestLogID;
  }
  return details;
};
var _Stream_client;
var Stream = class _Stream {
  constructor(iterator, controller, client) {
    this.iterator = iterator;
    _Stream_client.set(this, void 0);
    this.controller = controller;
    __classPrivateFieldSet(this, _Stream_client, client, "f");
  }
  static fromSSEResponse(response, controller, client, synthesizeEventData) {
    let consumed = false;
    const logger = client ? loggerFor(client) : console;
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done)
            continue;
          if (sse.data.startsWith("[DONE]")) {
            done = true;
            continue;
          }
          if (sse.event === null || !sse.event.startsWith("thread.")) {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              logger.error(`Could not parse message into JSON:`, sse.data);
              logger.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (data && data.error) {
              throw new APIError(void 0, data.error, void 0, response.headers);
            }
            yield synthesizeEventData ? { event: sse.event, data } : data;
          } else {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`Could not parse message into JSON:`, sse.data);
              console.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (sse.event == "error") {
              throw new APIError(void 0, data.error, data.message, void 0);
            }
            yield { event: sse.event, data };
          }
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  /**
   * Generates a Stream from a newline-separated ReadableStream
   * where each item is a JSON value.
   */
  static fromReadableStream(readableStream, controller, client) {
    let consumed = false;
    async function* iterLines() {
      const lineDecoder = new LineDecoder();
      const iter = ReadableStreamToAsyncIterable(readableStream);
      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }
      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const line of iterLines()) {
          if (done)
            continue;
          if (line)
            yield JSON.parse(line);
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    return this.iterator();
  }
  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee() {
    const left = [];
    const right = [];
    const iterator = this.iterator();
    const teeIterator = (queue) => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift();
        }
      };
    };
    return [
      new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
      new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
    ];
  }
  /**
   * Converts this stream to a newline-separated ReadableStream of
   * JSON stringified values in the stream
   * which can be turned back into a Stream with `Stream.fromReadableStream()`.
   */
  toReadableStream() {
    const self = this;
    let iter;
    return makeReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done)
            return ctrl.close();
          const bytes = encodeUTF8(JSON.stringify(value) + "\n");
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      }
    });
  }
};
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new OpenAIError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new OpenAIError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
var SSEDecoder = class {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }
  decode(line) {
    if (line.endsWith("\r")) {
      line = line.substring(0, line.length - 1);
    }
    if (!line) {
      if (!this.event && !this.data.length)
        return null;
      const sse = {
        event: this.event,
        data: this.data.join("\n"),
        raw: this.chunks
      };
      this.event = null;
      this.data = [];
      this.chunks = [];
      return sse;
    }
    this.chunks.push(line);
    if (line.startsWith(":")) {
      return null;
    }
    let [fieldname, _, value] = partition(line, ":");
    if (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (fieldname === "event") {
      this.event = value;
    } else if (fieldname === "data") {
      this.data.push(value);
    }
    return null;
  }
};
function partition(str2, delimiter) {
  const index = str2.indexOf(delimiter);
  if (index !== -1) {
    return [str2.substring(0, index), delimiter, str2.substring(index + delimiter.length)];
  }
  return [str2, "", ""];
}
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller, client, props.options.__synthesizeEventData);
      }
      return Stream.fromSSEResponse(response, props.controller, client, props.options.__synthesizeEventData);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json = await response.json();
      return addRequestID(json, response);
    }
    const text = await response.text();
    return text;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addRequestID(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperty(value, "_request_id", {
    value: response.headers.get("x-request-id"),
    enumerable: false
  });
}
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  constructor(client, responsePromise, parseResponse2 = defaultParseResponse) {
    super((resolve) => {
      resolve(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse2;
    _APIPromise_client.set(this, void 0);
    __classPrivateFieldSet(this, _APIPromise_client, client, "f");
  }
  _thenUnwrap(transform) {
    return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addRequestID(transform(await this.parseResponse(client, props), props), props.response));
  }
  /**
   * Gets the raw `Response` instance instead of parsing the response
   * data.
   *
   * If you want to parse the response body but still get the `Response`
   * instance, you can use {@link withResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  /**
   * Gets the parsed response data, the raw `Response` instance and the ID of the request,
   * returned via the X-Request-ID header which is useful for debugging requests and reporting
   * issues to OpenAI.
   *
   * If you just want to get the raw `Response` instance without parsing it,
   * you can use {@link asResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response, request_id: response.headers.get("x-request-id") };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
};
_APIPromise_client = /* @__PURE__ */ new WeakMap();
var _AbstractPage_client;
var AbstractPage = class {
  constructor(client, response, body, options) {
    _AbstractPage_client.set(this, void 0);
    __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageRequestOptions() != null;
  }
  async getNextPage() {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new OpenAIError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async *iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
};
var PagePromise = class extends APIPromise {
  constructor(client, request, Page2) {
    super(client, request, async (client2, props) => new Page2(client2, props.response, await defaultParseResponse(client2, props), props.options));
  }
  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
};
var Page = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.object = body.object;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageRequestOptions() {
    return null;
  }
};
var CursorPage = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    const data = this.getPaginatedItems();
    const id = data[data.length - 1]?.id;
    if (!id) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after: id
      }
    };
  }
};
var ConversationCursorPage = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
    this.last_id = body.last_id || "";
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    const cursor = this.last_id;
    if (!cursor) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after: cursor
      }
    };
  }
};
var checkFileSupport = () => {
  if (typeof File === "undefined") {
    const { process: process2 } = globalThis;
    const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
};
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value) {
  return (typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "").split(/[\\/]/).pop() || void 0;
}
var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
var maybeMultipartFormRequestOptions = async (opts, fetch2) => {
  if (!hasUploadableValue(opts.body))
    return opts;
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var multipartFormRequestOptions = async (opts, fetch2) => {
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var supportsFormDataMap = /* @__PURE__ */ new WeakMap();
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached2 = supportsFormDataMap.get(fetch2);
  if (cached2)
    return cached2;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var createForm = async (body, fetch2) => {
  if (!await supportsFormData(fetch2)) {
    throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
  }
  const form = new FormData();
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
  return form;
};
var isNamedBlob = (value) => value instanceof Blob && "name" in value;
var isUploadable = (value) => typeof value === "object" && value !== null && (value instanceof Response || isAsyncIterable(value) || isNamedBlob(value));
var hasUploadableValue = (value) => {
  if (isUploadable(value))
    return true;
  if (Array.isArray(value))
    return value.some(hasUploadableValue);
  if (value && typeof value === "object") {
    for (const k in value) {
      if (hasUploadableValue(value[k]))
        return true;
    }
  }
  return false;
};
var addFormValue = async (form, key, value) => {
  if (value === void 0)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (value instanceof Response) {
    form.append(key, makeFile([await value.blob()], getName(value)));
  } else if (isAsyncIterable(value)) {
    form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value)));
  } else if (isNamedBlob(value)) {
    form.append(key, value, getName(value));
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name || (name = getName(value));
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
var APIResource = class {
  constructor(client) {
    this._client = client;
  }
};
function encodeURIPath(str2) {
  return str2.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = (pathEncoder = encodeURIPath) => function path3(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path4 = statics.reduce((previousValue, currentValue, index) => {
    if (/[?#]/.test(currentValue)) {
      postPath = true;
    }
    const value = params[index];
    let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
    if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
    value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
      encoded = value + "";
      invalidSegments.push({
        start: previousValue.length + currentValue.length,
        length: encoded.length,
        error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
      });
    }
    return previousValue + currentValue + (index === params.length ? "" : encoded);
  }, "");
  const pathOnly = path4.split(/[?#]/, 1)[0];
  const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
  let match;
  while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
    invalidSegments.push({
      start: match.index,
      length: match[0].length,
      error: `Value "${match[0]}" can't be safely passed as a path parameter`
    });
  }
  invalidSegments.sort((a, b) => a.start - b.start);
  if (invalidSegments.length > 0) {
    let lastEnd = 0;
    const underline = invalidSegments.reduce((acc, segment) => {
      const spaces = " ".repeat(segment.start - lastEnd);
      const arrows = "^".repeat(segment.length);
      lastEnd = segment.start + segment.length;
      return acc + spaces + arrows;
    }, "");
    throw new OpenAIError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path4}
${underline}`);
  }
  return path4;
};
var path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);
var Messages = class extends APIResource {
  /**
   * Get the messages in a stored chat completion. Only Chat Completions that have
   * been created with the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatCompletionStoreMessage of client.chat.completions.messages.list(
   *   'completion_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(completionID, query = {}, options) {
    return this._client.getAPIList(path`/chat/completions/${completionID}/messages`, CursorPage, { query, ...options });
  }
};
function isChatCompletionFunctionTool(tool) {
  return tool !== void 0 && "function" in tool && tool.function !== void 0;
}
function isAutoParsableResponseFormat(response_format) {
  return response_format?.["$brand"] === "auto-parseable-response-format";
}
function isAutoParsableTool(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function maybeParseChatCompletion(completion, params) {
  if (!params || !hasAutoParseableInput(params)) {
    return {
      ...completion,
      choices: completion.choices.map((choice) => {
        assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
        return {
          ...choice,
          message: {
            ...choice.message,
            parsed: null,
            ...choice.message.tool_calls ? {
              tool_calls: choice.message.tool_calls
            } : void 0
          }
        };
      })
    };
  }
  return parseChatCompletion(completion, params);
}
function parseChatCompletion(completion, params) {
  const choices = completion.choices.map((choice) => {
    if (choice.finish_reason === "length") {
      throw new LengthFinishReasonError();
    }
    if (choice.finish_reason === "content_filter") {
      throw new ContentFilterFinishReasonError();
    }
    assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
    return {
      ...choice,
      message: {
        ...choice.message,
        ...choice.message.tool_calls ? {
          tool_calls: choice.message.tool_calls?.map((toolCall) => parseToolCall(params, toolCall)) ?? void 0
        } : void 0,
        parsed: choice.message.content && !choice.message.refusal ? parseResponseFormat(params, choice.message.content) : null
      }
    };
  });
  return { ...completion, choices };
}
function parseResponseFormat(params, content) {
  if (params.response_format?.type !== "json_schema") {
    return null;
  }
  if (params.response_format?.type === "json_schema") {
    if ("$parseRaw" in params.response_format) {
      const response_format = params.response_format;
      return response_format.$parseRaw(content);
    }
    return JSON.parse(content);
  }
  return null;
}
function parseToolCall(params, toolCall) {
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return {
    ...toolCall,
    function: {
      ...toolCall.function,
      parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCall.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCall.function.arguments) : null
    }
  };
}
function shouldParseToolCall(params, toolCall) {
  if (!params || !("tools" in params) || !params.tools) {
    return false;
  }
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return isChatCompletionFunctionTool(inputTool) && (isAutoParsableTool(inputTool) || inputTool?.function.strict || false);
}
function hasAutoParseableInput(params) {
  if (isAutoParsableResponseFormat(params.response_format)) {
    return true;
  }
  return params.tools?.some((t) => isAutoParsableTool(t) || t.type === "function" && t.function.strict === true) ?? false;
}
function assertToolCallsAreChatCompletionFunctionToolCalls(toolCalls) {
  for (const toolCall of toolCalls || []) {
    if (toolCall.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool calls are supported; Received \`${toolCall.type}\``);
    }
  }
}
function validateInputTools(tools) {
  for (const tool of tools ?? []) {
    if (tool.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool types support auto-parsing; Received \`${tool.type}\``);
    }
    if (tool.function.strict !== true) {
      throw new OpenAIError(`The \`${tool.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
    }
  }
}
var isAssistantMessage = (message) => {
  return message?.role === "assistant";
};
var isToolMessage = (message) => {
  return message?.role === "tool";
};
var _EventStream_instances;
var _EventStream_connectedPromise;
var _EventStream_resolveConnectedPromise;
var _EventStream_rejectConnectedPromise;
var _EventStream_endPromise;
var _EventStream_resolveEndPromise;
var _EventStream_rejectEndPromise;
var _EventStream_listeners;
var _EventStream_ended;
var _EventStream_errored;
var _EventStream_aborted;
var _EventStream_catchingPromiseCreated;
var _EventStream_handleError;
var EventStream = class {
  constructor() {
    _EventStream_instances.add(this);
    this.controller = new AbortController();
    _EventStream_connectedPromise.set(this, void 0);
    _EventStream_resolveConnectedPromise.set(this, () => {
    });
    _EventStream_rejectConnectedPromise.set(this, () => {
    });
    _EventStream_endPromise.set(this, void 0);
    _EventStream_resolveEndPromise.set(this, () => {
    });
    _EventStream_rejectEndPromise.set(this, () => {
    });
    _EventStream_listeners.set(this, {});
    _EventStream_ended.set(this, false);
    _EventStream_errored.set(this, false);
    _EventStream_aborted.set(this, false);
    _EventStream_catchingPromiseCreated.set(this, false);
    __classPrivateFieldSet(this, _EventStream_connectedPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveConnectedPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet(this, _EventStream_endPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveEndPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet(this, _EventStream_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet(this, _EventStream_endPromise, "f").catch(() => {
    });
  }
  _run(executor) {
    setTimeout(() => {
      executor().then(() => {
        this._emitFinal();
        this._emit("end");
      }, __classPrivateFieldGet(this, _EventStream_instances, "m", _EventStream_handleError).bind(this));
    }, 0);
  }
  _connected() {
    if (this.ended)
      return;
    __classPrivateFieldGet(this, _EventStream_resolveConnectedPromise, "f").call(this);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet(this, _EventStream_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet(this, _EventStream_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet(this, _EventStream_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  /**
   * Adds the listener function to the end of the listeners array for the event.
   * No checks are made to see if the listener has already been added. Multiple calls passing
   * the same combination of event and listener will result in the listener being added, and
   * called, multiple times.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  on(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  /**
   * Removes the specified listener from the listener array for the event.
   * off() will remove, at most, one instance of a listener from the listener array. If any single
   * listener has been added multiple times to the listener array for the specified event, then
   * off() must be called multiple times to remove each instance.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  off(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  /**
   * Adds a one-time listener function for the event. The next time the event is triggered,
   * this listener is removed and then invoked.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  once(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  /**
   * This is similar to `.once()`, but returns a Promise that resolves the next time
   * the event is triggered, instead of calling a listener callback.
   * @returns a Promise that resolves the next time given event is triggered,
   * or rejects if an error is emitted.  (If you request the 'error' event,
   * returns a promise that resolves with the error).
   *
   * Example:
   *
   *   const message = await stream.emitted('message') // rejects if the stream errors
   */
  emitted(event) {
    return new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve);
    });
  }
  async done() {
    __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet(this, _EventStream_endPromise, "f");
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet(this, _EventStream_ended, "f")) {
      return;
    }
    if (event === "end") {
      __classPrivateFieldSet(this, _EventStream_ended, true, "f");
      __classPrivateFieldGet(this, _EventStream_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
    }
  }
  _emitFinal() {
  }
};
_EventStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_endPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_listeners = /* @__PURE__ */ new WeakMap(), _EventStream_ended = /* @__PURE__ */ new WeakMap(), _EventStream_errored = /* @__PURE__ */ new WeakMap(), _EventStream_aborted = /* @__PURE__ */ new WeakMap(), _EventStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _EventStream_instances = /* @__PURE__ */ new WeakSet(), _EventStream_handleError = function _EventStream_handleError2(error) {
  __classPrivateFieldSet(this, _EventStream_errored, true, "f");
  if (error instanceof Error && error.name === "AbortError") {
    error = new APIUserAbortError();
  }
  if (error instanceof APIUserAbortError) {
    __classPrivateFieldSet(this, _EventStream_aborted, true, "f");
    return this._emit("abort", error);
  }
  if (error instanceof OpenAIError) {
    return this._emit("error", error);
  }
  if (error instanceof Error) {
    const openAIError = new OpenAIError(error.message);
    openAIError.cause = error;
    return this._emit("error", openAIError);
  }
  return this._emit("error", new OpenAIError(String(error)));
};
function isRunnableFunctionWithParse(fn) {
  return typeof fn.parse === "function";
}
var _AbstractChatCompletionRunner_instances;
var _AbstractChatCompletionRunner_getFinalContent;
var _AbstractChatCompletionRunner_getFinalMessage;
var _AbstractChatCompletionRunner_getFinalFunctionToolCall;
var _AbstractChatCompletionRunner_getFinalFunctionToolCallResult;
var _AbstractChatCompletionRunner_calculateTotalUsage;
var _AbstractChatCompletionRunner_validateParams;
var _AbstractChatCompletionRunner_stringifyFunctionCallResult;
var DEFAULT_MAX_CHAT_COMPLETIONS = 10;
var AbstractChatCompletionRunner = class extends EventStream {
  constructor() {
    super(...arguments);
    _AbstractChatCompletionRunner_instances.add(this);
    this._chatCompletions = [];
    this.messages = [];
  }
  _addChatCompletion(chatCompletion) {
    this._chatCompletions.push(chatCompletion);
    this._emit("chatCompletion", chatCompletion);
    const message = chatCompletion.choices[0]?.message;
    if (message)
      this._addMessage(message);
    return chatCompletion;
  }
  _addMessage(message, emit = true) {
    if (!("content" in message))
      message.content = null;
    this.messages.push(message);
    if (emit) {
      this._emit("message", message);
      if (isToolMessage(message) && message.content) {
        this._emit("functionToolCallResult", message.content);
      } else if (isAssistantMessage(message) && message.tool_calls) {
        for (const tool_call of message.tool_calls) {
          if (tool_call.type === "function") {
            this._emit("functionToolCall", tool_call.function);
          }
        }
      }
    }
  }
  /**
   * @returns a promise that resolves with the final ChatCompletion, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletion.
   */
  async finalChatCompletion() {
    await this.done();
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (!completion)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return completion;
  }
  /**
   * @returns a promise that resolves with the content of the final ChatCompletionMessage, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalContent() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
  }
  /**
   * @returns a promise that resolves with the the final assistant ChatCompletionMessage response,
   * or rejects if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
  }
  /**
   * @returns a promise that resolves with the content of the final FunctionCall, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalFunctionToolCall() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
  }
  async finalFunctionToolCallResult() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
  }
  async totalUsage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this);
  }
  allChatCompletions() {
    return [...this._chatCompletions];
  }
  _emitFinal() {
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (completion)
      this._emit("finalChatCompletion", completion);
    const finalMessage = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
    if (finalMessage)
      this._emit("finalMessage", finalMessage);
    const finalContent = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
    if (finalContent)
      this._emit("finalContent", finalContent);
    const finalFunctionCall = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
    if (finalFunctionCall)
      this._emit("finalFunctionToolCall", finalFunctionCall);
    const finalFunctionCallResult = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
    if (finalFunctionCallResult != null)
      this._emit("finalFunctionToolCallResult", finalFunctionCallResult);
    if (this._chatCompletions.some((c) => c.usage)) {
      this._emit("totalUsage", __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this));
    }
  }
  async _createChatCompletion(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_validateParams).call(this, params);
    const chatCompletion = await client.chat.completions.create({ ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addChatCompletion(parseChatCompletion(chatCompletion, params));
  }
  async _runChatCompletion(client, params, options) {
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    return await this._createChatCompletion(client, params, options);
  }
  async _runTools(client, params, options) {
    const role = "tool";
    const { tool_choice = "auto", stream, ...restParams } = params;
    const singleFunctionToCall = typeof tool_choice !== "string" && tool_choice.type === "function" && tool_choice?.function?.name;
    const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
    const inputTools = params.tools.map((tool) => {
      if (isAutoParsableTool(tool)) {
        if (!tool.$callback) {
          throw new OpenAIError("Tool given to `.runTools()` that does not have an associated function");
        }
        return {
          type: "function",
          function: {
            function: tool.$callback,
            name: tool.function.name,
            description: tool.function.description || "",
            parameters: tool.function.parameters,
            parse: tool.$parseRaw,
            strict: true
          }
        };
      }
      return tool;
    });
    const functionsByName = {};
    for (const f of inputTools) {
      if (f.type === "function") {
        functionsByName[f.function.name || f.function.function.name] = f.function;
      }
    }
    const tools = "tools" in params ? inputTools.map((t) => t.type === "function" ? {
      type: "function",
      function: {
        name: t.function.name || t.function.function.name,
        parameters: t.function.parameters,
        description: t.function.description,
        strict: t.function.strict
      }
    } : t) : void 0;
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    for (let i = 0; i < maxChatCompletions; ++i) {
      const chatCompletion = await this._createChatCompletion(client, {
        ...restParams,
        tool_choice,
        tools,
        messages: [...this.messages]
      }, options);
      const message = chatCompletion.choices[0]?.message;
      if (!message) {
        throw new OpenAIError(`missing message in ChatCompletion response`);
      }
      if (!message.tool_calls?.length) {
        return;
      }
      for (const tool_call of message.tool_calls) {
        if (tool_call.type !== "function")
          continue;
        const tool_call_id = tool_call.id;
        const { name, arguments: args } = tool_call.function;
        const fn = functionsByName[name];
        if (!fn) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. Available options are: ${Object.keys(functionsByName).map((name2) => JSON.stringify(name2)).join(", ")}. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        } else if (singleFunctionToCall && singleFunctionToCall !== name) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        let parsed;
        try {
          parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
        } catch (error) {
          const content2 = error instanceof Error ? error.message : String(error);
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        const rawContent = await fn.function(parsed, this);
        const content = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
        this._addMessage({ role, tool_call_id, content });
        if (singleFunctionToCall) {
          return;
        }
      }
    }
    return;
  }
};
_AbstractChatCompletionRunner_instances = /* @__PURE__ */ new WeakSet(), _AbstractChatCompletionRunner_getFinalContent = function _AbstractChatCompletionRunner_getFinalContent2() {
  return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this).content ?? null;
}, _AbstractChatCompletionRunner_getFinalMessage = function _AbstractChatCompletionRunner_getFinalMessage2() {
  let i = this.messages.length;
  while (i-- > 0) {
    const message = this.messages[i];
    if (isAssistantMessage(message)) {
      const ret = {
        ...message,
        content: message.content ?? null,
        refusal: message.refusal ?? null
      };
      return ret;
    }
  }
  throw new OpenAIError("stream ended without producing a ChatCompletionMessage with role=assistant");
}, _AbstractChatCompletionRunner_getFinalFunctionToolCall = function _AbstractChatCompletionRunner_getFinalFunctionToolCall2() {
  for (let i = this.messages.length - 1; i >= 0; i--) {
    const message = this.messages[i];
    if (isAssistantMessage(message) && message?.tool_calls?.length) {
      return message.tool_calls.filter((x) => x.type === "function").at(-1)?.function;
    }
  }
  return;
}, _AbstractChatCompletionRunner_getFinalFunctionToolCallResult = function _AbstractChatCompletionRunner_getFinalFunctionToolCallResult2() {
  for (let i = this.messages.length - 1; i >= 0; i--) {
    const message = this.messages[i];
    if (isToolMessage(message) && message.content != null && typeof message.content === "string" && this.messages.some((x) => x.role === "assistant" && x.tool_calls?.some((y) => y.type === "function" && y.id === message.tool_call_id))) {
      return message.content;
    }
  }
  return;
}, _AbstractChatCompletionRunner_calculateTotalUsage = function _AbstractChatCompletionRunner_calculateTotalUsage2() {
  const total = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0
  };
  for (const { usage } of this._chatCompletions) {
    if (usage) {
      total.completion_tokens += usage.completion_tokens;
      total.prompt_tokens += usage.prompt_tokens;
      total.total_tokens += usage.total_tokens;
    }
  }
  return total;
}, _AbstractChatCompletionRunner_validateParams = function _AbstractChatCompletionRunner_validateParams2(params) {
  if (params.n != null && params.n > 1) {
    throw new OpenAIError("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
  }
}, _AbstractChatCompletionRunner_stringifyFunctionCallResult = function _AbstractChatCompletionRunner_stringifyFunctionCallResult2(rawContent) {
  return typeof rawContent === "string" ? rawContent : rawContent === void 0 ? "undefined" : JSON.stringify(rawContent);
};
var ChatCompletionRunner = class _ChatCompletionRunner extends AbstractChatCompletionRunner {
  static runTools(client, params, options) {
    const runner = new _ChatCompletionRunner();
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
  _addMessage(message, emit = true) {
    super._addMessage(message, emit);
    if (isAssistantMessage(message) && message.content) {
      this._emit("content", message.content);
    }
  }
};
var STR = 1;
var NUM = 2;
var ARR = 4;
var OBJ = 8;
var NULL = 16;
var BOOL = 32;
var NAN = 64;
var INFINITY = 128;
var MINUS_INFINITY = 256;
var INF = INFINITY | MINUS_INFINITY;
var SPECIAL = NULL | BOOL | INF | NAN;
var ATOM = STR | NUM | SPECIAL;
var COLLECTION3 = ARR | OBJ;
var ALL = ATOM | COLLECTION3;
var Allow = {
  STR,
  NUM,
  ARR,
  OBJ,
  NULL,
  BOOL,
  NAN,
  INFINITY,
  MINUS_INFINITY,
  INF,
  SPECIAL,
  ATOM,
  COLLECTION: COLLECTION3,
  ALL
};
var PartialJSON = class extends Error {
};
var MalformedJSON = class extends Error {
};
function parseJSON(jsonString, allowPartial = Allow.ALL) {
  if (typeof jsonString !== "string") {
    throw new TypeError(`expecting str, got ${typeof jsonString}`);
  }
  if (!jsonString.trim()) {
    throw new Error(`${jsonString} is empty`);
  }
  return _parseJSON(jsonString.trim(), allowPartial);
}
var _parseJSON = (jsonString, allow) => {
  const length = jsonString.length;
  let index = 0;
  const markPartialJSON = (msg) => {
    throw new PartialJSON(`${msg} at position ${index}`);
  };
  const throwMalformedError = (msg) => {
    throw new MalformedJSON(`${msg} at position ${index}`);
  };
  const parseAny = () => {
    skipBlank();
    if (index >= length)
      markPartialJSON("Unexpected end of input");
    if (jsonString[index] === '"')
      return parseStr();
    if (jsonString[index] === "{")
      return parseObj();
    if (jsonString[index] === "[")
      return parseArr();
    if (jsonString.substring(index, index + 4) === "null" || Allow.NULL & allow && length - index < 4 && "null".startsWith(jsonString.substring(index))) {
      index += 4;
      return null;
    }
    if (jsonString.substring(index, index + 4) === "true" || Allow.BOOL & allow && length - index < 4 && "true".startsWith(jsonString.substring(index))) {
      index += 4;
      return true;
    }
    if (jsonString.substring(index, index + 5) === "false" || Allow.BOOL & allow && length - index < 5 && "false".startsWith(jsonString.substring(index))) {
      index += 5;
      return false;
    }
    if (jsonString.substring(index, index + 8) === "Infinity" || Allow.INFINITY & allow && length - index < 8 && "Infinity".startsWith(jsonString.substring(index))) {
      index += 8;
      return Infinity;
    }
    if (jsonString.substring(index, index + 9) === "-Infinity" || Allow.MINUS_INFINITY & allow && 1 < length - index && length - index < 9 && "-Infinity".startsWith(jsonString.substring(index))) {
      index += 9;
      return -Infinity;
    }
    if (jsonString.substring(index, index + 3) === "NaN" || Allow.NAN & allow && length - index < 3 && "NaN".startsWith(jsonString.substring(index))) {
      index += 3;
      return NaN;
    }
    return parseNum();
  };
  const parseStr = () => {
    const start = index;
    let escape2 = false;
    index++;
    while (index < length && (jsonString[index] !== '"' || escape2 && jsonString[index - 1] === "\\")) {
      escape2 = jsonString[index] === "\\" ? !escape2 : false;
      index++;
    }
    if (jsonString.charAt(index) == '"') {
      try {
        return JSON.parse(jsonString.substring(start, ++index - Number(escape2)));
      } catch (e) {
        throwMalformedError(String(e));
      }
    } else if (Allow.STR & allow) {
      try {
        return JSON.parse(jsonString.substring(start, index - Number(escape2)) + '"');
      } catch (e) {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("\\")) + '"');
      }
    }
    markPartialJSON("Unterminated string literal");
  };
  const parseObj = () => {
    index++;
    skipBlank();
    const obj = {};
    try {
      while (jsonString[index] !== "}") {
        skipBlank();
        if (index >= length && Allow.OBJ & allow)
          return obj;
        const key = parseStr();
        skipBlank();
        index++;
        try {
          const value = parseAny();
          Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
        } catch (e) {
          if (Allow.OBJ & allow)
            return obj;
          else
            throw e;
        }
        skipBlank();
        if (jsonString[index] === ",")
          index++;
      }
    } catch (e) {
      if (Allow.OBJ & allow)
        return obj;
      else
        markPartialJSON("Expected '}' at end of object");
    }
    index++;
    return obj;
  };
  const parseArr = () => {
    index++;
    const arr = [];
    try {
      while (jsonString[index] !== "]") {
        arr.push(parseAny());
        skipBlank();
        if (jsonString[index] === ",") {
          index++;
        }
      }
    } catch (e) {
      if (Allow.ARR & allow) {
        return arr;
      }
      markPartialJSON("Expected ']' at end of array");
    }
    index++;
    return arr;
  };
  const parseNum = () => {
    if (index === 0) {
      if (jsonString === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        if (Allow.NUM & allow) {
          try {
            if ("." === jsonString[jsonString.length - 1])
              return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf(".")));
            return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf("e")));
          } catch (e2) {
          }
        }
        throwMalformedError(String(e));
      }
    }
    const start = index;
    if (jsonString[index] === "-")
      index++;
    while (jsonString[index] && !",]}".includes(jsonString[index]))
      index++;
    if (index == length && !(Allow.NUM & allow))
      markPartialJSON("Unterminated number literal");
    try {
      return JSON.parse(jsonString.substring(start, index));
    } catch (e) {
      if (jsonString.substring(start, index) === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("e")));
      } catch (e2) {
        throwMalformedError(String(e2));
      }
    }
  };
  const skipBlank = () => {
    while (index < length && " \n\r	".includes(jsonString[index])) {
      index++;
    }
  };
  return parseAny();
};
var partialParse = (input) => parseJSON(input, Allow.ALL ^ Allow.NUM);
var _ChatCompletionStream_instances;
var _ChatCompletionStream_params;
var _ChatCompletionStream_choiceEventStates;
var _ChatCompletionStream_currentChatCompletionSnapshot;
var _ChatCompletionStream_beginRequest;
var _ChatCompletionStream_getChoiceEventState;
var _ChatCompletionStream_addChunk;
var _ChatCompletionStream_emitToolCallDoneEvent;
var _ChatCompletionStream_emitContentDoneEvents;
var _ChatCompletionStream_endRequest;
var _ChatCompletionStream_getAutoParseableResponseFormat;
var _ChatCompletionStream_accumulateChatCompletion;
var ChatCompletionStream = class _ChatCompletionStream extends AbstractChatCompletionRunner {
  constructor(params) {
    super();
    _ChatCompletionStream_instances.add(this);
    _ChatCompletionStream_params.set(this, void 0);
    _ChatCompletionStream_choiceEventStates.set(this, void 0);
    _ChatCompletionStream_currentChatCompletionSnapshot.set(this, void 0);
    __classPrivateFieldSet(this, _ChatCompletionStream_params, params, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
  }
  get currentChatCompletionSnapshot() {
    return __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
  }
  /**
   * Intended for use on the frontend, consuming a stream produced with
   * `.toReadableStream()` on the backend.
   *
   * Note that messages sent to the model do not appear in `.on('message')`
   * in this context.
   */
  static fromReadableStream(stream) {
    const runner = new _ChatCompletionStream(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createChatCompletion(client, params, options) {
    const runner = new _ChatCompletionStream(params);
    runner._run(() => runner._runChatCompletion(client, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  async _createChatCompletion(client, params, options) {
    super._createChatCompletion;
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    const stream = await client.chat.completions.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const chunk of stream) {
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    let chatId;
    for await (const chunk of stream) {
      if (chatId && chatId !== chunk.id) {
        this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
      }
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
      chatId = chunk.id;
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  [(_ChatCompletionStream_params = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_choiceEventStates = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_currentChatCompletionSnapshot = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_instances = /* @__PURE__ */ new WeakSet(), _ChatCompletionStream_beginRequest = function _ChatCompletionStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
  }, _ChatCompletionStream_getChoiceEventState = function _ChatCompletionStream_getChoiceEventState2(choice) {
    let state = __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index];
    if (state) {
      return state;
    }
    state = {
      content_done: false,
      refusal_done: false,
      logprobs_content_done: false,
      logprobs_refusal_done: false,
      done_tool_calls: /* @__PURE__ */ new Set(),
      current_tool_call_index: null
    };
    __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index] = state;
    return state;
  }, _ChatCompletionStream_addChunk = function _ChatCompletionStream_addChunk2(chunk) {
    if (this.ended)
      return;
    const completion = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_accumulateChatCompletion).call(this, chunk);
    this._emit("chunk", chunk, completion);
    for (const choice of chunk.choices) {
      const choiceSnapshot = completion.choices[choice.index];
      if (choice.delta.content != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.content) {
        this._emit("content", choice.delta.content, choiceSnapshot.message.content);
        this._emit("content.delta", {
          delta: choice.delta.content,
          snapshot: choiceSnapshot.message.content,
          parsed: choiceSnapshot.message.parsed
        });
      }
      if (choice.delta.refusal != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.refusal) {
        this._emit("refusal.delta", {
          delta: choice.delta.refusal,
          snapshot: choiceSnapshot.message.refusal
        });
      }
      if (choice.logprobs?.content != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.content.delta", {
          content: choice.logprobs?.content,
          snapshot: choiceSnapshot.logprobs?.content ?? []
        });
      }
      if (choice.logprobs?.refusal != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.refusal.delta", {
          refusal: choice.logprobs?.refusal,
          snapshot: choiceSnapshot.logprobs?.refusal ?? []
        });
      }
      const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
      if (choiceSnapshot.finish_reason) {
        __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
        if (state.current_tool_call_index != null) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
        }
      }
      for (const toolCall of choice.delta.tool_calls ?? []) {
        if (state.current_tool_call_index !== toolCall.index) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
          if (state.current_tool_call_index != null) {
            __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
          }
        }
        state.current_tool_call_index = toolCall.index;
      }
      for (const toolCallDelta of choice.delta.tool_calls ?? []) {
        const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallDelta.index];
        if (!toolCallSnapshot?.type) {
          continue;
        }
        if (toolCallSnapshot?.type === "function") {
          this._emit("tool_calls.function.arguments.delta", {
            name: toolCallSnapshot.function?.name,
            index: toolCallDelta.index,
            arguments: toolCallSnapshot.function.arguments,
            parsed_arguments: toolCallSnapshot.function.parsed_arguments,
            arguments_delta: toolCallDelta.function?.arguments ?? ""
          });
        } else {
          assertNever(toolCallSnapshot?.type);
        }
      }
    }
  }, _ChatCompletionStream_emitToolCallDoneEvent = function _ChatCompletionStream_emitToolCallDoneEvent2(choiceSnapshot, toolCallIndex) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (state.done_tool_calls.has(toolCallIndex)) {
      return;
    }
    const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallIndex];
    if (!toolCallSnapshot) {
      throw new Error("no tool call snapshot");
    }
    if (!toolCallSnapshot.type) {
      throw new Error("tool call snapshot missing `type`");
    }
    if (toolCallSnapshot.type === "function") {
      const inputTool = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.tools?.find((tool) => isChatCompletionFunctionTool(tool) && tool.function.name === toolCallSnapshot.function.name);
      this._emit("tool_calls.function.arguments.done", {
        name: toolCallSnapshot.function.name,
        index: toolCallIndex,
        arguments: toolCallSnapshot.function.arguments,
        parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCallSnapshot.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCallSnapshot.function.arguments) : null
      });
    } else {
      assertNever(toolCallSnapshot.type);
    }
  }, _ChatCompletionStream_emitContentDoneEvents = function _ChatCompletionStream_emitContentDoneEvents2(choiceSnapshot) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (choiceSnapshot.message.content && !state.content_done) {
      state.content_done = true;
      const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this);
      this._emit("content.done", {
        content: choiceSnapshot.message.content,
        parsed: responseFormat ? responseFormat.$parseRaw(choiceSnapshot.message.content) : null
      });
    }
    if (choiceSnapshot.message.refusal && !state.refusal_done) {
      state.refusal_done = true;
      this._emit("refusal.done", { refusal: choiceSnapshot.message.refusal });
    }
    if (choiceSnapshot.logprobs?.content && !state.logprobs_content_done) {
      state.logprobs_content_done = true;
      this._emit("logprobs.content.done", { content: choiceSnapshot.logprobs.content });
    }
    if (choiceSnapshot.logprobs?.refusal && !state.logprobs_refusal_done) {
      state.logprobs_refusal_done = true;
      this._emit("logprobs.refusal.done", { refusal: choiceSnapshot.logprobs.refusal });
    }
  }, _ChatCompletionStream_endRequest = function _ChatCompletionStream_endRequest2() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
    return finalizeChatCompletion(snapshot, __classPrivateFieldGet(this, _ChatCompletionStream_params, "f"));
  }, _ChatCompletionStream_getAutoParseableResponseFormat = function _ChatCompletionStream_getAutoParseableResponseFormat2() {
    const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.response_format;
    if (isAutoParsableResponseFormat(responseFormat)) {
      return responseFormat;
    }
    return null;
  }, _ChatCompletionStream_accumulateChatCompletion = function _ChatCompletionStream_accumulateChatCompletion2(chunk) {
    var _a3, _b, _c, _d;
    let snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    const { choices, ...rest } = chunk;
    if (!snapshot) {
      snapshot = __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, {
        ...rest,
        choices: []
      }, "f");
    } else {
      Object.assign(snapshot, rest);
    }
    for (const { delta, finish_reason, index, logprobs = null, ...other } of chunk.choices) {
      let choice = snapshot.choices[index];
      if (!choice) {
        choice = snapshot.choices[index] = { finish_reason, index, message: {}, logprobs, ...other };
      }
      if (logprobs) {
        if (!choice.logprobs) {
          choice.logprobs = Object.assign({}, logprobs);
        } else {
          const { content: content2, refusal: refusal2, ...rest3 } = logprobs;
          assertIsEmpty(rest3);
          Object.assign(choice.logprobs, rest3);
          if (content2) {
            (_a3 = choice.logprobs).content ?? (_a3.content = []);
            choice.logprobs.content.push(...content2);
          }
          if (refusal2) {
            (_b = choice.logprobs).refusal ?? (_b.refusal = []);
            choice.logprobs.refusal.push(...refusal2);
          }
        }
      }
      if (finish_reason) {
        choice.finish_reason = finish_reason;
        if (__classPrivateFieldGet(this, _ChatCompletionStream_params, "f") && hasAutoParseableInput(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"))) {
          if (finish_reason === "length") {
            throw new LengthFinishReasonError();
          }
          if (finish_reason === "content_filter") {
            throw new ContentFilterFinishReasonError();
          }
        }
      }
      Object.assign(choice, other);
      if (!delta)
        continue;
      const { content, refusal, function_call, role, tool_calls, ...rest2 } = delta;
      assertIsEmpty(rest2);
      Object.assign(choice.message, rest2);
      if (refusal) {
        choice.message.refusal = (choice.message.refusal || "") + refusal;
      }
      if (role)
        choice.message.role = role;
      if (function_call) {
        if (!choice.message.function_call) {
          choice.message.function_call = function_call;
        } else {
          if (function_call.name)
            choice.message.function_call.name = function_call.name;
          if (function_call.arguments) {
            (_c = choice.message.function_call).arguments ?? (_c.arguments = "");
            choice.message.function_call.arguments += function_call.arguments;
          }
        }
      }
      if (content) {
        choice.message.content = (choice.message.content || "") + content;
        if (!choice.message.refusal && __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this)) {
          choice.message.parsed = partialParse(choice.message.content);
        }
      }
      if (tool_calls) {
        if (!choice.message.tool_calls)
          choice.message.tool_calls = [];
        for (const { index: index2, id, type, function: fn, ...rest3 } of tool_calls) {
          const tool_call = (_d = choice.message.tool_calls)[index2] ?? (_d[index2] = {});
          Object.assign(tool_call, rest3);
          if (id)
            tool_call.id = id;
          if (type)
            tool_call.type = type;
          if (fn)
            tool_call.function ?? (tool_call.function = { name: fn.name ?? "", arguments: "" });
          if (fn?.name)
            tool_call.function.name = fn.name;
          if (fn?.arguments) {
            tool_call.function.arguments += fn.arguments;
            if (shouldParseToolCall(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"), tool_call)) {
              tool_call.function.parsed_arguments = partialParse(tool_call.function.arguments);
            }
          }
        }
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("chunk", (chunk) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(chunk);
      } else {
        pushQueue.push(chunk);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
};
function finalizeChatCompletion(snapshot, params) {
  const { id, choices, created, model, system_fingerprint, ...rest } = snapshot;
  const completion = {
    ...rest,
    id,
    choices: choices.map(({ message, finish_reason, index, logprobs, ...choiceRest }) => {
      if (!finish_reason) {
        throw new OpenAIError(`missing finish_reason for choice ${index}`);
      }
      const { content = null, function_call, tool_calls, ...messageRest } = message;
      const role = message.role;
      if (!role) {
        throw new OpenAIError(`missing role for choice ${index}`);
      }
      if (function_call) {
        const { arguments: args, name } = function_call;
        if (args == null) {
          throw new OpenAIError(`missing function_call.arguments for choice ${index}`);
        }
        if (!name) {
          throw new OpenAIError(`missing function_call.name for choice ${index}`);
        }
        return {
          ...choiceRest,
          message: {
            content,
            function_call: { arguments: args, name },
            role,
            refusal: message.refusal ?? null
          },
          finish_reason,
          index,
          logprobs
        };
      }
      if (tool_calls) {
        return {
          ...choiceRest,
          index,
          finish_reason,
          logprobs,
          message: {
            ...messageRest,
            role,
            content,
            refusal: message.refusal ?? null,
            tool_calls: tool_calls.map((tool_call, i) => {
              const { function: fn, type, id: id2, ...toolRest } = tool_call;
              const { arguments: args, name, ...fnRest } = fn || {};
              if (id2 == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].id
${str(snapshot)}`);
              }
              if (type == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].type
${str(snapshot)}`);
              }
              if (name == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.name
${str(snapshot)}`);
              }
              if (args == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.arguments
${str(snapshot)}`);
              }
              return { ...toolRest, id: id2, type, function: { ...fnRest, name, arguments: args } };
            })
          }
        };
      }
      return {
        ...choiceRest,
        message: { ...messageRest, content, role, refusal: message.refusal ?? null },
        finish_reason,
        index,
        logprobs
      };
    }),
    created,
    model,
    object: "chat.completion",
    ...system_fingerprint ? { system_fingerprint } : {}
  };
  return maybeParseChatCompletion(completion, params);
}
function str(x) {
  return JSON.stringify(x);
}
function assertIsEmpty(obj) {
  return;
}
function assertNever(_x) {
}
var ChatCompletionStreamingRunner = class _ChatCompletionStreamingRunner extends ChatCompletionStream {
  static fromReadableStream(stream) {
    const runner = new _ChatCompletionStreamingRunner(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static runTools(client, params, options) {
    const runner = new _ChatCompletionStreamingRunner(
      // @ts-expect-error TODO these types are incompatible
      params
    );
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
};
var Completions = class extends APIResource {
  constructor() {
    super(...arguments);
    this.messages = new Messages(this._client);
  }
  create(body, options) {
    return this._client.post("/chat/completions", { body, ...options, stream: body.stream ?? false });
  }
  /**
   * Get a stored chat completion. Only Chat Completions that have been created with
   * the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * const chatCompletion =
   *   await client.chat.completions.retrieve('completion_id');
   * ```
   */
  retrieve(completionID, options) {
    return this._client.get(path`/chat/completions/${completionID}`, options);
  }
  /**
   * Modify a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be modified. Currently, the only
   * supported modification is to update the `metadata` field.
   *
   * @example
   * ```ts
   * const chatCompletion = await client.chat.completions.update(
   *   'completion_id',
   *   { metadata: { foo: 'string' } },
   * );
   * ```
   */
  update(completionID, body, options) {
    return this._client.post(path`/chat/completions/${completionID}`, { body, ...options });
  }
  /**
   * List stored Chat Completions. Only Chat Completions that have been stored with
   * the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatCompletion of client.chat.completions.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/chat/completions", CursorPage, { query, ...options });
  }
  /**
   * Delete a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be deleted.
   *
   * @example
   * ```ts
   * const chatCompletionDeleted =
   *   await client.chat.completions.delete('completion_id');
   * ```
   */
  delete(completionID, options) {
    return this._client.delete(path`/chat/completions/${completionID}`, options);
  }
  parse(body, options) {
    validateInputTools(body.tools);
    return this._client.chat.completions.create(body, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Stainless-Helper-Method": "chat.completions.parse"
      }
    })._thenUnwrap((completion) => parseChatCompletion(completion, body));
  }
  runTools(body, options) {
    if (body.stream) {
      return ChatCompletionStreamingRunner.runTools(this._client, body, options);
    }
    return ChatCompletionRunner.runTools(this._client, body, options);
  }
  /**
   * Creates a chat completion stream
   */
  stream(body, options) {
    return ChatCompletionStream.createChatCompletion(this._client, body, options);
  }
};
Completions.Messages = Messages;
var Chat = class extends APIResource {
  constructor() {
    super(...arguments);
    this.completions = new Completions(this._client);
  }
};
Chat.Completions = Completions;
var brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
var buildHeaders = (newHeaders) => {
  const targetHeaders = new Headers();
  const nullHeaders = /* @__PURE__ */ new Set();
  for (const headers of newHeaders) {
    const seenHeaders = /* @__PURE__ */ new Set();
    for (const [name, value] of iterateHeaders(headers)) {
      const lowerName = name.toLowerCase();
      if (!seenHeaders.has(lowerName)) {
        targetHeaders.delete(name);
        seenHeaders.add(lowerName);
      }
      if (value === null) {
        targetHeaders.delete(name);
        nullHeaders.add(lowerName);
      } else {
        targetHeaders.append(name, value);
        nullHeaders.delete(lowerName);
      }
    }
  }
  return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
};
var Speech = class extends APIResource {
  /**
   * Generates audio from the input text.
   *
   * Returns the audio file content, or a stream of audio events.
   *
   * @example
   * ```ts
   * const speech = await client.audio.speech.create({
   *   input: 'input',
   *   model: 'string',
   *   voice: 'string',
   * });
   *
   * const content = await speech.blob();
   * console.log(content);
   * ```
   */
  create(body, options) {
    return this._client.post("/audio/speech", {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "application/octet-stream" }, options?.headers]),
      __binaryResponse: true
    });
  }
};
var Transcriptions = class extends APIResource {
  create(body, options) {
    return this._client.post("/audio/transcriptions", multipartFormRequestOptions({
      body,
      ...options,
      stream: body.stream ?? false,
      __metadata: { model: body.model }
    }, this._client));
  }
};
var Translations = class extends APIResource {
  create(body, options) {
    return this._client.post("/audio/translations", multipartFormRequestOptions({ body, ...options, __metadata: { model: body.model } }, this._client));
  }
};
var Audio = class extends APIResource {
  constructor() {
    super(...arguments);
    this.transcriptions = new Transcriptions(this._client);
    this.translations = new Translations(this._client);
    this.speech = new Speech(this._client);
  }
};
Audio.Transcriptions = Transcriptions;
Audio.Translations = Translations;
Audio.Speech = Speech;
var Batches = class extends APIResource {
  /**
   * Creates and executes a batch from an uploaded file of requests
   */
  create(body, options) {
    return this._client.post("/batches", { body, ...options });
  }
  /**
   * Retrieves a batch.
   */
  retrieve(batchID, options) {
    return this._client.get(path`/batches/${batchID}`, options);
  }
  /**
   * List your organization's batches.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/batches", CursorPage, { query, ...options });
  }
  /**
   * Cancels an in-progress batch. The batch will be in status `cancelling` for up to
   * 10 minutes, before changing to `cancelled`, where it will have partial results
   * (if any) available in the output file.
   */
  cancel(batchID, options) {
    return this._client.post(path`/batches/${batchID}/cancel`, options);
  }
};
var Assistants = class extends APIResource {
  /**
   * Create an assistant with a model and instructions.
   *
   * @deprecated
   */
  create(body, options) {
    return this._client.post("/assistants", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves an assistant.
   *
   * @deprecated
   */
  retrieve(assistantID, options) {
    return this._client.get(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies an assistant.
   *
   * @deprecated
   */
  update(assistantID, body, options) {
    return this._client.post(path`/assistants/${assistantID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of assistants.
   *
   * @deprecated
   */
  list(query = {}, options) {
    return this._client.getAPIList("/assistants", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete an assistant.
   *
   * @deprecated
   */
  delete(assistantID, options) {
    return this._client.delete(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
var Sessions = class extends APIResource {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API. Can be configured with the same session parameters as the
   * `session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const session =
   *   await client.beta.realtime.sessions.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
var TranscriptionSessions = class extends APIResource {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API specifically for realtime transcriptions. Can be configured with
   * the same session parameters as the `transcription_session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const transcriptionSession =
   *   await client.beta.realtime.transcriptionSessions.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/transcription_sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
var Realtime = class extends APIResource {
  constructor() {
    super(...arguments);
    this.sessions = new Sessions(this._client);
    this.transcriptionSessions = new TranscriptionSessions(this._client);
  }
};
Realtime.Sessions = Sessions;
Realtime.TranscriptionSessions = TranscriptionSessions;
var Sessions2 = class extends APIResource {
  /**
   * Create a ChatKit session.
   *
   * @example
   * ```ts
   * const chatSession =
   *   await client.beta.chatkit.sessions.create({
   *     user: 'x',
   *     workflow: { id: 'id' },
   *   });
   * ```
   */
  create(body, options) {
    return this._client.post("/chatkit/sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * Cancel an active ChatKit session and return its most recent metadata.
   *
   * Cancelling prevents new requests from using the issued client secret.
   *
   * @example
   * ```ts
   * const chatSession =
   *   await client.beta.chatkit.sessions.cancel('cksess_123');
   * ```
   */
  cancel(sessionID, options) {
    return this._client.post(path`/chatkit/sessions/${sessionID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
};
var Threads = class extends APIResource {
  /**
   * Retrieve a ChatKit thread by its identifier.
   *
   * @example
   * ```ts
   * const chatkitThread =
   *   await client.beta.chatkit.threads.retrieve('cthr_123');
   * ```
   */
  retrieve(threadID, options) {
    return this._client.get(path`/chatkit/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * List ChatKit threads with optional pagination and user filters.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatkitThread of client.beta.chatkit.threads.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/chatkit/threads", ConversationCursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * Delete a ChatKit thread along with its items and stored attachments.
   *
   * @example
   * ```ts
   * const thread = await client.beta.chatkit.threads.delete(
   *   'cthr_123',
   * );
   * ```
   */
  delete(threadID, options) {
    return this._client.delete(path`/chatkit/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * List items that belong to a ChatKit thread.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const thread of client.beta.chatkit.threads.listItems(
   *   'cthr_123',
   * )) {
   *   // ...
   * }
   * ```
   */
  listItems(threadID, query = {}, options) {
    return this._client.getAPIList(path`/chatkit/threads/${threadID}/items`, ConversationCursorPage, { query, ...options, headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers]) });
  }
};
var ChatKit = class extends APIResource {
  constructor() {
    super(...arguments);
    this.sessions = new Sessions2(this._client);
    this.threads = new Threads(this._client);
  }
};
ChatKit.Sessions = Sessions2;
ChatKit.Threads = Threads;
var Messages2 = class extends APIResource {
  /**
   * Create a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  create(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}/messages`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieve a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(messageID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(messageID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/messages/${messageID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of messages for a given thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/messages`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Deletes a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  delete(messageID, params, options) {
    const { thread_id } = params;
    return this._client.delete(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
var Steps = class extends APIResource {
  /**
   * Retrieves a run step.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(stepID, params, options) {
    const { thread_id, run_id, ...query } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${run_id}/steps/${stepID}`, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of run steps belonging to a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(runID, params, options) {
    const { thread_id, ...query } = params;
    return this._client.getAPIList(path`/threads/${thread_id}/runs/${runID}/steps`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
var toFloat32Array = (base64Str) => {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64Str, "base64");
    return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.length / Float32Array.BYTES_PER_ELEMENT));
  } else {
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return Array.from(new Float32Array(bytes.buffer));
  }
};
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() ?? void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim();
  }
  return void 0;
};
var _AssistantStream_instances;
var _a;
var _AssistantStream_events;
var _AssistantStream_runStepSnapshots;
var _AssistantStream_messageSnapshots;
var _AssistantStream_messageSnapshot;
var _AssistantStream_finalRun;
var _AssistantStream_currentContentIndex;
var _AssistantStream_currentContent;
var _AssistantStream_currentToolCallIndex;
var _AssistantStream_currentToolCall;
var _AssistantStream_currentEvent;
var _AssistantStream_currentRunSnapshot;
var _AssistantStream_currentRunStepSnapshot;
var _AssistantStream_addEvent;
var _AssistantStream_endRequest;
var _AssistantStream_handleMessage;
var _AssistantStream_handleRunStep;
var _AssistantStream_handleEvent;
var _AssistantStream_accumulateRunStep;
var _AssistantStream_accumulateMessage;
var _AssistantStream_accumulateContent;
var _AssistantStream_handleRun;
var AssistantStream = class extends EventStream {
  constructor() {
    super(...arguments);
    _AssistantStream_instances.add(this);
    _AssistantStream_events.set(this, []);
    _AssistantStream_runStepSnapshots.set(this, {});
    _AssistantStream_messageSnapshots.set(this, {});
    _AssistantStream_messageSnapshot.set(this, void 0);
    _AssistantStream_finalRun.set(this, void 0);
    _AssistantStream_currentContentIndex.set(this, void 0);
    _AssistantStream_currentContent.set(this, void 0);
    _AssistantStream_currentToolCallIndex.set(this, void 0);
    _AssistantStream_currentToolCall.set(this, void 0);
    _AssistantStream_currentEvent.set(this, void 0);
    _AssistantStream_currentRunSnapshot.set(this, void 0);
    _AssistantStream_currentRunStepSnapshot.set(this, void 0);
  }
  [(_AssistantStream_events = /* @__PURE__ */ new WeakMap(), _AssistantStream_runStepSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_finalRun = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContentIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCallIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCall = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentEvent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunStepSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_instances = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  static fromReadableStream(stream) {
    const runner = new _a();
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
  static createToolAssistantStream(runId, runs, params, options) {
    const runner = new _a();
    runner._run(() => runner._runToolAssistantStream(runId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createToolAssistantStream(run, runId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.submitToolOutputs(runId, body, {
      ...options,
      signal: this.controller.signal
    });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static createThreadAssistantStream(params, thread, options) {
    const runner = new _a();
    runner._run(() => runner._threadAssistantStream(params, thread, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  static createAssistantStream(threadId, runs, params, options) {
    const runner = new _a();
    runner._run(() => runner._runAssistantStream(threadId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  currentEvent() {
    return __classPrivateFieldGet(this, _AssistantStream_currentEvent, "f");
  }
  currentRun() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunSnapshot, "f");
  }
  currentMessageSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f");
  }
  currentRunStepSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunStepSnapshot, "f");
  }
  async finalRunSteps() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f"));
  }
  async finalMessages() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f"));
  }
  async finalRun() {
    await this.done();
    if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
      throw Error("Final run was not received.");
    return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
  }
  async _createThreadAssistantStream(thread, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await thread.createAndRun(body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  async _createAssistantStream(run, threadId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.create(threadId, body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static accumulateDelta(acc, delta) {
    for (const [key, deltaValue] of Object.entries(delta)) {
      if (!acc.hasOwnProperty(key)) {
        acc[key] = deltaValue;
        continue;
      }
      let accValue = acc[key];
      if (accValue === null || accValue === void 0) {
        acc[key] = deltaValue;
        continue;
      }
      if (key === "index" || key === "type") {
        acc[key] = deltaValue;
        continue;
      }
      if (typeof accValue === "string" && typeof deltaValue === "string") {
        accValue += deltaValue;
      } else if (typeof accValue === "number" && typeof deltaValue === "number") {
        accValue += deltaValue;
      } else if (isObj(accValue) && isObj(deltaValue)) {
        accValue = this.accumulateDelta(accValue, deltaValue);
      } else if (Array.isArray(accValue) && Array.isArray(deltaValue)) {
        if (accValue.every((x) => typeof x === "string" || typeof x === "number")) {
          accValue.push(...deltaValue);
          continue;
        }
        for (const deltaEntry of deltaValue) {
          if (!isObj(deltaEntry)) {
            throw new Error(`Expected array delta entry to be an object but got: ${deltaEntry}`);
          }
          const index = deltaEntry["index"];
          if (index == null) {
            console.error(deltaEntry);
            throw new Error("Expected array delta entry to have an `index` property");
          }
          if (typeof index !== "number") {
            throw new Error(`Expected array delta entry \`index\` property to be a number but got ${index}`);
          }
          const accEntry = accValue[index];
          if (accEntry == null) {
            accValue.push(deltaEntry);
          } else {
            accValue[index] = this.accumulateDelta(accEntry, deltaEntry);
          }
        }
        continue;
      } else {
        throw Error(`Unhandled record type: ${key}, deltaValue: ${deltaValue}, accValue: ${accValue}`);
      }
      acc[key] = accValue;
    }
    return acc;
  }
  _addRun(run) {
    return run;
  }
  async _threadAssistantStream(params, thread, options) {
    return await this._createThreadAssistantStream(thread, params, options);
  }
  async _runAssistantStream(threadId, runs, params, options) {
    return await this._createAssistantStream(runs, threadId, params, options);
  }
  async _runToolAssistantStream(runId, runs, params, options) {
    return await this._createToolAssistantStream(runs, runId, params, options);
  }
};
_a = AssistantStream, _AssistantStream_addEvent = function _AssistantStream_addEvent2(event) {
  if (this.ended)
    return;
  __classPrivateFieldSet(this, _AssistantStream_currentEvent, event, "f");
  __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleEvent).call(this, event);
  switch (event.event) {
    case "thread.created":
      break;
    case "thread.run.created":
    case "thread.run.queued":
    case "thread.run.in_progress":
    case "thread.run.requires_action":
    case "thread.run.completed":
    case "thread.run.incomplete":
    case "thread.run.failed":
    case "thread.run.cancelling":
    case "thread.run.cancelled":
    case "thread.run.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRun).call(this, event);
      break;
    case "thread.run.step.created":
    case "thread.run.step.in_progress":
    case "thread.run.step.delta":
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRunStep).call(this, event);
      break;
    case "thread.message.created":
    case "thread.message.in_progress":
    case "thread.message.delta":
    case "thread.message.completed":
    case "thread.message.incomplete":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleMessage).call(this, event);
      break;
    case "error":
      throw new Error("Encountered an error event in event processing - errors should be processed earlier");
    default:
      assertNever2(event);
  }
}, _AssistantStream_endRequest = function _AssistantStream_endRequest2() {
  if (this.ended) {
    throw new OpenAIError(`stream has ended, this shouldn't happen`);
  }
  if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
    throw Error("Final run has not been received");
  return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
}, _AssistantStream_handleMessage = function _AssistantStream_handleMessage2(event) {
  const [accumulatedMessage, newContent] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateMessage).call(this, event, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
  __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, accumulatedMessage, "f");
  __classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f")[accumulatedMessage.id] = accumulatedMessage;
  for (const content of newContent) {
    const snapshotContent = accumulatedMessage.content[content.index];
    if (snapshotContent?.type == "text") {
      this._emit("textCreated", snapshotContent.text);
    }
  }
  switch (event.event) {
    case "thread.message.created":
      this._emit("messageCreated", event.data);
      break;
    case "thread.message.in_progress":
      break;
    case "thread.message.delta":
      this._emit("messageDelta", event.data.delta, accumulatedMessage);
      if (event.data.delta.content) {
        for (const content of event.data.delta.content) {
          if (content.type == "text" && content.text) {
            let textDelta = content.text;
            let snapshot = accumulatedMessage.content[content.index];
            if (snapshot && snapshot.type == "text") {
              this._emit("textDelta", textDelta, snapshot.text);
            } else {
              throw Error("The snapshot associated with this text delta is not text or missing");
            }
          }
          if (content.index != __classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")) {
            if (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f")) {
              switch (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f").type) {
                case "text":
                  this._emit("textDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
                case "image_file":
                  this._emit("imageFileDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
              }
            }
            __classPrivateFieldSet(this, _AssistantStream_currentContentIndex, content.index, "f");
          }
          __classPrivateFieldSet(this, _AssistantStream_currentContent, accumulatedMessage.content[content.index], "f");
        }
      }
      break;
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f") !== void 0) {
        const currentContent = event.data.content[__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")];
        if (currentContent) {
          switch (currentContent.type) {
            case "image_file":
              this._emit("imageFileDone", currentContent.image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
            case "text":
              this._emit("textDone", currentContent.text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
          }
        }
      }
      if (__classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f")) {
        this._emit("messageDone", event.data);
      }
      __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, void 0, "f");
  }
}, _AssistantStream_handleRunStep = function _AssistantStream_handleRunStep2(event) {
  const accumulatedRunStep = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateRunStep).call(this, event);
  __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, accumulatedRunStep, "f");
  switch (event.event) {
    case "thread.run.step.created":
      this._emit("runStepCreated", event.data);
      break;
    case "thread.run.step.delta":
      const delta = event.data.delta;
      if (delta.step_details && delta.step_details.type == "tool_calls" && delta.step_details.tool_calls && accumulatedRunStep.step_details.type == "tool_calls") {
        for (const toolCall of delta.step_details.tool_calls) {
          if (toolCall.index == __classPrivateFieldGet(this, _AssistantStream_currentToolCallIndex, "f")) {
            this._emit("toolCallDelta", toolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index]);
          } else {
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
              this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
            }
            __classPrivateFieldSet(this, _AssistantStream_currentToolCallIndex, toolCall.index, "f");
            __classPrivateFieldSet(this, _AssistantStream_currentToolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index], "f");
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"))
              this._emit("toolCallCreated", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          }
        }
      }
      this._emit("runStepDelta", event.data.delta, accumulatedRunStep);
      break;
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, void 0, "f");
      const details = event.data.step_details;
      if (details.type == "tool_calls") {
        if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
          this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
        }
      }
      this._emit("runStepDone", event.data, accumulatedRunStep);
      break;
    case "thread.run.step.in_progress":
      break;
  }
}, _AssistantStream_handleEvent = function _AssistantStream_handleEvent2(event) {
  __classPrivateFieldGet(this, _AssistantStream_events, "f").push(event);
  this._emit("event", event);
}, _AssistantStream_accumulateRunStep = function _AssistantStream_accumulateRunStep2(event) {
  switch (event.event) {
    case "thread.run.step.created":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      return event.data;
    case "thread.run.step.delta":
      let snapshot = __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
      if (!snapshot) {
        throw Error("Received a RunStepDelta before creation of a snapshot");
      }
      let data = event.data;
      if (data.delta) {
        const accumulated = _a.accumulateDelta(snapshot, data.delta);
        __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = accumulated;
      }
      return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
    case "thread.run.step.in_progress":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      break;
  }
  if (__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id])
    return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
  throw new Error("No snapshot available");
}, _AssistantStream_accumulateMessage = function _AssistantStream_accumulateMessage2(event, snapshot) {
  let newContent = [];
  switch (event.event) {
    case "thread.message.created":
      return [event.data, newContent];
    case "thread.message.delta":
      if (!snapshot) {
        throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
      }
      let data = event.data;
      if (data.delta.content) {
        for (const contentElement of data.delta.content) {
          if (contentElement.index in snapshot.content) {
            let currentContent = snapshot.content[contentElement.index];
            snapshot.content[contentElement.index] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateContent).call(this, contentElement, currentContent);
          } else {
            snapshot.content[contentElement.index] = contentElement;
            newContent.push(contentElement);
          }
        }
      }
      return [snapshot, newContent];
    case "thread.message.in_progress":
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (snapshot) {
        return [snapshot, newContent];
      } else {
        throw Error("Received thread message event with no existing snapshot");
      }
  }
  throw Error("Tried to accumulate a non-message event");
}, _AssistantStream_accumulateContent = function _AssistantStream_accumulateContent2(contentElement, currentContent) {
  return _a.accumulateDelta(currentContent, contentElement);
}, _AssistantStream_handleRun = function _AssistantStream_handleRun2(event) {
  __classPrivateFieldSet(this, _AssistantStream_currentRunSnapshot, event.data, "f");
  switch (event.event) {
    case "thread.run.created":
      break;
    case "thread.run.queued":
      break;
    case "thread.run.in_progress":
      break;
    case "thread.run.requires_action":
    case "thread.run.cancelled":
    case "thread.run.failed":
    case "thread.run.completed":
    case "thread.run.expired":
    case "thread.run.incomplete":
      __classPrivateFieldSet(this, _AssistantStream_finalRun, event.data, "f");
      if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
        this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
        __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
      }
      break;
    case "thread.run.cancelling":
      break;
  }
};
function assertNever2(_x) {
}
var Runs = class extends APIResource {
  constructor() {
    super(...arguments);
    this.steps = new Steps(this._client);
  }
  create(threadID, params, options) {
    const { include, ...body } = params;
    return this._client.post(path`/threads/${threadID}/runs`, {
      query: { include },
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false,
      __synthesizeEventData: true
    });
  }
  /**
   * Retrieves a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(runID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${runID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of runs belonging to a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/runs`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Cancels a run that is `in_progress`.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  cancel(runID, params, options) {
    const { thread_id } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * A helper to create a run an poll for a terminal state. More information on Run
   * lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndPoll(threadId, body, options) {
    const run = await this.create(threadId, body, options);
    return await this.poll(run.id, { thread_id: threadId }, options);
  }
  /**
   * Create a Run stream
   *
   * @deprecated use `stream` instead
   */
  createAndStream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  /**
   * A helper to poll a run status until it reaches a terminal state. More
   * information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async poll(runId, params, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const { data: run, response } = await this.retrieve(runId, params, {
        ...options,
        headers: { ...options?.headers, ...headers }
      }).withResponse();
      switch (run.status) {
        //If we are in any sort of intermediate state we poll
        case "queued":
        case "in_progress":
        case "cancelling":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        //We return the run in any terminal state.
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return run;
      }
    }
  }
  /**
   * Create a Run stream
   */
  stream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  submitToolOutputs(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/submit_tool_outputs`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false,
      __synthesizeEventData: true
    });
  }
  /**
   * A helper to submit a tool output to a run and poll for a terminal run state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async submitToolOutputsAndPoll(runId, params, options) {
    const run = await this.submitToolOutputs(runId, params, options);
    return await this.poll(run.id, params, options);
  }
  /**
   * Submit the tool outputs from a previous run and stream the run to a terminal
   * state. More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  submitToolOutputsStream(runId, params, options) {
    return AssistantStream.createToolAssistantStream(runId, this._client.beta.threads.runs, params, options);
  }
};
Runs.Steps = Steps;
var Threads2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs(this._client);
    this.messages = new Messages2(this._client);
  }
  /**
   * Create a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  create(body = {}, options) {
    return this._client.post("/threads", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(threadID, options) {
    return this._client.get(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  delete(threadID, options) {
    return this._client.delete(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  createAndRun(body, options) {
    return this._client.post("/threads/runs", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: body.stream ?? false,
      __synthesizeEventData: true
    });
  }
  /**
   * A helper to create a thread, start a run and then poll for a terminal state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndRunPoll(body, options) {
    const run = await this.createAndRun(body, options);
    return await this.runs.poll(run.id, { thread_id: run.thread_id }, options);
  }
  /**
   * Create a thread and stream the run back
   */
  createAndRunStream(body, options) {
    return AssistantStream.createThreadAssistantStream(body, this._client.beta.threads, options);
  }
};
Threads2.Runs = Runs;
Threads2.Messages = Messages2;
var Beta = class extends APIResource {
  constructor() {
    super(...arguments);
    this.realtime = new Realtime(this._client);
    this.chatkit = new ChatKit(this._client);
    this.assistants = new Assistants(this._client);
    this.threads = new Threads2(this._client);
  }
};
Beta.Realtime = Realtime;
Beta.ChatKit = ChatKit;
Beta.Assistants = Assistants;
Beta.Threads = Threads2;
var Completions2 = class extends APIResource {
  create(body, options) {
    return this._client.post("/completions", { body, ...options, stream: body.stream ?? false });
  }
};
var Content = class extends APIResource {
  /**
   * Retrieve Container File Content
   */
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
};
var Files = class extends APIResource {
  constructor() {
    super(...arguments);
    this.content = new Content(this._client);
  }
  /**
   * Create a Container File
   *
   * You can send either a multipart/form-data request with the raw file content, or
   * a JSON request with a file ID.
   */
  create(containerID, body, options) {
    return this._client.post(path`/containers/${containerID}/files`, maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Retrieve Container File
   */
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}`, options);
  }
  /**
   * List Container files
   */
  list(containerID, query = {}, options) {
    return this._client.getAPIList(path`/containers/${containerID}/files`, CursorPage, {
      query,
      ...options
    });
  }
  /**
   * Delete Container File
   */
  delete(fileID, params, options) {
    const { container_id } = params;
    return this._client.delete(path`/containers/${container_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Files.Content = Content;
var Containers = class extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files(this._client);
  }
  /**
   * Create Container
   */
  create(body, options) {
    return this._client.post("/containers", { body, ...options });
  }
  /**
   * Retrieve Container
   */
  retrieve(containerID, options) {
    return this._client.get(path`/containers/${containerID}`, options);
  }
  /**
   * List Containers
   */
  list(query = {}, options) {
    return this._client.getAPIList("/containers", CursorPage, { query, ...options });
  }
  /**
   * Delete Container
   */
  delete(containerID, options) {
    return this._client.delete(path`/containers/${containerID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Containers.Files = Files;
var Items = class extends APIResource {
  /**
   * Create items in a conversation with the given ID.
   */
  create(conversationID, params, options) {
    const { include, ...body } = params;
    return this._client.post(path`/conversations/${conversationID}/items`, {
      query: { include },
      body,
      ...options
    });
  }
  /**
   * Get a single item from a conversation with the given IDs.
   */
  retrieve(itemID, params, options) {
    const { conversation_id, ...query } = params;
    return this._client.get(path`/conversations/${conversation_id}/items/${itemID}`, { query, ...options });
  }
  /**
   * List all items for a conversation with the given ID.
   */
  list(conversationID, query = {}, options) {
    return this._client.getAPIList(path`/conversations/${conversationID}/items`, ConversationCursorPage, { query, ...options });
  }
  /**
   * Delete an item from a conversation with the given IDs.
   */
  delete(itemID, params, options) {
    const { conversation_id } = params;
    return this._client.delete(path`/conversations/${conversation_id}/items/${itemID}`, options);
  }
};
var Conversations = class extends APIResource {
  constructor() {
    super(...arguments);
    this.items = new Items(this._client);
  }
  /**
   * Create a conversation.
   */
  create(body = {}, options) {
    return this._client.post("/conversations", { body, ...options });
  }
  /**
   * Get a conversation
   */
  retrieve(conversationID, options) {
    return this._client.get(path`/conversations/${conversationID}`, options);
  }
  /**
   * Update a conversation
   */
  update(conversationID, body, options) {
    return this._client.post(path`/conversations/${conversationID}`, { body, ...options });
  }
  /**
   * Delete a conversation. Items in the conversation will not be deleted.
   */
  delete(conversationID, options) {
    return this._client.delete(path`/conversations/${conversationID}`, options);
  }
};
Conversations.Items = Items;
var Embeddings = class extends APIResource {
  /**
   * Creates an embedding vector representing the input text.
   *
   * @example
   * ```ts
   * const createEmbeddingResponse =
   *   await client.embeddings.create({
   *     input: 'The quick brown fox jumped over the lazy dog',
   *     model: 'text-embedding-3-small',
   *   });
   * ```
   */
  create(body, options) {
    const hasUserProvidedEncodingFormat = !!body.encoding_format;
    let encoding_format = hasUserProvidedEncodingFormat ? body.encoding_format : "base64";
    if (hasUserProvidedEncodingFormat) {
      loggerFor(this._client).debug("embeddings/user defined encoding_format:", body.encoding_format);
    }
    const response = this._client.post("/embeddings", {
      body: {
        ...body,
        encoding_format
      },
      ...options
    });
    if (hasUserProvidedEncodingFormat) {
      return response;
    }
    loggerFor(this._client).debug("embeddings/decoding base64 embeddings from base64");
    return response._thenUnwrap((response2) => {
      if (response2 && response2.data) {
        response2.data.forEach((embeddingBase64Obj) => {
          const embeddingBase64Str = embeddingBase64Obj.embedding;
          embeddingBase64Obj.embedding = toFloat32Array(embeddingBase64Str);
        });
      }
      return response2;
    });
  }
};
var OutputItems = class extends APIResource {
  /**
   * Get an evaluation run output item by ID.
   */
  retrieve(outputItemID, params, options) {
    const { eval_id, run_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${run_id}/output_items/${outputItemID}`, options);
  }
  /**
   * Get a list of output items for an evaluation run.
   */
  list(runID, params, options) {
    const { eval_id, ...query } = params;
    return this._client.getAPIList(path`/evals/${eval_id}/runs/${runID}/output_items`, CursorPage, { query, ...options });
  }
};
var Runs2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.outputItems = new OutputItems(this._client);
  }
  /**
   * Kicks off a new run for a given evaluation, specifying the data source, and what
   * model configuration to use to test. The datasource will be validated against the
   * schema specified in the config of the evaluation.
   */
  create(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}/runs`, { body, ...options });
  }
  /**
   * Get an evaluation run by ID.
   */
  retrieve(runID, params, options) {
    const { eval_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  /**
   * Get a list of runs for an evaluation.
   */
  list(evalID, query = {}, options) {
    return this._client.getAPIList(path`/evals/${evalID}/runs`, CursorPage, {
      query,
      ...options
    });
  }
  /**
   * Delete an eval run.
   */
  delete(runID, params, options) {
    const { eval_id } = params;
    return this._client.delete(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  /**
   * Cancel an ongoing evaluation run.
   */
  cancel(runID, params, options) {
    const { eval_id } = params;
    return this._client.post(path`/evals/${eval_id}/runs/${runID}`, options);
  }
};
Runs2.OutputItems = OutputItems;
var Evals = class extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs2(this._client);
  }
  /**
   * Create the structure of an evaluation that can be used to test a model's
   * performance. An evaluation is a set of testing criteria and the config for a
   * data source, which dictates the schema of the data used in the evaluation. After
   * creating an evaluation, you can run it on different models and model parameters.
   * We support several types of graders and datasources. For more information, see
   * the [Evals guide](https://platform.openai.com/docs/guides/evals).
   */
  create(body, options) {
    return this._client.post("/evals", { body, ...options });
  }
  /**
   * Get an evaluation by ID.
   */
  retrieve(evalID, options) {
    return this._client.get(path`/evals/${evalID}`, options);
  }
  /**
   * Update certain properties of an evaluation.
   */
  update(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}`, { body, ...options });
  }
  /**
   * List evaluations for a project.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/evals", CursorPage, { query, ...options });
  }
  /**
   * Delete an evaluation.
   */
  delete(evalID, options) {
    return this._client.delete(path`/evals/${evalID}`, options);
  }
};
Evals.Runs = Runs2;
var Files2 = class extends APIResource {
  /**
   * Upload a file that can be used across various endpoints. Individual files can be
   * up to 512 MB, and each project can store up to 2.5 TB of files in total. There
   * is no organization-wide storage limit.
   *
   * - The Assistants API supports files up to 2 million tokens and of specific file
   *   types. See the
   *   [Assistants Tools guide](https://platform.openai.com/docs/assistants/tools)
   *   for details.
   * - The Fine-tuning API only supports `.jsonl` files. The input also has certain
   *   required formats for fine-tuning
   *   [chat](https://platform.openai.com/docs/api-reference/fine-tuning/chat-input)
   *   or
   *   [completions](https://platform.openai.com/docs/api-reference/fine-tuning/completions-input)
   *   models.
   * - The Batch API only supports `.jsonl` files up to 200 MB in size. The input
   *   also has a specific required
   *   [format](https://platform.openai.com/docs/api-reference/batch/request-input).
   *
   * Please [contact us](https://help.openai.com/) if you need to increase these
   * storage limits.
   */
  create(body, options) {
    return this._client.post("/files", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Returns information about a specific file.
   */
  retrieve(fileID, options) {
    return this._client.get(path`/files/${fileID}`, options);
  }
  /**
   * Returns a list of files.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/files", CursorPage, { query, ...options });
  }
  /**
   * Delete a file and remove it from all vector stores.
   */
  delete(fileID, options) {
    return this._client.delete(path`/files/${fileID}`, options);
  }
  /**
   * Returns the contents of the specified file.
   */
  content(fileID, options) {
    return this._client.get(path`/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * Waits for the given file to be processed, default timeout is 30 mins.
   */
  async waitForProcessing(id, { pollInterval = 5e3, maxWait = 30 * 60 * 1e3 } = {}) {
    const TERMINAL_STATES = /* @__PURE__ */ new Set(["processed", "error", "deleted"]);
    const start = Date.now();
    let file = await this.retrieve(id);
    while (!file.status || !TERMINAL_STATES.has(file.status)) {
      await sleep(pollInterval);
      file = await this.retrieve(id);
      if (Date.now() - start > maxWait) {
        throw new APIConnectionTimeoutError({
          message: `Giving up on waiting for file ${id} to finish processing after ${maxWait} milliseconds.`
        });
      }
    }
    return file;
  }
};
var Methods = class extends APIResource {
};
var Graders = class extends APIResource {
  /**
   * Run a grader.
   *
   * @example
   * ```ts
   * const response = await client.fineTuning.alpha.graders.run({
   *   grader: {
   *     input: 'input',
   *     name: 'name',
   *     operation: 'eq',
   *     reference: 'reference',
   *     type: 'string_check',
   *   },
   *   model_sample: 'model_sample',
   * });
   * ```
   */
  run(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/run", { body, ...options });
  }
  /**
   * Validate a grader.
   *
   * @example
   * ```ts
   * const response =
   *   await client.fineTuning.alpha.graders.validate({
   *     grader: {
   *       input: 'input',
   *       name: 'name',
   *       operation: 'eq',
   *       reference: 'reference',
   *       type: 'string_check',
   *     },
   *   });
   * ```
   */
  validate(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/validate", { body, ...options });
  }
};
var Alpha = class extends APIResource {
  constructor() {
    super(...arguments);
    this.graders = new Graders(this._client);
  }
};
Alpha.Graders = Graders;
var Permissions = class extends APIResource {
  /**
   * **NOTE:** Calling this endpoint requires an [admin API key](../admin-api-keys).
   *
   * This enables organization owners to share fine-tuned models with other projects
   * in their organization.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const permissionCreateResponse of client.fineTuning.checkpoints.permissions.create(
   *   'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *   { project_ids: ['string'] },
   * )) {
   *   // ...
   * }
   * ```
   */
  create(fineTunedModelCheckpoint, body, options) {
    return this._client.getAPIList(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, Page, { body, method: "post", ...options });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to view all permissions for a
   * fine-tuned model checkpoint.
   *
   * @deprecated Retrieve is deprecated. Please swap to the paginated list method instead.
   */
  retrieve(fineTunedModelCheckpoint, query = {}, options) {
    return this._client.get(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, {
      query,
      ...options
    });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to view all permissions for a
   * fine-tuned model checkpoint.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const permissionListResponse of client.fineTuning.checkpoints.permissions.list(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(fineTunedModelCheckpoint, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, ConversationCursorPage, { query, ...options });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to delete a permission for a
   * fine-tuned model checkpoint.
   *
   * @example
   * ```ts
   * const permission =
   *   await client.fineTuning.checkpoints.permissions.delete(
   *     'cp_zc4Q7MP6XxulcVzj4MZdwsAB',
   *     {
   *       fine_tuned_model_checkpoint:
   *         'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *     },
   *   );
   * ```
   */
  delete(permissionID, params, options) {
    const { fine_tuned_model_checkpoint } = params;
    return this._client.delete(path`/fine_tuning/checkpoints/${fine_tuned_model_checkpoint}/permissions/${permissionID}`, options);
  }
};
var Checkpoints = class extends APIResource {
  constructor() {
    super(...arguments);
    this.permissions = new Permissions(this._client);
  }
};
Checkpoints.Permissions = Permissions;
var Checkpoints2 = class extends APIResource {
  /**
   * List checkpoints for a fine-tuning job.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJobCheckpoint of client.fineTuning.jobs.checkpoints.list(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/checkpoints`, CursorPage, { query, ...options });
  }
};
var Jobs = class extends APIResource {
  constructor() {
    super(...arguments);
    this.checkpoints = new Checkpoints2(this._client);
  }
  /**
   * Creates a fine-tuning job which begins the process of creating a new model from
   * a given dataset.
   *
   * Response includes details of the enqueued job including job status and the name
   * of the fine-tuned models once complete.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.create({
   *   model: 'gpt-4o-mini',
   *   training_file: 'file-abc123',
   * });
   * ```
   */
  create(body, options) {
    return this._client.post("/fine_tuning/jobs", { body, ...options });
  }
  /**
   * Get info about a fine-tuning job.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.retrieve(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  retrieve(fineTuningJobID, options) {
    return this._client.get(path`/fine_tuning/jobs/${fineTuningJobID}`, options);
  }
  /**
   * List your organization's fine-tuning jobs
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJob of client.fineTuning.jobs.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/fine_tuning/jobs", CursorPage, { query, ...options });
  }
  /**
   * Immediately cancel a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.cancel(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  cancel(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/cancel`, options);
  }
  /**
   * Get status updates for a fine-tuning job.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJobEvent of client.fineTuning.jobs.listEvents(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * )) {
   *   // ...
   * }
   * ```
   */
  listEvents(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/events`, CursorPage, { query, ...options });
  }
  /**
   * Pause a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.pause(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  pause(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/pause`, options);
  }
  /**
   * Resume a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.resume(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  resume(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/resume`, options);
  }
};
Jobs.Checkpoints = Checkpoints2;
var FineTuning = class extends APIResource {
  constructor() {
    super(...arguments);
    this.methods = new Methods(this._client);
    this.jobs = new Jobs(this._client);
    this.checkpoints = new Checkpoints(this._client);
    this.alpha = new Alpha(this._client);
  }
};
FineTuning.Methods = Methods;
FineTuning.Jobs = Jobs;
FineTuning.Checkpoints = Checkpoints;
FineTuning.Alpha = Alpha;
var GraderModels = class extends APIResource {
};
var Graders2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.graderModels = new GraderModels(this._client);
  }
};
Graders2.GraderModels = GraderModels;
var Images = class extends APIResource {
  /**
   * Creates a variation of a given image. This endpoint only supports `dall-e-2`.
   *
   * @example
   * ```ts
   * const imagesResponse = await client.images.createVariation({
   *   image: fs.createReadStream('otter.png'),
   * });
   * ```
   */
  createVariation(body, options) {
    return this._client.post("/images/variations", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  edit(body, options) {
    return this._client.post("/images/edits", multipartFormRequestOptions({ body, ...options, stream: body.stream ?? false }, this._client));
  }
  generate(body, options) {
    return this._client.post("/images/generations", { body, ...options, stream: body.stream ?? false });
  }
};
var Models = class extends APIResource {
  /**
   * Retrieves a model instance, providing basic information about the model such as
   * the owner and permissioning.
   */
  retrieve(model, options) {
    return this._client.get(path`/models/${model}`, options);
  }
  /**
   * Lists the currently available models, and provides basic information about each
   * one such as the owner and availability.
   */
  list(options) {
    return this._client.getAPIList("/models", Page, options);
  }
  /**
   * Delete a fine-tuned model. You must have the Owner role in your organization to
   * delete a model.
   */
  delete(model, options) {
    return this._client.delete(path`/models/${model}`, options);
  }
};
var Moderations = class extends APIResource {
  /**
   * Classifies if text and/or image inputs are potentially harmful. Learn more in
   * the [moderation guide](https://platform.openai.com/docs/guides/moderation).
   */
  create(body, options) {
    return this._client.post("/moderations", { body, ...options });
  }
};
var Calls = class extends APIResource {
  /**
   * Accept an incoming SIP call and configure the realtime session that will handle
   * it.
   *
   * @example
   * ```ts
   * await client.realtime.calls.accept('call_id', {
   *   type: 'realtime',
   * });
   * ```
   */
  accept(callID, body, options) {
    return this._client.post(path`/realtime/calls/${callID}/accept`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * End an active Realtime API call, whether it was initiated over SIP or WebRTC.
   *
   * @example
   * ```ts
   * await client.realtime.calls.hangup('call_id');
   * ```
   */
  hangup(callID, options) {
    return this._client.post(path`/realtime/calls/${callID}/hangup`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Transfer an active SIP call to a new destination using the SIP REFER verb.
   *
   * @example
   * ```ts
   * await client.realtime.calls.refer('call_id', {
   *   target_uri: 'tel:+14155550123',
   * });
   * ```
   */
  refer(callID, body, options) {
    return this._client.post(path`/realtime/calls/${callID}/refer`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Decline an incoming SIP call by returning a SIP status code to the caller.
   *
   * @example
   * ```ts
   * await client.realtime.calls.reject('call_id');
   * ```
   */
  reject(callID, body = {}, options) {
    return this._client.post(path`/realtime/calls/${callID}/reject`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
var ClientSecrets = class extends APIResource {
  /**
   * Create a Realtime client secret with an associated session configuration.
   *
   * Client secrets are short-lived tokens that can be passed to a client app, such
   * as a web frontend or mobile client, which grants access to the Realtime API
   * without leaking your main API key. You can configure a custom TTL for each
   * client secret.
   *
   * You can also attach session configuration options to the client secret, which
   * will be applied to any sessions created using that client secret, but these can
   * also be overridden by the client connection.
   *
   * [Learn more about authentication with client secrets over WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).
   *
   * Returns the created client secret and the effective session object. The client
   * secret is a string that looks like `ek_1234`.
   *
   * @example
   * ```ts
   * const clientSecret =
   *   await client.realtime.clientSecrets.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/client_secrets", { body, ...options });
  }
};
var Realtime2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.clientSecrets = new ClientSecrets(this._client);
    this.calls = new Calls(this._client);
  }
};
Realtime2.ClientSecrets = ClientSecrets;
Realtime2.Calls = Calls;
function maybeParseResponse(response, params) {
  if (!params || !hasAutoParseableInput2(params)) {
    return {
      ...response,
      output_parsed: null,
      output: response.output.map((item) => {
        if (item.type === "function_call") {
          return {
            ...item,
            parsed_arguments: null
          };
        }
        if (item.type === "message") {
          return {
            ...item,
            content: item.content.map((content) => ({
              ...content,
              parsed: null
            }))
          };
        } else {
          return item;
        }
      })
    };
  }
  return parseResponse(response, params);
}
function parseResponse(response, params) {
  const output = response.output.map((item) => {
    if (item.type === "function_call") {
      return {
        ...item,
        parsed_arguments: parseToolCall2(params, item)
      };
    }
    if (item.type === "message") {
      const content = item.content.map((content2) => {
        if (content2.type === "output_text") {
          return {
            ...content2,
            parsed: parseTextFormat(params, content2.text)
          };
        }
        return content2;
      });
      return {
        ...item,
        content
      };
    }
    return item;
  });
  const parsed = Object.assign({}, response, { output });
  if (!Object.getOwnPropertyDescriptor(response, "output_text")) {
    addOutputText(parsed);
  }
  Object.defineProperty(parsed, "output_parsed", {
    enumerable: true,
    get() {
      for (const output2 of parsed.output) {
        if (output2.type !== "message") {
          continue;
        }
        for (const content of output2.content) {
          if (content.type === "output_text" && content.parsed !== null) {
            return content.parsed;
          }
        }
      }
      return null;
    }
  });
  return parsed;
}
function parseTextFormat(params, content) {
  if (params.text?.format?.type !== "json_schema") {
    return null;
  }
  if ("$parseRaw" in params.text?.format) {
    const text_format = params.text?.format;
    return text_format.$parseRaw(content);
  }
  return JSON.parse(content);
}
function hasAutoParseableInput2(params) {
  if (isAutoParsableResponseFormat(params.text?.format)) {
    return true;
  }
  return false;
}
function isAutoParsableTool2(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function getInputToolByName(input_tools, name) {
  return input_tools.find((tool) => tool.type === "function" && tool.name === name);
}
function parseToolCall2(params, toolCall) {
  const inputTool = getInputToolByName(params.tools ?? [], toolCall.name);
  return {
    ...toolCall,
    ...toolCall,
    parsed_arguments: isAutoParsableTool2(inputTool) ? inputTool.$parseRaw(toolCall.arguments) : inputTool?.strict ? JSON.parse(toolCall.arguments) : null
  };
}
function addOutputText(rsp) {
  const texts = [];
  for (const output of rsp.output) {
    if (output.type !== "message") {
      continue;
    }
    for (const content of output.content) {
      if (content.type === "output_text") {
        texts.push(content.text);
      }
    }
  }
  rsp.output_text = texts.join("");
}
var _ResponseStream_instances;
var _ResponseStream_params;
var _ResponseStream_currentResponseSnapshot;
var _ResponseStream_finalResponse;
var _ResponseStream_beginRequest;
var _ResponseStream_addEvent;
var _ResponseStream_endRequest;
var _ResponseStream_accumulateResponse;
var ResponseStream = class _ResponseStream extends EventStream {
  constructor(params) {
    super();
    _ResponseStream_instances.add(this);
    _ResponseStream_params.set(this, void 0);
    _ResponseStream_currentResponseSnapshot.set(this, void 0);
    _ResponseStream_finalResponse.set(this, void 0);
    __classPrivateFieldSet(this, _ResponseStream_params, params, "f");
  }
  static createResponse(client, params, options) {
    const runner = new _ResponseStream(params);
    runner._run(() => runner._createOrRetrieveResponse(client, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createOrRetrieveResponse(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_beginRequest).call(this);
    let stream;
    let starting_after = null;
    if ("response_id" in params) {
      stream = await client.responses.retrieve(params.response_id, { stream: true }, { ...options, signal: this.controller.signal, stream: true });
      starting_after = params.starting_after ?? null;
    } else {
      stream = await client.responses.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    }
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_addEvent).call(this, event, starting_after);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_endRequest).call(this);
  }
  [(_ResponseStream_params = /* @__PURE__ */ new WeakMap(), _ResponseStream_currentResponseSnapshot = /* @__PURE__ */ new WeakMap(), _ResponseStream_finalResponse = /* @__PURE__ */ new WeakMap(), _ResponseStream_instances = /* @__PURE__ */ new WeakSet(), _ResponseStream_beginRequest = function _ResponseStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, void 0, "f");
  }, _ResponseStream_addEvent = function _ResponseStream_addEvent2(event, starting_after) {
    if (this.ended)
      return;
    const maybeEmit = (name, event2) => {
      if (starting_after == null || event2.sequence_number > starting_after) {
        this._emit(name, event2);
      }
    };
    const response = __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_accumulateResponse).call(this, event);
    maybeEmit("event", event);
    switch (event.type) {
      case "response.output_text.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          maybeEmit("response.output_text.delta", {
            ...event,
            snapshot: content.text
          });
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          maybeEmit("response.function_call_arguments.delta", {
            ...event,
            snapshot: output.arguments
          });
        }
        break;
      }
      default:
        maybeEmit(event.type, event);
        break;
    }
  }, _ResponseStream_endRequest = function _ResponseStream_endRequest2() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any events`);
    }
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, void 0, "f");
    const parsedResponse = finalizeResponse(snapshot, __classPrivateFieldGet(this, _ResponseStream_params, "f"));
    __classPrivateFieldSet(this, _ResponseStream_finalResponse, parsedResponse, "f");
    return parsedResponse;
  }, _ResponseStream_accumulateResponse = function _ResponseStream_accumulateResponse2(event) {
    let snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      if (event.type !== "response.created") {
        throw new OpenAIError(`When snapshot hasn't been set yet, expected 'response.created' event, got ${event.type}`);
      }
      snapshot = __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
      return snapshot;
    }
    switch (event.type) {
      case "response.output_item.added": {
        snapshot.output.push(event.item);
        break;
      }
      case "response.content_part.added": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        const type = output.type;
        const part = event.part;
        if (type === "message" && part.type !== "reasoning_text") {
          output.content.push(part);
        } else if (type === "reasoning" && part.type === "reasoning_text") {
          if (!output.content) {
            output.content = [];
          }
          output.content.push(part);
        }
        break;
      }
      case "response.output_text.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          content.text += event.delta;
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          output.arguments += event.delta;
        }
        break;
      }
      case "response.reasoning_text.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "reasoning") {
          const content = output.content?.[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "reasoning_text") {
            throw new OpenAIError(`expected content to be 'reasoning_text', got ${content.type}`);
          }
          content.text += event.delta;
        }
        break;
      }
      case "response.completed": {
        __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
        break;
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((event2) => event2 ? { value: event2, done: false } : { value: void 0, done: true });
        }
        const event = pushQueue.shift();
        return { value: event, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  /**
   * @returns a promise that resolves with the final Response, or rejects
   * if an error occurred or the stream ended prematurely without producing a REsponse.
   */
  async finalResponse() {
    await this.done();
    const response = __classPrivateFieldGet(this, _ResponseStream_finalResponse, "f");
    if (!response)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return response;
  }
};
function finalizeResponse(snapshot, params) {
  return maybeParseResponse(snapshot, params);
}
var InputItems = class extends APIResource {
  /**
   * Returns a list of input items for a given response.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const responseItem of client.responses.inputItems.list(
   *   'response_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(responseID, query = {}, options) {
    return this._client.getAPIList(path`/responses/${responseID}/input_items`, CursorPage, { query, ...options });
  }
};
var InputTokens = class extends APIResource {
  /**
   * Returns input token counts of the request.
   *
   * Returns an object with `object` set to `response.input_tokens` and an
   * `input_tokens` count.
   *
   * @example
   * ```ts
   * const response = await client.responses.inputTokens.count();
   * ```
   */
  count(body = {}, options) {
    return this._client.post("/responses/input_tokens", { body, ...options });
  }
};
var Responses = class extends APIResource {
  constructor() {
    super(...arguments);
    this.inputItems = new InputItems(this._client);
    this.inputTokens = new InputTokens(this._client);
  }
  create(body, options) {
    return this._client.post("/responses", { body, ...options, stream: body.stream ?? false })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  retrieve(responseID, query = {}, options) {
    return this._client.get(path`/responses/${responseID}`, {
      query,
      ...options,
      stream: query?.stream ?? false
    })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  /**
   * Deletes a model response with the given ID.
   *
   * @example
   * ```ts
   * await client.responses.delete(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  delete(responseID, options) {
    return this._client.delete(path`/responses/${responseID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  parse(body, options) {
    return this._client.responses.create(body, options)._thenUnwrap((response) => parseResponse(response, body));
  }
  /**
   * Creates a model response stream
   */
  stream(body, options) {
    return ResponseStream.createResponse(this._client, body, options);
  }
  /**
   * Cancels a model response with the given ID. Only responses created with the
   * `background` parameter set to `true` can be cancelled.
   * [Learn more](https://platform.openai.com/docs/guides/background).
   *
   * @example
   * ```ts
   * const response = await client.responses.cancel(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  cancel(responseID, options) {
    return this._client.post(path`/responses/${responseID}/cancel`, options);
  }
  /**
   * Compact a conversation. Returns a compacted response object.
   *
   * Learn when and how to compact long-running conversations in the
   * [conversation state guide](https://platform.openai.com/docs/guides/conversation-state#managing-the-context-window).
   * For ZDR-compatible compaction details, see
   * [Compaction (advanced)](https://platform.openai.com/docs/guides/conversation-state#compaction-advanced).
   *
   * @example
   * ```ts
   * const compactedResponse = await client.responses.compact({
   *   model: 'gpt-5.4',
   * });
   * ```
   */
  compact(body, options) {
    return this._client.post("/responses/compact", { body, ...options });
  }
};
Responses.InputItems = InputItems;
Responses.InputTokens = InputTokens;
var Content2 = class extends APIResource {
  /**
   * Download a skill zip bundle by its ID.
   */
  retrieve(skillID, options) {
    return this._client.get(path`/skills/${skillID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
};
var Content3 = class extends APIResource {
  /**
   * Download a skill version zip bundle.
   */
  retrieve(version, params, options) {
    const { skill_id } = params;
    return this._client.get(path`/skills/${skill_id}/versions/${version}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
};
var Versions = class extends APIResource {
  constructor() {
    super(...arguments);
    this.content = new Content3(this._client);
  }
  /**
   * Create a new immutable skill version.
   */
  create(skillID, body = {}, options) {
    return this._client.post(path`/skills/${skillID}/versions`, maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Get a specific skill version.
   */
  retrieve(version, params, options) {
    const { skill_id } = params;
    return this._client.get(path`/skills/${skill_id}/versions/${version}`, options);
  }
  /**
   * List skill versions for a skill.
   */
  list(skillID, query = {}, options) {
    return this._client.getAPIList(path`/skills/${skillID}/versions`, CursorPage, {
      query,
      ...options
    });
  }
  /**
   * Delete a skill version.
   */
  delete(version, params, options) {
    const { skill_id } = params;
    return this._client.delete(path`/skills/${skill_id}/versions/${version}`, options);
  }
};
Versions.Content = Content3;
var Skills = class extends APIResource {
  constructor() {
    super(...arguments);
    this.content = new Content2(this._client);
    this.versions = new Versions(this._client);
  }
  /**
   * Create a new skill.
   */
  create(body = {}, options) {
    return this._client.post("/skills", maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Get a skill by its ID.
   */
  retrieve(skillID, options) {
    return this._client.get(path`/skills/${skillID}`, options);
  }
  /**
   * Update the default version pointer for a skill.
   */
  update(skillID, body, options) {
    return this._client.post(path`/skills/${skillID}`, { body, ...options });
  }
  /**
   * List all skills for the current project.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/skills", CursorPage, { query, ...options });
  }
  /**
   * Delete a skill by its ID.
   */
  delete(skillID, options) {
    return this._client.delete(path`/skills/${skillID}`, options);
  }
};
Skills.Content = Content2;
Skills.Versions = Versions;
var Parts = class extends APIResource {
  /**
   * Adds a
   * [Part](https://platform.openai.com/docs/api-reference/uploads/part-object) to an
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object.
   * A Part represents a chunk of bytes from the file you are trying to upload.
   *
   * Each Part can be at most 64 MB, and you can add Parts until you hit the Upload
   * maximum of 8 GB.
   *
   * It is possible to add multiple Parts in parallel. You can decide the intended
   * order of the Parts when you
   * [complete the Upload](https://platform.openai.com/docs/api-reference/uploads/complete).
   */
  create(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/parts`, multipartFormRequestOptions({ body, ...options }, this._client));
  }
};
var Uploads = class extends APIResource {
  constructor() {
    super(...arguments);
    this.parts = new Parts(this._client);
  }
  /**
   * Creates an intermediate
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object
   * that you can add
   * [Parts](https://platform.openai.com/docs/api-reference/uploads/part-object) to.
   * Currently, an Upload can accept at most 8 GB in total and expires after an hour
   * after you create it.
   *
   * Once you complete the Upload, we will create a
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * contains all the parts you uploaded. This File is usable in the rest of our
   * platform as a regular File object.
   *
   * For certain `purpose` values, the correct `mime_type` must be specified. Please
   * refer to documentation for the
   * [supported MIME types for your use case](https://platform.openai.com/docs/assistants/tools/file-search#supported-files).
   *
   * For guidance on the proper filename extensions for each purpose, please follow
   * the documentation on
   * [creating a File](https://platform.openai.com/docs/api-reference/files/create).
   *
   * Returns the Upload object with status `pending`.
   */
  create(body, options) {
    return this._client.post("/uploads", { body, ...options });
  }
  /**
   * Cancels the Upload. No Parts may be added after an Upload is cancelled.
   *
   * Returns the Upload object with status `cancelled`.
   */
  cancel(uploadID, options) {
    return this._client.post(path`/uploads/${uploadID}/cancel`, options);
  }
  /**
   * Completes the
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object).
   *
   * Within the returned Upload object, there is a nested
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * is ready to use in the rest of the platform.
   *
   * You can specify the order of the Parts by passing in an ordered list of the Part
   * IDs.
   *
   * The number of bytes uploaded upon completion must match the number of bytes
   * initially specified when creating the Upload object. No Parts may be added after
   * an Upload is completed. Returns the Upload object with status `completed`,
   * including an additional `file` property containing the created usable File
   * object.
   */
  complete(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/complete`, { body, ...options });
  }
};
Uploads.Parts = Parts;
var allSettledWithThrow = async (promises) => {
  const results = await Promise.allSettled(promises);
  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length) {
    for (const result of rejected) {
      console.error(result.reason);
    }
    throw new Error(`${rejected.length} promise(s) failed - see the above errors`);
  }
  const values = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      values.push(result.value);
    }
  }
  return values;
};
var FileBatches = class extends APIResource {
  /**
   * Create a vector store file batch.
   */
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/file_batches`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store file batch.
   */
  retrieve(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/file_batches/${batchID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Cancel a vector store file batch. This attempts to cancel the processing of
   * files in this batch as soon as possible.
   */
  cancel(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Create a vector store batch and poll until all files have been processed.
   */
  async createAndPoll(vectorStoreId, body, options) {
    const batch = await this.create(vectorStoreId, body);
    return await this.poll(vectorStoreId, batch.id, options);
  }
  /**
   * Returns a list of vector store files in a batch.
   */
  listFiles(batchID, params, options) {
    const { vector_store_id, ...query } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/files`, CursorPage, { query, ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
  /**
   * Wait for the given file batch to be processed.
   *
   * Note: this will return even if one of the files failed to process, you need to
   * check batch.file_counts.failed_count to handle this case.
   */
  async poll(vectorStoreID, batchID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const { data: batch, response } = await this.retrieve(batchID, { vector_store_id: vectorStoreID }, {
        ...options,
        headers
      }).withResponse();
      switch (batch.status) {
        case "in_progress":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return batch;
      }
    }
  }
  /**
   * Uploads the given files concurrently and then creates a vector store file batch.
   *
   * The concurrency limit is configurable using the `maxConcurrency` parameter.
   */
  async uploadAndPoll(vectorStoreId, { files, fileIds = [] }, options) {
    if (files == null || files.length == 0) {
      throw new Error(`No \`files\` provided to process. If you've already uploaded files you should use \`.createAndPoll()\` instead`);
    }
    const configuredConcurrency = options?.maxConcurrency ?? 5;
    const concurrencyLimit = Math.min(configuredConcurrency, files.length);
    const client = this._client;
    const fileIterator = files.values();
    const allFileIds = [...fileIds];
    async function processFiles(iterator) {
      for (let item of iterator) {
        const fileObj = await client.files.create({ file: item, purpose: "assistants" }, options);
        allFileIds.push(fileObj.id);
      }
    }
    const workers = Array(concurrencyLimit).fill(fileIterator).map(processFiles);
    await allSettledWithThrow(workers);
    return await this.createAndPoll(vectorStoreId, {
      file_ids: allFileIds
    });
  }
};
var Files3 = class extends APIResource {
  /**
   * Create a vector store file by attaching a
   * [File](https://platform.openai.com/docs/api-reference/files) to a
   * [vector store](https://platform.openai.com/docs/api-reference/vector-stores/object).
   */
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/files`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store file.
   */
  retrieve(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Update attributes on a vector store file.
   */
  update(fileID, params, options) {
    const { vector_store_id, ...body } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of vector store files.
   */
  list(vectorStoreID, query = {}, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/files`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a vector store file. This will remove the file from the vector store but
   * the file itself will not be deleted. To delete the file, use the
   * [delete file](https://platform.openai.com/docs/api-reference/files/delete)
   * endpoint.
   */
  delete(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.delete(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Attach a file to the given vector store and wait for it to be processed.
   */
  async createAndPoll(vectorStoreId, body, options) {
    const file = await this.create(vectorStoreId, body, options);
    return await this.poll(vectorStoreId, file.id, options);
  }
  /**
   * Wait for the vector store file to finish processing.
   *
   * Note: this will return even if the file failed to process, you need to check
   * file.last_error and file.status to handle these cases
   */
  async poll(vectorStoreID, fileID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const fileResponse = await this.retrieve(fileID, {
        vector_store_id: vectorStoreID
      }, { ...options, headers }).withResponse();
      const file = fileResponse.data;
      switch (file.status) {
        case "in_progress":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = fileResponse.response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "completed":
          return file;
      }
    }
  }
  /**
   * Upload a file to the `files` API and then attach it to the given vector store.
   *
   * Note the file will be asynchronously processed (you can use the alternative
   * polling helper method to wait for processing to complete).
   */
  async upload(vectorStoreId, file, options) {
    const fileInfo = await this._client.files.create({ file, purpose: "assistants" }, options);
    return this.create(vectorStoreId, { file_id: fileInfo.id }, options);
  }
  /**
   * Add a file to a vector store and poll until processing is complete.
   */
  async uploadAndPoll(vectorStoreId, file, options) {
    const fileInfo = await this.upload(vectorStoreId, file, options);
    return await this.poll(vectorStoreId, fileInfo.id, options);
  }
  /**
   * Retrieve the parsed contents of a vector store file.
   */
  content(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/files/${fileID}/content`, Page, { ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
};
var VectorStores = class extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files3(this._client);
    this.fileBatches = new FileBatches(this._client);
  }
  /**
   * Create a vector store.
   */
  create(body, options) {
    return this._client.post("/vector_stores", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store.
   */
  retrieve(vectorStoreID, options) {
    return this._client.get(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a vector store.
   */
  update(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of vector stores.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/vector_stores", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a vector store.
   */
  delete(vectorStoreID, options) {
    return this._client.delete(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Search a vector store for relevant chunks based on a query and file attributes
   * filter.
   */
  search(vectorStoreID, body, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/search`, Page, {
      body,
      method: "post",
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
VectorStores.Files = Files3;
VectorStores.FileBatches = FileBatches;
var Videos = class extends APIResource {
  /**
   * Create a new video generation job from a prompt and optional reference assets.
   */
  create(body, options) {
    return this._client.post("/videos", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Fetch the latest metadata for a generated video.
   */
  retrieve(videoID, options) {
    return this._client.get(path`/videos/${videoID}`, options);
  }
  /**
   * List recently generated videos for the current project.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/videos", ConversationCursorPage, { query, ...options });
  }
  /**
   * Permanently delete a completed or failed video and its stored assets.
   */
  delete(videoID, options) {
    return this._client.delete(path`/videos/${videoID}`, options);
  }
  /**
   * Create a character from an uploaded video.
   */
  createCharacter(body, options) {
    return this._client.post("/videos/characters", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Download the generated video bytes or a derived preview asset.
   *
   * Streams the rendered video content for the specified video job.
   */
  downloadContent(videoID, query = {}, options) {
    return this._client.get(path`/videos/${videoID}/content`, {
      query,
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * Create a new video generation job by editing a source video or existing
   * generated video.
   */
  edit(body, options) {
    return this._client.post("/videos/edits", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Create an extension of a completed video.
   */
  extend(body, options) {
    return this._client.post("/videos/extensions", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Fetch a character.
   */
  getCharacter(characterID, options) {
    return this._client.get(path`/videos/characters/${characterID}`, options);
  }
  /**
   * Create a remix of a completed video using a refreshed prompt.
   */
  remix(videoID, body, options) {
    return this._client.post(path`/videos/${videoID}/remix`, maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
};
var _Webhooks_instances;
var _Webhooks_validateSecret;
var _Webhooks_getRequiredHeader;
var Webhooks = class extends APIResource {
  constructor() {
    super(...arguments);
    _Webhooks_instances.add(this);
  }
  /**
   * Validates that the given payload was sent by OpenAI and parses the payload.
   */
  async unwrap(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    await this.verifySignature(payload, headers, secret, tolerance);
    return JSON.parse(payload);
  }
  /**
   * Validates whether or not the webhook payload was sent by OpenAI.
   *
   * An error will be raised if the webhook payload was not sent by OpenAI.
   *
   * @param payload - The webhook payload
   * @param headers - The webhook headers
   * @param secret - The webhook secret (optional, will use client secret if not provided)
   * @param tolerance - Maximum age of the webhook in seconds (default: 300 = 5 minutes)
   */
  async verifySignature(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    if (typeof crypto === "undefined" || typeof crypto.subtle.importKey !== "function" || typeof crypto.subtle.verify !== "function") {
      throw new Error("Webhook signature verification is only supported when the `crypto` global is defined");
    }
    __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_validateSecret).call(this, secret);
    const headersObj = buildHeaders([headers]).values;
    const signatureHeader = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-signature");
    const timestamp = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-timestamp");
    const webhookId = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-id");
    const timestampSeconds = parseInt(timestamp, 10);
    if (isNaN(timestampSeconds)) {
      throw new InvalidWebhookSignatureError("Invalid webhook timestamp format");
    }
    const nowSeconds = Math.floor(Date.now() / 1e3);
    if (nowSeconds - timestampSeconds > tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too old");
    }
    if (timestampSeconds > nowSeconds + tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too new");
    }
    const signatures = signatureHeader.split(" ").map((part) => part.startsWith("v1,") ? part.substring(3) : part);
    const decodedSecret = secret.startsWith("whsec_") ? Buffer.from(secret.replace("whsec_", ""), "base64") : Buffer.from(secret, "utf-8");
    const signedPayload = webhookId ? `${webhookId}.${timestamp}.${payload}` : `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey("raw", decodedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    for (const signature of signatures) {
      try {
        const signatureBytes = Buffer.from(signature, "base64");
        const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(signedPayload));
        if (isValid) {
          return;
        }
      } catch {
        continue;
      }
    }
    throw new InvalidWebhookSignatureError("The given webhook signature does not match the expected signature");
  }
};
_Webhooks_instances = /* @__PURE__ */ new WeakSet(), _Webhooks_validateSecret = function _Webhooks_validateSecret2(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error(`The webhook secret must either be set using the env var, OPENAI_WEBHOOK_SECRET, on the client class, OpenAI({ webhookSecret: '123' }), or passed to this function`);
  }
}, _Webhooks_getRequiredHeader = function _Webhooks_getRequiredHeader2(headers, name) {
  if (!headers) {
    throw new Error(`Headers are required`);
  }
  const value = headers.get(name);
  if (value === null || value === void 0) {
    throw new Error(`Missing required header: ${name}`);
  }
  return value;
};
var _OpenAI_instances;
var _a2;
var _OpenAI_encoder;
var _OpenAI_baseURLOverridden;
var OpenAI = class {
  /**
   * API Client for interfacing with the OpenAI API.
   *
   * @param {string | undefined} [opts.apiKey=process.env['OPENAI_API_KEY'] ?? undefined]
   * @param {string | null | undefined} [opts.organization=process.env['OPENAI_ORG_ID'] ?? null]
   * @param {string | null | undefined} [opts.project=process.env['OPENAI_PROJECT_ID'] ?? null]
   * @param {string | null | undefined} [opts.webhookSecret=process.env['OPENAI_WEBHOOK_SECRET'] ?? null]
   * @param {string} [opts.baseURL=process.env['OPENAI_BASE_URL'] ?? https://api.openai.com/v1] - Override the default base URL for the API.
   * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
   * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   */
  constructor({ baseURL = readEnv("OPENAI_BASE_URL"), apiKey = readEnv("OPENAI_API_KEY"), organization = readEnv("OPENAI_ORG_ID") ?? null, project = readEnv("OPENAI_PROJECT_ID") ?? null, webhookSecret = readEnv("OPENAI_WEBHOOK_SECRET") ?? null, ...opts } = {}) {
    _OpenAI_instances.add(this);
    _OpenAI_encoder.set(this, void 0);
    this.completions = new Completions2(this);
    this.chat = new Chat(this);
    this.embeddings = new Embeddings(this);
    this.files = new Files2(this);
    this.images = new Images(this);
    this.audio = new Audio(this);
    this.moderations = new Moderations(this);
    this.models = new Models(this);
    this.fineTuning = new FineTuning(this);
    this.graders = new Graders2(this);
    this.vectorStores = new VectorStores(this);
    this.webhooks = new Webhooks(this);
    this.beta = new Beta(this);
    this.batches = new Batches(this);
    this.uploads = new Uploads(this);
    this.responses = new Responses(this);
    this.realtime = new Realtime2(this);
    this.conversations = new Conversations(this);
    this.evals = new Evals(this);
    this.containers = new Containers(this);
    this.skills = new Skills(this);
    this.videos = new Videos(this);
    if (apiKey === void 0) {
      throw new OpenAIError("Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.");
    }
    const options = {
      apiKey,
      organization,
      project,
      webhookSecret,
      ...opts,
      baseURL: baseURL || `https://api.openai.com/v1`
    };
    if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new OpenAIError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew OpenAI({ apiKey, dangerouslyAllowBrowser: true });\n\nhttps://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety\n");
    }
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? _a2.DEFAULT_TIMEOUT;
    this.logger = options.logger ?? console;
    const defaultLogLevel = "warn";
    this.logLevel = defaultLogLevel;
    this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("OPENAI_LOG"), "process.env['OPENAI_LOG']", this) ?? defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? getDefaultFetch();
    __classPrivateFieldSet(this, _OpenAI_encoder, FallbackEncoder, "f");
    this._options = options;
    this.apiKey = typeof apiKey === "string" ? apiKey : "Missing Key";
    this.organization = organization;
    this.project = project;
    this.webhookSecret = webhookSecret;
  }
  /**
   * Create a new client instance re-using the same options given to the current client with optional overriding.
   */
  withOptions(options) {
    const client = new this.constructor({
      ...this._options,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      apiKey: this.apiKey,
      organization: this.organization,
      project: this.project,
      webhookSecret: this.webhookSecret,
      ...options
    });
    return client;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  validateHeaders({ values, nulls }) {
    return;
  }
  async authHeaders(opts) {
    return buildHeaders([{ Authorization: `Bearer ${this.apiKey}` }]);
  }
  stringifyQuery(query) {
    return stringifyQuery(query);
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  makeStatusError(status, error, message, headers) {
    return APIError.generate(status, error, message, headers);
  }
  async _callApiKey() {
    const apiKey = this._options.apiKey;
    if (typeof apiKey !== "function")
      return false;
    let token;
    try {
      token = await apiKey();
    } catch (err) {
      if (err instanceof OpenAIError)
        throw err;
      throw new OpenAIError(
        `Failed to get token from 'apiKey' function: ${err.message}`,
        // @ts-ignore
        { cause: err }
      );
    }
    if (typeof token !== "string" || !token) {
      throw new OpenAIError(`Expected 'apiKey' function argument to return a string but it returned ${token}`);
    }
    this.apiKey = token;
    return true;
  }
  buildURL(path3, query, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet(this, _OpenAI_instances, "m", _OpenAI_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path3) ? new URL(path3) : new URL(baseURL + (baseURL.endsWith("/") && path3.startsWith("/") ? path3.slice(1) : path3));
    const defaultQuery = this.defaultQuery();
    const pathQuery = Object.fromEntries(url.searchParams);
    if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
      query = { ...pathQuery, ...defaultQuery, ...query };
    }
    if (typeof query === "object" && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query);
    }
    return url.toString();
  }
  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.
   */
  async prepareOptions(options) {
    await this._callApiKey();
  }
  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  async prepareRequest(request, { url, options }) {
  }
  get(path3, opts) {
    return this.methodRequest("get", path3, opts);
  }
  post(path3, opts) {
    return this.methodRequest("post", path3, opts);
  }
  patch(path3, opts) {
    return this.methodRequest("patch", path3, opts);
  }
  put(path3, opts) {
    return this.methodRequest("put", path3, opts);
  }
  delete(path3, opts) {
    return this.methodRequest("delete", path3, opts);
  }
  methodRequest(method, path3, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path3, ...opts2 };
    }));
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
  }
  async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining
    });
    await this.prepareRequest(req, { url, options });
    const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
    const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();
    loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
      retryOfRequestLogID,
      method: options.method,
      url,
      options,
      headers: req.headers
    }));
    if (options.signal?.aborted) {
      throw new APIUserAbortError();
    }
    const controller = new AbortController();
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();
    if (response instanceof globalThis.Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new APIUserAbortError();
      }
      const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
      if (retriesRemaining) {
        loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
        loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
      loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
        retryOfRequestLogID,
        url,
        durationMs: headersTime - startTime,
        message: response.message
      }));
      if (isTimeout) {
        throw new APIConnectionTimeoutError();
      }
      throw new APIConnectionError({ cause: response });
    }
    const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "x-request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
    const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
    if (!response.ok) {
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        await CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
        loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
      }
      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err2) => castToError(err2).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? void 0 : errText;
      loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        message: errMessage,
        durationMs: Date.now() - startTime
      }));
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }
    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
      retryOfRequestLogID,
      url: response.url,
      status: response.status,
      headers: response.headers,
      durationMs: headersTime - startTime
    }));
    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }
  getAPIList(path3, Page2, opts) {
    return this.requestAPIList(Page2, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path3, ...opts2 })) : { method: "get", path: path3, ...opts });
  }
  requestAPIList(Page2, options) {
    const request = this.makeRequest(options, null, void 0);
    return new PagePromise(this, request, Page2);
  }
  async fetchWithTimeout(url, init, ms, controller) {
    const { signal, method, ...options } = init || {};
    const abort = this._makeAbort(controller);
    if (signal)
      signal.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, ms);
    const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
    const fetchOptions = {
      signal: controller.signal,
      ...isReadableBody ? { duplex: "half" } : {},
      method: "GET",
      ...options
    };
    if (method) {
      fetchOptions.method = method.toUpperCase();
    }
    try {
      return await this.fetch.call(void 0, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }
  async shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.get("retry-after");
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1e3;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (timeoutMillis === void 0) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1e3;
  }
  async buildRequest(inputOptions, { retryCount = 0 } = {}) {
    const options = { ...inputOptions };
    const { method, path: path3, query, defaultBaseURL } = options;
    const url = this.buildURL(path3, query, defaultBaseURL);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
    const req = {
      method,
      headers: reqHeaders,
      ...options.signal && { signal: options.signal },
      ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
      ...body && { body },
      ...this.fetchOptions ?? {},
      ...options.fetchOptions ?? {}
    };
    return { req, url, timeout: options.timeout };
  }
  async buildHeaders({ options, method, bodyHeaders, retryCount }) {
    let idempotencyHeaders = {};
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }
    const headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: "application/json",
        "User-Agent": this.getUserAgent(),
        "X-Stainless-Retry-Count": String(retryCount),
        ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
        ...getPlatformHeaders(),
        "OpenAI-Organization": this.organization,
        "OpenAI-Project": this.project
      },
      await this.authHeaders(options),
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers
    ]);
    this.validateHeaders(headers);
    return headers.values;
  }
  _makeAbort(controller) {
    return () => controller.abort();
  }
  buildBody({ options: { body, headers: rawHeaders } }) {
    if (!body) {
      return { bodyHeaders: void 0, body: void 0 };
    }
    const headers = buildHeaders([rawHeaders]);
    if (
      // Pass raw type verbatim
      ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
      headers.values.has("content-type") || // `Blob` is superset of `File`
      globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
      body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
      body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
      globalThis.ReadableStream && body instanceof globalThis.ReadableStream
    ) {
      return { bodyHeaders: void 0, body };
    } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
      return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
    } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
      return {
        bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
        body: this.stringifyQuery(body)
      };
    } else {
      return __classPrivateFieldGet(this, _OpenAI_encoder, "f").call(this, { body, headers });
    }
  }
};
_a2 = OpenAI, _OpenAI_encoder = /* @__PURE__ */ new WeakMap(), _OpenAI_instances = /* @__PURE__ */ new WeakSet(), _OpenAI_baseURLOverridden = function _OpenAI_baseURLOverridden2() {
  return this.baseURL !== "https://api.openai.com/v1";
};
OpenAI.OpenAI = _a2;
OpenAI.DEFAULT_TIMEOUT = 6e5;
OpenAI.OpenAIError = OpenAIError;
OpenAI.APIError = APIError;
OpenAI.APIConnectionError = APIConnectionError;
OpenAI.APIConnectionTimeoutError = APIConnectionTimeoutError;
OpenAI.APIUserAbortError = APIUserAbortError;
OpenAI.NotFoundError = NotFoundError;
OpenAI.ConflictError = ConflictError;
OpenAI.RateLimitError = RateLimitError;
OpenAI.BadRequestError = BadRequestError;
OpenAI.AuthenticationError = AuthenticationError;
OpenAI.InternalServerError = InternalServerError;
OpenAI.PermissionDeniedError = PermissionDeniedError;
OpenAI.UnprocessableEntityError = UnprocessableEntityError;
OpenAI.InvalidWebhookSignatureError = InvalidWebhookSignatureError;
OpenAI.toFile = toFile;
OpenAI.Completions = Completions2;
OpenAI.Chat = Chat;
OpenAI.Embeddings = Embeddings;
OpenAI.Files = Files2;
OpenAI.Images = Images;
OpenAI.Audio = Audio;
OpenAI.Moderations = Moderations;
OpenAI.Models = Models;
OpenAI.FineTuning = FineTuning;
OpenAI.Graders = Graders2;
OpenAI.VectorStores = VectorStores;
OpenAI.Webhooks = Webhooks;
OpenAI.Beta = Beta;
OpenAI.Batches = Batches;
OpenAI.Uploads = Uploads;
OpenAI.Responses = Responses;
OpenAI.Realtime = Realtime2;
OpenAI.Conversations = Conversations;
OpenAI.Evals = Evals;
OpenAI.Containers = Containers;
OpenAI.Skills = Skills;
OpenAI.Videos = Videos;
var EMBEDDING_CONTEXT_LIMITS = {
  // Jina v5
  "jina-embeddings-v5-text-small": 8192,
  "jina-embeddings-v5-text-nano": 8192,
  // OpenAI
  "text-embedding-3-small": 8192,
  "text-embedding-3-large": 8192,
  // Google
  "text-embedding-004": 8192,
  "gemini-embedding-001": 2048,
  // Local/common
  "nomic-embed-text": 8192,
  "all-MiniLM-L6-v2": 512,
  "all-mpnet-base-v2": 512
};
var DEFAULT_CHUNKER_CONFIG = {
  maxChunkSize: 4e3,
  overlapSize: 200,
  minChunkSize: 200,
  semanticSplit: true,
  maxLinesPerChunk: 50
};
var SENTENCE_ENDING = /[.!?。！？]/;
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function countLines(s) {
  return s.split(/\r\n|\n|\r/).length;
}
function findSplitEnd(text, start, maxEnd, minEnd, config) {
  const safeMinEnd = clamp(minEnd, start + 1, maxEnd);
  const safeMaxEnd = clamp(maxEnd, safeMinEnd, text.length);
  if (config.maxLinesPerChunk > 0) {
    const candidate = text.slice(start, safeMaxEnd);
    if (countLines(candidate) > config.maxLinesPerChunk) {
      let breaks = 0;
      for (let i = start; i < safeMaxEnd; i++) {
        const ch = text[i];
        if (ch === "\n") {
          breaks++;
          if (breaks >= config.maxLinesPerChunk) {
            return Math.max(i + 1, safeMinEnd);
          }
        }
      }
    }
  }
  if (config.semanticSplit) {
    for (let i = safeMaxEnd - 1; i >= safeMinEnd; i--) {
      if (SENTENCE_ENDING.test(text[i])) {
        let j = i + 1;
        while (j < safeMaxEnd && /\s/.test(text[j])) j++;
        return j;
      }
    }
    for (let i = safeMaxEnd - 1; i >= safeMinEnd; i--) {
      if (text[i] === "\n") return i + 1;
    }
  }
  for (let i = safeMaxEnd - 1; i >= safeMinEnd; i--) {
    if (/\s/.test(text[i])) return i;
  }
  return safeMaxEnd;
}
function sliceTrimWithIndices(text, start, end) {
  const raw = text.slice(start, end);
  const leading = raw.match(/^\s*/)?.[0]?.length ?? 0;
  const trailing = raw.match(/\s*$/)?.[0]?.length ?? 0;
  const chunk = raw.trim();
  const trimmedStart = start + leading;
  const trimmedEnd = end - trailing;
  return {
    chunk,
    meta: {
      startIndex: trimmedStart,
      endIndex: Math.max(trimmedStart, trimmedEnd),
      length: chunk.length
    }
  };
}
function chunkDocument(text, config = DEFAULT_CHUNKER_CONFIG) {
  if (!text || text.trim().length === 0) {
    return { chunks: [], metadatas: [], totalOriginalLength: 0, chunkCount: 0 };
  }
  const totalOriginalLength = text.length;
  const chunks = [];
  const metadatas = [];
  let pos = 0;
  const maxGuard = Math.max(4, Math.ceil(text.length / Math.max(1, config.maxChunkSize - config.overlapSize)) + 5);
  let guard = 0;
  while (pos < text.length && guard < maxGuard) {
    guard++;
    const remaining = text.length - pos;
    if (remaining <= config.maxChunkSize) {
      const { chunk: chunk2, meta: meta2 } = sliceTrimWithIndices(text, pos, text.length);
      if (chunk2.length > 0) {
        chunks.push(chunk2);
        metadatas.push(meta2);
      }
      break;
    }
    const maxEnd = Math.min(pos + config.maxChunkSize, text.length);
    const minEnd = Math.min(pos + config.minChunkSize, maxEnd);
    const end = findSplitEnd(text, pos, maxEnd, minEnd, config);
    const { chunk, meta } = sliceTrimWithIndices(text, pos, end);
    if (chunk.length < config.minChunkSize) {
      const hardEnd = Math.min(pos + config.maxChunkSize, text.length);
      const hard = sliceTrimWithIndices(text, pos, hardEnd);
      if (hard.chunk.length > 0) {
        chunks.push(hard.chunk);
        metadatas.push(hard.meta);
      }
      if (hardEnd >= text.length) break;
      pos = Math.max(hardEnd - config.overlapSize, pos + 1);
      continue;
    }
    chunks.push(chunk);
    metadatas.push(meta);
    if (end >= text.length) break;
    const nextPos = Math.max(end - config.overlapSize, pos + 1);
    pos = nextPos;
  }
  return {
    chunks,
    metadatas,
    totalOriginalLength,
    chunkCount: chunks.length
  };
}
function smartChunk(text, embedderModel) {
  const limit2 = embedderModel ? EMBEDDING_CONTEXT_LIMITS[embedderModel] : void 0;
  const base = limit2 ?? 8192;
  const config = {
    maxChunkSize: Math.max(1e3, Math.floor(base * 0.7)),
    overlapSize: Math.max(0, Math.floor(base * 0.05)),
    minChunkSize: Math.max(100, Math.floor(base * 0.1)),
    semanticSplit: true,
    maxLinesPerChunk: 50
  };
  return chunkDocument(text, config);
}
init_logger();
var EmbeddingCache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  ttlMs;
  hits = 0;
  misses = 0;
  constructor(maxSize = 256, ttlMinutes = 30) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMinutes * 6e4;
  }
  key(text, task) {
    const hash = createHash2("sha256").update(`${task || ""}:${text}`).digest("hex").slice(0, 24);
    return hash;
  }
  get(text, task) {
    const k = this.key(text, task);
    const entry = this.cache.get(k);
    if (!entry) {
      this.misses++;
      return void 0;
    }
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(k);
      this.misses++;
      return void 0;
    }
    this.cache.delete(k);
    this.cache.set(k, entry);
    this.hits++;
    return entry.vector;
  }
  set(text, task, vector) {
    const k = this.key(text, task);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) this.cache.delete(firstKey);
    }
    this.cache.set(k, { vector, createdAt: Date.now() });
  }
  get size() {
    return this.cache.size;
  }
  get stats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? `${(this.hits / total * 100).toFixed(1)}%` : "N/A"
    };
  }
};
var EMBEDDING_DIMENSIONS = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "text-embedding-004": 768,
  "gemini-embedding-001": 3072,
  "nomic-embed-text": 768,
  "mxbai-embed-large": 1024,
  "BAAI/bge-m3": 1024,
  "all-MiniLM-L6-v2": 384,
  "all-mpnet-base-v2": 512,
  // Jina v5
  "jina-embeddings-v5-text-small": 1024,
  "jina-embeddings-v5-text-nano": 768
};
function resolveEnvVars(value) {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function getErrorStatus(error) {
  if (!error || typeof error !== "object") return void 0;
  const err = error;
  if (typeof err.status === "number") return err.status;
  if (typeof err.statusCode === "number") return err.statusCode;
  if (err.error && typeof err.error === "object") {
    if (typeof err.error.status === "number") return err.error.status;
    if (typeof err.error.statusCode === "number") return err.error.statusCode;
  }
  return void 0;
}
function getErrorCode(error) {
  if (!error || typeof error !== "object") return void 0;
  const err = error;
  if (typeof err.code === "string") return err.code;
  if (err.error && typeof err.error === "object" && typeof err.error.code === "string") {
    return err.error.code;
  }
  return void 0;
}
function getProviderLabel(baseURL, model) {
  const base = baseURL || "";
  if (base) {
    if (/api\.jina\.ai/i.test(base)) return "Jina";
    if (/localhost:11434|127\.0\.0\.1:11434|\/ollama\b/i.test(base)) return "Ollama";
    if (/api\.openai\.com/i.test(base)) return "OpenAI";
    try {
      return new URL(base).host;
    } catch {
      return base;
    }
  }
  if (/^jina-/i.test(model)) return "Jina";
  return "embedding provider";
}
function isAuthError(error) {
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) return true;
  const code = getErrorCode(error);
  if (code && /invalid.*key|auth|forbidden|unauthorized/i.test(code)) return true;
  const msg = getErrorMessage(error);
  return /\b401\b|\b403\b|invalid api key|api key expired|expired api key|forbidden|unauthorized|authentication failed|access denied/i.test(msg);
}
function isNetworkError(error) {
  const code = getErrorCode(error);
  if (code && /ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i.test(code)) {
    return true;
  }
  const msg = getErrorMessage(error);
  return /ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT|fetch failed|network error|socket hang up|connection refused|getaddrinfo/i.test(msg);
}
function formatEmbeddingProviderError(error, opts) {
  const raw = getErrorMessage(error).trim();
  if (raw.startsWith("Embedding provider authentication failed") || raw.startsWith("Embedding provider unreachable") || raw.startsWith("Failed to generate embedding from ") || raw.startsWith("Failed to generate batch embeddings from ")) {
    return raw;
  }
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const provider = getProviderLabel(opts.baseURL, opts.model);
  const detail = raw.length > 0 ? raw : "unknown error";
  const suffix = [status, code].filter(Boolean).join(" ");
  const detailText = suffix ? `${suffix}: ${detail}` : detail;
  const genericPrefix = opts.mode === "batch" ? `Failed to generate batch embeddings from ${provider}: ` : `Failed to generate embedding from ${provider}: `;
  if (isAuthError(error)) {
    let hint = `Check embedding.apiKey and endpoint for ${provider}.`;
    if (provider === "Jina") {
      hint += " If your Jina key expired or lost access, replace the key or switch to a local OpenAI-compatible endpoint such as Ollama (for example baseURL http://127.0.0.1:11434/v1, with a matching model and embedding.dimensions).";
    } else if (provider === "Ollama") {
      hint += " Ollama usually works with a dummy apiKey; verify the local server is running, the model is pulled, and embedding.dimensions matches the model output.";
    }
    return `Embedding provider authentication failed (${detailText}). ${hint}`;
  }
  if (isNetworkError(error)) {
    let hint = `Verify the endpoint is reachable`;
    if (opts.baseURL) {
      hint += ` at ${opts.baseURL}`;
    }
    hint += ` and that model "${opts.model}" is available.`;
    return `Embedding provider unreachable (${detailText}). ${hint}`;
  }
  return `${genericPrefix}${detailText}`;
}
function getVectorDimensions(model, overrideDims) {
  if (overrideDims && overrideDims > 0) {
    return overrideDims;
  }
  const dims = EMBEDDING_DIMENSIONS[model];
  if (!dims) {
    throw new Error(
      `Unsupported embedding model: ${model}. Either add it to EMBEDDING_DIMENSIONS or set embedding.dimensions in config.`
    );
  }
  return dims;
}
var Embedder = class {
  /** Pool of OpenAI clients — one per API key for round-robin rotation. */
  clients;
  /** Round-robin index for client rotation. */
  _clientIndex = 0;
  dimensions;
  _cache;
  _model;
  _baseURL;
  _taskQuery;
  _taskPassage;
  _normalized;
  /** Optional requested dimensions to pass through to the embedding provider (OpenAI-compatible). */
  _requestDimensions;
  /** Enable automatic chunking for long documents (default: true) */
  _autoChunk;
  constructor(config) {
    const apiKeys = Array.isArray(config.apiKey) ? config.apiKey : [config.apiKey];
    const resolvedKeys = apiKeys.map((k) => resolveEnvVars(k));
    this._model = config.model;
    this._baseURL = config.baseURL;
    this._taskQuery = config.taskQuery;
    this._taskPassage = config.taskPassage;
    this._normalized = config.normalized;
    this._requestDimensions = config.dimensions;
    this._autoChunk = config.chunking !== false;
    this.clients = resolvedKeys.map((key) => new OpenAI({
      apiKey: key,
      ...config.baseURL ? { baseURL: config.baseURL } : {}
    }));
    if (this.clients.length > 1) {
      log.info(`Initialized ${this.clients.length} API keys for round-robin rotation`);
    }
    this.dimensions = getVectorDimensions(config.model, config.dimensions);
    this._cache = new EmbeddingCache(256, 30);
  }
  // --------------------------------------------------------------------------
  // Multi-key rotation helpers
  // --------------------------------------------------------------------------
  /** Return the next client in round-robin order. */
  nextClient() {
    const client = this.clients[this._clientIndex % this.clients.length];
    this._clientIndex = (this._clientIndex + 1) % this.clients.length;
    return client;
  }
  /** Check whether an error is a rate-limit / quota-exceeded / overload error. */
  isRateLimitError(error) {
    if (!error || typeof error !== "object") return false;
    const err = error;
    if (err.status === 429 || err.status === 503) return true;
    if (err.code === "rate_limit_exceeded" || err.code === "insufficient_quota") return true;
    const nested = err.error;
    if (nested && typeof nested === "object") {
      if (nested.type === "rate_limit_exceeded" || nested.type === "insufficient_quota") return true;
      if (nested.code === "rate_limit_exceeded" || nested.code === "insufficient_quota") return true;
    }
    const msg = error instanceof Error ? error.message : String(error);
    return /rate.limit|quota|too many requests|insufficient.*credit|429|503.*overload/i.test(msg);
  }
  /**
   * Call embeddings.create with automatic key rotation on rate-limit errors.
   * Tries each key in the pool at most once before giving up.
   */
  // TODO: type payload as OpenAI.EmbeddingCreateParams & extra provider fields; type return as CreateEmbeddingResponse
  async embedWithRetry(payload) {
    const maxAttempts = this.clients.length;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const client = this.nextClient();
      try {
        return await client.embeddings.create(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (this.isRateLimitError(error) && attempt < maxAttempts - 1) {
          log.info(
            `Attempt ${attempt + 1}/${maxAttempts} hit rate limit, rotating to next key...`
          );
          continue;
        }
        if (!this.isRateLimitError(error)) {
          throw error;
        }
      }
    }
    throw new Error(
      `All ${maxAttempts} API keys exhausted (rate limited). Last error: ${lastError?.message || "unknown"}`,
      { cause: lastError }
    );
  }
  /** Number of API keys in the rotation pool. */
  get keyCount() {
    return this.clients.length;
  }
  // --------------------------------------------------------------------------
  // Backward-compatible API
  // --------------------------------------------------------------------------
  /**
   * Backward-compatible embedding API.
   *
   * Historically the plugin used a single `embed()` method for both query and
   * passage embeddings. With task-aware providers we treat this as passage.
   */
  async embed(text) {
    return this.embedPassage(text);
  }
  /** Backward-compatible batch embedding API (treated as passage). */
  async embedBatch(texts) {
    return this.embedBatchPassage(texts);
  }
  // --------------------------------------------------------------------------
  // Task-aware API
  // --------------------------------------------------------------------------
  async embedQuery(text) {
    return this.embedSingle(text, this._taskQuery);
  }
  async embedPassage(text) {
    return this.embedSingle(text, this._taskPassage);
  }
  async embedBatchQuery(texts) {
    return this.embedMany(texts, this._taskQuery);
  }
  async embedBatchPassage(texts) {
    return this.embedMany(texts, this._taskPassage);
  }
  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------
  validateEmbedding(embedding) {
    if (!Array.isArray(embedding)) {
      throw new Error(`Embedding is not an array (got ${typeof embedding})`);
    }
    if (embedding.length !== this.dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`
      );
    }
  }
  // TODO: type return as OpenAI.EmbeddingCreateParams & provider-specific fields
  buildPayload(input, task) {
    const payload = {
      model: this.model,
      input
    };
    const isVoyage = this._baseURL?.includes("voyageai.com");
    if (!isVoyage) {
      payload.encoding_format = "float";
    }
    if (task && isVoyage) {
      if (task.includes("query")) payload.input_type = "query";
      else if (task.includes("passage") || task.includes("document")) payload.input_type = "document";
      else payload.input_type = task;
    } else if (task) {
      payload.task = task;
    }
    if (this._normalized !== void 0) payload.normalized = this._normalized;
    if (this._requestDimensions && this._requestDimensions > 0 && !isVoyage) {
      payload.dimensions = this._requestDimensions;
    }
    return payload;
  }
  async embedSingle(text, task) {
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot embed empty text");
    }
    const cached2 = this._cache.get(text, task);
    if (cached2) return cached2;
    try {
      const response = await this.embedWithRetry(this.buildPayload(text, task));
      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error("No embedding returned from provider");
      }
      this.validateEmbedding(embedding);
      this._cache.set(text, task, embedding);
      return embedding;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isContextError = /context|too long|exceed|length/i.test(errorMsg);
      if (isContextError && this._autoChunk) {
        try {
          log.info(`Document exceeded context limit (${errorMsg}), attempting chunking...`);
          const chunkResult = smartChunk(text, this._model);
          if (chunkResult.chunks.length === 0) {
            throw new Error(`Failed to chunk document: ${errorMsg}`);
          }
          log.info(`Split document into ${chunkResult.chunkCount} chunks for embedding`);
          const chunkEmbeddings = await Promise.all(
            chunkResult.chunks.map(async (chunk, idx) => {
              try {
                const embedding = await this.embedSingle(chunk, task);
                return { embedding };
              } catch (chunkError) {
                log.warn(`Failed to embed chunk ${idx}:`, chunkError);
                throw chunkError;
              }
            })
          );
          const avgEmbedding = chunkEmbeddings.reduce(
            (sum, { embedding }) => {
              for (let i = 0; i < embedding.length; i++) {
                sum[i] += embedding[i];
              }
              return sum;
            },
            new Array(this.dimensions).fill(0)
          );
          const finalEmbedding = avgEmbedding.map((v) => v / chunkEmbeddings.length);
          this._cache.set(text, task, finalEmbedding);
          log.info(`Successfully embedded long document as ${chunkEmbeddings.length} averaged chunks`);
          return finalEmbedding;
        } catch (chunkError) {
          log.warn(`Chunking failed, using original error:`, chunkError);
          const friendly2 = formatEmbeddingProviderError(error, {
            baseURL: this._baseURL,
            model: this._model,
            mode: "single"
          });
          throw new Error(friendly2, { cause: error });
        }
      }
      const friendly = formatEmbeddingProviderError(error, {
        baseURL: this._baseURL,
        model: this._model,
        mode: "single"
      });
      throw new Error(friendly, { cause: error instanceof Error ? error : void 0 });
    }
  }
  async embedMany(texts, task) {
    if (!texts || texts.length === 0) {
      return [];
    }
    const validTexts = [];
    const validIndices = [];
    texts.forEach((text, index) => {
      if (text && text.trim().length > 0) {
        validTexts.push(text);
        validIndices.push(index);
      }
    });
    if (validTexts.length === 0) {
      return texts.map(() => []);
    }
    try {
      const response = await this.embedWithRetry(
        this.buildPayload(validTexts, task)
      );
      const results = new Array(texts.length);
      response.data.forEach((item, idx) => {
        const originalIndex = validIndices[idx];
        const embedding = item.embedding;
        this.validateEmbedding(embedding);
        results[originalIndex] = embedding;
      });
      for (let i = 0; i < texts.length; i++) {
        if (!results[i]) {
          results[i] = [];
        }
      }
      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isContextError = /context|too long|exceed|length/i.test(errorMsg);
      if (isContextError && this._autoChunk) {
        try {
          log.info(`Batch embedding failed with context error, attempting chunking...`);
          const chunkResults = await Promise.all(
            validTexts.map(async (text, idx) => {
              const chunkResult = smartChunk(text, this._model);
              if (chunkResult.chunks.length === 0) {
                throw new Error("Chunker produced no chunks");
              }
              const embeddings = await Promise.all(
                chunkResult.chunks.map((chunk) => this.embedSingle(chunk, task))
              );
              const avgEmbedding = embeddings.reduce(
                (sum, emb) => {
                  for (let i = 0; i < emb.length; i++) {
                    sum[i] += emb[i];
                  }
                  return sum;
                },
                new Array(this.dimensions).fill(0)
              );
              const finalEmbedding = avgEmbedding.map((v) => v / embeddings.length);
              this._cache.set(text, task, finalEmbedding);
              return { embedding: finalEmbedding, index: validIndices[idx] };
            })
          );
          log.info(`Successfully chunked and embedded ${chunkResults.length} long documents`);
          const results = new Array(texts.length);
          chunkResults.forEach(({ embedding, index }) => {
            if (embedding.length > 0) {
              this.validateEmbedding(embedding);
              results[index] = embedding;
            } else {
              results[index] = [];
            }
          });
          for (let i = 0; i < texts.length; i++) {
            if (!results[i]) {
              results[i] = [];
            }
          }
          return results;
        } catch (chunkError) {
          const friendly2 = formatEmbeddingProviderError(error, {
            baseURL: this._baseURL,
            model: this._model,
            mode: "batch"
          });
          throw new Error(`Failed to embed documents after chunking attempt: ${friendly2}`, {
            cause: error instanceof Error ? error : void 0
          });
        }
      }
      const friendly = formatEmbeddingProviderError(error, {
        baseURL: this._baseURL,
        model: this._model,
        mode: "batch"
      });
      throw new Error(friendly, {
        cause: error instanceof Error ? error : void 0
      });
    }
  }
  get model() {
    return this._model;
  }
  // Test connection and validate configuration
  async test() {
    try {
      const testEmbedding = await this.embedPassage("test");
      return {
        success: true,
        dimensions: testEmbedding.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  get cacheStats() {
    return {
      ...this._cache.stats,
      keyCount: this.clients.length
    };
  }
};
init_noise_filter();
init_smart_metadata();
var STATE_PATH = join4(homedir4(), ".openclaw", "memory", "resonance-state.json");
var WINDOW_SIZE = 100;
var COLD_START_MIN = 20;
var DEFAULT_THRESHOLD = 0.45;
var THRESHOLD_FLOOR = 0.3;
var THRESHOLD_CEILING = 0.6;
var cached = null;
function loadState() {
  if (cached) return cached;
  try {
    const raw = readFileSync2(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.scores)) {
      cached = { scores: parsed.scores.filter((s) => typeof s === "number" && Number.isFinite(s)).slice(-WINDOW_SIZE) };
      return cached;
    }
  } catch {
  }
  cached = { scores: [] };
  return cached;
}
function saveState(state) {
  try {
    mkdirSync2(dirname2(STATE_PATH), { recursive: true });
    writeFileSync2(STATE_PATH, JSON.stringify(state), "utf8");
  } catch {
  }
}
function getAdaptiveThreshold() {
  const state = loadState();
  if (state.scores.length < COLD_START_MIN) {
    return DEFAULT_THRESHOLD;
  }
  const sorted = [...state.scores].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.25);
  const p25 = sorted[idx];
  return Math.min(THRESHOLD_CEILING, Math.max(THRESHOLD_FLOOR, p25));
}
function recordResonanceScore(score) {
  if (!Number.isFinite(score)) return;
  const state = loadState();
  state.scores.push(score);
  if (state.scores.length > WINDOW_SIZE) {
    state.scores = state.scores.slice(-WINDOW_SIZE);
  }
  cached = state;
  saveState(state);
}
init_logger();
var _parseAccessMetadata = null;
var _computeEffectiveHalfLife = null;
var _recordQuery = null;
if (requirePro("access-tracking")) {
  Promise.resolve().then(() => (init_access_tracker(), access_tracker_exports)).then((mod) => {
    _parseAccessMetadata = mod.parseAccessMetadata;
    _computeEffectiveHalfLife = mod.computeEffectiveHalfLife;
  }).catch(() => {
  });
}
if (requirePro("query-tracking")) {
  Promise.resolve().then(() => (init_query_tracker(), query_tracker_exports)).then((mod) => {
    _recordQuery = mod.recordQuery;
  }).catch(() => {
  });
}
function parseAccessMetadata2(m) {
  if (_parseAccessMetadata) return _parseAccessMetadata(m);
  return { accessCount: 0, lastAccessedAt: 0 };
}
function computeEffectiveHalfLife2(hl, _ac, _la, _rf, _mx) {
  if (_computeEffectiveHalfLife) return _computeEffectiveHalfLife(hl, _ac, _la, _rf, _mx);
  return hl;
}
function recordQuery2(data) {
  _recordQuery?.(data);
}
function getGraphitiConfig() {
  return {
    enabled: process.env.GRAPHITI_ENABLED === "true",
    baseUrl: process.env.GRAPHITI_BASE_URL || "http://127.0.0.1:18799",
    timeoutMs: 3e3
  };
}
async function graphitiSpreadSearch(query, groupId = "default", searchLimit = 3, spreadLimit = 3) {
  const cfg = getGraphitiConfig();
  if (!cfg.enabled) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
    const resp = await fetch(`${cfg.baseUrl}/spread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        group_id: groupId,
        search_limit: searchLimit,
        spread_depth: 1,
        spread_limit: spreadLimit
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok) return [];
    const facts = await resp.json();
    if (!Array.isArray(facts) || facts.length === 0) return [];
    const seen = /* @__PURE__ */ new Set();
    const results = [];
    for (let i = 0; i < facts.length; i++) {
      const f = facts[i];
      const factText = f.fact?.trim();
      if (!factText || factText.length < 5 || seen.has(factText)) continue;
      seen.add(factText);
      const nodes = [f.source_node, f.target_node, f.from_node, f.to_node].filter(Boolean).join(" \u2192 ");
      const text = nodes ? `[\u56FE\u8C31] ${factText} (${nodes})` : `[\u56FE\u8C31] ${factText}`;
      const baseScore = f.source === "search" ? 0.75 : 0.45;
      const degreeBoost = f.degree ? Math.min(0.15, Math.log1p(f.degree) * 0.02) : 0;
      results.push({
        entry: {
          id: `graphiti-${i}-${Date.now()}`,
          text,
          category: "entity",
          importance: 0.8,
          timestamp: f.created_at ? new Date(f.created_at).getTime() : Date.now(),
          scope: "global"
        },
        score: Math.min(1, baseScore + degreeBoost),
        rank: i + 1
      });
    }
    return results;
  } catch {
    return [];
  }
}
var DEFAULT_RETRIEVAL_CONFIG = {
  mode: "hybrid",
  vectorWeight: 0.7,
  bm25Weight: 0.3,
  minScore: 0.3,
  rerank: "cross-encoder",
  candidatePoolSize: 20,
  recencyHalfLifeDays: 14,
  recencyWeight: 0.1,
  filterNoise: true,
  rerankModel: "jina-reranker-v3",
  rerankEndpoint: "https://api.jina.ai/v1/rerank",
  lengthNormAnchor: 500,
  hardMinScore: 0.35,
  timeDecayHalfLifeDays: 60,
  reinforcementFactor: 0.5,
  maxHalfLifeMultiplier: 3,
  multiHopRouting: true
};
function clampInt2(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
function clamp012(value, fallback) {
  if (!Number.isFinite(value)) return Number.isFinite(fallback) ? fallback : 0;
  return Math.min(1, Math.max(0, value));
}
function clamp01WithFloor(value, floor) {
  const safeFloor = clamp012(floor, 0);
  return Math.max(safeFloor, clamp012(value, safeFloor));
}
function buildRerankRequest(provider, apiKey, model, query, documents, topN) {
  switch (provider) {
    case "pinecone":
      return {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "X-Pinecone-API-Version": "2024-10"
        },
        body: {
          model,
          query,
          documents: documents.map((text) => ({ text })),
          top_n: topN,
          rank_fields: ["text"]
        }
      };
    case "voyage":
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: {
          model,
          query,
          documents,
          // Voyage uses top_k (not top_n) to limit reranked outputs.
          top_k: topN
        }
      };
    case "ollama":
      return {
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          model,
          query,
          documents,
          top_n: topN
        }
      };
    case "siliconflow":
    case "jina":
    default:
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: {
          model,
          query,
          documents,
          top_n: topN
        }
      };
  }
}
function parseRerankResponse(provider, data) {
  const parseItems = (items, scoreKeys) => {
    if (!Array.isArray(items)) return null;
    const parsed = [];
    for (const raw of items) {
      const index = typeof raw?.index === "number" ? raw.index : Number(raw?.index);
      if (!Number.isFinite(index)) continue;
      let score = null;
      for (const key of scoreKeys) {
        const value = raw?.[key];
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) {
          score = n;
          break;
        }
      }
      if (score === null) continue;
      parsed.push({ index, score });
    }
    return parsed.length > 0 ? parsed : null;
  };
  switch (provider) {
    case "ollama": {
      return parseItems(data.results, ["relevance_score", "score"]) ?? parseItems(data.data, ["relevance_score", "score"]);
    }
    case "pinecone": {
      return parseItems(data.data, ["score", "relevance_score"]) ?? parseItems(data.results, ["score", "relevance_score"]);
    }
    case "voyage": {
      return parseItems(data.data, ["relevance_score", "score"]) ?? parseItems(data.results, ["relevance_score", "score"]);
    }
    case "siliconflow":
    case "jina":
    default: {
      return parseItems(data.results, ["relevance_score", "score"]) ?? parseItems(data.data, ["relevance_score", "score"]);
    }
  }
}
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vector dimensions must match for cosine similarity");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const norm = Math.sqrt(normA) * Math.sqrt(normB);
  return norm === 0 ? 0 : dotProduct / norm;
}
var RETRIEVAL_LOG_PATH = join6(homedir6(), ".openclaw", "memory", "retrieval-log.jsonl");
var MemoryRetriever = class {
  constructor(store, embedder, config = DEFAULT_RETRIEVAL_CONFIG, decayEngine = null) {
    this.store = store;
    this.embedder = embedder;
    this.config = config;
    this.decayEngine = decayEngine;
  }
  accessTracker = null;
  tierManager = null;
  setAccessTracker(tracker) {
    this.accessTracker = tracker;
  }
  /**
   * Resonance check: fast vector probe to see if the query "resonates"
   * with any high-salience memories. Returns true if at least one memory
   * has cosine similarity above threshold. This mimics human associative
   * memory — most inputs don't trigger recall, only resonant ones do.
   */
  async resonanceCheck(query, scopeFilter) {
    try {
      const queryVector = await this.embedder.embedQuery(query);
      const threshold = getAdaptiveThreshold();
      const probeResults = await this.store.vectorSearch(
        queryVector,
        3,
        threshold,
        scopeFilter
      );
      if (probeResults.length === 0) return { resonates: false, topScore: 0 };
      const topScore = Math.max(...probeResults.map((r) => r.score));
      recordResonanceScore(topScore);
      for (const r of probeResults) {
        const importance = r.entry.importance ?? 0.5;
        const similarity = r.score;
        if (similarity >= 0.55 || similarity >= threshold && importance >= 0.7) {
          return { resonates: true, topScore };
        }
      }
      return { resonates: false, topScore };
    } catch {
      return { resonates: true, topScore: 0 };
    }
  }
  /**
   * Strip metadata blocks from auto-recall queries.
   * OpenClaw core may pass the full message including Conversation info,
   * Replied message, and Sender metadata JSON blocks. We only want the
   * actual user text for semantic search.
   */
  cleanAutoRecallQuery(raw) {
    let cleaned = raw.replace(/```json[\s\S]*?```/g, "");
    cleaned = cleaned.replace(/Conversation info \(untrusted metadata\):/g, "");
    cleaned = cleaned.replace(/Sender \(untrusted metadata\):/g, "");
    cleaned = cleaned.replace(/Replied message \(untrusted, for context\):/g, "");
    cleaned = cleaned.replace(/\[Queued messages[^\]]*\]/g, "");
    cleaned = cleaned.replace(/---\s*\nQueued #\d+/g, "");
    cleaned = cleaned.replace(/\n{3,}/g, "\n").trim();
    return cleaned.length > 2 ? cleaned : raw;
  }
  /**
   * Expand date expressions in query to multiple formats for BM25 matching.
   * "3月17日" → "3月17日 3/17 03-17 2026-03-17"
   * "2026年3月17日" → "2026年3月17日 3/17 2026-03-17 03-17"
   * "昨天/前天/上周" → resolved to absolute dates
   */
  expandDateFormats(query) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    let expanded = query;
    expanded = expanded.replace(/(\d{1,2})月(\d{1,2})[日号]/g, (match, m, d) => {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${match} ${m}/${d} ${year}-${mm}-${dd} ${mm}-${dd}`;
    });
    expanded = expanded.replace(/(\d{4})年(\d{1,2})月(\d{1,2})[日号]/g, (match, y, m, d) => {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${match} ${m}/${d} ${y}-${mm}-${dd} ${mm}-${dd}`;
    });
    const relMap = {
      "\u4ECA\u5929": 0,
      "\u6628\u5929": -1,
      "\u524D\u5929": -2,
      "\u5927\u524D\u5929": -3
    };
    for (const [word, offset] of Object.entries(relMap)) {
      if (expanded.includes(word)) {
        const d = new Date(now.getTime() + offset * 864e5);
        const iso = d.toISOString().slice(0, 10);
        const m = d.getMonth() + 1;
        const day = d.getDate();
        expanded = expanded.replace(word, `${word} ${iso} ${m}/${day} ${m}\u6708${day}\u65E5`);
      }
    }
    return expanded;
  }
  async retrieve(context) {
    let { query, limit: limit2, scopeFilter, category, source } = context;
    if (source === "auto-recall") {
      query = this.cleanAutoRecallQuery(query);
    }
    const safeLimit = clampInt2(limit2, 1, 20);
    const t0 = performance.now();
    let resonanceTriggered = false;
    let resonanceTopScore = 0;
    if (source === "auto-recall") {
      const { resonates, topScore: probeTopScore } = await this.resonanceCheck(query, scopeFilter);
      resonanceTriggered = resonates;
      resonanceTopScore = probeTopScore;
      if (!resonates) {
        const trackEntry2 = JSON.stringify({
          ts: (/* @__PURE__ */ new Date()).toISOString(),
          query: query.substring(0, 200),
          source: source || "manual",
          queryType: "gated-out",
          resonanceScore: resonanceTopScore,
          resonanceTriggered: false,
          lancedbCount: 0,
          graphitiCount: 0,
          rerankCount: 0,
          finalCount: 0,
          totalLatencyMs: Math.round(performance.now() - t0),
          lancedbLatencyMs: 0,
          graphitiLatencyMs: 0,
          rerankLatencyMs: 0
        }) + "\n";
        appendFile4(RETRIEVAL_LOG_PATH, trackEntry2).catch(() => {
        });
        recordQuery2({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          query: query.substring(0, 200),
          source: source === "auto-recall" ? "auto" : source || "manual",
          hitCount: 0,
          topScore: resonanceTopScore,
          latency_ms: Math.round(performance.now() - t0),
          queryType: "gated-out",
          resonancePass: false
        });
        return [];
      }
    }
    const isMultiHop = this.config.multiHopRouting && this.isMultiHopQuery(query);
    const tLance0 = performance.now();
    const lanceDbPromise = (async () => {
      if (this.config.mode === "vector" || !this.store.hasFtsSupport) {
        return this.vectorOnlyRetrieval(query, safeLimit, scopeFilter, category);
      } else {
        return this.hybridRetrieval(query, safeLimit, scopeFilter, category);
      }
    })();
    const tGraphiti0 = performance.now();
    const graphitiPromise = (async () => {
      if (process.env.GRAPHITI_ENABLED !== "true") return [];
      try {
        const graphitiBase = process.env.GRAPHITI_BASE_URL || "http://127.0.0.1:18799";
        const scope = scopeFilter?.[0] || "default";
        const groupId = scope.startsWith("agent:") ? scope.split(":")[1] || "default" : "default";
        const useSpread = source === "auto-recall" && !isMultiHop;
        const endpoint = useSpread ? "/spread" : "/search";
        const body = useSpread ? { query, group_id: groupId, search_limit: 3, spread_depth: 1, spread_limit: 3 } : { query, group_id: groupId, limit: Math.min(safeLimit, 5) };
        const resp = await fetch(`${graphitiBase}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5e3)
        });
        if (!resp.ok) return [];
        const facts = await resp.json();
        return facts.filter((f) => f.fact && !f.expired_at).map((f, i) => {
          const isSpread = f.source === "spread";
          const degreeBoost = f.degree ? Math.min(0.15, Math.log1p(f.degree) * 0.03) : 0;
          const baseScore = isSpread ? 0.45 : 0.65;
          return {
            entry: {
              id: `graphiti-${Date.now()}-${i}`,
              text: f.fact,
              vector: [],
              category: "fact",
              scope,
              importance: 0.7,
              timestamp: f.valid_at ? new Date(f.valid_at).getTime() : Date.now(),
              metadata: JSON.stringify({ source: isSpread ? "graphiti-spread" : "graphiti", valid_at: f.valid_at, degree: f.degree })
            },
            score: baseScore + 0.01 * (facts.length - i) + degreeBoost,
            sources: { graphiti: { rank: i + 1 } }
          };
        });
      } catch {
        return [];
      }
    })();
    const [lanceResults, graphitiResults] = await Promise.all([lanceDbPromise, graphitiPromise]);
    const tLanceMs = Math.round(performance.now() - tLance0);
    const tGraphitiMs = Math.round(performance.now() - tGraphiti0);
    const lanceTexts = new Set(lanceResults.map((r) => r.entry.text.slice(0, 80)));
    const uniqueGraphiti = graphitiResults.filter(
      (r) => !lanceTexts.has(r.entry.text.slice(0, 80))
    );
    let merged;
    let rerankCount = 0;
    const tRerank0 = performance.now();
    const combined = [...lanceResults, ...uniqueGraphiti];
    const isOllamaRerank = this.config.rerankProvider === "ollama";
    if (this.config.rerank !== "none" && (this.config.rerankApiKey || isOllamaRerank) && combined.length > 0) {
      const queryVector = await this.embedder.embedQuery(query);
      merged = await this.rerankResults(query, queryVector, combined);
      rerankCount = merged.length;
      merged = merged.slice(0, safeLimit);
    } else {
      merged = combined.slice(0, safeLimit);
    }
    const tRerankMs = Math.round(performance.now() - tRerank0);
    if (this.accessTracker && source === "manual" && merged.length > 0) {
      this.accessTracker.recordAccess(
        merged.filter((r) => !r.entry.id.startsWith("graphiti-")).map((r) => r.entry.id)
      );
    }
    const topScore = merged.length > 0 ? Math.max(...merged.map((r) => r.score)) : 0;
    const trackEntry = JSON.stringify({
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      query: query.substring(0, 200),
      source: source || "manual",
      queryType: isMultiHop ? "multi-hop" : "single",
      resonanceScore: topScore,
      resonanceTriggered,
      lancedbCount: lanceResults.length,
      graphitiCount: graphitiResults.length,
      rerankCount,
      finalCount: merged.length,
      totalLatencyMs: Math.round(performance.now() - t0),
      lancedbLatencyMs: tLanceMs,
      graphitiLatencyMs: tGraphitiMs,
      rerankLatencyMs: tRerankMs
    }) + "\n";
    appendFile4(RETRIEVAL_LOG_PATH, trackEntry).catch(() => {
    });
    recordQuery2({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      query: query.substring(0, 200),
      source: source === "auto-recall" ? "auto" : source || "manual",
      hitCount: merged.length,
      topScore,
      latency_ms: Math.round(performance.now() - t0),
      queryType: isMultiHop ? "multi-hop" : "single",
      resonancePass: true
    });
    return merged;
  }
  async vectorOnlyRetrieval(query, limit2, scopeFilter, category) {
    const queryVector = await this.embedder.embedQuery(query);
    const results = await this.store.vectorSearch(
      queryVector,
      limit2,
      this.config.minScore,
      scopeFilter
    );
    const filtered = category ? results.filter((r) => r.entry.category === category) : results;
    const mapped = filtered.map(
      (result, index) => ({
        ...result,
        sources: {
          vector: { score: result.score, rank: index + 1 }
        }
      })
    );
    const weighted = this.decayEngine ? mapped : this.applyImportanceWeight(this.applyRecencyBoost(mapped));
    const lengthNormalized = this.applyLengthNormalization(weighted);
    const hardFiltered = lengthNormalized.filter((r) => r.score >= this.config.hardMinScore);
    const lifecycleRanked = this.decayEngine ? this.applyDecayBoost(hardFiltered) : this.applyTimeDecay(hardFiltered);
    const denoised = this.config.filterNoise ? filterNoise(lifecycleRanked, (r) => r.entry.text) : lifecycleRanked;
    const deduplicated = this.applyMMRDiversity(denoised);
    return deduplicated.slice(0, limit2);
  }
  async hybridRetrieval(query, limit2, scopeFilter, category) {
    const candidatePoolSize = Math.max(
      this.config.candidatePoolSize,
      limit2 * 2
    );
    const queryVector = await this.embedder.embedQuery(query);
    const [vectorResults, bm25Results, graphitiResults] = await Promise.all([
      this.runVectorSearch(
        queryVector,
        candidatePoolSize,
        scopeFilter,
        category
      ),
      this.runBM25Search(query, candidatePoolSize, scopeFilter, category),
      graphitiSpreadSearch(query, "default", 3, 3)
    ]);
    const fusedResults = await this.fuseResults(vectorResults, bm25Results, graphitiResults);
    const filtered = fusedResults.filter(
      (r) => r.score >= this.config.minScore
    );
    const reranked = this.config.rerank !== "none" ? await this.rerankResults(
      query,
      queryVector,
      filtered.slice(0, limit2 * 2)
    ) : filtered;
    const temporallyRanked = this.decayEngine ? reranked : this.applyImportanceWeight(this.applyRecencyBoost(reranked));
    const lengthNormalized = this.applyLengthNormalization(temporallyRanked);
    const hardFiltered = lengthNormalized.filter((r) => r.score >= this.config.hardMinScore);
    const lifecycleRanked = this.decayEngine ? this.applyDecayBoost(hardFiltered) : this.applyTimeDecay(hardFiltered);
    const denoised = this.config.filterNoise ? filterNoise(lifecycleRanked, (r) => r.entry.text) : lifecycleRanked;
    const deduplicated = this.applyMMRDiversity(denoised);
    return deduplicated.slice(0, limit2);
  }
  async runVectorSearch(queryVector, limit2, scopeFilter, category) {
    const results = await this.store.vectorSearch(
      queryVector,
      limit2,
      0.1,
      scopeFilter
    );
    const filtered = category ? results.filter((r) => r.entry.category === category) : results;
    return filtered.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }
  async runBM25Search(query, limit2, scopeFilter, category) {
    const expandedQuery = this.expandDateFormats(query);
    const results = await this.store.bm25Search(expandedQuery, limit2, scopeFilter);
    const filtered = category ? results.filter((r) => r.entry.category === category) : results;
    return filtered.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }
  async fuseResults(vectorResults, bm25Results, graphitiResults = []) {
    const vectorMap = /* @__PURE__ */ new Map();
    const bm25Map = /* @__PURE__ */ new Map();
    vectorResults.forEach((result) => {
      vectorMap.set(result.entry.id, result);
    });
    bm25Results.forEach((result) => {
      bm25Map.set(result.entry.id, result);
    });
    const allIds = /* @__PURE__ */ new Set([...vectorMap.keys(), ...bm25Map.keys()]);
    const fusedResults = [];
    for (const id of allIds) {
      const vectorResult = vectorMap.get(id);
      const bm25Result = bm25Map.get(id);
      if (!vectorResult && bm25Result) {
        try {
          const exists = await this.store.hasId(id);
          if (!exists) continue;
        } catch {
        }
      }
      const baseResult = vectorResult || bm25Result;
      const vectorScore = vectorResult ? vectorResult.score : 0;
      const bm25Score = bm25Result ? bm25Result.score : 0;
      const weightedFusion = vectorScore * this.config.vectorWeight + bm25Score * this.config.bm25Weight;
      const fusedScore = vectorResult ? clamp012(
        Math.max(
          weightedFusion,
          bm25Score >= 0.75 ? bm25Score * 0.92 : 0
        ),
        0.1
      ) : clamp012(bm25Result.score, 0.1);
      fusedResults.push({
        entry: baseResult.entry,
        score: fusedScore,
        sources: {
          vector: vectorResult ? { score: vectorResult.score, rank: vectorResult.rank } : void 0,
          bm25: bm25Result ? { score: bm25Result.score, rank: bm25Result.rank } : void 0,
          fused: { score: fusedScore }
        }
      });
    }
    for (const gr of graphitiResults) {
      fusedResults.push({
        entry: gr.entry,
        score: gr.score * 0.85,
        sources: {
          graphiti: { score: gr.score, rank: gr.rank },
          fused: { score: gr.score * 0.85 }
        }
      });
    }
    return fusedResults.sort((a, b) => b.score - a.score);
  }
  /**
   * Rerank results using cross-encoder API (Jina, Pinecone, or compatible).
   * Falls back to cosine similarity if API is unavailable or fails.
   */
  async rerankResults(query, queryVector, results) {
    if (results.length === 0) {
      return results;
    }
    if (process.env.MNEMO_DEBUG) {
      log.debug(`[rerank] rerank=${this.config.rerank}, provider=${this.config.rerankProvider}, model=${this.config.rerankModel}`);
    }
    const isLocalRerank = this.config.rerankProvider === "ollama";
    if (this.config.rerank === "cross-encoder" && (this.config.rerankApiKey || isLocalRerank)) {
      try {
        const provider = this.config.rerankProvider || "jina";
        const model = this.config.rerankModel || (isLocalRerank ? "bge-reranker-v2-m3" : "jina-reranker-v3");
        const endpoint = this.config.rerankEndpoint || (isLocalRerank ? "http://127.0.0.1:11434/api/rerank" : "https://api.jina.ai/v1/rerank");
        const documents = results.map((r) => r.entry.text);
        const { headers, body } = buildRerankRequest(
          provider,
          this.config.rerankApiKey,
          model,
          query,
          documents,
          results.length
        );
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          const parsed = parseRerankResponse(provider, data);
          if (!parsed) {
            log.warn(
              "Rerank API: invalid response shape, falling back to cosine"
            );
          } else {
            const returnedIndices = new Set(parsed.map((r) => r.index));
            const reranked = parsed.filter((item) => item.index >= 0 && item.index < results.length).map((item) => {
              const original = results[item.index];
              const floor = this.getRerankPreservationFloor(original, false);
              const blendedScore = clamp01WithFloor(
                item.score * 0.6 + original.score * 0.4,
                floor
              );
              return {
                ...original,
                score: blendedScore,
                sources: {
                  ...original.sources,
                  reranked: { score: item.score }
                }
              };
            });
            const unreturned = results.filter((_, idx) => !returnedIndices.has(idx)).map((r) => ({
              ...r,
              score: clamp01WithFloor(
                r.score * 0.8,
                this.getRerankPreservationFloor(r, true)
              )
            }));
            return [...reranked, ...unreturned].sort(
              (a, b) => b.score - a.score
            );
          }
        } else {
          const errText = await response.text().catch(() => "");
          log.warn(
            `Rerank API returned ${response.status}: ${errText.slice(0, 200)}, falling back to cosine`
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          log.warn("Rerank API timed out (5s), falling back to cosine");
        } else {
          log.warn("Rerank API failed, falling back to cosine:", error);
        }
      }
    }
    try {
      const reranked = results.map((result) => {
        const cosineScore = cosineSimilarity(queryVector, result.entry.vector);
        const combinedScore = result.score * 0.7 + cosineScore * 0.3;
        return {
          ...result,
          score: clamp012(combinedScore, result.score),
          sources: {
            ...result.sources,
            reranked: { score: cosineScore }
          }
        };
      });
      return reranked.sort((a, b) => b.score - a.score);
    } catch (error) {
      log.warn("Reranking failed, returning original results:", error);
      return results;
    }
  }
  getRerankPreservationFloor(result, unreturned) {
    const bm25Score = result.sources.bm25?.score ?? 0;
    if (bm25Score >= 0.75) {
      return result.score * (unreturned ? 1 : 0.95);
    }
    if (bm25Score >= 0.6) {
      return result.score * (unreturned ? 0.95 : 0.9);
    }
    return result.score * (unreturned ? 0.8 : 0.5);
  }
  /**
   * Apply recency boost: newer memories get a small score bonus.
   * This ensures corrections/updates naturally outrank older entries
   * when semantic similarity is close.
   * Formula: boost = exp(-ageDays / halfLife) * weight
   */
  applyRecencyBoost(results) {
    const { recencyHalfLifeDays, recencyWeight } = this.config;
    if (!recencyHalfLifeDays || recencyHalfLifeDays <= 0 || !recencyWeight) {
      return results;
    }
    const now = Date.now();
    const boosted = results.map((r) => {
      const ts = r.entry.timestamp && r.entry.timestamp > 0 ? r.entry.timestamp : now;
      const ageDays = (now - ts) / 864e5;
      const boost = Math.exp(-ageDays / recencyHalfLifeDays) * recencyWeight;
      return {
        ...r,
        score: clamp012(r.score + boost, r.score)
      };
    });
    return boosted.sort((a, b) => b.score - a.score);
  }
  /**
   * Apply importance weighting: memories with higher importance get a score boost.
   * This ensures critical memories (importance=1.0) outrank casual ones (importance=0.5)
   * when semantic similarity is close.
   * Formula: score *= (baseWeight + (1 - baseWeight) * importance)
   * With baseWeight=0.7: importance=1.0 → ×1.0, importance=0.5 → ×0.85, importance=0.0 → ×0.7
   */
  applyImportanceWeight(results) {
    const baseWeight = 0.7;
    const weighted = results.map((r) => {
      const importance = r.entry.importance ?? 0.7;
      const factor = baseWeight + (1 - baseWeight) * importance;
      return {
        ...r,
        score: clamp012(r.score * factor, r.score * baseWeight)
      };
    });
    return weighted.sort((a, b) => b.score - a.score);
  }
  applyDecayBoost(results) {
    if (!this.decayEngine || results.length === 0) return results;
    const scored = results.map((result) => ({
      memory: toLifecycleMemory(result.entry.id, result.entry),
      score: result.score
    }));
    this.decayEngine.applySearchBoost(scored);
    const reranked = results.map((result, index) => ({
      ...result,
      score: clamp012(scored[index].score, result.score * 0.3)
    }));
    return reranked.sort((a, b) => b.score - a.score);
  }
  /**
   * Detect multi-hop queries that involve multiple entities or relationships.
   * Multi-hop queries benefit from LanceDB secondary retrieval rather than
   * Graphiti spread (which follows single-entity neighborhoods).
   */
  isMultiHopQuery(query) {
    const capitalizedWords = new Set(
      query.match(/\b[A-Z\u4e00-\u9fff][a-zA-Z\u4e00-\u9fff]{1,}/g) || []
    );
    if (capitalizedWords.size >= 2) return true;
    const relationPatterns = [
      /和.{1,20}的关系/,
      /compared\s+to/i,
      /difference\s+between/i,
      /为什么/,
      /how\s+does\s+.{1,30}\s+relate\s+to/i,
      /between\s+.{1,30}\s+and\s+/i,
      /相比/,
      /区别/,
      /之间/
    ];
    for (const pat of relationPatterns) {
      if (pat.test(query)) return true;
    }
    if (query.length > 100 && /[?？]/.test(query)) return true;
    return false;
  }
  /**
   * via sheer keyword density and broad semantic coverage.
   * Short, focused entries (< anchor) get a slight boost.
   * Long, sprawling entries (> anchor) get penalized.
   * Formula: score *= 1 / (1 + log2(charLen / anchor))
   */
  applyLengthNormalization(results) {
    const anchor = this.config.lengthNormAnchor;
    if (!anchor || anchor <= 0) return results;
    const normalized = results.map((r) => {
      const charLen = r.entry.text.length;
      const ratio = charLen / anchor;
      const logRatio = Math.log2(Math.max(ratio, 1));
      const factor = 1 / (1 + 0.5 * logRatio);
      return {
        ...r,
        score: clamp012(r.score * factor, r.score * 0.3)
      };
    });
    return normalized.sort((a, b) => b.score - a.score);
  }
  /**
   * Time decay: multiplicative penalty for old entries.
   * Unlike recencyBoost (additive bonus for new entries), this actively
   * penalizes stale information so recent knowledge wins ties.
   * Formula: score *= 0.5 + 0.5 * exp(-ageDays / halfLife)
   * At 0 days: 1.0x (no penalty)
   * At halfLife: ~0.68x
   * At 2*halfLife: ~0.59x
   * Floor at 0.5x (never penalize more than half)
   */
  applyTimeDecay(results) {
    const halfLife = this.config.timeDecayHalfLifeDays;
    if (!halfLife || halfLife <= 0) return results;
    const now = Date.now();
    const decayed = results.map((r) => {
      const ts = r.entry.timestamp && r.entry.timestamp > 0 ? r.entry.timestamp : now;
      const ageDays = (now - ts) / 864e5;
      const { accessCount, lastAccessedAt } = parseAccessMetadata2(
        r.entry.metadata
      );
      const effectiveHL = computeEffectiveHalfLife2(
        halfLife,
        accessCount,
        lastAccessedAt,
        this.config.reinforcementFactor,
        this.config.maxHalfLifeMultiplier
      );
      const factor = 0.5 + 0.5 * Math.exp(-ageDays / effectiveHL);
      return {
        ...r,
        score: clamp012(r.score * factor, r.score * 0.5)
      };
    });
    return decayed.sort((a, b) => b.score - a.score);
  }
  /**
   * Apply lifecycle-aware score adjustment (decay + tier floors).
   *
   * This is intentionally lightweight:
   * - reads tier/access metadata (if any)
   * - multiplies scores by max(tierFloor, decayComposite)
   */
  applyLifecycleBoost(results) {
    if (!this.decayEngine) return results;
    const now = Date.now();
    const pairs = results.map((r) => {
      const { memory } = getDecayableFromEntry(r.entry);
      return { r, memory };
    });
    const scored = pairs.map((p) => ({ memory: p.memory, score: p.r.score }));
    this.decayEngine.applySearchBoost(scored, now);
    const boosted = pairs.map((p, i) => ({ ...p.r, score: scored[i].score }));
    return boosted.sort((a, b) => b.score - a.score);
  }
  /**
   * Record access stats (access_count, last_accessed_at) and apply tier
   * promotion/demotion for a small number of top results.
   *
   * Note: this writes back to LanceDB via delete+readd; keep it bounded.
   */
  async recordAccessAndMaybeTransition(results) {
    if (!this.decayEngine && !this.tierManager) return;
    const now = Date.now();
    const toUpdate = results.slice(0, 3);
    for (const r of toUpdate) {
      const { memory, meta } = getDecayableFromEntry(r.entry);
      const nextAccess = memory.accessCount + 1;
      meta.access_count = nextAccess;
      meta.last_accessed_at = now;
      if (meta.created_at === void 0 && meta.createdAt === void 0) {
        meta.created_at = memory.createdAt;
      }
      if (meta.tier === void 0) {
        meta.tier = memory.tier;
      }
      if (meta.confidence === void 0) {
        meta.confidence = memory.confidence;
      }
      const updatedMemory = {
        ...memory,
        accessCount: nextAccess,
        lastAccessedAt: now
      };
      if (this.decayEngine && this.tierManager) {
        const ds = this.decayEngine.score(updatedMemory, now);
        const transition = this.tierManager.evaluate(updatedMemory, ds, now);
        if (transition) {
          meta.tier = transition.toTier;
        }
      }
      try {
        await this.store.update(r.entry.id, {
          metadata: JSON.stringify(meta)
        });
      } catch {
      }
    }
  }
  /**
   * MMR-inspired diversity filter: greedily select results that are both
   * relevant (high score) and diverse (low similarity to already-selected).
   *
   * Uses cosine similarity between memory vectors. If two memories have
   * cosine similarity > threshold (default 0.92), the lower-scored one
   * is demoted to the end rather than removed entirely.
   *
   * This prevents top-k from being filled with near-identical entries
   * (e.g. 3 similar "SVG style" memories) while keeping them available
   * if the pool is small.
   */
  applyMMRDiversity(results, similarityThreshold = 0.85) {
    if (results.length <= 1) return results;
    const selected = [];
    const deferred = [];
    for (const candidate of results) {
      const tooSimilar = selected.some((s) => {
        const sVec = s.entry.vector;
        const cVec = candidate.entry.vector;
        if (!sVec?.length || !cVec?.length) return false;
        const sArr = Array.from(sVec);
        const cArr = Array.from(cVec);
        const sim = cosineSimilarity(sArr, cArr);
        return sim > similarityThreshold;
      });
      if (tooSimilar) {
        deferred.push(candidate);
      } else {
        selected.push(candidate);
      }
    }
    return [...selected, ...deferred];
  }
  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  // Get current configuration
  getConfig() {
    return { ...this.config };
  }
  // Test retrieval system
  async test(query = "test query") {
    try {
      const results = await this.retrieve({
        query,
        limit: 1
      });
      return {
        success: true,
        mode: this.config.mode,
        hasFtsSupport: this.store.hasFtsSupport
      };
    } catch (error) {
      return {
        success: false,
        mode: this.config.mode,
        hasFtsSupport: this.store.hasFtsSupport,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
function createRetriever(store, embedder, config, options) {
  const fullConfig = { ...DEFAULT_RETRIEVAL_CONFIG, ...config };
  return new MemoryRetriever(store, embedder, fullConfig, options?.decayEngine ?? null);
}
init_logger();
init_logger();
init_noise_filter();
var FILTER_LOG_PATH = join7(homedir7(), ".openclaw", "memory", "store-filtered.log");
init_self_improvement_files();
init_noise_filter();
init_smart_metadata();
init_logger();
var MS_PER_DAY = 864e5;
var DEFAULT_DECAY_CONFIG = {
  recencyHalfLifeDays: 30,
  recencyWeight: 0.4,
  // initial — pending optimization
  frequencyWeight: 0.3,
  // initial — pending optimization
  intrinsicWeight: 0.3,
  // initial — pending optimization
  staleThreshold: 0.3,
  searchBoostMin: 0.3,
  importanceModulation: 1.5,
  betaCore: 0.8,
  betaWorking: 1,
  betaPeripheral: 1.3,
  coreDecayFloor: 0.9,
  workingDecayFloor: 0.7,
  peripheralDecayFloor: 0.5
};
function createDecayEngine(config = DEFAULT_DECAY_CONFIG) {
  const {
    recencyHalfLifeDays: halfLife,
    recencyWeight: rw,
    frequencyWeight: fw,
    intrinsicWeight: iw,
    staleThreshold,
    searchBoostMin: boostMin,
    importanceModulation: mu,
    betaCore,
    betaWorking,
    betaPeripheral,
    coreDecayFloor,
    workingDecayFloor,
    peripheralDecayFloor
  } = config;
  function getTierBeta(tier) {
    switch (tier) {
      case "core":
        return betaCore;
      case "working":
        return betaWorking;
      case "peripheral":
        return betaPeripheral;
    }
  }
  function getTierFloor(tier) {
    switch (tier) {
      case "core":
        return coreDecayFloor;
      case "working":
        return workingDecayFloor;
      case "peripheral":
        return peripheralDecayFloor;
    }
  }
  function recency(memory, now) {
    const lastActive = memory.accessCount > 0 ? memory.lastAccessedAt : memory.createdAt;
    const daysSince = Math.max(0, (now - lastActive) / MS_PER_DAY);
    const salience = memory.emotionalSalience ?? 0.3;
    const effectiveHL = halfLife * Math.exp(mu * memory.importance) * (1 + salience * 0.5);
    const lambda = Math.LN2 / effectiveHL;
    const beta = getTierBeta(memory.tier);
    return Math.exp(-lambda * Math.pow(daysSince, beta));
  }
  function frequency(memory) {
    const base = 1 - Math.exp(-memory.accessCount / 5);
    if (memory.accessCount <= 1) return base;
    const lastActive = memory.accessCount > 0 ? memory.lastAccessedAt : memory.createdAt;
    const accessSpanDays = Math.max(
      1,
      (lastActive - memory.createdAt) / MS_PER_DAY
    );
    const avgGapDays = accessSpanDays / Math.max(memory.accessCount - 1, 1);
    const recentnessBonus = Math.exp(-avgGapDays / 30);
    return base * (0.5 + 0.5 * recentnessBonus);
  }
  function intrinsic(memory) {
    const salience = memory.emotionalSalience ?? 0.3;
    return memory.importance * memory.confidence * (1 + salience * 0.3);
  }
  function scoreOne(memory, now) {
    const r = recency(memory, now);
    const f = frequency(memory);
    const i = intrinsic(memory);
    const composite = rw * r + fw * f + iw * i;
    return {
      memoryId: memory.id,
      recency: r,
      frequency: f,
      intrinsic: i,
      composite
    };
  }
  return {
    score(memory, now = Date.now()) {
      return scoreOne(memory, now);
    },
    scoreAll(memories, now = Date.now()) {
      return memories.map((m) => scoreOne(m, now));
    },
    applySearchBoost(results, now = Date.now()) {
      for (const r of results) {
        const ds = scoreOne(r.memory, now);
        const tierFloor = Math.max(getTierFloor(r.memory.tier), ds.composite);
        const multiplier = boostMin + (1 - boostMin) * tierFloor;
        r.score *= Math.min(1, Math.max(boostMin, multiplier));
      }
    },
    getStaleMemories(memories, now = Date.now()) {
      const scores = memories.map((m) => scoreOne(m, now));
      return scores.filter((s) => s.composite < staleThreshold).sort((a, b) => a.composite - b.composite);
    }
  };
}
init_smart_metadata();
init_logger();
var EMBEDDING_PRESETS = {
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    model: "text-embedding-3-small",
    dimensions: 1536
  },
  ollama: {
    apiKeyEnv: "OLLAMA_API_KEY",
    baseURL: "http://localhost:11434/v1",
    model: "bge-m3",
    dimensions: 1024,
    fallbackApiKey: "ollama"
  },
  voyage: {
    apiKeyEnv: "VOYAGE_API_KEY",
    baseURL: "https://api.voyageai.com/v1",
    model: "voyage-3-large",
    dimensions: 1024
  },
  jina: {
    apiKeyEnv: "JINA_API_KEY",
    baseURL: "https://api.jina.ai/v1",
    model: "jina-embeddings-v3",
    dimensions: 1024
  }
};
function resolveEmbedding(config) {
  if (config.embedding) {
    if (!config.embedding.apiKey) {
      throw new Error(
        "mnemo: config.embedding.apiKey is required.\nTip: use a preset instead \u2014 createMnemo({ preset: 'openai', dbPath: './db' })"
      );
    }
    return {
      apiKey: config.embedding.apiKey,
      baseURL: config.embedding.baseURL,
      model: config.embedding.model || "text-embedding-3-small",
      dimensions: config.embedding.dimensions || 1024,
      taskQuery: config.embedding.taskQuery,
      taskPassage: config.embedding.taskPassage
    };
  }
  if (config.preset) {
    const preset = EMBEDDING_PRESETS[config.preset];
    if (!preset) {
      throw new Error(
        `mnemo: unknown preset "${config.preset}". Available: ${Object.keys(EMBEDDING_PRESETS).join(", ")}`
      );
    }
    const apiKey = process.env[preset.apiKeyEnv] || preset.fallbackApiKey;
    if (!apiKey) {
      throw new Error(
        `mnemo: preset "${config.preset}" requires ${preset.apiKeyEnv} environment variable`
      );
    }
    return {
      apiKey,
      baseURL: preset.baseURL,
      model: preset.model,
      dimensions: preset.dimensions
    };
  }
  if (process.env.OPENAI_API_KEY) {
    log.info("[mnemo] Auto-detected OPENAI_API_KEY \u2192 using OpenAI embeddings");
    const p = EMBEDDING_PRESETS.openai;
    return { apiKey: process.env.OPENAI_API_KEY, baseURL: p.baseURL, model: p.model, dimensions: p.dimensions };
  }
  if (process.env.OLLAMA_HOST || process.env.OLLAMA_API_KEY) {
    log.info("[mnemo] Auto-detected Ollama \u2192 using local embeddings");
    const p = EMBEDDING_PRESETS.ollama;
    const baseURL = process.env.OLLAMA_HOST ? `${process.env.OLLAMA_HOST.replace(/\/$/, "")}/v1` : p.baseURL;
    return { apiKey: "ollama", baseURL, model: p.model, dimensions: p.dimensions };
  }
  if (process.env.VOYAGE_API_KEY) {
    log.info("[mnemo] Auto-detected VOYAGE_API_KEY \u2192 using Voyage embeddings");
    const p = EMBEDDING_PRESETS.voyage;
    return { apiKey: process.env.VOYAGE_API_KEY, baseURL: p.baseURL, model: p.model, dimensions: p.dimensions };
  }
  if (process.env.JINA_API_KEY) {
    log.info("[mnemo] Auto-detected JINA_API_KEY \u2192 using Jina embeddings");
    const p = EMBEDDING_PRESETS.jina;
    return { apiKey: process.env.JINA_API_KEY, baseURL: p.baseURL, model: p.model, dimensions: p.dimensions };
  }
  throw new Error(
    "mnemo: no embedding provider configured.\n\nOptions:\n  1. Set OPENAI_API_KEY env var (auto-detected)\n  2. Use a preset:   createMnemo({ preset: 'ollama', dbPath: './db' })\n  3. Full config:    createMnemo({ embedding: { provider: 'openai-compatible', apiKey: '...', model: '...' }, dbPath: './db' })\n\nAvailable presets: openai, ollama, voyage, jina\nDocs: https://docs.m-nemo.ai/guide/configuration"
  );
}
async function createMnemo(config) {
  if (!config) throw new Error("mnemo: config is required \u2014 see https://docs.m-nemo.ai/guide/quickstart");
  if (!config.dbPath) throw new Error("mnemo: config.dbPath is required \u2014 path to local database directory");
  const resolved = resolveEmbedding(config);
  const embedder = new Embedder({
    apiKey: resolved.apiKey,
    baseURL: resolved.baseURL,
    model: resolved.model,
    dimensions: resolved.dimensions,
    taskQuery: resolved.taskQuery,
    taskPassage: resolved.taskPassage
  });
  const store = new MemoryStore({
    dbPath: config.dbPath,
    vectorDim: resolved.dimensions,
    storageBackend: config.storageBackend,
    storageConfig: config.storageConfig
  });
  const decayEngine = createDecayEngine({
    ...DEFAULT_DECAY_CONFIG,
    ...config.decay || {}
  });
  const retriever = createRetriever(store, embedder, {
    ...DEFAULT_RETRIEVAL_CONFIG,
    ...config.retrieval || {}
  }, { decayEngine });
  return {
    async store(entry) {
      const vector = await embedder.embed(entry.text);
      const category = entry.category || "fact";
      const result = await store.store({
        text: entry.text,
        vector,
        category,
        importance: entry.importance ?? 0.7,
        scope: entry.scope || "global"
      });
      return { id: result.id };
    },
    async recall(query, options = {}) {
      const results = await retriever.retrieve({
        query,
        limit: options.limit ?? 5,
        scopeFilter: options.scopeFilter,
        category: options.category,
        source: "manual"
      });
      return results.map((r) => ({
        text: r.entry.text,
        score: r.score,
        category: r.entry.category || "fact",
        importance: r.entry.importance ?? 0.7,
        timestamp: r.entry.timestamp ?? Date.now()
      }));
    },
    async delete(id) {
      return store.delete(id);
    },
    async stats() {
      const s = await store.stats();
      return {
        totalEntries: s.totalCount,
        scopeCounts: s.scopeCounts,
        categoryCounts: s.categoryCounts
      };
    },
    async close() {
      if (store.adapter) {
        try {
          await store.adapter.close();
        } catch {
        }
      }
    }
  };
}
init_storage_adapter();
init_logger();
var registerAllMemoryTools2 = () => {
};
var appendSelfImprovementEntry2 = async () => {
};
var ensureSelfImprovementLearningFiles2 = async () => {
};
var runWithReflectionTransientRetryOnce2 = null;
var resolveReflectionSessionSearchDirs2 = () => [];
var stripResetSuffix2 = (s) => s;
var storeReflectionToLanceDB2 = async () => {
};
var loadAgentReflectionSlicesFromEntries2 = () => [];
var DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS2 = 864e5;
var extractReflectionLearningGovernanceCandidates2 = () => [];
var extractReflectionMappedMemoryItems2 = () => [];
var createReflectionEventId2 = () => "";
var buildReflectionMappedMetadata2 = () => ({});
var recoverPendingWrites2 = async () => {
};
var createMemoryUpgrader2 = () => null;
if (isProLicensed()) {
  Promise.all([
    Promise.resolve().then(() => (init_tools(), tools_exports)),
    Promise.resolve().then(() => (init_self_improvement_files(), self_improvement_files_exports)),
    Promise.resolve().then(() => (init_reflection_retry(), reflection_retry_exports)),
    Promise.resolve().then(() => (init_session_recovery(), session_recovery_exports)),
    Promise.resolve().then(() => (init_reflection_store(), reflection_store_exports)),
    Promise.resolve().then(() => (init_reflection_slices(), reflection_slices_exports)),
    Promise.resolve().then(() => (init_reflection_event_store(), reflection_event_store_exports)),
    Promise.resolve().then(() => (init_reflection_mapped_metadata(), reflection_mapped_metadata_exports)),
    Promise.resolve().then(() => (init_wal_recovery(), wal_recovery_exports)),
    Promise.resolve().then(() => (init_memory_upgrader(), memory_upgrader_exports))
  ]).then(([tools, selfImprove, reflRetry, sessRecov, reflStore, reflSlices, reflEvent, reflMapped, wal, upgrader]) => {
    registerAllMemoryTools2 = tools.registerAllMemoryTools;
    appendSelfImprovementEntry2 = selfImprove.appendSelfImprovementEntry;
    ensureSelfImprovementLearningFiles2 = selfImprove.ensureSelfImprovementLearningFiles;
    runWithReflectionTransientRetryOnce2 = reflRetry.runWithReflectionTransientRetryOnce;
    resolveReflectionSessionSearchDirs2 = sessRecov.resolveReflectionSessionSearchDirs;
    stripResetSuffix2 = sessRecov.stripResetSuffix;
    storeReflectionToLanceDB2 = reflStore.storeReflectionToLanceDB;
    loadAgentReflectionSlicesFromEntries2 = reflStore.loadAgentReflectionSlicesFromEntries;
    DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS2 = reflStore.DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS;
    extractReflectionLearningGovernanceCandidates2 = reflSlices.extractReflectionLearningGovernanceCandidates;
    extractReflectionMappedMemoryItems2 = reflSlices.extractReflectionMappedMemoryItems;
    createReflectionEventId2 = reflEvent.createReflectionEventId;
    buildReflectionMappedMetadata2 = reflMapped.buildReflectionMappedMetadata;
    recoverPendingWrites2 = wal.recoverPendingWrites;
    createMemoryUpgrader2 = upgrader.createMemoryUpgrader;
  }).catch(() => {
  });
}
var DEFAULT_REFLECTION_SESSION_TTL_MS = 30 * 60 * 1e3;
var requireFromHere = createRequire(import.meta.url);
function getPluginVersion() {
  try {
    const pkgUrl = new URL("./package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync3(pkgUrl, "utf8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}
var pluginVersion = getPluginVersion();
var MNEMO_AUTO_CAPTURE = process.env.MNEMO_AUTO_CAPTURE !== "false";
var MNEMO_MIN_IMPORTANCE = parseFloat(process.env.MNEMO_MIN_IMPORTANCE || "0.55");
var MNEMO_DEDUP_THRESHOLD = parseFloat(process.env.MNEMO_DEDUP_THRESHOLD || "0.88");
var MNEMO_CONFLICT_THRESHOLD = parseFloat(process.env.MNEMO_CONFLICT_THRESHOLD || "0.70");
var MNEMO_SCOPE = process.env.MNEMO_SCOPE || "global";
var OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";
var log2 = (msg, data) => {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  console.error(`[mnemo-auto-capture] ${ts} ${msg}`, data ?? "");
};
var DENIAL_PATTERNS2 = [
  /i don'?t have (any )?(information|data|memory|record)/i,
  /i'?m not sure about/i,
  /i don'?t recall/i,
  /i don'?t remember/i,
  /it looks like i don'?t/i,
  /i wasn'?t able to find/i,
  /no (relevant )?memories found/i,
  /i don'?t have access to/i
];
var META_QUESTION_PATTERNS2 = [
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
  /我(?:之前|上次|以前)(?:说|提|讲).*(?:吗|呢|？|\?)/
];
var BOILERPLATE_PATTERNS2 = [
  /^(hi|hello|hey|good morning|good evening|greetings)/i,
  /^fresh session/i,
  /^new session/i,
  /^HEARTBEAT/i
];
function isNoise2(text) {
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;
  if (DENIAL_PATTERNS2.some((p) => p.test(trimmed))) return true;
  if (META_QUESTION_PATTERNS2.some((p) => p.test(trimmed))) return true;
  if (BOILERPLATE_PATTERNS2.some((p) => p.test(trimmed))) return true;
  return false;
}
var MEMORY_TRIGGERS = [
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
  /幫我|筆記|存檔|存起來|存一下|重點|原則|底線/
];
var CAPTURE_EXCLUDE_PATTERNS = [
  /\b(memory-pro|memory_store|memory_recall|memory_forget|memory_update)\b/i,
  /\bopenclaw\s+memory-pro\b/i,
  /\b(delete|remove|forget|purge|cleanup|clean up|clear)\b.*\b(memory|memories|entry|entries)\b/i,
  /\b(memory|memories)\b.*\b(delete|remove|forget|purge|cleanup|clean up|clear)\b/i,
  /\bhow do i\b.*\b(delete|remove|forget|purge|cleanup|clear)\b/i,
  /(删除|刪除|清理|清除).{0,12}(记忆|記憶|memory)/i
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
  if (/prefer|radši|like|love|hate|want|偏好|喜歡|喜欢|討厭|讨厌|不喜歡|不喜欢|愛用|爱用|習慣|习惯/i.test(
    lower
  )) {
    return "preference";
  }
  if (/decided|decision|switch|migrate|決定|决定|選擇了|选择了|改用|換成|换成/i.test(
    lower
  )) {
    return "decision";
  }
  if (/\b(is|are|was|were)\b.*\b(called|named|known as)\b|my\s+\w+\s+is|我的\S+是|叫我/i.test(
    text
  )) {
    return "entity";
  }
  return "other";
}
var mnemoInstance = null;
async function getMnemo() {
  if (!mnemoInstance) {
    const dbPath = path2.join(os.homedir(), ".mnemo", "memory-db");
    const ollamaBase = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    mnemoInstance = await createMnemo({
      preset: "ollama",
      dbPath,
      embedding: {
        provider: "openai-compatible",
        apiKey: "ollama",
        baseURL: `${ollamaBase}/v1`,
        model: "dengcao/bge-m3:567m",
        dimensions: 1024
      }
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
      scope: MNEMO_SCOPE
    });
    return true;
  } catch (err) {
    log2(`Failed to store memory: ${err}`);
    return false;
  }
}
async function extractMemories(lastAssistantMessage, transcriptPath) {
  const prompt = `Analyze this conversation excerpt and identify information worth storing long-term.

CONVERSATION:
${lastAssistantMessage.slice(0, 3e3)}

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
          num_predict: 4096
          // Give enough tokens for both thinking and content
        }
      })
    });
    if (!resp.ok) {
      throw new Error(`Ollama API error ${resp.status}`);
    }
    const data = await resp.json();
    const text = data.message?.content ?? "";
    let parsed = null;
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        parsed = JSON.parse(arrayMatch[0]);
      } catch {
      }
    }
    if (!parsed) {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          const cleaned = codeBlockMatch[1].trim();
          const jsonArrayMatch = cleaned.match(/\[[\s\S]*?\]/);
          if (jsonArrayMatch) {
            parsed = JSON.parse(jsonArrayMatch[0]);
          }
        } catch {
        }
      }
    }
    if (parsed && Array.isArray(parsed)) {
      return parsed;
    }
    log2(`Could not parse JSON from LLM response, falling back to regex`);
    return extractMemoriesRegex(lastAssistantMessage);
  } catch (err) {
    log2(`LLM extraction failed: ${err}, falling back to regex`);
    return extractMemoriesRegex(lastAssistantMessage);
  }
}
function extractMemoriesRegex(text) {
  const candidates = [];
  const lines = text.split(/\n+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10 || trimmed.length > 500) continue;
    if (isNoise2(trimmed)) continue;
    if (!shouldCapture(trimmed)) continue;
    candidates.push({
      text: trimmed,
      category: detectCategory(trimmed),
      importance: 0.7,
      reason: "Regex trigger match"
    });
  }
  return candidates.slice(0, 3);
}
async function main() {
  if (!MNEMO_AUTO_CAPTURE) {
    log2("Auto-capture disabled by environment");
    process.exit(0);
  }
  let input = {};
  try {
    const stdin = await new Promise((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => data += chunk);
      process.stdin.on("end", () => resolve(data));
    });
    if (stdin.trim()) {
      input = JSON.parse(stdin);
    }
  } catch (err) {
    log2(`Failed to parse stdin: ${err}`);
  }
  const lastMessage = input.last_assistant_message;
  if (!lastMessage || lastMessage.length < 30) {
    log2("No assistant message or too short, skipping");
    process.exit(0);
  }
  log2(`Processing message (${lastMessage.length} chars)`);
  const candidates = await extractMemories(lastMessage, input.transcript_path);
  log2(`Extracted ${candidates.length} candidates`);
  if (candidates.length === 0) {
    process.exit(0);
  }
  let stored = 0;
  for (const mem of candidates) {
    if (mem.importance < MNEMO_MIN_IMPORTANCE) {
      log2(`Skip (low importance ${mem.importance}): ${mem.text.slice(0, 60)}`);
      continue;
    }
    const success = await storeMemory(mem.text, mem.category, mem.importance);
    if (success) {
      stored++;
      log2(`Stored [${mem.category}]: ${mem.text.slice(0, 60)}`);
    } else {
      log2(`Failed to store: ${mem.text.slice(0, 60)}`);
    }
  }
  log2(`Done: stored ${stored} memories`);
  process.exit(0);
}
main().catch((err) => {
  log2(`Fatal error: ${err}`);
  process.exit(1);
});
