# Mnemo OpenClaw 插件配置指南

> 认知科学记忆框架 — Weibull 衰变、三路检索、多作用域隔离

---

## 一、插件概述

Mnemo 是一个基于认知科学的 AI 记忆框架，核心特性包括：

- **Weibull 衰变模型** — 拉伸指数遗忘曲线 `exp(-(t/λ)^β)`
- **三路检索** — Vector + BM25 + Knowledge Graph 融合（RRF）
- **三层矛盾检测** — regex 信号 → LLM 5 分类 → 去重管道
- **十阶段检索管道** — 从预处理到上下文注入
- **多作用域隔离** — 按项目/客户/技术栈隔离记忆空间

### 核心包位置

```
packages/core/
├── openclaw.plugin.json    # 插件清单
├── package.json            # 包配置（含入口声明）
├── index.ts               # 插件入口点
└── src/
    ├── tools.ts           # 工具注册函数
    ├── store.ts           # 存储引擎
    ├── retriever.ts       # 检索引擎
    └── types/
        └── openclaw-plugin-sdk.d.ts  # SDK 类型声明
```

---

## 二、安装方法

### 方法 A: 从 npm 安装（推荐）

```bash
# 安装插件
openclaw plugins install @mnemoai/core

# 启用插件
openclaw plugins enable mnemo-memory
```

### 方法 B: 本地开发链接

```bash
# 构建核心包
cd /path/to/mnemo
npm run build --workspace=@mnemoai/core

# 链接到 OpenClaw（开发模式）
openclaw plugins install -l ./packages/core
```

### 方法 C: 配置文件启用

编辑 `~/.openclaw/config.json`：

```json
{
  "plugins": {
    "slots": {
      "memory": "mnemo-memory"
    },
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          // 配置项见下方
        }
      }
    }
  }
}
```

> **说明**：方法 A/B 是安装阶段，方法 C 是配置阶段，两者互补不冲突。

---

## 三、配置示例

### 3.1 OpenAI 配置

```json
{
  "plugins": {
    "slots": {
      "memory": "mnemo-memory"
    },
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          "embedding": {
            "provider": "openai-compatible",
            "apiKey": "${OPENAI_API_KEY}",
            "baseURL": "https://api.openai.com/v1",
            "model": "text-embedding-3-small"
          },
          "autoCapture": true,
          "autoRecall": true,
          "smartExtraction": true,
          "retrieval": {
            "mode": "hybrid",
            "rerank": "cross-encoder",
            "rerankApiKey": "${JINA_API_KEY}"
          }
        }
      }
    }
  }
}
```

### 3.2 Ollama 本地配置

```json
{
  "plugins": {
    "slots": {
      "memory": "mnemo-memory"
    },
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          "embedding": {
            "provider": "openai-compatible",
            "apiKey": "ollama",
            "baseURL": "http://localhost:11434/v1",
            "model": "dengcao/bge-m3:567m",
            "dimensions": 1024
          },
          "llm": {
            "baseURL": "http://localhost:11434/v1",
            "model": "qwen3.5:9b"
          },
          "autoCapture": true,
          "autoRecall": true,
          "smartExtraction": true,
          "dbPath": "~/.openclaw/memory/mnemo"
        }
      }
    }
  }
}
```

### 3.3 其他 Embedding 提供商

#### Jina AI

```json
{
  "embedding": {
    "provider": "openai-compatible",
    "apiKey": "${JINA_API_KEY}",
    "baseURL": "https://api.jina.ai/v1",
    "model": "jina-embeddings-v3",
    "dimensions": 1024,
    "taskQuery": "retrieval.query",
    "taskPassage": "retrieval.passage",
    "normalized": true
  }
}
```

#### Voyage AI

```json
{
  "embedding": {
    "provider": "openai-compatible",
    "apiKey": "${VOYAGE_API_KEY}",
    "baseURL": "https://api.voyageai.com/v1",
    "model": "voyage-3-large",
    "dimensions": 1024
  }
}
```

#### SiliconFlow（国内推荐）

```json
{
  "embedding": {
    "provider": "openai-compatible",
    "apiKey": "${SILICONFLOW_API_KEY}",
    "baseURL": "https://api.siliconflow.cn/v1",
    "model": "BAAI/bge-m3",
    "dimensions": 1024
  }
}
```

---

## 四、配置选项详解

