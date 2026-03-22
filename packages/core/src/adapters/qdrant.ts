// SPDX-License-Identifier: MIT
/**
 * Qdrant Storage Adapter for Mnemo
 *
 * Requirements:
 *   npm install @qdrant/js-client-rest
 *
 * Config:
 *   storage: "qdrant"
 *   storageConfig: { url: "http://localhost:6333", apiKey?: "..." }
 */

import type {
  StorageAdapter,
  MemoryRecord,
  SearchResult,
  QueryOptions,
} from "../storage-adapter.js";
import { registerAdapter } from "../storage-adapter.js";

const COLLECTION = "mnemo_memories";

export class QdrantAdapter implements StorageAdapter {
  readonly name = "qdrant";

  private client: any = null;
  private url: string = "http://localhost:6333";
  private apiKey?: string;
  private vectorDim = 0;

  constructor(config?: Record<string, unknown>) {
    if (config?.url) this.url = config.url as string;
    if (config?.apiKey) this.apiKey = config.apiKey as string;
  }

  async connect(): Promise<void> {
    const { QdrantClient } = await import("@qdrant/js-client-rest");
    this.client = new QdrantClient({
      url: this.url,
      ...(this.apiKey ? { apiKey: this.apiKey } : {}),
    });
  }

  async ensureTable(vectorDimensions: number): Promise<void> {
    this.vectorDim = vectorDimensions;
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c: any) => c.name === COLLECTION);

    if (!exists) {
      await this.client.createCollection(COLLECTION, {
        vectors: { size: vectorDimensions, distance: "Cosine" },
      });
      // Create payload indices for filtering
      await this.client.createPayloadIndex(COLLECTION, {
        field_name: "scope",
        field_schema: "keyword",
      });
      await this.client.createPayloadIndex(COLLECTION, {
        field_name: "category",
        field_schema: "keyword",
      });
    }
  }

  async add(records: MemoryRecord[]): Promise<void> {
    const points = records.map((r) => ({
      id: r.id,
      vector: r.vector,
      payload: {
        text: r.text,
        timestamp: r.timestamp,
        scope: r.scope,
        importance: r.importance,
        category: r.category,
        metadata: r.metadata,
      },
    }));
    await this.client.upsert(COLLECTION, { points });
  }

  async update(id: string, record: MemoryRecord): Promise<void> {
    await this.add([record]);
  }

  async delete(filter: string): Promise<void> {
    // Parse simple "id = 'xxx'" filter
    const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
    if (idMatch) {
      await this.client.delete(COLLECTION, {
        points: [idMatch[1]],
      });
    }
  }

  async vectorSearch(
    vector: number[],
    limit: number,
    minScore = 0,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    const filter = scopeFilter?.length
      ? { must: [{ key: "scope", match: { any: scopeFilter } }] }
      : undefined;

    const results = await this.client.search(COLLECTION, {
      vector,
      limit,
      with_payload: true,
      score_threshold: minScore,
      ...(filter ? { filter } : {}),
    });

    return results.map((r: any) => ({
      record: this.toRecord(r.id, r.payload),
      score: r.score,
    }));
  }

  async fullTextSearch(
    _query: string,
    _limit: number,
    _scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    // Qdrant doesn't have native BM25 — fall back to empty
    // Users should pair with a separate FTS engine or use vector search
    return [];
  }

  async query(options: QueryOptions): Promise<MemoryRecord[]> {
    const filter = options.where
      ? this.parseFilter(options.where)
      : undefined;

    const result = await this.client.scroll(COLLECTION, {
      limit: options.limit || 100,
      with_payload: true,
      with_vectors: true,
      ...(filter ? { filter } : {}),
    });

    return result.points.map((p: any) => this.toRecord(p.id, p.payload, p.vector));
  }

  async count(filter?: string): Promise<number> {
    const result = await this.client.count(COLLECTION, {
      ...(filter ? { filter: this.parseFilter(filter) } : {}),
      exact: true,
    });
    return result.count;
  }

  async ensureFullTextIndex(): Promise<void> {
    // Qdrant uses payload indices, not FTS indices
    // Text search via Qdrant requires external FTS or payload keyword match
  }

  hasFullTextSearch(): boolean {
    return false; // Qdrant doesn't have native BM25
  }

  async close(): Promise<void> {
    this.client = null;
  }

  // ── Helpers ──

  private toRecord(id: string, payload: any, vector?: number[]): MemoryRecord {
    return {
      id,
      text: payload.text ?? "",
      vector: vector ? Array.from(vector) : [],
      timestamp: payload.timestamp ?? 0,
      scope: payload.scope ?? "global",
      importance: payload.importance ?? 0.5,
      category: payload.category ?? "other",
      metadata: payload.metadata ?? "{}",
    };
  }

  private parseFilter(where: string): any {
    // Simple parser for common filters
    const scopeMatch = where.match(/scope\s+IN\s*\(([^)]+)\)/i);
    if (scopeMatch) {
      const scopes = scopeMatch[1].split(",").map((s) => s.trim().replace(/'/g, ""));
      return { must: [{ key: "scope", match: { any: scopes } }] };
    }
    return undefined;
  }
}

registerAdapter("qdrant", (config) => new QdrantAdapter(config));
