# There It Is — Transcript Source Manifest
Generated from Group E Codex research (3 conversations). Q1 2022–Q1 2026 (17 quarters).
Last updated: 2026-05-29

Decisions applied:
- IHG: set aside — official PDFs will be sourced manually; not in ingestion queue
- Choice Hotels ticker normalized to CHH (was researched as CCH — typo)
- Low-confidence sources: flagged with human_review_required=true but NOT blocking ingestion; review before activating company

---

## Legend
- ✅ Official — hosted on company or official IR domain
- 🟡 Mixed — some official quarters, rest third-party
- 🔴 Third-party — no official transcript found; third-party source accepted
- ⚠️ Ambiguous — needs human review before ingestion
- ❌ Not found — no transcript verified
- — Manual — sourced outside ingestion pipeline

**Confidence levels:**
- High — page directly opened and written transcript text verified
- Medium — URL pattern-matched from official archive or index; spot-check before ingestion
- Low — source is an index or listing page; direct quarter pages must be opened before ingestion

---

## DB Companies — Hospitality Core

| Company | Ticker | Status | Source Type | Source Host | Coverage | Confidence | human_review_required | Notes |
|---|---|---|---|---|---|---|---|---|
| Hilton | HLT | — | — | — | Not researched | — | false | Already has phrases; no ingestion needed yet |
| Marriott | MAR | ✅ | official_ir_vendor_linked_asset | q4cdn | 17/17 | Medium | false | Spot-check direct PDF URLs from official archive before ingestion |
| Hyatt | H | ✅ | official_ir_vendor_linked_asset | q4cdn | 17/17 | Medium | false | Verify direct PDF URLs from official archive before ingestion |
| Wyndham | WH | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | Medium | false | Archive index URLs only — resolve to per-quarter direct links before ingestion |
| Choice Hotels | CHH | 🟡 | official_ir_vendor_linked_asset + third_party | q4cdn / stockanalysis | 17/17 | Medium | false | Q1 2022, Q4 2023, Q1 2024, Q4 2025 official PDFs confirmed; remaining quarters re-open from official archive |
| IHG Hotels | IHG | — Manual — | official_company_domain | ihgplc.com | TBD | — | true | Set aside — non-standard event format (Trading Updates / Half Year Results); PDFs sourced manually |
| Coca-Cola | KO | ✅ | official_ir_subdomain | investors.coca-colacompany.com | 17/17 | High | false | Deactivated in DB; crawl official event pages to resolve per-quarter direct PDF URLs |

---

## Hospitality REITs — Not Yet in DB

| Company | Ticker | Status | Source Type | Source Host | Coverage | Confidence | human_review_required | Notes |
|---|---|---|---|---|---|---|---|---|
| Host Hotels & Resorts | HST | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | Medium | false | Archive index URLs — resolve to per-quarter links before ingestion |
| Ryman Hospitality | RHP | 🟡 | official_ir_vendor_linked_asset + third_party | q4cdn | 17/17 | Medium | true | Q1 2022, Q4 2022, Q1 2023 official PDF fetches were intermittent — re-open before ingestion |
| Apple Hospitality REIT | APLE | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | Medium | false | Archive index URLs — resolve to per-quarter links before ingestion |
| Park Hotels & Resorts | PK | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | Medium | false | Archive index URLs — resolve to per-quarter links before ingestion |
| RLJ Lodging Trust | RLJ | 🔴 | third_party_transcript_provider | stockanalysis.com / fool.com | 17/17 | Medium–High | false | Q1 2026 Motley Fool confirmed; historical StockAnalysis index |
| Chatham Lodging Trust | CLDT | 🔴 | third_party_transcript_provider | strike.market / seekingalpha.com / fintool.com | 17/17 | Low–High | true | Historical quarters low-confidence (Strike.Market index); Q4 2025 and Q1 2026 directly verified. Review historical quarters before activation |
| Ashford Hospitality Trust | AHT | 🔴/❌ | third_party_transcript_provider | stockanalysis.com | 16/17 | Medium | true | Q1 2026 not found — no verified transcript exists at time of research |

---

## Potential Future Companies

