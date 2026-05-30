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
  // URLs from company-packs/JPM/source_manifest.json.
  // 2022 and certain 2023–2026 quarters fall back to StockAnalysis; rest are official jpmorganchase.com PDFs.
  // Each quarter's filename is unique — pattern generation does not work reliably for JPM.
  const JPM_BASE = "https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings";
  const entries = {
    "Q1 2022": { url: "https://stockanalysis.com/stocks/jpm/transcripts/18667-q1-2022/", type: "html" },
    "Q2 2022": { url: "https://stockanalysis.com/stocks/jpm/transcripts/19005-q2-2022/", type: "html" },
    "Q3 2022": { url: "https://stockanalysis.com/stocks/jpm/transcripts/19006-q3-2022/", type: "html" },
    "Q4 2022": { url: "https://stockanalysis.com/stocks/jpm/transcripts/35976-q4-2022/", type: "html" },
    "Q1 2023": { url: "https://stockanalysis.com/stocks/jpm/transcripts/36020-q1-2023/", type: "html" },
    "Q2 2023": { url: "https://stockanalysis.com/stocks/jpm/transcripts/36047-q2-2023/", type: "html" },
    "Q3 2023": { url: `${JPM_BASE}/2023/3rd-quarter/jpm-3q23-earnings-call-transcript.pdf`, type: "pdf" },
    "Q4 2023": { url: `${JPM_BASE}/2023/4th-quarter/jpm-4q23-earnings-call-transcript.pdf`, type: "pdf" },
    "Q1 2024": { url: `${JPM_BASE}/2024/1st-quarter/jpm-1q24-earnings-call-transcript.pdf`, type: "pdf" },
    "Q2 2024": { url: `${JPM_BASE}/2024/2nd-quarter/jpm-2q24-earnings-call-transcript-final.pdf`, type: "pdf" },
    "Q3 2024": { url: `${JPM_BASE}/2024/3rd-quarter/jpmc-third-quarter-2024-earnings-conference-call-transcript.pdf`, type: "pdf" },
    "Q4 2024": { url: "https://stockanalysis.com/stocks/jpm/transcripts/214589-q4-2024/", type: "html" },
    "Q1 2025": { url: "https://stockanalysis.com/stocks/jpm/transcripts/244537-q1-2025/", type: "html" },
    "Q2 2025": { url: `${JPM_BASE}/2025/2nd-quarter/jpm-2q25-earnings-call-transcript.pdf`, type: "pdf" },
    "Q3 2025": { url: `${JPM_BASE}/2025/3rd-quarter/jpm-3q25-earnings-call-transcript.pdf`, type: "pdf" },
    "Q4 2025": { url: `${JPM_BASE}/2025/4th-quarter/jpm-4q25-earnings-call-transcript.pdf`, type: "pdf" },
    "Q1 2026": { url: "https://stockanalysis.com/stocks/jpm/transcripts/415950-q1-2026/", type: "html" },
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const { url, type } = entries[label];
    return { fiscal_quarter: label, call_date: null, url, source_type: type, fetch_status: "pending" };
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
  // URLs from company-packs/TRV/source_manifest.json.
  // 2022 and certain later quarters fall back to StockAnalysis; filenames vary — pattern generation unreliable.
  const TRV_BASE = "https://s26.q4cdn.com/410417801/files/doc_financials";
  const entries = {
    "Q1 2022": { url: "https://stockanalysis.com/stocks/trv/transcripts/19022-q1-2022/", type: "html" },
    "Q2 2022": { url: "https://stockanalysis.com/stocks/trv/transcripts/26200-q2-2022/", type: "html" },
    "Q3 2022": { url: "https://stockanalysis.com/stocks/trv/transcripts/29436-q3-2022/", type: "html" },
    "Q4 2022": { url: "https://stockanalysis.com/stocks/trv/transcripts/38304-q4-2022/", type: "html" },
    "Q1 2023": { url: `${TRV_BASE}/2023/q1/1Q23-TRV-Transcript.pdf`, type: "pdf" },
    "Q2 2023": { url: `${TRV_BASE}/2023/q2/2Q23-TRV-Transcript.pdf`, type: "pdf" },
    "Q3 2023": { url: `${TRV_BASE}/2023/q3/3q23-trv-transcript.pdf`, type: "pdf" },
    "Q4 2023": { url: "https://stockanalysis.com/stocks/trv/transcripts/124026-q4-2023/", type: "html" },
    "Q1 2024": { url: `${TRV_BASE}/2024/q1/1q24-trv-transcript.pdf`, type: "pdf" },
    "Q2 2024": { url: `${TRV_BASE}/2024/q2/2q24-trv-transcript.pdf`, type: "pdf" },
    "Q3 2024": { url: `${TRV_BASE}/2024/q3/3Q24-TRV-Transcript.pdf`, type: "pdf" },
    "Q4 2024": { url: `${TRV_BASE}/2024/q4/4Q24-Earnings-Call-Transcript.pdf`, type: "pdf" },
    "Q1 2025": { url: "https://stockanalysis.com/stocks/trv/transcripts/308652-q1-2025/", type: "html" },
    "Q2 2025": { url: `${TRV_BASE}/2025/q2/2Q25-TRV-Transcript.pdf`, type: "pdf" },
    "Q3 2025": { url: `${TRV_BASE}/2025/q3/3Q25-TRV-Transcript.pdf`, type: "pdf" },
    "Q4 2025": { url: `${TRV_BASE}/2025/q4/4Q25-TRV-Transcript.pdf`, type: "pdf" },
    "Q1 2026": { url: `${TRV_BASE}/2026/q1/1Q26-TRV-Transcript-1.pdf`, type: "pdf" },
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const { url, type } = entries[label];
    return { fiscal_quarter: label, call_date: null, url, source_type: type, fetch_status: "pending" };
  });
}

