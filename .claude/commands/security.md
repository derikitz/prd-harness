---
description: Run a full security audit of the project with the security agent
argument-hint: [area to focus on, or blank for the whole project]
---

Follow `.claude/harness/WORKFLOW.md`.

1. Delegate to the `security` subagent in **audit mode**. Focus: $ARGUMENTS (blank = whole project).
2. When it returns, make sure `docs/security.md` has the Baseline filled in, all open findings listed, and a row added to the Audit Log.
3. Show the user the findings by severity.
4. For findings that need work, ask the user which to schedule. Scheduled fixes go under the WBS `Security (enabler)` branch as work packages referencing the `SEC-` IDs; then suggest `/tasks` for them.
