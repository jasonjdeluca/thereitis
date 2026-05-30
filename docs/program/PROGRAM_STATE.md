# There It Is — Program State

**Last updated:** 2026-05-30 (session 2)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Group F Phase 1 (Node.js ingestion pipeline, MSFT end-to-end)
**In progress:** Group C (prompt files done; platform configuration pending), Group F Phase 2 (Docker containers not started)
**Ready to start:** Group G, Group H, Group I

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written; platform configuration pending. Prompt file naming conflict between Claude Code and Codex conventions identified — must be resolved before platform configuration can proceed. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate, ingestion status column, next call date, sample card preview, recent sessions list |
| E | Transcript Research | 🔄 In Progress | Hospitality/REIT research complete (32 companies, 5 Codex batches). Blue-chip thin-coverage research complete for 17 companies (AAPL, NVDA, AMZN, CSCO, HD, IBM, CRM, KO, WMT, NKE, DIS, CAT, BA, HON, MMM, SHW, MCD) — all 17/17 quarters sourced via StockAnalysis third-party fallback, validated and promoted to `company-packs/`. All 17 are `ready_for_fetcher: true`. Markdown reconciliation cannot proceed (no prior tables exist). Remaining ~13 blue-chip companies not yet researched. |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 (Node.js pipeline) complete — MSFT validated end-to-end, 4,790 phrases staged; Phase 2 (Docker architecture) not started |
| G | Content QA | ⬜ Not Started | Depends on Group F generating output; no validation expansion or QA rubric written yet |
| H | Evergreen Maintenance | ⬜ Not Started | Depends on Group F operational; freshness watcher and stale detector not built |
| I | Public UX and SEO | ⬜ Not Started | Depends on Group A complete (satisfied); no landing page rewrite or SEO tags added yet |
| J | QA and Launch Hardening | ⬜ Not Started | Depends on Groups A–I substantially complete; no Playwright tests or release readiness script |
| K | Analytics and Launch | ⬜ Not Started | Phase 3 / post-launch; no event tracking, snapshot script, or launch kit |

---

## Key Decisions

| Decision | Detail |
|---|---|
| `bypassPermissions` enabled | Claude Code sessions run with bypassPermissions=true (commit 2b60716). Reduces friction for non-destructive tool calls. |
| Claude Code Routines branch rule | Routines push only to `claude/`-prefixed branches. Human merges to main. |
| Dual AI pools | Anthropic (Claude Code + Routines) and OpenAI (Codex Automations) run independently. When one pool hits its daily cap the other covers PM reporting. |
| 5-stage pipeline; only Stage 4 uses AI | Deterministic stages reduce input to ~200 candidates before the AI call — 45x token reduction vs. feeding raw transcripts. Stage 4 uses Claude Haiku or GPT-4o Mini (plain API call inside Docker, not a Claude Code session). |
| Group E assigned to Codex | Transcript research is browsing and synthesis, not codebase engineering. No repo context needed; OpenAI pool used. |
| Separate Docker containers | Fetcher (Node.js), extractor (Python), validator (Node.js). Python is better suited to PDF/NLP; Node for HTTP and SQL. Phase 2 work not yet started. |
| Company ID normalization | `companies` table has no `ticker` column. Canonical IDs are lowercase tickers for most companies; hotel companies use word-slug IDs (`MAR→marriott`, `H→hyatt`, `WH→wyndham`, `CHH→choice`, `KO→ko`). `TICKER_TO_COMPANY_ID` map in `scripts/ingestion/lib/common.js` is authoritative. |
| `phrase_staging` migration | 013_phrase_staging.sql created and applied via MCP 2026-05-30. Table did not exist before this session. |
| MSFT full pipeline validated | 15/17 quarters fetched, 7,086 raw candidates, 4,790 unique phrases staged to `phrase_staging` as `pending`. |
| Opus for architecture, Sonnet for execution | Use `claude-opus-4-8` when designing new systems or making architectural decisions. Use `claude-sonnet-4-6` for well-defined implementation tickets and inspection work. |
| Model ID strings | Opus 4.8: `claude-opus-4-8` · Sonnet 4.6: `claude-sonnet-4-6` · Haiku 4.5: `claude-haiku-4-5-20251001` |
| Production SQL requires human approval | All Supabase migrations must be output as SQL files and executed manually by the human. Never auto-run. |
| codex/staging ↔ codex/inbox pipeline | Shared staging branch protocol live on main. Codex deposits work to `codex/staging/`; Claude Code writes task assignments and responses to `codex/inbox/`. `PROTOCOL.md` is the source of truth. |

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Review MSFT staged phrases** | Open admin → Phrase Staging Review panel. 4,790 MSFT phrases are in `phrase_staging` as `pending`. Approve the ones worth keeping, reject the rest. Until at least 50 are approved, MSFT cannot be activated. |
| 2 | **Configure Claude Code Routine: Daily PM Brief** | Prompt file at `docs/program/prompts/routine-pm-brief.md`. Trigger: schedule, 6:15am ET weekdays. Repo: thereitis. Needs manual setup in Claude Code Routines platform. |
| 3 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt file at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label applied to a GitHub issue. Needs manual setup. |
| 4 | **Configure Codex Automation: Weekly content quality summary** | Prompt file at `docs/program/prompts/codex-content-quality.md`. Trigger: Friday 8:00am ET. |
| 5 | **Configure Codex Automation: Nightly ingestion queue triage** | Prompt file at `docs/program/prompts/codex-ingestion-triage.md`. Trigger: 9:30pm ET during active onboarding. |
| 6 | **Configure Codex Automation: Overflow PM brief** | Prompt file at `docs/program/prompts/codex-pm-brief-overflow.md`. Trigger: daily 8:00am ET, fires only if no Routine brief posted today. |
| 7 | **IHG manual PDF sourcing** | IHG uses non-standard event format (Trading Updates / Half Year Results). PDFs must be sourced manually and placed into `company-packs/IHG/transcripts/`. |
| 8 | **Review human_review_required sources before ingestion** | RHP (intermittent PDFs Q1/Q4 2022, Q1 2023), CLDT (historical quarters low-confidence), AHT (Q1 2026 missing), JNJ (several quarters pattern-matched not directly verified). See `docs/research/transcript-source-manifest.md` Open Human Review Items table. |
| 9 | **Add hospitality REIT companies to DB** | HST, RHP, APLE, PK, RLJ, CLDT, AHT are researched but not yet in the `companies` table. Required before ingestion pipeline can process them. |
| 10 | **Add 30 blue-chip companies to DB** | Claude Code will output migration SQL. Human executes against production Supabase. Required before blue-chip ingestion pipeline can process any of these companies. |
| 11 | **Decide latest_ingested_quarter metadata location** | Canonical location for this field per company: Supabase `companies` table, `company.json` per pack, or both. Blocking Group H freshness watcher build. |
| 12 | **Review 17 blue-chip source manifests before ingestion** | All 17 companies in `company-packs/` (AAPL, NVDA, AMZN, CSCO, HD, IBM, CRM, KO, WMT, NKE, DIS, CAT, BA, HON, MMM, SHW, MCD) are `ready_for_fetcher: true`. All sources are StockAnalysis third-party fallback — spot-check a sample of URLs to confirm they resolve to full written transcripts before starting the Group F fetcher. |
| 13 | **Deposit Markdown source tables for blue-chip reconciliation** | Codex reports no prior per-quarter Markdown tables exist in the repo for the 17 blue-chip tickers. Reconciliation backlog task cannot proceed until those tables are deposited. If no prior tables exist, close the reconciliation task as not applicable. |

