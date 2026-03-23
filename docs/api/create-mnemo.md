# createMnemo()

Create a Mnemo memory instance.

## Signature

```typescript
function createMnemo(config: MnemoConfig): Promise<MnemoInstance>
```

## Examples

```typescript
import { createMnemo } from '@mnemoai/core';

// Auto-detect (uses OPENAI_API_KEY from env)
const mnemo = await createMnemo({ dbPath: './my-memory-db' });

// Preset
const mnemo = await createMnemo({ preset: 'ollama', dbPath: './db' });

// Full config
const mnemo = await createMnemo({
  embedding: {
    provider: 'openai-compatible',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  dbPath: './my-memory-db',
});
```

## Parameters

### `config.preset` (optional)

Use a preset instead of manual embedding config. Available: `"openai"`, `"ollama"`, `"voyage"`, `"jina"`.

Or omit both `preset` and `embedding` for auto-detection (checks `OPENAI_API_KEY` → `VOYAGE_API_KEY` → `JINA_API_KEY` → error).

### `config.embedding` (optional, overrides preset)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `"openai-compatible"` | — | Provider type |
| `apiKey` | `string` | — | API key (use `"ollama"` for local) |
| `baseURL` | `string?` | OpenAI URL | API endpoint |
| `model` | `string?` | `"text-embedding-3-small"` | Model name |
| `dimensions` | `number?` | `1024` | Vector dimensions |

### `config.dbPath` (required)

Path to the local database directory. Will be created if it doesn't exist.

### `config.storageBackend` (optional)

```typescript
type StorageBackend = "lancedb" | "qdrant" | "chroma" | "pgvector"
```

Default: `"lancedb"` (embedded, zero-config).

### `config.decay` (optional)

See [Weibull Decay](/guide/decay) for details.

### `config.retrieval` (optional)

See [Retrieval Pipeline](/guide/retrieval) for details.

## Errors

| Error | Cause |
|-------|-------|
| `mnemo: config is required` | No config passed |
| `mnemo: config.embedding is required` | Missing embedding config |
| `mnemo: config.embedding.apiKey is required` | Missing API key |
| `mnemo: config.dbPath is required` | Missing database path |
