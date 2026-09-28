import type { Question } from '../../types';

/**
 * Modern Java, part two: the language and library features from 9 to 25
 * that interviewers use to check you've kept up.
 */
export const MODERN_MORE_QUESTIONS: Question[] = [
  {
    id: 'mod-14',
    categoryId: 'modern',
    title: 'What Changed From Java 8 to Java 25',
    difficulty: 'Core',
    tags: ['LTS', 'Java 11', 'Java 17', 'Java 21', 'Java 25'],
    scenario: "A candidate with 8 years on Java 8 is asked: 'Tell me the most important things added in each LTS release since then.'",
    question: "Summarise the headline features of Java 11, 17, 21 and 25.",
    idealAnswer: `### Java 9-11 (LTS 11)
Module system, \`var\` for locals (10), \`List.of\`/\`Map.of\`, new String methods (\`isBlank\`, \`strip\`, \`lines\`, \`repeat\`), the standard \`HttpClient\`, single-file source launch, JFR open-sourced, removal of Java EE modules (JAXB, JAX-WS) from the JDK.

### Java 12-17 (LTS 17)
**Switch expressions**, **text blocks**, **records**, **pattern matching for instanceof**, **sealed classes**, helpful NullPointerException messages, strong encapsulation of JDK internals by default, new random generator API, ZGC and Shenandoah production-ready.

### Java 18-21 (LTS 21)
**Virtual threads**, **pattern matching for switch** and **record patterns**, **sequenced collections**, generational ZGC, UTF-8 by default (18), simple web server, key encapsulation API.

### Java 22-25 (LTS 25)
Unnamed variables \`_\`, the **FFM API** (final in 22), **stream gatherers** (24), class-file API (24), virtual threads no longer pinned by \`synchronized\` (24), ahead-of-time class loading caches (Leyden, 24+), post-quantum crypto (ML-KEM/ML-DSA, 24), **compact source files and instance main methods**, **flexible constructor bodies**, **module import declarations**, scoped values final and compact object headers (25).

### How to present it
Group by theme: concise data modelling (records, sealed types, patterns), concurrency (virtual threads, structured concurrency, scoped values), performance and startup (GC, Leyden), and native interop (FFM).`,
    pitfalls: [
      "Listing features without saying why they matter.",
      "Confusing preview features with finalised ones.",
      "Not knowing which release is LTS.",
    ],
    followUpQuestions: [
      "Which of these have you used in production and why?",
      "What would you prioritise when migrating from 8 to 21?",
    ],
    faangFocus: "Checks whether a candidate has kept pace with the platform.",
  },
  {
    id: 'mod-15',
    categoryId: 'modern',
    title: 'Switch Expressions',
    difficulty: 'Core',
    tags: ['switch', 'Switch Expressions', 'yield', 'Java 14'],
    scenario: "A classic `switch` statement computing a shipping fee has a missing `break`, so express orders are charged the standard fee plus the express fee.",
    question: "How do switch expressions fix this class of bug, and what are their rules?",
    idealAnswer: `### Arrow labels: no fall-through
\`case X -> ...\` executes only that branch. The missing-break bug can't happen. Multiple labels share a branch: \`case SAT, SUN -> ...\`.

### Switch as an expression
The switch **produces a value**, so it can be assigned or returned directly. Each branch is an expression, or a block that returns its value with **\`yield\`**.

### Exhaustiveness
A switch **expression** must cover all cases. For enums, listing every constant is enough (no \`default\` needed), and if someone adds a constant, the code **fails to compile** instead of silently doing the wrong thing. For other types, a \`default\` is required.

### Example
\`\`\`java
BigDecimal fee = switch (order.shipping()) {
    case STANDARD -> new BigDecimal("4.99");
    case EXPRESS  -> new BigDecimal("12.99");
    case PICKUP   -> BigDecimal.ZERO;
    case FREIGHT  -> {
        BigDecimal base = freightQuote(order);
        yield base.max(new BigDecimal("50"));
    }
};
\`\`\`

### Notes
Old-style \`case X:\` labels still exist (and can be used in expressions with \`yield\`, keeping fall-through). Prefer arrows.`,
    pitfalls: [
      "Adding a default to enum switches and losing exhaustiveness checking.",
      "Mixing arrow and colon labels (not allowed in one switch).",
      "Using return inside a switch expression block instead of yield.",
    ],
    followUpQuestions: [
      "What happens at runtime if a new enum constant appears from a recompiled library?",
      "How do switch expressions combine with pattern matching?",
    ],
    faangFocus: "A basic modern-Java feature almost always asked in upgrade discussions.",
  },
  {
    id: 'mod-16',
    categoryId: 'modern',
    title: 'Pattern Matching for instanceof',
    difficulty: 'Core',
    tags: ['instanceof', 'Pattern Matching', 'Java 16'],
    scenario: "An `equals` method is full of `if (o instanceof Money) { Money m = (Money) o; ... }` casts.",
    question: "How does pattern matching for instanceof simplify this, and what are the scoping rules?",
    idealAnswer: `### Test and bind in one step
\`if (o instanceof Money m)\` checks the type and, if it matches, binds \`m\` as a \`Money\`. No explicit cast, no chance of casting to the wrong type.

### Flow scoping
The binding is in scope **where the compiler can prove the match succeeded**:
* \`if (o instanceof Money m && m.currency() == USD)\`: usable on the right side of \`&&\`.
* \`if (!(o instanceof Money m)) return false;\` then \`m\` is usable **after** the if.
* Not usable with \`||\` in the same condition, since the match may not have happened.

### Cleaner equals
\`\`\`java
@Override public boolean equals(Object o) {
    return o instanceof Money m
        && amount.equals(m.amount)
        && currency == m.currency;
}
\`\`\`

### Notes
\`null instanceof X\` is false, so no null check is needed. Since Java 21 you can also use **record patterns** here: \`o instanceof Point(int x, int y)\`.`,
    pitfalls: [
      "Trying to use the binding in an || branch.",
      "Reassigning the pattern variable, which hides intent.",
      "Chains of instanceof checks where a sealed type + switch would be clearer.",
    ],
    followUpQuestions: [
      "When would a switch with patterns be better than instanceof chains?",
      "How do record patterns extend this?",
    ],
    faangFocus: "Quick check of Java 16+ fluency.",
  },
  {
    id: 'mod-17',
    categoryId: 'modern',
    title: 'Helpful NullPointerExceptions and Null-Handling Utilities',
    difficulty: 'Core',
    tags: ['NullPointerException', 'Objects', 'Java 14', 'Debugging'],
    scenario: "A production log shows `NullPointerException` at a line containing `order.getCustomer().getAddress().getCity().toUpperCase()`. On Java 8 nobody knew which call was null.",
    question: "What do helpful NPE messages show, and which JDK utilities help handle nulls cleanly?",
    idealAnswer: `### Helpful NPE messages (JEP 358)
Since Java 14 (on by default from 15), the JVM describes exactly what was null:
\`Cannot invoke "Address.getCity()" because the return value of "Customer.getAddress()" is null\`.
It names local variables too if the code was compiled with \`-g\` (debug info); otherwise it says \`<local4>\`.

### Utilities in \`java.util.Objects\`
* \`requireNonNull(x, "customer must not be null")\`: fail fast at API boundaries with a clear message.
* \`requireNonNullElse(x, default)\` and \`requireNonNullElseGet(x, supplier)\` (Java 9).
* \`Objects.equals(a, b)\`, \`Objects.hash(...)\`, \`Objects.toString(x, "n/a")\`: null-safe helpers.
* \`checkIndex\`, \`checkFromToIndex\` for bounds.

### Design practices
* Validate at boundaries; don't sprinkle null checks everywhere.
* Return empty collections and \`Optional\` from methods instead of null.
* Annotate with \`@Nullable\`/\`@NonNull\` (JSpecify) so static analysis (NullAway, IntelliJ) catches issues at compile time.`,
    pitfalls: [
      "Long chained calls with no null strategy.",
      "Returning null collections.",
      "Stripping debug info and getting less useful NPE messages.",
    ],
    followUpQuestions: [
      "What is JSpecify and why does it matter?",
      "When is throwing NPE from requireNonNull better than returning an error?",
    ],
    faangFocus: "Practical debugging knowledge with modern tooling.",
  },
  {
    id: 'mod-18',
    categoryId: 'modern',
    title: 'Modern String API Additions',
    difficulty: 'Core',
    tags: ['String', 'Java 11', 'strip', 'repeat'],
    scenario: "A codebase still uses Apache Commons `StringUtils.isBlank`, `trim()` for Unicode input, and manual loops to repeat strings.",
    question: "Which String methods were added after Java 8, and how do they differ from older ones?",
    idealAnswer: `### Java 11
* \`isBlank()\`: true for empty or whitespace-only strings (Unicode-aware).
* \`strip()\`, \`stripLeading()\`, \`stripTrailing()\`: remove **Unicode** whitespace. \`trim()\` only removes characters ≤ U+0020, missing things like the non-breaking and ideographic spaces.
* \`lines()\`: a stream of lines, handling \\n, \\r and \\r\\n.
* \`repeat(n)\`.

### Java 12
* \`indent(n)\`: add or remove indentation per line and normalise line endings.
* \`transform(fn)\`: apply a function fluently.

### Java 15
* \`formatted(args...)\`: \`"Hello %s".formatted(name)\`.
* \`stripIndent()\` and \`translateEscapes()\`, used by text blocks.

### Also useful
\`String.join\`, \`chars()\`/\`codePoints()\`, and \`StringBuilder.compareTo\` (11). \`String.splitWithDelimiters\` arrived in Java 21.

### Takeaway
Many Commons Lang uses can now be dropped, and \`strip\` is the correct default for user input.`,
    pitfalls: [
      "Using trim() on Unicode input.",
      "isEmpty() where isBlank() was meant.",
      "Keeping dependencies for functions the JDK now provides.",
    ],
    followUpQuestions: [
      "What's the difference between isEmpty and isBlank?",
      "Why does strip handle more characters than trim?",
    ],
    faangFocus: "Small but frequently asked in 'what's new' questions.",
  },
  {
    id: 'mod-19',
    categoryId: 'modern',
    title: 'java.time vs Date and Calendar',
    difficulty: 'Core',
    tags: ['java.time', 'Date', 'Time Zones', 'Instant'],
    scenario: "A scheduling bug fires reminders an hour late twice a year, and a shared `SimpleDateFormat` produces corrupted dates under load.",
    question: "Why was java.time introduced, and which types should you use for what?",
    idealAnswer: `### Problems with the old API
\`Date\` and \`Calendar\` are **mutable** (so not thread-safe), have confusing APIs (months from 0, \`Date\` represents an instant but prints in the local zone), and \`SimpleDateFormat\` is **not thread-safe**, which explains the corrupted dates.

### java.time (JSR 310, Java 8)
Immutable, thread-safe, clear types:
* **\`Instant\`**: a point on the UTC timeline. Store and transmit timestamps with this.
* **\`LocalDate\` / \`LocalTime\` / \`LocalDateTime\`**: no time zone. Birthdays, business dates, 'opening hours'.
* **\`ZonedDateTime\`**: date-time in a **region zone** (\`Europe/Paris\`), aware of DST rules.
* **\`OffsetDateTime\`**: fixed offset (+02:00), common in APIs and databases.
* **\`Duration\`** (time-based) vs **\`Period\`** (date-based).
* \`DateTimeFormatter\`: immutable and thread-safe.

### The DST bug
The reminder time was stored as a fixed offset or as UTC computed once. Store the user's intent as a \`LocalTime\` + \`ZoneId\` and compute the next \`ZonedDateTime\` each time, so DST transitions are handled.

### Testing
Inject a \`java.time.Clock\` instead of calling \`now()\` directly, so tests can control time.`,
    pitfalls: [
      "Sharing SimpleDateFormat across threads.",
      "Storing local times without a zone for recurring events.",
      "Calling LocalDateTime.now() directly, making code untestable.",
    ],
    followUpQuestions: [
      "How should timestamps be stored in PostgreSQL?",
      "What happens to 02:30 on a spring-forward day?",
    ],
    faangFocus: "Common source of production bugs; clear type choices score well.",
  },
  {
    id: 'mod-20',
    categoryId: 'modern',
    title: 'Record Patterns and Nested Deconstruction',
    difficulty: 'Solid',
    tags: ['Record Patterns', 'Pattern Matching', 'Java 21', 'Records'],
    scenario: "Code that computes the area of shapes and the distance between points is full of accessor calls like `line.start().x()`.",
    question: "How do record patterns work, and how do they nest?",
    idealAnswer: `### Deconstruction
A record pattern matches a record and **extracts its components** into variables in one step:
\`\`\`java
if (obj instanceof Point(int x, int y)) { ... }
\`\`\`
The pattern uses the record's canonical components (via accessors).

### Nesting
Patterns compose, so you can match structure deeply:
\`\`\`java
record Point(double x, double y) {}
record Line(Point start, Point end) {}

double length(Object o) {
    return switch (o) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) ->
                Math.hypot(x2 - x1, y2 - y1);
        default -> 0;
    };
}
\`\`\`
\`var\` infers component types. With unnamed patterns (Java 22) you can ignore parts: \`Line(Point(var x, _), _)\`.

### With sealed types
Combined with sealed interfaces and switch, the compiler checks **exhaustiveness** over the whole hierarchy.

### Null behaviour
A record pattern never matches \`null\` at the top level. For a **component** that is null, a nested record pattern does not match, but \`var\` or a type pattern that covers the component's declared type does (binding null). Handle nulls explicitly with \`case null\` where needed.`,
    pitfalls: [
      "Deep nesting that hurts readability.",
      "Forgetting that record patterns don't match null.",
      "Using record patterns on non-record classes (not supported).",
    ],
    followUpQuestions: [
      "What's the difference between a type pattern and a record pattern?",
      "How would deconstruction patterns for regular classes work in the future?",
    ],
    faangFocus: "Java 21 fluency; shows you can use data-oriented features properly.",
  },
  {
    id: 'mod-21',
    categoryId: 'modern',
    title: 'Pattern Matching in switch: Guards, null and Dominance',
    difficulty: 'Hard',
    tags: ['Pattern Matching', 'switch', 'Guards', 'Java 21'],
    scenario: "A switch over payment types compiles in one order but fails with 'this case label is dominated by a preceding case label' after a teammate reorders cases, and a null payment throws NPE.",
    question: "Explain type patterns in switch, guards, null handling and dominance rules.",
    idealAnswer: `### Type patterns in switch
\`switch\` can match on types, not only constants:
\`\`\`java
String describe(Payment p) {
    return switch (p) {
        case null -> "no payment";
        case Card c when c.amount().compareTo(LIMIT) > 0 -> "large card payment";
        case Card c -> "card " + c.last4();
        case BankTransfer t -> "transfer from " + t.iban();
        case Wallet w -> "wallet " + w.provider();
    };
}
\`\`\`

### Guards
\`when\` adds a boolean condition to a pattern. Guarded cases must come **before** the unguarded case of the same type.

### Dominance
A case label is **dominated** if an earlier label matches everything it would match: \`case Card c\` before \`case Card c when ...\` makes the guarded one unreachable, which is a **compile error**. Order from most specific to most general.

### null
Traditionally \`switch\` throws NPE on null. With pattern switches you can add \`case null\` (or \`case null, default\`). Without it, a null selector still throws.

### Exhaustiveness
With a **sealed** \`Payment\` hierarchy, listing all permitted subtypes makes the switch exhaustive without \`default\`, and adding a new subtype causes compile errors at every switch that needs updating.`,
    pitfalls: [
      "Unguarded case before guarded case of the same type.",
      "Forgetting case null and getting NPE.",
      "Adding default to sealed switches and losing exhaustiveness checks.",
    ],
    followUpQuestions: [
      "What happens at runtime if a new subtype appears that the compiled switch doesn't know about?",
      "Can you use primitive types in patterns?",
    ],
    faangFocus: "Deeper Java 21 question; dominance and exhaustiveness rules separate real users.",
  },
  {
    id: 'mod-22',
    categoryId: 'modern',
    title: 'Virtual Threads: A Practical Introduction',
    difficulty: 'Solid',
    tags: ['Virtual Threads', 'Loom', 'Java 21', 'Concurrency'],
    scenario: "A service making many blocking HTTP and database calls is limited by its 200-thread pool. A colleague suggests virtual threads.",
    question: "What are virtual threads, how do you use them, and when are they a good fit?",
    idealAnswer: `### What they are
Lightweight threads managed by the JVM, not the OS. Many virtual threads are multiplexed onto a small pool of **carrier** (platform) threads. When a virtual thread **blocks** on IO, it's unmounted and its stack saved on the heap, freeing the carrier to run another. You can have **millions** of them.

### Creating them
\`\`\`java
Thread.ofVirtual().name("worker-", 0).start(task);
Thread.startVirtualThread(task);

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var url : urls) executor.submit(() -> fetch(url));
}
\`\`\`
In Spring Boot 3.2+: \`spring.threads.virtual.enabled=true\`.

### Good fit
Thread-per-request servers and **IO-bound** work with lots of waiting: HTTP calls, JDBC, messaging. You keep simple, blocking, debuggable code and get reactive-level concurrency.

### Not a fit
* **CPU-bound** work: there are still only as many cores as before.
* Don't **pool** virtual threads; create one per task.
* Limit access to scarce resources (DB connections, rate-limited APIs) with semaphores, since the thread pool no longer does it implicitly.
* Avoid large ThreadLocal caches (many threads = many copies).`,
    pitfalls: [
      "Pooling virtual threads.",
      "Expecting speedups for CPU-bound work.",
      "Losing the implicit concurrency limit of a fixed pool.",
    ],
    followUpQuestions: [
      "What is pinning and when does it still happen?",
      "How do virtual threads show up in thread dumps?",
    ],
    faangFocus: "Now a standard question for any Java backend role.",
  },
  {
    id: 'mod-23',
    categoryId: 'modern',
    title: 'Records in Depth: Compact Constructors, Validation and Frameworks',
    difficulty: 'Solid',
    tags: ['Records', 'Validation', 'Jackson', 'JPA'],
    scenario: "A team wants to use records for DTOs, value objects and JPA entities, and needs validation and defensive copies.",
    question: "How do you customise records, and where do they fit with Jackson and JPA?",
    idealAnswer: `### Compact canonical constructor
Validate and normalise without repeating the parameter list; the field assignments happen after your code:
\`\`\`java
record Email(String value) {
    Email {
        Objects.requireNonNull(value);
        value = value.strip().toLowerCase(Locale.ROOT);
        if (!value.contains("@")) throw new IllegalArgumentException("invalid email");
    }
}
\`\`\`

### Defensive copies
Records are **shallowly** immutable. For collection components, copy in the constructor: \`tags = List.copyOf(tags);\`.

### Other customisations
Extra constructors (must delegate to the canonical one), static factories, instance methods, static fields, implementing interfaces, overriding accessors (keep the contract).

### Frameworks
* **Jackson** (2.12+) supports records out of the box: great for DTOs and API payloads.
* **Bean Validation** annotations work on record components.
* **JPA entities**: records don't fit. Entities need a no-arg constructor, mutability and proxies for lazy loading. Use records for **projections** and \`@Embeddable\` values (supported in Hibernate 6.2+).

### Limits
No inheritance (records are final and extend \`Record\`), no instance fields beyond components.`,
    pitfalls: [
      "Assuming records are deeply immutable.",
      "Using records as JPA entities.",
      "Heavy logic in compact constructors (keep it to validation/normalisation).",
    ],
    followUpQuestions: [
      "How do records serialise with Java serialization?",
      "Can a record implement an interface with default methods?",
    ],
    faangFocus: "Practical record usage beyond the basics.",
  },
  {
    id: 'mod-24',
    categoryId: 'modern',
    title: 'The java.net.http HttpClient',
    difficulty: 'Solid',
    tags: ['HttpClient', 'HTTP/2', 'Async', 'Java 11'],
    scenario: "A library still uses `HttpURLConnection` with manual stream handling and no timeouts. You're asked to modernise it without adding dependencies.",
    question: "What does the Java 11 HttpClient offer and how do you use it correctly?",
    idealAnswer: `### Features
* HTTP/1.1 and **HTTP/2** (with multiplexing), WebSockets.
* **Synchronous** \`send\` and **asynchronous** \`sendAsync\` returning \`CompletableFuture\`.
* Body handlers and publishers for strings, bytes, files, streams, and line-by-line processing.
* Built-in redirect policy, proxy, authenticator, and SSL configuration.

### Use it correctly
* **Reuse one client**: it holds the connection pool and threads. Create it once.
* **Timeouts**: \`connectTimeout\` on the client and \`timeout\` per request (the latter bounds the time until response headers arrive).
* Check status codes: non-2xx does not throw.
* Choose an **executor** for async callbacks, or virtual threads.
* Java 21: \`HttpClient\` is \`AutoCloseable\`.

### Example
\`\`\`java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build();

HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.example.com/orders/42"))
        .timeout(Duration.ofSeconds(3))
        .header("Accept", "application/json")
        .GET().build();

HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() != 200) throw new ApiException(res.statusCode());
\`\`\`

### In Spring apps
Spring's \`RestClient\` can use it as the underlying transport (\`JdkClientHttpRequestFactory\`).`,
    pitfalls: [
      "Creating a new client per request.",
      "No request timeout.",
      "Assuming 4xx/5xx throw exceptions.",
    ],
    followUpQuestions: [
      "How would you stream a large download to a file?",
      "How do you add retries?",
    ],
    faangFocus: "Checks awareness of JDK capabilities that remove dependencies.",
  },
  {
    id: 'mod-25',
    categoryId: 'modern',
    title: 'Interface Evolution: Default, Static and Private Methods',
    difficulty: 'Solid',
    tags: ['Interfaces', 'Default Methods', 'Diamond Problem'],
    scenario: "A class implements two interfaces that both declare a default method `describe()`. The code doesn't compile.",
    question: "Explain default, static and private interface methods, and how Java resolves conflicts.",
    idealAnswer: `### Why default methods exist
Java 8 needed to add methods like \`Collection.stream()\` and \`Iterable.forEach()\` to existing interfaces **without breaking** every implementation. Default methods provide an implementation that classes inherit unless they override it.

### Static and private methods
* **Static** (Java 8): utility methods tied to the interface, e.g. \`Comparator.comparing\`. Not inherited by implementing classes.
* **Private** (Java 9): share code between default methods without exposing it.

### Conflict resolution rules
1. **Class wins**: a method declared in the class or a superclass beats any default method.
2. **More specific interface wins**: if B extends A and both provide the default, B's wins.
3. Otherwise it's **ambiguous**: the class must override and can choose explicitly with \`A.super.describe()\`.

### Fixing the example
\`\`\`java
class Report implements Printable, Exportable {
    @Override public String describe() {
        return Printable.super.describe() + " / " + Exportable.super.describe();
    }
}
\`\`\`

### Design guidance
Default methods are for **evolution** and convenience, not for sharing state (interfaces have no instance fields). Abstract classes remain the choice when you need state or constructors.`,
    pitfalls: [
      "Putting business logic with hidden state assumptions in default methods.",
      "Defining equals/hashCode as defaults (not allowed).",
      "Overusing interfaces as mixins.",
    ],
    followUpQuestions: [
      "Why can't a default method override Object.equals?",
      "Interface vs abstract class in modern Java?",
    ],
    faangFocus: "Common Java 8+ OOP question; the resolution rules are the core.",
  },
  {
    id: 'mod-26',
    categoryId: 'modern',
    title: 'Unnamed Variables and Patterns',
    difficulty: 'Solid',
    tags: ['Unnamed Variables', 'Java 22', 'Patterns', 'Readability'],
    scenario: "Code reviewers keep flagging unused variables like `catch (NumberFormatException ignored)` and `for (var unused : list)`, and deeply nested record patterns listing every component.",
    question: "How do unnamed variables (`_`) help, and where can they be used?",
    idealAnswer: `### The feature (JEP 456, final in Java 22)
An underscore declares a variable or pattern that is **intentionally unused**. It can't be read, and multiple \`_\` can appear in the same scope.

### Where it's allowed
* Local variables whose value is ignored: \`var _ = queue.poll();\`
* Catch parameters: \`catch (NumberFormatException _) { return defaultValue; }\`
* Loop variables: \`for (var _ : items) count++;\`
* Lambda parameters: \`map.forEach((_, v) -> total += v);\`
* try-with-resources where only the side effect matters.
* **Unnamed patterns** in record patterns: \`case Order(var id, _, _) -> ...\`
* Multiple patterns in one case: \`case Circle _, Square _ -> "simple shape";\`

### Why it matters
It communicates intent, silences 'unused variable' warnings honestly, and shortens pattern matches that only care about some components.

### Notes
Since Java 9, \`_\` alone can't be used as a normal identifier, so older code using it as a name won't compile on newer JDKs.`,
    pitfalls: [
      "Using _ where the value should actually be handled (e.g. ignoring return values that signal errors).",
      "Expecting to read the _ variable later.",
      "Old code using _ as an identifier breaking on upgrade.",
    ],
    followUpQuestions: [
      "How does case Circle _, Square _ differ from binding both?",
      "Why was _ reserved in Java 9?",
    ],
    faangFocus: "Small feature, but a good sign that you follow recent releases.",
  },
  {
    id: 'mod-27',
    categoryId: 'modern',
    title: 'Compact Source Files and Instance Main Methods',
    difficulty: 'Core',
    tags: ['Java 25', 'Main Method', 'Scripting', 'Beginners'],
    scenario: "A team wants to write small operational scripts in Java instead of Bash, but finds the class boilerplate and compile step annoying.",
    question: "How has launching simple Java programs changed in recent releases?",
    idealAnswer: `### Instance main methods and compact source files (JEP 512, final in Java 25)
A source file can contain methods and fields **without a class declaration**; the compiler wraps them in an implicit class. \`main\` can be an **instance method** with no parameters:
\`\`\`java
void main() {
    IO.println("Hello");
}
\`\`\`
Compact source files automatically import the \`java.base\` module's packages, and the new \`java.lang.IO\` class offers simple console \`println\`/\`readln\`.

### Launching without compiling
* Java 11: \`java Script.java\` compiles in memory and runs a single file.
* Java 22 (JEP 458): the launcher can run **multi-file** source programs, compiling other referenced source files on demand.
* Shebang scripts: \`#!/usr/bin/java --source 25\` at the top of a file without the \`.java\` extension.

### When to use it
Teaching, prototypes, small tools and scripts. As a program grows, turn it into a normal class and project; the transition is smooth because it's still ordinary Java.`,
    pitfalls: [
      "Using compact source files for production application code.",
      "Forgetting that implicit classes can't be referenced by name from other classes.",
      "Assuming preview flags are still required on Java 25.",
    ],
    followUpQuestions: [
      "How does the launcher choose which main method to run?",
      "What does JShell offer for experimentation?",
    ],
    faangFocus: "A light modern-Java question about developer ergonomics.",
  },
  {
    id: 'mod-28',
    categoryId: 'modern',
    title: 'Data-Oriented Programming With Records, Sealed Types and Patterns',
    difficulty: 'Hard',
    tags: ['Data-Oriented Programming', 'Sealed Types', 'Records', 'Pattern Matching'],
    scenario: "A payment processing module has a class hierarchy with abstract methods like `process()`, `refund()`, `toJson()` on every payment type. Adding an operation means touching 7 classes.",
    question: "What is data-oriented programming in modern Java, and when does it beat classic OO polymorphism?",
    idealAnswer: `### The style
Model data as **immutable, transparent carriers** (records), model alternatives as **sealed** hierarchies (sum types), and implement operations as **functions** that pattern match over the data, with the compiler checking exhaustiveness.

\`\`\`java
sealed interface Payment permits Card, Transfer, Wallet {}
record Card(String last4, Money amount) implements Payment {}
record Transfer(String iban, Money amount) implements Payment {}
record Wallet(String provider, Money amount) implements Payment {}

Money fee(Payment p) {
    return switch (p) {
        case Card c     -> c.amount().percent(2.9);
        case Transfer t -> Money.of("0.50");
        case Wallet w   -> w.amount().percent(1.5);
    };
}
\`\`\`

### The trade-off (the expression problem)
* **OO polymorphism**: easy to add **new types**, hard to add new operations (touch every class).
* **Data-oriented**: easy to add **new operations** (one new function), hard to add types (update every switch, but the compiler finds them all).

### When it fits
Domain models with a stable set of variants and many operations: messages, events, commands, ASTs, API responses, payment types. Operations like serialisation, validation and pricing live separately from the data and don't bloat it.

### When classic OO fits
Open extension by third parties (plugins), behaviour-rich objects with encapsulated state.`,
    pitfalls: [
      "Using default branches that defeat exhaustiveness.",
      "Mixing the styles inconsistently in one hierarchy.",
      "Exposing mutable state in 'data' types.",
    ],
    followUpQuestions: [
      "How does exhaustiveness checking change refactoring?",
      "How would you model an event-sourced aggregate in this style?",
    ],
    faangFocus: "A senior design question that shows how you use modern language features together.",
  },
  {
    id: 'mod-29',
    categoryId: 'modern',
    title: 'Flexible Constructor Bodies',
    difficulty: 'Hard',
    tags: ['Constructors', 'Java 25', 'Validation', 'Inheritance'],
    scenario: "A subclass must validate and transform its arguments before calling `super(...)`, but Java has always required `super()` to be the first statement, forcing awkward static helper methods.",
    question: "What do flexible constructor bodies allow, and what restrictions remain?",
    idealAnswer: `### The change (JEP 513, final in Java 25)
Statements may now appear **before** an explicit \`super(...)\` or \`this(...)\` call. This part is called the **prologue**.

\`\`\`java
class PositiveAmount extends Amount {
    PositiveAmount(BigDecimal value) {
        if (value.signum() <= 0) throw new IllegalArgumentException("must be positive");
        var scaled = value.setScale(2, RoundingMode.HALF_EVEN);
        super(scaled);
    }
}
\`\`\`

### Restrictions in the prologue
The object isn't initialised yet, so you **cannot use \`this\`**: no reading fields, no calling instance methods, no passing \`this\` anywhere. You **may assign fields** of the class being constructed (but not read them).

### Why field assignment before super matters
It fixes a long-standing hazard: if the superclass constructor calls an overridable method, the subclass override used to see its own fields at **default values**. Now the subclass can initialise those fields before calling \`super\`, so the override sees correct values.

### Benefits
Fail-fast validation without allocating the superclass state, cleaner argument preparation (no static helper tricks), and safer initialisation order.`,
    pitfalls: [
      "Trying to call instance methods before super().",
      "Still calling overridable methods from constructors in new designs.",
      "Assuming this works on older JDKs without preview flags.",
    ],
    followUpQuestions: [
      "Why was super() required first historically?",
      "How does this interact with records' canonical constructors?",
    ],
    faangFocus: "Very recent feature; knowing it signals active interest in the platform.",
  },
  {
    id: 'mod-30',
    categoryId: 'modern',
    title: 'Module Import Declarations',
    difficulty: 'Solid',
    tags: ['Modules', 'Imports', 'Java 25'],
    scenario: "A developer writing a small utility has 20 import lines for `java.util`, `java.util.function`, `java.util.stream`, `java.nio.file` and `java.time`.",
    question: "What does `import module` do, and how does it deal with ambiguity?",
    idealAnswer: `### The feature (JEP 511, final in Java 25)
\`import module M;\` imports **all public top-level types in all packages exported by module M** (and modules it requires transitively). For example, \`import module java.base;\` gives you \`List\`, \`Map\`, \`Stream\`, \`Path\`, \`Files\`, \`LocalDate\` and more in one line.

The importing code does **not** need to be in a module itself.

### Ambiguity
Two imported modules may export types with the same simple name (e.g. \`java.base\`'s \`java.util.List\` and \`java.desktop\`'s \`java.awt.List\`). Using \`List\` is then a compile error. Resolve it with a **single-type import**, which shadows on-demand and module imports:
\`\`\`java
import module java.base;
import module java.desktop;
import java.util.List;
\`\`\`

### Where it helps
Scripts, prototypes, teaching and compact source files (which import \`java.base\` automatically). In large codebases, explicit imports remain more readable and are what IDEs manage anyway.`,
    pitfalls: [
      "Name clashes between modules.",
      "Using module imports everywhere in production code, hiding where types come from.",
      "Confusing module imports with requires directives in module-info.",
    ],
    followUpQuestions: [
      "How do module imports interact with package wildcard imports?",
      "What does requires transitive mean?",
    ],
    faangFocus: "A small modern feature, often paired with compact source files.",
  },
  {
    id: 'mod-31',
    categoryId: 'modern',
    title: 'Stable Values and Lazy Constants',
    difficulty: 'Expert',
    tags: ['StableValue', 'Lazy Initialization', 'JIT', 'Preview'],
    scenario: "A service has dozens of `static final` loggers, parsers and caches initialised eagerly, adding seconds to startup. Making them lazy with holder classes or volatile fields adds boilerplate and loses JIT constant folding.",
    question: "What problem do stable values solve and how do they work?",
    idealAnswer: `### The trade-off they remove
* \`static final\` fields: the JIT **constant-folds** them (treats the value as a constant), but they must be initialised eagerly during class init.
* Lazy patterns (holder idiom, double-checked locking with volatile): deferred, but a volatile read on every access, and the JIT can't treat the result as constant.

### Stable values (JEP 502, preview in Java 25; continued as lazy constants in later previews)
An object that holds **at most one value**, set **at most once**, lazily, in a thread-safe way. Once set, the JVM trusts it like a \`final\` field and can **constant-fold** reads.

\`\`\`java
private final StableValue<Logger> logger = StableValue.of();

Logger logger() {
    return logger.orElseSet(() -> Logger.create(OrderService.class));
}

// Or a lazily computed supplier
static final Supplier<Parser> PARSER = StableValue.supplier(Parser::new);
\`\`\`
There are also stable lists and functions for lazily computed collections of values.

### Why it matters
Faster startup (defer expensive initialisation until first use) **without** giving up peak performance, and less hand-written concurrency code.

### Caveat
It's a **preview API**: requires \`--enable-preview\` and may change (it was renamed and reshaped in subsequent previews). Use it in experiments, not yet in libraries that need stability.`,
    pitfalls: [
      "Shipping preview APIs in production libraries.",
      "Assuming volatile-based lazy fields are constant-folded.",
      "Doing expensive work in static initialisers by default.",
    ],
    followUpQuestions: [
      "What does 'constant folding' mean for the JIT?",
      "How do you enable preview features in Maven?",
    ],
    faangFocus: "Cutting-edge JDK knowledge for performance-minded engineers.",
  },
  {
    id: 'mod-32',
    categoryId: 'modern',
    title: 'The Vector API',
    difficulty: 'Expert',
    tags: ['Vector API', 'SIMD', 'Performance', 'Incubator'],
    scenario: "A similarity search service computes millions of dot products between float vectors per second. The scalar loop is CPU-bound and auto-vectorisation is inconsistent.",
    question: "What does the Vector API offer and how do you use it?",
    idealAnswer: `### SIMD without native code
Modern CPUs process multiple values per instruction (SSE/AVX on x86, NEON/SVE on ARM). The JIT **auto-vectorises** some simple loops, but not reliably. The **Vector API** (\`jdk.incubator.vector\`, still incubating as of Java 25) lets you express vector computations explicitly; the JIT compiles them to the best instructions for the hardware, with scalar fallbacks.

### Example: dot product
\`\`\`java
static final VectorSpecies<Float> S = FloatVector.SPECIES_PREFERRED;

static float dot(float[] a, float[] b) {
    var acc = FloatVector.zero(S);
    int i = 0;
    for (; i < S.loopBound(a.length); i += S.length()) {
        var va = FloatVector.fromArray(S, a, i);
        var vb = FloatVector.fromArray(S, b, i);
        acc = va.fma(vb, acc);
    }
    float sum = acc.reduceLanes(VectorOperators.ADD);
    for (; i < a.length; i++) sum += a[i] * b[i];   // tail
    return sum;
}
\`\`\`

### Considerations
* Requires \`--add-modules jdk.incubator.vector\`; the API may change.
* Gains of 4-16x are common for numeric kernels when data is in primitive arrays.
* Benchmark with JMH; check that the JIT actually intrinsified the code (performance cliffs happen when it doesn't).
* Libraries (e.g. Lucene's vector search) already use it; prefer them when available.`,
    pitfalls: [
      "Using boxed or object data that can't be vectorised.",
      "Forgetting the scalar tail loop.",
      "Relying on an incubator API without a fallback plan.",
    ],
    followUpQuestions: [
      "Why is the Vector API waiting for Valhalla to finalise?",
      "How would you verify the generated assembly?",
    ],
    faangFocus: "Specialised performance knowledge for ML, search and numeric workloads.",
  },
  {
    id: 'mod-33',
    categoryId: 'modern',
    title: 'Migrating From Java 8 to 21: What Breaks',
    difficulty: 'Hard',
    tags: ['Migration', 'Upgrade', 'Jakarta EE', 'Strong Encapsulation'],
    scenario: "You lead the upgrade of 40 services from Java 8 and Spring Boot 2 to Java 21 and Spring Boot 3.",
    question: "What typically breaks, and how would you plan the migration?",
    idealAnswer: `### Common breakages
* **Removed Java EE modules** (JDK 11): JAXB, JAX-WS, \`javax.annotation\`, CORBA. Add them as explicit dependencies.
* **javax → jakarta** namespace (Spring Boot 3 / Jakarta EE 9+): every \`javax.persistence\`, \`javax.servlet\`, \`javax.validation\` import changes. Libraries must be Jakarta-compatible versions.
* **Strong encapsulation** of JDK internals (JDK 16-17): reflective access to \`sun.*\` or private JDK fields fails. Old versions of Lombok, Mockito, ByteBuddy, Hibernate, and some serialisers break; upgrade them, or temporarily \`--add-opens\`.
* **Removed or changed APIs**: \`Thread.stop\`, finalization deprecation, SecurityManager deprecated for removal (permanently disabled in 24), Nashorn removed (15).
* **Behaviour changes**: default charset is UTF-8 (18), locale data (CLDR) changes date formatting, TLS and crypto defaults tightened, GC defaults (G1 since 9).
* Build tooling: Maven/Gradle plugins, bytecode tools (Jacoco, SpotBugs) need current versions.

### Plan
1. Inventory dependencies and their Java/Jakarta compatibility.
2. Upgrade **build tooling and libraries first** while still on Java 8/11.
3. Compile and test on the new JDK; run with \`--illegal-access\` warnings (JDK 11-16) to find reflective access early.
4. Use **OpenRewrite** recipes for mechanical changes (jakarta imports, Spring Boot 3 migration).
5. Migrate service by service with canaries; compare performance and GC behaviour.`,
    pitfalls: [
      "Upgrading the JDK and all libraries in one big step.",
      "Adding --add-opens permanently instead of upgrading libraries.",
      "Ignoring date/locale formatting changes in tests.",
    ],
    followUpQuestions: [
      "What does OpenRewrite automate?",
      "How do you find reflective access to JDK internals?",
    ],
    faangFocus: "A very real senior-level task; interviewers want a structured plan.",
  },
  {
    id: 'mod-34',
    categoryId: 'modern',
    title: 'Compact Object Headers',
    difficulty: 'Expert',
    tags: ['Object Headers', 'Memory', 'Java 25', 'Lilliput'],
    scenario: "A memory-heavy caching service has hundreds of millions of small objects. An engineer asks whether JDK 25's compact object headers are worth enabling.",
    question: "What are compact object headers and what do they change?",
    idealAnswer: `### Background
On 64-bit HotSpot, an object header is normally **12 bytes** (8-byte mark word + 4-byte compressed class pointer), and objects are 8-byte aligned. For small objects the header is a large share of the size.

### Compact object headers (Project Lilliput, JEP 519, product feature in Java 25)
Shrinks the header to **8 bytes** by folding the compressed class pointer into the mark word. Enabled with \`-XX:+UseCompactObjectHeaders\` (not yet the default).

### Effects
* Many small objects lose 4 bytes, and sometimes a whole 8-byte alignment slot. Real-world heap reductions of roughly **10-20%** for object-heavy workloads have been reported.
* Less memory traffic, better cache density, fewer GCs; some workloads also gain throughput.
* Class pointers become more compact, which limits the number of loadable classes (still millions).

### Adoption
Test with production-like load: measure heap size after GC, GC frequency, and latency. Check compatibility with agents and tools that parse object layouts (JOL updates, profilers). It's a low-risk flag to evaluate for memory-bound services.`,
    pitfalls: [
      "Assuming it's enabled by default.",
      "Expecting gains for services dominated by large arrays.",
      "Not re-validating tools that inspect object layout.",
    ],
    followUpQuestions: [
      "How is locking information stored if the mark word is shared?",
      "Where else does Lilliput aim to reduce headers?",
    ],
    faangFocus: "Current JVM development awareness with practical impact.",
  },
  {
    id: 'mod-35',
    categoryId: 'modern',
    title: 'Post-Quantum Cryptography in the JDK',
    difficulty: 'Hard',
    tags: ['Cryptography', 'ML-KEM', 'ML-DSA', 'Security'],
    scenario: "Your security team asks for a plan to become 'quantum-ready' because of harvest-now-decrypt-later risks for long-lived confidential data.",
    question: "What post-quantum algorithms does the JDK provide, and how would you adopt them?",
    idealAnswer: `### The threat
A large quantum computer could break RSA and elliptic-curve cryptography (Shor's algorithm). Attackers can **record encrypted traffic today** and decrypt it later, so data with long confidentiality requirements is at risk now.

### What the JDK added
* **Key Encapsulation Mechanism API** (Java 21): a standard API for KEMs, used for establishing shared secrets.
* **ML-KEM** (JEP 496, Java 24): the NIST-standardised lattice-based KEM (FIPS 203, formerly Kyber).
* **ML-DSA** (JEP 497, Java 24): lattice-based digital signatures (FIPS 204, formerly Dilithium).
* **Key Derivation Function API** (Java 25), e.g. HKDF, used in hybrid schemes.

### Adoption strategy
* **Crypto agility**: inventory where you use RSA/ECDH/ECDSA and make algorithms configurable.
* **Hybrid key exchange** first (classical + post-quantum combined), so security holds if either survives. Browsers and TLS libraries are rolling out hybrid X25519 + ML-KEM key exchange; the JDK's TLS stack support is evolving.
* Prioritise **key exchange** for data-in-transit confidentiality (harvest-now risk); signatures matter later, for long-lived roots of trust.
* Watch sizes: ML-KEM and ML-DSA keys and signatures are larger than EC ones, affecting protocols, certificates and storage.`,
    pitfalls: [
      "Replacing algorithms without crypto agility.",
      "Rolling your own hybrid constructions.",
      "Ignoring key and signature size impact on protocols.",
    ],
    followUpQuestions: [
      "Why prioritise key exchange over signatures?",
      "What is crypto agility in practice?",
    ],
    faangFocus: "Security-forward modern Java; relevant for fintech and regulated industries.",
  },
  {
    id: 'mod-36',
    categoryId: 'modern',
    title: 'Preview Features and Incubator Modules',
    difficulty: 'Solid',
    tags: ['Preview Features', 'Incubator', 'JEP Process', 'Release Cadence'],
    scenario: "A developer wants to use a preview feature in a shared library and an incubator module in a production service.",
    question: "What are preview features and incubator modules, and when is it reasonable to use them?",
    idealAnswer: `### Preview features
**Language, JVM or API features** that are fully specified and implemented but **not yet permanent**. They may change or be removed based on feedback. Examples over time: records, sealed classes, pattern matching, structured concurrency, stable values.
* Must be enabled at **compile and run time**: \`javac --release 25 --enable-preview\`, \`java --enable-preview\`.
* Class files compiled with preview features are marked and only run on **that exact JDK version** with preview enabled.

### Incubator modules
**APIs** in \`jdk.incubator.*\` modules that are still being designed (e.g. the Vector API). Added with \`--add-modules\`. They can change between releases.

### When to use them
* Experiments, prototypes, internal tools, giving feedback to OpenJDK.
* Applications you control end to end, if you accept upgrading code with each JDK.
* **Not** in libraries consumed by others: you'd force every consumer onto one JDK version with flags.

### Release model context
A new JDK every six months; LTS every two years (21, 25). Features typically preview for one to several releases before becoming final.`,
    pitfalls: [
      "Shipping preview features in shared libraries.",
      "Forgetting that preview class files are tied to one JDK version.",
      "Confusing incubator APIs with stable ones.",
    ],
    followUpQuestions: [
      "How do you enable preview features in Maven and Gradle?",
      "Why did structured concurrency stay in preview for so long?",
    ],
    faangFocus: "Shows understanding of how the platform evolves and the risks involved.",
  },
  {
    id: 'mod-37',
    categoryId: 'modern',
    title: 'Project Valhalla: Value Classes',
    difficulty: 'Master',
    tags: ['Valhalla', 'Value Classes', 'Memory Layout', 'Performance'],
    scenario: "A team building a financial analytics engine asks whether Valhalla will let them store `Money` and `Point` objects as efficiently as C structs.",
    question: "What is Valhalla trying to achieve, and what are value classes?",
    idealAnswer: `### The problem
Every Java object has **identity**: a header, a unique address, and support for \`==\` identity comparison, synchronization and mutation visible through aliases. That forces objects to live on the heap behind pointers. An array of 1M \`Point\`s is an array of 1M pointers to scattered objects, costing memory and cache misses. Primitives avoid this but can't be user-defined.

### Value classes (JEP 401, in preview/early-access)
Classes declared \`value class Point { ... }\` give up identity:
* Fields are final; no synchronization on instances; \`==\` compares **state**.
* The JVM is free to **flatten** them: store fields inline in arrays and other objects, pass them in registers, and **scalarise** them, avoiding allocation.
* Some JDK classes (e.g. \`Integer\`, \`Optional\`, \`LocalDate\`) are planned to become value classes.

### Beyond value classes
Future phases aim at **null-restricted types** (e.g. \`Point!\`) so the JVM can flatten without a null marker, and ultimately **generics over primitives and values** (\`List<int>\`-like specialisation), unifying primitives and objects.

### What to do today
Design value-like types as immutable records without identity-dependent behaviour (no synchronization on them, no \`==\` comparisons), so they can migrate cheaply. Use primitive arrays or off-heap layouts where density matters now.`,
    pitfalls: [
      "Relying on identity of value-like types (== or synchronization).",
      "Expecting Valhalla benefits in current production JDKs.",
      "Confusing records (no identity restrictions) with value classes.",
    ],
    followUpQuestions: [
      "Why does nullability matter for flattening?",
      "What happens to code that synchronizes on an Integer?",
    ],
    faangFocus: "Deep platform vision question for senior and staff engineers.",
  },
  {
    id: 'mod-38',
    categoryId: 'modern',
    title: 'The Class-File API',
    difficulty: 'Expert',
    tags: ['Class-File API', 'Bytecode', 'Java 24', 'Frameworks'],
    scenario: "A framework team maintains a bytecode instrumentation agent built on ASM. Every JDK release, they must wait for an ASM update before supporting the new class file version.",
    question: "What does the Class-File API provide, and why did the JDK add it?",
    idealAnswer: `### The problem
Frameworks and tools (Spring, Hibernate, Mockito, agents) generate or transform bytecode with third-party libraries like ASM or ByteBuddy. The JDK itself bundled a private copy of ASM. With a new class-file version every six months, the ecosystem was always lagging: a library built for JDK N can't parse classes from JDK N+1.

### The API (JEP 484, final in Java 24)
\`java.lang.classfile\` provides a standard API to **parse, generate and transform** class files, always in sync with the JDK's own format.
* Immutable **element** models (classes, methods, fields, attributes, instructions).
* Builders using lambdas, and **transforms** that map a stream of elements into a new class.
* Handles tedious details such as stack map frames and constant pool management.

\`\`\`java
byte[] bytes = ClassFile.of().build(ClassDesc.of("demo.Hello"), cb -> cb
        .withFlags(ClassFile.ACC_PUBLIC)
        .withMethod("answer", MethodTypeDesc.of(ConstantDescs.CD_int),
                ClassFile.ACC_PUBLIC | ClassFile.ACC_STATIC,
                mb -> mb.withCode(code -> code.bipush(42).ireturn())));
\`\`\`

### Impact
Libraries can eventually drop bundled bytecode engines and support new JDKs on day one. Application developers rarely use it directly, but it improves upgrade speed across the ecosystem.`,
    pitfalls: [
      "Using it for tasks that annotation processors or source generation would solve more simply.",
      "Assuming ASM-based code can be swapped mechanically.",
      "Hand-writing bytecode without verifying it.",
    ],
    followUpQuestions: [
      "How does a Java agent use instrumentation to transform classes?",
      "Why were stack map frames painful to generate manually?",
    ],
    faangFocus: "Platform/tooling engineering knowledge.",
  },
  {
    id: 'mod-39',
    categoryId: 'modern',
    title: 'Evolving APIs Built on Sealed Types',
    difficulty: 'Expert',
    tags: ['Sealed Types', 'API Design', 'Compatibility', 'Exhaustiveness'],
    scenario: "A shared library exposes `sealed interface Event permits Created, Updated, Deleted`. Consumers switch over it exhaustively. The library team now needs to add `Archived`.",
    question: "What happens to consumers, and how should you design sealed APIs for evolution?",
    idealAnswer: `### Source vs binary compatibility
* **Recompiling** consumer code against the new library: exhaustive switches without \`default\` become **compile errors**. That's the intended safety feature: every place that must handle the new case is found.
* **Already-compiled** consumers running with the new library: an exhaustive switch meeting an unknown subtype throws **\`MatchException\`** at runtime (the compiler inserts a synthetic default).

### So adding a permitted subtype is a breaking change
For internal code in one repository, that's fine and desirable. For **published** libraries, it's a major-version change.

### Design options
* Seal hierarchies that are **genuinely closed** (e.g. \`Result = Ok | Err\`), not ones expected to grow.
* For growing sets, provide an **escape hatch**: a non-sealed \`Other\`/\`Unknown\` subtype that consumers must handle, or document that consumers should include a default branch.
* Version events (\`EventV2\`) or add a new sealed hierarchy alongside the old one.
* For wire formats (JSON/Protobuf), map unknown types to an \`Unknown\` variant at the deserialisation boundary.

### Trade-off
Exhaustiveness is a powerful tool for correctness **inside** a codebase; across team or organisation boundaries it couples release cycles.`,
    pitfalls: [
      "Sealing hierarchies in public libraries that will grow.",
      "Ignoring runtime MatchException for precompiled consumers.",
      "Adding default branches everywhere and losing the benefit.",
    ],
    followUpQuestions: [
      "How do enums behave in the same situation?",
      "How would you model an extensible event type across microservices?",
    ],
    faangFocus: "Senior API design question connecting language features to compatibility.",
  },
  {
    id: 'mod-40',
    categoryId: 'modern',
    title: 'How Pattern Matching Switches Are Compiled',
    difficulty: 'Master',
    tags: ['invokedynamic', 'SwitchBootstraps', 'Performance', 'Pattern Matching'],
    scenario: "A performance engineer asks whether replacing a visitor pattern with a pattern-matching switch over 12 sealed subtypes will be slower, since 'it's just a chain of instanceof checks'.",
    question: "Explain how javac compiles pattern switches and what that means for performance.",
    idealAnswer: `### Not a chain of instanceof
For a switch over types, javac emits an **\`invokedynamic\`** call to \`java.lang.runtime.SwitchBootstraps.typeSwitch\`, passing the list of case labels (classes, constants). The bootstrap returns an index for the first matching label, and a regular \`tableswitch\` jumps to the case body. Guards (\`when\`) are handled by re-invoking with a restart index when a guard fails. Enum and record patterns use related bootstraps.

### Why indy
The JDK can **change the dispatch strategy** without recompiling user code: e.g. caching the index per receiver class, generating specialised code, or using class hierarchy information for sealed types. Early implementations did a linear scan; newer JDKs generate optimised code.

### Performance in practice
* For monomorphic or few-type call sites, the JIT inlines the bootstrap's logic and it's comparable to virtual dispatch.
* A visitor is a **double virtual dispatch**; a pattern switch is one dispatch plus type tests. Neither is universally faster; differences are usually small compared with the work in the case bodies.
* **Record deconstruction** calls accessors, which inline trivially.

### The advice
Choose based on design (open vs closed extension, exhaustiveness checking), then measure hot paths with JMH if it matters. Don't reject pattern matching on assumed performance grounds.`,
    pitfalls: [
      "Assuming a linear instanceof chain.",
      "Making design decisions from unmeasured performance claims.",
      "Benchmarking in ways that don't reflect real type profiles.",
    ],
    followUpQuestions: [
      "How are guards handled by the bootstrap?",
      "Why did string switch use hashCode-based lookup instead of indy?",
    ],
    faangFocus: "Rare but impressive depth on compilation strategies.",
  },
  {
    id: 'mod-41',
    categoryId: 'modern',
    title: 'Records vs Lombok',
    difficulty: 'Core',
    tags: ['Records', 'Lombok', 'Boilerplate', 'Immutability'],
    scenario: "A team debates removing Lombok now that they're on Java 21. Some classes use `@Data`, others `@Value` and `@Builder`.",
    question: "When can records replace Lombok, and when not?",
    idealAnswer: `### Records replace \`@Value\`-style classes
Immutable data carriers with constructor, accessors, \`equals\`, \`hashCode\` and \`toString\`: a record does all of that in the language, with no annotation processor, no IDE plugin, and guaranteed semantics.

### Where records don't fit
* **Mutable** classes (\`@Data\`, setters): records are immutable.
* **JPA entities**: need no-arg constructors, mutability and proxying.
* **Inheritance**: records can't extend classes.
* **Builders**: records have no builder; write a small static builder, or use a library like RecordBuilder, or keep Lombok's \`@Builder\` for classes with many optional fields.
* Accessor naming: records use \`name()\`, not \`getName()\`. Some frameworks expecting JavaBean getters need configuration (most modern ones handle records).
* \`@Slf4j\`, \`@RequiredArgsConstructor\` for Spring beans: unrelated to records.

### Trade-offs of Lombok
Convenient, but it hooks into compiler internals (it historically broke on new JDKs), generated code is invisible, and \`@Data\` on entities creates \`equals/hashCode\` pitfalls with lazy relations.

### Pragmatic answer
Use records for DTOs, value objects, events and projections; keep Lombok (or plain code) where records don't fit, and don't mix both styles for the same kind of class.`,
    pitfalls: [
      "Using @Data on JPA entities.",
      "Forcing records onto mutable domain objects.",
      "Assuming all frameworks expect getX() accessors.",
    ],
    followUpQuestions: [
      "How would you add a builder to a record with 12 fields?",
      "Why is equals/hashCode on JPA entities tricky?",
    ],
    faangFocus: "Everyday design discussion in teams modernising their codebase.",
  },
  {
    id: 'mod-42',
    categoryId: 'modern',
    title: 'Random Number Generation: Random, ThreadLocalRandom, SecureRandom and RandomGenerator',
    difficulty: 'Solid',
    tags: ['Random', 'ThreadLocalRandom', 'SecureRandom', 'RandomGenerator'],
    scenario: "A service shares one `Random` across 200 threads for jitter, which shows contention, and uses `Math.random()` to create password reset tokens.",
    question: "Which random generators should be used for what, and what did Java 17 add?",
    idealAnswer: `### java.util.Random
Thread-safe via a CAS on a single seed, so it **contends** under heavy multithreaded use. Predictable: a few outputs reveal the seed.

### ThreadLocalRandom
Per-thread state, no contention. The right choice for jitter, sampling, load balancing randomisation and simulations in concurrent code: \`ThreadLocalRandom.current().nextLong(min, max)\`. Don't share the instance across threads.

### SecureRandom
Cryptographically strong, unpredictable. **Required** for tokens, passwords, session IDs, keys and nonces. \`Math.random()\` and \`Random\` are predictable, so reset tokens made with them can be guessed. Generate tokens with, for example, 32 bytes from \`SecureRandom\` encoded as Base64URL. Prefer the default constructor (\`new SecureRandom()\`); avoid blocking on \`/dev/random\` with \`getInstanceStrong()\` on hot paths.

### Java 17: RandomGenerator (JEP 356)
A common \`RandomGenerator\` interface for all generators, plus new algorithm families (LXM such as \`L64X128MixRandom\`, Xoshiro) with better statistical quality and **splittable/jumpable** variants for parallel streams: \`RandomGenerator.of("L64X128MixRandom")\`, \`RandomGeneratorFactory\`.

### SplittableRandom
Designed for fork/join and parallel streams: split into independent generators per task.`,
    pitfalls: [
      "Random or Math.random for security tokens.",
      "Sharing one Random across many threads.",
      "Using getInstanceStrong() on request paths and blocking.",
    ],
    followUpQuestions: [
      "How many bytes of entropy should a reset token have?",
      "Why can you predict java.util.Random outputs?",
    ],
    faangFocus: "Combines performance and security knowledge in one question.",
  },
  {
    id: 'mod-43',
    categoryId: 'modern',
    title: 'Modern JDK Developer Tools: JShell, jwebserver and the Source Launcher',
    difficulty: 'Core',
    tags: ['JShell', 'jwebserver', 'Tooling', 'Developer Experience'],
    scenario: "A new team member asks how to quickly try out an API, serve a static folder for testing, and run a one-off Java script without setting up a project.",
    question: "Which tools in the modern JDK help with this?",
    idealAnswer: `### JShell (Java 9)
An interactive **REPL**: type expressions and statements, see results immediately. Great for exploring APIs (\`/imports\`, \`/vars\`, tab completion), testing regexes and date formats, or teaching. Can load a classpath: \`jshell --class-path lib/*\`.

### Source-file launcher (Java 11, multi-file in 22)
\`java Tool.java arg1\` compiles in memory and runs. Since Java 22 the launched program can reference other source files in the same directory tree. Combined with compact source files and instance \`main\` (Java 25), small scripts are almost boilerplate-free.

### jwebserver (Java 18)
A minimal static file HTTP server: \`jwebserver -p 8000 -d /path\`. Useful for testing, prototyping and serving generated reports locally. Not for production. There's also a \`SimpleFileServer\` API.

### Diagnostics you should also know
\`jcmd\` (the Swiss army knife: thread dumps, heap dumps, JFR, VM flags), \`jfr\` (inspect recordings), \`jdeps\` (dependency analysis, JDK internal API usage), \`jlink\` (custom runtimes), \`jpackage\` (native installers).`,
    pitfalls: [
      "Creating full Maven projects for quick experiments.",
      "Using jwebserver for anything production-facing.",
      "Not knowing jcmd during incidents.",
    ],
    followUpQuestions: [
      "How would jdeps help a Java 8 to 21 migration?",
      "What can jcmd do that jstack and jmap can't?",
    ],
    faangFocus: "Light question on JDK tooling fluency.",
  },
];
