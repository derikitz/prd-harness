# Project Workflow: PRD → WBS → Tasks

Planned work flows through three layers. Each layer traces back to the one above it, so any change can be traced to the requirement that justified it.

| Layer | File | Answers | IDs |
|---|---|---|---|
| PRD | `docs/prd.md` | What are we building, for whom, and why? | `FR-001`, `NFR-001` |
| WBS | `docs/wbs.md` | Which deliverables make up the work? | `1`, `1.2`, `1.2.3` |
| Tasks | `tasks/<status>/*.md` | What does one agent do in one session? | `T-1.2-a` |

Supporting records: `code-doc.md` (the project map every agent navigates by, kept by the engineer — rule 13), `test-doc.md` (test cases, kept by the tester), `docs/security.md` (baseline and findings `SEC-001`), `docs/compliance.md` (ASVS and SOC 2 results, from `/check-sec` and `/check-soc2`) and, for UI projects, `docs/design.md` (design system and screen specs, from `/design`).

Templates are in `.claude/harness/templates/`.

## When This Applies
- Use it for planned feature work on the project.
- Small, direct requests from the user (a quick fix, a question, a one-off script) don't need a task — just do them. If one grows bigger than expected, suggest adding it to the PRD/WBS rather than letting it expand silently.

## Existing PRD or WBS
If the project already has a PRD or WBS in its own format, convert it once with `/prd import <file>` and then `/wbs import <file>` — for a combined file (e.g. `PRD & WBS.md`), pass the same file to both; each takes only its own part. The originals stay untouched for people to refer to, but from then on `docs/prd.md` and `docs/wbs.md` are the source of truth and agents never read the originals. That keeps every later command reading one compact file. The `source:` frontmatter field and `(src: …)` references point back to the original.

