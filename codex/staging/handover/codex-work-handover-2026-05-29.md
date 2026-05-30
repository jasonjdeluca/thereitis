---
codex_staged: true
group: cross-group
status: review_needed
target_path: docs/program/CODEX_HANDOVER_2026-05-29.md
notes: >
  Condensed handover from raw Codex extract covering Groups E, C, G, H, J, K
  design work. Claude Code should read this alongside PROGRAM_STATE.md before
  writing the implementation backlog. Two items in Open Human Decisions are
  already resolved: third-party transcript sources are approved, and all
  companies are in scope. Do not treat those as open questions.
---
# There It Is - Codex Work Handover

Date prepared: 2026-05-29

This handover condenses the raw Codex conversation extract into the completed work, decisions, source-research findings, and implementation context a Claude Code agent should read before continuing There It Is work. It removes old paste-in prompts and agent instructions while preserving the useful conclusions.

## Project Context

There It Is is a real-time multiplayer earnings-call bingo game. Players choose a public company and receive a 5x5 bingo card containing short phrases associated with that company's earnings calls. During or after the call, players mark phrases as they hear them.

The broader program goal is to build a repeatable company-ingestion and launch-readiness factory around the game:

- stable live multiplayer gameplay;
- repeatable company transcript/source intake;
- deterministic validation and readiness reports;
- admin and PM review loops;
- Codex/AI synthesis for research, QA, reporting, and draft launch content;
- human approval for risky or public-facing decisions.

Important product rules repeated across the prior work:

- Do not use individual person names in generated project artifacts.
- Do not use company logos or trademark assets; use emoji/icons only where needed.
- Phrase tiles must be 25 characters or fewer, with no truncation workaround.
- CEO Mode only; avoid individual executive references.
- Mobile-first UX; the bingo card is the core surface.
- Use dark navy `#0A1628` and gold `#D4AF37` as the established UI palette.
- Tailwind CSS is the UI styling path.
- SQL should be output for manual execution only; do not auto-run production Supabase migrations.
- Do not push directly to `main`.

Human approval is required for production Supabase SQL, merges to `main`, company activation, RLS/auth/security changes, final content approval for companies, public launch posts, legal/disclaimer posture, broad batch automation affecting more than 10 companies, and any ingestion/migration use of third-party transcript-derived content.

## Completed Workstreams

The raw extract indicates the following Codex/design workstreams were completed or treated as completed for now:

- Group E - Transcript Source Research
- Group C - Automation Infrastructure design
- Group G - Content QA design
- Group J - Release Readiness / QA synthesis design
- Group H - Evergreen Maintenance design
- Group K - Analytics and Launch design/content package

The next recommended Codex-level step after those was not another isolated group. It was a cross-group integration audit and implementation backlog so Claude Code can receive small, sequenced tickets instead of broad program instructions.

## Group E - Transcript Source Research

### Purpose

Group E identified written quarterly earnings-call transcript links for target companies, using fiscal Q1 2022 through fiscal Q1 2026 inclusive. It was link discovery only. No transcript content extraction, phrase/trivia generation, company-pack generation, migration creation, or ingestion approval was performed.

### Final Research Protocol

The protocol evolved during the pilot and should be reused for any remaining transcript-source work:

1. Search official company domains and official IR subdomains first.
2. Check official quarterly results archives, events pages, earnings releases, webcast pages, and downloadable official materials.
3. Accept an official source only if it contains actual written spoken earnings-call transcript text or a downloadable transcript file.
4. Accept official IR vendor/CDN assets only when clearly linked from the company's official IR site; classify them as `official_ir_vendor_linked_asset`, not `official_company_domain`.
5. Reject webcast-only, audio-only, video-only, replay-only, registration-only, earnings-release-only, slide-deck-only, CFO-commentary-only, prepared-remarks-only, SEC-filing-only, summary-only, or analyst-article-only pages.
6. If and only if official-domain search is exhausted and no official written transcript is found, expand to third-party transcript search.
7. Accept a third-party source only if it is clearly a written earnings-call transcript with transcript text, speakers/operator text, prepared remarks and/or Q&A; do not accept summaries or articles.
8. Clearly flag third-party sources as third-party.
9. Add the caution `Third-party transcript; requires human review before ingestion.` to every third-party source.
10. Avoid copying individual person names into evidence notes. Use generic language like "speaker-by-speaker text", "operator text", "prepared remarks", and "Q&A".
11. Do not treat discoverability as permission to ingest, store, transform, or reuse transcript content.

