# Architecture Overview

Mnemo is a cognitive science-based AI memory framework with a layered architecture.

## Core Components

### Storage Layer

- **LanceDB** — Embedded vector database (default, zero-config). Supports pluggable backends: Qdrant, Chroma, PGVector.
- **Scope Isolation** — Per-agent namespaces with configurable cross-access rules.

### Retrieval Layer

- **Semantic Search** — Vector similarity matching
- **Keyword Search** — BM25 full-text index
- **Weibull Decay** — Stretched-exponential forgetting with tier-specific parameters
- **Dedup & Noise Filtering** — Embedding-based dedup + regex noise bank

### Extraction Layer

- **Smart Extraction** — LLM-powered 6-category memory extraction from conversations
- **Contradiction Detection** — Multi-layer detection for conflicting facts

## Pro Components

Mnemo Pro adds production-grade capabilities. See [Mnemo Pro](/pro) for details.

## Design Principles

1. **Cognitive science first** — Memory model based on established research, not ad-hoc engineering
2. **Every module earns its place** — Validated by [35 ablation tests](/guide/ablation)
3. **Graceful degradation** — Core works fully without Pro; Pro enhances, never gates
4. **Provider agnostic** — Bring your own embedding, LLM, and rerank providers
