# Session 10 Handoff — thereitis

**Date:** 2026-05-31 · **Prepared by:** Claude Code (Sonnet 4.6, session 9)

Read in this order:
1. `docs/program/PROGRAM_STATE.md`
2. `git log --oneline -6`
3. This file

---

## What Session 9 Completed

### Editorial reviews (HD, WMT, DIS)
All three companies reviewed against `docs/program/CONTENT_QA_RUBRIC.md`. Results in `docs/editorial-reviews/`. All failed — root cause identified and fixed this session.

### Queue architecture (PR #37, merged)
Docker validator no longer calls Anthropic API. After Stage 3 filter it writes `data/review-queue/{ticker}.json` and stops. Claude Code runs AI work via `node scripts/ingestion/process-review-queue.js`.

### Layer 2 sentence-level extraction (PR #39, merged)
`ops-worker/extractor/main.py` now clips each transcript at the Q&A boundary, extracts prepared-remarks text only, and writes paragraph batches to the review queue. Replaces n-gram counting entirely. Eliminates the FLS/disclaimer contamination that killed WMT and DIS phrase sets.

### phrase_staging triage (all 11 companies)
Ran `scripts/ingestion/phrase-approve.js` against all 700 ai_selected phrases. Applied via Supabase MCP.
- 33 auto-approved (Haiku score ≥8)
- 464 rejected (boilerplate, legal text, person names, generic filler)
- 203 remain `ai_selected` for human review (borderline score 5–7)
- No company is activation-ready on phrase count alone

Codex is idle. No assignments. Human said to leave it unless explicitly given something.

---

## Current Pipeline State

**Full pipeline (post-session 9):**
```
fetcher (Docker) → extractor (Docker, Layer 2) → data/review-queue/{ticker}.json
                                                         ↓
                    node scripts/ingestion/process-review-queue.js  ← Claude Code
                                                         ↓
                    company-packs/{TICKER}/generated/phrases.json + trivia.json
```

**Key scripts:**
- `scripts/ingestion/process-review-queue.js` — reads queue, calls Haiku, writes generated/
- `scripts/ingestion/phrase-approve.js` — scores + auto-approves ai_selected phrases in phrase_staging

**Validator** is now a thin Stage 3 filter only — no API calls, no Anthropic SDK.

---

## phrase_staging Status

```sql
SELECT company_id, status, COUNT(*) AS n
FROM phrase_staging
WHERE status IN ('approved','ai_selected')
GROUP BY company_id, status ORDER BY company_id, status;
```

Expected state after session 9:
| Company | approved | ai_selected (borderline, needs human) |
|---|---|---|
| JPM | 7 | 26 |
| VZ | 7 | 15 |
| MMM | 5 | 15 |
| NKE | 5 | 18 |
| HD | 4 | 18 |
| MRK | 2 | 24 |
| MSFT | 2 | 20 |
| BA | 1 | 15 |
| TRV | 0 | 26 |
| DIS | 0 | 11 |
| WMT | 0 | 15 |

No company is activation-ready. All need more phrases — the path is Layer 2 re-run.

---

## Next Session Entry Point

### Step 1 — Verify main is clean
```bash
cd ~/thereitis && git pull
git log --oneline -4
```
Expected: `3d67609` (Layer 2) at HEAD.

### Step 2 — Re-run pipeline for HD, WMT, DIS, NKE

These are the four companies where Phase 2 generated content was reviewed and rejected. With Layer 2, a fresh run should produce dramatically better phrase candidates.

**Before running:** confirm the pipeline DB has these companies in a re-runnable state. The prior runs set their `phase2_jobs` status to `ready_for_review` (old runs) or `awaiting_ai_review`. You may need to reset them to `fetched` to trigger re-extraction.

Check current DB state:
```bash
cd ~/thereitis/ops-worker && docker compose run --rm -e TICKER=HD validator
```
Or query the SQLite DB directly:
```bash
sqlite3 data/ingestion-queue.db "SELECT ticker, status FROM phase2_jobs ORDER BY ticker;"
```

To reset a company for re-run:
```bash
sqlite3 data/ingestion-queue.db "UPDATE phase2_jobs SET status='fetched' WHERE ticker='WMT';"
sqlite3 data/ingestion-queue.db "UPDATE phase2_quarters SET extract_status='pending' WHERE company_id='wmt';"
```

Then run the pipeline (extractor + validator steps only — PDFs are already fetched):
```bash
cd ~/thereitis/ops-worker && docker compose run --rm extractor
```

Then process the queue:
```bash
node scripts/ingestion/process-review-queue.js
```

**Repeat for HD, WMT, DIS, NKE.** Or run all at once — the extractor processes all companies with `status='fetched'`.

### Step 3 — Verify phrase quality improvement

After running process-review-queue.js, check the generated phrases:
```bash
cat company-packs/WMT/generated/phrases.json
cat company-packs/DIS/generated/phrases.json
```

These should now contain genuine CEO idioms instead of FLS boilerplate. If quality looks good, commit the regenerated files and open a PR.

### Step 4 — Editorial re-review (if needed)

If the generated phrases look good qualitatively (CEO-speak idioms, company-specific), proceed directly. If there are still issues, a spot check is enough — full editorial review only needed if >20% of phrases look wrong.

### Step 5 — Human phrase review (203 borderlines in phrase_staging)

The 203 remaining `ai_selected` phrases are the borderline 5–7 scorers. The top ones worth reviewing per company:
- **VZ**: "price lock", "pricing action", "phone guarantee", "price lock" — strong VZ-specific language
- **TRV**: "gen ai", "cat quarter", "select and middle market", "very granular" — TRV-specific
- **NKE**: "nike digital", "nike direct", "full price realization", "sport moment"
- **JPM**: "real economy", "peak private credit", "yield seeking flow", "deposit beta"
- **MRK**: "expansive pipeline", "get back to growth", "feel very good about"

Go to `/admin` → Phrase Staging Review to approve/reject. Approving even the top 5-10 per company meaningfully improves the pool.

---

## Activation Readiness

No company is currently activation-ready. Path to first activation:

**Fastest path** (any company with strong borderlines):
1. Human approves borderline phrases in admin panel
2. Run `phrase-approve.js` again after any new ai_selected rows are added
3. When `approved` count ≥ 50 and trivia ≥ 12, company is activation-ready

**Complete path for HD/WMT/DIS/NKE**:
1. Re-run pipeline with Layer 2 → new phrases.json
2. Commit generated files
3. Run `process-review-queue.js` → scores + writes generated/
4. Editorial spot-check
5. When satisfied, execute migration.sql (human step)

---

## Known State

| Item | Status |
|---|---|
| Codex | Idle — no assignments |
| NKE trivia gap | Still 6/12 — needs 6 more questions before activation |
| DIS trivia gap | 6/12 — same issue |
| `npx playwright install-deps` on VPS | Still needed (unblocks Playwright cron) |
| Group C automations | Not configured — all 5 prompt files are merged but none are live |
| SUPABASE_SERVICE_ROLE_KEY in .env | Missing — phrase-approve.js falls back to decisions file + MCP apply |

---

## Model
`claude-sonnet-4-6` for all pipeline and repair work. Switch to `claude-opus-4-8` only for architectural decisions.

**API key:** `~/thereitis/.env`  
**Supabase project:** `eiaospsymewpbexttkne`
