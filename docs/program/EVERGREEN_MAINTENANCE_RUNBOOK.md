# There It Is — Evergreen Maintenance Runbook

Group H. Keeps transcript coverage fresh so no active company goes stale
between earnings seasons.

---

## What This System Does

Earnings calls happen quarterly. Each call produces a transcript with new
phrases. If we don't ingest the new transcript, the bingo cards become stale
— players hear the same phrases from an old call. This system detects staleness
before players notice it.

The system has three modes:

| Mode | When | Action |
|---|---|---|
| **Approaching** | Earnings within 14 days | Flag — confirm IR source URL exists |
| **Post-call watch** | Earnings passed 0–10 days ago | Flag — kick off ingestion run |
| **Stale** | 2+ quarters behind | Flag — escalate to Codex exception report |

---

## Data Flow

```
companies.next_earnings_date       ─┐
companies.latest_ingested_quarter  ─┤→ transcript-freshness.js → reports/transcript-freshness.json
companies.is_active                ─┘                                        │
                                                                             ▼
                                                               Codex weekly exception report
                                                               (posts GitHub issue)
```

The ops-worker/validator writes `latest_ingested_quarter` to the companies table
after each successful Stage 5 ingestion. The `next_earnings_date` column is
updated manually via the admin panel (`/gate`) when the company announces its
next call date.

---

## Quarter Format

`latest_ingested_quarter` uses the format: **`Q{1-4} YYYY`** (calendar quarter).

Examples: `Q1 2026`, `Q4 2025`, `Q2 2026`

The transcript-freshness.js script parses this as the end of the quarter:
- Q1 → March 31
- Q2 → June 30
- Q3 → September 30
- Q4 → December 31

---

## Staleness Thresholds

| Threshold | Quarters behind | Severity | Action |
|---|---|---|---|
| Fresh | 0–1 | OK | None |
| Approaching stale | 2 | Warning | Confirm next transcript source exists |
| Stale | 3+ | Critical | Prioritize ingestion run |
| Never ingested (active) | — | Critical | Block activation until ingested |

"Quarters behind" is calculated from the end of the latest ingested quarter to today,
rounded down to whole quarters.

---

## `transcript-freshness.js` — Script Reference

**Location:** `scripts/transcript-freshness.js`

**Input:** Supabase `companies` table — reads `id`, `name`, `is_active`,
`latest_ingested_quarter`, `next_earnings_date`.

**Output:** `reports/transcript-freshness.json`

**Exit code:** Exits with code `1` if any critical flags are found, `0` if only
warnings or no issues. This allows cron to detect critical states.

**Flags emitted:**

| Type | Severity | Condition |
|---|---|---|
| `never_ingested` | critical | `latest_ingested_quarter` is null for an active company |
| `stale_coverage` | critical | 3+ quarters since last ingestion |
| `approaching_stale` | warning | 2 quarters since last ingestion |
| `earnings_approaching` | warning/info | `next_earnings_date` within 14 days |
| `post_call_transcript_needed` | critical | `next_earnings_date` passed 0–10 days ago without fresh transcript |
| `missing_next_earnings_date` | warning | Active company has no `next_earnings_date` set |
| `unparseable_quarter` | warning | `latest_ingested_quarter` value cannot be parsed |

---

## Cron Schedule

Runs daily alongside the other Group B scripts. Added to both the 6:00am and 9:00pm ET slots:

```
# 6:00am ET
0 11 * * * cd /path/to/thereitis && node scripts/transcript-freshness.js >> /var/log/thereitis-cron.log 2>&1

# 9:00pm ET
0 2 * * * cd /path/to/thereitis && node scripts/transcript-freshness.js >> /var/log/thereitis-cron.log 2>&1
```

pm-packet.js also picks up critical and warning counts from transcript-freshness.json
when present — see `pm-packet.js` for aggregation logic.

---

## Post-Call Transcript Workflow

When `post_call_transcript_needed` is flagged:

1. Admin sets the new quarter's `next_earnings_date` in the admin panel if not already set.
2. Find the IR source URL for the new transcript — check the company's
   `source_manifest.json` for the quarter pattern, or check the company's IR site.
3. Add the new quarter row to `source_manifest.json`.
4. Run the ops-worker fetcher → extractor → validator for the company.
5. After Stage 5 completes, ops-worker writes `latest_ingested_quarter` to Supabase.
6. Next freshness check clears the flag.

**Note:** Automated HTTP checks against IR pages are not yet implemented (Phase 3).
Post-call detection is currently based on date arithmetic only. Manual IR page
checks are required to confirm a transcript PDF is available before running ingestion.

---

## Stale Company Escalation

The Codex weekly exception report reads `reports/transcript-freshness.json` every
Friday and posts a GitHub issue with:
- Companies in `stale` state with quarters behind count
- Companies in `approaching_stale` with upcoming call dates
- Companies with `post_call_transcript_needed`

See `docs/program/prompts/codex-stale-company-exception.md` for the Codex prompt.

---

## ops-worker Integration

The ops-worker/validator must write `latest_ingested_quarter` after Stage 5 success.
Format: `Q{N} YYYY` where N is the calendar quarter of the earnings call date and
YYYY is the year.

Example update call (inside validator, after successful migration SQL generation):
```js
await supabase
  .from("companies")
  .update({ latest_ingested_quarter: "Q1 2026" })
  .eq("id", company_id);
```

The ops-worker does not currently write this field. Wiring it is a follow-up ticket
once PR #20 is merged and the first full production run completes.

---

*Last updated: 2026-05-30*
