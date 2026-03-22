// SPDX-License-Identifier: MIT
/**
 * Chroma Storage Adapter for Mnemo
 *
 * Requirements:
 *   npm install chromadb
 *
 * Config:
 *   storage: "chroma"
 *   storageConfig: { url: "http://localhost:8000" } or { path: "./chroma-data" }
 */

import type {
  StorageAdapter,
  MemoryRecord,
  SearchResult,
  QueryOptions,
} from "../storage-adapter.js";
import { registerAdapter } from "../storage-adapter.js";

const COLLECTION = "mnemo_memories";

export class ChromaAdapter implements StorageAdapter {
  readonly name = "chroma";

  private client: any = null;
  private collection: any = null;
  private config: Record<string, unknown>;

  constructor(config?: Record<string, unknown>) {
    this.config = config || {};
  }

  async connect(dbPath: string): Promise<void> {
    const chroma = await import("chromadb");

    if (this.config.url) {
      // Remote Chroma server
      this.client = new chroma.ChromaClient({ path: this.config.url as string });
    } else {
      // Persistent local (Chroma supports persistent storage)
      this.client = new chroma.ChromaClient({ path: dbPath || this.config.path as string });
    }
  }

  async ensureTable(vectorDimensions: number): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: COLLECTION,
      metadata: { "hnsw:space": "cosine" },
    });
  }

  async add(records: MemoryRecord[]): Promise<void> {
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
        metadata: r.metadata,
      })),
    });
  }

  async update(id: string, record: MemoryRecord): Promise<void> {
    await this.add([record]);
  }

  async delete(filter: string): Promise<void> {
    if (!this.collection) throw new Error("Collection not initialized");

    const idMatch = filter.match(/id\s*=\s*'([^']+)'/);
    if (idMatch) {
      await this.collection.delete({ ids: [idMatch[1]] });
    }
  }

  async vectorSearch(
    vector: number[],
    limit: number,
    minScore = 0,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    if (!this.collection) throw new Error("Collection not initialized");

    const where = scopeFilter?.length
      ? { scope: { $in: scopeFilter } }
      : undefined;

    const results = await this.collection.query({
      queryEmbeddings: [vector],
      nResults: limit,
      ...(where ? { where } : {}),
    });

    if (!results.ids?.[0]) return [];

    return results.ids[0].map((id: string, i: number) => {
      // Chroma returns distances, convert to similarity
      const distance = results.distances?.[0]?.[i] ?? 1;
      const score = 1 - distance; // cosine distance → similarity
      const meta = results.metadatas?.[0]?.[i] || {};

      return {
        record: {
          id,
          text: results.documents?.[0]?.[i] ?? "",
          vector: [], // Chroma doesn't return vectors by default
          timestamp: meta.timestamp ?? 0,
          scope: meta.scope ?? "global",
          importance: meta.importance ?? 0.5,
          category: meta.category ?? "other",
          metadata: meta.metadata ?? "{}",
        },
        score,
      };
    }).filter((r: SearchResult) => r.score >= minScore);
  }

  async fullTextSearch(
    query: string,
    limit: number,
    scopeFilter?: string[],
  ): Promise<SearchResult[]> {
    if (!this.collection) return [];

    const where = scopeFilter?.length
      ? { scope: { $in: scopeFilter } }
      : undefined;

    // Chroma supports document search via where_document
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
      ...(where ? { where } : {}),
    });

    if (!results.ids?.[0]) return [];

    return results.ids[0].map((id: string, i: number) => {
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
          metadata: meta.metadata ?? "{}",
        },
        score: 1 - distance,
      };
    });
  }

  async query(options: QueryOptions): Promise<MemoryRecord[]> {
    if (!this.collection) throw new Error("Collection not initialized");

    const result = await this.collection.get({
      limit: options.limit || 100,
      include: ["documents", "metadatas", "embeddings"],
    });

    return (result.ids || []).map((id: string, i: number) => {
      const meta = result.metadatas?.[i] || {};
      return {
        id,
        text: result.documents?.[i] ?? "",
        vector: result.embeddings?.[i] ?? [],
        timestamp: meta.timestamp ?? 0,
        scope: meta.scope ?? "global",
        importance: meta.importance ?? 0.5,
        category: meta.category ?? "other",
        metadata: meta.metadata ?? "{}",
      };
    });
  }

  async count(): Promise<number> {
    if (!this.collection) return 0;
    return await this.collection.count();
  }

  async ensureFullTextIndex(): Promise<void> {
    // Chroma handles text search natively via queryTexts
  }

  hasFullTextSearch(): boolean {
    return true; // Chroma supports document-level text search
  }

  async close(): Promise<void> {
    this.collection = null;
    this.client = null;
  }
}

registerAdapter("chroma", (config) => new ChromaAdapter(config));
