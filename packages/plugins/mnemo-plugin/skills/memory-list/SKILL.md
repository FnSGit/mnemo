---
name: memory-list
description: List recent memories with optional filtering by scope and category. Use when you want to browse recent stored memories.
---

# Memory List

List recent memories from your long-term store.

## Usage

```
/memory-list [--scope=<scope>] [--category=<category>] [--limit=<n>] [--offset=<n>]
```

## Arguments

- `--scope` - Filter by specific scope (optional)
- `--category` - Filter by category: preference, fact, decision, entity, other (optional)
- `--limit` - Max memories to list, default 10, max 50 (optional)
- `--offset` - Number of memories to skip for pagination (optional)

## Implementation

Use the MCP tool `memory_list`:

```typescript
const memories = await mcp__mnemo_memory__memory_list({
  scope: "<scope>",
  category: "<category>",
  limit: 20,
  offset: 0
});
```

Display the memories in a readable format.
