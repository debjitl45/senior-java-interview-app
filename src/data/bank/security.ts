import type { Question } from '../types';

export const SECURITY_QUESTIONS: Question[] = [
  {
    id: 'sec-1',
    categoryId: 'security',
    title: 'JWT vs Server-Side Sessions',
    difficulty: 'Solid',
    tags: ['JWT', 'Sessions', 'Authentication', 'Revocation'],
    scenario: 'A team stores a 24-hour JWT in localStorage and treats it as the sole source of truth for authentication. Security asks how a compromised account is logged out immediately, and nobody has an answer.',
    question: 'Compare stateless JWTs with server-side sessions. Explain the revocation problem and design a token strategy you would actually defend in review.',
    idealAnswer: `### The fundamental trade-off
A JWT is **self-contained and stateless**: the server validates a signature and trusts the claims, with no lookup. That is exactly what makes it scale — and exactly what makes it impossible to revoke. A valid signature is valid until \`exp\`, no matter what has happened since.

A server-side session is a **reference**: an opaque id pointing at server state. Revocation is a delete. The cost is a lookup on every request and shared session storage.

### The revocation problem
With a 24-hour JWT, a compromised account, a password change, a role downgrade, or a firing all take up to 24 hours to take effect. The usual "solutions" all reintroduce state:
* A denylist of revoked token ids — now you have a lookup on every request, i.e. sessions with extra steps.
* A \`tokenVersion\` claim checked against the user record — same.
* Short expiry — the actual answer.

### The design that holds up
* **Access token: JWT, 5-15 minutes.** Short enough that the revocation window is an acceptable risk. Carries user id, roles, tenant, \`exp\`, \`iat\`, \`jti\`, \`aud\`, \`iss\`.
* **Refresh token: opaque, long-lived, stored server-side.** Revocable by deletion. Rotate on every use and **detect reuse** — if an old refresh token is presented again, the family was stolen, so invalidate the whole family and force re-authentication.
* **Storage: httpOnly, Secure, SameSite cookies.** \`localStorage\` is readable by any XSS payload; an httpOnly cookie is not. If you use cookies you must add CSRF defence (SameSite=Lax/Strict plus a double-submit or synchroniser token for state-changing requests).

### Validation must be strict
* Pin the algorithm server-side. Never trust the token's \`alg\` header — the classic failures are \`alg: none\` and confusing RS256 for HS256 so the public key is used as an HMAC secret.
* Verify \`iss\`, \`aud\`, \`exp\`, \`nbf\`, and allow only small clock skew.
* Use a vetted library and a JWKS endpoint with key rotation. Do not hand-roll JOSE.

### And be honest about it
JWTs are excellent for **short-lived, cross-service authorisation** where a lookup per hop is genuinely expensive. For a single monolith serving browser sessions, a plain server-side session is simpler, revocable, and usually the better engineering choice. Saying that out loud is a strong signal.`,
    codeSnippet: `// Short access token + rotating, revocable refresh token
record AccessToken(String jwt, Instant exp) { }   // 10 minutes, stateless

// Refresh: opaque, server-side, rotated on every use
class RefreshTokenService {
    Tokens rotate(String presented) {
        RefreshToken rt = store.find(hash(presented))
                .orElseThrow(() -> new AuthException("unknown"));
        if (rt.isUsed()) {                 // reuse => theft
            store.revokeFamily(rt.familyId());
            throw new AuthException("token reuse detected");
        }
        rt.markUsed();
        return issueNewPair(rt.userId(), rt.familyId());
    }
}`,
    pitfalls: [
      'Storing tokens in localStorage where any XSS can read them.',
      'Long-lived access tokens with no revocation path.',
      'Trusting the alg header from the token instead of pinning it server-side.',
      'Adding a denylist and still calling the design stateless.'
    ],
    followUpQuestions: [
      'How does refresh token rotation with reuse detection catch a stolen token?',
      'What CSRF protection do you need once tokens live in cookies?',
      'When is a plain server-side session the better choice?'
    ],
    faangFocus: 'Nearly every backend security round opens here. Candidates who admit JWTs cannot be revoked, then design around it, do far better than those who claim they can.'
  },
  {
    id: 'sec-2',
    categoryId: 'security',
    title: 'OAuth2 and OIDC Flows',
    difficulty: 'Hard',
    tags: ['OAuth2', 'OIDC', 'PKCE', 'Authorization Code'],
    scenario: 'A mobile app and a single-page app both need to authenticate against a corporate identity provider. A developer proposes the implicit flow for the SPA and embedding the client secret in the mobile app.',
    question: 'Explain the OAuth2 grant types, why both proposals are wrong, and what the correct flows are today. Clarify how OIDC differs from OAuth2.',
    idealAnswer: `### OAuth2 is authorisation; OIDC is authentication
OAuth2 answers "may this client access this resource on the user's behalf?" It says nothing about **who the user is**. Using an access token as proof of identity is a well-known mistake.

**OIDC** is a thin layer on top that adds an **ID token** — a JWT with standard identity claims (\`sub\`, \`iss\`, \`aud\`, \`nonce\`, \`auth_time\`) intended for the client, plus a \`/userinfo\` endpoint and discovery. If you want login, you want OIDC.

### The grants
* **Authorization Code + PKCE** — the correct default for **every** interactive client today: SPAs, mobile apps, and confidential server-side apps alike.
* **Client Credentials** — machine-to-machine, no user involved.
* **Device Code** — input-constrained devices (TVs, CLIs).
* **Refresh Token** — obtaining new access tokens.
* **Implicit** — deprecated. Returned tokens in the URL fragment, where they leak via browser history, referrers and logs, and offered no client authentication.
* **Resource Owner Password Credentials** — deprecated. The client handles the user's actual password, which defeats the entire point of OAuth and blocks MFA and federation.

### Why both proposals fail
* **Implicit for the SPA:** removed in OAuth 2.1. Tokens in the fragment are exposed, and there is no way to bind the response to the requesting client.
* **Client secret in a mobile app:** a mobile app is a **public client**. Anything shipped in the binary can be extracted; it is not a secret. Public clients must not have one.

### PKCE is what replaces the secret
Proof Key for Code Exchange:
1. The client generates a random \`code_verifier\` and sends \`code_challenge = SHA256(verifier)\` with the authorisation request.
2. The authorisation server binds the issued code to that challenge.
3. The token request must present the original \`code_verifier\`.

An attacker who intercepts the authorisation code cannot exchange it without the verifier, which never left the client. This defeats code interception on mobile custom-URL-scheme redirects — the original attack PKCE was designed for.

### Other essentials
* Use the \`state\` parameter for CSRF protection on the redirect, and \`nonce\` to bind the ID token to the request.
* Register **exact** redirect URIs; wildcard matching is a redirect-hijacking vector.
* Validate the ID token signature, \`iss\`, \`aud\`, \`exp\` and \`nonce\` — never just decode it.
* Use the platform's secure storage for tokens on mobile (Keystore / Keychain), and prefer the system browser or Custom Tabs over an embedded WebView, which can read credentials.`,
    codeSnippet: `# Authorization Code + PKCE — correct for SPA and mobile alike
GET /authorize
  ?response_type=code
  &client_id=mobile-app
  &redirect_uri=com.acme.app:/callback     # exact, pre-registered
  &scope=openid%20profile%20offline_access # openid => OIDC
  &state=<csrf-random>
  &nonce=<binds-id-token>
  &code_challenge=<BASE64URL(SHA256(verifier))>
  &code_challenge_method=S256

POST /token
  grant_type=authorization_code
  &code=<code>
  &code_verifier=<original-random>          # proof, no client secret needed`,
    pitfalls: [
      'Proposing the implicit flow or ROPC for anything new.',
      'Shipping a client secret in a mobile app or SPA.',
      'Using an access token as proof of identity instead of an ID token.',
      'Skipping state/nonce validation, or allowing wildcard redirect URIs.'
    ],
    followUpQuestions: [
      'What exactly does the nonce protect against that state does not?',
      'Why is an embedded WebView discouraged for the authorisation request?',
      'How do you handle token storage and refresh on a native mobile client?'
    ],
    faangFocus: 'Identity and platform teams ask this in depth. Explaining PKCE as "the public-client replacement for a client secret" is the answer that lands.'
  },
  {
    id: 'sec-3',
    categoryId: 'security',
    title: 'Unsafe Deserialization and the Gadget Chain Problem',
    difficulty: 'Expert',
    tags: ['Deserialization', 'RCE', 'Jackson', 'Serialization'],
    scenario: 'A legacy service accepts a base64-encoded Java-serialized object over HTTP for a "session restore" feature. A separate service uses Jackson with default typing enabled to deserialize polymorphic payloads.',
    question: 'Explain why both are critical vulnerabilities, what a gadget chain is conceptually, and how to remediate each.',
    idealAnswer: `### Why deserialization is dangerous
Java deserialization does not merely populate fields — it **executes code** during object reconstruction: \`readObject\`, \`readResolve\`, \`readExternal\`, and by extension \`hashCode\`/\`equals\` when objects land in collections. The type of the object is chosen by the **attacker**, from the payload, before any of your validation runs.

### Gadget chains, conceptually
An attacker does not inject code. They chain together classes **already on your classpath** whose deserialization side effects, composed in the right order, reach a dangerous sink such as reflective method invocation or process execution. Common libraries have historically supplied these building blocks.

The key consequence: **you cannot fix this by auditing your own code**. Any vulnerable-shaped class anywhere on the classpath — including transitive dependencies — is a potential link. That is why the only reliable defence is not deserializing untrusted data at all.

### Remediation 1: the session-restore endpoint
* **Stop accepting serialized Java objects from clients.** Replace with a data format that has no code-execution semantics: JSON or Protobuf, mapped into an explicit DTO.
* If it truly cannot be removed immediately, apply a **strict allowlist** \`ObjectInputFilter\` (Java 9+, backported to 8u121) — allowlist, never denylist, because denylists are perpetually one new gadget behind. Also cap depth, array size and reference count to stop resource-exhaustion payloads.
* Sign and verify the blob so only your own server can produce it. This shrinks but does not remove the risk.

### Remediation 2: Jackson default typing
\`enableDefaultTyping()\` writes the concrete class name into the JSON and instantiates whatever the payload names — reintroducing the same "attacker picks the type" problem in JSON. It has produced a long series of CVEs.

**Fix:** disable it. Model polymorphism explicitly with \`@JsonTypeInfo(use = Id.NAME)\` plus \`@JsonSubTypes\`, so only the types you declared can ever be constructed. If you must use activated default typing, supply a strict \`PolymorphicTypeValidator\`.

### General principles
* Treat all serialized input as **untrusted code**, not data.
* Prefer schema-driven formats with no polymorphism by default.
* Keep dependencies patched and run SCA (OWASP Dependency-Check, Snyk) in CI — gadget classes arrive through transitive dependencies.
* Run services with least privilege so a successful chain has limited reach.
* Note that Java serialization is on a long-term deprecation path; JEP 154 and the serialization filtering work exist precisely because the design is unsafe.`,
    codeSnippet: `// Java 9+: strict allowlist filter. Allowlist, never denylist.
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
        "com.acme.session.*;java.util.*;java.lang.*;" +
        "maxdepth=10;maxarray=1000;maxrefs=5000;!*");   // reject everything else

ObjectInputStream in = new ObjectInputStream(bytes);
in.setObjectInputFilter(filter);

// Jackson: declare your polymorphism instead of enabling default typing
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = CardPayment.class, name = "card"),
    @JsonSubTypes.Type(value = BankPayment.class, name = "bank")
})
sealed interface Payment permits CardPayment, BankPayment { }`,
    pitfalls: [
      'Using a denylist of known-bad classes instead of an allowlist.',
      'Believing your own code being safe is sufficient when the classpath supplies the gadgets.',
      'Enabling Jackson default typing for convenience.',
      'Assuming a signature check alone makes deserialization safe.'
    ],
    followUpQuestions: [
      'Why is a denylist structurally unable to solve this?',
      'What does ObjectInputFilter check, and at what point in reconstruction?',
      'How does a schema-first format like Protobuf remove this class of bug?'
    ],
    faangFocus: 'Asked in security-adjacent senior interviews. The insight they want is "the attacker chooses the type, and your classpath is the attack surface".'
  },
  {
    id: 'sec-4',
    categoryId: 'security',
    title: 'Password Storage and Credential Handling',
    difficulty: 'Solid',
    tags: ['Passwords', 'BCrypt', 'Argon2', 'Hashing'],
    scenario: 'A legacy system stores passwords as unsalted SHA-256. You must migrate to a modern scheme without forcing every user to reset, and without a maintenance window.',
    question: 'Explain why SHA-256 is unsuitable, compare the modern password hashing algorithms, and design the migration.',
    idealAnswer: `### Why SHA-256 is wrong for passwords
SHA-256 is designed to be **fast** — that is the whole point for a general-purpose hash, and it is exactly the wrong property here. Commodity GPUs compute billions of SHA-256 hashes per second, so an offline attacker brute-forces realistic passwords quickly.

Unsalted makes it far worse: identical passwords produce identical hashes, so one rainbow table cracks the whole database at once and reveals which users share a password.

### What a password hash needs
* **Slow / tunable work factor** — cost that can be raised as hardware improves.
* **Per-user random salt** — stored alongside the hash, which every modern algorithm does automatically inside its output string.
* **Memory hardness** — high memory usage defeats GPU and ASIC parallelism, which is where the real attacker advantage lies.

### The algorithms
* **Argon2id** — current recommendation (winner of the Password Hashing Competition). Memory-hard and side-channel resistant. Tune memory, iterations and parallelism; a common starting point is 19 MiB / 2 iterations / 1 lane, then raise to whatever your latency budget allows.
* **scrypt** — memory-hard, well-regarded, predates Argon2.
* **bcrypt** — still acceptable and extremely battle-tested. Not memory-hard. Note the **72-byte input truncation**, which matters if you pre-hash long inputs.
* **PBKDF2** — weakest of the four (not memory-hard) but FIPS-approved, so sometimes mandated.

Always add a **pepper** — a secret key held outside the database (in a KMS/HSM) and mixed in. A database dump alone is then insufficient.

### The zero-downtime migration
Do **not** try to upgrade hashes in bulk; you cannot, because you do not have the plaintexts.

**Rehash on successful login.** Store an algorithm identifier with each hash. On login, verify with the recorded scheme; if it is the legacy one and verification succeeds, you momentarily hold the plaintext — rehash with Argon2id and replace the record. Users migrate transparently as they sign in.

Spring Security's \`DelegatingPasswordEncoder\` implements exactly this: hashes are prefixed \`{bcrypt}\`/\`{argon2}\`, it verifies with the matching encoder, and \`upgradeEncoding\` signals when a rehash is due.

For accounts that never log in, set a deadline and force a reset at the end of the window.

### The surrounding hygiene
* Compare with a **constant-time** function; every good library does this internally.
* Never log credentials, and clear \`char[]\` buffers where practical (though the JVM makes this imperfect).
* Rate-limit and add exponential backoff per account and per IP.
* Check candidate passwords against a breached-password list (Have I Been Pwned's k-anonymity API) rather than imposing arcane composition rules — NIST guidance now favours length and breach-checking over forced complexity and rotation.`,
    codeSnippet: `// Spring Security: multiple encoders, transparent upgrade on login
@Bean PasswordEncoder passwordEncoder() {
    String id = "argon2";
    Map<String, PasswordEncoder> encoders = Map.of(
        "argon2", new Argon2PasswordEncoder(16, 32, 1, 19 * 1024, 2),
        "bcrypt", new BCryptPasswordEncoder(12),
        "sha256", new LegacySha256Encoder());     // verify-only
    return new DelegatingPasswordEncoder(id, encoders);
}

// On successful authentication
if (encoder.upgradeEncoding(user.getPasswordHash())) {
    user.setPasswordHash(encoder.encode(rawPassword));   // silent upgrade
    repo.save(user);
}`,
    pitfalls: [
      'Using a fast general-purpose hash, with or without a salt.',
      'Storing the salt separately or reusing one salt for all users.',
      'Trying to bulk-migrate hashes rather than rehashing on login.',
      'Enforcing complexity rules and 90-day rotation instead of length plus breach checking.'
    ],
    followUpQuestions: [
      'What is a pepper and why must it live outside the database?',
      'How do you choose Argon2 parameters for your latency budget?',
      'Why does bcrypt truncate at 72 bytes and when does that matter?'
    ],
    faangFocus: 'A near-universal screening question. The rehash-on-login migration is the part that separates people who have actually done it.'
  },
  {
    id: 'sec-5',
    categoryId: 'security',
    title: 'Spring Security Filter Chain and Authorization Design',
    difficulty: 'Hard',
    tags: ['Spring Security', 'Filter Chain', 'Authorization', 'RBAC'],
    scenario: 'An audit finds that a `/admin/reports/export` endpoint is reachable by any authenticated user, despite an `antMatchers("/admin/**").hasRole("ADMIN")` rule appearing in the configuration — placed after a `permitAll()` rule for `/**`.',
    question: 'Explain how the Spring Security filter chain and authorization matching work, why ordering caused this, and how to design authorization so it fails closed.',
    idealAnswer: `### The filter chain
Spring Security is a chain of servlet filters, inserted via \`FilterChainProxy\`. Requests pass through in a fixed order:
1. \`SecurityContextPersistenceFilter\` — loads any existing \`SecurityContext\`.
2. Authentication filters — \`UsernamePasswordAuthenticationFilter\`, \`BearerTokenAuthenticationFilter\`, etc.
3. \`ExceptionTranslationFilter\` — converts \`AuthenticationException\` into a 401/redirect and \`AccessDeniedException\` into a 403.
4. \`AuthorizationFilter\` — the final gate, evaluating your request matchers.

### Why ordering caused the hole
Request matchers are evaluated **top to bottom, first match wins**. A \`permitAll()\` on \`/**\` matches everything, so the \`/admin/**\` rule is unreachable dead configuration. The rule was present, so it looked correct in review — a genuinely dangerous failure mode.

**Rule: order from most specific to least specific, and terminate with \`anyRequest().authenticated()\` or \`denyAll()\`.** Never place a broad \`permitAll()\` above narrower rules.

### Designing to fail closed
* **Default deny.** End every chain with \`anyRequest().denyAll()\` (or \`authenticated()\`), so a newly added endpoint is protected until someone deliberately opens it. The opposite default means every new endpoint is a potential hole.
* **Prefer method security to URL matching.** \`@PreAuthorize\` on the service method binds the rule to the behaviour, not to a URL string. URL patterns drift as routes change, and path-matching subtleties (trailing slashes, encoding, servlet path vs request URI) have produced real bypasses.
* **Authorize on data, not just role.** \`hasRole("ADMIN")\` does not prevent an admin of tenant A reading tenant B. Enforce ownership in the query itself (\`WHERE tenant_id = :current\`) — this is the **IDOR / broken object level authorization** class, consistently the top item in the OWASP API Top 10.
* Use \`@PreAuthorize\` with SpEL over method arguments, or a \`PermissionEvaluator\`, for object-level checks.

### Verification, not inspection
Configuration review is not enough. Write **authorization tests**: for each endpoint, assert the response for anonymous, wrong-role, right-role-wrong-tenant, and right-role-right-tenant. Spring Security's test support (\`@WithMockUser\`, \`SecurityMockMvcRequestPostProcessors\`) makes these cheap, and they catch exactly the class of bug the audit found.

### Other essentials
* Keep CSRF protection on for cookie-authenticated, state-changing endpoints; disabling it wholesale is a common shortcut with real consequences.
* Set security headers (HSTS, CSP, X-Content-Type-Options).
* Do not leak whether a username exists through differing error messages or response timing.`,
    codeSnippet: `@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()   // specific first
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/orders").hasAuthority("orders:write")
            .anyRequest().denyAll());                          // fail closed
    return http.build();
}

// Object-level: role alone does not stop cross-tenant access
@PreAuthorize("hasRole('ADMIN') and #report.tenantId == authentication.principal.tenantId")
public byte[] export(Report report) { ... }`,
    pitfalls: [
      'Ordering matchers from general to specific, making later rules unreachable.',
      'Ending the chain with permitAll() so new endpoints default to open.',
      'Checking roles but not object ownership, leaving IDOR vulnerabilities.',
      'Disabling CSRF globally to make a form work.'
    ],
    followUpQuestions: [
      'How does @PreAuthorize get enforced, and what does that mean for self-invocation?',
      'What is broken object level authorization and why does it top the OWASP API list?',
      'How would you write an automated test that every endpoint has an explicit rule?'
    ],
    faangFocus: 'Spring shops ask this after real incidents. "Fail closed, then test every endpoint against every role" is the answer that reads as production-hardened.'
  },
  {
    id: 'sec-6',
    categoryId: 'security',
    title: 'Secrets Management and Configuration Hygiene',
    difficulty: 'Solid',
    tags: ['Secrets', 'Vault', 'KMS', 'Rotation'],
    scenario: 'Database passwords live in `application.yml` committed to git. An engineer proposes moving them to environment variables and calling the problem solved.',
    question: 'Explain why neither is adequate, describe a proper secrets architecture, and cover rotation and leak response.',
    idealAnswer: `### Why committed config is bad
A secret in git is in **every clone, every fork, every CI cache, and the full history forever**. Deleting it in a later commit changes nothing; the old object is still reachable. Anyone who ever had read access has it.

### Why environment variables are only a small step up
Better than git, but still weak:
* Visible in \`/proc/<pid>/environ\` to anything running as that user.
* Leaked by crash dumps, error pages, \`docker inspect\`, and orchestrator API responses.
* Often logged by well-meaning startup code that prints the environment.
* Inherited by every child process.
* **No rotation story** — changing one requires a redeploy.

They are acceptable as the *last hop* for injecting a short-lived credential, not as the store.

### A proper architecture
1. **A dedicated secrets manager** — HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault. Encrypted at rest, access-controlled per identity, and **audited** — you get a log of who read what, when.
2. **Workload identity, not a bootstrap secret.** The chicken-and-egg problem ("how does the app authenticate to Vault?") is solved by platform identity: Kubernetes ServiceAccount tokens, IAM roles for service accounts, or instance metadata. No long-lived credential is ever stored anywhere.
3. **Dynamic, short-lived credentials where possible.** Vault's database engine issues a database user valid for an hour and revokes it automatically. A leaked credential expires on its own — this is the single biggest improvement available.
4. **Envelope encryption via KMS** for application-level data encryption: a data key encrypts the data, and the KMS-held master key encrypts the data key. The master key never leaves the HSM.
5. **Least privilege and scoping** — per-service, per-environment secrets. Never one shared credential.

### Rotation
* Automate it, and make the application able to **reload without a restart** (Spring Cloud Vault with a lease renewal, or a sidecar that refreshes a mounted file).
* Support two valid credentials during the overlap so rotation is not a hard cutover.
* Rotate on a schedule *and* on any suspicion of compromise.

### Prevention and response
* **Pre-commit hooks and CI scanning** — gitleaks, trufflehog, GitHub secret scanning. Blocking a commit is far cheaper than a rotation incident.
* Treat any leaked secret as compromised: **rotate first**, then investigate. Purging git history is optional cleanup, not remediation — assume it was copied.
* Never log secrets: mask them in structured logging, and be careful with objects whose \`toString\` includes configuration.`,
    codeSnippet: `# Kubernetes: no secret in the manifest, identity-based auth to Vault
spec:
  serviceAccountName: orders-service          # workload identity
  containers:
    - name: app
      env:
        - name: SPRING_CLOUD_VAULT_URI
          value: https://vault.internal
      volumeMounts:
        - name: creds
          mountPath: /var/run/secrets/db      # sidecar refreshes on renewal

# Vault issues a database user valid for 1h and revokes it automatically:
# vault read database/creds/orders-role`,
    pitfalls: [
      'Treating environment variables as a secrets solution rather than a delivery mechanism.',
      'Assuming a rewritten git history means the secret is safe.',
      'Long-lived static credentials with no rotation path.',
      'Logging configuration objects at startup and printing secrets into the log pipeline.'
    ],
    followUpQuestions: [
      'How does workload identity solve the secret-zero bootstrap problem?',
      'What is envelope encryption and why does the master key never leave the KMS?',
      'How do you rotate a database credential with no downtime and no dual-write?'
    ],
    faangFocus: 'Platform and infrastructure rounds. Naming short-lived dynamic credentials as the real fix — rather than "put it in Vault" — shows depth.'
  },
  {
    id: 'sec-7',
    categoryId: 'security',
    title: 'Supply Chain Security and Dependency Risk',
    difficulty: 'Hard',
    tags: ['Supply Chain', 'SBOM', 'CVE', 'Dependencies'],
    scenario: 'A CVE with a CVSS of 10.0 is published for a logging library. Your organisation has 300 services and nobody can answer, within a day, which of them are affected.',
    question: 'Explain the supply chain risks in a JVM build and design the tooling and process that makes this question answerable in minutes.',
    idealAnswer: `### The risk surface
* **Transitive dependencies.** A typical Spring Boot service has ~20 direct and 200+ transitive dependencies. You did not choose most of the code you ship.
* **Dependency confusion.** A public package published under an internal package name can be resolved instead of the private one if repository priority is misconfigured.
* **Typosquatting** and compromised maintainer accounts.
* **Build plugins**, which execute arbitrary code at build time with full access to the build machine and its credentials.
* **Base images** — most container CVEs come from the OS layer, not the application.

### Making the question answerable
1. **Generate an SBOM per build** (CycloneDX or SPDX) and store it centrally, keyed by service and version. The SBOM is what turns "which services use log4j-core 2.14?" from a week of investigation into a single query. This is the core of the answer.
2. **Continuous SCA** — OWASP Dependency-Check, Snyk, Trivy, or GitHub Dependabot — scanning both the dependency graph and container images, against the deployed inventory rather than just the default branch.
3. **Know what is actually deployed.** An SBOM for the main branch is useless if production runs a six-month-old tag. Tie SBOMs to deployed artefacts.

### Reducing the risk up front
* **Lock versions.** A Maven \`dependencyManagement\` BOM or Gradle lockfile makes builds reproducible; \`mvn dependency:tree\` and \`gradle dependencies\` must be part of review for new dependencies.
* **Verify integrity.** Checksum and signature verification, and an internal artifact repository (Artifactory/Nexus) as the **only** configured remote, so the public repository is proxied and cached, not fetched directly. This also removes dependency confusion.
* **Pin and scan base images**; prefer distroless or minimal images to shrink the OS surface.
* **Provenance** — sign artefacts (Sigstore/cosign) and record build provenance (SLSA), so you can prove an artefact came from your pipeline.
* **Least privilege in CI.** A compromised build plugin should not be able to reach production credentials. Ephemeral, scoped tokens only.

### The process side
* An owner for dependency updates, with automated PRs (Renovate/Dependabot) so upgrades are routine rather than emergency events. Most incident pain comes from being ten versions behind when a CVE lands.
* A documented severity-based SLA: critical patched in 24-48h, high in a week.
* Prune unused dependencies — the safest dependency is the one you removed.

### The honest framing
You cannot eliminate this risk; you can shrink it and make response fast. The metric that matters is **time from CVE publication to full remediation**, and the SBOM inventory is what determines it.`,
    codeSnippet: `<!-- Generate an SBOM on every build and publish it as an artefact -->
<plugin>
  <groupId>org.cyclonedx</groupId>
  <artifactId>cyclonedx-maven-plugin</artifactId>
  <executions>
    <execution>
      <phase>package</phase>
      <goals><goal>makeAggregateBom</goal></goals>
    </execution>
  </executions>
</plugin>

# Fail the build on new critical findings, and scan the image too
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
trivy image --severity CRITICAL,HIGH --exit-code 1 acme/orders:$SHA`,
    pitfalls: [
      'Scanning only direct dependencies and missing the transitive graph.',
      'Producing SBOMs for the main branch while production runs old tags.',
      'Allowing builds to resolve directly from public repositories, enabling dependency confusion.',
      'Treating upgrades as emergency work instead of continuous routine maintenance.'
    ],
    followUpQuestions: [
      'How does a dependency confusion attack succeed, and what configuration prevents it?',
      'What does SLSA provenance add beyond signing the artefact?',
      'How do you triage a CVE that is present but unreachable in your code paths?'
    ],
    faangFocus: 'Post-Log4Shell, this is a standard senior/staff question. "SBOM inventory tied to deployed artefacts" is the answer that demonstrates you lived through it.'
  },
  {
    id: 'sec-8',
    categoryId: 'security',
    title: 'Input Validation, SSRF and Output Encoding',
    difficulty: 'Hard',
    tags: ['SSRF', 'XSS', 'Validation', 'OWASP'],
    scenario: 'A service accepts a user-supplied URL to fetch a profile image, and renders a user-supplied display name into an HTML page. Both features were added without security review.',
    question: 'Identify the vulnerability classes, explain the defences precisely, and describe why allowlisting is the recurring principle.',
    idealAnswer: `### The URL fetch: SSRF
Server-Side Request Forgery. The server makes a request on the attacker's behalf **from inside the trust boundary**, which typically means it can reach:
* Cloud instance metadata endpoints, which have historically exposed credentials.
* Internal services with no authentication because they are "not exposed".
* \`localhost\` admin ports.
* Non-HTTP schemes (\`file://\`, \`gopher://\`) depending on the client.

**Defences, layered:**
* **Allowlist destinations** — specific hosts or a dedicated image CDN. This is the only robust control.
* **Resolve DNS yourself, validate the resolved IP, and connect to that IP.** Blocklisting hostnames fails to **DNS rebinding**: the name resolves to a public IP during validation and an internal one at connect time. Validating after resolution and pinning the connection closes it.
* Reject private, loopback, link-local and reserved ranges (including IPv6 forms and IPv4-mapped IPv6).
* **Disable redirects**, or re-validate every hop — a redirect to \`169.254.169.254\` defeats a check done only on the original URL.
* Enforce scheme, port, timeout, and response size limits.
* **Network-level egress control** is the real backstop: run the fetcher in a subnet with no route to internal services, and require metadata endpoints to use IMDSv2.

### The display name: XSS
The defence is **context-aware output encoding**, applied at render time, not input time. The same string needs different encoding in HTML body, HTML attribute, JavaScript, CSS and URL contexts — encoding once on input cannot know where it will be rendered, and produces double-encoding bugs.

* Use a template engine with **auto-escaping on** (Thymeleaf, React's default JSX behaviour). Treat every use of \`innerHTML\`, \`v-html\` or \`th:utext\` as requiring justification.
* If you must accept rich text, sanitise with a maintained allowlist-based sanitiser (OWASP Java HTML Sanitizer), never a regex.
* Add **Content-Security-Policy** as defence in depth, so an injected script has no permitted origin to execute from.
* Set cookies \`httpOnly\` so XSS cannot steal session tokens.

### Validation generally
* **Validate on the server**, always. Client-side validation is a UX feature.
* **Allowlist, not denylist.** Define what is acceptable — type, length, range, format — and reject everything else. Denylists are a losing race against encoding tricks, unicode normalisation and new syntax.
* Validate **after** canonicalisation, or an attacker slips through with an alternate encoding.
* Use \`jakarta.validation\` constraints on request DTOs so validation is declarative and consistently applied.

### The recurring principle
Every one of these defences is the same idea: **enumerate what is allowed rather than what is forbidden**. Denylists fail because the attacker gets to choose the input space.`,
    codeSnippet: `// SSRF: resolve first, validate the IP, then connect to that IP
URI uri = URI.create(userSupplied);
if (!Set.of("https").contains(uri.getScheme())) throw new BadRequest("scheme");

InetAddress addr = InetAddress.getByName(uri.getHost());
if (addr.isLoopbackAddress() || addr.isLinkLocalAddress()
        || addr.isSiteLocalAddress() || addr.isAnyLocalAddress()) {
    throw new BadRequest("blocked destination");
}

HttpClient client = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER)   // re-validate every hop
        .connectTimeout(Duration.ofSeconds(3))
        .build();`,
    pitfalls: [
      'Validating the hostname string instead of the resolved IP, leaving DNS rebinding open.',
      'Following redirects without re-validating each destination.',
      'Encoding on input rather than context-appropriately on output.',
      'Sanitising HTML with regular expressions.'
    ],
    followUpQuestions: [
      'How does DNS rebinding defeat hostname-based SSRF checks?',
      'Why must output encoding be context-aware, and what breaks if it is not?',
      'What does a useful Content-Security-Policy look like for a modern SPA?'
    ],
    faangFocus: 'SSRF has climbed the OWASP Top 10 because of cloud metadata endpoints. Knowing the DNS rebinding subtlety is what marks a strong answer.'
  },
  {
    id: 'sec-9',
    categoryId: 'security',
    title: 'Multi-Tenant Data Isolation',
    difficulty: 'Expert',
    tags: ['Multi-Tenancy', 'Isolation', 'RLS', 'IDOR'],
    scenario: 'A SaaS platform serves 5,000 tenants from one Postgres database with a `tenant_id` column on every table. A bug in one repository method omitted the tenant filter and leaked data across tenants for three weeks before a customer noticed.',
    question: 'Explain the multi-tenancy isolation models and design a system where forgetting the filter cannot cause a leak.',
    idealAnswer: `### The core problem
When isolation depends on **every developer remembering to add \`WHERE tenant_id = ?\`**, it is a matter of time before someone forgets. The bug is not the missing filter; it is an architecture where the filter is optional.

### The isolation models
* **Database per tenant** — strongest isolation, easy per-tenant backup/restore and residency compliance. Does not scale to 5,000 tenants (connection pools, migrations, cost).
* **Schema per tenant** — good isolation, moderate operational cost. Migrations must run per schema; thousands of schemas strain the catalog.
* **Shared schema with a discriminator column** — best density and simplest operations, weakest structural isolation. This is the model in question, and it is the right choice at 5,000 tenants — provided isolation is enforced by something other than developer discipline.

Many mature platforms run a **hybrid**: shared schema by default, dedicated database for enterprise tenants who pay for it.

### Making the filter non-optional
1. **Row-Level Security (the strongest answer).** Enable RLS in Postgres with a policy \`USING (tenant_id = current_setting('app.tenant_id')::uuid)\`. Set the session variable from the authenticated principal at the start of each transaction. Now a query with no tenant filter returns **nothing** rather than everything. Enforcement lives in the database, below all application code, so no ORM bug or raw query can bypass it.
2. **Hibernate filters / \`@TenantId\`** — an ORM-level default filter. Good defence in depth, but bypassed by native queries.
3. **A repository base class** that always applies the predicate, with raw \`EntityManager\` access forbidden by an ArchUnit rule.
4. **Tenant context propagation** — resolve the tenant once from the token, store it in a request-scoped holder, and set the database session variable in one place. Critically, propagate it into async work and thread pools, or a background task runs with the wrong tenant (or none).

### Verification
* **Automated cross-tenant tests**: seed two tenants, then for every repository method assert that tenant A cannot see tenant B's rows. This is exactly the test that would have caught the bug in three minutes rather than three weeks.
* An architecture test asserting every entity has a tenant column and every query path goes through the guarded repository.
* Log and alert on any query executed without a tenant context set.

### Detection
Isolation failures are silent by nature. Add a canary: a synthetic tenant whose rows must never appear in any other tenant's result set, checked continuously. Three weeks of undetected leakage is a **monitoring** failure as much as a code one.

### And the operational consequences
Encrypt per-tenant where regulation demands it, support per-tenant deletion (GDPR) which is far harder in a shared schema, and be able to export one tenant's data on request.`,
    codeSnippet: `-- Postgres RLS: isolation enforced below the application
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

// Set once per transaction, from the authenticated principal
@Transactional
public void withTenant(UUID tenantId, Runnable work) {
    jdbc.update("SET LOCAL app.tenant_id = ?", tenantId.toString());
    work.run();      // any forgotten WHERE clause now returns zero rows
}`,
    pitfalls: [
      'Relying on developer discipline to add the tenant predicate.',
      'Applying an ORM filter that native queries silently bypass.',
      'Losing tenant context when work moves to an async thread pool.',
      'Having no cross-tenant tests and no leak detection.'
    ],
    followUpQuestions: [
      'What does FORCE ROW LEVEL SECURITY change, and why does it matter for the table owner?',
      'How do you propagate tenant context safely across virtual threads and executors?',
      'How would you migrate one large tenant out of the shared schema with no downtime?'
    ],
    faangFocus: 'A staff-level SaaS design question. "Make the safe path the only path — enforce it in the database" is the framing that distinguishes senior from staff.'
  },
  {
    id: 'sec-10',
    categoryId: 'security',
    title: 'Rate Limiting, Abuse Prevention and Fail-Closed Design',
    difficulty: 'Hard',
    tags: ['Rate Limiting', 'Token Bucket', 'Abuse', 'Resilience'],
    scenario: 'A public API has no rate limiting. A single misbehaving client saturates the database, and a credential-stuffing campaign against the login endpoint goes unnoticed for days.',
    question: 'Design rate limiting for both cases. Compare the algorithms, explain distributed enforcement, and address what happens when the limiter itself fails.',
    idealAnswer: `### The two problems are different
* **Capacity protection** — stop any one client consuming a disproportionate share. Limit per API key / tenant / IP.
* **Abuse prevention** — stop credential stuffing. Limit per **account** and per source, with escalating friction, and detect distributed attempts that stay under any single-source threshold.

Using one mechanism for both is a common design error.

### The algorithms
* **Fixed window** — a counter per interval. Trivial, but allows a **2x burst** across the boundary (all requests at the end of one window plus the start of the next).
* **Sliding window log** — exact, stores a timestamp per request. Accurate but memory-heavy.
* **Sliding window counter** — weighted blend of the current and previous window. Near-exact at a fraction of the cost; a good default.
* **Token bucket** — tokens refill at a steady rate up to a burst capacity. **Allows controlled bursts**, which matches real client behaviour, and is the usual choice for public APIs.
* **Leaky bucket** — enforces a strictly smooth output rate. Good for protecting a fragile downstream.

For an API, token bucket per key with a modest burst is the right default. For login, a much stricter counter plus escalating delay.

### Distributed enforcement
With many instances, a local counter multiplies the effective limit by the instance count.
* **Centralised counter in Redis**, updated atomically with a Lua script or \`INCR\` + \`EXPIRE\`, so check-and-decrement is one round trip and race-free.
* Accept approximation: per-instance limits with a share of the budget are cheaper and often good enough.
* Or push it to the **edge** — API gateway, Envoy, or the CDN — so abusive traffic never reaches your services at all. This is usually the best answer for capacity protection.

### Fail-closed vs fail-open
This is the question most candidates miss. If Redis is down:
* **Capacity protection → fail open.** Rejecting all traffic because the limiter is unavailable converts a dependency outage into a full outage. Fall back to a local per-instance limit.
* **Abuse prevention on login → fail closed.** An attacker who can knock out the limiter must not thereby gain unlimited login attempts.

The decision follows from what the control protects, and saying that explicitly is the mark of a strong answer.

### Credential stuffing specifically
* Per-account attempt limits with exponential backoff, **not** permanent lockout (which becomes a denial-of-service against real users).
* Detect distributed low-and-slow attempts: many accounts from one ASN, or one password across many accounts.
* Check credentials against breached-password lists; stuffing relies on reused passwords.
* Add friction rather than blocking: CAPTCHA, step-up MFA, device fingerprinting.
* **Uniform responses and timing** so the endpoint does not reveal which usernames exist.

### The client contract
Return **429** with \`Retry-After\` and \`RateLimit-Limit\`/\`RateLimit-Remaining\`/\`RateLimit-Reset\` headers, and document them. A limiter that clients cannot reason about produces retry storms — and clients should back off with jitter.`,
    codeSnippet: `-- Atomic token bucket in Redis: one round trip, no race
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or ARGV[1])
local last   = tonumber(redis.call('HGET', KEYS[1], 'ts') or ARGV[3])
local delta  = math.max(0, ARGV[3] - last)

tokens = math.min(ARGV[1], tokens + delta * ARGV[2])   -- capacity, refill rate
if tokens < 1 then return 0 end

redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'ts', ARGV[3])
redis.call('EXPIRE', KEYS[1], 3600)
return 1

// Fail open for capacity, fail closed for auth
catch (RedisException e) { return isAuthEndpoint ? DENY : localFallback.tryAcquire(); }`,
    pitfalls: [
      'Per-instance counters that silently multiply the intended limit.',
      'Fixed windows that permit a 2x burst across the boundary.',
      'Failing closed on capacity limits, turning a Redis outage into a full outage.',
      'Permanent account lockout, which becomes a denial-of-service vector.'
    ],
    followUpQuestions: [
      'Why does a fixed window allow double the intended rate at the boundary?',
      'How do you detect distributed credential stuffing that stays under every per-source limit?',
      'What rate-limit headers should an API expose, and how should clients use them?'
    ],
    faangFocus: 'A common design round at API-first companies. The fail-open versus fail-closed distinction, argued from what the control protects, is the standout answer.'
  },
];
