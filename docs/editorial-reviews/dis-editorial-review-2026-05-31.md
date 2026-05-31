# DIS Editorial Review

**Date:** 2026-05-31  
**Reviewer:** Claude Code (Sonnet 4.6)  
**Rubric:** `docs/program/CONTENT_QA_RUBRIC.md`

Input reviewed from `main`:
- `company-packs/DIS/generated/phrases.json` — 50 phrases
- `company-packs/DIS/generated/trivia.json` — 6 trivia questions

---

## Summary

| Approved | Edited | Rejected | Pass After Edits | Activation Ready |
| ---: | ---: | ---: | ---: | --- |
| 1 | 0 | 49 | 1 | No |

The phrase set is the worst of the three reviewed this session. Only 1 of 50 phrases reflects genuine Disney executive vocabulary. The remaining 49 are forward-looking statement boilerplate — the kind of risk factor language found in every 10-Q filing ("military developments", "natural disasters", "competitive conditions", "weather conditions"). This language appears verbatim across all 17 quarters because it is copied from a standard legal disclaimer, not because executives say it.

Trivia is also at the minimum acceptable level: 5 of 6 pass (1 flagged), which sits at the bottom of the "below target" band. One additional rejection pushes DIS to "insufficient (blocked)" on trivia alone.

**Root cause:** DIS transcripts contain a substantial forward-looking statements disclaimer section that was not filtered by the preamble stripper (which only removes content at the transcript start). The FLS disclaimer at DIS is embedded mid-document (common for Disney IR transcripts) and produces dozens of high-frequency n-grams that outrank actual CEO language.

---

## Phrase Review

| Phrase | Chars | Recommendation | Reason |
| --- | ---: | --- | --- |
| linear networks | 15 | approve | DIS-specific — Disney's term for traditional broadcast/cable TV business. Recurring exec language in every streaming-era call. |
| execute on cost | 15 | reject | `too_generic` — any company could say this. |
| quickly execute on cost | 23 | reject | `too_generic` — cost execution is not company-specific. |
| little bit | 10 | reject | `too_generic` — conversational filler. |
| quickly execute | 15 | reject | `too_generic` — not Disney-coded. |
| leisure businesses | 18 | reject | `too_generic` — vague category descriptor; not a Disney verbal tic. |
| strategic initiatives | 21 | reject | `too_generic` — universal executive boilerplate. |
| anticipated demand | 18 | reject | `too_generic` — FLS boilerplate. |
| pricing decisions | 17 | reject | `too_generic` — not Disney-specific. |
| advertising market | 18 | reject | `too_generic` — generic media industry term. |
| advertising revenue | 19 | reject | `too_generic` — generic media metric. |
| advertising sales | 17 | reject | `too_generic` — generic media metric. |
| market for programming | 22 | reject | `too_generic` — generic broadcast/media language. |
| operating income | 16 | reject | `jargon_heavy` — financial metric. |
| asset acquisitions | 18 | reject | `jargon_heavy` — M&A accounting term. |
| availability of content | 23 | reject | `too_generic` — vague streaming-era boilerplate. |
| business decisions | 18 | reject | `too_generic` — FLS boilerplate. |
| business lines | 14 | reject | `too_generic` — generic segment language. |
| business performance | 20 | reject | `too_generic` — generic FLS language. |
| business plans | 14 | reject | `too_generic` — FLS boilerplate. |
| capital investments | 19 | reject | `jargon_heavy` — financial term. |
| competitive conditions | 22 | reject | `too_generic` — FLS risk factor language. |
| consumer preferences | 20 | reject | `too_generic` — FLS risk factor language. |
| demand for our products | 23 | reject | `too_generic` — FLS risk factor language. |
| distribute our products | 23 | reject | `too_generic` — FLS risk factor language. |
| domestic and global | 19 | reject | `too_generic` — generic scope language. |
| economic conditions | 19 | reject | `too_generic` — FLS risk factor language. |
| expanded business | 17 | reject | `too_generic` — generic growth language. |
| financial prospects | 19 | reject | `too_generic` — FLS boilerplate. |
| global economic | 15 | reject | `too_generic` — FLS risk factor language. |
| health concerns | 15 | reject | `too_generic` — FLS risk factor language (pandemic boilerplate). |
| impact on our businesses | 24 | reject | `too_generic` — FLS language. |
| investments asset | 17 | reject | `jargon_heavy` — asset accounting term. |
| labor markets | 13 | reject | `too_generic` — FLS risk factor language. |
| military developments | 21 | reject | `boilerplate_opener` — FLS risk factor boilerplate. |
| natural disasters | 17 | reject | `boilerplate_opener` — FLS risk factor boilerplate. |
| nature of our offerings | 23 | reject | `too_generic` — FLS language. |
| new or expanded | 15 | reject | `too_generic` — FLS fragment. |
| new or expanded business | 24 | reject | `too_generic` — FLS fragment. |
| performance estimates | 21 | reject | `jargon_heavy` — FLS disclaimer term. |
| production costs | 16 | reject | `too_generic` — media industry operational term. |
| productions international | 25 | reject | `too_generic` — generic production scope language. |
| products and services | 21 | reject | `too_generic` — universal business language. |
| travel and leisure | 18 | reject | `too_generic` — industry category, not a Disney verbal tic. |
| weather conditions | 18 | reject | `boilerplate_opener` — FLS risk factor boilerplate. |
| behavior or demand | 18 | reject | `too_generic` — FLS risk factor language. |
| business openings | 17 | reject | `too_generic` — parks operational term; not executive voice. |
| certain items | 13 | reject | `too_generic` — FLS/accounting hedge language. |
| company content | 15 | reject | `too_generic` — generic content language. |
| business plans including | 24 | reject | `too_generic` — FLS fragment. |

