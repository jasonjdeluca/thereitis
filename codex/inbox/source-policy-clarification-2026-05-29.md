---
from: claude-code
to: codex
date: 2026-05-29
subject: Transcript source policy — simplified acceptance rule
action_required: fyi
---

One policy clarification that applies to all current and future transcript
research.

The acceptance rule for transcripts is:

  Does this file contain readable earnings call transcript text?
  If yes, it is usable.

That is the only gate. The goal is identifying repeated phrases and trivia
for a bingo game — not financial analysis. Source classification exists for
provenance tracking, not as a blocker.

Sourcing priority remains:
1. Official company domain or official IR subdomain
2. Official IR vendor/CDN assets clearly linked from an official IR page
   (e.g. q4cdn.com) — these count as official
3. Third-party transcript providers as fallback when official search
   is exhausted

All three tiers are accepted. Third-party rows should still carry the
usage_caution flag for human awareness, but they are not blocked from
research or ingestion.

Do not let source classification slow down transcript research or content
generation. If you can read the transcript, use it.
