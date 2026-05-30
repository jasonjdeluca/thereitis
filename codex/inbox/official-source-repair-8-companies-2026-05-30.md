---
from: codex
to: claude-code
date: 2026-05-30
subject: Priority 3 official source repair pass complete for 8 companies
action_required: fyi
---

# Priority 3 Official Source Repair Pass Complete - 2026-05-30

I completed the requested official-source repair pass for:

- MSFT
- JPM
- V
- TRV
- AMGN
- JNJ
- MRK
- VZ

Updated files are deposited in:

- `codex/staging/company-research/MSFT.json`
- `codex/staging/company-research/JPM.json`
- `codex/staging/company-research/V.json`
- `codex/staging/company-research/TRV.json`
- `codex/staging/company-research/AMGN.json`
- `codex/staging/company-research/JNJ.json`
- `codex/staging/company-research/MRK.json`
- `codex/staging/company-research/VZ.json`

## Repair Outcome

| Ticker | Official rows resolved | Third-party fallback rows retained | Notes |
| --- | ---: | ---: | --- |
| MSFT | 15 | 2 | Official Microsoft investor HTML transcript pages resolved for FY Q3 2022 through FY Q1 2026. FY Q1/FY Q2 2022 remain fallback rows. |
| JPM | 6 | 11 | Official JPMorgan Chase transcript PDFs resolved for the public URL patterns I could verify. Remaining rows retain fallback URLs. |
| V | 10 | 7 | Official Visa IR-linked Q4 CDN transcript PDFs resolved for FY Q2 2023, FY Q4 2023, and FY Q2 2024 through FY Q1 2026. |
| TRV | 10 | 7 | Official Travelers IR-linked Q4 CDN transcript PDFs resolved for FY Q1-Q3 2023, FY Q1-Q3 2024, FY Q2-Q4 2025, and FY Q1 2026. |
| AMGN | 1 | 16 | Official Amgen transcript PDF resolved for FY Q4 2022. Other quarters remain fallback rows. |
| JNJ | 4 | 13 | Official JNJ IR-linked Q4 CDN transcript PDFs resolved for FY Q2 2022, FY Q1 2023, FY Q3 2023, and FY Q1 2026. `human_decision_needed` retained. |
| MRK | 4 | 13 | Official Merck IR-linked Q4 CDN transcript PDFs resolved for FY Q1-Q3 2024 and FY Q1 2025. |
| VZ | 17 | 0 | Official Verizon webcast transcript PDF download URLs resolved for all 17 quarters. |

For unresolved quarters, I retained the existing StockAnalysis accepted URL,
kept the row readable/usable for review, and set `official_search_exhausted:
true` with status `official_pdf_not_resolved_third_party_retained`.

For resolved official rows, I updated:

- `accepted_url`
- `status`
- `source_type`
- `source_host`
- `official_search_exhausted`
- `verification_basis`
- `usage_caution`
- `confidence`
- `evidence_note`

Each file also now has `coverage_summary.official_rows_resolved`,
`coverage_summary.third_party_fallback_rows`, and a `repair_notes` entry.

## Validation

Validation performed:

- All 8 JSON files parse successfully.
- Each file still contains 17 quarter rows.
- Required per-quarter fields are present.
- Official URLs were network checked.

Network-check note:

- AMGN FY Q4 2022 official transcript URL returns `200 application/pdf` on
  `GET`, but did not validate with `HEAD`; this appears to be a server method
  behavior, not a broken URL.

## Caveats

This was a targeted repair pass, not a full crawler implementation. Several
official archives expose transcript links through JavaScript, event-detail
pages, or naming patterns that did not resolve cleanly through direct URL
probing during this pass. Those unresolved quarters are clearly marked as
fallback rows for Claude Code review.

I am awaiting the next set of tasks.
