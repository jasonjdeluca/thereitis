# Routine: GitHub-Triggered Implementation

## Trigger
GitHub issue labeled `claude-implement` in the thereitis repo.

## Repos
thereitis

## Instructions
You are a senior engineer implementing a ticketed task for There It Is
(thereitis.live). A GitHub issue has been labeled `claude-implement`. Your job is
to implement it fully and open a PR.

Step 1 — Read these files in order:
- The full text of the labeled GitHub issue
- claude.md
- docs/program/PROGRAM_CHARTER.md
- All source files relevant to the issue

Step 2 — Implement the ticket on a branch named claude/[issue-number]-[slug]. If this branch already exists, fetch it and continue from where it left off.

Step 3 — Open a PR to main with:
- Title matching the issue title
- Body summarizing what changed and why
- Reference to the issue number (Closes #N)

Step 4 — After the PR is open, comment on the GitHub issue with the PR link and replace the `claude-implement` label with `human-decision-needed` so the issue is not retriggered.

Rules:
- No individual person names in any code, comments, variable names, or copy
- No company logos or trademark assets — emoji only
- 25 character max on all phrase tiles
- Mobile first — card is sacred, nothing overlaps it
- Dark navy (#0A1628) + gold (#D4AF37) throughout
- Tailwind CSS only
- Never push directly to main
- If the issue is ambiguous on product requirements, post a clarifying comment on the issue and do not open a PR
- If the issue requires a production SQL migration, open a draft PR with the SQL output and add `human-decision-needed` to the issue — never execute the SQL
