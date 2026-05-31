# Enrichment Queue — Subscription Model (No API)

**This replaces the old paid Anthropic API enrichment step.** The phrase-selection
and trivia-writing judgment is now done by the Claude Code agent working on this
project, using the Claude subscription — **never** the Anthropic API and **never**
`ANTHROPIC_API_KEY`. There is no per-token cost.

## How it fits together

```
fetcher → extractor → validator      (deterministic Docker, no AI, free)
        → data/review-queue/{TICKER}.json   ← pending work item
Claude Code agent (subscription)     ← reads the queue, does the judgment
        → company-packs/{TICKER}/generated/phrases.json + trivia.json
node process-review-queue.js --finalize {TICKER}   (deterministic: validate → migration.sql)
        → data/review-queue/processed/{TICKER}.json   ← done
```

## Every session: check the queue first

```
node scripts/ingestion/process-review-queue.js --list
```
This prints each pending company and whether it still needs enrichment or is ready
to finalize. If anything is pending, process it (or surface it to the human) before
unrelated work.

## Processing one company

### 1. Read the queue file
`data/review-queue/{TICKER}.json` — `mode: "paragraphs"`, with:
```json
{ "ticker": "BA", "company_id": "ba", "status": "pending", "mode": "paragraphs",
  "quarter_entries": [ { "quarter": "FY Q1 2022", "paragraphs": ["…", "…"] }, … ] }
```
`quarter_entries` is the prepared-remarks text, one entry per quarter.

### 2. Select the phrases (the core judgment)
Find **2–4 word CEO-idiom phrases that recur across ≥2 quarters**. Score for
SPEAKING STYLE, not subject matter. A great bingo phrase makes a knowing player
groan — "there it is."

- **Keep (8–10):** executive idioms, rhetorical framing, CEO buzzwords with a
  company-specific feel — "double down", "playing offense", "unlocking value",
  "our flywheel", "lean into", "raise our game".
- **Maybe (5–7):** recurring company language, somewhat distinctive, not pure
  boilerplate.
- **Drop (≤4):** topic labels (geography, product, metric), generic financial
  terms any company would say, boilerplate, legal/ceremony filler, operator
  instructions ("listen-only mode").

Aim for **40–50 phrases**. Each MUST be ≤25 characters, lowercase, no person
names. Prefer phrases you can see in **multiple** quarters' remarks.

Write them as a JSON array of strings to
`company-packs/{TICKER}/generated/phrases.json`:
```json
["lean into", "playing offense", "double down", "unlocking value", …]
```

### 3. Write the trivia
Write **12–18** questions about the COMPANY (history, strategy, products,
financials, milestones). Mix easy/medium/hard.

**Hard validation rules — violations are auto-rejected at finalize:**
- **ZERO person names**, anywhere. No CEO/founder/executive/designer/athlete
  names. Use "the company", "the brand", "management", "the leadership team".
- The deterministic filter rejects **any two consecutive Capitalized words**
  (e.g. "New York", "Wall Street", "United States") as a possible name. Phrase
  around it: "the US", "the East Coast region", lowercase where natural.
- Exactly 4 distinct options; `correct_answer` is `"a"`/`"b"`/`"c"`/`"d"`.
- No option over 80 characters.

Write to `company-packs/{TICKER}/generated/trivia.json`:
```json
[{ "question": "In what year did the company surpass $100B in annual revenue?",
   "option_a": "2018", "option_b": "2020", "option_c": "2021", "option_d": "2023",
   "correct_answer": "b" }, …]
```

### 4. Finalize (deterministic — emits the migration)
```
node scripts/ingestion/process-review-queue.js --finalize {TICKER}
```
This validates both files (25-char cap, person-name filter, dedupe, ≥12 phrases),
writes `generated/migration.sql` + `validation_report.json`, sets the job to
`ready_for_review`, and moves the queue item to `data/review-queue/processed/`.
If it reports too few phrases passed, add more and re-run — it is idempotent.

The migration inserts phrases `is_active = false`. Activation stays a human step
(review the SQL, run it, toggle active in the admin panel).

## Targets
- **Activation-ready:** ≥50 phrases, ≥12 trivia. Finalize still succeeds at ≥12
  phrases so partial-coverage companies aren't lost; note the gap for the human.
- Phrases must read like things an executive *says*, not topics they discuss.
