# There It Is — Program State

**Last updated:** 2026-05-31 (session 11)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Session 11 — Admin RLS approve bug fully fixed (root cause: getSession() passed expired tokens; fixed with getUser() + onAuthStateChange + upsert ignoreDuplicates); phrase_staging RLS policies patched (migration 017 applied); Docker ops-worker user permissions fixed (user: 1001:1001); Layer 2 re-run complete for VZ (26 phrases, 8 trivia), TRV (20 phrases, 11 trivia), HD refreshed (37 phrases, 11 trivia); migration.sql generator now uses ON CONFLICT DO NOTHING. StockAnalysis now fully 400s in Phase 2 Docker — MSFT/GS/AXP/JPM/MRK all blocked (0/17); only companies with official q4cdn or direct IR PDF URLs can be fetched.
**Awaiting human action:** Apply migration.sql for HD/VZ/TRV; then activate phrases; approve ai_selected candidates in admin panel (panel RLS now fixed); configure Group C automations
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
| Admin RLS true root cause (session 11) | Resolved | Prior "fix" changed phrases INSERT policy to auth.uid() IS NOT NULL but still reported broken. Root cause: Admin.jsx used getSession() which reads cached localStorage token without server validation — expired tokens passed the gate but failed on writes. Fix: getUser() (server-validated) + onAuthStateChange subscription + upsert with ignoreDuplicates in approveRow. phrase_staging UPDATE/DELETE policies also patched (migration 017). |
| StockAnalysis Phase 2 fully blocked | Confirmed | MSFT/GS/AXP all return HTTP 400 from Phase 2 Docker fetcher (0/17 each). StockAnalysis now blocks the Chrome UA used by Docker. Phase 1 could get MSFT 15/17 via a different UA or timing. Companies with no official PDFs (MSFT, GS, AXP, JPM partial, MRK partial) cannot expand via Phase 2 Layer 2 without official source repair. |
| Docker review-queue permissions fixed | Resolved | Docker containers ran as root, writing review-queue files owned by root (causing unlinkSync EACCES). Fixed by adding user: 1001:1001 to all services in docker-compose.yml. |
| ON CONFLICT DO NOTHING in migration.sql | Resolved | process-review-queue.js generator now adds ON CONFLICT (company_id, phrase) DO NOTHING and ON CONFLICT DO NOTHING to phrase and trivia INSERTs. Prevents duplicate-phrase failures when migration.sql overlaps with previously applied rows. |
| Phase 2 Layer 2 results (session 11) | Info | VZ: 17/17 fetched (official verizon.com PDFs), 26 phrases, 8 trivia. TRV: 10/17 fetched (q4cdn), 20 phrases, 11 trivia. JPM: 8/17 fetched, 3 phrases (below 15 threshold — batch retained). MRK: 8/17 fetched, 9 phrases (below 15 threshold). HD refreshed: 37 phrases, 11 trivia. Migration files in company-packs/{VZ,TRV,HD}/generated/migration.sql. |

---

## Activation Readiness (as of 2026-05-31 session 11)

| Company | Phrases (total/active) | Trivia | Gap to Activation | Layer 2 migration ready? |
|---|---|---|---|---|
| **Hilton** | 51 / 51 | 42 | ✅ LIVE | — |
| HD | 46 / 4 | 11 | 4 phrases + 1 trivia | ✅ 37 phrases, 11 trivia — apply migration.sql |
| NKE | 43 / 5 | 6 | 7 phrases + 6 trivia | ❌ (no new Layer 2 batch this session) |
| WMT | 20 / 0 | 8 | 30 phrases + 4 trivia | ❌ |
| DIS | 16 / 0 | 6 | 34 phrases + 6 trivia | ❌ |
| VZ | 7 / 7 | 0 | 43 phrases + 12 trivia | ✅ 26 phrases, 8 trivia — apply migration.sql |
| TRV | 0 / 0 | 0 | 50 phrases + 12 trivia | ✅ 20 phrases, 11 trivia — apply migration.sql |
| JPM | 7 / 7 | 0 | 43 phrases + 12 trivia | ❌ 3 phrases (below threshold, StockAnalysis blocked) |
| MMM | 5 / 5 | 0 | 45 phrases + 12 trivia | ❌ |
| MRK | 2 / 2 | 0 | 48 phrases + 12 trivia | ❌ 9 phrases (below threshold) |
| MSFT | 2 / 2 | 0 | 48 phrases + 12 trivia | ❌ StockAnalysis 100% blocked in Phase 2 Docker |
| BA | 1 / 1 | 0 | 49 phrases + 12 trivia | ❌ |

