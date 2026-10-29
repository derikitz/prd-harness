---
description: SOC 2 readiness check of the project and repo — run on demand, never part of /next
argument-hint: [full] (blank = only what changed since the last check)
disable-model-invocation: true
---

Follow `.claude/harness/WORKFLOW.md`. You are running a SOC 2 readiness check. It's separate from the task workflow: don't move tasks or run it as part of `/next`.

Request: $ARGUMENTS

Results go in the SOC 2 section of `docs/compliance.md` (create it from `.claude/harness/templates/compliance.md`). Tell the user plainly: this is a readiness assessment — only a licensed CPA firm can issue a SOC 2 report, and many controls need evidence the repo can't show.

1. **Categories.** Security is always in scope. Add Availability, Confidentiality, Processing Integrity or Privacy only if the PRD's Compliance line lists them; if it doesn't mention SOC 2 at all, ask the user which categories they're targeting. Record them as `soc2`.
2. **Reuse the ASVS results.** The technical criteria (CC6, CC7, CC8 and parts of the others) rest on the same code the ASVS check covers. If `docs/compliance.md` has ASVS results, cite them (`see V6.2.1`) instead of re-checking that code. If it has none, or they're older than the latest changes, suggest running `/check-sec` first — the check still works without it, just with less code-level evidence.
3. **What to check.** If `soc2_audited_commit` is set and the request isn't `full`: list the files changed since (`git diff --name-only <commit>..HEAD`) and re-check only the criteria they touch (use `code-doc.md` to map them) — plus every row currently `gap` or `evidence needed`. Otherwise check every criterion in scope.
4. **Check.** Delegate to the `security` subagent in **compliance mode** once, passing `SOC 2`, the categories, the criteria to check and the changed files (incremental runs). It writes the SOC 2 table and the Evidence Needed From You list in `docs/compliance.md`.
5. **Wrap up.**
   - Update the SOC 2 row of the Summary, `soc2_audited_commit` (current `HEAD`) and add an Audit Log row.
   - Every `gap` becomes a `SEC-` finding in `docs/security.md` (create it from its template if missing) — reuse the existing ID when it's the same issue.
   - Show the user the summary, the gaps by severity, and the **Evidence Needed From You** list — that list is what they'll gather for an auditor or a compliance tool.
   - Ask which gaps to schedule. Scheduled fixes go under the WBS `Security (enabler)` branch as work packages referencing the `SEC-` IDs; then suggest `/tasks`.