**Disney exec vocabulary not captured in this set** (present in earnings transcripts, not surfaced by n-gram extraction):
- direct-to-consumer / DTC
- parks experiences and products
- streaming profitability
- creative excellence
- franchise storytelling
- theatrical window
- linear to streaming

These phrases are lower-frequency (appear in prepared remarks only, not in repeated FLS boilerplate) and will not be found by n-gram counting regardless of filter strength.

---

## Trivia Review

| Question | Recommendation | Reason |
| --- | --- | --- |
| Year founded? | approve | 1923 is correct (The Walt Disney Company founded October 16, 1923). |
| How many theme parks globally as of 2023? | flag | Correct answer is "c" (12). Count depends on whether Tokyo Disney Resort is included (OLC-owned, Disney-licensed). Disney-owned/operated parks total 10; with Tokyo (licensed), 12. Approve as technically defensible, but consider revising question to "owned or operated" for clarity. |
| Approximate annual revenue 2022? | approve | ~$82B is correct (Disney FY2022 revenue was $82.7B). |
| Decade television broadcasting began? | approve | 1950s is correct (Disneyland TV show launched 1954 on ABC). |
| Primary revenue driver for Parks & Experiences? | approve | Theme park tickets and resort stays is correct. |
| Disney+ subscribers as of 2024? | approve | 150+ million is accurate for early 2024. |

**Trivia result:** 5 approved outright, 1 flagged (park count — defensible, approve with note). DIS sits at exactly 6 trivia questions — the bottom of the "below target (acceptable)" band (6–11). The handoff notes (session 8) already flagged this gap.

**DIS needs at minimum 6 additional trivia questions to reach the 12-question activation minimum.**

**Suggested additional trivia candidates (no person names):**

| Question | A | B | C | D | Correct |
| --- | --- | --- | --- | --- | --- |
| What does "linear networks" refer to in Disney earnings calls? | Traditional TV channels | Streaming platforms | Theme park ride systems | Distribution contracts | a |
| Which streaming service did Disney launch in November 2019? | Disney+ | Disney Now | DisneyStream | Disney Play | a |
| What is the name of Disney's loyalty/membership program? | D23 | Magic Key | Disney Circle | Club Disney | a |
| Which Disney segment includes theme parks and cruises? | Parks, Experiences and Products | Entertainment Division | Consumer Experiences | Resort Operations | a |
| Approximately how many Disney cruise ships were in operation as of 2024? | 6 | 2 | 10 | 14 | a |
| What does DTC stand for in Disney's strategic reporting? | Direct-to-consumer | Disney Television Content | Distribution and Technology Channel | Digital Transformation Center | a |

---

## Readiness

**DIS is not activation-ready.**

- Phrase count after editorial pass: **1** (well below the 50 approved phrase minimum)
- Trivia count after editorial pass: **5–6** (below the 12-question minimum; 6 approved only if park count question is accepted)
- No critical failures (no person names) — but the candidate pool is almost entirely legal FLS boilerplate

**Recommended action:**
1. Add a `STAGE3_REJECT_PATTERNS` block specifically targeting FLS risk factor language. Key signals: "military developments", "natural disasters", "weather conditions", "competitive conditions", "financial prospects", "anticipated demand" — these are stock phrases from the Disney forward-looking statements section.
2. Run Layer 2 sentence-level extraction, targeting prepared-remarks sections only (exclude the FLS disclaimer, Q&A section, and operator instructions). DIS prepared remarks are typically short (5-8 minutes) and contain the exec language that is entirely absent from this phrase set.
3. Add the 6 trivia suggestions above to reach the minimum before the next review.
