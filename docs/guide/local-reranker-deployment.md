# Mnemo 本地 Reranker 部署指南

> 使用 Ollama + FastAPI Proxy 实现本地 Cross-Encoder Reranker

## 背景

Mnemo 支持 Cross-Encoder Reranker 来提升检索精度，但 Ollama 原生不支持 `/api/rerank` 端点。本方案通过 FastAPI 代理服务，利用 embedding magnitude 特性实现本地 Reranker。

## 方案架构

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Mnemo     │────▶│  FastAPI Proxy       │────▶│  Ollama             │
│  Retrieval  │     │  :18798/v1/rerank     │     │  :11434/api/embed   │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
                              │
                              ▼
                    magnitude-based scoring
                    (lower = more relevant)
```

## 原理说明

### 问题

Cross-Encoder 模型（如 BGE-reranker、Qwen3-Reranker）有一个 classification head 用于输出相关性分数。但 Ollama 只暴露 embedding 层，不暴露 classification head。

### Workaround

当使用 cross-encoder 模型处理 query+document 拼接文本时，**embedding 的 magnitude（L2 范数）与相关性呈反比**：

- **低 magnitude** → 高相关性
- **高 magnitude** → 低相关性

### 为什么会这样？

这是一个**未文档化的特性**，可能的原因：

1. Cross-Encoder 在处理相关文档时，embedding 向量更"紧凑"（各维度值更接近）
2. 处理无关文档时，模型产生更"发散"的 embedding

### 原始观测数据

| 文档相关性 | Embedding Magnitude |
|------------|---------------------|
| 高相关 | ~15-18（较低） |
| 中等相关 | ~20-24 |
| 无关 | ~25-30（较高） |

### 计算流程

1. 拼接 query 和 document：`"Query: {query}\n\nDocument: {doc}\n\nRelevance:"`
2. 调用 Ollama `/api/embeddings` 获取 embedding
3. 计算 embedding 的 L2 范数（magnitude）
4. **反转并归一化**到 0-1 范围（使高分 = 高相关）

### 分数转换公式

为了让输出符合直觉（**高分 = 高相关**），代码做了反转处理：

```python
# 典型阈值（BGE-reranker-v2-m3）
typical_good_magnitude = 15.0   # 高相关文档的 magnitude
typical_poor_magnitude = 25.0   # 无关文档的 magnitude

# 反转计算：低 magnitude → 高 score
score = (typical_poor_magnitude - magnitude) / (typical_poor_magnitude - typical_good_magnitude)

# 示例：
# magnitude = 15 → score = (25-15)/(25-15) = 1.0  → 高分 = 高相关 ✓
# magnitude = 25 → score = (25-25)/(25-15) = 0.0  → 低分 = 无关 ✓
```

### 实际测试示例

```
Query: "什么是机器学习?"

| 文档内容 | Magnitude | Score | 判断 |
|---------|-----------|-------|------|
| "机器学习是人工智能的一个子集" | 16.21 | 0.88 | 高相关 ✓ |
| "神经网络用于深度学习" | 19.28 | 0.57 | 中等相关 ✓ |
| "今天天气晴朗" | 29.44 | 0.00 | 无关 ✓ |
```

**结论**：最终输出的 Score 符合直觉 —— **越高越相关** ✨

### 局限性

| 方面 | 说明 |
|------|------|
| **准确度** | 比原生 cross-encoder 低 30-50% |
| **模型依赖** | magnitude 范围因模型而异，需校准 |
| **性能** | 每个 document 需要一次 API 调用 |
| **理论依据** | 利用未文档化的相关性，非设计行为 |

## 部署步骤

### 1. 准备 Ollama Reranker 模型

```bash
# 拉取 BGE-reranker-v2-m3 模型
ollama pull dengcao/bge-reranker-v2-m3

# 验证模型可用
ollama list | grep rerank
# 输出: dengcao/bge-reranker-v2-m3:latest    abf5c6d8bc56    1.2 GB
```

### 2. 部署 FastAPI 代理服务

```bash
# 创建服务目录
mkdir -p ~/.local/share/ollama-reranker

