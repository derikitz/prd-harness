# Project Workflow: PRD → WBS → Tasks

Planned work flows through three layers. Each layer traces back to the one above it, so any change can be traced to the requirement that justified it.

| Layer | File | Answers | IDs |
|---|---|---|---|
| PRD | `docs/prd.md` | What are we building, for whom, and why? | `FR-001`, `NFR-001` |
| WBS | `docs/wbs.md` | Which deliverables make up the work? | `1`, `1.2`, `1.2.3` |
| Tasks | `tasks/<status>/*.md` | What does one agent do in one session? | `T-1.2-a` |

Supporting records: `code-doc.md` (the project map every agent navigates by, kept by the engineer — rule 13), `test-doc.md` (test cases, kept by the tester), `docs/security.md` (baseline and findings `SEC-001`) and, for UI projects, `docs/design.md` (design system and screen specs, from `/design`).

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
7. **Ready means unblocked.** A task is ready when it's in `tasks/todo/` and every ID in its `depends_on` is in `tasks/done/`.
8. **Approval gates.** A task with `approval: required` (anything risky per AGENTS.md principle 13 — migrations, deletions, public API changes — plus new dependencies or secrets) is not started until the user approves it.
9. **Leave a trail.** Append a dated line to the task's `## Log` on every status change: what was done, or why it's blocked. Nothing moves to `done/` with unchecked acceptance criteria.
10. **Keep the WBS in sync.** When the last task of a work package reaches `done/`, mark that work package `done` in `docs/wbs.md`.
11. **Checks scale with risk.** Every task has `risk: low | normal | high`. Low → reviewer only. Normal → tester + reviewer. High → tester + security + reviewer. The reviewer always does a light OWASP pass. A task reaches `done/` only when every check it needs passes. Using this workflow counts as the user's go-ahead to create and maintain `code-doc.md` and `test-doc.md`, and for the tester to write tests (this replaces "ask first" in AGENTS.md principles 4–5). Installing a test framework is still a new dependency that needs approval.
12. **Security from the start.** The PRD covers security and privacy; the WBS has a `Security (enabler)` branch. Security findings get IDs (`SEC-001`) in `docs/security.md`; fixes that need their own work become work packages under the security branch.
13. **Map first.** `code-doc.md` is the project map. Every agent reads the sections relevant to its task first (find them by heading — don't read the whole file when it's large), then opens only the files it points to. Search the codebase only for what the map doesn't cover — the engineer adds the missing entry, checkers report it as a gap. The map is for navigation: always read the actual code you change or verify — never judge code from its doc entry.
14. **One commit per task.** In a git repo, `/next` builds each task on its own branch (in the session's worktree) and, when it reaches `done/`, squash-merges it into the main checkout as one commit: only that task's files plus its board move, with the message `<id>: <title> (<requirement IDs>)`. It never pushes. This keeps each review's `git diff` to one task and lets any task be undone with `git revert`.
15. **Bugs skip the planning round.** A bug — the software not doing what an existing requirement says — goes straight onto the board with `/bug`, as a `B-` task linked to the requirement it breaks and its work package. Bugs go before feature tasks of the same priority. A "bug" that needs a new or changed requirement is a PRD change instead.
16. **Project customizations live in `.claude/harness/local.md`.** Before following any kit command or agent instructions, read the matching section of that file (`All agents`, your role, or `Commands`) if it has content — it overrides the kit's defaults. `init --force` never overwrites it, so customize there, not in the kit's files.

## Parallel Sessions
Several terminals can run `/next` at once (git repos):
- **The board stays in the main checkout.** `tasks/` and `docs/wbs.md` are only ever changed there, so every session sees which tasks are in progress. A task in `doing/` or `review/` belongs to the session working on it — other sessions skip it.
- **Claiming is atomic.** `node .claude/harness/board.js claim <id>` moves the task to `doing/`; if two sessions claim the same task, only one succeeds.
- **Each session gets a worktree** (`.claude/worktrees/session-N`), reused task after task so dependencies are installed once. Each task gets its own branch `task/<id>` in it. All code, `code-doc.md`, `test-doc.md` and `docs/security.md` changes happen there; agents edit the task file in the main checkout.
- **Merges take turns.** `board.js lock <id>` / `unlock` makes sure only one session squash-merges into the main checkout at a time. The task branch is deleted after the merge; the worktree stays for the next task.
- **Unfinished tasks keep their work on their branch.** A failed or blocked task is committed as WIP to `task/<id>` and frees its worktree; whichever session claims it next continues that branch.
- A task's dependents become ready only once it's merged (in `done/`).
- Without git, there are no worktrees: run one `/next` at a time.

## Naming
- Task ID: `T-<wbs code>-<letter>`, e.g. `T-1.2-a`, `T-1.2-b`. Bug ID: `B-<number>`, e.g. `B-001`.
- Task file: `<id>-<short-slug>.md`, e.g. `tasks/todo/T-1.2-a-login-form.md`.

## Board Script
`node .claude/harness/board.js` (add `--json` for machine-readable output) reads the board with plain code — no tokens: counts per folder, the ready tasks in `/next` order, and traceability gaps (unlinked requirements, packages without tasks, broken IDs and dependencies, status/folder mismatches). Use it instead of reading every task file. If Node isn't available, read the files directly. `claim`, `lock` and `unlock` are for `/next` (see Parallel Sessions).

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
| `/status` | Board summary and traceability gaps (read-only) |

### Keeping usage down
- One engineer per session. Fix rounds continue the same engineer rather than starting a new one. Each parallel `/next` session uses your plan's limits at the same time, so two sessions use them about twice as fast.
- Every subagent start re-reads context, so checks run only when the task's risk calls for them.
- A current `code-doc.md` saves every agent from exploring the codebase (rule 13). If it has drifted, run `/codedoc` rather than letting each agent search.
- `/loop 30m /next` re-checks the board on every run even when nothing is ready — use it only when there's a queue of ready tasks, otherwise run `/next` by hand.
- Use the board script (above) for anything about the board's state, instead of reading task files.
- To change a subagent's model, override it in `.claude/harness/local.md`, or edit `model:` in its file in `.claude/agents/` (an edit there is lost on `init --force`).
