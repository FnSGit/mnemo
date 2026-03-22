// SPDX-License-Identifier: MIT
/**
 * LanceDB Storage Adapter — Default backend for Mnemo.
 *
 * Implements StorageAdapter using @lancedb/lancedb.
 * This is the reference implementation; other backends should
 * produce equivalent behavior.
 */

import type {
  StorageAdapter,
  MemoryRecord,
  SearchResult,
  QueryOptions,
} from "../storage-adapter.js";
import { registerAdapter } from "../storage-adapter.js";

// Dynamic import to avoid hard dependency at module level
let _lancedb: typeof import("@lancedb/lancedb") | null = null;

async function loadLanceDB() {
  if (!_lancedb) {
    _lancedb = await import("@lancedb/lancedb");
  }
  return _lancedb;
}

const TABLE_NAME = "memories";

export class LanceDBAdapter implements StorageAdapter {
  readonly name = "lancedb";

  private db: any = null;
  private table: any = null;
  private ftsReady = false;
  private vectorDim = 0;

  async connect(dbPath: string): Promise<void> {
    const lancedb = await loadLanceDB();
    this.db = await lancedb.connect(dbPath);
  }

  async ensureTable(vectorDimensions: number): Promise<void> {
    this.vectorDim = vectorDimensions;

    try {
      this.table = await this.db.openTable(TABLE_NAME);
    } catch {
      // Table doesn't exist — create with schema
      const lancedb = await loadLanceDB();
      const schemaEntry: MemoryRecord = {
        id: "__schema__",
        text: "",
        vector: new Array(vectorDimensions).fill(0),
        timestamp: 0,
        scope: "global",
        importance: 0,
        category: "other",
        metadata: "{}",
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

    // Validate dimensions
    const sample = await this.table.query().limit(1).toArray();
    if (sample.length > 0 && sample[0]?.vector?.length) {
      const existing = sample[0].vector.length;
      if (existing !== vectorDimensions) {
        throw new Error(
          `Vector dimension mismatch: table=${existing}, config=${vectorDimensions}`
        );
      }
    }

    // Create FTS index
    await this.ensureFullTextIndex();
  }

  async add(records: MemoryRecord[]): Promise<void> {
    if (!this.table) throw new Error("Table not initialized");
    await this.table.add(records);
  }

  async update(id: string, record: MemoryRecord): Promise<void> {
    if (!this.table) throw new Error("Table not initialized");
    await this.table.delete(`id = '${id}'`);
    await this.table.add([record]);
  }

  async delete(filter: string): Promise<void> {
    if (!this.table) throw new Error("Table not initialized");
    await this.table.delete(filter);
  }

  async vectorSearch(
    vector: number[],
    limit: number,
    minScore = 0,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    if (!this.table) throw new Error("Table not initialized");

    let query = this.table.vectorSearch(vector).distanceType("cosine").limit(limit * 3);

    if (scopeFilter?.length) {
      const scopeExpr = scopeFilter.map((s) => `'${s}'`).join(", ");
      query = query.where(`scope IN (${scopeExpr})`);
    }

    const raw = await query.toArray();

    return raw
      .map((row: any) => {
        const distance = row._distance ?? row.distance ?? 1;
        const score = 1 / (1 + distance);
        return { record: this.toRecord(row), score };
      })
      .filter((r: SearchResult) => r.score >= minScore)
      .slice(0, limit);
  }

  async fullTextSearch(
    queryText: string,
    limit: number,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    if (!this.table || !this.ftsReady) return [];

    let query = this.table.search(queryText, "fts").limit(limit * 2);

    if (scopeFilter?.length) {
      const scopeExpr = scopeFilter.map((s) => `'${s}'`).join(", ");
      query = query.where(`scope IN (${scopeExpr})`);
    }

    const raw = await query.toArray();

    return raw
      .map((row: any) => {
        const score = row._relevance_score ?? row.score ?? 0.5;
        return { record: this.toRecord(row), score };
      })
      .slice(0, limit);
  }

  async query(options: QueryOptions): Promise<MemoryRecord[]> {
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
    return raw.map((row: any) => this.toRecord(row));
  }

  async count(filter?: string): Promise<number> {
    if (!this.table) throw new Error("Table not initialized");
    let q = this.table.query();
    if (filter) q = q.where(filter);
    const rows = await q.toArray();
    return rows.length;
  }

  async ensureFullTextIndex(): Promise<void> {
    if (!this.table) return;

    try {
      const indices = await this.table.listIndices();
      const hasFts = indices?.some(
        (idx: any) => idx.indexType === "FTS" || idx.columns?.includes("text"),
      );

      if (!hasFts) {
        const lancedb = await loadLanceDB();
        await this.table.createIndex("text", {
          config: (lancedb as any).Index.fts(),
        });
      }
      this.ftsReady = true;
    } catch {
      this.ftsReady = false;
    }
  }

  hasFullTextSearch(): boolean {
    return this.ftsReady;
  }

  async close(): Promise<void> {
    this.table = null;
    this.db = null;
  }

  // ── Helpers ──

  private toRecord(row: any): MemoryRecord {
    return {
      id: row.id,
      text: row.text,
      vector: row.vector ? Array.from(row.vector) : [],
      timestamp: row.timestamp ?? 0,
      scope: row.scope ?? "global",
      importance: row.importance ?? 0.5,
      category: row.category ?? "other",
      metadata: row.metadata ?? "{}",
      ...row, // preserve extra fields
    };
  }
}

// ── Auto-register ──
registerAdapter("lancedb", () => new LanceDBAdapter());
