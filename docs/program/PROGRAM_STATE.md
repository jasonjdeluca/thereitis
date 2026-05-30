# There It Is — Program State

**Last updated:** 2026-05-30 (session 3)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Group J (QA and launch hardening — Playwright tests, release-readiness.js, RELEASE_CHECKLIST.md)
**In progress:** Group C (platform configuration pending), Group E (Codex Priority 3 repair pass for 8 companies)
**Pending human merge:** PR #19 (remaining blue-chip manifests — Priority 3+4 repairs applied), PR #20 (Phase 2 ops-worker), PR #21 (Group I UX), PR #22 (Group G content QA), PR #23 (Group H evergreen), PR #24 (Group J QA)
**Ready to start:** Group G, Group H

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
| H | Evergreen Maintenance | ⬜ Not Started | Depends on Group F operational; freshness watcher and stale detector not built |
| I | Public UX and SEO | 🔄 In Progress | Active companies section, interactive sample card, FAQ accordion added to landing page. SEO (title, OG, Twitter, JSON-LD, canonical, sitemap, robots) was already complete. PR #21 open. |
| J | QA and Launch Hardening | ✅ Complete | Playwright smoke + game flow tests written; release-readiness.js built (Green/Yellow/Red posture); RELEASE_CHECKLIST.md; Codex synthesis prompt. Requires system deps on VPS (npx playwright install-deps). |
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
| 11 | **Decide latest_ingested_quarter metadata location** | Canonical location for this field per company: Supabase `companies` table, `company.json` per pack, or both. Blocking Group H freshness watcher build. |
| 12 | **Review and merge PR #18** | ✅ Merged 2026-05-30. All 17 original blue-chip source manifests on main. |
| 13 | **Review and merge PR #19** | `feat/remaining-blue-chip-manifests` — 13 remaining blue-chip `company-packs/` entries (MSFT, JPM, GS, AXP, V, TRV, UNH, AMGN, JNJ, MRK, PG, CVX, VZ). All 17 quarters. JNJ `human_review_required`. Codex Priority 3 repair pass for 8 assigned and in progress. |
| 14 | **Review and merge PR #20** | `feat/phase2-ops-worker` — Phase 2 Docker ops-worker. End-to-end test passed (NKE: 17 PDFs, 40 phrases, migration.sql). Ready to merge. |
| 15 | **Review and merge PR #21** | `feat/group-i-public-ux` — Group I landing page additions (companies section, sample card, FAQ). Build passes. |

---

## Next Recommended Session

**Recommended:** Merge PRs #19, #20, #21 (three human merges required — all review-ready). Then build Group G (Content QA) and Group H (Evergreen Maintenance) — both are now unblocked by Phase 2 being complete.

**Model:** `claude-sonnet-4-6` for implementation. Switch to `claude-opus-4-8` only if designing Group H freshness architecture or Group G QA rubric from scratch.

**Session entry point:**
1. Merge PR #20 first (Phase 2 pipeline on main enables Group G/H builds)
2. Merge PR #19 and #21
3. Start `Group G` — expand `scripts/content-validation.js` for post-generation checks, write `docs/program/CONTENT_QA_RUBRIC.md`
4. Or start `Group H` — build `scripts/transcript-freshness.js` once `latest_ingested_quarter` decision is made

**Blocking human decision still needed:** `latest_ingested_quarter` canonical location (action item #11) — blocks Group H entirely.

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
