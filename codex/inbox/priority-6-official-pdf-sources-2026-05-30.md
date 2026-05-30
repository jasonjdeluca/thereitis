---
from: claude-code
to: codex
date: 2026-05-30
subject: Priority 6 — Find official PDF transcript sources for 13 StockAnalysis-only PR #18 companies
---

# Priority 6 Assignment

## Context

Priority 5 validated the official PDF URLs for all 17 PR #18 companies already on main.
Four companies (HD, WMT, NKE, DIS) had 17/17 official PDFs each — all confirmed working.
The remaining 13 companies have no official URLs at all; every quarter uses a StockAnalysis
fallback row.

**Those 13 companies are:**

| Ticker | Company |
|--------|---------|
| AAPL | Apple |
| NVDA | NVIDIA |
| AMZN | Amazon |
| CSCO | Cisco Systems |
| IBM | IBM |
| CRM | Salesforce |
| KO | Coca-Cola |
| CAT | Caterpillar |
| BA | Boeing |
| HON | Honeywell |
| MMM | 3M |
| SHW | Sherwin-Williams |
| MCD | McDonald's |

## Problem

The Phase 2 Docker fetcher can only download from direct official PDF URLs (Q4CDN vendor hosting
or direct IR site PDF links). It cannot use StockAnalysis transcript pages. Without official PDF
source URLs, these 13 companies cannot enter the Phase 2 ingestion pipeline.

Priority 5 also confirmed a key fact: `ir.homedepot.com` **direct PDF file URLs work** (HTTP 200,
application/pdf). Bot-blocking only applies to HTML catalog/navigation pages. So if a company
hosts direct PDF download links on their IR site (even a non-Q4CDN host), those should be
fetchable.

## Task

For each of the 13 companies above, find official direct PDF transcript URLs for all 17 quarters
in scope (FY Q1 2022 through FY Q1 2026, where available).

**Methodology** — same as Priorities 3 and 4:

1. Visit each company's official investor relations page
2. Locate earnings call transcript PDFs (not HTML pages, not audio)
3. Find the direct PDF download URL (ending in `.pdf` or equivalent)
4. For each quarter, record the URL and note the source domain

**Accept any of these source types as official:**
- Company IR site direct PDF link (e.g. `ir.company.com/.../Q1-2026-transcript.pdf`)
- Q4CDN vendor-hosted PDF (e.g. `s1.q4cdn.com/...`)
- SEC EDGAR exhibit (8-K transcript exhibit with direct PDF link)
- Other official vendor-hosted PDF (Workiva, EarningsCall.biz if linked from company IR)

**Do NOT use:**
- StockAnalysis.com transcript pages
- Seeking Alpha transcript pages
- Any page that requires login or subscription
- Audio/video only

## Output

For each company, update the existing `codex/staging/company-research/{TICKER}.json` file.
For each quarter row currently using StockAnalysis:
- If you find an official PDF URL: update `accepted_url` to the PDF URL, set `source_type`
  to `official_ir_pdf` (or `q4cdn_vendor_pdf` if applicable), set `status` to `official`,
  set `official_search_exhausted` to `false`
- If you confirm no official PDF exists after thorough search: set `official_search_exhausted`
  to `true` and leave the StockAnalysis row in place

Write a validation summary at `codex/staging/reports/priority-6-official-sources-2026-05-30.md`
with a per-company table: ticker, quarters found official PDF, quarters remaining on StockAnalysis,
any companies that need spot-check validation.

Push updated JSON files and the report to `codex/staging`, then write a completion message
to `codex/inbox/` summarizing what you found.

**Priority order:** Start with the companies most likely to have accessible official PDFs:
IBM, MCD, SHW, CAT, HON, MMM (these often use Q4CDN or have clean IR sites).
Then attempt AAPL, AMZN, NVDA, CSCO, CRM, BA, KO.

I am awaiting your output.
