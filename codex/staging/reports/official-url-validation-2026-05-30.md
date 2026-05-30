---
codex_staged: true
group: E
status: review_needed
target_path: reports/official-url-validation-2026-05-30.md
notes: Priority 4 validation report for official URLs resolved in Priority 3 plus deeper-repair additions.
---
# Official URL Validation - 2026-05-30

## Summary

- Total official URLs checked: 73
- Passed: 58
- Failed: 15
- Method: HTTP GET with redirects
- Expected: HTTP 200 and Content-Type containing application/pdf. Microsoft rows are official HTML transcript pages, so text/html would be accepted for MSFT only if GET returns 200.
- Pattern: all direct PDF URLs passed; Microsoft official HTML transcript pages returned 403 to Node GET and are listed as failures.

## VZ

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2022 | 200 | application/pdf | 760705 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/62151/download?token=HC6WCwrP |
| FY Q2 2022 | 200 | application/pdf | 152644 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/62865/download?token=sjehxgfb |
| FY Q3 2022 | 200 | application/pdf | 756041 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/64425/download?token=BUiaOe0M |
| FY Q4 2022 | 200 | application/pdf | 745659 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/65603/download?token=DwhjI6ap |
| FY Q1 2023 | 200 | application/pdf | 759499 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/66881/download?token=DQQDczTF |
| FY Q2 2023 | 200 | application/pdf | 188036 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/67335/download?token=xX3vz8CD |
| FY Q3 2023 | 200 | application/pdf | 775482 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/68583/download?token=jZUCSp3S |
| FY Q4 2023 | 200 | application/pdf | 780752 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/69609/download?token=7JlmsuAz |
| FY Q1 2024 | 200 | application/pdf | 182009 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/70909/download?token=Q7bcBEuq |
| FY Q2 2024 | 200 | application/pdf | 212479 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/72035/download?token=fhg2UZfo |
| FY Q3 2024 | 200 | application/pdf | 248191 | PASS | PDF signature confirmed | https://www.verizon.com/about/sites/default/files/2024-10/VZ-Analyst-Meeting-Transcript-102224_0.pdf |
| FY Q4 2024 | 200 | application/pdf | 195255 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/74443/download?token=S12AI4uX |
| FY Q1 2025 | 200 | application/pdf | 851225 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/75373/download?token=zTlud4Fy |
| FY Q2 2025 | 200 | application/pdf | 208222 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/75853/download?token=I0qvRZQd |
| FY Q3 2025 | 200 | application/pdf | 186023 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/76679/download?token=ct6jo14C |
| FY Q4 2025 | 200 | application/pdf | 238182 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/77405/download?token=XTRzK52Y |
| FY Q1 2026 | 200 | application/pdf | 226519 | PASS | PDF signature confirmed | https://www.verizon.com/about/file/77847/download?token=DCOVBtyf |

## MSFT

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q3 2022 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2022/earnings-fy-2022-q3 |
| FY Q4 2022 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2022/earnings-fy-2022-q4 |
| FY Q1 2023 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2023/earnings-fy-2023-q1 |
| FY Q2 2023 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2023/earnings-fy-2023-q2 |
| FY Q3 2023 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2023/earnings-fy-2023-q3 |
| FY Q4 2023 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2023/earnings-fy-2023-q4 |
| FY Q1 2024 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2024/earnings-fy-2024-q1 |
| FY Q2 2024 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2024/earnings-fy-2024-q2 |
| FY Q3 2024 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2024/earnings-fy-2024-q3 |
| FY Q4 2024 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2024/earnings-fy-2024-q4 |
| FY Q1 2025 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2025/earnings-fy-2025-q1 |
| FY Q2 2025 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2025/earnings-fy-2025-q2 |
| FY Q3 2025 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2025/earnings-fy-2025-q3 |
| FY Q4 2025 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2025/earnings-fy-2025-q4 |
| FY Q1 2026 | 403 | text/html | 4410 | FAIL | unexpected response | https://www.microsoft.com/en-us/Investor/events/fy-2026/earnings-fy-2026-q1 |