---

## Next Recommended Session

**Recommended:** Run 2–3 additional companies through the Phase 1 ingestion pipeline (JPM, VZ, and TRV have fully resolved per-quarter URLs and are ready to go). Then start Group I (Public UX and SEO) — it is independent of all Phase 2 infrastructure and unblocked now that Group A is complete.

**Model:** `claude-sonnet-4-6` — both tasks are well-defined implementation work.

**If architectural design is needed instead** (e.g., designing the Group F Phase 2 Docker architecture or the Group G QA rubric): switch to `claude-opus-4-8`.

**Session entry point:** Start with `node scripts/ingestion/run-pipeline.js --ticker JPM` to validate the second company end-to-end, then open a separate session for Group I UX work.

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| Company ID normalization | Medium | No `ticker` column on `companies`. Hotel companies use word-slug IDs. The `TICKER_TO_COMPANY_ID` map in `lib/common.js` must be kept in sync as new companies are added to the DB. |
| `phrases.tier` and `phrases.points` NOT NULL | Low | These columns have no default. The admin approve action in `Admin.jsx` inserts hardcoded defaults. Any other insert path that omits these will fail. |
| IHG manual sourcing | Low | IHG is set aside from the ingestion pipeline. Non-standard reporting format means it can only be added manually. No ETA. |
| Low-confidence transcript sources | Low | RHP (Q1/Q4 2022, Q1 2023), CLDT (historical), AHT (Q1 2026 missing), JNJ (several quarters). These are flagged `human_review_required=true` in the source manifest and must be verified before the company is activated. |
| Choice Hotels ticker typo normalized | Resolved | Was researched under `CCH` (typo), normalized to `CHH` (correct). Manifests updated. No action needed. |
| Archive crawling not built | Medium | Most non-MSFT companies in the manifest have index-page URLs, not per-quarter direct URLs. Phase 1 queue-builder marks these as `pending-crawl`. A crawler that resolves per-quarter URLs is a Phase 2 deliverable not yet designed. |
| Stage 4 AI enrichment deferred | Medium | Phase 1 stages all valid candidates for manual review; no AI ranking yet. Until Stage 4 is built, phrase quality depends entirely on human review of raw n-gram candidates. |
| Group C platform configuration pending | Medium | All 5 automation prompt files exist but none of the Claude Code Routines or Codex Automations are live. The agentic PM loop does not run until these are configured. |
| `feat/group-d-admin-console` branch not merged | Low | Local branch exists. Confirm it is fully merged to main; if not, review and merge. |
