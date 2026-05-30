---
from: codex
date: 2026-05-30
subject: Group C automation prompt quality review
status: review_needed
---

# Group C Prompt Review

Reviewed five prompt files from `origin/main:docs/program/prompts/`.

## Summary

| Prompt | Overall | Main Issue |
| --- | --- | --- |
| `routine-pm-brief.md` | Needs small edits | Asks for prior-brief comparison without telling the routine to read/search prior briefs. |
| `routine-implement.md` | Needs small edits | Ambiguous/SQL tickets should not always get a "best implementation" PR. |
| `codex-content-quality.md` | Needs small edits | Missing stale-report handling and generated-pack readiness summary. |
| `codex-ingestion-triage.md` | Needs edits | "Current open ingestion tracking issue" is undefined; missing-report fallback is obsolete. |
| `codex-pm-brief-overflow.md` | Needs small edits | Daily overflow trigger conflicts with weekday-only primary routine. |

## `routine-pm-brief.md`

Assessment:

- Trigger is clear: weekday 6:15am ET Claude Code Routine.
- Inputs are mostly accurate if the routine runs where VPS runtime reports exist.
- Output format is clear.
- Edge cases need tightening.

Findings:

| Line | Finding | Suggested Change |
| ---: | --- | --- |
| 13 | `git log --oneline -10` is an input, but the output format does not say whether commit activity should be summarized. | Either add a brief "recent repo activity" bullet to the issue body or remove this input. |
| 24 | "Any backlog groups that have changed status since the prior brief" requires prior-brief context, but Step 1 does not instruct the routine to read/search the prior brief. | Add a Step 1 input to search yesterday's `Daily PM Brief` issue, or change this bullet to "current backlog group status highlights." |
| 29 | Says "subject line" for a GitHub issue, while earlier instructions use "Title." | Change to "issue title" for consistency. |

## `routine-implement.md`

Assessment:

- Trigger is clear: GitHub issue labeled `claude-implement`.
- Inputs are broadly accurate.
- Output format is clear.
- A few safety/loop edge cases should be clarified.

Findings:

| Line | Finding | Suggested Change |
| ---: | --- | --- |
| 14 | Branch name is deterministic, but no instruction handles an existing branch from a prior attempt. | Add "if the branch exists, fetch/switch to it and continue." |
| 31 | For ambiguous issues or production SQL, the prompt still says to open a PR with the best implementation. That can produce low-value PRs for tasks that genuinely need a human decision first. | Split the rule: ambiguous product requirements should get a clarifying issue comment; production SQL should produce a draft PR or note with `human-decision-needed`, never execution. |
| 31 | No instruction to remove or acknowledge `claude-implement`, so the same issue could retrigger after a PR is opened. | Add a completion step: comment with PR link and remove or replace the trigger label if the automation has permission. |

## `codex-content-quality.md`

Assessment:

- Trigger is clear: Friday 8:00am ET.
- Report paths are current.
- Output is mostly clear.
- It should account for runtime-report staleness and generated-pack checks.

Findings:

| Line | Finding | Suggested Change |
| ---: | --- | --- |
| 8-10 | Reads `content-validation.json` and `company-readiness.json`, but does not say how to handle stale reports. | Add a stale-report rule similar to the PM brief, using a 48-hour threshold or the report's generated timestamp. |
| 16-21 | Body focuses on DB flags and company phrase counts, but `content-validation.json` now includes `generated_packs` results. | Add a section for generated packs: phrase count, trivia count, critical/review/warning counts, and readiness. |
| 26 | Missing-report fallback says post with available data, but does not say whether to label or escalate missing required reports. | Add `human-decision-needed` or equivalent when both reports are missing or stale. |

## `codex-ingestion-triage.md`

Assessment:

- Trigger is clear enough for active onboarding phases.
- Input paths are current.
- Output intent is useful, but target issue selection is underspecified.
- One fallback is now stale because Group F exists.

Findings:

| Line | Finding | Suggested Change |
| ---: | --- | --- |
| 8-10 | `ingestion-status.json` is optional, but `company-readiness.json` is not given a missing-file fallback. | Add explicit fallback for missing `company-readiness.json`. |
| 12 | "current open ingestion tracking issue" is undefined. Automation may not know which issue to comment on. | Define search criteria, e.g. newest open issue with title prefix `Ingestion Queue` or label `ingestion-tracking`. |
| 15 | "label: migration-ready" is ambiguous: label the issue, the comment, or create a separate issue? | Specify whether to add `migration-ready` to the tracking issue or open per-company migration issues. |
| 23 | Fallback says the ingestion pipeline "has not yet been built (Group F)", but Group F is now operational. | Replace with "ingestion-status.json is unavailable; VPS cron or manual pipeline run may not have completed." |

## `codex-pm-brief-overflow.md`

Assessment:

- Trigger is simple, but mismatched with primary routine timing.
- Input and output are clear.
- Needs timezone/staleness guardrails.

Findings:

| Line | Finding | Suggested Change |
| ---: | --- | --- |
| 3 | Overflow runs daily, but the primary Claude Code PM brief runs weekdays only. This would post weekend overflow briefs even when the primary was never expected to run. | Change trigger to weekdays, or explicitly say weekend overflow briefs are desired. |
| 8 | "Today's date" does not specify timezone. Around midnight, this can search/post for the wrong date. | Specify ET, matching the automation schedule. |
| 11 | Reads `pm-packet.json` but has no stale/missing handling. | Add fallback: if missing or older than 26 hours, post a short stale-report overflow or do not post and label `human-decision-needed`. |

## Recommendation

Do not rewrite the prompts wholesale. Apply targeted edits to the lines above before configuring live automations. The most important fixes are:

1. Define stale/missing report behavior consistently across Codex automations.
2. Define issue-deduping/search criteria for ingestion triage.
3. Align overflow PM brief scheduling with the primary weekday routine.