## TRV

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2023 | 200 | application/pdf | 273432 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2023/q1/1Q23-TRV-Transcript.pdf |
| FY Q2 2023 | 200 | application/pdf | 632315 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2023/q2/2Q23-TRV-Transcript.pdf |
| FY Q3 2023 | 200 | application/pdf | 645288 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2023/q3/3q23-trv-transcript.pdf |
| FY Q1 2024 | 200 | application/pdf | 647554 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2024/q1/1q24-trv-transcript.pdf |
| FY Q2 2024 | 200 | application/pdf | 655718 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2024/q2/2q24-trv-transcript.pdf |
| FY Q3 2024 | 200 | application/pdf | 622663 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2024/q3/3Q24-TRV-Transcript.pdf |
| FY Q2 2025 | 200 | application/pdf | 635187 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2025/q2/2Q25-TRV-Transcript.pdf |
| FY Q3 2025 | 200 | application/pdf | 651477 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2025/q3/3Q25-TRV-Transcript.pdf |
| FY Q4 2025 | 200 | application/pdf | 647979 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2025/q4/4Q25-TRV-Transcript.pdf |
| FY Q1 2026 | 200 | application/pdf | 679498 | PASS | PDF signature confirmed | https://s26.q4cdn.com/410417801/files/doc_financials/2026/q1/1Q26-TRV-Transcript-1.pdf |

## V

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q2 2023 | 200 | application/pdf | 314582 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2023/q2/CORRECTED-TRANSCRIPT-Visa-Inc-V-US-Q2-2023-Earnings-Call-25-April-2023-500-PM-ET.pdf |
| FY Q4 2023 | 200 | application/pdf | 326998 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/Transcripts/2023/CORRECTED-TRANSCRIPT-Visa-Inc-V-US-Q4-2023-Earnings-Call-24-October-2023-500-PM-ET.pdf |
| FY Q2 2024 | 200 | application/pdf | 322080 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2024/q2/CORRECTED-TRANSCRIPT-Visa-Inc-V-US-Q2-2024-Earnings-Call-23-April-2024-500-PM-ET.pdf |
| FY Q3 2024 | 200 | application/pdf | 375306 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2024/q3/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q3-2024-Earnings-Call-23-July-2024-5_00-PM-ET.pdf |
| FY Q4 2024 | 200 | application/pdf | 322852 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2024/q4/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q4-2024-Earnings-Call-29-October-2024-5_00-PM-ET.pdf |
| FY Q1 2025 | 200 | application/pdf | 330680 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2025/q1/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q1-2025-Earnings-Call-30-January-2025-5_00-PM-ET.pdf |
| FY Q2 2025 | 200 | application/pdf | 319862 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2025/q2/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q2-2025-Earnings-Call-29-April-2025-5_00-PM-ET.pdf |
| FY Q3 2025 | 200 | application/pdf | 315072 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2025/q3/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q3-2025-Earnings-Call-29-July-2025-5_00-PM-ET.pdf |
| FY Q4 2025 | 200 | application/pdf | 323234 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2025/q4/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q4-2025-Earnings-Call-28-October-2025-5_00-PM-ET.pdf |
| FY Q1 2026 | 200 | application/pdf | 321411 | PASS | PDF signature confirmed | https://s1.q4cdn.com/050606653/files/doc_financials/2026/q1/CORRECTED-TRANSCRIPT_-Visa-Inc-V-US-Q1-2026-Earnings-Call-29-January-2026-5_00-PM-ET.pdf |

## JPM

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q3 2023 | 200 | application/pdf | 298525 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2023/3rd-quarter/jpm-3q23-earnings-call-transcript.pdf |
| FY Q4 2023 | 200 | application/pdf | 277787 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2023/4th-quarter/jpm-4q23-earnings-call-transcript.pdf |
| FY Q1 2024 | 200 | application/pdf | 311900 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2024/1st-quarter/jpm-1q24-earnings-call-transcript.pdf |
| FY Q2 2024 | 200 | application/pdf | 281486 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2024/2nd-quarter/jpm-2q24-earnings-call-transcript-final.pdf |
| FY Q3 2024 | 200 | application/pdf | 270589 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2024/3rd-quarter/jpmc-third-quarter-2024-earnings-conference-call-transcript.pdf |
| FY Q2 2025 | 200 | application/pdf | 582140 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2025/2nd-quarter/jpm-2q25-earnings-call-transcript.pdf |
| FY Q3 2025 | 200 | application/pdf | 552494 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2025/3rd-quarter/jpm-3q25-earnings-call-transcript.pdf |
| FY Q4 2025 | 200 | application/pdf | 562083 | PASS | PDF signature confirmed | https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2025/4th-quarter/jpm-4q25-earnings-call-transcript.pdf |

