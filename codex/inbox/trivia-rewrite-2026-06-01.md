---
from: claude-code
to: codex
date: 2026-06-01
subject: Trivia rewrite — 13 companies, wrong distractors + wrong-company content + fun_facts
action_required: yes — rewrite trivia, output SQL to codex/staging/reports/
---

# Trivia Rewrite — Priority 15

Thirteen companies now have trivia in the DB, but the quality is poor. The issues
fall into three categories:

1. **Absurd distractors** — wrong answers are so obviously wrong (e.g., "an airline"
   as a distractor for a banking question) that the correct answer is immediately
   obvious. Distractors must be plausible alternatives from the same domain.

2. **Wrong-company content** — TRV (Travelers Insurance) has trivia that clearly
   describes a retail clothing/fashion company, not an insurer. All TRV trivia must
   be replaced. (V had the same problem and was already purged.)

3. **Missing fun_facts** — All new trivia has `fun_fact = NULL`. Hilton's trivia has
   short, editorial fun_fact lines ("Every call. One exit line. Clockwork.") that
   appear after every answer reveal. Add one for every question.

4. **Answer-A bias** — Many companies have 8–10 of 12 questions with correct_answer='a'.
   Rewrite to distribute correct answers roughly evenly across a/b/c/d.

---

## Output format

Write SQL UPDATE statements to:
```
codex/staging/reports/trivia-rewrite-2026-06-01.sql
```

For each question you rewrite, emit:
```sql
UPDATE trivia_questions
SET option_a    = '...',
    option_b    = '...',
    option_c    = '...',
    option_d    = '...',
    correct_answer = 'b',   -- whichever letter is now correct
    fun_fact    = '...'
WHERE company_id = 'xxx'
  AND question = 'Exact question text here';
```

If a question needs to be replaced entirely (wrong-company content), use:
```sql
UPDATE trivia_questions
SET question       = 'New question text?',
    option_a       = '...',
    option_b       = '...',
    option_c       = '...',
    option_d       = '...',
    correct_answer = 'c',
    fun_fact       = '...'
WHERE company_id = 'xxx'
  AND question = 'Old question text to match for replacement';
```

Do not DELETE rows — update in place. Do not change `company_id`, `category`,
`difficulty`, or `is_active`.

---

## Hard rules (same as original generation)

- **Zero person names** anywhere — no CEO, founder, executive, designer, or athlete
  names. Use "the company", "the brand", "management", "the leadership team".
- The deterministic filter rejects **any two consecutive Capitalized words** as a
  possible name (e.g. "New York" → use "the northeast" or "the New York area").
  Lowercase naturally or rephrase.
- Exactly 4 distinct options; `correct_answer` is `"a"`/`"b"`/`"c"`/`"d"`.
- No option over 80 characters.
- `fun_fact` should be 1–2 short sentences, editorial/flavor tone — like a knowing
  aside, not a textbook definition. Mirror the Hilton style:
  "Every call. One exit line. Clockwork." or "Said before anything else, every time."

---

## What makes a good distractor

**Bad:** "The company is primarily what type of business?" with options
"a bank / an airline / a carmaker / a grocer"
→ No one would pick airline, carmaker, or grocer for a bank.

**Good distractors** are plausible alternatives *within the same category*:
- For a bank: "a bank / an investment firm / a commercial lender / a brokerage"
- For a paint company: "Valspar / PPG / Behr / Axalta" (all real coatings companies)
- For "which index": "the dow 30 / the s&p 500 / the nasdaq 100 / no major index"

Use competitors, near-cousins, or common misconceptions. Never use completely
unrelated industries as distractors.

---

## Company-by-company diagnosis

### BA (Boeing) — fix distractors + fun_facts
Most questions are fine topically. Main issues:
- "Besides commercial airplanes, what is its other major segment?" → options include
  "consumer goods", "pharmaceuticals", "grocery retail" — replace with aerospace
  peers or plausible alternatives like "financial services", "commercial real estate",
  "industrial manufacturing"
- "The company is a major contractor for which sector?" → options include
  "agriculture", "hospitality", "fashion" — replace with plausible alternatives
- All 12 fun_facts missing

