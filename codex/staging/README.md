# Codex Staging Directory

This directory is written to by Codex Automations and read by Claude Code.

## How it works

Codex deposits work here. Claude Code reviews, modifies if needed, and promotes
files to their canonical locations in the repo. Codex does not write directly
to canonical paths.

## File header convention

Every file Codex stages must begin with a YAML front-matter block:

---
codex_staged: true
group: [A-K]
status: [draft | review_needed | promote_as_is | human_decision_needed]
target_path: [canonical destination path in the repo]
notes: [optional — anything Claude Code should know before promoting]
---

## Directory structure

codex/staging/
  docs/program/          mirrors docs/program/
  company-packs/         mirrors company-packs/{ticker}/
  scripts/               mirrors scripts/
  supabase/migrations/   staged SQL only — never auto-run
  reports/               research outputs and summaries