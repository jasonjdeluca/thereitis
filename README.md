# There It Is

Real-time multiplayer earnings call bingo. Players get randomized 5×5 cards loaded with phrases extracted from actual call transcripts. During a live call, everyone taps squares as they hear phrases. Scoring, streaks, bingo detection, and end-of-game leaderboards run in the browser; state is persisted and synchronized via Supabase Realtime.

Live at: **thereitis.live**

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (Postgres + Realtime + Auth) |
| Card capture | html2canvas |
| Deployment | Vercel (auto-deploy from `main`) |

## Run locally

```bash
npm install
npm run dev
```

Requires a `.env.local` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Build for production:
```bash
npm run build
```

## Architecture

- `src/components/` — all UI components (Game, CompanySelect, Admin, TriviaQuiz, etc.)
- `src/lib/` — core logic: session creation, card generation, bingo detection, scoring, badges
- `supabase/migrations/` — versioned schema; every SQL change gets a new migration file
- `scripts/` — dev-only ingest tooling (Anthropic API, never bundled into client)

Key design decisions:
- No client-side router library — `App.jsx` is the state machine
- Trinity (three consecutive brand phrases) is always placed as a row or column run on the card
- FREE is hardcoded to `[2][2]`
- 1–2 cold phrases per card for variance
- Admin panel at `/gate` uses Supabase Auth (email + password); no password env var

## Game modes

- **Play Bingo** — join a live session, tap squares during the call
- **Call Trivia** — 6-question quiz drawn from the `trivia_questions` table

## Rules

- No individual person names anywhere in phrases, UI, or code
- No company logos or trademark assets — emoji only
- 25-character maximum on all phrase tiles (enforced by DB constraint)
- Dark navy (#0A1628) and gold (#D4AF37) throughout; Tailwind only
- Supabase project is under the "There It Is" org
- Every SQL change requires a new versioned migration file in `supabase/migrations/`