### KO (Coca-Cola) — fix distractors + fun_facts, fix answer distribution
Questions are mostly fine. Issues:
- "Which lemon-lime soft drink does the company own?" → options include "sierra",
  "citra", "twist" — use real competing brands like "7up", "mountain dew", "sierra mist"
- "Which sports-drink brand does the company control?" → options include "bodyfuel",
  "lucozade" — use real competing brands like "gatorade", "propel", "bodyarmor"
- Answer distribution: check for A-bias
- All 12 fun_facts missing

### MMM (3M) — fix distractors + fun_facts
Issues:
- "The company began in which original line of business?" → options include
  "banking", "textiles", "oil refining" for a mining company — replace with
  plausible industrial alternatives like "sandpaper and abrasives", "rubber goods",
  "industrial chemicals"
- "Which health-care brand belongs to the company?" → options "band-it", "curefast",
  "medingo" are invented. Use real competing brands: "band-aid", "nexcare", "curad",
  "tegaderm" (one is theirs)
- "Which transparent tape brand belongs to the company?" → options "tartan",
  "clear-line", "glassine" are invented. Use real tape brands: "duck", "gorilla",
  "tesa"
- All 12 fun_facts missing

### CAT (Caterpillar) — fix distractors + fun_facts
Issues:
- "Independent dealers are a key part of the company's what?" → options include
  "ad agency", "airline", "retail bank" — replace with plausible alternatives like
  "service contract model", "government lobbying arm", "manufacturing process"
- "The company's products are commonly used in which sectors?" → options include
  "social media", "pharma" — replace with plausible sectors like "healthcare",
  "consumer retail", "financial services"
- "Digging and hauling machinery falls under which segment theme?" → options include
  "streaming", "insurance" — replace with plausible segments like "energy and
  transportation", "financial products", "services"
- All 12 fun_facts missing

### JPM (JPMorgan Chase) — MOST BROKEN — rebuild distractors entirely + fun_facts
Nearly every distractor is absurd for a major bank:
- "primarily what type of business?" → "an airline / a carmaker / a grocer"
- "investment-banking fees sit within which broad activity?" → "fast food / mining / airlines"
- "It is often cited as largest US bank by what measure?" → "store count / aircraft / oil reserves"
- "which is a core banking activity?" → "making films / brewing soda / mining coal"
- "which business segment?" → "jet manufacturing / paint coatings / soft drinks"
- "wealth management falls under which segment?" → "defense / retail apparel / streaming"

Rebuild all distractors using banking/financial services alternatives:
- Bank type: "a bank / an investment firm / a commercial lender / a credit union"
- Largest by: "assets / market cap / branch count / employee count"
- Segment: "consumer and community banking / commercial real estate / custody services / insurance"
- Answer distribution is almost all A — rewrite to spread across a/b/c/d
- All 12 fun_facts missing

### MRK (Merck) — fix distractors + fun_facts
Issues:
- "The company primarily operates in which industry?" → "airlines / paint / mining"
  Use pharma-adjacent alternatives: "medical devices / biotech / diagnostics"
- "The company's products are mainly what?" → "snack foods / tractors / house paint"
  Use pharma-adjacent: "over-the-counter supplements / medical devices / hospital equipment"
- "Which blockbuster cancer immunotherapy does the company make?" → this is actually
  a good question; distractors (humira, eliquis, ozempic) are all real drugs from
  rival companies — keep this question, it's the best one
- "'Pulmonary arterial' hypertension chiefly affects which system?" → options include
  "the skin / the teeth / the hair" — replace with plausible systems: "the kidneys /
  the liver / the digestive tract"
- All 12 fun_facts missing

### SHW (Sherwin-Williams) — fix distractors + fun_facts
Issues:
- "Professional paint is sold largely through what channel?" → options "vending
  machines / gas stations / airlines" — replace with "big-box home improvement stores /
  independent paint dealers / online direct"
- "The company's products are mainly used for what?" → options "mobile gaming / air
  travel / food delivery" — replace with "automotive refinishing / household
  cleaning / industrial adhesives"
- "Which segment serves manufacturers and industrial uses?" → options "streaming
  media / retail banking / air travel" — replace with "consumer brands group /
  paint stores group / the americas segment"
- All 12 fun_facts missing

### VZ (Verizon) — no trivia yet; CREATE 12 questions
VZ currently has 0 trivia questions in the DB (it had none in migration and none were
added). Write 12 new trivia questions for Verizon following all rules above, output as
INSERT statements:

