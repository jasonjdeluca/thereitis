# There It Is — Claude Code Reference

## Session Start Protocol

Every Claude Code session must begin with:

```bash
task_budget 80000
cd ~/thereitis && git pull && npm install
```

Then read in this order before touching any code:
1. This file (`claude.md`)
2. `docs/program/PROGRAM_CHARTER.md` — workstream map, tool assignments, build phases
3. `docs/program/AGENT_TASK_BACKLOG.md` — current task status across all groups
4. Relevant source files for the specific ticket being worked

---

## Project Purpose

Real-time multiplayer earnings call bingo. Players get randomized 5×5 cards loaded with phrases extracted from actual call transcripts. During a live call, everyone taps squares as they hear phrases. Scoring, streaks, bingo detection, and end-of-game leaderboards run entirely in the browser; state is persisted and synchronized via Supabase Realtime.

Live at: **thereitis.live**
GitHub: connected to Vercel for auto-deploy on push to `main`
Working directory: `~/thereitis`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2.6 |
| Build tool | Vite | 8.0.12 |
| Styling | Tailwind CSS | 3.4.19 |
| Backend/DB | Supabase | @supabase/supabase-js ^2.106.1 |
| Card capture | html2canvas | 1.4.1 |
| Deployment | Vercel | auto-deploy from main |
| Ingest script (dev only) | @anthropic-ai/sdk | ^0.98.0 (devDependency) |

