---
name: memory-store
description: Save important information in long-term memory. Use for preferences, facts, decisions, and other notable information that should be remembered.
---

# Memory Store

Save information to your long-term memory.

## Usage

```
/memory-store <text> [--scope=<scope>] [--category=<category>] [--importance=<n>]
```

## Arguments

- `text` - The information to remember (required)
- `--scope` - Memory scope for isolation (optional, defaults to global)
- `--category` - Category: preference, fact, decision, entity, other (optional, default: other)
- `--importance` - Importance score 0-1, default 0.7 (optional)

## Implementation

Use the MCP tool `memory_store`:

```typescript
await mcp__mnemo_memory__memory_store({
  text: "<information to remember>",
  scope: "<scope>",
  category: "fact",
  importance: 0.8
});
```

Confirm the memory was stored successfully.
