---
codex_staged: true
group: E
status: review_needed
target_path: reports/pr18-url-validation-2026-05-30.md
notes: Priority 5 GET validation for official URLs in PR #18 company-packs manifests on main.
---
# PR #18 URL Validation - 2026-05-30

## Summary

- Manifests checked from: origin/main company-packs/{ticker}/source_manifest.json
- Companies checked: 17
- Official URLs validated: 68
- Passed: 68
- Failed: 0
- Method: HTTP GET with redirects; expected HTTP 200, Content-Type containing application/pdf, and PDF magic-byte signature.

## Company Summary

| Ticker | Company | Rows | Official rows | Third-party rows | Status |
| --- | --- | ---: | ---: | ---: | --- |
| AAPL | Apple | 17 | 0 | 17 | no_official_urls_to_validate |
| NVDA | NVIDIA | 17 | 0 | 17 | no_official_urls_to_validate |
| AMZN | Amazon | 17 | 0 | 17 | no_official_urls_to_validate |
| CSCO | Cisco Systems | 17 | 0 | 17 | no_official_urls_to_validate |
| HD | Home Depot | 17 | 17 | 0 | 17/17 official URLs passed |
| IBM | IBM | 17 | 0 | 17 | no_official_urls_to_validate |
| CRM | Salesforce | 17 | 0 | 17 | no_official_urls_to_validate |
| KO | Coca-Cola | 17 | 0 | 17 | no_official_urls_to_validate |
| WMT | Walmart | 17 | 17 | 0 | 17/17 official URLs passed |
| NKE | Nike | 17 | 17 | 0 | 17/17 official URLs passed |
| DIS | Walt Disney | 17 | 17 | 0 | 17/17 official URLs passed |
| CAT | Caterpillar | 17 | 0 | 17 | no_official_urls_to_validate |
| BA | Boeing | 17 | 0 | 17 | no_official_urls_to_validate |
| HON | Honeywell | 17 | 0 | 17 | no_official_urls_to_validate |
| MMM | 3M | 17 | 0 | 17 | no_official_urls_to_validate |
| SHW | Sherwin-Williams | 17 | 0 | 17 | no_official_urls_to_validate |
| MCD | McDonald's | 17 | 0 | 17 | no_official_urls_to_validate |

## AAPL

no_official_urls_to_validate

## NVDA

no_official_urls_to_validate

## AMZN

no_official_urls_to_validate

## CSCO

no_official_urls_to_validate

## HD

| Quarter | HTTP | Content-Type | Bytes | Verdict | Fallback | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2022 | 200 | application/pdf | 269328 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/Copy%20of%20HD%201Q21%20Transcript_vF.pdf |
| FY Q2 2022 | 200 | application/pdf | 281985 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/2Q21/HD%202Q21%20Transcript_v1.pdf |
| FY Q3 2022 | 200 | application/pdf | 307954 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/hd-3q21-transcript-v4.pdf |
| FY Q4 2022 | 200 | application/pdf | 387423 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/hd-4q21-transcript-v2.pdf |
| FY Q1 2023 | 200 | application/pdf | 294352 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/The%20Home%20Depot%201Q22%20Transcript_v2.pdf |
| FY Q2 2023 | 200 | application/pdf | 306508 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q22-transcript.pdf |
| FY Q3 2023 | 200 | application/pdf | 310798 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/2022%20HD%203Q22%20Transcript.pdf |
| FY Q4 2023 | 200 | application/pdf | 279049 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/2022/2022_4Q_Transcript_v2.pdf |
| FY Q1 2024 | 200 | application/pdf | 310859 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-1q23-transcript.pdf |
| FY Q2 2024 | 200 | application/pdf | 306833 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q23-transcript.pdf |
| FY Q3 2024 | 200 | application/pdf | 373587 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-3q23-transcript-v1.pdf |
| FY Q4 2024 | 200 | application/pdf | 313901 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-4q23-transcript.pdf |
| FY Q1 2025 | 200 | application/pdf | 308274 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-1q24-transcript.pdf |
| FY Q2 2025 | 200 | application/pdf | 329334 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q24-transcript.pdf |
| FY Q3 2025 | 200 | application/pdf | 312857 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/2024/HD_3Q24_Transcript_vf2.pdf |
| FY Q4 2025 | 200 | application/pdf | 334414 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-4q24-transcript.pdf |
| FY Q1 2026 | 200 | application/pdf | 332493 | PASS | no_fallback_available | https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2025/hd-1q25-transcript.pdf |

