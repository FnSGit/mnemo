// SPDX-License-Identifier: MIT
/**
 * StorageAdapter — Abstract interface for vector storage backends.
 *
 * Mnemo ships with LanceDB as the default adapter.
 * Implement this interface to add support for other backends
 * (Qdrant, Chroma, Milvus, Pinecone, PGVector, etc.)
 */

// ── Types ──

export interface MemoryRecord {
  id: string;
  text: string;
  vector: number[];
  timestamp: number;
  scope: string;
  importance: number;
  category: string;
  metadata: string;
  [key: string]: unknown;
}

export interface SearchResult {
  record: MemoryRecord;
  score: number;
}

export interface QueryOptions {
  where?: string;
  select?: string[];
  limit?: number;
  offset?: number;
}

// ── Interface ──

export interface StorageAdapter {
  /** Adapter name for logging and diagnostics */
  readonly name: string;

  /**
   * Connect to the storage backend.
   * @param dbPath - path or connection string
   */
  connect(dbPath: string): Promise<void>;

  /**
   * Ensure the memories table exists with proper schema.
   * Creates the table if it doesn't exist, opens it if it does.
   * @param vectorDimensions - embedding vector dimensions (e.g. 1024)
   */
  ensureTable(vectorDimensions: number): Promise<void>;

  /**
   * Insert one or more records.
   */
  add(records: MemoryRecord[]): Promise<void>;

  /**
   * Update a record by ID. Typically delete + re-insert.
   */
  update(id: string, record: MemoryRecord): Promise<void>;

  /**
   * Delete records matching a filter expression.
   * @param filter - SQL-like filter string, e.g. "id = 'abc'"
   */
  delete(filter: string): Promise<void>;

  /**
   * Vector similarity search.
   * @returns results sorted by descending similarity score (0-1)
   */
  vectorSearch(
    vector: number[],
    limit: number,
    minScore?: number,
    scopeFilter?: string[],
  ): Promise<SearchResult[]>;

  /**
   * Full-text (BM25) search.
   * @returns results sorted by descending relevance score
   */
  fullTextSearch(
    query: string,
    limit: number,
    scopeFilter?: string[],
  ): Promise<SearchResult[]>;

  /**
   * General-purpose query with optional filter, select, limit.
   */
  query(options: QueryOptions): Promise<MemoryRecord[]>;

  /**
   * Count records matching an optional filter.
   */
  count(filter?: string): Promise<number>;

  /**
   * Ensure full-text search index exists on the text field.
   */
  ensureFullTextIndex(): Promise<void>;

  /**
   * Check if full-text search is supported and initialized.
   */
  hasFullTextSearch(): boolean;

  /**
   * Close the connection / cleanup resources.
   */
  close(): Promise<void>;
}

// ── Factory ──

export type AdapterFactory = (config?: Record<string, unknown>) => StorageAdapter;

const _registry = new Map<string, AdapterFactory>();

/**
 * Register a storage adapter backend.
 * @example registerAdapter("qdrant", (config) => new QdrantAdapter(config))
 */
export function registerAdapter(name: string, factory: AdapterFactory): void {
  _registry.set(name, factory);
}

/**
 * Create a storage adapter by name.
 * Falls back to LanceDB if name is not registered.
 */
export function createAdapter(name: string, config?: Record<string, unknown>): StorageAdapter {
  const factory = _registry.get(name);
  if (!factory) {
    throw new Error(
      `Storage adapter "${name}" not found. ` +
      `Available: ${[..._registry.keys()].join(", ") || "(none)"}. ` +
      `Did you forget to call registerAdapter()?`
    );
  }
  return factory(config);
}

/**
 * List all registered adapter names.
 */
export function listAdapters(): string[] {
  return [..._registry.keys()];
}
