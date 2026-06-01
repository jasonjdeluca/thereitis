# There It Is — Program State

**Last updated:** 2026-06-01 (session 17)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Session 17 — Fixed all new-company game breakage: bingo card blank screen (card.js standard→warm tier mapping, Trinity skipped for non-Hilton), company selector was hardcoded to 7 companies (now fully dynamic), trivia options were lowercase (now capitalized), fun_fact fallback added, admin Company Details section hardcoded (now shows all 41). Phrases flipped active for VZ/NKE/WMT/DIS/TRV. CAT/JPM/MRK/SHW migrations applied and phrases activated. Codex Priority 15 trivia rewrite task queued (13 companies, wrong distractors, TRV wrong-company content, missing fun_facts). 5 companies now live: Hilton, HD, MMM, BA, KO.
**Awaiting human action:** Activate remaining companies via admin panel once trivia rewrite lands; configure Group C automations
**Awaiting Codex:** Priority 15 — trivia rewrite SQL at `codex/staging/reports/trivia-rewrite-2026-06-01.sql`

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
| 1 | **Review and apply Codex P15 trivia SQL** | When `codex/staging/reports/trivia-rewrite-2026-06-01.sql` appears, review and apply via Supabase MCP |
| 2 | **Activate NKE/VZ via Override** | After P15 lands: NKE has 46 phrases (needs 6 more trivia); VZ will have 12 trivia after P15 |
| 3 | **Activate TRV via Override** | After P15 replaces wrong-company trivia: 20 phrases, 11 trivia — use Override |
| 4 | **Flip V phrases active** | `UPDATE phrases SET is_active=true WHERE company_id='v' AND is_active=false;` then full trivia rebuild |
| 5 | **Run pipeline for more companies** | Click "Run Pipeline" in admin Ingestion panel — fetches/extracts/validates companies with official PDFs |
| 6 | **Configure Claude Code Routine: Daily PM Brief** | Prompt at `docs/program/prompts/routine-pm-brief.md`. Trigger: 6:15am ET weekdays. |
| 7 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label. |
| 8 | **Configure Codex Automations (3)** | content-quality, ingestion-triage, pm-brief-overflow — prompts in `docs/program/prompts/` |
| 9 | **`npx playwright install-deps` on VPS** | One-time. Unblocks Playwright tests in VPS cron. |
| 10 | **Review LAUNCH_KIT.md** | Replace placeholder text before publishing any copy. |

---

## Next Recommended Session

**Entry point (Claude Code):**
1. Check enrichment queue: `node scripts/ingestion/process-review-queue.js --list`
2. Check if Codex P15 trivia SQL has landed: `ls codex/staging/reports/` — if present, review and apply
3. Run Phase 2 pipeline for more companies via admin Ingestion panel or: `node scripts/ingestion/poller.js --enqueue`
4. Once trivia rewrite applied: activate NKE, VZ, TRV via Override in admin panel
5. Plan next phrase batch: CAT/JPM/SHW/MRK all need 20–30 more phrases — either more pipeline runs or enrichment from review-queue

**Model:** `claude-sonnet-4-6` for all implementation. `claude-opus-4-8` for architectural decisions only.

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| Trivia wrong-answer quality | High | New company trivia has absurd distractors and missing fun_facts. Codex P15 in progress. |
| TRV wrong-company trivia | High | All 11 TRV rows describe a retail company. P15 replaces them entirely. |
| Phase 2 Docker blocked on StockAnalysis | Medium | MSFT, GS, AXP, UNH, AMGN, CVX, PG, CRM, IBM, HON, MCD, AAPL, NVDA, AMZN, CSCO need official q4cdn sources before Phase 2 can fetch. |
| Group C platform config pending | Medium | All 5 automation prompts exist but Routines and Automations are not live. PM loop does not run. |
| V phrases still inactive | Medium | 13 phrases in DB as is_active=false. Run UPDATE before activating. |
| Phase 2 trivia person-name pass rate | Low | Stage 4 Haiku includes person names in ~75% of trivia; Stage 5 rejects correctly. Prompt strengthened. |
| Post-call HTTP transcript watch | Low | Date-arithmetic detection implemented; automated HTTP check deferred to Phase 3. |
| KO official PDF blocked | Low | investors.coca-colacompany.com returns 403. Phase 2 re-fetch needs manual download or browser-emulation. |
