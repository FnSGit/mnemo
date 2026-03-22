# Storage Adapters

Mnemo supports pluggable storage backends via the `StorageAdapter` interface.

## Available Adapters

| Adapter | Status | Package |
|---------|--------|---------|
| **LanceDB** | Stable (default) | Built-in |
| Qdrant | Planned | — |
| Chroma | Planned | — |
| Milvus | Planned | — |
| PGVector | Planned | — |
| Pinecone | Planned | — |

## Using a Different Backend

```typescript
import { createMnemo } from '@mnemo/core';

const mnemo = await createMnemo({
  storage: 'lancedb',  // default — change to 'qdrant', 'chroma', etc.
  // ...
});
```

## Creating a Custom Adapter

Implement the `StorageAdapter` interface and register it:

```typescript
import { StorageAdapter, registerAdapter } from '@mnemo/core/storage-adapter';

class MyAdapter implements StorageAdapter {
  readonly name = 'my-backend';
  async connect(dbPath: string) { /* ... */ }
  async ensureTable(dim: number) { /* ... */ }
  async add(records: MemoryRecord[]) { /* ... */ }
  async vectorSearch(vector, limit, minScore, scopeFilter) { /* ... */ }
  async fullTextSearch(query, limit, scopeFilter) { /* ... */ }
  // ... implement all methods
}

registerAdapter('my-backend', () => new MyAdapter());
```

Then use it:
```typescript
const mnemo = await createMnemo({ storage: 'my-backend' });
```

## Interface Reference

See `storage-adapter.ts` for the full `StorageAdapter` interface with JSDoc.
