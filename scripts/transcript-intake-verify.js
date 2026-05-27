import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const discoveryDir = path.join(repoRoot, "data", "transcript-intake", "discovery");
const verifiedDir = path.join(repoRoot, "data", "transcript-intake", "verified");
const cacheDir = path.join(repoRoot, "data", "transcript-intake", "cache");

const LINK_PATTERNS = [
  "transcript",
  "webcast_transcript",
  "earnings-transcript",
  "corrected-transcript",
  ".pdf",
];

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
};

const PDF_RETRY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
  "Upgrade-Insecure-Requests": "1",
};

function parseArgs(argv) {
  const options = { dryRun: false, company: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--company") {
      options.company = argv[index + 1]?.toLowerCase() ?? null;
      index += 1;
    } else if (arg.startsWith("--company=")) {
      options.company = arg.slice("--company=".length).toLowerCase();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim());
}

function normalizeCompanyId(filePath, payload) {
  return (
    firstString(payload.company_id, payload.companyId, payload.id, payload.ticker) ??
    path.basename(filePath, ".json")
  ).toLowerCase();
}

function normalizeTicker(companyId, payload) {
  return firstString(payload.ticker, payload.symbol, payload.company_ticker) ?? companyId.toUpperCase();
}

function normalizeCompanyName(companyId, payload) {
  return firstString(payload.company_name, payload.companyName, payload.name) ?? companyId;
}

function normalizeQuarter(raw, fallbackIndex) {
  if (typeof raw === "string") return raw;
  return (
    firstString(raw?.quarter, raw?.fiscal_quarter, raw?.period, raw?.label, raw?.id) ??
    `candidate_${fallbackIndex + 1}`
  );
}

function normalizeCandidate(raw, quarter, index) {
  if (typeof raw === "string") {
    return { quarter: `candidate_${index + 1}`, url: raw };
  }

  const sourceUrl = firstString(
    raw?.url,
    raw?.candidate_url,
    raw?.source_url,
    raw?.href,
    raw?.pdf_url,
    raw?.event_url,
  );

  return {
    quarter,
    url: sourceUrl,
    sourcePageUrl: firstString(raw?.source_page_url, raw?.sourcePageUrl, raw?.event_page_url),
    raw,
  };
}

function extractCandidates(payload) {
  const quarters = asArray(payload.quarters);

  if (quarters.length > 0) {
    return quarters.flatMap((quarterEntry, quarterIndex) => {
      const quarter = normalizeQuarter(quarterEntry, quarterIndex);
      const nested = [
        ...asArray(quarterEntry?.candidates),
        ...asArray(quarterEntry?.candidate_urls),
        ...asArray(quarterEntry?.urls),
      ];

      if (nested.length === 0) {
        return [normalizeCandidate(quarterEntry, quarter, quarterIndex)];
      }

      return nested.map((candidate, candidateIndex) =>
        normalizeCandidate(
          typeof candidate === "object" && candidate !== null
            ? { ...candidate, source_page_url: candidate.source_page_url ?? quarterEntry.source_page_url }
            : candidate,
          quarter,
          candidateIndex,
        ),
      );
    });
  }

  const topLevel = [
    ...asArray(payload.candidates),
    ...asArray(payload.candidate_urls),
    ...asArray(payload.urls),
    ...asArray(payload.results),
  ];

  return topLevel.map((candidate, index) =>
    normalizeCandidate(candidate, normalizeQuarter(candidate, index), index),
  );
}

async function loadDiscoveryFiles(companyFilter) {
  let entries;

  try {
    entries = await fs.readdir(discoveryDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(discoveryDir, entry.name))
    .filter((filePath) => !companyFilter || path.basename(filePath, ".json").toLowerCase() === companyFilter);

  return Promise.all(
    files.map(async (filePath) => {
      const payload = await readJson(filePath);
      const companyId = normalizeCompanyId(filePath, payload);

      return {
        filePath,
        payload,
        companyId,
        ticker: normalizeTicker(companyId, payload),
        companyName: normalizeCompanyName(companyId, payload),
        candidates: extractCandidates(payload).filter((candidate) => candidate.url),
      };
    }),
  );
}

function buildHeaders(candidate) {
  const headers = { ...BROWSER_HEADERS };
  if (candidate.sourcePageUrl) headers.Referer = candidate.sourcePageUrl;
  return headers;
}

function buildPdfRetryHeaders(candidate) {
  const headers = { ...PDF_RETRY_HEADERS };
  if (candidate.sourcePageUrl) headers.Referer = candidate.sourcePageUrl;
  return headers;
}

async function fetchAsset(url, candidate, headers = buildHeaders(candidate)) {
  const response = await fetch(url, {
    headers,
    redirect: "follow",
  });
  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    url: response.url || url,
    status: response.status,
    ok: response.ok,
    contentType,
    buffer,
  };
}