function buildMrk() {
  // URLs from company-packs/MRK/source_manifest.json.
  // 2022–2023 and Q4 2024 fall back to StockAnalysis; 2024–2026 official quarters split between q4cdn and merck.com.
  const MRK_CDN = "https://s21.q4cdn.com/488056881/files/doc_financials";
  const MRK_COM = "https://www.merck.com/wp-content/uploads/sites/124";
  const entries = {
    "Q1 2022": { url: "https://stockanalysis.com/stocks/mrk/transcripts/19991-q1-2022/", type: "html" },
    "Q2 2022": { url: "https://stockanalysis.com/stocks/mrk/transcripts/26772-q2-2022/", type: "html" },
    "Q3 2022": { url: "https://stockanalysis.com/stocks/mrk/transcripts/27696-q3-2022/", type: "html" },
    "Q4 2022": { url: "https://stockanalysis.com/stocks/mrk/transcripts/35997-q4-2022/", type: "html" },
    "Q1 2023": { url: "https://stockanalysis.com/stocks/mrk/transcripts/36037-q1-2023/", type: "html" },
    "Q2 2023": { url: "https://stockanalysis.com/stocks/mrk/transcripts/36063-q2-2023/", type: "html" },
    "Q3 2023": { url: "https://stockanalysis.com/stocks/mrk/transcripts/36081-q3-2023/", type: "html" },
    "Q4 2023": { url: "https://stockanalysis.com/stocks/mrk/transcripts/87411-q4-2023/", type: "html" },
    "Q1 2024": { url: `${MRK_CDN}/2024/q1/MRK-USQ_Transcript_2024-04-25.pdf`, type: "pdf" },
    "Q2 2024": { url: `${MRK_CDN}/2024/q2/MRK-USQ_Transcript_2024-07-30.pdf`, type: "pdf" },
    "Q3 2024": { url: `${MRK_CDN}/2024/q3/MRK-USQ_Transcript_2024-10-31.pdf`, type: "pdf" },
    "Q4 2024": { url: "https://stockanalysis.com/stocks/mrk/transcripts/220665-q4-2024/", type: "html" },
    "Q1 2025": { url: `${MRK_CDN}/2025/q1/MRK-USQ_Transcript_2025-04-24.pdf`, type: "pdf" },
    "Q2 2025": { url: `${MRK_COM}/2025/07/MRK-USQ_Transcript_2025-07-29.pdf`, type: "pdf" },
    "Q3 2025": { url: `${MRK_COM}/2025/10/MRK-USQ_Transcript_2025-10-30.pdf`, type: "pdf" },
    "Q4 2025": { url: `${MRK_COM}/2026/02/MRK-USQ_Transcript_2026-02-03.pdf`, type: "pdf" },
    "Q1 2026": { url: `${MRK_COM}/2026/05/MRK-USQ_Transcript_2026-04-30.pdf`, type: "pdf" },
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    const { url, type } = entries[label];
    return { fiscal_quarter: label, call_date: null, url, source_type: type, fetch_status: "pending" };
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

function buildBa() {
  // Direct Q4CDN PDF URLs — all 17 quarters confirmed official.
  // Source: codex/staging/company-research/BA.json (Priority 6, 2026-05-30).
  const urls = {
    "Q1 2022": "https://s2.q4cdn.com/661678649/files/doc_financials/2022/q1/1Q22-Earnings-Call-Transcripts.pdf",
    "Q2 2022": "https://s2.q4cdn.com/661678649/files/doc_financials/2022/q2/2Q22-Earnings-Call-Transcript.pdf",
    "Q3 2022": "https://s2.q4cdn.com/661678649/files/doc_financials/2022/q3/3Q22-Earnings-Call-Transcript.pdf",
    "Q4 2022": "https://s2.q4cdn.com/661678649/files/doc_financials/2022/q4/4Q22-_-Boeing-Earnings-Call-Transcript.pdf",
    "Q1 2023": "https://s2.q4cdn.com/661678649/files/doc_financials/2023/q1/1Q23-Earnings-Call-Transcript.pdf",
    "Q2 2023": "https://s2.q4cdn.com/661678649/files/doc_financials/2023/q2/2Q23-Earnings-Call-Transcript.pdf",
    "Q3 2023": "https://s2.q4cdn.com/661678649/files/doc_financials/2023/q3/3Q23-Earnings-Call-Transcript.pdf",
    "Q4 2023": "https://s2.q4cdn.com/661678649/files/doc_financials/2023/q4/4q23-earnings-call-transcript-r1.pdf",
    "Q1 2024": "https://s2.q4cdn.com/661678649/files/doc_financials/2024/q1/1Q24-Earnings-Call-Transcript.pdf",
    "Q2 2024": "https://s2.q4cdn.com/661678649/files/doc_financials/2024/q2/2Q24-Boeing-Earnings-Call-Transcript.pdf",
    "Q3 2024": "https://s2.q4cdn.com/661678649/files/doc_financials/2024/q3/3Q24-Boeing-Earnings-Call-Transcript.pdf",
    "Q4 2024": "https://s2.q4cdn.com/661678649/files/doc_financials/2024/q4/Updated/Boeing-4Q24-Earnings-Call-Transcript.pdf",
    "Q1 2025": "https://s2.q4cdn.com/661678649/files/doc_events/2025/Apr/23/Transcript-Q1-2025-Earnings-Call.pdf",
    "Q2 2025": "https://s2.q4cdn.com/661678649/files/doc_financials/2025/q2/Transcript.pdf",
    "Q3 2025": "https://s2.q4cdn.com/661678649/files/doc_financials/2025/q3/Transcript.pdf",
    "Q4 2025": "https://s2.q4cdn.com/661678649/files/doc_financials/2025/q4/Transcript.pdf",
    "Q1 2026": "https://s2.q4cdn.com/661678649/files/doc_financials/2026/q1/Transcript.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return {
      fiscal_quarter: label,
      call_date: null,
      url: urls[label],
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

function buildKo() {
  // Official IR PDF URLs — all 17 quarters confirmed official.
  // Source: codex/staging/company-research/KO.json (Priority 6, 2026-05-30).
  // Note: investors.coca-colacompany.com returned 403 on a spot check (Priority 2).
  // These URLs are from Codex Priority 6 research; validate before batch fetch.
  const urls = {
    "Q1 2022": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10231/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q1_2022_Earnings_Call%2C_25-April-2022_8_30_AM_ET.pdf",
    "Q2 2022": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10232/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q2_2022_Earnings_Call%2C_26-July-2022_8_30_AM_ET.pdf",
    "Q3 2022": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10233/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q3_2022_Earnings_Call%2C_25-October-2022_8_30_AM_ET.pdf",
    "Q4 2022": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10234/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q4_2022_Earnings_Call%2C_14-February-2023_8_30_AM_ET.pdf",
    "Q1 2023": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10235/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q1_2023_Earnings_Call%2C_24-April-2023_8_30_AM_ET.pdf",
    "Q2 2023": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10236/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q2_2023_Earnings_Call%2C_26-July-2023_8_30_AM_ET.pdf",
    "Q3 2023": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10237/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q3_2023_Earnings_Call%2C_24-October-2023_8_30_AM_ET.pdf",
    "Q4 2023": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10238/webcast_transcript/CORRECTED_TRANSCRIPT_The_Coca-Cola_Co.%28KO-US%29%2C_Q4_2023_Earnings_Call%2C_13-February-2024_8_30_AM_ET.pdf",
    "Q1 2024": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10239/webcast_transcript/CORRECTED_TRANSCRIPT__The_Coca-Cola_Co.%28KO-US%29%2C_Q1_2024_Earnings_Call%2C_30-April-2024_8_30_AM_ET.pdf",
    "Q2 2024": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10240/webcast_transcript/CORRECTED_TRANSCRIPT_The_Coca-Cola_Co.%28KO-US%29%2C_Q2_2024_Earnings_Call%2C_23-July-2024_8_30_AM_ET.pdf",
    "Q3 2024": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10241/webcast_transcript/CORRECTED_TRANSCRIPT_The_Coca-Cola_Co.%28KO-US%29%2C_Q3_2024_Earnings_Call%2C_23-October-2024_8_30_AM_ET.pdf",
    "Q4 2024": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10242/webcast_transcript/CORRECTED_TRANSCRIPT_The_Coca-Cola_Co.%28KO-US%29%2C_Q4_2024_Earnings_Call%2C_11-February-2025_8_30_AM_ET.pdf",
    "Q1 2025": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/10625/webcast_transcript/CORRECTED+TRANSCRIPT++The+Coca-Cola+Co.%28KO-US%29%2C+Q1+2025+Earnings+Call%2C+29-April-2025+8+30+AM+ET.pdf",
    "Q2 2025": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/11064/webcast_transcript/CORRECTED+TRANSCRIPT_+The+Coca-Cola+Co.%28KO-US%29%2C+Q2+2025+Earnings+Call%2C+22-July-2025+8_30+AM+ET.pdf",
    "Q3 2025": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/11074/webcast_transcript/CORRECTED+TRANSCRIPT++The+Coca-Cola+Co.%28KO-US%29%2C+Q3+2025+Earnings+Call%2C+21-October-2025+8+30+AM+ET.pdf",
    "Q4 2025": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/11088/webcast_transcript/CORRECTED+TRANSCRIPT++The+Coca-Cola+Co.%28KO-US%29+Q4+2025+Earnings+Call+10-February-2026+8+30+AM+ET.pdf",
    "Q1 2026": "https://investors.coca-colacompany.com/_assets/_7558b9e229c4944bef38147230779b0f/cocacolacompany/db/880/11107/webcast_transcript/CORRECTED+TRANSCRIPT_KO+Q126+Earnings+Call.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return {
      fiscal_quarter: label,
      call_date: null,
      url: urls[label],
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

function buildMmm() {
  // Official IR CloudFront PDF URLs — all 17 quarters confirmed official.
  // Source: codex/staging/company-research/MMM.json (Priority 6, 2026-05-30).
  const urls = {
    "Q1 2022": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/29838/webcast_transcript/Q1-2022-Transcript.pdf",
    "Q2 2022": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/29839/webcast_transcript/2022-Q2-Transcript.pdf",
    "Q3 2022": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/29840/webcast_transcript/Q3-2022-Transcript.pdf",
    "Q4 2022": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30067/webcast_transcript/4Q-2022-Transcript.pdf",
    "Q1 2023": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30189/webcast_transcript/Q1+2023+Earnings+Call+Transcript.pdf",
    "Q2 2023": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30683/webcast_transcript/Q2+2023+Earnings+Call+Transcript.pdf",
    "Q3 2023": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30752/webcast_transcript/Q3+2023+Transcript.pdf",
    "Q4 2023": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30800/webcast_transcript/Q4+2023+Transcript.pdf",
    "Q1 2024": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30862/webcast_transcript/Q1+2024+Transcript.pdf",
    "Q2 2024": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30879/webcast_transcript/Q2+2024+Transcript.pdf",
    "Q3 2024": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30893/webcast_transcript/Q3+2024+-+Earnings+Transcript+%28Final%29.pdf",
    "Q4 2024": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30903/webcast_transcript/Q4+2024+Transcript+%28w+Q%26A%29.pdf",
    "Q1 2025": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30942/webcast_transcript/MMM-USQ_Transcript_2025-04-22.pdf",
    "Q2 2025": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30962/webcast_transcript/MMM-USQ_Transcript_2025-07-18.pdf",
    "Q3 2025": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30969/webcast_transcript/MMM-USQ_Transcript_2025-10-21.pdf",
    "Q4 2025": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30980/webcast_transcript/MMM-USQ_Transcript_2026-01-20.pdf",
    "Q1 2026": "https://d1io3yog0oux5.cloudfront.net/_baaecc7ef75d4b461e49a47848df4bc9/3m/db/3222/30995/webcast_transcript/MMM-USQ_Transcript_2026-04-21.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return {
      fiscal_quarter: label,
      call_date: null,
      url: urls[label],
      source_type: "pdf",
      fetch_status: "pending",
    };
  });
}

function buildCat() {
  // Mixed sources: Q1 2022–Q4 2023 StockAnalysis (html); Q1 2024–Q1 2026 q4cdn PDF.
  // Source: codex/staging/company-research/CAT.json (Priority 6, 2026-05-30).
  const pdfUrls = {
    "Q1 2024": "https://investors.caterpillar.com/files/doc_financials/2024/q1/1Q-2024-Caterpillar-Inc-Earnings-Call-Transcript_4-25-2024.pdf",
    "Q2 2024": "https://investors.caterpillar.com/files/doc_financials/2024/q2/2Q-2024-Caterpillar-Inc-Earnings-Call-Transcript_8-6-2024_vF.pdf",
    "Q3 2024": "https://s25.q4cdn.com/358376879/files/doc_financials/2024/q3/3Q-2024-Caterpillar-Inc-Earnings-Call-Transcript_10-30-2024_vF-1.pdf",
    "Q4 2024": "https://investors.caterpillar.com/files/doc_financials/2024/q4/4Q-2024-Caterpillar-Inc-Earnings-Call-Transcript_1-30-2025_vF.pdf",
    "Q1 2025": "https://investors.caterpillar.com/files/doc_financials/2025/q1/1Q-2025-Caterpillar-Inc-Earnings-Call-Transcript_4-30-2025_vF.pdf",
    "Q2 2025": "https://investors.caterpillar.com/files/doc_financials/2025/q2/2Q-2025-Caterpillar-Inc-Earnings-Call-Transcript_8-5-2025.pdf",
    "Q3 2025": "https://s25.q4cdn.com/358376879/files/doc_financials/2025/q3/3Q-2025-Caterpillar-Inc-Earnings-Call-Transcript_-10-29-2025.pdf",
    "Q4 2025": "https://s25.q4cdn.com/358376879/files/doc_financials/2025/q4/updated/4Q-2025-Caterpillar-Inc-Earnings-Conference-Call_Transcript.pdf",
    "Q1 2026": "https://s25.q4cdn.com/358376879/files/doc_financials/2026/q1/Q1-2026-Earnings-Transcript.pdf",
  };
  const stockAnalysisIds = {
    "Q1 2022": "20044-q1-2022",
    "Q2 2022": "27543-q2-2022",
    "Q3 2022": "27565-q3-2022",
    "Q4 2022": "40436-q4-2022",
    "Q1 2023": "51485-q1-2023",
    "Q2 2023": "65165-q2-2023",
    "Q3 2023": "86641-q3-2023",
    "Q4 2023": "120668-q4-2023",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    if (pdfUrls[label]) {
      return {
        fiscal_quarter: label,
        call_date: null,
        url: pdfUrls[label],
        source_type: "pdf",
        fetch_status: "pending",
      };
    }
    return {
      fiscal_quarter: label,
      call_date: null,
      url: `https://stockanalysis.com/stocks/cat/transcripts/${stockAnalysisIds[label]}/`,
      source_type: "html",
      fetch_status: "pending",
    };
  });
}

function buildShw() {
  // Mixed sources: Q1 2022–Q1 2024 StockAnalysis (html); Q2 2024–Q1 2026 q4cdn PDF.
  // Source: codex/staging/company-research/SHW.json (Priority 6, 2026-05-30).
  const pdfUrls = {
    "Q2 2024": "https://s2.q4cdn.com/918177852/files/doc_financials/2024/q2/CORRECTED-TRANSCRIPT-The-Sherwin-Williams-Co-SHW-US-Q2-2024-Earnings-Call-23-July-2024-11-00-AM-ET.pdf",
    "Q3 2024": "https://s2.q4cdn.com/918177852/files/doc_financials/2024/q3/CORRECTED-TRANSCRIPT_-The-Sherwin-Williams-Co-SHW-US-Q3-2024-Earnings-Call-22-October-2024-10_00-AM-ET.pdf",
    "Q4 2024": "https://s2.q4cdn.com/918177852/files/doc_events/2025/Jan/30/CALLSTREET-REPORT-The-Sherwin-Williams-Co-SHW-US-Q4-2024-Earnings-Call-30-January-2025-10-00-AM-ET.pdf",
    "Q1 2025": "https://s2.q4cdn.com/918177852/files/doc_events/2025/Apr/29/CORRECTED-TRANSCRIPT_-The-Sherwin-Williams-Co-SHW-US-Q1-2025-Earnings-Call-29-April-2025-10_00-AM-ET.pdf",
    "Q2 2025": "https://s2.q4cdn.com/918177852/files/doc_financials/2025/q2/CORRECTED-TRANSCRIPT-The-Sherwin-Williams-Co-SHW-US-Q2-2025-Earnings-Call-22-July-2025-10-00-AM-ET.pdf",
    "Q3 2025": "https://s2.q4cdn.com/918177852/files/doc_events/2025/Oct/28/CORRECTED-TRANSCRIPT_-The-Sherwin-Williams-Co-SHW-US-Q3-2025-Earnings-Call-28-October-2025-10_00-AM-ET.pdf",
    "Q4 2025": "https://s2.q4cdn.com/918177852/files/doc_events/2026/Jan/29/CORRECTEDTRANSCRIPT_TheSherwin-WilliamsCo-SHW-USQ42025EarningsCall29-January-202610_00AMET.pdf",
    "Q1 2026": "https://s2.q4cdn.com/918177852/files/doc_events/2026/Apr/28/CORRECTEDTRANSCRIPT_TheSherwin-WilliamsCo-SHW-USQ12026EarningsCall28-April-202610_00AMET.pdf",
  };
  const stockAnalysisIds = {
    "Q1 2022": "19802-q1-2022",
    "Q2 2022": "27192-q2-2022",
    "Q3 2022": "29643-q3-2022",
    "Q4 2022": "39205-q4-2022",
    "Q1 2023": "50999-q1-2023",
    "Q2 2023": "64665-q2-2023",
    "Q3 2023": "84902-q3-2023",
    "Q4 2023": "124901-q4-2023",
    "Q1 2024": "161979-q1-2024",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    if (pdfUrls[label]) {
      return {
        fiscal_quarter: label,
        call_date: null,
        url: pdfUrls[label],
        source_type: "pdf",
        fetch_status: "pending",
      };
    }
    return {
      fiscal_quarter: label,
      call_date: null,
      url: `https://stockanalysis.com/stocks/shw/transcripts/${stockAnalysisIds[label]}/`,
      source_type: "html",
      fetch_status: "pending",
    };
  });
}

function buildHd() {
  // All 17 quarters official ir.homedepot.com PDFs. Confirmed HTTP 200 by Codex Priority 5.
  // Note: HD fiscal year is offset — fiscal Q1 starts Feb. Quarter labels follow the project convention.
  const urls = {
    "Q1 2022": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/Copy%20of%20HD%201Q21%20Transcript_vF.pdf",
    "Q2 2022": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/2Q21/HD%202Q21%20Transcript_v1.pdf",
    "Q3 2022": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2021/hd-3q21-transcript-v4.pdf",
    "Q4 2022": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/hd-4q21-transcript-v2.pdf",
    "Q1 2023": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/The%20Home%20Depot%201Q22%20Transcript_v2.pdf",
    "Q2 2023": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q22-transcript.pdf",
    "Q3 2023": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/2022%20HD%203Q22%20Transcript.pdf",
    "Q4 2023": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/2022/2022_4Q_Transcript_v2.pdf",
    "Q1 2024": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-1q23-transcript.pdf",
    "Q2 2024": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q23-transcript.pdf",
    "Q3 2024": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-3q23-transcript-v1.pdf",
    "Q4 2024": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-4q23-transcript.pdf",
    "Q1 2025": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-1q24-transcript.pdf",
    "Q2 2025": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-2q24-transcript.pdf",
    "Q3 2025": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/2024/HD_3Q24_Transcript_vf2.pdf",
    "Q4 2025": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/documents/hd-4q24-transcript.pdf",
    "Q1 2026": "https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/reports-and-presentations/quarterly-earnings/2025/hd-1q25-transcript.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return { fiscal_quarter: label, call_date: null, url: urls[label], source_type: "pdf", fetch_status: "pending" };
  });
}

function buildWmt() {
  // All 17 quarters official stock.walmart.com PDFs. Sequential db IDs with consistent path pattern.
  const urls = {
    "Q1 2022": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9473/transcript_management_call/Q1+2022+Earnings+Call.pdf",
    "Q2 2022": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9474/transcript_management_call/Q2+2022+Earnings+Call.pdf",
    "Q3 2022": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9475/transcript_management_call/Q3+2022+Earnings+Call.pdf",
    "Q4 2022": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9476/transcript_management_call/Q4+2022+Earnings+Call.pdf",
    "Q1 2023": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9477/transcript_management_call/Q1+2023+Earnings+Call.pdf",
    "Q2 2023": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9478/transcript_management_call/Q2+2023+Earnings+Call.pdf",
    "Q3 2023": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9479/transcript_management_call/Q3+2023+Earnings+Call.pdf",
    "Q4 2023": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9480/transcript_management_call/Q4+2023+Earnings+Call.pdf",
    "Q1 2024": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9481/transcript_management_call/Q1+2024+Earnings+Call.pdf",
    "Q2 2024": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9482/transcript_management_call/Q2+2024+Earnings+Call.pdf",
    "Q3 2024": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9483/transcript_management_call/Q3+2024+Earnings+Call.pdf",
    "Q4 2024": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9484/transcript_management_call/Q4+2024+Earnings+Call.pdf",
    "Q1 2025": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9485/transcript_management_call/Q1+2025+Earnings+Call.pdf",
    "Q2 2025": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9486/transcript_management_call/Q2+2025+Earnings+Call.pdf",
    "Q3 2025": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9487/transcript_management_call/Q3+2025+Earnings+Call.pdf",
    "Q4 2025": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9939/transcript_management_call/Q4+2025+Earnings+Call.pdf",
    "Q1 2026": "https://stock.walmart.com/_assets/_e1c3169c853d8958f1f23be7102289a0/walmart/db/938/9953/transcript_management_call/Q1+2026+Earnings+Call.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return { fiscal_quarter: label, call_date: null, url: urls[label], source_type: "pdf", fetch_status: "pending" };
  });
}

