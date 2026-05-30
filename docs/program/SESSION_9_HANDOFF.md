# Session 9 Handoff — thereitis

**Date:** 2026-05-30 · **Prepared by:** Claude Code (Sonnet 4.6, session 8)

Read in this order before doing anything:
1. `docs/program/PROGRAM_CHARTER.md`
2. `docs/program/PROGRAM_STATE.md`
3. `docs/program/AGENT_TASK_BACKLOG.md`
4. `git log --oneline -10`
5. This file

---

## What Sessions 7–8 Completed

**Session 7:**
- Applied all 16 Codex Priority 9 targeted edits to 5 Group C automation prompt files (merged PR #32)
- Sent Codex inbox note assigning Priorities 12/13/14 (HD/WMT/DIS editorial reviews)

**Session 8:**
- Ran Phase 2 ops-worker for HD (17/17 ir.homedepot.com), WMT (17/17 stock.walmart.com), DIS (17/17 thewaltdisneycompany.com)
- Significant pipeline improvements (all merged in PR #34):
  - **Score-then-select Stage 4**: Haiku now scores each of 200 Stage 3 candidates 0–10; code picks top 50. Prior run had Haiku *inventing* phrases not in the transcripts ("boil the ocean" was hallucinated, not extracted).
  - **Expanded FILLER_BLOCKLIST** + **30 STAGE3_REJECT_PATTERNS**: catches FactSet disclaimer text, legal boilerplate, participant roster language, financial formula fragments
  - **Preamble stripper** in extractor (skips operator instructions at transcript start)
  - **Fetcher UA fix**: Chrome string replaces ThereItIsBot (was 403ing on ir.homedepot.com)
  - **ai-select.js prompt**: speaking-style-vs-subject-matter distinction with examples
- Generated content committed: HD 50 phrases/11 trivia, WMT 50/11, DIS 50/6
- Sent Codex inbox note unblocking Priorities 12/13/14 (editorial reviews ready pending PR #34 merge — now merged)
- Designed three-layer automated phrase review system (see below)

---

## Current Repository State

**main branch — clean, all PRs merged:**
- Last 5 commits: `git log --oneline -5` to verify

**No open PRs.**

**phrase_staging (Supabase):**
- 11 companies, all `ai_selected`, 0 human approvals
- Run this to verify: `SELECT company_id, status, COUNT(*) FROM phrase_staging WHERE status IN ('ai_selected','approved') GROUP BY company_id, status ORDER BY company_id;`

**codex/staging branch:**
- Last commit: inbox note unblocking HD/WMT/DIS reviews (`26057ae`)
- Check for new Codex responses: `git fetch origin codex/staging && git log origin/codex/staging --oneline -5`
- If Codex has posted editorial reviews for HD/WMT/DIS, they'll be in `codex/staging/reports/`

---

## Known Issue: Haiku Billing — Anthropic API vs Claude Pro

**The ops-worker Docker containers call the Anthropic API directly via `ANTHROPIC_API_KEY` in `~/thereitis/.env`. This bills to the Anthropic API account, NOT to the Claude Pro subscription.** Claude Pro/Max is a flat-rate web/CLI plan; Docker containers cannot "run on" it.

The user asked for Haiku to run on their Claude Pro subscription instead. Options to discuss:
1. **Accept API billing** — Haiku is cheap (~$0.04/company); clearest path
2. **Move AI work to Claude Code sessions** — Instead of Docker calling the API directly, Claude Code (which runs on subscription) does the scoring/trivia step. This breaks automation (needs interactive session) but fits flat-rate billing.
3. **Claude Max plan** — includes some API credits. Check if user has Max; if so, billing is from the same pool.

**Decision needed from user before next pipeline run.** If they don't want API billing, restructure before running more companies through Phase 2.

---

## Known Pipeline Quality Issue (next engineering task)

The Phase 2 generated phrases still contain financial metrics and legal boilerplate because those phrases appear verbatim in every quarterly transcript. The Stage 3 filters help but can't catch everything.

**Root cause:** n-gram frequency ranks by appearance count — legal disclaimers (17/17 quarters) outrank genuine CEO idioms (3-12 quarters). Score-then-select reduces hallucination but doesn't fix the underlying candidate pool quality.

**Next engineering fix (sentence-level extraction):**
Instead of n-gram counting from the full transcript, extract the prepared-remarks section and send it to Haiku for phrase identification. The model reads sentences in context and identifies idiomatic CEO language — reading comprehension, not filtering. Cost: ~$0.04/company (3000 words × 17 quarters). This is the Layer 2 improvement from the automated review design.

**File to change:** `ops-worker/extractor/main.py` — replace `extract_ngrams()` with paragraph-level extraction + per-paragraph Haiku identification. Also `ops-worker/validator/index.js` Stage 3 would simplify since candidates are already curated.

---

## Automated Phrase Review Design (session 8 output)

Three layers — Layer 1 is shipped, Layers 2 and 3 are pending:

**Layer 1 (shipped — PR #34):**
- Score-then-select Stage 4: Haiku scores, code selects
- Expanded Stage 3 filters: FILLER_BLOCKLIST, STAGE3_REJECT_PATTERNS
- Preamble stripper

**Layer 2 (next session — requires human decision on billing first):**
- Replace n-gram extraction with sentence-level AI identification
- Send prepared-remarks paragraphs to Haiku; ask it to identify CEO-speak idioms in context
- Eliminates the frequency-bias problem entirely
- Change: `ops-worker/extractor/main.py` + simplify `ops-worker/validator/index.js`

**Layer 3 (after Layer 2 signal is reliable):**
- Two-tier admin UX in `PhraseReviewPanel` (already exists in `Admin.jsx`):
  - Score ≥ 8 → auto-flag for bulk approve (human clicks "approve all highlighted" or unchecks)
  - Score 5–7 → individual manual review
  - Score ≤ 4 → auto-reject (not shown to human)
- Reduces human review from 50 individual decisions to ~10–15 per company
- Charter's human approval gate is preserved — human still approves everything

---

## Codex Status and Pending Assignments

| Priority | Task | Status |
|---|---|---|
| 8 | NKE editorial review | Complete — `codex/staging/reports/nke-editorial-review-2026-05-30.md`. NKE not activation-ready: 16/50 phrases pass, 3/12 trivia pass. |
| 9 | Group C prompt review | Complete — all 16 findings applied (PR #32 merged). |
| 10 | Release readiness synthesis | Pending — waiting on VPS report data. |
| 11 | BA/TRV/MRK/JPM/MMM editorial reviews | Not yet assigned. |
| 12 | HD editorial review | **Unblocked** — files on main since PR #34 merge. Awaiting Codex. |
| 13 | WMT editorial review | **Unblocked** — high-priority launch company. Awaiting Codex. |
| 14 | DIS editorial review | **Unblocked** — high-priority launch company. DIS trivia below activation minimum (6/12). |

**If Codex has completed Priorities 12/13/14:** Read their reports in `codex/staging/reports/`, apply approved phrases/trivia to the migration SQL, and flag any that meet activation readiness. Note: DIS trivia gap must be addressed before DIS can be activated.

---

## Active Human Action Items (from PROGRAM_STATE.md)

1. **Review 600 phrases in admin panel** — `/admin` → Phrase Staging Review. Biggest unlock. JPM/MRK/TRV each have 100 — approve best 50.
2. **Decide on Haiku billing** — API account vs. Claude Pro. Needed before next pipeline run.
3. **Configure Group C automations** — All 5 prompt files are merged and quality-reviewed. Platform setup (Claude Code Routines + Codex Automations) is manual.
4. `npx playwright install-deps` on VPS — one-time, unblocks Playwright cron.

---

## Session 9 Entry Point

**First checks:**
```bash
cd ~/thereitis && git pull
git fetch origin codex/staging && git log origin/codex/staging --oneline -5
# Read any new Codex reports in codex/staging/reports/
```

**Supabase phrase check:**
```sql
SELECT company_id, status, COUNT(*) AS n
FROM phrase_staging
WHERE status IN ('ai_selected','approved','rejected')
GROUP BY company_id, status ORDER BY company_id, status;
```

**Then:**
1. If Codex completed HD/WMT/DIS editorial reviews — act on them (update migration SQL, flag readiness)
2. If human approved phrases — surface activation readiness for any company with 50+
3. Discuss Haiku billing decision and proceed accordingly (Layer 2 pipeline or wait)
4. If Group C automations are configured — verify Daily PM Brief fired

**Model:** `claude-sonnet-4-6` for all implementation. Switch to `claude-opus-4-8` only for architectural decisions.
**API key:** `~/thereitis/.env` (`--env-file=.env`)
**Supabase project:** `eiaospsymewpbexttkne`