function looksLikePdfBytes(buffer) {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isFetchedPdf(contentType, buffer) {
  return contentType.toLowerCase().includes("application/pdf") || looksLikePdfBytes(buffer);
}

function looksLikeHtml(contentType, buffer) {
  const sample = buffer.subarray(0, 512).toString("utf8").toLowerCase();
  return contentType.toLowerCase().includes("text/html") || sample.includes("<html") || sample.includes("<!doctype");
}

function looksLikeJavaScriptVerificationPage(contentType, buffer) {
  if (!looksLikeHtml(contentType, buffer)) return false;

  const sample = buffer.subarray(0, 4096).toString("utf8").toLowerCase();
  return [
    "javascript",
    "enable cookies",
    "verify you are human",
    "checking your browser",
    "cloudflare",
    "akamai",
    "perimeterx",
    "incapsula",
    "access denied",
  ].some((term) => sample.includes(term));
}

function sanitizePreview(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function sanitizeTextPreview(value, length) {
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefPattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  let match;

  while ((match = hrefPattern.exec(html))) {
    const href = match[2];
    const normalized = href.toLowerCase();
    if (!LINK_PATTERNS.some((pattern) => normalized.includes(pattern))) continue;

    try {
      links.add(new URL(href, baseUrl).toString());
    } catch {
      // Ignore malformed links in publisher HTML.
    }
  }

  return [...links];
}

function decodePdfLiteral(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped) => {
      const replacements = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      return replacements[escaped] ?? escaped;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function decodePdfHex(value) {
  const padded = value.length % 2 === 0 ? value : `${value}0`;
  const bytes = [];
  for (let index = 0; index < padded.length; index += 2) {
    bytes.push(Number.parseInt(padded.slice(index, index + 2), 16));
  }
  return Buffer.from(bytes).toString("utf16le").replace(/\u0000/g, "") || Buffer.from(bytes).toString("latin1");
}

function extractPdfStrings(content) {
  const text = [];
  const literalPattern = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  const arrayPattern = /\[(.*?)\]\s*TJ/gs;
  const hexPattern = /<([A-Fa-f0-9\s]+)>\s*Tj/g;
  let match;

  while ((match = literalPattern.exec(content))) {
    text.push(decodePdfLiteral(match[0].replace(/\s*Tj$/, "").slice(1, -1)));
  }

  while ((match = arrayPattern.exec(content))) {
    const arrayContent = match[1];
    const literals = [...arrayContent.matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) =>
      decodePdfLiteral(item[0].slice(1, -1)),
    );
    const hexes = [...arrayContent.matchAll(/<([A-Fa-f0-9\s]+)>/g)].map((item) =>
      decodePdfHex(item[1].replace(/\s+/g, "")),
    );
    text.push(...literals, ...hexes);
  }

  while ((match = hexPattern.exec(content))) {
    text.push(decodePdfHex(match[1].replace(/\s+/g, "")));
  }

  return text.join(" ");
}

function inflateMaybe(buffer) {
  for (const inflater of [zlib.inflateSync, zlib.inflateRawSync]) {
    try {
      return inflater(buffer);
    } catch {
      // Try the next inflater.
    }
  }
  return buffer;
}

function extractPdfText(buffer) {
  const raw = buffer.toString("latin1");
  const chunks = [];
  const streamPattern = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamPattern.exec(raw))) {
    const dictionary = match[1];
    const streamBuffer = Buffer.from(match[2], "latin1");
    const decoded = dictionary.includes("/FlateDecode") ? inflateMaybe(streamBuffer) : streamBuffer;
    chunks.push(extractPdfStrings(decoded.toString("latin1")));
  }

  const streamText = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (streamText.length > 0) return { text: streamText, method: "pdf_stream_text" };

  const fallbackText = extractPdfStrings(raw).replace(/\s+/g, " ").trim();
  if (fallbackText.length > 0) return { text: fallbackText, method: "pdf_literal_text" };

  return { text: "", method: "pdf_unreadable" };
}

