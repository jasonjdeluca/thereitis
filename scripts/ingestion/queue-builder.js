#!/usr/bin/env node
// queue-builder.js — Stage 0.
// Reads docs/research/transcript-sources.json and seeds the SQLite ingestion
// queue. Phase 1 companies get per-quarter rows with resolved URLs; every other
// ready company gets a single deferred 'pending-crawl' row.

import { fileURLToPath } from "url";
import path from "path";
import { readFileSync } from "fs";
import {
  getDb,
  log,
  logError,
  companyIdForTicker,
  quarterRange,
  quarterLabel,
  TWO_DIGIT,
  SOURCES_PATH,
} from "./lib/common.js";

const ORDINAL = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

// ─── Phase 1 per-quarter URL builders ────────────────────────────────────────
// Each returns rows: { fiscal_quarter, call_date, url, source_type, fetch_status }

function buildMsft() {
  // Positional mapping: calendar Q{N} {YYYY} → Microsoft fiscal FY{YYYY} Q{N}.
  return quarterRange().map(({ q, year }) => ({
    fiscal_quarter: quarterLabel(q, year),
    call_date: null,
    url: `https://www.microsoft.com/en-us/investor/events/fy-${year}/earnings-fy-${year}-q${q}`,
    source_type: "html",
    fetch_status: "pending",
  }));
}

