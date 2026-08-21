import type { Question } from '../types';

export const TESTING_QUESTIONS: Question[] = [
  {
    id: 'tst-1',
    categoryId: 'testing',
    title: 'The Test Pyramid and What to Test Where',
    difficulty: 'Core',
    tags: ['Test Pyramid', 'Strategy', 'Integration Tests'],
    scenario: 'A team has 4,000 unit tests with 92% coverage, a 45-minute CI pipeline, and still ships bugs weekly. Most failures are integration issues: wrong serialisation, missing config, broken SQL.',
    question: 'Diagnose the testing strategy. Explain the test pyramid, what belongs at each layer, and why high coverage did not prevent these bugs.',
    idealAnswer: `### Why 92% coverage did not help
Coverage measures **which lines executed**, not whether behaviour is correct or whether components work together. A test suite of heavily-mocked unit tests can execute every line while verifying nothing about the real system. The bugs listed — serialisation, config, SQL — are precisely the ones that live **in the seams between components**, which mocks paper over.

Coverage is a useful *smell detector* (a 20%-covered module is a risk) but a terrible target. Goodhart's law applies: the moment it becomes a goal, people write tests that raise it without adding confidence.

### The pyramid
* **Unit tests (broad base)** — fast, isolated, no IO. Test *logic*: branching, calculations, edge cases, error handling. Milliseconds each.
* **Integration tests (middle)** — real database, real serialisation, real Spring context. Test the *wiring*: repositories against a real Postgres via Testcontainers, controllers via \`@SpringBootTest\` + \`MockMvc\`, message consumers against a real broker.
* **End-to-end tests (thin tip)** — a handful covering critical user journeys. Slow, flaky, expensive to maintain. Keep them few and high-value.

### The diagnosis here
This team has an **hourglass** or **ice-cream cone** problem: a huge base of over-mocked unit tests, almost no integration layer, and reliance on manual QA at the top. The fix is not more unit tests — it is adding a real integration layer.

### What to test where
* Business rules and pure logic → unit.
* SQL, mapping, transaction boundaries → integration with a real database.
* HTTP contract, serialisation, validation, security filters → integration with a real context.
* Cross-service contracts → **consumer-driven contract tests** (Pact, Spring Cloud Contract) instead of expensive E2E chains.

### On the 45-minute pipeline
Parallelise, split slow tests into a separate stage, reuse Testcontainers across classes, and use test slices (\`@DataJpaTest\`, \`@WebMvcTest\`) so you are not booting the whole context per test class. Fast feedback is a feature — a slow suite gets skipped, and a skipped suite is worth nothing.

### The better metric
Track **escaped defects** and **mean time to detection**, not coverage. Consider mutation testing (PIT) for a real measure of whether tests would actually catch a change.`,
    codeSnippet: `// Unit: pure logic, no Spring, microseconds
@Test void appliesBulkDiscountOverTenItems() {
    assertThat(pricing.total(order(11, Money.of(10)))).isEqualTo(Money.of(99));
}

// Integration: real Postgres, real SQL, real mapping
@DataJpaTest
@Testcontainers
class OrderRepositoryTest {
    @Container static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);
    }
}`,
    pitfalls: [
      'Treating coverage percentage as a quality goal.',
      'Mocking so heavily that tests verify the mocks rather than the system.',
      'Skipping the integration layer and compensating with manual QA.',
      'Booting the full Spring context for every test class instead of using slices.'
    ],
    followUpQuestions: [
      'What does mutation testing measure that line coverage cannot?',
      'When are consumer-driven contract tests a better investment than end-to-end tests?',
      'How would you get a 45-minute suite under 10 minutes without deleting tests?'
    ],
    faangFocus: 'Asked to gauge engineering judgement rather than tool knowledge. Saying "coverage is a smell detector, not a target" reframes the whole conversation.'
  },
  {
    id: 'tst-2',
    categoryId: 'testing',
    title: 'Mockito: Stubbing, Verification and Over-Mocking',
    difficulty: 'Solid',
    tags: ['Mockito', 'Mocks', 'Stubs', 'Test Doubles'],
    scenario: 'A test mocks the repository, the mapper, the clock, the validator and the event publisher, then asserts that each was called with specific arguments. A later refactor that preserves behaviour breaks 40 tests.',
    question: 'Explain the different kinds of test double, when mocking is appropriate, and why this suite is brittle.',
    idealAnswer: `### The taxonomy (Meszaros)
* **Dummy** — passed but never used.
* **Stub** — returns canned answers. Used for **state** verification.
* **Spy** — a real object with some methods overridden or calls recorded.
* **Mock** — pre-programmed with expectations. Used for **behaviour** verification.
* **Fake** — a working lightweight implementation (an in-memory repository).

Mockito blurs stub and mock: \`when(...).thenReturn(...)\` is stubbing; \`verify(...)\` is mocking.

### Why this suite is brittle
Verifying *how* the code works — which collaborators were called, in what order, with what arguments — couples tests to **implementation structure**, not behaviour. Any refactor that preserves the observable outcome still breaks them. That inverts the purpose of tests: they should give you the confidence to refactor, not punish you for it.

This is over-specification. The rule of thumb: **assert on outcomes, verify only interactions that are themselves the outcome.**

### When verification IS the right thing
When the side effect is the contract: an email was sent, a message was published, a payment was charged exactly once. There is no return value to assert on, so \`verify\` is legitimate.

### When not to mock at all
* **Value objects** — never mock a \`record\` or a \`Money\`. Just construct one.
* **Types you do not own** — mocking a third-party client encodes your *belief* about its behaviour. If you are wrong, the test passes and production fails. Wrap it in your own interface and mock that, or use a fake server (WireMock).
* **The database** — use Testcontainers. A mocked repository cannot catch a broken query.
* Prefer a **fake in-memory implementation** over a mock for repositories: it is reusable, expresses real semantics, and does not break on refactor.

### Practical Mockito notes
* Use \`@ExtendWith(MockitoExtension.class)\`; strict stubs catch unused stubbing, which is usually a sign the test drifted.
* \`ArgumentCaptor\` for asserting on complex arguments beats a giant \`eq(...)\` chain.
* Avoid \`verifyNoMoreInteractions\` except in rare cases — it is the definition of over-specification.
* Never mock static methods to work around bad design; inject a \`Clock\` instead of mocking \`Instant.now()\`.`,
    codeSnippet: `// Brittle: asserts on the mechanism
verify(mapper).toEntity(dto);
verify(repo).save(any());
verify(publisher).publish(any());

// Better: assert on the outcome, and verify only the real side effect
Order saved = service.create(dto);

assertThat(saved.status()).isEqualTo(CONFIRMED);
assertThat(fakeRepo.findById(saved.id())).isPresent();

ArgumentCaptor<OrderCreated> ev = ArgumentCaptor.forClass(OrderCreated.class);
verify(publisher).publish(ev.capture());     // publishing IS the contract
assertThat(ev.getValue().orderId()).isEqualTo(saved.id());`,
    pitfalls: [
      'Verifying every collaborator interaction, coupling tests to implementation.',
      'Mocking value objects or types you do not own.',
      'Mocking the repository instead of testing against a real database.',
      'Using lenient() everywhere to silence strict-stub warnings instead of fixing the test.'
    ],
    followUpQuestions: [
      'When is a hand-written fake better than a Mockito mock?',
      'Why is mocking a third-party library considered risky?',
      'How do you test time-dependent logic without mocking static methods?'
    ],
    faangFocus: 'Code-review rounds probe this. "Mock roles, not objects" and "assert outcomes, verify side effects" are the phrases that signal maturity.'
  },
  {
    id: 'tst-3',
    categoryId: 'testing',
    title: 'Testcontainers and Realistic Integration Tests',
    difficulty: 'Solid',
    tags: ['Testcontainers', 'Integration', 'H2', 'Docker'],
    scenario: 'The team uses H2 in PostgreSQL compatibility mode for repository tests. Tests pass, but production breaks on a JSONB query, a `ON CONFLICT` upsert and a window function.',
    question: 'Explain why in-memory database substitutes fail, how Testcontainers solves it, and how to keep the suite fast.',
    idealAnswer: `### Why H2 compatibility mode is a trap
"PostgreSQL mode" emulates *syntax*, not the engine. It differs in:
* **Types** — JSONB, arrays, \`ltree\`, ranges, custom enums are absent or approximated.
* **SQL features** — \`ON CONFLICT\`, \`RETURNING\`, \`DISTINCT ON\`, \`FOR UPDATE SKIP LOCKED\`, many window and CTE behaviours.
* **Semantics** — isolation and MVCC behaviour, locking, constraint deferral, collation and sort order, \`NULL\` handling in unique indexes.
* **The optimiser** — index usage and plans are completely different, so no performance signal at all.

The result is the worst kind of test: one that is green and wrong. It builds confidence that does not correspond to production.

### Testcontainers
Runs the **actual** Postgres image in Docker for the test, wired in via \`@DynamicPropertySource\`. Same engine, same version, same extensions as production. It also handles Kafka, Redis, LocalStack, Elasticsearch, and arbitrary images.

### Keeping it fast
1. **Singleton container per JVM** — start one container in a static initialiser (or use \`@Testcontainers\` with a static \`@Container\`, which is per-class) and share it across all test classes. Do **not** start a container per test.
2. **Reusable containers** — \`testcontainers.reuse.enable=true\` keeps the container alive between local runs; startup drops to zero on the second run.
3. **Clean state cheaply** — truncate tables between tests, or wrap each test in a transaction that rolls back (\`@Transactional\` on the test). Truncation is more honest because it does not hide commit-time behaviour.
4. **Migrate once** — run Flyway once on container start, not per test.
5. **Reuse the Spring context** — avoid \`@DirtiesContext\` and avoid varying \`@MockBean\` sets, both of which force expensive context rebuilds. Spring caches contexts by configuration signature.
6. **Parallel execution** — JUnit 5 parallel tests, with care around shared database state.

### Where the boundary sits
Testcontainers is for **integration** tests: repositories, message consumers, anything touching infrastructure. Pure logic still belongs in fast unit tests. The pyramid does not go away — you are making its middle layer trustworthy.

### One caveat
CI must have a Docker daemon available. In restricted environments, a shared ephemeral database instance per pipeline is the fallback — still far better than H2.`,
    codeSnippet: `// One container for the whole JVM, started once
abstract class IntegrationTestBase {
    static final PostgreSQLContainer<?> DB =
            new PostgreSQLContainer<>("postgres:16-alpine").withReuse(true);

    static { DB.start(); }   // singleton, not per class

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", DB::getJdbcUrl);
        r.add("spring.datasource.username", DB::getUsername);
        r.add("spring.datasource.password", DB::getPassword);
    }
}`,
    pitfalls: [
      'Using H2 to test Postgres-specific SQL and trusting the green result.',
      'Starting a container per test class or per test method.',
      'Using @DirtiesContext liberally and destroying Spring context caching.',
      'Forgetting CI needs a Docker daemon.'
    ],
    followUpQuestions: [
      'How does Spring decide whether it can reuse a cached application context?',
      'What are the trade-offs of rollback-per-test versus truncate-per-test?',
      'How would you test a Kafka consumer end to end with Testcontainers?'
    ],
    faangFocus: 'Standard at any company running real infrastructure. The singleton-container and context-caching details show you have actually optimised a suite.'
  },
  {
    id: 'tst-4',
    categoryId: 'testing',
    title: 'Testing Concurrent and Asynchronous Code',
    difficulty: 'Hard',
    tags: ['Async', 'Flaky Tests', 'Awaitility', 'Race Conditions'],
    scenario: 'A test for an async event handler calls `Thread.sleep(500)` before asserting. It passes locally, fails on CI roughly one run in twenty, and someone has added `@RepeatedTest(3)` to hide it.',
    question: 'Explain why sleep-based async tests are flaky and describe reliable techniques for testing concurrent code.',
    idealAnswer: `### Why sleep is always wrong
\`Thread.sleep\` encodes a **guess** about timing. On a loaded CI machine the work takes longer and the test fails; when it is fast, the test wastes the difference. There is no sleep duration that is both fast and reliable — you are trading flakiness against suite runtime, and losing both.

Retrying a flaky test does not fix it; it **hides a real race** and trains the team to ignore red builds.

### Deterministic techniques, best first
1. **Make the boundary synchronous in tests.** Inject the executor. In production use a real thread pool; in tests use \`Runnable::run\` (a same-thread executor) or \`MoreExecutors.directExecutor()\`. The async behaviour is a production concern; most tests want the logic, not the threading.
2. **Await a real signal.** \`CountDownLatch\`, \`CompletableFuture.get(timeout)\`, or a \`BlockingQueue\` the handler writes to. The test blocks until the work has demonstrably happened, then proceeds immediately.
3. **Poll a condition with a timeout** — **Awaitility**. \`await().atMost(5, SECONDS).untilAsserted(...)\` polls, so it finishes as soon as the condition holds and fails with a clear message otherwise. This is the right tool when you cannot inject a signal (e.g. a message actually arriving in Kafka).
4. **Control time.** Inject a \`Clock\` and use \`Clock.fixed\`; for schedulers, use a virtual-time scheduler (Reactor's \`StepVerifier.withVirtualTime\`, or a test scheduler) so a 30-minute timeout tests in microseconds.

### Testing for actual concurrency bugs
Ordinary tests almost never catch races — they exercise one interleaving.
* **jcstress** is the real tool: it generates interleavings and checks for illegal outcomes against the Java Memory Model. Use it for lock-free data structures.
* **Stress tests** with many threads and \`assertTimeoutPreemptively\` can surface deadlocks and lost updates, but absence of failure proves nothing.
* **Thread dumps on timeout** — capture them in CI so a hung test tells you *why*.

### The rule
A test that depends on wall-clock timing is not a test, it is a coin flip. Either remove the concurrency in the test or wait on a real signal.`,
    codeSnippet: `// Flaky
handler.handleAsync(event);
Thread.sleep(500);
assertThat(repo.count()).isEqualTo(1);

// Deterministic: wait on the actual completion signal
CompletableFuture<Void> done = handler.handleAsync(event);
done.get(5, TimeUnit.SECONDS);
assertThat(repo.count()).isEqualTo(1);

// When you cannot get a handle: poll a condition, fail fast, pass instantly
await().atMost(Duration.ofSeconds(5))
       .pollInterval(Duration.ofMillis(50))
       .untilAsserted(() -> assertThat(repo.count()).isEqualTo(1));`,
    pitfalls: [
      'Using Thread.sleep and tuning the number until CI goes green.',
      'Hiding flakiness with retries or @RepeatedTest.',
      'Assuming a passing concurrency test proves the code is race-free.',
      'Testing timeout logic with real wall-clock waits instead of a controllable Clock.'
    ],
    followUpQuestions: [
      'How does jcstress explore interleavings, and what can it prove?',
      'How would you inject an executor so production is async and tests are synchronous?',
      'What should CI capture automatically when a test times out?'
    ],
    faangFocus: 'Flaky-test triage is a real job at scale. Naming Awaitility and jcstress, and treating retries as a smell, marks you as someone who fixes rather than mutes.'
  },
  {
    id: 'tst-5',
    categoryId: 'testing',
    title: 'Spring Boot Test Slices and Context Caching',
    difficulty: 'Solid',
    tags: ['Spring Boot Test', 'Slices', 'MockBean', 'Context Cache'],
    scenario: 'Every test class is annotated `@SpringBootTest` and the suite takes 22 minutes. Adding `@MockBean` to a few classes made it noticeably worse.',
    question: 'Explain Spring\'s test context caching, why `@MockBean` hurts it, and which slice annotations to use.',
    idealAnswer: `### How context caching works
Spring caches the \`ApplicationContext\` keyed by the **full test configuration signature**: the config classes, active profiles, property sources, context initialisers, and the set of bean overrides. Two test classes with an identical signature share one context — starting it once instead of twice.

With \`@SpringBootTest\` everywhere and identical configuration, you should get **one** context and one startup. So a 22-minute suite means the signatures differ.

### Why @MockBean is expensive
\`@MockBean\` (and \`@SpyBean\`) **change the context signature**, because they replace bean definitions. Each distinct combination of mocked beans produces a **new context**, started from scratch. Twenty test classes with twenty different \`@MockBean\` sets means twenty full application startups.

Mitigations:
* Group mocks into a shared test configuration so several classes share one signature.
* Prefer constructor injection with a plain mock passed in, at the unit level, over \`@MockBean\` at the context level.
* Since Spring Framework 6.2 / Boot 3.4, \`@MockitoBean\` is the successor — same caching consideration applies.

### Use slices
A slice boots only the relevant part of the context:
* \`@WebMvcTest\` — controllers, filters, converters, validation, exception handlers. No database, no services (mock them).
* \`@DataJpaTest\` — repositories, entity manager, and an embedded or configured datasource; transactional and rolled back per test by default.
* \`@JsonTest\` — serialisation only. Ideal for verifying DTO contracts.
* \`@WebFluxTest\`, \`@DataRedisTest\`, \`@RestClientTest\`, \`@JdbcTest\` similarly.

Slices start in a fraction of the time and give sharper failure messages, because far less is in play.

### Other suite-speed levers
* Avoid \`@DirtiesContext\` — it evicts the cached context and forces a restart.
* Keep \`@ActiveProfiles\` consistent; a stray profile creates a new context.
* Use \`@SpringBootTest(webEnvironment = MOCK)\` unless you truly need a real port.
* Run tests in parallel (JUnit 5 \`junit.jupiter.execution.parallel.enabled\`), being careful with shared database state.
* Reuse one Testcontainers instance across the whole JVM.

### The layered strategy
Most tests should need no Spring context at all — plain constructor-injected unit tests. Slices for the wiring. A small number of full \`@SpringBootTest\` runs for genuine end-to-end confidence.`,
    codeSnippet: `// Controller layer only: fast, focused
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;      // changes context signature — group these

    @Test void returns404ForUnknownOrder() throws Exception {
        given(service.find(7L)).willReturn(Optional.empty());
        mvc.perform(get("/orders/7")).andExpect(status().isNotFound());
    }
}

// Repository layer only, transactional and rolled back per test
@DataJpaTest
class OrderRepositoryTest { ... }`,
    pitfalls: [
      'Using @SpringBootTest for everything, including pure logic tests.',
      'Scattering unique @MockBean combinations and multiplying contexts.',
      'Using @DirtiesContext to work around test pollution instead of cleaning state.',
      'Inconsistent @ActiveProfiles creating extra contexts by accident.'
    ],
    followUpQuestions: [
      'What exactly goes into the context cache key?',
      'How does @DataJpaTest roll back, and when does that hide a real bug?',
      'When is @SpringBootTest with a real port genuinely necessary?'
    ],
    faangFocus: 'Spring-heavy interviews ask why the suite is slow. "MockBean changes the context cache key" is the answer that shows real debugging experience.'
  },
  {
    id: 'tst-6',
    categoryId: 'testing',
    title: 'Property-Based Testing and Mutation Testing',
    difficulty: 'Hard',
    tags: ['jqwik', 'PIT', 'Property-Based', 'Mutation Testing'],
    scenario: 'A money-rounding utility has 30 example-based tests and 100% line coverage. A production bug appears for a specific negative amount with a half-even rounding edge case that no example covered.',
    question: 'Explain property-based testing and mutation testing, what each catches that example-based tests do not, and where they fit in a real pipeline.',
    idealAnswer: `### The limit of example-based tests
Examples test the cases **you thought of**. Bugs live in the cases you did not — negative zero, \`Integer.MIN_VALUE\`, empty collections, unicode surrogate pairs, DST boundaries, exactly-half rounding. Coverage cannot help because the buggy line *was* executed, just with the wrong input.

### Property-based testing (jqwik, QuickTheories)
Instead of "for this input, expect this output", you state an **invariant that must hold for all inputs**, and the framework generates hundreds of cases, including nasty edge values it deliberately biases towards.

Useful property shapes:
* **Round trip** — \`parse(format(x)) == x\`.
* **Invariant** — the result is always non-negative; the list always stays sorted.
* **Idempotence** — \`f(f(x)) == f(x)\`.
* **Commutativity / associativity** — order of operations does not matter.
* **Oracle / model** — compare against a slow but obviously-correct reference implementation.
* **Metamorphic** — adding an element never decreases the count.

The killer feature is **shrinking**: on failure the framework reduces the counterexample to the minimal failing input, so instead of a 400-element list you get "fails at −0.005".

### Mutation testing (PIT)
PIT deliberately **mutates your production bytecode** — flips \`>\` to \`>=\`, replaces a return with a constant, removes a method call — reruns the tests, and asks: did any test notice? A surviving mutant is a line that is covered but **not actually verified**.

This is the honest answer to "is 100% coverage meaningful?" A mutation score of 45% with 100% line coverage tells you more than any coverage report.

### Where each fits
* Property-based tests: pure functions with algebraic structure — parsers, serialisers, money and date arithmetic, sorting, compression, validation logic. High value, low maintenance.
* Mutation testing: run on **core domain packages only**, and typically **nightly** rather than per-commit — it is CPU-expensive because it reruns tests once per mutant. Set a mutation-score threshold on the critical module and let it gate.

### For this specific bug
A property like "rounding half-even preserves sign and never changes magnitude by more than half a cent, for all decimal inputs" would have generated the negative half-cent case immediately, and shrunk it to the minimal counterexample.`,
    codeSnippet: `// Property: holds for ALL inputs, not the ones you imagined
@Property
void roundingNeverMovesMoreThanHalfACent(@ForAll BigDecimal amount) {
    BigDecimal rounded = Money.round(amount);
    assertThat(rounded.subtract(amount).abs())
            .isLessThanOrEqualTo(new BigDecimal("0.005"));
    assertThat(rounded.signum()).isEqualTo(amount.signum());
}

// Round trip
@Property
void formatThenParseIsIdentity(@ForAll("validMoney") Money m) {
    assertThat(Money.parse(m.format())).isEqualTo(m);
}`,
    pitfalls: [
      'Writing properties that merely restate the implementation, so they cannot fail.',
      'Running mutation testing on the entire codebase per commit and blowing up CI time.',
      'Treating property-based testing as a replacement for example tests rather than a complement.',
      'Ignoring the shrunk counterexample instead of adding it as a permanent regression test.'
    ],
    followUpQuestions: [
      'What is shrinking and why does it matter so much in practice?',
      'What kinds of mutant survival indicate a genuinely missing assertion?',
      'How do you choose a mutation-score threshold that is demanding but not obstructive?'
    ],
    faangFocus: 'A differentiator question. Most candidates have never used either; explaining mutation testing as "coverage that actually verifies" lands strongly.'
  },
  {
    id: 'tst-7',
    categoryId: 'testing',
    title: 'Contract Testing Between Microservices',
    difficulty: 'Hard',
    tags: ['Pact', 'Contract Testing', 'Microservices', 'CI'],
    scenario: 'Twelve services depend on the user service. A field rename in its API broke four consumers in production, despite a full end-to-end suite that passed because it had not been updated.',
    question: 'Explain consumer-driven contract testing, how it differs from end-to-end testing, and how it fits into deployment gating.',
    idealAnswer: `### Why end-to-end testing fails here
End-to-end suites across twelve services are slow, flaky, and require every service deployed together — which defeats the point of independent deployment. They also test **one path through the whole system**, so a consumer expectation nobody wrote a scenario for is simply invisible. And they are always out of date, because updating them is somebody else's job.

### Consumer-driven contract testing
Invert the direction. **Each consumer declares what it actually needs** from the provider — specific endpoints, fields, status codes — as an executable contract. That contract is published to a broker (e.g. Pact Broker).

* **Consumer side:** the test runs against a mock provider generated from the contract. It verifies the consumer works with exactly that response shape, and produces the pact file.
* **Provider side:** the provider replays **every consumer's** contract against a real running instance. If the rename breaks a field that any consumer depends on, the provider's own build fails — before deployment, in the team that made the change.

The critical property: the failure appears in the **provider's** pipeline, at the moment of the change, attributed to the person who made it.

### It tests the contract, not the behaviour
Contract tests verify the *interface shape and semantics*. They deliberately do **not** verify business correctness — that stays in the provider's own tests. This is why they can be fast and stable.

### Deployment gating
The broker's \`can-i-deploy\` check is the real payoff: before deploying provider version X to production, ask the broker whether X satisfies the contracts of every consumer version currently in production. If yes, deploy. If no, the deploy is blocked. This gives you **independent deployability with a safety net**, which end-to-end suites cannot.

### Practical notes
* Use **matchers** (type-based, regex) rather than exact values, or contracts become brittle to test data.
* Consumers must only declare fields they genuinely use — over-specifying makes the provider unable to evolve.
* Contract testing complements, it does not replace, a small set of critical-path E2E smoke tests.
* Works for messaging too: Pact supports async message contracts, which matter as much as HTTP in event-driven systems.
* Alternative tooling: Spring Cloud Contract, which generates provider tests and consumer stubs from a shared DSL.`,
    codeSnippet: `// Consumer declares only what it needs, with type matchers
@Pact(consumer = "billing-service", provider = "user-service")
RequestResponsePact userExists(PactDslWithProvider b) {
    return b.given("user 42 exists")
            .uponReceiving("a request for user 42")
            .path("/users/42").method("GET")
            .willRespondWith().status(200)
            .body(newJsonBody(o -> {
                o.numberType("id", 42);
                o.stringType("email", "a@b.com");   // type, not exact value
            }).build())
            .toPact();
}

// Before deploying: ask the broker
// pact-broker can-i-deploy --pacticipant user-service --version $SHA --to-environment production`,
    pitfalls: [
      'Letting consumers assert on fields they do not actually use, freezing the provider API.',
      'Using exact value matching instead of type matchers, causing false failures.',
      'Treating contract tests as a replacement for the provider\'s own behaviour tests.',
      'Publishing contracts but never wiring can-i-deploy into the pipeline, so nothing is actually gated.'
    ],
    followUpQuestions: [
      'How does can-i-deploy decide compatibility across many deployed versions?',
      'How do contract tests work for asynchronous messaging rather than HTTP?',
      'How do you handle a genuinely breaking change that all consumers must adopt?'
    ],
    faangFocus: 'Microservice-heavy organisations ask this to test whether you understand independent deployability. The gating story is the part most candidates miss.'
  },
  {
    id: 'tst-8',
    categoryId: 'testing',
    title: 'Writing Tests That Survive Refactoring',
    difficulty: 'Solid',
    tags: ['Test Design', 'AAA', 'Assertions', 'Maintainability'],
    scenario: 'A codebase has tests named `test1`, `testServiceMethod`, and `shouldWork`. Failures produce `expected: true but was: false`. A small refactor breaks 80 tests and nobody can tell what behaviour regressed.',
    question: 'Describe the practices that make a test suite an asset rather than a liability.',
    idealAnswer: `### Test names describe behaviour, not methods
A good name states the scenario and the expected outcome: \`rejectsOrderWhenInventoryIsInsufficient\`, not \`testPlaceOrder\`. When it fails, the name alone should tell you what broke. Naming a test after a *method* couples the suite to structure; naming it after *behaviour* survives refactoring.

### Arrange-Act-Assert, one behaviour per test
Three visible sections, one action. If a test has two acts, it is two tests. Tests with a single reason to fail localise regressions instantly.

### Assert on meaning, not booleans
\`assertTrue(result.isValid())\` produces "expected true but was false" — useless. AssertJ's fluent assertions produce a full diff of the object and the field that differed. \`assertThat(order).usingRecursiveComparison().isEqualTo(expected)\` beats twenty individual getters.

### Test through the public API
Testing private methods (via reflection or by widening visibility) hard-codes structure. Drive behaviour through the public surface; if something is hard to reach, that is a design signal, not a testing problem.

### Avoid shared mutable fixtures
\`@BeforeEach\` populating shared static state creates order dependence and mysterious cross-test failures. Prefer **test data builders** with sensible defaults and per-test overrides — they make the *relevant* difference explicit:
\`anOrder().withStatus(CANCELLED).build()\`. The reader sees exactly what matters to this test.

### No logic in tests
No loops, conditionals or calculations in a test — a bug in the test is invisible. If a test needs a loop, it probably wants parameterisation (\`@ParameterizedTest\` with \`@CsvSource\` or \`@MethodSource\`).

### Deterministic by construction
No wall-clock time, no random values without a fixed seed, no dependence on execution order, no reliance on network. Inject a \`Clock\`; seed the RNG and log the seed.

### Treat test code as production code
Same review standards, same refactoring, same duplication limits. A brittle test suite that everyone ignores is worse than no suite, because it costs CI time and produces false confidence.

### Delete tests
Tests that assert on obsolete behaviour, or duplicate coverage at a slower layer, should be removed. Suite size is not a virtue.`,
    codeSnippet: `@Test
void rejectsOrderWhenInventoryIsInsufficient() {
    // Arrange — builder makes the relevant detail obvious
    Order order = anOrder().withQuantity(5).build();
    inventory.setStock(order.sku(), 2);

    // Act
    Result result = service.place(order);

    // Assert — one behaviour, message-rich failure
    assertThat(result)
            .isInstanceOf(Rejected.class)
            .extracting("reason").isEqualTo(INSUFFICIENT_STOCK);
}

@ParameterizedTest
@CsvSource({"0,false", "1,true", "999,true", "1000,false"})
void validatesQuantityBounds(int qty, boolean valid) { ... }`,
    pitfalls: [
      'Naming tests after methods instead of behaviours.',
      'Using bare assertTrue/assertEquals where a fluent assertion would show the diff.',
      'Sharing mutable fixture state across tests, creating order dependence.',
      'Putting conditionals or loops inside tests.'
    ],
    followUpQuestions: [
      'When is testing a private method justified, if ever?',
      'How do test data builders reduce coupling compared with shared fixtures?',
      'How do you decide a test should be deleted rather than fixed?'
    ],
    faangFocus: 'Code-review rounds weight test quality heavily. "Tests should give you courage to refactor" is the framing interviewers remember.'
  },
  {
    id: 'tst-9',
    categoryId: 'testing',
    title: 'Testing in Production: Canaries, Flags and Observability',
    difficulty: 'Expert',
    tags: ['Canary', 'Feature Flags', 'Observability', 'Progressive Delivery'],
    scenario: 'A rewrite of the pricing engine must ship. It cannot be fully verified pre-production because the inputs are drawn from real, messy traffic that no test fixture reproduces faithfully.',
    question: 'Design a safe rollout. Explain shadow traffic, canary releases, feature flags and the observability required to make them meaningful.',
    idealAnswer: `### The premise
Some classes of correctness are only observable under real traffic: data distributions, pathological inputs, cache behaviour, downstream latency under real concurrency. Pre-production testing reduces risk; it cannot eliminate it. So the discipline is **making production changes reversible and observable**, not pretending they are risk-free.

### 1. Shadow / dark traffic
Run the new engine **in parallel** with the old one on real requests, but discard its output and serve the old result. Compare the two asynchronously and record divergences. This gives you full-traffic correctness data at **zero user risk**.

Requirements: the new path must be side-effect-free (no writes, no charges), and comparison must tolerate benign differences (timestamps, ordering). Sample if the cost is high.

### 2. Feature flags
Decouple **deploy** from **release**. Ship the code dark, then enable it for a percentage, a cohort, or specific tenants. The kill switch must be *instant* — a config change, not a redeploy.

Discipline: flags are debt. Every flag needs an owner and a removal date, or you accumulate an untestable combinatorial explosion of code paths.

### 3. Canary release
Route a small share of traffic (1% → 5% → 25% → 100%) to the new version, with **automated analysis** comparing canary metrics against the baseline: error rate, latency percentiles, saturation, and a business metric (here: price distribution, revenue per order). Automatic rollback on regression. Tools: Argo Rollouts, Flagger, Spinnaker.

The business metric matters most: a pricing bug that returns HTTP 200 with wrong prices is invisible to error-rate monitoring.

### 4. The observability that makes it work
Without this, all of the above is theatre.
* **SLIs and SLOs** defined up front, with an error budget that gates the rollout.
* **Structured logs** with a correlation id, and **distributed tracing** so a divergence can be traced to its cause.
* **Metrics with exemplars** linking a latency spike to a specific trace.
* **Divergence dashboards** for the shadow comparison, broken down by input class.

### 5. Blast-radius controls
* Roll out per-region, per-tenant, or per-cohort so a failure is bounded.
* Automated rollback with a clear trigger, not a human judgement call at 3am.
* **Practise the rollback** before you need it.

### The honest framing
"Testing in production" is not an excuse for skipping tests. It is an acknowledgement that the last mile of verification happens under real load, and that engineering effort should go into **fast detection and fast reversal** rather than into the fantasy of a perfect pre-production replica.`,
    codeSnippet: `// Shadow: serve old, compare new asynchronously, never fail the request
Price live = legacyEngine.price(req);

if (flags.isEnabled("pricing-v2-shadow", req.tenantId())) {
    shadowExecutor.execute(() -> {
        try {
            Price candidate = newEngine.price(req);
            if (!candidate.equals(live)) {
                divergences.increment(req.productType());
                log.info("divergence traceId={} old={} new={}", traceId(), live, candidate);
            }
        } catch (Exception e) {
            shadowErrors.increment();     // never propagates to the user
        }
    });
}
return live;`,
    pitfalls: [
      'Shadowing a code path that has side effects, causing real duplicate writes or charges.',
      'Canarying on error rate alone and missing silently wrong business output.',
      'Feature flags with no owner or expiry, creating untestable path explosion.',
      'A rollback procedure that has never been executed.'
    ],
    followUpQuestions: [
      'How do you handle shadow comparison when the new path is legitimately non-deterministic?',
      'What makes a good automated canary-analysis metric set?',
      'How do error budgets change the decision to continue or halt a rollout?'
    ],
    faangFocus: 'A staff-level question at any company with continuous delivery. Shadow traffic plus automated canary analysis plus a business-level SLI is the complete answer.'
  },
  {
    id: 'tst-10',
    categoryId: 'testing',
    title: 'Performance Testing and JMH Microbenchmarking',
    difficulty: 'Expert',
    tags: ['JMH', 'Benchmarking', 'Load Testing', 'JIT'],
    scenario: 'A developer benchmarks two implementations with `System.nanoTime()` around a loop and reports that the new one is 50x faster. In production the new version is slightly slower.',
    question: 'Explain why hand-rolled microbenchmarks are almost always wrong on the JVM, what JMH does about it, and how microbenchmarks relate to load testing.',
    idealAnswer: `### Why the hand-rolled benchmark lied
The JVM is an adaptive, optimising runtime. A naive loop measures the optimiser, not the code:

* **No warm-up.** The first thousands of invocations run interpreted, then C1, then C2. Steady-state performance can be 10-100x different from the first iteration.
* **Dead-code elimination.** If the result is not used, C2 proves the computation has no effect and **deletes it entirely**. That is where "50x faster" usually comes from — measuring nothing.
* **Constant folding.** Loop-invariant or compile-time-known inputs get folded away.
* **On-stack replacement and loop unrolling** change the shape of what you measured.
* **Profile pollution.** Running both implementations in one JVM makes the call site megamorphic, so neither gets the inlining it would get alone. This is why the *second* variant often looks worse — or better — purely by ordering.
* **GC and JIT background threads**, safepoint bias, and CPU frequency scaling add noise the naive loop attributes to the code.

### What JMH does
* **Forked JVMs** per benchmark, so profiles do not pollute each other, plus multiple forks to measure JVM-to-JVM variance.
* **Warm-up iterations** to reach steady state before measuring.
* **Blackhole** consumption of results, defeating dead-code elimination, and \`@State\` objects so inputs are not constant-folded.
* **\`@CompilerControl\`** and \`-prof perfasm\`/\`-prof gc\` to inspect what actually got compiled and allocated.
* Statistically meaningful output with confidence intervals rather than a single number.

Even with JMH, the golden rule stands: a microbenchmark measures a method **in isolation**, which is not how it runs in your application.

### Microbenchmark vs load test
They answer different questions and neither substitutes for the other.
* **JMH** — is this data structure or algorithm faster, in nanoseconds, in isolation? Use it to choose between implementations.
* **Load test (Gatling, k6, JMeter)** — does the *system* meet its latency SLO at target throughput, with real GC behaviour, real connection pools, real caches and real downstream dependencies? Use it to answer capacity and SLO questions.

A method 50% faster in JMH may be invisible in a system where 95% of latency is a database round trip. **Profile the system first** (async-profiler, JFR) to find where time actually goes; only microbenchmark what the profile says matters.

### Load-testing discipline
Model realistic arrival patterns (open-model, not closed-loop, or you hide coordinated omission), warm the system, run long enough for GC to reach steady state, and report **percentiles** — p50, p99, p99.9 — never averages.`,
    codeSnippet: `@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(value = 3)                       // separate JVMs: no profile pollution
@State(Scope.Benchmark)
public class ParseBenchmark {

    private String input;               // @State: not constant-folded

    @Setup public void setup() { input = generateRealisticInput(); }

    @Benchmark
    public void newParser(Blackhole bh) {
        bh.consume(NewParser.parse(input));   // Blackhole: not eliminated
    }
}`,
    pitfalls: [
      'Benchmarking without warm-up or without consuming the result.',
      'Running competing implementations in the same JVM and polluting inlining decisions.',
      'Reporting averages instead of percentiles in load tests.',
      'Optimising something a system-level profile never pointed at.'
    ],
    followUpQuestions: [
      'What is coordinated omission and how does it distort load-test results?',
      'How does @Fork protect against profile pollution specifically?',
      'When would you use async-profiler rather than JMH to answer a performance question?'
    ],
    faangFocus: 'Performance-engineering rounds. Dead-code elimination and profile pollution are the two effects interviewers most want to hear named.'
  },
];
