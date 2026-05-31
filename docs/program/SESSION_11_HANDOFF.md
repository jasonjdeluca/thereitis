# Session 11 Handoff — thereitis

**Date:** 2026-05-31 · **Prepared by:** Claude Code (Sonnet 4.6, session 10)

Read in this order:
1. `docs/program/PROGRAM_STATE.md`
2. `git log --oneline -6`
3. This file

---

## What Session 10 Completed

### Layer 2 re-run: HD, WMT, DIS, NKE (PR #40, open)

All four companies re-run through the full Layer 2 pipeline (extractor → process-review-queue.js).
Generated files are updated in `company-packs/{TICKER}/generated/`.

| Company | Phrases | Trivia | Quality notes |
|---|---|---|---|
| HD | 27 | 0 | All trivia rejected (person names — known issue). Good CEO idioms ("interconnected experience", "winning formula", "relentless focus") |
| NKE | 38 | 6 | Strong sports metaphors ("drive separation", "competitive separation", "front of the pack") |
| DIS | 16 | 6 | Thin but real: "path to profitability", "transform entertainment", "cost rationalization" |
| WMT | 20 | 8 | "our flywheel" is a genuine Walmart idiom; "mutually reinforcing", "laser focused" |

All are clear improvements over session 8 (which had FLS legal disclaimers contaminating ~60% of phrases).

### Two pipeline fixes committed in PR #40

**Fix 1 — Extractor Q&A boundary threshold (extractor/main.py):**
Raised minimum distance from 300→1500 characters. The phrase "the call will be open for questions" in HD's preamble boilerplate was triggering an early Q&A clip at ~322 chars, causing 14/17 HD quarters to fail as "too short". With the fix, 17/17 quarters extracted cleanly.

**Fix 2 — MIN_APPROVED_PHRASES threshold (process-review-queue.js):**
Lowered from 25→15. Paragraph-mode extraction is more selective than the old n-gram approach — fewer candidates is expected, and 15 good CEO idioms are worth saving for human review.

### Phrase_staging state (unchanged — migration.sql not yet executed)

Session 9 values still hold. No new phrases added to phrase_staging this session.
The Layer 2 phrases for HD/WMT/DIS/NKE are staged in `company-packs/{TICKER}/generated/migration.sql` — human must execute to add them.

---

## Next Session Entry Point

### Step 1 — Merge PR #40

```bash
gh pr merge 40 --squash
```

### Step 2 — Execute Layer 2 migration.sql files (human step)

Four migration.sql files are ready to apply. Each inserts new ai_selected phrases into phrase_staging. Execute via Supabase MCP or dashboard:

```bash
cat company-packs/HD/generated/migration.sql   # 27 phrases
cat company-packs/NKE/generated/migration.sql  # 38 phrases
cat company-packs/DIS/generated/migration.sql  # 16 phrases
cat company-packs/WMT/generated/migration.sql  # 20 phrases
```

After applying, run `scripts/ingestion/phrase-approve.js` to auto-score and approve any ≥8 scorers.

### Step 3 — Human phrase review (203 borderlines + new Layer 2 candidates)

After migration.sql applied, go to `/admin` → Phrase Staging Review. 

Top human-review candidates (from session 9 analysis — still valid):
- **VZ**: "price lock", "pricing action", "phone guarantee"
- **TRV**: "gen ai", "cat quarter", "select and middle market"
- **NKE**: "nike digital", "nike direct", "full price realization"
- **JPM**: "real economy", "peak private credit", "deposit beta"
- **MRK**: "expansive pipeline", "get back to growth"

### Step 4 — HD trivia gap

HD generated 0 trivia (all 15 contained person names). The trivia prompt needs to strongly discourage person names. This is a known issue; NKE/DIS/WMT all got 6-8 trivia approved. Options:

1. Add explicit "Do not include questions that name specific executives (CEO, CFO, etc.)" to the trivia prompt in `process-review-queue.js`
2. After fixing prompt, reset HD to re-run: `sqlite3 data/ingestion-queue.db "UPDATE phase2_jobs SET status='fetched' WHERE ticker='HD'"; sqlite3 data/ingestion-queue.db "UPDATE phase2_quarters SET extract_status='pending' WHERE company_id='hd'";` then re-run extractor + process-review-queue for HD only

### Step 5 — Activation check

After migration.sql applied + human approvals:
```sql
SELECT company_id, COUNT(*) FILTER (WHERE status='approved') AS approved
FROM phrase_staging
GROUP BY company_id HAVING COUNT(*) FILTER (WHERE status='approved') >= 50;
```

If any company returns a row, check trivia count (need ≥12) and mark activation-ready.

---

## Current phrase_staging (post-session 10, before migration.sql)

| Company | approved | ai_selected (borderline) |
|---|---|---|
| JPM | 7 | 26 |
| TRV | 0 | 26 |
| MRK | 2 | 24 |
| MSFT | 2 | 20 |
| NKE | 5 | 18 |
| HD | 4 | 18 |
| MMM | 5 | 15 |
| VZ | 7 | 15 |
| BA | 1 | 15 |
| WMT | 0 | 15 |
| DIS | 0 | 11 |

No company is activation-ready. Fastest path: human approves borderlines for JPM/TRV/VZ.

---

## Known State

| Item | Status |
|---|---|
| PR #40 | Open — Layer 2 re-run HD/WMT/DIS/NKE |
| Codex | Idle — no assignments |
| HD trivia gap | 0/12 — needs trivia prompt fix before re-run |
| NKE trivia gap | Still 6/12 — needs 6 more before activation |
| DIS trivia gap | 6/12 — same |
| migration.sql files | Ready but not executed (human step) |
| `npx playwright install-deps` on VPS | Still needed |
| Group C automations | Not configured |
| SUPABASE_SERVICE_ROLE_KEY in .env | Missing — phrase-approve.js uses decisions file + MCP |

---

## Model

`claude-sonnet-4-6` for all pipeline and repair work. Switch to `claude-opus-4-8` only for architectural decisions.

**API key:** `~/thereitis/.env`
**Supabase project:** `eiaospsymewpbexttkne`
