# HD Editorial Review

**Date:** 2026-05-31  
**Reviewer:** Claude Code (Sonnet 4.6)  
**Rubric:** `docs/program/CONTENT_QA_RUBRIC.md`

Input reviewed from `main`:
- `company-packs/HD/generated/phrases.json` — 50 phrases
- `company-packs/HD/generated/trivia.json` — 11 trivia questions

---

## Summary

| Approved | Edited | Rejected | Pass After Edits | Activation Ready |
| ---: | ---: | ---: | ---: | --- |
| 10 | 0 | 40 | 10 | No |

The phrase set is not activation-ready. Only 10 of 50 phrases pass — the comp/metrics cluster is genuinely HD-specific, but the remaining 40 are financial jargon, reporting boilerplate, and generic CEO filler. Trivia is at 10 of 11 (one factually uncertain question rejected) — below the 12-question minimum.

**Root cause:** N-gram extraction biases toward high-frequency terms. HD's most repeated phrases are quarterly reporting metrics (`gross margin`, `diluted earnings`, `effective tax rate`) and operational jargon (`supply chain`, `operating expense`) — language that appears verbatim in all 17 transcripts but has no company identity. The comp-cluster phrases (the good ones) also appear frequently but because they reflect HD's actual vocabulary, not because they are boilerplate.

---

## Phrase Review

| Phrase | Chars | Recommendation | Reason |
| --- | ---: | --- | --- |
| comp sales | 10 | approve | Core HD metric language; recognizable HD verbal tic. |
| average ticket | 14 | approve | HD reports this constantly; strong company identity. |
| comp average ticket | 19 | approve | Genuine HD exec phrase combining two key metrics. |
| comp transactions | 17 | approve | HD earnings-call staple; pairs with average ticket. |
| company comps | 13 | approve | HD-specific shorthand; CEO voice. |
| total company comps | 19 | approve | HD exec phrase for total comparable-store results. |
| positive comps | 14 | approve | HD-specific result language; playable outcome phrase. |
| big-ticket comp | 15 | approve | HD-specific — executives use this for appliance/tool sales. |
| home improvement | 16 | approve | HD's own industry category; company identity. |
| building materials | 18 | approve | HD-specific category; recurring exec framing. |
| leveraging our digital | 21 | reject | `too_generic` — any retailer could say this. |
| back into our business | 22 | reject | `too_generic` — context-free; not HD-coded. |
| customers and communities | 25 | reject | `too_generic` — standard corporate social language. |
| digital platforms | 17 | reject | `too_generic` — no company identity. |
| sales leveraging | 16 | reject | `too_generic` — fragment with no specific meaning. |
| quarter we invested | 19 | reject | `too_generic` — timing filler, not CEO identity. |
| we've seen | 10 | reject | `too_generic` — conversational filler. |
| shopping experience | 19 | reject | `too_generic` — retail generic, not HD-specific. |
| turning to capital | 18 | reject | `too_generic` — transition phrase fragment. |
| you're seeing | 13 | reject | `too_generic` — conversational filler. |
| we're seeing | 12 | reject | `too_generic` — conversational filler. |
| capital allocation | 18 | reject | `jargon_heavy` — financial management term, not a verbal tic. |
| operating expense | 17 | reject | `jargon_heavy` — standard accounting line item. |
| operating margin | 16 | reject | `jargon_heavy` — financial metric. |
| quarter operating | 17 | reject | `jargon_heavy` — fragment of a financial metric. |
| supply chain | 12 | reject | `too_generic` — universal business term. |
| capital expenditures | 20 | reject | `jargon_heavy` — accounting term. |
| comp average | 12 | reject | `too_generic` — fragment of "comp average ticket"; not standalone playable. |
| debt and equity | 15 | reject | `jargon_heavy` — capital structure term. |
| diluted earnings | 16 | reject | `jargon_heavy` — accounting metric. |
| effective tax | 13 | reject | `jargon_heavy` — accounting fragment. |
| effective tax rate | 18 | reject | `jargon_heavy` — accounting metric. |
| form of capital | 15 | reject | `jargon_heavy` — capital allocation jargon. |
| gross margin | 12 | reject | `jargon_heavy` — standard financial metric. |
| interest and other | 18 | reject | `jargon_heavy` — income statement line item. |
| inventory turns | 15 | reject | `jargon_heavy` — inventory metric; no CEO-mode playability. |
| invested capital | 16 | reject | `jargon_heavy` — returns-on-capital accounting term. |
| long-term debt | 14 | reject | `jargon_heavy` — balance sheet term. |
| long-term debt and equity | 25 | reject | `jargon_heavy` — capital structure fragment. |
| months return on invested | 25 | reject | `jargon_heavy` — ROI metric fragment; also reads as broken text. |
| other expense | 13 | reject | `jargon_heavy` — income statement line item. |
| quarter earnings | 16 | reject | `too_generic` — reporting boilerplate. |
| quarter total | 13 | reject | `too_generic` — fragment; not standalone. |
| quarter total sales | 19 | reject | `too_generic` — reporting boilerplate. |
| sales were billion | 18 | reject | `boilerplate_opener` — transcript result narration; broken fragment. |
| tax rate | 8 | reject | `jargon_heavy` — accounting term. |
| total company | 13 | reject | `too_generic` — fragment; no identity. |
| total sales | 11 | reject | `too_generic` — generic retail metric. |
| total sales were billion | 24 | reject | `boilerplate_opener` — transcript result narration; broken fragment. |
| turns were times | 16 | reject | `boilerplate_opener` — broken transcript fragment ("turns were X times"). |

