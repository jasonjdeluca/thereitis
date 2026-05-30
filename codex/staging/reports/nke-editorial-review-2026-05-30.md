---
from: codex
date: 2026-05-30
subject: NKE generated content editorial review
---

# NKE Editorial Review

Input reviewed from `origin/main`:

- `company-packs/NKE/generated/phrases.json` - 40 phrases
- `company-packs/NKE/generated/trivia.json` - 4 trivia questions
- `docs/program/CONTENT_QA_RUBRIC.md`

## Summary

| Approved | Edited | Rejected | Pass After Edits | Activation Ready |
| ---: | ---: | ---: | ---: | --- |
| 12 | 4 | 24 | 16 | No |

The phrase set is not ready for activation. Only 16 of 40 phrases pass after suggested edits, well below the 50 approved phrase minimum. The trivia set is also blocked: only 4 questions were generated versus the 12-question minimum, and 2 of the 4 need rejection or correction.

## Phrase Review

| Phrase | Recommendation | Reason |
| --- | --- | --- |
| demand creation | approve | Nike-specific enough in context; recurring executive language around brand heat and demand generation. |
| nike digital | approve | Strong Nike channel phrase and company-specific. |
| nike direct | approve | Strong Nike channel phrase and company-specific. |
| greater china | approve | Nike reports this geography prominently; recognizable to earnings-call followers. |
| north america | reject | `too_generic` - common segment name across many companies. |
| supply chain | reject | `operational_minutia` - generic operational topic, not a Nike verbal tic. |
| gross margin | reject | `jargon_heavy` - accounting metric, not playable company identity. |
| nike brand | approve | Company-specific and central to Nike call language. |
| jordan brand | reject | `person_name` - contains a real person's last name despite being a Nike brand. |
| global football | approve | Nike-specific sports category language; recognizable in calls. |
| air force | approve | Nike product-franchise reference; short and specific. |
| product innovation | edit: sport innovation | Close, but generic as written; edited version is more Nike-coded and 16 characters. |
| brand momentum | edit: NIKE brand momentum | Good earnings-call phrase, but needs Nike specificity; edited version is 19 characters. |
| consumer demand | reject | `too_generic` - any consumer company could say it. |
| retail sales | reject | `too_generic` - retail metric, not Nike-specific. |
| double-digit growth | reject | `too_generic` - common earnings-call claim. |
| full price | edit: full-price selling | Close to Nike marketplace language; edited version is more playable and 18 characters. |
| foreign exchange | reject | `jargon_heavy` - FX headwind language, not company identity. |
| currency-neutral basis | reject | `jargon_heavy` - common multinational reporting convention. |
| diluted earnings | reject | `jargon_heavy` - accounting term. |
| effective tax rate | reject | `jargon_heavy` - accounting term. |
| fiscal year | reject | `too_generic` - reporting boilerplate. |
| quarter results | reject | `too_generic` - reporting boilerplate. |
| second half | reject | `too_generic` - timing phrase, not company-specific. |
| first quarter | reject | `too_generic` - reporting boilerplate. |
| financial results | reject | `too_generic` - reporting boilerplate. |
| earnings release | reject | `boilerplate_opener` - call/report ceremony language, not a bingo phrase. |
| product pipeline | edit: innovation pipeline | Close, but generic as written; edited version better matches Nike product-cycle language and is 19 characters. |
| footwear franchises | approve | Strong Nike category/franchise phrase. |
| operating segments | reject | `jargon_heavy` - reporting taxonomy, not playable. |
| wholesale partners | approve | Nike channel-strategy phrase; pairs naturally with Nike Direct. |
| strong growth | reject | `too_generic` - any company could say it. |
| double digits | reject | `too_generic` - common earnings-call shorthand. |
| ebit declined | reject | `jargon_heavy` - financial metric and not CEO-mode/playable. |
| jordan and converse | reject | `person_name` - includes a real person's last name. |
| express lane | approve | Nike-specific speed-to-market / product-flow language. |
| innovative product | reject | `too_generic` - generic innovation claim. |
| consumer response | reject | `too_generic` - generic demand commentary. |
| financial outlook | reject | `too_generic` - reporting boilerplate. |
| new product | reject | `too_generic` - generic product language. |

## Trivia Review

| Question | Recommendation | Reason |
| --- | --- | --- |
| In what year was Nike founded? | approve | Clear, stable, four choices, correct answer `1964`, no person names. |
| When did Nike go public? | approve | Clear, stable, four choices, correct answer `1980`, no person names. |
| What percentage of Nike's revenue comes from women? | reject | Ambiguous phrasing and likely unstable/out-of-context; "comes from women" is not a clean business metric. |
| In what year did Nike acquire Converse? | edit | Correct year should be `2003`, but generated `correct_answer` points to `2002`. Revise options so `2003` is present and correct. |

## Trivia Gap

Only 4 trivia questions were generated. Activation requires at least 12, so NKE needs at least 8 more approved trivia questions even if the edited Converse question is fixed.

Suggested additional trivia candidates, with no person names:

| Question | A | B | C | D | Correct |
| --- | --- | --- | --- | --- | --- |
| What was Nike originally called? | Blue Ribbon Sports | Track Star Co. | Victory Athletics | Swoosh Sports | a |
| Which sales channel sells directly to consumers? | Nike Direct | Nike Wholesale | Nike Licensing | Nike Marketplace | a |
| Which geography is reported as Greater China? | China, Hong Kong, Macau, Taiwan | Japan and Korea | Southeast Asia | Europe and Africa | a |
| Which product category is Nike best known for? | Footwear | Appliances | Software | Hotels | a |
| What is Converse best known for? | Casual sneakers | Cloud software | Home improvement | Theme parks | a |
| Which Nike channel includes apps and online commerce? | Nike Digital | Nike Supply | Nike Finance | Nike Freight | a |
| What month ends Nike's fiscal year? | May | December | March | September | a |
| What does currency-neutral revenue exclude? | Exchange-rate changes | Wholesale sales | Digital sales | Product returns | a |
| What does Nike Direct contrast with on earnings calls? | Wholesale partners | Tax expense | Interest income | Store leases | a |

## Readiness

NKE is not activation-ready:

- Phrase count after editorial pass: 16 usable phrases at most, below the 50 approved phrase minimum.
- Trivia count after editorial pass: 2 approved plus 1 editable, below the 12-question minimum.
- Existing `migration.sql` should remain `human_decision_needed`; do not promote as-is.
