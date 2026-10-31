# Parallel Sessions, Board Script and Usage

Read on demand by `/next` (and by people). `WORKFLOW.md` has the rules every session needs.

## Parallel Sessions
Several terminals can run `/next` at once (git repos):
- **The board stays in the main checkout.** `tasks/` and `docs/wbs.md` are only ever changed there, so every session sees which tasks are in progress. A task in `doing/` or `review/` belongs to the session working on it — other sessions skip it.
- **Claiming is atomic.** `node .claude/harness/board.js claim <id>` moves the task to `doing/`; if two sessions claim the same task, only one succeeds.
- **Each session gets a worktree** (`.claude/worktrees/session-N`), reused task after task so dependencies are installed once. Each task gets its own branch `task/<id>` in it. All code, `code-doc.md`, `test-doc.md` and `docs/security.md` changes happen there; agents edit the task file in the main checkout.
- **Merges take turns.** `board.js lock <id>` / `unlock` makes sure only one session squash-merges into the main checkout at a time. The task branch is deleted after the merge; the worktree stays for the next task.
- **Unfinished tasks keep their work on their branch.** A failed or blocked task is committed as WIP to `task/<id>` and frees its worktree; whichever session claims it next continues that branch, after merging in the latest main.
- A task's dependents become ready only once it's merged (in `done/`).
- Without git, there are no worktrees: run one `/next` at a time.

## Board Script
`node .claude/harness/board.js` (add `--json` for machine-readable output) reads the board with plain code — no tokens: counts per folder, the ready tasks in `/next` order, and traceability gaps (unlinked requirements, packages without tasks, broken IDs and dependencies, status/folder mismatches, tasks behind a PRD change). Use it instead of reading every task file. If Node isn't available, read the files directly. `claim`, `lock` and `unlock` are for `/next` (see Parallel Sessions).

## Keeping usage down
- One engineer per session. Fix rounds continue the same engineer rather than starting a new one. Each parallel `/next` session uses your plan's limits at the same time, so two sessions use them about twice as fast.
- Every subagent start re-reads context, so checks run only when the task's risk calls for them.
- A current `code-doc.md` saves every agent from exploring the codebase (rule 13). If it has drifted, run `/codedoc` rather than letting each agent search.
- `/loop 30m /next` re-checks the board on every run even when nothing is ready — use it only when there's a queue of ready tasks, otherwise run `/next` by hand.
- Use the board script (above) for anything about the board's state, instead of reading task files.
- To change a subagent's model, override it in `.claude/harness/local.md`, or edit `model:` in its file in `.claude/agents/` (an edit there is lost on `init --force`).