# 下载源码（从 ollama-utils 项目）
git clone --depth 1 https://github.com/overcuriousity/ollama-utils.git /tmp/ollama-utils
cp /tmp/ollama-utils/plugins/reranking-endpoint/* ~/.local/share/ollama-reranker/

# 创建虚拟环境并安装依赖
cd ~/.local/share/ollama-reranker
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install numpy
```

### 3. 启动服务

```bash
# 前台运行（用于测试）
cd ~/.local/share/ollama-reranker && .venv/bin/python api.py

# 后台运行（推荐）
cd ~/.local/share/ollama-reranker && nohup .venv/bin/python api.py > /tmp/reranker.log 2>&1 &
```

### 4. 验证服务

```bash
# 健康检查
curl -s http://localhost:18798/health | jq .

# 输出:
# {
#   "status": "healthy",
#   "service": "ollama-cross-encoder-reranker",
#   "supported_models": "BGE-reranker, Qwen3-Reranker, etc.",
#   "method": "concatenation + magnitude workaround"
# }

# 功能测试
curl -s -X POST http://localhost:18798/v1/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dengcao/bge-reranker-v2-m3:latest",
    "query": "什么是机器学习?",
    "documents": [
      "机器学习是人工智能的一个子集。",
      "今天的天气晴朗。",
      "神经网络用于深度学习。"
    ],
    "top_n": 3
  }' | jq .
```

## Mnemo 配置

### 配置文件 (`~/.mnemo/mnemo.json`)

```json
{
  "plugins": {
    "entries": {
      "memory-lancedb-pro": {
        "enabled": true,
        "config": {
          "embedding": {
            "provider": "openai-compatible",
            "apiKey": "ollama",
            "model": "dengcao/bge-m3:567m",
            "baseURL": "http://localhost:11434/v1",
            "dimensions": 1024
          },
          "llm": {
            "apiKey": "ollama",
            "model": "qwen3.5:9b",
            "baseURL": "http://localhost:11434/v1"
          },
          "retrieval": {
            "mode": "hybrid",
            "vectorWeight": 0.7,
            "bm25Weight": 0.3,
            "minScore": 0.3,
            "rerank": "cross-encoder",
            "rerankProvider": "ollama",
            "rerankEndpoint": "http://localhost:18798/v1/rerank",
            "rerankModel": "dengcao/bge-reranker-v2-m3:latest",
            "candidatePoolSize": 20
          }
        }
      }
    }
  }
}
```

### 关键配置项

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `rerank` | `"cross-encoder"` | 启用 cross-encoder reranking |
| `rerankProvider` | `"ollama"` | 使用 Ollama 后端 |
| `rerankEndpoint` | `"http://localhost:18798/v1/rerank"` | FastAPI 代理地址 |
| `rerankModel` | `"dengcao/bge-reranker-v2-m3:latest"` | Ollama 中的 reranker 模型 |

## 验证 Reranker 生效

### 通过 Mnemo 搜索验证

```bash
# 使用 MCP 工具搜索
# 结果应标记为 "vector+reranked"
```

示例输出：
```
Found 3 memories:

1. [xxx] [fact:global] 机器学习是人工智能的一个分支... (77%, vector+reranked)
2. [xxx] [fact:global] 深度学习是机器学习的一个子领域... (70%, vector+reranked)
```

### 查看服务日志

```bash
tail -f /tmp/reranker.log

# 输出示例:
# 2026-03-25 12:28:30 - INFO - Reranking 5 documents (workaround method)
# 2026-03-25 12:28:30 - INFO - Query: 什么是机器学习？...
# 2026-03-25 12:28:31 - INFO - Raw magnitude: 20.51
# 2026-03-25 12:28:31 - INFO - Top 5 scores: ['0.7206', '0.6583', '0.4493', '0.3251', '0.0000']
```

## 服务管理

### 创建 systemd 服务（可选）

```bash
# 创建服务文件
cat > ~/.config/systemd/user/mnemo-reranker.service << 'EOF'
[Unit]
Description=Mnemo Local Reranker Service
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/.local/share/ollama-reranker
ExecStart=%h/.local/share/ollama-reranker/.venv/bin/python api.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

# 启用并启动服务
systemctl --user daemon-reload
systemctl --user enable mnemo-reranker
systemctl --user start mnemo-reranker
```

### 手动管理命令

```bash
# 启动
cd ~/.local/share/ollama-reranker && nohup .venv/bin/python api.py > /tmp/reranker.log 2>&1 &

# 停止
pkill -f "python api.py"

# 查看状态
curl -s http://localhost:18798/health

# 查看日志
tail -f /tmp/reranker.log
```

## 模型校准

不同模型的 magnitude 范围不同，需要校准：

### BGE-reranker-v2-m3

```python
# 在 api.py 中调整
typical_good_magnitude = 15.0   # 高相关文档
typical_poor_magnitude = 25.0   # 无关文档
```

### 校准方法

1. 启用 magnitude 日志
2. 用已知相关/无关文档测试
3. 观察并记录 magnitude 分布
4. 调整 `typical_good_magnitude` 和 `typical_poor_magnitude`

## 替代方案

### 方案对比

| 方案 | 准确度 | 资源占用 | 推荐场景 |
|------|--------|----------|----------|
| **Sentence-Transformers** | ⭐⭐⭐⭐⭐ | ~500MB RAM | 生产环境 |
| Ollama Workaround | ⭐⭐⭐ | 复用 Ollama | 开发测试 |
| SiliconFlow | ⭐⭐⭐⭐ | 云端 | 无本地资源 |
| Jina AI | ⭐⭐⭐⭐ | 云端 | 无本地资源 |

### 1. Sentence-Transformers（生产推荐）

使用正确的 classification head，准确度比 Ollama workaround 高 30-50%。

#### 部署步骤

```bash
# 创建目录
mkdir -p ~/.local/share/sentence-reranker

# 创建虚拟环境
cd ~/.local/share/sentence-reranker
python3 -m venv .venv

# 安装依赖
.venv/bin/pip install fastapi uvicorn sentence-transformers torch

# 下载服务脚本（或手动创建）
# 见下方 reranker.py
```

#### 创建 `~/.local/share/sentence-reranker/reranker.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import CrossEncoder
from functools import lru_cache

app = FastAPI(title="Sentence-Transformers Reranker")

class RerankRequest(BaseModel):
    model: str
    query: str
    documents: List[str]
    top_n: Optional[int] = 3

class RerankResult(BaseModel):
    index: int
    relevance_score: float
    document: Optional[str] = None

@lru_cache(maxsize=4)
def get_model(name: str) -> CrossEncoder:
    return CrossEncoder(name, max_length=512)

@app.post("/v1/rerank")
async def rerank(req: RerankRequest):
    model = get_model(req.model)
    pairs = [(req.query, doc) for doc in req.documents]
    scores = model.predict(pairs)

    results = [
        {"index": i, "relevance_score": float(s), "document": req.documents[i]}
        for i, s in enumerate(scores)
    ]
    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return {"results": results[:req.top_n]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18797)
```

#### 启动服务

```bash
# 设置 HuggingFace 镜像（中国大陆）
export HF_ENDPOINT=https://hf-mirror.com

# 启动服务
cd ~/.local/share/sentence-reranker
.venv/bin/python reranker.py
```

#### Mnemo 配置

```json
{
  "retrieval": {
    "rerank": "cross-encoder",
    "rerankProvider": "ollama",
    "rerankEndpoint": "http://localhost:18797/v1/rerank",
    "rerankModel": "BAAI/bge-reranker-v2-m3"
  }
}
```

#### 支持的模型

| 模型 | 语言 | 特点 |
|------|------|------|
| `BAAI/bge-reranker-v2-m3` | 多语言 | 推荐，最佳准确度 |
| `BAAI/bge-reranker-base` | 英语 | 轻量，快速 |
| `jinaai/jina-reranker-v2-base-multilingual` | 多语言 | 长文本支持 |

### 2. SiliconFlow 免费层

```json
{
  "rerank": "cross-encoder",
  "rerankProvider": "siliconflow",
  "rerankApiKey": "sk-xxx",
  "rerankModel": "BAAI/bge-reranker-v2-m3"
}
```

### 3. Jina AI

```json
{
  "rerank": "cross-encoder",
  "rerankProvider": "jina",
  "rerankApiKey": "jina-xxx",
  "rerankModel": "jina-reranker-v2-base-multilingual"
}
```

## 故障排查

### Reranker 未被调用

1. 检查配置文件格式正确
2. 确认 `rerankProvider` 为 `"ollama"`
3. 重启 Mnemo MCP 服务器加载新配置

### 服务连接失败

```bash
# 检查服务是否运行
curl http://localhost:18798/health

# 检查端口是否被占用
lsof -i :18798

# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags
```

### 模型未找到

```bash
# 列出已安装模型
ollama list

# 拉取缺失的模型
ollama pull dengcao/bge-reranker-v2-m3
```

## 参考资料

- [Ollama Reranker Workaround 原理](https://medium.com/@rosgluk/reranking-documents-with-ollama-and-qwen3-reranker-model-in-go-6dc9c2fb5f0b)
- [BGE-reranker-v2-m3 模型](https://huggingface.co/BAAI/bge-reranker-v2-m3)
- [Mnemo 文档 - Reranking](https://docs.m-nemo.ai/guide/reranking.html)

---

*最后更新: 2026-03-25*