## IBM

no_official_urls_to_validate

## CRM

no_official_urls_to_validate

## KO

no_official_urls_to_validate

## WMT

| Quarter | HTTP | Content-Type | Bytes | Verdict | Fallback | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2022 | 200 | application/pdf | 416852 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9473/transcript_management_call/Q1+2022+Earnings+Call.pdf |
| FY Q2 2022 | 200 | application/pdf | 316749 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9474/transcript_management_call/Q2+2022+Earnings+Call.pdf |
| FY Q3 2022 | 200 | application/pdf | 320987 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9475/transcript_management_call/Q3+2022+Earnings+Call.pdf |
| FY Q4 2022 | 200 | application/pdf | 313750 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9476/transcript_management_call/Q4+2022+Earnings+Call.pdf |
| FY Q1 2023 | 200 | application/pdf | 326459 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9477/transcript_management_call/Q1+2023+Earnings+Call.pdf |
| FY Q2 2023 | 200 | application/pdf | 340601 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9478/transcript_management_call/Q2+2023+Earnings+Call.pdf |
| FY Q3 2023 | 200 | application/pdf | 339818 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9479/transcript_management_call/Q3+2023+Earnings+Call.pdf |
| FY Q4 2023 | 200 | application/pdf | 348620 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9480/transcript_management_call/Q4+2023+Earnings+Call.pdf |
| FY Q1 2024 | 200 | application/pdf | 337730 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9481/transcript_management_call/Q1+2024+Earnings+Call.pdf |
| FY Q2 2024 | 200 | application/pdf | 447926 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9482/transcript_management_call/Q2+2024+Earnings+Call.pdf |
| FY Q3 2024 | 200 | application/pdf | 353259 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9483/transcript_management_call/Q3+2024+Earnings+Call.pdf |
| FY Q4 2024 | 200 | application/pdf | 218772 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9484/transcript_management_call/Q4+2024+Earnings+Call.pdf |
| FY Q1 2025 | 200 | application/pdf | 333022 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9485/transcript_management_call/Q1+2025+Earnings+Call.pdf |
| FY Q2 2025 | 200 | application/pdf | 325674 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9486/transcript_management_call/Q2+2025+Earnings+Call.pdf |
| FY Q3 2025 | 200 | application/pdf | 346430 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9487/transcript_management_call/Q3+2025+Earnings+Call.pdf |
| FY Q4 2025 | 200 | application/pdf | 339403 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9939/transcript_management_call/Q4+2025+Earnings+Call.pdf |
| FY Q1 2026 | 200 | application/pdf | 339737 | PASS | no_fallback_available | https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9953/transcript_management_call/Q1+2026+Earnings+Call.pdf |

## NKE

| Quarter | HTTP | Content-Type | Bytes | Verdict | Fallback | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2022 | 200 | application/pdf | 246323 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2022/q1/FY-2022-Q1-Earnings-Release-Conference-Call-OFFICIAL-Transcipt-FINAL.pdf |
| FY Q2 2022 | 200 | application/pdf | 208142 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2022/q2/NIKE-Inc-Q2FY22UNOFFICIAL-Transcript.pdf |
| FY Q3 2022 | 200 | application/pdf | 218839 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2022/q3/NIKE-Inc-Q3FY22-UNOFFICAL-Transcript.pdf |
| FY Q4 2022 | 200 | application/pdf | 176515 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2022/q4/NIKE-Inc.-Q4FY22-OFFICIAL-Transcript-FINAL.pdf |
| FY Q1 2023 | 200 | application/pdf | 169919 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2023/q1/NIKE-Inc.-Q1FY23-OFFICIAL-Transcript-FINAL.pdf |
| FY Q2 2023 | 200 | application/pdf | 227944 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2022/q4/NIKE-Inc.-Q2FY23-OFFICIAL-Transcript-FINAL.pdf |
| FY Q3 2023 | 200 | application/pdf | 180498 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2023/q3/NIKE-Inc-Q3FY23-OFFICIAL-Transcript-FINAL.pdf |
| FY Q4 2023 | 200 | application/pdf | 208488 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2023/q4/NIKE-Inc-Q4FY23-OFFICIAL-Transcript.pdf |
| FY Q1 2024 | 200 | application/pdf | 176751 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2024/q1/NIKE-Inc-Q1FY24-OFFICIAL-Transcript.pdf |
| FY Q2 2024 | 200 | application/pdf | 251898 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2024/q2/NIKE-Inc-Q2FY24-OFFICIAL-Transcript_FINAL.pdf |
| FY Q3 2024 | 200 | application/pdf | 199006 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2024/q3/NIKE-Inc-Q3FY24-OFFICIAL-Transcript-FINAL.pdf |
| FY Q4 2024 | 200 | application/pdf | 167885 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2024/q4/NIKE-Inc-Q4FY24-OFFICIAL-Transcript_FINAL.pdf |
| FY Q1 2025 | 200 | application/pdf | 175320 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2025/q1/NIKE-Inc-Q1FY25-OFFICIAL-Transcript_-FINAL.pdf |
| FY Q2 2025 | 200 | application/pdf | 178156 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2025/q2/NIKE-Inc-Q2FY25-OFFICIAL-Transcript_-FINAL.pdf |
| FY Q3 2025 | 200 | application/pdf | 181870 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2025/q3/NIKE-Inc-Q3FY25-OFFICIAL-Transcript_-FINAL.pdf |
| FY Q4 2025 | 200 | application/pdf | 203844 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2025/q4/NIKE-Inc-Q4FY25-OFFICIAL-Transcript_-FINAL.pdf |
| FY Q1 2026 | 200 | application/pdf | 206808 | PASS | no_fallback_available | https://s1.q4cdn.com/806093406/files/doc_financials/2026/q1/NIKE-Inc-Q1FY26-OFFICIAL-Transcript_-FINAL.pdf |

