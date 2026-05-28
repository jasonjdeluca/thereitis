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
- Migrations 005–009 (written 2026-05-28) document retroactively all tables and columns that existed before version control was established. The migrations directory is now complete. When adding anything new, add a migration file.
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

- **`sessions.created_at` missing**: Code in `src/lib/session.js` and `src/components/Lobby.jsx` reads `session.created_at` for the 6-hour expiry check. This column does not exist — the equivalent column is `started_at`. The check silently fails (returns NaN, which never exceeds the threshold), so sessions never expire client-side. Fix: update both files to use `started_at`.
- **`marks.created_at` missing**: `Game.jsx` reads `mark.created_at || new Date().toISOString()`. The `marks` table has `marked_at` not `created_at`, so this always falls back to `new Date()` — harmless but imprecise.
- **`player_badges` unused**: The table exists and has RLS policies, but the app never writes badge data to it. Badges are evaluated client-side only (PostGame/BadgeReveal). If server-side badge persistence is desired, wire `evaluateBadges()` output to an insert at game end.
- **`README.md` is outdated**: Describes a single-player no-backend prototype. `claude.md` is authoritative.

---

## Phrases

Phrases are DB-driven. The `phrases` table (migration 011) is populated per company via `scripts/ingest.js`.

**How it works:**
- `session.js` calls `fetchPhrases(companyId)` before generating each player's card.
- Fetches `phrases` where `company_id = <active company>` and `is_active = true`.
- On success, the phrase array is passed to `generateCard(phrases)` and `generateCeoCard(phrases)`.
- On failure or empty result, both functions fall back silently to the hardcoded arrays in `phrases.js`.
- Phrases are fetched once per session join and passed as a prop to `Game.jsx` for CEO mode card generation.

**Fallback:** The hardcoded `HOT`/`WARM`/`COLD`/`CEO_MODE_PHRASES` arrays in `phrases.js` serve as the fallback. `TRINITY`, `FILIBUSTER`, `GREAT_QUESTION`, `DONT_OVERCOOK`, `TIER`, and `tierOf()` remain in `phrases.js` because `Game.jsx` uses them for scoring logic regardless of phrase source.

**To add phrases for a new company:** run the ingest pipeline (see Ingest Pipeline section), review the SQL output, execute via Supabase MCP, and write it to a new migration file.

## Pending Work

---

## Active Companies

| Emoji | Name | Ticker | phrase_count | Notes |
|---|---|---|---|---|
| 🏨 | Hilton | HLT | 51 | Original company; phrases hardcoded in `phrases.js` |
| 🥤 | Coca-Cola | KO | 0 | Activated 2026-05-28; phrases pending ingest pipeline |

## Staged Companies (Ready to Ingest)

The following companies are defined in `scripts/companies.json` with 9 transcript PDF URLs each and are ready to run through the ingest pipeline. They are **not yet active** in the app — no data has been loaded.

To activate any of these: run the ingest pipeline, review the SQL, execute it, and toggle the company active at `/gate`.

| Emoji | Name | Ticker | Transcripts |
|---|---|---|---|
| 🔨 | Home Depot | HD | Q1 2024 – Q1 2026 (9 quarters) |
| 🏛️ | Citigroup | C | Q1 2024 – Q1 2026 (9 quarters) |
| 🏦 | JPMorgan Chase | JPM | Q1 2024 – Q1 2026 (9 quarters) |

Note: Emoji collision between Citigroup and JPMorgan Chase **resolved** — Citigroup reassigned 🏛️, JPMorgan Chase retains 🏦.

---

## Ingest Pipeline

To add a new company:
1. Add entry to `scripts/companies.json` with company id, name, ticker, emoji, and transcript PDF URLs.
2. Run `ANTHROPIC_API_KEY=<key> node scripts/ingest.js` — outputs SQL to `scripts/pending/<id>.sql`.
3. Review the generated SQL (check phrase lengths, trivia quality).
4. Execute via Supabase MCP (confirm "There It Is" org).
5. Write the SQL to a new `supabase/migrations/XXX_add_<id>_content.sql` file.
6. Add the company id to `COMPANY_ORDER` in `src/components/Admin.jsx` and `src/components/CompanySelect.jsx`.
