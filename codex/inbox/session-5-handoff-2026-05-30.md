---
from: claude-code
to: codex
date: 2026-05-30
subject: Session 5 handoff — NKE review unblocked, pipeline expanding, Group C prompt review needed
action_required: yes
---

# Session 5 Handoff

This note covers everything Codex needs to do next. Read all sections before
starting any task. Tasks are listed in priority order.

---

## Context: What Happened in Sessions 4–5

Sessions 4 and 5 completed the following work (now on `main`):

- **ai-select.js** built and working. Stage 4 AI selection runs batches of
  phrase_staging candidates through Claude Haiku, marks the top 50 per company
  as `ai_selected`, rejects the rest. MSFT: 4,790→50. VZ: 5,120→50. Both
  sets are in the admin panel awaiting human approval.
- **BA, KO, MMM source manifests** promoted from Priority 6 — all 17 quarters
  now use official PDF URLs. Queue-builder wired with `buildBa()`, `buildKo()`,
  `buildMmm()`.
- **CAT, SHW partial manifests** promoted — official q4cdn rows wired, StockAnalysis
  fallback rows retained for earlier quarters.
- **NKE generated content committed** — `company-packs/NKE/generated/phrases.json`,
  `trivia.json`, `migration.sql`, `validation_report.json` are now on `main`.
  This was the blocker for Priority 7.
- **Migration 016 applied** — RLS policy enabling ai-select writes.
- **Phase 1 pipeline expanding** — BA, TRV, MRK, JPM, MMM are being run through
  the ingestion pipeline right now. Each will produce ~50 `ai_selected` phrases
  after `ai-select.js` runs. Codex editorial review tasks will follow.

---

## Priority 8 — NKE Editorial Review (READY NOW)

The Priority 7 NKE editorial review was blocked because `phrases.json` and
`trivia.json` were not in the repo. Both files are now on `main` at:

  `company-packs/NKE/generated/phrases.json`  (40 phrases)
  `company-packs/NKE/generated/trivia.json`   (4 questions)

**Your task:**

Run the full editorial review you attempted in Priority 7, now that the inputs
are available.

1. Read `company-packs/NKE/generated/phrases.json` — 40 candidate phrases.
2. Read `company-packs/NKE/generated/trivia.json` — 4 trivia questions.
3. Review every phrase against `docs/program/CONTENT_QA_RUBRIC.md`. For each,
   assign one of: `approve`, `reject`, `edit` (provide corrected text if editing).
4. Review each trivia question for structure (4 choices, correct_answer field,
   no person names), clarity, and quality.
5. Note: 4 trivia questions is well below the 12-question activation minimum.
   Flag this gap clearly. Suggest 8+ additional trivia questions if you can
   generate them from your knowledge of Nike's earnings history — otherwise flag
   as a human task.
6. Write your output to:
   `codex/staging/reports/nke-editorial-review-2026-05-30.md`
   (overwrite the existing placeholder file)

Output format: per-phrase table (phrase | recommendation | reason), then trivia
assessment, then a readiness summary (how many phrases pass, whether the trivia
gap blocks activation).

---

## Priority 9 — Group C Prompt File Review

Five automation prompt files exist in `docs/program/prompts/`. None of the
automations are live yet — platform configuration requires human setup. Before
the human configures them, Codex should review the prompts for quality.

**Files to review:**

- `docs/program/prompts/routine-pm-brief.md` — Daily PM Brief (Claude Code Routine)
- `docs/program/prompts/routine-implement.md` — GitHub-triggered implementation (Claude Code Routine)
- `docs/program/prompts/codex-content-quality.md` — Weekly content quality summary (Codex Automation)
- `docs/program/prompts/codex-ingestion-triage.md` — Nightly ingestion queue triage (Codex Automation)
- `docs/program/prompts/codex-pm-brief-overflow.md` — Overflow PM brief (Codex Automation)

**Your task:**

For each file, assess:

1. Is the trigger condition clearly defined and unambiguous?
2. Are the input sources (files, report paths, GitHub state) still accurate given
   current repo structure?
3. Is the output format clearly specified (GitHub issue title format, sections,
   what to include)?
4. Are there any edge cases where the automation would fire incorrectly or
   produce a useless output?
5. Does each prompt correctly reference the current report paths
   (`reports/pm-packet.json`, `reports/company-readiness.json`, etc.)?

Write your assessment to:
`codex/staging/reports/group-c-prompt-review-2026-05-30.md`

Status: `review_needed` — this is a quality check, not a rewrite. Flag specific
lines that need to change. Do NOT rewrite the prompts wholesale unless multiple
sections are broken.

---

## Priority 10 — Release Readiness Synthesis (CONTEXT ONLY — no action yet)

Issue #28 was posted with fallback data (Yellow posture, 0 blockers, 13 warnings)
because the `reports/` JSON files are gitignored runtime artifacts that only
exist on the VPS.

**The right time for a proper synthesis is after the VPS cron runs tonight
(9pm ET) or tomorrow morning (6am ET).** At that point, if the human can copy
the current `reports/pm-packet.json` from the VPS into `codex/staging/reports/`
as a snapshot, Codex can do a full audit against real data and post a replacement
for issue #28.

No Codex action needed now. This is a heads-up so you know what to expect. If
you receive a note with a `pm-packet-snapshot-*.json` file in
`codex/staging/reports/`, that is your signal to run the synthesis.

---

## Priority 11 — Upcoming Editorial Reviews (FUTURE — not yet ready)

The following companies are being run through the Phase 1 ingestion pipeline
today: **BA, TRV, MRK, JPM, MMM**. Each will produce ~50 `ai_selected`
candidate phrases after `ai-select.js` runs.

Once the human has reviewed and approved those phrases in the admin panel,
Codex will receive editorial review tasks for each company — same format as
the NKE Priority 8 task above, but with 50 phrases instead of 40.

No action needed now. This is advance notice so Codex understands the
incoming workload. Expect these as Priority 12–16 tasks in the next inbox note.

---

## Current Pipeline Status (for Codex awareness)

**phrase_staging table (as of 2026-05-30 18:32 ET):**

| company_id | ai_selected | ai_rejected | approved | rejected |
|---|---|---|---|---|
| msft | 50 | 4,740 | 0 | 0 |
| vz | 50 | 5,070 | 0 | 0 |

MSFT and VZ are pending human approval in the admin panel. No activation possible
until ≥50 phrases are approved and ≥12 trivia questions exist.

**Companies NOT in phrase_staging yet (pipeline running now):**
BA, TRV, MRK, JPM, MMM

---

## Key Facts Codex Should Know

- `companies` table has no `ticker` column. Company IDs are lowercase tickers for
  most companies; hotel companies use word slugs (see `TICKER_TO_COMPANY_ID` in
  `scripts/ingestion/lib/common.js`).
- 25-character max on all phrases — hard rule, enforced by `content-validation.js`.
- No person names anywhere — not in phrases, not in trivia questions or answer options.
- Minimum for activation: 50 approved phrases + 12 trivia questions.
- `ai_selected` status = Haiku's top 50 candidates. Human still approves/rejects each
  one individually in the admin panel before they enter `phrases` table.
- Production SQL always requires human execution. Codex should never mark migration
  SQL as `promote_as_is` — always `human_decision_needed`.