### 4.1 Embedding 配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `provider` | string | `openai-compatible` | 提供商类型（固定值） |
| `apiKey` | string | - | API 密钥（必填，支持环境变量 `${VAR}`） |
| `baseURL` | string | OpenAI | API 端点 URL |
| `model` | string | `text-embedding-3-small` | Embedding 模型名称 |
| `dimensions` | integer | 自动 | 向量维度（可选，部分模型支持） |
| `taskQuery` | string | - | 查询任务类型（Jina 专用） |
| `taskPassage` | string | - | 文档任务类型（Jina 专用） |
| `normalized` | boolean | - | 是否归一化（Jina v5 专用） |
| `chunking` | boolean | `true` | 自动分块超长文档 |

### 4.2 核心功能配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dbPath` | string | `~/.openclaw/memory/mnemo` | 数据库存储路径 |
| `autoCapture` | boolean | `true` | 自动捕获对话中的记忆 |
| `autoRecall` | boolean | `false` | 自动召回相关记忆注入上下文 |
| `autoRecallMinLength` | integer | `15` | 触发自动召回的最小提示长度 |
| `captureAssistant` | boolean | `false` | 是否捕获 AI 响应 |
| `smartExtraction` | boolean | `true` | 启用 LLM 智能提取 |
| `enableManagementTools` | boolean | `false` | 启用管理工具（list, stats） |

### 4.3 检索配置 (`retrieval`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | string | `hybrid` | 检索模式：`hybrid`（向量+BM25）或 `vector` |
| `vectorWeight` | number | `0.7` | 向量检索权重（hybrid 模式） |
| `bm25Weight` | number | `0.3` | BM25 检索权重（hybrid 模式） |
| `minScore` | number | `0.3` | 最低相关性阈值 |
| `hardMinScore` | number | `0.35` | 硬性截断阈值 |
| `rerank` | string | `cross-encoder` | 重排序模式：`cross-encoder`/`lightweight`/`none` |
| `rerankApiKey` | string | - | 重排序 API 密钥 |
| `rerankModel` | string | `jina-reranker-v3` | 重排序模型 |
| `rerankEndpoint` | string | Jina | 重排序 API 端点 |
| `rerankProvider` | string | `jina` | 重排序提供商：`jina`/`siliconflow`/`voyage`/`pinecone` |
| `candidatePoolSize` | integer | `20` | 候选池大小 |
| `recencyHalfLifeDays` | number | `14` | 新近度半衰期（天） |
| `recencyWeight` | number | `0.1` | 新近度权重 |
| `timeDecayHalfLifeDays` | number | `60` | 时间衰变半衰期 |
| `reinforcementFactor` | number | `0.5` | 访问强化因子 |
| `lengthNormAnchor` | integer | `500` | 长度归一化锚点 |

### 4.4 衰变配置 (`decay`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `recencyHalfLifeDays` | number | `30` | 衰变半衰期基础值 |
| `recencyWeight` | number | `0.4` | 新近度权重 |
| `frequencyWeight` | number | `0.3` | 访问频率权重 |
| `intrinsicWeight` | number | `0.3` | 内在重要性权重 |
| `betaCore` | number | `0.8` | 核心记忆 Weibull β |
| `betaWorking` | number | `1.0` | 工作记忆 Weibull β |
| `betaPeripheral` | number | `1.3` | 外围记忆 Weibull β |

### 4.5 记忆层级配置 (`tier`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `coreAccessThreshold` | integer | `10` | 核心记忆访问次数阈值 |
| `coreCompositeThreshold` | number | `0.7` | 核心记忆综合分数阈值 |
| `coreImportanceThreshold` | number | `0.8` | 核心记忆重要性阈值 |
| `workingAccessThreshold` | integer | `3` | 工作记忆访问次数阈值 |
| `workingCompositeThreshold` | number | `0.4` | 工作记忆综合分数阈值 |

### 4.6 LLM 配置（智能提取用）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `llm.apiKey` | string | - | LLM API 密钥（默认使用 embedding.apiKey） |
| `llm.baseURL` | string | - | LLM API 端点（默认使用 embedding.baseURL） |
| `llm.model` | string | `openai/gpt-oss-120b` | LLM 模型名称 |

### 4.7 多作用域配置 (`scopes`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `scopes.default` | string | `global` | 默认作用域 |
| `scopes.definitions` | object | - | 自定义作用域定义 |
| `scopes.agentAccess` | object | - | Agent 访问权限映射 |

