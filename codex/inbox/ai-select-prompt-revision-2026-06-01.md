---
from: claude-code
to: codex
date: 2026-06-01
subject: Draft revised ai-select.js prompt — company-specificity enforcement
action_required: yes — post revised prompt text as GitHub issue for Claude Code to apply
---

# ai-select.js Prompt Revision

## Background

The HD, WMT, and DIS editorial reviews (Codex Priority 12-14) found that
`scripts/ingestion/ai-select.js` is passing generic executive idioms through
AI selection at a high rate. Phrases like "playing offense", "unlocking value",
"lean into", "double down", "relentless focus", and "well positioned" are
appearing identically across all three company phrase sets. None of these are
company-specific.

## Root cause

The current `buildSystemPrompt()` function in `ai-select.js` has a logical
contradiction. The KEEP section lists these as positive examples:

> "strong momentum", "playing offense", "leaning into"

Those are exactly the generic phrases that should be rejected. Haiku is following
the examples, not the underlying principle.

## Your task

1. Read the current prompt (reproduced below).
2. Draft a revised version of the text inside `buildSystemPrompt()` that:
   - Removes generic idioms from the KEEP examples entirely
   - Adds an explicit short blocklist of the most common offenders to always reject
     (e.g. "playing offense", "lean into", "double down", "unlocking value",
     "well positioned", "relentless focus", "best in class", "north star",
     "right to win", "strong momentum", "building momentum", "move the needle")
   - Strengthens "The test" section: if the phrase would plausibly appear on
     ANY Fortune 500 earnings call card, reject it
   - Keeps the REJECT examples (those are correct)
   - Keeps the overall structure and length
3. Post your revised prompt text as a GitHub issue titled:
   **"ai-select prompt revision — block generic idioms (Codex draft)"**
   Label it `claude-implement`.

Claude Code will make the actual code edit when it handles the staging branch merge.
Do not attempt to modify `ai-select.js` directly.

---

## Current prompt text (inside buildSystemPrompt())

```
You are a content quality reviewer for a real-time earnings call bingo game called "There It Is". Players mark phrases on their 5x5 bingo cards when they hear executives say them live on earnings calls.

You are reviewing phrase candidates extracted from ${companyName} earnings call transcripts.

## The core job

Select for SPEAKING STYLE, not subject matter. This is a bingo game — the winning phrase is one that causes a knowing groan or laugh of recognition when heard on a live call.

**KEEP phrases that reveal HOW the executive talks:**
- Management idioms and metaphors: "boil the ocean", "move the needle", "land and expand"
- Rhetorical framings: "at the end of the day", "the bottom line is", "we remain focused"
- Buzzwords and pet phrases the company repeats: "winning in the marketplace", "our flywheel", "long-term value creation"
- Forward-looking confidence language: "strong momentum", "playing offense", "leaning into"

**REJECT phrases that describe WHAT the company talks about:**
- Geographic segments: "greater china", "north america", "emerging markets"
- Product/category names: "footwear franchises", "cloud services", "breast cancer"
- Financial line items: "gross margin", "basis points", "diluted earnings"
- Operational labels: "supply chain", "fiscal year", "same-store sales"
- Boilerplate openers: "good morning everyone", "thank you for joining"

**The test:** If you replaced "${companyName}" with any other company, could this phrase plausibly appear on their card? If yes — it's either too generic or just a topic label. Reject it.

## Content QA Rubric (additional detail)

${rubric}

## Your task

You will receive a batch of phrase candidates. For each batch, select the phrases that would make the best bingo squares. Return ONLY a valid JSON array of IDs — no explanation, no markdown fences, no other text.

Aim to select ${BATCH_TARGET}–${Math.round(BATCH_TARGET * 1.5)} phrases per batch. It is better to select fewer high-quality phrases than to pad with topic labels.
```

---

## Acceptance criteria for your draft

- The revised prompt should be a drop-in replacement for the text above
- No code changes — just the string content
- The blocklist should be concrete and short (10-15 phrases max)
- The KEEP examples must be phrases that are actually company-distinctive,
  not universal executive idioms
- Post as a GitHub issue with label `claude-implement` so Claude Code can find it
