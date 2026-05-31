#!/usr/bin/env python3
"""
extractor — Phase 2 Stage 2 (Layer 2: sentence-level extraction).
Reads fetched PDFs from company-packs/{ticker}/transcripts/, extracts the
prepared-remarks section of each transcript, and writes a paragraph batch to
data/review-queue/{ticker}.json for Claude Code AI processing.

Replaces n-gram counting with paragraph extraction so that legal disclaimers,
Q&A boilerplate, and FactSet attribution text are excluded at the source.

Env: DATA_DIR (default /app/data), PACKS_DIR (default /app/company-packs),
     TICKER (optional, process one company only)
"""

import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

DATA_DIR = Path(os.environ.get("DATA_DIR", "/app/data"))
PACKS_DIR = Path(os.environ.get("PACKS_DIR", "/app/company-packs"))
DB_PATH = DATA_DIR / "ingestion-queue.db"
REVIEW_QUEUE_DIR = DATA_DIR / "review-queue"
TICKER_FILTER = os.environ.get("TICKER", "").upper() or None

MIN_PARAGRAPH_WORDS = 30
MIN_PREPARED_REMARKS_WORDS = 200


def ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    print(f"[{ts()}] {msg}", flush=True)


def open_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def extract_text(transcript_path: Path) -> str:
    if transcript_path.suffix.lower() == ".txt":
        return transcript_path.read_text(encoding="utf-8", errors="replace")
    parts = []
    with pdfplumber.open(transcript_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n".join(parts)


def strip_preamble(text: str) -> str:
    """Remove operator boilerplate, legal disclaimer, and participant roster.

    Searches for common prepared-remarks markers. If no marker is found,
    drops the first 2000 characters as a conservative fallback.
    """
    markers = [
        "prepared remarks",
        "prepared statement",
        "good morning",
        "good afternoon",
        "good evening",
        "thank you, operator",
        "thank you operator",
        "thank you for joining",
        "ladies and gentlemen",
    ]
    lower = text.lower()
    best = len(text)
    for m in markers:
        idx = lower.find(m)
        if 200 < idx < best:
            best = idx

    if best < len(text):
        return text[best:]
    return text[min(2000, len(text) // 4):]


def find_qa_boundary(text: str) -> int:
    """Return character index where Q&A begins, or len(text) if not found.

    Legal disclaimers and FactSet attribution appear in the Q&A section or
    after it. Clipping here eliminates the primary contamination source.
    """
    patterns = [
        r"\bquestions?\s+and\s+answers?\b",
        r"\bq\s*&\s*a\s+session\b",
        r"\bq\s*&\s*a\b",
        r"(?:^|\n)\s*operator[:\s]",
        r"\bopen\s+(?:(?:the\s+)?(?:floor|call|line)\s+)?(?:for|to)\s+questions?\b",
        r"\bnow\s+(?:open|take)\s+(?:your\s+)?questions?\b",
        r"\bturn\s+(?:it\s+|the\s+call\s+)?(?:back\s+)?over\s+to\s+the\s+operator\b",
        r"\bwe(?:'ll|'d| will| would)\s+now\s+(?:open|begin|start|take)\b",
    ]
    lower = text.lower()
    earliest = len(text)
    for pattern in patterns:
        m = re.search(pattern, lower)
        if m and m.start() > 1500:
            earliest = min(earliest, m.start())
    return earliest


def extract_prepared_remarks(text: str) -> str:
    """Return only the prepared-remarks section of a transcript."""
    text = strip_preamble(text)
    boundary = find_qa_boundary(text)
    return text[:boundary].strip()


def split_paragraphs(text: str) -> list[str]:
    """Split prepared-remarks text into meaningful paragraph chunks.

    Splits on blank lines or newlines followed by an uppercase letter
    (common in PDF-extracted transcripts). Filters out very short fragments.
    """
    raw = re.split(r"\n\s*\n|\n(?=[A-Z])", text)
    paragraphs = []
    for p in raw:
        p = p.strip()
        # Skip short or mostly-whitespace chunks
        if len(p.split()) < MIN_PARAGRAPH_WORDS:
            continue
        # Collapse internal whitespace
        p = re.sub(r"\s+", " ", p)
        paragraphs.append(p)
    return paragraphs


def process_company(conn: sqlite3.Connection, company_id: str, ticker: str) -> None:
    quarters = conn.execute(
        """SELECT * FROM phase2_quarters
           WHERE company_id = ? AND fetch_status = 'fetched' AND extract_status = 'pending'""",
        (company_id,),
    ).fetchall()

    if not quarters:
        log(f"{ticker}: no quarters ready for extraction")
        return

    log(f"{ticker}: extracting prepared remarks from {len(quarters)} quarter(s)")

    extracted_dir = PACKS_DIR / ticker / "extracted"
    extracted_dir.mkdir(parents=True, exist_ok=True)

    quarter_entries = []
    ok = 0
    fail = 0

    for row in quarters:
        fq = row["fiscal_quarter"]
        transcript_path = Path(row["transcript_path"])

        if not transcript_path.exists():
            conn.execute(
                "UPDATE phase2_quarters SET extract_status='failed', extract_error=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?",
                ("Transcript file not found", company_id, fq),
            )
            conn.commit()
            fail += 1
            continue

        try:
            raw_text = extract_text(transcript_path)
            if not raw_text.strip():
                raise ValueError("Extracted text is empty")

            prepared = extract_prepared_remarks(raw_text)
            word_count = len(prepared.split())

            if word_count < MIN_PREPARED_REMARKS_WORDS:
                raise ValueError(
                    f"Prepared remarks too short ({word_count} words) — may be a Q&A-only transcript"
                )

            paragraphs = split_paragraphs(prepared)
            if not paragraphs:
                raise ValueError("No paragraphs extracted from prepared remarks")

            # Save extracted text for inspection
            txt_path = extracted_dir / f"{fq.replace(' ', '-')}.txt"
            txt_path.write_text(prepared, encoding="utf-8")

            quarter_entries.append({
                "quarter": fq,
                "word_count": word_count,
                "paragraph_count": len(paragraphs),
                "paragraphs": paragraphs,
            })

            conn.execute(
                "UPDATE phase2_quarters SET extract_status='extracted', candidates_path=?, phrase_count=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?",
                (str(txt_path), len(paragraphs), company_id, fq),
            )
            conn.commit()
            ok += 1
            log(f"  [{fq}] {len(paragraphs)} paragraphs, {word_count} words")

        except Exception as e:
            conn.execute(
                "UPDATE phase2_quarters SET extract_status='failed', extract_error=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?",
                (str(e), company_id, fq),
            )
            conn.commit()
            fail += 1
            log(f"  [{fq}] ✗ {e}")

    if not quarter_entries:
        new_status = "extract_failed"
        conn.execute(
            "UPDATE phase2_jobs SET status=?, quarters_extracted=0, updated_at=datetime('now') WHERE company_id=?",
            (new_status, company_id),
        )
        conn.commit()
        log(f"{ticker}: all quarters failed extraction → {new_status}")
        return

    # Write batch file to review-queue for Claude Code AI processing
    REVIEW_QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    batch_path = REVIEW_QUEUE_DIR / f"{ticker}.json"
    batch_path.write_text(
        json.dumps(
            {
                "ticker": ticker,
                "company_id": company_id,
                "queued_at": ts(),
                "status": "pending",
                "mode": "paragraphs",
                "quarters_ok": ok,
                "quarters_failed": fail,
                "quarter_entries": quarter_entries,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    conn.execute(
        "UPDATE phase2_jobs SET status='awaiting_ai_review', quarters_extracted=?, updated_at=datetime('now') WHERE company_id=?",
        (ok, company_id),
    )
    conn.commit()
    log(
        f"{ticker}: {ok} quarters extracted, {fail} failed → review-queue/{ticker}.json (awaiting Claude Code session)"
    )


def main() -> None:
    conn = open_db()

    query = "SELECT * FROM phase2_jobs WHERE status = 'fetched'"
    params: list = []
    if TICKER_FILTER:
        query += " AND ticker = ?"
        params.append(TICKER_FILTER)
    query += " ORDER BY created_at"

    jobs = conn.execute(query, params).fetchall()
    log(f"Extractor starting — {len(jobs)} job(s) to process")

    for job in jobs:
        try:
            process_company(conn, job["company_id"], job["ticker"])
        except Exception as e:
            log(f"Unhandled error for {job['ticker']}: {e}")
            conn.execute(
                "UPDATE phase2_jobs SET status='extract_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?",
                (f"unhandled: {e}", job["company_id"]),
            )
            conn.commit()

    conn.close()
    log("Extractor done.")


if __name__ == "__main__":
    main()
