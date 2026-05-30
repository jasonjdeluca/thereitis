# There It Is — Program State

**Last updated:** 2026-05-30 (session 5)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** `ai-select.js` built and run for MSFT (50 selected / 4,740 rejected) and VZ (50 selected / 5,070 rejected); Admin PhraseReviewPanel updated to show ai_selected rows; BA/KO/MMM/CAT/SHW source manifests promoted to official URLs; queue-builder wired with 5 new builders; migration 016 added (RLS policy for ai-select)
**In progress:** Group C (platform configuration pending), Group E (Codex Priority 7 blocked — NKE generated files not in repo), Group F (MSFT + VZ ready for human phrase review)
**Awaiting human review:** 50 MSFT ai_selected phrases + 50 VZ ai_selected phrases in admin PhraseReviewPanel
**Awaiting Codex:** Priority 7 NKE editorial review still blocked (phrases.json + trivia.json not committed); release readiness issue #28 posted with fallback data

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written; naming conflict resolved (Claude Code convention canonical); platform configuration pending — manual setup in Claude Code Routines and Codex Automations platforms. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate, ingestion status column, next call date, sample card preview, recent sessions list |
| E | Transcript Research | ✅ Complete | All 30 companies researched. Priorities 1–6 done. KO/BA/MMM/HD/WMT/NKE/DIS fully official (17/17 each). VZ 17/17 official confirmed. AAPL/NVDA/AMZN/CSCO/HON/MCD confirmed no written transcript PDFs — structural limitation. JNJ: human_review_required. MSFT: HTML-only, StockAnalysis fallback. All manifests in `company-packs/` (17 on main via PR #18; 13 in codex/staging pending promotion). |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 complete: MSFT 4,790→50 ai_selected; VZ 5,120→50 ai_selected. `ai-select.js` built and run. Admin panel updated to show ai_selected rows. **Next: human phrase review (50 phrases per company).** Phase 2 ops-worker merged and tested (NKE: 40 phrases generated). |
| G | Content QA | 🔄 In Progress | Scripts and rubric complete and merged. NKE is first company with Stage 4 output (40 phrases, 4 trivia). Codex Priority 7 editorial review in progress — NKE phrases/trivia assessment against rubric. |
| H | Evergreen Maintenance | ✅ Complete | `transcript-freshness.js` merged. Migration 015 live (executed 2026-05-30). Runbook and Codex exception prompt merged. Post-call HTTP watch deferred to Phase 3. |
| I | Public UX and SEO | ✅ Complete | Companies section, interactive sample card, FAQ merged (PR #21). SEO already complete. |
| J | QA and Launch Hardening | ✅ Complete | Playwright tests, release-readiness.js, RELEASE_CHECKLIST.md all merged. VPS needs `npx playwright install-deps`. Current posture: **Yellow** (0 blockers, 13 warnings). Codex Priority 7 release readiness synthesis in progress. |
| K | Analytics and Launch | 🔄 In Progress | `docs/program/LAUNCH_KIT.md` promoted from Codex staging (merged PR #26). Human review required before publishing any copy. Analytics event tracking, snapshot script, and feedback form still not started. |

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
| Phase 1 pipeline stages too many candidates | Medium | Phase 1 stages all valid n-gram candidates (4,790 MSFT, 5,120 VZ) — Stage 4 AI selection was never wired into Phase 1. `ai-select.js` must be built before human phrase review is feasible. See next session entry point. |
| VZ queue-builder was using HTML webcast URLs | Resolved | Fixed in PR #26: updated to use direct PDF download URLs from source_manifest.json. VZ re-run successful (5,120 phrases staged). |
| PDF character-spaced headers produce garbage n-grams | Resolved | Fixed in PR #26: validator now rejects any phrase where a token is a single non-'a' letter (`single_char_token` rejection reason). VZ re-run confirmed clean top phrases. |
| Priority 6 promotions complete (BA/KO/MMM/CAT/SHW) | Resolved | BA (17/17 q4cdn), KO (17/17 official IR), MMM (17/17 CloudFront), CAT (9/17 q4cdn + 8/17 StockAnalysis), SHW (8/17 q4cdn + 9/17 StockAnalysis). source_manifest.json promoted and queue-builder wired for all 5. IBM (4/17) and CRM (1/17) deferred — too few official rows to be useful. |
| Migration 016 pending execution | Medium | `016_phrase_staging_ai_select_policy.sql` — adds RLS UPDATE policy allowing anon key to transition phrase_staging rows from 'pending' to 'ai_selected' or 'ai_rejected'. Required before `ai-select.js` can update rows in production. |
| NKE trivia gap | Low | Stage 4 generated only 4 NKE trivia questions; minimum for activation is 12. Codex Priority 7 editorial review will flag this. Stage 4 trivia prompt needs strengthening. |

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Review MSFT and VZ phrases in admin panel** | `ai-select.js` has run for both companies. Admin panel now shows ai_selected rows (50 per company). Go to `/admin` → Phrase Staging Review. Approve or reject each phrase. Run migration 016 first (see item #14 below). |
| 2 | **`npx playwright install-deps` on VPS** | Required before Playwright tests can run in the cron environment. One-time VPS command after PR #24 merged (now on main). |
| 3 | **Configure Claude Code Routine: Daily PM Brief** | Prompt file at `docs/program/prompts/routine-pm-brief.md`. Trigger: schedule, 6:15am ET weekdays. Repo: thereitis. Needs manual setup in Claude Code Routines platform. |
| 4 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt file at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label applied to a GitHub issue. Needs manual setup. |
| 5 | **Configure Codex Automation: Weekly content quality summary** | Prompt file at `docs/program/prompts/codex-content-quality.md`. Trigger: Friday 8:00am ET. |
| 6 | **Configure Codex Automation: Nightly ingestion queue triage** | Prompt file at `docs/program/prompts/codex-ingestion-triage.md`. Trigger: 9:30pm ET during active onboarding. |
| 7 | **Configure Codex Automation: Overflow PM brief** | Prompt file at `docs/program/prompts/codex-pm-brief-overflow.md`. Trigger: daily 8:00am ET, fires only if no Routine brief posted today. |
| 8 | **Review human_review_required sources before ingestion** | RHP (intermittent PDFs Q1/Q4 2022, Q1 2023), CLDT (historical quarters low-confidence), AHT (Q1 2026 missing), JNJ (several quarters pattern-matched not directly verified). |
| 9 | **Add hospitality REIT companies to DB** | HST, RHP, APLE, PK, RLJ are researched but not in the `companies` table. Required before pipeline can process them. (RHP, CLDT, AHT added via migration 014.) |
| 10 | **Migrations executed** | ✅ Migration 014 (12 companies added) — done 2026-05-30. ✅ Migration 015 (`latest_ingested_quarter`) — done 2026-05-30. |
| 11 | **All PRs #19–#24 and #26 merged** | ✅ Done 2026-05-30. All on main. |
| 12 | **Review LAUNCH_KIT.md** | `docs/program/LAUNCH_KIT.md` promoted and on main. Review copy; replace `"Beta access is opening soon"` and `"[beta link]"` placeholders before publishing anything. |
| 13 | **Priority 6 promotions complete** | ✅ Done 2026-05-30 (session 5). BA, KO, MMM, CAT, SHW manifests promoted and queue-builder wired. |
| 14 | **Execute migration 016** | `supabase/migrations/016_phrase_staging_ai_select_policy.sql` — run in Supabase SQL editor. Adds RLS UPDATE policy allowing anon key to set ai_selected/ai_rejected. Required before `ai-select.js` can write status updates to phrase_staging. |
| 15 | **Review MSFT and VZ phrases in admin panel** | Go to `/admin` → Phrase Staging Review. 50 ai_selected phrases per company are ready. Approve the good ones, reject the bad. Run migration 016 first. |
| 16 | **Deposit NKE generated files for Codex Priority 7** | `company-packs/NKE/generated/phrases.json` and `trivia.json` need to be committed under `codex/staging/` before Codex can do the editorial review. These files are in the ops-worker output volume on the host; they were never committed to the repo. |

---

## Next Recommended Session

**Session 5 is complete.** ai-select.js built, MSFT + VZ phrases narrowed to 50 each, BA/KO/MMM/CAT/SHW manifests promoted.

**Next session entry point (Claude Code):**
1. Check if migration 016 has been executed; if not, prompt human
2. Run Phase 2 pipeline for BA (17/17 official q4cdn PDFs — clean ingestion candidate)
3. Configure at least one Claude Code Routine (action item #3) to start the agentic PM loop
4. If NKE generated files are deposited: trigger Codex Priority 7 re-run for editorial review

**Human action needed before next session:**
- Execute migration 016 (action item #14 above)
- Review MSFT and VZ phrases in admin panel (action item #15)
- Deposit NKE generated content for Codex editorial review (action item #16)

**Model:** `claude-sonnet-4-6`. Switch to `claude-opus-4-8` only if designing the ai-select prompt or the queue-builder promotion strategy from scratch.

**Human action needed before session:**
- Run `npx playwright install-deps` on VPS (one-time, unblocks test cron)
- Review and configure at least one Routine (action items #3–#4)

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
