#!/bin/bash
# Sentence-Transformers Reranker Service Manager
#
# This script manages the local reranker service for Mnemo.
# It is automatically installed by the mnemo-plugin when localReranker.enabled is true.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${RERANKER_LOG:-/tmp/sentence-reranker.log}"
PID_FILE="${RERANKER_PID:-/tmp/sentence-reranker.pid}"
PORT="${RERANKER_PORT:-18797}"
HOST="${RERANKER_HOST:-0.0.0.0}"

# HuggingFace mirror for faster downloads (especially in China)
export HF_ENDPOINT="${HF_ENDPOINT:-https://hf-mirror.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log_warn "Service already running (PID: $(cat $PID_FILE))"
        return 0
    fi

    log_info "Starting Sentence-Transformers Reranker..."
    log_info "  Port: $PORT"
    log_info "  Log: $LOG_FILE"

    cd "$SCRIPT_DIR"

    # Prefer uv if available, fallback to python
    if command -v uv &> /dev/null; then
        log_info "Using uv to run Python..."
        nohup uv run python reranker.py > "$LOG_FILE" 2>&1 &
    else
        log_info "Using system Python..."
        nohup python3 reranker.py > "$LOG_FILE" 2>&1 &
    fi

    echo $! > "$PID_FILE"

    # Wait for service to be ready
    log_info "Waiting for service to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
            log_info "✓ Service started successfully on http://localhost:$PORT"
            log_info "  Health: http://localhost:$PORT/health"
            log_info "  Rerank: http://localhost:$PORT/v1/rerank"
            return 0
        fi
        sleep 1
    done

    log_error "✗ Service failed to start within 30 seconds"
    log_error "Check logs: $LOG_FILE"
    return 1
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        log_info "Service not running"
        return 0
    fi

    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        log_info "Stopping service (PID: $PID)..."
        kill "$PID"
        rm -f "$PID_FILE"
        log_info "✓ Service stopped"
    else
        log_warn "Service not running (stale PID file)"
        rm -f "$PID_FILE"
    fi
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log_info "Service running (PID: $(cat $PID_FILE))"
        echo ""
        curl -s "http://localhost:$PORT/health" 2>/dev/null | python3 -m json.tool 2>/dev/null || log_warn "Health check failed"
    else
        log_info "Service not running"
    fi
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        log_warn "Log file not found: $LOG_FILE"
    fi
}

test_rerank() {
    log_info "Testing rerank endpoint..."
    curl -s -X POST "http://localhost:$PORT/v1/rerank" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "BAAI/bge-reranker-v2-m3",
            "query": "What is machine learning?",
            "documents": [
                "Machine learning is a subset of artificial intelligence.",
                "The weather today is sunny and warm.",
                "Neural networks are used in deep learning."
            ],
            "top_n": 3
        }' | python3 -m json.tool 2>/dev/null || log_error "Test failed"
}

install_deps() {
    log_info "Installing dependencies..."
    cd "$SCRIPT_DIR"

    if command -v uv &> /dev/null; then
        log_info "Using uv to install dependencies..."
        uv sync
    else
        log_info "Using pip to install dependencies..."
        python3 -m pip install -e .
    fi

    log_info "✓ Dependencies installed"
}

case "${1:-help}" in
    start)       start ;;
    stop)        stop ;;
    restart)     stop; sleep 2; start ;;
    status)      status ;;
    logs)        logs ;;
    test)        test_rerank ;;
    install)     install_deps ;;
    *)
        echo "Sentence-Transformers Reranker Service Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|test|install}"
        echo ""
        echo "Commands:"
        echo "  start    Start the reranker service"
        echo "  stop     Stop the reranker service"
        echo "  restart  Restart the reranker service"
        echo "  status   Check service status"
        echo "  logs     Tail the service logs"
        echo "  test     Test the rerank endpoint"
        echo "  install  Install Python dependencies"
        echo ""
        echo "Environment:"
        echo "  RERANKER_PORT  Service port (default: 18797)"
        echo "  RERANKER_HOST  Service host (default: 0.0.0.0)"
        echo "  RERANKER_LOG   Log file path (default: /tmp/sentence-reranker.log)"
        echo "  RERANKER_PID   PID file path (default: /tmp/sentence-reranker.pid)"
        echo "  HF_ENDPOINT    HuggingFace mirror (default: https://hf-mirror.com)"
        exit 1
        ;;
esac