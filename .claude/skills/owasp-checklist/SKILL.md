---
name: owasp-checklist
description: Security checklist based on the OWASP Top 10:2025, OWASP API Security Top 10 and OWASP LLM Top 10, with concrete checks for web apps and APIs. Use when reviewing code, design or config for security issues.
---

# OWASP Security Checklist

Check only the sections that apply to what you're reviewing. For each issue found, cite the category (e.g. `A01 Broken Access Control`). If you need detail beyond this list, the source is https://owasp.org/Top10/ and the OWASP Cheat Sheet Series (https://cheatsheetseries.owasp.org/).

## OWASP Top 10:2025

**A01 Broken Access Control** (includes SSRF)
- Every server endpoint / server action / API route checks authentication *and* that the user may access *this* record (not just "is logged in").
- No trusting IDs, roles or prices from the client. No access control done only in the UI.
- Database row-level rules (e.g. Supabase RLS) enabled on every table that holds user data.
- Server-side fetches to user-supplied URLs are allow-listed; block internal IPs and cloud metadata endpoints.
- CORS doesn't reflect arbitrary origins with credentials.

**A02 Security Misconfiguration**
- Debug mode, stack traces, directory listing and default credentials are off in production.
- Security headers set: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, frame protection.
- Cookies: `HttpOnly`, `Secure`, `SameSite`. Unused features, ports and sample routes removed.

**A03 Software Supply Chain Failures**
- Lockfile committed. Run the ecosystem audit (`npm audit`, `pip-audit`, …) and flag known-vulnerable packages.
- New dependencies are maintained, widely used and correctly spelled (typosquatting). No install scripts from unknown packages.
- CI secrets scoped minimally; third-party actions pinned.

**A04 Cryptographic Failures**
- HTTPS everywhere. Sensitive data encrypted at rest where required.
- Passwords hashed with bcrypt / scrypt / argon2 — never plain, MD5, SHA-1 or unsalted SHA-256.
- No homemade crypto; random tokens from a cryptographically secure RNG.

**A05 Injection**
- SQL/NoSQL: parameterized queries or ORM — no string-built queries with user input.
- No `eval`, `new Function`, or shell commands built from user input.
- XSS: output encoded by the framework; any `dangerouslySetInnerHTML` / `v-html` / `innerHTML` uses sanitized input.
- Path traversal: user input never joined into file paths unchecked.

**A06 Insecure Design**
- Abuse cases considered for each feature (what would a malicious user try?).
- Rate limits on login, signup, password reset, OTP and expensive endpoints.
- Business rules enforced server-side (quantities, prices, state transitions).

**A07 Authentication Failures**
- Use a proven auth library/provider rather than custom auth.
- Session/token expiry and rotation; logout invalidates the session. JWTs verified (signature, `alg`, expiry, audience).
- No user enumeration via login/reset messages. MFA available for privileged accounts.

**A08 Software or Data Integrity Failures**
- No unsafe deserialization of untrusted data. Webhooks verify signatures.
- Uploaded files: type/size validated server-side, stored outside the web root or in object storage, never executed.

**A09 Security Logging and Alerting Failures**
- Log auth events, access-control failures and admin actions — without passwords, tokens or unnecessary personal data.
- Logs can't be injected into (newlines/control characters escaped).

**A10 Mishandling of Exceptional Conditions**
- Errors fail closed (deny on error), not open.
- Error responses don't leak internals (stack traces, SQL, file paths).
- Timeouts and resource limits on external calls, uploads and request bodies.

## Also check

**Secrets**
- No keys, tokens or passwords in code, git history or client bundles. Client-exposed env vars (`NEXT_PUBLIC_*`, `VITE_*`) contain nothing secret.
- `.env` ignored by git; `.env.example` has placeholders only.

**APIs** (OWASP API Security Top 10)
- Object-level authorization on every ID in a path or body (BOLA).
- Mass assignment: only allow-listed fields are writable (no `role`, `isAdmin`, `ownerId` from the body).
- Pagination limits; responses don't return more fields than the client needs.

**CSRF**: state-changing requests that rely on cookies are protected (SameSite + token or framework protection).

**LLM / AI features** (OWASP LLM Top 10)
- Prompt injection: untrusted content (user input, web pages, files) can't trigger privileged tools or actions without checks.
- Model output is treated as untrusted — never executed or rendered as raw HTML.
- No secrets or other users' data in prompts; cost/usage limits per user.

## Tools
Use only what's already installed; don't add dependencies. Suggest tools (e.g. gitleaks, semgrep) in the report instead.
