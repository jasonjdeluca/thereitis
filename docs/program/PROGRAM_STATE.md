# There It Is — Program State

**Last updated:** 2026-05-31 (session 16)
**Updated by:** Claude Code (Sonnet 4.6)

---

## Current Phase and Active Work

**Phase:** 2 — Mid-June (Weeks 3–5)
**Just completed:** Sessions 14–16 — Subscription enrichment model (PR #42), admin-driven Docker control plane (PR #43), BA/KO/MMM migrations applied + phrases activated, activation override button added to admin panel. The agentic ingestion loop is now end-to-end: admin panel triggers pipeline → Docker fetch/extract/validate → enrichment queue → Claude Code session enriches → migration SQL applied.
**Awaiting human action:** Toggle HD/BA/KO/MMM active in admin panel; apply CAT/JPM/MRK/SHW migration SQL; flip is_active for phrase-staging companies; configure Group C automations
**Awaiting Codex:** WMT and DIS editorial phrase reviews (unblocked once WMT/DIS phrases are activated)

---

## Group Status Table

| Group | Name | Status | Summary |
|---|---|---|---|
| A | Live Game Stability | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, readiness gate added |
| B | Deterministic Truth Layer | ✅ Complete | All 4 scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| C | Automation Infrastructure | 🔄 In Progress | All 5 prompt files written and quality-edited (merged — PR #32). Platform configuration pending — manual setup in Claude Code Routines and Codex Automations. |
| D | Admin Console | ✅ Complete | Readiness table, status badges, activation gate + override button, ingestion status column, next call date, sample card preview, recent sessions list, Ingestion Pipeline panel (PR #43) |
| E | Transcript Research | ✅ Complete | All 30 blue-chip + hotel companies in DB. All source manifests in `company-packs/`. 41 companies total. |
| F | Ingestion Pipeline | 🔄 In Progress | Phase 1 complete for 11 companies. Phase 2 Docker ops-worker built. Admin control plane live (PR #43) — poller cron running. Enrichment queue empty; 4 companies (CAT/JPM/MRK/SHW) have generated migrations pending human application. **Blocker: human phrase review + migration application needed before more companies activate.** |
| G | Content QA | 🔄 In Progress | Scripts and rubric complete. NKE, HD, WMT, DIS, BA, KO, MMM generated files committed. Codex editorial reviews for WMT and DIS deferred pending phrase activation. |
| H | Evergreen Maintenance | ✅ Complete | `transcript-freshness.js` merged. Migration 015 live. Runbook and Codex exception prompt merged. Post-call HTTP watch deferred to Phase 3. |
| I | Public UX and SEO | ✅ Complete | Companies section, interactive sample card, FAQ merged (PR #21). SEO already complete. |
| J | QA and Launch Hardening | ✅ Complete | Playwright tests, release-readiness.js, RELEASE_CHECKLIST.md all merged. VPS needs `npx playwright install-deps`. Current posture: **Yellow** (0 blockers, 13 warnings). |
| K | Analytics and Launch | 🔄 In Progress | `docs/program/LAUNCH_KIT.md` promoted from Codex staging. Human review required before publishing. Analytics event tracking, snapshot script, and feedback form not started. |

---

## Key Decisions

| Decision | Detail |
|---|---|
| Phrases table: unique constraint added | Migration 019 added UNIQUE(company_id, phrase) to phrases table. Required by ON CONFLICT DO NOTHING in staging-to-phrases promotion. |
| Admin RLS fix (migration 017) | phrases_insert/update/delete_admin switched from auth.role()='authenticated' to auth.uid() IS NOT NULL. |
| Layer 2 pipeline (session 9–10) | Extractor clips at Q&A boundary, extracts prepared-remarks paragraphs only. Q&A boundary min-distance raised 300→1500 chars. MIN_APPROVED_PHRASES lowered 25→15. |
| migration.sql phrases inserted is_active=false | All migration.sql files insert phrases as inactive. Before activation, run: `UPDATE phrases SET is_active=true WHERE company_id='{id}' AND is_active=false;` |
| `bypassPermissions` enabled | Claude Code sessions run with bypassPermissions=true (commit 2b60716). |
| Claude Code Routines branch rule | Routines push only to `claude/`-prefixed branches. Human merges to main. |
| Dual AI pools | Anthropic (Claude Code + Routines) and OpenAI (Codex Automations) run independently. |
| 5-stage pipeline; only Stage 4 uses AI | 45x token reduction vs. feeding raw transcripts. |
| Company ID normalization | No `ticker` column on `companies`. `TICKER_TO_COMPANY_ID` map in `scripts/ingestion/lib/common.js` is authoritative. |
| `phrase_staging` migration | 013_phrase_staging.sql created and applied 2026-05-30. |
| Opus for architecture, Sonnet for execution | Use `claude-opus-4-8` for architectural decisions. Use `claude-sonnet-4-6` for implementation. |
| Model ID strings | Opus 4.8: `claude-opus-4-8` · Sonnet 4.6: `claude-sonnet-4-6` · Haiku 4.5: `claude-haiku-4-5-20251001` |
| Production SQL requires human approval | All Supabase migrations must be output as SQL files and executed manually by the human. Never auto-run. |
| codex/staging ↔ codex/inbox pipeline | Shared staging branch protocol live on main. Codex deposits work to `codex/staging/`; Claude Code writes task assignments and responses to `codex/inbox/`. |
| Phase 2 fetcher: Q4CDN only | StockAnalysis returns 400. Phase 2 Docker fetcher can only reliably download from Q4CDN vendor-hosted PDFs. |
| ANTHROPIC_API_KEY in thereitis/.env | Key is in `~/thereitis/.env` for docker compose validator service. Never commit `.env`. |
| Subscription enrichment model (session 14) | AI enrichment step (phrase selection + trivia writing) is now done by the Claude Code agent using the subscription — never the Anthropic API. No per-token cost. `ENRICHMENT_QUEUE.md` is the protocol. |
| Admin ingestion control plane (session 15) | Admin panel can trigger Docker fetch→extract→validate runs. Poller (`scripts/ingestion/poller.js`) runs on VPS (cron every 3 min + nightly --enqueue). Migration 018 live. |
| Activation override button (session 16) | Admin panel now shows "Override →" link below "Cannot Activate" for companies below criteria. Allows human to force-activate despite phrase/trivia gap. |
| All 41 companies in DB | All 30 blue-chip + 11 hotel companies confirmed in `companies` table. Cross-cutting migration task complete. |
| BA/KO/MMM migrations applied (session 16) | 51/50/55 phrases (all is_active=true) + 12 trivia each. Awaiting admin toggle. |

---

## Activation Readiness (as of 2026-05-31 session 16)

| Company | Active / Total Phrases | Trivia | Gap to Activation | Notes |
|---|---|---|---|---|
| **Hilton** | 51 / 51 | 42 | ✅ LIVE | — |
| **HD** | 58 / 58 | 11 | ✅ Ready — toggle active in admin | 11 trivia (use Override — 1 below min) |
| **MMM** | 55 / 55 | 12 | ✅ Ready — toggle active in admin | Migration applied session 16 |
| **BA** | 51 / 51 | 12 | ✅ Ready — toggle active in admin | Migration applied session 16 |
| **KO** | 50 / 50 | 12 | ✅ Ready — toggle active in admin | Migration applied session 16 |
| VZ | 14 / 39 | 0 | Flip 25 inactive phrases + 12 trivia | Run `UPDATE phrases SET is_active=true WHERE company_id='vz' AND is_active=false;` then build trivia |
| NKE | 8 / 46 | 6 | Flip 38 inactive phrases + 6 trivia | Run is_active flip; 6 more trivia needed |
| WMT | 6 / 26 | 8 | Flip 20 inactive phrases + 4 trivia | Run is_active flip; Codex editorial review pending |
| DIS | 1 / 17 | 6 | Flip 16 inactive phrases + 6 trivia | Run is_active flip; Codex editorial review pending |
| TRV | 0 / 20 | 11 | Flip 20 inactive phrases + 1 trivia | Run is_active flip; 1 more trivia needed |
| V | 0 / 13 | 0 | ⚠️ 37 phrases + 12 trivia | Wrong-company trivia purged — need re-enrichment |
| CAT | 0 / 0 | 0 | Apply migration + 18 more phrases | migration.sql in company-packs/CAT/generated/ (32 phrases, 12 trivia) |
| JPM | 7 / 7 | 0 | Apply migration + more phrases | migration.sql in company-packs/JPM/generated/ (27 phrases, 12 trivia) |
| SHW | 0 / 0 | 0 | Apply migration + 30 more phrases | migration.sql in company-packs/SHW/generated/ (20 phrases, 12 trivia) |
| MRK | 2 / 2 | 0 | Apply migration + more phrases | migration.sql in company-packs/MRK/generated/ (19 phrases, 12 trivia) |
| MSFT | 6 / 6 | 0 | 44 phrases + 12 trivia | StockAnalysis 100% blocked in Phase 2 Docker |

**Note:** For VZ/NKE/WMT/DIS/TRV — phrases are in DB as is_active=false. Run the UPDATE before activating.
`UPDATE phrases SET is_active=true WHERE company_id='{id}' AND is_active=false;`

---

## Active Human Action Items

| # | Action | Context |
|---|---|---|
| 1 | **Toggle BA, KO, MMM active in admin panel** | All three have ≥50 active phrases and 12 trivia — activation-ready. |
| 2 | **Toggle HD active in admin panel (use Override)** | 58 active phrases, 11 trivia (1 below min — use Override button). |
| 3 | **Flip inactive phrases for VZ/NKE/WMT/DIS/TRV** | `UPDATE phrases SET is_active=true WHERE company_id='{id}' AND is_active=false;` for each. |
| 4 | **Apply CAT/JPM/MRK/SHW migration SQL** | Files at `company-packs/{TICKER}/generated/migration.sql`. These are below 50-phrase threshold — more enrichment needed after. |
| 5 | **Purge V trivia from Supabase** | `DELETE FROM trivia_questions WHERE company_id='v';` then re-run Layer 2 with corrected trivia prompt. |
| 6 | **Add SUPABASE_SERVICE_ROLE_KEY to VPS .env** | ✅ Done (session 16). Poller verified live. |
| 7 | **Configure Claude Code Routine: Daily PM Brief** | Prompt at `docs/program/prompts/routine-pm-brief.md`. Trigger: 6:15am ET weekdays. |
| 8 | **Configure Claude Code Routine: GitHub-triggered implementation** | Prompt at `docs/program/prompts/routine-implement.md`. Trigger: `claude-implement` label. |
| 9 | **Configure Codex Automation: Weekly content quality summary** | Prompt at `docs/program/prompts/codex-content-quality.md`. Trigger: Friday 8:00am ET. |
| 10 | **Configure Codex Automation: Nightly ingestion queue triage** | Prompt at `docs/program/prompts/codex-ingestion-triage.md`. Trigger: 9:30pm ET. |
| 11 | **Configure Codex Automation: Overflow PM brief** | Prompt at `docs/program/prompts/codex-pm-brief-overflow.md`. Trigger: weekdays 8:00am ET. |
| 12 | **`npx playwright install-deps` on VPS** | One-time command. Unblocks Playwright tests in VPS cron. |
| 13 | **Review LAUNCH_KIT.md** | Replace `"Beta access is opening soon"` and `"[beta link]"` placeholders before publishing. |

---

## Next Recommended Session

**Entry point (Claude Code):**
1. Check enrichment queue (`node scripts/ingestion/process-review-queue.js --list`) — if any pending, process them
2. Re-enrich V: purge wrong-company trivia, run Phase 2 pipeline for V, enrich from review queue with corrected trivia prompt (no historical/factual — CEO language patterns only)
3. Enrich CAT/JPM/MRK/SHW further — need to reach 50 phrases before activation. Either run pipeline again (if official PDFs available) or extend enrichment from existing review-queue data
4. Assign Codex WMT/DIS editorial reviews (currently blocked on phrase activation — human must flip is_active first)
5. Hunt official q4cdn/IR-domain PDF sources for GS, AXP, UNH, AMGN, CVX, PG — assign to Codex as next research batch

**Human action needed before next session:**
- Toggle BA/KO/MMM active in admin panel (#1–#3)
- Toggle HD active (Override — #2)
- Flip is_active phrases for VZ/NKE/WMT/DIS/TRV (#3)
- Apply CAT/JPM/MRK/SHW migration SQL (#4)

**Model:** `claude-sonnet-4-6` for pipeline and repair work. Switch to `claude-opus-4-8` only for architectural decisions.

---

## Known Issues and Tech Debt

| Item | Severity | Detail |
|---|---|---|
| V trivia wrong-company content | High | All V trivia was purged (was describing a department store chain). V needs full re-enrichment with a corrected trivia prompt focused on CEO language patterns, not corporate history facts. |
| CAT/JPM/MRK/SHW below 50-phrase threshold | Medium | Generated migrations exist but companies are below activation minimum. More pipeline runs or alternative data sources needed. |
| Phase 2 Docker blocked on StockAnalysis | Medium | MSFT, GS, AXP, UNH, AMGN, CVX, PG, CRM, IBM, HON, MCD, AAPL, NVDA, AMZN, CSCO all have no official q4cdn PDFs. Phase 2 cannot fetch them. Official source research via Codex is the unlock. |
| Group C platform configuration pending | Medium | All 5 automation prompt files exist but Claude Code Routines and Codex Automations are not live. Agentic PM loop does not run until configured. |
| VZ/NKE/WMT/DIS/TRV phrases inactive | Medium | Phrases in DB but is_active=false. Human must run UPDATE before these companies can be activated. |
| HD/MMM/BA/KO not toggled active | Medium | All four are activation-ready in the DB. Admin toggle is the only remaining step. |
| Phase 2 trivia pass rate | Low | Stage 4 Haiku still includes person names in ~75% of trivia despite prompt instructions. Stage 5 rejects them. Prompt strengthened; acceptable for now. |
| Company ID normalization | Low | No `ticker` column on `companies`. Hotel companies use word-slug IDs. `TICKER_TO_COMPANY_ID` map in `lib/common.js` must stay in sync. |
| `phrases.tier` and `phrases.points` NOT NULL | Low | No default. Admin approve and migration.sql use hardcoded defaults. Other insert paths will fail if omitting these. |
| KO official PDF access blocked | Low | investors.coca-colacompany.com returns 403 even with browser headers. KO Phase 2 re-fetch will need manual download or browser-emulation. Not a blocker. |
| Post-call HTTP transcript watch deferred | Low | Date-arithmetic detection implemented. Automated HTTP check deferred to Phase 3 (requires per-company IR base URL not yet stored). |
