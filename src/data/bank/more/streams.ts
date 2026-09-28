import type { Question } from '../../types';

/**
 * Streams & functional Java, part two: the everyday coding-round pipelines,
 * the functional interfaces underneath them, and parallel reduction theory.
 */
export const STREAMS_MORE_QUESTIONS: Question[] = [
  {
    id: 'str-13',
    categoryId: 'streams',
    title: 'Stream vs Collection',
    difficulty: 'Core',
    tags: ['Streams', 'Collections', 'Basics'],
    scenario: "A developer stores a `Stream<Order>` in a field so several methods can reuse it. The second use throws `IllegalStateException: stream has already been operated upon or closed`.",
    question: "What is the difference between a Stream and a Collection, and why can't a stream be reused?",
    idealAnswer: `### Collection: data
A collection **stores** elements in memory. You can iterate it many times, add and remove elements, and ask for its size.

### Stream: a computation
A stream is a **pipeline of operations over a source** (a collection, array, file, generator). It:
* stores nothing itself;
* is **lazy**: nothing happens until a terminal operation;
* is **single-use**: once a terminal operation runs, the pipeline is consumed;
* can be **infinite** (\`Stream.iterate\`, \`generate\`);
* can run in parallel;
* never modifies its source.

### Why single-use
A stream may be backed by a one-shot source (a file, a socket, an iterator). Allowing reuse would mean buffering everything or re-reading silently. So the rule is uniform: one terminal operation per stream.

### The fix
Store the **collection** (or a \`Supplier<Stream<Order>>\`) and create a fresh stream each time: \`orders.stream()\`.`,
    pitfalls: [
      "Storing streams in fields or returning them for multiple uses.",
      "Expecting a stream to reflect changes to its source made later.",
      "Thinking streams copy data up front.",
    ],
    followUpQuestions: [
      "When would you return a Stream from a method rather than a List?",
      "What happens if you modify the source list during a stream operation?",
    ],
    faangFocus: "A warm-up that checks you understand laziness and single-use semantics.",
  },
  {
    id: 'str-14',
    categoryId: 'streams',
    title: 'The Core Functional Interfaces',
    difficulty: 'Core',
    tags: ['Functional Interfaces', 'Lambdas', 'java.util.function'],
    scenario: "An interviewer asks you to name the functional interfaces in `java.util.function` that you use most and to write a method that accepts a validation rule as a parameter.",
    question: "What is a functional interface, and what are the key ones in java.util.function?",
    idealAnswer: `### Functional interface
An interface with **exactly one abstract method** (default and static methods don't count). Any lambda or method reference with a matching shape can implement it. \`@FunctionalInterface\` makes the compiler enforce the single-method rule.

### The big four
| Interface | Method | Shape | Example |
|---|---|---|---|
| \`Function<T,R>\` | \`apply\` | T → R | \`String::length\` |
| \`Predicate<T>\` | \`test\` | T → boolean | \`s -> s.isEmpty()\` |
| \`Consumer<T>\` | \`accept\` | T → void | \`System.out::println\` |
| \`Supplier<T>\` | \`get\` | () → T | \`ArrayList::new\` |

### Variants
* \`BiFunction\`, \`BiPredicate\`, \`BiConsumer\` for two arguments.
* \`UnaryOperator<T>\` (T → T) and \`BinaryOperator<T>\` ((T, T) → T), used by \`replaceAll\` and \`reduce\`.
* Primitive specialisations (\`IntPredicate\`, \`ToLongFunction\`, \`IntBinaryOperator\`) avoid boxing.

### Passing behaviour
\`\`\`java
boolean validate(User u, Predicate<User> rule) { return rule.test(u); }
validate(user, u -> u.age() >= 18);
\`\`\`
Also recall older functional interfaces: \`Runnable\`, \`Callable\`, \`Comparator\`.`,
    pitfalls: [
      "Creating custom interfaces when a standard one fits.",
      "Using boxed Function<Integer, Integer> on hot paths instead of IntUnaryOperator.",
      "Forgetting that Comparator is a functional interface too.",
    ],
    followUpQuestions: [
      "Why does Comparator count as a functional interface despite declaring equals()?",
      "When would you define your own functional interface?",
    ],
    faangFocus: "Standard Java 8 knowledge, often the first streams question.",
  },
  {
    id: 'str-15',
    categoryId: 'streams',
    title: 'Lambdas vs Anonymous Classes',
    difficulty: 'Core',
    tags: ['Lambdas', 'Anonymous Classes', 'Effectively Final', 'this'],
    scenario: "Converting an anonymous `Runnable` to a lambda changed what `this.toString()` printed, and a counter incremented inside the lambda no longer compiles.",
    question: "What are the differences between lambdas and anonymous inner classes?",
    idealAnswer: `### Semantics
* **\`this\`**: in an anonymous class, \`this\` is the anonymous instance. In a lambda, \`this\` is the **enclosing instance**: lambdas do not introduce a new scope. That's why \`toString()\` changed.
* **Captured variables**: both can capture only **effectively final** locals. A lambda cannot do \`count++\` on a local; an anonymous class cannot either, but it can have its own mutable fields.
* **Shadowing**: a lambda cannot declare a parameter or local with the same name as an enclosing local; an anonymous class can.
* **Scope of use**: lambdas only implement functional interfaces; anonymous classes can extend classes and implement multi-method interfaces and hold state.

### Implementation
Anonymous classes compile to a separate \`.class\` file and allocate an instance each time. Lambdas compile to a private method plus an \`invokedynamic\` call site; non-capturing lambdas are typically a **single cached instance**.

### Counting inside a lambda
Don't mutate captured state. Use a stream operation (\`count()\`, \`sum()\`), or an \`AtomicInteger\`/\`LongAdder\` if you truly need a side-effecting counter.`,
    pitfalls: [
      "Using the int[] { 0 } trick to mutate captured state.",
      "Expecting 'this' to refer to the lambda.",
      "Assuming each lambda evaluation allocates a new object.",
    ],
    followUpQuestions: [
      "Why must captured locals be effectively final?",
      "How is a lambda compiled?",
    ],
    faangFocus: "Common Java 8 question; the 'this' difference is the usual discriminator.",
  },
  {
    id: 'str-16',
    categoryId: 'streams',
    title: 'Top 3 Earners per Department',
    difficulty: 'Core',
    tags: ['Coding', 'sorted', 'limit', 'groupingBy'],
    scenario: "Given `List<Employee>` with name, department and salary: (a) find the 3 highest-paid employees, (b) find the top 3 per department.",
    question: "Write both with streams.",
    idealAnswer: `### (a) Global top 3
Sort by salary descending, then \`limit(3)\`. \`sorted\` is a full sort (O(n log n)); for huge inputs a bounded heap is cheaper, but for typical lists this is fine and readable.

### (b) Top 3 per department
Group by department, then post-process each group with \`collectingAndThen\`: sort the group and keep the first three.

### Points to mention
* \`Comparator.comparing(Employee::salary).reversed()\` vs \`Collections.reverseOrder()\`: \`reversed()\` on a chained comparator reverses **the whole chain**; be careful with multi-key comparators.
* Ties: decide whether 'top 3' means 3 people or 3 salary values.
* Use \`TreeMap::new\` as the map factory if the output must be sorted by department.`,
    codeSnippet: `List<Employee> top3 = employees.stream()
        .sorted(Comparator.comparing(Employee::salary).reversed())
        .limit(3)
        .toList();

Map<String, List<Employee>> top3ByDept = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::department,
                TreeMap::new,
                Collectors.collectingAndThen(Collectors.toList(), list -> list.stream()
                        .sorted(Comparator.comparing(Employee::salary).reversed())
                        .limit(3)
                        .toList())));`,
    pitfalls: [
      "Calling reversed() in the wrong place on a chained comparator.",
      "Ignoring ties.",
      "Sorting the whole list when only the top K are needed for huge inputs.",
    ],
    followUpQuestions: [
      "How would you find the second-highest salary?",
      "How would you do this in SQL with window functions?",
    ],
    faangFocus: "A very common streams coding task in Java interviews.",
  },
  {
    id: 'str-17',
    categoryId: 'streams',
    title: 'Stream.toList() vs Collectors.toList() vs toUnmodifiableList()',
    difficulty: 'Core',
    tags: ['toList', 'Collectors', 'Immutability', 'Java 16'],
    scenario: "After replacing `.collect(Collectors.toList())` with `.toList()` during a Java 17 upgrade, some code starts throwing `UnsupportedOperationException`.",
    question: "What are the differences between these three ways of collecting to a list?",
    idealAnswer: `### Collectors.toList()
Returns a list with **no guarantees** on type, mutability or thread safety. In practice it's an \`ArrayList\`, and lots of code mutates it, relying on that implementation detail.

### Stream.toList() (Java 16+)
Returns an **unmodifiable** list. \`add\`/\`set\`/\`remove\` throw \`UnsupportedOperationException\`, which is what broke the upgraded code. It **allows null elements**. It's also slightly more efficient (can size exactly).

### Collectors.toUnmodifiableList() (Java 10+)
Unmodifiable too, but **throws NPE on null elements**.

### Choosing
* Default to \`.toList()\` for results you won't mutate.
* If you need a mutable list, say so: \`.collect(Collectors.toCollection(ArrayList::new))\`.
* Use \`toUnmodifiableList\` when nulls should be rejected.`,
    pitfalls: [
      "Mechanical replacement of collect(toList()) with toList() in code that mutates the result.",
      "Assuming Collectors.toList() is guaranteed to be an ArrayList.",
      "Null elements with toUnmodifiableList().",
    ],
    followUpQuestions: [
      "Is the list from toList() thread-safe to share?",
      "What does toCollection(TreeSet::new) give you?",
    ],
    faangFocus: "A modern-Java detail that appears in migration discussions.",
  },
  {
    id: 'str-18',
    categoryId: 'streams',
    title: 'Collectors.toMap: Duplicates, Nulls and Ordering',
    difficulty: 'Solid',
    tags: ['toMap', 'Collectors', 'Duplicates', 'LinkedHashMap'],
    scenario: "`users.stream().collect(toMap(User::email, User::name))` works in tests but fails in production with `IllegalStateException: Duplicate key`, and elsewhere with a `NullPointerException`.",
    question: "Explain both failures and write a robust version.",
    idealAnswer: `### Duplicate keys
The two-argument \`toMap\` **throws** on duplicate keys. Production data had two users with the same email. Provide a **merge function** to decide: keep first, keep last, or combine.

### Null values
\`toMap\` uses \`HashMap.merge\` internally, which **rejects null values** with an NPE even though \`HashMap\` itself allows them. A user with a null name blows up. Filter nulls, map them to a default, or collect manually.

### Ordering
The default result is a \`HashMap\` with no order. The four-argument form takes a **map supplier**: \`LinkedHashMap::new\` to preserve encounter order, \`TreeMap::new\` for sorted keys.

### When toMap is the wrong tool
If several values per key are expected, you want \`groupingBy\`, not a merge function that silently discards data.`,
    codeSnippet: `Map<String, String> byEmail = users.stream()
        .filter(u -> u.name() != null)
        .collect(Collectors.toMap(
                User::email,
                User::name,
                (first, second) -> first,       // keep first on duplicate
                LinkedHashMap::new));`,
    pitfalls: [
      "No merge function when keys can repeat.",
      "Null values causing NPE.",
      "Silently dropping duplicates when grouping was intended.",
    ],
    followUpQuestions: [
      "How would you detect and report duplicates instead of merging?",
      "What does toConcurrentMap change for parallel streams?",
    ],
    faangFocus: "Frequently asked; the null-value NPE is the detail most people miss.",
  },
  {
    id: 'str-19',
    categoryId: 'streams',
    title: 'The Four Kinds of Method References',
    difficulty: 'Core',
    tags: ['Method References', 'Lambdas', 'Syntax'],
    scenario: "A reviewer asks why `String::length`, `System.out::println`, `String::compareToIgnoreCase` and `ArrayList::new` all work in different contexts.",
    question: "Explain the four kinds of method references and when each applies.",
    idealAnswer: `### 1. Static method: \`ClassName::staticMethod\`
\`Integer::parseInt\` ≡ \`s -> Integer.parseInt(s)\`.

### 2. Bound instance method: \`instance::method\`
The receiver is fixed when the reference is created. \`System.out::println\` ≡ \`x -> System.out.println(x)\`. Note: the receiver expression is evaluated **once**, immediately (and throws NPE then if it is null).

### 3. Unbound instance method: \`ClassName::instanceMethod\`
The **first parameter becomes the receiver**. \`String::length\` ≡ \`s -> s.length()\`; \`String::compareToIgnoreCase\` ≡ \`(a, b) -> a.compareToIgnoreCase(b)\`, which fits \`Comparator<String>\`.

### 4. Constructor: \`ClassName::new\`
\`ArrayList::new\` fits \`Supplier<List<T>>\` or \`Function<Integer, List<T>>\` (capacity) depending on the target type. Arrays too: \`String[]::new\` for \`toArray\`.

### Readability
Use a method reference when it's clearer than the lambda; a lambda is better when arguments are reordered or extra logic is needed.`,
    pitfalls: [
      "Confusing bound and unbound references.",
      "Not realising the bound receiver is evaluated eagerly.",
      "Ambiguous overloads making method references fail to compile.",
    ],
    followUpQuestions: [
      "Why does Integer::toString sometimes cause an ambiguity error?",
      "What does this::process capture?",
    ],
    faangFocus: "Syntax fluency check; the unbound case is what they probe.",
  },
  {
    id: 'str-20',
    categoryId: 'streams',
    title: 'Find the Second Highest Salary',
    difficulty: 'Solid',
    tags: ['Coding', 'distinct', 'skip', 'Optional'],
    scenario: "Classic screening question: given a list of employees, return the second highest distinct salary, or empty if there isn't one.",
    question: "Solve it with streams and discuss edge cases.",
    idealAnswer: `### Solution
Map to salaries, keep **distinct** values (so duplicates of the top salary don't count as 'second'), sort descending, skip one, take the first. Return an \`Optional\` since it may not exist.

### Edge cases to mention
* Fewer than two distinct salaries: empty result, not an exception.
* Nulls in the salary field.
* Using \`BigDecimal\`: \`distinct\` uses \`equals\`, where \`2.0\` and \`2.00\` differ; normalise with \`stripTrailingZeros\` or compare with \`compareTo\` via a \`TreeSet\`.

### Complexity
O(n log n) due to sorting. An O(n) single pass tracking the top two is easy too, and worth mentioning for huge inputs.

### Generalising
Nth highest: \`skip(n - 1)\`.`,
    codeSnippet: `Optional<Integer> second = employees.stream()
        .map(Employee::salary)
        .distinct()
        .sorted(Comparator.reverseOrder())
        .skip(1)
        .findFirst();`,
    pitfalls: [
      "Forgetting distinct(), returning the top salary again.",
      "Calling get() on the Optional without checking.",
      "BigDecimal scale differences breaking distinct().",
    ],
    followUpQuestions: [
      "Write the O(n) version.",
      "Find the employees who earn the second highest salary.",
    ],
    faangFocus: "One of the most asked Java 8 coding questions in screenings.",
  },
  {
    id: 'str-21',
    categoryId: 'streams',
    title: 'joining, counting and Summary Statistics',
    difficulty: 'Core',
    tags: ['Collectors', 'joining', 'IntSummaryStatistics'],
    scenario: "A report needs a comma-separated list of product names in brackets, and the min, max, average and count of prices, and the current code loops over the data four times.",
    question: "Which collectors produce these in one pass each?",
    idealAnswer: `### joining
\`Collectors.joining(", ", "[", "]")\`: delimiter, prefix and suffix. Uses a \`StringBuilder\` internally. Elements must be \`CharSequence\`, so map first.

### Summary statistics
\`summarizingInt/Long/Double\` (or \`IntStream.summaryStatistics()\`) computes **count, sum, min, max and average in one pass**, returning \`IntSummaryStatistics\` etc. Works as a downstream collector per group too.

### Counting
* \`stream.count()\` for the whole stream.
* \`Collectors.counting()\` as a downstream collector (returns \`Long\`).

### Precision note
For money, use \`BigDecimal\` and \`reduce(BigDecimal.ZERO, BigDecimal::add)\`, not \`summarizingDouble\`.`,
    codeSnippet: `String names = products.stream()
        .map(Product::name)
        .collect(Collectors.joining(", ", "[", "]"));

DoubleSummaryStatistics stats = products.stream()
        .collect(Collectors.summarizingDouble(Product::weightKg));
// stats.getMin(), getMax(), getAverage(), getCount(), getSum()`,
    pitfalls: [
      "Multiple passes for simple aggregates.",
      "Doubles for money.",
      "String concatenation in reduce instead of joining.",
    ],
    followUpQuestions: [
      "What does getMin() return for an empty stream?",
      "How would you get summary statistics per category?",
    ],
    faangFocus: "Everyday collectors; quick to answer, easy to lose points on precision.",
  },
  {
    id: 'str-22',
    categoryId: 'streams',
    title: 'Find Duplicates in a List',
    difficulty: 'Core',
    tags: ['Coding', 'groupingBy', 'Set', 'Duplicates'],
    scenario: "Screening task: given a list of integers, return the elements that appear more than once.",
    question: "Write two stream-based solutions and compare them.",
    idealAnswer: `### Approach 1: a Set with add()
\`Set.add\` returns false if the element is already present. Filter by that. One pass, O(n). But the lambda is **stateful**, so it's only correct on a **sequential** stream, and it returns an element each time it repeats (wrap with \`distinct()\` or collect to a set).

### Approach 2: count by grouping
Group into a frequency map, then keep keys with count > 1. Stateless, parallel-safe, and gives you counts if needed. Two passes (over the list and the map).

### Which to present
Approach 2 is the cleaner functional answer; approach 1 is fine if you point out the sequential-only constraint.`,
    codeSnippet: `// 1. Stateful filter (sequential only)
Set<Integer> seen = new HashSet<>();
Set<Integer> dups = nums.stream().filter(n -> !seen.add(n)).collect(Collectors.toSet());

// 2. Frequency map
Set<Integer> dups2 = nums.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .filter(e -> e.getValue() > 1)
        .map(Map.Entry::getKey)
        .collect(Collectors.toSet());`,
    pitfalls: [
      "Using a stateful lambda in a parallel stream.",
      "Collections.frequency inside a stream: O(n^2).",
      "Returning duplicates multiple times.",
    ],
    followUpQuestions: [
      "Return duplicates in their original order of first repetition.",
      "How would you do this for a list too large for memory?",
    ],
    faangFocus: "Common screening question; discussing statefulness gains points.",
  },
  {
    id: 'str-23',
    categoryId: 'streams',
    title: 'Word Frequency and Sorting a Map by Value',
    difficulty: 'Solid',
    tags: ['Coding', 'groupingBy', 'Sorting', 'Map.Entry'],
    scenario: "Given a paragraph of text, print the 5 most frequent words (case-insensitive), with ties broken alphabetically.",
    question: "Write it with streams.",
    idealAnswer: `### Steps
1. Split into words (regex on non-letters), lowercase with \`Locale.ROOT\`, drop empties.
2. \`groupingBy(identity, counting())\` for frequencies.
3. Stream the \`entrySet()\` and sort with a two-level comparator: count descending, then word ascending.
4. \`limit(5)\`.

### The comparator detail
\`Map.Entry.comparingByValue(Comparator.reverseOrder())\` handles the first key; \`thenComparing(Map.Entry.comparingByKey())\` breaks ties. Generic type inference can struggle here; typing the comparator explicitly helps.

### Performance
Sorting all distinct words is O(u log u); a bounded heap makes it O(u log 5) for very large vocabularies.`,
    codeSnippet: `Map<String, Long> freq = Arrays.stream(text.split("\\\\W+"))
        .filter(w -> !w.isBlank())
        .map(w -> w.toLowerCase(Locale.ROOT))
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

List<String> top5 = freq.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                .thenComparing(Map.Entry.comparingByKey()))
        .limit(5)
        .map(e -> e.getKey() + "=" + e.getValue())
        .toList();`,
    pitfalls: [
      "Default-locale lowercasing.",
      "Ignoring tie-breaking.",
      "Type inference errors with chained Map.Entry comparators.",
    ],
    followUpQuestions: [
      "How would you do this over a 100GB file?",
      "How do you exclude stop words efficiently?",
    ],
    faangFocus: "A classic that tests collectors and comparator fluency together.",
  },
  {
    id: 'str-24',
    categoryId: 'streams',
    title: 'Encounter Order, findFirst vs findAny, and unordered()',
    difficulty: 'Solid',
    tags: ['Ordering', 'findAny', 'findFirst', 'Parallel'],
    scenario: "A parallel stream using `findFirst()` is barely faster than sequential. Switching to `findAny()` makes it much faster but results differ between runs.",
    question: "Explain encounter order and its cost in parallel streams.",
    idealAnswer: `### Encounter order
Streams from ordered sources (\`List\`, arrays, \`Stream.iterate\`, sorted streams) have an **encounter order**. Streams from \`HashSet\` do not. Operations like \`findFirst\`, \`limit\`, \`skip\`, \`forEachOrdered\` and \`toList\` must **respect** it.

### Why findFirst is slow in parallel
Workers process chunks concurrently, but \`findFirst\` must return the match that comes **first in order**. A worker that finds a match in a later chunk cannot stop the search; earlier chunks must finish (or be proven empty). That coordination eats the parallel benefit.

### findAny
Returns **whichever match is found first by any thread**. Non-deterministic, but it can short-circuit immediately. Correct when you only need 'some element that matches'.

### unordered()
\`stream.unordered()\` declares that order doesn't matter, enabling cheaper \`distinct\`, \`limit\` and \`skip\` in parallel. Also, \`forEach\` doesn't respect order in parallel; \`forEachOrdered\` does (with a cost).

### Sequential streams
On a sequential stream, \`findAny\` in practice returns the first element, but you shouldn't rely on that.`,
    pitfalls: [
      "Using findFirst in parallel when any match would do.",
      "Relying on forEach order in parallel streams.",
      "Assuming HashSet streams have a stable order.",
    ],
    followUpQuestions: [
      "Why is limit() expensive on ordered parallel streams?",
      "Does sorted() on a parallel stream preserve order for forEach?",
    ],
    faangFocus: "Shows understanding of the semantics behind parallel performance.",
  },
  {
    id: 'str-25',
    categoryId: 'streams',
    title: 'Stateful vs Stateless Intermediate Operations',
    difficulty: 'Solid',
    tags: ['sorted', 'distinct', 'Stateful Operations', 'Memory'],
    scenario: "A pipeline over a 50-million-line log file runs out of memory. It contains `filter`, `map`, `sorted` and `limit(100)`.",
    question: "Which operations are stateful, why does this pipeline need so much memory, and how would you fix it?",
    idealAnswer: `### Stateless
\`filter\`, \`map\`, \`flatMap\`, \`peek\`: each element is processed independently and passed on. Constant memory.

### Stateful
Need to see other elements:
* **\`sorted\`**: must buffer **the entire stream** before emitting anything (a full barrier).
* **\`distinct\`**: keeps a set of all seen elements.
* **\`limit\`/\`skip\`**: small state, but expensive in ordered parallel streams.

### Why it OOMs
\`sorted()\` before \`limit(100)\` buffers all 50 million mapped lines. \`limit\` only runs after sorting completes.

### Fixes
* If you need the top 100 by some key: a bounded **min-heap** of size 100 (custom collector or loop) keeps memory O(100).
* If order doesn't matter, drop \`sorted\`.
* Filter as early as possible, and map to a smaller projection before any stateful step.
* For truly large sorts, use an external sort or the database.`,
    pitfalls: [
      "Putting sorted() before limit() on huge streams.",
      "distinct() on unbounded streams.",
      "Assuming streams always process in constant memory.",
    ],
    followUpQuestions: [
      "How would you write a top-K collector?",
      "What does 'barrier' mean in parallel stream execution?",
    ],
    faangFocus: "A practical performance question with a clear right answer.",
  },
  {
    id: 'str-26',
    categoryId: 'streams',
    title: 'Composing Functions, Predicates and Comparators',
    difficulty: 'Solid',
    tags: ['Function Composition', 'Predicate', 'Comparator', 'Higher-Order Functions'],
    scenario: "A product search screen supports a dozen optional filters and sort options. The current code is a 200-line if/else chain.",
    question: "How can functional composition simplify this?",
    idealAnswer: `### Predicate composition
\`and\`, \`or\`, \`negate\`, \`Predicate.not(...)\`, \`Predicate.isEqual\`. Build a list of active filters and reduce them with \`and\`, starting from \`p -> true\`.

### Function composition
\`f.andThen(g)\` = g(f(x)); \`f.compose(g)\` = f(g(x)). Useful for transformation pipelines, e.g. normalise then validate then enrich.

### Comparator composition
\`Comparator.comparing(key)\`, \`thenComparing\`, \`reversed\`, \`nullsFirst/nullsLast\`, \`comparingInt\` to avoid boxing. Map sort options to comparators in an \`EnumMap\`.

### The result
Each filter is a small, named, testable \`Predicate\`. The search method just combines the selected ones.`,
    codeSnippet: `Predicate<Product> filter = Stream.of(
                criteria.maxPrice().map(max -> (Predicate<Product>) p -> p.price().compareTo(max) <= 0),
                criteria.brand().map(b -> (Predicate<Product>) p -> p.brand().equalsIgnoreCase(b)),
                criteria.inStockOnly() ? Optional.of((Predicate<Product>) Product::inStock) : Optional.<Predicate<Product>>empty())
        .flatMap(Optional::stream)
        .reduce(p -> true, Predicate::and);

Comparator<Product> order = Comparator.comparing(Product::rating, Comparator.nullsLast(Comparator.reverseOrder()))
        .thenComparing(Product::price);

List<Product> result = products.stream().filter(filter).sorted(order).toList();`,
    pitfalls: [
      "Giant anonymous lambdas instead of named predicates.",
      "reversed() applied to the whole chain unintentionally.",
      "Filtering in memory what should be a database query.",
    ],
    followUpQuestions: [
      "How would you translate these predicates into a JPA Specification?",
      "What is the identity element for Predicate::and?",
    ],
    faangFocus: "Demonstrates functional design skills beyond one-liners.",
  },
  {
    id: 'str-27',
    categoryId: 'streams',
    title: 'Optional in Depth: orElse vs orElseGet and Chaining',
    difficulty: 'Solid',
    tags: ['Optional', 'orElseGet', 'Lazy Evaluation'],
    scenario: "`findUser(id).orElse(createGuestUser())` inserts a guest row into the database on every call, even when the user exists.",
    question: "Why, and what are the idiomatic Optional operations you should know?",
    idealAnswer: `### orElse is eager
\`orElse(x)\` takes a **value**, so \`createGuestUser()\` is evaluated **before** \`orElse\` is called, regardless of whether the Optional is empty. It's plain Java argument evaluation.
\`orElseGet(supplier)\` only calls the supplier when empty. Use \`orElse\` only for constants or cheap existing values.

### Useful operations
* \`map\` / \`flatMap\`: transform; flatMap when the function itself returns Optional.
* \`filter\`: keep the value only if it matches.
* \`or(() -> otherOptional)\` (Java 9): fallback to another Optional.
* \`ifPresentOrElse(consumer, runnable)\` (Java 9).
* \`orElseThrow()\` (Java 10, no-arg) or \`orElseThrow(() -> new NotFound(id))\`.
* \`stream()\` (Java 9): 0 or 1 elements, handy with \`flatMap\` over lists of Optionals.

### Chaining example
\`\`\`java
String city = findUser(id)
        .flatMap(User::address)
        .map(Address::city)
        .orElse("Unknown");
\`\`\``,
    pitfalls: [
      "orElse with a side-effecting or expensive call.",
      "isPresent() + get() instead of map/orElse.",
      "Optional fields, parameters or collections of Optional.",
    ],
    followUpQuestions: [
      "Why shouldn't Optional be used as a field type?",
      "What's the difference between map and flatMap on Optional?",
    ],
    faangFocus: "The orElse side-effect bug is a favourite 'what does this print' question.",
  },
  {
    id: 'str-28',
    categoryId: 'streams',
    title: 'Collectors.teeing: Two Aggregations in One Pass',
    difficulty: 'Solid',
    tags: ['teeing', 'Collectors', 'Java 12'],
    scenario: "You need both the count of orders and the total revenue from a stream that can only be consumed once (it's reading from a file).",
    question: "How does `Collectors.teeing` solve this and what are its limits?",
    idealAnswer: `### teeing
\`teeing(downstream1, downstream2, merger)\` sends every element to **both** collectors and combines their results with the merger function. One pass over the stream.

### Typical uses
* Count and sum → average or a summary record.
* Min and max together.
* Partitioned results into a record: 'passed' and 'failed' lists.

### Limits
* Only two downstreams per teeing; nest them for more, which gets unreadable fast. A custom collector or a simple loop may be clearer.
* For numeric summaries, \`summarizing*\` already combines count/sum/min/max/avg.`,
    codeSnippet: `record Report(long count, BigDecimal revenue) {}

Report r = Files.lines(path)
        .map(Order::parse)
        .collect(Collectors.teeing(
                Collectors.counting(),
                Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add),
                Report::new));`,
    pitfalls: [
      "Streaming the file twice instead.",
      "Deeply nested teeing calls.",
      "Forgetting to close Files.lines (use try-with-resources).",
    ],
    followUpQuestions: [
      "How would you implement teeing yourself with Collector.of?",
      "How do you compute min and max of a stream in one pass?",
    ],
    faangFocus: "Shows awareness of Java 9-17 additions to the Collectors API.",
  },
  {
    id: 'str-29',
    categoryId: 'streams',
    title: 'Streams vs Loops: When Not to Use Streams',
    difficulty: 'Solid',
    tags: ['Readability', 'Performance', 'Code Style'],
    scenario: "A pull request converts every loop in a module to streams, including one with early returns, checked exceptions and index arithmetic. The reviewer is not convinced.",
    question: "When are streams the better choice, and when is a loop clearer or faster?",
    idealAnswer: `### Streams shine for
* Declarative transformations: filter, map, group, aggregate.
* Pipelines that read as a sentence.
* Easy parallelism for large CPU-bound data (when measured).

### Loops are better for
* **Early exit with complex conditions**, \`break\`/\`continue\` and multiple return points.
* **Checked exceptions** (streams force wrapping).
* **Index-based** logic (neighbours, sliding windows before Gatherers).
* **Mutating local state** or several accumulators at once.
* Very hot paths on small collections where stream setup overhead matters (measure first; the JIT often makes them equivalent).

### Debuggability
Streams produce deep stack traces and are harder to step through; long pipelines should be split into well-named methods.

### Rule of thumb
Use whichever makes intent clearest. A 12-line stream with nested collectors and lambdas that capture state is worse than a 6-line loop.`,
    pitfalls: [
      "Forcing side effects into forEach to 'use streams'.",
      "Nested streams inside lambdas becoming unreadable.",
      "Claiming streams are always slower (or faster) without measuring.",
    ],
    followUpQuestions: [
      "How would you benchmark a stream vs a loop fairly?",
      "How do Gatherers change the sliding-window case?",
    ],
    faangFocus: "A judgement question; balanced answers score highest.",
  },
  {
    id: 'str-30',
    categoryId: 'streams',
    title: 'Debugging a Long Stream Pipeline',
    difficulty: 'Solid',
    tags: ['Debugging', 'peek', 'Stack Traces', 'IDE'],
    scenario: "A 9-stage pipeline throws a `NullPointerException` from `lambda$process$3` deep inside `ReferencePipeline`. Nobody can tell which element or stage caused it.",
    question: "How do you debug streams effectively and make pipelines easier to diagnose?",
    idealAnswer: `### Reading the trace
Lambdas compile to synthetic methods like \`lambda$process$3\`: the 4th lambda in \`process\`. The line number in the frame points at the lambda; the pipeline frames in between are noise.

### Tools
* **IDE stream debugger** (IntelliJ 'Trace Current Stream Chain') shows elements flowing through each stage.
* Breakpoints inside lambdas (conditional on the element).
* \`peek(e -> log.debug(...))\` **temporarily** to observe intermediate values, remembering peek may not run for elided stages.

### Making pipelines diagnosable
* Replace anonymous lambdas with **named methods** (\`.map(this::toInvoice)\`): stack traces show real names.
* Split long pipelines into steps with meaningful intermediate variables.
* Validate and filter nulls explicitly early (\`filter(Objects::nonNull)\` with a log of what was dropped).
* Include the offending element in exception messages when wrapping.`,
    pitfalls: [
      "Leaving peek() logging in production code.",
      "One giant pipeline with inline multi-line lambdas.",
      "Swallowing exceptions inside lambdas.",
    ],
    followUpQuestions: [
      "Why might peek not print anything?",
      "How would you add context to an exception thrown inside map?",
    ],
    faangFocus: "Practical skill question; good answers focus on code structure, not only tools.",
  },
  {
    id: 'str-31',
    categoryId: 'streams',
    title: 'Side Effects in Lambdas',
    difficulty: 'Solid',
    tags: ['Side Effects', 'forEach', 'Thread Safety', 'Parallel'],
    scenario: "`List<String> out = new ArrayList<>(); items.parallelStream().map(this::convert).forEach(out::add);` sometimes produces fewer items than expected, or throws `ArrayIndexOutOfBoundsException`.",
    question: "Why does this fail, and what's the correct pattern?",
    idealAnswer: `### The bug
\`forEach\` in a parallel stream runs on many threads at once. \`ArrayList.add\` is not thread-safe, so concurrent adds lose elements or corrupt the internal array during resize. Even sequentially, this style fights the stream model.

### The rule
Stream behavioural parameters should be **stateless and non-interfering**. Let the **terminal operation** build the result:
\`\`\`java
List<String> out = items.parallelStream().map(this::convert).toList();
\`\`\`
Collectors handle parallelism correctly: each thread accumulates into its own container, then containers are combined.

### Acceptable side effects
* \`forEach\` for final output (logging, sending) where order and thread safety are handled.
* Concurrent structures (\`ConcurrentHashMap\`, \`LongAdder\`) if you really must, but a collector is almost always cleaner.

### Swapping to a synchronized list
\`Collections.synchronizedList\` "fixes" the crash but serialises the hot path and still loses **order**.`,
    pitfalls: [
      "Accumulating into external collections in forEach.",
      "Using synchronized collections to paper over the design.",
      "Assuming forEach preserves order in parallel.",
    ],
    followUpQuestions: [
      "How does a collector combine partial results in parallel?",
      "What does non-interfering mean?",
    ],
    faangFocus: "A classic bug pattern in code-review rounds.",
  },
  {
    id: 'str-32',
    categoryId: 'streams',
    title: 'groupingBy vs groupingByConcurrent in Parallel Streams',
    difficulty: 'Hard',
    tags: ['groupingByConcurrent', 'Parallel Streams', 'Collectors'],
    scenario: "A parallel `groupingBy` over 200 million events is slower than the sequential version. Profiling shows most time spent merging maps.",
    question: "Why, and when does `groupingByConcurrent` help?",
    idealAnswer: `### How parallel groupingBy works
Each worker builds its own \`HashMap\` of groups; at the end, maps are **merged pairwise** (combining lists per key). With many distinct keys, merging costs about as much as grouping, and the merge tree runs partly serially.

### groupingByConcurrent
All threads insert into **one shared \`ConcurrentHashMap\`**, so there is no merge step. The collector is \`CONCURRENT\` and \`UNORDERED\`.
* Faster when there are many keys and a cheap downstream (e.g. \`counting\`).
* **Loses encounter order** within groups.
* Contention if there are few hot keys.

### Other options
* Reduce data first (map to compact keys) before grouping.
* \`toConcurrentMap\` with a merge function for simple aggregations.
* Question whether parallel helps at all: measure with JMH, check the source splits well, and that there's enough work per element.`,
    pitfalls: [
      "Assuming parallel groupingBy scales linearly.",
      "Expecting ordered group contents from groupingByConcurrent.",
      "Using it on a sequential stream (no benefit).",
    ],
    followUpQuestions: [
      "Which collector characteristics enable concurrent collection?",
      "How would you pre-aggregate to reduce merge cost?",
    ],
    faangFocus: "Deep parallel-streams understanding for performance-sensitive roles.",
  },
  {
    id: 'str-33',
    categoryId: 'streams',
    title: 'Deferred Execution With Supplier and Memoization',
    difficulty: 'Hard',
    tags: ['Supplier', 'Lazy Evaluation', 'Memoization', 'Logging'],
    scenario: "A debug log line builds a huge JSON string on every request even though DEBUG is off. Elsewhere, an expensive configuration value is computed on every access.",
    question: "How do Suppliers enable lazy evaluation, and how would you memoize safely?",
    idealAnswer: `### Deferring work with Supplier
Pass a **Supplier** instead of a value so the work only happens if needed:
* Logging: \`log.atDebug().setMessage(() -> toJson(order)).log()\` (SLF4J 2) or \`logger.debug(() -> ...)\` in Log4j2/JUL. With parameterised messages \`{}\`, the argument is still **evaluated**, just not formatted.
* \`Optional.orElseGet\`, \`Objects.requireNonNullElseGet\`, \`Map.computeIfAbsent\` all take functions for the same reason.

### Memoization
Compute once, return the cached value afterwards:
* Guava's \`Suppliers.memoize(supplier)\` (thread-safe, double-checked locking internally), and \`memoizeWithExpiration\`.
* A lazy holder class for static values.
* Java 25's \`StableValue\` (preview) is designed for exactly this, with JIT constant-folding.

### Doing it by hand
Use a \`volatile\` field and double-checked locking, or accept a benign race if computing twice is harmless and the value is immutable.`,
    codeSnippet: `static <T> Supplier<T> memoize(Supplier<T> delegate) {
    return new Supplier<>() {
        private volatile T value;
        public T get() {
            T v = value;
            if (v == null) {
                synchronized (this) {
                    v = value;
                    if (v == null) value = v = delegate.get();
                }
            }
            return v;
        }
    };
}`,
    pitfalls: [
      "Believing {} placeholders avoid computing arguments.",
      "Memoizing without thread safety.",
      "Memoizing values that should expire.",
    ],
    followUpQuestions: [
      "How would you memoize a function of one argument?",
      "What does StableValue promise that a volatile field doesn't?",
    ],
    faangFocus: "Connects functional concepts to real performance issues.",
  },
  {
    id: 'str-34',
    categoryId: 'streams',
    title: 'Batching a Stream With a Custom Spliterator',
    difficulty: 'Hard',
    tags: ['Spliterator', 'Batching', 'Custom Streams'],
    scenario: "You must send 10 million records to an API that accepts batches of 500, without loading everything into memory. The source is a lazy `Stream<Record>`.",
    question: "How can you batch a stream lazily? Show a Spliterator-based solution and mention newer alternatives.",
    idealAnswer: `### Why not collect first
Collecting 10 million records then partitioning defeats laziness and uses memory proportional to the input.

### A batching Spliterator
Wrap the source's spliterator. Each \`tryAdvance\` pulls up to N elements from the source into a list and emits the list. \`trySplit\` returns null (sequential), which is fine for IO-bound batching. Characteristics: \`ORDERED\` if the source is, and \`NONNULL\`.

### Java 24+: Gatherers
\`stream.gather(Gatherers.windowFixed(500))\` does exactly this with no custom code.

### Alternatives
* Iterate with an \`Iterator\` and a loop: often the simplest.
* Guava's \`Iterators.partition\`.
* Reactor's \`buffer(500)\` in reactive code.`,
    codeSnippet: `static <T> Stream<List<T>> batches(Stream<T> source, int size) {
    Spliterator<T> src = source.spliterator();
    return StreamSupport.stream(new Spliterators.AbstractSpliterator<List<T>>(
            Long.MAX_VALUE, Spliterator.ORDERED | Spliterator.NONNULL) {
        @Override
        public boolean tryAdvance(Consumer<? super List<T>> action) {
            List<T> batch = new ArrayList<>(size);
            while (batch.size() < size && src.tryAdvance(batch::add)) { }
            if (batch.isEmpty()) return false;
            action.accept(batch);
            return true;
        }
    }, false).onClose(source::close);
}

// Java 24+
source.gather(Gatherers.windowFixed(500)).forEach(api::send);`,
    pitfalls: [
      "Collecting everything before batching.",
      "Forgetting to propagate close() to the source stream.",
      "Declaring SIZED or SUBSIZED characteristics incorrectly.",
    ],
    followUpQuestions: [
      "How would you make batching parallel-friendly?",
      "What does estimateSize do and why does it matter?",
    ],
    faangFocus: "Advanced streams knowledge with an obvious practical use.",
  },
  {
    id: 'str-35',
    categoryId: 'streams',
    title: 'Stream Gatherers (Java 24)',
    difficulty: 'Hard',
    tags: ['Gatherers', 'Java 24', 'Custom Intermediate Operations'],
    scenario: "Your team needs sliding windows over sensor readings, a running total, and concurrent enrichment with a limit of 20 in-flight calls, all inside stream pipelines.",
    question: "What are Gatherers, and which built-ins cover these needs?",
    idealAnswer: `### The gap they fill
Collectors let you write custom **terminal** operations, but custom **intermediate** operations were impossible without Spliterator gymnastics. JEP 485 (final in Java 24) adds \`Stream.gather(Gatherer)\`.

### What a Gatherer is
Up to four functions: an **initializer** (per-pipeline state), an **integrator** (called per element; can push zero or more elements downstream and can **short-circuit**), an optional **combiner** (for parallel), and a **finisher** (emit remaining state at the end).

### Built-ins in \`Gatherers\`
* \`windowFixed(n)\`: batches.
* \`windowSliding(n)\`: overlapping windows, e.g. moving averages.
* \`scan(init, fn)\`: running totals (emits every intermediate value).
* \`fold(init, fn)\`: one final value, as an intermediate step.
* \`mapConcurrent(maxConcurrency, fn)\`: runs the mapping on **virtual threads** with bounded concurrency, preserving order.

### Mapping to the scenario
\`gather(windowSliding(5))\` for moving averages, \`gather(scan(() -> 0.0, Double::sum))\` for running totals, \`gather(mapConcurrent(20, this::enrich))\` for concurrent calls.`,
    codeSnippet: `List<Double> movingAvg = readings.stream()
        .gather(Gatherers.windowSliding(5))
        .map(w -> w.stream().mapToDouble(Double::doubleValue).average().orElse(0))
        .toList();

List<Enriched> out = events.stream()
        .gather(Gatherers.mapConcurrent(20, this::enrich))
        .toList();`,
    pitfalls: [
      "Stateful gatherers without a combiner run sequentially in parallel streams.",
      "Using mapConcurrent for CPU-bound work.",
      "Reimplementing windowing with index arithmetic.",
    ],
    followUpQuestions: [
      "Write a Gatherer that emits distinct elements by a key.",
      "How does mapConcurrent preserve order?",
    ],
    faangFocus: "Cutting-edge Java; knowing it signals you track the platform closely.",
  },
  {
    id: 'str-36',
    categoryId: 'streams',
    title: 'Flattening Trees With Recursive Streams',
    difficulty: 'Hard',
    tags: ['Recursion', 'flatMap', 'Trees', 'Coding'],
    scenario: "A category tree (each node has children) must be flattened to list every category with its depth, for rendering an indented menu.",
    question: "Write it with streams, and discuss recursion limits.",
    idealAnswer: `### Recursive flatMap
A node's stream is itself followed by the flattened streams of its children. \`Stream.concat\` or \`flatMap\` expresses this directly. Pass depth along.

### Limits
* Recursion depth: each level adds stack frames (more with streams than a loop). For very deep trees (thousands of levels), use an explicit stack (\`ArrayDeque\`) iteratively.
* Deeply nested \`Stream.concat\` chains can themselves cause \`StackOverflowError\`; \`flatMap\` is safer.
* Pre-order vs breadth-first: this is depth-first pre-order; BFS needs a queue.

### Java 16+ alternative
\`mapMulti\` can push elements recursively without creating intermediate streams for each node, which is cheaper.`,
    codeSnippet: `record Category(String name, List<Category> children) {}
record Row(String name, int depth) {}

static Stream<Row> flatten(Category c, int depth) {
    return Stream.concat(
            Stream.of(new Row(c.name(), depth)),
            c.children().stream().flatMap(child -> flatten(child, depth + 1)));
}

List<Row> menu = roots.stream().flatMap(r -> flatten(r, 0)).toList();`,
    pitfalls: [
      "Unbounded recursion on deep or cyclic graphs.",
      "Repeated Stream.concat nesting.",
      "Forgetting cycle detection when the structure is a graph, not a tree.",
    ],
    followUpQuestions: [
      "Rewrite it iteratively with a Deque.",
      "How would you handle cycles?",
    ],
    faangFocus: "Tests recursion plus stream composition, common for mid-senior roles.",
  },
  {
    id: 'str-37',
    categoryId: 'streams',
    title: 'Higher-Order Functions and Currying in Java',
    difficulty: 'Hard',
    tags: ['Currying', 'Higher-Order Functions', 'Partial Application'],
    scenario: "A pricing engine applies discount rules parameterised by customer tier and region. An interviewer asks how you'd model rules as functions.",
    question: "Explain higher-order functions, currying and partial application in Java, with an example.",
    idealAnswer: `### Higher-order functions
Functions that **take or return functions**. \`Comparator.comparing(keyExtractor)\` both takes and returns one. They let you build behaviour from parts.

### Currying
Transforming a function of several arguments into a chain of single-argument functions: \`(a, b) -> r\` becomes \`a -> b -> r\`. In Java: \`Function<A, Function<B, R>>\`.

### Partial application
Fix some arguments now, supply the rest later. Currying makes this trivial: \`discountFor.apply(Tier.GOLD)\` returns a function waiting for the price.

### In practice
Java's syntax makes deep currying clumsy. Use it sparingly: factories that return configured \`Function\`/\`Predicate\`s are the idiomatic Java form of partial application, and they keep rules small and testable.`,
    codeSnippet: `Function<Tier, Function<Region, UnaryOperator<BigDecimal>>> discount =
        tier -> region -> price -> price.multiply(rateFor(tier, region));

UnaryOperator<BigDecimal> goldEu = discount.apply(Tier.GOLD).apply(Region.EU);
BigDecimal finalPrice = goldEu.apply(new BigDecimal("100.00"));

// Idiomatic factory style
static Predicate<Order> totalAbove(BigDecimal min) { return o -> o.total().compareTo(min) > 0; }`,
    pitfalls: [
      "Deeply nested Function types nobody can read.",
      "Capturing mutable state in returned lambdas.",
      "Over-abstracting simple conditionals.",
    ],
    followUpQuestions: [
      "How would you compose a list of discount rules?",
      "Where does the JDK itself use higher-order functions?",
    ],
    faangFocus: "Functional-thinking question for teams using a functional style.",
  },
  {
    id: 'str-38',
    categoryId: 'streams',
    title: 'How Lambdas Are Compiled: invokedynamic and LambdaMetafactory',
    difficulty: 'Expert',
    tags: ['invokedynamic', 'LambdaMetafactory', 'Bytecode', 'JVM'],
    scenario: "An interviewer asks: 'Lambdas are not anonymous classes. What does javac actually generate, and what happens the first time a lambda expression is evaluated?'",
    question: "Explain lambda compilation and linkage.",
    idealAnswer: `### What javac emits
1. The lambda body becomes a **private synthetic method** (\`lambda$main$0\`) in the enclosing class; captured variables become its leading parameters.
2. At the lambda expression, an **\`invokedynamic\`** instruction with a bootstrap method pointing to \`LambdaMetafactory.metafactory\`.

No \`.class\` file per lambda (unlike anonymous classes).

### First evaluation (linkage)
The JVM calls the bootstrap method once per call site. \`LambdaMetafactory\` spins a **hidden class** implementing the functional interface that delegates to the synthetic method, and returns a \`CallSite\`.
* **Non-capturing** lambda: the call site returns a **constant, shared instance** every time.
* **Capturing** lambda: each evaluation allocates a new instance holding the captured values (often removed by escape analysis).

### Why this design
Flexibility: the JDK can change the translation strategy without recompiling code. It also avoids class-file bloat and speeds up class loading compared with anonymous classes.

### Practical effects
Stack traces show \`lambda$method$N\` names; the first call is slower (linkage); serialisable lambdas use \`altMetafactory\`; AOT/CDS can pre-generate these classes to improve startup.`,
    pitfalls: [
      "Believing lambdas are anonymous classes under the hood.",
      "Assuming every lambda evaluation allocates.",
      "Serialising lambdas casually (fragile across recompilation).",
    ],
    followUpQuestions: [
      "How do method references differ in their translation?",
      "Why are serializable lambdas discouraged?",
    ],
    faangFocus: "JVM-level knowledge; a differentiator for senior roles.",
  },
  {
    id: 'str-39',
    categoryId: 'streams',
    title: 'Running Parallel Streams in a Custom ForkJoinPool',
    difficulty: 'Expert',
    tags: ['Parallel Streams', 'ForkJoinPool', 'Common Pool', 'Isolation'],
    scenario: "Two features use parallel streams. One does heavy computation; the other makes blocking HTTP calls. Under load, the computation feature becomes slow because both share the common pool.",
    question: "How do you isolate parallel stream work, and what are the caveats?",
    idealAnswer: `### The shared common pool
All parallel streams use \`ForkJoinPool.commonPool()\` (parallelism = cores - 1), shared with \`CompletableFuture\` async defaults. Blocking IO in one feature starves everyone.

### The submit trick
If a parallel stream's terminal operation is invoked **from inside a ForkJoinPool task**, the stream's subtasks run in **that** pool:
\`\`\`java
ForkJoinPool pool = new ForkJoinPool(8);
List<R> out = pool.submit(() -> items.parallelStream().map(this::heavy).toList()).get();
\`\`\`

### Caveats
* It relies on **implementation behaviour**, not a documented contract, though it has been stable for years.
* The pool must be long-lived and shut down properly; don't create one per request.
* Parallel streams remain a poor fit for **blocking IO**. Use an executor with \`CompletableFuture\`, virtual threads, or \`Gatherers.mapConcurrent\`.
* The global \`java.util.concurrent.ForkJoinPool.common.parallelism\` property changes it for the whole JVM.

### Better guidance
Reserve parallel streams for CPU-bound, large, well-splitting data, and measure.`,
    pitfalls: [
      "Blocking IO in parallel streams.",
      "Creating a new ForkJoinPool per call.",
      "Treating the submit trick as a documented API.",
    ],
    followUpQuestions: [
      "Why doesn't the common pool count the calling thread in its parallelism?",
      "How would you do concurrent IO with bounded concurrency instead?",
    ],
    faangFocus: "A well-known production trap; shows depth on parallel execution.",
  },
  {
    id: 'str-40',
    categoryId: 'streams',
    title: 'Measuring Stream Performance Properly',
    difficulty: 'Expert',
    tags: ['JMH', 'Performance', 'JIT', 'Benchmarking'],
    scenario: "A blog post claims streams are 5x slower than loops. A teammate wants to ban streams from the codebase based on a benchmark using `System.nanoTime()` around a single run.",
    question: "How do you evaluate stream performance correctly, and what really drives the difference?",
    idealAnswer: `### Why naive benchmarks lie
* **JIT warm-up**: the first runs are interpreted; compiled code comes later.
* **Dead code elimination**: unused results get optimised away.
* **On-stack replacement** and profile pollution distort single long loops.
* GC and CPU frequency noise.
Use **JMH**: warm-up iterations, forks, \`Blackhole\` to consume results, and multiple parameter sizes.

### What actually drives stream cost
* **Setup overhead**: allocating pipeline stages, noticeable for tiny collections in hot loops.
* **Megamorphic call sites**: if the same stream code sees many different lambdas, the JIT can't inline them, and inlining is where most performance comes from.
* **Boxing** in \`Stream<Integer>\` vs \`IntStream\`.
* For simple pipelines over large arrays, the JIT often compiles streams to code **close to a loop**.

### The sensible conclusion
Streams are fine for the vast majority of code. On measured hot paths (tight numeric loops, per-element overhead in the millions per second), a loop may win. Decide with profiling data, not blog posts.`,
    pitfalls: [
      "Timing a single run with nanoTime.",
      "Banning or mandating streams without measurement.",
      "Ignoring boxing in numeric pipelines.",
    ],
    followUpQuestions: [
      "What does a Blackhole prevent in JMH?",
      "What is a megamorphic call site?",
    ],
    faangFocus: "Senior performance judgement; knowing JMH is expected.",
  },
  {
    id: 'str-41',
    categoryId: 'streams',
    title: 'Functional Error Handling: Result Types vs Exceptions',
    difficulty: 'Expert',
    tags: ['Error Handling', 'Either', 'Result', 'Sealed Types'],
    scenario: "A batch import stream of 1 million rows must continue past invalid rows and report all failures at the end. Throwing from inside `map` aborts the whole pipeline.",
    question: "How would you model errors functionally in Java streams?",
    idealAnswer: `### Exceptions abort the pipeline
An exception thrown from a lambda propagates out of the terminal operation and stops everything. For 'collect all errors' semantics you need errors as **values**.

### A Result type with sealed interfaces
Model success and failure explicitly (Java 17+ sealed types + records), then use pattern matching to split:
\`\`\`java
sealed interface Result<T> permits Ok, Err {}
record Ok<T>(T value) implements Result<T> {}
record Err<T>(int line, String error) implements Result<T> {}
\`\`\`
Parse each row into a \`Result\`, then \`partitioningBy(r -> r instanceof Ok)\` or \`teeing\` into successes and failures.

### Libraries
Vavr's \`Try\` and \`Either\` provide \`map\`, \`flatMap\`, \`recover\`, \`getOrElse\` and more.

### Choosing
* Exceptions: truly exceptional, unrecoverable failures, or where the caller can't continue anyway.
* Result values: **expected** failures (validation, parsing), batch processing, and when you want the compiler to force handling (exhaustive switch over a sealed type).`,
    codeSnippet: `Map<Boolean, List<Result<Row>>> split = lines.stream()
        .map(this::parse)                                  // never throws
        .collect(Collectors.partitioningBy(r -> r instanceof Ok<Row>));

List<Row> good = split.get(true).stream().map(r -> ((Ok<Row>) r).value()).toList();
List<Result<Row>> bad = split.get(false);`,
    pitfalls: [
      "Swallowing exceptions inside lambdas and returning null.",
      "Aborting a large batch on the first bad row.",
      "Result types everywhere, even for truly exceptional conditions.",
    ],
    followUpQuestions: [
      "How does exhaustive switch on sealed types help here?",
      "How would you cap the number of errors reported?",
    ],
    faangFocus: "Senior design question bridging functional style and modern Java features.",
  },
  {
    id: 'str-42',
    categoryId: 'streams',
    title: 'Java Streams vs Reactive Streams vs Flow',
    difficulty: 'Expert',
    tags: ['Reactive Streams', 'Flow API', 'Pull vs Push', 'Backpressure'],
    scenario: "A candidate says 'Java 8 streams and Reactor are basically the same thing'. The interviewer asks you to explain the difference.",
    question: "Compare java.util.stream, Reactive Streams (Reactor/RxJava) and java.util.concurrent.Flow.",
    idealAnswer: `### java.util.stream: pull, synchronous, finite
The terminal operation **pulls** elements from the source through the pipeline on the calling thread (or the FJ pool for parallel). Designed for data that is already available or can be read synchronously. No notion of time, cancellation from the outside, or asynchronous arrival.

### Reactive Streams: push, asynchronous, backpressured
Publishers **push** items to subscribers as they arrive (events, network responses), across threads, over time. Backpressure via \`request(n)\` lets slow consumers control the rate. Rich operators for time (\`timeout\`, \`buffer(Duration)\`), errors (\`retry\`), and combining async sources.

### java.util.concurrent.Flow
Java 9 added the **Reactive Streams interfaces** (\`Publisher\`, \`Subscriber\`, \`Subscription\`, \`Processor\`) to the JDK for interoperability. It has no operators; libraries like Reactor provide those and adapt to Flow.

### When to use which
Collections and in-memory transformations: java streams. Asynchronous event streams, non-blocking IO, streaming responses: reactive. With virtual threads, many request/response workloads no longer need reactive at all.`,
    pitfalls: [
      "Treating java.util.stream as asynchronous.",
      "Using reactive libraries for simple collection processing.",
      "Assuming Flow provides operators.",
    ],
    followUpQuestions: [
      "How does Reactor implement request(n) through operator chains?",
      "What changes about this comparison with virtual threads?",
    ],
    faangFocus: "Checks conceptual clarity across paradigms.",
  },
  {
    id: 'str-43',
    categoryId: 'streams',
    title: 'Associativity and Identity in Parallel Reduction',
    difficulty: 'Master',
    tags: ['reduce', 'Associativity', 'Parallel', 'Floating Point'],
    scenario: "A parallel `reduce(0.0, (a, b) -> a + b)` over prices gives a slightly different total on each run. Another `reduce(1, (a, b) -> a * 2 + b)` gives wildly different results in parallel.",
    question: "What mathematical properties must reduction functions satisfy, and what went wrong in each case?",
    idealAnswer: `### The contract for reduce(identity, accumulator, combiner)
* **Associativity**: \`(a op b) op c == a op (b op c)\`. Parallel streams split the data and reduce chunks independently, then combine them in an unspecified grouping.
* **Identity**: \`identity op x == x\` for all x. The identity is used as the starting value **for every chunk**, not once.
* **Compatibility**: \`combiner(u, accumulator(identity, t)) == accumulator(u, t)\`.

### Case 1: floating-point addition
Real addition is associative; **IEEE 754 addition is not**. Rounding depends on grouping, so different splits give different last digits. Fixes: \`BigDecimal\` for money, Kahan summation (which \`DoubleStream.sum()\` uses to reduce error), or accept and round.

### Case 2: a non-associative operator
\`a * 2 + b\` depends on grouping, so the result depends on how the data was split: not a valid reduction at all. It only works sequentially by accident.

### Common identity mistakes
\`reduce(10, Integer::sum)\` in parallel adds 10 **per chunk**. \`reduce(new ArrayList<>(), ...)\` shares one mutable identity across chunks: use \`collect\` for mutable reduction.

### Why this is theory worth knowing
Monoids (associative op + identity) are exactly what makes distributed aggregations (MapReduce, Spark, Kafka Streams) correct.`,
    pitfalls: [
      "Using a non-identity starting value.",
      "Assuming floating-point sums are deterministic in parallel.",
      "Mutable identity objects in reduce.",
    ],
    followUpQuestions: [
      "Is max associative? Is average?",
      "How would you compute an average with a parallel reduce?",
    ],
    faangFocus: "Theory-heavy but elegant; separates top candidates in functional discussions.",
  },
  {
    id: 'str-44',
    categoryId: 'streams',
    title: 'Why limit() and skip() Are Expensive on Ordered Parallel Streams',
    difficulty: 'Master',
    tags: ['limit', 'skip', 'Parallel', 'Spliterator'],
    scenario: "`IntStream.range(0, 1_000_000_000).parallel().filter(this::isPrime).limit(100).toArray()` is slower than sequential. Replacing `range` with `Stream.iterate` makes it catastrophically slow.",
    question: "Explain both observations in terms of stream internals.",
    idealAnswer: `### limit on an ordered parallel stream
\`limit(100)\` must return the **first 100 in encounter order**. Workers process chunks concurrently; a worker on a late chunk may find primes quickly, but they can only be used once all earlier chunks are known. The implementation buffers per-chunk results and cancels work that can no longer contribute, but lots of speculative work and buffering happens anyway. Sequential simply stops after 100 matches.

If order doesn't matter, \`.unordered().limit(100)\` lets any 100 matches win and short-circuit quickly.

### iterate splits terribly
\`IntStream.range\` has a **SIZED, SUBSIZED** spliterator: it splits in O(1) into balanced halves by index. \`Stream.iterate\` is inherently **sequential** (each element depends on the previous one). Its spliterator splits by **copying a prefix into an array** in growing batches, so parallelism costs extra work and memory and yields poor balance. With an infinite source plus \`limit\`, that means heavy buffering for no gain.

### Rules of thumb
* Good parallel sources: arrays, \`ArrayList\`, \`IntStream.range\`, \`HashMap\` keys.
* Bad: \`iterate\`, \`Files.lines\` (improved in JDK 9 for some cases), \`LinkedList\`, iterator-based sources.
* Avoid order-dependent operations in parallel unless required.`,
    pitfalls: [
      "Parallelising iterate/generate sources.",
      "Using limit/skip/findFirst in parallel without unordered().",
      "Assuming parallel always helps short-circuiting.",
    ],
    followUpQuestions: [
      "What do SIZED and SUBSIZED let the framework do?",
      "How does the NQ model estimate whether parallelism pays off?",
    ],
    faangFocus: "Deep internals knowledge; rare and highly differentiating.",
  },
  {
    id: 'str-45',
    categoryId: 'streams',
    title: 'Sum, Average and Max With Streams',
    difficulty: 'Core',
    tags: ['IntStream', 'sum', 'average', 'OptionalDouble'],
    scenario: "Screening: 'Given a list of integers, return the sum, the average and the max using streams. What happens for an empty list?'",
    question: "Write it and explain the return types.",
    idealAnswer: `### Use primitive streams
\`mapToInt(Integer::intValue)\` converts to \`IntStream\`, which has specialised terminal operations:
* \`sum()\` returns \`int\` (0 for empty). Beware overflow: use \`mapToLong\` for large sums.
* \`average()\` returns **\`OptionalDouble\`** (empty for an empty stream, since average is undefined).
* \`max()\`/\`min()\` return **\`OptionalInt\`**.
* \`summaryStatistics()\` gives all of them in one pass.

### On a Stream<Integer>
\`stream.max(Comparator.naturalOrder())\` returns \`Optional<Integer>\`; \`reduce(0, Integer::sum)\` works but boxes on every step.

### Empty list handling
Decide explicitly: \`average().orElse(0)\` or \`orElseThrow()\`. Returning 0 for an empty average can be misleading in reports.`,
    codeSnippet: `IntSummaryStatistics s = nums.stream().mapToInt(Integer::intValue).summaryStatistics();
long sum = nums.stream().mapToLong(Integer::longValue).sum();
double avg = nums.stream().mapToInt(Integer::intValue).average().orElse(Double.NaN);
int max = nums.stream().mapToInt(Integer::intValue).max().orElseThrow();`,
    pitfalls: [
      "int overflow in sum().",
      "Calling getAsDouble() on an empty OptionalDouble.",
      "reduce with boxing instead of primitive streams.",
    ],
    followUpQuestions: [
      "Why does average return OptionalDouble but sum returns int?",
      "How would you compute the median?",
    ],
    faangFocus: "Basic, but the Optional return types and overflow are what they look for.",
  },
  {
    id: 'str-46',
    categoryId: 'streams',
    title: 'Filtering and Inverting Maps With Streams',
    difficulty: 'Core',
    tags: ['Map', 'entrySet', 'Streams', 'Coding'],
    scenario: "Given `Map<String, Integer>` of product to stock, return only products with stock below 10, and separately build an index from stock level to the list of products.",
    question: "Write both transformations.",
    idealAnswer: `### Maps aren't streams
Stream over \`entrySet()\`, operate on \`Map.Entry\`, then collect back into a map.

### Filtering a map
Filter entries, then \`toMap(Map.Entry::getKey, Map.Entry::getValue)\`. If you want to modify the original map instead, \`map.entrySet().removeIf(...)\` is simpler.

### Inverting
Values aren't unique, so inversion is a **grouping**: \`groupingBy(Map.Entry::getValue, mapping(Map.Entry::getKey, toList()))\`. Using \`toMap\` would throw on duplicate stock levels.

### Order
Pass \`LinkedHashMap::new\` / \`TreeMap::new\` if the output order matters.`,
    codeSnippet: `Map<String, Integer> low = stock.entrySet().stream()
        .filter(e -> e.getValue() < 10)
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

Map<Integer, List<String>> byLevel = stock.entrySet().stream()
        .collect(Collectors.groupingBy(
                Map.Entry::getValue,
                TreeMap::new,
                Collectors.mapping(Map.Entry::getKey, Collectors.toList())));`,
    pitfalls: [
      "Using toMap for inversion with non-unique values.",
      "Creating a new map when in-place removeIf would do.",
      "Losing order by collecting to HashMap.",
    ],
    followUpQuestions: [
      "How would you sort the map by value?",
      "How do you merge two maps summing values for common keys?",
    ],
    faangFocus: "Routine but frequent; mistakes with duplicates are common.",
  },
  {
    id: 'str-47',
    categoryId: 'streams',
    title: 'Generating Sequences: Fibonacci With Stream.iterate',
    difficulty: 'Solid',
    tags: ['iterate', 'Coding', 'Infinite Streams', 'Records'],
    scenario: "Screening: 'Print the first 20 Fibonacci numbers using streams, then all Fibonacci numbers below 1,000.'",
    question: "Write both, and explain the iterate variants.",
    idealAnswer: `### Carry state as a pair
Each Fibonacci number depends on the previous **two**, so iterate over a pair (a record or \`long[]\`) and map to the first element.

### Two iterate forms
* \`Stream.iterate(seed, next)\`: infinite, needs \`limit\`.
* \`Stream.iterate(seed, hasNext, next)\` (Java 9): like a for loop; stops when the predicate fails. \`takeWhile\` is the equivalent on an infinite stream.

### Notes
Use \`long\` (or \`BigInteger\`): Fibonacci overflows \`int\` at the 47th term. Don't parallelise \`iterate\`: it is inherently sequential.`,
    codeSnippet: `record Pair(long a, long b) { Pair next() { return new Pair(b, a + b); } }

Stream.iterate(new Pair(0, 1), Pair::next)
        .limit(20)
        .map(Pair::a)
        .forEach(System.out::println);

Stream.iterate(new Pair(0, 1), p -> p.a() < 1_000, Pair::next)
        .map(Pair::a)
        .forEach(System.out::println);`,
    pitfalls: [
      "Forgetting limit on an infinite stream.",
      "int overflow.",
      "Using filter instead of takeWhile on an infinite stream (never terminates).",
    ],
    followUpQuestions: [
      "Why does filter(x -> x < 1000) on an infinite stream never end?",
      "How would you generate primes lazily?",
    ],
    faangFocus: "Classic screening exercise to test iterate and laziness.",
  },
  {
    id: 'str-48',
    categoryId: 'streams',
    title: 'Streaming Query Results From JPA and JDBC',
    difficulty: 'Hard',
    tags: ['JPA', 'Stream', 'Cursors', 'Transactions'],
    scenario: "An export endpoint loads 3 million rows with `findAll()` and runs out of memory. Switching to a repository method returning `Stream<Order>` throws an exception about a closed connection.",
    question: "How do you stream large result sets safely from the database?",
    idealAnswer: `### Why findAll dies
It materialises every entity (plus Hibernate snapshots for dirty checking) in memory at once.

### Stream-returning repository methods
Spring Data can return \`Stream<T>\`, backed by a JDBC cursor (\`ScrollableResults\`). Requirements:
* Must run **inside a transaction** (the connection must stay open while you consume). That's the closed-connection error.
* Must be **closed** (try-with-resources), or the cursor and connection leak.
* Set a **fetch size**: some drivers (PostgreSQL, MySQL) otherwise fetch everything into memory anyway. PostgreSQL needs autocommit off + fetch size; MySQL needs \`Integer.MIN_VALUE\` or \`useCursorFetch\`.
* **Detach** processed entities (\`entityManager.detach\` or \`clear()\` periodically) or the persistence context grows unbounded; use a read-only transaction.

### Alternatives
* Keyset pagination in batches: resilient, no long-held transaction.
* Project to DTOs rather than entities.
* JDBC \`RowCallbackHandler\` or jOOQ's lazy fetch for maximum control.
* Stream the HTTP response (\`StreamingResponseBody\`) so you don't build the whole file either.`,
    codeSnippet: `@Transactional(readOnly = true)
public void export(OutputStream out) {
    try (Stream<OrderRow> rows = repo.streamAllBy()) {
        rows.forEach(row -> {
            writeCsv(out, row);
            entityManager.detach(row);
        });
    }
}

@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "1000"))
Stream<OrderRow> streamAllBy();`,
    pitfalls: [
      "Consuming the stream outside the transaction.",
      "Not closing the stream.",
      "Driver defaults loading everything despite streaming.",
    ],
    followUpQuestions: [
      "Why might keyset pagination be preferable to a long cursor?",
      "How would you stream the result to an HTTP client?",
    ],
    faangFocus: "A practical scaling problem that combines streams with persistence knowledge.",
  },
  {
    id: 'str-49',
    categoryId: 'streams',
    title: 'Choosing Result Containers: Map Factories and Collection Suppliers',
    difficulty: 'Solid',
    tags: ['Collectors', 'toCollection', 'groupingBy', 'EnumMap'],
    scenario: "Grouped results appear in random order in a UI, and a report needs orders grouped by status into an `EnumMap` of sorted sets.",
    question: "How do you control the exact container types produced by collectors?",
    idealAnswer: `### Collection suppliers
\`Collectors.toCollection(TreeSet::new)\`, \`toCollection(ArrayDeque::new)\`, \`toCollection(() -> new TreeSet<>(comparator))\` pick the exact collection type.

### Map factories
\`groupingBy(classifier, mapFactory, downstream)\` and \`toMap(k, v, merge, mapFactory)\`:
* \`LinkedHashMap::new\`: keep first-seen order.
* \`TreeMap::new\`: sorted keys.
* \`() -> new EnumMap<>(Status.class)\`: enum keys, compact and ordered by declaration.

### Combining them
Nest the downstream collector to choose the per-group container too.`,
    codeSnippet: `EnumMap<Status, TreeSet<Order>> byStatus = orders.stream()
        .collect(Collectors.groupingBy(
                Order::status,
                () -> new EnumMap<>(Status.class),
                Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Order::createdAt)))));`,
    pitfalls: [
      "Expecting groupingBy to preserve order by default.",
      "TreeSet comparators that treat distinct orders as equal, dropping them.",
      "Casting the result of groupingBy to a specific map type.",
    ],
    followUpQuestions: [
      "Why would a TreeSet by createdAt drop orders?",
      "How do you get an unmodifiable result with collectingAndThen?",
    ],
    faangFocus: "Everyday collector fluency; the TreeSet trap is a good follow-up.",
  },
  {
    id: 'str-50',
    categoryId: 'streams',
    title: 'Lazy Evaluation Pitfalls: Late Binding and Escaping Streams',
    difficulty: 'Hard',
    tags: ['Laziness', 'Resources', 'Late Binding', 'Bugs'],
    scenario: "A method returns `Files.lines(path).filter(...)` to its caller; later the file handle leaks. Another method builds a stream from a list, the list is cleared before the terminal operation, and the result is empty.",
    question: "Explain both bugs in terms of laziness.",
    idealAnswer: `### Streams evaluate at the terminal operation
Building a pipeline does nothing. All work, including **reading the source**, happens when the terminal operation runs, which may be much later and in another method.

### Bug 1: escaping IO streams
\`Files.lines\` opens the file immediately but only reads it lazily, and the stream must be **closed** to release the handle. Returning it moves the responsibility to callers, who usually forget. Either consume it inside try-with-resources and return a result, or clearly document ownership and have callers use try-with-resources (as \`Files.lines\` does).

### Bug 2: late binding to the source
The stream reads the list **when the terminal operation runs**. Clearing the list first yields nothing; modifying it during the operation may throw CME (non-interference violation). If you need a snapshot, copy it (\`List.copyOf\`) or consume immediately.

### Similar laziness traps
* Captured values in lambdas are evaluated when the lambda runs; a captured object's state may have changed by then.
* \`Supplier\`s in logging and \`Optional.orElseGet\` run later too, possibly on another thread.`,
    pitfalls: [
      "Returning IO-backed streams from methods.",
      "Mutating the source between pipeline creation and consumption.",
      "Assuming a pipeline has done its work when constructed.",
    ],
    followUpQuestions: [
      "When is returning a Stream from an API a good idea?",
      "What does onClose do?",
    ],
    faangFocus: "Subtle bugs that show whether you really internalised laziness.",
  },
  {
    id: 'str-51',
    categoryId: 'streams',
    title: 'Group Anagrams With Streams',
    difficulty: 'Solid',
    tags: ['Coding', 'groupingBy', 'Strings'],
    scenario: "Coding round: given `[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]`, group the words that are anagrams of each other.",
    question: "Solve it with streams and state the complexity.",
    idealAnswer: `### Canonical key
Two words are anagrams if their **sorted characters** match. Group by that key.

### Complexity
For n words of length k: sorting each word is O(k log k), total O(n k log k). A **character-count key** (26 counts) makes it O(n k) for lowercase ASCII.

### Output order
\`groupingBy\` returns a \`HashMap\`, so group order is arbitrary. Use \`LinkedHashMap::new\` to keep first-seen order.`,
    codeSnippet: `Collection<List<String>> groups = words.stream()
        .collect(Collectors.groupingBy(w -> {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            return new String(c);
        }, LinkedHashMap::new, Collectors.toList()))
        .values();`,
    pitfalls: [
      "Using a character Set as the key (loses duplicates like 'aab' vs 'ab').",
      "Case and Unicode handling not specified.",
      "Returning a HashMap when order matters.",
    ],
    followUpQuestions: [
      "Implement the O(n k) counting-key version.",
      "How would you handle Unicode letters?",
    ],
    faangFocus: "A top coding question; the stream version shows groupingBy fluency.",
  },
  {
    id: 'str-52',
    categoryId: 'streams',
    title: 'First Non-Repeated Character',
    difficulty: 'Solid',
    tags: ['Coding', 'Strings', 'LinkedHashMap', 'chars()'],
    scenario: "Screening: 'Find the first non-repeated character in the string \"swiss\" using Java 8 streams.'",
    question: "Write it and explain why the collection type matters.",
    idealAnswer: `### Steps
1. \`s.chars()\` gives an \`IntStream\` of UTF-16 code units; map to \`Character\`.
2. Count with \`groupingBy(identity, LinkedHashMap::new, counting())\`. **\`LinkedHashMap\`** keeps first-occurrence order; a \`HashMap\` would return an arbitrary 'first'.
3. Find the first entry with count 1.

For "swiss", counts are s=3, w=1, i=1, so the answer is 'w'.

### Details worth mentioning
* \`chars()\` works on UTF-16 units; for emoji and other supplementary characters use \`codePoints()\`.
* O(n) time, O(alphabet) space.`,
    codeSnippet: `Optional<Character> first = s.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()))
        .entrySet().stream()
        .filter(e -> e.getValue() == 1)
        .map(Map.Entry::getKey)
        .findFirst();`,
    pitfalls: [
      "Using HashMap and losing order.",
      "Ignoring surrogate pairs.",
      "Nested loops giving O(n^2).",
    ],
    followUpQuestions: [
      "Find the first repeated character instead.",
      "How would you do it in one pass for a stream of characters?",
    ],
    faangFocus: "One of the most common Java 8 screening questions.",
  },
];
