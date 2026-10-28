---
description: Pick the next ready task and run it through the checks its risk level needs
argument-hint: [task ID, or blank to pick automatically]
---

Follow `.claude/harness/WORKFLOW.md`. You are the project manager for this run.

0. If the project has code but no `code-doc.md`, suggest running `/codedoc` first — otherwise every agent explores the codebase on its own.
1. **Pick.**
   - If a task is already in `tasks/doing/`, resume it instead of starting another.
   - Else if `$ARGUMENTS` names a task, use it.
   - Else choose a ready task: highest PRD priority (Must > Should > Could) of its requirements, then lowest WBS code.
   - If nothing is ready, say so in one line (and what's blocking, if anything) and stop. Don't do anything else.
2. **Gate.** If the task has `approval: required`, show its scope and ask the user to approve. If they don't, pick the next ready task instead.
3. **Start.** Move the file to `tasks/doing/`, set `status: doing`, add a Log line.
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
   - Still FAIL after the fix round: move the task to `tasks/todo/` with the findings in the Log.
7. **Report** in a few lines: the task, the outcome, files changed, and the next ready task.
