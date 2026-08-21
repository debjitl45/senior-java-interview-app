import type { Question } from '../types';

export const MODERN_QUESTIONS: Question[] = [
  {
    id: 'mod-1',
    categoryId: 'modern',
    title: 'Pattern Matching and Sealed Classes for Domain Modeling',
    difficulty: 'Hard',
    tags: ['Java 17', 'Java 21', 'Sealed Classes', 'Pattern Matching'],
    scenario: 'You are designing the domain layer for a payment processing engine. A payment can be in one of three exhaustive states: Authorized, Settled, or Failed. You want to ensure at compile-time that all business logic handles every possible state without relying on default switch cases.',
    question: 'How do you use Sealed Classes and Interfaces combined with Pattern Matching for switch (Java 21) to achieve Data-Oriented Programming and compile-time exhaustiveness? What is the architectural benefit over traditional class hierarchies?',
    idealAnswer: `### 1. Domain Modeling with Sealed Classes
Introduced in Java 17, **Sealed Classes** allow an interface or class to explicitly define which classes are permitted to extend or implement it using the \`permits\` keyword. This gives the architect complete control over the domain hierarchy.

### 2. Compile-Time Exhaustiveness in Java 21
When you combine Sealed Classes with **Pattern Matching for \`switch\`** (Java 21), the Java compiler can definitively determine if your \`switch\` statement has covered all possible subtypes.
* If you add a new permitted subclass to the sealed interface in the future, the compiler will immediately throw an **error** at every \`switch\` statement that does not handle the new state.
* This completely eliminates the need for a defensive \`default\` clause, preventing runtime errors where new domain states are silently ignored.

### 3. Architectural Benefits (Data-Oriented Programming)
* **Separation of Data and Logic:** Traditional Object-Oriented Programming encourages embedding behavior inside the domain objects. Data-Oriented Programming (DOP) models data as pure, immutable records and places the polymorphic behavior in highly cohesive functions using pattern matching.
* **Enhanced Readability:** Complex visitor patterns can be entirely replaced with clean, multi-line \`switch\` expressions that destructure records directly.`,
    codeSnippet: `// 1. Define the exhaustive domain using Sealed Interfaces and Records
public sealed interface PaymentEvent permits Authorized, Settled, Failed {}

public record Authorized(String txId, BigDecimal amount) implements PaymentEvent {}
public record Settled(String txId, Instant settledAt) implements PaymentEvent {}
public record Failed(String txId, String errorCode) implements PaymentEvent {}

// 2. Process events with compile-time exhaustiveness
public String process(PaymentEvent event) {
    // No 'default' branch needed! The compiler guarantees exhaustiveness.
    return switch (event) {
        case Authorized a -> "Authorizing " + a.amount();
        case Settled s    -> "Settled at " + s.settledAt();
        case Failed f     -> "Failed with code: " + f.errorCode();
    };
}`,
    pitfalls: [
      'Including a \`default\` clause in an exhaustive switch (it defeats the compile-time safety if new subclasses are added).',
      'Forgetting that subclasses of a sealed class must explicitly be declared \`final\`, \`sealed\`, or \`non-sealed\`.',
      'Not leveraging Record destructuring directly in the switch cases.'
    ],
    followUpQuestions: [
      'How do you handle null values in a Java 21 pattern matching switch?',
      'What are Guarded Patterns (using the \`when\` clause) and how do they impact switch exhaustiveness?'
    ],
    faangFocus: 'Shows you are writing modern, highly maintainable Java that leverages the latest language features to prevent entire classes of production bugs.'
  },
{
    id: 'mod-2',
    categoryId: 'modern',
    title: 'Foreign Function & Memory API (FFM) vs JNI',
    difficulty: 'Expert',
    tags: ['Java 21', 'FFM API', 'JNI', 'Off-Heap', 'Performance'],
    scenario: 'Your Java application needs to interface with a high-performance C++ machine learning library and manipulate multi-gigabyte off-heap memory buffers.',
    question: 'Compare the legacy Java Native Interface (JNI) with the modern Foreign Function & Memory API (JEP 454). Explain how the FFM API provides safe, deterministic off-heap memory management using Arenas, and discuss its performance advantages.',
    idealAnswer: `### 1. The Flaws of JNI
For decades, JNI was the only way to call native code or manage specialized memory. However, it has severe drawbacks:
* **Safety & Stability:** JNI is inherently unsafe. A single pointer error or buffer overflow in the native C/C++ code will instantly crash the entire JVM (Segmentation Fault).
* **Performance Overhead:** JNI requires complex boilerplate, and crossing the Java-to-Native boundary involves significant overhead (e.g., marshaling data, transitioning thread states, and disabling certain JIT optimizations).
* **Memory Leaks:** Direct allocation via \`Unsafe\` or JNI lacks deterministic lifecycle management, easily leading to native memory leaks.

### 2. The Foreign Function & Memory API (FFM)
The FFM API (finalized in Java 22, preview in Java 21) provides a pure-Java, highly optimized toolset for calling native code and managing off-heap memory.

### 3. Deterministic Memory Management via Arenas
Instead of relying on the Garbage Collector or dangerous manual \`free()\` calls, the FFM API introduces **Arenas**.
* An \`Arena\` controls the lifecycle of native memory segments.
* **\`Arena.ofConfined()\`:** Allocates memory that can only be accessed by the thread that created it. When the \`Arena\` is closed (typically using a \`try-with-resources\` block), the off-heap memory is **instantly and deterministically deallocated**.
* **Spatial & Temporal Safety:** The JVM actively tracks the bounds of the \`MemorySegment\`. If you attempt to access memory outside the allocated segment or after the Arena is closed, it throws a safe Java \`IndexOutOfBoundsException\` or \`IllegalStateException\` instead of crashing the JVM.

### 4. Performance Advantages
* FFM uses **Method Handles** to link native functions directly. The C2 JIT compiler can aggressively inline these calls, reducing the boundary-crossing overhead by up to 90% compared to JNI.`,
    codeSnippet: `// Deterministic, safe off-heap memory management
try (Arena arena = Arena.ofConfined()) {
    // Allocate 100 bytes of native off-heap memory
    MemorySegment segment = arena.allocate(100);
    
    // Write an integer to the native memory safely
    segment.set(ValueLayout.JAVA_INT, 0, 42);
    
    // Memory is instantly and safely freed when exiting this block!
}`,
    pitfalls: [
      'Assuming FFM completely eliminates the need to understand native memory layouts.',
      'Trying to pass confined memory segments across multiple threads without using a shared Arena.',
      'Forgetting that accessing native functions still requires enabling the \`--enable-native-access\` JVM flag.'
    ],
    followUpQuestions: [
      'How does the FFM API handle native downcalls vs upcalls (calling Java from C)?',
      'What is the difference between \`Arena.ofShared()\` and \`Arena.ofConfined()\` regarding memory synchronization?'
    ],
    faangFocus: 'Extremely relevant for database internals, game engines, and AI/ML infrastructure teams bridging Java with native hardware acceleration.'
  },
{ 
    id: 'mod-3',
    categoryId: 'modern',
    title: 'HashMap Internal Working and Treeification',
    difficulty: 'Hard',
    tags: ['Data Structures', 'Java 8+', 'Collections API'],
    scenario: 'You need to choose the right data structure for a high-read application and must explain its memory and performance characteristics under heavy hash collisions.',
    question: 'Explain the complete internal working of HashMap in Java 8+. What happens during hash collision, resize, and treeification?',
    idealAnswer: `### 1. Hashing and Index Calculation
When you put a key-value pair, the HashMap first computes the hash code of the key. It then uses the formula **hash AND (capacity - 1)** to find the bucket index, which is mathematically faster than a modulo operation. To spread entropy and reduce collisions in smaller maps, it XORs the hash with its upper 16 bits.

### 2. Collisions and Treeification (Java 8+)
If the target bucket is empty, a new \`Node\` is created. If not, a collision occurs. The map checks if the key exists using the \`equals()\` method. If it matches, the value is updated; otherwise, it appends the new \`Node\` to a linked list. 
Crucially, in **Java 8**, if a single bucket accumulates more than 8 entries (\`TREEIFY_THRESHOLD\`) and the table size is at least 64, the linked list is converted to a **Red-Black tree**. This optimizes worst-case lookup time from O(n) to O(log n).

### 3. Resizing and Trade-offs
When the map's size exceeds the **load factor threshold (default 0.75)**, it triggers a resize. It creates a new array of double the size and rehashes all entries. The 0.75 load factor is a mathematical sweet spot: a lower value reduces collisions but wastes memory, while a higher value saves memory but increases collisions.`,
    pitfalls: [
      'Forgetting that treeification requires a minimum table capacity of 64 in addition to the 8-node threshold.',
      'Failing to explain why the bitwise AND operation is used instead of modulo for index calculation.',
      'Not mentioning the XOR operation applied to the hash code to spread entropy.'
    ],
    followUpQuestions: [
      'What happens if two objects have the same hash code but are not equal?',
      'How does ConcurrentHashMap differ from HashMap in Java 8+?'
    ],
    faangFocus: 'FAANG interviewers dive deep into data structures. Knowing how HashMap mitigates worst-case O(n) scenarios (via Red-Black trees) demonstrates a deep understanding of algorithmic complexity and Java internals.'
  },
{
    id: 'mod-4',
    categoryId: 'modern',
    title: 'Records: What They Are and When Not to Use Them',
    difficulty: 'Core',
    tags: ['Records', 'Immutability', 'Java 16', 'Value Semantics'],
    scenario: 'A team converts every DTO and JPA entity to a `record`. The DTOs improve; the entities break with "No default constructor" and Hibernate proxy errors, and a record holding a `List` turns out to be mutable after all.',
    question: 'Explain what a record generates and guarantees, and where it is the wrong tool.',
    idealAnswer: `### What a record is
A **transparent carrier for immutable data**. \`record Point(int x, int y) { }\` generates:
* \`private final\` fields and a canonical constructor
* Accessors named \`x()\` and \`y()\` — note: **not** \`getX()\`
* \`equals\`, \`hashCode\` and \`toString\` derived from **all** components
* Implicit \`final\` class, extending \`java.lang.Record\` — so it cannot extend anything else

You can add static factories, instance methods, and a **compact constructor** for validation and normalisation. You cannot add instance fields beyond the components — that is the transparency guarantee.

### Why entities break
JPA requires a no-arg constructor and mutable fields, because it constructs instances reflectively and populates them, and creates lazy-loading proxies by subclassing. Records forbid all three: no no-arg constructor, final fields, final class. **Records are not entities.** They are excellent as DTOs, projections, value objects and query results — including as JPA **constructor projections**.

### The shallow-immutability trap
A record's *reference* fields are final, but the objects they point at are not. \`record Order(List<Item> items)\` still lets a caller mutate the list. Defend in the **compact constructor** with \`List.copyOf\`, which both snapshots and rejects nulls.

### Where records fit well
* DTOs and API request/response types
* Value objects — \`Money\`, \`Range\`, \`Coordinates\`
* Multiple return values instead of a \`Pair\` or an out-parameter
* Local records inside a method for intermediate stream shapes
* Sealed hierarchies for pattern matching — this is where records really pay off

### Where they do not
* JPA entities and anything requiring mutability or inheritance
* Types where you want to hide the representation — a record's components are public API by definition
* Types where \`equals\` must not consider every field (an entity compared by id, for instance)

### Serialisation notes
Records serialise via their canonical constructor, which makes deserialization **safer** than classic Java serialization — validation always runs. Jackson supports them natively (2.12+); frameworks that construct by reflection with a no-arg constructor generally do not.`,
    codeSnippet: `public record Order(String id, List<Item> items, Money total) {

    // Compact constructor: validate and defensively copy
    public Order {
        Objects.requireNonNull(id);
        items = List.copyOf(items);        // snapshot; also rejects nulls
        if (total.isNegative()) throw new IllegalArgumentException("total < 0");
    }

    public static Order empty(String id) { return new Order(id, List.of(), Money.ZERO); }
}

// Great as a JPA projection, terrible as a JPA entity
@Query("select new com.acme.OrderSummary(o.id, o.total) from Order o")
List<OrderSummary> summaries();`,
    pitfalls: [
      'Using records as JPA entities.',
      'Assuming a record containing a collection is deeply immutable.',
      'Expecting getX() accessors and breaking bean-convention tooling.',
      'Wanting to exclude a field from equals/hashCode — records cannot.'
    ],
    followUpQuestions: [
      'What is a compact constructor and how does it differ from the canonical one?',
      'Why is record deserialization safer than classic Java serialization?',
      'How do records and sealed interfaces work together for pattern matching?'
    ],
    faangFocus: 'A quick modern-Java check. The deep-vs-shallow immutability nuance and the JPA incompatibility are the two things interviewers listen for.'
  },
  {
    id: 'mod-5',
    categoryId: 'modern',
    title: 'Sealed Types and Exhaustive Pattern Matching',
    difficulty: 'Solid',
    tags: ['Sealed Classes', 'Pattern Matching', 'switch', 'ADT'],
    scenario: 'A payment domain has five payment types handled by a chain of `instanceof` checks with a `default` branch that throws. A sixth type is added and the bug is only discovered in production.',
    question: 'Show how sealed interfaces plus pattern matching for switch make this a compile-time error. Explain exhaustiveness and where sealed types fit in domain modelling.',
    idealAnswer: `### The problem with instanceof chains
A \`default\` branch means the compiler can never tell you a case is missing. Adding a subtype is a **silent** change: the code still compiles, and the failure appears at runtime, possibly months later.

### Sealed types
\`sealed interface Payment permits Card, Bank, Wallet, Crypto, Voucher\` tells the compiler the **complete** set of subtypes. Permitted subtypes must be \`final\`, \`sealed\`, or explicitly \`non-sealed\`, and must be in the same module (or same package for the unnamed module).

This is Java's version of an **algebraic data type** — a closed sum type — and it is what makes exhaustiveness checkable.

### Exhaustive switch
With a sealed hierarchy, a \`switch\` over it with a case per permitted subtype is **exhaustive**, so no \`default\` is needed. Add a sixth subtype and every non-exhaustive switch **fails to compile**, pointing you at exactly the places that need updating. That is the entire value proposition: turning a runtime surprise into a compile error.

Deliberately omit \`default\` — adding it re-disables the exhaustiveness check.

### Pattern matching features
* **Type patterns** — \`case Card c ->\` binds without a cast.
* **Record patterns** (Java 21) — \`case Card(var number, var expiry) ->\` destructures, and nests arbitrarily deep.
* **Guards** — \`case Card c when c.isExpired() ->\`. Guarded cases do not count towards exhaustiveness, so you still need an unguarded fallback for that type.
* **Null handling** — a \`switch\` on a reference throws NPE on null unless you write \`case null\`. Being explicit is better than relying on the throw.

### Where sealed types fit
* Closed domain hierarchies: payment methods, order states, command and event types.
* Result/Either types: \`sealed interface Result permits Ok, Err\`.
* Expression trees, protocol messages, state machines.

**Where they do not:** open extension points. If third parties should be able to add implementations, an ordinary interface is correct — sealing is a deliberate statement that the set is closed.

### The design trade-off
This is the classic **expression problem**. Sealed types make adding *operations* easy (write a new exhaustive switch) and adding *cases* a deliberate, compiler-guided change. Polymorphism (a method on the interface) makes adding *cases* easy and adding *operations* invasive. Choose based on which axis actually changes in your domain.`,
    codeSnippet: `public sealed interface Payment permits Card, Bank, Wallet, Crypto, Voucher { }

public record Card(String number, YearMonth expiry, Money amount) implements Payment { }
public record Bank(String iban, Money amount) implements Payment { }

// No default: adding a sixth subtype breaks the build HERE, at compile time
static Fee feeFor(Payment p) {
    return switch (p) {
        case Card(_, var expiry, var amt) when expiry.isBefore(YearMonth.now())
                                        -> throw new ExpiredCardException();
        case Card(_, _, var amt)          -> Fee.percent(amt, 1.5);
        case Bank(var iban, var amt)      -> Fee.flat(amt, Money.of("0.20"));
        case Wallet w                     -> Fee.percent(w.amount(), 0.9);
        case Crypto c                     -> Fee.percent(c.amount(), 2.0);
        case Voucher v                    -> Fee.ZERO;
    };
}`,
    pitfalls: [
      'Adding a default branch and losing exhaustiveness checking.',
      'Assuming a guarded case satisfies exhaustiveness for that type.',
      'Sealing a hierarchy that genuinely needs third-party extension.',
      'Forgetting that switch on a reference throws NPE unless you write case null.'
    ],
    followUpQuestions: [
      'Why do guarded patterns not contribute to exhaustiveness?',
      'How do record patterns destructure nested structures, and what does _ mean?',
      'When is polymorphism the better choice than a sealed hierarchy plus switch?'
    ],
    faangFocus: 'A strong signal of modern-Java fluency. Framing it as the expression problem shows genuine design thinking rather than syntax recall.'
  },
  {
    id: 'mod-6',
    categoryId: 'modern',
    title: 'Structured Concurrency',
    difficulty: 'Hard',
    tags: ['Structured Concurrency', 'Virtual Threads', 'Java 21', 'Cancellation'],
    scenario: 'A request fans out to three services with `CompletableFuture`. When one fails, the other two keep running to completion, wasting capacity; when the client disconnects, nothing is cancelled; and a failure produces a stack trace with no relationship to the request.',
    question: 'Explain structured concurrency: what problem it solves, how the scoping works, and how it compares with CompletableFuture and plain executors.',
    idealAnswer: `### The problem with unstructured concurrency
An \`ExecutorService.submit\` or \`CompletableFuture.supplyAsync\` creates a task whose **lifetime is unrelated to the code that started it**. Consequences:
* **Leaks** — nobody guarantees the task finishes or is cancelled.
* **No automatic cancellation** — one failure does not stop its siblings.
* **Broken diagnostics** — the stack trace of a pool thread has no link to the caller. Thread dumps show unrelated tasks.
* Manual, error-prone joining and error aggregation.

### The core idea
Structured concurrency applies the discipline of structured *programming* to concurrency: **if a task splits into subtasks, they all complete before the block exits**. Concurrency becomes lexically scoped, like a try-with-resources block, and the parent/child relationship is real and observable.

### How it works
\`StructuredTaskScope\` is opened in a try-with-resources block. \`fork()\` starts a subtask on a **virtual thread**. \`join()\` waits for the policy to be satisfied. When the block exits, **all remaining subtasks are cancelled** — guaranteed, including on exception.

Policies:
* \`ShutdownOnFailure\` — the first failure cancels the rest ("invoke all, all must succeed"). This is the fan-out case.
* \`ShutdownOnSuccess\` — the first success cancels the rest ("race", e.g. querying replicas).
* Custom policies by subclassing (e.g. quorum: proceed when k of n succeed).

In JDK 25 the API is \`StructuredTaskScope.open(Joiner...)\`; earlier previews used the \`ShutdownOnFailure\` subclasses. Check the JDK version — this API has evolved across previews.

### Why the diagnostics improve
Because the parent-child relationship is explicit, thread dumps (and the JSON thread dump for virtual threads) show the **tree** of tasks, and exceptions propagate to the parent with the caller's stack attached. A failure reads like a normal exception rather than an orphaned pool-thread trace.

### Comparison
* **Plain executor** — no relationship, manual cancellation, easy to leak.
* **CompletableFuture** — good for *composing* asynchronous results and building pipelines, but does not own lifetimes; \`cancel()\` does not interrupt the underlying work by default, and composition is easy to get subtly wrong.
* **Structured concurrency** — best for **fan-out within one request**, which is the overwhelmingly common case. Blocking code, ordinary try/catch, real stack traces, guaranteed cleanup.

Combined with virtual threads it also inherits \`ScopedValue\` for context propagation, which is a proper replacement for \`ThreadLocal\` in this model.`,
    codeSnippet: `// All three must succeed; first failure cancels the others; nothing leaks
Profile loadProfile(long id) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Subtask<User>    user   = scope.fork(() -> userService.find(id));
        Subtask<Orders>  orders = scope.fork(() -> orderService.recent(id));
        Subtask<Credit>  credit = scope.fork(() -> creditService.score(id));

        scope.join().throwIfFailed();          // block exit cancels any stragglers

        return new Profile(user.get(), orders.get(), credit.get());
    }
}

// Race the replicas: first success wins, the rest are cancelled
try (var scope = new StructuredTaskScope.ShutdownOnSuccess<Quote>()) {
    replicas.forEach(r -> scope.fork(() -> r.quote(sym)));
    return scope.join().result();
}`,
    pitfalls: [
      'Letting a StructuredTaskScope escape its try-with-resources block.',
      'Calling get() on a subtask before join().',
      'Using structured concurrency for long-lived background work — it is for request-scoped fan-out.',
      'Assuming CompletableFuture.cancel() interrupts the running computation.'
    ],
    followUpQuestions: [
      'How do ScopedValue and structured concurrency replace ThreadLocal inheritance?',
      'How would you implement a quorum policy (k of n) with a custom joiner?',
      'What does a thread dump look like for a structured scope, and why is that better?'
    ],
    faangFocus: 'A leading-edge question at companies on recent JDKs. Explaining it as "structured programming applied to concurrency" is the framing that lands.'
  },
  {
    id: 'mod-7',
    categoryId: 'modern',
    title: 'ScopedValue vs ThreadLocal',
    difficulty: 'Hard',
    tags: ['ScopedValue', 'ThreadLocal', 'Virtual Threads', 'Context'],
    scenario: 'A service propagates tenant and correlation id through `ThreadLocal`. After enabling virtual threads, memory usage grows unexpectedly and some background tasks see stale or missing context.',
    question: 'Explain why ThreadLocal is a poor fit for virtual threads, what ScopedValue offers instead, and how to migrate context propagation.',
    idealAnswer: `### Why ThreadLocal breaks down with virtual threads
\`ThreadLocal\` was designed for a world with a **few hundred** pooled platform threads. With virtual threads there may be **millions**, and the assumptions invert:

* **Unbounded footprint.** Each virtual thread carrying a few ThreadLocals means millions of retained maps and values. This is the memory growth observed.
* **Unbounded lifetime.** A value set in a ThreadLocal lives until removed or the thread dies. Pool threads are recycled, so a forgotten \`remove()\` leaks context **into the next unrelated request** — a genuine correctness and security bug (wrong tenant).
* **Mutable and unstructured.** Any code can call \`set()\` at any point, so there is no way to reason about what the value is at a given moment.
* **\`InheritableThreadLocal\` copies the whole map** to each child thread. With virtual threads forked per subtask, that copying is expensive and, worse, the child can mutate its copy invisibly.

### ScopedValue
\`ScopedValue\` (JEP 429 onwards, finalised in recent JDKs) provides **immutable, lexically scoped, dynamically inherited** bindings:

* **Immutable** — bound with \`ScopedValue.where(KEY, value).run(...)\`, and the binding cannot be changed inside. What you read is what the enclosing block bound.
* **Scoped** — the binding is valid only for the duration of the block, then automatically unbound. No \`remove()\`, no leak, no \`finally\`.
* **Cheap inheritance** — subtasks forked inside a \`StructuredTaskScope\` inherit bindings **by reference**, with no map copying. This is what makes it viable at millions of threads.
* **Rebinding** is done by nesting a new \`where\`, which shadows only within the inner block — a stack discipline rather than mutation.

### The migration
1. Replace \`ThreadLocal<Tenant>\` with \`static final ScopedValue<Tenant> TENANT\`.
2. Bind once at the request boundary (a filter or interceptor) around the whole handler.
3. Read with \`TENANT.get()\`; use \`TENANT.isBound()\` where a value may be absent.
4. Fan out with \`StructuredTaskScope\` so subtasks inherit automatically.

### The honest caveat
The ecosystem is still catching up: MDC logging, Micrometer tracing and Spring's \`RequestContextHolder\` are ThreadLocal-based. In practice you bridge them — Micrometer's context-propagation library, or a \`TaskDecorator\` that copies context onto each task. And if a value must be mutable within a request (an accumulating audit buffer), \`ScopedValue\` deliberately does not support that; hold a mutable object *as* the bound value if you truly need it, and accept the sharing semantics.

The general rule: with virtual threads, prefer **binding context at a boundary** to **setting it imperatively somewhere in the middle**.`,
    codeSnippet: `private static final ScopedValue<Tenant> TENANT = ScopedValue.newInstance();

// Bind once at the request boundary — automatically unbound on exit, no leaks
ScopedValue.where(TENANT, resolveTenant(request))
           .run(() -> handler.handle(request));

// Anywhere deeper in the call stack
Tenant t = TENANT.get();

// Subtasks inherit by reference — no map copying, safe at millions of threads
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    scope.fork(() -> repo.load(TENANT.get()));   // inherited binding
    scope.join().throwIfFailed();
}`,
    pitfalls: [
      'Carrying ThreadLocals on millions of virtual threads and expecting the old footprint.',
      'Forgetting ThreadLocal.remove() on pooled threads, leaking context between requests.',
      'Assuming ScopedValue can be mutated inside its scope.',
      'Overlooking that MDC, tracing and Spring contexts still need a ThreadLocal bridge.'
    ],
    followUpQuestions: [
      'Why can ScopedValue inherit by reference when InheritableThreadLocal must copy?',
      'How would you bridge MDC logging to ScopedValue-based context?',
      'What happens if you call get() on an unbound ScopedValue?'
    ],
    faangFocus: 'Asked at companies actively adopting Loom. The context-leak-between-requests argument is the one that resonates most with interviewers.'
  },
  {
    id: 'mod-8',
    categoryId: 'modern',
    title: 'The Foreign Function & Memory API',
    difficulty: 'Expert',
    tags: ['FFM', 'Panama', 'Off-Heap', 'JNI'],
    scenario: 'A service must call a native compression library and manage a 4GB off-heap buffer. The existing implementation uses JNI and `DirectByteBuffer`, and suffers from native memory leaks and a 2GB size ceiling.',
    question: 'Explain the Foreign Function & Memory API: how Arena, MemorySegment and downcall handles work, and what it fixes relative to JNI and DirectByteBuffer.',
    idealAnswer: `### What was wrong before
**JNI** requires C glue code compiled per platform, is slow to develop and easy to get wrong (a mistake corrupts the JVM), and offers no memory safety.

**\`DirectByteBuffer\`** is limited to \`Integer.MAX_VALUE\` bytes — hence the 2GB ceiling — and its deallocation is tied to **garbage collection of the buffer object** via a \`Cleaner\`. Native memory is therefore freed at an unpredictable time, which is exactly how native "leaks" appear: the heap is fine, the RSS is not, and \`System.gc()\` becomes a load-bearing hack.

### MemorySegment
A contiguous region of memory — heap or off-heap — with a **size** (a \`long\`, so no 2GB limit) and **spatial and temporal bounds checking**. Access goes through \`VarHandle\`s derived from a \`MemoryLayout\`, so reads and writes are typed and bounds-checked, and the JIT compiles them to the same instructions you would get from an array access.

### Arena — deterministic lifetime
The key improvement. An \`Arena\` owns allocated segments and frees them when it closes:
* **\`Arena.ofConfined()\`** — single-threaded, closed by try-with-resources. **Deterministic deallocation** at a known point. Accessing a segment after close throws \`IllegalStateException\` rather than corrupting memory.
* **\`Arena.ofShared()\`** — usable from multiple threads; closing coordinates with a handshake.
* **\`Arena.ofAuto()\`** — GC-managed, like DirectByteBuffer.
* **\`Arena.global()\`** — never freed.

Confined arenas replace unpredictable Cleaner-based release with a scope you control, which is the direct fix for the leak.

### Calling native code
\`Linker.nativeLinker()\` plus \`SymbolLookup\` produce a \`MethodHandle\` for a native function, described by a \`FunctionDescriptor\` of \`MemoryLayout\`s. No C glue at all — the binding is expressed in Java. \`jextract\` can generate these bindings from a header file.

Upcalls (native code calling back into Java) are supported symmetrically.

### The safety trade-off
Native calls are inherently unsafe: a bad descriptor can crash the VM. FFM makes this **explicit** — restricted methods require \`--enable-native-access\` (and warn otherwise), so the unsafe surface is declared and auditable rather than hidden inside a JNI library.

### The broader significance
FFM is also the sanctioned replacement for \`sun.misc.Unsafe\` memory access, which is being removed. Any code doing off-heap work through Unsafe needs this migration path.`,
    codeSnippet: `// Deterministic lifetime, no 2GB limit, bounds-checked
try (Arena arena = Arena.ofConfined()) {
    MemorySegment buffer = arena.allocate(4L * 1024 * 1024 * 1024);   // 4GB, fine

    // Bind a native function with no C glue
    Linker linker = Linker.nativeLinker();
    MethodHandle compress = linker.downcallHandle(
            SymbolLookup.libraryLookup("libz.so", arena).find("compress2").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.JAVA_INT,      // return
                    ValueLayout.ADDRESS, ValueLayout.ADDRESS,
                    ValueLayout.ADDRESS, ValueLayout.JAVA_LONG,
                    ValueLayout.JAVA_INT));

    int rc = (int) compress.invokeExact(dest, destLen, src, srcLen, 6);
}   // memory freed HERE, deterministically`,
    pitfalls: [
      'Relying on GC to release off-heap memory and calling System.gc() to force it.',
      'Sharing a confined-arena segment across threads.',
      'Using a segment after its arena is closed (safe failure, but still a bug).',
      'Getting a FunctionDescriptor wrong — a mismatched layout can crash the VM.'
    ],
    followUpQuestions: [
      'How does a confined arena detect and prevent use-after-close?',
      'What does jextract generate and where does it fall short?',
      'How does FFM performance compare with JNI for small, frequent calls?'
    ],
    faangFocus: 'Rare and high-signal. Framing Arena as "deterministic deallocation replacing Cleaner-based release" shows you understand the actual problem it solves.'
  },
  {
    id: 'mod-9',
    categoryId: 'modern',
    title: 'Text Blocks, String Templates and Modern String Handling',
    difficulty: 'Core',
    tags: ['Text Blocks', 'Strings', 'Formatting', 'Java 15'],
    scenario: 'A codebase builds SQL and JSON with concatenated strings full of escaped quotes and `\\n`, and constructs log messages with `+` inside hot loops.',
    question: 'Show how text blocks improve this, explain incidental whitespace handling, and cover the string-building options and their costs.',
    idealAnswer: `### Text blocks (Java 15)
A multi-line string literal delimited by \`"""\`. No escaping of embedded quotes, no \`\\n\`, and the code reads like the thing it produces — which for SQL and JSON is a genuine readability win.

### Incidental whitespace — the rule people get wrong
The compiler determines **minimal common indentation** across all non-blank lines **and the closing delimiter**, then strips it. That makes the position of the closing \`"""\` significant:
* Closing delimiter on its own line at the same indentation as the content → that indentation is stripped, and a trailing newline is included.
* Closing delimiter at column 0 → nothing is stripped, so you keep the leading spaces.
* Put the closing \`"""\` on the **same line** as the last content to omit the trailing newline.

Escapes available inside: \`\\\` (line continuation, joins lines with no newline) and \`\\s\` (a space that prevents trailing-space stripping).

### Interpolation
Java has **no string interpolation** today. String Templates were previewed (JEP 430/459/465) and then **withdrawn** for redesign, so do not claim they are available. Use \`formatted()\` (the instance form of \`String.format\`) on a text block, which reads well.

### String building costs
* \`"a" + b + "c"\` in a **single expression** is compiled to an efficient concatenation via \`invokedynamic\` and \`StringConcatFactory\` (Java 9+), which builds the result in one pass. This is fast — the old advice to always use \`StringBuilder\` is obsolete for single expressions.
* Concatenation **in a loop** is still quadratic: each iteration allocates a new string. Use \`StringBuilder\` explicitly, or \`Collectors.joining\`.
* For logging, use **parameterised messages** (\`log.debug("id={} state={}", id, state)\`) so the string is never built when the level is disabled. Concatenating in a hot loop's log call is wasted work even when nothing is logged.
* \`String.join\`, \`StringJoiner\` and \`Collectors.joining\` cover the delimiter cases cleanly.

### Related modern string API
\`isBlank\`, \`strip\` (unicode-aware, unlike \`trim\`), \`lines()\` (returns a stream), \`repeat(n)\`, \`formatted(...)\`, \`transform(fn)\`, and \`chars()\` returning an \`IntStream\`.

### One caution
A text block full of SQL is still SQL — it does **not** make string-built queries safe. Parameter placeholders are still mandatory.`,
    codeSnippet: `// Readable, no escaping, no \\n
String sql = """
        SELECT o.id, o.total, c.name
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
         WHERE o.status = ?
           AND o.created_at >= ?
         ORDER BY o.created_at DESC
        """;

// No interpolation in Java: use formatted()
String msg = """
        Order %s failed for tenant %s after %d attempts.
        """.formatted(orderId, tenantId, attempts);

// Logging: parameterised, so nothing is built when DEBUG is off
log.debug("processing order={} tenant={}", orderId, tenantId);`,
    pitfalls: [
      'Misplacing the closing delimiter and getting unexpected indentation or a trailing newline.',
      'Claiming String Templates are available — they were withdrawn from preview.',
      'Using StringBuilder for a single concatenation expression, where the compiler is already optimal.',
      'Believing a text block makes concatenated SQL safe from injection.'
    ],
    followUpQuestions: [
      'How does StringConcatFactory make single-expression concatenation fast?',
      'What is the difference between trim() and strip()?',
      'When does a text block include a trailing newline and how do you suppress it?'
    ],
    faangFocus: 'A light modern-Java question, but the incidental-whitespace rule and the withdrawn-templates fact both catch people out.'
  },
  {
    id: 'mod-10',
    categoryId: 'modern',
    title: 'The Java Module System in Practice',
    difficulty: 'Hard',
    tags: ['JPMS', 'Modules', 'Encapsulation', 'jlink'],
    scenario: 'An upgrade from Java 8 to 21 fails with `InaccessibleObjectException` from a serialization library, and a build that adds `--add-opens` flags everywhere "to make it work".',
    question: 'Explain JPMS: strong encapsulation, the classpath vs module path, why the error occurs, and what the right long-term fix is.',
    idealAnswer: `### What JPMS added
Java 9's module system introduced:
* **Strong encapsulation** — a package is only accessible if the module \`exports\` it. \`public\` no longer means universally reachable.
* **Explicit dependencies** — \`requires\` declarations, verified at startup, so missing dependencies fail immediately rather than with a \`NoClassDefFoundError\` deep into execution.
* **Reliable configuration** — no split packages, no cyclic module dependencies.

### The two paths
* **Classpath** — everything lands in the *unnamed module*, which reads everything and exports everything. This is why most applications never see JPMS at all.
* **Module path** — jars with a \`module-info.class\` become **named modules**; jars without one become **automatic modules** (name derived from the filename or the \`Automatic-Module-Name\` manifest entry), which read everything and export all their packages.

**The JDK itself is always modularised**, regardless of which path your code uses. That is why you feel JPMS even on the classpath.

### Why InaccessibleObjectException happens
Serialization, ORM and DI libraries use **deep reflection** — \`setAccessible(true)\` on private members of classes they do not own. JDK modules do not \`opens\` their internals, so this now throws. Java 9-16 permitted it with a warning (\`--illegal-access=permit\`); **from Java 17 it is denied by default**, which is why the upgrade surfaced it.

### export vs open
* \`exports p\` — compile-time and runtime access to *public* types in \`p\`.
* \`opens p\` — **deep reflective** access at runtime to everything in \`p\`, including private members. This is what reflection-based frameworks need.
* \`open module\` — opens every package.
* Qualified forms (\`exports p to m\`) restrict the audience.

### The right fix
* If the target is **your own code**: add \`opens com.acme.model to com.fasterxml.jackson.databind;\` — a precise, declared grant, visible in \`module-info.java\`, rather than a build flag nobody understands later.
* If the target is a **JDK internal**: \`--add-opens\` is a temporary bridge. The real fix is upgrading the offending library to a version that no longer needs it, or replacing it. Treat every \`--add-opens\` as technical debt with an owner.
* Prefer libraries that avoid deep reflection: constructor-binding (records), or compile-time code generation.

### The pragmatic reality
Most applications run on the classpath and will continue to. JPMS pays off for **library and platform authors** who want real encapsulation, and for \`jlink\`, which builds a minimal runtime image containing only required modules — valuable for container size and startup. \`jdeps\` is the tool for discovering what your code actually requires and where it touches internal APIs.`,
    codeSnippet: `module com.acme.orders {
    requires spring.core;
    requires com.fasterxml.jackson.databind;

    exports com.acme.orders.api;                    // public API

    // Deep reflection, granted precisely, declared in code
    opens com.acme.orders.model to com.fasterxml.jackson.databind;
}

# Temporary bridge for a library reaching into JDK internals — track it as debt
--add-opens java.base/java.lang=ALL-UNNAMED

# Find what you actually depend on, and what touches internal APIs
jdeps --multi-release 21 --print-module-deps app.jar
jlink --add-modules $(jdeps --print-module-deps app.jar) --output runtime`,
    pitfalls: [
      'Adding blanket --add-opens flags and never removing them.',
      'Confusing exports (public API) with opens (deep reflection).',
      'Assuming automatic module names are stable — derived names change if the filename changes.',
      'Expecting split packages to work; JPMS forbids them.'
    ],
    followUpQuestions: [
      'What is an automatic module and why is relying on a derived name risky?',
      'How does jlink reduce runtime size and startup time?',
      'Why did Java 17 change the default from permit to deny for illegal reflective access?'
    ],
    faangFocus: 'Upgrade-migration questions are common as companies move off Java 8 and 11. Knowing opens vs exports precisely is the differentiator.'
  },
  {
    id: 'mod-11',
    categoryId: 'modern',
    title: 'Choosing a JDK and Managing Upgrades',
    difficulty: 'Solid',
    tags: ['LTS', 'JDK', 'Upgrade', 'Deprecation'],
    scenario: 'A company runs Java 8 in production. Leadership asks what upgrading buys, what the risks are, and which distribution to standardise on.',
    question: 'Explain the release cadence and LTS model, the significant changes between 8 and 21+, and how you would run the migration.',
    idealAnswer: `### The release model
Since Java 9, a feature release every **six months**, with **LTS** releases receiving extended updates. Java 8, 11, 17 and 21 are LTS; 25 is the next in that line. Non-LTS releases are fine for experimentation but not for production standardisation.

**Preview features** (enabled with \`--enable-preview\`) may change or be withdrawn — String Templates were withdrawn, which is the cautionary example. **Incubator modules** are similar for APIs. Never depend on either in production code.

### Distributions
The OpenJDK sources are shared; distributions differ in support, build cadence and extras: Eclipse Temurin (Adoptium), Amazon Corretto, Azul Zulu, Red Hat, Microsoft, Oracle JDK, GraalVM. Choose on **support commitment and security-patch cadence**, and standardise one across all environments. Note Oracle's licensing has changed repeatedly — if it matters, verify current terms rather than relying on memory.

### What 8 → 21 actually buys
* **GC**: G1 as default, plus ZGC and Shenandoah with sub-millisecond pauses. Generational ZGC in 21. For most services this alone justifies the move.
* **Virtual threads (21)** — high concurrency without a rewrite.
* **Language**: \`var\`, records, sealed types, pattern matching for \`switch\`, text blocks, enhanced \`instanceof\`.
* **Container awareness** — Java 8 early builds ignored cgroup limits and sized the heap from the host, a very common source of OOM-kills. Fixed from 8u191/10 onwards.
* **Performance**: compact strings, better \`String\` concat, stronger JIT, faster startup with CDS.
* **APIs**: \`HttpClient\`, \`Optional\` improvements, collection factories, \`Files.readString\`, \`Stream.toList\`.
* **Security**: modern TLS and current cryptographic defaults.

### The migration risks
* **Removed internals** — \`sun.misc.Unsafe\` usage, \`JAXB\`/\`JAX-WS\` (removed in 11), \`javax.*\` → \`jakarta.*\` for anything Jakarta EE (this is usually the biggest single item, and it is a **library** migration, not a JDK one).
* **Strong encapsulation** from 17 breaking deep reflection in older libraries.
* **Removed GC options and flags** — a JVM that will not start because of a legacy flag is a common first hurdle.
* **Bytecode-manipulating libraries** (older ASM, Byte Buddy, CGLIB, mocking frameworks) that do not understand newer class-file versions.
* Default charset changed to UTF-8 in 18, which can change file-reading behaviour.

### How to run it
1. **Compile and run on the new JDK with \`--release 8\` bytecode first.** Decouple "runs on 21" from "uses 21 features".
2. Upgrade libraries **before** the JDK; most breakage is library breakage.
3. Use \`jdeps --jdk-internals\` to find internal API usage up front.
4. Move one low-risk service first, with good observability, and compare GC and latency before/after.
5. Only then adopt new language features, and set \`maven.compiler.release\` deliberately.
6. Automate: a CI job building against the next LTS continuously means the next upgrade is routine rather than a project.`,
    codeSnippet: `<!-- Run on 21, still emit 17-compatible bytecode during migration -->
<properties>
  <maven.compiler.release>17</maven.compiler.release>
</properties>

# Find internal-API usage before you start
jdeps --jdk-internals --multi-release 21 target/app.jar

# Container awareness (default on modern JDKs) — verify it is active
java -XX:+PrintFlagsFinal -version | grep -i MaxRAMPercentage
java -XX:MaxRAMPercentage=75 -XX:+UseZGC -XX:+ZGenerational -jar app.jar`,
    pitfalls: [
      'Upgrading the JDK before upgrading libraries.',
      'Relying on preview or incubator features in production.',
      'Assuming javax → jakarta is part of the JDK upgrade rather than a separate library migration.',
      'Missing that older Java 8 builds ignore container memory limits.'
    ],
    followUpQuestions: [
      'What does --release do that -source/-target does not?',
      'How would you compare GC behaviour before and after the upgrade objectively?',
      'What is the practical risk of standardising on a non-LTS release?'
    ],
    faangFocus: 'A pragmatic question for senior engineers expected to lead platform work. "Upgrade libraries first, decouple runtime from bytecode level" is the answer that shows you have done it.'
  },
  {
    id: 'mod-12',
    categoryId: 'modern',
    title: 'var, Local Type Inference and Readability',
    difficulty: 'Core',
    tags: ['var', 'Type Inference', 'Readability', 'Java 10'],
    scenario: 'A code review is split: one group wants `var` everywhere, another has banned it. A bug appears where `var result = compute();` silently changed type after a refactor and a caller broke downstream.',
    question: 'Explain what var does and does not do, and give a defensible policy for when to use it.',
    idealAnswer: `### What var is
**Local variable type inference** (Java 10). The compiler infers the declared type from the initialiser. It is:
* **Static typing, fully preserved.** The variable has a definite type; \`var\` is not \`Object\` and not dynamic typing. There is zero runtime difference.
* **Local only** — local variables, \`for\`/enhanced-for indices, and try-with-resources. Never fields, method parameters, or return types.
* Requires an initialiser, and cannot be initialised with \`null\` or a lambda/method reference (there is no target type to infer from).

### The subtlety that caused the bug
\`var\` infers the **most specific** type of the initialiser expression, including non-denotable types like an anonymous class or an intersection type. And because the type follows the initialiser, **changing the method's return type silently changes the variable's type**. That is a feature for local refactoring and a hazard when the variable is passed onward.

Also note: \`var x = 1;\` is \`int\`, and \`var list = new ArrayList<>();\` infers \`ArrayList<Object>\` — a common surprise.

### A defensible policy
Use \`var\` when the type is **already obvious from the right-hand side** and the name of the variable carries the meaning:
* \`var users = new ArrayList<User>();\` — the type is right there.
* \`var entry = map.entrySet().iterator().next();\` — the explicit type is noise.
* \`try (var in = Files.newInputStream(path))\`
* Long generic types where the declaration is unreadable.

Avoid \`var\` when it removes information the reader needs:
* \`var result = service.process(x);\` — the reader cannot tell what \`result\` is. Either name the variable better or write the type.
* Numeric literals where the width matters (\`var count = 0;\` is \`int\`, not \`long\`).
* When you *want* the interface type rather than the implementation: \`List<String> l = new ArrayList<>();\` expresses intent that \`var\` erases.
* Chained/fluent expressions whose type is genuinely non-obvious.

### The principle
\`var\` trades explicit type information for less visual noise. That is a good trade when the type is obvious and a bad one when it is not. **Optimise for the reader**, not the writer — and remember that most code is read in a diff view or on a phone, where an IDE cannot tell you the inferred type.

The official OpenJDK style guide says essentially this, and citing it settles most team arguments.`,
    codeSnippet: `// Good: type is obvious, name carries meaning
var orders = new ArrayList<Order>();
var byRegion = new HashMap<String, List<Order>>();
try (var reader = Files.newBufferedReader(path)) { ... }

// Bad: reader cannot tell what this is
var result = service.process(input);

// Surprising inferences
var i = 1;                       // int, not long
var list = new ArrayList<>();    // ArrayList<Object>
var x = new Object() { int n; }; // non-denotable anonymous type

// Intent lost: var cannot express "I want the interface here"
List<String> names = new ArrayList<>();`,
    pitfalls: [
      'Believing var makes Java dynamically typed or has runtime cost.',
      'Using var where the initialiser is an opaque method call.',
      'Not noticing var infers the concrete class rather than an interface.',
      'Assuming var x = 0 is a long when it is an int.'
    ],
    followUpQuestions: [
      'Why can var not be used for fields or method parameters?',
      'What is a non-denotable type and how can var expose one?',
      'How does var interact with the diamond operator and generic inference?'
    ],
    faangFocus: 'A style question that reveals how a candidate thinks about readability and team conventions — often more informative than a hard technical question.'
  },
  {
    id: 'mod-13',
    categoryId: 'modern',
    title: 'CompletableFuture Composition and Error Handling',
    difficulty: 'Hard',
    tags: ['CompletableFuture', 'Async', 'Composition', 'Executor'],
    scenario: 'An async pipeline chains `thenApply` calls, one of which performs a blocking database call. Exceptions in the middle of the chain vanish silently, and under load the whole application becomes unresponsive.',
    question: 'Explain CompletableFuture\'s execution model, the difference between the method families, and how errors propagate. Where does structured concurrency fit now?',
    idealAnswer: `### Which thread runs what
This is the most misunderstood part.
* **\`thenApply(fn)\`** — may run \`fn\` on the thread that **completed** the previous stage, or on the calling thread if the stage is already complete. You do not control it.
* **\`thenApplyAsync(fn)\`** — runs on the **common ForkJoinPool** by default.
* **\`thenApplyAsync(fn, executor)\`** — runs on **your** executor. This is the form to prefer in application code.

The blocking database call therefore runs on whichever thread happened to complete the previous stage — frequently a common-pool thread. Blocking the common pool starves every other user of it in the JVM, which is why the application becomes unresponsive. **Always pass an explicit executor for anything that can block.**

### The three families
* \`thenApply\` — transform the value: \`T -> U\`.
* \`thenCompose\` — **flatMap**: \`T -> CompletionStage<U>\`. Using \`thenApply\` here gives you a nested \`CompletableFuture<CompletableFuture<U>>\`.
* \`thenCombine\` — join two independent futures.
* \`allOf\` / \`anyOf\` — wait for many; note \`allOf\` returns \`CompletableFuture<Void>\`, so you must gather results yourself.

### Error propagation — why exceptions vanish
An exception completes the stage **exceptionally**, and every downstream \`thenApply\` is **skipped**. If nothing ever consumes the result — no \`join\`, no \`get\`, no \`exceptionally\`, no \`whenComplete\` — the failure is silently discarded. There is no equivalent of an uncaught-exception handler for an unconsumed future.

Handling:
* \`exceptionally(fn)\` — recover with a fallback value.
* \`handle((v, e) -> ...)\` — see both outcomes and transform.
* \`whenComplete((v, e) -> ...)\` — observe without changing the result; good for logging and metrics.
* \`exceptionallyCompose\` (Java 12+) — recover with another async call.

Exceptions are wrapped in \`CompletionException\`, so unwrap the cause before matching on type.

### Other traps
* \`cancel(true)\` does **not** interrupt the running computation — it only completes the future exceptionally. There is no cancellation propagation.
* \`join()\` throws unchecked \`CompletionException\`; \`get()\` throws checked \`ExecutionException\`.
* Timeouts: \`orTimeout\` and \`completeOnTimeout\` (Java 9+) — but the underlying work still runs.

### Where structured concurrency fits
For **request-scoped fan-out**, \`StructuredTaskScope\` is now the better tool: real cancellation, guaranteed cleanup, readable stack traces, and ordinary try/catch. \`CompletableFuture\` remains valuable for **composing** long-lived or event-driven pipelines, and for interoperating with async client libraries that return it. Knowing which to reach for — and saying that CompletableFuture is no longer the default for fan-out — is the current-best answer.`,
    codeSnippet: `// Blocking work on an unspecified thread — often the common pool
future.thenApply(id -> repo.load(id));            // wrong

// Explicit executor, and thenCompose for a stage that returns a future
CompletableFuture<Order> f = fetchId(req)
        .thenComposeAsync(id -> loadOrderAsync(id), dbExecutor)
        .thenApplyAsync(this::enrich, cpuExecutor)
        .orTimeout(2, TimeUnit.SECONDS)
        .exceptionally(e -> {
            Throwable cause = e instanceof CompletionException ? e.getCause() : e;
            metrics.count("order.load.failed", cause.getClass().getSimpleName());
            return Order.unavailable();
        });

// A future nobody consumes swallows its exception entirely
loadAsync(id);   // silent failure`,
    pitfalls: [
      'Blocking on the common ForkJoinPool via thenApply/thenApplyAsync without an executor.',
      'Using thenApply where thenCompose is needed, producing nested futures.',
      'Never consuming a future, so exceptions disappear.',
      'Believing cancel(true) interrupts the running task.'
    ],
    followUpQuestions: [
      'Why does thenApply sometimes run on the caller thread?',
      'How do you aggregate results from allOf, given it returns CompletableFuture<Void>?',
      'When is CompletableFuture still preferable to StructuredTaskScope?'
    ],
    faangFocus: 'A long-standing senior question. The "which thread runs this" answer, plus naming structured concurrency as the modern alternative, is the complete response.'
  },
];
