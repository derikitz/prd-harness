---
description: Show the task board and traceability gaps (read-only)
---

Follow `.claude/harness/WORKFLOW.md`. Don't change any files.

1. Run `node .claude/harness/board.js` and show its output as-is: the board, the ready tasks in `/next` order, and the gaps. (If Node isn't available, work these out by reading `tasks/*/`, `docs/prd.md` and `docs/wbs.md`.)
2. Add only what the script can't tell:
   - **Progress per milestone:** done vs. total tasks for each milestone in `docs/prd.md` (match its requirement IDs to the tasks' `requirements`).
   - **Open questions** in the PRD.
   - For each gap, one line on how to fix it (usually `/wbs`, `/tasks` or moving a file).

Keep it short.
