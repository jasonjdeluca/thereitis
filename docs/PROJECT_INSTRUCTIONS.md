# There It Is — Project Instructions

## What This Project Is

**There It Is** is a real-time multiplayer earnings call bingo web app. Players get randomized 5×5 phrase cards built from actual call transcripts. During a live earnings call, everyone taps squares as they hear phrases. The app tracks scores, streaks, bingo lines, and runs a post-game leaderboard and "Word of the Call" vote.

Live URL: **thereitis.live**
Tagline: Earnings Call Bingo — every quarter, right on cue.

---

## Stack

- **React 19 + Vite 8** — SPA, no router library (client-side pushState state machine in `App.jsx`)
- **Tailwind CSS 3** — only styling mechanism; no other CSS libraries
- **Supabase** — Postgres DB, Realtime channels, Auth (admin only)
- **Vercel** — deployment, auto-deploys on push to `main`
- **html2canvas** — post-game shareable card image
- **@anthropic-ai/sdk** (devDependency only) — used by `scripts/ingest.js` to generate phrase/trivia SQL from PDF transcripts

---

## Repo and Working Directory

```
Working directory: ~/thereitis
GitHub repo: connected to Vercel (auto-deploy on push to main)
```

Key directories:
- `src/components/` — all React UI components
- `src/lib/` — game logic (bingo, card gen, phrases, session, supabase client)
- `supabase/migrations/` — versioned schema migrations (001–012, complete as of 2026-05-28)
- `scripts/` — ingest.js (transcript → SQL pipeline), companies.json

---

## How Claude Code Sessions Should Start

1. `cd ~/thereitis && git pull && npm install` to sync.
2. Read `claude.md` (repo root) — it is the authoritative reference for this project.
3. Check `supabase/migrations/` for current versioned schema. Next migration number is **013**.
4. Before any Supabase MCP SQL execution, confirm the active project is under the **"There It Is" org**.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anon key |
| `VITE_ADMIN_PASSWORD` | **RETIRED — must never be used or re-introduced** |

Set in Vercel environment settings. No `.env` file committed.

---

## Supabase Notes

- Project is under the **"There It Is" org** — separate from all other orgs and projects.
- Supabase MCP can execute SQL directly. Always confirm org before any execution.
- All SQL executed via MCP must **also** be written to `supabase/migrations/` as a new versioned file. This is not optional.
- Migrations 001–012 are complete and cover the full schema. Next file is `013_...`.
- Tables: `sessions`, `players`, `marks`, `companies`, `trivia_questions`, `call_votes`, `player_badges`, `phrases`
- RLS is enabled on all 8 tables.
- Admin writes (companies, trivia_questions, phrases) require `auth.role() = 'authenticated'`.
- `increment_player_count(session_id uuid)` RPC handles atomic player count on join.

---

## Vercel Deployment

