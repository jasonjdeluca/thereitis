---
codex_staged: true
group: E
status: review_needed
target_path: reports/remaining-blue-chip-research-summary-2026-05-30.md
notes: Summary of Priority 1 remaining blue-chip research deposits and Priority 2 PDF spot-validation output.
---
# Remaining Blue-Chip Research Summary - 2026-05-30

## Priority 1 Output

Staged 13 additional company research deposits in `codex/staging/company-research/`:

| Ticker | Company | Quarters | Staged status | Source posture |
| --- | --- | ---: | --- | --- |
| MSFT | Microsoft | 17 | review_needed | official source context; structured third-party fallback rows |
| JPM | JPMorgan Chase | 17 | review_needed | official source context; structured third-party fallback rows |
| GS | Goldman Sachs | 17 | review_needed | third-party transcript rows after official search exhaustion |
| AXP | American Express | 17 | review_needed | third-party transcript rows after official search exhaustion |
| V | Visa | 17 | review_needed | official source context; structured third-party fallback rows |
| TRV | Travelers | 17 | review_needed | official source context; structured third-party fallback rows |
| UNH | UnitedHealth Group | 17 | review_needed | third-party transcript rows after official search exhaustion |
| AMGN | Amgen | 17 | review_needed | mixed official/third-party context; structured third-party fallback rows |
| JNJ | Johnson & Johnson | 17 | human_decision_needed | official PDF candidates need direct validation before activation |
| MRK | Merck & Co. | 17 | review_needed | official source context; structured third-party fallback rows |
| PG | Procter & Gamble | 17 | review_needed | third-party transcript rows after official search exhaustion |
| CVX | Chevron | 17 | review_needed | third-party transcript rows after official search exhaustion |
| VZ | Verizon | 17 | review_needed | official source context; structured third-party fallback rows |

`docs/program/TARGET_COMPANIES.md` was not present on local `codex/staging`, `origin/codex/staging`, or `origin/main`. The thirteenth ticker, `CVX`, was identified from `codex/staging/handover/codex-work-handover-2026-05-29.md`, which lists Chevron in the completed Group E coverage findings but no staged company-research file existed for it.

## Important Caveat

These files intentionally follow the existing Codex research-deposit pattern and use readable StockAnalysis transcript pages as the structured accepted rows. For companies with official transcript context, the files preserve that context and set `official_search_exhausted: false`, but they do not complete full official direct-PDF mapping.

## Priority 2 Output

Staged `codex/staging/reports/pdf-link-validation-2026-05-30.md`.

Spot checks passed HTTP/PDF validation for JNJ, CRM, IBM, MMM, V, TRV, and MRK sample candidates. KO exposed an official transcript link from the investor page, but direct Node fetch returned `403 application/xml` with an access-denied response, including with browser-like request headers.

## Recommended Claude Code Review

- Validate all 13 JSON files against the same source-manifest acceptance checks used for the first 17.
- Decide whether structured fallback rows are acceptable for the official-source-context companies or whether Claude should resolve direct official PDFs before promotion.
- Treat JNJ as requiring human review before activation.
- Treat KO PDF access as an ingestion-access issue, not as evidence that the official transcript link is absent.
