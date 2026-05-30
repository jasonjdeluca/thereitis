# There It Is — Release Checklist

This checklist must be fully Green before public launch. Items marked with
**🔴 BLOCKER** are hard requirements. Items marked **⚠️ PREFERRED** are
strongly recommended but not blocking.

Run `node scripts/release-readiness.js` to get an automated status report.

---

## Live Game (Group A)

- [x] **🔴 BLOCKER** Silent fallback removed — no company silently serves another company's phrases
- [x] **🔴 BLOCKER** No active company has zero phrases in the DB
- [x] **🔴 BLOCKER** Trivia component supports all companies (not hardcoded to Hilton)
- [x] **🔴 BLOCKER** Readiness gate blocks session creation for companies below minimum threshold
- [x] **⚠️ PREFERRED** README.md reflects current state

## Content (Groups E, F, G)

- [ ] **🔴 BLOCKER** At least one active company has ≥50 approved phrases
- [ ] **🔴 BLOCKER** No phrase exceeds 25 characters in the DB
- [ ] **🔴 BLOCKER** No phrase contains a person's name (confirmed by Codex editorial review)
- [ ] **🔴 BLOCKER** No blank phrases in the DB
- [x] **🔴 BLOCKER** No company logos or trademark assets in the codebase
- [ ] **⚠️ PREFERRED** At least 2 active companies at launch
- [ ] **⚠️ PREFERRED** Each active company has ≥12 trivia questions
- [ ] **⚠️ PREFERRED** At least one company with ≥4 quarters of source coverage

## Database and Infrastructure

- [x] **🔴 BLOCKER** All DB migrations numbered sequentially with no gaps
- [x] **🔴 BLOCKER** RLS enabled on all tables with correct policies
- [x] **🔴 BLOCKER** Admin gate uses Supabase Auth (not sessionStorage bypass)
- [x] **🔴 BLOCKER** VITE_ADMIN_PASSWORD is not used anywhere in the codebase
- [x] **🔴 BLOCKER** Supabase project is under the "There It Is" org (not DeLucaHub)
- [ ] **🔴 BLOCKER** Migration 015 (latest_ingested_quarter column) executed in production
- [x] **⚠️ PREFERRED** increment_player_count RPC in place to prevent race conditions

## Public UX and SEO (Group I)

- [x] **🔴 BLOCKER** Non-affiliation disclaimer visible on landing page
- [x] **🔴 BLOCKER** Title tag and meta description set in index.html
- [x] **🔴 BLOCKER** Open Graph tags set for social sharing
- [x] **⚠️ PREFERRED** public/sitemap.xml present
- [x] **⚠️ PREFERRED** public/robots.txt present
- [x] **⚠️ PREFERRED** FAQ section answers "is this official?"
- [ ] **⚠️ PREFERRED** Active companies visible on landing page (requires ≥1 active company)

## QA (Group J)

- [ ] **🔴 BLOCKER** Playwright smoke tests pass against thereitis.live:
  - [ ] Homepage loads with correct title
  - [ ] Meta description present
  - [ ] Company selector shows ≥1 active company
  - [ ] /gate requires authentication
  - [ ] Mobile viewport (375px) renders without horizontal overflow
- [ ] **⚠️ PREFERRED** Game flow tests pass:
  - [ ] Session creates and card renders 25 cells
  - [ ] Marking a tile updates pressed state
  - [ ] Completing a row triggers bingo detection
  - [ ] End Game leads to post-game screen
  - [ ] Two players can join the same session

## Monitoring and Maintenance (Groups B, C, H)

- [x] **⚠️ PREFERRED** VPS cron running (company-readiness, content-validation, migration-check at 6am/9pm ET)
- [ ] **⚠️ PREFERRED** transcript-freshness.js added to VPS cron
- [ ] **⚠️ PREFERRED** Claude Code Routine daily PM brief configured
- [ ] **⚠️ PREFERRED** Codex Automation weekly content quality report configured

## Security

- [x] **🔴 BLOCKER** Security headers in vercel.json (X-Frame-Options, X-Content-Type-Options)
- [x] **🔴 BLOCKER** Anthropic SDK in devDependencies only — never bundled into client
- [x] **🔴 BLOCKER** No .env file committed
- [x] **🔴 BLOCKER** SUPABASE_SERVICE_ROLE_KEY never exposed to the browser

---

## Go/No-Go Criteria

The automated release-readiness.js script flags **Red** (blocking launch) when:
- Any active company has zero phrases
- Any phrase exceeds 25 characters
- Any critical DB migration issue is detected
- Any Playwright smoke test fails
- No active company has ≥50 phrases

The script flags **Yellow** (launch possible with known gaps) when:
- Cron reports are stale (>25 hours old)
- Companies exist below 50-phrase threshold
- Migration numbering has warnings (gaps from pending PRs)
- Smoke tests have not been run

The script flags **Green** when all reports are clean and all blockers are resolved.

---

*Last updated: 2026-05-30*
