# One-Company Transcript Discovery Prompt

You are discovering official earnings call transcript links for exactly one company.

Company:
- Company name: {{company_name}}
- Ticker: {{ticker}}
- Company ID: {{company_id}}

Target range:
- Q1 2022 through Q1 2026, inclusive.
- You must return an entry for every expected quarter:
  2022-Q1, 2022-Q2, 2022-Q3, 2022-Q4,
  2023-Q1, 2023-Q2, 2023-Q3, 2023-Q4,
  2024-Q1, 2024-Q2, 2024-Q3, 2024-Q4,
  2025-Q1, 2025-Q2, 2025-Q3, 2025-Q4,
  2026-Q1.

Rules:
- Work on one company only.
- Start with official company investor relations sources.
- Accept only:
  1. official company-domain transcript links, or
  2. clearly official-hosted CDN/static transcript assets that are linked from or clearly associated with the company IR site.
- Exclude Seeking Alpha, Motley Fool, Yahoo, Koyfin, TIKR, AlphaSense, Quartr, AlphaSense/Sentieo, FactSet, S&P Capital IQ, Bloomberg, Refinitiv, transcript mirrors, scraped transcript sites, summaries, news articles, analyst notes, and paid-data platforms.
- Do not generate phrases, trivia, badges, SQL, or game content.
- Do not add secrets or credentials.
- Do not process any other company.

Discovery standards:
- Prefer direct transcript PDF or direct transcript HTML links.
- If multiple official candidates exist for a quarter, rank direct PDF or direct HTML transcript links above event/webcast pages, press releases, and prepared remarks.
- If only an official event/webcast page is found, include it but mark `asset_type` as `event_page_only`.
- Do not call an event page a transcript unless the page itself contains readable transcript text or links directly to a transcript file.
- If a quarter has no official transcript found, return an empty `candidates` array and explain the search result in `notes`.
- For each candidate, explain how you verified it:
  - `opened_pdf`
  - `opened_html_transcript`
  - `official_event_page_only`
  - `link_label_only`
  - `inferred_from_ir_page`
  - `not_verified`

Output JSON only. No markdown.

Use this shape:

{
  "company_id": "{{company_id}}",
  "company_name": "{{company_name}}",
  "ticker": "{{ticker}}",
  "target_start_quarter": "2022-Q1",
  "target_end_quarter": "2026-Q1",
  "quarters": [
    {
      "quarter": "2022-Q1",
      "status": "opened_transcript|direct_transcript_candidate|event_page_only|prepared_remarks_only|not_found",
      "candidates": [
        {
          "url": "https://example.com/transcript.pdf",
          "source_page_url": "https://example.com/investors/events",
          "asset_type": "direct_pdf|direct_html|event_page_only|press_release_page|prepared_remarks_only|other",
          "confidence": "high|medium|low",
          "verification_method": "opened_pdf|opened_html_transcript|official_event_page_only|link_label_only|inferred_from_ir_page|not_verified",
          "notes": "Short explanation of why this appears official and what was actually verified."
        }
      ],
      "notes": "If not found, briefly explain where you looked and why no official transcript candidate was found."
    }
  ],
  "missing_quarters": [
    {
      "quarter": "2022-Q1",
      "reason": "No official transcript found on company IR/events/results pages; only press release or webcast replay found."
    }
  ],
  "official_sources_checked": [
    "https://example.com/investors",
    "https://example.com/investors/events"
  ],
  "excluded_sources_seen": [
    {
      "url": "https://example-third-party.com/example",
      "reason": "Third-party transcript source."
    }
  ],
  "notes": "Overall discovery notes, including URL patterns, official asset domains, and any blockers."
}
