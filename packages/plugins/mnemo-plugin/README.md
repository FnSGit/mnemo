# Mnemo Plugin for Claude Code

> AI Memory plugin with auto-capture and auto-recall capabilities

## Features

### Automatic Memory Management

| Hook | Event | Description |
|------|-------|-------------|
| **Auto Capture** | `Stop` | Extracts memorable info after each conversation turn |
| **Auto Recall** | `SessionStart` | Injects relevant memories at session start |
| **Compact Capture** | `PreCompact` | Deep extraction before context compaction |

### Manual Commands

| Command | Description |
|---------|-------------|
| `/memory-store` | Store a new memory manually |
| `/memory-search` | Search through stored memories |
| `/memory-list` | List recent memories |
| `/memory-stats` | Show memory statistics |
| `/memory-forget` | Delete a specific memory |
| `/memory-update` | Update an existing memory |

### MCP Tools

| Tool | Description |
|------|-------------|
| `memory_store` | Store a memory entry |
| `memory_search` | Hybrid search (vector + keyword) |
| `memory_list` | List recent memories |
| `memory_delete` | Delete a memory by ID |
| `memory_update` | Update an existing memory |
| `memory_stats` | Get memory statistics |

## Installation

### Quick Start (npx)

The fastest way to use Mnemo with Claude Code:

```bash
# 1. Pull required Ollama models
ollama pull dengcao/bge-m3:567m
ollama pull qwen3.5:9b

# 2. Add to your Claude Code config (~/.claude/settings.json)
```

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["@mnemoai/mnemo-plugin"]
    }
  }
}
```

That's it! Restart Claude Code and the memory system is ready.

### Verify Installation

```bash
# Check if the plugin runs
npx @mnemoai/claude-plugin --version

# Expected output:
# @mnemoai/claude-plugin v0.3.0
```

### Prerequisites

1. **Node.js** ≥ 18
2. **Ollama** running locally with:
   - Embedding model: `dengcao/bge-m3:567m`
   - LLM model: `qwen3.5:9b`

```bash
# Pull required models
ollama pull dengcao/bge-m3:567m
ollama pull qwen3.5:9b
```

### Setup Steps (Local Development)

```bash
# 1. Clone and build
git clone https://github.com/Methux/mnemo.git
cd mnemo

# 2. Install dependencies
npm install

# 3. Build the plugin bundle
npm run build --workspace=@mnemoai/claude-plugin

# 4. Link for local development
mkdir -p ~/.claude/plugins
ln -sf $(pwd)/packages/plugins/mnemo-plugin ~/.claude/plugins/mnemo-plugin
```

### Using in Other Projects

Once installed globally, the plugin works in ALL Claude Code projects automatically.

**Optional: Project-specific configuration**

Create `.claude/settings.json` in your project:

```json
{
  "env": {
    "MNEMO_AUTO_CAPTURE": "true",
    "MNEMO_AUTO_RECALL": "true",
    "MNEMO_RECALL_LIMIT": "5",
    "MNEMO_SCOPE": "my-project-name"
  }
}
```

**Per-project memory isolation:**

Set `MNEMO_SCOPE` to keep memories separate between projects:

```json
{
  "env": {
    "MNEMO_SCOPE": "project-alpha"
  }
}
```

| Scope Value | Effect |
|-------------|--------|
| `global` (default) | All projects share memories |
| `project-alpha` | Isolated memory space for this project |
| `client-acme` | Group memories by client |
| `typescript-projects` | Group memories by tech stack |

**Scope behavior:**
- **Storage**: Memories are tagged with the current scope
- **Recall**: Returns `global` memories + current scope memories

## Reranker Service

Mnemo uses a Cross-Encoder Reranker to significantly improve retrieval accuracy.

### Configuration-Driven Auto-Start

Enable local reranker in your `~/.mnemo/mnemo.json`:

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "localReranker": {
            "enabled": true,
            "path": "~/.local/share/sentence-reranker",
            "port": 18797
          }
        }
      }
    }
  }
}
```

When `localReranker.enabled` is `true`, the plugin will:
1. Check if reranker service is already running
2. If not, check if it's installed
3. If not installed, automatically install it
4. Start the service