PostCSS and autoprefixer are wired for Tailwind. ESLint with react-hooks and react-refresh plugins.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (used in `src/lib/supabase.js`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (used in `src/lib/supabase.js`) |
| `VITE_ADMIN_PASSWORD` | **RETIRED** | Must never be used or re-introduced. Old sessionStorage bypass is gone. |

Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in Vercel environment settings. No `.env` file is committed to the repo.

---

## Database Schema

Supabase project is under the **"There It Is" org** — always confirm before executing any SQL via MCP.

Migrations 001–012 cover the full schema. The migration directory is complete as of 2026-05-28. Every new SQL change must add a new versioned migration file.

### Tables

#### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| company_id | text | default 'hilton' |
| call_identifier | text | e.g. "Q2 2026 Earnings Call" |
| session_code | text UNIQUE | 6-char alphanumeric |
| started_at | timestamptz | default now() |
| ended_at | timestamptz | |
| status | text | default 'lobby'; set to 'active' on create via session.js |
| player_count | integer | default 0 |
| winner_phrase | text | written by WordOfTheCall after voting |

#### `players`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| session_id | uuid | FK → sessions(id) ON DELETE CASCADE |
| display_name | text | max 30 chars (DB CHECK constraint) |
| card_layout | jsonb | 5×5 grid of cell objects |
| marked_squares | jsonb | default '[]' |
| predictions | jsonb | up to 3 pre-call phrase picks |
| score | integer | default 0 |
| bingo_count | integer | default 0 |
| blackout | boolean | default false |
| joined_at | timestamptz | default now() |

#### `marks`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| session_id | uuid | FK → sessions(id) ON DELETE CASCADE |
| player_id | uuid | FK → players(id) ON DELETE CASCADE |
| phrase | text | |
| marked_at | timestamptz | default now() |
| points_awarded | integer | default 0 |
| streak_count | integer | default 0 |

#### `companies`
| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. 'hilton', 'ko' |
| name | text | display name |
| emoji | text | e.g. '🏨' — no trademark logos ever |
| is_active | boolean | controls whether "Start a Game" is enabled |
| phrase_count | integer | |
| call_identifier | text | e.g. "Q2 2026 Earnings Call" |
| next_earnings_date | timestamptz | drives countdown timer |
| next_earnings_timezone | text | e.g. 'America/New_York' |
| total_sessions | integer | default 0 |
| created_at | timestamptz | default now() |

Active companies in DB: **hilton** (🏨), **ko** (🥤 Coca-Cola).

COMPANY_ORDER in `Admin.jsx` and `CompanySelect.jsx`: `["hilton", "ko", "marriott", "hyatt", "ihg", "wyndham", "choice"]`. Companies not yet in the DB (marriott, hyatt, ihg, wyndham, choice) are silently filtered out — they appear in COMPANY_ORDER but have no rows and are not shown.

#### `trivia_questions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | text | FK → companies(id) |
| question | text | |
| option_a/b/c/d | text | |
| correct_answer | text | 'a', 'b', 'c', or 'd' |
| category | text | financial, strategy, operations, culture, general |
| difficulty | text | easy, medium, hard |
| fun_fact | text | shown after answer reveal |
| is_active | boolean | admin-toggleable |
| created_at | timestamptz | |

#### `call_votes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| session_id | uuid | FK → sessions(id) ON DELETE CASCADE |
| player_id | uuid | FK → players(id) ON DELETE CASCADE |
| phrase | text | |
| voted_at | timestamptz | default now() |
| — | UNIQUE | (session_id, player_id) — one vote per player per session |

#### `player_badges`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| player_id | uuid | FK → players(id) ON DELETE CASCADE |
| session_id | uuid | FK → sessions(id) ON DELETE CASCADE |
| badge_id | text | matches keys in `src/lib/badges.js` BADGE_DEFS |
| earned_at | timestamptz | default now() |

Currently 0 rows — badges are evaluated client-side only (PostGame/BadgeReveal) and not yet written back here.

#### `phrases`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | text | FK → companies(id) |
| phrase | text | max 25 chars (DB CHECK constraint) |
| tier | text | 'hot', 'warm', or 'cold' |
| points | integer | |
| ceo_mode | boolean | default true |
| special_square | text | 'filibuster', 'great_question', 'dont_overcook', or null |
| is_active | boolean | default true |
| created_at | timestamptz | |

Live and populated: Hilton (51 phrases seeded via migration 012). Coca-Cola row exists but phrases not yet ingested (phrase_count = 0).

### RLS Status

All tables have RLS enabled (migration 002). Policies:
- **SELECT**: public (all tables)
- **INSERT**: public for sessions, players, marks, call_votes, player_badges
- **INSERT/UPDATE/DELETE**: `auth.role() = 'authenticated'` for companies, trivia_questions, phrases
- **DELETE**: `auth.role() = 'authenticated'` for sessions, players, marks, call_votes, player_badges

### Functions / RPCs

- `increment_player_count(session_id uuid)`: Atomically increments `sessions.player_count`. Called on join to avoid race conditions.

---

## Application Architecture

### Routes (SPA, client-side via pushState)

| URL | View | Component |
|---|---|---|
| `/` | Landing page | `Landing` |
| `/companies` | Company picker | `CompanySelect` |
| `/play/:companyId` | Mode selection | `ModeSelect` |
| (state) | Name entry | `NameEntry` |
| (state) | Lobby | `Lobby` |
| (state) | Pre-call predictions | `Predictions` |
| (state) | Active game | `Game` |
| (state) | End-game leaderboard | `EndGameLeaderboard` |
| (state) | Word of the Call voting | `WordOfTheCall` |
| (state) | Post-game / share card | `PostGame` |
| (state) | Trivia quiz | `TriviaQuiz` |
| `/gate` | Admin panel | `Admin` |

`App.jsx` is the state machine. Views are passed as props; no client-side router library is used.

### Component Descriptions

- **`Landing`**: Hero page with mobile and desktop layouts. Explains how the game works; "Pick a Company" entry point. Includes a fake press strip (satirical, invented outlet names only).
- **`CompanySelect`**: Loads companies from Supabase; shows earnings countdown timer and live badge (±15 min window). Subscribes to realtime `companies` changes.
- **`ModeSelect`**: Branching point — Play Bingo or Call Trivia.
- **`NameEntry`**: Display name input (max 30 chars), create or join by 6-char code. Name persisted to `localStorage`.
- **`Lobby`**: Session code display, presence tracking via Supabase channel, prediction visibility for all players.
- **`Predictions`**: Optional pre-call step. Player picks 3 phrases they predict will be said. Stored in `players.predictions`.
- **`Game`**: Core gameplay. 5×5 bingo grid, tap-to-mark, scoring engine, CEO Mode toggle, undo window (4 sec), silence timer (5 min), realtime marks/players feed, broadcast toasts, Trinity detection.
- **`Tile`**: Single bingo cell. Handles free square, marked state, prediction highlight, line glow, Great Question burst animation.
- **`Toolbar`**: Bottom bar with score, streak, share/end/leaderboard buttons.
- **`LiveFeed`**: Scrolling feed of other players' marks and bingos.
- **`Leaderboard`**: In-game slide-up leaderboard.
- **`EndGameLeaderboard`**: Full-screen leaderboard shown at blackout or manual end.
- **`WordOfTheCall`**: 15-second post-game vote for the phrase of the call. Writes winner to `sessions.winner_phrase`.
- **`PostGame`**: Final score card with marked phrases, badge reveal, share via html2canvas (mobile share sheet or download). Loads "most heard" phrase across all sessions.
- **`BadgeReveal`**: Animated badge unlock sequence.
- **`Celebration`**: Bingo/blackout animation overlay.
- **`Toast`**: Floating notifications (local and broadcast).
- **`TriviaQuiz`**: 6-question quiz from `trivia_questions` table. Randomized per-session, difficulty-mixed (2 easy, 3 medium, 1 hard). 10-second timer per question.
- **`Admin`**: Auth-gated (Supabase Auth). Manages company earnings dates, call identifiers, active status; trivia question on/off toggles; session stats per company. **Known limitation**: `TriviaSection` is hardcoded to `company_id = "hilton"` — trivia management only works for Hilton until this is generalized.

### Lib Descriptions

- **`supabase.js`**: Supabase client singleton.
- **`session.js`**: `createSession(displayName, companyId)` and `joinSession(code, displayName)`. Fetches DB phrases via `fetchPhrases(companyId)` before card generation. Writes to `sessions` and `players`. Stores IDs in `sessionStorage`.
- **`card.js`**: `generateCard(phrases)` and `generateCeoCard(phrases)`. Both accept DB phrase rows (with fallback to hardcoded arrays). Trinity (Brand-Led, Network-Driven, Platform-Enabled) always placed as 3 consecutive cells in a row or column (not through FREE). FREE hardcoded to [2][2]. 1–2 cold phrases per card.
- **`phrases.js`**: HOT (28), WARM (18), COLD (5) phrase arrays — Hilton fallback bank. Tier point values. CEO_MODE_PHRASES subset. Special exports: TRINITY, FILIBUSTER, GREAT_QUESTION, DONT_OVERCOOK, TIER, CEO_TIER, and `tierOf()`.
- **`bingo.js`**: Line detection (5 rows + 5 cols + 2 diagonals), `evaluate()` returns completed lines + nearMiss, `isBlackout()`.
- **`badges.js`**: 12 badge definitions, `evaluateBadges()` evaluates all conditions against end-of-game state.

### Program Docs (added May 2026)
- `docs/program/PROGRAM_CHARTER.md` — full architecture, tool roles, agentic PM loop, company readiness rules, build phases
- `docs/program/AGENT_TASK_BACKLOG.md` — all tasks by workstream group with status markers. Update in-place as work completes.

### Realtime Channels

| Channel | Events | Used by |
|---|---|---|
| `game:${sessionId}` | marks:INSERT, players:UPDATE/INSERT, broadcast:toast, presence | Game |
| `lobby:${sessionId}` | players:UPDATE (predictions), presence | Lobby |
| `votes:${sessionId}` | call_votes:INSERT | WordOfTheCall |
| `companies-realtime` | companies:* | CompanySelect |

### Scoring

| Event | Points |
|---|---|
| Hot phrase | 50 |
| Warm phrase | 75 |
| Cold phrase | 150 |
| Great Question | 2× tile points |
| Bingo (per line) | +500 |
| Blackout | +2000 |
| Correct prediction | +200 |
| All 3 predictions correct | +1000 |
| Trinity (all 3 in ≤2 min) | +750 |

---

## Data Pipeline — Transcript Ingest

`scripts/ingest.js` takes PDF transcript URLs from `scripts/companies.json`, sends them to Claude Haiku via the Anthropic API, and outputs SQL files to `scripts/pending/`. The SQL populates `companies`, `phrases`, and `trivia_questions` tables.

- Model: `claude-haiku-4-5-20251001`
- Budget cap: $8.00 per run
- Requires `ANTHROPIC_API_KEY` in shell environment (NOT a Vite env var — never included in the browser bundle)
- Output SQL files must be reviewed before executing against the live DB
- `scripts/companies.json` contains ingest candidates: Coca-Cola (KO), Home Depot (HD), Citigroup (C), JPMorgan Chase (JPM)
  - Coca-Cola (`ko`) is **active** in the DB but phrases not yet ingested (phrase_count = 0)
  - Home Depot (`hd`), Citigroup (`c`), JPMorgan Chase (`jpm`) are **not yet in the DB** — run ingest + toggle active at `/gate` to activate

---

## Admin Panel

Route: `/gate`

Auth: Supabase Auth `signInWithPassword` (email + password). Session checked via `supabase.auth.getSession()` on mount. Sign-out clears auth state. **There is no password fallback — `VITE_ADMIN_PASSWORD` is retired forever.**

Admin can:
- Toggle company active/inactive
- Set next earnings date, time, timezone
- Set call identifier string
- View per-company session stats (24h sessions, total games, total players, most-marked phrase)
- Toggle trivia questions active/inactive (**Hilton only** — TriviaSection hardcoded to `company_id = "hilton"`)

---

## Deployment

- **Vercel** auto-deploys on push to `main`
- SPA rewrite: all routes → `/index.html` (via `vercel.json`)
- Security headers applied globally: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Claude Code Routines use the `claude/` branch prefix (e.g. `claude/fix-fallback`).
Always include `gh pr create` as the final step rather than asking Jason to open the PR manually.

---

## Security Posture (Hardened)

These findings are resolved — do not re-audit or re-open:

1. **Admin gate**: Supabase Auth `signInWithPassword`. `VITE_ADMIN_PASSWORD` and all sessionStorage bypass logic are gone.
2. **RLS**: Enabled on all 8 tables with appropriate policies (migration 002).
3. **Atomic player count**: `increment_player_count` RPC prevents race conditions on simultaneous joins (migration 003).
4. **Display name constraint**: DB-level `CHECK (char_length(display_name) <= 30)` (migration 004).
5. **Phrase length constraint**: DB-level `CHECK (char_length(phrase) <= 25)` on `phrases` table (migration 011).
6. **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `vercel.json`.
7. **Broadcast toast throttle**: Receiving client ignores broadcast toasts within 5 seconds of the last one.
8. **Anthropic SDK**: In `devDependencies` only — never bundled into the client.

---

## Known Bugs / Technical Debt

- **`player_badges` unused**: Table exists with full RLS, but the app never writes badge data. Badges are evaluated client-side only (PostGame/BadgeReveal). If server-side badge persistence is desired, wire `evaluateBadges()` output to an insert at game end.
- **TriviaSection hardcoded to Hilton**: `Admin.jsx` `TriviaSection` component fetches `trivia_questions` filtered to `company_id = "hilton"` only. Trivia management for other companies requires generalizing this component.
- **Coca-Cola phrases not ingested**: `ko` company row exists and is active, but `phrase_count = 0` and no rows in `phrases` for `company_id = 'ko'`. Games started for Coca-Cola silently fall back to Hilton hardcoded phrases. Fix: run ingest pipeline for KO.
- **`README.md` is outdated**: Describes a single-player no-backend prototype. This file is authoritative.

---

## Critical Rules (Non-Negotiable)

1. **No individual person names** — not in code, UI, comments, variable names, copy, or toast messages. Role references ("the CEO") are OK.
2. **No company logos or trademark assets** — emoji icons only (🏨 for hotels). This is a non-affiliated hobby project.
3. **25 character max on all phrase tiles** — enforced by `ingest.js` validation and DB constraint on `phrases.phrase`; must be respected in any manual phrase additions.
4. **Mobile first** — the 5×5 card is sacred. Nothing overlaps the card. Max width `430px` on desktop (`lg:max-w-[430px] lg:mx-auto`).
5. **Dark navy (#0A1628) + gold (#D4AF37) throughout** — use Tailwind tokens `navy`, `gold`, `cream`. Never introduce new color schemes.
6. **Tailwind CSS only** — no additional styling libraries. No inline styles except where Tailwind cannot express the value.
7. **CEO Mode only in phrase content** — all extracted phrases must be executive-level catchphrases, corporate buzzwords, or verbal tics. No operational minutiae.
8. **Supabase MCP**: Always confirm the active project is under the **"There It Is" org** before executing any SQL. Never connect to another org.
9. **Migration files**: Every SQL change executed via MCP must also be written to `supabase/migrations/` as a new versioned file (e.g., `013_add_X.sql`). Next migration number is 013.
10. **Vercel auto-deploys on push to `main`** — any push is a production deploy.
11. **VITE_ADMIN_PASSWORD is retired** — must never be re-introduced in any form.
12. **README.md is outdated** (describes a no-backend single-player prototype) — do not use it as a reference; this file is authoritative.
