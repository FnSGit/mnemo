# Mnemo Memory Hooks for Claude Code

> Auto-capture and auto-recall capabilities via Claude Code hooks

## Features

| Hook | Event | Function |
|------|-------|----------|
| **Auto Capture** | `Stop` | Extract and store memorable information after each conversation turn |
| **Auto Recall** | `SessionStart` | Inject relevant memories at session start |
| **Compact Capture** | `PreCompact` | Deep extraction before context compaction |

## Quick Setup

### Option 1: Add to settings.json (Recommended)

Add this to your `~/.claude/settings.json`:

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
            "command": "node \"/path/to/mnemo/packages/hooks/mnemo-hooks/auto-capture.js\"",
            "async": true,
            "timeout": 30
          }
        ],
        "description": "Mnemo: Auto-capture memorable information"
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/mnemo/packages/hooks/mnemo-hooks/auto-recall.js\""
          }
        ],
        "description": "Mnemo: Inject relevant memories at session start"
      }
    ],
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/mnemo/packages/hooks/mnemo-hooks/compact-capture.js\"",
            "async": true,
            "timeout": 60
          }
        ],
        "description": "Mnemo: Deep extraction before compaction"
      }
    ]
  }
}
```

### Option 2: Project-level hooks

Copy `hooks.project.json` to `.claude/hooks.json` in your project:

```bash
mkdir -p .claude
cp packages/hooks/mnemo-hooks/hooks.project.json .claude/hooks.json
```

### Prerequisites

1. **Build Mnemo Core**: The hooks require the built Mnemo library
   ```bash
   npm run build --workspace=@mnemoai/core
   ```

2. **Ollama**: Install and run Ollama with embedding model
   ```bash
   ollama pull dengcao/bge-m3:567m
   ollama pull qwen3.5:9b  # For LLM extraction
   ollama serve
   ```

3. **Node.js**: Required for running hook scripts (ESM support)

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MNEMO_AUTO_CAPTURE` | `true` | Enable auto-capture |
| `MNEMO_AUTO_RECALL` | `true` | Enable auto-recall |
| `MNEMO_MIN_IMPORTANCE` | `0.55` | Minimum importance threshold |
| `MNEMO_DEDUP_THRESHOLD` | `0.88` | Duplicate detection threshold |
| `MNEMO_RECALL_LIMIT` | `5` | Max memories to inject |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `qwen3.5:9b` | Ollama model for extraction |

## Hook Details

### auto-capture.js

Fires after each AI response (`Stop` event). Analyzes the conversation for:

- User preferences (`preference` category)
- Decisions made (`decision` category)
- Important facts/numbers/versions (`fact` category)
- Named entities (`entity` category)

Features:
- LLM-powered extraction via Ollama (`/no_think` prompt for qwen3.5)
- Regex fallback when LLM fails
- Noise filtering (greetings, meta-questions, agent denials)
- Direct Mnemo library integration (no MCP CLI needed)

### auto-recall.js

Fires at session start (`SessionStart` event). Queries memory for:

- User preferences relevant to the project
- Recent decisions
- Important facts about the codebase

Injects memories as a system context block:

```xml
<relevant-memories>
### PREFERENCE
- User prefers TypeScript strict mode
- User likes using uv for Python package management

### DECISION
- Project uses Biome for formatting (migrated from Prettier)
</relevant-memories>
```

### compact-capture.js

Fires before context compaction (`PreCompact` event). Performs deep extraction:

- Scans the entire transcript
- Captures all operation details, numbers, versions
- Last chance to preserve conversation before compression

## Trigger Patterns (Regex)

Auto-capture triggers on these patterns:

### Chinese
```
记住|記一下|別忘了|備註
偏好|喜歡|討厭|習慣
決定|選擇了|改用|以後用
我的...是|叫我
老是|總是|從不|每次都
重要|關鍵|注意|千萬別
```

### English
```
remember|prefer|decided|we'll use|going forward
i (like|prefer|hate|love|want|need)
always|never|important
```

## Noise Filtering

These patterns are **NOT** stored:

```
# Agent denials
I don't have any memory...
I'm not sure about...

# Meta-questions about memory
Do you remember...
Did I tell you...
你还记得...

# Session boilerplate
hi, hello, new session, HEARTBEAT

# Memory management commands
delete my memory, 清理记忆
```

## Testing

Test auto-capture manually:

```bash
# Build core first
npm run build --workspace=@mnemoai/core

# Run hook with test input
echo '{"last_assistant_message": "记住我偏好使用 TypeScript strict mode"}' | \
  node packages/hooks/mnemo-hooks/auto-capture.js
```

## Troubleshooting

### Hook not firing

1. Check Claude Code version supports hooks
2. Verify hook is registered in `settings.json`
3. Check stderr output: `claude --debug hooks`

### Memory not stored

1. Ensure Mnemo core is built: `npm run build --workspace=@mnemoai/core`
2. Check Ollama is running: `ollama list`
3. Check log output in stderr

### LLM extraction fails

1. Check Ollama model is available: `ollama pull qwen3.5:9b`
2. The hook will fallback to regex extraction automatically
3. Check `OLLAMA_BASE_URL` is correct

### Embedding errors

1. Ensure embedding model is pulled: `ollama pull dengcao/bge-m3:567m`
2. Test Ollama embeddings: `curl http://localhost:11434/v1/embeddings -d '{"model":"dengcao/bge-m3:567m","input":"test"}'`

### Qwen Thinking Mode Issues

If you see "LLM extraction failed" or empty content:

1. **Qwen3.5:9b** has thinking enabled by default and `/no_think` doesn't fully disable it
2. **Solution**: Increase `num_predict` to 4096+ to give enough budget for thinking + content
3. **Alternative**: Use `qwen3:8b` which supports proper thinking control

See [QWEN_THINKING_GUIDE.md](./QWEN_THINKING_GUIDE.md) for detailed documentation on Qwen thinking mode handling.

## Comparison with OpenClaw Plugin

| Feature | OpenClaw Plugin | Claude Code Hooks |
|---------|-----------------|-------------------|
| Auto-capture | `message:sent` event | `Stop` event |
| Auto-recall | `before_agent_start` | `SessionStart` |
| Deep extraction | `compact:before` | `PreCompact` |
| LLM extraction | Built-in | Via Ollama |
| Scope isolation | Full support | Basic support |
| Direct library | MCP required | Direct Mnemo import |

## License

MIT (core hooks) / Commercial (advanced extraction)