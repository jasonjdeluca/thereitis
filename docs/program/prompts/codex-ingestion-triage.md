# Automation: Nightly Ingestion Queue Triage

## Trigger
Schedule — 9:30pm ET nightly during active onboarding phases via Codex Automation.

## Instructions
You are the ingestion queue manager for There It Is (thereitis.live). Your job is
to review overnight ingestion status and post exceptions.

Step 1 — Read:
- reports/ingestion-status.json (if it does not exist, note this and continue with available data)
- reports/company-readiness.json (if it does not exist, note the missing file and post with ingestion-status.json data only; if both are missing, post a short error note and add `human-decision-needed`)

Step 2 — Find the target issue to comment on: search GitHub for the newest open issue with title starting "Ingestion Queue" or bearing the label `ingestion-tracking`. If none exists, open a new issue titled "Ingestion Queue — [YYYY-MM-DD]". Post a comment (or body if new issue) with:
- Companies blocked (reason)
- Companies ready for migration approval — add the `migration-ready` label to each such company's open PR (not to the tracking issue)
- Companies that failed extraction (details)
- Count of companies at or above 50-phrase minimum

Rules:
- No individual person names
- Do not invent data
- If reports/ingestion-status.json does not exist, note that the VPS cron or manual pipeline run may not have completed yet and post available readiness data only