### Retrieval Quality Improvement

| Mode | Score Example | Improvement |
|------|---------------|-------------|
| No Rerank (cosine) | 69% | - |
| **With Rerank** | **95%** | **+37%** |

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `false` | Enable local reranker auto-management |
| `path` | `~/.local/share/sentence-reranker` | Installation directory |
| `port` | `18797` | Service port |

### Manual Deployment

For advanced setup or troubleshooting, see: **[Local Reranker Deployment Guide](../../docs/guide/local-reranker-deployment.md)**

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MNEMO_AUTO_CAPTURE` | `true` | Enable auto-capture |
| `MNEMO_AUTO_RECALL` | `true` | Enable auto-recall |
| `MNEMO_COMPACT_CAPTURE` | `true` | Enable compact capture |
| `MNEMO_MIN_IMPORTANCE` | `0.55` | Minimum importance threshold |
| `MNEMO_DEDUP_THRESHOLD` | `0.88` | Duplicate detection threshold |
| `MNEMO_RECALL_LIMIT` | `5` | Max memories to inject |
| `MNEMO_SCOPE` | `global` | Memory isolation scope |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `qwen3.5:9b` | Model for extraction |

### MCP Configuration (`~/.mnemo/mnemo.json`)

| Option | Description |
|--------|-------------|
| `localReranker.enabled` | Enable local reranker auto-management |
| `localReranker.path` | Reranker installation directory |
| `localReranker.port` | Reranker service port |
| `retrieval.rerank` | Rerank mode: `cross-encoder`, `lightweight`, `none` |
| `retrieval.rerankEndpoint` | Reranker API endpoint |

## Disabling Features

### Feature Types

| Feature | Type | Disabling Method |
|---------|------|------------------|
| Auto Capture | Hook | `MNEMO_AUTO_CAPTURE="false"` |
| Auto Recall | Hook | `MNEMO_AUTO_RECALL="false"` |
| Compact Capture | Hook | `MNEMO_COMPACT_CAPTURE="false"` |
| `/memory-*` commands | Command | Disable entire plugin |
| `mcp__mnemo-memory` tools | MCP | Permission deny or disable plugin |

### Disable Hooks Only (Keep MCP Tools)

Add to project's `.claude/settings.json`:

```json
{
  "env": {
    "MNEMO_AUTO_CAPTURE": "false",
    "MNEMO_AUTO_RECALL": "false",
    "MNEMO_COMPACT_CAPTURE": "false"
  }
}
```

### Disable MCP Tools Only (Keep Hooks)

Add to project's `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": ["mcp__mnemo-memory"]
  }
}
```

### Disable Entire Plugin for a Project

Add to project's `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "mnemo-plugin@local": false
  }
}
```

### Common Scenarios

| Scenario | Configuration |
|----------|---------------|
| **Temporary debugging** | Disable all: `"enabledPlugins": { "mnemo-plugin@local": false }` |
| **Sensitive project** | Disable capture, keep recall: `"env": { "MNEMO_AUTO_CAPTURE": "false" }` |
| **Read-only mode** | Disable capture + MCP: `MNEMO_AUTO_CAPTURE="false"` + `"deny": ["mcp__mnemo-memory"]` |
| **Silent mode** | Disable all hooks: `MNEMO_AUTO_CAPTURE="false"`, `MNEMO_AUTO_RECALL="false"` |

### Manual settings.json

Add to `~/.claude/settings.json`:

```json
{
  "env": {
    "OLLAMA_BASE_URL": "http://localhost:11434",
    "OLLAMA_MODEL": "qwen3.5:9b"
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"<plugin-path>/hooks/auto-capture.js\"",
            "async": true,
            "timeout": 30
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"<plugin-path>/hooks/auto-recall.js\""
          }
        ]
      }
    ]
  }
}
```

## How It Works

### Auto Capture

1. Triggers after each AI response (`Stop` event)
2. Analyzes the conversation using LLM + regex patterns
3. Extracts:
   - **Preferences**: "I prefer TypeScript strict mode"
   - **Decisions**: "We decided to use Biome"
   - **Facts**: "API endpoint is /api/v2/users"
   - **Entities**: "Project name is MyProject"
4. Filters noise (greetings, meta-questions, agent denials)
5. Stores to Mnemo database

### Auto Recall

1. Triggers at session start (`SessionStart` event)
2. Detects project context (language, framework)
3. Queries memory for relevant information
4. Injects as context block:

```xml
<relevant-memories>
### PREFERENCE
- User prefers TypeScript strict mode
- User likes using uv for Python

