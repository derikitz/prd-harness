---
description: Pick the next ready task, run the checks its risk level needs, and commit it
argument-hint: [task ID, or blank to pick automatically]
---

Follow `.claude/harness/WORKFLOW.md`. You are the project manager for this run.

0. If the project has code but no `code-doc.md`, suggest running `/codedoc` first — otherwise every agent explores the codebase on its own.
1. **Pick.** Run `node .claude/harness/board.js --json`.
   - If `inProgress` has a task, resume it instead of starting another.
   - Else if `$ARGUMENTS` names a task, use it.
   - Else take the first task in `ready` — it's already in priority order.
   - If nothing is ready, say so in one line (with any blocking gaps from `gaps`) and stop. Don't do anything else.
2. **Gate.** If the task has `approval: required`, show its scope and ask the user to approve. If they don't, take the next ready task instead.
3. **Start.**
   - In a git repo, run `git status`. If there are uncommitted changes, list them and ask the user whether to commit them first, leave them out of this task's commit, or stop.
   - Move the file to `tasks/doing/`, set `status: doing`, add a Log line.
4. **Build.** Delegate to the `engineer` subagent, passing the task file path. Keep its agent ID.
   - If it reports a blocker, move the task to `tasks/blocked/` with the reason in the Log, tell the user what's needed, and stop.
5. **Check.** Move the file to `tasks/review/` (status + Log). Run only the checks the task's `risk` needs, in this order, passing the task file path, and log each verdict:

   | risk | checks |
   |---|---|
   | `low` | `reviewer` (pass `model: haiku`) |
   | `normal` | `tester` → `reviewer` |
   | `high` | `tester` → `security` → `reviewer` |

   - **Fixes:** if a check returns FAIL, continue the *same* engineer (SendMessage to its agent ID) with the findings — don't start a new engineer. Then re-run that check and the ones after it. One fix round per check.
   - If the reviewer reports Medium/Low security findings that weren't fixed, add them to Open Findings in `docs/security.md` (create it from `.claude/harness/templates/security.md` if missing).
6. **Close.**
   - All PASS: move to `tasks/done/`, add a Log line, and update the work package status in `docs/wbs.md` if all its tasks are done.
   - Still FAIL after the fix round: move the task to `tasks/todo/` with the findings in the Log. Don't commit; say that its changes are left uncommitted.
7. **Commit** (git repos, PASS only — WORKFLOW.md rule 14):
   - Stage only this task's files: the files in its Notes, its test files, the task file itself, and `code-doc.md`, `test-doc.md`, `docs/wbs.md`, `docs/security.md` if changed. Never `git add -A`, never `.env` or other secrets.
   - Message: `<id>: <title> (<requirement IDs>)`, e.g. `T-1.2-a: Login form (FR-003)`. Don't push.
8. **Report** in a few lines: the task, the outcome, the commit, files changed, and the next ready task.
