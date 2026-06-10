# There It Is — Architecture & Code Audit

## Audit Date

2026-06-10. Independent outside audit. Read-only — no source files, companies, or PRs were modified. All SQL in this report is output for human execution only.

## Executive Summary

The core bingo engine is sound: line detection is correct (5 rows, 5 columns, 2 diagonals, FREE handled), card generation is careful, the undo/commit model is thoughtful, and the admin auth migration to Supabase Auth was done properly. The program's documentation discipline, however, has outrun its verification discipline — and that gap has produced three critical failures.

**First**, every pipeline-ingested company (Coca-Cola, Boeing, 3M, Home Depot — 4 of the 5 live companies) awards **0 points per marked tile**. Pipeline phrases carry `tier='standard'`, which the scoring table in `phrases.js` does not contain. Only Hilton scores correctly. This is a live, player-facing product failure today.

**Second**, the entire "deterministic truth layer" has never run on schedule. Every crontab entry uses `source .env`, but cron executes under `/bin/sh` → dash, where `source` does not exist. Every cron invocation since Group B was "completed" has died before reaching node. Reports are 11+ days stale; the ingestion poller has been dead since June 1. Group B is marked ✅ Complete in the backlog and PROGRAM_STATE claims "VPS cron running" — both false. Even once fixed, the schedule is written in UTC on a UTC server, so "6am ET" actually means 2am ET.

**Third**, RLS allows any anonymous client to UPDATE any `players` row and any `sessions` row (`USING (true)`). Any player — or any script with the public anon key — can rewrite anyone's score, end any session, or vandalize the winner phrase.

The factory concept is good. The single biggest systemic risk is that agents mark work complete without verifying it runs, and three diverging sources of truth (claude.md, PROGRAM_CHARTER, PROGRAM_STATE) compound the drift.

## Critical Findings

### C-1 · Live Game Correctness — Pipeline-ingested companies score 0 points per mark

**Severity: CRITICAL.** Files: `src/components/Game.jsx:369-372`, `src/lib/phrases.js:70-75`, `src/lib/card.js:16-24`, `company-packs/*/generated/migration.sql`.

All pipeline-generated phrases are inserted with `tier='standard', points=1` (confirmed in `company-packs/KO/generated/migration.sql` — all 50 rows). The only place `'standard'` is handled in `src/` is `card.js:20`, which maps it into the *warm pool for card layout only*. The cell's `tier` property is still set to `'standard'` via the tier lookup (`card.js:66-67`). At scoring time, `getPointsForTier('standard')` evaluates `TIER['standard']?.points || 0` → **0**. The tier dot is likewise blank (`Tile.jsx:21`).

Net effect: on Coca-Cola, Boeing, 3M, and Home Depot — 4 of 5 live companies — every tap scores zero. Scores only move on bingo (+500), blackout, and prediction bonuses. Hilton (hand-tiered hot/warm/cold) is the only company where the game scores as designed. The `phrases.points` DB column exists and is populated but is never read by the app — two scoring sources, neither authoritative.

**Resolution:** one of (a) add `standard: { dot: "⚡", points: 75 }` to `TIER`/`CEO_TIER`, (b) normalize tier at fetch in `session.js`, or (c) make the app read `phrases.points`. Option (a) is a two-line fix; longer-term, pick a single source of truth for points. Add a game-flow test that asserts score > 0 after a mark on a non-Hilton company.

### C-2 · Operations — The VPS cron layer has never executed (dash vs. `source`)

**Severity: CRITICAL.** Files: crontab, `logs/`, `reports/`.

Every crontab line is of the form `cd ~/thereitis && set -a && source .env && set +a && node …`. Cron runs commands under `/bin/sh`, which on this host is **dash**. `source` is not a dash builtin — verified: `/bin/sh -c "source .env"` → `source: not found`. Every scheduled invocation fails before node runs. Supporting evidence:

- `reports/*.json` last written 2026-05-29/30 (manual runs), 11 days stale as of this audit.
- `logs/cron.log` does not exist at all — the truth-layer cron has never produced output.
- `logs/poller.log` ends 2026-06-01 01:18 — those entries match manual session-18 testing, not the every-3-minute schedule. The ingestion control plane (admin "Run Pipeline" button → `ingestion_runs` → poller) is currently dead: requests queue forever.
- Session 18 diagnosed "missing logs/ directory" as the root cause. That was a secondary symptom; the actual failure is the shell builtin. The fix did not fix it — and no one verified it after.
- Compounding issues even after the fix: (1) the server runs **UTC**, so `0 6` / `0 21` = 2:00am/5:00pm ET, not the charter's 6am/9pm ET; (2) the `>> log 2>&1` redirect binds only to the *last* command in the `&&` chain, so failures of earlier scripts are silently discarded.

**Resolution:** replace `source .env` with `. ./.env` (POSIX) or set `SHELL=/bin/bash` at the top of the crontab; wrap each chain in a single logged subshell (`( … ) >> log 2>&1`); set `CRON_TZ=America/New_York` or adjust hours; add a staleness self-check (the freshness watcher itself depends on cron, so it cannot detect its own death — see X4).

### C-3 · Security — Anonymous clients can rewrite any player and any session

**Severity: CRITICAL.** File: `supabase/migrations/002_rls_policies.sql`.

- `players_update_own` is `FOR UPDATE USING (true)` — the name says "own," the policy says *anyone*. Any anonymous client can set any player's `score`, `bingo_count`, `blackout`, `display_name`, or `card_layout` in any session.
- `sessions_update_anon` is `USING (true)` — anyone can flip any session's `status` to `ended` (killing joins), change `company_id`, or overwrite `winner_phrase`.
- `marks_insert_anon` has `WITH CHECK (true)` with no ownership tie — anyone can insert marks attributed to any `player_id`, polluting feeds and "Everyone heard that" logic.

Players are anonymous (no Supabase auth), so true ownership checks need a token the server can verify. A pragmatic mitigation without adding auth: move score/mark writes behind `SECURITY DEFINER` RPCs that validate the player belongs to the session and cap per-call deltas, and drop direct UPDATE policies. At minimum, restrict updatable columns (`GRANT UPDATE (score, marked_squares, …)`) and constrain session updates to the voting path. This was reviewed under "Security Posture (Hardened)" in claude.md as resolved — the hardening covered admin tables but not game-state tables.

## High Priority Findings

### H-1 · Schema drift — applied migrations with no migration files