- Auto-deploys on every push to `main`. No staging environment.
- SPA rewrite: all routes → `/index.html`.
- Security headers applied globally (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

---

## Critical Rules

These are non-negotiable. Violations will break the product or create legal/ethical exposure.

### Content Rules
1. **No individual person names** — anywhere. Not in code, UI copy, comments, variable names, toast messages, or phrase tiles. Role references ("the CEO", "the CFO") are acceptable.
2. **No company logos or trademark assets** — emoji icons only (🏨 for hotels, etc.). This is a non-affiliated hobby project.
3. **25 character max on all phrase tiles** — hard limit, enforced in `ingest.js` validation and by DB CHECK constraint on `phrases.phrase`.

### UI / Layout Rules
4. **Mobile first** — the 5×5 bingo card is sacred. Nothing overlaps it. Desktop max width: `430px` centered.
5. **Dark navy (#0A1628) + gold (#D4AF37) throughout** — Tailwind tokens: `navy`, `gold`, `cream`. Never introduce a new color scheme.
6. **Tailwind CSS only** — no other styling libraries. Inline styles only when Tailwind cannot express the exact value.

### Game Content Rules
7. **CEO Mode only** — all phrases extracted via `ingest.js` must be executive-level catchphrases, buzzwords, or verbal tics. No operational metrics or analyst jargon.

### Infrastructure Rules
8. **Supabase MCP**: Confirm "There It Is" org before executing any SQL. Never run against another org.
9. **Migration files**: Every SQL change must be written to `supabase/migrations/` (new versioned file).
10. **Vercel**: Every push to `main` is a live production deploy.
11. **`VITE_ADMIN_PASSWORD` is permanently retired** — do not re-introduce it in any form.

---

## Security Hardening — Completed (Do Not Re-Audit)

The following findings have been resolved and are closed:

| Finding | Resolution |
|---|---|
| Admin gate used `VITE_ADMIN_PASSWORD` + `sessionStorage` bypass | Replaced with Supabase Auth `signInWithPassword`. sessionStorage bypass removed entirely. |
| RLS not enabled on tables | Enabled on all 8 tables with appropriate policies (migration 002) |
| Race condition on player count during simultaneous joins | `increment_player_count` RPC — atomic DB-level increment (migration 003) |
| No DB constraint on display name length | `CHECK (char_length(display_name) <= 30)` added (migration 004) |
| Missing security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `vercel.json` |
| Broadcast toast could spam all clients | Receiving client throttles to max 1 toast per 5 seconds |
| `@anthropic-ai/sdk` was in production dependencies | Moved to devDependencies — not bundled to client |
| `sessions.created_at` column reference bug | Fixed: `session.js` and `Lobby.jsx` both use `started_at` (confirmed via migration 009 comments) |
| `marks.created_at` column reference bug | Fixed: `Game.jsx` uses `mark.marked_at` (confirmed via migration 009 comments) |

---

## Known Bugs / Technical Debt

These are open and documented — do not treat them as discoveries:

- **`player_badges` unused**: The table exists and has RLS policies, but the app never writes badge data to it. Badges are evaluated client-side only (PostGame/BadgeReveal). If server-side badge persistence is desired, wire `evaluateBadges()` output to an insert at game end.
- **TriviaSection hardcoded to Hilton**: `Admin.jsx` `TriviaSection` component filters trivia questions to `company_id = "hilton"` only. Trivia management for other companies requires generalizing this component.
- **Coca-Cola phrases not ingested**: `ko` row exists in `companies` and is active (`is_active = true`), but `phrase_count = 0` and no rows in `phrases` for `company_id = 'ko'`. Games for Coca-Cola silently fall back to Hilton hardcoded phrases in `phrases.js`. Fix: run the ingest pipeline for KO and execute the output SQL.
- **`README.md` is outdated**: Describes a single-player no-backend prototype. `claude.md` is authoritative.

---

## Phrases

Phrases are DB-driven. The `phrases` table (migration 011) is populated per company via `scripts/ingest.js`.

**How it works:**
- `session.js` calls `fetchPhrases(companyId)` before generating each player's card.
- Fetches `phrases` where `company_id = <active company>` and `is_active = true`.
- On success, the phrase array is passed to `generateCard(phrases)` and `generateCeoCard(phrases)`.
- On failure or empty result, both functions fall back silently to the hardcoded arrays in `phrases.js`.

**Fallback:** The hardcoded `HOT`/`WARM`/`COLD`/`CEO_MODE_PHRASES` arrays in `phrases.js` serve as the Hilton fallback. `TRINITY`, `FILIBUSTER`, `GREAT_QUESTION`, `DONT_OVERCOOK`, `TIER`, and `tierOf()` remain in `phrases.js` because `Game.jsx` uses them for scoring logic regardless of phrase source.

**To add phrases for a new company:** run the ingest pipeline (see Ingest Pipeline section), review the SQL output, execute via Supabase MCP, and write it to a new migration file.

---

## Active Companies

| Emoji | Name | Ticker | phrase_count | Notes |
|---|---|---|---|---|
| 🏨 | Hilton | HLT | 51 | Phrases seeded via migration 012 |
| 🥤 | Coca-Cola | KO | 0 | Active in DB; phrases not yet ingested — falls back to Hilton phrases |

## Staged Companies (Ready to Ingest)

The following companies are defined in `scripts/companies.json` with 9 transcript PDF URLs each and are ready to run through the ingest pipeline. They are **not yet in the DB** — no company row or phrase data exists.

To activate any of these: run the ingest pipeline, review the SQL, execute it, write a migration file, and add the company id to `COMPANY_ORDER` in `src/components/Admin.jsx` and `src/components/CompanySelect.jsx`.

| Emoji | Name | Ticker | Transcripts |
|---|---|---|---|
| 🔨 | Home Depot | HD | Q1 2024 – Q1 2026 (9 quarters) |
| 🏛️ | Citigroup | C | Q1 2024 – Q1 2026 (9 quarters) |
| 🏦 | JPMorgan Chase | JPM | Q1 2024 – Q1 2026 (9 quarters) |

Note: Emoji collision between Citigroup and JPMorgan Chase **resolved** — Citigroup assigned 🏛️, JPMorgan Chase retains 🏦.

---

## Ingest Pipeline

To add a new company:
1. Add entry to `scripts/companies.json` with company id, name, ticker, emoji, and transcript PDF URLs.
2. Run `ANTHROPIC_API_KEY=<key> node scripts/ingest.js` — outputs SQL to `scripts/pending/<id>.sql`.
3. Review the generated SQL (check phrase lengths ≤ 25 chars, trivia quality).
4. Execute via Supabase MCP (confirm "There It Is" org).
5. Write the SQL to a new `supabase/migrations/013_add_<id>_content.sql` file (increment as needed).
6. Add the company id to `COMPANY_ORDER` in `src/components/Admin.jsx` and `src/components/CompanySelect.jsx`.
