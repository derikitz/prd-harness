---
id: T-1.1-a
title: <short imperative title>
type: task           # task | bug (bugs also get found_in: <task ID>)
wbs: 1.1
requirements: [FR-001]
status: todo         # todo | doing | review | done | blocked
depends_on: []       # task IDs
approval: none       # none | required
risk: normal         # low | normal | high — decides which checks /next runs
estimate: S
prd_version: 0.1     # PRD version its criteria were written against — the board flags it when a later PRD change touches its requirements
blocked_by:          # when in blocked/: decision | secret | external | a task ID (ready again once that task is done)
worktree:            # session worktree working on it, set by /next when claimed (git repos)
---

# T-1.1-a: <title>

## Context
Why this task exists and what the engineer needs to know: relevant PRD section, existing files to look at.

## Scope
- In:
- Out:

## Acceptance Criteria
- [ ]

## Notes
Decisions made, gotchas.

**Changed files** (engineer): one line each — `path` — what changed.
**Verify with** (engineer): the exact test/build/lint commands run.

<!-- Added only when needed:
## Progress — written by /next when the task is parked unfinished: criteria done, criteria left, files touched, next step, blocker.
## Amendments — written by /tasks when a PRD change updates this task: `YYYY-MM-DD — PRD 0.4: FR-003 now requires MFA; criterion 2 changed`. -->

## Tests
Filled in by the tester (normal/high risk): test cases, where they live, how to run them, results.

## Security
Filled in by the security agent (high risk) or the reviewer: verdict and findings (SEC IDs).

## Log
- YYYY-MM-DD — created from WBS 1.1
