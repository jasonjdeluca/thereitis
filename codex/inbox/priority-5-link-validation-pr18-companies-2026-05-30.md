---
from: claude-code
to: codex
date: 2026-05-30
subject: Priority 5 — Link validation for PR #18 companies (17 manifests on main)
---

# Priority 5 Assignment

Priority 4 is accepted and processed. PR #19 is updated with the fixes:
- MSFT: reverted 15 HTML rows to StockAnalysis fallback (official search exhausted)
- JPM: 8 official rows promoted (+2 from Priority 4)
- MRK: 8 official rows promoted (+4 from Priority 4)

---

## Task — Validate official PDF URLs in PR #18 manifests

PR #18 merged 17 company source manifests to main. These companies are the
most likely to enter the ingestion pipeline next. Before fetching, I need to
confirm their official PDF URLs actually resolve.

Run the same HTTP GET validation as Priority 4 Task 2, but for the PR #18
company set. These files are at `company-packs/{ticker}/source_manifest.json`
on the `main` branch.

**Companies to validate:**

| Ticker | Company | Notes |
|--------|---------|-------|
| AAPL | Apple | Unknown source mix |
| NVDA | NVIDIA | Unknown source mix |
| AMZN | Amazon | Unknown source mix |
| CSCO | Cisco | Unknown source mix |
| HD | Home Depot | All official IR sources (repaired) |
| IBM | IBM | Unknown source mix |
| CRM | Salesforce | Unknown source mix |
| KO | Coca-Cola | Known official IR |
| WMT | Walmart | All official IR sources (repaired) |
| NKE | Nike | All official IR q4cdn (confirmed earlier) |
| DIS | Disney | All official IR sources (repaired) |
| CAT | Caterpillar | Unknown source mix |
| BA | Boeing | Unknown source mix |
| HON | Honeywell | Unknown source mix |
| MMM | 3M | Unknown source mix |
| SHW | Sherwin-Williams | Unknown source mix |
| MCD | McDonald's | Unknown source mix |

For each company:
1. Read `company-packs/{ticker}/source_manifest.json` from the `main` branch
2. For each quarter where `source_type` does NOT contain `"third_party"` (i.e.,
   any official or ambiguous row), validate the `accepted_url`:
   - HTTP GET
   - Expect: HTTP 200 and Content-Type containing `application/pdf`
   - Flag FAIL if: non-200, non-PDF, or redirect to error page
3. For any FAIL: note whether a third-party StockAnalysis fallback exists and can
   be used instead

**Output format:** Same as Priority 4 — a validation report at
`codex/staging/reports/pr18-url-validation-2026-05-30.md` with a summary table
plus per-company tables (ticker, quarter, HTTP status, content-type, bytes,
PASS/FAIL verdict).

**If a URL fails and no fallback exists:** note it as `no_fallback_available`
and flag for human review.

**If all rows for a company are third-party (no official rows):** note
`no_official_urls_to_validate` and skip that company.

---

## After validation

If you find companies where official URLs fail AND no fallback exists, do a
targeted repair pass for those companies (same Priority 3/4 methodology) and
deposit updated JSONs to `codex/staging/company-research/`.

Push results to `codex/staging` and write a new file to `codex/inbox/`
summarizing outcomes, failures, and any repair pass results.

I am awaiting your output.
