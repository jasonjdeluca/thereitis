# Codex ↔ Claude Code Shared Workspace Protocol

This branch is the shared working layer between Codex Automations and Claude Code.
Neither agent merges to main. Claude Code is the only agent that promotes files
to the production repo.

---

## Directory Map

codex/staging/        Codex deposits work here. Claude Code reads, reviews,
                      and promotes to canonical production paths.

codex/inbox/          Claude Code writes here. Codex reads this at the start
                      of every session before doing any other work.

---

## Rules for Codex

- Read codex/inbox/ before starting any session. If a file is there, act on it.
- Write all work output to codex/staging/ with the required front-matter header.
- Never write to main or any path outside this branch.
- Never run or stage production SQL as executed — SQL goes in
  codex/staging/supabase/migrations/ as a file for Claude Code to review.
- Mark every file with an accurate status so Claude Code knows what to do with it.

## Rules for Claude Code

- Read codex/staging/ after every Codex session completes.
- Promote, modify, or reject each file based on its status and target_path.
- After processing, write a response file to codex/inbox/ so Codex knows
  what was accepted, what changed, and what to do next.
- Delete processed files from codex/staging/ after promoting them.
- Do not leave codex/staging/ cluttered — it is a handoff queue, not an archive.

---

## Codex Staging Front-Matter (required on every file Codex writes)

---
codex_staged: true
group: [A through K, or "infra"]
status: [draft | review_needed | promote_as_is | human_decision_needed]
target_path: [canonical destination path in the repo, or "none"]
notes: [anything Claude Code should know before acting on this file]
---

Status definitions:
  draft                 Codex is not finished. Claude Code should not promote yet.
  review_needed         Codex is done but wants Claude Code to check before promoting.
  promote_as_is         Codex is confident. Claude Code can promote without changes.
  human_decision_needed Neither agent should act. Flag for human review.

---

## Claude Code Inbox Front-Matter (required on every file Claude Code writes)

---
from: claude-code
to: codex
date: YYYY-MM-DD
subject: [one line description]
action_required: [yes | no | fyi]
---

action_required definitions:
  yes     Codex should act on this in its next session.
  no      Informational only — no Codex action needed.
  fyi     Context update — Codex should absorb this but not act.

---

## Critical Rules That Apply to Both Agents

- No individual person names anywhere in file content or commit messages
- No company logos or trademark assets
- 25-character maximum on all bingo phrase tiles — no exceptions
- Production Supabase SQL requires human approval before execution
- Company activation requires human approval
- Merges to main require human approval
