name: claude-code-plugin-dev
description: Claude Code 插件开发完整指南 - 从创建 marketplace 到调试部署的全流程
triggers:
  - "创建插件"
  - "开发插件"
  - "plugin 开发"
  - "新建 marketplace"
  - "插件调试"
  - "插件安装失败"
---

# Claude Code 插件开发指南

## 概述

Claude Code 插件系统允许通过自定义命令、代理、钩子和 MCP 服务器扩展功能。本指南涵盖从创建到部署的完整流程。

## 核心概念

### 插件结构

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # 插件元数据（必需）
├── commands/              # 自定义斜杠命令（可选）
│   └── example.md
├── agents/                # 自定义代理（可选）
│   └── helper.md
├── hooks/                 # 事件处理器（可选）
│   └── hooks.json
├── skills/                # 技能定义（可选）
│   └── my-skill.md
└── .mcp.json              # MCP 服务器配置（可选）
```

### Marketplace 结构

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json   # 市场清单（必需）
├── plugin-a/              # 插件目录
│   └── .claude-plugin/
│       └── plugin.json
├── plugin-b/
│   └── ...
└── shared-plugin -> /path/to/plugin  # 符号链接支持
```

## 关键配置文件

### 1. marketplace.json

```json
{
  "name": "my-marketplace",           // ⚠️ 必须与配置引用一致
  "owner": {
    "name": "Your Name",
    "url": "https://example.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugin-dir",        // 相对路径或符号链接
      "description": "Plugin description"
    }
  ]
}
```

### 2. plugin.json

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin.json",
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Author Name",
    "url": "https://example.com"
  },
  "keywords": ["tag1", "tag2"],
  "env": {
    "OPTIONAL_ENV": {
      "description": "Environment variable description",
      "default": "default_value"
    }
  }
}
```

## 创建流程

### 步骤 1: 创建 Marketplace

```bash
mkdir -p my-marketplace/.claude-plugin
mkdir my-marketplace/my-plugin
```

### 步骤 2: 创建 Marketplace 清单

```bash
cat > my-marketplace/.claude-plugin/marketplace.json << 'EOF'
{
  "name": "my-marketplace",
  "owner": { "name": "Developer" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./my-plugin",
      "description": "My first plugin"
    }
  ]
}
EOF
```

### 步骤 3: 创建插件清单

```bash
mkdir -p my-marketplace/my-plugin/.claude-plugin
cat > my-marketplace/my-plugin/.claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "A simple plugin"
}
EOF
```

### 步骤 4: 添加命令

```bash
mkdir -p my-marketplace/my-plugin/commands
cat > my-marketplace/my-plugin/commands/hello.md << 'EOF'
---
description: Greet the user
---

Greet the user warmly and offer assistance.
EOF
```

### 步骤 5: 安装测试

```bash
# 在 Claude Code 中执行
/plugin marketplace add ./my-marketplace
/plugin install my-plugin@my-marketplace
```

## 配置管理

### settings.json 关键字段

```json
{
  "enabledPlugins": {
    "plugin-name@marketplace-name": true    // 启用的插件
  },
  "extraKnownMarketplaces": {
    "marketplace-name": {
      "source": {
        "source": "directory",              // directory | github | git | file
        "path": "/absolute/path/to/marketplace"
      }
    }
  }
}
```

### 已安装插件记录

位置: `~/.claude/plugins/installed_plugins.json`

```json
{
  "version": 2,
  "plugins": {
    "plugin-name@marketplace-name": [
      {
        "scope": "user",
        "installPath": "~/.claude/plugins/cache/marketplace-name/plugin-name/version",
        "version": "1.0.0",
        "installedAt": "2026-03-27T12:00:00.000Z"
      }
    ]
  }
}
```

### Marketplace 注册

位置: `~/.claude/plugins/known_marketplaces.json`

```json
{
  "marketplace-name": {
    "source": {
      "source": "directory",
      "path": "/path/to/marketplace"
    },
    "installLocation": "/path/to/marketplace",
    "lastUpdated": "2026-03-27T12:00:00.000Z"
  }
}
```

## 常见问题排查

### 问题 1: Plugin 'xxx' not found in marketplace 'yyy'

**原因**: `enabledPlugins` 中引用的 marketplace 名称与 `known_marketplaces.json` 或 `marketplace.json` 中定义的名称不一致。

**排查步骤**:

1. 检查 `marketplace.json` 中的 `name` 字段
2. 检查 `~/.claude/settings.json` 中 `enabledPlugins` 的引用格式: `plugin-name@marketplace-name`
3. 检查 `~/.claude/plugins/known_marketplaces.json` 中是否有该 marketplace
4. 确保 `extraKnownMarketplaces` 中的 key 与 marketplace 名称一致

**解决方案**:

```bash
# 统一所有配置中的 marketplace 名称
# 1. marketplace.json
"name": "my-marketplace"

