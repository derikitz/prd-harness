---
description: Create the PRD by interviewing the user, or apply a change to it
argument-hint: [change to make, or blank to create/review]
---

Follow `.claude/harness/WORKFLOW.md`. You are working on `docs/prd.md`.

Request: $ARGUMENTS

**If `docs/prd.md` doesn't exist:**
1. If the project already has code, read `code-doc.md` (suggest `/codedoc` first if it's missing), plus the README and manifest. Features that already exist and work become requirements with status `done`.
2. Copy `.claude/harness/templates/prd.md` to `docs/prd.md`.
3. Interview the user to fill it in — a few focused questions at a time (use AskUserQuestion when the options are clear), starting with problem, users and goals, then requirements and acceptance criteria, then the Security and Privacy section (data handled, roles, authentication, compliance). Don't invent business rules; put unknowns under Open Questions.
4. Show a short summary of the requirements and ask the user which to mark `approved`.

**If it exists:**
1. Apply the requested change. If no change was given, review the PRD for gaps — vague requirements, missing acceptance criteria, unresolved open questions — and propose fixes.
2. Changing an `approved` requirement needs the user's confirmation. Bump the version and add a Changelog row.
3. Search `docs/wbs.md` and `tasks/` for the affected requirement IDs, list what's impacted, and suggest running `/wbs`.
