# WMT Editorial Review

**Date:** 2026-05-31  
**Reviewer:** Claude Code (Sonnet 4.6)  
**Rubric:** `docs/program/CONTENT_QA_RUBRIC.md`

Input reviewed from `main`:
- `company-packs/WMT/generated/phrases.json` — 50 phrases
- `company-packs/WMT/generated/trivia.json` — 11 trivia questions

---

## Summary

| Approved | Edited | Rejected | Pass After Edits | Activation Ready |
| ---: | ---: | ---: | ---: | --- |
| 3 | 0 | 47 | 3 | No |

The phrase set has a critical failure: **8 phrases contain real person names** (executives and analysts by name), which is a hard rubric violation. Beyond that, approximately half the set is legal disclaimer boilerplate, call ceremony language, and FactSet attribution text — none of which should have survived Stage 3 filtering. Only 3 phrases reflect genuine Walmart executive vocabulary.

**Root cause:** The WMT transcripts appear to include the full FactSet disclaimer header (mentioning named analysts and legal liability language) as part of the transcript body. The preamble stripper only removes operator instructions at the start — embedded disclaimer sections in the Q&A portion pass through. Additionally, analyst names appear in Q&A turn markers ("Michael Lasser, Morgan Stanley") and were not filtered.

**Critical failure flag:** Person names in the approved phrase set would be a hard reject in `content-validation.js`. This set cannot be promoted to `phrase_staging` in any form.

---

## Phrase Review

| Phrase | Chars | Recommendation | Reason |
| --- | ---: | --- | --- |
| customers and members | 21 | approve | WMT-specific — "members" refers to Sam's Club; strong company identity. |
| general merchandise | 19 | approve | Core WMT category term; recurring exec framing on calls. |
| price gaps | 10 | approve | WMT-specific pricing strategy language; executive voice. |
| what's happening | 16 | reject | `too_generic` — conversational opener; no company identity. |
| we're seeing | 12 | reject | `too_generic` — conversational filler. |
| you're seeing | 13 | reject | `too_generic` — conversational filler. |
| we're doing | 11 | reject | `too_generic` — conversational filler. |
| comp sales | 10 | reject | `too_generic` — retail-industry generic; not WMT-specific. |
| constant currency | 17 | reject | `jargon_heavy` — multinational FX reporting convention. |
| gross margin | 12 | reject | `jargon_heavy` — standard financial metric. |
| operating income | 16 | reject | `jargon_heavy` — financial metric. |
| supply chain | 12 | reject | `too_generic` — universal business term. |
| little bit | 10 | reject | `too_generic` — conversational filler. |
| market share | 12 | reject | `too_generic` — any company could say it. |
| including the writer | 20 | reject | `boilerplate_opener` — FactSet disclaimer attribution text. |
| taking my | 9 | reject | `too_generic` — fragment; not standalone. |
| accuracy completeness | 21 | reject | `boilerplate_opener` — FactSet legal disclaimer text. |
| accuracy integrity | 18 | reject | `boilerplate_opener` — FactSet legal disclaimer text. |
| affiliates business | 19 | reject | `too_generic` — legal entity language. |
| douglas mcmillon | 16 | reject | `person_name` — CEO by name; hard rubric violation. |
| executive vice | 14 | reject | `boilerplate_opener` — call roster/title language. |
| executive vice president | 24 | reject | `boilerplate_opener` — call roster/title language. |
| furner president | 16 | reject | `person_name` — executive by last name; hard rubric violation. |
| furner president chief | 22 | reject | `person_name` — executive by last name; hard rubric violation. |
| gutman analyst | 14 | reject | `person_name` + `analyst_question` — analyst by last name. |
| gutman with morgan | 18 | reject | `person_name` + `analyst_question` — analyst by last name. |
| investment decisions | 20 | reject | `too_generic` — generic strategic language. |
| investment needs | 16 | reject | `too_generic` — generic strategic language. |
| last year | 9 | reject | `too_generic` — temporal reference; not a phrase. |
| lost profits | 12 | reject | `boilerplate_opener` — FactSet legal disclaimer ("lost profits" is legal liability language). |
| michael lasser | 14 | reject | `person_name` — analyst by full name; hard rubric violation. |
| michael lasser analyst | 22 | reject | `person_name` — analyst by full name; hard rubric violation. |
| morgan stanley | 14 | reject | `analyst_question` — analyst firm name, not executive language. |
| my question | 11 | reject | `analyst_question` — analyst floor language. |
| next question | 13 | reject | `boilerplate_opener` — call ceremony phrase. |
| operator instructions | 21 | reject | `boilerplate_opener` — call ceremony phrase. |
| operator thank | 14 | reject | `boilerplate_opener` — call ceremony phrase. |
| please proceed | 14 | reject | `boilerplate_opener` — call ceremony phrase. |
| question and answer | 19 | reject | `boilerplate_opener` — call structure language. |
| llc good morning | 16 | reject | `boilerplate_opener` — call opening ceremony. |
| advice designed | 15 | reject | `boilerplate_opener` — FactSet disclaimer. |
| advice designed to meet | 23 | reject | `boilerplate_opener` — FactSet disclaimer. |
| answer section | 14 | reject | `boilerplate_opener` — call structure language. |
| answer section operator | 23 | reject | `boilerplate_opener` — call structure language. |
| any implied | 11 | reject | `boilerplate_opener` — FactSet legal disclaimer. |
| any indirect | 12 | reject | `boilerplate_opener` — FactSet legal disclaimer. |
| any indirect incidental | 23 | reject | `boilerplate_opener` — FactSet legal disclaimer. |
| any information | 15 | reject | `boilerplate_opener` — FactSet legal disclaimer. |
| any information expressed | 25 | reject | `boilerplate_opener` — FactSet legal disclaimer. |
| any information provided | 24 | reject | `boilerplate_opener` — FactSet legal disclaimer. |