---

## Trivia Review

| Question | Recommendation | Reason |
| --- | --- | --- |
| Approximate number of stores globally as of 2024? | approve | ~2,300 stores is correct; four distinct options; clear answer. |
| 'Warehouse' concept operational advantage? | approve | Bulk purchasing and self-service is accurate; good distractors. |
| Major acquisition in 2006 for supply chain? | reject | "Acquisition of 60 supply houses" is factually unverifiable. HD's notable 2006 move was Hughes Supply ($3.2B). None of the four options accurately describe it. |
| Which digital platform and year? | approve | HomeDepot.com in 2000 is correct; plausible distractors. |
| Approximate annual revenue FY2023? | approve | $152B is accurate for HD FY2023 (~$152.7B). |
| Services business line offerings? | approve | Installation, design consultation, and tool rental are all genuine HD services. |
| Technology for in-store navigation? | approve | Mobile app with aisle location mapping is accurate and well-known HD feature. |
| Omnichannel strategy goal? | approve | Seamless online/mobile/in-store integration is the correct framing. |
| Year HD entered Canada? | approve | 1994 is correct. |
| Dividend history commitment? | approve | Consistent annual dividend increases for 10+ years is accurate. |
| Post-2020 strategic pivot? | approve | Digital transformation and curbside pickup is accurate. |

**Trivia result:** 10 of 11 pass after rejecting the supply-chain acquisition question. Minimum for activation is 12 — HD needs at least 2 additional questions even if all 10 are approved.

**Suggested additional trivia candidates (no person names):**

| Question | A | B | C | D | Correct |
| --- | --- | --- | --- | --- | --- |
| What does "comp" refer to in HD earnings calls? | Comparable-store sales | Compensation expense | Computer systems | Customer complaints | a |
| What does "big-ticket" refer to in HD's comp reporting? | High-value categories like appliances | International sales | Online orders | B2B commercial accounts | a |
| What is the name of HD's loyalty program for professionals? | Pro Xtra | Pro Builder | Pro Direct | Pro Connect | a |
| What segment term does HD use for contractor customers? | Pro | Trade | Commercial | Dealer | a |

---

## Readiness

**HD is not activation-ready.**

- Phrase count after editorial pass: **10** (below the 50 approved phrase minimum)
- Trivia count after editorial pass: **10** (below the 12-question minimum)
- No critical issues (no person names, no boilerplate openers in approved set)

**Recommended action:** Run Layer 2 sentence-level extraction to regenerate the phrase candidate pool before re-review. The n-gram approach surfaces comp metrics correctly but floods the candidate pool with quarterly reporting boilerplate. Sentence-level extraction will better isolate CEO idiom language.
