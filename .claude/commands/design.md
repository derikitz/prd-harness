---
description: Optional, for UI projects — create or update the design system and screen specs in docs/design.md
argument-hint: [screen or area to design, or blank for the design system]
---

Follow `.claude/harness/WORKFLOW.md`. Read `docs/prd.md`; if it doesn't exist, stop and suggest `/prd`.

Focus: $ARGUMENTS (blank = the design system, then the screens for Must requirements).

1. If `docs/design.md` doesn't exist, copy `.claude/harness/templates/design.md` to it.
2. If the project already has UI code, read its existing styles, theme/config files and components first. Document what exists rather than inventing a new system.
3. Ask the user for what you can't infer: brand colors, fonts, references they like, light/dark mode, target devices. A few questions at a time.
4. Fill in the design system (tokens, components), then a spec for each screen in focus: purpose, the requirement IDs it serves, layout, components used, states (empty, loading, error), and responsive behavior.
5. Show the user a short summary. Offer a quick visual mockup if they want to see it before building.
6. If screens or components need new work, suggest `/wbs` so they become work packages.