| Company | Ticker | Status | Source Type | Source Host | Coverage | Confidence | human_review_required | Notes |
|---|---|---|---|---|---|---|---|---|
| Microsoft | MSFT | ✅ | official_company_domain | microsoft.com | 17/17 | High | false | Official HTML transcript pages verified all quarters |
| Apple | AAPL | 🔴 | third_party_transcript_provider | marketbeat.com | 17/17 | High | false | Official pages audio-only; MarketBeat verified |
| NVIDIA | NVDA | 🔴 | third_party_transcript_provider | marketbeat.com | 17/17 | High | false | Official pages no written transcript; MarketBeat verified |
| JPMorgan Chase | JPM | ✅ | official_company_domain | jpmorganchase.com | 17/17 | Medium–High | false | Official PDF transcripts in consistent quarterly URL pattern |
| Goldman Sachs | GS | 🔴 | third_party_transcript_provider | fool.com / nasdaq.com | 17/17 | Medium–High | false | No official written transcript; Motley Fool and Nasdaq verified |
| American Express | AXP | 🔴 | third_party_transcript_provider | fool.com | 17/17 | Medium–High | false | No official written transcript; Motley Fool verified all quarters |
| Visa | V | ✅ | official_ir_vendor_linked_asset | s1.q4cdn.com | 17/17 | Medium–High | false | Official corrected transcript PDFs via IR vendor |
| Travelers | TRV | ✅ | official_ir_vendor_linked_asset | s26.q4cdn.com | 17/17 | Medium–High | false | Consistent Q4CDN pattern; Q2 2024 confirmed on official IR subdomain |
| UnitedHealth Group | UNH | 🔴 | third_party_transcript_provider | fortune.com | 17/17 | Medium–High | false | Official materials are prepared-remarks only; Fortune verified as full transcripts |
| Amgen | AMGN | 🟡 | official_ir_subdomain + third_party | investors.amgen.com / fortune.com | 17/17 | Medium–High | false | Q4 2022 official PDF confirmed; all other quarters Fortune |
| Johnson & Johnson | JNJ | ✅ | official_ir_vendor_linked_asset | q4cdn | 17/17 | Medium | true | Q3 2023 directly verified; other quarters pattern-matched — spot-check PDFs before ingestion |
| Merck & Co. | MRK | ✅ | official_ir_vendor_linked_asset | s21.q4cdn.com | 17/17 | Medium–High | false | Official IR events page exposes transcript links; consistent URL pattern |
| Procter & Gamble | PG | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | High | false | All quarters verified on StockAnalysis with speaker-by-speaker text |
| Walt Disney | DIS | ✅ | official_ir_subdomain | investors.thewaltdisneycompany.com | 17/17 | High | false | Q1 2026 confirmed; older quarters follow consistent archive path pattern |
| Amazon | AMZN | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | High | false | StockAnalysis verified all 17 quarters |
| Salesforce | CRM | ✅ | official_ir_subdomain | investor.salesforce.com | 17/17 | High | false | Official archive exposes transcript links per quarter; crawl to resolve direct URLs |
| IBM | IBM | ✅ | official_company_domain | ibm.com/investor | 17/17 | High | false | Official Webcast transcript PDFs under Materials for download |
| Cisco Systems | CSCO | 🔴 | third_party_transcript_provider | stockanalysis.com | 17/17 | High | false | No official written transcript; StockAnalysis verified all quarters |
| Verizon | VZ | ✅ | official_company_domain | verizon.com | 17/17 | High | false | Official event pages expose Webcast Transcript PDF per quarter; consistent URL pattern |

---

## Ingestion Queue Status Summary

| Tier | Companies | Count |
|---|---|---|
| Official — ready for ingestion | MSFT, JPM, V, TRV, MRK, DIS, IBM, VZ, KO, MAR, H, CRM | 12 |
| Mixed — mostly ready | AMGN, CHH, RHP | 3 |
| Third-party — ready (high confidence) | AAPL, NVDA, GS, AXP, UNH, PG, AMZN, CSCO, RLJ, HST, APLE, PK | 12 |
| Third-party — flagged (human_review_required) | CLDT, AHT, WH | 3 |
| Manual sourcing | IHG | 1 |
| Not researched | HLT | 1 |
| **Total** | | **32** |

---

## Open Human Review Items

| # | Company | Item | Blocking Ingestion? |
|---|---|---|---|
| 1 | IHG | Non-standard event format; PDFs sourced manually outside pipeline | No — manual |
| 2 | RHP | Q1 2022, Q4 2022, Q1 2023 official PDF fetches intermittent; re-open before ingestion | No — flag before activation |
| 3 | CLDT | Historical quarters (Strike.Market index) low confidence; open each quarter page before activation | No — flag before activation |
| 4 | AHT | Q1 2026 no transcript found | No — gap only |
| 5 | JNJ | Several quarters pattern-matched, not directly opened; spot-check PDFs | No — flag before activation |
| 6 | All third-party | Discoverability ≠ permission for reuse; review licensing before ingestion | No — policy review |
