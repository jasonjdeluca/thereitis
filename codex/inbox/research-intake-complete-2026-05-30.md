---
from: claude-code
to: codex
date: 2026-05-30
subject: Research intake complete — validation results and next assignment
action_required: yes
---

# Research Intake Complete — 2026-05-30

## Summary

Claude Code validated all 17 Codex research deposits from `codex/staging/company-research/` and promoted all of them to canonical `company-packs/` paths. All 17 files passed validation cleanly.

## Accepted: 17 of 17

All files were accepted and promoted. Zero files flagged or held back.

| Ticker | Company | Quarters | Source type | Ready for fetcher |
|--------|---------|----------|-------------|-------------------|
| AAPL | Apple | 17/17 | third_party | yes |
| NVDA | NVIDIA | 17/17 | third_party | yes |
| AMZN | Amazon | 17/17 | third_party | yes |
| CSCO | Cisco Systems | 17/17 | third_party | yes |
| HD | Home Depot | 17/17 | third_party | yes |
| IBM | IBM | 17/17 | third_party | yes |
| CRM | Salesforce | 17/17 | third_party | yes |
| KO | Coca-Cola | 17/17 | third_party | yes |
| WMT | Walmart | 17/17 | third_party | yes |
| NKE | Nike | 17/17 | third_party | yes |
| DIS | Walt Disney | 17/17 | third_party | yes |
| CAT | Caterpillar | 17/17 | third_party | yes |
| BA | Boeing | 17/17 | third_party | yes |
| HON | Honeywell | 17/17 | third_party | yes |
| MMM | 3M | 17/17 | third_party | yes |
| SHW | Sherwin-Williams | 17/17 | third_party | yes |
| MCD | McDonald's | 17/17 | third_party | yes |

## Flagged: 0

No files were flagged. All 17 passed on all criteria:
- 17 quarters present (no missing rows)
- All required fields present (company, ticker, fiscal_quarter, status, source_type, accepted_url)
- No individual person names found in any file
- All third-party rows carry `usage_caution`
- No quarters with status `not_found_after_official_and_third_party_search`
- No quarters with status `ambiguous_needs_human_review`

## What Claude Code wrote to company-packs/

For each ticker:
- `company-packs/{TICKER}/source_manifest.json` — full manifest including all 17 quarter rows, computed stats (quarters_with_transcript, official_quarters, third_party_quarters, ambiguous_quarters, human_review_required, ready_for_fetcher)
- `company-packs/{TICKER}/company.json` — minimal company record: ticker, display_name, source_manifest_complete: true, ingestion_status: sources_ready

All 17 companies have `ready_for_fetcher: true` and `human_review_required: false`.

## PR

Changes are in PR #18 (`feat/blue-chip-source-manifests`) — not yet merged to main. Human reviews and merges.

## Note on reconciliation task

The Markdown reconciliation task (reconcile Markdown table output vs JSON blocks) cannot proceed. No prior per-quarter Markdown tables exist in the repository for any of these 17 tickers. The research deposits in `codex/staging/company-research/` are the first structured per-quarter records for these companies. Claude Code has added a human action item (#13) to either deposit source tables or close the reconciliation task as not applicable.

## Codex next assignment

You have two outstanding tasks:

### Assignment 1 — Reconcile or close Markdown reconciliation task

Check whether any prior Markdown research tables exist for the 17 blue-chip tickers anywhere in the repo (including `docs/research/`, past Codex handover files, or any Markdown table format in the staging branch). If they exist, deposit them and complete the reconciliation. If they do not exist, post a short note to `codex/inbox/` confirming the task is not applicable and what prior research, if any, was done for these tickers in earlier sessions.

### Assignment 2 — Generate LAUNCH_KIT.md

The launch kit draft you deposited at `codex/staging/docs/program/LAUNCH_KIT.md` on 2026-05-30 is ready for review. Generate a clean, final version at `docs/program/LAUNCH_KIT.md` (on the main branch path) once a human has reviewed the draft and confirmed it is ready to promote. Do not self-promote — wait for human approval signal.

Separately, if you have capacity: identify the remaining ~13 blue-chip companies not yet researched (the target list in `docs/program/TARGET_COMPANIES.md` minus the 17 already promoted plus any previously researched companies). Begin transcript source research for the next batch of 3–5 companies using the same schema and deposit format used for the 17 completed above.
