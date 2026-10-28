# AGENTS.md

Rules for AI coding agents working in this repository.

## Project Workflow
Planned work in this project follows **PRD → WBS → tasks**. Before planning work or picking up a task, read `.claude/harness/WORKFLOW.md`.

## Core Principles

### 1. Avoid Scope Creep
- Do exactly what was asked. Don't refactor, rename, reorganize or "improve" unrelated code, and don't add unrequested features, options, abstractions or "just in case" error handling.
- Mention unrelated issues you notice (bugs, tech debt, style); don't fix them unless asked.
- Keep diffs minimal — a reviewer should see at a glance that the change matches the request.

### 2. Don't Repeat Yourself
- Search for existing functions, components, types and patterns before writing new ones; reuse or slightly extend them.
- Create new files or abstractions only when nothing suitable exists. Follow existing project conventions.
- Flag logic duplicated in 2+ places, but don't refactor it into a shared utility unless asked.

### 3. Simplicity Over Cleverness
- Write the simplest correct, readable code — optimize for the next person reading it. No advanced features, patterns or abstractions for show.
- Add complexity (abstraction, generalization, optimization) only for a concrete current need, not hypothetical flexibility.

### 4. Document as You Go (`code-doc.md`)
- If it doesn't exist, ask the user before creating it. Don't suggest it for small tasks or projects; create it whenever the user asks.
- Update it as code changes — never reconstruct it after the fact.
- Document the project's own code (custom functions, modules, key state, and how they connect — what calls what, and why), not the framework, boilerplate, generated files or framework config.
- Per function/module: what it does, where it's used, non-obvious inputs/outputs or side effects.
- Third-party libraries: one line each under "Libraries Used" — what it's for and where (e.g. `zod — lib/validation.ts, form schemas`).

### 5. Track Tests (`test-doc.md`)
- Records tests that exist and tests that should exist. Ask before creating it; skip it for small tasks unless the user asks.
- Per test: what it covers, which function/feature (linked to `code-doc.md`), and how to run it.
- Keep a "Not Yet Tested" list of risky untested code (edge cases, money/auth/data integrity, complex logic).
- Don't write tests unprompted in a codebase without a testing habit — log the gap instead. Log any tests you're asked to write.

### 7. Placeholders for Pending Work
- When a feature isn't ready to build (dependency not done, decision pending, out of scope), ask whether to leave a placeholder.
- If yes, add `// @TODO: <what goes here and why>` at the exact spot it belongs.
- Treat `@TODO`s as intentionally incomplete — never fill one in without confirming with the user. Mirror them in a "Pending / TODO" section of `code-doc.md` if it exists.

### 9. Fail Loudly, Not Silently
- Handle errors specifically and visibly. No swallowed exceptions, broad catches, empty catch blocks or generic "something went wrong" messages that hide the cause — loud failures are the early warning while test coverage is thin.
- Catch only where you can meaningfully handle it (retry, fallback, user-facing message); otherwise let it propagate.

### 10. Environment & Secrets
- Never hardcode keys, tokens or passwords; use environment variables or the project's secrets mechanism.
- Add every new environment variable to `.env.example` (or equivalent).
- Flag tasks that need a new secret instead of inventing a placeholder value.

### 11. Dependency Hygiene
- Flag every new package to the user before adding it: what it's for and roughly how heavy it is.
- Check the project doesn't already have an equivalent, and that the package is maintained and reasonably sized. Prefer a little hand-written code over a heavy dependency for simple needs.

### 12. Consistent Naming
- Follow the project's established naming conventions. If none exist, pick a common one for the stack and note it in `code-doc.md`.

### 13. Rollback Awareness for Risky Changes
- Before hard-to-undo steps — migrations, deleting data/fields/files, renaming public APIs — call out the risk explicitly, even if the broader task was already approved.
- Suggest a safer path (deprecate before delete, additive before destructive migration) and let the user choose.

### 14. Explain the "Why"
- Not everyone here codes full-time: explain non-obvious decisions in plain language in your response — short and practical (the tradeoff and why this approach).
- Keep code comments minimal and technical; reasoning belongs in the conversation.

### 15. Track Stack Versions
- Record the language, framework and major library versions in `code-doc.md`. Check version-specific syntax and APIs against them or the manifest (`package.json`, `requirements.txt`…); ask if unknown.

### 16. Verify Against Installed Docs, Not Memory
- For fast-changing frameworks and APIs (e.g. Next.js App Router, caching and data-fetching), check the installed version's docs or types (`node_modules`) or the official docs for that version before writing code. Ask if the version can't be determined.

### 17. When in Doubt, Ask
- Ask before coding when a requirement is ambiguous in a way that changes the implementation, or when a decision has real tradeoffs (which library, breaking vs. compatible, performance vs. simplicity).
- Don't guess business logic, edge cases or intent. Trivial choices (naming, formatting) can use sensible defaults.

## Working Practices
- **Before coding:** read the surrounding code and project docs/config (README, lint rules, test setup, folder structure). For non-trivial work with several reasonable approaches, state yours first.
- **While coding:** match the existing style; small, clearly named functions; comment only non-obvious intent.
- **Verify:** run existing tests after changes and update tests for changed behavior (no new test suites unless asked). Never claim something works without verifying it.
- **Report:** briefly summarize what changed and why, state any assumptions you made, and flag conflicts with existing code or conventions before overriding them.
- **Safety:** don't delete code, files or tests, or modify config, CI/CD or environment files, unless the task calls for it. Prefer additive, reversible changes.
