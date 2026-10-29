
# OWASP ASVS 5.0.0

The Application Security Verification Standard is OWASP's verifiable standard: numbered requirements, each tagged with the lowest level that needs it. A project at level L2 must meet every L1 and L2 requirement.

- **L1** — minimum for any app. **L2** — apps handling personal or business data (the default here when the PRD says personal data is handled). **L3** — high-value systems (only when the PRD asks for it).

## The requirements file
`asvs-5.0.0.csv` next to this file is the official release, unmodified (see `NOTICE.md`). Columns: `chapter_id,chapter_name,section_id,section_name,req_id,req_description,L`.

Never read the whole file (345 rows). Pull one chapter at a time:

```
grep "^V6," .claude/harness/compliance/asvs-5.0.0.csv
```

…and skip rows whose last column (`L`) is above the target level. Quote requirement IDs exactly as in the file (`V6.2.1`); never cite a requirement from memory.

## Chapters
| ID | Chapter | Not applicable when |
|---|---|---|
| V1 | Encoding and Sanitization | — |
| V2 | Validation and Business Logic | — |
| V3 | Web Frontend Security | no browser UI |
| V4 | API and Web Service | no API (incl. GraphQL, WebSockets) |
| V5 | File Handling | no file uploads, downloads or file processing |
| V6 | Authentication | no user login (auth fully delegated still counts — check the integration) |
| V7 | Session Management | no sessions |
| V8 | Authorization | single-role app with no per-user data |
| V9 | Self-contained Tokens | no JWTs or similar tokens |
| V10 | OAuth and OIDC | no OAuth/OIDC client, server or resource server |
| V11 | Cryptography | — |
| V12 | Secure Communication | — |
| V13 | Configuration | — |
| V14 | Data Protection | — |
| V15 | Secure Coding and Architecture | — |
| V16 | Security Logging and Error Handling | — |
| V17 | WebRTC | no WebRTC |

Decide applicability from `code-doc.md`, the manifest and `docs/prd.md`. A whole chapter can be marked `n/a` with a one-line reason; inside an applicable chapter, judge each requirement.

## Verdict per requirement
- **pass** — verified in code or config; cite `file:line` (or the config/setting) as evidence.
- **fail** — a concrete gap in this code; becomes a `SEC-` finding.
- **n/a** — doesn't apply here, with a short reason.
- **manual** — can't be verified from the repo (hosting settings, infrastructure, a dashboard toggle, a process); say exactly what a person must check.

Don't guess: if you haven't seen the code that would satisfy it, it isn't a pass.