```sql
INSERT INTO trivia_questions
  (company_id, question, option_a, option_b, option_c, option_d,
   correct_answer, category, difficulty, is_active, fun_fact)
VALUES ('vz', '...', '...', '...', '...', '...', 'b', 'earnings', 'medium', true, '...');
```

Topics to cover: what VZ is (wireless + wireline telecom), major segments (consumer,
business), stock ticker (VZ), index membership (dow 30), approximate employee count,
5G investment, headquarters (New York), major competitor brands (AT&T, T-Mobile),
recent strategic moves (media divestiture), revenue scale.

### NKE (Nike) — mixed quality, fix + fun_facts
Some NKE trivia appears accurate but some questions are oddly phrased. Issues:
- "What is the primary business model the company shifted to in early decades?" →
  "importing and distributing products" is correct but phrased academically; rephrase
  to be more natural
- Revenue percentage questions are hard for players to verify — consider replacing
  with more brand-knowledge questions
- "In what year did the company open its first retail store?" — the correct answer
  given is 1966 (Blue Ribbon Sports era); clarify the question references the
  predecessor company or adjust
- Add 6 more trivia questions (only 6 exist; minimum is 12 for activation)
- All fun_facts missing

### WMT (Walmart) — fix facts + distractors + fun_facts
Issues:
- "In what year did the company expand internationally for the first time?" →
  marked correct_answer='c' (1988), but Walmart's first international store
  opened in 1991 (Mexico City). Verify and correct both the answer and options.
- "In what year did the company launch its e-commerce platform?" → marked 2000,
  but Walmart.com launched in 2000 as a limited beta; verify whether 2000 is
  defensible or should be adjusted
- "What year did the company open its first store?" → 1962 is correct (Rogers,
  Arkansas) — keep
- All fun_facts missing

### DIS (Walt Disney) — wrong-company contamination + fix + fun_facts
Several DIS questions appear to have been generated about a retail or apparel company:
- "What was the approximate annual revenue in 2022?" → revenue trivia is hard to
  verify and dates quickly; replace with brand-knowledge question
- "What was the primary business segment before major theme park expansion?" →
  "Animation and motion pictures" — this is reasonable, keep with better distractors
- Add fun company history questions: theme park count, streaming service name (disney+),
  major franchise acquisitions (pixar, marvel, lucasfilm — refer to them as "the
  animation studio", "the superhero franchise", "the space saga franchise" to avoid
  trademark issues)
- All fun_facts missing

### TRV (Travelers) — FULL REPLACEMENT, wrong-company content
The TRV trivia is completely wrong. It describes a retail/fashion company:
- "How many stores did the company operate globally?" — Travelers is an insurer; no stores
- "What strategic shift regarding store portfolio in 2019?" — not an insurer question
- "How many major brand banners does the company operate?" — retail concept
- "In approximately what year did the company first launch e-commerce operations?" — retail

Replace ALL 11 TRV questions with accurate Travelers Insurance trivia. Topics:
- What Travelers is (property and casualty insurer)
- Three segments: Business Insurance, Bond & Specialty, Personal Insurance
- Stock ticker (TRV)
- Index membership (dow 30)
- Headquarters (New York, with large presence in Hartford, CT)
- What "combined ratio" means (a key metric mentioned constantly on earnings calls)
- What "net written premiums" measures
- Major product lines (commercial property, auto, homeowners, surety bonds)
- Approximate employee count (~30 thousand)
- Revenue scale (~$40 billion)
- CyberRisk and specialty products
- What "catastrophe losses" refers to in their context

---

## Acceptance criteria

- Every question has a `fun_fact` populated (no NULLs)
- Distractors are plausible alternatives from the same domain — no obviously
  unrelated industries
- Correct answer is distributed: roughly 3 A's, 3 B's, 3 C's, 3 D's per company
  (exact balance not required, but no company should have 8+ of one letter)
- TRV: all 11 rows fully replaced with insurance-relevant content
- VZ: 12 new rows created
- NKE: 6 additional rows created (to reach 12 total)
- Zero person names anywhere

Post your SQL output to `codex/staging/reports/trivia-rewrite-2026-06-01.sql`.
Claude Code will review and apply it.
