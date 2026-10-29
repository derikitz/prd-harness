---
description: Pick the next ready task, run the checks its risk level needs, and commit it
argument-hint: [task ID, or blank to pick automatically]
---

Follow `.claude/harness/WORKFLOW.md`. You are the project manager for this run. Other `/next` sessions may be running at the same time in other terminals — the board (`tasks/`, `docs/wbs.md`) lives in this main checkout and is shared; each session makes its code changes on the task's branch in its own worktree (WORKFLOW.md "Parallel Sessions").

0. If the project has code but no `code-doc.md`, suggest running `/codedoc` first — otherwise every agent explores the codebase on its own.
1. **Pick.** Run `node .claude/harness/board.js --json`.
   - Tasks in `inProgress` belong to other sessions — never take them over. Mention them in one line.
   - If `$ARGUMENTS` names a task in `tasks/doing/` or `tasks/review/` (e.g. its session crashed), resume it in its existing worktree: skip to the step matching its folder.
   - Else if `$ARGUMENTS` names a task, use it. Else take the first task in `ready` — it's already in priority order.
   - If nothing is ready, say so in one line (with any blocking gaps from `gaps`) and stop. Don't do anything else.
2. **Gate.** If the task has `approval: required`, show its scope and ask the user to approve. If they don't, take the next ready task instead.
3. **Claim.** Run `node .claude/harness/board.js claim <id>` — add `--worktree session-N` if this conversation already used a session worktree, so you keep reusing it. It moves the task to `tasks/doing/` and, in a git repo, checks out branch `task/<id>` (new from the latest commit, or the task's existing branch) in a free session worktree under `.claude/worktrees/`, creating one if none is free. Remember which worktree you got.
   - If it fails because another session just claimed the task, go back to step 1 and take the next ready task.
   - Do what its `setup:` line says: on a new worktree, or when dependency files changed, install dependencies there with the project's package manager, plus any setup in `local.md`. On a new worktree, if the main checkout has a `.env` (or similar) that tests need, ask the user once whether to copy it into worktrees, and record the answer under `## Commands` in `local.md` so you don't ask again.
   - The branch starts from the last commit, so uncommitted changes in the main checkout aren't in it — mention any outside `tasks/` in one line.
4. **Build.** Delegate to the `engineer` subagent, passing the task file path and the worktree's absolute path. Keep its agent ID.
   - If it reports a blocker, park the task (step 6) in `tasks/blocked/` with the reason in the Log, tell the user what's needed, and stop.
5. **Check.** Move the file to `tasks/review/` (status + Log). Run only the checks the task's `risk` needs, in this order, passing the task file path and worktree path, and log each verdict:

   | risk | checks |
   |---|---|
   | `low` | `reviewer` (pass `model: haiku`) |
   | `normal` | `tester` → `reviewer` |
   | `high` | `tester` → `security` → `reviewer` |

   - **Fixes:** if a check returns FAIL, continue the *same* engineer (SendMessage to its agent ID) with the findings — don't start a new engineer. Then re-run that check and the ones after it. One fix round per check.
   - If the reviewer reports Medium/Low security findings that weren't fixed, add them to Open Findings in `docs/security.md` in the worktree (create it from `.claude/harness/templates/security.md` if missing).
6. **Still FAIL after the fix round:** park the task in `tasks/todo/` with the findings in the Log, say so and stop.
   **Parking** frees the worktree for the next task while keeping the work: in the worktree, stage the task's changed and new files (never `.env` or other secrets), commit them as `WIP <id>: <reason>`, and run `git checkout --detach`. Then move the task file (status + Log, and clear `worktree:`). The next claim of this task continues its branch.
7. **Merge** (all PASS). Without git: move the task to `tasks/done/`, add a Log line, update `docs/wbs.md`, and go to step 8. With git:
   1. In the worktree, stage only this task's files — the files in its Notes, its test files, and `code-doc.md`, `test-doc.md`, `docs/security.md` if changed (never `git add -A`, never `.env` or other secrets) — and commit. Nothing under `tasks/` belongs on the branch.
   2. In the main checkout, run `node .claude/harness/board.js lock <id>`. If another session holds the lock, wait briefly and retry; if it's held for more than a few minutes, ask the user.
   3. Check `git diff --cached` is empty (otherwise ask the user — those staged changes would end up in this commit). Run `git merge --squash task/<id>`. On conflicts: in `code-doc.md`, `test-doc.md` and other docs keep both sides' entries; in code, show the conflict to the user and ask. If the user stops here, undo the squash with `git reset --merge` (it keeps other sessions' uncommitted board changes), unlock, and leave the task in `review/`.
   4. Move the task file to `tasks/done/` (status + Log line), and update the work package status in `docs/wbs.md` if all its tasks are done. Stage the task file at its old and new paths and `docs/wbs.md`.
   5. Commit: `<id>: <title> (<requirement IDs>)`, e.g. `T-1.2-a: Login form (FR-003)`. Don't push. Then run `node .claude/harness/board.js unlock`.
   6. Clean up: in the worktree, `git checkout --detach` (it stays for this session's next task); then in the main checkout, `git branch -D task/<id>` (its changes are in the squash commit).
8. **Report** in a few lines: the task, the outcome, the commit, files changed, the tasks other sessions are working on, and the next ready task.
