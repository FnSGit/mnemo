# Mnemo 本地 Reranker 部署指南

> 使用 Sentence-Transformers Cross-Encoder 实现高精度本地 Reranker

## 背景

Mnemo 支持 Cross-Encoder Reranker 来显著提升检索精度。本文档介绍如何部署本地 Reranker 服务，以及 Mnemo Plugin 如何自动管理该服务。

## 方案架构

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Mnemo     │────▶│  Sentence-Transformers│────▶│  HuggingFace Cache  │
│  Retrieval  │     │  :18797/v1/rerank     │     │  ~/.cache/huggingface│
└─────────────┘     └──────────────────────┘     └─────────────────────┘
                              │
                              ▼
                    Cross-Encoder Classification Head
                    (正确实现，准确度最高)
```

## 方案对比

| 方案 | 准确度 | 资源占用 | 推荐场景 |
|------|--------|----------|----------|
| **Sentence-Transformers** | ⭐⭐⭐⭐⭐ | ~2.2GB | 生产环境（推荐） |
| SiliconFlow | ⭐⭐⭐⭐ | 云端 | 无本地资源 |
| Jina AI | ⭐⭐⭐⭐ | 云端 | 无本地资源 |

## 部署步骤

### 1. 创建项目目录

```bash
mkdir -p ~/.local/share/sentence-reranker
cd ~/.local/share/sentence-reranker
```

### 2. 初始化项目（推荐使用 uv）

```bash
# 使用 uv 初始化
uv init --python 3.14
uv add fastapi uvicorn sentence-transformers torch

# 或使用传统 venv
python3 -m venv .venv
.venv/bin/pip install fastapi uvicorn sentence-transformers torch
```

### 3. 创建 Reranker 服务脚本

创建 `~/.local/share/sentence-reranker/reranker.py`：

```python
"""
Sentence-Transformers Cross-Encoder Reranker Service

A production-ready reranker using the correct classification head.
Much more accurate than workarounds.

Usage:
    pip install fastapi uvicorn sentence-transformers
    python reranker.py

API:
    POST /v1/rerank
    {
        "model": "BAAI/bge-reranker-v2-m3",
        "query": "What is machine learning?",
        "documents": ["doc1", "doc2", ...],
        "top_n": 5
    }
"""

import logging
from typing import List, Optional
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import CrossEncoder

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sentence-Transformers Reranker API")


class RerankRequest(BaseModel):
    model: str
    query: str
    documents: List[str]
    top_n: Optional[int] = 3


class RerankResult(BaseModel):
    index: int
    relevance_score: float
    document: Optional[str] = None


class RerankResponse(BaseModel):
    results: List[RerankResult]


# Model cache to avoid reloading
@lru_cache(maxsize=4)
def get_model(model_name: str) -> CrossEncoder:
    """Load and cache CrossEncoder model."""
    logger.info(f"Loading model: {model_name}")
    model = CrossEncoder(model_name, max_length=512)
    logger.info(f"Model loaded: {model_name}")
    return model


# Supported models with their default max_length
SUPPORTED_MODELS = {
    "BAAI/bge-reranker-v2-m3": {"max_length": 512, "description": "Multilingual, best accuracy"},
    "BAAI/bge-reranker-base": {"max_length": 512, "description": "English only, faster"},
    "BAAI/bge-reranker-large": {"max_length": 512, "description": "English only, better accuracy"},
    "cross-encoder/ms-marco-MiniLM-L-6-v2": {"max_length": 512, "description": "Fast, English"},
    "cross-encoder/ms-marco-MiniLM-L-12-v2": {"max_length": 512, "description": "Better, English"},
    "jinaai/jina-reranker-v2-base-multilingual": {"max_length": 1024, "description": "Multilingual, fast"},
}


@app.on_event("startup")
async def startup():
    """Pre-load default model on startup."""
    default_model = "BAAI/bge-reranker-v2-m3"
    try:
        get_model(default_model)
        logger.info(f"Default model pre-loaded: {default_model}")
    except Exception as e:
        logger.warning(f"Could not pre-load default model: {e}")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "sentence-transformers-reranker",
        "supported_models": list(SUPPORTED_MODELS.keys()),
        "method": "cross-encoder classification head (correct implementation)",
    }


