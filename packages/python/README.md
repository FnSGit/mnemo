# mnemoai

Python SDK for [Mnemo](https://m-nemo.ai) — AI memory that forgets intelligently.

## Installation

```bash
pip install mnemo-memory
```

## Prerequisites

Start the Mnemo server:

```bash
npx @mnemoai/server
# or with OpenAI:
OPENAI_API_KEY=sk-... npx @mnemoai/server
```

## Quick Start

```python
from mnemo import MnemoClient

client = MnemoClient()  # connects to http://localhost:18100

# Store memories
client.store("User prefers dark mode", category="preference")
client.store("User is a backend engineer at Acme Corp", category="fact")

# Recall
results = client.recall("What does the user do?")
for memory in results:
    print(f"[{memory.score:.2f}] {memory.text}")

# Stats
stats = client.stats()
print(f"Total memories: {stats.totalEntries}")

# Delete
client.delete("memory-id")

# Cleanup
client.close()
```

## Context Manager

```python
with MnemoClient() as client:
    client.store("User likes Python")
    results = client.recall("programming language preferences")
```

## Configuration

```python
client = MnemoClient(
    base_url="http://localhost:8080",  # custom server URL
    timeout=60.0,                      # request timeout in seconds
)
```

## API

| Method | Description |
|--------|-------------|
| `client.store(text, category?, importance?, scope?)` | Store a memory |
| `client.recall(query, limit?, scope_filter?, category?)` | Recall memories |
| `client.delete(memory_id)` | Delete a memory |
| `client.stats()` | Get statistics |
| `client.health()` | Health check |

## Types

```python
from mnemo import Memory, RecallResult, Stats, MemoryCategory
```

- `MemoryCategory`: `"preference" | "fact" | "decision" | "entity" | "other" | "reflection"`
- `Memory`: `text`, `score`, `category`, `importance`, `timestamp`
- `Stats`: `totalEntries`, `scopeCounts`, `categoryCounts`

## Links

- [Documentation](https://docs.m-nemo.ai)
- [GitHub](https://github.com/Methux/mnemo)
- [npm: @mnemoai/core](https://www.npmjs.com/package/@mnemoai/core)
- [npm: @mnemoai/server](https://www.npmjs.com/package/@mnemoai/server)
