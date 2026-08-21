import type { Question } from '../types';

export const COLLECTIONS_QUESTIONS: Question[] = [
  {
    id: 'col-1',
    categoryId: 'collections',
    title: 'The equals / hashCode Contract',
    difficulty: 'Core',
    tags: ['HashMap', 'equals', 'hashCode', 'Contract'],
    scenario: 'A teammate adds a `User` class with a custom `equals()` that compares by `email`, but forgets to override `hashCode()`. Users are then stored in a `HashSet`. In production, duplicate users start appearing and lookups silently miss.',
    question: 'Explain exactly why the duplicates appear. State the full equals/hashCode contract and describe what a correct implementation looks like.',
    idealAnswer: `The bug is a violation of the **equals/hashCode contract**, and it breaks every hash-based collection.

### Why duplicates appear
\`HashSet\` is backed by a \`HashMap\`. A lookup is a two-step process:
1. Compute \`hashCode()\` to find the **bucket**.
2. Within that bucket, use \`equals()\` to find the exact entry.

With the inherited \`Object.hashCode()\` (identity-based), two \`User\` objects with the same email produce **different hash codes**, so they land in different buckets. Step 2 never runs, and \`equals()\` is never consulted. The set happily stores both.

### The contract
* If \`a.equals(b)\` is true, then \`a.hashCode() == b.hashCode()\` **must** be true.
* If \`a.hashCode() == b.hashCode()\`, \`equals()\` may still be false (collisions are legal and expected).
* Both must be consistent: repeated calls return the same result while the object is unmodified.
* \`equals\` must be reflexive, symmetric, transitive, consistent, and \`x.equals(null)\` must be false.

### Correct implementation
Derive both from the **same fields**. Use \`Objects.equals\` and \`Objects.hash\`, or better, make the type a \`record\`, which generates both correctly for you.

### The deeper rule
Never use **mutable** fields in \`hashCode()\`. If you mutate a key after insertion, its hash changes, the entry is stranded in the old bucket, and it becomes permanently unreachable — a genuine memory leak.`,
    codeSnippet: `public final class User {
    private final String email;
    private final String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return Objects.equals(email, other.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(email);   // SAME field as equals
    }
}

// Or simply:
public record User(String email, String name) { }`,
    pitfalls: [
      'Overriding only one of the two methods.',
      'Using different field sets in equals() and hashCode().',
      'Including mutable fields, which strands entries in the wrong bucket after mutation.',
      'Writing equals(User u) instead of equals(Object o) — that is an overload, not an override.'
    ],
    followUpQuestions: [
      'What happens if hashCode() always returns a constant like 42?',
      'Why does the @Override annotation catch the equals(User) mistake?',
      'How do records generate equals and hashCode, and when is that not what you want?'
    ],
    faangFocus: 'This is the single most common screening question for mid-level Java roles. Interviewers listen for the bucket-then-equals lookup mechanism, not just a recital of the contract.'
  },
  {
    id: 'col-2',
    categoryId: 'collections',
    title: 'HashMap Internals: Buckets, Resizing and Treeification',
    difficulty: 'Solid',
    tags: ['HashMap', 'Internals', 'Treeify', 'Load Factor'],
    scenario: 'A service builds a `HashMap` with several million entries during startup. Startup time is dominated by map population, and a profiler shows heavy time in `resize()`.',
    question: 'Walk through what happens internally on `put()`. Explain the load factor, the resize process, and when and why Java 8+ converts a bucket to a red-black tree.',
    idealAnswer: `### The put() path
1. \`hash(key)\` is computed, then **spread**: \`h ^ (h >>> 16)\`. This mixes the high bits down because the bucket index is \`hash & (n - 1)\`, which otherwise only looks at low bits.
2. The bucket index is derived. Table length is always a **power of two**, so the mask is a cheap AND instead of a modulo.
3. If the bucket is empty, a \`Node\` is placed directly. Otherwise the chain (or tree) is walked, comparing hash first, then \`equals()\`.

### Load factor and resize
* Default capacity 16, default load factor **0.75**. When \`size > capacity * loadFactor\` (12 entries by default), the table **doubles**.
* Resizing allocates a new array and rehashes everything. In Java 8+ this is optimised: since capacity doubles, an entry either stays at index \`i\` or moves to \`i + oldCapacity\`, decided by one bit test. No full hash recomputation is needed.
* For a few million entries this doubling happens ~20 times, each one O(n). **Pre-sizing the map is the fix.**

### Treeification
* When a single bucket's chain reaches \`TREEIFY_THRESHOLD = 8\` **and** the table has at least \`MIN_TREEIFY_CAPACITY = 64\` slots, the chain converts to a **red-black tree**, turning worst-case lookup from O(n) to O(log n).
* Below capacity 64 the map resizes instead — a small table with long chains is a sizing problem, not a collision problem.
* On shrink, a tree reverts to a list at \`UNTREEIFY_THRESHOLD = 6\`. The gap between 8 and 6 is hysteresis, preventing thrashing.

### The fix for this scenario
\`new HashMap<>(expectedSize / 0.75f + 1)\` — or on Java 19+, \`HashMap.newHashMap(expectedSize)\`, which does that arithmetic for you.`,
    codeSnippet: `// Bad: ~20 resizes while loading 5M entries
Map<String, Row> map = new HashMap<>();

// Good (Java 19+): sized so no resize is ever needed
Map<String, Row> map = HashMap.newHashMap(5_000_000);

// Pre-Java 19 equivalent
Map<String, Row> map = new HashMap<>((int) (5_000_000 / 0.75f) + 1);`,
    pitfalls: [
      'Thinking new HashMap<>(1000) reserves room for 1000 entries — it sets capacity, so it resizes at 750.',
      'Forgetting the MIN_TREEIFY_CAPACITY = 64 condition and claiming any 8-length chain becomes a tree.',
      'Claiming resize recomputes every hash; Java 8+ uses the single-bit split trick.',
      'Ignoring that treeification requires keys to be Comparable to get the full benefit.'
    ],
    followUpQuestions: [
      'Why must the table length be a power of two?',
      'How does treeification mitigate hash-collision denial-of-service attacks?',
      'What changes if you use LinkedHashMap instead, and what does it cost?'
    ],
    faangFocus: 'Amazon and Google use this to separate candidates who have read the JDK source from those who have only read blog posts. The 8/64/6 thresholds are the tell.'
  },
  {
    id: 'col-3',
    categoryId: 'collections',
    title: 'ConcurrentHashMap vs synchronizedMap vs Hashtable',
    difficulty: 'Solid',
    tags: ['ConcurrentHashMap', 'Thread Safety', 'CAS', 'Concurrency'],
    scenario: 'A read-heavy in-memory cache is guarded by `Collections.synchronizedMap(new HashMap<>())`. Under 200 concurrent readers, throughput plateaus and thread dumps show many threads BLOCKED on the same monitor.',
    question: 'Compare `Hashtable`, `Collections.synchronizedMap`, and `ConcurrentHashMap`. Explain how CHM achieves concurrency and why it fixes this bottleneck.',
    idealAnswer: `### The three options
* **Hashtable** (legacy): every method is \`synchronized\` on the map instance. One global lock, and it disallows null keys and values.
* **Collections.synchronizedMap**: a wrapper delegating to the same single mutex. Identical contention profile to Hashtable, just composable over any Map.
* **ConcurrentHashMap**: lock-striped and largely lock-free on the read path.

### How CHM actually works (Java 8+)
* **Reads are lock-free.** The table array and \`Node.val\`/\`Node.next\` are \`volatile\`, so \`get()\` never acquires a lock. This is why the 200-reader scenario collapses to near-zero contention.
* **Writes lock a single bin.** If the target bucket is empty, the node is installed with a **CAS**. If occupied, only that bin's head node is \`synchronized\` — so writers to different buckets never block each other.
* **Resizing is cooperative.** A thread that encounters a \`ForwardingNode\` helps transfer the remaining bins rather than waiting.
* **size()** is maintained through a striped \`LongAdder\`-style counter (\`baseCount\` + \`CounterCell[]\`) to avoid a single hot cache line.

### The important semantic difference
CHM's aggregate operations are **weakly consistent**, not atomic snapshots. Iterators never throw \`ConcurrentModificationException\`, but they may reflect changes made after creation. \`size()\` is an estimate the instant you read it.

For check-then-act, you must use the atomic API — \`putIfAbsent\`, \`computeIfAbsent\`, \`merge\` — not \`if (!map.containsKey(k)) map.put(k, v)\`, which is a race regardless of the map implementation.`,
    codeSnippet: `// Race: two threads can both pass the check
if (!cache.containsKey(key)) {
    cache.put(key, expensiveLoad(key));
}

// Atomic, and the mapping function runs at most once per key
cache.computeIfAbsent(key, this::expensiveLoad);

// Atomic counter increment
counts.merge(word, 1L, Long::sum);`,
    pitfalls: [
      'Calling computeIfAbsent with a mapping function that itself touches the same map — this can deadlock or corrupt the bin.',
      'Assuming size() or isEmpty() give an exact, atomic answer.',
      'Still claiming CHM uses 16 Segments — segments were removed in Java 8.',
      'Putting null values in — CHM forbids them precisely so get() returning null is unambiguous.'
    ],
    followUpQuestions: [
      'Why does ConcurrentHashMap forbid null keys and values when HashMap allows them?',
      'What is a ForwardingNode and how does helping-on-resize work?',
      'When would you still choose a synchronized block over CHM?'
    ],
    faangFocus: 'A staple of Netflix and Uber backend interviews. The winning answer names the volatile-read fast path and immediately pivots to computeIfAbsent for check-then-act.'
  },
  {
    id: 'col-4',
    categoryId: 'collections',
    title: 'ArrayList vs LinkedList: The Cache-Line Reality',
    difficulty: 'Core',
    tags: ['ArrayList', 'LinkedList', 'Cache Locality', 'Big-O'],
    scenario: 'A candidate confidently states that `LinkedList` is faster for insertions and deletions. You benchmark both with 100,000 elements and `ArrayList` wins nearly every workload, including mid-list insertion.',
    question: 'Reconcile the Big-O table with the benchmark. When, if ever, is `LinkedList` the right choice?',
    idealAnswer: `Big-O describes **operation counts**, not **wall-clock time**. Modern CPUs are dominated by memory access patterns, not instruction counts.

### Why ArrayList wins in practice
* \`ArrayList\` is a contiguous \`Object[]\`. Iterating it streams sequential memory, so the hardware **prefetcher** loads the next cache line before you ask for it. Effective cost per element is near zero.
* \`LinkedList\` is a graph of \`Node\` objects scattered across the heap. Each \`next\` dereference is a potential **cache miss** costing ~100ns — hundreds of times the cost of an array index.
* \`LinkedList\` also allocates a wrapper node per element (~24-32 bytes of overhead), tripling memory footprint and GC pressure.

### The insertion myth
\`LinkedList.add(index, e)\` is only O(1) **if you already hold the node**. By index, it must walk the chain — O(n) pointer-chasing with a cache miss per hop.
\`ArrayList.add(index, e)\` is O(n) too, but that O(n) is \`System.arraycopy\`, an intrinsic that moves memory at gigabytes per second. A "slow" bulk memmove beats a "fast" pointer walk until n is enormous.

### When LinkedList genuinely fits
Almost never as a \`List\`. Its real value is as a \`Deque\` — constant-time \`addFirst\`/\`removeFirst\` with no resizing. But \`ArrayDeque\` beats it there too, being a contiguous circular buffer.

**Practical rule:** default to \`ArrayList\`. Use \`ArrayDeque\` for queues and stacks. Reach for \`LinkedList\` only when you need a \`List\` that is also a \`Deque\` and you have measured a reason.`,
    codeSnippet: `// Removing while iterating: the one case where LinkedList's
// O(1) unlink matters — but ArrayList still usually wins on small n.
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    if (it.next().isCancelled()) {
        it.remove();   // ArrayList: O(n) arraycopy, LinkedList: O(1) unlink
    }
}

// Better for ArrayList: single pass, no repeated shifting
orders.removeIf(Order::isCancelled);`,
    pitfalls: [
      'Quoting Big-O without mentioning cache locality or allocation overhead.',
      'Claiming LinkedList insertion by index is O(1).',
      'Recommending LinkedList for stack/queue use instead of ArrayDeque.',
      'Forgetting that ArrayList.remove in a loop is O(n^2) and removeIf is the fix.'
    ],
    followUpQuestions: [
      'How does ArrayList grow, and what is the amortised cost of add()?',
      'Why is ArrayDeque preferred over Stack and LinkedList?',
      'What does Java\'s lack of value types cost you here, and how would Valhalla change it?'
    ],
    faangFocus: 'Interviewers use this to see whether a candidate reasons about real hardware or recites a textbook table. Mentioning the prefetcher and arraycopy intrinsic is the differentiator.'
  },
  {
    id: 'col-5',
    categoryId: 'collections',
    title: 'ConcurrentModificationException and Fail-Fast Iterators',
    difficulty: 'Core',
    tags: ['Iterator', 'Fail-Fast', 'CME', 'modCount'],
    scenario: 'A batch job throws `ConcurrentModificationException` intermittently. The code iterates a `List<Order>` with an enhanced for-loop and removes cancelled orders inside the loop. It is single-threaded.',
    question: 'Explain the fail-fast mechanism, why a single-threaded loop can throw a "concurrent" exception, and give three correct alternatives.',
    idealAnswer: `### The mechanism
Every structurally modifying operation on an \`ArrayList\` increments an internal \`modCount\`. When you create an iterator it snapshots that value into \`expectedModCount\`. On every \`next()\` the iterator calls \`checkForComodification()\`, comparing the two. If the list was structurally modified through any path **other than the iterator itself**, they diverge and it throws.

The name is misleading: it is not about threads. An enhanced for-loop is sugar for an \`Iterator\`, so calling \`list.remove(o)\` inside it modifies the list behind the iterator's back.

### Why it is "fail-fast", not "fail-safe"
This is a **best-effort bug detector**, not a guarantee. It exists to turn silent, non-deterministic corruption into a loud exception. You must never write code that catches CME and continues.

### Three correct alternatives
1. **\`removeIf\`** — clearest and fastest for a simple predicate; it does a single pass and manages modCount internally.
2. **Explicit \`Iterator.remove()\`** — the iterator updates \`expectedModCount\` itself, so it stays in sync. Use when the removal decision needs extra state.
3. **Collect and remove after** — build a separate list of victims, then \`removeAll\`. Useful when the removal must be conditional on the whole pass.

### The concurrent case
If the list really is shared across threads, none of the above is enough. Use \`CopyOnWriteArrayList\` (snapshot iterators, cheap reads, expensive writes — ideal for listener lists) or \`ConcurrentHashMap\`'s weakly-consistent views, or add explicit synchronisation.`,
    codeSnippet: `// Throws CME
for (Order o : orders) {
    if (o.isCancelled()) orders.remove(o);
}

// 1. Best for a simple predicate
orders.removeIf(Order::isCancelled);

// 2. When you need more control
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    Order o = it.next();
    if (o.isCancelled()) { audit(o); it.remove(); }
}

// 3. Genuinely shared across threads
List<Listener> listeners = new CopyOnWriteArrayList<>();`,
    pitfalls: [
      'Believing CME only occurs with multiple threads.',
      'Catching CME and retrying instead of fixing the iteration.',
      'Using CopyOnWriteArrayList for a write-heavy list — every write copies the whole array.',
      'Assuming set(index, value) triggers CME; it is not a structural modification, so it does not.'
    ],
    followUpQuestions: [
      'Why does list.set() not increment modCount but list.add() does?',
      'How do ConcurrentHashMap iterators avoid throwing CME entirely?',
      'What is the performance profile of CopyOnWriteArrayList and where does it fit?'
    ],
    faangFocus: 'Appears in nearly every mid-level screen. The strong signal is explaining modCount/expectedModCount precisely and stressing that fail-fast is best-effort.'
  },
  {
    id: 'col-6',
    categoryId: 'collections',
    title: 'Choosing Between HashMap, TreeMap and LinkedHashMap',
    difficulty: 'Core',
    tags: ['TreeMap', 'LinkedHashMap', 'Ordering', 'LRU'],
    scenario: 'You are asked to build an in-process LRU cache of the 10,000 most recently used product records, and separately a leaderboard that must always be readable in descending score order.',
    question: 'Pick the right Map for each and justify it. Explain the ordering guarantees and cost profile of the three main implementations.',
    idealAnswer: `### The three implementations
* **HashMap** — O(1) average get/put, **no ordering guarantee whatsoever**. Iteration order can change between runs and even after a resize. Default choice when order does not matter.
* **LinkedHashMap** — HashMap plus a doubly-linked list threaded through the entries. Preserves **insertion order** by default, or **access order** if constructed with \`accessOrder = true\`. Costs two extra references per entry.
* **TreeMap** — a red-black tree implementing \`NavigableMap\`. O(log n) operations, keys kept in **sorted order** by natural ordering or a \`Comparator\`. Gives you \`firstKey\`, \`headMap\`, \`ceilingEntry\`, \`subMap\` and descending views.

### LRU cache → LinkedHashMap
Construct with \`accessOrder = true\` and override \`removeEldestEntry\`. Every \`get()\` moves the entry to the tail; when size exceeds the cap, the head — the least recently used — is evicted. This is genuinely O(1) per operation and is how many JDK-era caches were built.

Caveat: it is **not thread-safe**. For concurrent use, wrap it or reach for Caffeine, which uses a far better admission policy (TinyLFU) than pure LRU.

### Leaderboard → TreeMap
A \`TreeMap<Integer, Player>\` with \`Comparator.reverseOrder()\` keeps scores sorted at all times, and \`descendingMap()\` / \`headMap(n)\` give you the top-N view for free. If scores can tie, key by a composite comparator or use a \`TreeSet\` of records.

If the leaderboard is huge and read-mostly, a sorted \`ArrayList\` rebuilt periodically beats a TreeMap on cache locality — worth mentioning as the pragmatic alternative.`,
    codeSnippet: `// O(1) LRU cache in ~6 lines
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int cap;
    LruCache(int cap) {
        super(16, 0.75f, true);   // accessOrder = true
        this.cap = cap;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > cap;
    }
}

// Always-sorted leaderboard
NavigableMap<Integer, Player> board = new TreeMap<>(Comparator.reverseOrder());
board.headMap(board.size() > 10 ? ... : ...); // top-N views for free`,
    pitfalls: [
      'Assuming HashMap iteration order is stable — it is explicitly unspecified.',
      'Forgetting the third constructor argument that enables access order in LinkedHashMap.',
      'Using a TreeMap with a Comparator inconsistent with equals, which silently breaks Map semantics.',
      'Treating LinkedHashMap-based LRU as thread-safe.'
    ],
    followUpQuestions: [
      'Why is a Comparator inconsistent with equals dangerous for TreeMap and TreeSet?',
      'How would you make the LRU cache thread-safe without a global lock?',
      'What does Caffeine\'s TinyLFU do better than plain LRU?'
    ],
    faangFocus: 'The LinkedHashMap LRU trick is a classic 20-minute coding-round warm-up at Amazon. Knowing removeEldestEntry saves you from hand-rolling a linked list under time pressure.'
  },
  {
    id: 'col-7',
    categoryId: 'collections',
    title: 'Immutable Collections and Defensive Copies',
    difficulty: 'Solid',
    tags: ['Immutability', 'List.of', 'Defensive Copy', 'API Design'],
    scenario: 'A shared `Config` object exposes `getAllowedHosts()` returning its internal `List<String>`. A downstream team calls `.clear()` on it during a retry path, silently wiping the config for the whole JVM.',
    question: 'Explain the failure, then compare `Collections.unmodifiableList`, `List.copyOf` and `List.of`. What does "immutable" actually guarantee here?',
    idealAnswer: `### The failure
Returning the internal list hands out a live, mutable reference to your private state. Any caller can mutate it, and the object's invariants are no longer under its own control. This is a textbook **escaping reference**.

### The three tools, and how they differ
* **\`Collections.unmodifiableList(list)\`** — an unmodifiable **view**. Mutating methods throw, but the *backing* list is still live. If the owner mutates it, the view changes underneath the caller. Cheap, but only a partial fix.
* **\`List.copyOf(list)\`** — takes a genuine **snapshot** into a new immutable list. Later mutation of the source is invisible. This is what you want for a getter. It also rejects nulls and returns the argument as-is if it is already an immutable \`List.of\` instance.
* **\`List.of(...)\`** — creates an immutable list from explicit elements. Null-hostile, and \`contains(null)\` throws NPE rather than returning false, which surprises people.

### The limit of the guarantee
All three give **shallow** immutability. \`List.copyOf(users)\` prevents adding or removing users, but if \`User\` is mutable, callers can still mutate each element. Deep immutability requires the element type itself to be immutable — which is the real argument for \`record\` types with immutable fields.

### The correct fix
Store the list as \`List.copyOf(input)\` in the constructor **and** return it directly. Copying on the way in means you never need to copy on the way out.`,
    codeSnippet: `public final class Config {
    private final List<String> allowedHosts;

    public Config(List<String> allowedHosts) {
        // copy IN: caller cannot mutate our state afterwards
        this.allowedHosts = List.copyOf(allowedHosts);
    }

    public List<String> getAllowedHosts() {
        return allowedHosts;   // already immutable, no copy needed
    }
}`,
    pitfalls: [
      'Confusing an unmodifiable view with an immutable copy.',
      'Believing immutability of the collection implies immutability of its elements.',
      'Passing null into List.of / Map.of, which throws NPE.',
      'Copying on the way out on every call, creating avoidable garbage on a hot path.'
    ],
    followUpQuestions: [
      'Why does List.of forbid nulls when Arrays.asList allows them?',
      'What is the difference between Arrays.asList, List.of and new ArrayList<>(...)?',
      'How do records help enforce deep immutability, and where do they fall short?'
    ],
    faangFocus: 'API-design rounds at Google and Stripe probe exactly this. The strongest answer is "copy on the way in, then the getter is free".'
  },
  {
    id: 'col-8',
    categoryId: 'collections',
    title: 'Comparable, Comparator and the Contract for Sorting',
    difficulty: 'Solid',
    tags: ['Comparator', 'Sorting', 'TimSort', 'Contract'],
    scenario: 'A sort over a list of `Task` objects intermittently throws `IllegalArgumentException: Comparison method violates its general contract!`. The comparator subtracts two int priorities and also has a special case that returns 0 for "urgent" tasks.',
    question: 'Diagnose both bugs. Explain why TimSort detects the violation and how to write comparators that cannot fail this way.',
    idealAnswer: `There are two independent defects here.

### Bug 1: integer subtraction overflow
\`return a.priority - b.priority;\` silently overflows when the values straddle the int range. \`Integer.MIN_VALUE - 1\` wraps positive, so the comparator reports a *greater than* relation that is provably wrong. Always use \`Integer.compare(a, b)\`, which is branch-cheap and overflow-safe.

### Bug 2: broken transitivity
Returning 0 for a special case destroys **transitivity**. If \`urgent\` compares equal to both a low-priority and a high-priority task, then by transitivity those two must be equal to each other — but they are not. The ordering is now inconsistent.

### Why TimSort notices
Java's sort for objects is **TimSort**, which finds and merges existing runs. It relies on the comparator being a valid total order to reason about run boundaries. When merge invariants fail, it detects the inconsistency and throws \`IllegalArgumentException\` rather than silently producing garbage or running off the end of an array. The exception is a **feature** — it is telling you the comparator is broken, not that the JDK is.

### The contract
* \`sgn(compare(x, y)) == -sgn(compare(y, x))\` — antisymmetry.
* Transitive: \`compare(x,y) > 0 && compare(y,z) > 0\` implies \`compare(x,z) > 0\`.
* \`compare(x, y) == 0\` implies \`sgn(compare(x, z)) == sgn(compare(y, z))\` for all z.
* Strongly recommended: consistent with \`equals\`.

### How to make it unbreakable
Build comparators declaratively with \`Comparator.comparing(...).thenComparing(...)\`. Chained key extractors are transitive by construction, and adding a unique tiebreaker (like an id) guarantees a total order.`,
    codeSnippet: `// Broken: overflow + intransitive special case
(a, b) -> {
    if (a.isUrgent() || b.isUrgent()) return 0;
    return a.getPriority() - b.getPriority();
}

// Correct: declarative, overflow-safe, total order
Comparator<Task> byUrgency = Comparator
        .comparing(Task::isUrgent).reversed()      // urgent first
        .thenComparingInt(Task::getPriority)
        .thenComparing(Task::getId);               // unique tiebreaker`,
    pitfalls: [
      'Using subtraction for int or long comparison.',
      'Returning 0 for a "special" case, breaking transitivity.',
      'Comparing doubles with subtraction, which mishandles NaN and -0.0.',
      'Blaming the JDK for the IllegalArgumentException instead of the comparator.'
    ],
    followUpQuestions: [
      'Why is TimSort used for objects but a dual-pivot quicksort for primitives?',
      'What does "consistent with equals" mean and what breaks in a TreeSet when it is violated?',
      'How does Comparator.nullsFirst help, and why can it not be expressed as a simple lambda?'
    ],
    faangFocus: 'The overflow-in-comparator bug is a favourite code-review question at Meta. Naming TimSort and explaining why it throws marks a senior answer.'
  },
  {
    id: 'col-9',
    categoryId: 'collections',
    title: 'Sizing, Boxing and the Memory Cost of Collections',
    difficulty: 'Hard',
    tags: ['Autoboxing', 'Memory', 'Primitives', 'Footprint'],
    scenario: 'A service holds a `Map<Integer, Long>` of 20 million counters. Heap usage is 2.4GB and GC pressure is severe, even though the raw data is only 20M × 12 bytes ≈ 240MB.',
    question: 'Account for the 10x memory blow-up and propose concrete remedies.',
    idealAnswer: `### Where the memory goes
For each entry in a \`HashMap<Integer, Long>\` on a 64-bit JVM with compressed oops:
* \`HashMap.Node\`: 32 bytes (header 16 + hash 4 + key ref 4 + value ref 4 + next ref 4).
* Boxed \`Integer\`: 16 bytes (header 12 + int 4, padded).
* Boxed \`Long\`: 24 bytes (header 12 + long 8, padded).
* Share of the \`Node[]\` table: ~5-8 bytes at 0.75 load factor.

That is roughly **80 bytes per entry** to store 12 bytes of payload — plus 60M objects for the GC to trace on every marking cycle. The object *count* often hurts more than the bytes.

### The Integer cache trap
\`Integer.valueOf\` caches only −128..127 by default. Above that every key is a fresh allocation, so there is no sharing to save you.

### Remedies, in order of impact
1. **Primitive collections.** Eclipse Collections \`IntLongHashMap\` or fastutil \`Int2LongOpenHashMap\` store parallel primitive arrays: ~16 bytes per entry, zero per-entry objects. This alone typically cuts footprint by 5-8x and removes the GC scanning cost entirely.
2. **Open addressing over chaining.** Even in Java-object form, an open-addressed map removes the per-entry Node.
3. **Two parallel arrays** if keys are dense — an \`long[]\` indexed by id is unbeatable when ids are contiguous.
4. **Off-heap or a real cache** (Chronicle Map, Caffeine with a bounded size) when the data genuinely does not need to be resident.

### Also worth saying
Verify with a real tool — \`jol\` (Java Object Layout) or a heap histogram — rather than estimating. And check whether \`-XX:+UseCompressedOops\` is active: above a 32GB heap it turns off and every reference doubles to 8 bytes.`,
    codeSnippet: `// 20M entries, ~2.4GB
Map<Integer, Long> counters = new HashMap<>();

// Same data, ~350MB, and zero per-entry objects for GC to trace
MutableIntLongMap counters = new IntLongHashMap(20_000_000);
counters.addToValue(userId, 1L);

// Measure, do not guess:
// System.out.println(ClassLayout.parseClass(HashMap.Node.class).toPrintable());`,
    pitfalls: [
      'Estimating footprint from payload size and ignoring object headers and Node wrappers.',
      'Assuming the Integer cache saves memory for arbitrary keys.',
      'Forgetting that compressed oops disable above a 32GB heap, silently inflating every reference.',
      'Optimising bytes while ignoring that 60M live objects dominate GC marking time.'
    ],
    followUpQuestions: [
      'How does jol report object layout, and what is the alignment padding rule?',
      'What would Project Valhalla value classes change about this analysis?',
      'When is moving this data off-heap the right call rather than shrinking it?'
    ],
    faangFocus: 'High-scale teams at Netflix and LinkedIn ask this to see whether a candidate thinks about object headers and GC root scanning, not just Big-O.'
  },
  {
    id: 'col-10',
    categoryId: 'collections',
    title: 'Sets, TreeSet Ordering and the SortedSet Contract',
    difficulty: 'Solid',
    tags: ['TreeSet', 'HashSet', 'Contract', 'NavigableSet'],
    scenario: 'A `TreeSet<Event>` is constructed with `Comparator.comparing(Event::getTimestamp)`. Two distinct events happen to share a timestamp. One of them silently disappears from the set, and `contains()` returns true for an event that was never added.',
    question: 'Explain why. What is the SortedSet contract, and how does it differ from HashSet\'s?',
    idealAnswer: `### The root cause
\`TreeSet\` does **not use \`equals()\` at all**. Membership is defined entirely by the comparator: two elements are "the same" if \`compare(a, b) == 0\`. This is stated explicitly in the \`SortedSet\` javadoc — the ordering must be *consistent with equals* for the set to obey the general \`Set\` contract.

With \`comparing(Event::getTimestamp)\`, two different events at the same instant compare equal, so:
* The second \`add()\` is rejected — the element vanishes.
* \`contains(other)\` returns true for any event sharing that timestamp, even one never inserted.

The set is not broken; it is doing exactly what you told it to.

### HashSet vs TreeSet membership
| | HashSet | TreeSet |
|---|---|---|
| Membership | \`hashCode()\` then \`equals()\` | \`compare()\` / \`compareTo()\` only |
| Order | none | sorted |
| Cost | O(1) avg | O(log n) |
| Nulls | one allowed | none (comparator would NPE) |

### The fix
Make the comparator a **total order** by appending a unique tiebreaker:
\`Comparator.comparing(Event::getTimestamp).thenComparing(Event::getId)\`.
Now equal timestamps are still distinguishable, and the ordering is consistent with equals.

### What TreeSet buys you
Once correct, \`NavigableSet\` gives \`first\`, \`last\`, \`ceiling\`, \`floor\`, \`headSet\`, \`subSet\` and \`descendingSet\` — range queries a \`HashSet\` cannot answer at all. That is the reason to accept the O(log n) cost.`,
    codeSnippet: `// Silently drops distinct events sharing a timestamp
Set<Event> events = new TreeSet<>(Comparator.comparing(Event::getTimestamp));

// Total order: distinct events always stay distinct
Set<Event> events = new TreeSet<>(
        Comparator.comparing(Event::getTimestamp)
                  .thenComparing(Event::getId));

// Range query TreeSet gives you for free
NavigableSet<Event> lastHour =
        ((NavigableSet<Event>) events).tailSet(cutoffEvent, true);`,
    pitfalls: [
      'Assuming TreeSet consults equals() for membership.',
      'Writing a comparator on a non-unique field and calling it done.',
      'Adding null to a TreeSet.',
      'Mutating a field used by the comparator after insertion, corrupting the tree ordering.'
    ],
    followUpQuestions: [
      'What exactly does "consistent with equals" mean, and which JDK classes document violating it?',
      'How does TreeSet implement subSet views, and are they live or snapshots?',
      'When would a sorted ArrayList with binarySearch beat a TreeSet?'
    ],
    faangFocus: 'A precise trap question. Candidates who confidently say "it uses equals" are immediately marked down; the comparator-only rule is the whole point.'
  },
  {
    id: 'col-11',
    categoryId: 'collections',
    title: 'Iterator, Spliterator and Building a Custom Collection',
    difficulty: 'Hard',
    tags: ['Spliterator', 'Iterable', 'Custom Collection', 'Parallelism'],
    scenario: 'You expose a paged, lazily-fetched result set from an internal API. Consumers want to use it in enhanced for-loops and stream it, ideally in parallel for CPU-bound post-processing.',
    question: 'Explain what you must implement, and how `Spliterator` characteristics change what the Streams framework can do with your collection.',
    idealAnswer: `### The minimum surface
Implement \`Iterable<T>\` for the for-loop, and override \`spliterator()\` for streams. \`AbstractCollection\` gives you a lot for free if you can supply \`iterator()\` and \`size()\`.

The default \`Spliterators.spliteratorUnknownSize(iterator, 0)\` works, but it is the **worst case**: no size estimate, no characteristics, and splitting falls back to buffering elements into arrays. Parallelism will be poor.

### Characteristics and why they matter
A \`Spliterator\` reports a bitmask that the pipeline uses to optimise:
* **SIZED / SUBSIZED** — exact element count known and preserved by splits. Enables pre-allocating the result array in \`toArray\`/\`toList\` and lets the fork-join framework balance work evenly.
* **ORDERED** — encounter order is meaningful. Dropping it (via \`unordered()\`) lets \`distinct\`, \`limit\` and \`skip\` run far faster in parallel.
* **DISTINCT** — elements are already unique, so \`distinct()\` becomes a no-op.
* **SORTED** — with a comparator, so \`sorted()\` can be skipped entirely.
* **NONNULL**, **IMMUTABLE**, **CONCURRENT** — allow the pipeline to skip null checks and to avoid late-binding/co-modification guards.

### For a paged, lazy source
Being honest is more important than claiming capabilities. Report \`ORDERED | NONNULL\`, return \`Long.MAX_VALUE\` from \`estimateSize()\` if unknown, and implement \`trySplit()\` to hand off a **page** at a time — page-level splitting maps naturally onto the fetch boundary and gives the fork-join pool real independent work.

If you cannot split meaningfully, return \`null\` from \`trySplit()\`. A sequential stream over a lazily-fetched source is usually the right answer; parallelising an IO-bound fetch just multiplies the connections.

**Rule:** never report a characteristic you do not truly satisfy. Lying about SIZED or DISTINCT produces wrong results, not just slow ones.`,
    codeSnippet: `public final class PagedResults<T> implements Iterable<T> {

    @Override public Iterator<T> iterator() { return new PageIterator<>(fetcher); }

    @Override public Spliterator<T> spliterator() {
        return Spliterators.spliteratorUnknownSize(
                iterator(),
                Spliterator.ORDERED | Spliterator.NONNULL);
    }

    public Stream<T> stream() {
        return StreamSupport.stream(spliterator(), false);
    }
}`,
    pitfalls: [
      'Reporting SIZED or DISTINCT without actually guaranteeing them — this produces silently wrong results.',
      'Parallelising an IO-bound paged source and multiplying backend load.',
      'Forgetting that the default spliterator from an iterator splits by buffering, which is slow.',
      'Not making the spliterator late-binding, so it captures state too early.'
    ],
    followUpQuestions: [
      'What does trySplit() returning null mean for the pipeline?',
      'How does the common ForkJoinPool decide how deeply to split?',
      'Why does dropping ORDERED speed up parallel limit() and distinct()?'
    ],
    faangFocus: 'Library and platform-team interviews use this to test whether you understand streams as a framework you can extend, not just an API you call.'
  },
  {
    id: 'col-12',
    categoryId: 'collections',
    title: 'BlockingQueue Selection for a Producer-Consumer Pipeline',
    difficulty: 'Hard',
    tags: ['BlockingQueue', 'Backpressure', 'Producer-Consumer', 'Disruptor'],
    scenario: 'An ingestion service reads from Kafka on 4 threads and hands work to a pool of 32 processors through a `LinkedBlockingQueue` with no capacity bound. Under a traffic spike the service OOMs rather than slowing down.',
    question: 'Explain the failure and compare the BlockingQueue implementations. What is the correct backpressure design?',
    idealAnswer: `### Why it OOMs
An unbounded \`LinkedBlockingQueue\` has capacity \`Integer.MAX_VALUE\`. When consumers fall behind, the queue absorbs the imbalance by allocating — it converts a **throughput problem into a memory problem**. The system has no way to tell producers to slow down, so it fails catastrophically instead of degrading gracefully.

This is the same failure mode as an unbounded \`ThreadPoolExecutor\` work queue: the pool never grows past core size because the queue never rejects, and the heap absorbs everything.

### The implementations
* **ArrayBlockingQueue** — bounded, single lock, array-backed. Predictable memory, good cache behaviour, mandatory capacity. The safe default.
* **LinkedBlockingQueue** — optionally bounded, **two locks** (separate put and take locks), so higher throughput when producers and consumers are both busy, at the cost of a node allocation per element.
* **SynchronousQueue** — zero capacity; every put must meet a take. This is direct handoff, used by \`Executors.newCachedThreadPool\`. Perfect backpressure, but requires enough consumers.
* **LinkedTransferQueue** — unbounded but supports \`transfer()\`, which blocks until a consumer receives. Gives handoff semantics with queueing flexibility.
* **PriorityBlockingQueue** — unbounded, ordered by comparator. Beware: unbounded means the same OOM risk, and ordering costs O(log n) per op.
* **DelayQueue** — elements become available only after a delay. For scheduling, not throughput.

### The correct design
1. **Bound the queue.** Pick a capacity from a latency budget: \`capacity ≈ target_latency × throughput\`.
2. **Choose a rejection policy deliberately.** \`CallerRunsPolicy\` is the simplest true backpressure — the producer thread executes the task itself and therefore stops reading from Kafka.
3. **Do not commit Kafka offsets until processed.** Then a slow consumer naturally stops fetching; Kafka itself becomes the buffer, which is what it is designed for.
4. **Monitor queue depth** as a first-class metric. Depth trending up is your early warning.

For extreme throughput, mention the **LMAX Disruptor**: a pre-allocated ring buffer with no locks and no per-element allocation, which sidesteps both the GC and contention costs entirely.`,
    codeSnippet: `// Unbounded: converts overload into OOM
BlockingQueue<Record> q = new LinkedBlockingQueue<>();

// Bounded + caller-runs: the producer thread does the work,
// so it stops polling Kafka. Real backpressure.
ExecutorService pool = new ThreadPoolExecutor(
        32, 32, 0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(2_000),
        new ThreadPoolExecutor.CallerRunsPolicy());`,
    pitfalls: [
      'Using an unbounded queue and calling it "elastic".',
      'Assuming a ThreadPoolExecutor grows past corePoolSize with an unbounded queue — it never does.',
      'Choosing PriorityBlockingQueue without noticing it is unbounded.',
      'Adding a queue in front of a slow consumer instead of fixing or scaling the consumer.'
    ],
    followUpQuestions: [
      'How do you size a bounded queue from a latency SLO?',
      'What are the trade-offs of AbortPolicy vs CallerRunsPolicy vs DiscardOldestPolicy?',
      'How does the LMAX Disruptor avoid both locks and allocation?'
    ],
    faangFocus: 'Uber and Stripe ask this in backend design rounds. The phrase they are listening for is "unbounded queues turn latency problems into availability problems".'
  },
  {
    id: 'col-13',
    categoryId: 'collections',
    title: 'Arrays, Covariance and ArrayStoreException',
    difficulty: 'Solid',
    tags: ['Arrays', 'Generics', 'Covariance', 'Type Safety'],
    scenario: 'A utility method takes an `Object[]` and writes a `String` into it. It is called with a `Long[]` and throws `ArrayStoreException` at runtime. A generic version of the same method refuses to compile at all.',
    question: 'Explain array covariance vs generic invariance, why arrays and generics do not mix, and what this means for API design.',
    idealAnswer: `### Arrays are covariant
\`Long[]\` **is a** \`Object[]\` as far as the type system is concerned. That makes the call compile. But the JVM records the actual component type in the array header and checks every store, so writing a \`String\` into a \`Long[]\` throws \`ArrayStoreException\` at runtime.

Arrays are *reified*: they know their element type at runtime and enforce it. The type error is real, it is just detected late.

### Generics are invariant
\`List<Long>\` is **not a** \`List<Object>\`. The compiler rejects the equivalent code, so the same class of bug is caught at compile time. This is deliberately stricter and strictly safer.

The cost is that you need wildcards to regain flexibility — the **PECS** rule:
* \`? extends T\` when you only **read** (Producer Extends).
* \`? super T\` when you only **write** (Consumer Super).

### Why they do not mix
Generics are implemented by **erasure** — \`List<String>\` and \`List<Long>\` are the same class at runtime. Arrays need reified types. So \`new T[10]\` is illegal, and \`new List<String>[10]\` is illegal, because a generic array could not enforce its own store check. That is why generic collections internally hold an \`Object[]\` and cast on read, and why you see \`@SafeVarargs\` on generic varargs methods (a varargs parameter is an array, so it creates the same unsound hole — "heap pollution").

### Practical guidance
Prefer \`List<T>\` to \`T[]\` in every API you design. You get compile-time safety, a richer API, and no covariance hole. Reach for arrays only for primitives on a hot path, where avoiding boxing matters.`,
    codeSnippet: `Object[] objects = new Long[1];
objects[0] = "boom";        // compiles, throws ArrayStoreException

List<Object> list = new ArrayList<Long>();  // compile error — good

// PECS
void copy(List<? extends Number> src,   // producer: read only
          List<? super Number> dst) {   // consumer: write only
    for (Number n : src) dst.add(n);
}`,
    pitfalls: [
      'Claiming generics are covariant because List<Dog> "feels like" a List<Animal>.',
      'Not knowing why new T[] is illegal (erasure vs reification).',
      'Getting PECS backwards.',
      'Using @SafeVarargs without actually verifying the method never stores into the varargs array.'
    ],
    followUpQuestions: [
      'What is heap pollution, and how does a generic varargs method cause it?',
      'Why does Collections.toArray(T[]) have that awkward signature?',
      'How would reified generics change the design of the collections API?'
    ],
    faangFocus: 'Language-depth questions like this appear at Google and JetBrains. Connecting erasure to the "no generic arrays" rule is the senior-level link.'
  },
  {
    id: 'col-14',
    categoryId: 'collections',
    title: 'Designing a Concurrent Bounded Cache Without a Global Lock',
    difficulty: 'Expert',
    tags: ['Cache', 'Concurrency', 'Eviction', 'Caffeine'],
    scenario: 'You need an in-process cache: 500k entries max, ~200k reads/sec across 64 threads, ~5k writes/sec, TTL of 10 minutes, and no single lock allowed to become a bottleneck.',
    question: 'Design it. Explain why a synchronized LinkedHashMap LRU fails at this scale and what modern caches do instead.',
    idealAnswer: `### Why synchronized LinkedHashMap fails
Access-ordered \`LinkedHashMap\` must **mutate the linked list on every read** to move the entry to the tail. That turns a read-mostly workload into a write-mostly one on a single shared data structure, guarded by one lock. At 200k reads/sec across 64 threads, that lock and the two hot cache lines at the list head and tail dominate everything. Reads should be the cheap path; here they are the contended path.

### What modern caches do (the Caffeine design)
1. **Storage:** a plain \`ConcurrentHashMap\` — lock-free reads, bin-level write locks. The map knows nothing about eviction.
2. **Read buffering:** each read appends the accessed key to a **striped, lossy ring buffer** rather than touching a shared list. If the buffer is full the record is simply dropped — approximate recency is good enough, and the read path stays contention-free.
3. **Write buffering:** writes go to a bounded queue.
4. **Amortised maintenance:** a single thread (whichever one finds the buffers dirty, or an executor) drains both buffers under a \`tryLock\` and applies the ordering/eviction decisions in bulk. Readers never block on it.
5. **Admission policy:** **TinyLFU** — a compact count-min sketch of recent frequency decides whether a newly arriving entry deserves to displace the current eviction candidate. This resists the classic LRU failure of a scan wiping the working set.
6. **Expiry:** hierarchical timer wheels give O(1) TTL bookkeeping without a per-entry scheduled task.

### The pragmatic answer
**Use Caffeine.** Hand-rolling this correctly is a multi-month project, and the interviewer wants to hear that you know why it is hard. Configure \`maximumSize(500_000)\`, \`expireAfterWrite(10, MINUTES)\`, and enable \`recordStats()\` so hit ratio is observable.

If you genuinely must hand-roll: \`ConcurrentHashMap\` + \`computeIfAbsent\` for load, a striped set of per-shard LRU lists (shard by \`key.hashCode()\`) so eviction contention is spread, and a size counter using \`LongAdder\`.

### Do not forget
* **Cache stampede**: \`computeIfAbsent\` serialises loads per key, which is exactly what you want, but the mapping function must not block for long or touch the same map.
* **Negative caching** for misses, with a shorter TTL.
* **Hit ratio and load latency** as exported metrics — an unmeasured cache is a guess.`,
    codeSnippet: `LoadingCache<Key, Value> cache = Caffeine.newBuilder()
        .maximumSize(500_000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .refreshAfterWrite(Duration.ofMinutes(8))   // serve stale, refresh async
        .recordStats()
        .build(this::loadFromDb);

Value v = cache.get(key);   // stampede-safe: one loader per key`,
    pitfalls: [
      'Proposing synchronized LinkedHashMap and not noticing reads become writes.',
      'Forgetting cache stampede protection on the load path.',
      'Using a scheduled task per entry for TTL instead of a timer wheel or lazy expiry.',
      'Shipping a cache with no hit-ratio metric.'
    ],
    followUpQuestions: [
      'How does TinyLFU\'s count-min sketch stay small while tracking frequency?',
      'When is refreshAfterWrite better than expireAfterWrite, and what is the risk?',
      'How would you extend this to a two-tier local + Redis cache, and how do you invalidate it?'
    ],
    faangFocus: 'A classic senior design round. The signal is knowing that the read path must stay lock-free and that eviction accuracy can be approximate.'
  },
];
