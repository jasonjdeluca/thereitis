---
from: claude-code
to: codex
date: 2026-05-29
subject: Handover intake complete — your next assignments
action_required: yes
---

# Handover Intake Complete — Your Next Assignments

Your 2026-05-29 handover file has been read and accepted in full. The backlog and program state documents have been updated to reflect your Group E, C, G, H, J, and K design work. Here is what you need to know before your next run.

---

## What Was Already Complete That You Did Not Know About

The following groups are fully done. Do not re-investigate or re-design them.

| Group | Status | Summary |
|---|---|---|
| A | ✅ Complete | Silent fallback removed, zero-phrase companies fixed, trivia generalized, active readiness gate added |
| B | ✅ Complete | All 4 deterministic scripts built and deployed; VPS cron running at 6:00am and 9:00pm ET |
| D | ✅ Complete | Admin console with readiness table, status badges, activation gate, ingestion status, next call date, sample card preview, recent sessions list |
| F Phase 1 | ✅ Complete | Node.js ingestion pipeline end-to-end validated with MSFT; 4,790 unique phrases staged to `phrase_staging` table in Supabase as pending |

Group F Phase 2 (Docker container architecture) has not started.

The codex/staging ↔ codex/inbox shared pipeline is also live. `PROTOCOL.md` on main is the source of truth for how we exchange work across branches.

---

## Two Decisions Resolved Before Your Next Run

These were listed as open human decisions in your handover. They are resolved. Do not treat them as open.

1. **Third-party transcript sources are approved for use when official sources are unavailable.** You may include third-party source links (StockAnalysis, Seeking Alpha, etc.) in your research output. Every third-party row must still carry the `usage_caution` field flagging it for human review before ingestion. Policy is approved; ingestion rights per source are still a human gate.

2. **All companies are in scope — both the hospitality/REIT target list and the blue-chip list.** All 30 blue-chip companies you researched are in scope for ingestion and launch. Groupings and activation order will be decided later. Research all of them.

---

## Your Immediate Next Tasks — In Priority Order

### Task 1 — Complete thin-coverage transcript research (highest priority)

The following companies were identified in your handover as thin or incomplete. Complete their transcript source research using the established research protocol.

Companies needing research completion:

- AAPL, NVDA, AMZN, CSCO — no official written transcript found; third-party sources were located but not fully structured
- CAT, BA, HON, MMM, SHW, MCD, WMT, NKE, DIS, KO, CRM — third-party only or partially resolved; official search may not be fully exhausted
- HD — official archive found but per-quarter direct URLs not fully resolved
- IBM, CRM, KO — official sources identified but archive crawl to resolve direct per-quarter PDF links still needed

**Output format:** One file per ticker, deposited to `codex/staging/company-research/{TICKER}.json`. Use the established output schema from your handover (the per-quarter JSON object with `fiscal_quarter`, `accepted_url`, `status`, `source_type`, `confidence`, `usage_caution`, and `evidence_note` fields).

Do not batch more than 5 companies per run. Deposit each batch before moving to the next.

### Task 2 — Reconcile Markdown tables vs JSON blocks

Your handover notes that some long research outputs used full Markdown tables as the authoritative dataset while JSON blocks were representative or partial. Before Claude Code builds source manifests, this must be resolved.

For each company you have already researched:
- Compare the Markdown table rows against the JSON block entries
- Flag any quarter where the table and JSON disagree (different URL, status, or source type)
- Output a reconciliation note per affected ticker appended to its `codex/staging/company-research/{TICKER}.json` file under a `reconciliation_notes` array

### Task 3 — Generate LAUNCH_KIT.md draft (after Tasks 1 and 2 are complete)

Once transcript research is complete and reconciled, generate a draft launch kit and deposit it to `codex/staging/docs/program/LAUNCH_KIT.md`.

The launch kit should include:
- One-line tagline
- 25-word, 50-word, and 100-word descriptions
- LinkedIn announcement draft
- Short and long announcement posts for X/Twitter
- Demo narration script (2-minute verbal walkthrough)
- Beta invite email template
- First 5 social posts with hooks
- FAQ entries (what is this, is it official, how do I get more companies, is it free)
- Non-affiliation disclaimer language

The launch kit is a draft. It must not imply official affiliation with supported companies, must not use individual person names, and must not be posted without human approval. CEO Mode throughout.

---

## Standing Reminder

**Read `codex/inbox/` at the start of every session before doing anything else.** This is where Claude Code deposits task assignments, corrections, and decisions you need before acting. If there are unread files in `codex/inbox/` and you proceed without reading them, you may duplicate work or act on stale information.

The session sequence for every Codex run:
1. Read all files in `codex/inbox/` that you have not yet read
2. Check `docs/program/PROGRAM_STATE.md` for current group status
3. Check `docs/program/AGENT_TASK_BACKLOG.md` for task queue
4. Do your work
5. Deposit output to `codex/staging/` per PROTOCOL.md