## MRK

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2024 | 200 | application/pdf | 186744 | PASS | PDF signature confirmed | https://s21.q4cdn.com/488056881/files/doc_financials/2024/q1/MRK-USQ_Transcript_2024-04-25.pdf |
| FY Q2 2024 | 200 | application/pdf | 219467 | PASS | PDF signature confirmed | https://s21.q4cdn.com/488056881/files/doc_financials/2024/q2/MRK-USQ_Transcript_2024-07-30.pdf |
| FY Q3 2024 | 200 | application/pdf | 195576 | PASS | PDF signature confirmed | https://s21.q4cdn.com/488056881/files/doc_financials/2024/q3/MRK-USQ_Transcript_2024-10-31.pdf |
| FY Q1 2025 | 200 | application/pdf | 202498 | PASS | PDF signature confirmed | https://s21.q4cdn.com/488056881/files/doc_financials/2025/q1/MRK-USQ_Transcript_2025-04-24.pdf |
| FY Q2 2025 | 200 | application/pdf | 190893 | PASS | PDF signature confirmed | https://www.merck.com/wp-content/uploads/sites/124/2025/07/MRK-USQ_Transcript_2025-07-29.pdf |
| FY Q3 2025 | 200 | application/pdf | 177060 | PASS | PDF signature confirmed | https://www.merck.com/wp-content/uploads/sites/124/2025/10/MRK-USQ_Transcript_2025-10-30.pdf |
| FY Q4 2025 | 200 | application/pdf | 227256 | PASS | PDF signature confirmed | https://www.merck.com/wp-content/uploads/sites/124/2026/02/MRK-USQ_Transcript_2026-02-03.pdf |
| FY Q1 2026 | 200 | application/pdf | 228726 | PASS | PDF signature confirmed | https://www.merck.com/wp-content/uploads/sites/124/2026/05/MRK-USQ_Transcript_2026-04-30.pdf |

## JNJ

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q2 2022 | 200 | application/pdf | 170912 | PASS | PDF signature confirmed | https://s203.q4cdn.com/636242992/files/doc_financials/2022/q2/Final-JNJ-Q2-2022-Earnings-Transcript.pdf |
| FY Q1 2023 | 200 | application/pdf | 168169 | PASS | PDF signature confirmed | https://s203.q4cdn.com/636242992/files/doc_financials/2023/q1/Final-JNJ-Q1-2023-Earnings-Transcript.pdf |
| FY Q3 2023 | 200 | application/pdf | 183263 | PASS | PDF signature confirmed | https://s203.q4cdn.com/636242992/files/doc_financials/2023/q3/Final-JNJ-Q3-2023-Earnings-Transcript.pdf |
| FY Q1 2026 | 200 | application/pdf | 230953 | PASS | PDF signature confirmed | https://s203.q4cdn.com/636242992/files/doc_financials/2026/q1/JNJ-USQ_Transcript_2026-04-14.pdf |

## AMGN

| Quarter | HTTP | Content-Type | Bytes | Verdict | Note | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q4 2022 | 200 | application/pdf | 283603 | PASS | PDF signature confirmed | https://investors.amgen.com/static-files/a900c41e-b93a-4e02-b04e-bb9b25d2f4d5 |

## Failure Patterns

- MSFT FY Q3 2022: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q4 2022: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q1 2023: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q2 2023: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q3 2023: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q4 2023: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q1 2024: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q2 2024: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q3 2024: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q4 2024: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q1 2025: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q2 2025: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q3 2025: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q4 2025: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
- MSFT FY Q1 2026: 403, text/html, unexpected response. A third-party fallback can be recovered from the previous manifest version if Claude Code does not want to keep the official HTML URL.