# 2. settings.json - enabledPlugins
"my-plugin@my-marketplace": true

# 3. settings.json - extraKnownMarketplaces
"my-marketplace": { ... }

# 4. known_marketplaces.json
"my-marketplace": { ... }
```

### 问题 2: 插件安装后命令不可用

**排查**:
1. 确认插件已启用: `enabledPlugins` 中有 `plugin-name@marketplace-name: true`
2. 重启 Claude Code
3. 运行 `/help` 检查命令是否列出

### 问题 3: Marketplace 添加失败

**排查**:
1. 确认路径正确（使用绝对路径或相对于当前目录的正确路径）
2. 确认 `.claude-plugin/marketplace.json` 存在且格式正确
3. 检查 JSON 语法

### 问题 4: Plugin directory does not exist

**错误信息**:
```
PreCompact [...] failed: Plugin directory does not exist:
~/.claude/plugins/cache/<marketplace>/<plugin>/<version>
```

**原因**: 插件缓存过期或不同步，常见于：
- 插件版本更新后缓存未刷新
- 手动修改了插件代码
- 插件卸载后配置仍引用

**解决方案**:

```bash
# 方法 1: 重建插件缓存（推荐）
# 在 Claude Code 中执行:
/plugin

# 方法 2: 手动清理后重装
rm -rf ~/.claude/plugins/cache/<marketplace>/<plugin>
# 然后运行 /plugin

# 方法 3: 完全重置缓存
rm -rf ~/.claude/plugins/cache/
# 然后运行 /plugin 重新安装所有插件
```

**预防措施**:
- 修改插件代码后运行 `/plugin` 刷新缓存
- 保持 `plugin.json` 中版本号与实际同步
- 使用符号链接时确保目标路径有效

## 重命名 Marketplace

当需要重命名 marketplace 时，必须同步更新以下文件：

```bash
# 1. 更新 marketplace.json
sed -i 's/"old-name"/"new-name"/g' marketplace/.claude-plugin/marketplace.json

# 2. 更新 settings.json
# - enabledPlugins: "plugin@old-name" → "plugin@new-name"
# - extraKnownMarketplaces: key 更新

# 3. 更新 known_marketplaces.json
# - key 更新

# 4. 更新 installed_plugins.json
# - key 和 installPath 更新

# 5. 重命名缓存目录
mv ~/.claude/plugins/cache/old-name ~/.claude/plugins/cache/new-name
```

## 团队协作配置

### 仓库级配置

在项目根目录创建 `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "team-plugins": {
      "source": {
        "source": "github",
        "repo": "org/team-claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "formatter@team-plugins": true,
    "linter@team-plugins": true
  }
}
```

团队成员信任仓库后，插件自动安装。

## 最佳实践

### 目录命名
- Marketplace 名称应简洁、有意义
- 支持多个插件时使用通用的组织名称（如 `local-marketplace`）
- 使用符号链接管理共享插件

### 版本管理
- 在 `plugin.json` 中使用语义版本
- 更新插件后同步更新版本号

### 文档
- 每个插件包含 `README.md`
- 说明安装、配置和使用方法

### 测试流程
1. 本地创建 dev-marketplace
2. 开发并测试插件
3. 卸载重装验证
4. 在干净环境中测试安装

## 相关命令

```bash
# Marketplace 管理
/plugin marketplace add ./path/to/marketplace
/plugin marketplace add owner/repo
/plugin marketplace list
/plugin marketplace remove marketplace-name

# 插件管理
/plugin                                    # 交互式菜单
/plugin install plugin-name@marketplace    # 安装
/plugin enable plugin-name@marketplace     # 启用
/plugin disable plugin-name@marketplace    # 禁用
/plugin uninstall plugin-name@marketplace  # 卸载

# 验证
/help                                      # 查看可用命令
```

## 参考资源

- [官方插件参考文档](https://docs.claude.com/en/docs/claude-code/plugins-reference)
- [插件市场文档](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [斜杠命令](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [子代理](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [钩子](https://docs.claude.com/en/docs/claude-code/hooks)
- [MCP 集成](https://docs.claude.com/en/docs/claude-code/mcp)