### Output Schema Established

Each company-quarter research row should use this shape:

```json
{
  "company": "Example Corp.",
  "ticker": "EX",
  "fiscal_quarter": "FY Q1 2026",
  "call_date": "2026-04-30",
  "accepted_url": "https://example.com/transcript.pdf",
  "status": "found_official_pdf_transcript",
  "source_type": "official_ir_vendor_linked_asset",
  "source_host": "example-cdn.com",
  "official_domains_checked": ["example.com", "investors.example.com"],
  "official_search_exhausted": false,
  "third_party_verified_as_written_transcript": null,
  "verification_basis": "Official IR page links written transcript PDF.",
  "usage_caution": "Official transcript; review rights before ingestion.",
  "confidence": "high",
  "evidence_note": "Written call transcript text present."
}
```

Statuses used:

- `found_official_html_transcript`
- `found_official_pdf_transcript`
- `found_official_embedded_transcript`
- `official_page_found_but_no_transcript`
- `only_third_party_transcript_found`
- `third_party_found_but_not_verified`
- `only_summary_or_prepared_remarks_found`
- `not_found_after_official_and_third_party_search`
- `ambiguous_needs_human_review`

Source types used:

- `official_company_domain`
- `official_ir_subdomain`
- `official_ir_vendor_linked_asset`
- `third_party_transcript_provider`
- `third_party_unverified`
- `not_applicable`

### Company Coverage Findings

The extract contains completed transcript-source research for the companies below. Use this as a launch-readiness/source-provenance map, not as ingestion approval.

