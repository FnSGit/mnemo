---
name: memory-update
description: Update an existing memory in-place. Preserves original timestamp. Use when you need to correct or refine previously stored information.
---

# Memory Update

Update an existing memory's content, importance, or category without changing its timestamp.

## Usage

```
/memory-update <memory-id> [--text=<new-text>] [--importance=<n>] [--category=<category>]
```

## Arguments

- `memory-id` - ID of the memory to update (required, full UUID or 8+ char prefix)
- `--text` - New text content, triggers re-embedding (optional)
- `--importance` - New importance score 0-1 (optional)
- `--category` - New category: preference, fact, decision, entity, other (optional)

> **Note**: At least one of `--text`, `--importance`, or `--category` must be provided.

## Implementation

Use the MCP tool `memory_update`:

```typescript
await mcp__mnemo_memory__memory_update({
  memoryId: "<memory-id>",
  text: "<updated text content>",
  importance: 0.9,
  category: "fact"
});
```

## Examples

### Update text content
```
/memory-update abc12345 --text="User prefers dark mode with blue accent"
```

### Adjust importance
```
/memory-update abc12345 --importance=0.9
```

### Change category
```
/memory-update abc12345 --category=preference
```

### Update multiple fields
```
/memory-update abc12345 --text="Updated fact" --importance=0.8 --category=fact
```

## Notes

- The original timestamp is preserved when updating
- Updating text triggers re-embedding, which may affect search results
- If the memory is not found or you don't have access, an error will be returned