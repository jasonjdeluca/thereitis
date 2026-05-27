# Transcript Intake Pilot: 5-Company Verifier Summary

Source inputs:
- Discovery queue: `data/transcript-intake/queue.json`
- Discovery outputs: `data/transcript-intake/discovery/*.json`
- Verifier dry-run results supplied from local PowerShell

No `data/transcript-intake/verified/*.json` files were present in this worktree when this report was created, so verifier counts below reflect the latest local dry-run summary.

| Company | Ticker | Discovery status | Verified | Candidate PDF fetched | Browser required | Failed | Assessment |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Coca-Cola | KO | candidate_links_found | 0 | 12 | 5 | 0 | needs_browser_fallback |
| Home Depot | HD | candidate_links_found | 2 | 15 | 0 | 0 | ready_for_content_extraction |
| Citigroup | C | partial_found | 1 | 13 | 0 | 3 | needs_manual_review |
| JPMorgan Chase | JPM | partial_found | 16 | 1 | 0 | 0 | ready_for_content_extraction |
| Visa | V | partial_found | 0 | 4 | 0 | 13 | needs_discovery_retry |

## Company Assessments

### KO: needs_browser_fallback

KO has official PDF candidates for every target quarter. Twelve PDFs fetch successfully and are ready for downstream PDF text extraction work. The five later quarters return HTTP 403 after verifier retry and should be handled by a future browser fallback rather than treated as bad discovery.

### HD: ready_for_content_extraction

HD has full target-quarter coverage with no browser-required or failed candidates in the dry run. The mix of verified transcripts and fetched PDFs is ready for the next extraction pass.

### C: needs_manual_review

Citigroup has strong coverage for most quarters, but three failed candidates remain. The successful fetched PDFs can proceed to extraction, while the failed quarters need review before relying on the company set as complete.

### JPM: ready_for_content_extraction

JPM is the strongest pilot result: nearly all quarters were verified directly, with one fetched PDF candidate. This company is ready for content extraction.

### V: needs_discovery_retry

Visa has too many failed quarters to proceed as a complete intake set. The four fetched PDFs can be retained, but discovery should be retried or widened for the remaining failed quarters before content extraction.

## Pilot Takeaways

- `candidate_pdf_fetched` is a useful positive state for official PDFs when text extraction remains inconclusive.
- `browser_required` cleanly separates protected official assets from true failed discovery.
- HD and JPM are ready to exercise the next extraction stage.
- KO is ready for extraction on fetched PDFs, with a browser fallback needed for the 403-protected PDF group.
- C and V need follow-up before they can be treated as complete pilot inputs.
