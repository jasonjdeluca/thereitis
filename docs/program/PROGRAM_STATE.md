# There It Is — Program State

**Last updated:** 2026-05-30 (session 4)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Groups G, H, I, J — all four built in last session; PRs #21–#24 opened
**In progress:** Group C (platform configuration pending), Group E (Codex Priority 6 official URL repair assigned — human fills in), Group F Phase 2 (PR #20 open)
**Pending human merge:** PR #19 (remaining blue-chip manifests — Priority 3+4 repairs applied), PR #20 (Phase 2 ops-worker), PR #21 (Group I UX), PR #22 (Group G content QA), PR #23 (Group H evergreen + migration 015), PR #24 (Group J QA)
**Codex Priority 5 complete:** All 68 HD/WMT/NKE/DIS official PDF URLs pass; 13 PR #18 companies have no official URLs (all StockAnalysis) — next Codex assignment is Priority 6 official URL repair for those 13 (human fills in task)

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written; naming conflict resolved (Claude Code convention canonical); platform configuration pending — manual setup in Claude Code Routines and Codex Automations platforms. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate, ingestion status column, next call date, sample card preview, recent sessions list |
| E | Transcript Research | 🔄 In Progress | All 30 companies researched and promoted to `company-packs/`. Priority 4 complete: AMGN/JPM/MRK deeper repair; 73 official URLs validated. Priority 5 complete: 68/68 HD/WMT/NKE/DIS official PDFs confirmed; 13 PR #18 companies have no official URLs (StockAnalysis only — AAPL, NVDA, AMZN, CSCO, IBM, CRM, KO, CAT, BA, HON, MMM, SHW, MCD). HD direct PDF URLs confirmed accessible (resolves bot-blocking concern). JNJ: human_review_required. MSFT: HTML-only, StockAnalysis fallback. Priority 6 next: find official PDFs for the 13 StockAnalysis-only PR #18 companies. |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 complete (MSFT, 4,790 phrases). Phase 2 Docker ops-worker built and tested NKE end-to-end: 17/17 PDFs fetched, 7,629 candidates, 40 phrases + migration.sql generated. PR #20 ready for merge. Q4CDN-only fetcher constraint confirmed. |
| G | Content QA | ✅ Complete | `scripts/content-validation.js` expanded with post-generation checks. `CONTENT_QA_RUBRIC.md` written. Codex editorial review prompt at `docs/program/prompts/codex-content-editorial-review.md`. PR #22 open. |
| H | Evergreen Maintenance | ✅ Complete | `scripts/transcript-freshness.js` built (6-flag freshness report, exits non-zero on critical flags). Stale detector integrated. Migration 015 (`latest_ingested_quarter` column) output — human execution required post-merge. `EVERGREEN_MAINTENANCE_RUNBOOK.md` written. Codex stale company exception prompt written. Post-call HTTP watch deferred to Phase 3. PR #23 open. |
| I | Public UX and SEO | ✅ Complete | Companies section, interactive sample card, FAQ added to Landing.jsx (PR #21). SEO (title, OG, Twitter, JSON-LD, canonical, sitemap.xml, robots.txt) was already complete before this session. |
| J | QA and Launch Hardening | ✅ Complete | Playwright smoke + game-flow tests in `tests/`. `scripts/release-readiness.js` built (Green/Yellow/Red posture, cron-detectable). `RELEASE_CHECKLIST.md` written. Codex release-readiness synthesis prompt written. Requires `npx playwright install-deps` on VPS after PR #24 merge. PR #24 open. |
| K | Analytics and Launch | ⬜ Not Started | Phase 3 / post-launch. Launch kit draft staged in `codex/staging/docs/program/LAUNCH_KIT.md` by Codex — awaiting human review before promotion. |

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
| MSFT official HTML confirmed inaccessible | Codex Priority 4 validation: 15 MSFT official IR HTML pages return 403 to Node GET. These are transcript web pages, not PDFs. MSFT stays on StockAnalysis fallback for Phase 2; Phase 1 ingest (4,790 phrases staged) is unaffected since the extractor works against pre-downloaded text. |
| VZ fully official — prime Phase 2 candidate | Codex Priority 4 validated all 17 VZ official PDFs (verizon.com/about/file/* token URLs): 17/17 pass with correct Content-Type and PDF signature. TRV (s26.q4cdn.com) also 10/10 pass. VZ and TRV are the next lowest-risk companies to run through the Phase 2 pipeline. |
| KO official PDF returns 403 | Codex Priority 2 spot check: KO Q1 2026 official transcript PDF on investors.coca-colacompany.com returns 403 application/xml even with browser-like headers. Ingestion access issue — KO may require a different fetch approach or manual download. |

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
| 11 | **Decide latest_ingested_quarter metadata location** | ✅ Resolved in Group H build: migration 015 adds the column to the Supabase `companies` table. Execute migration 015 after merging PR #23. |
| 12 | **Review and merge PR #18** | ✅ Merged 2026-05-30. All 17 original blue-chip source manifests on main. |
| 13 | **Review and merge PR #19** | `feat/remaining-blue-chip-manifests` — 13 remaining blue-chip `company-packs/` entries (MSFT, JPM, GS, AXP, V, TRV, UNH, AMGN, JNJ, MRK, PG, CVX, VZ). Priority 3+4 repairs applied: JPM 8 official rows, MRK 8 official rows, VZ 17/17 official confirmed. MSFT stays on StockAnalysis (official HTML pages return 403). JNJ `human_review_required`. |
| 14 | **Review and merge PR #20** | `feat/phase2-ops-worker` — Phase 2 Docker ops-worker. End-to-end test passed (NKE: 17 PDFs, 40 phrases, migration.sql). Ready to merge. |
| 15 | **Review and merge PR #21** | `feat/group-i-public-ux` — Group I landing page additions (companies section, sample card, FAQ). Build passes. |
| 16 | **Review and merge PR #22** | `feat/group-g-content-qa` — Group G Content QA: expanded `scripts/content-validation.js`, `CONTENT_QA_RUBRIC.md`, Codex editorial review prompt. Ready to merge. |
| 17 | **Review and merge PR #23** | `feat/group-h-evergreen` — Group H Evergreen: `scripts/transcript-freshness.js`, `EVERGREEN_MAINTENANCE_RUNBOOK.md`, Codex stale exception prompt, migration 015. **After merge: execute migration 015 in Supabase.** |
| 18 | **Review and merge PR #24** | `feat/group-j-qa-launch` — Group J QA: Playwright tests, `scripts/release-readiness.js`, `RELEASE_CHECKLIST.md`, Codex release-readiness prompt. **After merge: run `npx playwright install-deps` on VPS.** |
| 19 | **Execute migration 015 after PR #23 merge** | `supabase/migrations/015_latest_ingested_quarter.sql` — adds `latest_ingested_quarter text` column to `companies`. Required for Group H freshness watcher to run. |
| 20 | **Review Codex LAUNCH_KIT.md draft** | Draft at `codex/staging/docs/program/LAUNCH_KIT.md`. Contains tagline, LinkedIn post, X/Twitter drafts, demo script, beta invite template. Human review required before promotion to `docs/program/LAUNCH_KIT.md`. |

---

## Next Recommended Session

**Recommended:** Six PRs require human merge. Merge in this order:
1. **PR #22** (Group G) and **PR #24** (Group J) — no migration, no VPS steps, safe to merge immediately
2. **PR #21** (Group I) — no migration, landing page only
3. **PR #20** (Phase 2 ops-worker) — Docker only, no migration
4. **PR #19** (remaining blue-chip manifests) — source manifests only
5. **PR #23** (Group H) — **merge last**, then immediately execute migration 015 in Supabase and run `npx playwright install-deps` on VPS (can be done in same VPS session as migration)

**After all merges:** Await Codex Priority 5 response (link validation for PR #18 companies). That response will either greenlight PR #18 companies for Phase 2 ingestion or trigger a repair pass.

**Next build task (Claude Code):**
- Run a second company through Phase 1 ingestion pipeline: **VZ** is the recommended choice (17/17 official PDFs confirmed by Priority 4 validation)
- Or begin Group K analytics event tracking (Phase 3 — no blockers, but not urgent before launch)

**Blocking human actions before next session:**
- Merge PR #23 + execute migration 015 (required before `transcript-freshness.js` can produce useful output)
- Configure at least one Claude Code Routine (action items #2–#3) to enable the agentic PM loop

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| Company ID normalization | Medium | No `ticker` column on `companies`. Hotel companies use word-slug IDs. The `TICKER_TO_COMPANY_ID` map in `lib/common.js` must be kept in sync as new companies are added to the DB. |
| `phrases.tier` and `phrases.points` NOT NULL | Low | These columns have no default. The admin approve action in `Admin.jsx` inserts hardcoded defaults. Any other insert path that omits these will fail. |
| IHG manual sourcing | Low | IHG is set aside from the ingestion pipeline. Non-standard reporting format means it can only be added manually. No ETA. |
| Low-confidence transcript sources | Low | RHP (Q1/Q4 2022, Q1 2023), CLDT (historical), AHT (Q1 2026 missing), JNJ (several quarters). These are flagged `human_review_required=true` in the source manifest and must be verified before the company is activated. |
| Choice Hotels ticker typo normalized | Resolved | Was researched under `CCH` (typo), normalized to `CHH` (correct). Manifests updated. No action needed. |
| IR server bot-blocking | Partially resolved | StockAnalysis returns 400. `ir.homedepot.com` HTML catalog pages return 403, but **direct PDF file URLs on ir.homedepot.com pass** (Priority 5 confirmed 17/17 HD PDFs at HTTP 200). The constraint is catalog/navigation pages, not direct PDF links. Phase 2 fetcher can process HD and any company with direct PDF URLs in their source manifest. Companies with only StockAnalysis fallback URLs (AAPL, NVDA, AMZN, CSCO, IBM, CRM, KO, CAT, BA, HON, MMM, SHW, MCD) still need official PDF source repair before Phase 2 can fetch them. |
| Phase 2 trivia pass rate | Low | Stage 4 Claude Haiku still includes person names in ~75% of trivia despite explicit prompt instruction. Stage 5 correctly rejects them. Prompt strengthened; retry loop not yet built. NKE test: 4/15 trivia passed. Acceptable for now; fix before batch production runs. |
| Group C platform configuration pending | Medium | All 5 automation prompt files exist but none of the Claude Code Routines or Codex Automations are live. The agentic PM loop does not run until these are configured. |
| `feat/group-d-admin-console` branch not merged | Low | Local branch exists. Confirm it is fully merged to main; if not, review and merge. |
| HD/WMT/NKE/DIS source manifests repaired | Resolved | PR #18 merged. All 68 quarters use official IR-domain sources. |
| Phase 2 Docker ops-worker built and tested | Resolved | NKE end-to-end test passed. PR #20 ready. Awaiting human merge. |
| Groups G, H, I, J built; PRs open | Info | All four PRs (#21–#24) are open and review-ready. No migration required except PR #23 (migration 015). |
| KO official PDF access blocked | Low | investors.coca-colacompany.com returns 403 even with browser-like headers. KO ingestion will need manual download or a browser-emulation strategy. Not a blocker for other companies. |
| MSFT official HTML pages inaccessible | Resolved | Confirmed 403 to Node GET (HTML transcript pages, not PDFs). MSFT Phase 1 pipeline already validated on StockAnalysis fallback; Phase 2 will continue that approach. |
| Codex Priority 5 outstanding | Low | Link validation for PR #18 companies (AAPL, NVDA, AMZN, CSCO, HD, IBM, CRM, KO, WMT, NKE, DIS, CAT, BA, HON, MMM, SHW, MCD) is assigned and in Codex inbox. No blocker for merges. |
