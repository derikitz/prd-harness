---
description: Create the PRD by interviewing the user, import an existing one, or apply a change to it
argument-hint: [import <file> | change to make | blank to create/review]
---

Follow `.claude/harness/WORKFLOW.md`. You are working on `docs/prd.md`.

Request: $ARGUMENTS

**If the request is `import <file>`, or `docs/prd.md` exists but has no requirement rows in the template's table format (`| FR-001 | … |`):** import it — see "Importing an existing PRD" below.

**If `docs/prd.md` doesn't exist:**
1. Look for an existing PRD the user already wrote — check file names only (no content search) in the project root and `docs/` for names like `prd`, `requirements`, `spec`, `wbs`. If you find one, ask the user whether to import it instead of starting from scratch.
2. If the project already has code, read `code-doc.md` (suggest `/codedoc` first if it's missing), plus the README and manifest. Features that already exist and work become requirements with status `done`.
3. Copy `.claude/harness/templates/prd.md` to `docs/prd.md`.
4. Interview the user to fill it in — a few focused questions at a time (use AskUserQuestion when the options are clear), starting with problem, users and goals, then requirements and acceptance criteria, then the Security and Privacy section (data handled, roles, authentication, compliance). Don't invent business rules; put unknowns under Open Questions.
5. Show a short summary of the requirements and ask the user which to mark `approved`.

**If it exists:**
1. Apply the requested change. If no change was given, review the PRD for gaps — vague requirements, missing acceptance criteria, unresolved open questions — and propose fixes.
2. Changing an `approved` requirement needs the user's confirmation. Bump the version and add a Changelog row.
3. Search `docs/wbs.md` and `tasks/` for the affected requirement IDs, list what's impacted, and suggest running `/wbs`.

## Importing an existing PRD
The goal is a one-time conversion: afterwards `docs/prd.md` is the only source of truth and no agent reads the original again.
1. **Protect the original.** If it *is* `docs/prd.md`, ask the user before renaming it to `docs/prd.source.md`. Never edit or delete the original.
2. **Read it once.** Long files: read by section (or 20 PDF pages at a time) instead of all at once. If you can't read the format (e.g. `.docx`), ask the user to export it as Markdown or PDF. If the source is a WBS or backlog rather than a PRD, derive the requirements from its deliverables. If it holds both a PRD and a WBS (e.g. `PRD & WBS.md`), import only the requirements part — leave the breakdown for `/wbs import`, and use it only to resolve `src:` references, not to add requirements.
3. **Convert into the template** (`.claude/harness/templates/prd.md`), or merge into `docs/prd.md` if it's already in template format:
   - Give every requirement an `FR-`/`NFR-` ID (continue after the highest existing one when merging). Keep the original's ID or section in the row, e.g. `(src: REQ-12)`, so people can trace back.
   - Keep each requirement's meaning and wording. Make rows self-contained — no "see the original doc" — but don't copy narrative prose that no requirement needs.
   - Missing pieces (acceptance criteria, priority, Security and Privacy) go under Open Questions — don't invent them. Duplicates or conflicts with existing requirements: list them and ask.
   - If the project has code, use `code-doc.md` to mark requirements that are already built as `done`.
   - Set `source:` in the frontmatter to the original's path and add a Changelog row `Imported from <file>`.
4. **Approval.** Imported requirements start as `draft`. Ask the user once whether the original was already signed off: mark all `approved`, pick individually, or keep as `draft`.
5. Show a short summary (counts by status, open questions) and suggest `/wbs` — or `/wbs import <file>` if the project also has an existing WBS (the same file, if it held both).