## DIS

| Quarter | HTTP | Content-Type | Bytes | Verdict | Fallback | URL |
| --- | ---: | --- | ---: | --- | --- | --- |
| FY Q1 2022 | 200 | application/pdf | 412545 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2022/03/q1-fy22-earnings-transcript.pdf |
| FY Q2 2022 | 200 | application/pdf | 445182 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2022/04/q2-fy22-earnings-transcript.pdf |
| FY Q3 2022 | 200 | application/pdf | 435092 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2022/07/q3-fy22-earnings-transcript.pdf |
| FY Q4 2022 | 200 | application/pdf | 478216 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2022/11/q4-fy22-earnings-transcript.pdf |
| FY Q1 2023 | 200 | application/pdf | 511876 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2023/01/q1-fy23-earnings-transcript.pdf |
| FY Q2 2023 | 200 | application/pdf | 797661 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2023/05/q2-fy23-earnings-transcript.pdf |
| FY Q3 2023 | 200 | application/pdf | 421433 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2023/08/q3-fy23-earnings-transcript.pdf |
| FY Q4 2023 | 200 | application/pdf | 455839 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2023/11/q4-fy23-earnings-transcript.pdf |
| FY Q1 2024 | 200 | application/pdf | 439666 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2024/01/q1-fy24-earnings-transcript.pdf |
| FY Q2 2024 | 200 | application/pdf | 403536 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2024/05/q2-fy24-earnings-transcript.pdf |
| FY Q3 2024 | 200 | application/pdf | 310248 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2024/08/q3-fy24-earnings-transcript.pdf |
| FY Q4 2024 | 200 | application/pdf | 399165 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2024/11/q4-fy24-earnings-transcript.pdf |
| FY Q1 2025 | 200 | application/pdf | 739192 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2025/02/q1-fy25-earnings-transcript.pdf |
| FY Q2 2025 | 200 | application/pdf | 336227 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2025/05/q2-fy25-earnings-transcript.pdf |
| FY Q3 2025 | 200 | application/pdf | 717776 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2025/08/q3-fy25-earnings-transcript.pdf |
| FY Q4 2025 | 200 | application/pdf | 729850 | PASS | no_fallback_available | https://thewaltdisneycompany.com/app/uploads/2025/11/q4-fy25-earnings-transcript.pdf |
| FY Q1 2026 | 200 | application/pdf | 763153 | PASS | no_fallback_available | https://s206.q4cdn.com/979796730/files/doc_events/2026/Feb/02/q1-fy26-earnings-transcript.pdf |

## CAT

no_official_urls_to_validate

## BA

no_official_urls_to_validate

## HON

no_official_urls_to_validate

## MMM

no_official_urls_to_validate

## SHW

no_official_urls_to_validate

## MCD

no_official_urls_to_validate

## Failures

No official URL failures found. No targeted repair pass was needed.
