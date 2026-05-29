# There It Is — Program Charter

## Program Objective

There It Is (thereitis.live) is a real-time multiplayer earnings call bingo game. The program objective is not simply to add companies — it is to build the **factory**:

1. A stable, live multiplayer game
2. A repeatable company ingestion engine
3. A company readiness and admin console
4. A quarterly maintenance system
5. A deterministic quality and validation layer
6. An autonomous PM loop that monitors and escalates
7. A public-facing launch with SEO and social coverage
8. A sustainable operating model using flat-rate AI plans

**Target**: Public launch, early July 2026.

---

## Core Operating Philosophy
Deterministic workers produce facts.
AI agents interpret facts and recommend action.
Claude Code implements scoped engineering tickets.
Codex Automations monitor and report.
Claude Code Routines execute scheduled and triggered tasks.
Human approves risky decisions.

### Use deterministic code for:
- Counts, validations, readiness checks
- Build and test checks
- Migration numbering and duplicate detection
- Staleness detection and smoke tests
- Analytics snapshots

### Use AI for:
- Program synthesis and prioritization
- Transcript research and source verification
- Phrase and trivia generation and editorial judgment
- Engineering implementation (Claude Code)
- PM reporting and exception summary (Codex Automations)
- Scheduled implementation and PM briefs (Claude Code Routines)

### Require human approval for:
- Production Supabase SQL execution
- Merges to `main`
- Company activation
- RLS, auth, or security changes
- Final content approval for new companies
- Public launch posts
- Any broad batch automation affecting more than 10 companies

---

## Tool Architecture

### Claude Code — The Engineer
Builds all code: game fixes, deterministic scripts, Docker containers, admin console, ingestion pipeline, smoke tests, public UX, analytics tracking. Operates via discrete implementation tickets. Also configures Claude Code Routines.

Runs as: triggered sessions (human-initiated) and Claude Code Routines (Anthropic-managed cloud).

### Docker/VPS Workers — The Runner
Executes what Claude Code built, on a schedule, unattended. Never makes judgment calls. Writes `reports/*.json` that all AI tools read. VPS cron triggers at 6am ET and 9pm ET daily.

### Codex Automations — The Analyst
Researches, synthesizes, and reports. Reads `reports/` output. Posts exception summaries to GitHub. Runs transcript source research in batches of 3–5 companies. Never writes production code.

Runs as: scheduled automations on OpenAI's platform (separate usage pool from Anthropic).

### Claude Code Routines — The Scheduled Engineer
Claude Code running on Anthropic-managed infrastructure on a schedule or GitHub event trigger. Reads `reports/` and recent commits, posts daily PM brief, implements labeled tickets without requiring a local session.

Plan limits: 5/day (Pro), 15/day (Max), 25/day (Team/Enterprise). Draws from same Anthropic usage pool as interactive sessions.

### Human — Approval Authority
Reviews PM briefs, approves and labels implementation tickets, reviews and merges PRs, approves production SQL, signs off on company activation and public launch.

---

