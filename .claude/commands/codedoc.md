---
description: Create code-doc.md by mapping the codebase, or refresh it where it has drifted from the code
argument-hint: [area to map or refresh, or blank for the whole project]
---

Follow `.claude/harness/WORKFLOW.md`. Focus: $ARGUMENTS (blank = whole project).

**If `code-doc.md` doesn't exist:**
1. Copy `.claude/harness/templates/code-doc.md` to `code-doc.md` in the project root.
2. Fill in Stack (from the manifest) and Conventions.
3. Map the project's own code, area by area: one Map section per area, one line per important function/module/component. Skip framework boilerplate, generated files and config. For a large codebase, delegate each area to an `Explore` subagent and write up what they return.
4. Fill in Data Model, Libraries Used and Pending / TODO (search for `@TODO`).

**If it exists:** check the entries in focus against the code — fix moved, renamed or deleted items, add missing ones, remove dead ones.

Finish with a short summary: areas mapped, and anything you found that looks like dead or duplicated code (mention it, don't fix it).