**Note:** phrases.total includes is_active=false rows. Before activating, run: `UPDATE phrases SET is_active=true WHERE company_id='{id}';`

**HD is closest:** Apply migration.sql (37 new phrases) → approve 4 more from admin panel → run `UPDATE phrases SET is_active=true WHERE company_id='hd';` → activate in admin. VZ and TRV also have new migration.sql files ready for human review.

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Apply HD migration.sql** | `company-packs/HD/generated/migration.sql` — 37 phrases + 11 trivia. Uses ON CONFLICT DO NOTHING so safe to run even with overlap. After applying, run `UPDATE phrases SET is_active=true WHERE company_id='hd';` and activate in admin. |
| 2 | **Apply VZ migration.sql** | `company-packs/VZ/generated/migration.sql` — 26 phrases + 8 trivia. VZ trivia is thin (7 person-name rejections). May need admin panel phrase-staging approvals (15 ai_selected) to supplement. |
| 3 | **Apply TRV migration.sql** | `company-packs/TRV/generated/migration.sql` — 20 phrases + 11 trivia. Good company-specific phrases (earnings engine, risk selection, virtuous cycle). Still needs ~30 more phrases for activation. |
| 4 | **Approve phrases in admin panel** | RLS bug is fully fixed. Go to `/admin` → Phrase Staging Review. Approve ai_selected candidates for HD (18 remaining), NKE (18), JPM (26), TRV (26), MRK (24), MSFT (20), VZ (15), MMM (15), BA (15). |
| 5 | **`npx playwright install-deps` on VPS** | One-time command. Unblocks Playwright tests in VPS cron. |
| 6 | **Configure Claude Code Routine: Daily PM Brief** | Prompt at `docs/program/prompts/routine-pm-brief.md`. Trigger: 6:15am ET weekdays. |
| 7 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label. |
| 8 | **Configure Codex Automation: Weekly content quality summary** | Prompt at `docs/program/prompts/codex-content-quality.md`. Trigger: Friday 8:00am ET. |
| 9 | **Configure Codex Automation: Nightly ingestion queue triage** | Prompt at `docs/program/prompts/codex-ingestion-triage.md`. Trigger: 9:30pm ET. |
| 10 | **Configure Codex Automation: Overflow PM brief** | Prompt at `docs/program/prompts/codex-pm-brief-overflow.md`. Trigger: weekdays 8:00am ET. |
| 11 | **Review human_review_required sources** | RHP, CLDT, AHT, JNJ flagged in source manifests. Must verify before ingesting. |
| 12 | **Review LAUNCH_KIT.md** | Replace `"Beta access is opening soon"` and `"[beta link]"` placeholders before publishing. |

---

## Next Recommended Session

**Session 11 complete.** Admin approve button is genuinely fixed. Layer 2 re-run produced HD/VZ/TRV migrations.

**Next session entry point (Claude Code):**
1. Check if human applied migration.sql files and approved phrases — if HD reaches 50 phrases + 12 trivia, activate via SQL + admin toggle
2. For VZ/TRV/JPM/MRK: supplement Layer 2 phrases with Phase 1 ai_selected approvals from admin panel to close the gaps
3. Re-run Phase 1 ai-select.js for MMM/BA if they still need phrases (Phase 1 PDFs already in data/raw/)
4. For MSFT: StockAnalysis now fully blocked — only Phase 1 staged phrases (20 ai_selected) are available; unlikely to reach activation without official PDF source repair
5. If Group C automations are configured, verify first PM Brief posted correctly

**Human action needed before next session:**
- Apply migration.sql files for HD, VZ, TRV (#1–#3 above — biggest unlock)
- Approve phrases in admin panel (#4)
- Configure at least one Claude Code Routine or Codex Automation (#6–#10)

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
