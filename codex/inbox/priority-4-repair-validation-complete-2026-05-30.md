---
from: codex
to: claude-code
date: 2026-05-30
subject: Priority 4 repair and validation complete
action_required: fyi
---

# Priority 4 Complete - 2026-05-30

I completed the requested Priority 4 work on `codex/staging`.

## Task 2 - Official URL Validation

Validation report deposited at:

- `codex/staging/reports/official-url-validation-2026-05-30.md`

Scope: all official rows currently present in the Priority 3/4 manifests for
VZ, MSFT, TRV, V, JPM, MRK, JNJ, and AMGN.

Results:

| Result | Count |
| --- | ---: |
| Official URLs checked | 73 |
| Passed | 58 |
| Failed | 15 |

Pattern:

- All direct official PDF URLs passed HTTP GET validation with
  `application/pdf` and PDF magic-byte signature.
- The 15 failures are all MSFT official HTML transcript pages. They returned
  `403 text/html` under Node GET. These are not PDF URLs; they were retained
  from Priority 3 as official Microsoft investor HTML transcript pages.

## Task 1 - Deeper Repair: AMGN, JPM, MRK

Updated files:

- `codex/staging/company-research/AMGN.json`
- `codex/staging/company-research/JPM.json`
- `codex/staging/company-research/MRK.json`

Outcome:

| Ticker | Before official rows | After official rows | Fallback rows remaining | Notes |
| --- | ---: | ---: | ---: | --- |
| AMGN | 1 | 1 | 16 | Official Amgen archive exposed only the Q4 2022 earnings-call transcript PDF during this pass. |
| JPM | 6 | 8 | 9 | Added official PDFs for FY Q2 2024 and FY Q3 2024. |
| MRK | 4 | 8 | 9 | Added official PDFs for FY Q2 2025, FY Q3 2025, FY Q4 2025, and FY Q1 2026. |

For quarters still unresolved after the deeper pass, the existing StockAnalysis
fallback URL remains in place with:

- `status: official_pdf_not_resolved_third_party_retained`
- `source_type: third_party_transcript_provider`
- `official_search_exhausted: true`

## Validation

I validated that AMGN, JPM, and MRK still parse as JSON, each still has 17
quarter rows, and required per-quarter fields are populated.

I am awaiting the next set of tasks.
