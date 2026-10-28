---
description: Build or update the WBS from the PRD, or import an existing one
argument-hint: [import <file> | blank to build/update]
---

Follow `.claude/harness/WORKFLOW.md`. Read `docs/prd.md`; if it doesn't exist or has no requirement rows in the template's table format, stop and suggest `/prd` (or `/prd import <file>` if the user has an existing PRD).

Request: $ARGUMENTS

Use `approved` requirements. If none are approved yet, ask the user whether to plan from the drafts.

**If the request is `import <file>`, or `docs/wbs.md` exists but has no work package rows in the template's table format:** import it — see "Importing an existing WBS" below.

**If `docs/wbs.md` doesn't exist:**
1. Copy `.claude/harness/templates/wbs.md` to `docs/wbs.md`.
2. Decompose the product into deliverables, then into work packages (S or M size). Apply the 100% rule. Put setup/CI/tooling under an `(enabler)` branch. Include a `Security (enabler)` branch with a security baseline package sized to the PRD's Security and Privacy section, and a test setup package if the project has no test framework.
3. Fill the Work Packages table: link each package to its requirement IDs and to the packages it depends on.

**If it exists:** reconcile it with the current PRD.
- Add work packages for new or changed requirements, using new codes.
- For requirements that were dropped, mark their packages `dropped` and tell the user — don't delete them.
- Never renumber existing codes.

In all cases: update the Coverage Check and `prd_version`, then show the tree and any coverage gaps. Suggest `/tasks` next.

## Importing an existing WBS
A one-time conversion: afterwards `docs/wbs.md` is the only source of truth and no agent reads the original again.
1. **Protect the original.** If it *is* `docs/wbs.md`, ask the user before renaming it to `docs/wbs.source.md`. Never edit or delete the original.
2. **Read it once**, by section for long files. If you can't read the format (e.g. `.xlsx`, `.mpp`), ask the user to export it as CSV, Markdown or PDF. If it holds both a PRD and a WBS (e.g. `PRD & WBS.md`), read only the breakdown part — the requirements part was already imported by `/prd import`, and `docs/prd.md` is now its source of truth. Never edit `docs/prd.md` here; if the breakdown implies requirements that aren't there, list them for `/prd`.
3. **Convert into the template:**
   - Keep the original's structure and codes if they are numeric (`1`, `1.2`, `1.2.3`). Otherwise assign new codes and keep the original's in the name, e.g. `Login form (src: A-4)`. This is the only time codes may be assigned freely — no task references them yet.
   - Link each package to the PRD requirement IDs it delivers (use the `src:` references in `docs/prd.md`). Packages that match no requirement: enabler work goes under an `(enabler)` branch; anything else, list it and ask the user whether to add a requirement (`/prd`) or drop it.
   - Status: finished work → `done`; in progress → `in-progress`; the rest → `todo`. Packages estimated L or larger: split them, or list them for the user.
   - Add what the original lacks per this workflow — the `Security (enabler)` branch and a test setup package — and tell the user you added them.
   - Set `source:` in the frontmatter to the original's path.
