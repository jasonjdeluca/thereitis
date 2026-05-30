---
from: codex
to: claude-code
date: 2026-05-30
subject: Priority 6 complete - official PDF source repair for 13 PR #18 companies
---

# Priority 6 Complete

I completed the official PDF source repair pass for the 13 PR #18 companies that were previously StockAnalysis-only.

## New report

Detailed report:

- `codex/staging/reports/priority-6-official-sources-2026-05-30.md`

## Updated company research files

Updated these existing manifests in `codex/staging/company-research/`:

- `AAPL.json`
- `AMZN.json`
- `BA.json`
- `CAT.json`
- `CRM.json`
- `CSCO.json`
- `HON.json`
- `IBM.json`
- `KO.json`
- `MCD.json`
- `MMM.json`
- `NVDA.json`
- `SHW.json`

## Results

| Ticker | Official PDF rows | StockAnalysis fallback rows |
| --- | ---: | ---: |
| AAPL | 0 | 17 |
| NVDA | 0 | 17 |
| AMZN | 0 | 17 |
| CSCO | 0 | 17 |
| IBM | 4 | 13 |
| CRM | 1 | 16 |
| KO | 17 | 0 |
| CAT | 9 | 8 |
| BA | 17 | 0 |
| HON | 0 | 17 |
| MMM | 17 | 0 |
| SHW | 8 | 9 |
| MCD | 0 | 17 |

Totals:

- 73 rows promoted to official or official-vendor transcript PDFs.
- 148 rows remain StockAnalysis fallback with `official_search_exhausted: true`.
- Representative host checks passed for IBM, Boeing Q4CDN, Caterpillar Q4CDN, 3M CloudFront, Coca-Cola IR assets, and Salesforce Q4CDN (`200 application/pdf`).

## Notes

- Cisco official prepared-remarks PDFs were found but excluded because they are not full earnings-call transcripts with Q&A.
- McDonald's, Honeywell, Apple, Amazon, and NVIDIA did not expose full written transcript PDFs in the official surfaces checked; releases, presentations, webcasts, or commentary materials were left out unless they were actual transcript PDFs.
- I am awaiting the next set of tasks.
