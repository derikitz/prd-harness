---
description: Log a bug as a task linked to the requirement it breaks, ready for /next
argument-hint: <what's wrong>
---

Follow `.claude/harness/WORKFLOW.md` (rule 15). Bug report: $ARGUMENTS

1. **Is it a bug?** It's a bug if the software doesn't do what an existing requirement or its acceptance criteria say. If it's really a new feature or a changed requirement, say so and suggest `/prd <change>` instead — stop here.
2. **Pin it down.** If the report is vague, ask the user for the steps to reproduce, what they expected and what happened. Use `code-doc.md` to locate the likely code (rule 13); don't fix anything yet.
3. **Link it.** Find the requirement it breaks (`docs/prd.md`) and its WBS work package (`docs/wbs.md`). If a done task built that code, note its ID. If no requirement fits (e.g. a crash in tooling), link it to the relevant `(enabler)` work package.
4. **Create the task** in `tasks/todo/` from `.claude/harness/templates/task.md`:
   - ID `B-<next number>` (e.g. `B-001`) — check every `tasks/` folder for the highest existing `B-` number. File: `<id>-<short-slug>.md`.
   - Frontmatter: `type: bug`, the `wbs` and `requirements` you found, `found_in: <task ID or blank>`, and `risk` by the usual rules (`/tasks` describes them) — a bug is at least `normal` unless it's purely cosmetic.
   - Context: steps to reproduce, expected, actual.
   - Acceptance criteria: the bug no longer reproduces, plus a regression test for it (normal/high risk).
5. Reply with the bug ID and its place in the `/next` order (run `node .claude/harness/board.js`). Bugs go before feature tasks of the same priority.