## The Agentic PM Loop (24-Hour Cycle)
6am ET:    VPS cron runs 4 scripts → writes reports/*.json
~6:15am:   Claude Code Routine (scheduled) reads reports/pm-packet.json
+ recent commits → posts GitHub issue "Daily PM Brief — [date]"
Morning:   Human reviews PM brief
→ applies label "claude-implement" to chosen tickets
→ applies label "human-decision-needed" to items needing approval
Triggered: Claude Code Routine fires on "claude-implement" label event
→ reads labeled issue + codebase
→ implements 1–2 tickets
→ opens PR to claude/ branch
Human:     Reviews PR → merges to main
Vercel:    Auto-deploys on push to main
9pm ET:    VPS cron re-runs scripts → seeds tomorrow's reports
Overflow:  Codex Automations cover PM brief and triage
when Claude Code Routines hit daily cap

Branch security: Claude Code Routines push only to `claude/`-prefixed branches. Human merges to main.

Rate limit resilience: Codex Automations run from the OpenAI usage pool. When Claude Code Routines are cooling off, Codex handles reporting. VPS cron always runs regardless of AI availability.

---

## Workstream Groups and Tool Assignments

### Group A — Live Game Stability
Owner: Claude Code
No Docker, no Codex involved.

Tasks: remove silent fallback behavior, fix or deactivate companies with active status and zero phrases, generalize trivia beyond a single hardcoded company, add active company readiness gate.

⚠️ Week 1 blockers. No other group should be considered complete until Group A is done.

---

### Group B — Deterministic Truth Layer
Build: Claude Code
Run: Docker/VPS cron (6am and 9pm ET)

Four scripts, all in `scripts/`:
- `company-readiness.js` → `reports/company-readiness.json`
  Checks: phrase count per company, trivia count, phrase length violations, active-with-zero-phrases, fallback risk, missing metadata
- `content-validation.js` → `reports/content-validation.json`
  Checks: 25-char max on all phrases, blank phrases, duplicates, invalid company IDs, possible person names, trivia missing choices or correct answer
- `migration-check.js` → `reports/migration-check.json`
  Checks: migration file numbering, duplicate numbers, SQL changes outside migrations, filename format
- `pm-packet.js` → `reports/pm-packet.json`
  Aggregates all three reports into a single input packet for AI agents

The `reports/` directory output should be excluded from version control (.gitignore). Reports are runtime artifacts, not source.

This layer is the foundation for all AI automation. Group C is not useful until Group B reports exist.

---

### Group C — Automation Infrastructure
Build and configure: Claude Code
Run (Anthropic pool): Claude Code Routines
Run (OpenAI pool): Codex Automations
Run (VPS): cron triggers

Components:
- Claude Code Routine: Daily PM Brief. Trigger: schedule, 6:15am ET weekdays. Prompt reads `reports/pm-packet.json` plus recent git commits and posts a GitHub issue titled "Daily PM Brief — [date]" with status summary, blockers, and recommended next tickets.
- Claude Code Routine: GitHub-triggered implementation. Trigger: label `claude-implement` applied to a GitHub issue. Reads the labeled issue plus codebase context, implements the ticket, opens PR to `claude/` branch.
- Codex Automation: Weekly content quality summary. Trigger: schedule, Friday 8am ET. Reads content validation and company readiness reports. Posts GitHub issue "Weekly Content Quality Report — [date]".
- Codex Automation: Nightly ingestion queue triage. Trigger: schedule, 9:30pm ET during active onboarding. Reads ingestion status report. Posts exceptions as GitHub issue or comment.
- Codex Automation: Overflow PM brief. Trigger: schedule, 8am ET daily. Only posts if no Claude Code Routine PM brief has been posted today (backup for when Routines hit daily cap).
- GitHub labels: `claude-implement`, `human-decision-needed`, `content-review`, `migration-ready`

Routine and Automation prompt files should be documented in `docs/program/prompts/`.

---

### Group D — Admin Console
Owner: Claude Code
No Docker, no Codex involved.

Features: company readiness table with status badges (Ready / Needs Phrases / Needs Trivia / Blocked), activation gate that blocks toggling a company to active if it fails minimum readiness, phrase and trivia count display per company, ingestion status indicator, next call date field (editable), admin warning states for stale transcripts and companies below threshold, sample card preview showing a random 5×5 card with that company's phrases.

---

### Group E — Transcript Research
Owner: Codex Automations (batches of 3–5 companies per run)
No Claude Code, no Docker. Pure research.

Tasks: build initial target company list, discover official IR source URLs per company, score source confidence on a defined scale (Official IR site / SEC 8-K filing / Seeking Alpha / Paywalled / Audio-only / Not found), build `source_manifest.json` per company in `company-packs/{ticker}/`, map quarter-by-quarter transcript coverage, flag missing quarters, escalate companies with no accessible transcripts.

Output feeds the Group F fetcher. This workstream can start immediately in parallel with Groups A and B — it has no code infrastructure dependency.

---

### Group F — Ingestion Pipeline
Build: Claude Code (one focused session builds all containers)
Run: Docker/VPS (nightly cron)
AI enrichment: Claude Haiku or GPT-4o Mini API call inside the container (not a Claude Code session — a plain API call from within the Docker worker)

Company pack directory structure:
company-packs/{ticker}/
company.json
source_manifest.json
transcripts/          (raw PDFs)
extracted/            (plain text per quarter)
generated/
phrases.json
trivia.json
validation_report.json
migration.sql

5-stage pipeline:
- Stage 1 — Fetcher (Node.js): reads source manifests, HTTP-fetches PDFs from IR URLs, saves to `transcripts/`, logs success and failure per quarter. No AI.
- Stage 2 — Extractor (Python): PDF text extraction, sentence tokenization, n-gram extraction (2–4 word phrases), cross-quarter frequency scoring. Hard filter drops anything over 25 characters. Outputs ranked `candidate_phrases.json`. No AI.
- Stage 3 — Structural filter (Node.js): drops phrases with fewer than 2-quarter recurrence, removes acronym-heavy candidates, removes generic filler via blocklist, flags proper nouns via lightweight NER. No AI.
- Stage 4 — AI enrichment (API call): feeds ~200 pre-filtered candidates to Claude Haiku or GPT-4o Mini. Returns top 40–50 phrases plus trivia questions. Approximately 3,000 tokens per company (versus 135,000 for raw transcript input — 45x token reduction). This is the only AI call in the pipeline.
- Stage 5 — Validator and SQL generator (Node.js): hard-validates all output against project rules (25-char max, no person names, no blanks, no duplicates), generates migration SQL from template, opens GitHub PR via API with the generated SQL and validation report. No AI.

Docker containers: `fetcher/` (Node.js), `extractor/` (Python), `validator/` (Node.js), `queue/` (SQLite job queue).

---

### Group G — Content QA
Build validation scripts: Claude Code
Run hard checks: Docker/VPS
Editorial judgment: Codex Automations (triggered per company pack)

Hard checks run by Docker after Stage 4: 25-char max, no blank phrases, no duplicates, no person names, valid company IDs, trivia has all required fields and a correct answer flagged.

Editorial review by Codex: reviews AI-enriched phrase candidates for taste, playability, and alignment with CEO Mode before migration SQL is generated. Triggered once per company pack when generation is complete.

Content QA rubric to be documented in `docs/program/CONTENT_QA_RUBRIC.md`.

---

### Group H — Evergreen Maintenance
Build: Claude Code
Run: Docker/VPS (daily during earnings season, weekly otherwise)
Exception reporting: Codex Automations

Components:
- Transcript freshness watcher → `reports/transcript-freshness.json`. Checks: next call date approaching (within 14 days), call date passed without a new transcript ingested, latest ingested quarter age per company.
- Stale company detector: flags companies more than 2 quarters behind on transcript coverage.
- Post-call transcript watch: daily HTTP check on known IR pages for companies with earnings calls in the past 10 days.
- Latest-ingested-quarter metadata stored per company in Supabase or company.json.

Runbook to be documented in `docs/program/EVERGREEN_MAINTENANCE_RUNBOOK.md`.

---

### Group I — Public UX and SEO
Owner: Claude Code
No Docker, no Codex.

Features: landing page rewrite explaining the game loop in under 30 seconds, how-to-play section, static sample bingo card preview, supported companies section showing active companies by emoji and name, unofficial non-affiliation disclaimer, SEO metadata (title, description, Open Graph, Twitter/X card), `public/sitemap.xml`, `public/robots.txt`, basic FAQ section.

---

### Group J — QA and Launch Hardening
Build tests: Claude Code
Run tests: Docker/VPS
Go/no-go synthesis: Codex Automation

Components:
- Playwright public smoke test suite: homepage loads, start/join routes load, company selector loads, admin route is protected, no visible crash, mobile viewport renders, title and meta present.
- Game flow smoke test: create session, join session, card renders, mark behavior works, bingo detection fires, post-game screen shows.
- Release readiness script → `reports/release-readiness.json` (aggregates status of all other reports).
- Release checklist documented in `docs/program/RELEASE_CHECKLIST.md`.
- Codex Automation: weekly release readiness synthesis — reads all reports, posts go/no-go posture as GitHub issue.

---

### Group K — Analytics and Launch
Analytics code: Claude Code
Analytics snapshot reports: Docker/VPS
Launch copy and social content: Codex
Public posting: Human

Components:
- Analytics event tracking (session created, player joined, company selected, bingo, share card used, vote cast).
- `scripts/analytics-snapshot.js` → `reports/analytics-snapshot.json` (weekly).
- Launch kit: announcement copy, demo script, first social content pack, beta invite template. Generated by Codex, reviewed and posted by human.
- Feedback form linked from post-game screen.

---

## Build Phases

### Phase 1 — Now (June, Weeks 1–2)
- Group A: Fix live game blockers (silent fallback, zero-phrase active companies, trivia generalization)
- Group B: Four deterministic scripts plus VPS cron
- Group E: Begin Codex transcript research for first 10–15 companies (runs in parallel with A and B)

### Phase 2 — Mid-June (Weeks 3–5)
- Group C: Automation infrastructure (Claude Code Routines and Codex Automations)
- Group D: Admin readiness console
- Group F: Full ingestion pipeline (Docker containers, all 5 stages)
- Group G: Content validation rules and editorial QA process
- Group H: Evergreen freshness watcher
- Group I: Public UX improvements

### Phase 3 — Defer Post-Launch
- Full 11-worker Docker ops suite
- SEO and AEO company page architecture
- Analytics dashboard in admin
- Transcript URL monitor
- OpenClaw orchestration layer

---

## Company Readiness Rules

### Minimum (required before activation)
- Company row exists with valid ID, name, ticker, and emoji
- At least 50 approved phrases
- No phrase over 25 characters
- No detected person names in phrases
- No company logos or trademark assets
- No wrong-company content (phrases from a different company's transcripts)
- At least 12 trivia questions with all choices and a correct answer
- Source coverage from at least 2 quarters
- Does not rely on silent fallback to another company's phrases

### Preferred (target before public launch)
- 75 or more approved phrases
- 18 or more trivia questions
- 4 or more quarters of source coverage
- Latest transcript within current or prior reporting cycle
- Admin readiness status = Ready

---

## Critical Project Rules

These apply to every Claude Code session, every PR, and every piece of generated content. They cannot be overridden.

- No individual person names anywhere — not in code, UI, comments, variable names, copy, or toasts
- No company logos or trademark assets — emoji icons only
- 25-character maximum on all phrase tiles — no truncation, no exceptions
- Mobile first — the bingo card is sacred, nothing overlaps it
- Dark navy (#0A1628) and gold (#D4AF37) throughout all UI
- Tailwind CSS only — no additional styling libraries
- CEO Mode only — never reference individual executives by name
- Output all SQL clearly for manual execution — never attempt to auto-run Supabase migrations
- Supabase project is under the "There It Is" org — separate from any other projects
- Vercel auto-deploys on push to main — do not push directly to main for production changes

---

## Human Approval Gates

### Always requires human approval
- Production Supabase SQL execution
- Merge to `main`
- Company activation (toggling a company to active/public)
- RLS, auth, or security policy changes
- Vercel production environment settings
- Public launch posts and announcements
- Legal or disclaimer posture changes
- Broad batch automation affecting more than 10 companies at once

### AI may recommend but not execute
- Disable or enable a company
- Apply a migration to production
- Refresh a company's content with new phrases
- Retire existing phrases
- Promote a company publicly

### Fully automated (no approval needed)
- Readiness, validation, and migration report generation
- Duplicate and phrase length checks
- Build and test execution
- Smoke test runs
- Analytics snapshots
- PM packet generation and posting

---

*Last updated: May 2026. This file is the source of truth for all Claude Code sessions, Claude Code Routines, and Codex Automations working on this project.*
