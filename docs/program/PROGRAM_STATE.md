# There It Is — Program State

**Last updated:** 2026-05-30 (session 4)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Group G (content QA), Group H (evergreen maintenance)
**In progress:** Group C (platform configuration pending), Group E (Codex Priority 4 repair pass for AMGN/JPM/MRK + link validation)
**Pending human merge:** PR #19 (remaining blue-chip manifests — updated with Codex Priority 3 repairs), PR #20 (Phase 2 ops-worker), PR #21 (Group I UX), PR #22 (Group G content QA), PR #23 (Group H evergreen)
**Blocking migration:** 015_latest_ingested_quarter.sql (output in PR #23 — execute before Group H runs)

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written; naming conflict resolved (Claude Code convention canonical); platform configuration pending — manual setup in Claude Code Routines and Codex Automations platforms. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate, ingestion status column, next call date, sample card preview, recent sessions list |
| E | Transcript Research | 🔄 In Progress | All 30 target companies researched. 5 with fully official IR sources (HD, WMT, NKE, DIS, KO). 8 pending official-source repair pass (MSFT, JPM, V, TRV, AMGN, JNJ, MRK, VZ — assigned to Codex Priority 3). 17 using third-party as best available. JNJ: human_review_required. Reconciliation task closed — no prior tables existed. |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 complete (MSFT, 4,790 phrases). Phase 2 Docker ops-worker built and tested NKE end-to-end: 17/17 PDFs fetched, 7,629 candidates, 40 phrases + migration.sql generated. PR #20 ready. Key finding: only Q4CDN vendor-hosted PDFs accessible for Phase 2 fetcher — ir.homedepot.com and StockAnalysis both block bots. |
| G | Content QA | ⬜ Not Started | Depends on Group F generating output; no validation expansion or QA rubric written yet |
| H | Evergreen Maintenance | ✅ Complete | transcript-freshness.js built (all flags), migration 015 output for latest_ingested_quarter, EVERGREEN_MAINTENANCE_RUNBOOK.md written, Codex weekly exception prompt written. ops-worker integration (writing field post-Stage 5) deferred to first production run. Automated IR HTTP check deferred Phase 3. |
| I | Public UX and SEO | 🔄 In Progress | Active companies section, interactive sample card, FAQ accordion added to landing page. SEO (title, OG, Twitter, JSON-LD, canonical, sitemap, robots) was already complete. PR #21 open. |
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
| Phase 2 fetcher: Q4CDN only | `ir.homedepot.com` and StockAnalysis both block automated fetching (403/400). Phase 2 Docker fetcher can only reliably download from Q4CDN vendor-hosted PDFs. Confirmed working: NKE (`s1.q4cdn.com`), confirmed in spot checks: V, TRV, MRK. This is why Codex Priority 3 (official source repair) directly unblocks the pipeline. |
| ANTHROPIC_API_KEY in thereitis/.env | Key is now in `~/thereitis/.env` for docker compose validator service. Never commit `.env`. |
| `latest_ingested_quarter` lives in Supabase | Decision: Option A — Supabase `companies` table column, not company.json. Written by ops-worker after Stage 5. Read by transcript-freshness.js via Supabase client. Migration 015 required (human-approved). |

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
| 10 | **DB migration executed** | ✅ Done 2026-05-30. Migration 014 added 12 missing companies (BA, CAT, HD, HON, MCD, MMM, NKE, SHW, WMT, RHP, CLDT, AHT). DB now has 41 companies. |
| 11 | **Execute migration 015** | `supabase/migrations/015_latest_ingested_quarter.sql` — adds `latest_ingested_quarter text` column to companies table. Required before transcript-freshness.js can write/read this field. Decision: Option A (Supabase only) confirmed. |
| 12 | **Review and merge PR #18** | ✅ Merged 2026-05-30. All 17 original blue-chip source manifests on main. |
| 13 | **Review and merge PR #19** | `feat/remaining-blue-chip-manifests` — 13 remaining blue-chip `company-packs/` entries (MSFT, JPM, GS, AXP, V, TRV, UNH, AMGN, JNJ, MRK, PG, CVX, VZ). All 17 quarters. JNJ `human_review_required`. Codex Priority 3 repair pass for 8 assigned and in progress. |
| 14 | **Review and merge PR #20** | `feat/phase2-ops-worker` — Phase 2 Docker ops-worker. End-to-end test passed (NKE: 17 PDFs, 40 phrases, migration.sql). Ready to merge. |
| 15 | **Review and merge PR #21** | `feat/group-i-public-ux` — Group I landing page additions (companies section, sample card, FAQ). Build passes. |

---

## Next Recommended Session

**Recommended:** Merge PRs #19–23 and execute migration 015. Then:
- Wire ops-worker to write `latest_ingested_quarter` after Stage 5 success (small follow-up to PR #20 merge)
- Run NKE editorial review via Codex once PR #20 merges (use `docs/program/prompts/codex-content-editorial-review.md`)
- Check Codex Priority 4 inbox (AMGN/JPM/MRK repair pass + link validation)
- Start Group J (Playwright smoke tests, release readiness script)

**Model:** `claude-sonnet-4-6` for ops-worker wiring and Group J implementation.

**Session entry point:**
1. Check Codex Priority 4 inbox
2. Merge PRs #19, #20, #21, #22, #23
3. Execute migration 015 in Supabase (adds `latest_ingested_quarter` column)
4. Wire `latest_ingested_quarter` write into ops-worker/validator (follow-up to PR #20)
5. Start Group J — Playwright smoke tests + release readiness script

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| Company ID normalization | Medium | No `ticker` column on `companies`. Hotel companies use word-slug IDs. The `TICKER_TO_COMPANY_ID` map in `lib/common.js` must be kept in sync as new companies are added to the DB. |
| `phrases.tier` and `phrases.points` NOT NULL | Low | These columns have no default. The admin approve action in `Admin.jsx` inserts hardcoded defaults. Any other insert path that omits these will fail. |
| IHG manual sourcing | Low | IHG is set aside from the ingestion pipeline. Non-standard reporting format means it can only be added manually. No ETA. |
| Low-confidence transcript sources | Low | RHP (Q1/Q4 2022, Q1 2023), CLDT (historical), AHT (Q1 2026 missing), JNJ (several quarters). These are flagged `human_review_required=true` in the source manifest and must be verified before the company is activated. |
| Choice Hotels ticker typo normalized | Resolved | Was researched under `CCH` (typo), normalized to `CHH` (correct). Manifests updated. No action needed. |
| IR server bot-blocking | Medium | `ir.homedepot.com` returns 403; StockAnalysis returns 400 for all automated requests. Only Q4CDN vendor-hosted PDFs (`s1/s21/s26.q4cdn.com`) confirmed accessible for Phase 2 fetcher. Companies relying on ir.* or StockAnalysis URLs cannot be processed by Phase 2 until Codex Priority 3 repair resolves official Q4CDN URLs, or a browser-emulation fetch strategy is added. |
| Phase 2 trivia pass rate | Low | Stage 4 Claude Haiku still includes person names in ~75% of trivia despite explicit prompt instruction. Stage 5 correctly rejects them. Prompt strengthened; retry loop not yet built. NKE test: 4/15 trivia passed. Acceptable for now; fix before batch production runs. |
| Group C platform configuration pending | Medium | All 5 automation prompt files exist but none of the Claude Code Routines or Codex Automations are live. The agentic PM loop does not run until these are configured. |
| `feat/group-d-admin-console` branch not merged | Low | Local branch exists. Confirm it is fully merged to main; if not, review and merge. |
| HD/WMT/NKE/DIS source manifests repaired | Resolved | PR #18 merged. All 68 quarters use official IR-domain sources. |
| Phase 2 Docker ops-worker built and tested | Resolved | NKE end-to-end test passed. PR #20 ready. Awaiting human merge. |