## Rules
1. **Top-down changes.** Change the PRD first, then the WBS, then tasks. No task without a WBS work package; no work package without a PRD requirement — except enabler work (repo setup, CI, tooling), which lives under a WBS branch marked `(enabler)`, and bugs (rule 15).
2. **The user owns the PRD.** Draft and propose changes, but get the user's confirmation before marking a requirement `approved` or changing an approved one. Log every change in the PRD Changelog and bump its version.
3. **100% rule.** The children of a WBS element cover all of its scope and nothing outside it. Leaf elements are *work packages*: one deliverable, small enough to verify on its own.
4. **Never renumber.** Once a WBS code or task ID exists, don't change it — other files reference it. Mark obsolete items `dropped` instead of deleting them.
5. **Tasks are the unit of execution.** One task = one focused change an agent can finish and verify in one session. A work package has one or more tasks.
6. **Status is the folder.** A task lives in exactly one of `tasks/todo`, `doing`, `review`, `done`, `blocked`. Move the file to change status and keep `status:` in its frontmatter matching.
7. **Ready means unblocked.** A task is ready when it's in `tasks/todo/` and every ID in its `depends_on` is in `tasks/done/` — or it's in `tasks/blocked/` and the task in its `blocked_by` is done. A task hit by a later PRD change isn't ready until `/tasks` amends it (rule 17).
8. **Approval gates.** A task with `approval: required` (anything risky per AGENTS.md principle 13 — migrations, deletions, public API changes — plus new dependencies or secrets) is not started until the user approves it.
9. **Leave a trail.** Append a dated line to the task's `## Log` on every status change: what was done, or why it's blocked. Nothing moves to `done/` with unchecked acceptance criteria.
10. **Keep the WBS in sync.** When the last task of a work package reaches `done/`, mark that work package `done` in `docs/wbs.md`.
11. **Checks scale with risk.** Every task has `risk: low | normal | high`. Low → reviewer only. Normal → tester + reviewer. High → tester + security + reviewer. The reviewer always does a light OWASP pass. A task reaches `done/` only when every check it needs passes. Using this workflow counts as the user's go-ahead to create and maintain `code-doc.md` and `test-doc.md`, and for the tester to write tests (this replaces "ask first" in AGENTS.md principles 4–5). Installing a test framework is still a new dependency that needs approval.
12. **Security from the start.** The PRD covers security and privacy; the WBS has a `Security (enabler)` branch. Security findings get IDs (`SEC-001`) in `docs/security.md`; fixes that need their own work become work packages under the security branch.
13. **Map first.** `code-doc.md` is the project map. Every agent reads the sections relevant to its task first (find them by heading — don't read the whole file when it's large), then opens only the files it points to. Search the codebase only for what the map doesn't cover — the engineer adds the missing entry, checkers report it as a gap. The map is for navigation: always read the actual code you change or verify — never judge code from its doc entry.
14. **One commit per task.** In a git repo, `/next` builds each task on its own branch (in the session's worktree) and, when it reaches `done/`, squash-merges it into the main checkout as one commit: only that task's files plus its board move, with the message `<id>: <title> (<requirement IDs>)`. It never pushes. This keeps each review's `git diff` to one task and lets any task be undone with `git revert`.
15. **Bugs skip the planning round.** A bug — the software not doing what an existing requirement says — goes straight onto the board with `/bug`, as a `B-` task linked to the requirement it breaks and its work package. Bugs go before feature tasks of the same priority. A "bug" that needs a new or changed requirement is a PRD change instead.
16. **Project customizations live in `.claude/harness/local.md`.** Before following any kit command or agent instructions, read the matching section of that file (`All agents`, your role, or `Commands`) if it has content — it overrides the kit's defaults. `init --force` never overwrites it, so customize there, not in the kit's files.
17. **PRD changes reach the tasks.** Every task records the `prd_version` it was written against. When a Changelog row names one of its requirements in a later version, `/tasks` amends a `todo/` or `blocked/` task in place (logged under `## Amendments`); a task already started or done is never reopened — the difference becomes a follow-up task in the same work package.
18. **Unfinished work is resumable.** A parked task gets a `## Progress` section (done, left, next step, blocker) and, when blocked, `blocked_by: decision | secret | external | <task ID>`. Partly done tasks go before new ones of the same priority. When a task waits on a person, `/next` can offer to split it: the finished part is merged now, and the rest becomes a new blocked task.

## Parallel Sessions
Several terminals can run `/next` at once (git repos). The board stays in the main checkout; each session builds in its own worktree. `/next` reads `.claude/harness/parallel.md` for the details.

## Naming
- Task ID: `T-<wbs code>-<letter>`, e.g. `T-1.2-a`, `T-1.2-b`. Bug ID: `B-<number>`, e.g. `B-001`.
- Task file: `<id>-<short-slug>.md`, e.g. `tasks/todo/T-1.2-a-login-form.md`.

## Board Script
For the board state (counts, ready tasks, gaps) run `node .claude/harness/board.js` (add `--json` for machine-readable output) instead of reading task files. Details in `.claude/harness/parallel.md`.

## In Claude Code
The main session acts as project manager: it owns the PRD, WBS and task board, and delegates to subagents:

| Subagent | Model | Runs on | Role |
|---|---|---|---|
| `engineer` | session default | every task | Builds one task; fixes findings from the checks |
| `tester` | sonnet | normal, high | Writes and runs test cases |
| `security` | session default | high, `/security` | Deep OWASP check (`owasp-checklist` skill) |
| `reviewer` | sonnet (haiku for low) | every task | Final check: criteria, AGENTS.md, light OWASP pass (read-only) |

| Command | What it does |
|---|---|
| `/codedoc [area]` | Map the codebase into `code-doc.md`, or fix drift (run first on existing projects) |
| `/prd [change, or import <file>]` | Create the PRD by interviewing the user, import an existing one, or apply a change to it |
| `/design [screen or area]` | Optional, UI projects only: design system and screen specs in `docs/design.md` |
| `/wbs [import <file>]` | Build or update the WBS from the PRD, or import an existing one |
| `/tasks [wbs code]` | Turn work packages into task files |
| `/next [task id]` | Pick the next ready task, run the checks its risk needs, commit it |
| `/bug <what's wrong>` | Log a bug as a task linked to the requirement it breaks |
| `/security [area]` | Full-project security audit; schedule fixes as WBS work |
| `/check-sec [full or chapter]` | On demand, not part of `/next`: OWASP ASVS 5.0 check at the PRD's level, results in `docs/compliance.md` |
| `/check-soc2 [full]` | On demand, not part of `/next`: SOC 2 readiness (not certification), results in `docs/compliance.md` |
| `/status` | Board summary and traceability gaps (read-only) |

Tips for keeping usage down are in `.claude/harness/parallel.md`.