function buildDis() {
  // All 17 quarters official thewaltdisneycompany.com PDFs. Q1 2026 is on s206.q4cdn.com.
  // Note: Disney fiscal year is offset — FY Q1 starts Oct. Quarter labels follow project convention.
  const urls = {
    "Q1 2022": "https://thewaltdisneycompany.com/app/uploads/2022/03/q1-fy22-earnings-transcript.pdf",
    "Q2 2022": "https://thewaltdisneycompany.com/app/uploads/2022/04/q2-fy22-earnings-transcript.pdf",
    "Q3 2022": "https://thewaltdisneycompany.com/app/uploads/2022/07/q3-fy22-earnings-transcript.pdf",
    "Q4 2022": "https://thewaltdisneycompany.com/app/uploads/2022/11/q4-fy22-earnings-transcript.pdf",
    "Q1 2023": "https://thewaltdisneycompany.com/app/uploads/2023/01/q1-fy23-earnings-transcript.pdf",
    "Q2 2023": "https://thewaltdisneycompany.com/app/uploads/2023/05/q2-fy23-earnings-transcript.pdf",
    "Q3 2023": "https://thewaltdisneycompany.com/app/uploads/2023/08/q3-fy23-earnings-transcript.pdf",
    "Q4 2023": "https://thewaltdisneycompany.com/app/uploads/2023/11/q4-fy23-earnings-transcript.pdf",
    "Q1 2024": "https://thewaltdisneycompany.com/app/uploads/2024/01/q1-fy24-earnings-transcript.pdf",
    "Q2 2024": "https://thewaltdisneycompany.com/app/uploads/2024/05/q2-fy24-earnings-transcript.pdf",
    "Q3 2024": "https://thewaltdisneycompany.com/app/uploads/2024/08/q3-fy24-earnings-transcript.pdf",
    "Q4 2024": "https://thewaltdisneycompany.com/app/uploads/2024/11/q4-fy24-earnings-transcript.pdf",
    "Q1 2025": "https://thewaltdisneycompany.com/app/uploads/2025/02/q1-fy25-earnings-transcript.pdf",
    "Q2 2025": "https://thewaltdisneycompany.com/app/uploads/2025/05/q2-fy25-earnings-transcript.pdf",
    "Q3 2025": "https://thewaltdisneycompany.com/app/uploads/2025/08/q3-fy25-earnings-transcript.pdf",
    "Q4 2025": "https://thewaltdisneycompany.com/app/uploads/2025/11/q4-fy25-earnings-transcript.pdf",
    "Q1 2026": "https://s206.q4cdn.com/979796730/files/doc_events/2026/Feb/02/q1-fy26-earnings-transcript.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return { fiscal_quarter: label, call_date: null, url: urls[label], source_type: "pdf", fetch_status: "pending" };
  });
}

