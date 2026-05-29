# Group F — Ingestion Pipeline (Phase 1)

Deterministic transcript → candidate phrase → staging pipeline. The only data
that ever reaches the live `phrases` table is what a human approves in the admin
**Phrase Staging Review** panel. No AI runs in this Phase 1 pipeline — all
filtering is rule-based Node.js. (Stage-4 AI enrichment described in the Program
Charter is deferred to Phase 2.)

## Scripts

| Script | Stage | Purpose |
|---|---|---|
| `queue-builder.js` | 0 | Reads `docs/research/transcript-sources.json`, seeds the SQLite queue. Phase 1 companies (MSFT, JPM, VZ, TRV, MRK, GS, AXP) get per-quarter rows with resolved URLs; every other `ready` + non-review company gets one deferred `pending-crawl` row. |
| `fetcher.js` | 1 | Fetches `pending` rows that have a URL, extracts text (HTML via cheerio, PDF via pdf-parse), saves to `data/raw/{ticker}/`, marks rows `fetched` / `failed`. 1.5s delay between requests. |
| `extractor.js` | 2 | Generates 2–5 word n-gram candidate phrases, scores by frequency + business-term boost, flags possible person names. Writes the `candidates` table. |
| `validator.js` | 3 | Applies deterministic validation rules (length, blank, person name, all-caps, single-word). Flags `duplicate_in_live` against the Supabase `phrases` table (flag only, not a rejection). |
| `staging-writer.js` | 4 | Upserts valid candidates into the Supabase `phrase_staging` table as `pending` for human review. |
| `run-pipeline.js` | — | Orchestrator. Runs all five stages for a single ticker and prints a summary table. |

`lib/common.js` holds shared config: env loading, the SQLite schema, the
Supabase client, the ticker → `company_id` map, the calendar quarter range, and
the NLP constant lists.

## Run order

```bash
# Whole queue:
node scripts/ingestion/queue-builder.js        # seed all eligible companies
node scripts/ingestion/fetcher.js --limit 50   # fetch up to 50 pending rows
node scripts/ingestion/extractor.js            # extract candidates
node scripts/ingestion/validator.js            # validate + dup-flag
node scripts/ingestion/staging-writer.js       # write to phrase_staging

# Single ticker, end-to-end:
node scripts/ingestion/run-pipeline.js --ticker MSFT
```

Most scripts accept `--ticker <TICKER>` to scope to one company. `fetcher.js`
also accepts `--limit <N>` (default 50; the orchestrator runs it with no limit).

## Prerequisites

- `.env` at the repo root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  (already present; not committed). Scripts load it via `dotenv`.
- npm packages: `better-sqlite3`, `pdf-parse`, `cheerio`, `node-fetch`,
  `dotenv` (all in `devDependencies`).
- The `phrase_staging` table must exist before `staging-writer.js` can write.
  Run the Task 1 migration SQL in the Supabase dashboard first (output is in the
  PR description). Until then `staging-writer` reports a clear notice and the
  orchestrator stops after the validator stage.

## `data/` directory structure

`data/` is git-ignored (runtime artifacts only).

```
data/
  ingestion-queue.db          SQLite — queue + candidates tables
  raw/
    {TICKER}/
      Q1-2022.txt             extracted plain text per quarter
      Q1-2022.pdf             original PDF (PDF sources only)
      ...
```

## Schema discrepancies handled (Phase 1)

These differ from the literal task spec because the live DB schema required it —
flagged here and in the PR for the human:

1. **`companies` has no `ticker` column.** The Task 1 seed INSERTs and the
   staging-writer's "look up company by ticker" were adapted: `company_id` is
   the lowercase ticker, except the hotel companies that already exist under
   word-slug ids (MAR→`marriott`, H→`hyatt`, WH→`wyndham`, CHH→`choice`,
   KO→`ko`). See `TICKER_TO_COMPANY_ID` in `lib/common.js`.
2. **`phrases.tier` and `phrases.points` are NOT NULL with no default.** The
   admin approve action inserts a default `tier`/`points` so the insert succeeds
   (see `Admin.jsx`).

## Phase 2 (not built here)

- **Archive crawling** for `pending-crawl` rows (companies without a resolvable
  per-quarter URL pattern — most of the `ready` list). These need an index-page
  crawler to resolve direct transcript URLs.
- **Python NLP upgrade** — the Charter's Stage 2 calls for pdfplumber + a richer
  tokenizer/NER in a Python container. Phase 1 uses a Node.js n-gram extractor.
- **AI enrichment (Stage 4)** — Claude Haiku / GPT-4o-mini ranking of candidates
  before staging. Phase 1 stages all valid candidates for manual review instead.
- **GitHub PR auto-generation** of migration SQL from the validated output.