| Company | Ticker | Finding | Ingestion Caution |
| --- | --- | --- | --- |
| Microsoft | MSFT | Official written transcript pages found for every quarter on Microsoft investor event paths, e.g. `microsoft.com/en-us/investor/events/fy-YYYY/earnings-fy-YYYY-qN`. | Strong official-source candidate; still review rights before ingestion. |
| Apple | AAPL | No official Apple-domain written transcript found. Official pages are webcast/audio/replay and press-release oriented. Third-party written transcripts were found after official search exhaustion. | Third-party only; human/legal/provenance review required. |
| NVIDIA | NVDA | No accepted NVIDIA-domain written transcript found. Official IR pages expose results, press releases, CFO commentary, presentations, SEC filings, and webcasts. Third-party written transcripts were found after official search exhaustion. | Third-party only; human/legal/provenance review required. |
| Goldman Sachs | GS | No official written transcript found on Goldman Sachs domains. Official archive provides press releases, results PDFs, presentations, and webcast access. Third-party transcripts used. | Third-party only; human review required. |
| JPMorgan Chase | JPM | Official written earnings-call transcript PDFs published on the JPMorganChase domain under quarterly earnings materials; page lists "Earnings Transcript" links, including 1Q26. | Official-source candidate; review rights before ingestion. |
| American Express | AXP | No official written transcript found on American Express/AXP IR domains; pages point to audio, slides, releases, and replay resources. Third-party transcripts used. | Third-party only; human review required. |
| Visa | V | Official written transcript PDFs found as Q4-hosted assets tied to Visa IR materials. Treated as `official_ir_vendor_linked_asset`. | Official-linked vendor assets; verify quarter/date and rights. |
| Travelers | TRV | Official written transcript PDFs found as Q4-hosted Travelers IR document assets. IR site exposes transcript links from investor-results area. | Official-linked vendor assets; verify direct PDFs before ingestion. |
| UnitedHealth Group | UNH | Official materials include financial/earnings reports and prepared remarks, but no accepted full transcript. Official prepared remarks are excluded. Third-party Fortune transcripts used for all quarters. | Third-party only; human review required. |
| Amgen | AMGN | Q4 2022 official transcript PDF found. Other quarters used third-party Fortune transcripts after official search found webcast/release/presentation material but no accepted written transcript. | Mixed source profile; third-party rows need human review. |
| Johnson & Johnson | JNJ | Official IR vendor-linked transcript PDFs identified/pattern-matched for all quarters. One Q4-hosted JNJ transcript PDF was directly verified for Q3 2023. | Spot-check every direct PDF candidate before ingestion: HTTP 200, PDF type, quarter/date match, transcript text, Q&A. |
| Merck & Co. | MRK | Official transcript PDFs found for every quarter. Older rows use Merck/Q4-hosted assets; Q4 2025 and Q1 2026 are Merck-hosted PDFs. | Strong official-source candidate; verify quarter/date before ingestion. |
| Caterpillar | CAT | Official materials located, but no official written transcript verified. StockAnalysis third-party transcripts found for every quarter. | Third-party only; human review required. |
| Boeing | BA | Official materials located, but no official written transcript verified. StockAnalysis third-party transcripts found for every quarter. | Third-party only; human review required. |
| Honeywell | HON | Official materials located, but no official written transcript verified. StockAnalysis third-party transcripts found for every quarter. | Third-party only; human review required. |
| 3M | MMM | Official-linked CloudFront transcript PDFs verified for FY Q1 2026 and FY Q1 2025. Other quarters were filled with StockAnalysis links and marked ambiguous because official PDFs may exist but were not fully resolved. | Needs official-archive review before using third-party fallbacks. |
| Sherwin-Williams | SHW | Official materials located, but no official written transcript verified. StockAnalysis third-party transcripts found for every quarter. | Third-party only; human review required. |
| Home Depot | HD | Official IR quarterly earnings archive includes a Transcript column for FY2022-FY2026; accepted links are Home Depot-hosted PDFs. | Official-source candidate; review rights before ingestion. |
| McDonald's | MCD | No official written transcript verified on McDonald's domains. StockAnalysis third-party transcripts found for every quarter. | Third-party only; human review required. |
| Walmart | WMT | Official financial results archive includes `Transcript - Management Call` PDF links for target fiscal quarters. Some PDF fetches triggered 403/bot-check behavior in browsing. | Treat archive links as official, but spot-check download/access before ingestion. |
| Nike | NKE | Official event pages include Official Transcript links to Q4 CDN PDFs. Most were confirmed or follow official archive naming patterns. | Official-linked vendor assets; spot-check older pattern-derived URLs. |
| Procter & Gamble | PG | No official written transcript verified on P&G official domains. StockAnalysis transcripts found for all fiscal quarters. | Third-party only; human review required. |
| Coca-Cola | KO | Official investor site exposes "Earnings Call Audio Transcript" / transcript links from event pages for quarters in scope. | Official-source candidate; crawler should resolve current direct PDF asset URLs per quarter. |
| Walt Disney | DIS | Official transcript PDFs found on Disney investor/company-hosted paths. Opened PDFs contain written call transcript text. | Official-source candidate; spot-check older path variants. |
| Amazon | AMZN | Official IR pages provide releases, slides, SEC filings, and webcast info, but no official written transcript verified. StockAnalysis transcripts used. | Third-party only; human review required. |
| Salesforce | CRM | Official quarterly results archive exposes transcript links for target fiscal quarters; FY Q1 2022 direct Q4 CDN PDF was identified. | Official-source candidate; crawl archive to resolve direct assets for each quarter. |
| IBM | IBM | Official IBM investor event pages expose "Webcast transcript" materials; direct IBM download URLs contain transcript PDFs for some quarters. | Official-source candidate; resolve direct PDFs from each event page where preferred. |
| Cisco Systems | CSCO | Official materials located but no official written transcript verified. StockAnalysis transcripts used for all quarters. | Third-party only; human review required. |
| Chevron | CVX | Official Chevron materials found, but no official written transcript verified. StockAnalysis transcripts found for FY Q1 2022-FY Q1 2026. | Third-party only; human review required. |
| Verizon | VZ | Official quarterly earnings webcast pages expose Webcast Transcript PDF links. One opened PDF confirmed written edited transcript with operator text, prepared remarks, and Q&A. | Official-source candidate; review rights before ingestion. |

### Group E Open Risks

- Third-party transcript links are discovery evidence only. They do not grant permission to ingest, store, transform, or use the transcript text.
- Official-linked vendor/CDN assets should be consistently classified as `official_ir_vendor_linked_asset`; decide whether those count as "official enough" for ingestion.
- JNJ, Walmart, Nike, Disney, Salesforce, IBM, Coca-Cola, 3M, Visa, Travelers, and Merck need programmatic direct-link validation before ingestion.
- Some long research outputs used full Markdown tables as the authoritative complete dataset while JSON blocks were representative or partial. Before building source manifests, reconcile from the complete tables or rerun export into strict JSON.

## Group C - Automation Infrastructure Design

Group C was designed as the automation/PM reporting layer that consumes deterministic `reports/*.json` artifacts and turns them into structured summaries, issue/comment drafts, and escalations.

Expected report inputs:

- `reports/company-readiness.json`
- `reports/content-validation.json`
- `reports/migration-check.json`
- `reports/pm-packet.json`
- `reports/ingestion-status.json`
- `reports/transcript-freshness.json`
- `reports/release-readiness.json`
- `reports/analytics-snapshot.json`

