# Mnemo Hooks 实现方案

## 概述

本方案将 MCP 功能与 OpenClaw 插件功能对齐，通过 Claude Code Hooks 实现自动捕获和自动召回。

## 架构对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw 插件模式                              │
├─────────────────────────────────────────────────────────────────┤
│  message:sent ──► memory-extractor hook ──► /tools/invoke API   │
│  compact:before ──► deep extraction ──► store memories           │
│  before_agent_start ──► auto-recall ──► inject context          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Hooks 模式                        │
├─────────────────────────────────────────────────────────────────┤
│  Stop ──► auto-capture.js ──► MCP memory_store                   │
│  PreCompact ──► compact-capture.js ──► MCP memory_store          │
│  SessionStart ──► auto-recall.js ──► MCP memory_search          │
└─────────────────────────────────────────────────────────────────┘
```

## 文件结构

```
packages/hooks/mnemo-hooks/
├── hooks.json           # Hooks 配置文件
├── hooks.project.json   # 项目级配置
├── auto-capture.js      # 自动捕获脚本
├── auto-recall.js       # 自动召回脚本
├── compact-capture.js   # 压缩前捕获脚本
├── mcp-helpers.ts       # MCP 工具调用辅助
└── README.md            # 使用说明
```

## 核心功能

### 1. Auto Capture (自动捕获)

**触发时机**: 每次对话结束时 (`Stop` event)

**工作流程**:
1. 读取 `last_assistant_message` 字段
2. 使用 LLM 提取可记忆信息
3. 通过 MCP `memory_store` 存储
4. 自动去重和冲突检测

**触发模式**:
```javascript
// 中文触发词
/记住|記一下|別忘了|偏好|喜歡|決定|重要/

// 英文触发词
/remember|prefer|decided|always|never|important/
```

**噪声过滤**:
- Agent 否认回复
- 元问题 (关于记忆本身)
- 会话模板
- 记忆管理指令

### 2. Auto Recall (自动召回)

**触发时机**: 会话开始时 (`SessionStart` event)

**工作流程**:
1. 检测项目上下文 (语言、框架)
2. 构建 multiple queries
3. 调用 MCP `memory_search`
4. 格式化并注入上下文

**注入格式**:
```xml
<relevant-memories>
### PREFERENCE
- User prefers TypeScript strict mode

### DECISION
- Project uses Biome for formatting

### FACT
- API endpoint: /api/memories
</relevant-memories>
```

### 3. Compact Capture (压缩前捕获)

**触发时机**: 上下文压缩前 (`PreCompact` event)

**工作流程**:
1. 读取完整 transcript
2. LLM 深度提取
3. 存储所有重要信息

**特点**:
- 最后的捕获机会
- 全面扫描 (不限条数)
- 更低的 importance 阈值

## 配置方式

### 方式一: 全局配置

编辑 `~/.claude/settings.json`:

```json
{
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
        ]
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
        ]
      }
    ]
  }
}
```

### 方式二: 项目配置

```bash
mkdir -p .claude
cp packages/hooks/mnemo-hooks/hooks.project.json .claude/hooks.json
```

## 与 OpenClaw 插件的差异

| 特性 | OpenClaw 插件 | Claude Code Hooks |
|------|--------------|-------------------|
| 触发精度 | message:sent (消息级别) | Stop (对话级别) |
| 去重机制 | 内置 recall + LLM | 通过 MCP 调用 |
| 情景上下文 | 完整 (when/where/trigger) | 基础 |
| 作用域隔离 | 完整支持 | 基础支持 |
| 实体检测 | 动态 entity-map | 无 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MNEMO_AUTO_CAPTURE` | `true` | 启用自动捕获 |
| `MNEMO_AUTO_RECALL` | `true` | 启用自动召回 |
| `MNEMO_MIN_IMPORTANCE` | `0.55` | 最小重要性阈值 |
| `MNEMO_DEDUP_THRESHOLD` | `0.88` | 去重阈值 |
| `MNEMO_RECALL_LIMIT` | `5` | 最大召回数量 |
| `ANTHROPIC_API_KEY` | - | LLM 提取必需 |

## 调试

```bash
# 启用调试日志
claude --debug hooks

# 测试 auto-capture
echo '{"last_assistant_message": "记住我偏好使用 TypeScript"}' | \
  node packages/hooks/mnemo-hooks/auto-capture.js

# 测试 auto-recall
echo '{"cwd": "/path/to/project"}' | \
  node packages/hooks/mnemo-hooks/auto-recall.js
```

## 已知限制

1. **MCP 调用**: 当前通过 `claude mcp call` CLI，性能有限
2. **异步执行**: Stop hook 是异步的，可能丢失最后的对话
3. **上下文注入**: SessionStart 输出需要 Claude Code 支持

## 未来改进

1. [ ] 直接 MCP stdio 通信
2. [ ] 更完整的情景上下文提取
3. [ ] 实体检测集成
4. [ ] 更智能的召回查询构建