@app.post("/v1/rerank", response_model=RerankResponse)
async def rerank(request: RerankRequest):
    """Rerank documents by relevance to query."""
    if not request.documents:
        raise HTTPException(status_code=400, detail="No documents provided")

    try:
        model = get_model(request.model)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model not available: {request.model}")

    # Create query-document pairs
    pairs = [(request.query, doc) for doc in request.documents]

    # Get relevance scores
    scores = model.predict(pairs)

    # Build results
    results = [
        RerankResult(
            index=i,
            relevance_score=float(s),
            document=request.documents[i]
        )
        for i, s in enumerate(scores)
    ]

    # Sort by score (descending)
    results.sort(key=lambda x: x.relevance_score, reverse=True)

    return RerankResponse(results=results[:request.top_n])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18797)
```

### 4. 创建管理脚本

创建 `~/.local/share/sentence-reranker/reranker.sh`：

```bash
#!/bin/bash
# Sentence-Transformers Reranker Service Manager

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/sentence-reranker.log"
PID_FILE="/tmp/sentence-reranker.pid"
PORT=18797

# HuggingFace mirror for China
export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Service already running (PID: $(cat $PID_FILE))"
        return 1
    fi

    echo "Starting Sentence-Transformers Reranker..."
    cd "$SCRIPT_DIR"
    nohup uv run python reranker.py > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 5
    if curl -s "http://localhost:$PORT/health" > /dev/null; then
        echo "✓ Service started on http://localhost:$PORT"
        echo "  Log: $LOG_FILE"
    else
        echo "✗ Service failed to start. Check logs: $LOG_FILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Service not running"
        return 0
    fi

    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping service (PID: $PID)..."
        kill "$PID"
        rm -f "$PID_FILE"
        echo "✓ Service stopped"
    else
        echo "Service not running (stale PID file)"
        rm -f "$PID_FILE"
    fi
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Service running (PID: $(cat $PID_FILE))"
        curl -s "http://localhost:$PORT/health" | python3 -m json.tool 2>/dev/null || echo "Health check failed"
    else
        echo "Service not running"
    fi
}

logs() {
    tail -f "$LOG_FILE"
}

test_rerank() {
    echo "Testing rerank..."
    curl -s -X POST "http://localhost:$PORT/v1/rerank" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "BAAI/bge-reranker-v2-m3",
            "query": "什么是机器学习?",
            "documents": [
                "机器学习是人工智能的一个子集。",
                "今天的天气晴朗。",
                "神经网络用于深度学习。"
            ],
            "top_n": 3
        }' | python3 -m json.tool
}

case "${1:-help}" in
    start)   start ;;
    stop)    stop ;;
    restart) stop; start ;;
    status)  status ;;
    logs)    logs ;;
    test)    test_rerank ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        exit 1
        ;;
esac
```

```bash
chmod +x ~/.local/share/sentence-reranker/reranker.sh
```

### 5. 验证服务

```bash
# 启动服务
~/.local/share/sentence-reranker/reranker.sh start

# 健康检查
curl -s http://localhost:18797/health | jq .

# 输出:
# {
#   "status": "healthy",
#   "service": "sentence-transformers-reranker",
#   "supported_models": ["BAAI/bge-reranker-v2-m3", ...],
#   "method": "cross-encoder classification head (correct implementation)"
# }

# 功能测试
~/.local/share/sentence-reranker/reranker.sh test
```

## Mnemo Plugin 自动管理

Mnemo Plugin 支持自动管理本地 Reranker 服务。只需在 MCP 配置中启用即可。

### 配置方式

在 `~/.mnemo/mnemo.json` 中添加 `localReranker` 配置：

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          "localReranker": {
            "enabled": true,
            "path": "~/.local/share/sentence-reranker",
            "port": 18797
          },
          "retrieval": {
            "rerank": "cross-encoder",
            "rerankEndpoint": "http://localhost:18797/v1/rerank",
            "rerankModel": "BAAI/bge-reranker-v2-m3"
          }
        }
      }
    }
  }
}
```

### 工作流程

```
MCP 启动
    │
    ▼
检查 localReranker.enabled
    │
    ├─► false ──► 跳过，使用 cosine fallback
    │
    └─► true ──► 检查服务健康状态
                      │
                      ├─► 已运行 ──► 继续启动 MCP
                      │
                      └─► 未运行 ──► 检查安装状态
                                        │
                                        ├─► 已安装 ──► 启动服务
                                        │
                                        └─► 未安装 ──► 自动安装 ──► 启动服务
```

