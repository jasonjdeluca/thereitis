# There It Is — Program State

**Last updated:** 2026-06-13

**PROGRAM_STATE.md is the single mutable state file for this project going forward.**

This snapshot uses the 2026-06-13 Phase 1 live-DB findings and a live GitHub PR check performed at write time. Anything not confirmed by those sources is marked **UNVERIFIED**.

---

## Current State

| Area | Verified state |
|---|---|
| Current phase | **UNVERIFIED** |
| Active companies | 7: `hilton`, `hd`, `mmm`, `ba`, `ko`, `nke`, `vz` |
| C-1 scoring blast radius | Confirmed open: 6 of 7 active companies are dominated by `tier='standard'`, which scores 0 |
| Group B / cron | **Not complete.** C-2 confirmed cron never ran. Fix is **fixed-in-this-session; verify `logs/cron.log`** before marking complete. |
| Migration state | Drift confirmed: 18 files on disk (`001`–`018`) versus 25 applied migrations, plus an untracked live unique constraint |
| Open PRs at write time | 2: #50 on `fix/standard-tier-scoring`; #51 on `migration/rls-game-state-lockdown` |

---

## Group Status

Only Group B and audit-remediation status were verified during this reconciliation. All other group completion claims require fresh verification.

| Group | Name | Status | Verification note |
|---|---|---|---|
| A | Live Game Stability | **UNVERIFIED** | Audit findings C-1, H-3, H-4, and H-6 remain unresolved |
| B | Deterministic Truth Layer | **Fixed-in-this-session; verification pending** | Cron never ran per C-2. Verify fresh output in `logs/cron.log` before marking complete. |
| C | Automation Infrastructure | **UNVERIFIED** | Not confirmed by Phase 1 |
| D | Admin Console | **UNVERIFIED** | H-6 remains open |
| E | Transcript Research | **UNVERIFIED** | Not confirmed by Phase 1 |
| F | Ingestion Pipeline | **UNVERIFIED** | Subscription enrichment queue confirmed; operational completion not verified |
| G | Content QA | **UNVERIFIED** | Not confirmed by Phase 1 |
| H | Evergreen Maintenance | **UNVERIFIED** | X4 remains open |
| I | Public UX and SEO | **UNVERIFIED** | Not confirmed by Phase 1 |
| J | QA and Launch Hardening | **UNVERIFIED** | Not confirmed by Phase 1 |
| K | Analytics and Launch | **UNVERIFIED** | Not confirmed by Phase 1 |
| L | Audit Remediation | **In progress** | See audit findings table and `AGENT_TASK_BACKLOG.md` |

---

## Active Companies

Live DB state as of 2026-06-13:

| Company ID | Company | Active phrases |
|---|---|---:|
| `hilton` | Hilton | 51 |
| `hd` | Home Depot | 58 |
| `mmm` | 3M | 55 |
| `ba` | Boeing | 51 |
| `ko` | Coca-Cola | 50 |
| `nke` | Nike | 46 |
| `vz` | Verizon | 39 |

No active company has zero active phrases. `trv` remains inactive.

---

## Pull Requests

### Open PRs

Live GitHub check at write time:

| PR | Branch | Status | Title |
|---|---|---|---|
| #51 | `migration/rls-game-state-lockdown` | **open-awaiting-human** | migration(C-3/H-5): RLS game-state lockdown + phrase_staging length check |
| #50 | `fix/standard-tier-scoring` | **open-awaiting-human** | fix(C-1): standard-tier phrases score zero points |

### Parallel Audit-Remediation Branches

| Branch | PR status at write time |
|---|---|
| `fix/standard-tier-scoring` | **open-awaiting-human** — PR #50 |
| `migration/rls-game-state-lockdown` | **open-awaiting-human** — PR #51 |
| `migration/retroactive-019` | No PR found |
| `fix/game-stale-closures` | No PR found |
| `fix/realtime-resilience` | No PR found |
| `fix/readiness-gate-active-filter` | No PR found |
| `docs/cron-config` | No PR found |
| `chore/audit-cleanups` | No PR found |
| `chore/cron-heartbeat` | No PR found |

### Recently Merged

| PR | Merged date | Title |
|---|---|---|
| #49 | 2026-06-10 | docs: architecture and code audit 2026-06-10 |
| #48 | 2026-06-06 | Replace example phrase with "boil the ocean" |
| #47 | 2026-06-06 | Remove FAQ and sample card from homepage |
| #45 | 2026-06-01 | fix(game): blank screen, lowercase tiles, repeated fun_fact, company badges |

---

## Audit Findings

Status meanings:

- **open**: confirmed issue; no merged fix verified.
- **fixed-in-this-session**: remediation is being completed in this session, but any stated verification gate still applies.
- **pending-human**: an open PR exists and awaits human action.

| ID | Finding | Status | Verification / next gate |
|---|---|---|---|
| C-1 | Live game correctness: pipeline-ingested companies score 0 points per mark | **pending-human** | PR #50 is open on `fix/standard-tier-scoring`; Phase 1 confirms 6 of 7 active companies are affected |
| C-2 | Operations: the VPS cron layer has never executed because cron's shell does not support `source` | **fixed-in-this-session** | Verify fresh scheduled output in `logs/cron.log` before closing |
| C-3 | Security: anonymous clients can rewrite any player and any session | **pending-human** | PR #51 is open on `migration/rls-game-state-lockdown`; Phase 1 confirms open `players`, `sessions`, and `marks` policies |
| H-1 | Schema drift: applied migrations exist with no migration files | **open** | 18 files on disk versus 25 applied; live unique constraint is also untracked |
| H-2 | Program state is materially wrong and stale | **fixed-in-this-session** | This reconciliation establishes the single mutable state file |
| H-3 | Realtime social features are broken by stale closures | **open** | Code-side fix not verified by Phase 1 |
| H-4 | No realtime failure handling, no error boundary, and no observability | **open** | Code-side fix not verified by Phase 1 |
| H-5 | `phrase_staging` is publicly writable with no length constraint | **pending-human** | PR #51 is open on `migration/rls-game-state-lockdown`; Phase 1 confirms public policies and no phrase-length check |
| H-6 | The activation readiness gate counts the wrong thing | **open** | Phase 1 confirms the live-data hazard; code-side fix not verified |
| X4 | Monitoring has no out-of-band heartbeat and shares cron's failure domain | **open** | Phase 1 confirms `system_health` does not exist |

---

## Verification Gates

- Do not mark Group B complete until a scheduled cron execution produces fresh `logs/cron.log` output.
- Do not mark an audit finding complete until Phase 1 evidence or fresh repository output verifies the fix.
- Keep all future mutable status updates in this file, not in `claude.md`.