**作用域配置示例：**

```json
{
  "scopes": {
    "default": "global",
    "definitions": {
      "project-alpha": { "description": "Project Alpha specific memories" },
      "client-acme": { "description": "ACME client memories" },
      "typescript-projects": { "description": "TypeScript tech stack memories" }
    },
    "agentAccess": {
      "project-alpha-agent": ["project-alpha", "global"],
      "general-agent": ["global"]
    }
  }
}
```

---

## 五、已注册工具

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `memory_store` | 存储记忆条目 | `text`, `category?`, `importance?`, `scope?` |
| `memory_search` | 混合检索记忆 | `query`, `limit?`, `scope?`, `category?` |
| `memory_update` | 更新现有记忆 | `id`, `text?`, `importance?` |
| `memory_forget` | 删除记忆 | `id` |
| `memory_stats` | 获取统计信息 | - |
| `memory_list` | 列出近期记忆 | `limit?`, `scope?`, `category?` |
| `self_improvement_log` | 记录学习/错误条目 | `type`, `summary`, `details?` |
| `self_improvement_extract_skill` | 从学习提取技能 | `learningId`, `skillName` |
| `self_improvement_review` | 治理回溯摘要 | - |

---

## 六、生命周期钩子

Mnemo 插件通过 OpenClaw 的生命周期钩子实现自动化：

| 事件 | 触发时机 | Mnemo 功能 |
|------|----------|------------|
| `message:received` | 用户消息到达时 | Auto-Recall（自动召回） |
| `message:sent` | AI 响应发送后 | Auto-Capture（自动捕获） |
| `session:compact:before` | 会话压缩前 | Compact-Capture（压缩前捕获） |

### 钩子工作流程

```
用户消息 ──▶ message:received ──▶ 检索相关记忆 ──▶ 注入上下文
                                           │
                                           ▼
AI 生成响应 ──▶ message:sent ──▶ 提取记忆 ──▶ 存储到数据库
                                           │
                                           ▼
会话压缩 ──▶ session:compact:before ──▶ 深度扫描 ──▶ 最后机会捕获
```

---

## 七、禁用功能配置

### 7.1 禁用自动捕获（保留手动工具）

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "autoCapture": false,
          "autoRecall": false
        }
      }
    }
  }
}
```

### 7.2 禁用智能提取（使用正则匹配）

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "smartExtraction": false
        }
      }
    }
  }
}
```

### 7.3 完全禁用插件

```json
{
  "plugins": {
    "slots": {
      "memory": "none"
    },
    "entries": {
      "mnemo-memory": {
        "enabled": false
      }
    }
  }
}
```

---

## 八、CLI 参考

```bash
# 查看插件列表
openclaw plugins list

# 查看插件详情
openclaw plugins inspect mnemo-memory

# 启用/禁用插件
openclaw plugins enable mnemo-memory
openclaw plugins disable mnemo-memory

# 更新插件
openclaw plugins update mnemo-memory

# 诊断插件状态
openclaw plugins doctor
```

---

## 九、发布到 ClawHub

```bash
# 1. 构建并打包
cd /path/to/mnemo
npm run build --workspace=@mnemoai/core
npm pack

# 2. 发布到 ClawHub（需要账号）
openclaw plugins publish @mnemoai/core

# 或发布到 npm
npm publish --access public
```

---

## 十、故障排查

### 10.1 插件未加载

```bash
# 检查插件状态
openclaw plugins doctor

# 确认配置正确
openclaw plugins inspect mnemo-memory --json
```

### 10.2 Embedding 连接失败

- 检查 `baseURL` 是否正确
- 验证 API Key 有效性
- 确认模型名称正确

### 10.3 记忆未存储

- 确认 `autoCapture: true`
- 检查 `smartExtraction` 模型是否可用
- 查看 Gateway 日志：`openclaw gateway logs`

### 10.4 记忆未召回

- 确认 `autoRecall: true`
- 检查提示长度是否达到 `autoRecallMinLength`
- 验证检索配置 `minScore` 阈值

---

## 十一、相关链接

- **官网**: https://m-nemo.ai
- **文档**: https://docs.m-nemo.ai
- **GitHub**: https://github.com/Methux/mnemo
- **npm**: @mnemoai/core
- **OpenClaw 文档**: https://docs.openclaw.ai/plugins

---

*最后更新: 2026-03-26*