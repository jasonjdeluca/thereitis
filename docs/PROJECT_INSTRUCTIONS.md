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
- `supabase/migrations/` — versioned schema migrations (NOTE: incomplete — see below)
- `scripts/` — ingest.js (transcript → SQL pipeline), companies.json

---

## How Claude Code Sessions Should Start

1. `cd ~/thereitis && git pull && npm install` to sync.
2. Read `claude.md` (repo root) — it is the authoritative reference for this project.
3. Check `supabase/migrations/` for current versioned schema.
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
- All SQL executed via MCP must **also** be written to `supabase/migrations/` as a new versioned file (e.g., `005_add_X.sql`). This is not optional.
- The existing migrations directory is **incomplete** — several tables and columns exist in the live DB but lack CREATE TABLE migrations. When adding anything new, add the migration file regardless.
- Tables: `sessions`, `players`, `marks`, `companies`, `trivia_questions`, `call_votes`, `player_badges`
- RLS is enabled on all tables.
- Admin writes (companies, trivia) require `auth.role() = 'authenticated'`.
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
3. **25 character max on all phrase tiles** — hard limit, enforced in `ingest.js` validation.

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
| RLS not enabled on tables | Enabled on all 7 tables with appropriate policies (migration 002, 2026-05-27) |
| Race condition on player count during simultaneous joins | `increment_player_count` RPC — atomic DB-level increment (migration 003) |
| No DB constraint on display name length | `CHECK (char_length(display_name) <= 30)` added (migration 004) |
| Missing security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `vercel.json` |
| Broadcast toast could spam all clients | Receiving client throttles to max 1 toast per 5 seconds |
| `@anthropic-ai/sdk` was in production dependencies | Moved to devDependencies — not bundled to client |

---

## Known Bugs / Technical Debt

These are open and documented — do not treat them as discoveries:

- **`PostGame.jsx:189`**: `"Hilton · Q2 2026"` is hardcoded; should use `companyName` and `callIdentifier` props.
- **Incomplete migrations**: `companies`, `trivia_questions`, `call_votes`, `player_badges` tables; `sessions.winner_phrase`, `sessions.created_at`, `players.predictions`, `marks.created_at` — in live DB, not in migration files.
- **`phrases` table**: Generated by `ingest.js` SQL but app reads phrases from `src/lib/phrases.js` (hardcoded). DB-driven phrases are a future upgrade.
- **`README.md` is outdated**: Describes a single-player no-backend prototype. `claude.md` is authoritative.

---

## Ingest Pipeline

To add a new company:
1. Add entry to `scripts/companies.json` with company id, name, ticker, emoji, and transcript PDF URLs.
2. Run `ANTHROPIC_API_KEY=<key> node scripts/ingest.js` — outputs SQL to `scripts/pending/<id>.sql`.
3. Review the generated SQL (check phrase lengths, trivia quality).
4. Execute via Supabase MCP (confirm "There It Is" org).
5. Write the SQL to a new `supabase/migrations/XXX_add_<id>_content.sql` file.
6. Add the company id to `COMPANY_ORDER` in `src/components/Admin.jsx` and `src/components/CompanySelect.jsx`.
