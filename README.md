[![Publish to npm](https://github.com/derikitz/prd-harness/actions/workflows/publish.yml/badge.svg)](https://github.com/derikitz/prd-harness/actions/workflows/publish.yml)

# prd-harness

**Run your software projects with a small AI team inside Claude Code — planned from a PRD, broken down into a WBS, built and checked task by task.**

No server, no dashboard, nothing to host. Just markdown files and Claude Code features (subagents, slash commands, skills), installed into any project with one command.

```bash
npx prd-harness init
```

---

## Why

Asking an AI agent to "build the app" gives you code nobody can trace back to a requirement, and no one checking it. This kit gives Claude Code the same structure a real team uses:

- **Plan before building** — every task traces back through the WBS to a requirement in your PRD.
- **Built and checked by different agents** — an engineer builds, a tester tests, a reviewer signs off, and a security agent steps in when the task is risky.
- **Security from day one** — security questions are part of the PRD, and code is checked against the OWASP Top 10.
- **Easy on your usage limits** — checks scale with each task's risk, and agents navigate by a shared code map instead of re-exploring the codebase.

## Quick start

Requires **Node 18+** and **[Claude Code](https://claude.com/claude-code)**. Works in bash, zsh, PowerShell and cmd.

```bash
cd my-app
npx prd-harness init
claude
```

Then, inside Claude Code:

| New project | Existing project |
|---|---|
| `/prd` → `/wbs` → `/tasks` → `/next` | `/codedoc` → `/prd` → `/wbs` → `/tasks` → `/next` |

`init` never overwrites your files. If the project already has an `AGENTS.md` or `CLAUDE.md`, it only appends the lines that connect the workflow.

## How it works

```mermaid
flowchart LR
    PRD["/prd<br/>Requirements<br/>FR-001"] --> WBS["/wbs<br/>Work packages<br/>1.1, 1.2"]
    WBS --> T["/tasks<br/>Task files<br/>T-1.1-a"]
    T --> N["/next"]
    N --> E[Engineer builds]
    E --> C{Checks by risk}
    C --> D[done]
```

### 1. Plan
| Step | Command | Output |
|---|---|---|
| Map the existing code *(existing projects)* | `/codedoc` | `code-doc.md` |
| Write requirements — Claude interviews you | `/prd` | `docs/prd.md` |
| Design system and screens *(optional, UI projects)* | `/design` | `docs/design.md` |
| Break requirements into deliverables | `/wbs` | `docs/wbs.md` |
| Break deliverables into tasks | `/tasks` | `tasks/todo/*.md` |

You approve the PRD before anything is built. When requirements change, run `/prd <change>` → `/wbs` → `/tasks` and the change flows down.

### 2. Build
`/next` picks the next ready task, has the **engineer** build it, then runs only the checks that task needs:

| Task risk | Example | Checks |
|---|---|---|
| `low` | Copy, styling, config values | reviewer |
| `normal` | Most feature work | tester → reviewer |
| `high` | Auth, payments, personal data, uploads, migrations | tester → security → reviewer |

If a check fails, the same engineer fixes it, and the check runs again. Task files move through `tasks/todo → doing → review → done` (or `blocked`), so the folder *is* the board.

### 3. Track
- `/status` — the board, what's next, progress per milestone, and traceability gaps.
- `/security` — a full-project security audit; run it before each release.

## The team

| Agent | Does | Model |
|---|---|---|
| **Main session** | Project manager: owns the PRD, WBS and board, runs the others | your default |
| `engineer` | Builds one task; fixes findings from the checks; keeps `code-doc.md` current | your default |
| `tester` | Writes and runs test cases from the acceptance criteria | Sonnet |
| `security` | Deep OWASP review on high-risk tasks and audits | your default |
| `reviewer` | Final sign-off: criteria, coding rules, light security pass. Read-only | Sonnet (Haiku for low risk) |

Change any agent's model with the `model:` line in its file in `.claude/agents/`.

## Commands

| Command | What it does |
|---|---|
| `/codedoc [area]` | Map the codebase into `code-doc.md`, or fix entries that no longer match the code |
| `/prd [change]` | Create the PRD by interviewing you, or apply a change to it |
| `/design [screen]` | Design system and screen specs (optional) |
| `/wbs` | Build or update the WBS from the PRD |
| `/tasks [wbs code]` | Turn work packages into task files |
| `/next [task id]` | Build and check the next ready task |
| `/status` | Board summary and gaps (read-only) |
| `/security [area]` | Full security audit; schedule fixes as WBS work |

## What gets installed

```
your-project/
├── AGENTS.md                 Coding rules for any AI agent (Claude, Codex, Cursor…)
├── CLAUDE.md                 Imports AGENTS.md and the workflow
├── .claude/
│   ├── agents/               engineer, tester, security, reviewer
│   ├── commands/             the slash commands above
│   ├── skills/               owasp-checklist (OWASP Top 10:2025, API, LLM)
│   └── harness/
│       ├── WORKFLOW.md       The rules of the PRD → WBS → tasks workflow
│       └── templates/        prd, design, wbs, task, code-doc, test-doc, security
├── docs/                     prd.md, wbs.md, design.md, security.md (created as you go)
└── tasks/
    ├── todo/  doing/  review/  done/  blocked/
```

Created as the work goes on: `code-doc.md` (the code map) and `test-doc.md` (test cases) in the project root.

## Tips for keeping usage low

- Work one task at a time with `/next`. Use `/loop 30m /next` only when there's a queue of ready tasks — each run reads the board even when there's nothing to do.
- Keep `code-doc.md` current. If it falls behind, run `/codedoc` instead of letting each agent search the code.
- Let `/tasks` label risk honestly: most tasks should be `normal`, not `high`.

## Updating

Re-run `init` with `--force` in a project to replace the kit's files with the latest version:

```bash
npx prd-harness@latest init --force
```

This overwrites only the kit's own files in `.claude/agents`, `commands`, `harness` and `skills`. Your PRD, WBS, tasks and docs are never touched.

## CLI reference

```
prd-harness init [dir] [--force]

  dir         Project folder (default: current folder)
  --force     Overwrite the kit's files with this version
  --help      Show help
  --version   Show version
```

---

## Contributing / maintaining

Edit the files in this repo — they *are* the kit. `bin/cli.js` copies them into projects.

```bash
npm link                         # once: makes `prd-harness` available everywhere
prd-harness init ../some-test-project

npm pack --dry-run               # check what will be published
```

### Releasing
Releases are published to npm by GitHub Actions (`.github/workflows/publish.yml`) when a version tag is pushed:

```bash
npm version patch                # or minor / major — bumps package.json and creates the tag
git push --follow-tags
```

The workflow checks that the tag matches `package.json`, smoke-tests the CLI, then publishes with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) — no npm token is stored in GitHub, and every release gets a provenance badge.

## License

MIT
