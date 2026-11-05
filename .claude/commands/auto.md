---
description: Run /next on several ready tasks in a row, stopping at anything that needs you (Claude Code and Codex only)
argument-hint: [--limit=<n>, default 2]
disable-model-invocation: true
---

Follow `.claude/harness/WORKFLOW.md` and the `/next` command (`.claude/commands/next.md`). This runs `/next` for you on up to N tasks in a row. It never changes the rules: approval gates, checks, one commit per task and no pushing all work exactly as in `/next`.

1. **Limit.** Read `--limit=<n>` from $ARGUMENTS (a whole number of 1 or more). Default 2. If it is anything else, say so and stop.
2. **Repeat** the `/next` procedure (steps 0–8) for up to N tasks, one after the other, reusing this session's worktree. Before each task, run `node .claude/harness/board.js --json` and take the first task in `ready`.
3. **Stop at the first of these, and say which:**
   - Nothing is ready.
   - N tasks have been handled.
   - The next task has `approval: required` — don't ask for approval mid-run and don't skip it; tell the user to run `/next <id>` to approve it.
   - A task was parked or blocked, or a check still FAILs after its fix round. Don't carry on to later tasks.
   - A question only the user can answer (a merge conflict in code, staged changes in the main checkout, copying a `.env` into the worktree, a lock held for more than a few minutes).
4. **Report once at the end:** each task with its outcome and commit, the reason the run stopped, and the next ready task.
