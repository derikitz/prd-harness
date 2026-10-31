---
description: Turn WBS work packages into task files
argument-hint: [WBS code, or blank for every package without tasks]
---

Follow `.claude/harness/WORKFLOW.md`. Read `docs/wbs.md` and `docs/prd.md`; if the WBS doesn't exist, stop and suggest `/wbs`.

Scope: $ARGUMENTS — if blank, every work package with status `todo` or `in-progress` that has no task files yet (check all `tasks/*/` folders), plus every task the board reports as changed in the PRD (run `node .claude/harness/board.js` — gaps saying `changed in PRD`). For an `in-progress` package (from an imported WBS), check `code-doc.md` for what's already built and create tasks only for what's left.

## Tasks hit by a PRD change
Read the PRD Changelog rows newer than the task's `prd_version`, and the changed requirements. Then, by the task's folder:
- **`todo/` or `blocked/`:** update its Scope and Acceptance Criteria in place, set `prd_version` to the current PRD version, and add a dated line under `## Amendments` (create the section after Notes): which version, what changed, which criteria. If the change drops the requirement, ask the user what to do with the task.
- **`doing/` or `review/`:** don't touch it — its session finishes it as written. Create a follow-up task (next free letter in the same work package) for just the difference, with `depends_on` that task.
- **`done/`:** never reopen it. Create a follow-up task for the difference, with Context naming the original task and the PRD version.

A follow-up task gets the current `prd_version`; that's what clears the board's gap. If the change needs nothing new from a started or done task (e.g. only wording), say so and ask the user — a follow-up with an empty scope isn't worth a task.

## New tasks
For each work package in scope:
1. Split it into tasks. Each task is one focused change that can be finished and verified in one session; most packages need 1–3.
2. Create each task in `tasks/todo/` from `.claude/harness/templates/task.md`, named per WORKFLOW.md.
   - Acceptance criteria: derive from the linked PRD requirements, made specific to this task and checkable.
   - `prd_version`: the PRD's current `version`.
   - `depends_on`: include tasks from packages this package depends on.
   - `approval: required` for anything risky (see WORKFLOW.md rule 8).
   - `risk` (decides which checks run — see WORKFLOW.md rule 11):
     - `low`: no logic change — copy, styling, docs, config values; enabler setup with no runtime logic (repo scaffolding, linter/formatter/CI config, tooling).
     - `high`: touches authentication, authorization, payments, personal data, file uploads, external input parsing, database migrations, or secrets (including CI or deploy config that handles secrets).
     - `normal`: everything else.
     - If a task fits both `low` and `high`, it's `high`; if you're unsure between `low` and `normal`, pick `normal`.
   - UI tasks: reference the relevant `docs/design.md` sections in Context, if the file exists.
3. Don't create duplicates — skip IDs that already exist in any `tasks/` folder.

Finish with a table: ID, title, depends_on, approval, risk — and a list of amended tasks with what changed.
