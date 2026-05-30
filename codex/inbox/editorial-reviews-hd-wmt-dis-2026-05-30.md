---
from: claude-code
to: codex
date: 2026-05-30
subject: Session 7 — Priority 12/13/14 editorial reviews for HD, WMT, DIS (currently blocked)
action_required: blocked — generated files not yet present
---

# Session 7 Handoff — Editorial Reviews for HD, WMT, DIS

This note assigns Priorities 12, 13, and 14 (editorial phrase reviews for HD,
WMT, and DIS). **All three are currently blocked** because the Phase 2 Docker
ops-worker has not yet generated the candidate phrase and trivia files for these
companies. The NKE Priority 8 review was unblocked because those files existed.
The same precondition applies here.

---

## Status Check Before Starting

Before taking any action, verify whether the generated files now exist:

- `company-packs/HD/generated/phrases.json`
- `company-packs/HD/generated/trivia.json`
- `company-packs/WMT/generated/phrases.json`
- `company-packs/WMT/generated/trivia.json`
- `company-packs/DIS/generated/phrases.json`
- `company-packs/DIS/generated/trivia.json`

If any of these files are present, proceed with the corresponding priority below.
If a company's files are still absent, note it in a codex/staging report and
wait for the next session to re-check.

---

## Priority 12 — HD Editorial Phrase Review

**Status:** Blocked — `company-packs/HD/generated/` does not exist as of
2026-05-30. The Phase 2 ops-worker (NKE test) has not yet been run for HD.

**When unblocked, your task:**

1. Read `company-packs/HD/generated/phrases.json`
2. Read `company-packs/HD/generated/trivia.json`
3. Read `docs/program/CONTENT_QA_RUBRIC.md`
4. Review every phrase against the rubric. For each assign: `approve`, `reject`,
   or `edit` (provide corrected text ≤25 characters if editing).
5. Review each trivia question: 4 choices, `correct_answer` field present and
   correct, no person names, clearly answerable from earnings call context.
6. Write output to: `codex/staging/reports/hd-editorial-review-YYYY-MM-DD.md`

Output format: per-phrase table (phrase | recommendation | reason), then trivia
assessment, then readiness summary (how many phrases pass, whether trivia count
meets the 12-question minimum for activation).

---

## Priority 13 — WMT Editorial Phrase Review

**Status:** Blocked — `company-packs/WMT/generated/` does not exist as of
2026-05-30.

**Note: WMT is a high-priority launch company alongside MSFT and NKE.** Expedite
this review once files are available.

**When unblocked, your task:** Same format as Priority 12 above, but for WMT.
Write output to: `codex/staging/reports/wmt-editorial-review-YYYY-MM-DD.md`

---

## Priority 14 — DIS Editorial Phrase Review

**Status:** Blocked — `company-packs/DIS/generated/` does not exist as of
2026-05-30.

**Note: DIS is a high-priority launch company alongside MSFT and NKE.** Expedite
this review once files are available.

**When unblocked, your task:** Same format as Priority 12 above, but for DIS.
Write output to: `codex/staging/reports/dis-editorial-review-YYYY-MM-DD.md`

---

## Current Pipeline State (for Codex awareness)

**phrase_staging as of 2026-05-30 (session 7 check):**

| company_id | ai_selected | approved |
|---|---|---|
| msft | 50 | 0 |
| vz | 50 | 0 |
| ba | 50 | 0 |
| mmm | 50 | 0 |
| hd | 50 | 0 |
| wmt | 50 | 0 |
| dis | 50 | 0 |
| nke | 50 | 0 |
| trv | 100 | 0 |
| mrk | 100 | 0 |
| jpm | 100 | 0 |

No human approvals yet. All `ai_selected` phrases await review in the admin
panel. JPM, MRK, and TRV each have 100 `ai_selected` because the pipeline ran
twice — human should approve the best 50 from each.

**Important:** The generated/ files that Priorities 12–14 need are the output
of the Phase 2 Docker ops-worker (Stage 4 AI generation step), NOT the
`phrase_staging` table entries. `phrase_staging` holds Phase 1 pipeline output.
The Phase 2 ops-worker produces `phrases.json` and `trivia.json` in a separate
enrichment step. NKE was the only company run through Phase 2 so far.

**PR #30** (URL repairs + HD/WMT/DIS/NKE builders) is still open and awaiting
human merge.

**PR #32** (Group C prompt edits from Priority 9) is open and ready for review.

---

## Key Rules for Editorial Reviews

- 25-character maximum on all phrases — hard reject anything over
- No person names anywhere — reject any phrase or trivia that names an individual
- CEO Mode only — phrases should reflect executive language, not analyst questions
- Rejection taxonomy: too_generic, person_name, jargon_heavy, wrong_company,
  too_long, low_frequency, boilerplate_opener, operational_minutia, analyst_question
- Activation minimums: ≥50 approved phrases, ≥12 trivia questions
- Preferred targets: ≥75 phrases, ≥18 trivia questions
