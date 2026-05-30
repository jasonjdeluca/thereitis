# There It Is — Content QA Rubric

This rubric governs editorial review of AI-generated phrase candidates and trivia
questions for each company pack. It is used by Codex during editorial review
(triggered once per company after Stage 4 generation) and by Claude Code for
hard-rule validation in `scripts/content-validation.js`.

---

## Phrase Evaluation

### What makes a phrase good

A good bingo phrase meets all three tests:

1. **Specific** — A knowing player would immediately associate it with this company.
   Someone who sat through this company's earnings calls would recognize it as a
   verbal tic, signature phrase, or recurring claim. It could not appear on another
   company's card without feeling wrong.

2. **Playable** — It is short, punchy, and memorable. It causes the "there it is"
   moment when heard on a live call — a small groan, laugh, or knowing nod. Phrases
   that are generic financial-speak do not have this quality.

3. **CEO Mode** — It sounds like something an executive would say while trying to
   sound confident. Not analyst questions. Not operational minutiae. Executive voice:
   forward-looking, optimistic, buzzword-rich.

### What makes a phrase bad

Reject on any of these grounds:

| Rejection reason | Description | Example |
|---|---|---|
| `too_generic` | Any company could say it. No company identity. | "strong performance", "revenue growth" |
| `person_name` | Contains any real person's first or last name | "Cook's vision" (→ must use "the CEO's vision") |
| `jargon_heavy` | Pure financial / accounting term, not a verbal tic | "adjusted EBITDA", "basis points" |
| `analyst_question` | Sounds like a question from the floor, not an executive answer | "can you give us more color on" |
| `wrong_company` | Phrase is specific, but to a different company | MSFT phrase appearing on NKE card |
| `too_long` | Over 25 characters including spaces | Any phrase > 25 chars |
| `low_frequency` | Appeared in only one quarter — may be one-time news event | Stage 3 filter should catch this |
| `boilerplate_opener` | Call ceremony phrase (host/operator voice) | "good morning everyone", "next question please" |
| `operational_minutia` | Day-to-day operational detail, not strategic language | "freight costs increased", "units shipped" |

### The 25-character hard rule

25 characters maximum including all spaces and punctuation. No truncation.
No exceptions. If a phrase is one character over, it must be shortened or rejected.
The `content-validation.js` script hard-rejects any phrase over 25 characters.

### No person names — ever

No real person's name anywhere: not in phrases, not in trivia questions, not in
answer options. Use role references only: "the CEO", "the CFO", "the analyst".
This applies to historical figures, current executives, and any named individual.
The `looksLikePersonName()` heuristic flags these for human review; editorial
reviewers must confirm before approving.

---

## Trivia Evaluation

### Structure requirements (hard rules)

Every trivia question must have:
- `question` — the question text
- `option_a`, `option_b`, `option_c`, `option_d` — four distinct answer choices
- `correct_answer` — exactly one of `"a"`, `"b"`, `"c"`, `"d"`
- No answer choice over 80 characters
- No person names in any field

### What makes a trivia question good

- Tests knowledge a player would find genuinely interesting to learn
- Has a clear, unambiguously correct answer
- Distractors (wrong answers) are plausible but distinctly wrong
- Categories spread across: financial, strategy, operations, culture, history
- Difficulty varies: mix of easy (brand recognition), medium (performance facts),
  and hard (specific data points or history)

### What makes a trivia question bad

- Ambiguous correct answer (multiple choices could be argued correct)
- Trick question relying on recent news that may be out of date
- Correct answer is obvious even to someone who knows nothing about the company
- All distractors are implausible (makes the correct answer trivially obvious)
- Question or answer references a person by name

---

## Readiness Thresholds

| Level | Phrases | Trivia | Issues |
|---|---|---|---|
| Ready for migration | ≥ 50 | ≥ 12 | Zero critical |
| Below target (acceptable) | 25–49 | 6–11 | Zero critical |
| Insufficient (blocked) | < 25 | < 6 | — |
| Blocked by issues | Any | Any | Any critical |

A company cannot be activated until it reaches **Ready for migration** and a human
has reviewed and approved the migration SQL.

---

## Rejection Taxonomy (machine-readable labels)

Used in `validation_report.json` and Codex editorial review output:

| Label | Who checks | Severity |
|---|---|---|
| `too_long` | content-validation.js | critical |
| `blank_phrase` | content-validation.js | critical |
| `person_name` | content-validation.js (heuristic) + Codex | review |
| `too_generic` | Codex editorial only | review |
| `jargon_heavy` | Codex editorial only | review |
| `analyst_question` | Codex editorial only | review |
| `wrong_company` | Codex editorial only | review |
| `boilerplate_opener` | content-validation.js (blocklist) | critical |
| `low_frequency` | Stage 3 filter | blocked before reaching QA |
| `duplicate_phrase` | content-validation.js | warning |
| `cross_company_duplicate` | content-validation.js | warning |
| `trivia_missing_fields` | content-validation.js | critical |
| `trivia_invalid_answer` | content-validation.js | critical |
| `trivia_answer_too_long` | content-validation.js | warning |
| `trivia_possible_person_name` | content-validation.js (heuristic) + Codex | review |

---

*Last updated: 2026-05-30. This rubric is the source of truth for all content
quality decisions on thereitis.live.*
