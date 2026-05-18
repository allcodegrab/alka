# Security concern bundle

Inline checklist for the **security verifier** subagent. Paste this into the briefing's "Concern checklist" section. The content here is distilled from `production-readiness` and OWASP top-10; subagents cannot load skills, so this bundle is the source of truth for them.

## Lens

Walk the diff with these specific questions. If any answer is "yes, and the diff doesn't address it," that's a finding.

## Authentication and authorization

- Does the diff add or modify an endpoint? If yes, is authentication required and enforced? Where (controller, middleware)?
- Is authorization enforced **at the data-access boundary**, not only in the UI? A user-supplied ID in the path should not be trusted to scope queries.
- For an API change: can a user with role X access another user's data via this endpoint?
- For an admin endpoint: is the admin check on the server, not the client?
- Does the diff weaken any existing auth check (loosened scope, removed role check, broader CORS)?

## Input handling and injection

- Is user-supplied input passed into a query, command, file path, URL, deserializer, or template engine? Is it parameterized / escaped / validated?
- SQL: parameterized queries used throughout? No string concatenation into SQL?
- NoSQL (MongoDB, etc.): no `$where`, no operators in user-supplied document fields without explicit validation?
- Shell: no `Bash(... $userInput ...)` constructions? Use parameterized helpers.
- Path traversal: does the code accept a filename / path from the user and read/write it? Is it validated against a fixed root?
- Deserialization: is the diff deserializing user input (JSON, YAML, pickle, Java)? Is the deserializer safe-by-default for the format?

## Secret handling

- Does the diff add a credential, API key, token, or signing secret? Is it sourced from config / secret manager, not committed?
- Are secrets logged anywhere (print statements, log lines that include the request body, error logs that include the call payload)?
- Does the diff touch a credential rotation, refresh, or revocation path? Is the old credential invalidated?

## Cross-site / browser-context

- For a frontend diff: is user-controlled content rendered without escaping? `innerHTML`, `dangerouslySetInnerHTML`, raw template interpolation are flags.
- CSRF: state-changing endpoint without CSRF token / equivalent (SameSite cookies, origin check)?
- Open redirect: an endpoint that accepts a URL parameter and redirects to it without allow-list?
- Cookies: new cookie set without `Secure`, `HttpOnly`, or `SameSite` where applicable?

## Network exposure

- Does the diff expose a previously-internal endpoint? Is the new exposure intentional and authorized?
- New outbound call: is the destination allow-listed? Does it carry credentials? Is timeout set?
- SSRF: does the code make HTTP requests to URLs from user input? Validation that the URL doesn't point to localhost / metadata IP / internal IP?

## Cryptography

- Does the diff add a hashing, signing, or encryption call? Is the algorithm appropriate? (bcrypt/argon2 for passwords; not MD5/SHA-1.)
- Random values for tokens / IDs: is the source cryptographically secure (`secrets`, `crypto.randomBytes`), not `Math.random` / `Random`?
- Key handling: keys live where? Rotated how? Length appropriate?

## Dependencies

- Did the diff add a new dependency? Is it actively maintained? Any known CVEs at the pinned version?
- Did a transitive dep version change? Any new vulnerabilities introduced?
- Is the dependency the project's standard for this purpose, or is it a parallel pattern? (Convention drift is a security concern when it touches crypto / auth.)

## Common quick-checks

- Hard-coded credentials in any added file: `grep -E "(AKIA|sk-|password=|secret=|api_key=)"` on the diff.
- Logging of auth headers or request bodies: search the diff for `log.*request|log.*headers|log.*body|log.*token|log.*authorization`.
- Disabled security features: `verify=False`, `rejectUnauthorized: false`, `--insecure`, `noverify=true`.

## Severity calibration for security

- **Critical:** Authentication bypass, authorization bypass affecting other users' data, RCE, secrets exposed in logs/repo, SQL/NoSQL/command injection.
- **High:** Stored XSS, CSRF on state-changing endpoint, weak crypto for sensitive data, SSRF, hard-coded credential.
- **Medium:** Reflected XSS in low-traffic surface, missing rate-limit on sensitive endpoint, missing security header, insecure cookie flags, dependency with known CVE but not in the exploited path.
- **Low:** Verbose error messages, missing CSP, dependency with old version but no known issues.

If unsure between Critical and High on auth/data-access issues, choose Critical.