function buildNke() {
  // All 17 quarters official s1.q4cdn.com PDFs. Nike uses fiscal year labels (FY Q1 = Sep).
  // Each filename is unique — no consistent pattern.
  const urls = {
    "Q1 2022": "https://s1.q4cdn.com/806093406/files/doc_financials/2022/q1/FY-2022-Q1-Earnings-Release-Conference-Call-OFFICIAL-Transcipt-FINAL.pdf",
    "Q2 2022": "https://s1.q4cdn.com/806093406/files/doc_financials/2022/q2/NIKE-Inc-Q2FY22UNOFFICIAL-Transcript.pdf",
    "Q3 2022": "https://s1.q4cdn.com/806093406/files/doc_financials/2022/q3/NIKE-Inc-Q3FY22-UNOFFICAL-Transcript.pdf",
    "Q4 2022": "https://s1.q4cdn.com/806093406/files/doc_financials/2022/q4/NIKE-Inc.-Q4FY22-OFFICIAL-Transcript-FINAL.pdf",
    "Q1 2023": "https://s1.q4cdn.com/806093406/files/doc_financials/2023/q1/NIKE-Inc.-Q1FY23-OFFICIAL-Transcript-FINAL.pdf",
    "Q2 2023": "https://s1.q4cdn.com/806093406/files/doc_financials/2022/q4/NIKE-Inc.-Q2FY23-OFFICIAL-Transcript-FINAL.pdf",
    "Q3 2023": "https://s1.q4cdn.com/806093406/files/doc_financials/2023/q3/NIKE-Inc-Q3FY23-OFFICIAL-Transcript-FINAL.pdf",
    "Q4 2023": "https://s1.q4cdn.com/806093406/files/doc_financials/2023/q4/NIKE-Inc-Q4FY23-OFFICIAL-Transcript.pdf",
    "Q1 2024": "https://s1.q4cdn.com/806093406/files/doc_financials/2024/q1/NIKE-Inc-Q1FY24-OFFICIAL-Transcript.pdf",
    "Q2 2024": "https://s1.q4cdn.com/806093406/files/doc_financials/2024/q2/NIKE-Inc-Q2FY24-OFFICIAL-Transcript_FINAL.pdf",
    "Q3 2024": "https://s1.q4cdn.com/806093406/files/doc_financials/2024/q3/NIKE-Inc-Q3FY24-OFFICIAL-Transcript-FINAL.pdf",
    "Q4 2024": "https://s1.q4cdn.com/806093406/files/doc_financials/2024/q4/NIKE-Inc-Q4FY24-OFFICIAL-Transcript_FINAL.pdf",
    "Q1 2025": "https://s1.q4cdn.com/806093406/files/doc_financials/2025/q1/NIKE-Inc-Q1FY25-OFFICIAL-Transcript_-FINAL.pdf",
    "Q2 2025": "https://s1.q4cdn.com/806093406/files/doc_financials/2025/q2/NIKE-Inc-Q2FY25-OFFICIAL-Transcript_-FINAL.pdf",
    "Q3 2025": "https://s1.q4cdn.com/806093406/files/doc_financials/2025/q3/NIKE-Inc-Q3FY25-OFFICIAL-Transcript_-FINAL.pdf",
    "Q4 2025": "https://s1.q4cdn.com/806093406/files/doc_financials/2025/q4/NIKE-Inc-Q4FY25-OFFICIAL-Transcript_-FINAL.pdf",
    "Q1 2026": "https://s1.q4cdn.com/806093406/files/doc_financials/2026/q1/NIKE-Inc-Q1FY26-OFFICIAL-Transcript_-FINAL.pdf",
  };
  return quarterRange().map(({ q, year }) => {
    const label = quarterLabel(q, year);
    return { fiscal_quarter: label, call_date: null, url: urls[label], source_type: "pdf", fetch_status: "pending" };
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
  BA: buildBa,
  KO: buildKo,
  MMM: buildMmm,
  CAT: buildCat,
  SHW: buildShw,
  HD: buildHd,
  WMT: buildWmt,
  DIS: buildDis,
  NKE: buildNke,
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
