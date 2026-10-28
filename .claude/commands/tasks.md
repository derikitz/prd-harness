---
description: Turn WBS work packages into task files
argument-hint: [WBS code, or blank for every package without tasks]
---

Follow `.claude/harness/WORKFLOW.md`. Read `docs/wbs.md` and `docs/prd.md`; if the WBS doesn't exist, stop and suggest `/wbs`.

Scope: $ARGUMENTS — if blank, every work package with status `todo` that has no task files yet (check all `tasks/*/` folders).

For each work package in scope:
1. Split it into tasks. Each task is one focused change that can be finished and verified in one session; most packages need 1–3.
2. Create each task in `tasks/todo/` from `.claude/harness/templates/task.md`, named per WORKFLOW.md.
   - Acceptance criteria: derive from the linked PRD requirements, made specific to this task and checkable.
   - `depends_on`: include tasks from packages this package depends on.
   - `approval: required` for anything risky (see WORKFLOW.md rule 8).
   - `risk` (decides which checks run — see WORKFLOW.md rule 11):
     - `low`: no logic change — copy, styling, docs, config values.
     - `high`: touches authentication, authorization, payments, personal data, file uploads, external input parsing, database migrations, or secrets.
     - `normal`: everything else.
   - UI tasks: reference the relevant `docs/design.md` sections in Context, if the file exists.
3. Don't create duplicates — skip IDs that already exist in any `tasks/` folder.

Finish with a table: ID, title, depends_on, approval, risk.
