import type { Question } from '../../types';

/**
 * Testing & code quality, part two: JUnit and Mockito fundamentals up to
 * load testing, fuzzing and deterministic simulation.
 */
export const TESTING_MORE_QUESTIONS: Question[] = [
  {
    id: 'tst-11',
    categoryId: 'testing',
    title: 'JUnit 5 Essentials',
    difficulty: 'Core',
    tags: ['JUnit 5', 'Lifecycle', 'Assertions', 'Basics'],
    scenario: "A team is migrating from JUnit 4 and asks what changed and which JUnit 5 features they should use.",
    question: "Explain the JUnit 5 architecture, lifecycle annotations and the most useful features.",
    idealAnswer: `### Architecture
JUnit 5 = **Platform** (launching tests, used by IDEs and build tools) + **Jupiter** (the new programming model) + **Vintage** (runs JUnit 3/4 tests during migration).

### Lifecycle
* \`@BeforeAll\` / \`@AfterAll\`: once per class (static by default).
* \`@BeforeEach\` / \`@AfterEach\`: around every test.
* A **new test instance per test method** by default, so fields don't leak state between tests. \`@TestInstance(PER_CLASS)\` changes that.

### Useful features
* \`@DisplayName\` and \`@Nested\` classes to structure tests by scenario.
* \`assertAll\` to report several failures at once; \`assertThrows\` returns the exception for further checks; \`assertTimeout\`.
* \`@ParameterizedTest\` with \`@ValueSource\`, \`@CsvSource\`, \`@MethodSource\`.
* \`@Tag\` to split fast and slow suites; \`@Disabled\` with a reason.
* \`@TempDir\` for temporary files.
* **Extensions** (\`@ExtendWith\`) replace JUnit 4 runners and rules: Mockito, Spring, Testcontainers all integrate this way, and several can be combined.

### Migration notes
\`org.junit.Test\` → \`org.junit.jupiter.api.Test\`; \`@Before\` → \`@BeforeEach\`; \`expected=\` → \`assertThrows\`; test classes and methods no longer need to be public.`,
    pitfalls: [
      "Sharing mutable state via static fields between tests.",
      "Mixing JUnit 4 and 5 annotations in one class.",
      "Using assertTrue(a.equals(b)) instead of assertEquals, losing failure messages.",
    ],
    followUpQuestions: [
      "How do JUnit 5 extensions work?",
      "When would you use PER_CLASS lifecycle?",
    ],
    faangFocus: "Baseline testing literacy.",
  },
  {
    id: 'tst-12',
    categoryId: 'testing',
    title: 'Parameterized Tests',
    difficulty: 'Core',
    tags: ['Parameterized Tests', 'JUnit 5', 'Test Design'],
    scenario: "A tax calculator has 14 nearly identical test methods that differ only in input amount, country and expected tax.",
    question: "How would you consolidate them, and what are the parameter source options?",
    idealAnswer: `### @ParameterizedTest
One test method, many inputs, each reported as a separate test case.

\`\`\`java
@ParameterizedTest(name = "{0} in {1} -> {2}")
@CsvSource({
    "100.00, DE, 19.00",
    "100.00, FR, 20.00",
    "0.00,   DE, 0.00",
})
void calculatesVat(BigDecimal amount, String country, BigDecimal expected) {
    assertThat(calculator.vat(amount, country)).isEqualByComparingTo(expected);
}
\`\`\`

### Sources
* \`@ValueSource\`: a single argument of simple types.
* \`@CsvSource\` / \`@CsvFileSource\`: tabular data, readable for business rules.
* \`@EnumSource\`: every (or selected) enum constant, great to ensure all cases are handled.
* \`@MethodSource\`: a static factory returning a \`Stream<Arguments>\`, for complex objects.
* \`@NullSource\`, \`@EmptySource\`, \`@NullAndEmptySource\` for edge cases.
* Custom \`ArgumentsProvider\`s.

### Good practice
* Use the \`name\` attribute so failures say exactly which case broke.
* Don't parameterise tests with different **behaviour** paths; separate tests are clearer.
* Combine with boundary values: 0, negative, max, just below/above thresholds.`,
    pitfalls: [
      "Copy-pasted tests that drift apart.",
      "Unreadable parameter tables with dozens of columns.",
      "Parameterising unrelated scenarios into one test.",
    ],
    followUpQuestions: [
      "How do you test every enum value is handled?",
      "How would you generate random inputs instead (property-based testing)?",
    ],
    faangFocus: "Simple but reveals test-code quality habits.",
  },
  {
    id: 'tst-13',
    categoryId: 'testing',
    title: 'Structuring Tests: Arrange-Act-Assert and Naming',
    difficulty: 'Core',
    tags: ['AAA', 'Given-When-Then', 'Test Naming', 'Readability'],
    scenario: "A failing test called `test3()` has 60 lines mixing setup, multiple calls and assertions. Nobody can tell what behaviour it was protecting.",
    question: "How should a good unit test be structured and named?",
    idealAnswer: `### Arrange, Act, Assert (Given, When, Then)
1. **Arrange**: set up only what this scenario needs.
2. **Act**: perform **one** action, the behaviour under test.
3. **Assert**: check the outcome (return value, state change, or interaction).
Separate the sections visually. If you need several acts, you probably have several tests.

### Naming
The name should state the **behaviour and expectation**, so a failure reads like a bug report:
* \`rejectsTransferWhenBalanceIsInsufficient\`
* \`appliesFreeShippingForOrdersAbove50Euros\`
* Or \`@DisplayName("rejects transfer when balance is insufficient")\`, with \`@Nested\` classes for context ('given a frozen account').

### Other qualities (FIRST)
**F**ast, **I**ndependent (no ordering dependencies), **R**epeatable (no reliance on time, network or random data without control), **S**elf-validating (pass/fail, no manual log reading), **T**imely.

### Keep setup readable
Test data builders or factory methods with meaningful defaults, so each test only states what matters for its case.`,
    codeSnippet: `@Test
void rejectsTransferWhenBalanceIsInsufficient() {
    // given
    Account from = anAccount().withBalance("50.00").build();
    Account to = anAccount().build();

    // when
    Throwable thrown = catchThrowable(() -> service.transfer(from, to, new BigDecimal("80.00")));

    // then
    assertThat(thrown).isInstanceOf(InsufficientFundsException.class);
    assertThat(from.balance()).isEqualByComparingTo("50.00");
}`,
    pitfalls: [
      "Multiple unrelated behaviours in one test.",
      "Names like test1 or testTransfer.",
      "Assertions buried in helper methods that hide intent.",
    ],
    followUpQuestions: [
      "When is more than one assertion acceptable?",
      "How do test data builders help readability?",
    ],
    faangFocus: "Code-quality question often asked alongside a live test-writing exercise.",
  },
  {
    id: 'tst-14',
    categoryId: 'testing',
    title: 'Test Doubles: Dummies, Stubs, Fakes, Spies and Mocks',
    difficulty: 'Core',
    tags: ['Test Doubles', 'Mocks', 'Stubs', 'Fakes'],
    scenario: "A developer calls every test double a 'mock' and verifies every interaction, making tests break on each refactor.",
    question: "Explain the different kinds of test doubles and when to use each.",
    idealAnswer: `### The vocabulary (from Gerard Meszaros)
* **Dummy**: passed only to satisfy a parameter; never used.
* **Stub**: returns canned answers to calls. Used to drive the code under test down a path ('the rate service returns 1.1').
* **Fake**: a working, simplified implementation, e.g. an in-memory repository or fake clock. Behaves realistically.
* **Spy**: records how it was called, possibly wrapping a real object, for later checks.
* **Mock**: pre-programmed with **expectations** about calls; the test fails if interactions don't match.

### When to use which
* **Stubs and fakes** for **queries** (things that return data). Assert on the outcome, not on the fact that the query happened.
* **Mocks/verification** for **commands** that are the observable effect at the boundary (an email was sent, a message published, a payment requested).
* **Fakes** for complex collaborators you use in many tests (in-memory repositories), often shared across the suite.
* Prefer **real objects** for value objects and simple in-process collaborators.

### Why over-mocking hurts
Verifying internal interactions couples tests to implementation, so refactoring breaks tests without changing behaviour. Tests become a mirror of the code instead of a specification of behaviour.`,
    pitfalls: [
      "Verifying calls to query methods.",
      "Mocking value objects and simple data classes.",
      "Mocking types you don't own instead of wrapping them.",
    ],
    followUpQuestions: [
      "Why 'don't mock what you don't own'?",
      "When would you write a fake rather than use Mockito?",
    ],
    faangFocus: "Checks conceptual clarity that leads to maintainable tests.",
  },
  {
    id: 'tst-15',
    categoryId: 'testing',
    title: 'Fluent Assertions With AssertJ',
    difficulty: 'Core',
    tags: ['AssertJ', 'Assertions', 'Readability', 'Exceptions'],
    scenario: "A test fails with 'expected: true but was: false' from `assertTrue(result.contains(order))`, which tells the developer nothing.",
    question: "How do fluent assertions improve tests, and which AssertJ features are most useful?",
    idealAnswer: `### Better failure messages
\`assertThat(result).contains(order)\` fails with the actual collection contents and the missing element, so you can often diagnose without a debugger.

### Useful features
* Collections: \`containsExactly\`, \`containsExactlyInAnyOrder\`, \`hasSize\`, \`allSatisfy\`, \`extracting(Order::id).containsOnly(1L, 2L)\`, \`filteredOn\`.
* Objects: \`usingRecursiveComparison().ignoringFields("createdAt").isEqualTo(expected)\` for deep comparisons.
* Numbers: \`isEqualByComparingTo\` for BigDecimal (scale-insensitive), \`isCloseTo(x, within(0.01))\` for doubles.
* Exceptions: \`assertThatThrownBy(() -> ...).isInstanceOf(X.class).hasMessageContaining("limit")\`, or \`catchThrowable\`.
* Optionals: \`assertThat(opt).hasValue(x)\` / \`isEmpty()\`.
* \`SoftAssertions\` to collect multiple failures.
* \`as("description")\` to add context.

### Example
\`\`\`java
assertThat(orders)
    .extracting(Order::status, Order::total)
    .containsExactlyInAnyOrder(
        tuple(PAID, new BigDecimal("20.00")),
        tuple(OPEN, new BigDecimal("5.00")));
\`\`\`

### Pitfall to avoid
AssertJ assertions do nothing unless you call an assertion method: \`assertThat(x);\` alone passes silently (static analysis can flag it).`,
    pitfalls: [
      "assertTrue with boolean expressions.",
      "Comparing BigDecimal with isEqualTo and failing on scale.",
      "Dangling assertThat without a check.",
    ],
    followUpQuestions: [
      "How does recursive comparison handle collections?",
      "When are soft assertions a good idea?",
    ],
    faangFocus: "Practical quality-of-life knowledge that shows in live coding.",
  },
  {
    id: 'tst-16',
    categoryId: 'testing',
    title: 'Code Coverage: What It Tells You and What It Doesn\'t',
    difficulty: 'Solid',
    tags: ['Code Coverage', 'JaCoCo', 'Quality Gates', 'Metrics'],
    scenario: "Management mandates 90% line coverage. Soon the codebase has tests that call methods without asserting anything, and bugs still slip through.",
    question: "How should coverage be used, and what are its limits?",
    idealAnswer: `### Types of coverage
* **Line/statement**: which lines executed.
* **Branch**: whether each branch of every condition was taken. More meaningful than lines.
* **Path/condition** coverage: rarely measured, but shows how many combinations exist.
Tools: JaCoCo in Java, integrated with Sonar and CI.

### What it tells you
Low coverage reliably shows **untested** code. It's a good tool for finding gaps: 'the error handling of this payment path never runs in tests'.

### What it doesn't
High coverage **doesn't mean the code is tested**: executing a line isn't asserting its behaviour. Tests without assertions produce 100% coverage and catch nothing. Targets create incentives to game the number (Goodhart's law).

### Better practice
* Use coverage **diffs** on pull requests (new code should be tested) rather than a global number.
* Review **what** is uncovered, especially critical paths.
* Use **mutation testing** (PIT) to measure whether tests actually detect changes in behaviour.
* Exclude generated code and trivial accessors from reports to keep the signal clean.`,
    pitfalls: [
      "Coverage targets as the definition of quality.",
      "Assertion-free tests written to hit a number.",
      "Ignoring branch coverage.",
    ],
    followUpQuestions: [
      "How does mutation testing complement coverage?",
      "What coverage would you expect for a payments module vs a UI adapter?",
    ],
    faangFocus: "A judgement question about metrics and incentives.",
  },
  {
    id: 'tst-17',
    categoryId: 'testing',
    title: 'Test-Driven Development in Practice',
    difficulty: 'Solid',
    tags: ['TDD', 'Red-Green-Refactor', 'Design'],
    scenario: "An interviewer asks: 'Do you practise TDD? When does it help and when doesn't it?'",
    question: "Explain the TDD cycle, its benefits, and a balanced view of when to use it.",
    idealAnswer: `### The cycle
1. **Red**: write a small failing test describing the next bit of behaviour.
2. **Green**: write the simplest code that makes it pass.
3. **Refactor**: clean up code and tests while everything stays green.
Repeat in small steps (minutes, not hours).

### Benefits
* Forces you to think about the **API from the caller's side** first, which tends to produce smaller, decoupled units.
* Builds a regression suite as a by-product.
* Small steps keep you close to working code; debugging sessions shrink.
* Refactoring is safe because behaviour is pinned.

### Where it shines
Business rules, algorithms, parsers, bug fixes (write the failing test that reproduces the bug first), and code with clear inputs and outputs.

### Where it's harder
Exploratory spikes where the design is unknown (spike, then throw away and TDD the real thing), UI layout, and thin integration glue where integration tests give more value.

### Variants
Outside-in ('London school', mock collaborators while designing roles) vs inside-out ('Chicago/classic', real collaborators, state-based assertions). Knowing both and when you'd use them is the senior answer.`,
    pitfalls: [
      "Writing large tests and large code steps, losing the feedback loop.",
      "Skipping the refactor step.",
      "Dogmatism in either direction.",
    ],
    followUpQuestions: [
      "How do you TDD a bug fix?",
      "What's the difference between London and Chicago schools?",
    ],
    faangFocus: "Common behavioural-technical question; nuance scores better than dogma.",
  },
  {
    id: 'tst-18',
    categoryId: 'testing',
    title: 'Boundary Values and Edge Cases',
    difficulty: 'Core',
    tags: ['Boundary Value Analysis', 'Edge Cases', 'Equivalence Partitioning'],
    scenario: "A discount applies to orders 'over 100'. Tests use 50 and 500. In production, orders of exactly 100.00 get the discount, which the business says is wrong.",
    question: "How do you choose test inputs systematically?",
    idealAnswer: `### Equivalence partitioning
Group inputs that should behave the same: 'below threshold', 'above threshold'. One test per partition covers the logic in principle. 50 and 500 did that.

### Boundary value analysis
Bugs cluster at the **edges** of partitions (off-by-one, \`>\` vs \`>=\`). Test **at**, **just below**, and **just above** each boundary: 99.99, 100.00, 100.01. That would have caught the bug.

### Classic edge cases to consider
* Empty, single-element and very large collections.
* Null, blank and whitespace strings; Unicode and very long input.
* Zero, negative, max/min values, overflow.
* Money: rounding, scale, currencies with 0 or 3 decimal places.
* Time: midnight, month ends, leap years, DST transitions, time zones.
* Concurrency: two requests at once, retries, duplicates.
* Failure of every dependency.

### Clarify requirements
'Over 100' is ambiguous. Writing boundary tests forces the conversation with the business before shipping.`,
    pitfalls: [
      "Only testing 'typical' values.",
      "Ambiguous requirements left unclarified.",
      "Ignoring time-zone and DST edges.",
    ],
    followUpQuestions: [
      "How could property-based testing find boundaries automatically?",
      "Which edge cases matter most for date handling?",
    ],
    faangFocus: "A testing fundamentals question that reveals rigour.",
  },
  {
    id: 'tst-19',
    categoryId: 'testing',
    title: 'Testing Time-Dependent Code',
    difficulty: 'Solid',
    tags: ['Clock', 'Time', 'Determinism', 'java.time'],
    scenario: "Tests for subscription expiry pass during the day but fail when CI runs at midnight UTC, and a test for 'expires in 30 days' breaks around month boundaries.",
    question: "How do you make time-dependent code testable and deterministic?",
    idealAnswer: `### Don't call now() directly
\`LocalDate.now()\` and \`Instant.now()\` read the system clock, making tests depend on when they run. Inject a **\`java.time.Clock\`** and use \`LocalDate.now(clock)\`.

\`\`\`java
class SubscriptionService {
    private final Clock clock;
    SubscriptionService(Clock clock) { this.clock = clock; }

    boolean isExpired(Subscription s) {
        return s.expiresAt().isBefore(Instant.now(clock));
    }
}

// Production: Clock.systemUTC() as a Spring bean
// Test:
Clock fixed = Clock.fixed(Instant.parse("2025-03-30T23:59:59Z"), ZoneOffset.UTC);
\`\`\`

### Test the tricky moments explicitly
End of month, Feb 29, DST switch (\`Europe/Berlin\` on the last Sunday in March), New Year, and time zones where the local date differs from the UTC date.

### Moving time forward
A mutable test clock (or \`Clock.offset\`) lets you simulate '30 days later' without sleeping. For scheduled and async code, use a controllable scheduler rather than real delays.

### Define semantics clearly
'30 days' vs 'one month' (\`plusDays(30)\` vs \`plusMonths(1)\`) are different; tests make the rule explicit.`,
    pitfalls: [
      "Direct calls to now() in business logic.",
      "Tests that sleep to wait for time to pass.",
      "Ignoring time zones in date comparisons.",
    ],
    followUpQuestions: [
      "How do you inject a Clock into a Spring application?",
      "How would you test a job scheduled for 02:30 on a DST day?",
    ],
    faangFocus: "A practical testability question with clear right answers.",
  },
  {
    id: 'tst-20',
    categoryId: 'testing',
    title: 'Testing REST Controllers',
    difficulty: 'Solid',
    tags: ['MockMvc', 'WebTestClient', '@WebMvcTest', 'REST Assured'],
    scenario: "Controller tests call controller methods directly as plain Java. They pass, yet production returns 415 errors because of a content-type mapping bug and validation isn't applied.",
    question: "How should REST controllers be tested in Spring, and at which levels?",
    idealAnswer: `### Why direct calls miss bugs
Calling the method bypasses the whole MVC pipeline: request mapping, content negotiation, JSON (de)serialisation, validation, exception handlers and security filters. Those are where many bugs live.

### Slice tests with MockMvc
\`@WebMvcTest(OrderController.class)\` starts only the web layer, with services mocked (\`@MockitoBean\`). Requests go through the real \`DispatcherServlet\`:
\`\`\`java
mockMvc.perform(post("/orders")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
                {"sku": "A1", "quantity": 0}
                """))
    .andExpect(status().isBadRequest())
    .andExpect(jsonPath("$.errors[0].field").value("quantity"));
\`\`\`
Test: status codes, JSON shape, validation errors, error mapping, and security rules (\`@WithMockUser\`). Fast because no server or database.

### Full-stack tests
\`@SpringBootTest(webEnvironment = RANDOM_PORT)\` with \`WebTestClient\`, \`RestClient\` or REST Assured against a real server, plus Testcontainers for the database: fewer tests, covering critical flows end to end.

### Spring 6.2+
\`MockMvcTester\` offers AssertJ-style assertions for MockMvc.

### Balance
Many slice tests for HTTP concerns, a few end-to-end tests per critical journey, and business logic tested in plain unit tests.`,
    pitfalls: [
      "Testing controllers by calling methods directly.",
      "Only full @SpringBootTest tests, making the suite slow.",
      "Not asserting on error responses.",
    ],
    followUpQuestions: [
      "How do you test security rules on endpoints?",
      "What's the difference between MockMvc and a real HTTP server test?",
    ],
    faangFocus: "Standard Spring testing question.",
  },
  {
    id: 'tst-21',
    categoryId: 'testing',
    title: 'Repository Tests That Lie: @DataJpaTest Pitfalls',
    difficulty: 'Hard',
    tags: ['@DataJpaTest', 'Testcontainers', 'Transactions', 'JPA'],
    scenario: "Repository tests pass, but in production a constraint violation and a lazy-loading exception occur in the same code paths. The tests use H2 and `@DataJpaTest`.",
    question: "Why can these tests give false confidence, and how do you make them trustworthy?",
    idealAnswer: `### Problem 1: H2 is not your database
H2 differs from PostgreSQL/MySQL in SQL dialect, constraint behaviour, locking, JSON types, sequences and case sensitivity. Native queries and DDL behave differently. Use **Testcontainers** with the real database version (\`@AutoConfigureTestDatabase(replace = NONE)\` plus a container), ideally with the same migration scripts (Flyway/Liquibase).

### Problem 2: tests roll back and never flush
\`@DataJpaTest\` wraps each test in a transaction that **rolls back**. If you \`save()\` and then \`find()\`, Hibernate returns the entity from the **first-level cache**: no SQL was executed, so constraints, column mappings and triggers are never exercised.
Fix: call \`flush()\` after writes and \`clear()\` the persistence context before reading, or use \`TestEntityManager.persistFlushFind\`.

### Problem 3: the transaction hides lazy loading issues
Inside the test transaction, lazy associations load fine. In production, the transaction ended before the code touched them. Test such flows at the service level without a surrounding test transaction, or assert that the fetch plan loads what's needed.

### Worth testing at this level
Custom queries (JPQL/native), mappings, constraints, locking behaviour, and migrations. Don't test Spring Data's generated CRUD methods.`,
    pitfalls: [
      "H2 as a stand-in for production databases.",
      "save-then-find without flush/clear.",
      "Test transactions masking LazyInitializationException.",
    ],
    followUpQuestions: [
      "How do you speed up Testcontainers-based suites?",
      "How would you test optimistic locking conflicts?",
    ],
    faangFocus: "Shows real experience with the gap between tests and production.",
  },
  {
    id: 'tst-22',
    categoryId: 'testing',
    title: 'Diagnosing and Fixing Flaky Tests',
    difficulty: 'Hard',
    tags: ['Flaky Tests', 'CI', 'Determinism', 'Test Isolation'],
    scenario: "Around 5% of CI runs fail on random tests. Engineers hit 'retry' until green, and trust in the pipeline is collapsing.",
    question: "What causes flaky tests and how would you tackle them systematically?",
    idealAnswer: `### Common causes
* **Timing**: \`Thread.sleep\` waits for async work; fixed timeouts on slow CI machines.
* **Order dependence**: shared static state, database rows left behind, singletons caching data between tests.
* **Time and randomness**: \`now()\`, unseeded random data, time zones and locale of CI agents.
* **Concurrency**: races in the code under test (sometimes real bugs!).
* **External dependencies**: network calls, shared test environments, ports in use.
* **Unordered collections**: asserting on \`HashMap\`/\`HashSet\` iteration order.
* Resource exhaustion in parallel runs.

### Systematic approach
1. **Measure**: track flakiness per test (CI analytics, Gradle/Develocity flaky test detection).
2. **Quarantine**: move known flaky tests out of the blocking suite with a ticket and owner, so the pipeline is trusted again. Don't let quarantine become a graveyard.
3. **Reproduce**: run the test in a loop, with random ordering, under CPU stress, in parallel.
4. **Fix the root cause**: Awaitility instead of sleeps, fresh data per test, injected Clock, Testcontainers instead of shared environments, order-independent assertions.
5. **Prevent**: lint for sleeps, randomise test order in CI, and treat new flakiness as a bug.

### Never
Auto-retry everything silently: it hides real race conditions that will also flake in production.`,
    pitfalls: [
      "Blind retries.",
      "Shared mutable state between tests.",
      "Sleeping to wait for async processing.",
    ],
    followUpQuestions: [
      "How do you detect order-dependent tests?",
      "When is a flaky test actually revealing a production bug?",
    ],
    faangFocus: "An engineering-culture question that separates seniors from juniors.",
  },
  {
    id: 'tst-23',
    categoryId: 'testing',
    title: 'Test Data Builders and Object Mothers',
    difficulty: 'Solid',
    tags: ['Test Data', 'Builders', 'Object Mother', 'Readability'],
    scenario: "Every test constructs `Order` objects with 15 constructor arguments. Adding a new mandatory field breaks 300 tests.",
    question: "How do you manage test data so tests stay readable and resilient to change?",
    idealAnswer: `### Object Mother
Factory methods returning ready-made objects: \`Orders.paidOrder()\`, \`Customers.vipCustomer()\`. Simple, but variations multiply into many methods ('paidOrderWithTwoLinesInEuro').

### Test Data Builder
A builder with **sensible defaults** for every field; tests override only what matters:
\`\`\`java
Order order = anOrder()
        .withStatus(PAID)
        .withLine(aLine().withPrice("20.00"))
        .build();
\`\`\`
When a new mandatory field is added, only the builder's defaults change, not 300 tests.

### Combining them
Mothers can return pre-configured builders (\`Orders.paid()\` returns a builder you can tweak).

### Principles
* A test should show **only the data relevant to its assertion**; defaults hide the rest.
* Defaults must be **valid** and realistic.
* Avoid random data in defaults unless seeded and reported (it causes flakiness).
* For database tests, create data per test through the same builders instead of a huge shared fixture file.

### Libraries
Instancio or EasyRandom can populate objects automatically, useful for fields you don't care about, but keep meaningful values explicit.`,
    pitfalls: [
      "Giant shared fixtures that every test depends on.",
      "Constructors called directly in hundreds of tests.",
      "Invalid default values that pass by accident.",
    ],
    followUpQuestions: [
      "How would you generate builders automatically?",
      "How do you keep builders in sync with validation rules?",
    ],
    faangFocus: "Test maintainability question for mid-to-senior engineers.",
  },
  {
    id: 'tst-24',
    categoryId: 'testing',
    title: 'Testing Kafka Producers and Consumers',
    difficulty: 'Hard',
    tags: ['Kafka', 'Testcontainers', 'Integration Testing', 'Idempotency'],
    scenario: "A service consumes `OrderPlaced` events and publishes `InvoiceCreated`. It has no tests around the Kafka integration, and a serializer misconfiguration once reached production.",
    question: "How would you test the messaging integration?",
    idealAnswer: `### Layers
* **Unit**: the handler logic as plain Java: given an event, what should happen? No Kafka involved.
* **Serialization**: round-trip tests for event schemas (and schema-registry compatibility checks in CI).
* **Integration**: a real broker via **Testcontainers** (\`KafkaContainer\`, or Redpanda for speed), or Spring's \`@EmbeddedKafka\`. Publish an \`OrderPlaced\` to the input topic, then consume from the output topic and assert an \`InvoiceCreated\` appears, using **Awaitility** rather than sleeps.

### What to cover in integration tests
* Serializer/deserializer configuration and headers.
* Error handling: a poison message goes to the **DLT** and consumption continues.
* **Idempotency**: deliver the same event twice and assert only one invoice.
* Transactional behaviour: if the DB write fails, no output event is published (outbox tests).
* Consumer group config such as auto-offset-reset for new groups.

### Practical tips
* Unique topic names or consumer groups per test to avoid cross-test interference.
* Reuse one container for the whole test suite (singleton container pattern) to keep speed acceptable.
* Contract tests between producer and consumer teams for event shape.`,
    pitfalls: [
      "Only unit-testing handlers and never the wiring.",
      "Thread.sleep while waiting for messages.",
      "Tests sharing topics and reading each other's messages.",
    ],
    followUpQuestions: [
      "How would you test ordering guarantees per key?",
      "Embedded Kafka vs Testcontainers: trade-offs?",
    ],
    faangFocus: "Common in event-driven teams; idempotency and DLT tests show maturity.",
  },
  {
    id: 'tst-25',
    categoryId: 'testing',
    title: 'Stubbing External HTTP APIs With WireMock',
    difficulty: 'Solid',
    tags: ['WireMock', 'HTTP', 'Integration Testing', 'Fault Injection'],
    scenario: "A service integrates with a payment provider. Tests either mock the Java client (missing HTTP-level bugs) or call the provider's sandbox (slow and flaky).",
    question: "How does WireMock help, and what scenarios should you test?",
    idealAnswer: `### What WireMock does
Runs a real **HTTP server** in tests that returns programmed responses. Your real HTTP client, serialisation, headers, timeouts and error handling are exercised without the real provider.

### Scenarios worth testing
* Happy path: request body, headers (auth, idempotency key) are what the provider expects: \`verify(postRequestedFor(...).withHeader("Idempotency-Key", matching(".+")))\`.
* **Error codes**: 400 (map to domain error), 409, 429 with \`Retry-After\`, 500/503 (retries?).
* **Slow responses**: \`withFixedDelay(5000)\` to verify your **timeouts** fire.
* **Faults**: connection reset, malformed JSON, empty body.
* Retries: stateful scenarios (fail twice, then succeed) to test retry logic.

### Keeping stubs honest
Stubs can drift from the real API. Mitigate with contract tests, recorded responses refreshed periodically, and a small number of tests against the provider's sandbox outside the main pipeline.

### Integration
\`@WireMockTest\` JUnit extension or Spring Cloud Contract WireMock; point the client's base URL at WireMock via test properties.`,
    codeSnippet: `@WireMockTest(httpPort = 8089)
class PaymentClientTest {
    @Test
    void timesOutOnSlowProvider() {
        stubFor(post("/charges").willReturn(ok().withFixedDelay(3_000)));
        assertThatThrownBy(() -> client.charge(request))
                .isInstanceOf(PaymentTimeoutException.class);
    }
}`,
    pitfalls: [
      "Mocking the HTTP client class instead of the HTTP interaction.",
      "Testing only the happy path.",
      "Stubs drifting from the real API without detection.",
    ],
    followUpQuestions: [
      "How would you keep WireMock stubs in sync with the provider?",
      "How do you test a circuit breaker opening?",
    ],
    faangFocus: "Practical integration testing of the failure modes that matter.",
  },
  {
    id: 'tst-26',
    categoryId: 'testing',
    title: 'Mocking Static Methods and Final Classes: A Design Smell?',
    difficulty: 'Solid',
    tags: ['Mockito', 'Static Methods', 'Testability', 'Design'],
    scenario: "A developer uses `Mockito.mockStatic(LocalDateTime.class)` and `mockStatic(UUID.class)` in dozens of tests to control time and IDs.",
    question: "Mockito can mock statics and finals now. Should you?",
    idealAnswer: `### What's possible
Since Mockito 3.4/5 (inline mock maker is the default in Mockito 5), you can mock **final classes** and **static methods** (\`mockStatic\` in a try-with-resources scope).

### Why it's usually a smell
The need arises because code reaches out to **global, hard-wired dependencies** (clock, random, static utility calls to I/O). Mocking statics:
* couples tests to implementation details (which static method is called);
* is thread-scoped and easy to leak or misuse;
* hides a design where dependencies aren't explicit.

### Better designs
* Time: inject a \`Clock\`.
* IDs and randomness: inject an \`IdGenerator\` / \`Supplier<UUID>\`.
* Static I/O helpers: wrap them in an interface injected where needed.
* Pure static functions (math, formatting): don't mock at all; use the real thing.

### When mocking statics is acceptable
Characterisation tests for **legacy code** you can't refactor yet, and third-party code you can't change, as a temporary step toward a seam.

### Finals
Mocking final classes you **don't own** is still risky; prefer wrapping them. For your own classes, final is fine to mock with the inline mock maker, but ask whether a real instance would do.`,
    pitfalls: [
      "mockStatic for time or UUIDs everywhere.",
      "Leaking static mocks outside their scope.",
      "Mocking pure functions.",
    ],
    followUpQuestions: [
      "How does the inline mock maker work?",
      "What is a seam in legacy code?",
    ],
    faangFocus: "A design-oriented testing question.",
  },
  {
    id: 'tst-27',
    categoryId: 'testing',
    title: 'Snapshot and Approval Testing',
    difficulty: 'Solid',
    tags: ['Approval Testing', 'Snapshot Testing', 'Golden Master'],
    scenario: "A report generator produces 300-line JSON documents. Tests assert on a handful of fields, and regressions in other fields keep slipping through.",
    question: "What is approval (snapshot) testing and when is it appropriate?",
    idealAnswer: `### The technique
Run the code, serialise the output (JSON, text, HTML) and compare it to a stored, **human-approved** version ('golden master'). If it differs, the test fails and shows a diff; a developer either fixes the bug or **approves** the new output as the new baseline. Libraries: ApprovalTests.Java, JSON snapshot libraries, or a simple custom helper.

### When it fits
* Large, complex outputs where writing individual assertions is impractical: reports, API responses, generated code, templates.
* **Characterisation tests** for legacy code: capture current behaviour before refactoring.
* Regression protection for serialisation formats.

### Pitfalls and how to handle them
* **Non-deterministic fields** (timestamps, UUIDs, map ordering) cause constant failures. Use a fixed \`Clock\`, deterministic IDs, sorted keys, or scrubbers that mask them.
* **Rubber-stamp approvals**: people approve diffs without reading them. Keep snapshots small and focused, and review snapshot changes in PRs like code.
* Snapshots can over-specify: a harmless formatting change fails many tests.

### Combine with targeted assertions
Keep explicit assertions for the important business rules, and use snapshots as a broad safety net.`,
    pitfalls: [
      "Approving diffs without reviewing them.",
      "Non-deterministic data in snapshots.",
      "Huge snapshots nobody can read.",
    ],
    followUpQuestions: [
      "How would you use approval tests to refactor a legacy method safely?",
      "How do you scrub timestamps in snapshots?",
    ],
    faangFocus: "A useful technique that shows breadth beyond unit tests.",
  },
  {
    id: 'tst-28',
    categoryId: 'testing',
    title: 'Testing Authorization Rules',
    difficulty: 'Hard',
    tags: ['Security Testing', 'Spring Security', 'Authorization', 'IDOR'],
    scenario: "A pen test finds that users can read other customers' invoices by changing the ID in the URL. The team had tests for 'user can read invoice', but none for the opposite.",
    question: "How should authorization be tested?",
    idealAnswer: `### Test the negative cases
Most authorization bugs are **missing denials**. For every protected endpoint or method, test:
* **Unauthenticated** → 401.
* **Wrong role** → 403.
* **Right role, wrong resource owner** (the IDOR/BOLA case) → 403 or 404.
* **Right role, right owner** → 200.

### Spring Security test support
* \`@WithMockUser(roles = "ADMIN")\` or custom \`@WithSecurityContext\` annotations for domain users.
* MockMvc request post-processors: \`.with(jwt().authorities(...))\`, \`.with(user("alice"))\`, \`.with(csrf())\`.
* Method security tested directly on services with a security context.

### Make it systematic
* A **matrix test** (parameterised) of roles x endpoints x expected status, generated from a single policy table, catches new endpoints left unprotected.
* A test that fails if any controller endpoint isn't covered by the matrix.
* Multi-tenant tests: create data for tenant A, authenticate as tenant B, assert nothing leaks via lists, search, exports or error messages.

### Beyond unit tests
DAST scans and periodic pen tests catch what code tests miss, but the matrix gives fast regression protection.`,
    pitfalls: [
      "Only testing the happy path for authorized users.",
      "Forgetting list/search endpoints in tenant isolation tests.",
      "Authorization checks only in the UI.",
    ],
    followUpQuestions: [
      "How would you detect an endpoint that nobody added to the security matrix?",
      "404 or 403 for resources owned by others?",
    ],
    faangFocus: "Bridges testing and security; very relevant after real incidents.",
  },
  {
    id: 'tst-29',
    categoryId: 'testing',
    title: 'Testing Database Migrations',
    difficulty: 'Hard',
    tags: ['Flyway', 'Liquibase', 'Migrations', 'Zero Downtime'],
    scenario: "A Flyway migration that passed CI locked a 200-million-row table for 20 minutes in production, and another migration failed halfway, leaving the schema inconsistent.",
    question: "How do you test migrations so they're safe to run in production?",
    idealAnswer: `### Functional correctness
* Run **all migrations from scratch** against the real database engine (Testcontainers) in CI, then run the application's integration tests on the result.
* Test **upgrade from the current production version**: apply the new migrations on a schema (and representative data) at the previous release.
* Validate the resulting schema matches what the ORM expects (\`spring.jpa.hibernate.ddl-auto=validate\`).

### Operational safety
* **Lock behaviour**: some DDL takes strong locks (\`ALTER TABLE ... ADD COLUMN ... DEFAULT\` on old versions, adding NOT NULL constraints, creating indexes without \`CONCURRENTLY\`). Lint migrations (squawk for PostgreSQL) and set \`lock_timeout\` so a migration fails fast instead of blocking traffic.
* **Duration** on realistic data volumes: run against a production-sized copy or staging with masked data.
* **Transactional DDL**: PostgreSQL can wrap DDL in transactions (so failure rolls back); MySQL can't, which is how you get half-applied migrations. Keep migrations small and idempotent where possible.

### Compatibility with rolling deploys
Old and new app versions run simultaneously. Use **expand/contract**: add columns/tables first (compatible with old code), deploy, backfill, then remove old structures in a later release. Test that the **previous** app version still works on the new schema.`,
    pitfalls: [
      "Testing migrations only on empty databases.",
      "CREATE INDEX without CONCURRENTLY on large tables.",
      "Breaking changes in one step during rolling deploys.",
    ],
    followUpQuestions: [
      "How would you rename a column with zero downtime?",
      "How do you backfill a new column on 200M rows safely?",
    ],
    faangFocus: "Senior operational testing question.",
  },
  {
    id: 'tst-30',
    categoryId: 'testing',
    title: 'Architecture Tests With ArchUnit',
    difficulty: 'Solid',
    tags: ['ArchUnit', 'Architecture', 'Layering', 'Code Quality'],
    scenario: "A hexagonal architecture is documented in the wiki, but the domain package now imports Spring and JPA classes, and controllers call repositories directly.",
    question: "How can architecture rules be enforced automatically?",
    idealAnswer: `### ArchUnit
A library that analyses compiled bytecode and lets you express architecture rules as **unit tests**, run in the normal build.

\`\`\`java
@AnalyzeClasses(packages = "com.acme.orders")
class ArchitectureTest {

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "jakarta.persistence..");

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
            .layer("Web").definedBy("..adapters.in.web..")
            .layer("Application").definedBy("..application..")
            .layer("Persistence").definedBy("..adapters.out.jpa..")
            .whereLayer("Web").mayNotBeAccessedByAnyLayer()
            .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Application");
}
\`\`\`

### Other useful rules
No package cycles (\`slices().should().beFreeOfCycles()\`), naming conventions, no \`System.out\`, no field injection, no use of deprecated APIs, and rules about which modules may use which libraries.

### Adopting in an existing codebase
**Freezing rules** (\`FreezingArchRule\`) record current violations and only fail on new ones, so you can improve gradually.

### Alternatives
Java modules (JPMS), separate Gradle/Maven modules, or Spring Modulith's verification for module boundaries.`,
    pitfalls: [
      "Architecture only in documentation.",
      "Rules so strict teams disable the tests.",
      "Not freezing existing violations when adopting.",
    ],
    followUpQuestions: [
      "When would you use Gradle modules instead?",
      "How does Spring Modulith's verification compare?",
    ],
    faangFocus: "Shows how you keep large codebases healthy over time.",
  },
  {
    id: 'tst-31',
    categoryId: 'testing',
    title: 'Fuzz Testing Java Code',
    difficulty: 'Expert',
    tags: ['Fuzzing', 'Jazzer', 'Security', 'Parsers'],
    scenario: "A custom parser for a partner file format has good unit tests, but a malformed file in production caused an infinite loop and another caused an `ArrayIndexOutOfBoundsException` that crashed a batch.",
    question: "What is fuzz testing, how does it differ from property-based testing, and how would you apply it here?",
    idealAnswer: `### Fuzzing
Automatically generates huge numbers of inputs, often **coverage-guided**: it mutates inputs that reach new code paths, steering towards unexplored branches. It finds crashes, hangs, exceptions, and security issues in code that handles **untrusted input**.

### Property-based testing vs fuzzing
* **Property-based testing** (jqwik): generates structured inputs from generators you define and checks properties ('parse(format(x)) == x'). Great for logic.
* **Fuzzing**: typically starts from raw bytes or seeds, runs for minutes to hours, guided by coverage, focused on robustness. Great for parsers, decoders and protocol handlers.
They overlap and complement each other.

### Jazzer for Java
Coverage-guided fuzzing (libFuzzer-based) integrated with JUnit 5 via \`@FuzzTest\`:
\`\`\`java
@FuzzTest
void parserNeverCrashes(FuzzedDataProvider data) {
    try {
        parser.parse(data.consumeRemainingAsBytes());
    } catch (ParseException expected) {
        // invalid input is fine; anything else is a bug
    }
}
\`\`\`
It also includes **sanitizers** for injection bugs (SQL, OS command, deserialisation, SSRF, path traversal).

### Practice
Seed with real sample files, set timeouts to catch hangs, run long fuzzing campaigns nightly (or via OSS-Fuzz for open-source), and turn every finding into a regression test.`,
    pitfalls: [
      "Only testing parsers with handcrafted inputs.",
      "Swallowing all exceptions in the fuzz target.",
      "Running fuzzing for seconds and expecting results.",
    ],
    followUpQuestions: [
      "How does coverage guidance work?",
      "Which parts of a typical service are worth fuzzing?",
    ],
    faangFocus: "Advanced quality and security practice, valued in platform and security teams.",
  },
  {
    id: 'tst-32',
    categoryId: 'testing',
    title: 'Chaos Engineering and Fault Injection',
    difficulty: 'Expert',
    tags: ['Chaos Engineering', 'Fault Injection', 'Resilience', 'SRE'],
    scenario: "The team has circuit breakers, retries and fallbacks, but nobody knows whether they actually work until an outage happens.",
    question: "How would you introduce chaos engineering safely?",
    idealAnswer: `### The idea
Deliberately inject failures to **verify resilience hypotheses** before real incidents do it for you. It's an experiment, not random breakage.

### The method
1. Define **steady state** with metrics (success rate, latency of key journeys).
2. Form a **hypothesis**: 'If the recommendations service times out, checkout success stays above 99.5% because of the fallback.'
3. **Inject** the fault: latency, errors, instance termination, dependency outage, network partition, CPU/memory pressure, clock skew.
4. **Observe** and compare to steady state.
5. **Minimise blast radius**: start in staging, then a small share of production traffic, with automatic abort conditions.
6. Fix weaknesses and turn experiments into automated, recurring tests.

### Tools
Chaos Monkey for Spring Boot, Toxiproxy (network faults in tests), Chaos Mesh/Litmus (Kubernetes), AWS Fault Injection Service, Gremlin. At the code level, Testcontainers + Toxiproxy lets you test timeouts and retries in CI.

### Game days
Scheduled exercises where teams run failure scenarios together and practise incident response, including runbooks and alerting.

### Prerequisites
Good observability, SLOs, and rollback ability. Without them, chaos experiments are just outages.`,
    pitfalls: [
      "Starting chaos experiments in production without safeguards.",
      "Experiments without hypotheses or metrics.",
      "Not fixing the weaknesses found.",
    ],
    followUpQuestions: [
      "How would you test a network partition between two services in CI?",
      "What abort conditions would you define?",
    ],
    faangFocus: "Senior reliability culture question.",
  },
  {
    id: 'tst-33',
    categoryId: 'testing',
    title: 'Load Testing and Coordinated Omission',
    difficulty: 'Expert',
    tags: ['Load Testing', 'Gatling', 'k6', 'Coordinated Omission', 'Latency'],
    scenario: "A load test reports p99 latency of 80ms at 2,000 rps. In production at the same rate, users see p99 of 2 seconds during brief stalls.",
    question: "How do you design realistic load tests, and what is coordinated omission?",
    idealAnswer: `### Coordinated omission
Many load generators use a **closed model**: N virtual users, each sending the next request only after the previous response. When the server stalls for 2 seconds, those users **stop sending**, so the stall affects only a handful of measured requests. The requests that *would* have been sent during the stall (and would have waited) are never measured. The tool unknowingly coordinates with the system under test and hides the tail.

### Fixes
* Use an **open model** with a fixed **arrival rate** (Gatling \`constantUsersPerSec\`, k6 \`constant-arrival-rate\`, wrk2), so requests keep arriving during stalls, like real users.
* Record latency with HdrHistogram-based tools that correct for it.

### Designing realistic tests
* **Workload model** from production: endpoint mix, payload sizes, think times, data distribution (hot keys!), cache hit ratios.
* **Environment** as close to production as possible: same instance types, database size, network.
* Types: **load** (expected peak), **stress** (find the breaking point), **soak** (hours, to find leaks), **spike** (sudden bursts, autoscaling behaviour).
* Warm-up period for JIT and caches, then measure.
* Watch the **system**, not only the tool: CPU, GC, pool saturation, DB metrics, errors.

### Report
Percentiles (p50/p95/p99/max) over time, throughput vs latency curves, and the bottleneck found.`,
    pitfalls: [
      "Closed-model tests reporting misleading tails.",
      "Averages instead of percentiles.",
      "Tests against tiny databases with perfect cache hit rates.",
    ],
    followUpQuestions: [
      "How would you find the saturation point of a service?",
      "What's the difference between throughput and goodput?",
    ],
    faangFocus: "Performance-testing depth expected for senior and staff roles.",
  },
  {
    id: 'tst-34',
    categoryId: 'testing',
    title: 'Testing Concurrency Correctness With jcstress',
    difficulty: 'Expert',
    tags: ['jcstress', 'Concurrency Testing', 'JMM', 'Race Conditions'],
    scenario: "A custom lock-free cache passes 10,000 iterations of a multi-threaded unit test on a developer laptop, then corrupts data on ARM servers in production.",
    question: "Why do ordinary tests miss concurrency bugs, and how does jcstress help?",
    idealAnswer: `### Why normal tests miss them
Concurrency bugs depend on **rare interleavings** and on **memory reordering** allowed by the Java Memory Model. An x86 laptop has a strong memory model (TSO) that hides many reorderings; ARM is weaker. A unit test running a few threads for a moment rarely hits the problematic window.

### jcstress
The OpenJDK **Java Concurrency Stress** harness:
* You write small test classes with \`@Actor\` methods (run concurrently by different threads) and an \`@Arbiter\` or result object recording what each actor observed.
* You declare which outcomes are **acceptable**, **acceptable but interesting**, or **forbidden** with \`@Outcome\`.
* jcstress runs the actors **millions of times** with varying scheduling, JIT modes and heap layouts, and reports how often each outcome occurred.

\`\`\`java
@JCStressTest
@Outcome(id = "1, 1", expect = ACCEPTABLE)
@Outcome(id = "0, 0", expect = FORBIDDEN, desc = "Both missed each other")
@State
public class PublicationTest {
    volatile int x, y;
    @Actor public void a(II_Result r) { x = 1; r.r1 = y; }
    @Actor public void b(II_Result r) { y = 1; r.r2 = x; }
}
\`\`\`

### Complementary tools
Run on ARM hardware too, use thread sanitizers where available, stress tests under load, and code review against known patterns. For higher-level code, prefer well-tested \`java.util.concurrent\` classes over custom lock-free code.`,
    pitfalls: [
      "Trusting multi-threaded unit tests as proof of correctness.",
      "Testing only on x86.",
      "Writing custom lock-free code without jcstress tests.",
    ],
    followUpQuestions: [
      "Which outcome of the test above would plain (non-volatile) fields allow?",
      "What is TSO and why does x86 hide some bugs?",
    ],
    faangFocus: "Rare, expert-level concurrency testing knowledge.",
  },
  {
    id: 'tst-35',
    categoryId: 'testing',
    title: 'Keeping a Large Test Suite Fast',
    difficulty: 'Hard',
    tags: ['CI', 'Build Performance', 'Parallel Tests', 'Test Impact Analysis'],
    scenario: "The monorepo's test suite takes 55 minutes. Developers push without running tests locally and CI queues are long.",
    question: "How would you bring feedback time down without reducing confidence?",
    idealAnswer: `### Measure first
Find the slowest tests and modules (build scans, JUnit reports). Usually a small fraction of tests dominate: full Spring contexts, containers started per class, sleeps.

### Make individual tests faster
* Replace \`Thread.sleep\` with Awaitility.
* Use **test slices** instead of \`@SpringBootTest\` where possible, and keep context configuration consistent so Spring's **context cache** is reused (each unique combination of \`@MockitoBean\`s creates a new context!).
* **Reuse Testcontainers** across the suite (singleton containers or reusable containers locally).
* Move logic out of integration tests into plain unit tests.

### Run less, smarter
* **Build caching** (Gradle build cache, Develocity): unchanged modules don't re-run tests.
* **Test impact analysis / predictive test selection**: run tests affected by the change first, full suite later.
* Split into stages: fast unit tests gate merges; slower suites run in parallel or after merge with fast rollback.

### Run in parallel
* JUnit 5 parallel execution for independent tests; Gradle \`maxParallelForks\`.
* **Sharding** across CI machines.
* Requires isolation: no shared state, unique DB schemas or data per test.

### Cultural
Track suite duration as a metric with a budget; slow tests are bugs.`,
    pitfalls: [
      "Every test class with a slightly different Spring context.",
      "Deleting slow tests instead of fixing them.",
      "Parallelism without test isolation.",
    ],
    followUpQuestions: [
      "How does Spring's test context cache key work?",
      "What risks does predictive test selection introduce?",
    ],
    faangFocus: "Developer-productivity question for senior engineers in large codebases.",
  },
  {
    id: 'tst-36',
    categoryId: 'testing',
    title: 'Ephemeral Environments vs Shared Staging',
    difficulty: 'Expert',
    tags: ['Environments', 'Staging', 'Preview Environments', 'CI/CD'],
    scenario: "Twenty teams share one staging environment. Deployments collide, data is constantly corrupted by other teams' tests, and 'works in staging' means little.",
    question: "What's wrong with shared staging, and what alternatives exist?",
    idealAnswer: `### Problems with shared staging
* **Contention**: teams block each other; one broken service breaks everyone's tests.
* **Drift**: staging configuration and data diverge from production.
* **Unclear ownership** of failures; flaky results reduce trust.
* It becomes a bottleneck gate in the delivery pipeline.

### Alternatives
* **Ephemeral per-PR environments**: spin up the changed service(s) with dependencies on Kubernetes (namespaces, Helm, Tilt, Okteto), seeded data, destroyed after merge. High isolation, but cost and complexity grow with the number of dependencies.
* **Request-level isolation / sandboxes** (routing by header in a shared cluster): deploy only the changed service; a baggage header routes test traffic to it while other calls go to shared baseline services (the approach of tools like Signadot). Cheap and scalable.
* **Contract tests + consumer-driven contracts** reduce the need for full-stack integration environments.
* **Testing in production** safely: feature flags, dark launches, canaries, synthetic transactions.

### A balanced strategy
Most confidence comes from unit, slice and contract tests in CI; a few end-to-end smoke tests in an isolated environment; and progressive delivery in production with strong observability.`,
    pitfalls: [
      "Relying on one shared staging environment as the main quality gate.",
      "Ephemeral environments that take 40 minutes to start.",
      "No production verification after deploy.",
    ],
    followUpQuestions: [
      "How would you seed realistic data into ephemeral environments?",
      "How does header-based routing isolate test traffic?",
    ],
    faangFocus: "Delivery-infrastructure design for staff-level candidates.",
  },
  {
    id: 'tst-37',
    categoryId: 'testing',
    title: 'Deterministic Simulation Testing',
    difficulty: 'Master',
    tags: ['Simulation Testing', 'Distributed Systems', 'Determinism', 'FoundationDB'],
    scenario: "A team building a replicated storage service keeps finding rare bugs in production that only occur with specific combinations of network delays, crashes and retries, which they can never reproduce.",
    question: "What is deterministic simulation testing and how would you apply its ideas in Java?",
    idealAnswer: `### The idea
Run the **entire distributed system in one process**, on a single thread, with **all sources of nondeterminism controlled** by a seeded simulator: time, scheduling, network (delays, drops, reordering, partitions), disk (slow writes, corruption, full disks) and process crashes. A test explores thousands of randomized failure scenarios per second, and any failure can be **replayed exactly** from its seed. Popularised by FoundationDB; also used by TigerBeetle and others.

### What it requires
* Abstract all I/O and time behind interfaces (network, clock, storage, random, scheduling) with real and simulated implementations.
* Avoid real threads in core logic, or run them on a deterministic scheduler.
* Invariant checks throughout (e.g. linearizability of the replicated log, no committed write lost).
* **Buggify**: code paths that deliberately misbehave in simulation (inject slow paths, rare branches) to increase coverage.

### In Java
Design core logic as an event-driven state machine with injected \`Clock\`, message transport and storage; drive it from a deterministic event loop. Libraries and frameworks can help, but the main investment is architectural. Complement with Jepsen-style black-box tests against the real deployment.

### Payoff
Rare, catastrophic bugs are found in CI, reproducibly, rather than in production years later.`,
    pitfalls: [
      "Hidden nondeterminism (hash iteration order, system time, thread pools).",
      "Simulations without strong invariant checks.",
      "Trying to retrofit simulation onto code with I/O everywhere.",
    ],
    followUpQuestions: [
      "How does Jepsen differ from simulation testing?",
      "Which invariants would you check for a replicated log?",
    ],
    faangFocus: "Cutting-edge testing for databases and distributed infrastructure.",
  },
  {
    id: 'tst-38',
    categoryId: 'testing',
    title: 'A Testing Strategy for a Large Engineering Organisation',
    difficulty: 'Master',
    tags: ['Testing Strategy', 'Quality Gates', 'Engineering Leadership'],
    scenario: "As a principal engineer, you're asked to define the testing strategy for 40 teams and 200 services with very uneven practices and frequent production incidents caused by integration issues.",
    question: "What would your strategy include and how would you roll it out?",
    idealAnswer: `### Principles
* Teams **own** the quality of their services; the platform provides paved roads.
* Optimise for **fast, reliable feedback** and **safe delivery**, not test counts.
* Invest where incidents come from: data shows most were integration and config issues.

### The shape of testing
* Unit and slice tests per service with fast CI (< 10 minutes).
* **Consumer-driven contract tests** between services, verified in both pipelines, replacing most cross-service end-to-end tests.
* Integration tests with Testcontainers for each service's own infrastructure.
* A **small** set of end-to-end journeys for critical flows.
* **Progressive delivery**: canaries with automated analysis, feature flags, fast rollback.
* Production verification: synthetic monitoring and SLO-based alerting.

### Platform support
Test templates and libraries (Testcontainers setups, contract-testing broker), shared CI pipeline with quality gates (tests, coverage on diff, mutation testing on critical modules, dependency and security scans), flaky-test tracking.

### Rollout
Start with the teams and services behind the most incidents; measure DORA metrics (deployment frequency, lead time, change failure rate, time to restore) and incident causes; publish results; iterate. Standards should be enforced by tooling, not documents.`,
    pitfalls: [
      "Mandating a coverage number org-wide.",
      "Building a giant end-to-end suite that nobody owns.",
      "Strategy documents without tooling or metrics.",
    ],
    followUpQuestions: [
      "How do you convince teams to adopt contract testing?",
      "Which metrics would show the strategy is working?",
    ],
    faangFocus: "A leadership-level question for principal and staff roles.",
  },
  {
    id: 'tst-39',
    categoryId: 'testing',
    title: 'Verifying Interactions: ArgumentCaptor and Void Methods',
    difficulty: 'Solid',
    tags: ['Mockito', 'ArgumentCaptor', 'verify', 'Void Methods'],
    scenario: "A service builds an `EmailMessage` and passes it to `emailSender.send(message)`, a void method. The test needs to check the recipient and subject, and also a case where the sender throws.",
    question: "How do you test interactions with void methods in Mockito?",
    idealAnswer: `### Verifying what was sent
Use an \`ArgumentCaptor\` (or an argument matcher) to capture the argument and assert on it:
\`\`\`java
@Captor ArgumentCaptor<EmailMessage> captor;

@Test
void sendsWelcomeEmail() {
    service.register(new SignUp("ana@example.com"));

    verify(emailSender).send(captor.capture());
    assertThat(captor.getValue())
            .extracting(EmailMessage::to, EmailMessage::subject)
            .containsExactly("ana@example.com", "Welcome!");
}
\`\`\`
For simple checks, \`verify(sender).send(argThat(m -> m.to().equals("ana@example.com")))\` is enough.

### Stubbing void methods
\`when(...)\` can't wrap a void call. Use the do-family:
* \`doThrow(new SmtpException()).when(emailSender).send(any());\`
* \`doAnswer(inv -> { ... return null; }).when(...)\`
* \`doNothing()\` (default for mocks, useful for spies).

### Other verification tools
\`verify(mock, times(2))\`, \`never()\`, \`verifyNoMoreInteractions\` (use sparingly; it makes tests brittle), \`inOrder\` when order is part of the contract.

### Design note
Heavy verification of void calls is fine at **boundaries** (sending email, publishing events). Inside the domain, prefer state-based assertions.`,
    pitfalls: [
      "Using when() with void methods.",
      "verifyNoMoreInteractions everywhere.",
      "Capturing arguments when a simple matcher would do.",
    ],
    followUpQuestions: [
      "How would you verify an event was published after the transaction committed?",
      "What's the difference between a mock and a spy?",
    ],
    faangFocus: "Mockito fluency commonly tested in live coding.",
  },
  {
    id: 'tst-40',
    categoryId: 'testing',
    title: 'Getting Legacy Code Under Test',
    difficulty: 'Hard',
    tags: ['Legacy Code', 'Characterization Tests', 'Seams', 'Refactoring'],
    scenario: "You inherit a 3,000-line `OrderProcessor` class with no tests, static calls to the database and email server, and a bug fix is due this week.",
    question: "How do you safely change code that has no tests?",
    idealAnswer: `### Michael Feathers' legacy code change algorithm
1. Identify the **change points**.
2. Find **test points** where behaviour can be observed.
3. **Break dependencies** just enough to get code into a test harness.
4. Write **characterisation tests** that pin down current behaviour (right or wrong).
5. Make the change, then refactor.

### Characterisation tests
Run the code with representative inputs and assert whatever it currently does, including odd behaviour. Approval/snapshot tests are very effective here. They're a safety net, not a specification.

### Creating seams
A **seam** is a place where you can change behaviour without editing the code there:
* **Extract and override**: move the static DB call into a protected method and override it in a test subclass.
* **Parameterise constructor**: introduce a constructor accepting interfaces, keeping the old constructor for existing callers.
* **Wrap static calls** behind an interface (\`EmailGateway\`).
* **Sprout method/class**: write new logic in a new, tested unit and call it from the old code.

### Pragmatism under a deadline
Cover only the area you're changing; use IDE automated refactorings (safe, mechanical); leave the code slightly better each time (boy scout rule). Big-bang rewrites of untested code are the riskiest option.`,
    pitfalls: [
      "Refactoring before having any tests.",
      "Rewriting from scratch under deadline pressure.",
      "Characterisation tests that 'fix' behaviour silently.",
    ],
    followUpQuestions: [
      "What is a sprout class and when do you use it?",
      "How would you approach a class with 40 dependencies?",
    ],
    faangFocus: "A realistic senior question about working effectively with legacy systems.",
  },
];
