// SPDX-License-Identifier: MIT
/**
 * PGVector Storage Adapter for Mnemo
 *
 * Requirements:
 *   npm install pg pgvector
 *   PostgreSQL with pgvector extension enabled
 *
 * Config:
 *   storage: "pgvector"
 *   storageConfig: { connectionString: "postgres://user:pass@localhost:5432/mnemo" }
 */

import type {
  StorageAdapter,
  MemoryRecord,
  SearchResult,
  QueryOptions,
} from "../storage-adapter.js";
import { registerAdapter } from "../storage-adapter.js";

const TABLE = "mnemo_memories";

export class PGVectorAdapter implements StorageAdapter {
  readonly name = "pgvector";

  private pool: any = null;
  private vectorDim = 0;
  private connectionString: string;

  constructor(config?: Record<string, unknown>) {
    this.connectionString = (config?.connectionString as string) ||
      "postgres://localhost:5432/mnemo";
  }

  async connect(dbPath: string): Promise<void> {
    const { Pool } = await import("pg");
    this.pool = new Pool({
      connectionString: dbPath || this.connectionString,
    });

    // Enable pgvector extension
    await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  }

  async ensureTable(vectorDimensions: number): Promise<void> {
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

    // Create HNSW index for vector search
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_vector_idx
      ON ${TABLE} USING hnsw (vector vector_cosine_ops)
    `).catch(() => {}); // ignore if already exists

    // Create GIN index for full-text search
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_text_idx
      ON ${TABLE} USING gin (to_tsvector('simple', text))
    `).catch(() => {});

    // Create index on scope for filtering
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${TABLE}_scope_idx ON ${TABLE} (scope)
    `).catch(() => {});
  }

  async add(records: MemoryRecord[]): Promise<void> {
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
        [r.id, r.text, `[${r.vector.join(",")}]`, r.timestamp, r.scope, r.importance, r.category, r.metadata],
      );
    }
  }

  async update(id: string, record: MemoryRecord): Promise<void> {
    await this.add([record]);
  }

  async delete(filter: string): Promise<void> {
    const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
    if (idMatch) {
      await this.pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [idMatch[1]]);
    } else {
      // Pass filter as-is for simple SQL WHERE clauses
      await this.pool.query(`DELETE FROM ${TABLE} WHERE ${filter}`);
    }
  }

  async vectorSearch(
    vector: number[],
    limit: number,
    minScore = 0,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    const vectorStr = `[${vector.join(",")}]`;
    let query = `
      SELECT *, 1 - (vector <=> $1::vector) AS score
      FROM ${TABLE}
      WHERE 1 - (vector <=> $1::vector) >= $2
    `;
    const params: any[] = [vectorStr, minScore];

    if (scopeFilter?.length) {
      query += ` AND scope = ANY($3)`;
      params.push(scopeFilter);
    }

    query += ` ORDER BY vector <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);

    return result.rows.map((row: any) => ({
      record: this.toRecord(row),
      score: parseFloat(row.score),
    }));
  }

  async fullTextSearch(
    queryText: string,
    limit: number,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    // Use PostgreSQL full-text search with ts_rank
    let query = `
      SELECT *, ts_rank(to_tsvector('simple', text), plainto_tsquery('simple', $1)) AS score
      FROM ${TABLE}
      WHERE to_tsvector('simple', text) @@ plainto_tsquery('simple', $1)
    `;
    const params: any[] = [queryText];

    if (scopeFilter?.length) {
      query += ` AND scope = ANY($2)`;
      params.push(scopeFilter);
    }

    query += ` ORDER BY score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);

    return result.rows.map((row: any) => ({
      record: this.toRecord(row),
      score: parseFloat(row.score),
    }));
  }

  async query(options: QueryOptions): Promise<MemoryRecord[]> {
    let query = `SELECT * FROM ${TABLE}`;
    if (options.where) query += ` WHERE ${options.where}`;
    query += ` LIMIT ${options.limit || 100}`;

    const result = await this.pool.query(query);
    return result.rows.map((row: any) => this.toRecord(row));
  }

  async count(filter?: string): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${TABLE}`;
    if (filter) query += ` WHERE ${filter}`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count);
  }

  async ensureFullTextIndex(): Promise<void> {
    // Created in ensureTable
  }

  hasFullTextSearch(): boolean {
    return true; // PostgreSQL has native full-text search
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // ── Helpers ──

  private toRecord(row: any): MemoryRecord {
    return {
      id: row.id,
      text: row.text,
      vector: row.vector ? (typeof row.vector === "string" ? JSON.parse(row.vector) : Array.from(row.vector)) : [],
      timestamp: parseInt(row.timestamp) || 0,
      scope: row.scope ?? "global",
      importance: parseFloat(row.importance) || 0.5,
      category: row.category ?? "other",
      metadata: typeof row.metadata === "object" ? JSON.stringify(row.metadata) : (row.metadata ?? "{}"),
    };
  }
}

registerAdapter("pgvector", (config) => new PGVectorAdapter(config));