**Person name violations (critical):** douglas mcmillon, furner president, furner president chief, gutman analyst, gutman with morgan, michael lasser, michael lasser analyst — 7 distinct person-name phrases.

---

## Trivia Review

| Question | Recommendation | Reason |
| --- | --- | --- |
| Year first discount store opened? | approve | 1962 is correct (first Walmart store). Clear answer. |
| Primary business model? | approve | Discount retail and grocery is accurate. |
| Year became world's largest retailer by revenue? | flag | Correct answer is "c" (2005) but Walmart surpassed competitors in revenue earlier (~2002 on Fortune Global 500). Year is ambiguous. Approve with note that "largest by revenue in global rankings" is defensible for ~2002-2005. |
| Approximate global store count as of 2023? | flag | Correct answer is "c" (11,500). Walmart's actual count is approximately 10,500–10,600. 11,500 is inflated. Recommend editing options or rejecting. |
| Grocery as percentage of revenue? | approve | 50-55% is approximately correct for US Walmart. |
| Primary strategy vs. e-commerce giants? | approve | Omnichannel + grocery delivery is correct. |
| Decade of national expansion? | approve | 1980s is correct. |
| Approximate annual revenue FY2023? | flag | Correct answer is "c" ($650B). Walmart FY2024 (ended Jan 2024) was ~$648B; FY2023 was ~$611B. $650B is slightly off for FY2023 specifically. Acceptable approximation — approve with note. |
| Emerging service for customer engagement? | reject | "All of the above" is the correct answer but the question is ambiguous — financial services and insurance is not a confirmed active WMT business line. Avoid "all of the above" answers per rubric. |
| Emissions goal by 2040? | approve | Net zero by 2040 is WMT's stated commitment. |
| Technology for supply chain automation? | approve | Robotics and AI is correct and active. |

**Trivia result:** 7 approved outright, 3 flagged (need editing or rejection), 1 rejected. At best 10 usable questions after flags are resolved — below the 12-question minimum.

---

## Readiness

**WMT is not activation-ready.**

- Phrase count after editorial pass: **3** (well below the 50 approved phrase minimum)
- Trivia count after editorial pass: **7–10** (below the 12-question minimum)
- **Critical failure:** 7 phrases contain real person names — the set cannot be promoted to `phrase_staging` in any form

**Recommended action:** 
1. Add a `STAGE3_REJECT_PATTERNS` entry to catch FactSet disclaimer text (the "accuracy completeness", "any implied", "any indirect", "lost profits" cluster is distinctive enough to regex-filter).
2. Add analyst Q&A turn-marker language to the preamble stripper or reject patterns ("analyst [firm name]", "my question").
3. Run Layer 2 sentence-level extraction. The core problem is that n-gram counting ranks legal boilerplate above CEO idiom because disclaimers appear verbatim across all 17 quarters.
4. WMT has strong exec vocabulary (EDLP, rollback, price investment, Sam's Club, Walmart+, store-of-the-future) — none of which appears in this set because those phrases appear in Q&A prepared remarks, not in the transcript header/footer boilerplate that dominated the n-gram counts.
