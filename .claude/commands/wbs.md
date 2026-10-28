---
description: Build or update the WBS from the PRD
---

Follow `.claude/harness/WORKFLOW.md`. Read `docs/prd.md`; if it doesn't exist, stop and suggest `/prd`.

Use `approved` requirements. If none are approved yet, ask the user whether to plan from the drafts.

**If `docs/wbs.md` doesn't exist:**
1. Copy `.claude/harness/templates/wbs.md` to `docs/wbs.md`.
2. Decompose the product into deliverables, then into work packages (S or M size). Apply the 100% rule. Put setup/CI/tooling under an `(enabler)` branch. Include a `Security (enabler)` branch with a security baseline package sized to the PRD's Security and Privacy section, and a test setup package if the project has no test framework.
3. Fill the Work Packages table: link each package to its requirement IDs and to the packages it depends on.

**If it exists:** reconcile it with the current PRD.
- Add work packages for new or changed requirements, using new codes.
- For requirements that were dropped, mark their packages `dropped` and tell the user — don't delete them.
- Never renumber existing codes.

In both cases: update the Coverage Check and `prd_version`, then show the tree and any coverage gaps. Suggest `/tasks` next.
