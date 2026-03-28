---
name: memory-search
description: Search through long-term memories using hybrid retrieval (vector + keyword search). Use when you need context about user preferences, past decisions, or previously discussed topics.
---

# Memory Search

Search through your long-term memory store.

## Usage

```
/memory-search <query> [--scope=<scope>] [--category=<category>] [--limit=<n>]
```

## Arguments

- `query` - The search query (required)
- `--scope` - Filter by scope (optional)
- `--category` - Filter by category: preference, fact, decision, entity, other (optional)
- `--limit` - Maximum results to return, default 5, max 20 (optional)

## Implementation

Use the MCP tool `memory_search`:

```typescript
const results = await mcp__mnemo_memory__memory_search({
  query: "<search query>",
  scope: "<scope>",
  category: "<category>",
  limit: 10
});
```

Display the results with relevance scores.
