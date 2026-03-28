---
name: memory-stats
description: Show memory statistics and usage information. Use when you want to see how many memories are stored, database size, or breakdown by category/scope.
---

# Memory Statistics

Display statistics about your memory database.

## Usage

```
/memory-stats [--scope=<scope>]
```

## Options

- `--scope` - Filter by specific scope (optional)

## Output

- Total memory count
- Breakdown by category
- Breakdown by scope
- Database size

## Implementation

Use the MCP tool `memory_stats`:

```typescript
const stats = await mcp__mnemo_memory__memory_stats({
  scope: "<scope>"
});
```

Display the statistics in a formatted table.
