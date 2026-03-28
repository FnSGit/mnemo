# MNEMO_SCOPE 记忆隔离配置指南

> 本文档描述了 Mnemo 记忆系统的 Scope 隔离功能实现方案，支持多项目独立记忆空间。

---

## 概述

### 问题背景

在多项目开发环境中，所有记忆默认存储在 `global` scope 中，导致：

1. **跨项目污染** — 不同项目的记忆互相干扰
2. **检索精准度下降** — 不相关的项目记忆被召回
3. **无法按项目隔离** — 项目特定知识混在一起

### 解决方案

通过 `MNEMO_SCOPE` 环境变量实现项目级记忆隔离：

- **存储隔离** — 每个项目使用独立的 scope 存储记忆
- **检索可控** — 可访问项目 scope + 全局共享记忆
- **配置简单** — 一行环境变量即可配置

---

## 设计原则

### Scope 层级

```
┌─────────────────────────────────────────────────────────────┐
│                      Memory Scopes                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  mnemoai    │  │  project-A  │  │  project-B  │         │
│  │  (项目隔离)  │  │  (项目隔离)  │  │  (项目隔离)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                  │
│                          ▼                                  │
│              ┌─────────────────────┐                        │
│              │       global        │                        │
│              │    (全局共享记忆)    │                        │
│              └─────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 访问规则

| 操作 | Scope | 说明 |
|------|-------|------|
| **存储** | 项目 scope（第一个） | 新记忆存入项目专属空间 |
| **检索** | 项目 scope + global | 可访问项目记忆 + 全局共享 |
| **隔离** | 项目 scope 之间互不可见 | 不同项目记忆完全隔离 |

---

## 配置方式

### 方式一：项目级环境变量（推荐）

在项目根目录创建 `.claude/settings.local.json`：

```json
{
  "env": {
    "MNEMO_SCOPE": "mnemoai"
  }
}
```

### 方式二：多 Scope 格式

支持管道符分隔的多个 scope：

```json
{
  "env": {
    "MNEMO_SCOPE": "mnemoai|claude|memory"
  }
}
```

解析规则：
- 第一个 scope (`mnemoai`) 用于存储
- 所有 scope 用于检索
- `global` 自动包含，无需显式指定

### 方式三：全局配置文件

在 `~/.mnemo/mnemo.json` 中配置：

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "scopes": {
            "default": "my-project"
          }
        }
      }
    }
  }
}
```

> ⚠️ **注意**：全局配置不建议硬编码项目 scope，否则所有项目会共享同一个 scope。

---

## 实现细节

### 核心文件

| 文件 | 职责 |
|------|------|
| `packages/core/src/config.ts` | MNEMO_SCOPE 解析、配置加载 |
| `packages/core/src/scopes.ts` | Scope 管理器、访问控制 |
| `packages/core/src/mcp-server.ts` | MCP 服务集成 |

### 配置解析流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 检查 MNEMO_SCOPE 环境变量                                │
│     │                                                       │
│     ├── 有值 → 解析为 { defaultScope, accessibleScopes }    │
│     │         └── 自动包含 "global"                         │
│     │                                                       │
│     └── 无值 → 读取配置文件                                  │
│               │                                             │
│               ├── ~/.mnemo/mnemo.json                       │
│               └── scopes.default + global                   │
│                                                             │
│  2. 创建 ScopeManager                                       │
│     └── 初始化 accessibleScopes 列表                        │
│                                                             │
│  3. 存储操作                                                 │
│     └── 使用 getDefaultScope() 返回的 scope                 │
│                                                             │
│  4. 检索操作                                                 │
│     └── 使用 getAccessibleScopes() 返回的 scope 列表        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 关键代码

#### MNEMO_SCOPE 解析

```typescript
// packages/core/src/config.ts

/**
 * Parse MNEMO_SCOPE environment variable.
 * Format: "scope1|scope2|scope3" (pipe-separated)
 * - First scope is used as default for storage
 * - All scopes are accessible for retrieval
 * - "global" is always included for retrieval (no need to specify)
 */
export function parseMNEMO_SCOPE(envValue: string | undefined): {
  defaultScope: string;
  accessibleScopes: string[];
} | null {
  if (!envValue || envValue.trim() === "") {
    return null;
  }

  const scopes = envValue
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (scopes.length === 0) {
    return null;
  }

  // Always include "global" in accessible scopes
  const accessibleScopes = [...new Set([...scopes, "global"])];

  return {
    defaultScope: scopes[0],
    accessibleScopes,
  };
}
```

#### ScopeManager 集成

```typescript
// packages/core/src/scopes.ts

export class MemoryScopeManager implements ScopeManager {
  private config: ScopeConfig;

  getAccessibleScopes(agentId?: string): string[] {
    // If accessibleScopes is explicitly set (from MNEMO_SCOPE), use it
    if (this.config.accessibleScopes && this.config.accessibleScopes.length > 0) {
      return this.config.accessibleScopes;
    }
    // ... fallback to definitions
  }

  isAccessible(scope: string, agentId?: string): boolean {
    // If accessibleScopes is set, check against it directly
    if (this.config.accessibleScopes && this.config.accessibleScopes.length > 0) {
      return this.config.accessibleScopes.includes(scope);
    }
    // ... fallback to validation
  }
}
```

