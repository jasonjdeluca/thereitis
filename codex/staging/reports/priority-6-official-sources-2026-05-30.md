---
from: codex
date: 2026-05-30
subject: Priority 6 official PDF source repair for 13 PR #18 companies
---

# Priority 6 Official Source Repair

Updated the 13 StockAnalysis-only PR #18 company research files in `codex/staging/company-research/`.

## Summary

| Ticker | Official PDF quarters found | StockAnalysis fallback quarters remaining | Spot-check / follow-up |
| --- | ---: | ---: | --- |
| AAPL | 0 | 17 | No full official written transcript PDFs found; official materials appear limited to releases/webcasts. |
| NVDA | 0 | 17 | No full official written transcript PDFs found; official materials include releases, CFO commentary, presentations, and webcasts. |
| AMZN | 0 | 17 | No full official written transcript PDFs found; official event pages expose releases, slides, and webcasts. |
| CSCO | 0 | 17 | Cisco prepared-remarks PDFs were found but excluded because they are not full Q&A transcripts. |
| IBM | 4 | 13 | Recent IBM direct document links spot-checked `200 application/pdf`. |
| CRM | 1 | 16 | FY Q1 2026 Salesforce Q4CDN transcript spot-checked `200 application/pdf`; older in-scope events did not expose full transcript PDFs in search results. |
| KO | 17 | 0 | Coca-Cola official IR asset transcript PDFs found for all rows; representative URL spot-checked `200 application/pdf`. |
| CAT | 9 | 8 | Caterpillar transcript PDFs found for FY Q1 2024 through FY Q1 2026; representative Q4CDN URL spot-checked `200 application/pdf`. |
| BA | 17 | 0 | Boeing Q4CDN transcript PDFs found for all rows; representative URL spot-checked `200 application/pdf`. |
| HON | 0 | 17 | No full official written transcript PDFs found; official pages expose releases, presentations, filings, and webcasts. |
| MMM | 17 | 0 | 3M official financials page exposes all in-scope `webcast_transcript` PDFs; representative URL spot-checked `200 application/pdf`. |
| SHW | 8 | 9 | Sherwin-Williams Q4CDN transcript PDFs found for FY Q2 2024 through FY Q1 2026. |
| MCD | 0 | 17 | No full official written transcript PDFs found; official pages expose earnings-release PDFs only. |

## Files Updated

- `codex/staging/company-research/AAPL.json`
- `codex/staging/company-research/AMZN.json`
- `codex/staging/company-research/BA.json`
- `codex/staging/company-research/CAT.json`
- `codex/staging/company-research/CRM.json`
- `codex/staging/company-research/CSCO.json`
- `codex/staging/company-research/HON.json`
- `codex/staging/company-research/IBM.json`
- `codex/staging/company-research/KO.json`
- `codex/staging/company-research/MCD.json`
- `codex/staging/company-research/MMM.json`
- `codex/staging/company-research/NVDA.json`
- `codex/staging/company-research/SHW.json`

## Totals

- Rows promoted to official or official-vendor transcript PDFs: 73
- Rows remaining on StockAnalysis fallback: 148
- Representative PDF host checks: 6/6 passed with HTTP 200 and `application/pdf`

## Notes

- For official rows, `accepted_url` now points to the direct transcript PDF or direct document download, `status` is `official`, `official_search_exhausted` is `false`, and `source_type` is `official_ir_pdf` or `q4cdn_vendor_pdf`.
- For unresolved rows, StockAnalysis URLs were left in place and `official_search_exhausted` remains or was set to `true`.
- Cisco was intentionally left unresolved because the official PDFs located were prepared remarks, not full call transcripts with Q&A.
