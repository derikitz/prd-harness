---
description: OWASP ASVS compliance check of the whole project — run on demand, never part of /next
argument-hint: [full | chapter like V6] (blank = only what changed since the last check)
disable-model-invocation: true
---

Follow `.claude/harness/WORKFLOW.md`. You are running an OWASP ASVS 5.0.0 check. It's separate from the task workflow: don't move tasks or run it as part of `/next`.

Request: $ARGUMENTS

Results go in the ASVS section of `docs/compliance.md` (create it from `.claude/harness/templates/compliance.md`). Tell the user plainly: there is no "OWASP certified" — this shows which ASVS requirements the code meets today.

1. **Level.** Use the ASVS level the PRD's Security and Privacy section states; otherwise **L2** if it handles personal data, else **L1**. L3 only when the PRD asks for it. If the PRD says nothing about data handled, confirm the level in one question. Record it as `asvs_level`.
2. **What to check.** A chapter in the request (e.g. `V6`) limits the run to it. Else, if `asvs_audited_commit` is set and the request isn't `full`: list the files changed since (`git diff --name-only <commit>..HEAD`), use `code-doc.md` to map them to chapters, and re-check only those — plus every row currently `fail` or `manual`. Otherwise check all chapters.
   - Mark whole chapters `n/a` yourself when they clearly don't apply (the table in `.claude/harness/compliance/asvs.md`), with a one-line reason — no agent needed for those.
3. **Scanners** (need approval — AGENTS.md principle 11). Look under `## Commands` in `local.md` for a recorded `/check-sec scanners:` decision. If there is none, suggest the ones that fit the stack and ask once:
   - secrets in code and git history: **gitleaks**; code patterns (SAST): **Semgrep**; known-vulnerable dependencies: **OSV-Scanner**. The ecosystem's own audit (`npm audit`, `pip-audit`, …) needs no approval and always runs.
   - For each: what it checks, roughly how heavy it is, and how it would run (`npx`, `pipx`, Docker or a downloaded binary) — never added to the project's dependencies.
   - Record the answer (e.g. `- /check-sec scanners: gitleaks, osv-scanner`, or `none`) so it isn't asked again. Run the approved ones and keep their output to hand to the agents.
4. **Check, in batches.** Delegate to the `security` subagent in **compliance mode**, about three chapters per run so each stays small, one run after another. Pass: `ASVS <level>`, the chapters, the changed files (incremental runs) and the relevant scanner output. Each run writes its chapters' sections of `docs/compliance.md`.
5. **Wrap up.**
   - Update the ASVS row of the Summary, the frontmatter (`asvs_audited_commit` = current `HEAD`, `scanners`) and add an Audit Log row.
   - Every `fail` becomes a `SEC-` finding in `docs/security.md` (create it from its template if missing) — reuse the existing ID when it's the same issue.
   - Show the user the summary, the fails by severity, and the **Evidence Needed From You** list.
   - Ask which findings to schedule. Scheduled fixes go under the WBS `Security (enabler)` branch as work packages referencing the `SEC-` IDs; then suggest `/tasks`.