function transcriptMarkers(company) {
  return [
    "corrected transcript",
    "earnings call",
    "question-and-answer",
    "question and answer",
    "operator",
    "conference call",
    "q&a",
    company.companyName,
    company.ticker,
  ]
    .filter((marker) => typeof marker === "string" && marker.trim())
    .map((marker) => marker.toLowerCase());
}

function findTranscriptMarkerHits(text, company) {
  const lower = text.toLowerCase();
  return [...new Set(transcriptMarkers(company).filter((marker) => lower.includes(marker)))];
}

function classifyExtractedText(text, company) {
  const markerHits = findTranscriptMarkerHits(text, company);
  return {
    markerHits,
    status: text.length >= 500 && markerHits.length >= 2 ? "verified_transcript" : "failed",
  };
}

async function cachePdf(companyId, url, buffer, dryRun) {
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
  const rawDir = path.join(cacheDir, companyId, "raw");
  const filePath = path.join(rawDir, `${hash}.pdf`);

  if (!dryRun) {
    await fs.mkdir(rawDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  return path.relative(repoRoot, filePath);
}

function baseRecord(candidate) {
  return {
    quarter: candidate.quarter,
    status: "failed",
    source_url: candidate.url,
    resolved_url: null,
    final_url: null,
    http_status: null,
    content_type: null,
    response_size_bytes: 0,
    text_char_count: 0,
    extracted_text_char_count: 0,
    extraction_method: null,
    failure_reason: null,
    partial_reason: null,
    looks_like_pdf_bytes: false,
    looks_like_html_javascript_verification_page: false,
    html_preview_first_200_chars: null,
    extracted_text_preview_first_300_chars: null,
    transcript_marker_hits: [],
    browser_required: false,
    retry_attempted: false,
    retry_http_status: null,
    retry_content_type: null,
    retry_response_size_bytes: null,
    notes: [],
  };
}

function setFetchedDiagnostics(record, fetched) {
  record.final_url = fetched.url;
  record.resolved_url = fetched.url !== record.source_url ? fetched.url : null;
  record.http_status = fetched.status;
  record.content_type = fetched.contentType;
  record.response_size_bytes = fetched.buffer.length;
  record.looks_like_pdf_bytes = looksLikePdfBytes(fetched.buffer);
  record.looks_like_html_javascript_verification_page = looksLikeJavaScriptVerificationPage(
    fetched.contentType,
    fetched.buffer,
  );

  if (looksLikeHtml(fetched.contentType, fetched.buffer)) {
    record.html_preview_first_200_chars = sanitizePreview(fetched.buffer.toString("utf8"));
  }
}

function setRetryDiagnostics(record, retry) {
  record.retry_attempted = true;
  record.retry_http_status = retry.status;
  record.retry_content_type = retry.contentType;
  record.retry_response_size_bytes = retry.buffer.length;
}

function setStatusReason(record) {
  if (record.status === "failed" && !record.failure_reason) {
    record.failure_reason = "unknown_failure";
  }

  if (
    ["candidate_pdf_fetched", "candidate_unverified", "event_page_only", "browser_required"].includes(
      record.status,
    ) &&
    !record.partial_reason
  ) {
    record.partial_reason = "candidate_not_fully_verified";
  }
}

function resultReason(record) {
  return record.failure_reason ?? record.partial_reason ?? "verified_transcript";
}

function formatConsoleResult(companyId, record) {
  const label =
    record.status === "verified_transcript"
      ? "VERIFIED"
      : record.status === "candidate_pdf_fetched"
        ? "CANDIDATE_PDF_FETCHED"
        : record.status === "browser_required"
          ? "BROWSER_REQUIRED"
      : record.status === "failed"
        ? "FAILED"
        : "PARTIAL";

  return (
    `[${companyId}] ${record.quarter} ${label} ` +
    `status=${label} ` +
    `http_status=${record.http_status ?? "n/a"} ` +
    `content_type=${record.content_type || "n/a"} ` +
    `size=${record.response_size_bytes} ` +
    `final_url=${record.final_url || "n/a"} ` +
    `pdf_bytes=${record.looks_like_pdf_bytes} ` +
    `html_js_verification=${record.looks_like_html_javascript_verification_page} ` +
    `browser_required=${record.browser_required} ` +
    `retry_attempted=${record.retry_attempted} ` +
    `retry_http_status=${record.retry_http_status ?? "n/a"} ` +
    `retry_content_type=${record.retry_content_type || "n/a"} ` +
    `retry_size=${record.retry_response_size_bytes ?? "n/a"} ` +
    `marker_hits=[${record.transcript_marker_hits.join(",")}] ` +
    `reason=${resultReason(record)}`
  );
}

async function verifyFetchedAsset(company, candidate, fetched, options, sourceUrl) {
  const record = baseRecord({ ...candidate, url: sourceUrl ?? candidate.url });
  setFetchedDiagnostics(record, fetched);

  if (!fetched.ok) {
    record.failure_reason = record.looks_like_html_javascript_verification_page
      ? "javascript_verification_page"
      : `http_${fetched.status}`;
    record.notes.push(`Fetch failed with HTTP ${fetched.status}.`);
    setStatusReason(record);
    return record;
  }

  if (isFetchedPdf(fetched.contentType, fetched.buffer)) {
    const cachedPath = await cachePdf(company.companyId, fetched.url, fetched.buffer, options.dryRun);
    const { text, method } = extractPdfText(fetched.buffer);
    const { markerHits, status } = classifyExtractedText(text, company);
    record.text_char_count = text.length;
    record.extracted_text_char_count = text.length;
    record.extracted_text_preview_first_300_chars = sanitizeTextPreview(text, 300);
    record.transcript_marker_hits = markerHits;
    record.extraction_method = method;
    record.status = status === "verified_transcript" ? "verified_transcript" : "candidate_pdf_fetched";
    record.notes.push(options.dryRun ? `Dry run: would cache PDF at ${cachedPath}.` : `Cached PDF at ${cachedPath}.`);
    if (record.status === "candidate_pdf_fetched") {
      record.partial_reason = "pdf_fetched_text_extraction_skipped_or_inconclusive";
    }
    if (record.status !== "verified_transcript") record.notes.push("PDF was fetched but did not look transcript-like.");
    setStatusReason(record);
    return record;
  }

  if (looksLikeHtml(fetched.contentType, fetched.buffer)) {
    const html = fetched.buffer.toString("utf8");
    const text = htmlToText(html);
    const { markerHits, status } = classifyExtractedText(text, company);
    record.text_char_count = text.length;
    record.extracted_text_char_count = text.length;
    record.extracted_text_preview_first_300_chars = sanitizeTextPreview(text, 300);
    record.transcript_marker_hits = markerHits;
    record.extraction_method = "html_text";
    record.status = status === "verified_transcript" ? "verified_transcript" : "failed";
    if (record.status === "failed") {
      record.failure_reason = record.looks_like_html_javascript_verification_page
        ? "javascript_verification_page"
        : "html_text_not_transcript_like";
    }
    setStatusReason(record);
    return record;
  }

  record.failure_reason = "unsupported_content_type";
  record.notes.push("Unsupported content type.");
  setStatusReason(record);
  return record;
}

function shouldRetry403PdfCandidate(candidate, fetched) {
  return (
    fetched.status === 403 &&
    (candidate.url.toLowerCase().split("?")[0].endsWith(".pdf") ||
      fetched.contentType.toLowerCase().includes("application/pdf") ||
      looksLikePdfBytes(fetched.buffer))
  );
}

function markBrowserRequired(record) {
  record.status = "browser_required";
  record.failure_reason = "http_403_after_browser_header_retry";
  record.browser_required = true;
  record.partial_reason = null;
  record.notes.push("Candidate PDF returned HTTP 403 after browser-header retry; browser automation likely required.");
}

async function verifyCandidate(company, candidate, options) {
  const initial = await fetchAsset(candidate.url, candidate);
  let retry = null;
  let fetched = initial;

  if (shouldRetry403PdfCandidate(candidate, initial)) {
    retry = await fetchAsset(candidate.url, candidate, buildPdfRetryHeaders(candidate));
    if (retry.status !== 403) {
      fetched = retry;
    }
  }

  if (isFetchedPdf(fetched.contentType, fetched.buffer)) {
    const record = await verifyFetchedAsset(company, candidate, fetched, options);
    if (retry) setRetryDiagnostics(record, retry);
    return record;
  }

  if (!looksLikeHtml(fetched.contentType, fetched.buffer)) {
    const record = await verifyFetchedAsset(company, candidate, fetched, options);
    if (retry) {
      setRetryDiagnostics(record, retry);
      if (initial.status === 403 && retry.status === 403) {
        markBrowserRequired(record);
      }
    }
    return record;
  }

  const html = fetched.buffer.toString("utf8");
  const links = extractLinks(html, fetched.url);

  for (const link of links) {
    const linkedCandidate = { ...candidate, sourcePageUrl: fetched.url, url: link };
    const linked = await fetchAsset(link, linkedCandidate);
    const linkedRecord = await verifyFetchedAsset(company, candidate, linked, options, candidate.url);
    linkedRecord.resolved_url = linked.url;
    if (retry) setRetryDiagnostics(linkedRecord, retry);

    if (["verified_transcript", "candidate_pdf_fetched"].includes(linkedRecord.status)) {
      linkedRecord.notes.unshift(`Resolved transcript candidate from event page link: ${link}`);
      return linkedRecord;
    }
  }

  const eventRecord = await verifyFetchedAsset(company, candidate, fetched, options);
  if (retry) {
    setRetryDiagnostics(eventRecord, retry);
    if (initial.status === 403 && retry.status === 403) {
      markBrowserRequired(eventRecord);
    }
  }
  if (links.length > 0) {
    eventRecord.failure_reason = eventRecord.failure_reason ?? "linked_assets_not_verified";
    eventRecord.notes.push(`Checked ${links.length} transcript-like linked asset(s), none verified.`);
  } else {
    eventRecord.failure_reason = eventRecord.failure_reason ?? "no_transcript_like_links_found";
    eventRecord.notes.push("No transcript-like links found on event page.");
  }
  return eventRecord;
}

function summarizeQuarters(quarters) {
  return {
    verified: quarters.filter((quarter) => quarter.status === "verified_transcript").length,
    candidatePdfFetched: quarters.filter((quarter) => quarter.status === "candidate_pdf_fetched").length,
    browserRequired: quarters.filter((quarter) => quarter.status === "browser_required").length,
    failed: quarters.filter((quarter) => quarter.status === "failed").length,
  };
}

async function verifyCompany(company, options) {
  const quarters = [];

  for (const candidate of company.candidates) {
    try {
      console.log(`[${company.companyId}] verifying ${candidate.quarter}: ${candidate.url}`);
      const record = await verifyCandidate(company, candidate, options);
      console.log(formatConsoleResult(company.companyId, record));
      quarters.push(record);
    } catch (error) {
      const record = baseRecord(candidate);
      record.failure_reason = "fetch_error";
      record.notes.push(error.message);
      setStatusReason(record);
      console.log(formatConsoleResult(company.companyId, record));
      quarters.push(record);
    }
  }

  const counts = summarizeQuarters(quarters);
  const output = {
    company_id: company.companyId,
    ticker: company.ticker,
    total_quarters: quarters.length,
    verified_transcript_count: counts.verified,
    candidate_pdf_fetched_count: counts.candidatePdfFetched,
    browser_required_count: counts.browserRequired,
    failed_count: counts.failed,
    quarters,
  };

  if (!options.dryRun) {
    await fs.mkdir(verifiedDir, { recursive: true });
    await fs.writeFile(
      path.join(verifiedDir, `${company.companyId}.json`),
      `${JSON.stringify(output, null, 2)}\n`,
      "utf8",
    );
  }

  return output;
}

export async function main(argv = globalThis.process?.argv?.slice(2) ?? []) {
  const options = parseArgs(argv);
  const companies = await loadDiscoveryFiles(options.company);

  if (companies.length === 0) {
    const filter = options.company ? ` for company "${options.company}"` : "";
    console.warn(`No discovery JSON files found${filter} in ${path.relative(repoRoot, discoveryDir)}.`);
    return;
  }

  for (const company of companies) {
    const result = await verifyCompany(company, options);
    const action = options.dryRun ? "Dry run complete" : "Wrote verification";
    console.log(
      `${action}: ${company.companyId} ` +
        `(${result.verified_transcript_count} verified, ` +
        `${result.candidate_pdf_fetched_count} candidate_pdf_fetched, ` +
        `${result.browser_required_count} browser_required, ` +
        `${result.failed_count} failed)`,
    );
  }
}

if (globalThis.process?.argv?.[1] && fileURLToPath(import.meta.url) === path.resolve(globalThis.process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    globalThis.process.exitCode = 1;
  });
}
