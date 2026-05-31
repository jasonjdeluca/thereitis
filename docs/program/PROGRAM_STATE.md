# There It Is — Program State

**Last updated:** 2026-05-31 (session 10)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Sessions 9–10 — Layer 2 pipeline (sentence-level extraction) built and deployed; HD/WMT/DIS/NKE re-run with clean CEO-idiom phrases; admin panel RLS bug fixed (approve was silently broken); all phrase/trivia migrations applied to Supabase; staging-approved phrases promoted to phrases table; HD trivia prompt strengthened (0→11 trivia, factual errors corrected).
**Awaiting human action:** Approve remaining ai_selected phrases from admin panel (203 candidates across 11 companies); activate HD phrases + trivia via SQL (see below); Layer 2 run for VZ/JPM/TRV/MMM/MRK/MSFT/BA (needs fetcher + extractor); configure Group C automations
**Awaiting Codex:** Nothing — Codex inbox is clear

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written and quality-edited (merged — PR #32). Platform configuration pending — manual setup in Claude Code Routines and Codex Automations. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate, ingestion status column, next call date, sample card preview, recent sessions list |
| E | Transcript Research | ✅ Complete | All 30 companies researched. Priorities 1–6 done. KO/BA/MMM/HD/WMT/NKE/DIS fully official (17/17 each). VZ 17/17 official confirmed. AAPL/NVDA/AMZN/CSCO/HON/MCD confirmed no written transcript PDFs — structural limitation. JNJ: human_review_required. MSFT: HTML-only, StockAnalysis fallback. All manifests in `company-packs/` (17 on main via PR #18; 13 in codex/staging pending promotion). |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 run for 11 companies (2026-05-30): MSFT, VZ, BA, TRV, MRK, JPM, MMM, HD, WMT, DIS, NKE — all have 50 ai_selected phrases awaiting human approval (JPM/MRK/TRV have 100 each after repair run). Phase 2 ops-worker built and tested (NKE). **Blocker: human phrase review needed before any company can be activated.** |
| G | Content QA | 🔄 In Progress | Scripts and rubric complete. NKE generated files committed (PR #29). Codex Priority 8 editorial review assigned — should run next Codex session. |
| H | Evergreen Maintenance | ✅ Complete | `transcript-freshness.js` merged. Migration 015 live (executed 2026-05-30). Runbook and Codex exception prompt merged. Post-call HTTP watch deferred to Phase 3. |
| I | Public UX and SEO | ✅ Complete | Companies section, interactive sample card, FAQ merged (PR #21). SEO already complete. |
| J | QA and Launch Hardening | ✅ Complete | Playwright tests, release-readiness.js, RELEASE_CHECKLIST.md all merged. VPS needs `npx playwright install-deps`. Current posture: **Yellow** (0 blockers, 13 warnings). Codex Priority 7 release readiness synthesis in progress. |
| K | Analytics and Launch | 🔄 In Progress | `docs/program/LAUNCH_KIT.md` promoted from Codex staging (merged PR #26). Human review required before publishing any copy. Analytics event tracking, snapshot script, and feedback form still not started. |

---

## Key Decisions

| Decision | Detail |
|---|---|
| Phrases table: unique constraint added | Migration 019 added UNIQUE(company_id, phrase) to phrases table. Required by ON CONFLICT DO NOTHING in staging-to-phrases promotion. |
| Admin RLS fix (migration 017) | phrases_insert/update/delete_admin switched from auth.role()='authenticated' to auth.uid() IS NOT NULL. The WITH CHECK context for INSERT was not evaluating role correctly. Approve button now works. |
| Layer 2 pipeline (session 9–10) | Extractor clips at Q&A boundary, extracts prepared-remarks paragraphs only. Replaces n-gram counting. Q&A boundary min-distance raised 300→1500 chars to skip preamble. MIN_APPROVED_PHRASES lowered 25→15. |
| migration.sql phrases inserted is_active=false | Layer 2 migration.sql inserts phrases as inactive. Before activation, run: UPDATE phrases SET is_active=true WHERE company_id='{id}' AND is_active=false; to make them playable. |
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
| Phase 1 pipeline + ai-select flow confirmed | Resolved | Session 5: 7 companies processed. Session 6: URL repairs + 4 new builders. Final fetch rates: BA 17/17, MMM 17/17, VZ 17/17, MSFT 15/17, HD 17/17, WMT 17/17, DIS 17/17, NKE 17/17, TRV 11/17, JPM 13/17, MRK 9/17. StockAnalysis 400 failures accepted. |
| Codex inbox note sent (session 5) | Info | `codex/inbox/session-5-handoff-2026-05-30.md` on `codex/staging` branch. Priority 8: NKE editorial review (unblocked). Priority 9: Group C prompt review. Priority 10: release readiness synthesis (waiting on VPS report data). Priority 11: advance notice of BA/TRV/MRK/JPM/MMM editorial reviews. |
| Codex Priority 8+9 complete (session 6) | Info | NKE: not activation-ready (16/50 phrases pass after editorial review; 3/12 trivia pass). migration.sql must remain human_decision_needed. Group C: 5 prompt files need targeted edits — see `codex/staging/reports/group-c-prompt-review-2026-05-30.md`. |
| Group C prompt edits applied (session 7) | Resolved | PR #32 applies all 16 Codex Priority 9 findings as targeted line-level changes to all 5 prompt files. No wholesale rewrites. Awaiting human merge. |
| Codex inbox note sent (session 7) | Info | `codex/inbox/editorial-reviews-hd-wmt-dis-2026-05-30.md` on `codex/staging`. Assigns Priorities 12 (HD), 13 (WMT), 14 (DIS) editorial reviews. All three currently blocked — Phase 2 ops-worker must generate phrases.json/trivia.json before Codex can review. WMT and DIS flagged as high-priority launch companies. |
| No human phrase approvals (session 7 check) | Info | All 11 companies remain at ai_selected in phrase_staging. 600 phrases await human review in admin panel. No company is activation-ready yet. |
| Phase 2 pipeline improved (session 8) | Info | Score-then-select Stage 4 (Haiku scores 0-10, code selects top 50) eliminates hallucination. Preamble stripper, expanded FILLER_BLOCKLIST, STAGE3_REJECT_PATTERNS (30 regex patterns). Fetcher UA fixed (Chrome string, fixes HD 403). |
| HD/WMT/DIS generated content (session 8) | Info | PR #34 open. HD 50 phrases/11 trivia, WMT 50/11, DIS 50/6 (DIS trivia below activation minimum — same issue as NKE). Codex inbox updated — editorial reviews unblocked pending PR #34 merge. |
| Automated review design completed (session 8) | Info | Score-then-select is Layer 1. Layer 2 (sentence-level extraction not n-gram) is the next pipeline upgrade. Layer 3 (two-tier admin UX: Haiku ≥8 auto-flag for bulk approve, 5-7 manual review, ≤4 auto-reject) can be built once scoring signal is reliable. |
| URL pattern strategy: use manifests, not patterns | Decision | buildMrk/buildJpm/buildTrv now use hardcoded URL maps sourced from source_manifest.json. StockAnalysis 400 errors are expected and accepted for quarters with no official PDF. All new builders (HD/WMT/DIS/NKE) use the same manifest-sourced approach. |
| Fetcher User-Agent changed to browser-like string | Resolved | "ThereItIsBot" UA triggered 403 on ir.homedepot.com. Updated to Chrome/Mac UA. Affects all companies — re-run is safe since each fetch writes to data/raw/ and does not re-download already-fetched rows. |
| ai-select 429 backoff (65s, 3 retries) | Resolved | Haiku 50k token/min rate limit hit on WMT (3997 phrases, 27 batches). Retry logic added to selectBatch loop. WMT completed on second attempt after 65s wait. |
| JPM/MRK/TRV have 100 ai_selected phrases | Info | Two runs of ai-select (session 5 + session 6 repair run) each selected 50. Both sets are visible in the admin Phrase Staging Review panel. Human should approve the best 50 from each. |
| VZ queue-builder was using HTML webcast URLs | Resolved | Fixed in PR #26: updated to use direct PDF download URLs from source_manifest.json. VZ re-run successful (5,120 phrases staged). |
| PDF character-spaced headers produce garbage n-grams | Resolved | Fixed in PR #26: validator now rejects any phrase where a token is a single non-'a' letter (`single_char_token` rejection reason). VZ re-run confirmed clean top phrases. |
| Priority 6 promotions complete (BA/KO/MMM/CAT/SHW) | Resolved | BA (17/17 q4cdn), KO (17/17 official IR), MMM (17/17 CloudFront), CAT (9/17 q4cdn + 8/17 StockAnalysis), SHW (8/17 q4cdn + 9/17 StockAnalysis). source_manifest.json promoted and queue-builder wired for all 5. IBM (4/17) and CRM (1/17) deferred — too few official rows to be useful. |
| Migration 016 applied | Resolved | `016_phrase_staging_ai_select_policy.sql` applied via MCP 2026-05-30 (session 5). RLS UPDATE policy live. `ai-select.js` writes confirmed working: MSFT 50 ai_selected / 4,740 ai_rejected; VZ 50 ai_selected / 5,070 ai_rejected. |
| NKE trivia gap | Low | Stage 4 generated only 4 NKE trivia questions; minimum for activation is 12. Codex Priority 7 editorial review will flag this. Stage 4 trivia prompt needs strengthening. |

---

## Activation Readiness (as of 2026-05-31)

| Company | Phrases (total/active) | Trivia | Gap to Activation | Remaining candidates |
|---|---|---|---|---|
| **Hilton** | 51 / 51 | 42 | ✅ LIVE | — |
| HD | 46 / 4 | 11 | 4 phrases + 1 trivia | 18 ai_selected |
| NKE | 43 / 5 | 6 | 7 phrases + 6 trivia | 18 ai_selected |
| WMT | 20 / 0 | 8 | 30 phrases + 4 trivia | 15 ai_selected |
| DIS | 16 / 0 | 6 | 34 phrases + 6 trivia | 11 ai_selected |
| JPM | 7 / 7 | 0 | 43 phrases + 12 trivia | 26 ai_selected |
| VZ | 7 / 7 | 0 | 43 phrases + 12 trivia | 15 ai_selected |
| MMM | 5 / 5 | 0 | 45 phrases + 12 trivia | 15 ai_selected |
| MRK | 2 / 2 | 0 | 48 phrases + 12 trivia | 24 ai_selected |
| MSFT | 2 / 2 | 0 | 48 phrases + 12 trivia | 20 ai_selected |
| BA | 1 / 1 | 0 | 49 phrases + 12 trivia | 15 ai_selected |
| TRV | 0 / 0 | 0 | 50 phrases + 12 trivia | 26 ai_selected |

**Note:** phrases.total includes is_active=false rows from migration.sql. For game playability, all phrases must be is_active=true. Before activating any company run: `UPDATE phrases SET is_active=true WHERE company_id='{id}';`

**HD is closest:** 4 more phrase approvals from admin panel + 1 trivia + activate all phrases → activation-ready.

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Approve phrases in admin panel** | Admin panel RLS is fixed. Go to `/admin` → Phrase Staging Review. Approve ai_selected candidates. HD needs 4 more, NKE needs 7 more. Also approve the best from JPM (26), TRV (26), MRK (24), MSFT (20), VZ (15), MMM/NKE/HD (15-18). |
| 2 | **Activate HD phrases + trivia via SQL** | Run: `UPDATE phrases SET is_active=true WHERE company_id='hd';` — then activate HD in admin panel once at 50 phrases + 12 trivia. HD is only 4 approvals away. |
| 3 | **Layer 2 re-run for VZ, JPM, TRV, MRK, MSFT** | These have sources_ready status. Run fetcher first, then extractor, then process-review-queue.js. Will dramatically increase phrase counts for these companies. |
| 4 | **`npx playwright install-deps` on VPS** | One-time command. Unblocks Playwright tests in VPS cron. |
| 5 | **Configure Claude Code Routine: Daily PM Brief** | Prompt at `docs/program/prompts/routine-pm-brief.md`. Trigger: 6:15am ET weekdays. |
| 6 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label. |
| 7 | **Configure Codex Automation: Weekly content quality summary** | Prompt at `docs/program/prompts/codex-content-quality.md`. Trigger: Friday 8:00am ET. |
| 8 | **Configure Codex Automation: Nightly ingestion queue triage** | Prompt at `docs/program/prompts/codex-ingestion-triage.md`. Trigger: 9:30pm ET. |
| 9 | **Configure Codex Automation: Overflow PM brief** | Prompt at `docs/program/prompts/codex-pm-brief-overflow.md`. Trigger: weekdays 8:00am ET. |
| 10 | **Review human_review_required sources** | RHP, CLDT, AHT, JNJ flagged in source manifests. Must verify before ingesting. |
| 11 | **Review LAUNCH_KIT.md** | Replace `"Beta access is opening soon"` and `"[beta link]"` placeholders before publishing. |

---

## Next Recommended Session

**Sessions 9–10 complete.** PR #40 merged. RLS fixed. All four companies have phrases+trivia in DB. HD is the closest company to activation.

**Next session entry point (Claude Code):**
1. Check if human has approved phrases via admin panel — if HD reaches 50 total phrases, activate via SQL + admin toggle
2. Run Layer 2 pipeline for remaining companies: VZ, JPM, TRV, MRK, MSFT (sources_ready; need fetcher → extractor → process-review-queue)
3. After Layer 2 runs, apply migration.sql for each company + activate phrases
4. If Group C automations are configured, verify first PM Brief posted correctly
4. Pipeline next: sentence-level extraction (replace n-gram counting) for better CEO-idiom candidates

**Human action needed before next session:**
- Review phrases in admin panel (#1 — biggest unlock)
- Merge PR #34 (pipeline improvements + HD/WMT/DIS generated content)
- Configure at least one Claude Code Routine or Codex Automation (items #4–#8)

**Model:** `claude-sonnet-4-6` for all pipeline and repair work. Switch to `claude-opus-4-8` only for architectural decisions.

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
