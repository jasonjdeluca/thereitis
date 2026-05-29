# There It Is — Agent Task Backlog

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` deferred

Update status in-place as work progresses. This file is read by Claude Code sessions, Claude Code Routines, and Codex Automations.

---

## Group A — Live Game Stability
*Claude Code · Phase 1 · ⚠️ Blocks all other groups*

- [x] Remove silent fallback behavior — the code path that serves another company's phrases when the selected company has none
- [x] Fix or deactivate any company with active status and zero phrases
- [x] Generalize `TriviaSection` component so it is not hardcoded to a single company
- [x] Add active company readiness gate — prevent game session creation for companies below minimum readiness threshold
- [x] Update README.md to reflect current project state and tech stack

---

## Group B — Deterministic Truth Layer
*Claude Code (build) · Docker/VPS cron (run) · Phase 1 · Depends on: Group A complete*

- [x] Create `scripts/company-readiness.js`
  - Input: Supabase companies, phrases, trivia tables
  - Output: `reports/company-readiness.json`
  - Checks: phrase count per company, trivia count, phrase length violations, active-with-zero-phrases, fallback risk, missing ticker or emoji, missing next call date
- [x] Create `scripts/content-validation.js`
  - Input: Supabase phrases and trivia tables
  - Output: `reports/content-validation.json`
  - Checks: 25-char max, blank phrases, cross-company duplicates, invalid company IDs, possible person names (flag for human review, do not auto-reject), trivia missing choices or correct answer field
- [x] Create `scripts/migration-check.js`
  - Input: `supabase/migrations/` directory
  - Output: `reports/migration-check.json`
  - Checks: sequential numbering with no gaps, no duplicate numbers, migration filename format compliance
- [x] Create `scripts/pm-packet.js`
  - Input: all three reports above
  - Output: `reports/pm-packet.json`
  - Aggregates exception counts and top issues from each report into a single AI-readable packet
- [x] Add `reports/` to `.gitignore`
- [x] Create `reports/.gitkeep` so the directory exists in the repo
- [x] Add VPS cron entry: 6:00am ET — runs all four scripts in sequence
- [x] Add VPS cron entry: 9:00pm ET — runs all four scripts in sequence

---

## Group C — Automation Infrastructure
*Claude Code (configure) · Claude Code Routines + Codex Automations (run) · Phase 1 · Depends on: Group B reports exist*

- [ ] Configure Claude Code Routine: Daily PM Brief
  - Trigger: schedule, 6:15am ET weekdays
  - Repos: thereitis
  - Prompt: read `reports/pm-packet.json` and last 10 git commits, identify blockers and top 2–3 recommended tickets, post GitHub issue titled "Daily PM Brief — [YYYY-MM-DD]"
  - [x] Prompt file written: `docs/program/prompts/routine-pm-brief.md` (platform configuration still pending — manual setup in Claude Code Routines)
- [ ] Configure Claude Code Routine: GitHub-triggered implementation
  - Trigger: GitHub issue labeled `claude-implement`
  - Repos: thereitis
  - Prompt: read the labeled issue fully, read relevant source files, implement the ticket, open PR to `claude/` branch with summary of changes
  - [x] Prompt file written: `docs/program/prompts/routine-implement.md` (platform configuration still pending — manual setup in Claude Code Routines)
- [ ] Configure Codex Automation: Weekly content quality summary
  - Trigger: schedule, Friday 8:00am ET
  - Reads: `reports/content-validation.json`, `reports/company-readiness.json`
  - Output: GitHub issue "Weekly Content Quality Report — [date]" listing companies below threshold and suspicious phrases
  - [x] Prompt file written: `docs/program/prompts/codex-content-quality.md` (platform configuration still pending — manual setup in Codex Automations)
- [ ] Configure Codex Automation: Nightly ingestion queue triage
  - Trigger: schedule, 9:30pm ET during active onboarding phases
  - Reads: `reports/ingestion-status.json`
  - Output: GitHub issue comment on current ingestion tracking issue listing blocked packs, ready packs, and failed extractions
  - [x] Prompt file written: `docs/program/prompts/codex-ingestion-triage.md` (platform configuration still pending — manual setup in Codex Automations)
- [ ] Configure Codex Automation: Overflow PM brief
  - Trigger: schedule, 8:00am ET daily
  - Logic: check if a "Daily PM Brief" issue was posted today — if not, post a brief version as backup
  - [x] Prompt file written: `docs/program/prompts/codex-pm-brief-overflow.md` (platform configuration still pending — manual setup in Codex Automations)
- [x] Add GitHub labels to repo via GitHub CLI or settings:
  - `claude-implement` (blue) — triggers Claude Code Routine implementation
  - `human-decision-needed` (red) — requires human review before proceeding
  - `content-review` (yellow) — phrase or trivia content needs editorial judgment
  - `migration-ready` (green) — SQL has been reviewed and is ready for human execution

---

## Group D — Admin Console
*Claude Code · Phase 2 · Depends on: Group A complete, Group B scripts exist*

- [ ] Build company readiness table on admin dashboard
  - Columns: company name, emoji, ticker, phrase count, trivia count, status badge, activation toggle
  - Data source: live Supabase query or `reports/company-readiness.json`
- [ ] Add status badges: Ready (green), Needs Phrases (yellow), Needs Trivia (yellow), Blocked (red)
- [ ] Add activation gate: if company fails minimum readiness, disable the active toggle and show reason
- [ ] Add ingestion status column: Not Started / Researching / Fetching / Extracting / Generating / QA / Ready for Migration / Active
- [ ] Add next call date field per company, editable inline by admin
- [ ] Add admin warning banner for companies that are active but stale or below threshold
- [ ] Add sample card preview: clicking a company shows a randomly assembled 5×5 bingo card using that company's phrases
- [ ] Add recent sessions list: last 10 sessions with company name, player count, whether bingo was reached

---

## Group E — Transcript Research
*Codex Automations · Phase 1 (starts in parallel immediately) · No code dependencies*

- [ ] Define target company list — initial launch candidates (aim for 20–30 companies)
  - Prioritize: widely recognized public companies with earnings calls that a broad audience would recognize
  - Document in `docs/program/TARGET_COMPANIES.md`
- [ ] Define source confidence scale and document in `docs/program/TRANSCRIPT_SOURCE_POLICY.md`
  - Tier 1: Official IR site (PDF or HTML transcript linked directly)
  - Tier 2: SEC 8-K filing with transcript exhibit
  - Tier 3: Seeking Alpha or similar (free tier)
  - Tier 4: Paywalled source (flag, do not use without manual approval)
  - Tier 5: Audio or video only (flag, requires manual transcription)
  - Tier 6: Not found (flag for human escalation)
- [ ] Define `source_manifest.json` schema — document in `docs/program/INGESTION_RUNBOOK.md`
- [ ] Run Codex transcript research batch 1 (companies 1–5): output `company-packs/{ticker}/source_manifest.json`
- [ ] Run Codex transcript research batch 2 (companies 6–10)
- [ ] Run Codex transcript research batch 3 (companies 11–15)
- [ ] Run Codex transcript research batch 4 (companies 16–20)
- [ ] Run Codex transcript research batch 5 (companies 21–25, if applicable)
- [ ] Flag any companies with no accessible transcripts for human escalation
- [ ] Review and approve all source manifests before handing to Group F fetcher

---

## Group F — Ingestion Pipeline
*Claude Code (build) · Docker/VPS (run) · Phase 2 · Depends on: Group E source manifests exist for at least 3 companies*

- [ ] Define and document `company-pack` directory structure in `docs/program/INGESTION_RUNBOOK.md`
- [ ] Build `ops-worker/fetcher/` (Node.js Docker container)
  - Reads SQLite job queue for pending companies
  - HTTP-fetches PDFs from URLs in source manifests
  - Saves raw PDFs to `company-packs/{ticker}/transcripts/`
  - Logs fetch success, failure, and HTTP status per quarter per company
  - Handles rate limiting with configurable delay between requests
- [ ] Build `ops-worker/extractor/` (Python Docker container)
  - PDF text extraction using pdfplumber
  - Sentence tokenization and n-gram extraction (2–4 word phrases)
  - Cross-quarter frequency scoring (phrase score = number of distinct quarters it appears in)
  - Hard filter: drops all phrases over 25 characters before scoring
  - Outputs `candidate_phrases.json` ranked by frequency score
- [ ] Build `ops-worker/validator/` (Node.js Docker container)
  - Stage 3 structural filter: drops phrases appearing in fewer than 2 quarters, removes acronym-only candidates, removes phrases matching generic filler blocklist, flags candidates containing proper nouns
  - Stage 4 AI enrichment: POST to Claude Haiku API (or GPT-4o Mini as fallback) with ~200 filtered candidates — prompt asks for top 40–50 phrases plus 12–18 trivia questions with 4 choices each
  - Stage 5 validation: hard-validates all AI output against project rules, rejects any phrase over 25 characters or containing a person name
  - Generates migration SQL from template
  - Opens GitHub PR via GitHub API with generated SQL attached as a file
- [ ] Build `ops-worker/queue/` (SQLite) — tracks ingestion state per company
  - States: not_started, sources_ready, fetching, fetched, extracting, extracted, generating, generated, validation_failed, ready_for_review, pr_opened, migration_applied, active
- [ ] Write `ops-worker/docker-compose.yml` for local pipeline testing
- [ ] Create `scripts/ingestion-status.js` that reads the SQLite queue → `reports/ingestion-status.json`
- [ ] Test full pipeline end-to-end with one company before scaling
- [ ] Add nightly cron trigger for fetcher (processes up to 5 companies per night to stay within rate limits)

---

## Group G — Content QA
*Claude Code (build validation) · Docker/VPS (run hard checks) · Codex (editorial review) · Phase 2 · Depends on: Group F generating output*

- [ ] Expand `scripts/content-validation.js` with post-generation checks
  - Validates phrases in `company-packs/{ticker}/generated/phrases.json` against all rules
  - Validates trivia in `company-packs/{ticker}/generated/trivia.json` (all choices present, correct answer is one of the choices, no answer over 80 characters)
  - Writes `company-packs/{ticker}/generated/validation_report.json`
- [ ] Write `docs/program/CONTENT_QA_RUBRIC.md`
  - What makes a phrase good: specific to that company, would cause a knowing groan or laugh, recurs across multiple quarters, fits the CEO Mode voice
  - What makes a phrase bad: pure financial jargon, too generic to identify the company, sounds like an analyst question rather than an executive answer, references a person by name
  - Rejection taxonomy: too_generic, person_name, jargon_heavy, wrong_company, too_long, low_frequency
- [ ] Configure Codex editorial QA task: triggered once per company when Stage 4 generation is complete
  - Reads `generated/phrases.json` and `generated/trivia.json`
  - Reviews candidates against QA rubric
  - Posts review as GitHub comment on the ingestion PR with recommended approvals, rejections, and edits

---

## Group H — Evergreen Maintenance
*Claude Code (build) · Docker/VPS (run) · Codex (exception reports) · Phase 2 · Depends on: Group F pipeline operational*

- [ ] Build transcript freshness watcher → `reports/transcript-freshness.json`
  - For each active company: check days since last ingested transcript, check next call date, flag if next call date is within 14 days, flag if call date has passed with no new transcript
- [ ] Add `latest_ingested_quarter` field to companies table in Supabase (migration required, human-approved)
- [ ] Build stale company detector — flags companies where `latest_ingested_quarter` is more than 2 reporting cycles old
- [ ] Build post-call transcript watch — for companies with earnings calls in the past 10 days, perform HTTP check on their IR page URL and flag if a new PDF link appears
- [ ] Write `docs/program/EVERGREEN_MAINTENANCE_RUNBOOK.md`
- [ ] Configure Codex Automation: weekly stale company exception report
  - Reads `reports/transcript-freshness.json`
  - Posts GitHub issue listing stale companies and upcoming call dates requiring transcript research

---

## Group I — Public UX and SEO
*Claude Code · Phase 2 · Depends on: Group A complete (stable live game)*

- [ ] Rewrite landing page hero: explain what the game is and how to play in under 30 seconds
- [ ] Add "How to play" section: 3-step explanation (start a session, share the link, mark phrases as the call happens)
- [ ] Add sample bingo card preview: static 5×5 grid showing example phrases
- [ ] Add supported companies section: lists active companies with their emoji and display name
- [ ] Add unofficial non-affiliation disclaimer: one sentence, clearly visible, not buried
- [ ] Add `<title>`, `<meta name="description">`, and Open Graph tags to `index.html`
- [ ] Add Twitter/X card meta tags
- [ ] Generate `public/sitemap.xml` listing all public routes
- [ ] Add `public/robots.txt`
- [ ] Add basic FAQ section: what is this, is it official, how do I get more companies, is it free

---

## Group J — QA and Launch Hardening
*Claude Code (build) · Docker/VPS (run) · Codex (go/no-go synthesis) · Phase 2–3 · Depends on: Groups A–I substantially complete*

- [ ] Build Playwright public smoke test suite in `tests/smoke/`
  - Homepage loads and contains expected title and meta
  - Start game route loads without error
  - Join game route loads without error
  - Company selector loads and shows at least one active company
  - Admin route at /gate redirects or prompts for password
  - Mobile viewport (375px) renders without layout overflow
- [ ] Build game flow smoke test in `tests/game-flow/`
  - Create session via API
  - Join session with a second player
  - Verify card renders with 25 phrases
  - Mark a phrase and verify state updates
  - Verify bingo detection fires when a row is complete
  - Verify post-game screen renders
- [ ] Create `scripts/release-readiness.js` → `reports/release-readiness.json`
  - Aggregates pass/fail status from all report files
  - Produces overall posture: Green (ready) / Yellow (minor issues) / Red (blocker present)
- [ ] Write `docs/program/RELEASE_CHECKLIST.md`
- [ ] Configure Codex Automation: weekly release readiness synthesis
  - Reads `reports/release-readiness.json` and all sub-reports
  - Posts GitHub issue "Release Readiness — [date]" with go/no-go posture and list of remaining blockers

---

## Group K — Analytics and Launch
*Claude Code (analytics code) · Docker/VPS (snapshot reports) · Codex (launch copy) · Human (posting) · Phase 3*

- [ ] Define analytics event schema in `docs/program/ANALYTICS_EVENTS.md`
  - Events: session_created, player_joined, company_selected, phrase_marked, bingo_achieved, share_card_viewed, vote_cast, session_abandoned
- [ ] Add analytics event tracking to relevant game components
- [ ] Create `scripts/analytics-snapshot.js` → `reports/analytics-snapshot.json`
  - Metrics: sessions created (7d), players joined, avg players per session, company play counts, bingo completion rate, share card views
- [ ] Add analytics snapshot to VPS cron (weekly, Sunday night)
- [ ] Generate launch kit via Codex (save to `docs/program/LAUNCH_KIT.md`):
  - LinkedIn announcement draft
  - X/Twitter announcement draft
  - Demo walkthrough script (2-minute verbal walkthrough)
  - Beta invite template
  - First 5 social posts with hooks
- [ ] Add feedback form link to post-game screen (Tally or Typeform)

---

## Deferred — Phase 3 and Post-Launch

- [-] Full Docker containerization of all 11 ops workers into `thereitis-ops-worker` container
- [-] SEO and AEO company page architecture (individual `/company/{ticker}` pages)
- [-] Transcript URL monitor (automated detection of new PDFs on IR pages)
- [-] OpenClaw orchestration layer
- [-] Analytics dashboard in admin panel (currently admin shows raw report JSON)
- [-] Codex memory configuration for persistent program context across automation runs

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| May 2026 | Claude Code Routines + Codex Automations as dual AI pools | Rate limit resilience: Anthropic and OpenAI usage caps are independent |
| May 2026 | 5-stage ingestion pipeline; only Stage 4 uses AI | 45x token reduction vs. feeding raw transcripts; cost predictable and low |
| May 2026 | Group E (transcript research) assigned to Codex, not Claude Code | Research is browsing and synthesis, not codebase engineering; no repo context needed |
| May 2026 | Separate Docker containers for fetcher, extractor, validator | Separation of concerns; Python is better suited to PDF/NLP work, Node for HTTP and SQL |
| May 2026 | Claude Code Routines default to `claude/` branch prefix | Preserves human merge gate for all production changes |
| May 2026 | Group A fixes are Week 1 blockers before any other group | A broken live product makes all automated reports misleading |

---

*Last updated: May 2026. Update status markers in-place as work completes. This file is the working task list for all Claude Code sessions, Routines, and Codex Automations.*