---

## 本地插件开发流程

### 目录结构

```
~/.claude/plugins/
├── marketplaces/
│   └── local-marketplace/
│       └── mnemo-plugin → /path/to/project/packages/plugins/mnemo-plugin (符号链接)
└── cache/
    └── local-marketplace/
        └── mnemo-plugin/
            └── 0.3.0/  (复制的构建产物)
```

### 开发工作流

```bash
# 1. 修改项目代码
vim packages/core/src/config.ts
vim packages/core/src/scopes.ts

# 2. 构建 core 包
cd packages/core && npm run build

# 3. 构建 MCP 插件
cd packages/plugins/mnemo-plugin && npm run build

# 4. 在 Claude Code 中操作
#    /plugins → 移除 mnemo-plugin
#    /plugins → 从 local-marketplace 安装 mnemo-plugin

# 5. 验证效果
/memory-stats
/memory-store --text "测试记忆隔离"
/memory-list
```

### Marketplace 符号链接优势

```bash
# 创建符号链接（一次性设置）
ln -s /path/to/project/packages/plugins/mnemo-plugin \
      ~/.claude/plugins/marketplaces/local-marketplace/mnemo-plugin
```

优势：
- 修改项目代码后无需手动同步到 marketplace
- 仅需重新构建和重新安装插件即可

---

## 使用示例

### 示例 1：单项目隔离

```bash
# .claude/settings.local.json
{
  "env": {
    "MNEMO_SCOPE": "mnemoai"
  }
}
```

效果：
- 存储：`mnemoai`
- 检索：`mnemoai` + `global`

### 示例 2：多项目协作

```bash
# 项目 A: .claude/settings.local.json
{
  "env": {
    "MNEMO_SCOPE": "project-a"
  }
}

# 项目 B: .claude/settings.local.json
{
  "env": {
    "MNEMO_SCOPE": "project-b"
  }
}
```

效果：
- 项目 A 存储/检索：`project-a` + `global`
- 项目 B 存储/检索：`project-b` + `global`
- A 和 B 的记忆完全隔离

### 示例 3：共享多个 Scope

```bash
# .claude/settings.local.json
{
  "env": {
    "MNEMO_SCOPE": "claude|memory"
  }
}
```

效果：
- 存储：`claude`
- 检索：`claude` + `memory` + `global`

---

## 测试验证

### 单元测试

```bash
cd packages/core
node --test test/mnemo-scope.test.mjs
```

测试覆盖：
- ✅ MNEMO_SCOPE 解析（单 scope、多 scope、空值）
- ✅ `global` 自动包含
- ✅ ScopeManager 配置优先级
- ✅ 访问控制验证

### 集成验证

```bash
# 1. 检查统计
/memory-stats

# 预期输出：
# Available scopes: 2 (mnemoai, global)

# 2. 存储测试
/memory-store --text "测试记忆" --category fact

# 预期输出：
# Stored: "测试记忆" in scope 'mnemoai'

# 3. 检索测试
/memory-search --query "测试"

# 预期：同时返回 mnemoai 和 global scope 的记忆
```

---

## 配置最佳实践

### ✅ 推荐

```json
// 项目级配置 .claude/settings.local.json
{
  "env": {
    "MNEMO_SCOPE": "project-name"
  }
}

// 全局配置 ~/.mnemo/mnemo.json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          // 不设置 scopes，让 MNEMO_SCOPE 控制
        }
      }
    }
  }
}
```

### ❌ 不推荐

```json
// 全局配置硬编码项目 scope
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "scopes": {
            "default": "my-project"  // 所有项目都会使用这个 scope！
          }
        }
      }
    }
  }
}
```

---

## 常见问题

### Q1: 为什么存储到了 global 而不是项目 scope？

**可能原因**：
1. MCP 插件未更新 — 需要重新构建并安装
2. 环境变量未生效 — 检查 `.claude/settings.local.json`
3. 使用了旧版配置 — 移除 `definitions` 和 `agentAccess`

### Q2: 如何查看当前生效的 scope？

```bash
/memory-stats
# 查看 "Available scopes" 行
```

### Q3: 如何迁移旧记忆到新 scope？

```bash
# 1. 导出旧记忆
/memory-search --query "" --limit 100 > old_memories.txt

# 2. 手动重新存储到新 scope
# (通过代码或手动操作)

# 3. 清理旧记忆
/memory-forget --id <memory-id>
```

### Q4: 多个 scope 的优先级？

存储：第一个 scope
检索：所有 scope 并行检索，按相关性排序

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.1.0 | 2026-03-28 | 新增 MNEMO_SCOPE 环境变量支持 |
| 1.0.0 | - | 初始 scope 实现（definitions + agentAccess） |

---

## 相关文档

- [Mnemo 项目 CLAUDE.md](../../../CLAUDE.md)
- [Core 包文档](../../packages/core/CLAUDE.md)
- [MCP Server 文档](../../packages/core/src/mcp-server.ts)

---

*文档生成时间: 2026-03-28*