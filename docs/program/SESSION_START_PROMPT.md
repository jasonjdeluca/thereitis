# There It Is — Session Start Prompt

Paste this verbatim at the start of every new Claude Code session on this project.

---

```
You are working on There It Is (thereitis.live) — a real-time multiplayer earnings
call bingo game targeting public launch in early July 2026.

Read these four files in order before doing anything else:

1. docs/program/PROGRAM_CHARTER.md   — philosophy, architecture, tool roles, rules
2. docs/program/AGENT_TASK_BACKLOG.md — task status for all groups A–K
3. docs/program/PROGRAM_STATE.md     — current session number, live company state,
                                       human action items, next recommended session
4. git log --oneline -10             — recent commits so you know what just shipped

Then run this check before touching any code:

  node scripts/ingestion/process-review-queue.js --list

If any companies are pending enrichment, process them first (read ENRICHMENT_QUEUE.md
for the protocol — it takes ~10 minutes per company and uses the subscription, not
the API).

Then check whether Codex has deposited new work:

  ls codex/staging/reports/

If a trivia-rewrite-*.sql or any other staged report is present, surface it to me
before starting other work so I can decide whether to apply it.

After those two checks, tell me what you found and what PROGRAM_STATE.md recommends
as the next session entry point. Ask me to confirm or redirect before writing any code.

Key rules that apply every session:
- No person names anywhere — not in code, UI, copy, comments, or variable names
- 25-character max on all phrase tiles — no exceptions
- Never auto-run Supabase SQL — output migration files for me to review and execute
- Never push directly to main — open PRs to claude/ branches; I merge
- Production model: claude-sonnet-4-6 for implementation; claude-opus-4-8 for
  architecture decisions only
- Deterministic code first — ask whether a rule or state machine can replace AI
  before proposing an AI solution
```

---

## Why each step matters

**Read order matters.** PROGRAM_CHARTER gives the philosophy so the agent doesn't
redesign things. AGENT_TASK_BACKLOG prevents duplicate work. PROGRAM_STATE gives
exact live DB counts and which human actions are pending. Git log catches anything
that happened between sessions that the docs haven't caught up to.

**Enrichment queue check first.** If companies are sitting in `data/review-queue/`
they need phrase selection and trivia writing before anything else — it's judgment
work that only a Claude session can do, and every cycle it sits unprocessed is a
blocked activation.

**Codex staging check.** Codex deposits SQL and reports to `codex/staging/reports/`
on its own schedule. Those outputs need a human decision before they're applied.
Surfacing them immediately prevents them from being missed.

**Confirm before coding.** PROGRAM_STATE has a "Next Recommended Session" section
but the human may want something different. The prompt asks the agent to report and
confirm rather than assume.

---

## What a good opening response looks like

The agent should reply with:
1. Brief summary of what it found in each doc (2–3 sentences)
2. Enrichment queue result (empty, or list of pending companies)
3. Codex staging result (clean, or list of files present)
4. What PROGRAM_STATE recommends for this session
5. A question: "Should I proceed with [X] or do you want to focus elsewhere?"

It should NOT immediately start writing code or running commands beyond the two
checks above.