Expected prompt files proposed under `docs/program/prompts/`:

- weekly content quality summary
- nightly ingestion queue triage
- overflow PM brief
- release readiness synthesis
- content editorial review

Key design rules:

- Deterministic workers produce facts; Codex summarizes and escalates.
- Codex should not execute production changes, create migrations, approve activation, or modify company packs.
- Automation output should include missing/stale report detection, severity grouping, human-decision flags, and 1-3 scoped recommended tickets.
- Group C depends heavily on Group B report shape stability.

## Group G - Content QA Design

Group G defines Codex editorial review after deterministic validation has already run. Deterministic scripts catch objective failures; Codex evaluates judgment-heavy quality.

Planned artifacts:

- `docs/program/CONTENT_QA_RUBRIC.md`
- `docs/program/prompts/codex-content-editorial-review.md`

Codex editorial review should assess:

- phrase playability;
- company fit;
- whether terms are too generic;
- CEO Mode alignment;
- whether trivia is understandable and fair;
- provenance/source risk, especially third-party transcript reliance;
- launch-readiness feel.

Hard deterministic/non-negotiable rules:

- no individual person names;
- max 25 characters per phrase tile;
- no wrong-company content;
- no logo/trademark asset use;
- no silent fallback dependence;
- human approval before final company activation.

Suggested content QA statuses from the design work included pass/needs-review/reject-style outputs with explicit rejection reasons and human escalation criteria.

## Group J - Release Readiness / QA Synthesis Design

Group J defines QA and launch hardening. Claude Code/Docker own deterministic tests and scripts; Codex synthesizes report outputs into weekly go/no-go posture for humans.

Planned artifacts:

- `docs/program/RELEASE_CHECKLIST.md`
- `docs/program/prompts/codex-release-readiness-synthesis.md`
- `reports/release-readiness.json`

Expected deterministic checks:

- public smoke tests: homepage, start/join routes, company selector, admin protection, no visible crash, mobile viewport, title/meta;
- game flow smoke tests: create session, join session, render card, mark tile, bingo detection, post-game screen;
- build/test checks;
- company/content readiness checks;
- migration readiness;
- transcript freshness;
- analytics snapshot, if available;
- SEO/public UX checks.

Codex release posture taxonomy:

- `go`
- `go_with_warnings`
- `no_go`
- `insufficient_data`

Codex may recommend posture but must not approve launch, activate companies, merge PRs, run SQL, or post public launch content.

## Group H - Evergreen Maintenance Design

Group H keeps company packs fresh across quarterly earnings cycles. Deterministic workers should detect upcoming calls, passed calls without new transcript ingestion, stale companies, and post-call transcript availability. Codex summarizes exceptions and recommends follow-up tickets.

Planned artifacts:

- `docs/program/EVERGREEN_MAINTENANCE_RUNBOOK.md`
- `docs/program/prompts/codex-evergreen-exception-report.md`
- `reports/transcript-freshness.json`

Freshness report fields proposed:

- `generated_at`
- `report_version`
- `companies_checked`
- `earnings_season_mode`
- `company_results`
- `ticker`
- `company`
- `active_status`
- `next_call_date`
- `days_until_next_call`
- `latest_ingested_quarter`
- `latest_available_quarter`
- `quarters_behind`
- `official_sources_checked`
- `source_manifest_status`
- `post_call_watch_status`
- `transcript_expected`
- `transcript_found`
- `transcript_ingested`
- `source_type`
- `third_party_source_used`
- `stale_reason`
- `severity`
- `recommended_action`

Freshness statuses proposed:

- `fresh`
- `upcoming_call_within_14_days`
- `post_call_waiting_for_transcript`
- `transcript_available_not_ingested`
- `stale_one_quarter`
- `stale_two_quarters`
- `stale_more_than_two_quarters`
- `missing_source_manifest`
- `source_unavailable`
- `needs_human_review`

Severity taxonomy:

- `critical`
- `high`
- `medium`
- `low`
- `info`

Post-call watch rules:

- flag companies with known calls within 14 days;
- after a call passes, check known IR/source pages daily for 10 days;
- if no transcript appears, escalate according to severity and source confidence;
- third-party fallback may be discovered only after official search is exhausted and must be marked for human review;
- broad batch actions over 10 companies require human approval.

## Group K - Analytics and Launch Design

Group K covers analytics instrumentation, analytics summary reporting, feedback collection, and draft launch content.

Planned artifacts:

- `docs/program/LAUNCH_KIT.md`
- `docs/program/prompts/codex-launch-kit-generator.md`
- `docs/program/prompts/codex-analytics-snapshot-summary.md`
- `reports/analytics-snapshot.json`

Analytics events specified:

- `session_created`
- `player_joined`
- `company_selected`
- `bingo`
- `share_card_used`
- `vote_cast`

Analytics snapshot fields proposed:

- `generated_at`
- `report_version`
- `period_start`
- `period_end`
- `event_counts`
- `unique_sessions`
- `unique_players`
- `company_selection_counts`
- `session_created_count`
- `player_joined_count`
- `bingo_count`
- `share_card_used_count`
- `vote_cast_count`
- `funnel_metrics`
- `device_breakdown`
- `route_breakdown`
- `top_companies`
- `data_quality_warnings`
- `instrumentation_gaps`
- `recommended_followups`

Launch content package proposed:

- one-line tagline;
- 25/50/100-word descriptions;
- Product Hunt-style blurb;
- short and long announcement posts;
- beta invite email;
- feedback request copy;
- demo narration script;
- social post variants;
- alternate headline options;
- FAQ entries;
- non-affiliation/disclaimer language;
- feedback form questions and categorization.

Launch copy is draft-only. It must not imply official affiliation with supported companies, must not include legal/financial advice, must not use individual person names, and must not be posted without human approval.

## Cross-Group Integration Audit Recommended Next

After Groups E/C/G/H/J/K, the recommended next Codex task was a Program Integration Audit plus Implementation Ticket Backlog.

The audit should produce:

- program integration summary;
- unified dependency map across Groups A-K;
- report inventory;
- prompt inventory;
- schema consistency audit;
- human approval gate audit;
- risk register;
- Claude Code implementation backlog;
- recommended execution sequence;
- open human questions;
- final recommendation for the next 3-5 implementation tickets.

Key dependency map:

- Group A live game stability must be reliable before launch.
- Group B deterministic reports are a dependency for Group C automation, Group G review inputs, Group H freshness monitoring, Group J release readiness, and Group K analytics summaries.
- Group E transcript source research feeds Group F ingestion and Group G provenance review.
- Group F ingestion must exist before generated company packs can be validated and editorially reviewed.
- Group G content QA must complete before company activation.
- Group H requires source manifests and latest-ingested-quarter metadata.
- Group J requires smoke tests and all key reports to synthesize launch posture.
- Group K launch content must wait for release readiness, public UX/SEO readiness, disclaimer posture, and human approval.

## Implementation Backlog Themes for Claude Code

Suggested scoped ticket areas from the extract:

1. Build or normalize Group B deterministic report producers.
2. Define `company-packs/{ticker}/source_manifest.json` schema and create a source-manifest validation script.
3. Convert completed Group E findings into source manifests only after human confirms third-party-source policy.
4. Build content validation reports that enforce phrase length, duplicates, company IDs, trivia shape, and person-name detection.
5. Add content QA report ingestion surfaces and output schemas.
6. Build transcript freshness watcher and stale-company detector.
7. Add post-call transcript watch script with official-first/third-party-second behavior.
8. Add release-readiness smoke tests and `reports/release-readiness.json`.
9. Add analytics event instrumentation and `reports/analytics-snapshot.json`.
10. Add admin/readiness console surfaces once report shapes are stable.

## Open Human Decisions

These decisions remain important before implementation or ingestion:

- Do official-linked IR vendor/CDN transcript assets count as official for source confidence and launch candidacy?
- May third-party transcript-derived content be ingested at all? If yes, under what legal/provenance rules?
- Which companies are launch candidates?
- What is the minimum number of launch-ready companies for public launch?
- What is the minimum transcript/source coverage per company?
- Which analytics provider/tooling should be used?
- What disclaimer/legal posture is approved?
- What is the maximum safe automation batch size?
- How should conflicting deterministic report statuses be resolved?
- Where should latest-ingested-quarter metadata live: Supabase, `company.json`, or both?

## Immediate Recommendation

The best next handoff for Claude Code is not "implement everything." Start with a small integration phase:

1. Inventory proposed reports/prompts/schemas from this handover and create a normalized implementation backlog.
2. Decide third-party transcript ingestion policy and official-vendor asset treatment.
3. Implement source manifest schema validation before any transcript ingestion.
4. Implement deterministic content/company readiness reports before wiring Codex automations.
5. Build smoke tests and release-readiness reporting once core gameplay and report producers are stable.


