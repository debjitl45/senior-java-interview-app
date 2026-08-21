import type { Question } from '../types';

export const STREAMS_QUESTIONS: Question[] = [
  {
    id: 'str-1',
    categoryId: 'streams',
    title: 'Laziness, Terminal Operations and Short-Circuiting',
    difficulty: 'Core',
    tags: ['Streams', 'Laziness', 'Terminal Operation'],
    scenario: 'A developer writes a pipeline with `filter` and `map` containing debug `println` calls, but nothing is printed. They add `.count()` and only the filter output appears. On another list, adding `.findFirst()` prints just one line.',
    question: 'Explain stream laziness, the intermediate/terminal split, short-circuiting, and why `count()` can skip `map` entirely.',
    idealAnswer: `### Nothing runs without a terminal operation
Intermediate operations (\`filter\`, \`map\`, \`sorted\`, \`peek\`, \`limit\`) only **build a pipeline description**. No element moves until a **terminal** operation (\`collect\`, \`forEach\`, \`count\`, \`reduce\`, \`findFirst\`, \`anyMatch\`) pulls on it. A pipeline with no terminal is dead code.

### Elements flow vertically, not horizontally
This surprises people. Streams do **not** run \`filter\` over the whole list then \`map\` over the whole list. Each element is pushed through the entire chain before the next one starts. That is what makes short-circuiting and infinite streams possible.

### Short-circuiting
\`findFirst\`, \`findAny\`, \`anyMatch\`, \`allMatch\`, \`noneMatch\`, \`limit\` and \`takeWhile\` stop pulling as soon as the answer is determined. Hence one printed line: one element satisfied the pipeline and the stream stopped.

### Why count() can skip map()
Since Java 9, \`count()\` may **elide the entire pipeline** if it can compute the size directly from a SIZED spliterator and no operation changes the count. \`map\` is 1:1 and side-effect-free by contract, so it is skipped. This is exactly why \`peek\` and \`map\` must never be used for side effects — the JDK is allowed to not run them.

\`filter\` changes the count, so it cannot be elided, which is why its output still appeared.

### The rule this teaches
Stream operations must be **non-interfering** (not modify the source) and **stateless / side-effect-free**. \`peek\` exists for debugging only, and even then it is not guaranteed to run.`,
    codeSnippet: `// Prints nothing: no terminal operation
list.stream().filter(x -> { System.out.println(x); return x > 2; });

// Java 9+: may print nothing at all — map is elided
long n = list.stream().map(this::log).count();

// Correct: do work in the terminal operation
list.forEach(this::log);`,
    pitfalls: [
      'Believing each stage runs to completion before the next starts.',
      'Using peek() or map() for side effects and relying on them running.',
      'Forgetting that a stream is single-use — reusing one throws IllegalStateException.',
      'Assuming count() always traverses the stream.'
    ],
    followUpQuestions: [
      'Why is a Stream not reusable, unlike an Iterable?',
      'What does "non-interfering" mean, and what happens if you mutate the source mid-stream?',
      'How does takeWhile differ from filter on an ordered stream?'
    ],
    faangFocus: 'A quick filter question in phone screens. The count()-elides-map detail is a strong Java 9+ awareness signal.'
  },
  {
    id: 'str-2',
    categoryId: 'streams',
    title: 'Collectors: groupingBy, partitioningBy and Downstream Composition',
    difficulty: 'Solid',
    tags: ['Collectors', 'groupingBy', 'Downstream'],
    scenario: 'You must turn a `List<Order>` into: total revenue per region, then per region a map of status to order count, and finally the highest-value order per customer.',
    question: 'Write these with Collectors and explain how downstream collectors compose. When is `toMap` the wrong choice?',
    idealAnswer: `### Downstream composition is the whole idea
\`groupingBy(classifier, downstream)\` runs the downstream collector on each group. Because downstreams are themselves collectors, they nest arbitrarily — this is how you build multi-level aggregations without loops.

* \`summingDouble\`, \`averagingInt\`, \`counting\` — numeric reductions per group.
* \`mapping(fn, downstream)\` — transform elements before collecting them.
* \`filtering(pred, downstream)\` (Java 9+) — keeps empty groups, unlike filtering before \`groupingBy\`, which drops them. This distinction matters more than people expect.
* \`flatMapping\`, \`teeing\` (Java 12+, run two collectors and merge), \`collectingAndThen\` (post-process, e.g. to wrap in an unmodifiable view).
* \`reducing\` / \`maxBy\` — returns \`Optional\`, so pair it with \`collectingAndThen\` to unwrap.

### partitioningBy
A specialisation for a boolean classifier. It returns a \`Map<Boolean, T>\` that **always contains both keys**, even when a partition is empty — \`groupingBy\` would omit the empty one. It is also faster, since it can use a two-element array internally.

### When toMap is wrong
\`toMap\` throws \`IllegalStateException\` on duplicate keys. That is a good default — it surfaces a bad assumption loudly — but you must supply a merge function whenever collisions are possible. Also note the four-arg overload lets you choose the map implementation (e.g. \`TreeMap::new\`, or \`ConcurrentHashMap::new\` for \`toConcurrentMap\`).

\`toMap\` also **throws NPE on null values**, unlike \`HashMap\`. If your values can be null, use \`groupingBy\` with a downstream, or \`Collectors.reducing\`.`,
    codeSnippet: `// Revenue per region
Map<String, Double> revenue = orders.stream().collect(
        groupingBy(Order::region, summingDouble(Order::total)));

// Two-level: region -> status -> count
Map<String, Map<Status, Long>> byRegionStatus = orders.stream().collect(
        groupingBy(Order::region, groupingBy(Order::status, counting())));

// Best order per customer, unwrapped from Optional
Map<String, Order> best = orders.stream().collect(
        groupingBy(Order::customerId,
                collectingAndThen(maxBy(comparingDouble(Order::total)), Optional::get)));

// toMap with a merge function — required if ids can repeat
Map<String, Order> byId = orders.stream()
        .collect(toMap(Order::id, o -> o, (a, b) -> b));`,
    pitfalls: [
      'Using toMap without a merge function on data that can contain duplicate keys.',
      'Not knowing toMap throws NPE on null values while HashMap tolerates them.',
      'Filtering before groupingBy when you need empty groups preserved.',
      'Leaving Optional in the map value type instead of using collectingAndThen.'
    ],
    followUpQuestions: [
      'What does Collectors.teeing do and when is it cleaner than two passes?',
      'How does groupingByConcurrent differ, and what does it require of the stream?',
      'Why does partitioningBy always return both keys?'
    ],
    faangFocus: 'Data-heavy backend teams ask candidates to build a two-level aggregation live. Fluency with downstream collectors is a clear seniority marker.'
  },
  {
    id: 'str-3',
    categoryId: 'streams',
    title: 'When parallelStream() Makes Things Slower',
    difficulty: 'Hard',
    tags: ['Parallel Streams', 'ForkJoinPool', 'NQ Model'],
    scenario: 'A team adds `.parallel()` to a stream that performs a REST call per element, across 50 elements. Latency gets worse and unrelated parts of the application start stalling.',
    question: 'Explain both failures. What conditions must hold for parallel streams to pay off, and how do you reason about it quantitatively?',
    idealAnswer: `### Failure 1: the common ForkJoinPool is shared
\`parallelStream()\` uses \`ForkJoinPool.commonPool()\`, sized to \`availableProcessors() - 1\`. Blocking IO occupies those threads for the whole call, and every other user of the common pool in the JVM — including other parallel streams and \`CompletableFuture\` default execution — starves. That is why unrelated code stalls.

Parallel streams are designed for **CPU-bound** work. They have no mechanism for blocking calls. (\`ManagedBlocker\` exists but is awkward and rarely the right tool.)

### Failure 2: 50 elements is far below the threshold
The classic heuristic is the **NQ model**: parallelism pays off when \`N × Q\` is large, where N is the number of elements and Q is the cost per element. The fixed overhead — splitting the spliterator, submitting tasks, fork/join bookkeeping, and merging results — is on the order of tens of microseconds. Below roughly 10,000 cheap elements it is almost never worth it.

### What must be true for parallel to win
1. **Splittable source.** \`ArrayList\`, arrays and \`IntStream.range\` split in O(1). \`LinkedList\`, \`Stream.iterate\` and IO-backed sources split terribly.
2. **CPU-bound, independent work** with no shared mutable state and no locks.
3. **Cheap merge.** \`toList\` and \`summingInt\` merge cheaply; \`groupingBy\` into a \`HashMap\` merges expensively (use \`groupingByConcurrent\` with an unordered stream instead).
4. **Enough elements** to amortise the overhead.
5. **No order dependence** — \`findFirst\`, \`limit\` and \`sorted\` all cost extra in parallel because encounter order must be preserved.

### The right fix for this scenario
For 50 blocking REST calls, use a dedicated executor with an appropriate thread count — or on Java 21+, virtual threads with \`StructuredTaskScope\`, which handles thousands of concurrent blocking calls without pool starvation. Parallel streams are simply the wrong tool.

### Always measure
Benchmark with **JMH**, not \`System.nanoTime\` in a loop. Parallel stream benchmarks are especially prone to warm-up and dead-code-elimination artefacts.`,
    codeSnippet: `// Wrong: blocks the shared common pool, 50 elements is far too few
List<Response> rs = urls.parallelStream().map(http::get).toList();

// Right on Java 21+: virtual threads, one per call, no pool starvation
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    List<StructuredTaskScope.Subtask<Response>> tasks =
            urls.stream().map(u -> scope.fork(() -> http.get(u))).toList();
    scope.join().throwIfFailed();
    List<Response> rs = tasks.stream().map(Subtask::get).toList();
}`,
    pitfalls: [
      'Using parallel streams for blocking IO.',
      'Not knowing the common pool is shared JVM-wide.',
      'Parallelising a LinkedList or Stream.iterate source, which cannot split efficiently.',
      'Using a stateful lambda or a shared mutable accumulator inside a parallel stream.'
    ],
    followUpQuestions: [
      'How would you run a parallel stream on your own ForkJoinPool, and why is that a hack?',
      'Why does groupingByConcurrent require an unordered stream to be fast?',
      'What is ManagedBlocker and why is it rarely the right answer?'
    ],
    faangFocus: 'Interviewers plant .parallelStream() in a code review to see if you flag the common-pool and IO issues. Naming the NQ model shows you have thought about it quantitatively.'
  },
  {
    id: 'str-4',
    categoryId: 'streams',
    title: 'Optional: Intended Use and Common Abuse',
    difficulty: 'Core',
    tags: ['Optional', 'Null Safety', 'API Design'],
    scenario: 'A code review turns up `Optional<List<User>>` fields on an entity, `Optional` parameters on service methods, and `if (opt.isPresent()) { opt.get() }` chains throughout.',
    question: 'Explain what Optional was designed for and critique each of these usages. What are the idiomatic alternatives?',
    idealAnswer: `### What Optional is for
Brian Goetz has stated the design intent plainly: \`Optional\` is a **return type** for methods that may have nothing to return, giving the caller a compiler-visible reminder to handle absence. It was never intended as a general-purpose null replacement.

### Critique of each usage
* **\`Optional\` as a field** — it is not \`Serializable\`, it adds an object per field, and frameworks (JPA, Jackson) handle it inconsistently. Use a nullable field with \`@Nullable\`, and return \`Optional\` from the getter if you want.
* **\`Optional\` as a parameter** — forces every caller to wrap, and callers can still pass \`null\`, so you gain nothing and now have three states: null, empty, present. Use method overloads instead.
* **\`Optional<List<T>>\`** — always wrong. Return an **empty list**. "No results" is naturally expressed by an empty collection; \`Optional\` here creates two ways to say nothing.
* **\`isPresent()\` / \`get()\`** — this is just a null check with more ceremony, and \`get()\` is the one method that can throw. Java 10 renamed it \`orElseThrow()\` for exactly this reason.

### The idiomatic style
Chain: \`map\`, \`flatMap\`, \`filter\`, then terminate with \`orElse\`, \`orElseGet\`, \`orElseThrow\` or \`ifPresentOrElse\`.

\`orElse\` vs \`orElseGet\` matters: \`orElse(expensive())\` **always evaluates** its argument, even when the value is present. Use \`orElseGet(this::expensive)\` for anything non-trivial.

Java 9 added \`or()\` (fall back to another Optional), \`stream()\` (flatten into a stream), and \`ifPresentOrElse\`.

### The honest caveat
\`Optional\` allocates. On a genuinely hot path, a nullable return with a documented contract can be the right engineering call — but that should be a measured decision, not the default.`,
    codeSnippet: `// Ceremony, not safety
if (repo.findById(id).isPresent()) {
    User u = repo.findById(id).get();   // and a second query!
}

// Idiomatic
String city = repo.findById(id)
        .map(User::address)
        .map(Address::city)
        .filter(c -> !c.isBlank())
        .orElseThrow(() -> new UserNotFound(id));

// orElse evaluates eagerly; orElseGet does not
config.orElse(loadDefaults());       // loadDefaults() ALWAYS runs
config.orElseGet(this::loadDefaults); // runs only if empty`,
    pitfalls: [
      'Returning Optional<Collection> instead of an empty collection.',
      'Using Optional for fields or parameters.',
      'Using orElse() with an expensive or side-effecting expression.',
      'Calling get() without isPresent, or writing isPresent/get chains instead of map.'
    ],
    followUpQuestions: [
      'Why is Optional not Serializable, and what does that mean for DTOs?',
      'What does Optional.stream() enable in a stream pipeline?',
      'When is returning null defensible over returning Optional?'
    ],
    faangFocus: 'API-design and code-review rounds lean on this. Quoting the "return type only" design intent and the orElse/orElseGet distinction reads as genuinely senior.'
  },
  {
    id: 'str-5',
    categoryId: 'streams',
    title: 'flatMap, mapMulti and Flattening Nested Data',
    difficulty: 'Solid',
    tags: ['flatMap', 'mapMulti', 'Nested Data'],
    scenario: 'You have `List<Order>` where each order has `List<LineItem>`, and each line item has an optional discount code. You need every distinct discount code across all orders, plus a count of line items per SKU.',
    question: 'Solve it, and explain how `flatMap` differs from `map`. When is Java 16\'s `mapMulti` a better choice?',
    idealAnswer: `### map vs flatMap
* \`map\` is **1:1** — \`Stream<Order>\` → \`Stream<List<LineItem>>\`. You end up with a stream of collections.
* \`flatMap\` is **1:many** — the function returns a \`Stream\`, and the results are concatenated into one flat stream. \`Stream<Order>\` → \`Stream<LineItem>\`.

The key subtlety: \`flatMap\` **closes each inner stream** after consuming it, so you may return a fresh stream per element without leaking. But it is also why an inner stream that is expensive to create is expensive per element.

### Optional flattening
\`Optional.stream()\` (Java 9) turns \`Optional<T>\` into a zero-or-one stream, so \`flatMap(Optional::stream)\` cleanly drops empties. This is much nicer than \`filter(Optional::isPresent).map(Optional::get)\`.

### Where mapMulti wins (Java 16+)
\`mapMulti\` is a **push** alternative: instead of returning a stream, your function receives a \`Consumer\` and pushes zero or more results into it. It is better when:
* The mapping usually produces **zero or one** element — you skip allocating a \`Stream\` object per element.
* The results are produced imperatively (recursive traversal, parsing) and building a stream would be awkward.

The trade-off is that \`mapMulti\` gives the pipeline less information — it cannot be sized or split as well — so \`flatMap\` remains the default for genuinely 1:many transformations over collections.

### Deep flattening
For an arbitrarily nested tree, \`flatMap\` handles one level. Recursion or \`Stream.iterate\` with a work queue handles the rest; \`mapMulti\` is often cleanest here because you can push recursively.`,
    codeSnippet: `// Distinct discount codes across all orders
Set<String> codes = orders.stream()
        .flatMap(o -> o.lineItems().stream())
        .map(LineItem::discountCode)
        .flatMap(Optional::stream)      // drops empties cleanly
        .collect(toSet());

// Count per SKU
Map<String, Long> perSku = orders.stream()
        .flatMap(o -> o.lineItems().stream())
        .collect(groupingBy(LineItem::sku, counting()));

// mapMulti: no Stream allocated when there is no code
Stream<String> codes2 = items.stream().<String>mapMulti((item, out) ->
        item.discountCode().ifPresent(out));`,
    pitfalls: [
      'Using map where flatMap is needed and ending up with Stream<List<T>>.',
      'Writing filter(Optional::isPresent).map(Optional::get) instead of flatMap(Optional::stream).',
      'Returning a null Stream from the flatMap function instead of Stream.empty().',
      'Reaching for mapMulti on genuinely 1:many data, losing sizing information for no gain.'
    ],
    followUpQuestions: [
      'Why does flatMap close each inner stream, and when does that matter?',
      'How does flatMap interact with short-circuiting operations like findFirst?',
      'How would you flatten a recursive tree structure into a stream?'
    ],
    faangFocus: 'flatMap fluency is assumed at senior level. Knowing mapMulti and why it exists signals you track the language beyond Java 8.'
  },
  {
    id: 'str-6',
    categoryId: 'streams',
    title: 'reduce vs collect: Mutable vs Immutable Reduction',
    difficulty: 'Hard',
    tags: ['reduce', 'collect', 'Associativity', 'Parallel'],
    scenario: 'A candidate concatenates strings with `reduce("", String::concat)` over 100,000 elements and it takes seconds. They then try `reduce(new StringBuilder(), StringBuilder::append, StringBuilder::append)` in a parallel stream and get corrupted output.',
    question: 'Explain both problems. What is the difference between reduction and mutable reduction, and what invariants must the arguments satisfy?',
    idealAnswer: `### Problem 1: quadratic string concatenation
\`reduce("", String::concat)\` is an **immutable reduction**: each step allocates a brand-new string containing everything so far. For n elements of average length L that is O(n²L) copying. It is correct but pathologically slow.

The right tool is \`Collectors.joining()\`, which is a **mutable reduction** — one \`StringBuilder\` per thread, appended to in place.

### Problem 2: mutable state in a reduce
The three-arg \`reduce(identity, accumulator, combiner)\` requires the accumulator to be **associative and non-interfering**, and critically the **identity must be a true identity**: \`accumulator(identity, x)\` must equal \`x\`.

A single \`StringBuilder\` instance as identity breaks this completely. In parallel, every split shares the *same* builder, threads append concurrently to an unsynchronised structure, and you get interleaved or corrupted output. The identity must be a *value*, not a shared mutable object.

### The distinction
* **\`reduce\`** — immutable reduction. Combines values into a new value. Requires associativity; the identity must satisfy the identity law. Fine for sums, maxes, and monoid-like operations.
* **\`collect\`** — mutable reduction. Takes a \`supplier\` (fresh container **per thread**), an \`accumulator\` (mutate container), and a \`combiner\` (merge two containers). Because the supplier creates a new container per split, there is no sharing and no corruption.

That supplier is the entire point: \`collect\` gets parallel safety by construction, \`reduce\` with a mutable identity does not.

### Practical guidance
* Accumulating into a container → \`collect\`.
* Folding values into a value → \`reduce\`.
* Strings → \`Collectors.joining\`.
* Numbers → \`IntStream.sum()\` / \`summingInt\`, which avoid boxing entirely.`,
    codeSnippet: `// O(n^2): allocates a new String per element
String s = names.stream().reduce("", String::concat);

// Mutable reduction: one builder per thread, merged at the end
String s = names.stream().collect(Collectors.joining(", ", "[", "]"));

// Broken in parallel: shared mutable identity
StringBuilder sb = list.parallelStream()
        .reduce(new StringBuilder(), StringBuilder::append, StringBuilder::append);

// Correct three-arg collect
StringBuilder sb = list.parallelStream()
        .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append);`,
    pitfalls: [
      'Using a mutable object as the reduce identity.',
      'Building strings with reduce/concat instead of joining().',
      'Supplying a non-associative accumulator (e.g. subtraction) and getting different results in parallel.',
      'Writing a combiner inconsistent with the accumulator, which only breaks in parallel.'
    ],
    followUpQuestions: [
      'Why must the accumulator be associative for parallel correctness, and what breaks if it is not?',
      'When is the combiner in a sequential collect() ever invoked?',
      'How does Collectors.joining avoid the quadratic behaviour internally?'
    ],
    faangFocus: 'A favourite for probing whether a candidate understands *why* streams parallelise safely, rather than just which method name to call.'
  },
  {
    id: 'str-7',
    categoryId: 'streams',
    title: 'Checked Exceptions Inside Lambdas',
    difficulty: 'Solid',
    tags: ['Lambdas', 'Exceptions', 'Functional Interfaces'],
    scenario: 'A stream calls a method that throws `IOException`. The code will not compile inside `map`. A teammate proposes wrapping every call in a try/catch that rethrows `RuntimeException`, losing the original type.',
    question: 'Explain why this happens and lay out the realistic strategies, with their trade-offs.',
    idealAnswer: `### Why it will not compile
\`Function<T, R>\` declares \`R apply(T t)\` with **no throws clause**. A lambda cannot throw a checked exception the target functional interface does not declare. Since the entire \`java.util.function\` package is declared without checked exceptions, no standard stream operation can propagate one.

This is a genuine language-level friction point, not a bug in your code.

### The realistic options

**1. Handle locally and produce a value.** Map to a result type — \`Optional\`, or a sealed \`Result<T>\` / \`Either\` — and let the pipeline carry both success and failure. This is the most honest approach and composes well:
\`\`\`
records.stream().map(this::tryParse).flatMap(Optional::stream)
\`\`\`

**2. Wrap in an unchecked exception, but preserve the cause.** \`throw new UncheckedIOException(e)\` is the JDK's own answer for IO — it is a real type that callers can catch and unwrap. Never wrap in a bare \`RuntimeException\`; that destroys the ability to handle it.

**3. A sneaky-throws helper.** A small utility with a \`@FunctionalInterface\` that declares \`throws Exception\`, adapted to \`Function\`. Clean at the call site, but it makes checked exceptions invisible to callers — use sparingly and document it.

**4. Do not use a stream.** A plain \`for\` loop handles checked exceptions naturally and is often the clearest code. Streams are not mandatory. This is a legitimate answer and a mature one.

### What to avoid
* Catching and swallowing — silently dropping failed records is how data-loss incidents start.
* Catching \`Exception\` broadly and rethrowing untyped.
* Collecting exceptions into a shared mutable list from a parallel stream.

### Aggregating failures
If you need every failure, partition into successes and failures explicitly, then decide. \`Collectors.teeing\` or \`partitioningBy\` over a \`Result\` type does this in one pass.`,
    codeSnippet: `// Does not compile
paths.stream().map(Files::readString).toList();

// 1. Result type — failures are data, not control flow
sealed interface Parsed permits Ok, Failed { }

Map<Boolean, List<Parsed>> byOutcome = paths.stream()
        .map(this::readSafely)
        .collect(partitioningBy(p -> p instanceof Ok));

// 2. JDK's own idiom: a real type, cause preserved
static String read(Path p) {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}`,
    pitfalls: [
      'Wrapping in a bare RuntimeException and losing the exception type.',
      'Swallowing the exception and silently dropping records.',
      'Collecting errors into a shared ArrayList from a parallel stream.',
      'Insisting on a stream when a for loop is clearly simpler.'
    ],
    followUpQuestions: [
      'Why does java.util.function declare no checked exceptions at all?',
      'How does a sneaky-throws helper work, and what does it break?',
      'How would you model this in a codebase that already uses a Result/Either type?'
    ],
    faangFocus: 'Practical code-review territory. The mature answer includes "sometimes a for loop is the right call", which surprises interviewers in a good way.'
  },
  {
    id: 'str-8',
    categoryId: 'streams',
    title: 'IntStream and the Boxing Tax',
    difficulty: 'Solid',
    tags: ['IntStream', 'Boxing', 'Performance', 'Primitives'],
    scenario: 'A hot aggregation sums a `List<Integer>` of 10 million elements with `stream().reduce(0, Integer::sum)`. A profiler shows heavy allocation and GC churn in a method that should allocate nothing.',
    question: 'Explain where the allocation comes from and how the primitive stream specialisations fix it. What are their limitations?',
    idealAnswer: `### Where the garbage comes from
\`Stream<Integer>\` carries **boxed** \`Integer\` objects. \`Integer::sum\` unboxes two, adds, and **boxes the result** — one fresh \`Integer\` allocation per element outside the −128..127 cache. Ten million elements means ten million short-lived objects, which is pure GC pressure for an operation that should be a register add.

### The fix
\`mapToInt(Integer::intValue).sum()\` switches to \`IntStream\`, which is backed by an \`int\` value stream with no boxing at all. The reduction happens in primitives end to end.

* \`IntStream\`, \`LongStream\`, \`DoubleStream\` are the three specialisations.
* \`mapToInt\` / \`mapToObj\` / \`boxed()\` move between the worlds.
* \`sum()\`, \`average()\`, \`max()\`, \`summaryStatistics()\` come free and allocate nothing meaningful.
* \`IntStream.range(0, n)\` is the idiomatic index loop and splits perfectly for parallelism.

\`summaryStatistics()\` is underused — one pass gives count, sum, min, max and average together.

### Limitations
* **Only three specialisations exist.** There is no \`CharStream\`, \`ShortStream\` or \`BooleanStream\`; \`String.chars()\` returns an \`IntStream\`, which is why printing it gives numbers unless you cast back to \`char\`.
* **No generic specialisation.** This is erasure again — you cannot write \`Stream<int>\`. Project Valhalla is the long-term answer.
* \`average()\` returns \`OptionalDouble\` because an empty stream has no average; handle it.
* Beware \`IntStream.sum()\` **overflow**. Ten million values that each fit in an int can easily overflow the sum. Use \`mapToLong\` or \`asLongStream()\` when the total might exceed \`Integer.MAX_VALUE\`.

### The real lesson
On a hot path, prefer the primitive specialisations, and check whether the data should have been \`int[]\` rather than \`List<Integer>\` in the first place. The best boxing optimisation is not boxing at the source.`,
    codeSnippet: `// 10M allocations
int total = numbers.stream().reduce(0, Integer::sum);

// Zero boxing, and overflow-safe
long total = numbers.stream().mapToLong(Integer::longValue).sum();

// One pass, five statistics
IntSummaryStatistics stats = numbers.stream()
        .mapToInt(Integer::intValue)
        .summaryStatistics();

// String.chars() is an IntStream, not a CharStream
"hello".chars().mapToObj(c -> (char) c).forEach(System.out::println);`,
    pitfalls: [
      'Ignoring int overflow in IntStream.sum() over large datasets.',
      'Assuming a CharStream exists.',
      'Calling boxed() unnecessarily and reintroducing the allocation you just removed.',
      'Forgetting average() and max() return Optional* types.'
    ],
    followUpQuestions: [
      'Why is there no Stream<int>, and what would Valhalla change?',
      'When does escape analysis eliminate the boxing anyway, and why can you not rely on it?',
      'What is the cost difference between IntStream.range and an enhanced for over a boxed list?'
    ],
    faangFocus: 'Performance-focused teams use this to check whether a candidate connects API choices to allocation profiles. Catching the overflow bug is a bonus signal.'
  },
  {
    id: 'str-9',
    categoryId: 'streams',
    title: 'Infinite Streams, iterate, generate and limit',
    difficulty: 'Solid',
    tags: ['Infinite Streams', 'iterate', 'generate', 'takeWhile'],
    scenario: 'You need the first 20 Fibonacci numbers, a stream of retry backoff delays capped at 30 seconds, and a random sample of 1,000 test records — all as streams.',
    question: 'Build them. Explain the difference between `iterate` and `generate`, and the parallelism implications of each.',
    idealAnswer: `### generate vs iterate
* \`Stream.generate(supplier)\` — each element is produced independently, with **no ordering relationship**. It produces an *unordered* infinite stream, so it parallelises well but \`limit()\` on it is non-deterministic in which elements you get.
* \`Stream.iterate(seed, next)\` — each element is a function of the **previous** one. That makes it inherently **sequential**: element n cannot be computed without n−1, so it cannot split. Parallelising an \`iterate\` stream is close to pointless.
* \`Stream.iterate(seed, hasNext, next)\` (Java 9+) — the three-arg form with a built-in predicate. This is the stream equivalent of a \`for\` loop and is usually clearer than \`iterate(...).limit(...)\`.

### Terminating an infinite stream
* \`limit(n)\` — take a fixed count.
* \`takeWhile(pred)\` (Java 9) — stop at the first element failing the predicate. Note it stops at the **first** failure, unlike \`filter\`, which tests every element.
* \`dropWhile(pred)\` — the mirror image.

An infinite stream **must** be short-circuited before a terminal operation like \`collect\` or \`count\`, or it hangs forever.

### The three examples
* **Fibonacci** — \`iterate\` over a \`long[]\` pair or a record, since each value depends on the previous two.
* **Backoff** — \`iterate\` doubling the delay, with \`takeWhile\` or \`map(d -> Math.min(d, 30_000))\` for the cap. Add jitter, or every client retries in lockstep and you rebuild the thundering herd you were trying to avoid.
* **Random sample** — \`generate\` fits perfectly, or better \`random.ints(1000, 0, bound)\`, which the JDK provides directly.

### Performance warning
\`Stream.iterate\` has poor spliterator characteristics: unknown size, no splitting. For an index loop, \`IntStream.range(0, n)\` is dramatically better because it is SIZED, SUBSIZED and splits in O(1).`,
    codeSnippet: `// Fibonacci: each element depends on the previous — iterate
Stream.iterate(new long[]{0, 1}, f -> new long[]{f[1], f[0] + f[1]})
      .limit(20).map(f -> f[0]).forEach(System.out::println);

// Exponential backoff, capped, with jitter
Stream.iterate(100L, d -> Math.min(d * 2, 30_000L))
      .limit(10)
      .map(d -> d / 2 + ThreadLocalRandom.current().nextLong(d / 2))
      .forEach(this::sleepThenRetry);

// Java 9 three-arg form: a for loop as a stream
Stream.iterate(1, i -> i <= 100, i -> i * 2).forEach(System.out::println);

// Random sample — the JDK already has this
int[] sample = ThreadLocalRandom.current().ints(1_000, 0, 10_000).toArray();`,
    pitfalls: [
      'Forgetting to short-circuit an infinite stream, hanging the thread.',
      'Calling parallel() on an iterate stream and expecting a speed-up.',
      'Using filter where takeWhile is meant, which traverses the entire (infinite) stream.',
      'Building retry backoff with no jitter.'
    ],
    followUpQuestions: [
      'Why is Stream.iterate inherently sequential while generate is not?',
      'What is the difference in spliterator characteristics between iterate and IntStream.range?',
      'How does takeWhile behave on an unordered parallel stream?'
    ],
    faangFocus: 'A good live-coding warm-up. Adding jitter to the backoff unprompted is a strong signal you have run production systems.'
  },
  {
    id: 'str-10',
    categoryId: 'streams',
    title: 'Streaming Large Files and Resource Leaks',
    difficulty: 'Hard',
    tags: ['Files.lines', 'Resource Leak', 'try-with-resources', 'BaseStream'],
    scenario: 'A nightly job processes a 40GB log file with `Files.lines(path).filter(...).collect(toList())`. It OOMs. After switching to `forEach`, it runs but the process eventually fails with "Too many open files".',
    question: 'Diagnose both failures and write the correct implementation.',
    idealAnswer: `### Failure 1: collect(toList()) materialises everything
\`Files.lines\` is lazy and streams the file, which is correct. But \`collect(toList())\` pulls every matching line into heap. If a meaningful fraction of 40GB survives the filter, you OOM regardless of how lazy the source was.

**Fix:** keep the whole pipeline streaming. Consume incrementally with \`forEach\`, write results out as you go, or reduce to an aggregate rather than a collection. Never terminate a large-file stream with an unbounded collector.

### Failure 2: streams hold OS resources
\`Stream\` extends \`BaseStream\`, which extends \`AutoCloseable\`. Most streams need no closing, but the ones backed by IO — \`Files.lines\`, \`Files.walk\`, \`Files.list\`, \`Files.find\` — hold an open file handle or directory descriptor. If you never close them, handles accumulate until you hit the process \`ulimit\`.

Garbage collection does not reliably save you: the handle is only released when the stream is closed or (in some implementations) when a cleaner runs, which is non-deterministic.

**Fix:** always wrap IO-backed streams in **try-with-resources**.

### The correct implementation
Stream in, stream out, both in try-with-resources, with the pipeline never accumulating unbounded state.

### Related traps
* \`Files.walk\` on a deep tree also holds descriptors per directory level — same rule applies.
* \`sorted()\` on a huge stream buffers **everything** in memory to sort it. So does \`distinct()\` (it holds a \`HashSet\` of all seen elements). Both silently defeat laziness — that is the second-order OOM risk in file pipelines.
* Reading with the wrong charset throws \`MalformedInputException\` mid-stream on real-world logs; pass an explicit charset and decide how to handle bad bytes.`,
    codeSnippet: `// OOM: collects gigabytes into heap
List<String> errors = Files.lines(path).filter(l -> l.contains("ERROR")).toList();

// Leaks a file descriptor on every call
Files.lines(path).forEach(this::process);

// Correct: streaming in, streaming out, both closed
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8);
     BufferedWriter out = Files.newBufferedWriter(target)) {

    lines.filter(l -> l.contains("ERROR"))
         .map(this::redact)
         .forEach(l -> writeLine(out, l));
}`,
    pitfalls: [
      'Not closing Files.lines / Files.walk / Files.list streams.',
      'Terminating a huge stream with an unbounded collector.',
      'Calling sorted() or distinct() on an unbounded stream and buffering it all.',
      'Relying on the default charset and failing on malformed input.'
    ],
    followUpQuestions: [
      'Which stream sources actually require closing, and how do you tell?',
      'Why do sorted() and distinct() break the laziness guarantee?',
      'How would you parallelise this safely across a 40GB file?'
    ],
    faangFocus: 'The "Too many open files" symptom is a real production incident pattern. Knowing Stream is AutoCloseable separates people who have debugged this from people who have not.'
  },
  {
    id: 'str-11',
    categoryId: 'streams',
    title: 'Method References and Lambda Capture Costs',
    difficulty: 'Hard',
    tags: ['Lambdas', 'invokedynamic', 'Method References', 'Capture'],
    scenario: 'A hot loop passes `x -> service.handle(x, config)` into a stream operation millions of times. A profiler shows unexpected allocation attributed to the lambda call site.',
    question: 'Explain how lambdas are compiled and executed, the difference between capturing and non-capturing lambdas, and the four kinds of method reference.',
    idealAnswer: `### How lambdas are actually compiled
A lambda is **not** an anonymous inner class. \`javac\` emits the body as a private synthetic method and replaces the expression with an \`invokedynamic\` instruction bound to \`LambdaMetafactory\`. On first execution the JVM spins up an implementation class and links the call site; afterwards it is a constant-folded, inlinable indirect call.

This design keeps class-file size down and lets the runtime choose the strategy — a future JVM could implement it differently without recompilation.

### Capturing vs non-capturing
* **Non-capturing** (\`x -> x * 2\`) — depends on nothing outside itself. The instance is created **once** and cached at the call site. Zero allocation per invocation.
* **Capturing** (\`x -> service.handle(x, config)\`) — closes over \`service\` and \`config\`. A **new object may be allocated per evaluation of the lambda expression** to hold the captured values.

The crucial nuance: if the capturing expression sits inside a hot loop, you allocate per iteration. Hoisting it into a variable outside the loop, or a field, makes it once. Escape analysis often eliminates the allocation anyway — but only when the lambda does not escape, which in a stream it usually does.

### The four method reference forms
1. **Static** — \`Integer::parseInt\`.
2. **Bound instance** — \`System.out::println\`. Captures that specific receiver (so it *is* capturing).
3. **Unbound instance** — \`String::length\`. The receiver becomes the first parameter; **non-capturing**, so it is free.
4. **Constructor** — \`ArrayList::new\`.

\`String::length\` is preferable to \`s -> s.length()\` not just stylistically but because the unbound form is non-capturing and cached.

### Practical guidance
This matters on genuinely hot paths only. Do not contort readable code for it. But when a profiler points at a lambda call site, the fix is usually: hoist the capturing lambda out of the loop, or convert it to an unbound method reference.`,
    codeSnippet: `// Capturing lambda created per loop iteration
for (Batch b : batches) {
    b.items().forEach(x -> service.handle(x, config));  // captures service, config
}

// Hoisted: one instance
Consumer<Item> handler = x -> service.handle(x, config);
for (Batch b : batches) b.items().forEach(handler);

// Unbound method reference: non-capturing, cached at the call site
list.stream().map(String::length);      // free
list.stream().map(s -> s.length());     // also fine, but conceptually different`,
    pitfalls: [
      'Claiming lambdas are compiled to anonymous inner classes.',
      'Assuming all lambdas are allocation-free.',
      'Not distinguishing bound from unbound method references.',
      'Micro-optimising lambda capture on a cold path where it cannot possibly matter.'
    ],
    followUpQuestions: [
      'What does LambdaMetafactory do at the first invocation of a lambda call site?',
      'Why do lambdas require effectively-final captured locals?',
      'How does the "this" reference differ between a lambda and an anonymous class?'
    ],
    faangFocus: 'Deep-language rounds at Oracle, Google and JetBrains. Naming invokedynamic and LambdaMetafactory instantly places you above the median.'
  },
  {
    id: 'str-12',
    categoryId: 'streams',
    title: 'Building a Custom Collector',
    difficulty: 'Expert',
    tags: ['Collector', 'Characteristics', 'Parallel', 'API Design'],
    scenario: 'You need to collect a stream of events into a fixed-size reservoir sample, and separately into a compact bitset of seen ids. Neither is expressible with the built-in collectors.',
    question: 'Explain the `Collector` contract in full, including the role of each function and each characteristic. What must hold for the collector to be parallel-safe?',
    idealAnswer: `### The five pieces
A \`Collector<T, A, R>\` has three type parameters — element type T, mutable accumulation type A, and result type R — and supplies:

1. **\`supplier()\`** — creates a **new** empty container. Called once per sequential pipeline, and once **per split** in parallel. This is what makes mutable reduction thread-safe: no container is shared.
2. **\`accumulator()\`** — folds one element into a container. Must not be visible outside that container.
3. **\`combiner()\`** — merges two containers into one. Must be **associative** and consistent with the accumulator: combining partials must equal accumulating sequentially.
4. **\`finisher()\`** — converts A to R. Used for post-processing, e.g. wrapping in an unmodifiable view.
5. **\`characteristics()\`** — a hint set.

### The characteristics
* **\`CONCURRENT\`** — the same container may be shared across all threads, so \`supplier\` is called once and \`accumulator\` must be thread-safe. Combined with \`UNORDERED\` this skips the merge phase entirely. \`groupingByConcurrent\` uses this.
* **\`UNORDERED\`** — the result does not depend on encounter order. Enables real parallel optimisations. **Only claim this if it is true** — a reservoir sample is unordered, a "first 10" collector is not.
* **\`IDENTITY_FINISH\`** — A and R are the same type, so the finisher can be skipped. Purely an optimisation.

### The invariants for parallel safety
* \`combiner(supplier(), a)\` must equal \`a\` — the empty container is an identity.
* \`combiner\` must be associative: grouping of merges must not change the result.
* The accumulator must be **non-interfering** with the stream source.
* If you claim CONCURRENT, the accumulator must be genuinely thread-safe; if you claim UNORDERED, order truly must not matter.

### The two examples
* **Reservoir sample** — container is a fixed array plus a counter; accumulator does the Algorithm-R replacement; combiner merges two reservoirs weighted by their observed counts (this is the subtle part). Legitimately \`UNORDERED\`.
* **Bitset of ids** — container is a \`java.util.BitSet\`; accumulator sets a bit; combiner is \`or()\`. \`UNORDERED\` and \`IDENTITY_FINISH\`. This one is trivially associative, which is why it parallelises beautifully.

### The shortcut
\`Collector.of(supplier, accumulator, combiner, finisher, characteristics...)\` builds one without writing a class. And before writing any of it, check whether \`collectingAndThen\`, \`teeing\`, \`mapping\` or \`flatMapping\` composes what you need from existing pieces — most "custom collector" needs do not require a custom collector.`,
    codeSnippet: `// Compact id set: associative, unordered, identity-finish
Collector<Event, BitSet, BitSet> toIdBitSet = Collector.of(
        BitSet::new,
        (bs, e) -> bs.set(e.id()),
        (a, b) -> { a.or(b); return a; },
        Collector.Characteristics.UNORDERED,
        Collector.Characteristics.IDENTITY_FINISH);

BitSet seen = events.parallelStream().collect(toIdBitSet);

// Often you do not need a custom collector at all
Collector<Order, ?, List<Order>> immutable =
        collectingAndThen(toList(), List::copyOf);`,
    pitfalls: [
      'Writing a combiner that is not associative — works sequentially, wrong in parallel.',
      'Declaring CONCURRENT without a thread-safe accumulator.',
      'Declaring UNORDERED when the result actually depends on encounter order.',
      'Building a custom collector when teeing/collectingAndThen/mapping would compose it.'
    ],
    followUpQuestions: [
      'When is the combiner invoked in a sequential stream?',
      'What exactly does CONCURRENT change about how the pipeline drives your collector?',
      'How does Collectors.toList() differ from Stream.toList() in mutability and nulls?'
    ],
    faangFocus: 'Reserved for senior and staff loops. Explaining the supplier-per-split property as the reason mutable reduction is safe is the answer interviewers are waiting for.'
  },
];
