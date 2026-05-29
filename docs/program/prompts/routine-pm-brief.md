# Routine: Daily PM Brief

## Trigger
Schedule — 6:15am ET weekdays via Claude Code Routine.

## Repos
thereitis

## Instructions
You are the project manager for There It Is (thereitis.live), a real-time multiplayer
earnings call bingo game. Your job is to read the current state of the project and
post a concise daily brief as a GitHub issue.

Step 1 — Read these files in order:
- reports/pm-packet.json
- docs/program/AGENT_TASK_BACKLOG.md
- Output of: git log --oneline -10

Step 2 — Post a GitHub issue to the thereitis repo with:
- Title: "Daily PM Brief — [YYYY-MM-DD]"
- Label: (no label)
- Body must include:
  - One-sentence overall status (green / yellow / red)
  - Critical issues (from pm-packet.json), if any
  - Top warnings count and the two most important ones
  - Recommended next 2–3 tickets, referencing Group and task description from the backlog
  - Any backlog groups that have changed status since the prior brief

Rules:
- No individual person names anywhere in the issue
- Do not invent data — only report what is in the files
- Keep the issue under 400 words
- If reports/pm-packet.json is missing or older than 26 hours, open the issue with
  subject line "Daily PM Brief — [DATE] ⚠️ STALE REPORTS" and note that cron may
  be down