### 配置选项

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `false` | 启用本地 Reranker 自动管理 |
| `path` | `~/.local/share/sentence-reranker` | 安装目录 |
| `port` | `18797` | 服务端口 |

### 自动安装依赖

当 `localReranker.enabled` 为 `true` 且服务未安装时，插件会自动：

1. 创建安装目录
2. 生成 `reranker.py` 和 `reranker.sh`
3. 使用 `uv` 或 `pip` 安装依赖

### 禁用本地 Reranker

在配置中设置 `localReranker.enabled: false` 或直接移除该配置项：

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "config": {
          "localReranker": {
            "enabled": false
          }
        }
      }
    }
  }
}
```

禁用后，检索将使用 cosine 相似度作为 fallback，得分约 69%（vs 启用后的 95%）。

## Mnemo 配置

### 配置文件 (`~/.mnemo/mnemo.json`)

```json
{
  "plugins": {
    "entries": {
      "mnemo-memory": {
        "enabled": true,
        "config": {
          "retrieval": {
            "mode": "hybrid",
            "vectorWeight": 0.7,
            "bm25Weight": 0.3,
            "minScore": 0.3,
            "rerank": "cross-encoder",
            "rerankProvider": "ollama",
            "rerankEndpoint": "http://localhost:18797/v1/rerank",
            "rerankModel": "BAAI/bge-reranker-v2-m3",
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
| `rerankProvider` | `"ollama"` | 使用 OpenAI 兼容 API |
| `rerankEndpoint` | `"http://localhost:18797/v1/rerank"` | Reranker 服务地址 |
| `rerankModel` | `"BAAI/bge-reranker-v2-m3"` | 模型名称 |

## 检索质量提升

### 对比数据

| 模式 | 示例查询得分 | 提升幅度 |
|------|-------------|---------|
| 无 Rerank (cosine) | 69% | - |
| **有 Rerank (cross-encoder)** | **95%** | **+37%** |

### 示例输出

```
Found 3 memories:

1. [xxx] [preference:global] 用户偏好使用 TypeScript strict mode (95%, vector+reranked)
2. [xxx] [other:global] 用户偏好使用 TypeScript 进行后端开发... (90%, vector+reranked)
3. [xxx] [preference:global] 记住我偏好使用 TypeScript strict mode... (90%, vector+reranked)
```

## 支持的模型

| 模型 | 语言 | 特点 | 大小 |
|------|------|------|------|
| `BAAI/bge-reranker-v2-m3` | 多语言 | **推荐**，最佳准确度 | ~2.2GB |
| `BAAI/bge-reranker-base` | 英语 | 轻量，快速 | ~1.1GB |
| `BAAI/bge-reranker-large` | 英语 | 更高准确度 | ~1.3GB |
| `jinaai/jina-reranker-v2-base-multilingual` | 多语言 | 长文本支持 | ~1.4GB |

## 云端替代方案

### SiliconFlow

```json
{
  "retrieval": {
    "rerank": "cross-encoder",
    "rerankProvider": "siliconflow",
    "rerankApiKey": "sk-xxx",
    "rerankModel": "BAAI/bge-reranker-v2-m3"
  }
}
```

### Jina AI

```json
{
  "retrieval": {
    "rerank": "cross-encoder",
    "rerankProvider": "jina",
    "rerankApiKey": "jina-xxx",
    "rerankModel": "jina-reranker-v2-base-multilingual"
  }
}
```

## 故障排查

### 服务未启动

```bash
# 检查服务状态
~/.local/share/sentence-reranker/reranker.sh status

# 查看日志
tail -f /tmp/sentence-reranker.log
```

### 模型下载慢

```bash
# 使用 HuggingFace 镜像
export HF_ENDPOINT=https://hf-mirror.com

# 检查模型缓存
ls ~/.cache/huggingface/hub/models--BAAI--bge-reranker-v2-m3/
```

### 端口被占用

```bash
# 检查端口
lsof -i :18797

# 停止旧服务
~/.local/share/sentence-reranker/reranker.sh stop
```

## 参考资料

- [BGE-reranker-v2-m3 模型](https://huggingface.co/BAAI/bge-reranker-v2-m3)
- [Sentence-Transformers 文档](https://www.sbert.net/)
- [Mnemo Plugin 文档](../../packages/plugins/mnemo-plugin/README.md)

---

*最后更新: 2026-03-28*