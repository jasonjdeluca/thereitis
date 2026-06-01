---
codex_staged: true
group: infra
status: promote_as_is
target_path: none
notes: Runtime state snapshot — crontab, poller log tail, live Docker containers. Not derivable from repo.
---

# Runtime State Snapshot — 2026-06-01

Exported by Claude Code (Sonnet 4.6) at the project owner's request for Codex audit access.

---

## Active Crontab (thereitis-related jobs)

```
# 6:00am ET — run all four report scripts
0 6 * * * cd ~/thereitis && set -a && source .env && set +a && node scripts/company-readiness.js && node scripts/content-validation.js && node scripts/migration-check.js && node scripts/pm-packet.js >> ~/thereitis/logs/cron.log 2>&1

# 9:00pm ET — same scripts again
0 21 * * * cd ~/thereitis && set -a && source .env && set +a && node scripts/company-readiness.js && node scripts/content-validation.js && node scripts/migration-check.js && node scripts/pm-packet.js >> ~/thereitis/logs/cron.log 2>&1

# Every 3 minutes — ingestion poller (picks up ready pipeline jobs)
*/3 * * * * cd ~/thereitis && set -a && source .env && set +a && /usr/bin/node scripts/ingestion/poller.js >> ~/thereitis/logs/poller.log 2>&1

# 2:00am daily — enqueue new pipeline jobs
0 2 * * * cd ~/thereitis && set -a && source .env && set +a && /usr/bin/node scripts/ingestion/poller.js --enqueue >> ~/thereitis/logs/poller.log 2>&1
```

---

## Live Docker Containers (as of 2026-06-01)

```
ops-worker-fetcher-run-d843c2bf7cb3   Up 21 hours   ops-worker-fetcher
ops-worker-fetcher-run-a7f07dafcd42   Up 2 days     f94ad5da1571
ops-worker-fetcher-run-0ee2c1e71f92   Up 2 days     f94ad5da1571
```

**Note:** Three fetcher containers are currently running. Two have been running for 2 days without resolving. This indicates a stuck pipeline run — the fetcher containers were spawned by the poller and never exited cleanly. The poller log below shows the last known activity.

---

## Poller Log — Last 40 Lines (as of 2026-06-01)

```
[2026-06-01T00:51:38.774Z]   ✗ HTTP 400 Bad Request
[2026-06-01T00:51:39.275Z]   [FY Q3 2025] html — https://stockanalysis.com/stocks/amgn/transcripts/370742-q3-2025/
[2026-06-01T00:51:39.379Z]   ✗ HTTP 400 Bad Request
[2026-06-01T00:51:39.879Z]   [FY Q4 2022] pdf — https://investors.amgen.com/static-files/a900c41e-b93a-4e02-b04e-bb9b25d2f4d5
[2026-06-01T01:16:31.850Z] run 98b6634d-4a7c-472b-927f-36289f89714a failed: spawnSync /bin/sh ETIMEDOUT
[2026-06-01T01:16:31.873Z] status upsert failed: TypeError: fetch failed
 Container ops-worker-extractor-run-1bc65c1d9c02 Creating
 Container ops-worker-extractor-run-1bc65c1d9c02 Created
[2026-06-01T01:18:07Z] Extractor starting — 1 job(s) to process
[2026-06-01T01:18:07Z] JNJ: extracting prepared remarks from 4 quarter(s)
[2026-06-01T01:18:09Z]   [FY Q1 2023] 62 paragraphs, 4169 words
[2026-06-01T01:18:12Z]   [FY Q1 2026] 5 paragraphs, 390 words
[2026-06-01T01:18:14Z]   [FY Q2 2022] 22 paragraphs, 1528 words
[2026-06-01T01:18:17Z]   [FY Q3 2023] 7 paragraphs, 390 words
[2026-06-01T01:18:17Z] JNJ: 4 quarters extracted, 0 failed → review-queue/JNJ.json (awaiting Claude Code session)
[2026-06-01T01:18:17Z] Extractor done.
 Container ops-worker-validator-run-3c24efb5b4c4 Creating
 Container ops-worker-validator-run-3c24efb5b4c4 Created
[2026-06-01T01:18:18.730Z] Validator starting — 0 job(s) to process
[2026-06-01T01:18:18.738Z] Validator done — run scripts/ingestion/process-review-queue.js to complete AI enrichment.
```

**Key observations:**
- StockAnalysis.com returns HTTP 400 consistently — hard bot-block, not a transient failure
- AMGN's dead investors.amgen.com URL also returned no data
- One run timed out (`spawnSync /bin/sh ETIMEDOUT`) before JNJ succeeded
- JNJ was the last company successfully extracted (session 18, 2026-06-01 ~01:18 UTC)
- The two 2-day-old stuck fetcher containers predate this log window

---

## Reports Staleness Note

The `reports/*.json` files copied to this staging directory were last generated **2026-05-29** (company-readiness, content-validation, pm-packet) and **2026-05-30** (release-readiness). They are 3 days stale relative to this snapshot date. The ingestion-db-snapshot-2026-06-01.json file reflects current state as of today.
