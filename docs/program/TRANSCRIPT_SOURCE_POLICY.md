# There It Is — Transcript Source Policy

The acceptance rule for any transcript source is simple: does this file contain readable earnings call transcript text? If yes, it is usable. The goal is identifying repeated phrases and trivia for a bingo game — not financial analysis. Source classification exists for provenance tracking only and is never a blocker on research or ingestion. Official sources are preferred. IR vendor/CDN assets clearly linked from an official IR page (e.g. q4cdn.com) count as official. Third-party sources are accepted as fallback and should carry a usage_caution flag for human awareness.

---

## Source Confidence Tiers

Tiers are used for provenance tracking in `source_manifest.json`. They do not block research or ingestion.

- **Tier 1 — Official IR site:** PDF or HTML transcript linked directly from the company's official investor relations domain or subdomain. IR vendor/CDN assets (e.g. q4cdn.com) clearly linked from the official IR page are classified here.
- **Tier 2 — SEC 8-K filing:** Transcript exhibit attached to an 8-K filing on EDGAR.
- **Tier 3 — Third-party transcript provider:** Seeking Alpha, StockAnalysis, MarketBeat, Motley Fool, or similar. Free-tier access only. Must be a full written transcript, not a summary or article. Carries `usage_caution` flag.
- **Tier 4 — Paywalled source:** Flag in manifest. Do not use without manual human approval.
- **Tier 5 — Audio or video only:** Flag in manifest. Requires manual transcription before ingestion.
- **Tier 6 — Not found:** Flag for human escalation.

---

## Research Protocol Summary

1. Search official company domains and official IR subdomains first.
2. Accept only sources that contain actual written spoken earnings-call transcript text.
3. IR vendor/CDN assets (e.g. q4cdn.com) linked from the official IR page count as Tier 1 official.
4. If official search is exhausted, expand to third-party providers.
5. Accept third-party only if it is a full written transcript — not a summary, article, or prepared remarks only.
6. Every third-party row must carry `usage_caution: "Third-party transcript; requires human review before ingestion."`.
7. Do not treat discoverability as permission to ingest. Source research and ingestion approval are separate steps.

*Last updated: 2026-05-30*
