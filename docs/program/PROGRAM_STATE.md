# There It Is — Program State

**Last updated:** 2026-06-01 (session 18 continued)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Session 18 — (1) Trivia rewrite P15 applied, ai-select prompt revised, staging branch reports promoted. (2) Pipeline investigation: root cause of REQUESTED stuck = ~/thereitis/logs/ directory missing → cron silently failed. Fixed. JNJ pipeline completed (4/17 quarters fetched, extracted, now in review-queue). AMGN blocked — 16/17 StockAnalysis + 1 dead investors.amgen.com URL; reset to sources_ready. (3) Four game bugs fixed in PR #45: blank screen after bingo (TIER?.dot), lowercase tiles, repeated fun_fact (75 COALESCE rows cleared), missing company badges (6 new + case-insensitive matching).
**Awaiting human action:** Merge PR #45; activate NKE/VZ/TRV via Override in admin panel
**Awaiting Codex:** Nothing currently assigned

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added, all new-company game bugs fixed (session 17) |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written and quality-edited (merged PR #32). Platform configuration pending — manual setup in Claude Code Routines and Codex Automations. |
| D | Admin Console | ✅ Complete | Readiness table, activation gate + override button, Company Details (all 41 companies dynamic), Ingestion Pipeline panel |
| E | Transcript Research | ✅ Complete | All 30 blue-chip + 11 hotel companies in DB (41 total). All source manifests in `company-packs/`. |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 complete for 11 companies. Phase 2 Docker ops-worker built. Admin control plane + poller cron live. Enrichment queue empty. Next step: run pipeline for more companies via admin panel. |
| G | Content QA | 🔄 In Progress | Scripts and rubric complete. Codex Priority 15 trivia rewrite queued — output will land at `codex/staging/reports/trivia-rewrite-2026-06-01.sql`. |
| H | Evergreen Maintenance | ✅ Complete | `transcript-freshness.js` merged. Migration 015 live. Runbook and Codex exception prompt merged. |
| I | Public UX and SEO | ✅ Complete | CompaniesSection, SampleCard, FAQ, SEO all merged. Company selector now fully dynamic (session 17). |
| J | QA and Launch Hardening | ✅ Complete | Playwright tests, release-readiness.js, RELEASE_CHECKLIST.md all merged. |
| K | Analytics and Launch | 🔄 In Progress | LAUNCH_KIT.md promoted from Codex staging. Analytics tracking, snapshot script, and feedback form not started. |

---

## Key Decisions

| Decision | Detail |
|---|---|
| Phrases table: unique constraint | Migration 019 added UNIQUE(company_id, phrase). Required by ON CONFLICT DO NOTHING. |
| Admin RLS fix (migration 017) | phrases_insert/update/delete_admin switched from auth.role() to auth.uid() IS NOT NULL. |
| Layer 2 pipeline | Extractor clips at Q&A boundary, extracts prepared-remarks paragraphs only. MIN_APPROVED_PHRASES=12. |
| migration.sql phrases inserted is_active=false | All migration.sql insert phrases inactive. After applying: `UPDATE phrases SET is_active=true WHERE company_id='{id}' AND is_active=false;` |
| Subscription enrichment model | Phrase selection + trivia writing done by Claude Code subscription, never the Anthropic API. See ENRICHMENT_QUEUE.md. |
| Admin ingestion control plane | Admin panel triggers Docker pipeline. Poller (`scripts/ingestion/poller.js`) runs on VPS cron every 3 min + nightly --enqueue. Migration 018 live. |
| Activation override button | Admin panel shows "Override →" link below "Cannot Activate" for companies below criteria. |
| card.js: standard tier → warm | Pipeline-ingested phrases use tier='standard'. card.js derivePools() maps standard→warm. |
| card.js: Trinity is Hilton-only | TRINITY=["Brand-Led","Network-Driven","Platform-Enabled"] only placed when all 3 exist in company pool. Skipped for all other companies. |
| CompanySelect: fully dynamic | Removed COMPANY_ORDER hardcoded list. Now queries is_active=true from DB, sorts live-first then alphabetical. |
| Admin Company Details: fully dynamic | Removed COMPANY_ORDER filter. All 41 companies now appear sorted active-first then alphabetical. |
| Trivia options: sentence-cased at render | TriviaQuiz.jsx capitalizes first letter of each option at render. No DB changes needed. |
| fun_fact fallback | TriviaQuiz shows fun_fact if present; "Answer: X" if wrong/timeout without fun_fact; "Nailed it." if correct without fun_fact. |
| TRV trivia: wrong-company content | All 11 TRV trivia rows describe a retail company, not Travelers Insurance. Codex Priority 15 replaces them entirely. |
| Production SQL requires human approval | All Supabase migrations output as SQL files, executed manually. Never auto-run. |
| Company ID normalization | No `ticker` column on `companies`. Hotel IDs are word-slugs; blue-chips match lowercase ticker. `TICKER_TO_COMPANY_ID` in `scripts/ingestion/lib/common.js` is authoritative. |
| Opus for architecture, Sonnet for execution | claude-opus-4-8 for architectural decisions; claude-sonnet-4-6 for implementation. |
| Model IDs | Opus 4.8: `claude-opus-4-8` · Sonnet 4.6: `claude-sonnet-4-6` · Haiku 4.5: `claude-haiku-4-5-20251001` |
| codex/staging ↔ codex/inbox | Codex deposits work to `codex/staging/`; Claude Code writes task assignments to `codex/inbox/`. PROTOCOL.md is source of truth. |

---

## Live Companies (as of 2026-06-01)

| Company | Active Phrases | Trivia | Status |
|---|---|---|---|
| **Hilton** | 51 | 42 | ✅ LIVE |
| **Home Depot** | 58 | 11 | ✅ LIVE (override — 1 below trivia min) |
| **3M** | 55 | 12 | ✅ LIVE |
| **Boeing** | 51 | 12 | ✅ LIVE |
| **Coca-Cola** | 50 | 12 | ✅ LIVE |

---

## Activation Readiness (as of 2026-06-01)

| Company | Active Phrases | Trivia | Gap | Notes |
|---|---|---|---|---|
| NKE | 46 | 6 | 6 trivia | Needs trivia rewrite (Priority 15) + 6 more; use Override when ready |
| VZ | 39 | 0 | 12 trivia | Trivia rewrite (Priority 15) creates 12 new rows |
| JPM | 34 | 12 | 16 phrases | Trivia rewrite needed (P15); more pipeline runs for phrases |
| CAT | 32 | 12 | 18 phrases | More pipeline runs needed |
| WMT | 26 | 8 | 24 phrases + 4 trivia | Trivia rewrite (P15) + more pipeline |
| MRK | 21 | 12 | 29 phrases | More pipeline runs needed |
| TRV | 20 | 11 | ⚠️ wrong-company trivia | Full trivia replacement via P15; phrases are fine |
| SHW | 20 | 12 | 30 phrases | More pipeline runs needed |
| DIS | 17 | 6 | 33 phrases + 6 trivia | Trivia rewrite (P15) + more pipeline |
| V | 0 active / 13 total | 0 | Flip phrases active + full rebuild | Run `UPDATE phrases SET is_active=true WHERE company_id='v' AND is_active=false;` then rebuild trivia |
| MSFT | 6 | 0 | StockAnalysis blocked | Need official q4cdn sources |

**Companies with 0 phrases:** GS, AXP, CVX, PG, UNH, AMGN, AAPL, NVDA, AMZN, CSCO, HON, IBM, MCD, CRM — all require official PDF sources before Phase 2 can fetch them.

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Merge PR #45** | Game polish: blank screen fix, tile casing, fun_fact, company badges |
| 2 | **Activate NKE via Override** | 12 trivia rows live. 46 phrases — use Override in admin panel |
| 3 | **Activate VZ via Override** | 12 trivia rows live. 39 phrases — use Override in admin panel |
| 4 | **Activate TRV via Override** | 11 trivia rows (insurance-relevant). 20 phrases — use Override in admin panel |
| 5 | **Run enrichment for JNJ** | `node scripts/ingestion/process-review-queue.js` — JNJ is in review-queue with 4 quarters extracted |
| 6 | **Flip V phrases active** | `UPDATE phrases SET is_active=true WHERE company_id='v' AND is_active=false;` then full trivia rebuild |
| 7 | **Run pipeline for more companies** | Click "Run Pipeline" in admin Ingestion panel — more phrase runs needed for CAT/JPM/SHW/MRK/DIS/WMT |
| 8 | **Configure Claude Code Routine: Daily PM Brief** | Prompt at `docs/program/prompts/routine-pm-brief.md`. Trigger: 6:15am ET weekdays. |
| 9 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label. |
| 10 | **Configure Codex Automations (3)** | content-quality, ingestion-triage, pm-brief-overflow — prompts in `docs/program/prompts/` |
| 11 | **`npx playwright install-deps` on VPS** | One-time. Unblocks Playwright tests in VPS cron. |
| 12 | **Review LAUNCH_KIT.md** | Replace placeholder text before publishing any copy. |

---

## Next Recommended Session

**Entry point (Claude Code):**
1. Check enrichment queue: `node scripts/ingestion/process-review-queue.js --list`
2. Check Codex inbox for new assignments
3. Run Phase 2 pipeline for more companies to close phrase gaps: CAT/JPM/SHW/MRK/DIS/WMT all need 20–30+ more phrases
4. After pipeline runs: enrich via review queue to push companies toward 50-phrase minimum
5. Consider trivia for DIS (6 rows) and WMT (8 rows) — both need 4–6 more before activation

**Model:** `claude-sonnet-4-6` for all implementation. `claude-opus-4-8` for architectural decisions only.

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| Phrase counts still thin | High | CAT/JPM/SHW/MRK/DIS/WMT all need 20–30+ more active phrases before activation. More pipeline runs + enrichment sessions needed. |
| Phase 2 Docker blocked on StockAnalysis | Medium | MSFT, GS, AXP, UNH, AMGN, CVX, PG, CRM, IBM, HON, MCD, AAPL, NVDA, AMZN, CSCO need official q4cdn sources. AMGN: dead investors.amgen.com URL also needs repair. |
| Group C platform config pending | Medium | All 5 automation prompts exist but Routines and Automations are not live. PM loop does not run. |
| V phrases still inactive | Medium | 13 phrases in DB as is_active=false. Run UPDATE before activating. |
| Ingestion poller cron log dir | Low | Fixed in session 18 — ~/thereitis/logs/ now exists. Cron should run cleanly going forward. |
| Post-call HTTP transcript watch | Low | Date-arithmetic detection implemented; automated HTTP check deferred to Phase 3. |
| KO official PDF blocked | Low | investors.coca-colacompany.com returns 403. Phase 2 re-fetch needs manual download or browser-emulation. |