PROGRAM_STATE documents "Migration 019 added UNIQUE(company_id, phrase)" and an admin RLS fix on `phrases` switching `auth.role()` to `auth.uid()` (017's comment references a `fix_phrases_rls_uid_check` applied to phrases). **Neither exists in `supabase/migrations/`** — files stop at 018, and 017 covers only `phrase_staging`. The live DB has at least two changes the repo cannot reproduce. The admin approve flow (`Admin.jsx:482-487`) upserts with `onConflict: "company_id,phrase"` and hard-depends on the invisible 019 constraint. `migration-check.js` validates the directory, so it is structurally blind to this class of drift. **Resolution:** write 019 (and the phrases RLS fix) as retroactive migration files now; add a periodic live-schema-vs-directory diff.

### H-2 · Program state is materially wrong and 9 days stale

PROGRAM_STATE ("last updated 2026-06-01") lists "Merge PR #45" as awaiting human action — #45 is merged, as are #47 and #48 (homepage changes reflected nowhere in program docs). GitHub shows **zero open PRs**; nothing in flight is tracked. Group B is marked ✅ Complete with "cron running" (false, C-2). The PR-#18 blocker referenced in audit scoping is resolved — #18 merged long ago. claude.md is worse: it still documents the retired `scripts/ingest.js` Anthropic-API path as the data pipeline, calls KO "phrases not yet ingested" with a "silent fallback to Hilton" (both false — KO is live with 50 phrases and the fallback was removed), and lists only hilton/ko as active. Three contradicting sources of truth is how an agent re-introduces a removed behavior. **Resolution:** one state-update pass, then make PROGRAM_STATE the single mutable state file and strip state claims from claude.md.

### H-3 · Realtime social features are broken by stale closures

`Game.jsx` subscribes once (`useEffect` deps `[sessionId, playerId, displayName]`), so handler closures capture first-render state:

- `checkInSync` (Game.jsx:346-367) reads `grid` from the initial render — no cell is ever `marked`, so `myMarked` is always empty and **the In Sync event can never fire**. `inSyncFired` is passed to PostGame badges; that badge is unreachable.
- `checkEveryoneHeardThat` (Game.jsx:320-344) builds `uniquePlayers` by adding the *phrase* instead of the player ID (line 336) — dead logic — and the actual threshold compares raw mark count (including your own marks, including duplicate-phrase cells from repeat-padded cards) against a unique-player threshold. Fires too easily; wrong semantics.

**Resolution:** route both through refs (the file already uses `playersRef` correctly) and fix the unique-player set to key on `player_id`.

### H-4 · No realtime failure handling, no error boundary, no observability

`channel.subscribe()` callbacks handle only `SUBSCRIBED`; `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` appear nowhere in `src/`. A dropped websocket silently freezes the feed, leaderboard, and presence with no recovery or user signal — on a 60-minute call with mobile devices locking screens, this is the common case, not the edge case. There is no React error boundary (`main.jsx` renders bare), no Sentry or equivalent, and the silent-failure audit found 8 bare `catch {}` blocks and ~17 swallow-with-fallback patterns in `src/`. If production breaks during a live call, the operator finds out from players, or never (H1 of scope: confirmed — no tracking exists). **Resolution:** handle non-SUBSCRIBED statuses with resubscribe + a "reconnecting" pill; add a top-level error boundary; add minimal client error reporting.

### H-5 · `phrase_staging` is publicly writable with no constraints

Migration 013 grants anonymous INSERT (so `staging-writer.js` can run keyless) and 016 grants anonymous UPDATE of `pending` rows to `ai_selected`/`ai_rejected`. Consequences: anyone with the anon key (it ships in the bundle) can flood the admin review queue with garbage rows — **no 25-char CHECK exists on `phrase_staging.phrase`** (only on `phrases`) — or mass-reject every pending row, silently destroying weeks of pipeline output. **Resolution:** the VPS scripts already have `.env` access; move staging writes to a service-role key (a pending decision noted in scope H4 — the scripts currently assume anon is enough *because the policies were widened to allow it*), then drop the public INSERT/UPDATE policies and add the length CHECK.

### H-6 · The activation readiness gate counts the wrong thing

`Admin.jsx:199-215` computes readiness from `phrases`/`trivia_questions` with **no `is_active` filter** — inactive rows count toward the 50/12 gate. Concrete case from PROGRAM_STATE itself: V has 13 phrases, all `is_active=false`; the gate sees 13. A company could reach "50 phrases" entirely on inactive rows, get activated, and then `fetchPhrases` (which *does* filter `is_active=true`) returns a near-empty pool — repeat-padding (`card.js:114-118`) will then build a 24-cell card from a handful of phrases instead of failing. The charter's other minimums (person-name check, 2-quarter coverage, no-fallback) are not represented in the gate at all, and the whole gate plus the Override link is client-side — nothing at the DB layer prevents activating an empty company. **Resolution:** filter both counts on `is_active=true`; consider a DB trigger or RPC for activation.

## Medium / Low / Observations

| Sev | Domain | Finding | File | Recommendation |
|---|---|---|---|---|
| MED | A1/G1 | Sessions never end: `status='ended'` and `ended_at` are checked but never written by any code path; expiry is only the 6-hour join check. `companies.total_sessions` never incremented. | `src/lib/session.js:77`, grep-verified | Write `ended` on End Game; or document sessions as fire-and-forget and drop the dead columns |
| MED | A4 | Repeat-padding silently builds degenerate cards when a pool is tiny (1 phrase → 24 identical cells, instant-win geometry). No minimum pool size at session creation. | `src/lib/card.js:113-118`, `session.js:33` | Require a floor (e.g. ≥24 active phrases) in `createSession`, matching the activation gate |
| MED | A2 | Wins are fully client-trusted: bingo evaluated locally, +500 self-awarded, written via the open UPDATE policy (C-3). Simultaneous bingos both award; no server arbitration or verification path. Acceptable for a party game only if score writes are constrained. | `Game.jsx:520-530` | Server-side mark validation can wait; constrain writes per C-3 first |
| MED | A3/D3 | 25-char max enforced at: ingestion validator, ops-worker validator, `phrases` DB CHECK — but **not** `phrase_staging` (H-5) and not at render. Render handles overflow by font-shrink in `Tile.jsx:3-17` (clamps at 9px, `break-words`) — a >25 DB phrase can't exist, so render is safe; staging is the gap. | `Tile.jsx`, `013_phrase_staging.sql` | Add CHECK to staging |
| MED | B5/H4 | Slug duality is real (hotel word-slugs vs ticker slugs) but contained: `TICKER_TO_COMPANY_ID` in `scripts/ingestion/lib/common.js` is authoritative. Residual risk: `Admin.jsx:5-8` still carries `COMPANY_ORDER`/`TICKER_LABELS` remnants ("fully dynamic" claims in session 17 notes are only mostly true), and `sessions.company_id` defaults to `'hilton'` at the DB level. | `Admin.jsx:5`, `001_…sql` | Drop the DB default; keep the mapping module as the single converter |
| MED | D2 | FREE tile hardcodes the 🏨 hotel emoji for every company — a Boeing card shows a hotel. Companies' own emoji is available in context. | `src/components/Tile.jsx:57` | Pass company emoji into Tile |
| MED | F1 | Single 720 KB JS chunk (189 KB gzip). Admin panel (1,505 lines), html2canvas, and the game all ship to every visitor on the landing page. | build output | Lazy-load Admin and html2canvas via dynamic import |
| MED | F4 | CEO Mode toggle resets local score to 0 and the next `commitPending` overwrites the DB score — a player can wipe (or game) their own leaderboard standing mid-call; on pipeline companies the CEO pool ≈ full pool (all rows `ceo_mode=true`), so the mode is cosmetic there. | `Game.jsx:644-674` | Persist mode switch server-side or freeze score on toggle |
| MED | C2 | Admin protection is real (Supabase Auth, RLS on admin tables with `auth.uid()` checks) — but the readiness/override logic is client-side only (H-6), and `VITE_ADMIN_PASSWORD` retirement is confirmed (no hits in src; .env not committed, no env history in git). | — | DB-level activation guard |
| MED | E3 | Charter's 5-stage Docker pipeline diverged: Stage 4 AI enrichment moved out of the container to Claude-Code-subscription sessions (PR #37/42); `ai-select.js` (Anthropic API, Haiku batches ~1024 max_tokens — within the ~3k/company envelope, not raw transcripts) still exists in-repo while claude.md says "that path was removed." Stage reruns are possible per-script (fetcher/extractor/validator are separate). `ops-worker/queue/` (SQLite state machine) and `docker-compose.yml` remain unbuilt. | `scripts/ingestion/`, charter §Group F | Update the charter to the queue architecture; delete or clearly quarantine `ai-select.js` and `scripts/ingest.js` |
| MED | H2 | Supabase plan/limits: **UNABLE TO VERIFY** from the repo (no plan info; MCP not queried per read-only mandate). Architecture multiplies realtime load: every mark INSERT fans out to all subscribers via `postgres_changes` (RLS-evaluated per subscriber). 50 players × ~40 marks ≈ 2,000 inserts → ~100,000 deliveries per call, plus presence + broadcast. Free-tier realtime defaults (200 concurrent connections, 500 msg/s) would likely survive one 50-player session but not several concurrent ones. | — | Verify plan; consider broadcast-from-client for marks instead of postgres_changes |
| LOW | A1 | `fetchPhrases` returns null on *any* error, so a transient network failure reports "This company has no phrases yet" — wrong message, masks the real failure. | `session.js:7-19` | Distinguish error from empty |
| LOW | A1 | Session code generation has no collision retry; a UNIQUE violation surfaces as a raw thrown Supabase error. ~887M keyspace makes this rare, not impossible. | `session.js:22-36` | Retry once on 23505 |
| LOW | B2 | Nullable FKs the app assumes non-null: `players.session_id`, `marks.player_id`. `display_name` has a max but no min — empty-string names pass the DB. Trivia/`call_votes` fine. | `001_…sql` | NOT NULL + min-length checks in next migration |
| LOW | D1 | Person names: no individual names found in `src/`, seeds, or UI copy (grep across common executive first/last names + manual review of Hilton seed). DB phrase content beyond the repo: see SQL section. Pipeline enforces a person-name filter at Stage 5. | — | Run the SQL check below quarterly |
| LOW | D2 | No logos/trademark assets found: no `<img>` of brands, emoji-only company branding; the two hero PNGs are original art backgrounds. | `Landing.jsx:158,374` | None |
| LOW | D4 | CEO Mode is a UI mode (card reshuffle from `ceo_mode` pool) plus a content rule. No named executives anywhere in game copy or toasts ("He warned you. 🎙️" at `Game.jsx:486` is a role-free reference, though it edges toward identifying a specific person — keep an eye on it). | `Game.jsx:486` | Optional rewording |
| LOW | E1 | Multi-agent protocol intact: `codex/inbox/` + `codex/staging/` exist, PROTOCOL.md present, no unactioned task briefs in inbox (only the completed trivia-rewrite brief). `codex/staging` branch diverges from main by 234 files — mostly deletions of main's newer work; treat as read-only deposit branch, never merge wholesale. | `PROTOCOL.md` | Periodically rebase or recreate the staging branch |
| LOW | F3 | Dependencies current (React 19, Vite 8, supabase-js 2.106; `npm install` reports 0 vulnerabilities). html2canvas 1.4.1 is ~3 years old but stable/unmaintained — works, watch it. `node-fetch` is redundant on Node ≥18. | `package.json` | Drop node-fetch |
| LOW | F2 | Mobile: card is the dominant element, `max-w-md` grid + 430px shell, aspect-square tiles, font-shrink for long phrases; Playwright smoke includes a 375px overflow check. No overlap found in code review. Live-render at 375px **not visually verified** in this audit. | `App.jsx:210-214` | None |
| OBS | G2 | First-time player flow is reasonable: Landing explains the loop, company picker, mode select, name entry. No how-to inside the game itself; no "active sessions near you" discovery — join requires a code from a friend. Post-bingo the game *continues* (correct for blackout chasing). | — | Small in-game help affordance |
| OBS | G3 | Engagement mechanics for a 60-min call are genuinely good: streaks, predictions, Trinity, CEO mode, live feed, leaderboard, silence timer, vote, badges. The two broken ones are H-3. | — | Fix H-3 |
| OBS | G4 | Trivia is generalized (`TriviaQuiz.jsx` takes `companyId`; Admin trivia section parameterized). The old Hilton-hardcoding note in claude.md is stale. | — | Update claude.md |
| OBS | G5 | Hilton's `phrases.js` arrays are *not* a fallback phrase source anymore — `session.js` throws if the DB returns nothing; the arrays survive only as `tierOf()` lookup + Trinity/special-square constants. claude.md's "silent fallback to Hilton" warning is stale. | `phrases.js:1-4` | Update claude.md |
| OBS | E4 | `.claude/settings.json` sets `defaultMode: bypassPermissions` (merged as PR #5) — unattended agents run with no permission gate on a box holding the service-role-capable `.env`. Combined with the self-reported-completion pattern (C-2), this deserves a conscious re-decision. | `.claude/settings.json` | Re-evaluate |
| OBS | B3 | Company readiness model is application-layer only (Admin gate + reports). Nothing at the DB prevents `is_active=true` with zero phrases. The runtime guard is `createSession` throwing — a correct last line of defense, added by Group A. | — | See H-6 |

## Cross-Cutting Assessment

**X1 — Single highest-risk item:** The `tier='standard'` zero-points bug (C-1). It is live now, affects 4 of 5 active companies, and destroys the core loop (tap → points → compete) during exactly the event the product exists for. The cron failure (C-2) is the more *systemic* finding, but C-1 is the one that ruins an earnings call tonight.

**X2 — Built well; protect it:** `bingo.js` (clean, correct, tested); the card generator's placement constraints; the undo-window/commit-pending design (optimistic UI with a single DB write path); the Supabase client singleton with the documented 429 fix; the migration-file discipline *when followed*; the ingestion validator's deterministic rejection taxonomy; the Playwright suites; and the codex inbox/staging handoff protocol, which is genuinely better-specified than most multi-agent setups.

**X3 — Right early call, wrong model now:** (1) The hot/warm/cold tier system was designed for 51 hand-curated Hilton phrases; the pipeline produces flat `standard` phrases, and the seam between the two scoring worlds is exactly where C-1 lives. Pick one model — likely DB-driven `points` — and delete the constant tables. (2) Client-authoritative game state was fine for a single-company demo; with public launch and open RLS it is now the cheating/griefing surface. (3) "Docs as program state" worked at 3 sessions; at 18 sessions, three overlapping truth documents actively mislead agents (H-2).

**X4 — Multi-agent fragility the humans won't see:** The loop has no verification step between "agent says done" and "marked complete." Group B was marked ✅, PROGRAM_STATE said "cron running," session 18 even "fixed" the cron — and it has never run once. Worse, the watchdog that would catch this (transcript-freshness, release-readiness) is *itself* scheduled by the broken cron — the monitoring layer and the failure share a single point of failure. Add one outside-the-loop check: a cron-driven heartbeat file whose age is checked by the Playwright suite or a GitHub Action — something that runs on infrastructure the VPS cron does not own. Second fragility: claude.md instructs agents to never use the API for enrichment while shipping `ai-select.js` that does exactly that; an agent obeying the file it happened to read first will be wrong half the time.

**X5 — Demo vs. 50 concurrent players:** A demo works because one tab, one good network, and nobody cheats. A real call needs: (1) C-3 fixed — one griefer with DevTools can zero out the leaderboard mid-call; (2) reconnect handling — phones lock, elevators happen, and today a dropped socket silently kills the social layer with no recovery (H-4); (3) realtime load headroom — ~100k fan-out deliveries per 50-player call via RLS-evaluated `postgres_changes` is the architecture's hottest path and the plan limits are unverified (H2); (4) scoring that works on the companies people actually pick (C-1); (5) any observability at all — today a broken call produces zero operator signal. Items 1, 4, and 5 are days of work, not weeks.

## What Is Working Well

- Core bingo/card/undo engine — correct and carefully built.
- Admin auth hardening (real Supabase Auth, the 429 single-refresh fix is well documented in code).
- Deterministic pipeline stages with hard validation and a human approval gate on all SQL.
- Content rules genuinely enforced in code (25-char triple enforcement on the live table; person-name filter in Stage 5; emoji-only branding).
- Test suites exist for both public smoke and game flow.
- The inbox/staging Codex protocol and decision logs — unusually good agent-coordination hygiene on paper.

## Recommended Next 30 Days (ordered by impact)

1. **Fix C-1 today** — add `standard` to `TIER`/`CEO_TIER` (or normalize at fetch); add a regression test asserting non-zero score on a pipeline company.
2. **Fix the crontab** — `SHELL=/bin/bash` (or `. ./.env`), `CRON_TZ=America/New_York`, whole-chain logging; then *watch it produce a report* before marking anything complete.
3. **Lock down game-state RLS (C-3)** — column-restricted updates or SECURITY DEFINER RPCs for score/mark writes; constrain session updates.
4. **Reconcile state docs (H-2)** — one pass to correct PROGRAM_STATE/claude.md; delete stale pipeline docs (`scripts/ingest.js` section); declare PROGRAM_STATE the only mutable state file.
5. **Write retroactive migrations 019 + phrases-RLS-fix (H-1)**; add a live-schema diff check to `migration-check.js`.
6. **Add an out-of-band heartbeat** (X4) so cron death is detected by something cron doesn't run.
7. **Fix the readiness gate's `is_active` filter (H-6)** before activating NKE/VZ/TRV.
8. **Realtime resilience (H-4)** — reconnect handling + error boundary + minimal error reporting.
9. **Close H-5** — service-role staging writes, drop public INSERT/UPDATE on `phrase_staging`, add length CHECK.
10. **Fix the two stale-closure social features (H-3)** — they're built, they just never fire.
11. Code-split Admin + html2canvas out of the main bundle.
12. Verify Supabase plan limits against a 50-player load model before public launch.

## SQL Queries for Human Execution

*Note: the live column is `phrases.phrase`, not `phrase_text` as the audit scope assumed.*

```sql
-- 1. Active companies with zero ACTIVE phrases (would break createSession)
SELECT c.id, c.name, COUNT(p.id) FILTER (WHERE p.is_active) AS active_phrase_count
FROM companies c
LEFT JOIN phrases p ON p.company_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name
HAVING COUNT(p.id) FILTER (WHERE p.is_active) = 0;

-- 2. 25-char violations (live table — should be impossible via CHECK; verifies the constraint exists)
SELECT id, phrase, LENGTH(phrase) AS len
FROM phrases WHERE LENGTH(phrase) > 25 ORDER BY len DESC;

-- 3. 25-char violations in staging (NO constraint exists here — expect possible hits)
SELECT id, phrase, LENGTH(phrase) AS len
FROM phrase_staging WHERE LENGTH(phrase) > 25 ORDER BY len DESC;

-- 4. Tier distribution — quantifies the C-1 blast radius
SELECT company_id, tier, COUNT(*) FROM phrases
WHERE is_active GROUP BY company_id, tier ORDER BY company_id;

-- 5. Verify the undocumented migration-019 constraint actually exists
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'phrases'::regclass AND contype = 'u';

-- 6. Verify live RLS policies vs. migration files (drift check for H-1/C-3)
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Person-name spot check across live content (review hits manually)
SELECT 'phrases' AS src, company_id, phrase AS text FROM phrases
WHERE phrase ~* '\m(chris|james|kevin|mary|doug|brian|david|john|satya|tim|jamie|bob|jane|noel)\M'
UNION ALL
SELECT 'trivia', company_id, question FROM trivia_questions
WHERE question ~* '\m(nasetta|nadella|dimon|iger|jassy|quincey|calhoun|ortberg|mcmillon|donahoe)\M';

-- 8. Sessions hygiene — confirms nothing ever ends sessions
SELECT status, COUNT(*), MIN(started_at), MAX(started_at)
FROM sessions GROUP BY status;
```

---

*UNABLE TO VERIFY in this audit: live DB contents (all SQL above output-only per mandate); Supabase plan tier and realtime limits; visual rendering at 375px on device; whether the phrases-RLS uid fix and 019 constraint are actually applied in production (queries 5–6 resolve this).*
