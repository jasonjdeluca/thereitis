# scripts/ — Deterministic Truth Layer

These four scripts form the Group B truth layer. They run unattended on a VPS cron schedule and write `reports/*.json` that all AI agents and Claude Code Routines read.

All scripts use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the environment. They exit with a non-zero code on any failure so cron can detect and report errors.

Reports are runtime artifacts — `reports/` is in `.gitignore`. Only `reports/.gitkeep` is tracked to ensure the directory exists in the repo.

---

## company-readiness.js

**Input:** Supabase `companies`, `phrases`, and `trivia_questions` tables.

**Output:** `reports/company-readiness.json`

Checks every company row for:
- Active status with zero phrases (critical)
- Any phrase exceeding 25 characters (critical)
- Missing emoji or name (critical)
- Missing `next_earnings_date` (warning)
- Missing `call_identifier` (warning)

Reports phrase count and trivia count per company, plus a summary of total, active, critical, and warning counts.

**Cron:** 6:00am ET and 9:00pm ET daily.

---

## content-validation.js

**Input:** Supabase `phrases` and `trivia_questions` tables.

**Output:** `reports/content-validation.json`

Checks all phrase content for:
- Phrases over 25 characters (critical)
- Blank or whitespace-only phrases (critical)
- Phrases appearing in more than one company (cross-company duplicate, warning)
- Phrases that appear to contain a person's first and last name — two consecutive Title-Case words not in an allowed list (review flag, not auto-rejected)
- Trivia rows missing one or more answer choices or a valid `correct_answer` field (critical)

**Cron:** 6:00am ET and 9:00pm ET daily.

---

## migration-check.js

**Input:** `supabase/migrations/` directory.

**Output:** `reports/migration-check.json`

Checks every `.sql` file in the migrations directory for:
- Filename format compliance (`YYYYMMDDHHMMSS_description.sql`)
- Duplicate timestamp prefixes
- Large gaps between consecutive migrations (over 30 days, warning)

No Supabase connection required — reads the local filesystem only.

**Cron:** 6:00am ET and 9:00pm ET daily.

---

## pm-packet.js

**Input:** `reports/company-readiness.json`, `reports/content-validation.json`, `reports/migration-check.json` (all must exist and be less than 2 hours old).

**Output:** `reports/pm-packet.json`

Aggregates the three reports into a single AI-readable summary packet with:
- `critical_issues` — all critical findings from all three reports
- `warnings` — all warnings
- `healthy_companies` — companies with no issues and at least one phrase
- `companies_below_50_phrases` — companies that have not reached the 50-phrase activation minimum
- `recommended_focus` — a plain-English one-sentence summary of the most important thing to fix right now, derived from the data

This packet is the input for the Claude Code Routine daily PM brief and Codex Automation overflow brief.

**Cron:** Runs after the other three at 6:15am ET and 9:15pm ET daily (allow 15 minutes for the three reports to complete).

---

## transcript-freshness.js

**Input:** Supabase `companies` table — `latest_ingested_quarter`, `next_earnings_date`, `is_active`.

**Output:** `reports/transcript-freshness.json`

Checks every company for transcript coverage health:
- Never ingested (active company, `latest_ingested_quarter` is null) — critical
- Stale coverage (3+ calendar quarters since last ingestion) — critical
- Approaching stale (2 quarters behind) — warning
- Earnings approaching within 14 days — info/warning
- Post-call transcript needed (earnings passed 0–10 days ago without updated quarter) — critical
- Active company missing `next_earnings_date` — warning

Exits with code 1 if any critical flags are present.

See `docs/program/EVERGREEN_MAINTENANCE_RUNBOOK.md` for the full field format and workflow.

**Cron:** 6:00am ET and 9:00pm ET daily (Group H).

---

## Cron Schedule (VPS)

```
# 6:00am ET — generate truth layer reports
0 11 * * * cd /path/to/thereitis && node scripts/company-readiness.js >> /var/log/thereitis-cron.log 2>&1
0 11 * * * cd /path/to/thereitis && node scripts/content-validation.js >> /var/log/thereitis-cron.log 2>&1
0 11 * * * cd /path/to/thereitis && node scripts/migration-check.js >> /var/log/thereitis-cron.log 2>&1
0 11 * * * cd /path/to/thereitis && node scripts/transcript-freshness.js >> /var/log/thereitis-cron.log 2>&1
15 11 * * * cd /path/to/thereitis && node scripts/pm-packet.js >> /var/log/thereitis-cron.log 2>&1

# 9:00pm ET — refresh before overnight AI runs
0 2 * * * cd /path/to/thereitis && node scripts/company-readiness.js >> /var/log/thereitis-cron.log 2>&1
0 2 * * * cd /path/to/thereitis && node scripts/content-validation.js >> /var/log/thereitis-cron.log 2>&1
0 2 * * * cd /path/to/thereitis && node scripts/migration-check.js >> /var/log/thereitis-cron.log 2>&1
0 2 * * * cd /path/to/thereitis && node scripts/transcript-freshness.js >> /var/log/thereitis-cron.log 2>&1
15 2 * * * cd /path/to/thereitis && node scripts/pm-packet.js >> /var/log/thereitis-cron.log 2>&1
```

Times above are UTC. 6:00am ET = 11:00 UTC (EST) / 10:00 UTC (EDT). Adjust for DST as needed.
