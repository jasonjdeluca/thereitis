---
codex_staged: true
group: E/K
status: review_needed
target_path: none
notes: >
  Progress summary for Claude Code covering Codex work completed from the
  2026-05-29 inbox assignments. This file is a handoff note only; created
  files listed below are the applicable artifacts for review/promotion.
---
# Codex Progress Summary - 2026-05-30

Codex completed the Claude Code assignments from the 2026-05-29 inbox notes.

## Files Created

Company transcript research deposits:

- `codex/staging/company-research/AAPL.json`
- `codex/staging/company-research/NVDA.json`
- `codex/staging/company-research/AMZN.json`
- `codex/staging/company-research/CSCO.json`
- `codex/staging/company-research/HD.json`
- `codex/staging/company-research/IBM.json`
- `codex/staging/company-research/CRM.json`
- `codex/staging/company-research/KO.json`
- `codex/staging/company-research/WMT.json`
- `codex/staging/company-research/NKE.json`
- `codex/staging/company-research/DIS.json`
- `codex/staging/company-research/CAT.json`
- `codex/staging/company-research/BA.json`
- `codex/staging/company-research/HON.json`
- `codex/staging/company-research/MMM.json`
- `codex/staging/company-research/SHW.json`
- `codex/staging/company-research/MCD.json`

Launch copy draft:

- `codex/staging/docs/program/LAUNCH_KIT.md`

## Batch Summary

- Batch 1: AAPL, NVDA, AMZN, CSCO, HD
- Batch 2: IBM, CRM, KO, WMT, NKE
- Batch 3: DIS, CAT, BA, HON, MMM
- Batch 4: SHW, MCD

Each company research file contains 17 in-scope fiscal quarters covering FY Q1 2022 through FY Q1 2026.

## Important Review Notes

- The research deposits use the simplified source policy from `codex/inbox/source-policy-clarification-2026-05-29.md`: readable transcript text is accepted, and source classification is provenance rather than a blocker.
- Third-party rows retain `usage_caution`.
- Several companies with known official-source context still use structured StockAnalysis transcript URLs as fallback rows where direct official archive extraction was incomplete or blocked during this run. Those files are marked `review_needed`.
- A true row-by-row Markdown-table-vs-JSON reconciliation could not be performed because the repository did not contain the raw prior per-quarter Markdown tables or JSON blocks. Each ticker file includes a `reconciliation_notes` entry documenting that limitation.
- The launch kit is draft copy only and requires human review before publication.

## Verification Performed

- Validated that all 17 `codex/staging/company-research/*.json` files parse as JSON.
- Validated that each company research file has 17 quarter entries.
- Confirmed the local `codex/staging` branch was clean and synced with `origin/codex/staging` after pushing.

## Commits Pushed

- `a245c98` Add Codex company research batch 1
- `1b0f5b9` Add Codex company research batch 2
- `9852176` Add Codex company research batch 3
- `7d83fad` Add Codex company research batch 4
- `465c321` Add Codex launch kit draft
