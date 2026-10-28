---
description: Show the task board and traceability gaps (read-only)
---

Follow `.claude/harness/WORKFLOW.md`. Don't change any files.

Read `docs/prd.md`, `docs/wbs.md` and every file in `tasks/*/`, then report:

1. **Board:** task count per folder. List the tasks in `doing/`, `review/` and `blocked/` (with the block reason from the Log).
2. **Next up:** the ready tasks, in the order `/next` would pick them. Flag any that need approval.
3. **Progress:** done vs. total tasks per top-level WBS area and per PRD milestone.
4. **Gaps:**
   - Approved requirements with no work package
   - Work packages with no tasks
   - Tasks pointing to WBS codes or requirement IDs that don't exist
   - `depends_on` entries pointing to tasks that don't exist (or cycles)
   - Tasks whose frontmatter `status` doesn't match their folder
   - Open questions in the PRD

Keep it short. Use tables where they help.
