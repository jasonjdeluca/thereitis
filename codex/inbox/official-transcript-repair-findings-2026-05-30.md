---
from: codex
to: claude-code
date: 2026-05-30
subject: Official transcript repair findings for HD, WMT, NKE, DIS
action_required: fyi
---

I completed the targeted source-integrity repair requested for the four company
research files on `codex/staging`:

- `codex/staging/company-research/HD.json`
- `codex/staging/company-research/WMT.json`
- `codex/staging/company-research/NKE.json`
- `codex/staging/company-research/DIS.json`

Commit pushed to `codex/staging`:

- `8f1ca06` - `Fix official transcript links for selected companies`

Scope honored:

- Only the four requested company JSON files were changed.
- No other company research files were touched.
- `LAUNCH_KIT.md` was not generated.
- No new company research was started.

Findings and outcome:

| Company | Official sources resolved | Third-party fallbacks | Unresolved |
| --- | ---: | ---: | ---: |
| HD | 17 | 0 | 0 |
| WMT | 17 | 0 | 0 |
| NKE | 17 | 0 | 0 |
| DIS | 17 | 0 | 0 |

Per-company notes:

- HD: Resolved all 17 rows to Home Depot-hosted transcript PDFs from the official quarterly earnings archive.
- WMT: Resolved all 17 rows to official `stock.walmart.com` management-call transcript PDF assets from Walmart's financial results archive.
- NKE: Resolved all 17 rows to Nike IR CDN transcript assets linked from official investor event/archive material. Two FY2022 rows are Nike-provided prepared/unofficial transcript PDFs because those were the official Nike-hosted transcript assets found for those quarters.
- DIS: Resolved all 17 rows to Disney-hosted or Disney IR CDN transcript PDFs from official investor results/event pages.

Validation performed:

- All four JSON files parse successfully.
- Each file still contains 17 quarter rows.
- No row in the four files remains classified as `third_party_transcript_provider`.
- No row has a missing `accepted_url`.
- No row keeps the contradictory combination of a third-party URL with `official_search_exhausted: false`.

Requested Q1 URLs after repair:

| Company | FY Q1 2025 accepted_url | FY Q1 2026 accepted_url |
| --- | --- | --- |
| HD | `https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-1q24-transcript.pdf` | `https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2025/hd-1q25-transcript.pdf` |
| WMT | `https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9485/transcript_management_call/Q1+2025+Earnings+Call.pdf` | `https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9953/transcript_management_call/Q1+2026+Earnings+Call.pdf` |
| NKE | `https://s1.q4cdn.com/806093406/files/doc_financials/2025/q1/NIKE-Inc-Q1FY25-OFFICIAL-Transcript_-FINAL.pdf` | `https://s1.q4cdn.com/806093406/files/doc_financials/2026/q1/NIKE-Inc-Q1FY26-OFFICIAL-Transcript_-FINAL.pdf` |
| DIS | `https://thewaltdisneycompany.com/app/uploads/2025/02/q1-fy25-earnings-transcript.pdf` | `https://s206.q4cdn.com/979796730/files/doc_events/2026/Feb/02/q1-fy26-earnings-transcript.pdf` |

Context note:

The requested handover file
`codex/staging/handover/codex-work-handover-2026-05-30.md` was not found locally
or via the GitHub connector on `codex/staging`. I proceeded using the explicit
task details supplied by Jason in the session.
