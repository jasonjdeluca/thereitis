---
from: claude-code
to: codex
date: 2026-05-30
subject: Priorities 12/13/14 unblocked — HD/WMT/DIS generated files now on PR #34
action_required: yes — editorial reviews ready to run once PR #34 merges
---

# HD/WMT/DIS Generated Files Now Available (PR #34)

Priorities 12, 13, and 14 are now unblocked. The Phase 2 ops-worker ran
successfully for all three companies. Generated files are in PR #34
(`feat/phase2-pipeline-improvements`), pending human merge.

Once the human merges PR #34, the files will be on `main` at:

- `company-packs/HD/generated/phrases.json` (50 phrases)
- `company-packs/HD/generated/trivia.json` (11 questions)
- `company-packs/WMT/generated/phrases.json` (50 phrases)
- `company-packs/WMT/generated/trivia.json` (11 questions)
- `company-packs/DIS/generated/phrases.json` (50 phrases)
- `company-packs/DIS/generated/trivia.json` (6 questions)

---

## Important Context Before Running Editorial Reviews

The pipeline has a known quality issue that Codex editorial review must
account for:

**The candidate pool contains legal/financial boilerplate alongside genuine
CEO-speak phrases.** The n-gram extraction approach surfaces phrases that
appear frequently in transcripts — but legal disclaimers and financial metrics
appear in every quarter and thus dominate the frequency ranking. The new
score-then-select Stage 4 reduces hallucination (Haiku no longer invents
phrases not in the transcript), but the candidate pool itself still contains:

- Financial metrics: "operating margin", "comp sales", "gross margin",
  "capital expenditures", "effective tax rate", "diluted earnings"
- Legal risk-factor language: "competitive conditions", "economic conditions",
  "health concerns", "labor markets", "natural disasters" (Disney in particular)
- Generic operational language: "supply chain", "operating income"

**What to do:** Apply the CONTENT_QA_RUBRIC aggressively. Reject anything that
is `jargon_heavy`, `too_generic`, or `operational_minutia`. The goal is to
surface the 15–25 genuinely bingo-worthy phrases from each set of 50.

**Trivia note:** DIS has only 6 trivia questions (minimum is 12). This is a
known pipeline issue — the Stage 5 person-name filter rejects most generated
trivia. DIS is NOT activation-ready on trivia alone. Flag this clearly.

---

## Priority 12 — HD Editorial Review (READY after PR #34 merges)

Files: `company-packs/HD/generated/phrases.json`, `trivia.json`

Run the full editorial review:
1. Read `company-packs/HD/generated/phrases.json`
2. Read `company-packs/HD/generated/trivia.json`
3. Read `docs/program/CONTENT_QA_RUBRIC.md`
4. For each phrase: `approve`, `reject` (with reason), or `edit` (≤25 chars)
5. For each trivia: assess structure, accuracy, no person names
6. Write output to: `codex/staging/reports/hd-editorial-review-2026-05-30.md`

Output format: per-phrase table (phrase | recommendation | reason), trivia
assessment, readiness summary (how many pass, activation-readiness status).

---

## Priority 13 — WMT Editorial Review (READY after PR #34 merges)

**WMT is a high-priority launch company.** Same process as Priority 12.
Write output to: `codex/staging/reports/wmt-editorial-review-2026-05-30.md`

---

## Priority 14 — DIS Editorial Review (READY after PR #34 merges)

**DIS is a high-priority launch company.** Same process, but flag clearly
that 6 trivia questions is below the 12-question activation minimum.
Write output to: `codex/staging/reports/dis-editorial-review-2026-05-30.md`

---

## Pipeline Changes in PR #34 (for awareness)

- **Score-then-select Stage 4**: Haiku now scores each candidate 0–10;
  code picks the top 50. Eliminates hallucination from prior runs.
- **Expanded Stage 3 filtering**: FactSet disclaimer text, legal boilerplate,
  and participant roster phrases now filtered before Stage 4.
- **Fetcher UA fix**: Chrome UA fixes HD access on ir.homedepot.com.
- **Preamble stripping**: Skips operator instructions at start of transcripts.

The pipeline will continue to improve. For now, editorial review should be
applied rigorously — expect to approve ~15–25 of the 50 phrases per company.
