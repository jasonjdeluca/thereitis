---
codex_staged: true
group: E
status: review_needed
target_path: reports/pdf-link-validation-2026-05-30.md
notes: Priority 2 spot validation for official/official-linked transcript PDF candidates. This is not a full 17-quarter direct-PDF reconciliation.
---
# PDF Link Validation - 2026-05-30

## Scope

Spot HTTP and Content-Type checks for official or official-linked transcript PDF candidates named in the Priority 2 assignment. Checks performed: HTTP fetch with redirects, final URL capture, Content-Type, byte count, and PDF magic-byte signature.

## Summary

- Candidates checked: 8
- Passed HTTP/PDF checks: 7
- Failed HTTP/PDF checks: 1
- Full per-quarter direct PDF reconciliation: not performed in this pass

## Results

| Ticker | Quarter | HTTP | Content-Type | PDF signature | Bytes | Result |
| --- | --- | ---: | --- | --- | ---: | --- |
| JNJ | FY Q3 2023 | 200 | application/pdf | yes | 183263 | pass |
| CRM | FY Q4 2026 | 200 | application/pdf | yes | 273370 | pass |
| IBM | FY Q1 2026 | 200 | application/pdf | yes | 129205 | pass |
| KO | FY Q1 2026 | 403 | application/xml | no | 243 | review |
| MMM | FY Q1 2026 | 200 | application/pdf | yes | 243442 | pass |
| V | FY Q1 2026 | 200 | application/pdf | yes | 321411 | pass |
| TRV | FY Q1 2026 | 200 | application/pdf | yes | 679498 | pass |
| MRK | FY Q1 2025 | 200 | application/pdf | yes | 202498 | pass |

## Candidate URLs

- JNJ FY Q3 2023: https://s203.q4cdn.com/636242992/files/doc_financials/2023/q3/Final-JNJ-Q3-2023-Earnings-Transcript.pdf
- CRM FY Q4 2026: https://s205.q4cdn.com/626266368/files/doc_financials/2026/q4/Transcript-Salesforce-Inc-Q4-FY26-Earnings-Conference-Call-2-25-26.pdf
- IBM FY Q1 2026: https://www.ibm.com/downloads/documents/us-en/15db806050424efc
- KO FY Q1 2026: https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/11107/webcast_transcript/CORRECTED%2BTRANSCRIPT_KO%2BQ126%2BEarnings%2BCall.pdf
- MMM FY Q1 2026: https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30995/webcast_transcript/MMM-USQ_Transcript_2026-04-21.pdf
- V FY Q1 2026: https://s1.q4cdn.com/050606653/files/doc_financials/2026/q1/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q1-2026-Earnings-Call-29-January-2026-5_00-PM-ET.pdf
- TRV FY Q1 2026: https://s26.q4cdn.com/410417801/files/doc_financials/2026/q1/1Q26-TRV-Transcript-1.pdf
- MRK FY Q1 2025: https://s21.q4cdn.com/488056881/files/doc_financials/2025/q1/MRK-USQ_Transcript_2025-04-24.pdf

## Notes

- Existing staged research files for CRM, IBM, KO, and MMM currently use StockAnalysis transcript pages as structured fallback rows, not official PDF accepted URLs. These spot checks confirm official/official-linked PDF candidates exist for at least one representative quarter each.
- The new Priority 1 files for V, TRV, JNJ, and MRK also use StockAnalysis structured fallback rows pending full direct-PDF mapping.
- KO exposed the Q1 2026 transcript link on the official investor page, but direct PDF fetch returned an access-denied XML response. A retry with browser-like request headers produced the same result.
- MRK Q1 2026 earnings-call transcript PDF was not found during this pass; the checked MRK sample is FY Q1 2025.
- JNJ remains marked human_decision_needed because the handoff specifically called for quarter/date and transcript-text spot checks before activation.
