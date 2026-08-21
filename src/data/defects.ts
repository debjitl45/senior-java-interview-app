import type { CodeDefect } from './types';

export const CODE_DEFECTS: CodeDefect[] = [
  {
    id: 'cd-1',
    title: 'The Double-Checked Locking Trap',
    categoryId: 'concurrency',
    difficulty: 'Hard',
    code: `public class ExpensiveResource {
    private static ExpensiveResource instance;
    
    private ExpensiveResource() {
        // Heavy initialization
    }
    
    public static ExpensiveResource getInstance() {
        if (instance == null) {
            synchronized (ExpensiveResource.class) {
                if (instance == null) {
                    instance = new ExpensiveResource();
                }
            }
        }
        return instance;
    }
}`,
    defectDescription: 'This implementation of Double-Checked Locking is broken and can cause other threads to see a partially initialized object.',
    fixedCode: `public class ExpensiveResource {
    // FIXED: Added the 'volatile' keyword!
    private static volatile ExpensiveResource instance;
    
    private ExpensiveResource() {
        // Heavy initialization
    }
    
    public static ExpensiveResource getInstance() {
        if (instance == null) {
            synchronized (ExpensiveResource.class) {
                if (instance == null) {
                    instance = new ExpensiveResource();
                }
            }
        }
        return instance;
    }
}`,
    explanation: `### The Defect
Without the **\`volatile\`** keyword, the statement \`instance = new ExpensiveResource()\` is not atomic. The compiler or CPU can reorder the internal instructions:
1. Allocate memory for the object.
2. Assign the memory reference to the \`instance\` variable.
3. Call the constructor to initialize the fields.

If Thread A is preempted after step 2 but before step 3, Thread B can call \`getInstance()\`, see that \`instance != null\`, and return the reference to a **partially initialized object**, leading to unpredictable \`NullPointerExceptions\` or corrupted state!

### The Fix
Adding \`volatile\` ensures a **happens-before** relationship. The writes to the object's fields in the constructor are guaranteed to be visible before the write to the \`instance\` reference itself.`
  },
{
    id: 'cd-2',
    title: 'ConcurrentHashMap Check-Then-Act Flaw',
    categoryId: 'concurrency',
    difficulty: 'Hard',
    code: `public class UserSessionCache {
    private final Map<String, AtomicInteger> requests = new ConcurrentHashMap<>();

    public void logRequest(String userId) {
        AtomicInteger counter = requests.get(userId);
        if (counter == null) {
            counter = new AtomicInteger(0);
            requests.put(userId, counter);
        }
        counter.incrementAndGet();
    }
}`,
    defectDescription: 'Despite using ConcurrentHashMap and AtomicInteger, this code contains a classic Check-Then-Act race condition that will lose tracking counters.',
    fixedCode: `public class UserSessionCache {
    private final Map<String, AtomicInteger> requests = new ConcurrentHashMap<>();

    public void logRequest(String userId) {
        // FIXED: Use computeIfAbsent for an atomic check-then-act!
        requests.computeIfAbsent(userId, k -> new AtomicInteger(0))
                .incrementAndGet();
    }
}`,
    explanation: `### The Defect
While \`ConcurrentHashMap\` guarantees that individual operations (like \`get\` and \`put\`) are thread-safe, it does not make a **sequence** of operations atomic.
If two threads simultaneously call \`logRequest\` for a new \`userId\`:
1. Both threads call \`requests.get(userId)\` and both receive \`null\`.
2. Both threads create a new \`AtomicInteger(0)\`.
3. Both threads call \`requests.put\`. The second thread overwrites the first thread's counter! The increments are lost.

### The Fix
Use **\`computeIfAbsent\`**, which internally locks the specific hash bucket and ensures the mapping function is executed atomically exactly once.`
  },
{
    id: 'cd-3',
    title: 'ThreadLocal Memory Leak in Thread Pools',
    categoryId: 'jvm',
    difficulty: 'Expert',
    code: `public class UserContextHolder {
    private static final ThreadLocal<User> context = new ThreadLocal<>();

    public static void setUser(User user) {
        context.set(user);
    }

    public static User getUser() {
        return context.get();
    }
}

// Inside a web controller executed by a Tomcat thread pool:
public void handleRequest(User user) {
    UserContextHolder.setUser(user);
    processBusinessLogic();
    // Missing cleanup!
}`,
    defectDescription: 'Failing to clear the ThreadLocal in a pooled thread environment causes severe memory leaks and cross-request data contamination.',
    fixedCode: `public void handleRequest(User user) {
    UserContextHolder.setUser(user);
    try {
        processBusinessLogic();
    } finally {
        // FIXED: Always explicitly remove the ThreadLocal value!
        UserContextHolder.clear(); 
    }
}

public class UserContextHolder {
    private static final ThreadLocal<User> context = new ThreadLocal<>();
    // ...
    public static void clear() {
        context.remove();
    }
}`,
    explanation: `### The Defect
Web servers like Tomcat use a **Thread Pool** to handle incoming HTTP requests. When a request finishes, the thread is not destroyed; it is returned to the pool.
If you do not call \`remove()\` on the \`ThreadLocal\`:
1. The \`User\` object remains strongly referenced by the thread's internal \`ThreadLocalMap\`. This causes a **Heap Memory Leak**.
2. **Security Vulnerability:** When that same thread is later reused to serve a request for a completely different user, calling \`getUser()\` might return the previous user's cached data!`
  },
{
    id: 'cd-4',
    title: 'Stream Parallel Processing with Shared State',
    categoryId: 'concurrency',
    difficulty: 'Hard',
    code: `public class OrderProcessor {
      private int processedCount = 0;
      
      public void processOrders(List<Order> orders) {
          orders.parallelStream()
                .forEach(order -> {
                    processOrder(order);
                    processedCount++;  // RACE CONDITION!
                });
          
          System.out.println("Processed: " + processedCount);
      }
  }`,
    defectDescription: 'Using parallel streams with a shared mutable counter causes race conditions and incorrect counts.',
    fixedCode: `public class OrderProcessor {
      private final AtomicInteger processedCount = new AtomicInteger(0);
      
      public void processOrders(List<Order> orders) {
          orders.parallelStream()
                .forEach(order -> {
                    processOrder(order);
                    processedCount.incrementAndGet();  // Thread-safe!
                });
          
          System.out.println("Processed: " + processedCount.get());
      }
  }`,
    explanation: `### The Defect
  The \`processedCount++\` operation is **not atomic**. It involves:
  1. Read the current value
  2. Increment it
  3. Write it back
  
  In a parallel stream, multiple threads execute this simultaneously, causing **lost updates**. If 1000 orders are processed, you might see "Processed: 847" instead of 1000.
  
  ### The Fix
  Use \`AtomicInteger\` which provides atomic \`incrementAndGet()\` operations using hardware-level CAS (Compare-And-Swap) instructions.
  
  **Alternative:** Use \`Collectors.counting()\` to avoid shared state entirely:
  \`\`\`java
  long count = orders.parallelStream()
                     .peek(this::processOrder)
                     .count();
  \`\`\``
  },
{
    id: 'cd-5',
    title: 'The Mutable Key in a HashMap',
    categoryId: 'collections',
    difficulty: 'Core',
    code: `public class OrderIndex {

    static class OrderKey {
        String region;
        int number;

        OrderKey(String region, int number) {
            this.region = region;
            this.number = number;
        }

        @Override public boolean equals(Object o) {
            if (!(o instanceof OrderKey k)) return false;
            return number == k.number && Objects.equals(region, k.region);
        }

        @Override public int hashCode() {
            return Objects.hash(region, number);
        }
    }

    private final Map<OrderKey, Order> index = new HashMap<>();

    public void add(OrderKey key, Order order) {
        index.put(key, order);
    }

    public void relocate(OrderKey key, String newRegion) {
        key.region = newRegion;      // move the order to another region
    }

    public Order find(OrderKey key) {
        return index.get(key);       // sometimes returns null for a key we added
    }
}`,
    defectDescription: 'A key already stored in the HashMap is mutated. Its hashCode changes, so it lands in the wrong bucket and becomes unreachable — a silent, permanent leak.',
    fixedCode: `public class OrderIndex {

    // Immutable key: hashCode can never change after insertion
    record OrderKey(String region, int number) { }

    private final Map<OrderKey, Order> index = new HashMap<>();

    public void add(OrderKey key, Order order) {
        index.put(key, order);
    }

    public void relocate(OrderKey key, String newRegion) {
        Order order = index.remove(key);                 // remove with the OLD key
        if (order != null) {
            index.put(new OrderKey(newRegion, key.number()), order);   // re-insert
        }
    }

    public Order find(OrderKey key) {
        return index.get(key);
    }
}`,
    explanation: `### The Defect
\`HashMap\` computes the bucket index from \`hashCode()\` **at insertion time** and never recomputes it.

When \`relocate\` mutates \`key.region\`, the key's \`hashCode()\` changes. A later \`get(key)\`:
1. Computes the **new** hash,
2. Looks in the **new** bucket,
3. Finds nothing — because the entry is still sitting in the bucket chosen by the old hash.

The entry is now unreachable through \`get\`, \`remove\` or \`containsKey\`, yet it still occupies memory and still shows up in iteration. It is a genuine memory leak with no way to clean it up short of rebuilding the map.

### Why it is so hard to spot
It is completely silent. There is no exception, and the map's \`size()\` is still correct. It usually surfaces as "the cache sometimes misses for data we know we inserted".

### The Fix
Make keys **immutable**. A \`record\` is the ideal shape: final fields, generated \`equals\`/\`hashCode\`, and no way to mutate after construction.

When the logical key must change, that is a **remove-then-insert**, not a mutation — the map has to be told.

### The general rule
Any object used as a \`HashMap\` key or a \`HashSet\` element must be immutable in the fields used by \`equals\` and \`hashCode\`. The same rule applies to \`TreeMap\` and \`TreeSet\` for the fields used by the comparator, where mutation corrupts the tree ordering instead.`
  },
  {
    id: 'cd-6',
    title: 'The Silent Resource Leak',
    categoryId: 'jvm',
    difficulty: 'Core',
    code: `public class ReportExporter {

    public void export(Path source, Path target) throws IOException {
        BufferedReader reader = Files.newBufferedReader(source);
        BufferedWriter writer = Files.newBufferedWriter(target);

        String line;
        while ((line = reader.readLine()) != null) {
            writer.write(transform(line));
            writer.newLine();
        }

        reader.close();
        writer.close();
    }

    public long countErrors(Path log) throws IOException {
        return Files.lines(log)
                    .filter(l -> l.contains("ERROR"))
                    .count();
    }
}`,
    defectDescription: 'Both methods leak file descriptors. In export(), any exception skips the close() calls entirely. In countErrors(), the Files.lines stream is never closed at all.',
    fixedCode: `public class ReportExporter {

    public void export(Path source, Path target) throws IOException {
        // Both resources closed in reverse order, even on exception
        try (BufferedReader reader = Files.newBufferedReader(source, UTF_8);
             BufferedWriter writer = Files.newBufferedWriter(target, UTF_8)) {

            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(transform(line));
                writer.newLine();
            }
        }
    }

    public long countErrors(Path log) throws IOException {
        // Stream extends AutoCloseable; IO-backed streams MUST be closed
        try (Stream<String> lines = Files.lines(log, UTF_8)) {
            return lines.filter(l -> l.contains("ERROR")).count();
        }
    }
}`,
    explanation: `### The Defect

**In \`export\`:** if \`transform\` throws, or the disk fills during \`write\`, both \`close()\` calls are skipped. Two descriptors leak per failure. Worse, the writer is never flushed, so the output file is silently truncated.

**In \`countErrors\`:** \`Files.lines\` opens the file and returns a lazily-populated stream. \`Stream\` extends \`BaseStream\` which extends \`AutoCloseable\`, and IO-backed streams (\`Files.lines\`, \`Files.walk\`, \`Files.list\`, \`Files.find\`) hold a real file handle. Nothing closes it here.

Leaked descriptors accumulate until the process hits its \`ulimit\`, at which point **every** file and socket operation fails with "Too many open files" — including the ones that have nothing to do with this code. The failure appears far from its cause.

### Why GC does not save you
Finalization and cleaners are non-deterministic. Under low heap pressure a leaked descriptor may be held for a very long time, and descriptors are a much scarcer resource than heap.

### The Fix
**try-with-resources** for everything \`AutoCloseable\`. It closes in reverse order of declaration, and correctly handles the case where both the body and \`close()\` throw — the \`close()\` exception is attached as a **suppressed** exception rather than swallowing the original.

### Also fixed here
An explicit charset. Relying on the platform default made behaviour environment-dependent before Java 18 and still throws \`MalformedInputException\` on unexpected bytes.`
  },
  {
    id: 'cd-7',
    title: 'Self-Invocation Defeats @Transactional',
    categoryId: 'spring',
    difficulty: 'Hard',
    code: `@Service
public class OrderService {

    private final OrderRepository repo;
    private final AuditRepository audit;

    public OrderService(OrderRepository repo, AuditRepository audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Transactional
    public void placeOrder(OrderRequest req) {
        Order order = repo.save(Order.from(req));

        // Should survive even if the order fails
        this.writeAudit(order);

        if (!inventory.reserve(order)) {
            throw new OutOfStockException(order.getSku());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeAudit(Order order) {
        audit.save(new AuditEntry(order.getId(), "PLACED"));
    }
}`,
    defectDescription: 'this.writeAudit() is an internal call that bypasses the Spring proxy, so REQUIRES_NEW is ignored. The audit row joins the outer transaction and is rolled back with it.',
    fixedCode: `@Service
public class AuditService {

    private final AuditRepository audit;

    public AuditService(AuditRepository audit) { this.audit = audit; }

    // Called through a proxy from another bean: REQUIRES_NEW is honoured
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeAudit(Order order) {
        audit.save(new AuditEntry(order.getId(), "PLACED"));
    }
}

@Service
public class OrderService {

    private final OrderRepository repo;
    private final AuditService auditService;      // separate bean => real proxy

    public OrderService(OrderRepository repo, AuditService auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }

    @Transactional
    public void placeOrder(OrderRequest req) {
        Order order = repo.save(Order.from(req));
        auditService.writeAudit(order);           // goes through the proxy

        if (!inventory.reserve(order)) {
            throw new OutOfStockException(order.getSku());
        }
    }
}`,
    explanation: `### The Defect
Spring implements \`@Transactional\` with an **AOP proxy**. Other beans receive the proxy; the proxy opens/joins a transaction and then delegates to the real object.

\`this.writeAudit(order)\` is a plain Java method call on the **target instance**. The proxy is never involved, so:
* \`REQUIRES_NEW\` is silently ignored.
* The audit write joins the **outer** transaction.
* When \`OutOfStockException\` propagates, everything rolls back — including the audit entry that was specifically meant to survive.

The annotation is right there in the source, which is what makes this so convincing in code review.

### The same trap elsewhere
This applies to **every** proxy-based annotation: \`@Cacheable\`, \`@Async\`, \`@PreAuthorize\`, \`@Retryable\`. A self-invoked \`@Async\` method just runs synchronously, with no warning.

It also means \`@Transactional\` does nothing on \`private\`, \`final\` or \`static\` methods — there is nothing for a CGLIB subclass to override.

### The Fix
Move the method to a **separate bean**. The call now crosses a proxy boundary and the propagation behaves as declared. This is also better design: auditing is a distinct responsibility.

### Alternatives
* Inject a self-reference via \`ObjectProvider\` and call through it — works, but obscure.
* \`TransactionTemplate\` for explicit, programmatic control with no proxy involved.
* AspectJ load-time weaving, which advises the class itself so self-invocation works — powerful, but heavy.

### A second bug worth noting
Even with the fix, an audit row written in a separate transaction commits **before** the outer one. If auditing must reflect only committed orders, an \`@TransactionalEventListener(phase = AFTER_COMMIT)\` is the correct tool instead.`
  },
  {
    id: 'cd-8',
    title: 'The N+1 Query Hidden Behind a Getter',
    categoryId: 'persistence',
    difficulty: 'Solid',
    code: `@RestController
public class OrderController {

    private final OrderRepository repo;

    @GetMapping("/orders")
    public List<OrderDto> list(@RequestParam Status status) {
        return repo.findByStatus(status).stream()
                   .map(this::toDto)
                   .toList();
    }

    private OrderDto toDto(Order order) {
        return new OrderDto(
            order.getId(),
            order.getCustomer().getName(),          // lazy -> 1 query
            order.getItems().size(),                // lazy -> 1 query
            order.getItems().stream()               // already loaded now
                 .mapToDouble(LineItem::getPrice)
                 .sum()
        );
    }
}

@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY) private Customer customer;
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY) private List<LineItem> items;
}`,
    defectDescription: 'Each lazy association is loaded per order inside the mapping loop. 100 orders produce 201 queries — the classic N+1, hidden behind ordinary-looking getters.',
    fixedCode: `public interface OrderRepository extends JpaRepository<Order, Long> {

    // One query, fetch plan declared separately from the query
    @EntityGraph(attributePaths = {"customer", "items"})
    List<Order> findByStatus(Status status);
}

// Even better when the endpoint only needs a few fields:
// no entities loaded at all, exactly the columns required.
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("""
           select new com.acme.OrderDto(o.id, c.name, count(i), sum(i.price))
             from Order o
             join o.customer c
             left join o.items i
            where o.status = :status
            group by o.id, c.name
           """)
    List<OrderDto> findSummaries(@Param("status") Status status);
}

# Global safety net so a forgotten fetch plan degrades gracefully
spring.jpa.properties.hibernate.default_batch_fetch_size=50`,
    explanation: `### The Defect
\`findByStatus\` issues **one** query for the orders. Then, for each order, \`getCustomer().getName()\` triggers a lazy load and \`getItems().size()\` triggers another.

100 orders → **201 queries**. At a 5ms round trip that is over a second of pure network latency, and it scales linearly with result size — so it passes in development with 3 rows and fails in production with 500.

### Why it hides so well
The mapping code looks like plain Java. Nothing in \`toDto\` suggests database access; the queries are emitted by proxy objects behind ordinary getters. This is why N+1 survives code review so reliably.

### The Fix
**\`@EntityGraph\`** declares the fetch plan so the associations are loaded in the same query. \`JOIN FETCH\` in JPQL does the same thing inline.

**Caveat:** fetching a **collection** with pagination does not work — Hibernate warns "firstResult/maxResults specified with collection fetch" and pages **in memory** after loading everything. And fetching two collections at once produces a Cartesian product (\`MultipleBagFetchException\`).

**The projection version is better still.** The endpoint needs four values; loading full entity graphs to produce them is wasted work. A constructor projection fetches exactly the required columns in one query.

### The global safety net
\`default_batch_fetch_size\` makes Hibernate load lazy associations with \`WHERE parent_id IN (?, ?, ...)\`, turning N+1 into N/50 + 1 everywhere — including the places you forget. It is the highest-value single line of configuration in a JPA application.

### Prevent the regression
Assert a query budget in tests (datasource-proxy or a query counter). N+1 always comes back otherwise.`
  },
  {
    id: 'cd-9',
    title: 'Unbounded Queue Turns Overload Into an OOM',
    categoryId: 'architecture',
    difficulty: 'Hard',
    code: `@Service
public class IngestionService {

    private final ExecutorService workers = Executors.newFixedThreadPool(32);

    @KafkaListener(topics = "events")
    public void onMessage(Event event) {
        // Return immediately so Kafka never thinks we are slow
        workers.submit(() -> process(event));
    }

    private void process(Event event) {
        enrich(event);
        repository.save(event);   // ~40ms
    }
}`,
    defectDescription: 'newFixedThreadPool uses an unbounded LinkedBlockingQueue. When consumers fall behind, the backlog accumulates on the heap until the JVM dies, instead of applying backpressure.',
    fixedCode: `@Service
public class IngestionService {

    private final ExecutorService workers = new ThreadPoolExecutor(
            32, 32,
            0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(1_000),                    // bounded
            new ThreadFactoryBuilder().setNameFormat("ingest-%d").build(),
            new ThreadPoolExecutor.CallerRunsPolicy());         // real backpressure

    @KafkaListener(topics = "events")
    public void onMessage(Event event) {
        // When the queue is full, CallerRunsPolicy runs the task on the
        // Kafka listener thread. That stops polling, so Kafka becomes the
        // buffer -- which is exactly what it is designed to be.
        workers.submit(() -> process(event));
    }

    @Scheduled(fixedRate = 10_000)
    void reportSaturation() {
        var q = ((ThreadPoolExecutor) workers).getQueue();
        metrics.gauge("ingest.queue.depth", q.size());          // early warning
    }
}`,
    explanation: `### The Defect
\`Executors.newFixedThreadPool(32)\` is backed by an **unbounded** \`LinkedBlockingQueue\` (capacity \`Integer.MAX_VALUE\`).

When the incoming rate exceeds what 32 workers can process, the excess does not slow anything down — it **accumulates on the heap**. Each queued task retains its \`Event\` object. The system converts a throughput problem into a **memory** problem and dies with an \`OutOfMemoryError\` instead of degrading.

The comment in the original code names the intent exactly backwards: returning immediately so "Kafka never thinks we are slow" removes the only mechanism that could have saved the service.

### The related trap
With an unbounded queue, \`maximumPoolSize\` is **dead configuration** — the pool never grows past core size, because the queue never refuses a task. Many teams set a maximum and wonder why the pool never uses it.

### The Fix
1. **Bound the queue.** Size it from a latency budget: \`capacity ≈ target_latency × throughput\`. At 40ms and 32 workers, 1,000 queued items is roughly 1.25 seconds of backlog.
2. **\`CallerRunsPolicy\`** is the simplest true backpressure: when the queue is full, the *submitting* thread executes the task. Here that is the Kafka listener thread, so polling stops and the lag builds up in Kafka — a durable, monitored, purpose-built buffer.
3. **Commit offsets only after processing**, so redelivery is safe and a slow consumer naturally stops fetching.
4. **Export queue depth** as a metric. Depth trending upward is the early warning that arrives before the incident.

### The principle
Unbounded queues turn **latency problems into availability problems**. Every queue in a system should have a bound and a documented policy for what happens when it is reached.`
  },
  {
    id: 'cd-10',
    title: 'The Comparator That Breaks TimSort',
    categoryId: 'collections',
    difficulty: 'Solid',
    code: `public class TaskScheduler {

    public List<Task> prioritise(List<Task> tasks) {
        tasks.sort((a, b) -> {
            // Urgent tasks are all equally important
            if (a.isUrgent() || b.isUrgent()) {
                return 0;
            }
            return a.getPriority() - b.getPriority();
        });
        return tasks;
    }
}

// Intermittently throws:
//   java.lang.IllegalArgumentException:
//     Comparison method violates its general contract!`,
    defectDescription: 'Two independent bugs: integer subtraction can overflow, and returning 0 for the urgent case destroys transitivity. TimSort detects the inconsistent ordering and throws.',
    fixedCode: `public class TaskScheduler {

    private static final Comparator<Task> BY_PRIORITY =
            Comparator.comparing(Task::isUrgent).reversed()   // urgent first
                      .thenComparingInt(Task::getPriority)    // overflow-safe
                      .thenComparing(Task::getId);            // unique tiebreaker

    public List<Task> prioritise(List<Task> tasks) {
        // Return a sorted copy rather than mutating the caller's list
        return tasks.stream().sorted(BY_PRIORITY).toList();
    }
}`,
    explanation: `### Defect 1: integer overflow
\`a.getPriority() - b.getPriority()\` wraps when the operands straddle the int range. \`Integer.MIN_VALUE - 1\` overflows to a **positive** value, so the comparator reports "greater than" for a pair that is clearly "less than". Use \`Integer.compare(a, b)\` — it is overflow-safe and just as fast.

### Defect 2: broken transitivity
Returning 0 whenever **either** argument is urgent destroys the ordering:
* \`urgent\` vs \`low\` → 0 (equal)
* \`urgent\` vs \`high\` → 0 (equal)
* therefore \`low\` and \`high\` must be equal — but they are not.

The comparator is no longer a valid total order.

### Why TimSort throws
Java's object sort is **TimSort**, which finds existing sorted runs and merges them. Its merge invariants depend on the comparator defining a genuine total order. When it detects that the ordering is inconsistent, it throws \`IllegalArgumentException\` rather than silently producing garbage or running off the end of an array.

The exception is a **feature** — it is telling you the comparator is broken. It appears intermittently because it depends on the input arrangement, which is why it survives testing and fails in production.

### The contract
* \`sgn(compare(x,y)) == -sgn(compare(y,x))\`
* transitive: \`compare(x,y) > 0 && compare(y,z) > 0\` ⇒ \`compare(x,z) > 0\`
* \`compare(x,y) == 0\` ⇒ \`sgn(compare(x,z)) == sgn(compare(y,z))\` for all z
* strongly recommended: consistent with \`equals\`

### The Fix
Build comparators **declaratively** with \`Comparator.comparing(...).thenComparing(...)\`. Chained key extractors are transitive by construction, and a final unique tiebreaker (the id) guarantees a **total** order with stable results.

The fixed version also stops mutating the caller's list — a separate but real defect.`
  },
  {
    id: 'cd-11',
    title: 'Optional Used as a Fancier Null Check',
    categoryId: 'streams',
    difficulty: 'Core',
    code: `public class UserService {

    public String cityOf(long id) {
        Optional<User> user = repo.findById(id);

        if (user.isPresent()) {
            User u = repo.findById(id).get();     // second query!
            if (u.getAddress() != null) {
                return u.getAddress().getCity();
            }
        }
        return getDefaultCity();                  // expensive lookup
    }

    public Optional<List<Order>> ordersFor(long id) {
        List<Order> orders = repo.findOrders(id);
        return orders.isEmpty() ? Optional.empty() : Optional.of(orders);
    }
}`,
    defectDescription: 'Optional is used as ceremony around a null check, a second query is issued, and Optional<List> forces callers to handle two different ways of saying "nothing".',
    fixedCode: `public class UserService {

    public String cityOf(long id) {
        return repo.findById(id)
                   .map(User::getAddress)
                   .map(Address::getCity)
                   .filter(c -> !c.isBlank())
                   .orElseGet(this::getDefaultCity);   // lazy: runs only if absent
    }

    // "No orders" is an empty list. Never Optional<Collection>.
    public List<Order> ordersFor(long id) {
        return repo.findOrders(id);
    }
}`,
    explanation: `### Defect 1: isPresent/get is just a null check
\`if (isPresent()) { get(); }\` reproduces exactly the null check \`Optional\` was meant to replace, with more ceremony and no added safety. \`get()\` is the one method that can throw — Java 10 added \`orElseThrow()\` as its preferred name for precisely this reason.

The idiomatic style is to **chain**: \`map\`, \`flatMap\`, \`filter\`, then terminate with \`orElse\`, \`orElseGet\`, \`orElseThrow\` or \`ifPresentOrElse\`.

### Defect 2: the duplicated query
\`repo.findById(id)\` is called **twice** — once to test presence and once to extract the value. That is a second database round trip on every call, hidden inside what looks like a null check.

### Defect 3: Optional<List>
This is always wrong. A collection already has a perfectly good way of saying "nothing": **being empty**. Wrapping it creates two distinct representations of absence, so every caller must handle both, and forgetting one is an NPE.

Return an empty list. Callers can iterate it, stream it, and check \`isEmpty()\` without any unwrapping.

### Bonus: orElse vs orElseGet
\`orElse(getDefaultCity())\` **always evaluates** its argument, even when the value is present. For an expensive or side-effecting call, use \`orElseGet(this::getDefaultCity)\`, which is invoked only when the Optional is empty.

### What Optional is actually for
It is a **return type** for methods that may have nothing to return. It was never intended for fields (it is not \`Serializable\`), for parameters (callers can still pass null, giving you three states), or for collections.`
  },
  {
    id: 'cd-12',
    title: 'The Cache That Never Forgets',
    categoryId: 'jvm',
    difficulty: 'Solid',
    code: `@Service
public class PricingService {

    // "Small" cache to avoid recomputing prices
    private final Map<PriceKey, Price> cache = new ConcurrentHashMap<>();

    public Price price(String sku, String customerId, Instant at) {
        PriceKey key = new PriceKey(sku, customerId, at);
        return cache.computeIfAbsent(key, this::compute);
    }

    private Price compute(PriceKey key) {
        return engine.evaluate(key);   // expensive
    }
}

record PriceKey(String sku, String customerId, Instant at) { }`,
    defectDescription: 'The cache is unbounded and keyed partly on a timestamp, so almost every request creates a new entry that is never read again and never evicted. The heap grows until OOM.',
    fixedCode: `@Service
public class PricingService {

    private final Cache<PriceKey, Price> cache = Caffeine.newBuilder()
            .maximumSize(50_000)                          // bounded
            .expireAfterWrite(Duration.ofMinutes(10))     // and time-bounded
            .recordStats()                                // hit ratio is observable
            .build();

    public Price price(String sku, String customerId, Instant at) {
        // Truncate the timestamp so keys are reusable at all
        PriceKey key = new PriceKey(sku, customerId, at.truncatedTo(ChronoUnit.HOURS));
        return cache.get(key, this::compute);             // stampede-safe per key
    }

    private Price compute(PriceKey key) {
        return engine.evaluate(key);
    }
}`,
    explanation: `### Defect 1: unbounded growth
A \`ConcurrentHashMap\` used as a cache has **no eviction of any kind**. Every distinct key ever seen is retained for the lifetime of the JVM. This is the single most common memory leak in Java services, and it always looks reasonable at review time because the map is "small" in development.

The symptom is a slow, steady heap climb over hours or days, with full GCs reclaiming progressively less — and an OOM at a time unrelated to any deploy.

### Defect 2: the key can never repeat
\`Instant at\` has nanosecond resolution. Two calls a microsecond apart produce **different keys**, so:
* The hit ratio is effectively **zero** — it is not a cache at all, just a leak.
* Every request adds an entry that will never be read again.

Truncating the instant (to the hour here) is what makes keys reusable, and is the difference between a cache and an accumulator.

### The Fix
* **Bound it.** \`maximumSize\` guarantees a memory ceiling. \`expireAfterWrite\` bounds staleness.
* **Use a real cache library.** Caffeine gives you eviction (TinyLFU admission, which resists scans wiping the working set), expiry via timer wheels, and per-key single-flight loading so a hot key cannot stampede your pricing engine.
* **Record stats.** \`recordStats()\` exposes hit ratio and load latency. An unmeasured cache is a guess — and in this case the metric would have shown a 0% hit rate immediately.

### The rule
Every in-memory cache needs a **size bound**, a **staleness bound**, and a **hit-ratio metric**. A bare \`Map\` field satisfies none of them.`
  },
  {
    id: 'cd-13',
    title: 'Allowlist Bypass in a Dynamic Query',
    categoryId: 'security',
    difficulty: 'Hard',
    code: `@GetMapping("/search")
public List<User> search(@RequestParam String name,
                         @RequestParam String sortBy,
                         @RequestParam String direction) {

    // Parameterised, so this is safe
    String sql = "SELECT * FROM users WHERE tenant_id = ? AND name LIKE ? "
               + "ORDER BY " + sortBy + " " + direction;

    return jdbc.query(sql, rowMapper,
                      currentTenant(),
                      "%" + name + "%");
}`,
    defectDescription: 'The name filter is parameterised, but sortBy and direction are concatenated straight into the SQL. Identifiers cannot be bound as parameters, so this is a live injection point.',
    fixedCode: `// Identifiers can never be parameterised -> allowlist, never interpolate
private static final Map<String, String> SORTABLE = Map.of(
        "name",    "name",
        "created", "created_at",
        "email",   "email");

private static final Set<String> DIRECTIONS = Set.of("ASC", "DESC");

@GetMapping("/search")
public List<User> search(@RequestParam String name,
                         @RequestParam(defaultValue = "created") String sortBy,
                         @RequestParam(defaultValue = "DESC") String direction) {

    String column = SORTABLE.get(sortBy);
    if (column == null) throw new BadRequestException("invalid sort field");

    String dir = direction.toUpperCase(Locale.ROOT);
    if (!DIRECTIONS.contains(dir)) throw new BadRequestException("invalid direction");

    String sql = "SELECT * FROM users WHERE tenant_id = ? AND name LIKE ? ESCAPE '\\\\' "
               + "ORDER BY " + column + " " + dir;      // both from a fixed allowlist

    return jdbc.query(sql, rowMapper, currentTenant(), "%" + escapeLike(name) + "%");
}`,
    explanation: `### The Defect
The developer parameterised the *value* and assumed the statement was therefore safe. But \`sortBy\` and \`direction\` are **concatenated into the SQL text**, so an attacker controls part of the query's structure.

Placeholders bind **values only**. They cannot bind table names, column names, sort direction, or whole clauses — the statement is parsed and planned before parameters are supplied, so an identifier has to be present at parse time.

This partial-parameterisation pattern is especially dangerous because the code *looks* like it follows the rule, and reviewers see the \`?\` and move on.

### Why escaping is not the answer
There is no reliable way to escape an identifier across dialects, and any attempt puts you in a race against quoting, unicode normalisation and comment syntax. The only robust control is to **never let user input become SQL text**.

### The Fix
An **allowlist map** from an external, opaque key to a known-good column name. The user's string is used only as a *lookup key* — it never reaches the SQL. Anything not in the map is rejected outright.

The same applies to the sort direction: a two-element set, compared after case normalisation with an explicit \`Locale\` (\`toUpperCase()\` with a Turkish default locale famously maps \`i\` to \`İ\`).

### The recurring principle
Every defence here is the same idea: **enumerate what is allowed rather than what is forbidden**. Denylists lose because the attacker chooses the input space.

### Also fixed
The \`LIKE\` pattern now escapes \`%\` and \`_\`, so a user searching for \`100%\` does not accidentally (or deliberately) turn the filter into a full table scan.

### Defence in depth
Add a static-analysis rule (SpotBugs/Semgrep) that fails the build on string-concatenated SQL, and give the application's database user least privilege.`
  },
  {
    id: 'cd-14',
    title: 'The Test That Sleeps',
    categoryId: 'testing',
    difficulty: 'Solid',
    code: `@SpringBootTest
class OrderEventHandlerTest {

    @Autowired OrderEventHandler handler;
    @Autowired OrderRepository repo;

    @Test
    @RepeatedTest(3)                     // "fixes" the flakiness
    void persistsOrderOnEvent() throws Exception {
        handler.handleAsync(new OrderPlaced(42L));

        Thread.sleep(500);               // wait for the async handler

        assertTrue(repo.findById(42L).isPresent());
    }
}`,
    defectDescription: 'The test guesses how long the async work takes. It is slow when it passes and fails on a loaded CI machine; @RepeatedTest hides a real race rather than fixing it.',
    fixedCode: `@SpringBootTest
class OrderEventHandlerTest {

    @Autowired OrderEventHandler handler;
    @Autowired OrderRepository repo;

    // Option 1 (best): wait on the real completion signal
    @Test
    void persistsOrderOnEvent() throws Exception {
        CompletableFuture<Void> done = handler.handleAsync(new OrderPlaced(42L));

        done.get(5, TimeUnit.SECONDS);              // returns the instant it completes

        assertThat(repo.findById(42L)).isPresent();
    }

    // Option 2: no handle available -> poll a condition with a timeout
    @Test
    void persistsOrderOnEventEventually() {
        handler.handleAsync(new OrderPlaced(42L));

        await().atMost(Duration.ofSeconds(5))
               .pollInterval(Duration.ofMillis(20))
               .untilAsserted(() -> assertThat(repo.findById(42L)).isPresent());
    }
}

// Option 3 (often best of all): make the boundary synchronous in tests
@TestConfiguration
class SyncExecutorConfig {
    @Bean Executor taskExecutor() { return Runnable::run; }   // same-thread
}`,
    explanation: `### The Defect
\`Thread.sleep(500)\` encodes a **guess** about timing:
* On a loaded CI machine the work takes longer → the test **fails**.
* When the work takes 5ms → the test **wastes 495ms**, every run, forever.

There is no sleep value that is both fast and reliable. You are trading flakiness against suite runtime and losing on both.

### Why @RepeatedTest makes it worse
Retrying does not fix the race — it **hides** it. Worse, it trains the team to treat red builds as noise, which is how genuine regressions get ignored. A flaky test is a bug report you are choosing not to read.

### The Fixes, best first

**1. Wait on a real signal.** If the handler returns a \`CompletableFuture\` (or you can expose a \`CountDownLatch\`), the test blocks exactly as long as the work takes and no longer. Deterministic and fast.

**2. Poll a condition (Awaitility).** When there is no handle to wait on — a message genuinely arriving in Kafka, a database row appearing — poll with a timeout. It returns the instant the condition holds and fails with a clear message otherwise.

**3. Remove the concurrency in tests.** Inject the executor: a real pool in production, \`Runnable::run\` in tests. Most tests want to verify the *logic*, not the threading. This is often the cleanest option and makes the test trivially deterministic.

**4. Control time** for timeout and scheduling logic: inject a \`Clock\` and use \`Clock.fixed\`, so a 30-minute timeout tests in microseconds.

### The rule
A test that depends on wall-clock timing is not a test, it is a coin flip. And if you genuinely want to find race conditions, ordinary tests cannot — that is what **jcstress** is for.`
  },
  {
    id: 'cd-15',
    title: 'Virtual Thread Pinned by a synchronized Block',
    categoryId: 'concurrency',
    difficulty: 'Expert',
    code: `@Service
public class QuoteService {

    private final ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor();
    private final HttpClient http = HttpClient.newHttpClient();
    private final Map<String, Quote> cache = new HashMap<>();

    public Quote quote(String symbol) throws Exception {
        return exec.submit(() -> fetch(symbol)).get();
    }

    private synchronized Quote fetch(String symbol) {
        Quote cached = cache.get(symbol);
        if (cached != null && !cached.isStale()) return cached;

        // Blocking network call INSIDE the synchronized method
        Quote fresh = http.send(request(symbol), ofQuote()).body();
        cache.put(symbol, fresh);
        return fresh;
    }
}`,
    defectDescription: 'The blocking HTTP call happens inside a synchronized method. On JDKs before the pinning fix, a virtual thread cannot unmount while holding a monitor, so it occupies its carrier thread for the whole network round trip.',
    fixedCode: `@Service
public class QuoteService {

    private final ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor();
    private final HttpClient http = HttpClient.newHttpClient();

    // Concurrent map + per-key single-flight: no monitor held across IO at all
    private final Cache<String, Quote> cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofSeconds(30))
            .build();

    private final Semaphore upstream = new Semaphore(200);   // bound the downstream

    public Quote quote(String symbol) throws Exception {
        return exec.submit(() -> fetch(symbol)).get();
    }

    private Quote fetch(String symbol) {
        // Caffeine serialises loads per key without holding a monitor across IO
        return cache.get(symbol, key -> {
            upstream.acquireUninterruptibly();
            try {
                return http.send(request(key), ofQuote()).body();
            } finally {
                upstream.release();
            }
        });
    }
}

# Detect pinning on JDKs before the fix
-Djdk.tracePinnedThreads=full`,
    explanation: `### The Defect
Virtual threads scale because they **unmount** from their carrier thread when they block, freeing the carrier for other work. On JDKs before the \`synchronized\` improvement (JDK 24 largely removed this limitation — **check your runtime**), a virtual thread **cannot unmount while it holds a monitor**.

So during the HTTP call, the virtual thread stays **pinned** to its carrier. With a carrier pool sized to the core count, a handful of concurrent pinned threads exhausts the scheduler and the whole application stalls — the exact failure mode virtual threads were adopted to avoid.

### The second, worse defect
\`synchronized\` on the method means **only one symbol can be fetched at a time**, across the entire service. Even without pinning, this serialises every quote request behind one network call. A cache lookup for AAPL waits for an in-flight MSFT request.

### Detecting it
\`-Djdk.tracePinnedThreads=full\` prints a stack trace whenever a virtual thread parks while pinned. It is the first thing to enable when virtual threads do not deliver the expected concurrency. JFR also records \`jdk.VirtualThreadPinned\` events.

### The Fix
**Never hold a monitor across a blocking call.** Options, in order of preference:
1. **Remove the lock entirely.** A \`ConcurrentHashMap\` or Caffeine cache provides thread-safe access and per-key single-flight loading, so concurrent requests for the *same* symbol share one fetch while different symbols proceed in parallel. This is both correct and dramatically faster.
2. **\`ReentrantLock\` instead of \`synchronized\`** — it is Loom-aware and permits unmounting. The right mechanical fix when the lock genuinely must be held.
3. Restructure so the IO happens outside the critical section.

### And bound the downstream
Removing the lock removes the accidental concurrency limit. Virtual threads happily issue thousands of simultaneous requests, so add an explicit \`Semaphore\`. **Virtual threads remove the thread limit, not the need for a concurrency limit.**`
  },
  {
    id: 'cd-16',
    title: 'Equals Without Symmetry Across a Subclass',
    categoryId: 'collections',
    difficulty: 'Hard',
    code: `public class Point {
    private final int x, y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override public boolean equals(Object o) {
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override public int hashCode() { return Objects.hash(x, y); }
}

public class ColourPoint extends Point {
    private final Colour colour;

    public ColourPoint(int x, int y, Colour c) { super(x, y); this.colour = c; }

    @Override public boolean equals(Object o) {
        if (!(o instanceof ColourPoint)) return false;
        return super.equals(o) && colour == ((ColourPoint) o).colour;
    }
}

// Point p = new Point(1, 2);
// ColourPoint c = new ColourPoint(1, 2, RED);
// p.equals(c) -> true
// c.equals(p) -> false        <-- asymmetric`,
    defectDescription: 'equals is not symmetric across the inheritance boundary. Collections behave unpredictably: whether contains() finds an element depends on which object the collection happens to compare first.',
    fixedCode: `// Fix 1 (preferred): favour composition over inheritance
public record Point(int x, int y) { }

public record ColourPoint(Point point, Colour colour) {
    public Point asPoint() { return point; }     // explicit view, no equals conflict
}

// Fix 2: if the hierarchy must stay, require exact class equality
public class Point {
    private final int x, y;

    @Override public boolean equals(Object o) {
        // getClass() instead of instanceof: symmetric across subclasses
        if (o == null || getClass() != o.getClass()) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override public int hashCode() { return Objects.hash(x, y); }
}`,
    explanation: `### The Defect
The \`equals\` contract requires **symmetry**: \`a.equals(b)\` must equal \`b.equals(a)\`.

Here:
* \`p.equals(c)\` → \`c instanceof Point\` is true, coordinates match → **true**.
* \`c.equals(p)\` → \`p instanceof ColourPoint\` is false → **false**.

Symmetry is broken, and with it every collection guarantee. \`list.contains(x)\` may return true or false **depending on iteration order**, because \`contains\` calls \`equals\` in an unspecified direction. A \`HashSet\` can contain what looks like a duplicate. Bugs from this are non-deterministic and extremely hard to reproduce.

### Why there is no clever fix
This is a genuine limitation, documented in *Effective Java*: **there is no way to extend an instantiable class and add a value component while preserving the equals contract.** Attempts to be clever make it worse:
* Making \`Point.equals\` accept a \`ColourPoint\` "loosely" breaks **transitivity** instead — two ColourPoints of different colours would both equal the same Point but not each other.
* Comparing only when both are ColourPoints and falling back otherwise reintroduces asymmetry.

### The Fixes

**1. Composition (preferred).** \`ColourPoint\` *has a* \`Point\` rather than *is a* \`Point\`. Each type has its own coherent \`equals\`, no contract is violated, and a \`record\` generates everything correctly. This is why records are implicitly \`final\`.

**2. \`getClass()\` instead of \`instanceof\`.** Requires exact class equality, which is symmetric and transitive. The cost is that it violates the **Liskov substitution principle** — a \`ColourPoint\` can never equal a \`Point\`, even conceptually — and it also breaks with Hibernate proxies, which are generated subclasses. Use it knowingly.

### The rule
Value types should be \`final\` (or \`record\`s). If you find yourself adding a value component via inheritance, that is the design telling you to use composition.`
  },
];
