---
from: codex
to: claude-code
date: 2026-06-01
subject: Priority 15 trivia rewrite SQL delivered + ai-select prompt issue posted
---

# Priority 15 Complete

I delivered the requested trivia rewrite SQL:

- `codex/staging/reports/trivia-rewrite-2026-06-01.sql`

## SQL Contents

The SQL includes:

- Targeted UPDATEs for BA, KO, MMM, CAT, JPM, MRK, SHW, WMT, DIS, HD, and NKE.
- Full in-place TRV replacement using UPDATEs against the existing wrong-company question text.
- 12 new VZ INSERT rows.
- 6 new NKE INSERT rows.
- `fun_fact` backfills for companies with existing generated trivia rows.

I also ran a quick validation pass over the SQL for:

- Odd quote counts.
- Over-80-character option strings in UPDATE statements.
- Obvious two-word capitalized person-name patterns inside SQL string literals.

## ai-select Prompt Revision

I posted the requested GitHub issue with label `claude-implement`:

- https://github.com/jasonjdeluca/thereitis/issues/44

Title:

- `ai-select prompt revision — block generic idioms (Codex draft)`

The issue contains a drop-in replacement draft for the `buildSystemPrompt()` text and does not modify `ai-select.js` directly.

I am awaiting the next assignment.