function buildJpm() {
  return quarterRange().map(({ q, year }) => {
    const yy = TWO_DIGIT(year);
    const base = `https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/${year}/${ORDINAL[q]}-quarter/`;
    const file =
      year === 2022
        ? `jpm-${q}q${yy}-earnings-call-transcript.pdf`
        : `${q}q${yy}-earnings-transcript.pdf`;
    return {
      fiscal_quarter: quarterLabel(q, year),
      call_date: null,
      url: base + file,
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

function buildVz() {
  // Direct PDF download URLs from company-packs/VZ/source_manifest.json.
  // Confirmed HTTP 200 + application/pdf by Codex Priority 4 validation.
  const urls = {
    "Q1 2022": "https://www.verizon.com/about/file/62151/download?token=HC6WCwrP",
    "Q2 2022": "https://www.verizon.com/about/file/62865/download?token=sjehxgfb",
    "Q3 2022": "https://www.verizon.com/about/file/64425/download?token=BUiaOe0M",
    "Q4 2022": "https://www.verizon.com/about/file/65603/download?token=DwhjI6ap",
    "Q1 2023": "https://www.verizon.com/about/file/66881/download?token=DQQDczTF",
    "Q2 2023": "https://www.verizon.com/about/file/67335/download?token=xX3vz8CD",
    "Q3 2023": "https://www.verizon.com/about/file/68583/download?token=jZUCSp3S",
    "Q4 2023": "https://www.verizon.com/about/file/69609/download?token=7JlmsuAz",
    "Q1 2024": "https://www.verizon.com/about/file/70909/download?token=Q7bcBEuq",
    "Q2 2024": "https://www.verizon.com/about/file/72035/download?token=fhg2UZfo",
    "Q3 2024": "https://www.verizon.com/about/sites/default/files/2024-10/VZ-Analyst-Meeting-Transcript-102224_0.pdf",
    "Q4 2024": "https://www.verizon.com/about/file/74443/download?token=S12AI4uX",
    "Q1 2025": "https://www.verizon.com/about/file/75373/download?token=zTlud4Fy",
    "Q2 2025": "https://www.verizon.com/about/file/75853/download?token=I0qvRZQd",
    "Q3 2025": "https://www.verizon.com/about/file/76679/download?token=ct6jo14C",
    "Q4 2025": "https://www.verizon.com/about/file/77405/download?token=XTRzK52Y",
    "Q1 2026": "https://www.verizon.com/about/file/77847/download?token=DCOVBtyf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const key = `Q${q} ${year}`;
    return {
      fiscal_quarter: label,
      call_date: null,
      url: urls[key] || null,
      source_type: "pdf",
      fetch_status: urls[key] ? "pending" : "failed",
    };
  });
}

function buildTrv() {
  const exceptions = {
    "Q2 2024":
      "https://investor.travelers.com/files/doc_financials/2024/q2/2q24-trv-transcriptv2.pdf",
    "Q4 2024":
      "https://s26.q4cdn.com/410417801/files/doc_financials/2024/q4/4Q24-Earnings-Call-Transcript.pdf",
    "Q1 2026":
      "https://s26.q4cdn.com/410417801/files/doc_financials/2026/q1/1Q26-TRV-Transcript-1.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const yy = TWO_DIGIT(year);
    const url =
      exceptions[label] ||
      `https://s26.q4cdn.com/410417801/files/doc_financials/${year}/q${q}/${q}Q${yy}-TRV-Transcript.pdf`;
    return {
      fiscal_quarter: label,
      call_date: null,
      url,
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

// Merck — call dates drive the filename and directory year.
const MRK_DATES = {
  "Q1 2022": "2022-04-28", "Q2 2022": "2022-07-28", "Q3 2022": "2022-10-27",
  "Q4 2022": "2023-02-02", "Q1 2023": "2023-04-27", "Q2 2023": "2023-07-27",
  "Q3 2023": "2023-10-26", "Q4 2023": "2024-01-25", "Q1 2024": "2024-04-25",
  "Q2 2024": "2024-07-25", "Q3 2024": "2024-10-24", "Q4 2024": "2025-02-04",
  "Q1 2025": "2025-04-24", "Q2 2025": "2025-07-24", "Q3 2025": "2025-10-23",
  "Q4 2025": "2026-01-22", "Q1 2026": "2026-04-24",
};

function buildMrk() {
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const date = MRK_DATES[label];
    const [Y, M, D] = date.split("-");
    return {
      fiscal_quarter: label,
      call_date: date,
      url: `https://s21.q4cdn.com/488056881/files/doc_financials/${Y}/q${q}/MRK-USQ_Transcript_${Y}-${M}-${D}.pdf`,
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

// Goldman Sachs — fully hardcoded URLs (no consistent pattern).
const GS_URLS = {
  "Q1 2022": "https://www.fool.com/earnings/call-transcripts/2022/04/14/goldman-sachs-gs-q1-2022-earnings-transcript/",
  "Q2 2022": "https://www.fool.com/earnings/call-transcripts/2022/07/18/goldman-sachs-gs-q2-2022-earnings-transcript/",
  "Q3 2022": "https://www.fool.com/earnings/call-transcripts/2022/10/17/goldman-sachs-gs-q3-2022-earnings-transcript/",
  "Q4 2022": "https://www.fool.com/earnings/call-transcripts/2023/01/17/goldman-sachs-gs-q4-2022-earnings-transcript/",
  "Q1 2023": "https://www.fool.com/earnings/call-transcripts/2023/04/18/goldman-sachs-gs-q1-2023-earnings-transcript/",
  "Q2 2023": "https://www.fool.com/earnings/call-transcripts/2023/07/19/goldman-sachs-gs-q2-2023-earnings-transcript/",
  "Q3 2023": "https://www.fool.com/earnings/call-transcripts/2023/10/17/goldman-sachs-gs-q3-2023-earnings-transcript/",
  "Q4 2023": "https://www.fool.com/earnings/call-transcripts/2024/01/16/goldman-sachs-gs-q4-2023-earnings-transcript/",
  "Q1 2024": "https://www.fool.com/earnings/call-transcripts/2024/04/15/goldman-sachs-gs-q1-2024-earnings-transcript/",
  "Q2 2024": "https://www.fool.com/earnings/call-transcripts/2024/07/15/goldman-sachs-gs-q2-2024-earnings-transcript/",
  "Q3 2024": "https://www.fool.com/earnings/call-transcripts/2024/10/15/goldman-sachs-gs-q3-2024-earnings-transcript/",
  "Q4 2024": "https://www.nasdaq.com/articles/goldman-sachs-gs-q4-2025-earnings-transcript",
  "Q1 2025": "https://www.fool.com/earnings/call-transcripts/2025/04/14/goldman-sachs-gs-q1-2025-earnings-transcript/",
  "Q2 2025": "https://www.fool.com/earnings/call-transcripts/2025/07/16/goldman-sachs-gs-q2-2025-earnings-transcript/",
  "Q3 2025": "https://www.fool.com/earnings/call-transcripts/2025/10/14/goldman-sachs-gs-q3-2025-earnings-transcript/",
  "Q4 2025": "https://www.nasdaq.com/articles/goldman-sachs-gs-q4-2025-earnings-transcript",
  "Q1 2026": "https://www.fool.com/earnings/call-transcripts/2026/04/13/goldman-sachs-gs-q1-2026-earnings-transcript/",
};

function buildGs() {
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return {
      fiscal_quarter: label,
      call_date: null,
      url: GS_URLS[label],
      source_type: "html",
      fetch_status: "pending",
    };
  });
}

// American Express — call dates drive the fool.com path; Q1 2026 is an override.
const AXP_DATES = {
  "Q1 2022": "2022-04-22", "Q2 2022": "2022-07-22", "Q3 2022": "2022-10-21",
  "Q4 2022": "2023-01-27", "Q1 2023": "2023-04-20", "Q2 2023": "2023-07-21",
  "Q3 2023": "2023-10-20", "Q4 2023": "2024-01-26", "Q1 2024": "2024-04-19",
  "Q2 2024": "2024-07-19", "Q3 2024": "2024-10-18", "Q4 2024": "2025-01-24",
  "Q1 2025": "2025-04-17", "Q2 2025": "2025-07-18", "Q3 2025": "2025-10-17",
  "Q4 2025": "2026-01-30",
};

function buildAxp() {
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    if (label === "Q1 2026") {
      return {
        fiscal_quarter: label,
        call_date: "2026-04-23",
        url: "https://www.fool.com/earnings/call-transcripts/2026/04/23/amex-axp-q1-2026-earnings-call-transcript/",
        source_type: "html",
        fetch_status: "pending",
      };
    }
    const date = AXP_DATES[label];
    const [Y, M, D] = date.split("-");
    return {
      fiscal_quarter: label,
      call_date: date,
      url: `https://www.fool.com/earnings/call-transcripts/${Y}/${M}/${D}/american-express-axp-q${q}-${year}-earnings-call-transcript/`,
      source_type: "html",
      fetch_status: "pending",
    };
  });
}

const PHASE_1_BUILDERS = {
  MSFT: buildMsft,
  JPM: buildJpm,
  VZ: buildVz,
  TRV: buildTrv,
  MRK: buildMrk,
  GS: buildGs,
  AXP: buildAxp,
};

// ─── Builder ─────────────────────────────────────────────────────────────────

export function buildQueue({ ticker = null } = {}) {
  const db = getDb();
  const sources = JSON.parse(readFileSync(SOURCES_PATH, "utf8"));

  const filterTicker = ticker ? ticker.toUpperCase() : null;

  const eligible = sources.filter(
    (c) =>
      c.ingestion_status === "ready" &&
      c.human_review_required === false &&
      (!filterTicker || c.ticker.toUpperCase() === filterTicker),
  );

  if (filterTicker && eligible.length === 0) {
    logError(
      `Ticker ${filterTicker} is not eligible (not ready, requires human review, or not in sources).`,
    );
  }

  const existsStmt = db.prepare(
    "SELECT COUNT(*) AS n FROM queue WHERE ticker = ? AND fiscal_quarter = ?",
  );
  const insertStmt = db.prepare(`
    INSERT INTO queue (ticker, company_id, fiscal_quarter, call_date, url, source_type, fetch_status)
    VALUES (@ticker, @company_id, @fiscal_quarter, @call_date, @url, @source_type, @fetch_status)
  `);

  let inserted = 0;
  let skippedExisting = 0;

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const { n } = existsStmt.get(row.ticker, row.fiscal_quarter);
      if (n > 0) {
        skippedExisting++;
        continue;
      }
      insertStmt.run(row);
      inserted++;
    }
  });

  for (const company of eligible) {
    const tk = company.ticker.toUpperCase();
    const companyId = companyIdForTicker(tk);
    const builder = PHASE_1_BUILDERS[tk];

    let rows;
    if (builder) {
      rows = builder().map((r) => ({
        ticker: tk,
        company_id: companyId,
        fiscal_quarter: r.fiscal_quarter,
        call_date: r.call_date,
        url: r.url,
        source_type: r.source_type,
        fetch_status: r.fetch_status,
      }));
    } else {
      // Phase 2 — deferred to archive crawling.
      rows = [
        {
          ticker: tk,
          company_id: companyId,
          fiscal_quarter: "ALL",
          call_date: null,
          url: null,
          source_type: company.source_type || null,
          fetch_status: "pending-crawl",
        },
      ];
    }
    insertMany(rows);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const scope = filterTicker ? ` (ticker=${filterTicker})` : "";
  log(`Queue build complete${scope}.`);
  log(`  Rows inserted: ${inserted}`);
  log(`  Rows skipped (already present): ${skippedExisting}`);

  const byStatus = db
    .prepare(
      "SELECT fetch_status, COUNT(*) AS n FROM queue GROUP BY fetch_status ORDER BY fetch_status",
    )
    .all();
  log("  Queue totals by fetch_status:");
  for (const r of byStatus) log(`    ${r.fetch_status}: ${r.n}`);

  const byTicker = db
    .prepare(
      "SELECT ticker, COUNT(*) AS n FROM queue GROUP BY ticker ORDER BY ticker",
    )
    .all();
  log("  Queue totals by ticker:");
  for (const r of byTicker) log(`    ${r.ticker}: ${r.n}`);

  db.close();
  return { inserted, skippedExisting };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") out.ticker = args[++i];
  }
  return out;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    buildQueue(parseArgs());
  } catch (err) {
    logError("queue-builder failed:", err.message);
    process.exit(1);
  }
}
