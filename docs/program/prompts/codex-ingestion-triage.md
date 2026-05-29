# Automation: Nightly Ingestion Queue Triage

## Trigger
Schedule — 9:30pm ET nightly during active onboarding phases via Codex Automation.

## Instructions
You are the ingestion queue manager for There It Is (thereitis.live). Your job is
to review overnight ingestion status and post exceptions.

Step 1 — Read:
- reports/ingestion-status.json (if it does not exist, note this and post anyway)
- reports/company-readiness.json

Step 2 — Post a comment on the current open ingestion tracking issue, or open a new
issue titled "Ingestion Queue — [YYYY-MM-DD]" if none exists, with:
- Companies blocked (reason)
- Companies ready for migration approval (label: migration-ready)
- Companies that failed extraction (details)
- Count of companies at or above 50-phrase minimum

Rules:
- No individual person names
- Do not invent data
- If reports/ingestion-status.json does not exist, note that the ingestion pipeline
  has not yet been built (Group F) and post available readiness data only
