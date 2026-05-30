#!/usr/bin/env python3
"""
extractor — Phase 2 Stage 2.
Reads fetched PDFs from company-packs/{ticker}/transcripts/, extracts 2-4 word
phrases via n-gram scoring, writes candidate_phrases.json per company.
Env: DATA_DIR (default /app/data), PACKS_DIR (default /app/company-packs),
     TICKER (optional, process one company only)
"""

import json
import os
import re
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

DATA_DIR = Path(os.environ.get("DATA_DIR", "/app/data"))
PACKS_DIR = Path(os.environ.get("PACKS_DIR", "/app/company-packs"))
DB_PATH = DATA_DIR / "ingestion-queue.db"
TICKER_FILTER = os.environ.get("TICKER", "").upper() or None

MAX_CHARS = 25
NGRAM_SIZES = (2, 3, 4)
MIN_QUARTER_FREQ = 2

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "that",
    "this", "these", "those", "it", "its", "we", "our", "us", "they",
    "their", "them", "you", "your", "not", "no", "so", "if", "then",
    "than", "when", "what", "which", "who", "how", "all", "also", "more",
    "very", "just", "now", "up", "out", "into", "over", "after", "about",
    "within", "both", "each", "per", "yet", "still", "get", "got", "go",
    "going", "come", "came", "see", "said", "say", "know", "think",
    "look", "really", "actually", "certainly", "absolutely",
}


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
    if transcript_path.suffix.lower() == '.txt':
        return transcript_path.read_text(encoding='utf-8', errors='replace')
    parts = []
    with pdfplumber.open(transcript_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n".join(parts)


def tokenize(sentence: str) -> list[str]:
    return re.findall(r"[a-z][a-z'\-]*[a-z]|[a-z]{2,}", sentence.lower())


def is_valid_phrase(words: list[str]) -> bool:
    phrase = " ".join(words)
    if len(phrase) > MAX_CHARS:
        return False
    if all(w in STOPWORDS for w in words):
        return False
    if words[0] in STOPWORDS or words[-1] in STOPWORDS:
        return False
    if any(len(w) == 1 for w in words):
        return False
    return True


def extract_ngrams(text: str) -> set[str]:
    phrases: set[str] = set()
    sentences = re.split(r"(?<=[.!?])\s+|\n{2,}", text)
    for sent in sentences:
        words = tokenize(sent)
        for size in NGRAM_SIZES:
            for i in range(len(words) - size + 1):
                window = words[i: i + size]
                if is_valid_phrase(window):
                    phrases.add(" ".join(window))
    return phrases


def process_company(conn: sqlite3.Connection, company_id: str, ticker: str) -> None:
    quarters = conn.execute(
        """SELECT * FROM phase2_quarters
           WHERE company_id = ? AND fetch_status = 'fetched' AND extract_status = 'pending'""",
        (company_id,),
    ).fetchall()

    if not quarters:
        log(f"{ticker}: no quarters ready for extraction")
        return

    log(f"{ticker}: extracting {len(quarters)} quarter(s)")

    phrase_quarters: dict[str, set] = defaultdict(set)
    extracted_dir = PACKS_DIR / ticker / "extracted"
    extracted_dir.mkdir(parents=True, exist_ok=True)

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
            text = extract_text(transcript_path)
            if not text.strip():
                raise ValueError("Extracted text is empty")

            txt_path = extracted_dir / f"{fq.replace(' ', '-')}.txt"
            txt_path.write_text(text, encoding="utf-8")

            phrases = extract_ngrams(text)
            for p in phrases:
                phrase_quarters[p].add(fq)

            conn.execute(
                "UPDATE phase2_quarters SET extract_status='extracted', candidates_path=?, phrase_count=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?",
                (str(txt_path), len(phrases), company_id, fq),
            )
            conn.commit()
            ok += 1
            log(f"  [{fq}] {len(phrases)} raw phrases")

        except Exception as e:
            conn.execute(
                "UPDATE phase2_quarters SET extract_status='failed', extract_error=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?",
                (str(e), company_id, fq),
            )
            conn.commit()
            fail += 1
            log(f"  [{fq}] ✗ {e}")

    # Score candidates; require MIN_QUARTER_FREQ distinct quarters
    candidates = [
        {
            "phrase": p,
            "score": len(qs),
            "quarter_count": len(qs),
            "quarters": sorted(qs),
        }
        for p, qs in phrase_quarters.items()
        if len(qs) >= MIN_QUARTER_FREQ
    ]
    candidates.sort(key=lambda c: (-c["score"], c["phrase"]))

    out_path = PACKS_DIR / ticker / "candidate_phrases.json"
    out_path.write_text(json.dumps(candidates, indent=2), encoding="utf-8")

    new_status = "extracted" if ok > 0 else "extract_failed"
    conn.execute(
        "UPDATE phase2_jobs SET status=?, quarters_extracted=?, updated_at=datetime('now') WHERE company_id=?",
        (new_status, ok, company_id),
    )
    conn.commit()
    log(f"{ticker}: {ok} extracted, {fail} failed, {len(candidates)} candidates (≥{MIN_QUARTER_FREQ} qtrs) → {new_status}")


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
