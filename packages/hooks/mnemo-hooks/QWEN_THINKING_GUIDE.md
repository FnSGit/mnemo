# Qwen Thinking 模式控制指南

> 本文档说明如何在 Mnemo Hooks 中正确处理 Qwen 系列模型的 thinking/reasoning 行为

## 背景

Qwen 系列模型具有 **thinking（推理）** 功能，会在输出内容前生成 `thinking` 字段的推理过程。这对于复杂推理任务很有用，但在自动化 JSON 提取场景中会导致问题：

1. **Token 预算消耗** - thinking 内容会占用 `num_predict` 配额
2. **内容截断** - 当 thinking 消耗过多 token 时，实际内容可能被截断
3. **解析失败** - 空内容或截断的 JSON 导致提取失败

## Qwen 模型对比

| 模型系列 | Thinking 控制 | API 参数 | 说明 |
|---------|--------------|----------|------|
| **Qwen3-2507-Instruct** | 无 thinking | - | 默认不生成 thinking |
| **Qwen3-2507-Thinking** | 强制 thinking | - | 始终生成 thinking |
| **Qwen3-2504** | 可切换 | `enable_thinking=False` | 支持 chat template 控制 |
| **Qwen3.5** | 部分支持 | `/no_think` 指令 | thinking 仍会生成，但行为不同 |

## Qwen3.5:9b 的特殊情况

### 测试结果

```bash
# 不使用 /no_think
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3.5:9b",
  "messages": [{"role": "user", "content": "Return JSON: {\"status\": \"ok\"}"}],
  "stream": false,
  "options": {"num_predict": 256}
}'
# 结果: content 有内容, thinking 有 ~435 字符

# 使用 /no_think
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3.5:9b",
  "messages": [{"role": "user", "content": "/no_think\nReturn JSON: {\"status\": \"ok\"}"}],
  "stream": false,
  "options": {"num_predict": 256}
}'
# 结果: content 有内容, thinking 有 ~430 字符 (几乎相同!)
```

### 关键发现

1. **`/no_think` 不能完全禁用 thinking** - thinking 字段仍会生成
2. **`think: false` API 参数会导致空内容** - 不适用于 Qwen3.5
3. **解决方案是增加 token 预算** - 给 thinking 和内容都留足够空间

## 解决方案

### 方案 1：增加 Token 预算 + 改进解析（推荐）

适用于 Qwen3.5:9b 等不完全支持 thinking 控制的模型。

```javascript
async function extractMemories(message) {
  const prompt = `...instructions...

IMPORTANT: Output ONLY the JSON array, no other text.`;

  const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3.5:9b",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 4096,  // 关键：足够的预算给 thinking + 内容
      },
    }),
  });

  const data = await resp.json();
  const text = data.message?.content ?? "";

  // 多模式 JSON 提取
  return extractJSON(text);
}

function extractJSON(text) {
  // Pattern 1: 直接 JSON 数组
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }

  // Pattern 2: 代码块中的 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const cleaned = codeBlockMatch[1].trim();
      const jsonArrayMatch = cleaned.match(/\[[\s\S]*?\]/);
      if (jsonArrayMatch) {
        return JSON.parse(jsonArrayMatch[0]);
      }
    } catch {}
  }

  return null;
}
```

### 方案 2：使用 Qwen3 模型

适用于需要精确 thinking 控制的场景。

```bash
# 安装 Qwen3 模型
ollama pull qwen3:8b

# 更新环境变量
OLLAMA_MODEL=qwen3:8b
```

#### Qwen3 Thinking 控制

```javascript
// 方法 1: chat template 参数（推荐）
const messages = tokenizer.apply_chat_template(
  conversation,
  { enable_thinking: false }  // 禁用 thinking
);

// 方法 2: 指令控制
const prompt = `/no_think
Your instructions here...`;

// 方法 3: Ollama 设置
// 在交互模式中: /set nothink
```

## 配置建议

### 按 Token 预算配置

| 场景 | num_predict | 说明 |
|------|-------------|------|
| 简单提取（1-3 条记忆） | 2048 | 基础场景 |
| 标准提取（3-5 条记忆） | 4096 | 推荐默认值 |
| 深度提取（compact-capture） | 8192 | 完整对话扫描 |

### 按模型选择配置

```javascript
// Qwen3.5:9b 配置（当前使用）
const OLLAMA_MODEL = "qwen3.5:9b";
const NUM_PREDICT = 4096;  // 需要较大预算

// Qwen3:8b 配置（推荐升级）
const OLLAMA_MODEL = "qwen3:8b";
const NUM_PREDICT = 2048;  // thinking 可控，预算可较小

// Qwen3-Instruct-2507（最佳选择）
const OLLAMA_MODEL = "qwen3:8b-instruct";  // 无 thinking
const NUM_PREDICT = 1024;  // 最小预算需求
```

## 故障排查

### 问题：LLM 提取返回空数组或失败

**检查步骤：**

1. 测试 Ollama API 直接响应
   ```bash
   curl http://localhost:11434/api/chat -d '{
     "model": "qwen3.5:9b",
     "messages": [{"role": "user", "content": "Return JSON: {\"test\": 1}"}],
     "stream": false,
     "options": {"num_predict": 256}
   }' | jq '.message.content, (.message.thinking | length)'
   ```

2. 如果 `content` 为空但 `thinking` 有内容 → **增加 num_predict**

3. 如果 `content` 有内容但解析失败 → **检查 JSON 提取逻辑**

### 问题：Hook 执行超时

**可能原因：**
- LLM 推理时间过长
- Token 预算过大导致生成缓慢

**解决方案：**
```json
// 在 settings.json 中调整 timeout
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node .../auto-capture.js",
        "timeout": 60  // 增加到 60 秒
      }]
    }]
  }
}
```

### 问题：Regex 回退频繁触发

**原因：** LLM 提取失败，自动降级到正则匹配

**检查日志：**
```
[mnemo-auto-capture] LLM extraction failed: ..., falling back to regex
```

**解决：** 检查 `num_predict` 是否足够，或升级到 Qwen3 模型

## 参考链接

- [Qwen3 GitHub](https://github.com/QwenLM/Qwen3) - 官方文档
- [Ollama Qwen3](https://ollama.com/library/qwen3) - Ollama 模型卡片
- [Qwen3.5 Blog](https://qwen.ai/blog?id=qwen3.5) - 发布说明

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-25 | 1.0 | 初始文档，基于 Qwen3.5:9b 测试结果 |