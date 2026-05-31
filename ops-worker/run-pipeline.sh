#!/bin/bash
# run-pipeline.sh — VPS cron entry point for the Phase 2 ingestion pipeline.
# Runs fetcher → extractor → validator in sequence.
# VPS cron example:
#   0 2 * * * /path/to/thereitis/ops-worker/run-pipeline.sh >> /var/log/thereitis-ingestion.log 2>&1

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting Phase 2 ingestion pipeline"

docker compose run --rm fetcher
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Fetcher complete"

docker compose run --rm extractor
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Extractor complete"

docker compose run --rm validator
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Validator complete — batch files written to data/review-queue/"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Pipeline run finished"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Next step: run 'node scripts/ingestion/process-review-queue.js' in a Claude Code session"
