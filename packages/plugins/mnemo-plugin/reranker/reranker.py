#!/usr/bin/env python3
"""
Sentence-Transformers Cross-Encoder Reranker Service

A production-ready reranker using the correct classification head.
Much more accurate than embedding magnitude workarounds.

Usage:
    uv run python reranker.py
    # or
    python reranker.py

API:
    POST /v1/rerank
    {
        "model": "BAAI/bge-reranker-v2-m3",
        "query": "What is machine learning?",
        "documents": ["doc1", "doc2", ...],
        "top_n": 5
    }

Environment:
    RERANKER_PORT - Service port (default: 18797)
    HF_ENDPOINT   - HuggingFace mirror (default: https://hf-mirror.com)
"""

import logging
import os
from typing import List, Optional
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import CrossEncoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sentence-Transformers Reranker API",
    description="Cross-Encoder Reranker for Mnemo",
    version="1.0.0"
)


# ============================================================================
# Request/Response Models
# ============================================================================

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


# ============================================================================
# Model Management
# ============================================================================

# Supported models with their configurations
SUPPORTED_MODELS = {
    "BAAI/bge-reranker-v2-m3": {
        "max_length": 512,
        "description": "Multilingual, best accuracy (recommended)"
    },
    "BAAI/bge-reranker-base": {
        "max_length": 512,
        "description": "English only, faster"
    },
    "BAAI/bge-reranker-large": {
        "max_length": 512,
        "description": "English only, better accuracy"
    },
    "cross-encoder/ms-marco-MiniLM-L-6-v2": {
        "max_length": 512,
        "description": "Fast, English"
    },
    "cross-encoder/ms-marco-MiniLM-L-12-v2": {
        "max_length": 512,
        "description": "Better, English"
    },
    "jinaai/jina-reranker-v2-base-multilingual": {
        "max_length": 1024,
        "description": "Multilingual, fast, long context"
    },
}


@lru_cache(maxsize=4)
def get_model(model_name: str) -> CrossEncoder:
    """Load and cache CrossEncoder model."""
    if model_name not in SUPPORTED_MODELS:
        logger.warning(f"Unknown model: {model_name}, using default config")

    max_length = SUPPORTED_MODELS.get(model_name, {}).get("max_length", 512)

    logger.info(f"Loading model: {model_name}")
    model = CrossEncoder(model_name, max_length=max_length)
    logger.info(f"Model loaded: {model_name}")

    return model


# ============================================================================
# API Endpoints
# ============================================================================

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
        "version": "1.0.0",
        "supported_models": list(SUPPORTED_MODELS.keys()),
        "method": "cross-encoder classification head",
    }


@app.get("/models")
def list_models():
    """List supported models."""
    return {
        "models": [
            {"name": name, **info}
            for name, info in SUPPORTED_MODELS.items()
        ]
    }


@app.post("/v1/rerank", response_model=RerankResponse)
async def rerank(request: RerankRequest):
    """
    Rerank documents by relevance to query.

    Uses Cross-Encoder for accurate relevance scoring.
    """
    if not request.documents:
        raise HTTPException(status_code=400, detail="No documents provided")

    if request.top_n <= 0 or request.top_n > len(request.documents):
        request.top_n = len(request.documents)

    try:
        model = get_model(request.model)
    except Exception as e:
        logger.error(f"Failed to load model {request.model}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Model not available: {request.model}"
        )

    # Create query-document pairs
    pairs = [(request.query, doc) for doc in request.documents]

    # Get relevance scores using Cross-Encoder
    scores = model.predict(pairs)

    # Build and sort results
    results = [
        RerankResult(
            index=i,
            relevance_score=float(s),
            document=request.documents[i]
        )
        for i, s in enumerate(scores)
    ]
    results.sort(key=lambda x: x.relevance_score, reverse=True)

    return RerankResponse(results=results[:request.top_n])


# ============================================================================
# Main Entry
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("RERANKER_PORT", 18797))
    host = os.environ.get("RERANKER_HOST", "0.0.0.0")

    logger.info(f"Starting Reranker service on {host}:{port}")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )