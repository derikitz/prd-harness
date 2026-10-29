# SOC 2 Readiness

SOC 2 is an attestation report issued by a licensed CPA firm after auditing an organization's controls against the AICPA Trust Services Criteria (TSC) — over a period of time for Type II. **No agent can make a project SOC 2 compliant or certify it.** What `/check-soc2` produces is a readiness assessment: which controls the code and repo already support, which are missing, and which need evidence only the organization can provide.

The criterion IDs below are the TSC's; the descriptions and checks are this kit's own summary — for the official wording, see the AICPA's *Trust Services Criteria*.

## Status per criterion
- **in place** — the repo shows it; cite the evidence (`file:line`, config, CI workflow).
- **gap** — something in the product or repo should exist and doesn't; becomes a `SEC-` finding.
- **evidence needed** — an organizational control the repo can't show (policy, HR, vendor, process records); list exactly what the auditor will ask for.
- **n/a** — outside the categories in scope, with a short reason.

## Security — Common Criteria (always in scope)
| ID | Area | What to check in the repo | Usually needs evidence from the organization |
|---|---|---|---|
| CC1.1–CC1.5 | Control environment | `SECURITY.md` / code of conduct; CODEOWNERS for accountability | Ethics policy, org chart, background checks, security training, performance reviews |
| CC2.1–CC2.3 | Communication and information | Security contact / vulnerability disclosure (`SECURITY.md`, `security.txt`); user-facing terms and privacy notice | Internal policy distribution, customer commitments |
| CC3.1–CC3.4 | Risk assessment | `docs/security.md` baseline and findings; threat notes in the PRD | Annual risk assessment, fraud risk review |
| CC4.1–CC4.2 | Monitoring of controls | Recurring checks (`/check-sec` and `/check-soc2` audit log), dependency/vulnerability scanning in CI | Internal audit or control self-assessment records |
| CC5.1–CC5.3 | Control activities | Controls written down as code: CI checks, lint, tests, required reviews | Policies and procedures for each control |
| CC6.1 | Logical access — protection | Authentication on every protected route, authorization per record, row-level security, secrets out of code, encryption at rest for sensitive data | Asset inventory |
| CC6.2–CC6.3 | User provisioning and removal | Admin/role management features, least-privilege roles, account deactivation | Joiner/mover/leaver process, quarterly access reviews |
| CC6.6 | External threats | Security headers, rate limiting, input validation, CORS, WAF config if in repo | Network/firewall configuration |
| CC6.7 | Data in transit | HTTPS/TLS enforced, HSTS, secure cookies, no secrets in URLs or logs | — |
| CC6.8 | Malicious software | Lockfile committed, dependency audit, pinned CI actions, no unknown install scripts | Endpoint protection on staff devices |
| CC6.4–CC6.5 | Physical access and disposal | n/a for code — usually the cloud provider's SOC 2 report | Data center reports from vendors, device disposal records |
| CC7.1 | Vulnerability detection | Dependency and secret scanning, configuration checks | Scan schedules and results over the audit period |
| CC7.2 | Monitoring for anomalies | Security-relevant events logged (logins, permission changes, admin actions), with no sensitive data in logs; alerting config | Who reviews alerts and how often |
| CC7.3–CC7.5 | Incident response and recovery | Error tracking, runbooks or `docs/` incident notes | Incident response plan, post-incident reports, tabletop exercises |
| CC8.1 | Change management | Changes via reviewed commits/PRs, CI required to pass, tests, branch protection (if config is in repo), traceability to requirements (task IDs in commits) | Branch protection settings, approval records, emergency change process |
| CC9.1–CC9.2 | Risk mitigation, vendors | Third-party services listed (`code-doc.md` Libraries Used, integrations) | Vendor risk reviews, vendors' SOC 2 reports, insurance |

## Additional categories (only when the PRD puts them in scope)
| Category | IDs | What to check in the repo | Evidence from the organization |
|---|---|---|---|
| Availability | A1.1–A1.3 | Health checks, autoscaling/capacity config, backup jobs and restore scripts | Capacity monitoring, backup restore tests, disaster recovery plan |
| Confidentiality | C1.1–C1.2 | Confidential data identified, access-restricted, encrypted; deletion/retention jobs | Data classification policy, disposal records |
| Processing Integrity | PI1.1–PI1.5 | Input validation, idempotent processing, reconciliation checks, error handling on data pipelines | Processing specifications, output reviews |
| Privacy | P1–P8 | Privacy notice, consent capture, data subject export/delete features, retention limits, minimal collection | Privacy policy, request handling records, breach notification procedure |
