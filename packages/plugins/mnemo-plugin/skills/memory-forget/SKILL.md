---
name: memory-forget
description: Delete a specific memory by ID. Use when you want to remove outdated or incorrect information from memory.
---

# Memory Forget

Delete a memory from your long-term store.

## Usage

```
/memory-forget <memory-id>
```

## Arguments

- `memory-id` - The ID of the memory to delete (required, can be full UUID or 8+ char prefix)

## Implementation

Use the MCP tool `memory_delete`:

```typescript
await mcp__mnemo_memory__memory_delete({
  memoryId: "<memory-id>"
});
```

Confirm the deletion was successful.
