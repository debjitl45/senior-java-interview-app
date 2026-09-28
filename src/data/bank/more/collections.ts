import type { Question } from '../../types';

/**
 * Collections, part two: the everyday APIs, the classic "build it yourself"
 * coding rounds, and the data-structure choices behind large systems.
 */
export const COLLECTIONS_MORE_QUESTIONS: Question[] = [
  {
    id: 'col-15',
    categoryId: 'collections',
    title: 'The Collections Framework Hierarchy',
    difficulty: 'Core',
    tags: ['Collections Framework', 'List', 'Set', 'Queue', 'Map'],
    scenario: "An interviewer asks you to sketch the Java Collections Framework on a whiteboard and asks why `Map` doesn't extend `Collection`.",
    question: "Describe the main interfaces and implementations, and answer the Map question.",
    idealAnswer: `### The interfaces
* **\`Iterable\`** → **\`Collection\`**: a group of elements.
  * **\`List\`**: ordered, indexed, duplicates allowed. \`ArrayList\`, \`LinkedList\`.
  * **\`Set\`**: no duplicates. \`HashSet\`, \`LinkedHashSet\` (insertion order), \`TreeSet\` (sorted, via \`SortedSet\`/\`NavigableSet\`).
  * **\`Queue\`** / **\`Deque\`**: processing order. \`ArrayDeque\`, \`PriorityQueue\`, \`LinkedList\`, and the concurrent \`BlockingQueue\`s.
* **\`Map\`**: key to value associations. \`HashMap\`, \`LinkedHashMap\`, \`TreeMap\` (\`SortedMap\`/\`NavigableMap\`), \`ConcurrentHashMap\`.
* Java 21 added **\`SequencedCollection\`**/**\`SequencedMap\`** for types with a defined encounter order.

### Why Map is not a Collection
A \`Collection\` is a group of single elements; \`add(E)\` makes no sense for a map, which stores **pairs**. Maps instead expose three collection **views**: \`keySet()\`, \`values()\` and \`entrySet()\`, which are live and support removal.

### Utility classes
\`Collections\` and \`Arrays\` hold algorithms (sort, binarySearch, unmodifiable wrappers). \`List.of\`/\`Map.of\` create immutable collections.`,
    pitfalls: [
      "Saying Map extends Collection.",
      "Forgetting that keySet/values/entrySet are live views.",
      "Using legacy Vector/Hashtable/Stack in new code.",
    ],
    followUpQuestions: [
      "What does removing from map.values() do?",
      "What does SequencedCollection add?",
    ],
    faangFocus: "An opener. Interviewers look for a structured answer, not a memorised list.",
  },
  {
    id: 'col-16',
    categoryId: 'collections',
    title: 'Choosing Between List, Set, Queue and Map',
    difficulty: 'Core',
    tags: ['Data Structures', 'Design', 'Complexity'],
    scenario: "You need to store: the steps of a checkout wizard, the unique tags on a post, pending jobs processed by priority, and user profiles looked up by ID.",
    question: "Pick a collection for each and justify it.",
    idealAnswer: `### Decision questions
1. Do I look things up **by key**? → \`Map\`.
2. Do I need **uniqueness**? → \`Set\`.
3. Do I need **position/order** with duplicates? → \`List\`.
4. Do I **process** elements in an order (FIFO, LIFO, priority)? → \`Queue\`/\`Deque\`.

### The four cases
* **Wizard steps**: \`List\` (ordered, index-based navigation). \`List.of(...)\` since it is fixed.
* **Unique tags**: \`Set\`. \`LinkedHashSet\` if display order should match insertion, \`TreeSet\` if alphabetical.
* **Jobs by priority**: \`PriorityQueue\` with a comparator (or \`PriorityBlockingQueue\` if multiple threads).
* **Profiles by ID**: \`HashMap<Long, Profile>\`, O(1) average lookup.

### Then pick the implementation
Hash-based for speed, linked variants for predictable iteration order, tree-based for sorted order and range queries, concurrent variants for shared access.`,
    pitfalls: [
      "Using a List and calling contains() in a loop (O(n^2)).",
      "Using a Map when a Set of records would do.",
      "Relying on HashMap iteration order.",
    ],
    followUpQuestions: [
      "What is the complexity of contains() on each?",
      "How would your choice change for 100 million elements?",
    ],
    faangFocus: "Checks data-structure judgement, the foundation of every coding round.",
  },
  {
    id: 'col-17',
    categoryId: 'collections',
    title: 'How HashSet Detects Duplicates',
    difficulty: 'Core',
    tags: ['HashSet', 'equals', 'hashCode', 'Internals'],
    scenario: "A `HashSet<Employee>` contains two employees with the same ID and name. The class overrides `equals` but not `hashCode`.",
    question: "How does HashSet work internally, and why are duplicates getting in?",
    idealAnswer: `### HashSet is a HashMap
\`HashSet\` stores elements as **keys** of an internal \`HashMap\`, with a shared dummy value. \`add(e)\` is \`map.put(e, PRESENT) == null\`.

### How a duplicate is detected
1. Compute \`hashCode()\` and pick a bucket.
2. Within that bucket, compare with \`equals()\`.

If \`hashCode\` is not overridden, two equal employees almost certainly have different identity hash codes, land in **different buckets**, and \`equals\` is never even called. Both get added.

### The rule
Equal objects **must** have equal hash codes. Override both, based on the same fields, and keep those fields immutable while the object is in the set. Records do this for you.`,
    codeSnippet: `record Employee(long id, String name) {}   // equals + hashCode generated

Set<Employee> s = new HashSet<>();
s.add(new Employee(1, "Ana"));
s.add(new Employee(1, "Ana"));
System.out.println(s.size());   // 1`,
    pitfalls: [
      "Overriding equals without hashCode.",
      "Using mutable fields in hashCode and mutating after insertion.",
      "Assuming HashSet preserves insertion order.",
    ],
    followUpQuestions: [
      "What does LinkedHashSet add?",
      "How does TreeSet decide duplicates?",
    ],
    faangFocus: "Standard question; the 'equals never called' detail shows real understanding.",
  },
  {
    id: 'col-18',
    categoryId: 'collections',
    title: 'Arrays vs ArrayList and How ArrayList Grows',
    difficulty: 'Core',
    tags: ['ArrayList', 'Arrays', 'Capacity', 'Amortised Complexity'],
    scenario: "Profiling shows millions of `Arrays.copyOf` calls while a batch job adds 5 million items to an `ArrayList` one by one.",
    question: "Compare arrays and ArrayList, explain ArrayList's growth strategy, and fix the batch job.",
    idealAnswer: `### Arrays
Fixed length, can hold primitives, covariant (\`String[]\` is an \`Object[]\`, with runtime \`ArrayStoreException\`), minimal overhead.

### ArrayList
A resizable wrapper around an \`Object[]\`: generic, boxed elements only, rich API.
* **size** = number of elements; **capacity** = length of the backing array.
* When full, it grows to about **1.5x** the old capacity and copies everything (\`Arrays.copyOf\`).
* Because growth is geometric, \`add\` is **amortised O(1)**, but each resize is O(n) and produces garbage.
* A no-arg \`new ArrayList<>()\` starts with an empty shared array and allocates 10 on first add.

### Fixing the batch job
Presize: \`new ArrayList<>(5_000_000)\` or \`ensureCapacity\`. That removes about 30 resize-and-copy cycles. For primitives, an \`int[]\` or a primitive collection avoids 5 million \`Integer\` objects.

### Other costs
\`add(0, x)\` and \`remove(0)\` shift every element: O(n). Use \`ArrayDeque\` for queue-like access.`,
    pitfalls: [
      "Not presizing when the size is known.",
      "Confusing capacity with size.",
      "Inserting at the front of an ArrayList in a loop.",
    ],
    followUpQuestions: [
      "What does trimToSize() do?",
      "Why is amortised O(1) not the same as O(1) for latency-sensitive code?",
    ],
    faangFocus: "Checks amortised analysis, a frequent follow-up in coding rounds.",
  },
  {
    id: 'col-19',
    categoryId: 'collections',
    title: 'Removing Elements While Iterating',
    difficulty: 'Core',
    tags: ['Iterator', 'removeIf', 'ConcurrentModificationException'],
    scenario: "A loop `for (Order o : orders) if (o.isCancelled()) orders.remove(o);` throws `ConcurrentModificationException`, but only on some inputs.",
    question: "Why does this fail only sometimes, and what are the correct ways to remove during iteration?",
    idealAnswer: `### Why it fails
The enhanced for loop uses an \`Iterator\`. \`orders.remove(o)\` changes \`modCount\`; the iterator's next call to \`next()\` notices and throws CME.

### Why only sometimes
The check happens in \`next()\`. If the removed element was the **second-to-last**, \`hasNext()\` compares cursor to the now-smaller size and returns false, so the loop ends silently and **skips the last element** without an exception. Fail-fast is best-effort, not guaranteed.

### Correct options
* **\`removeIf\`** (Java 8+): clearest and O(n) for \`ArrayList\` (it compacts in one pass).
* **Explicit \`Iterator\`** with \`it.remove()\`.
* Build a **new filtered list** with a stream.
* Iterate **backwards by index** when you must use indices.

For maps: \`map.entrySet().removeIf(e -> ...)\` or \`map.values().removeIf(...)\`.`,
    codeSnippet: `orders.removeIf(Order::isCancelled);

for (Iterator<Order> it = orders.iterator(); it.hasNext(); ) {
    if (it.next().isCancelled()) it.remove();
}`,
    pitfalls: [
      "Relying on CME to always be thrown.",
      "Removing by index while iterating forward, skipping elements.",
      "Calling list.remove inside forEach.",
    ],
    followUpQuestions: [
      "Why is removeIf faster than iterator removal on ArrayList?",
      "How do concurrent collections behave here instead?",
    ],
    faangFocus: "Common in screens; the silent second-to-last case impresses interviewers.",
  },
  {
    id: 'col-20',
    categoryId: 'collections',
    title: 'The Traps of Arrays.asList',
    difficulty: 'Core',
    tags: ['Arrays.asList', 'List.of', 'Immutability'],
    scenario: "`Arrays.asList(1, 2, 3).add(4)` throws `UnsupportedOperationException`. `Arrays.asList(new int[]{1,2,3}).size()` returns 1. Changing the array changes the list.",
    question: "Explain all three behaviours and compare with `List.of`.",
    idealAnswer: `### Arrays.asList returns a fixed-size view
It returns \`java.util.Arrays.ArrayList\` (a private class, not \`java.util.ArrayList\`) that **wraps the array**:
* \`add\`/\`remove\` throw \`UnsupportedOperationException\` (size is fixed).
* \`set\` works and **writes through** to the array; changes to the array show up in the list.

### The int[] case
The parameter is \`T... a\`. Generics cannot be primitives, so \`int[]\` becomes a single \`T\` = \`int[]\`: you get a \`List<int[]>\` with one element. Use \`Integer[]\`, \`IntStream.of(arr).boxed().toList()\`, or \`Arrays.stream\`.

### List.of
* Truly **immutable**: \`set\`, \`add\`, \`remove\` all throw.
* **Rejects nulls** (even \`contains(null)\` throws NPE).
* Makes its own copy; unaffected by later changes to the source array.

### When you want a normal mutable list
\`new ArrayList<>(Arrays.asList(...))\` or \`new ArrayList<>(List.of(...))\`.`,
    pitfalls: [
      "Passing Arrays.asList results to code that adds elements.",
      "Arrays.asList on primitive arrays.",
      "List.of with nulls, or calling contains(null) on it.",
    ],
    followUpQuestions: [
      "What's the difference between List.copyOf and Collections.unmodifiableList?",
      "Why does Stream.toList() return an unmodifiable list?",
    ],
    faangFocus: "Popular trick question; covering all three behaviours earns full marks.",
  },
  {
    id: 'col-21',
    categoryId: 'collections',
    title: 'ArrayDeque vs Stack vs LinkedList for Stacks and Queues',
    difficulty: 'Core',
    tags: ['ArrayDeque', 'Stack', 'Deque', 'Queue'],
    scenario: "A code review flags `Stack<Integer>` and `LinkedList` used as a queue in a performance-sensitive parser.",
    question: "What should you use for stacks and queues in modern Java, and why?",
    idealAnswer: `### ArrayDeque is the default
\`ArrayDeque\` implements \`Deque\` over a circular array:
* \`push\`/\`pop\`/\`peek\` for **stack** behaviour.
* \`offer\`/\`poll\`/\`peek\` for **queue** behaviour.
* Amortised O(1) at both ends, cache-friendly, no per-node allocation.
* Does **not allow null** (null is used as the 'empty' signal).

### Why not Stack
\`Stack\` extends \`Vector\`: every method is \`synchronized\` (needless cost), and it exposes index-based methods that break stack semantics. Its own Javadoc recommends \`Deque\`.

### Why not LinkedList
Allocates a node per element (about 24 extra bytes each), pointer chasing hurts caches, and it permits nulls. It is only useful when you need removal in the middle **through an iterator** and even then rarely wins.

### Concurrency
None of these are thread-safe. Use \`ConcurrentLinkedDeque\` or a \`BlockingDeque\`.

### Method pairs
\`add\`/\`remove\`/\`element\` **throw** on failure; \`offer\`/\`poll\`/\`peek\` **return** false/null. Pick one style consistently.`,
    pitfalls: [
      "Using Stack or Vector in new code.",
      "Inserting null into an ArrayDeque.",
      "Mixing push/pop with offer/poll and getting confused about which end is used.",
    ],
    followUpQuestions: [
      "Which end does push() use on an ArrayDeque?",
      "When might LinkedList still be the right call?",
    ],
    faangFocus: "Shows modern API habits; used in almost every BFS/DFS coding problem.",
  },
  {
    id: 'col-22',
    categoryId: 'collections',
    title: 'Iterating a Map Efficiently',
    difficulty: 'Core',
    tags: ['Map', 'entrySet', 'Iteration', 'Performance'],
    scenario: "A report loops `for (String k : map.keySet()) total += map.get(k);` over a TreeMap with 2 million entries and takes seconds.",
    question: "What's wrong with the loop, and what are the idiomatic ways to iterate a map?",
    idealAnswer: `### The problem
\`keySet()\` + \`get(k)\` does a **second lookup per key**. For a \`HashMap\` that doubles the work; for a \`TreeMap\` each \`get\` is O(log n), so the loop is O(n log n) instead of O(n).

### Idiomatic options
* **\`entrySet()\`**: key and value together, one traversal.
* **\`map.forEach((k, v) -> ...)\`**: concise, same cost.
* **\`values()\`** when you only need values.
* Streams over \`entrySet()\` for transformations.

### Modifying while iterating
* Update values: \`entry.setValue(v)\` or \`map.replaceAll((k, v) -> ...)\`.
* Remove: \`map.entrySet().removeIf(e -> ...)\`.
* Never call \`map.put\`/\`remove\` for other keys inside the loop.

### Order
\`HashMap\`: unspecified. \`LinkedHashMap\`: insertion (or access) order. \`TreeMap\`: sorted by key.`,
    codeSnippet: `long total = 0;
for (Map.Entry<String, Long> e : map.entrySet()) total += e.getValue();

map.replaceAll((k, v) -> v * 2);
map.entrySet().removeIf(e -> e.getValue() == 0);`,
    pitfalls: [
      "keySet() + get() double lookups.",
      "Modifying the map structure during iteration.",
      "Depending on HashMap iteration order in tests.",
    ],
    followUpQuestions: [
      "Is entry.setValue safe during iteration?",
      "How would you iterate a ConcurrentHashMap in parallel?",
    ],
    faangFocus: "Everyday code-quality question, often in code review rounds.",
  },
  {
    id: 'col-23',
    categoryId: 'collections',
    title: 'An LRU Cache With LinkedHashMap',
    difficulty: 'Solid',
    tags: ['LinkedHashMap', 'LRU', 'Caching', 'Access Order'],
    scenario: "You need a quick in-process LRU cache capped at 1,000 entries for a single-threaded component.",
    question: "Implement it with LinkedHashMap and explain how it works.",
    idealAnswer: `### Two features make it work
1. **Access order**: the constructor \`LinkedHashMap(capacity, loadFactor, true)\` moves an entry to the end of the linked list on every \`get\`/\`put\`. The head is the least recently used.
2. **\`removeEldestEntry\`**: called after each insertion; returning true evicts the head.

### Caveats
* **Not thread-safe**. Even \`get\` mutates the linked order, so concurrent readers corrupt it. \`Collections.synchronizedMap\` works but serialises everything.
* In access-order mode, iterating while calling \`get\` throws CME.
* For production, **Caffeine** gives near-optimal hit rates (W-TinyLFU), concurrency, expiry and stats.`,
    codeSnippet: `final class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxEntries;

    LruCache(int maxEntries) {
        super(16, 0.75f, true);          // accessOrder = true
        this.maxEntries = maxEntries;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxEntries;
    }
}`,
    pitfalls: [
      "Forgetting the accessOrder flag, which gives FIFO eviction instead of LRU.",
      "Sharing it across threads.",
      "Assuming get() is a read-only operation in access-order mode.",
    ],
    followUpQuestions: [
      "Implement LRU without LinkedHashMap.",
      "Why does Caffeine beat plain LRU on real workloads?",
    ],
    faangFocus: "Very frequently asked; knowing the one-liner and its limits is ideal.",
  },
  {
    id: 'col-24',
    categoryId: 'collections',
    title: 'PriorityQueue Internals and Top-K Problems',
    difficulty: 'Solid',
    tags: ['PriorityQueue', 'Heap', 'Top-K', 'Algorithms'],
    scenario: "From a stream of 100 million log lines you need the 10 slowest requests, with little memory.",
    question: "How does PriorityQueue work, and how do you solve top-K efficiently?",
    idealAnswer: `### A binary heap in an array
\`PriorityQueue\` is a **min-heap** by default (smallest per natural order or comparator at the head).
* \`offer\`/\`poll\`: O(log n) (sift up / sift down).
* \`peek\`: O(1).
* \`remove(Object)\`/\`contains\`: O(n).
* **Iteration order is not sorted**; only the head is guaranteed.

### Top-K with a bounded min-heap
Keep a heap of size K ordered by duration ascending. For each item, add it; if size exceeds K, \`poll\` the smallest. The heap always holds the K largest seen so far.
* Time O(n log K), memory O(K). For K=10 and 100M items that's trivial.
* Sorting everything would be O(n log n) and O(n) memory.

### Alternatives
Quickselect for an in-memory array (O(n) average). For distributed streams, compute top-K per partition then merge.`,
    codeSnippet: `PriorityQueue<Request> heap = new PriorityQueue<>(Comparator.comparingLong(Request::durationMs));
for (Request r : requests) {
    heap.offer(r);
    if (heap.size() > 10) heap.poll();     // drop the fastest
}
List<Request> slowest = new ArrayList<>(heap);
slowest.sort(Comparator.comparingLong(Request::durationMs).reversed());`,
    pitfalls: [
      "Iterating a PriorityQueue expecting sorted order.",
      "Using a max-heap for top-K largest (it must be a min-heap of size K).",
      "Mutating fields used by the comparator while elements are queued.",
    ],
    followUpQuestions: [
      "How would you find the median of a stream?",
      "How does PriorityBlockingQueue differ?",
    ],
    faangFocus: "Top-K is one of the most common coding interview patterns.",
  },
  {
    id: 'col-25',
    categoryId: 'collections',
    title: 'EnumMap and EnumSet',
    difficulty: 'Solid',
    tags: ['EnumMap', 'EnumSet', 'Performance', 'Bit Vectors'],
    scenario: "Order status counters are stored in a `HashMap<Status, Integer>` and permission checks use `HashSet<Permission>`. Both are on a hot path.",
    question: "Why are EnumMap and EnumSet better here, and how are they implemented?",
    idealAnswer: `### EnumSet: a bit vector
Each enum constant has an ordinal. \`RegularEnumSet\` (up to 64 constants) stores membership in **a single \`long\`**; \`JumboEnumSet\` uses a \`long[]\`. \`contains\` is a bit test, \`addAll\`/\`retainAll\` are bitwise OR/AND. Tiny memory, extremely fast, iteration in declaration order.

### EnumMap: an array indexed by ordinal
Values are stored in an array of size = number of constants. No hashing, no entry objects, iteration in declaration order.

### API notes
* \`EnumSet.of(A, B)\`, \`noneOf\`, \`allOf\`, \`range(A, D)\`, \`complementOf\`.
* Neither allows null keys/elements.
* Not thread-safe.

### Design bonus
Replace bit-flag \`int\` constants (\`READ | WRITE\`) with \`EnumSet<Permission>\`: type-safe and just as fast.`,
    codeSnippet: `enum Permission { READ, WRITE, DELETE, ADMIN }

EnumSet<Permission> editor = EnumSet.of(Permission.READ, Permission.WRITE);
boolean canDelete = editor.contains(Permission.DELETE);

EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);
orders.forEach(o -> counts.merge(o.status(), 1, Integer::sum));`,
    pitfalls: [
      "Using HashMap/HashSet with enum keys out of habit.",
      "Storing enum ordinals in databases (fragile if constants are reordered).",
      "Using int bit flags instead of EnumSet.",
    ],
    followUpQuestions: [
      "Why does EnumMap need the enum Class in its constructor?",
      "How would you persist an EnumSet efficiently?",
    ],
    faangFocus: "Effective Java knowledge; a nice signal of idiomatic Java.",
  },
  {
    id: 'col-26',
    categoryId: 'collections',
    title: 'WeakHashMap and IdentityHashMap',
    difficulty: 'Hard',
    tags: ['WeakHashMap', 'IdentityHashMap', 'References', 'Memory'],
    scenario: "A teammate uses `WeakHashMap<String, Metadata>` as a cache with string literal keys and wonders why nothing is ever evicted. Another uses a `HashMap` to track visited nodes in an object graph and gets wrong results for objects with custom equals.",
    question: "Explain both special-purpose maps and what went wrong.",
    idealAnswer: `### WeakHashMap
Keys are held through **\`WeakReference\`s**. When a key is no longer strongly reachable anywhere else, the GC can clear it and the entry is purged on a later map operation.

Why nothing is evicted: **string literals are interned** and strongly referenced by the constant pool, so they never become unreachable. Also note:
* It evicts based on **key reachability, not memory pressure or age**. It is not a cache. Use Caffeine with size or time bounds.
* If the **value** references its key, the key stays strongly reachable and nothing is collected.
* Legitimate use: attaching metadata to objects whose lifecycle you do not control.

### IdentityHashMap
Compares keys with **\`==\`** and uses \`System.identityHashCode\`, deliberately violating the \`Map\` contract. Implemented with open addressing (linear probing) in one array.
Correct uses: object-graph traversal (serialisers, deep copy, cycle detection) where two **equal but distinct** objects must be tracked separately; proxies and topology-preserving transforms.

### The graph bug
With \`HashMap\`, two different nodes that are \`equals\` count as the same visited node, so part of the graph is skipped. \`IdentityHashMap\` (or \`Collections.newSetFromMap(new IdentityHashMap<>())\`) fixes it.`,
    pitfalls: [
      "Using WeakHashMap as a general cache.",
      "Values that strongly reference their keys.",
      "Using IdentityHashMap where logical equality is intended.",
    ],
    followUpQuestions: [
      "How do WeakReference and SoftReference differ?",
      "Why is IdentityHashMap implemented with open addressing?",
    ],
    faangFocus: "Deeper API knowledge; the interned-string trap is a nice touch.",
  },
  {
    id: 'col-27',
    categoryId: 'collections',
    title: 'NavigableMap and Range Queries With TreeMap',
    difficulty: 'Solid',
    tags: ['TreeMap', 'NavigableMap', 'Range Queries', 'Red-Black Tree'],
    scenario: "A pricing service needs the tax rate in effect for any date, where rates change on arbitrary dates. A developer loops over a list of rate periods for every lookup.",
    question: "How does TreeMap solve this in O(log n), and what other NavigableMap operations are useful?",
    idealAnswer: `### TreeMap is a red-black tree
Keys are kept sorted (natural order or comparator). \`get\`, \`put\`, \`remove\` are O(log n), and it supports **navigation**:
* \`floorEntry(k)\`: greatest key ≤ k. \`ceilingEntry(k)\`: smallest key ≥ k.
* \`lowerEntry\` / \`higherEntry\`: strictly less / greater.
* \`headMap\`, \`tailMap\`, \`subMap(from, fromInclusive, to, toInclusive)\`: **live range views**.
* \`firstEntry\`, \`lastEntry\`, \`pollFirstEntry\`, \`descendingMap\`.

### The tax rate lookup
Store rates keyed by effective date. \`floorEntry(date)\` returns the rate in effect: O(log n) instead of a linear scan.

### Other uses
Time-series lookups, IP range to region mapping, version lookups, leaderboards by score (with care for ties), consistent-hash rings.

### Concurrency
\`TreeMap\` is not thread-safe; \`ConcurrentSkipListMap\` is the concurrent navigable map.`,
    codeSnippet: `NavigableMap<LocalDate, BigDecimal> rates = new TreeMap<>();
rates.put(LocalDate.of(2023, 1, 1), new BigDecimal("0.18"));
rates.put(LocalDate.of(2024, 7, 1), new BigDecimal("0.20"));

BigDecimal rate = Optional.ofNullable(rates.floorEntry(orderDate))
        .map(Map.Entry::getValue)
        .orElseThrow(() -> new IllegalStateException("No rate before " + orderDate));`,
    pitfalls: [
      "Linear scans over sorted data.",
      "Forgetting that floorEntry can return null.",
      "Comparators inconsistent with equals, silently merging keys.",
    ],
    followUpQuestions: [
      "Are subMap views live? What happens if you insert outside the range?",
      "How would you do this lookup in SQL efficiently?",
    ],
    faangFocus: "Practical and algorithmic; many interval problems reduce to floor/ceiling lookups.",
  },
  {
    id: 'col-28',
    categoryId: 'collections',
    title: 'Writing Good hashCode Implementations',
    difficulty: 'Solid',
    tags: ['hashCode', 'Records', 'Hashing', 'Performance'],
    scenario: "A `Point(int x, int y)` class uses `return x + y;` as its hashCode. A map with a million points is 100x slower than expected.",
    question: "What makes a good hashCode, and what's wrong with this one?",
    idealAnswer: `### Requirements vs quality
* **Required**: equal objects → equal hash codes; stable while the object is in a hash structure.
* **Quality**: unequal objects should **spread** across the int range.

### Why x + y is bad
(1,3), (2,2), (3,1), (0,4) all hash to 4. Points on the same anti-diagonal collide. With a million points, buckets hold hundreds of entries; lookups degrade toward O(log n) (treeified bins) or O(n).

### A good pattern
Combine fields with a prime multiplier: \`31 * x + y\` (what \`Objects.hash\` and records effectively do). The multiplication spreads contributions so ordering matters and collisions drop.

### Practical advice
* Use **records** or IDE-generated/\`Objects.hash\` implementations.
* \`Objects.hash(a, b, c)\` allocates a varargs array and boxes primitives; for hot paths write it by hand.
* Cache the hash for **immutable** objects that are expensive to hash (like \`String\` does).
* HashMap already mixes the high bits into the low bits (\`h ^ (h >>> 16)\`), but it cannot fix values that are **equal**.`,
    codeSnippet: `record Point(int x, int y) {}   // good hashCode for free

// Hand-written, hot path
@Override public int hashCode() { return 31 * x + y; }`,
    pitfalls: [
      "Summing or XOR-ing fields (symmetric, collides a lot).",
      "Including mutable fields.",
      "Using Objects.hash in very hot code without measuring.",
    ],
    followUpQuestions: [
      "Why 31?",
      "How can hash collisions become a security issue?",
    ],
    faangFocus: "Checks understanding beyond 'override both methods'.",
  },
  {
    id: 'col-29',
    categoryId: 'collections',
    title: 'Sort Stability and TimSort',
    difficulty: 'Solid',
    tags: ['Sorting', 'TimSort', 'Stability', 'Comparator'],
    scenario: "A table is sorted by name, then the user sorts by department. Employees within each department must remain alphabetical.",
    question: "Does Java's sort guarantee this? Explain stability and which algorithms Java uses.",
    idealAnswer: `### Stability
A sort is **stable** if elements that compare equal keep their original relative order. Sorting by department after sorting by name keeps names alphabetical within each department, but only with a stable sort.

### What Java uses
* **Objects** (\`List.sort\`, \`Collections.sort\`, \`Arrays.sort(Object[])\`): **TimSort**, stable, O(n log n) worst case, and close to O(n) on partially sorted data because it detects existing runs and merges them.
* **Primitives** (\`Arrays.sort(int[])\`): **Dual-Pivot Quicksort**, not stable. Stability is meaningless for primitives since equal values are indistinguishable.
* \`Arrays.parallelSort\`: parallel merge sort for large arrays.

### Better than relying on two passes
Express the full ordering in one comparator:
\`\`\`java
list.sort(Comparator.comparing(Employee::department)
                    .thenComparing(Employee::name));
\`\`\`

### Contract violations
TimSort may throw 'Comparison method violates its general contract!' for inconsistent comparators (e.g. subtraction overflow, random comparisons).`,
    pitfalls: [
      "Assuming all sorts are stable.",
      "Comparators using subtraction (a - b) that overflow.",
      "Multiple sort passes instead of one composed comparator.",
    ],
    followUpQuestions: [
      "Why doesn't Java use quicksort for objects?",
      "When does TimSort run in near-linear time?",
    ],
    faangFocus: "Good knowledge check; the primitive vs object distinction is often missed.",
  },
  {
    id: 'col-30',
    categoryId: 'collections',
    title: 'Binary Search and Insertion Points',
    difficulty: 'Core',
    tags: ['Binary Search', 'Arrays', 'Algorithms'],
    scenario: "`Collections.binarySearch(list, 42)` returns -6 and a developer treats it as 'not found, index 0'.",
    question: "How do Java's binary search methods work and what does a negative result mean?",
    idealAnswer: `### Preconditions
The list or array must be **sorted by the same ordering** you search with. Otherwise results are undefined (not an exception, just wrong).

### Return value
* Found: the index of **an** occurrence (not necessarily the first if duplicates exist).
* Not found: **\`-(insertionPoint) - 1\`**, where the insertion point is where the key would go to keep order. -6 means 'not found, would insert at index 5'. The encoding keeps 0 unambiguous.

\`\`\`java
int i = Collections.binarySearch(list, key);
int insertAt = i >= 0 ? i : -i - 1;
\`\`\`

### Complexity
O(log n) on random-access lists; on a \`LinkedList\` the traversal makes it O(n) (Java uses an iterator-based variant).

### Writing your own
Use \`int mid = (lo + hi) >>> 1\` to avoid overflow (a bug that lived in the JDK for years). For 'first occurrence' or 'lower bound' variants, keep searching left after a match.`,
    pitfalls: [
      "Searching unsorted data.",
      "Misinterpreting negative results.",
      "Overflow in (lo + hi) / 2.",
    ],
    followUpQuestions: [
      "Implement lower_bound in Java.",
      "How does TreeMap.ceilingKey relate to this?",
    ],
    faangFocus: "Quick algorithmic check; the overflow bug story is well known.",
  },
  {
    id: 'col-31',
    categoryId: 'collections',
    title: 'Counting and Grouping With Map.merge and computeIfAbsent',
    difficulty: 'Core',
    tags: ['Map', 'merge', 'computeIfAbsent', 'Idioms'],
    scenario: "Code to count word frequencies has five lines of `if (map.containsKey(w)) ... else ...`, and grouping orders by customer has another eight.",
    question: "Rewrite both using modern Map methods and explain what each does.",
    idealAnswer: `### Counting: merge
\`map.merge(key, 1, Integer::sum)\` inserts 1 if absent, otherwise applies the function to the old value and 1. If the function returns null, the entry is **removed**.

### Grouping: computeIfAbsent
\`map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)\` creates the list only when needed and returns the existing or new value.

### Others worth knowing
* \`getOrDefault(k, d)\`: read with a default (does not insert).
* \`putIfAbsent(k, v)\`: insert if missing. Note that it evaluates \`v\` eagerly.
* \`compute(k, (k, old) -> ...)\`: general read-modify-write.
* \`computeIfPresent\`.

### Or use streams
\`Collectors.groupingBy(Order::customerId)\` and \`groupingBy(w -> w, counting())\` when building the whole map at once.

On a \`ConcurrentHashMap\` these methods are **atomic**, which makes them the right tool for concurrent counters too.`,
    codeSnippet: `Map<String, Integer> freq = new HashMap<>();
for (String w : words) freq.merge(w, 1, Integer::sum);

Map<Long, List<Order>> byCustomer = new HashMap<>();
for (Order o : orders) byCustomer.computeIfAbsent(o.customerId(), k -> new ArrayList<>()).add(o);`,
    pitfalls: [
      "putIfAbsent(k, new ArrayList<>()) allocating a list every call.",
      "Modifying the map inside a computeIfAbsent function.",
      "Using getOrDefault and expecting it to store the default.",
    ],
    followUpQuestions: [
      "What happens if the mapping function in computeIfAbsent returns null?",
      "Why is merge atomic on ConcurrentHashMap but not on a synchronizedMap?",
    ],
    faangFocus: "Idiomatic Java; interviewers notice verbose containsKey patterns.",
  },
  {
    id: 'col-32',
    categoryId: 'collections',
    title: 'Sequenced Collections in Java 21',
    difficulty: 'Solid',
    tags: ['SequencedCollection', 'Java 21', 'LinkedHashMap', 'API'],
    scenario: "Getting the last element of a `LinkedHashSet` required iterating the whole set. A colleague says Java 21 fixed this.",
    question: "What do SequencedCollection, SequencedSet and SequencedMap add, and which types implement them?",
    idealAnswer: `### The gap
Many collections have a defined encounter order (\`List\`, \`Deque\`, \`LinkedHashSet\`, \`SortedSet\`, \`LinkedHashMap\`) but there was no common type and no uniform way to access both ends. \`LinkedHashSet\` had no \`getLast\` at all.

### New interfaces (JEP 431)
* **\`SequencedCollection<E>\`**: \`getFirst\`, \`getLast\`, \`addFirst\`, \`addLast\`, \`removeFirst\`, \`removeLast\`, and **\`reversed()\`**, which returns a live reverse-ordered **view**.
* **\`SequencedSet<E>\`**: \`reversed()\` returns a SequencedSet.
* **\`SequencedMap<K,V>\`**: \`firstEntry\`, \`lastEntry\`, \`pollFirstEntry\`, \`putFirst\`, \`putLast\`, \`sequencedKeySet\`, \`sequencedValues\`, \`sequencedEntrySet\`, \`reversed()\`.

### Who implements them
\`List\`, \`Deque\`, \`LinkedHashSet\`, \`SortedSet\`/\`TreeSet\`, \`LinkedHashMap\`, \`SortedMap\`/\`TreeMap\`. Not \`HashSet\`/\`HashMap\` (no order).

### Gotchas
* \`addFirst\` on a \`SortedSet\` throws \`UnsupportedOperationException\` (position is determined by the comparator).
* For \`LinkedHashSet\`, \`addFirst\` of an existing element **moves** it.
* Adding methods like \`getFirst\` to \`List\` broke some third-party classes that already had conflicting methods.`,
    codeSnippet: `LinkedHashSet<String> recent = new LinkedHashSet<>(List.of("a", "b", "c"));
String newest = recent.getLast();            // "c"
for (String s : recent.reversed()) { ... }   // c, b, a (live view)`,
    pitfalls: [
      "Expecting HashSet to implement SequencedSet.",
      "Treating reversed() as a copy.",
      "Calling addFirst on sorted collections.",
    ],
    followUpQuestions: [
      "Why is reversed() a view rather than a copy?",
      "How would you have gotten the last element of a LinkedHashMap before Java 21?",
    ],
    faangFocus: "Checks you are keeping up with modern Java APIs.",
  },
  {
    id: 'col-33',
    categoryId: 'collections',
    title: 'HashMap Under Concurrent Writes',
    difficulty: 'Hard',
    tags: ['HashMap', 'Concurrency', 'Race Conditions', 'Resizing'],
    scenario: "A static `HashMap` used as a cache is written by several request threads. On Java 7 a production server once went to 100% CPU forever; on Java 17 some entries just vanish.",
    question: "Explain both failure modes of an unsynchronized HashMap under concurrent writes.",
    idealAnswer: `### Java 7: infinite loop
Resizing moved entries to the new table by **head insertion**, reversing bucket order. Two threads resizing at once could create a **cycle** in a bucket's linked list. Any later \`get\` on that bucket looped forever, pinning a core.

### Java 8+: no cycle, still broken
Java 8 preserves order during resize (split into lo/hi lists with tail insertion), so the classic cycle is gone. But concurrent writes still:
* **Lose entries**: two threads insert into the same empty bin and one overwrites the other; one thread's resize discards another's insert.
* Corrupt \`size\` (non-atomic \`++size\`).
* Race during **treeification**, which can produce broken trees and exceptions.
* Readers may see partially constructed state without happens-before.

### The only fixes
\`ConcurrentHashMap\`, external synchronization, or an immutable map swapped atomically. "It mostly works" is not a property of a data structure.`,
    pitfalls: [
      "Believing Java 8 made HashMap safe for concurrent use.",
      "Using static HashMaps as caches in web apps.",
      "Synchronizing writes but not reads.",
    ],
    followUpQuestions: [
      "How does ConcurrentHashMap resize without these problems?",
      "How would you find this issue from a thread dump?",
    ],
    faangFocus: "A classic senior question; the Java 7 vs 8 distinction is the key detail.",
  },
  {
    id: 'col-34',
    categoryId: 'collections',
    title: 'Initial Capacity and Load Factor in Practice',
    difficulty: 'Solid',
    tags: ['HashMap', 'Capacity', 'Load Factor', 'Performance'],
    scenario: "A developer writes `new HashMap<>(1000)` to hold exactly 1,000 entries and is surprised to see a resize in the profiler.",
    question: "Why does it still resize, and how should you size hash-based collections?",
    idealAnswer: `### Capacity vs threshold
A HashMap resizes when \`size > capacity * loadFactor\`. With the default load factor **0.75**:
* \`new HashMap<>(1000)\` rounds capacity up to a power of two: **1024**.
* Threshold = 1024 x 0.75 = **768**. Entry 769 triggers a resize to 2048.

### Correct sizing
* Java 19+: **\`HashMap.newHashMap(1000)\`** (and \`HashSet.newHashSet\`, \`LinkedHashMap.newLinkedHashMap\`) computes the capacity for you.
* Before that: \`new HashMap<>((int) Math.ceil(n / 0.75))\` or Guava's \`Maps.newHashMapWithExpectedSize\`.

### Load factor trade-off
Lower load factor = fewer collisions, more memory. Higher = denser, more collisions. 0.75 is a good default; changing it is rarely worth it.

### When it matters
Hot paths that build many maps (per request), or very large maps where each resize rehashes millions of entries and briefly doubles memory.`,
    pitfalls: [
      "Passing the expected size as the initial capacity.",
      "Tuning load factor instead of fixing the hash function.",
      "Over-presizing tiny maps, wasting memory.",
    ],
    followUpQuestions: [
      "Why must HashMap capacity be a power of two?",
      "What happens to iteration cost with a huge capacity and few entries?",
    ],
    faangFocus: "A small detail that shows real profiling experience.",
  },
  {
    id: 'col-35',
    categoryId: 'collections',
    title: 'Hash Flooding Attacks and HashMap Treeification',
    difficulty: 'Hard',
    tags: ['Security', 'Hash Collisions', 'DoS', 'Treeification'],
    scenario: "A public API parses JSON objects into `HashMap`s. An attacker sends requests with thousands of keys that all have the same hash code and CPU usage explodes.",
    question: "Explain the attack and what Java does, and doesn't do, to defend against it.",
    idealAnswer: `### The attack
If an attacker can choose keys whose hash codes collide, every insert lands in the same bucket. With linked-list buckets each insert is O(n), so n inserts cost **O(n^2)**. \`String.hashCode\` is deterministic and public, and colliding strings are easy to generate ('Aa' and 'BB' collide, and so do all combinations of them). A few MB of JSON can burn minutes of CPU.

### Java 8's defence: treeification
When a bucket exceeds **8 entries** (and the table has at least 64 slots), it becomes a **red-black tree**, so worst-case lookup is **O(log n)**. Tree ordering uses the hash, then \`compareTo\` if keys are \`Comparable\` (String is), then a tie-breaker. The attack degrades from quadratic to n log n, which removes most of the leverage.

### What it doesn't do
* Java does not use randomised/seeded hashing for \`String\` (some other languages do).
* Keys that are **not Comparable** still help attackers somewhat.

### Additional defences
Limit request size and number of keys/nesting in the JSON parser (Jackson has \`StreamReadConstraints\`), rate limit, and avoid building maps from untrusted keys where not needed.`,
    pitfalls: [
      "Assuming hash maps are always O(1).",
      "No limits on untrusted input sizes.",
      "Custom key types with weak hash functions on public endpoints.",
    ],
    followUpQuestions: [
      "Why do trees only kick in at 64+ table capacity?",
      "How do other languages randomise hashing?",
    ],
    faangFocus: "Connects data structures to security; valued in platform and security-minded teams.",
  },
  {
    id: 'col-36',
    categoryId: 'collections',
    title: 'ConcurrentSkipListMap: Sorted and Concurrent',
    difficulty: 'Hard',
    tags: ['ConcurrentSkipListMap', 'Skip List', 'Concurrency', 'Sorted Map'],
    scenario: "An order book needs price levels sorted, with many threads adding and removing orders and reading the best bid concurrently.",
    question: "Why is ConcurrentSkipListMap a good fit, and how does a skip list work?",
    idealAnswer: `### Skip lists
A sorted linked list with extra **express lanes**: each node is promoted to higher levels with probability ½ (or ¼), so searches skip ahead and descend, giving **O(log n) expected** search, insert and delete. Unlike balanced trees, inserts need no global rebalancing, only local pointer updates.

### Why that suits concurrency
Local updates can be done with **CAS on individual links**, so \`ConcurrentSkipListMap\` is **lock-free**. A red-black tree's rotations touch many nodes at once, which is why there is no concurrent TreeMap.

### What you get
* Full \`NavigableMap\` API (\`firstEntry\` for best bid, \`ceilingEntry\`, range views) with thread safety.
* Weakly consistent iterators; \`size()\` is O(n) and approximate.
* Higher memory per entry and slower than \`TreeMap\` single-threaded.

### Alternatives
\`Collections.synchronizedSortedMap\` (one lock), or single-threaded ownership of the book (common in real exchanges: one thread per instrument, no locks).`,
    pitfalls: [
      "Calling size() in hot loops.",
      "Assuming atomic multi-key operations.",
      "Using it where single-thread ownership would be simpler and faster.",
    ],
    followUpQuestions: [
      "Why is ConcurrentSkipListMap's size() O(n)?",
      "How would you design an order book for maximum throughput?",
    ],
    faangFocus: "A deeper structures question used in trading and infrastructure interviews.",
  },
  {
    id: 'col-37',
    categoryId: 'collections',
    title: 'subList Views and Their Surprises',
    difficulty: 'Hard',
    tags: ['subList', 'Views', 'Memory Leak', 'ConcurrentModificationException'],
    scenario: "A service keeps `bigList.subList(0, 10)` as a 'top 10' field. Memory never drops, and later the code throws CME when accessing it.",
    question: "Explain what subList returns and fix both problems.",
    idealAnswer: `### subList is a view
\`list.subList(from, to)\` returns a **view** backed by the original list, not a copy:
* Changes through the view (\`set\`, \`add\`, \`remove\`, \`clear\`) modify the parent. \`list.subList(10, 20).clear()\` is an idiomatic range delete.
* The view holds a **reference to the parent**, so the whole big list cannot be garbage collected: the memory leak.
* If the parent is **structurally modified** other than through the view, any later use of the view throws \`ConcurrentModificationException\`.

### Fix
Copy when you want to keep it: \`List.copyOf(bigList.subList(0, 10))\` or \`new ArrayList<>(...)\`.

### Same pattern elsewhere
\`Map.keySet()\`, \`TreeMap.subMap\`, \`String.substring\` before Java 7u6 (shared the char array), \`ByteBuffer.slice()\`. Views are great for zero-copy operations and dangerous to store long-term.`,
    pitfalls: [
      "Storing views in long-lived fields.",
      "Modifying the parent then using an old view.",
      "Assuming subList is a snapshot.",
    ],
    followUpQuestions: [
      "How would you delete elements 100 to 200 from an ArrayList efficiently?",
      "What changed with String.substring in Java 7?",
    ],
    faangFocus: "A subtle API behaviour that shows up as real memory leaks.",
  },
  {
    id: 'col-38',
    categoryId: 'collections',
    title: 'Implement an O(1) LRU Cache From Scratch',
    difficulty: 'Hard',
    tags: ['LRU', 'Doubly Linked List', 'HashMap', 'Coding'],
    scenario: "Coding round: 'Implement `get(key)` and `put(key, value)` for an LRU cache with capacity N. Both must be O(1). No LinkedHashMap.'",
    question: "Implement it and walk through the invariants.",
    idealAnswer: `### Data structures
* A **HashMap** from key to node, for O(1) lookup.
* A **doubly linked list** of nodes in recency order, for O(1) move and removal. Sentinel head and tail nodes remove null checks.

### Operations
* \`get\`: look up node; if present, **move it to the front** and return its value.
* \`put\`: if present, update and move to front. Otherwise create a node, add to the front and map; if size exceeds capacity, **remove the tail's predecessor** from both list and map.

### Invariants to state
The map and list always contain the same nodes; the node after head is most recent; the node before tail is least recent.

### Extensions interviewers ask
Thread safety (a lock around both, or segment by key hash), TTLs, LFU instead of LRU, and why real caches (Caffeine) use approximations like W-TinyLFU.`,
    codeSnippet: `final class LRU<K, V> {
    private final class Node { K k; V v; Node prev, next; }
    private final Map<K, Node> map = new HashMap<>();
    private final Node head = new Node(), tail = new Node();
    private final int cap;

    LRU(int cap) { this.cap = cap; head.next = tail; tail.prev = head; }

    V get(K k) {
        Node n = map.get(k);
        if (n == null) return null;
        unlink(n); addFront(n);
        return n.v;
    }

    void put(K k, V v) {
        Node n = map.get(k);
        if (n != null) { n.v = v; unlink(n); addFront(n); return; }
        n = new Node(); n.k = k; n.v = v;
        map.put(k, n); addFront(n);
        if (map.size() > cap) { Node lru = tail.prev; unlink(lru); map.remove(lru.k); }
    }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }
}`,
    pitfalls: [
      "Forgetting to store the key in the node (needed to remove from the map on eviction).",
      "Using a singly linked list, making removal O(n).",
      "Updating the value without moving the node.",
    ],
    followUpQuestions: [
      "Make it thread-safe with minimal contention.",
      "Implement LFU in O(1).",
    ],
    faangFocus: "One of the most frequently asked coding problems at product companies.",
  },
  {
    id: 'col-39',
    categoryId: 'collections',
    title: 'Implement a HashMap From Scratch',
    difficulty: 'Hard',
    tags: ['HashMap', 'Hashing', 'Coding', 'Resizing'],
    scenario: "Coding round: 'Build a simple generic hash map with put, get and remove, supporting resizing.'",
    question: "Implement it and explain collisions, resizing and the complexity.",
    idealAnswer: `### Design
* An array of buckets, each a singly linked list of \`Node(key, value, hash, next)\` (separate chaining).
* **Index**: spread the hash (\`h ^ (h >>> 16)\`) and mask with \`(capacity - 1)\` when capacity is a power of two.
* **Resize** when size exceeds capacity x 0.75: allocate double the array and re-insert every node.
* Support a \`null\` key by treating its hash as 0 and comparing with \`Objects.equals\`.

### Complexity
Average O(1) for all operations with a good hash; O(n) worst case in one bucket (Java's real HashMap reduces that to O(log n) by treeifying). Resize is O(n), amortised O(1) per insert.

### What to mention
Cache the hash in each node to avoid recomputing it during resize and to short-circuit equals; keys must not mutate; not thread-safe.`,
    codeSnippet: `final class SimpleMap<K, V> {
    private static final class Node<K, V> {
        final int hash; final K key; V value; Node<K, V> next;
        Node(int h, K k, V v, Node<K, V> n) { hash = h; key = k; value = v; next = n; }
    }

    private Node<K, V>[] table = newTable(16);
    private int size;

    @SuppressWarnings("unchecked")
    private static <K, V> Node<K, V>[] newTable(int n) { return (Node<K, V>[]) new Node[n]; }

    private static int hash(Object k) { int h = Objects.hashCode(k); return h ^ (h >>> 16); }

    V get(K key) {
        int h = hash(key);
        for (Node<K, V> n = table[h & (table.length - 1)]; n != null; n = n.next)
            if (n.hash == h && Objects.equals(n.key, key)) return n.value;
        return null;
    }

    V put(K key, V value) {
        int h = hash(key), i = h & (table.length - 1);
        for (Node<K, V> n = table[i]; n != null; n = n.next)
            if (n.hash == h && Objects.equals(n.key, key)) { V old = n.value; n.value = value; return old; }
        table[i] = new Node<>(h, key, value, table[i]);
        if (++size > table.length * 3 / 4) resize();
        return null;
    }

    private void resize() {
        Node<K, V>[] old = table;
        table = newTable(old.length * 2);
        for (Node<K, V> head : old)
            for (Node<K, V> n = head; n != null; ) {
                Node<K, V> next = n.next;
                int i = n.hash & (table.length - 1);
                n.next = table[i]; table[i] = n;
                n = next;
            }
    }
}`,
    pitfalls: [
      "Using hashCode % length with negative hash codes.",
      "Forgetting to rehash on resize.",
      "Comparing keys with == instead of equals.",
    ],
    followUpQuestions: [
      "Implement remove().",
      "How would open addressing change the design?",
    ],
    faangFocus: "Classic 'build the data structure' round; clarity about invariants matters most.",
  },
  {
    id: 'col-40',
    categoryId: 'collections',
    title: 'Generics With Collections: PECS and Wildcards',
    difficulty: 'Hard',
    tags: ['Generics', 'Wildcards', 'PECS', 'Type Safety'],
    scenario: "A method `void addAll(List<Number> target, List<Number> src)` can't be called with a `List<Integer>` source, and an attempt to add to a `List<? extends Number>` doesn't compile.",
    question: "Explain invariance, wildcards and the PECS rule with these examples.",
    idealAnswer: `### Generics are invariant
\`List<Integer>\` is **not** a \`List<Number>\`. If it were, you could add a \`Double\` to a list of integers through the \`List<Number>\` reference. (Arrays are covariant and fail at runtime with \`ArrayStoreException\`; generics fail at compile time instead.)

### Wildcards
* **\`? extends T\`**: some unknown subtype of T. You can **read** T out, but cannot add anything except null, since the compiler doesn't know the exact type.
* **\`? super T\`**: some supertype of T. You can **add** T, but reads only give \`Object\`.

### PECS: Producer Extends, Consumer Super
If a parameter **produces** values for you, use \`extends\`; if it **consumes** values you give it, use \`super\`:
\`\`\`java
static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T t : src) dest.add(t);
}
\`\`\`
That is exactly the signature of \`Collections.copy\`. Comparators are consumers: \`Comparator<? super T>\`.

### Guidance
Do not use wildcards in **return types**; they force callers to deal with them. Use them in parameters to make APIs flexible.`,
    pitfalls: [
      "Assuming List<Integer> is a List<Number>.",
      "Trying to add to a List<? extends T>.",
      "Returning wildcard types from public APIs.",
    ],
    followUpQuestions: [
      "Why is Comparator<? super T> used in sort()?",
      "What's the difference between List<?> and List<Object>?",
    ],
    faangFocus: "A long-standing Java interview topic; PECS explained with an example is the target.",
  },
  {
    id: 'col-41',
    categoryId: 'collections',
    title: 'Type Erasure and Its Consequences',
    difficulty: 'Solid',
    tags: ['Generics', 'Type Erasure', 'Primitives', 'Arrays'],
    scenario: "A developer tries `new T[10]`, `if (list instanceof List<String>)` and `List<int>`. None of them compile.",
    question: "Explain type erasure and why each of those is disallowed.",
    idealAnswer: `### Erasure
Generic type information is checked at **compile time** and then **erased**: \`List<String>\` and \`List<Integer>\` are both just \`List\` at runtime, with casts inserted by the compiler. This kept bytecode compatible with pre-Java-5 code.

### Consequences
* **\`new T[10]\`**: the runtime doesn't know T, so it cannot create an array of the right component type (arrays are reified and check element types at runtime). Workarounds: pass a \`Class<T>\` or \`IntFunction<T[]>\`, or use a \`List<T>\`.
* **\`instanceof List<String>\`**: the runtime has no String information. Only \`instanceof List<?>\` is allowed.
* **\`List<int>\`**: type arguments must be reference types because erased code works with \`Object\`. Use \`List<Integer>\` (boxing) or primitive collections. Project **Valhalla** aims to change this.
* You cannot overload \`m(List<String>)\` and \`m(List<Integer>)\`: same erasure.
* Static fields are shared across all parameterisations.

### What survives
Generic signatures of classes, fields and methods are kept in class file metadata, which is how frameworks like Jackson read \`List<Order>\` field types via reflection (\`TypeReference\` trick).`,
    pitfalls: [
      "Thinking generics exist at runtime for local variables.",
      "Unchecked casts that hide heap pollution.",
      "Overloading methods that differ only in type arguments.",
    ],
    followUpQuestions: [
      "How does Jackson's TypeReference capture a generic type?",
      "What is heap pollution?",
    ],
    faangFocus: "Checks understanding of how Java generics really work.",
  },
  {
    id: 'col-42',
    categoryId: 'collections',
    title: 'Bloom Filters and Probabilistic Data Structures',
    difficulty: 'Expert',
    tags: ['Bloom Filter', 'HyperLogLog', 'Probabilistic', 'Memory'],
    scenario: "A signup service checks whether a username is taken against a database of 500 million names. Most checks are for names that do not exist, and the DB is overloaded.",
    question: "How would a Bloom filter help, and what other probabilistic structures should a senior engineer know?",
    idealAnswer: `### Bloom filter
A bit array of m bits and k hash functions. To add, set k bits. To query, check k bits: if any is 0 the element is **definitely absent**; if all are 1 it is **probably present**.
* **No false negatives**, tunable false positive rate.
* About **10 bits per element for 1%** false positives: 500M names in ~600MB instead of many GB.
* No deletion (use a counting Bloom filter or a cuckoo filter for that).

### Applying it
Check the filter first. 'Definitely absent' answers skip the database entirely; only 'maybe present' goes to the DB for confirmation. Rebuild or grow periodically. Guava's \`BloomFilter\` and Redis \`BF.*\` commands implement it.

### Other structures
* **HyperLogLog**: cardinality estimate (unique visitors) in ~12KB with ~1% error. Redis \`PFADD\`/\`PFCOUNT\`.
* **Count-Min Sketch**: approximate frequencies for heavy-hitter detection.
* **t-digest / HDR Histogram**: accurate percentiles for latency metrics.

### Where they appear in real systems
LSM-tree databases (Cassandra, RocksDB) use Bloom filters to avoid disk reads for missing keys; CDNs and caches use them to avoid caching one-hit wonders.`,
    pitfalls: [
      "Using a Bloom filter where false positives are unacceptable without a confirmation step.",
      "Undersizing, so the false-positive rate climbs as it fills.",
      "Expecting to delete elements from a standard Bloom filter.",
    ],
    followUpQuestions: [
      "How do you choose m and k for a target false-positive rate?",
      "Why do LSM trees keep one Bloom filter per SSTable?",
    ],
    faangFocus: "A system-design-adjacent data structure question common at large-scale companies.",
  },
  {
    id: 'col-43',
    categoryId: 'collections',
    title: 'Data Structures for a 10-Million-Player Leaderboard',
    difficulty: 'Expert',
    tags: ['Leaderboard', 'Ranking', 'Skip List', 'Redis'],
    scenario: "A game needs: update a player's score, get a player's rank, and list the top 100, for 10 million players with thousands of updates per second.",
    question: "Which data structures give efficient rank queries, and how would you build this?",
    idealAnswer: `### Why simple structures fail
* Sorted array: rank is a binary search, but updates are O(n).
* HashMap + sort on demand: O(n log n) per rank query.
* TreeMap by score: ordered, but **rank** (how many are above me) requires counting, O(n).

### Order-statistic structures
You need **O(log n) update and O(log n) rank**:
* **Augmented balanced tree** (order-statistic tree): each node stores its subtree size, so rank is computed on the way down.
* **Skip list with span counts**: each forward pointer records how many nodes it skips. This is exactly how **Redis sorted sets** implement \`ZRANK\` and \`ZREVRANGE\`.
* **Fenwick tree / segment tree over score buckets**: if scores are bounded integers, rank = prefix sum of counts above your score, O(log maxScore).

### Practical design
Redis \`ZADD\`/\`ZREVRANK\`/\`ZREVRANGE\` for the live board, with a map from player ID to current score. Tie-breaking by encoding the timestamp into the score. Shard by region or season if one sorted set gets too hot, and approximate global ranks for the long tail ('top 5%') where exactness does not matter.`,
    pitfalls: [
      "Assuming TreeMap gives O(log n) rank.",
      "Ignoring ties in scores.",
      "Recomputing the full ranking per request.",
    ],
    followUpQuestions: [
      "How would you keep a global leaderboard across 20 Redis shards?",
      "How do you break ties deterministically?",
    ],
    faangFocus: "A classic design-meets-data-structures question at gaming and social companies.",
  },
  {
    id: 'col-44',
    categoryId: 'collections',
    title: 'Tries for Autocomplete',
    difficulty: 'Hard',
    tags: ['Trie', 'Autocomplete', 'Prefix Search', 'Coding'],
    scenario: "Build a search box that suggests the top 5 product names for a typed prefix across 2 million products.",
    question: "Implement a trie for prefix search and discuss how to make it fast and memory-efficient.",
    idealAnswer: `### Structure
Each node represents a prefix and has children keyed by the next character. A word ends at a node flagged as terminal. Prefix lookup is O(L) in the prefix length, independent of how many words exist.

### Top-K suggestions
Walking the whole subtree for 'a' is expensive. Precompute and store the **top K completions at each node** (by popularity), updated on insert. Queries become O(L).

### Memory
* Children as \`HashMap<Character, Node>\` is flexible but heavy; an array of 26 is fast but wastes space for sparse nodes.
* **Radix/compressed tries** merge single-child chains.
* For huge static dictionaries, **FSTs** (finite state transducers, used by Lucene) are extremely compact.

### In production
Often Elasticsearch/OpenSearch completion suggesters (FST-based) or a precomputed prefix → suggestions map in Redis for the most common prefixes.`,
    codeSnippet: `final class Trie {
    private static final class Node {
        final Map<Character, Node> kids = new HashMap<>();
        boolean word;
    }
    private final Node root = new Node();

    void insert(String w) {
        Node n = root;
        for (char c : w.toCharArray()) n = n.kids.computeIfAbsent(c, k -> new Node());
        n.word = true;
    }

    List<String> startsWith(String prefix, int limit) {
        Node n = root;
        for (char c : prefix.toCharArray()) if ((n = n.kids.get(c)) == null) return List.of();
        List<String> out = new ArrayList<>();
        collect(n, new StringBuilder(prefix), out, limit);
        return out;
    }

    private void collect(Node n, StringBuilder sb, List<String> out, int limit) {
        if (out.size() >= limit) return;
        if (n.word) out.add(sb.toString());
        for (var e : n.kids.entrySet()) {
            sb.append(e.getKey());
            collect(e.getValue(), sb, out, limit);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
}`,
    pitfalls: [
      "Walking whole subtrees per keystroke.",
      "Ignoring memory overhead of per-node HashMaps.",
      "Case and Unicode normalisation issues.",
    ],
    followUpQuestions: [
      "How would you rank suggestions by popularity?",
      "How do you support typo tolerance?",
    ],
    faangFocus: "Common coding + design question; top-K caching per node is the senior insight.",
  },
  {
    id: 'col-45',
    categoryId: 'collections',
    title: 'Consistent Hashing With a TreeMap',
    difficulty: 'Expert',
    tags: ['Consistent Hashing', 'TreeMap', 'Sharding', 'Distributed Systems'],
    scenario: "A cache cluster uses `hash(key) % N` to pick a node. Adding one node invalidates almost the entire cache.",
    question: "Explain consistent hashing and implement the ring with a Java collection.",
    idealAnswer: `### The modulo problem
With \`hash % N\`, changing N changes the node for about (N-1)/N of all keys. Adding a 5th node remaps ~80% of keys: a cache stampede.

### Consistent hashing
Place nodes on a ring of hash values. A key belongs to the **first node clockwise** from its hash. Adding or removing a node only moves keys between it and its neighbour: about 1/N of keys.

### Virtual nodes
With few nodes, positions are uneven. Give each physical node 100-200 **virtual nodes** at different ring positions to smooth distribution and to spread the load of a failed node across many peers.

### Implementation
A \`TreeMap<Long, Node>\` (or \`ConcurrentSkipListMap\` if updated concurrently) is the ring. Lookup = \`ceilingEntry(hash)\`, wrapping to \`firstEntry()\`. O(log V).

### Alternatives
Rendezvous (highest random weight) hashing needs no ring; jump consistent hash is tiny and fast but only supports numbered buckets.`,
    codeSnippet: `final class HashRing<N> {
    private final NavigableMap<Long, N> ring = new TreeMap<>();
    private final int vnodes;

    HashRing(int vnodes) { this.vnodes = vnodes; }

    void add(N node) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(node + "#" + i), node);
    }

    void remove(N node) {
        for (int i = 0; i < vnodes; i++) ring.remove(hash(node + "#" + i));
    }

    N nodeFor(String key) {
        Map.Entry<Long, N> e = ring.ceilingEntry(hash(key));
        return (e != null ? e : ring.firstEntry()).getValue();
    }

    private static long hash(String s) {        // use a well-mixed hash, e.g. Murmur3
        return Hashing.murmur3_128().hashString(s, StandardCharsets.UTF_8).asLong();
    }
}`,
    pitfalls: [
      "Using String.hashCode (poorly distributed) for ring positions.",
      "Too few virtual nodes, causing hotspots.",
      "Forgetting the wrap-around case.",
    ],
    followUpQuestions: [
      "How does replication work on a consistent hash ring (DynamoDB/Cassandra)?",
      "Compare with rendezvous hashing.",
    ],
    faangFocus: "Appears in both coding and system design rounds at large companies.",
  },
  {
    id: 'col-46',
    categoryId: 'collections',
    title: 'Persistent Collections and Structural Sharing',
    difficulty: 'Expert',
    tags: ['Immutability', 'Persistent Data Structures', 'Structural Sharing'],
    scenario: "An event-sourced aggregate keeps an immutable `List.copyOf` of all its events and copies it on every new event. Appending the 100,000th event takes milliseconds.",
    question: "What are persistent data structures, and how do they avoid full copies?",
    idealAnswer: `### Copy-on-write is O(n) per change
\`List.copyOf\` or copy-then-add duplicates the whole array. Appending n events costs O(n^2) overall.

### Persistent (functional) data structures
Every "modification" returns a new version, and **old versions remain valid**, but new versions **share most of their structure** with old ones.
* **Persistent vector** (Clojure, Scala, Vavr): a wide tree (32-way branching). An append copies only the path from root to leaf: O(log32 n), effectively constant.
* **HAMT** (hash array mapped trie) for maps and sets: same idea keyed by hash bits.
* **Cons lists**: prepend is O(1) and shares the tail.

### When they're useful
Undo/history, concurrent readers needing snapshots without locks, event-sourced state, and functional-style code. Java libraries: **Vavr**, PCollections, Clojure's collections from Java.

### Costs
Slower reads than arrays (pointer chasing), more allocation. For plain immutability of small collections, \`List.of\`/\`copyOf\` is still best.`,
    pitfalls: [
      "Copying large immutable collections on every change.",
      "Using unmodifiable views and calling them immutable.",
      "Assuming persistent structures are as fast as arrays for reads.",
    ],
    followUpQuestions: [
      "How does a 32-way branching factor keep depth small?",
      "How would you snapshot state for concurrent readers without persistent structures?",
    ],
    faangFocus: "Functional programming depth; relevant for event-sourcing and high-concurrency designs.",
  },
  {
    id: 'col-47',
    categoryId: 'collections',
    title: 'Cache-Friendly Layouts and Value Classes',
    difficulty: 'Master',
    tags: ['Memory Layout', 'Valhalla', 'Cache Locality', 'Performance'],
    scenario: "A risk engine iterates over 50 million `Trade` objects in an `ArrayList` summing one field. It's 10x slower than an equivalent C++ loop.",
    question: "Why, and how can you restructure data in Java for cache efficiency?",
    idealAnswer: `### Arrays of references, not objects
An \`ArrayList<Trade>\` is an array of **pointers**. Each \`Trade\` is a separate heap object with a 12-16 byte header, possibly scattered across the heap. Summing one field means a **cache miss per element** to follow each pointer, loading a 64-byte line to use 8 bytes of it. C++ can store structs **inline** in a contiguous array.

### Restructuring
* **Struct of arrays**: keep \`double[] notional\`, \`long[] timestamp\`, etc. The sum loop scans one contiguous array: hardware prefetching, full cache-line use, and the JIT can **auto-vectorise** it (SIMD). Often 10x+ faster.
* **Flat off-heap layouts** (\`MemorySegment\` from the FFM API) for very large datasets.
* The **Vector API** (incubating) for explicit SIMD.
* Primitive collections to avoid boxing.

### Project Valhalla
**Value classes** (identity-free objects) let the JVM **flatten** instances into arrays and fields, giving C-like layouts while keeping object syntax. Once it ships, \`Trade[]\` of a value class can be stored inline.

### Trade-offs
SoA hurts readability and makes per-entity access awkward. Use it for the hot analytic paths, measured with JMH and perf counters.`,
    pitfalls: [
      "Micro-optimising the loop body while ignoring memory layout.",
      "Benchmarking without JMH.",
      "Rewriting everything as SoA instead of just the hot path.",
    ],
    followUpQuestions: [
      "How would you verify cache misses are the bottleneck?",
      "What does 'identity-free' allow the JVM to do?",
    ],
    faangFocus: "Low-latency and performance-engineering roles; shows mechanical sympathy.",
  },
  {
    id: 'col-48',
    categoryId: 'collections',
    title: 'Holding 100 Million Entries Without Killing the GC',
    difficulty: 'Master',
    tags: ['Off-Heap', 'GC', 'Chronicle Map', 'Memory'],
    scenario: "A service caches 100 million small records in a `HashMap<Long, Record>` using a 64GB heap. Full GCs take 30 seconds and the service keeps failing health checks.",
    question: "Why is this map so expensive, and what are the options?",
    idealAnswer: `### The real cost
Each entry is roughly: \`HashMap.Node\` (32 bytes) + boxed \`Long\` key (16) + \`Record\` object (header + fields) + table slot (4-8). Easily **80-150 bytes** for maybe 24 bytes of data, and 300M+ objects. Every GC has to mark that graph; old-gen collections scale with it.

### Options, in increasing effort
1. **Modern low-pause GC**: ZGC or Shenandoah keep pauses in milliseconds regardless of heap size, trading some throughput. Often the fastest win.
2. **Primitive-keyed maps** (fastutil \`Long2ObjectOpenHashMap\`, Eclipse Collections): no boxed keys or node objects; open addressing in arrays. Often halves memory.
3. **Flatten records** into primitive arrays or \`byte[]\` slabs indexed by a primitive map: few objects for the GC to trace.
4. **Off-heap**: Chronicle Map, MapDB, or your own \`MemorySegment\`-based store. Invisible to the GC, can be memory-mapped and shared across processes, but you serialise on access.
5. **Move it out of process**: Redis/embedded RocksDB if latency allows.

### Decide with data
Heap histogram (\`jcmd GC.class_histogram\`) to see where bytes go, GC logs to see pause causes, and a latency budget for access.`,
    pitfalls: [
      "Just increasing the heap, which lengthens pauses.",
      "Boxed keys and values for primitive data.",
      "Going off-heap without accounting for serialisation cost.",
    ],
    followUpQuestions: [
      "How does ZGC keep pauses independent of heap size?",
      "How would you estimate per-entry overhead precisely?",
    ],
    faangFocus: "Senior performance question that blends collections, GC and system trade-offs.",
  },
  {
    id: 'col-49',
    categoryId: 'collections',
    title: 'Big-O of Common Collection Operations',
    difficulty: 'Core',
    tags: ['Complexity', 'Big-O', 'Performance'],
    scenario: "Rapid-fire round: the interviewer asks for the time complexity of a dozen collection operations.",
    question: "Give the complexity of the key operations on the main collections, with caveats.",
    idealAnswer: `| Operation | ArrayList | LinkedList | HashMap/HashSet | TreeMap/TreeSet | ArrayDeque | PriorityQueue |
|---|---|---|---|---|---|---|
| get by index | O(1) | O(n) | – | – | – | – |
| add at end | O(1) amortised | O(1) | O(1) amortised | O(log n) | O(1) amortised | O(log n) |
| add/remove at front | O(n) | O(1) | – | – | O(1) | – |
| contains | O(n) | O(n) | O(1) avg | O(log n) | O(n) | O(n) |
| remove(Object) | O(n) | O(n) | O(1) avg | O(log n) | O(n) | O(n) |
| min/max | O(n) | O(n) | O(n) | O(log n) | – | O(1) peek |


### Caveats that interviewers like
* HashMap worst case is O(log n) since Java 8 (treeified bins), O(n) before.
* LinkedList insertion is O(1) **only if you already have the position** (via an iterator); finding it is O(n).
* \`size()\` on \`ConcurrentLinkedQueue\` and \`ConcurrentSkipListMap\` is O(n).
* Big-O hides constants: ArrayList beats LinkedList for most real workloads due to cache locality.`,
    pitfalls: [
      "Claiming LinkedList insertion is always O(1).",
      "Forgetting amortisation.",
      "Ignoring constant factors and memory locality.",
    ],
    followUpQuestions: [
      "What is the complexity of removeIf on ArrayList?",
      "Why is PriorityQueue.remove(Object) O(n)?",
    ],
    faangFocus: "Rapid-fire fundamentals; mistakes here are costly early in a loop.",
  },
  {
    id: 'col-50',
    categoryId: 'collections',
    title: 'Deduplicating While Preserving Order',
    difficulty: 'Core',
    tags: ['LinkedHashSet', 'Deduplication', 'Streams'],
    scenario: "A list of email addresses must be deduplicated, keeping the first occurrence order, and treating addresses case-insensitively.",
    question: "Show a few ways to do this and their trade-offs.",
    idealAnswer: `### Exact duplicates, keep order
\`new ArrayList<>(new LinkedHashSet<>(list))\` or \`list.stream().distinct().toList()\`. Both are O(n) and keep first occurrences. \`HashSet\` would lose the order.

### Custom equality (case-insensitive)
\`distinct()\` and sets use \`equals\`, so you need a **key**:
* Track seen keys: a \`Set<String>\` of normalised keys, and keep an element only if \`seen.add(key)\` returns true.
* Or \`Collectors.toMap(key, identity, (a, b) -> a, LinkedHashMap::new)\` then take \`values()\`.
* A \`TreeSet\` with \`String.CASE_INSENSITIVE_ORDER\` dedupes case-insensitively but **sorts** instead of preserving order.

### Normalisation matters
Trim, lowercase with \`Locale.ROOT\` (not the default locale; Turkish 'I' is a famous bug), and for emails decide whether the local part is case-sensitive for your domain.`,
    codeSnippet: `Set<String> seen = new HashSet<>();
List<String> unique = emails.stream()
        .filter(e -> seen.add(e.trim().toLowerCase(Locale.ROOT)))
        .toList();`,
    pitfalls: [
      "Using HashSet and losing order.",
      "toLowerCase() without a locale.",
      "Stateful filters in parallel streams (the seen set must be sequential or concurrent).",
    ],
    followUpQuestions: [
      "Why is a stateful lambda in filter risky?",
      "How would you dedupe 1 billion emails that do not fit in memory?",
    ],
    faangFocus: "An everyday task that reveals attention to detail.",
  },
  {
    id: 'col-51',
    categoryId: 'collections',
    title: 'BitSet for Compact Flags',
    difficulty: 'Solid',
    tags: ['BitSet', 'Memory', 'Bit Manipulation'],
    scenario: "You must track which of 100 million user IDs (dense integers) have been processed. A `HashSet<Integer>` uses over 5GB.",
    question: "How does BitSet solve this, and what are its limits?",
    idealAnswer: `### One bit per ID
\`BitSet\` stores bits in a \`long[]\`. 100 million flags need about **12.5MB**, versus gigabytes for a \`HashSet<Integer>\` (each entry: node + boxed Integer + table slot).
* \`set(i)\`, \`get(i)\`, \`clear(i)\`: O(1).
* \`nextSetBit\`/\`nextClearBit\`: fast scans using word-level operations.
* \`and\`, \`or\`, \`xor\`, \`cardinality\`: bulk set operations 64 bits at a time.

### Limits
* Indices must be **non-negative ints**, and memory is proportional to the **largest** index, not the count. Sparse IDs (e.g. random longs) waste memory.
* Not thread-safe.

### For sparse or huge ranges
**Roaring Bitmaps** compress runs and sparse regions, support 32/64-bit values and are used by Lucene, Spark, Druid and many databases for fast set operations.`,
    codeSnippet: `BitSet processed = new BitSet(100_000_000);
processed.set(userId);
if (!processed.get(otherId)) { ... }
int done = processed.cardinality();`,
    pitfalls: [
      "Using BitSet for sparse, huge ID ranges.",
      "Sharing a BitSet across threads without synchronization.",
      "Using a Set<Integer> for dense integer membership.",
    ],
    followUpQuestions: [
      "How do Roaring Bitmaps choose between array, bitmap and run containers?",
      "How would you persist a BitSet?",
    ],
    faangFocus: "A memory-efficiency question common in data-heavy teams.",
  },
  {
    id: 'col-52',
    categoryId: 'collections',
    title: 'Interval Problems With TreeMap: A Booking Calendar',
    difficulty: 'Hard',
    tags: ['TreeMap', 'Intervals', 'Coding', 'Booking'],
    scenario: "Coding round: implement `boolean book(int start, int end)` for a meeting room, rejecting any booking that overlaps an existing one.",
    question: "Implement it in O(log n) per booking and explain why it's correct.",
    idealAnswer: `### Idea
Keep non-overlapping bookings in a \`TreeMap<start, end>\`. A new interval [s, e) can only conflict with:
* the booking starting **at or before** s (\`floorEntry(s)\`): conflict if its end > s.
* the booking starting **after** s (\`ceilingEntry(s)\`): conflict if its start < e.
Any other booking lies entirely before the floor or after the ceiling, and since stored bookings do not overlap each other, checking the two neighbours is sufficient.

### Complexity
Two O(log n) lookups and one insert: O(log n) per booking, versus O(n) scanning a list.

### Variants
* Double booking allowed / max k overlaps: a **sweep line** with a \`TreeMap<time, delta>\` counting starts and ends.
* Merging intervals: sort by start and merge in one pass.
* Concurrent bookings: a lock per room, or the database with an exclusion constraint (PostgreSQL \`EXCLUDE USING gist\`) as the true source of truth.`,
    codeSnippet: `final class Calendar {
    private final TreeMap<Integer, Integer> booked = new TreeMap<>();

    boolean book(int start, int end) {
        Map.Entry<Integer, Integer> before = booked.floorEntry(start);
        Map.Entry<Integer, Integer> after = booked.ceilingEntry(start);
        if (before != null && before.getValue() > start) return false;
        if (after != null && after.getKey() < end) return false;
        booked.put(start, end);
        return true;
    }
}`,
    pitfalls: [
      "Checking only one neighbour.",
      "Inclusive vs exclusive end confusion.",
      "Relying on in-memory checks in a multi-instance service.",
    ],
    followUpQuestions: [
      "Allow up to two overlapping bookings.",
      "How would you enforce this in the database?",
    ],
    faangFocus: "A well-known interview problem; clean neighbour reasoning is what they want.",
  },
  {
    id: 'col-53',
    categoryId: 'collections',
    title: 'Design a Time-Based Key-Value Store',
    difficulty: 'Hard',
    tags: ['TreeMap', 'Versioning', 'Coding', 'Design'],
    scenario: "Implement `set(key, value, timestamp)` and `get(key, timestamp)`, where get returns the value with the largest timestamp less than or equal to the given one.",
    question: "Implement it and discuss concurrency and memory.",
    idealAnswer: `### Structure
\`Map<String, TreeMap<Long, String>>\`: each key has its own timeline. \`get\` is \`floorEntry(timestamp)\` on that key's TreeMap. O(log v) per operation where v is versions of that key.

### Optimisation when timestamps are increasing
If sets always arrive in increasing timestamp order, append to an \`ArrayList\` of (ts, value) and binary search: less memory and better locality than a TreeMap.

### Concurrency
\`ConcurrentHashMap<String, ConcurrentSkipListMap<Long, String>>\` with \`computeIfAbsent\` for the per-key map gives lock-free reads and writes.

### Memory and retention
Unlimited history grows forever. Cap versions per key or compact entries older than a retention window. This is essentially **MVCC**, which databases use for snapshot isolation.`,
    codeSnippet: `final class TimeMap {
    private final Map<String, ConcurrentSkipListMap<Long, String>> data = new ConcurrentHashMap<>();

    void set(String key, String value, long ts) {
        data.computeIfAbsent(key, k -> new ConcurrentSkipListMap<>()).put(ts, value);
    }

    String get(String key, long ts) {
        var versions = data.get(key);
        if (versions == null) return "";
        var e = versions.floorEntry(ts);
        return e == null ? "" : e.getValue();
    }
}`,
    pitfalls: [
      "Linear scans over versions.",
      "Forgetting the floor semantics (<=, not <).",
      "Unbounded version history.",
    ],
    followUpQuestions: [
      "How is this related to MVCC in PostgreSQL?",
      "How would you distribute it across nodes?",
    ],
    faangFocus: "A popular coding problem that extends naturally into design discussions.",
  },
  {
    id: 'col-54',
    categoryId: 'collections',
    title: 'Hash Table Design: Chaining vs Open Addressing',
    difficulty: 'Expert',
    tags: ['Hash Tables', 'Open Addressing', 'Chaining', 'Internals'],
    scenario: "A performance engineer asks why `java.util.HashMap` uses separate chaining while libraries like fastutil and many C++ maps use open addressing.",
    question: "Compare the two designs and explain Java's choice.",
    idealAnswer: `### Separate chaining (java.util.HashMap)
Each slot points to a list (or tree) of nodes.
* Tolerates high load factors and bad hash functions gracefully.
* Deletion is simple.
* Nodes are separate objects, so it naturally holds **entries that can be exposed** as \`Map.Entry\` views and supports treeification for attack resistance.
* Cost: an allocation per entry and pointer chasing (cache misses).

### Open addressing
Entries live directly in the array; collisions probe other slots (linear, quadratic, double hashing).
* Excellent **cache locality**, no per-entry objects: great for primitive keys.
* Needs lower load factors (~0.5-0.7) and a good hash; clustering hurts linear probing.
* Deletion needs tombstones or backward-shift.
* Refinements: **Robin Hood hashing** (reduce probe length variance), **Swiss tables** (SIMD metadata probing, used by Abseil/Rust).

### Why Java chose chaining
Generic reference keys with arbitrary user-written \`hashCode\`s, the \`Map.Entry\` API, robust worst-case behaviour, and the ability to treeify. \`IdentityHashMap\` and \`ThreadLocalMap\` use open addressing internally because their keys have well-distributed identity hashes.`,
    pitfalls: [
      "Claiming open addressing is universally faster.",
      "Ignoring deletion complexity in open addressing.",
      "Forgetting the memory overhead of chaining nodes.",
    ],
    followUpQuestions: [
      "How does Robin Hood hashing reduce variance?",
      "Why does ThreadLocalMap use open addressing?",
    ],
    faangFocus: "Deep data-structure knowledge for performance-focused roles.",
  },
];