### DECISION
- Project uses Biome for formatting
</relevant-memories>
```

### Compact Capture

1. Triggers before context compaction (`PreCompact`)
2. Scans entire transcript for important details
3. Last chance to capture before conversation is compressed
4. Prioritizes numbers, versions, file paths

## Trigger Patterns

### Chinese
```
记住|記一下|別忘了|偏好|喜歡|決定|改用|以後用
我的...是|叫我|老是|總是|重要|關鍵
```

### English
```
remember|prefer|decided|we'll use|going forward
I (like|prefer|hate|love|want|need)
always|never|important
```

## Noise Filtering

These patterns are **NOT** stored:
- Agent denials: "I don't have any memory..."
- Meta-questions: "Do you remember..."
- Session boilerplate: "hi", "hello", "new session"
- Memory commands: "delete my memory", "清理记忆"

## Troubleshooting

### "Plugin directory does not exist" Error

This error occurs during `PreCompact` hook execution when the plugin cache is stale or inconsistent.

**Root Cause:**
- Plugin cache directory (`~/.claude/plugins/cache/`) may be out of sync
- Happens after plugin updates or version changes

**Solution:**
```bash
# Reinstall the plugin to refresh cache
claude /plugin
```

This rebuilds the plugin cache with the correct directory structure.

**Alternative (Manual):**
```bash
# Remove and reinstall
rm -rf ~/.claude/plugins/cache/local-marketplace/mnemo-plugin
# Then run /plugin in Claude Code
```

### Hook not firing
- Check Claude Code version supports hooks
- Verify hook is registered in `settings.json`
- Run with debug: `claude --debug hooks`

### Memory not stored
- Ensure Mnemo core is built
- Check Ollama is running: `ollama list`
- Check stderr output for errors

### LLM extraction fails
- Verify model is available: `ollama pull qwen3.5:9b`
- Check `OLLAMA_BASE_URL` is correct
- Hook will fallback to regex extraction

### Reranker not starting
- Check `localReranker.enabled: true` in `~/.mnemo/mnemo.json`
- Verify Python 3.10+ is installed
- Check installation logs for dependency errors
- Manual install: see [Local Reranker Deployment](../../docs/guide/local-reranker-deployment.md)

### Reranker fallback to cosine
- Normal if `localReranker.enabled` is `false` or unset
- Scores will be lower (~69% vs ~95%)
- Enable local reranker in config for better accuracy

### npx command issues
- Ensure Node.js ≥ 18 is installed
- Try: `npm install -g @mnemoai/claude-plugin`
- Or use full path: `npx @mnemoai/claude-plugin`
- Check native dependencies: `npm install @lancedb/lancedb apache-arrow`

## OpenClaw Plugin

Mnemo also ships as a **native OpenClaw plugin** with deeper integration.

### Quick Start

```bash
# Install from npm
openclaw plugins install @mnemoai/core

# Enable the plugin
openclaw plugins enable mnemo-memory
```

### Configuration

```json
{
  "plugins": {
    "slots": { "memory": "mnemo-memory" },
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          "embedding": {
            "apiKey": "${OPENAI_API_KEY}",
            "model": "text-embedding-3-small"
          },
          "autoCapture": true,
          "autoRecall": true
        }
      }
    }
  }
}
```

**Full documentation**: [docs/OPENCLAW_PLUGIN.md](./docs/OPENCLAW_PLUGIN.md)

## License

MIT (core hooks) / Commercial (advanced extraction)

## Links

- **Documentation**: https://docs.m-nemo.ai
- **GitHub**: https://github.com/Methux/mnemo
- **npm**: @mnemoai/claude-plugin, @mnemoai/core
