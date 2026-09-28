import type { CodeDefect } from './types';

/**
 * Spot-the-bug, part two: a ramp from one-line Core slips to Expert-level
 * distributed-systems defects. Weighted towards concurrency, Spring,
 * collections, streams and architecture.
 */
export const MORE_CODE_DEFECTS: CodeDefect[] = [
  // ---------------------------------------------------------------- Concurrency
  {
    id: 'cd-17',
    title: 'The Volatile Counter That Loses Increments',
    categoryId: 'concurrency',
    difficulty: 'Core',
    code: `public class PageViews {
    private volatile long views;

    // Called concurrently by every request thread
    public void record() {
        views++;
    }

    public long total() {
        return views;
    }
}`,
    defectDescription: 'Under load the reported total is always lower than the real number of requests, even though the field is volatile.',
    fixedCode: `public class PageViews {
    // FIXED: an atomic, contention-friendly counter
    private final LongAdder views = new LongAdder();

    public void record() {
        views.increment();
    }

    public long total() {
        return views.sum();
    }
}`,
    explanation: `### The Defect
\`views++\` is three steps: **read**, **add one**, **write**. Two threads can read the same value and both write back value + 1, so one increment is lost. \`volatile\` only guarantees that each read and write is visible to other threads; it does **not** make the read-modify-write sequence atomic.

### The Fix
Use an atomic primitive. \`AtomicLong.incrementAndGet()\` works; \`LongAdder\` is better for a hot counter that is written far more often than it is read, because it spreads updates across cells and avoids cache-line contention.`,
  },
  {
    id: 'cd-18',
    title: 'The Executor Nobody Shuts Down',
    categoryId: 'concurrency',
    difficulty: 'Core',
    code: `public class ReportCli {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<Report>> futures = new ArrayList<>();
        for (String region : args) {
            futures.add(pool.submit(() -> Reports.build(region)));
        }
        for (Future<Report> f : futures) {
            System.out.println(f.get());
        }
        System.out.println("Done");
    }
}`,
    defectDescription: 'The tool prints "Done" and then hangs forever instead of exiting.',
    fixedCode: `public class ReportCli {
    public static void main(String[] args) throws Exception {
        // FIXED: ExecutorService is AutoCloseable since Java 19;
        // close() shuts down and waits for tasks to finish.
        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
            List<Future<Report>> futures = new ArrayList<>();
            for (String region : args) {
                futures.add(pool.submit(() -> Reports.build(region)));
            }
            for (Future<Report> f : futures) {
                System.out.println(f.get());
            }
        }
        System.out.println("Done");
    }
}`,
    explanation: `### The Defect
Threads created by \`Executors.newFixedThreadPool\` are **non-daemon** threads. The JVM only exits when all non-daemon threads have finished, and idle pool workers wait for new tasks forever. The program never terminates.

### The Fix
Always shut executors down. On Java 19+ use try-with-resources (\`close()\` calls \`shutdown()\` and waits). On older versions call \`pool.shutdown()\` in a \`finally\` block followed by \`awaitTermination\`.`,
  },
  {
    id: 'cd-19',
    title: 'The Swallowed Interrupt',
    categoryId: 'concurrency',
    difficulty: 'Solid',
    code: `public class EventWorker implements Runnable {
    private final BlockingQueue<Event> queue;

    public EventWorker(BlockingQueue<Event> queue) { this.queue = queue; }

    @Override
    public void run() {
        while (true) {
            try {
                Event e = queue.take();
                handle(e);
            } catch (InterruptedException e) {
                log.warn("Interrupted, continuing");
            }
        }
    }
}`,
    defectDescription: 'Calling shutdownNow() on the executor running these workers never stops them, so deployments hang until the process is killed.',
    fixedCode: `public class EventWorker implements Runnable {
    private final BlockingQueue<Event> queue;

    public EventWorker(BlockingQueue<Event> queue) { this.queue = queue; }

    @Override
    public void run() {
        // FIXED: loop on the interrupt flag and restore it when caught
        while (!Thread.currentThread().isInterrupted()) {
            try {
                Event e = queue.take();
                handle(e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();   // preserve the signal and exit
            }
        }
    }
}`,
    explanation: `### The Defect
Interruption is Java's cooperative cancellation mechanism. \`shutdownNow()\` interrupts workers; \`take()\` responds by throwing \`InterruptedException\` **and clearing the interrupt flag**. This code logs it and loops again, so the cancellation request is lost and the worker blocks on \`take()\` forever.

### The Fix
Either propagate the exception or restore the flag with \`Thread.currentThread().interrupt()\`, and make the loop condition check the flag. Only code that owns the thread should decide to ignore an interrupt, and then deliberately.`,
  },
  {
    id: 'cd-20',
    title: 'Waiting With if Instead of while',
    categoryId: 'concurrency',
    difficulty: 'Solid',
    code: `public class JobQueue {
    private final Deque<Job> jobs = new ArrayDeque<>();

    public synchronized void add(Job job) {
        jobs.addLast(job);
        notifyAll();
    }

    public synchronized Job next() throws InterruptedException {
        if (jobs.isEmpty()) {
            wait();
        }
        return jobs.removeFirst();
    }
}`,
    defectDescription: 'With several consumer threads, next() occasionally throws NoSuchElementException.',
    fixedCode: `public class JobQueue {
    private final Deque<Job> jobs = new ArrayDeque<>();

    public synchronized void add(Job job) {
        jobs.addLast(job);
        notifyAll();
    }

    public synchronized Job next() throws InterruptedException {
        // FIXED: re-check the condition after every wake-up
        while (jobs.isEmpty()) {
            wait();
        }
        return jobs.removeFirst();
    }
}`,
    explanation: `### The Defect
\`notifyAll()\` wakes **every** waiting consumer for a single job. The first to reacquire the monitor takes it; the others return from \`wait()\` and call \`removeFirst()\` on an empty deque. Threads can also wake **spuriously** without any notify at all.

### The Fix
Always call \`wait()\` in a **while loop** that re-checks the condition after waking. Better still, use a \`BlockingQueue\` (\`LinkedBlockingQueue.take()\`), which implements this correctly.`,
  },
  {
    id: 'cd-21',
    title: 'The Shared SimpleDateFormat',
    categoryId: 'concurrency',
    difficulty: 'Solid',
    code: `public class InvoiceFormatter {
    private static final SimpleDateFormat FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    // Called from many request threads
    public String issueDate(Invoice invoice) {
        return FORMAT.format(invoice.getIssuedAt());
    }

    public Date parse(String text) throws ParseException {
        return FORMAT.parse(text);
    }
}`,
    defectDescription: 'Under load, invoices occasionally show impossible dates and parse() throws NumberFormatException for valid input.',
    fixedCode: `public class InvoiceFormatter {
    // FIXED: java.time formatters are immutable and thread-safe
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    public String issueDate(Invoice invoice) {
        return FORMAT.format(invoice.getIssuedOn());   // LocalDate
    }

    public LocalDate parse(String text) {
        return LocalDate.parse(text, FORMAT);
    }
}`,
    explanation: `### The Defect
\`SimpleDateFormat\` keeps intermediate parsing and formatting state in an internal \`Calendar\` field. It is **not thread-safe**. Concurrent calls on a shared static instance corrupt each other's state, producing wrong dates or exceptions, and only under load.

### The Fix
Use \`java.time\`: \`DateTimeFormatter\` is immutable and thread-safe, and \`LocalDate\`/\`Instant\` are better types anyway. If you're stuck with the legacy API, use a \`ThreadLocal<SimpleDateFormat>\` or create a new instance per call.`,
  },
  {
    id: 'cd-22',
    title: 'Check-Then-Act on a Synchronized List',
    categoryId: 'concurrency',
    difficulty: 'Solid',
    code: `public class Subscribers {
    private final List<String> emails = Collections.synchronizedList(new ArrayList<>());

    public boolean subscribe(String email) {
        if (!emails.contains(email)) {
            emails.add(email);
            return true;
        }
        return false;
    }
}`,
    defectDescription: 'Duplicate subscriptions appear when the same user double-clicks the subscribe button, despite the synchronized list.',
    fixedCode: `public class Subscribers {
    // FIXED: a concurrent set makes "add if absent" a single atomic operation
    private final Set<String> emails = ConcurrentHashMap.newKeySet();

    public boolean subscribe(String email) {
        return emails.add(email);   // false if already present
    }
}`,
    explanation: `### The Defect
Each individual method of a synchronized list is atomic, but the **sequence** \`contains\` then \`add\` is not. Two threads can both see \`contains == false\` and both add. Thread-safe classes don't make compound actions thread-safe.

### The Fix
Use an operation that is atomic as a whole: \`Set.add\` on a concurrent set returns \`false\` if the element exists. Alternatively, synchronize the whole check-then-act block on the list's lock, or rely on a unique constraint if the data lives in a database.`,
  },
  {
    id: 'cd-23',
    title: 'Deadlock in a Money Transfer',
    categoryId: 'concurrency',
    difficulty: 'Hard',
    code: `public class Bank {
    public void transfer(Account from, Account to, BigDecimal amount) {
        synchronized (from) {
            synchronized (to) {
                from.withdraw(amount);
                to.deposit(amount);
            }
        }
    }
}`,
    defectDescription: 'Occasionally the application freezes completely when customers send money to each other at the same time.',
    fixedCode: `public class Bank {
    public void transfer(Account from, Account to, BigDecimal amount) {
        // FIXED: always acquire locks in a global, consistent order
        Account first = from.getId() < to.getId() ? from : to;
        Account second = first == from ? to : from;

        synchronized (first) {
            synchronized (second) {
                from.withdraw(amount);
                to.deposit(amount);
            }
        }
    }
}`,
    explanation: `### The Defect
If thread 1 runs \`transfer(A, B)\` while thread 2 runs \`transfer(B, A)\`, thread 1 locks A and waits for B while thread 2 locks B and waits for A. Neither can proceed: a classic **lock-ordering deadlock**. Lock order here depends on the arguments, which callers control.

### The Fix
Impose a **global ordering** on locks (for example by account ID) so every thread acquires them in the same order; a cycle becomes impossible. Alternatives: \`tryLock\` with timeouts and retry, or do the transfer in a database transaction that locks rows in ID order.`,
  },
  {
    id: 'cd-24',
    title: 'Nested join() Starving the Common Pool',
    categoryId: 'concurrency',
    difficulty: 'Hard',
    code: `public class PriceService {
    public CompletableFuture<Quote> quote(Cart cart) {
        return CompletableFuture.supplyAsync(() -> {
            List<CompletableFuture<Price>> prices = cart.items().stream()
                    .map(item -> CompletableFuture.supplyAsync(() -> catalog.fetchPrice(item)))  // HTTP call
                    .toList();
            return new Quote(prices.stream().map(CompletableFuture::join).toList());
        });
    }
}`,
    defectDescription: 'Under moderate load the service stops responding; thread dumps show every ForkJoinPool.commonPool worker blocked in join() or socket reads.',
    fixedCode: `public class PriceService {
    // FIXED: a dedicated, bounded executor for blocking IO, and no blocking join in a pool thread
    private final ExecutorService io = Executors.newVirtualThreadPerTaskExecutor();

    public CompletableFuture<Quote> quote(Cart cart) {
        List<CompletableFuture<Price>> prices = cart.items().stream()
                .map(item -> CompletableFuture.supplyAsync(() -> catalog.fetchPrice(item), io))
                .toList();

        return CompletableFuture.allOf(prices.toArray(CompletableFuture[]::new))
                .thenApply(v -> new Quote(prices.stream().map(CompletableFuture::join).toList()));
    }
}`,
    explanation: `### The Defect
Without an executor argument, \`supplyAsync\` uses \`ForkJoinPool.commonPool()\`, sized to the number of cores minus one. Two problems combine:
1. Blocking **HTTP calls** run on this small CPU-oriented pool.
2. The outer task **blocks in \`join()\`** waiting for inner tasks queued on the same pool.
With a few concurrent quotes, every worker is blocked and the inner tasks never run: thread starvation, which behaves like a deadlock. It also starves every other user of the common pool (parallel streams, other async code).

### The Fix
Run blocking IO on a dedicated executor (virtual threads are ideal), and compose with \`allOf\` + \`thenApply\` instead of blocking inside a pool task. The \`join()\` calls inside \`thenApply\` are safe because every future is already complete.`,
  },
  {
    id: 'cd-25',
    title: 'The Ready Flag That Lies',
    categoryId: 'concurrency',
    difficulty: 'Expert',
    code: `public class ConfigHolder {
    private Config config;
    private boolean ready;

    // Called once by a background loader thread
    public void load() {
        config = Config.fromFile("app.yml");
        ready = true;
    }

    // Called by request threads
    public Config get() {
        while (!ready) {
            Thread.onSpinWait();
        }
        return config;
    }
}`,
    defectDescription: 'Request threads sometimes spin forever even after loading finished, and on ARM servers they sometimes receive a null config.',
    fixedCode: `public class ConfigHolder {
    private Config config;
    // FIXED: volatile gives visibility and a happens-before edge
    private volatile boolean ready;

    public void load() {
        config = Config.fromFile("app.yml");
        ready = true;   // volatile write publishes config as well
    }

    public Config get() {
        while (!ready) {
            Thread.onSpinWait();
        }
        return config;  // guaranteed to see the loaded config
    }
}`,
    explanation: `### The Defect
Two separate Java Memory Model problems:
1. **Visibility**: \`ready\` is a plain field. The JIT may hoist the read out of the loop (\`if (!ready) while (true)\`), so the reader spins forever.
2. **Reordering**: without a happens-before relationship, the writes to \`config\` and \`ready\` may become visible in the opposite order (compiler or CPU reordering, especially on weakly ordered ARM), so a reader sees \`ready == true\` but \`config == null\`.

### The Fix
Make \`ready\` **volatile**. A volatile write happens-before every subsequent read of that variable, and all writes before it (including \`config\`) become visible too. Better designs avoid spinning entirely: use a \`CompletableFuture<Config>\` or \`CountDownLatch\`, or make \`config\` itself a volatile reference that readers check for null.`,
  },

  // ---------------------------------------------------------------- Spring
  {
    id: 'cd-26',
    title: 'Mutable State in a Singleton Bean',
    categoryId: 'spring',
    difficulty: 'Core',
    code: `@Service
public class CheckoutService {
    private Cart currentCart;

    public void start(Cart cart) {
        this.currentCart = cart;
    }

    public Receipt complete(PaymentDetails payment) {
        return payments.charge(currentCart.total(), payment);
    }
}`,
    defectDescription: 'During peak traffic some customers are charged for other customers\' carts.',
    fixedCode: `@Service
public class CheckoutService {
    // FIXED: no per-request state in the singleton; pass it explicitly
    public Receipt complete(Cart cart, PaymentDetails payment) {
        return payments.charge(cart.total(), payment);
    }
}`,
    explanation: `### The Defect
Spring beans are **singletons** by default: one instance shared by every request thread. \`currentCart\` is shared mutable state. Request A calls \`start\`, request B calls \`start\`, then A calls \`complete\` and charges B's cart.

### The Fix
Keep singleton beans **stateless**: pass request data through method parameters, and store per-user state where it belongs (database, cache keyed by user, session). Non-final fields in a \`@Service\` should be a code-review red flag.`,
  },
  {
    id: 'cd-27',
    title: '@Value on a Static Field',
    categoryId: 'spring',
    difficulty: 'Core',
    code: `@Component
public class ApiClient {
    @Value("\${partner.api.url}")
    private static String baseUrl;

    public Order fetch(long id) {
        return rest.get()
                .uri(baseUrl + "/orders/" + id)
                .retrieve()
                .body(Order.class);
    }
}`,
    defectDescription: 'Every call fails with a URI starting with "null/orders/...", even though the property is set.',
    fixedCode: `@Component
public class ApiClient {
    // FIXED: inject into an instance field (preferably via the constructor)
    private final String baseUrl;
    private final RestClient rest;

    public ApiClient(@Value("\${partner.api.url}") String baseUrl, RestClient rest) {
        this.baseUrl = baseUrl;
        this.rest = rest;
    }

    public Order fetch(long id) {
        return rest.get()
                .uri(baseUrl + "/orders/{id}", id)
                .retrieve()
                .body(Order.class);
    }
}`,
    explanation: `### The Defect
Spring's dependency injection works on **bean instances**. \`@Value\` and \`@Autowired\` on **static** fields are ignored (Spring logs a warning at most), so \`baseUrl\` stays \`null\`.

### The Fix
Inject into instance fields, ideally through the constructor so the field can be \`final\` and the dependency is explicit. For groups of settings, prefer a \`@ConfigurationProperties\` record. Using a URI template (\`{id}\`) also handles encoding correctly.`,
  },
  {
    id: 'cd-28',
    title: 'Checked Exception, No Rollback',
    categoryId: 'spring',
    difficulty: 'Solid',
    code: `@Service
public class OrderService {

    @Transactional
    public void place(Order order) throws PaymentDeclinedException {
        orders.save(order);
        inventory.reserve(order.lines());
        payments.charge(order);   // throws PaymentDeclinedException (checked)
    }
}`,
    defectDescription: 'When a payment is declined, the order and inventory reservation are still committed to the database.',
    fixedCode: `@Service
public class OrderService {

    // FIXED: roll back for this checked exception too
    @Transactional(rollbackFor = PaymentDeclinedException.class)
    public void place(Order order) throws PaymentDeclinedException {
        orders.save(order);
        inventory.reserve(order.lines());
        payments.charge(order);
    }
}`,
    explanation: `### The Defect
By default, Spring's \`@Transactional\` rolls back only on **unchecked** exceptions (\`RuntimeException\`) and \`Error\`s. A **checked** exception propagating out of the method **commits** the transaction. The order is saved and stock reserved even though payment failed.

### The Fix
Declare \`rollbackFor = PaymentDeclinedException.class\` (or \`rollbackFor = Exception.class\` as a team convention), or make the domain exception unchecked. Also consider doing the external payment call **before** or **outside** the database transaction, since a remote call inside a transaction holds a connection and locks.`,
  },
  {
    id: 'cd-29',
    title: '@Transactional on a Private Method',
    categoryId: 'spring',
    difficulty: 'Solid',
    code: `@Service
public class AccountService {

    public void closeAccount(long id) {
        audit.log("closing " + id);
        doClose(id);
    }

    @Transactional
    private void doClose(long id) {
        accounts.markClosed(id);
        balances.zeroOut(id);   // may throw
    }
}`,
    defectDescription: 'When zeroOut() fails, the account is still marked as closed: the two updates are not atomic.',
    fixedCode: `@Service
public class AccountService {

    // FIXED: the transactional method is public and invoked through the proxy
    @Transactional
    public void closeAccount(long id) {
        audit.log("closing " + id);
        accounts.markClosed(id);
        balances.zeroOut(id);
    }
}`,
    explanation: `### The Defect
Spring applies \`@Transactional\` through a **proxy** that wraps calls coming from **outside** the bean. Here the annotation does nothing, for two reasons:
1. The method is **private**: proxies can't intercept private methods (Spring 6 supports non-private methods on class-based proxies, but never private).
2. It's called via \`this.doClose()\`, a **self-invocation** that bypasses the proxy entirely.
Each repository call runs in its own transaction (or none), so partial updates are committed.

### The Fix
Put \`@Transactional\` on a public method that is called from another bean. If you need a separate transactional unit inside the same service, move it into its own bean or use \`TransactionTemplate\` programmatically.`,
  },
  {
    id: 'cd-30',
    title: 'The HTTP Client Without Timeouts',
    categoryId: 'spring',
    difficulty: 'Solid',
    code: `@Configuration
public class ClientConfig {

    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class ShippingService {
    public Rate rate(Parcel p) {
        return rest.postForObject("https://carrier.example.com/rates", p, Rate.class);
    }
}`,
    defectDescription: 'When the carrier API became slow during a holiday peak, the whole application stopped responding, including unrelated endpoints.',
    fixedCode: `@Configuration
public class ClientConfig {

    @Bean
    RestClient carrierClient(RestClient.Builder builder) {
        // FIXED: explicit connect and read timeouts
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(1));
        factory.setReadTimeout(Duration.ofSeconds(2));
        return builder.baseUrl("https://carrier.example.com")
                .requestFactory(factory)
                .build();
    }
}

@Service
public class ShippingService {
    public Rate rate(Parcel p) {
        return carrier.post().uri("/rates").body(p).retrieve().body(Rate.class);
    }
}`,
    explanation: `### The Defect
A \`RestTemplate\` created with \`new\` uses \`SimpleClientHttpRequestFactory\` defaults: **infinite** connect and read timeouts. When the carrier slowed down, every request thread calling it blocked indefinitely. Tomcat's thread pool filled up, and unrelated endpoints couldn't get a thread either.

### The Fix
Configure **connect and read timeouts** on every outbound client, sized to your latency budget. Add a circuit breaker and possibly a bulkhead (separate concurrency limit) for the dependency so it can't consume all threads. Building from Spring Boot's \`RestClient.Builder\` also wires metrics and tracing.`,
  },
  {
    id: 'cd-31',
    title: 'Prototype Bean Inside a Singleton',
    categoryId: 'spring',
    difficulty: 'Hard',
    code: `@Component
@Scope("prototype")
public class ImportSession {
    private final List<Row> rows = new ArrayList<>();
    public void add(Row r) { rows.add(r); }
    public List<Row> rows() { return rows; }
}

@Service
public class Importer {
    @Autowired
    private ImportSession session;   // expecting a fresh one per import

    public Result run(InputStream in) {
        parse(in).forEach(session::add);
        return save(session.rows());
    }
}`,
    defectDescription: 'Each import also re-saves every row from all previous imports, and concurrent imports mix their rows.',
    fixedCode: `@Service
public class Importer {
    // FIXED: ask the container for a new prototype instance on each use
    private final ObjectProvider<ImportSession> sessions;

    public Importer(ObjectProvider<ImportSession> sessions) {
        this.sessions = sessions;
    }

    public Result run(InputStream in) {
        ImportSession session = sessions.getObject();   // new instance every call
        parse(in).forEach(session::add);
        return save(session.rows());
    }
}`,
    explanation: `### The Defect
Dependencies are injected **once**, when the singleton \`Importer\` is created. The prototype scope means "a new instance each time the container is asked", but the container is only asked once, so the singleton holds **one** \`ImportSession\` forever. Rows accumulate across imports and concurrent imports share the same list.

### The Fix
Look up a new instance per use with \`ObjectProvider<T>\` (or \`Provider<T>\`, or a \`@Lookup\` method). Often even simpler: this object doesn't need to be a Spring bean at all; just create it with \`new\` inside the method.`,
  },
  {
    id: 'cd-32',
    title: 'The Catch That Causes UnexpectedRollbackException',
    categoryId: 'spring',
    difficulty: 'Hard',
    code: `@Service
public class RegistrationService {

    @Transactional
    public void register(User user) {
        users.save(user);
        try {
            loyalty.enroll(user);   // @Transactional (REQUIRED) in another bean
        } catch (LoyaltyException e) {
            log.warn("Loyalty enrollment failed, continuing", e);
        }
    }
}`,
    defectDescription: 'When loyalty enrollment fails, the caller gets UnexpectedRollbackException and the user is not saved, even though the exception was caught.',
    fixedCode: `@Service
public class LoyaltyService {

    // FIXED: run the optional step in its own transaction
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enroll(User user) { ... }
}

@Service
public class RegistrationService {

    @Transactional
    public void register(User user) {
        users.save(user);
        try {
            loyalty.enroll(user);   // failure rolls back only the inner transaction
        } catch (LoyaltyException e) {
            log.warn("Loyalty enrollment failed, continuing", e);
        }
    }
}`,
    explanation: `### The Defect
\`loyalty.enroll\` uses the default \`REQUIRED\` propagation, so it **joins** the outer transaction. When the exception passes through its transactional proxy, Spring marks the **shared** transaction as **rollback-only**. Catching the exception in the outer method doesn't undo that mark. At commit time Spring finds the flag, rolls everything back, and throws \`UnexpectedRollbackException\`.

### The Fix
Give the optional operation its **own** transaction with \`REQUIRES_NEW\` (or \`NESTED\` with savepoints on JDBC), so its failure rolls back only its own work. Alternatively, move it out of the transaction entirely, e.g. an \`AFTER_COMMIT\` event listener, which fits an optional side effect even better.`,
  },
  {
    id: 'cd-33',
    title: 'A Cache Key That Forgets the Tenant',
    categoryId: 'spring',
    difficulty: 'Hard',
    code: `@Service
public class PriceListService {

    @Cacheable("priceLists")
    public PriceList current(String productCategory) {
        String tenant = TenantContext.current();   // ThreadLocal set by a filter
        return repository.findActive(tenant, productCategory);
    }
}`,
    defectDescription: 'Customers of one company sometimes see another company\'s negotiated prices.',
    fixedCode: `@Service
public class PriceListService {

    // FIXED: every input that affects the result is part of the key
    @Cacheable(cacheNames = "priceLists", key = "#tenant + ':' + #productCategory")
    public PriceList current(String tenant, String productCategory) {
        return repository.findActive(tenant, productCategory);
    }
}`,
    explanation: `### The Defect
Spring's default cache key is built **only from method parameters**. The tenant is read from a \`ThreadLocal\` inside the method, so it isn't part of the key. The first tenant to request "electronics" populates the cache entry, and every other tenant gets that tenant's price list. That's a cross-tenant **data leak**.

### The Fix
Make every input that influences the result an explicit parameter and include it in the key (or use a custom \`KeyGenerator\` that adds the tenant automatically for all caches). Avoid hidden inputs such as ThreadLocals, locale or user context in cached methods.`,
  },
  {
    id: 'cd-34',
    title: 'The Email Sent for a Rolled-Back Order',
    categoryId: 'spring',
    difficulty: 'Hard',
    code: `@Service
public class OrderService {

    @Transactional
    public Order place(PlaceOrder cmd) {
        Order order = orders.save(Order.from(cmd));
        events.publishEvent(new OrderPlaced(order.getId()));
        fraud.check(order);   // may throw and roll back
        return order;
    }
}

@Component
public class ConfirmationEmails {
    @EventListener
    public void on(OrderPlaced e) {
        mailer.sendConfirmation(e.orderId());
    }
}`,
    defectDescription: 'Customers receive order confirmation emails for orders that were rejected by the fraud check and never saved.',
    fixedCode: `@Component
public class ConfirmationEmails {

    // FIXED: only react once the transaction has actually committed
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(OrderPlaced e) {
        mailer.sendConfirmation(e.orderId());
    }
}`,
    explanation: `### The Defect
A plain \`@EventListener\` runs **synchronously, immediately** when \`publishEvent\` is called, inside the still-open transaction. The email goes out before \`fraud.check\` runs. If that check throws, the transaction rolls back, but the email can't be unsent.

### The Fix
Use \`@TransactionalEventListener(phase = AFTER_COMMIT)\` so the listener runs only after a successful commit (\`@Async\` keeps the email off the request thread). For guaranteed delivery even if the JVM crashes right after commit, use the transactional outbox pattern instead of in-memory events.`,
  },

  // ---------------------------------------------------------------- Collections
  {
    id: 'cd-35',
    title: 'Removing Inside a for-each Loop',
    categoryId: 'collections',
    difficulty: 'Core',
    code: `public void dropExpired(List<Coupon> coupons, LocalDate today) {
    for (Coupon c : coupons) {
        if (c.expiresOn().isBefore(today)) {
            coupons.remove(c);
        }
    }
}`,
    defectDescription: 'The method throws ConcurrentModificationException for some lists, and for others silently leaves an expired coupon in place.',
    fixedCode: `public void dropExpired(List<Coupon> coupons, LocalDate today) {
    // FIXED: remove through a single bulk operation
    coupons.removeIf(c -> c.expiresOn().isBefore(today));
}`,
    explanation: `### The Defect
The enhanced for loop uses an iterator. \`coupons.remove(c)\` modifies the list behind the iterator's back, so the next \`next()\` throws \`ConcurrentModificationException\`. When the removed element is the **second to last**, \`hasNext()\` returns false before the check runs, the loop ends quietly, and the **last element is never examined**.

### The Fix
Use \`removeIf\` (clear and O(n) on \`ArrayList\`), or an explicit \`Iterator\` with \`iterator.remove()\`, or build a filtered copy with a stream.`,
  },
  {
    id: 'cd-36',
    title: 'Adding to Arrays.asList',
    categoryId: 'collections',
    difficulty: 'Core',
    code: `public List<String> defaultRoles(boolean admin) {
    List<String> roles = Arrays.asList("USER", "VIEWER");
    if (admin) {
        roles.add("ADMIN");
    }
    return roles;
}`,
    defectDescription: 'Logging in as an administrator fails with UnsupportedOperationException.',
    fixedCode: `public List<String> defaultRoles(boolean admin) {
    // FIXED: copy into a resizable list before modifying
    List<String> roles = new ArrayList<>(List.of("USER", "VIEWER"));
    if (admin) {
        roles.add("ADMIN");
    }
    return roles;
}`,
    explanation: `### The Defect
\`Arrays.asList\` returns a **fixed-size** list backed by the array. \`set\` works, but \`add\` and \`remove\` throw \`UnsupportedOperationException\`. (\`List.of\` is even stricter: fully immutable.)

### The Fix
Wrap it in \`new ArrayList<>(...)\` when you need to add or remove elements. Alternatively, build the list conditionally with a stream or return an immutable list constructed in one go.`,
  },
  {
    id: 'cd-37',
    title: 'Comparing Integers With ==',
    categoryId: 'collections',
    difficulty: 'Core',
    code: `public boolean sameQuantity(Map<String, Integer> stock, String a, String b) {
    return stock.get(a) == stock.get(b);
}

// Works in tests with small quantities:
// sameQuantity(Map.of("x", 5, "y", 5), "x", "y") -> true
// Fails in production:
// sameQuantity(Map.of("x", 500, "y", 500), "x", "y") -> false`,
    defectDescription: 'Two products with the same stock level are reported as different, but only when quantities are larger than 127.',
    fixedCode: `public boolean sameQuantity(Map<String, Integer> stock, String a, String b) {
    // FIXED: compare values, not object identity (and handle nulls)
    return Objects.equals(stock.get(a), stock.get(b));
}`,
    explanation: `### The Defect
The map stores \`Integer\` objects. \`==\` compares **references**. Autoboxing uses \`Integer.valueOf\`, which returns **cached** instances only for -128 to 127, so small values happen to be the same object and the bug hides in tests. Larger values are different objects with equal contents.

### The Fix
Compare wrapper objects with \`equals\` (\`Objects.equals\` also handles missing keys returning \`null\`), or unbox explicitly to \`int\` when you know both are present.`,
  },
  {
    id: 'cd-38',
    title: 'equals Without hashCode',
    categoryId: 'collections',
    difficulty: 'Core',
    code: `public class Sku {
    private final String code;

    public Sku(String code) { this.code = code; }

    @Override
    public boolean equals(Object o) {
        return o instanceof Sku other && code.equals(other.code);
    }
}

Set<Sku> seen = new HashSet<>();
seen.add(new Sku("A-100"));
seen.contains(new Sku("A-100"));   // false!`,
    defectDescription: 'Deduplication of SKUs with a HashSet doesn\'t work: equal SKUs are stored multiple times and lookups fail.',
    fixedCode: `// FIXED: a record generates consistent equals AND hashCode
public record Sku(String code) {}

Set<Sku> seen = new HashSet<>();
seen.add(new Sku("A-100"));
seen.contains(new Sku("A-100"));   // true`,
    explanation: `### The Defect
The contract says equal objects **must** have equal hash codes. Without an override, \`hashCode\` is identity-based, so two equal SKUs land in different buckets of the \`HashSet\` and \`equals\` is never even called.

### The Fix
Always override \`equals\` and \`hashCode\` together, using the same fields. For value types like this, a **record** generates both correctly (or use your IDE / \`Objects.hash\`).`,
  },
  {
    id: 'cd-39',
    title: 'remove(int) vs remove(Object)',
    categoryId: 'collections',
    difficulty: 'Solid',
    code: `public void unblock(List<Integer> blockedUserIds, int userId) {
    blockedUserIds.remove(userId);
}

// blockedUserIds = [1042, 7, 311]
// unblock(list, 7)`,
    defectDescription: 'Unblocking user 7 removes a different user from the list, and unblocking user 311 throws IndexOutOfBoundsException.',
    fixedCode: `public void unblock(List<Integer> blockedUserIds, int userId) {
    // FIXED: box explicitly so remove(Object) is chosen
    blockedUserIds.remove(Integer.valueOf(userId));
}`,
    explanation: `### The Defect
\`List\` has two overloads: \`remove(int index)\` and \`remove(Object o)\`. With an \`int\` argument, the compiler picks \`remove(int)\` because it matches without boxing. \`remove(7)\` deletes the element **at index 7** (or here the 8th element), not the value 7; \`remove(311)\` is out of bounds.

### The Fix
Pass an \`Integer\` (\`Integer.valueOf(userId)\` or \`(Integer) userId\`) so \`remove(Object)\` is selected, or use \`removeIf(id -> id == userId)\`. A \`Set<Integer>\` would also be a better fit for membership data.`,
  },
  {
    id: 'cd-40',
    title: 'The TreeSet That Drops Orders',
    categoryId: 'collections',
    difficulty: 'Solid',
    code: `public SortedSet<Order> byTotal(List<Order> orders) {
    SortedSet<Order> sorted = new TreeSet<>(Comparator.comparing(Order::total));
    sorted.addAll(orders);
    return sorted;
}`,
    defectDescription: 'The report is missing orders: whenever two orders have the same total, only one of them appears.',
    fixedCode: `public SortedSet<Order> byTotal(List<Order> orders) {
    // FIXED: break ties so distinct orders never compare as equal
    SortedSet<Order> sorted = new TreeSet<>(
            Comparator.comparing(Order::total).thenComparing(Order::id));
    sorted.addAll(orders);
    return sorted;
}`,
    explanation: `### The Defect
\`TreeSet\` doesn't use \`equals\` to detect duplicates; it uses the **comparator**. Two orders with the same total compare as 0, so the set treats the second one as a duplicate and silently discards it. The comparator is **inconsistent with equals**.

### The Fix
Add a tie-breaker on a unique field (the ID) so that only truly identical orders compare as equal. If you just need sorted output with duplicates, sort a \`List\` instead: \`orders.stream().sorted(comparator).toList()\`.`,
  },
  {
    id: 'cd-41',
    title: 'The subList That Pins a Huge List',
    categoryId: 'collections',
    difficulty: 'Hard',
    code: `public class Leaderboard {
    private List<Score> top10 = List.of();

    // Called every minute with ~2 million freshly loaded scores
    public void refresh(List<Score> allScores) {
        allScores.sort(Comparator.comparing(Score::points).reversed());
        top10 = allScores.subList(0, Math.min(10, allScores.size()));
    }

    public List<Score> top() { return top10; }
}`,
    defectDescription: 'Memory usage stays hundreds of megabytes higher than expected, and occasionally top() throws ConcurrentModificationException.',
    fixedCode: `public class Leaderboard {
    private volatile List<Score> top10 = List.of();

    public void refresh(List<Score> allScores) {
        allScores.sort(Comparator.comparing(Score::points).reversed());
        // FIXED: copy the ten elements instead of keeping a view
        top10 = List.copyOf(allScores.subList(0, Math.min(10, allScores.size())));
    }

    public List<Score> top() { return top10; }
}`,
    explanation: `### The Defect
\`subList\` returns a **view** backed by the original list, not a copy. Storing it:
* keeps a reference to the **entire 2-million-element list**, which can never be garbage collected while the view is held;
* breaks when the caller later modifies the original list structurally, causing \`ConcurrentModificationException\` on the next access through the view.

### The Fix
Copy the elements you want to keep (\`List.copyOf\` also makes the result immutable, safe to share). The field is made \`volatile\` so readers on other threads see the newly published list.`,
  },

  // ---------------------------------------------------------------- Streams
  {
    id: 'cd-42',
    title: 'toMap With Duplicate Keys',
    categoryId: 'streams',
    difficulty: 'Core',
    code: `public Map<String, Customer> byEmail(List<Customer> customers) {
    return customers.stream()
            .collect(Collectors.toMap(Customer::email, Function.identity()));
}`,
    defectDescription: 'The nightly sync crashes with IllegalStateException: Duplicate key.',
    fixedCode: `public Map<String, Customer> byEmail(List<Customer> customers) {
    return customers.stream()
            .collect(Collectors.toMap(
                    c -> c.email().toLowerCase(Locale.ROOT),
                    Function.identity(),
                    // FIXED: decide explicitly what happens on duplicates
                    (existing, duplicate) -> existing.updatedAt().isAfter(duplicate.updatedAt()) ? existing : duplicate));
}`,
    explanation: `### The Defect
The two-argument \`Collectors.toMap\` **throws** \`IllegalStateException\` when two elements map to the same key. Real data contained two customers with the same email.

### The Fix
Provide a **merge function** that states the business rule (keep the most recently updated record here), normalise keys if appropriate, or use \`groupingBy\` if multiple values per key are legitimate. Note that \`toMap\` also throws on **null values**.`,
  },
  {
    id: 'cd-43',
    title: 'Reusing a Consumed Stream',
    categoryId: 'streams',
    difficulty: 'Core',
    code: `public Summary summarise(List<Order> orders) {
    Stream<Order> paid = orders.stream().filter(Order::isPaid);

    long count = paid.count();
    BigDecimal total = paid.map(Order::total).reduce(BigDecimal.ZERO, BigDecimal::add);

    return new Summary(count, total);
}`,
    defectDescription: 'Every call throws IllegalStateException: stream has already been operated upon or closed.',
    fixedCode: `public Summary summarise(List<Order> orders) {
    // FIXED: materialise once, then derive both values (or create a new stream each time)
    List<Order> paid = orders.stream().filter(Order::isPaid).toList();

    long count = paid.size();
    BigDecimal total = paid.stream().map(Order::total).reduce(BigDecimal.ZERO, BigDecimal::add);

    return new Summary(count, total);
}`,
    explanation: `### The Defect
A \`Stream\` is **single-use**. \`count()\` is a terminal operation that consumes the pipeline; calling \`map\` on the same stream afterwards throws \`IllegalStateException\`.

### The Fix
Create a fresh stream for each terminal operation, collect to a list first, or compute both results in one pass with \`Collectors.teeing(counting(), reducing(...), Summary::new)\`.`,
  },
  {
    id: 'cd-44',
    title: 'orElse That Always Creates a User',
    categoryId: 'streams',
    difficulty: 'Solid',
    code: `public User findOrCreate(String email) {
    return users.findByEmail(email)
            .orElse(users.save(new User(email)));
}`,
    defectDescription: 'Every login inserts a new user row (or fails on the unique constraint), even for existing users.',
    fixedCode: `public User findOrCreate(String email) {
    return users.findByEmail(email)
            // FIXED: orElseGet evaluates the supplier only when the Optional is empty
            .orElseGet(() -> users.save(new User(email)));
}`,
    explanation: `### The Defect
\`orElse(value)\` takes an already-computed **value**. Java evaluates method arguments before the call, so \`users.save(new User(email))\` runs **every time**, whether or not the user was found. The Optional then returns the found user, but the insert has already happened.

### The Fix
Use \`orElseGet(supplier)\`, which runs the supplier only for empty Optionals. Reserve \`orElse\` for constants and cheap, side-effect-free values. (For true find-or-create under concurrency, also rely on a unique constraint and handle the conflict.)`,
  },
  {
    id: 'cd-45',
    title: 'Files.lines Leaking File Handles',
    categoryId: 'streams',
    difficulty: 'Solid',
    code: `public long countErrors(Path logFile) throws IOException {
    return Files.lines(logFile)
            .filter(line -> line.contains("ERROR"))
            .count();
}

// Called every few seconds by a monitoring job over hundreds of log files`,
    defectDescription: 'After a day the process fails with "Too many open files" and log rotation stops working.',
    fixedCode: `public long countErrors(Path logFile) throws IOException {
    // FIXED: Files.lines holds an open file; close it with try-with-resources
    try (Stream<String> lines = Files.lines(logFile)) {
        return lines.filter(line -> line.contains("ERROR")).count();
    }
}`,
    explanation: `### The Defect
Most streams don't need closing, but \`Files.lines\`, \`Files.list\`, \`Files.walk\` and \`Files.find\` are backed by an **open file or directory handle**. Terminal operations don't close the stream. Each call leaks a file descriptor until the process hits its limit; on some systems the leaked handles also prevent deleted/rotated files from being released.

### The Fix
Use **try-with-resources** for IO-backed streams. Static analysis tools (Error Prone, Sonar) flag unclosed \`Files.lines\` calls.`,
  },
  {
    id: 'cd-46',
    title: 'Side Effects Hidden in peek',
    categoryId: 'streams',
    difficulty: 'Hard',
    code: `public long publishAll(List<Event> events) {
    return events.stream()
            .peek(broker::publish)   // send each event
            .count();                // report how many were sent
}`,
    defectDescription: 'After upgrading from Java 8 to Java 17, the method still returns the right count but no events reach the broker.',
    fixedCode: `public long publishAll(List<Event> events) {
    // FIXED: do the work in a terminal operation, count separately
    events.forEach(broker::publish);
    return events.size();
}`,
    explanation: `### The Defect
\`peek\` is an **intermediate** operation intended for debugging. Since Java 9, \`count()\` may **skip executing the pipeline** entirely when it can compute the size directly from the source (a SIZED list with no filtering). The stream never pulls elements through \`peek\`, so \`publish\` is never called. The JDK is allowed to do this because stream operations are supposed to be free of side effects.

### The Fix
Perform side effects in a terminal operation (\`forEach\`) or a plain loop. Never rely on \`peek\` or \`map\` running for their side effects.`,
  },
  {
    id: 'cd-47',
    title: 'Parallel reduce With the Wrong Identity',
    categoryId: 'streams',
    difficulty: 'Hard',
    code: `public int totalWithBaseFee(List<Integer> itemCosts) {
    // Base fee of 5, plus every item cost
    return itemCosts.parallelStream()
            .reduce(5, Integer::sum);
}`,
    defectDescription: 'The total is different on every run and always too high, e.g. 45 or 60 instead of 30.',
    fixedCode: `public int totalWithBaseFee(List<Integer> itemCosts) {
    // FIXED: reduce with the true identity (0), add the fee once
    int items = itemCosts.parallelStream().mapToInt(Integer::intValue).sum();
    return 5 + items;
}`,
    explanation: `### The Defect
The first argument of \`reduce\` must be an **identity** for the operation (\`identity + x == x\`). In a parallel stream the data is split into chunks, and **each chunk starts from the identity**. With 5 as the "identity", the fee is added once per chunk, so the result depends on how many chunks the framework created.

### The Fix
Use the real identity (0 for addition, or a primitive \`sum()\`), and apply one-off adjustments outside the reduction. More generally, parallel reductions require an **associative** operation and a true identity; non-associative functions give run-to-run differences.`,
  },

  // ---------------------------------------------------------------- Architecture
  {
    id: 'cd-48',
    title: 'Retries Without Backoff',
    categoryId: 'architecture',
    difficulty: 'Solid',
    code: `public Inventory fetchInventory(String sku) {
    for (int attempt = 1; ; attempt++) {
        try {
            return inventoryClient.get(sku);
        } catch (ServiceUnavailableException e) {
            if (attempt == 10) throw e;
            // try again immediately
        }
    }
}`,
    defectDescription: 'When the inventory service had a brief hiccup, it received ten times its normal traffic and took an hour to recover.',
    fixedCode: `private final Retry retry = Retry.of("inventory", RetryConfig.custom()
        .maxAttempts(3)
        // FIXED: exponential backoff with jitter, few attempts
        .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(Duration.ofMillis(100), 2.0))
        .retryExceptions(ServiceUnavailableException.class)
        .build());

public Inventory fetchInventory(String sku) {
    return Retry.decorateSupplier(retry, () -> inventoryClient.get(sku)).get();
}`,
    explanation: `### The Defect
Every failing caller retries **immediately**, up to 10 times. When the dependency is overloaded, retries multiply its traffic exactly when it can least handle it, keeping it overloaded: a **retry storm**. All clients retry in lockstep, too.

### The Fix
Retry a small number of times with **exponential backoff and jitter**, only for transient errors, only for idempotent operations, and ideally with a **circuit breaker** and a retry budget so retries stop when the dependency is clearly down.`,
  },
  {
    id: 'cd-49',
    title: 'Auto-Commit Before Processing',
    categoryId: 'architecture',
    difficulty: 'Hard',
    code: `Properties props = new Properties();
props.put("group.id", "invoicing");
props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "1000");
KafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("orders"));

while (running) {
    for (ConsumerRecord<String, OrderEvent> r : consumer.poll(Duration.ofMillis(500))) {
        executor.submit(() -> invoiceService.createInvoice(r.value()));   // async processing
    }
}`,
    defectDescription: 'After a crash or redeploy, some orders never get an invoice, and nothing in the logs shows an error.',
    fixedCode: `props.put("enable.auto.commit", "false");   // FIXED: commit only after processing
KafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("orders"));

while (running) {
    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, OrderEvent> r : records) {
        invoiceService.createInvoice(r.value());   // idempotent: keyed by order ID
    }
    consumer.commitSync();   // at-least-once: offsets advance only after success
}`,
    explanation: `### The Defect
With auto-commit, offsets are committed periodically during \`poll()\` **regardless of whether processing has finished**. Here processing is handed to an executor, so offsets can be committed for records that are still queued in memory. If the process dies, those records are **lost**: the consumer group resumes after them.

### The Fix
Disable auto-commit and commit offsets **after** the records are processed (at-least-once delivery). That means duplicates are possible after a crash, so the handler must be **idempotent** (e.g. unique constraint on order ID). If processing must be asynchronous, track completion per partition and commit only contiguous completed offsets.`,
  },
  {
    id: 'cd-50',
    title: 'Retrying a Payment Without an Idempotency Key',
    categoryId: 'architecture',
    difficulty: 'Hard',
    code: `public PaymentResult charge(Order order) {
    return retryTemplate.execute(ctx ->
        paymentGateway.createCharge(new ChargeRequest(
            order.customerId(),
            order.total(),
            order.currency())));
}`,
    defectDescription: 'After a network timeout, some customers are charged twice for the same order.',
    fixedCode: `public PaymentResult charge(Order order) {
    // FIXED: a stable key per logical payment makes retries safe
    String idempotencyKey = "order-" + order.id() + "-charge";
    return retryTemplate.execute(ctx ->
        paymentGateway.createCharge(new ChargeRequest(
            order.customerId(),
            order.total(),
            order.currency()),
            idempotencyKey));
}`,
    explanation: `### The Defect
A timeout doesn't mean the charge failed. The provider may have processed the request and the **response** was lost. Retrying sends a brand-new charge request, and the provider has no way to tell it's the same payment. Result: a double charge.

### The Fix
Send an **idempotency key** that is stable for the logical operation (derived from the order, not generated per attempt). The provider stores the result under that key and returns the original result for repeats instead of charging again. Record the key and outcome on your side too, so reconciliation can detect anomalies.`,
  },
  {
    id: 'cd-51',
    title: 'The Dual Write',
    categoryId: 'architecture',
    difficulty: 'Expert',
    code: `@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    kafkaTemplate.send("order-events", order.id().toString(), new OrderPlaced(order));
    inventoryRepository.reserve(order.lines());   // may fail with a constraint violation
}`,
    defectDescription: 'Downstream services sometimes process OrderPlaced events for orders that don\'t exist, and occasionally an existing order never produces an event.',
    fixedCode: `@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    inventoryRepository.reserve(order.lines());
    // FIXED: write the event to an outbox table in the SAME database transaction
    outboxRepository.save(OutboxEvent.of("order-events", order.id(), new OrderPlaced(order)));
}

// A separate relay (polling publisher or Debezium CDC) reads committed outbox rows
// and publishes them to Kafka, marking them sent. Consumers deduplicate by event ID.`,
    explanation: `### The Defect
The database transaction and the Kafka send are two independent systems; there is no atomic commit across them:
* The event is sent **before** the transaction commits. If \`reserve\` fails and the transaction rolls back, the event is already out: **phantom orders** downstream.
* If Kafka is unavailable, or the process crashes after commit but the send hadn't completed, the order exists but **no event** is ever published.

### The Fix
The **transactional outbox**: store the event in an outbox table in the same local transaction as the business data, so both are committed or neither is. A relay publishes committed rows asynchronously with retries (at-least-once), and consumers are idempotent. CDC (Debezium) can read the outbox from the transaction log for low latency.`,
  },
  {
    id: 'cd-52',
    title: 'Releasing Someone Else\'s Redis Lock',
    categoryId: 'architecture',
    difficulty: 'Expert',
    code: `public void runNightlySettlement() {
    Boolean acquired = redis.opsForValue()
            .setIfAbsent("lock:settlement", "locked", Duration.ofSeconds(30));
    if (!Boolean.TRUE.equals(acquired)) return;
    try {
        settlement.run();   // usually 10s, sometimes 60s+
    } finally {
        redis.delete("lock:settlement");
    }
}`,
    defectDescription: 'On slow nights, settlement runs on two instances at the same time and some merchants are paid twice.',
    fixedCode: `public void runNightlySettlement() {
    String token = UUID.randomUUID().toString();
    Boolean acquired = redis.opsForValue()
            .setIfAbsent("lock:settlement", token, Duration.ofMinutes(10));
    if (!Boolean.TRUE.equals(acquired)) return;
    try {
        settlement.run();   // FIXED: settlement itself is idempotent per merchant and date
    } finally {
        // FIXED: delete only if we still own the lock (atomic compare-and-delete)
        redis.execute(RELEASE_IF_OWNER, List.of("lock:settlement"), token);
    }
}

// Lua: if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`,
    explanation: `### The Defect
Two problems combine:
1. The lock **expires after 30 seconds**, but the work can take longer. Another instance then acquires the lock and starts settlement concurrently.
2. When the first instance finishes, \`delete\` removes the lock **unconditionally**, including the one now held by the second instance, letting a third run in.
Every instance also uses the same value ("locked"), so ownership can't be checked.

### The Fix
Store a **unique token** and release with an atomic **compare-and-delete** (Lua script). Choose a TTL longer than the worst case, or renew the lease while working (as Redisson's watchdog does). Most importantly, a lease-based lock can **never** guarantee mutual exclusion under pauses and expiries, so make the protected operation **idempotent** (e.g. unique constraint on merchant + settlement date) or use **fencing tokens** checked by the resource.`,
  },

  // ---------------------------------------------------------------- Persistence
  {
    id: 'cd-53',
    title: 'LazyInitializationException in the Controller',
    categoryId: 'persistence',
    difficulty: 'Solid',
    code: `@Service
public class OrderQueries {
    @Transactional(readOnly = true)
    public Order find(long id) {
        return orders.findById(id).orElseThrow();
    }
}

@RestController
public class OrderController {
    @GetMapping("/orders/{id}/lines")
    public List<LineDto> lines(@PathVariable long id) {
        Order order = queries.find(id);
        return order.getLines().stream().map(LineDto::from).toList();   // lines are LAZY
    }
}`,
    defectDescription: 'The endpoint throws LazyInitializationException: could not initialize proxy - no Session.',
    fixedCode: `@Service
public class OrderQueries {
    // FIXED: load what the use case needs inside the transaction and return DTOs
    @Transactional(readOnly = true)
    public List<LineDto> lines(long id) {
        Order order = orders.findWithLinesById(id).orElseThrow();   // @EntityGraph(attributePaths = "lines")
        return order.getLines().stream().map(LineDto::from).toList();
    }
}

@RestController
public class OrderController {
    @GetMapping("/orders/{id}/lines")
    public List<LineDto> lines(@PathVariable long id) {
        return queries.lines(id);
    }
}`,
    explanation: `### The Defect
\`getLines()\` is a **lazy** collection: its SQL runs on first access, which requires an open persistence context. The transaction (and session) ended when \`find\` returned, so accessing it in the controller fails. (With Open Session in View enabled it would "work", but hold a database connection for the whole request.)

### The Fix
Fetch the data the use case needs **inside** the transactional service method (\`JOIN FETCH\`, \`@EntityGraph\`, or a DTO projection) and return DTOs rather than entities. Don't switch the association to EAGER: that loads lines on every order query everywhere.`,
  },
  {
    id: 'cd-54',
    title: 'The Lost Update on Stock Levels',
    categoryId: 'persistence',
    difficulty: 'Hard',
    code: `@Transactional
public void reserve(long productId, int quantity) {
    Product p = products.findById(productId).orElseThrow();
    if (p.getStock() < quantity) {
        throw new OutOfStockException(productId);
    }
    p.setStock(p.getStock() - quantity);
}`,
    defectDescription: 'During flash sales, more items are sold than exist in stock, although the stock check looks correct.',
    fixedCode: `@Entity
public class Product {
    @Id private Long id;
    private int stock;

    @Version            // FIXED: optimistic locking detects concurrent updates
    private long version;
    ...
}

@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional
public void reserve(long productId, int quantity) {
    Product p = products.findById(productId).orElseThrow();
    if (p.getStock() < quantity) throw new OutOfStockException(productId);
    p.setStock(p.getStock() - quantity);
}

// Alternative: a single atomic statement
// UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty   (check rows affected)`,
    explanation: `### The Defect
Two transactions read the same stock (say 1), both pass the check, and both write \`stock = 0\`. Under the default **Read Committed** isolation nothing prevents this: a classic **lost update**, and two items are sold from one unit.

### The Fix
Options, in order of simplicity:
* A single **conditional atomic update** (\`stock = stock - ? WHERE stock >= ?\`) and check the affected row count.
* **Optimistic locking** with \`@Version\`: the second commit fails with a version conflict; retry in a new transaction.
* **Pessimistic locking** (\`SELECT ... FOR UPDATE\` via \`@Lock(PESSIMISTIC_WRITE)\`) for very hot rows, accepting contention.
(The retry must wrap the transaction, not run inside it.)`,
  },

  // ---------------------------------------------------------------- JVM / language basics
  {
    id: 'cd-55',
    title: 'Money in Doubles',
    categoryId: 'jvm',
    difficulty: 'Core',
    code: `public double invoiceTotal(List<Double> lineAmounts, double taxRate) {
    double total = 0;
    for (double amount : lineAmounts) {
        total += amount;
    }
    return total * (1 + taxRate);
}

// invoiceTotal(List.of(0.1, 0.2), 0) -> 0.30000000000000004`,
    defectDescription: 'Invoice totals are occasionally off by a cent, and accounting reconciliation keeps failing.',
    fixedCode: `public BigDecimal invoiceTotal(List<BigDecimal> lineAmounts, BigDecimal taxRate) {
    // FIXED: exact decimal arithmetic with explicit rounding
    BigDecimal net = lineAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    return net.multiply(BigDecimal.ONE.add(taxRate))
              .setScale(2, RoundingMode.HALF_EVEN);
}`,
    explanation: `### The Defect
\`double\` is binary floating point. Most decimal fractions (0.1, 0.2) have **no exact binary representation**, so sums accumulate tiny errors. Rounding those results later produces totals that are off by a cent, which is unacceptable for money.

### The Fix
Use \`BigDecimal\` (constructed from strings or \`BigDecimal.valueOf\`, never \`new BigDecimal(0.1)\`), with an explicit scale and rounding mode at defined points, or store amounts as integer minor units (cents) in a \`long\`. Compare BigDecimals with \`compareTo\`, since \`equals\` also compares scale.`,
  },
  {
    id: 'cd-56',
    title: 'Comparing Strings With ==',
    categoryId: 'jvm',
    difficulty: 'Core',
    code: `public boolean isAdmin(HttpServletRequest request) {
    String role = request.getHeader("X-Role");
    return role == "ADMIN";
}

// Unit test: isAdmin(requestWithHeader("ADMIN")) -> true (header built from a literal)
// Production: always false`,
    defectDescription: 'Administrators can\'t access admin pages in production, although the unit test passes.',
    fixedCode: `public boolean isAdmin(HttpServletRequest request) {
    String role = request.getHeader("X-Role");
    // FIXED: compare contents, null-safe
    return "ADMIN".equals(role);
}`,
    explanation: `### The Defect
\`==\` compares **references**. In the unit test the header value was the same interned string literal object, so \`==\` happened to be true. In production the header is parsed from the network into a **new String object**, so the comparison is always false even though the contents match.

### The Fix
Use \`equals\` (calling it on the literal also avoids a \`NullPointerException\` when the header is missing).
Separately: trusting a client-supplied role header is a security problem in its own right; roles should come from the authenticated principal, not request headers.`,
  },

  // ---------------------------------------------------------------- Security
  {
    id: 'cd-57',
    title: 'Timing-Unsafe Webhook Signature Check',
    categoryId: 'security',
    difficulty: 'Solid',
    code: `@PostMapping("/webhooks/payments")
public ResponseEntity<Void> onEvent(@RequestBody String body,
                                    @RequestHeader("X-Signature") String signature) {
    String expected = hex(hmacSha256(webhookSecret, body));
    if (!expected.equals(signature)) {
        return ResponseEntity.status(401).build();
    }
    handle(body);
    return ResponseEntity.ok().build();
}`,
    defectDescription: 'A security review reports that attackers could forge valid webhook signatures and replay old events.',
    fixedCode: `@PostMapping("/webhooks/payments")
public ResponseEntity<Void> onEvent(@RequestBody String body,
                                    @RequestHeader("X-Signature") String signature,
                                    @RequestHeader("X-Timestamp") long timestamp) {
    // FIXED: reject stale requests to prevent replay
    if (Math.abs(Instant.now().getEpochSecond() - timestamp) > 300) {
        return ResponseEntity.status(401).build();
    }
    byte[] expected = hmacSha256(webhookSecret, timestamp + "." + body);
    byte[] provided = HexFormat.of().parseHex(signature);
    // FIXED: constant-time comparison
    if (!MessageDigest.isEqual(expected, provided)) {
        return ResponseEntity.status(401).build();
    }
    handle(body);   // also deduplicate by event ID
    return ResponseEntity.ok().build();
}`,
    explanation: `### The Defect
1. \`String.equals\` returns at the **first differing character**, so response time leaks how many leading characters of a guess are correct. With enough requests an attacker can recover a valid signature byte by byte: a **timing attack**.
2. The signature covers only the body, so a captured request can be **replayed** indefinitely.

### The Fix
Compare MACs with \`MessageDigest.isEqual\` (constant time) on raw bytes. Sign a **timestamp** together with the body and reject requests outside a tolerance window, and deduplicate event IDs so a replay within the window has no effect.`,
  },
  {
    id: 'cd-58',
    title: 'AES With the Default Mode and a Hard-Coded Key',
    categoryId: 'security',
    difficulty: 'Hard',
    code: `public class PiiCipher {
    private static final byte[] KEY = "S3cr3tK3y1234567".getBytes(StandardCharsets.UTF_8);

    public byte[] encrypt(String nationalId) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(KEY, "AES"));
        return cipher.doFinal(nationalId.getBytes(StandardCharsets.UTF_8));
    }
}`,
    defectDescription: 'Auditors flag that encrypted national IDs leak information and could be decrypted by anyone with access to the code.',
    fixedCode: `public class PiiCipher {
    private static final int NONCE_BYTES = 12;
    private final SecretKey key;               // FIXED: loaded from a KMS / secrets manager
    private final SecureRandom random = new SecureRandom();

    public PiiCipher(SecretKey key) { this.key = key; }

    public byte[] encrypt(String nationalId, String recordId) throws GeneralSecurityException {
        byte[] nonce = new byte[NONCE_BYTES];
        random.nextBytes(nonce);                // FIXED: fresh nonce per encryption
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");   // FIXED: authenticated mode
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, nonce));
        cipher.updateAAD(recordId.getBytes(StandardCharsets.UTF_8));
        byte[] ct = cipher.doFinal(nationalId.getBytes(StandardCharsets.UTF_8));
        return ByteBuffer.allocate(nonce.length + ct.length).put(nonce).put(ct).array();
    }
}`,
    explanation: `### The Defect
* \`Cipher.getInstance("AES")\` defaults to **ECB mode** in standard providers. ECB encrypts identical plaintext blocks to identical ciphertext, so equal national IDs produce equal ciphertexts (patterns leak), and there is **no integrity protection**.
* The key is **hard-coded** in source, so anyone with the repository, a build artifact or a decompiler can decrypt everything. It can't be rotated either.

### The Fix
Use an **authenticated** mode (AES-GCM) with a unique random nonce per encryption, stored alongside the ciphertext, and optionally associated data binding the ciphertext to its record. Keep keys in a KMS or secrets manager (envelope encryption), with versioning for rotation. Libraries like Google Tink make these choices for you.`,
  },

  // ---------------------------------------------------------------- Testing
  {
    id: 'cd-59',
    title: 'The Test That Asserts Nothing',
    categoryId: 'testing',
    difficulty: 'Core',
    code: `@Test
void appliesVolumeDiscount() {
    Order order = anOrder().withQuantity(100).withUnitPrice("2.00").build();

    BigDecimal total = pricing.total(order);

    assertThat(total);
}`,
    defectDescription: 'The test has passed for months, including after a change that completely broke the volume discount.',
    fixedCode: `@Test
void appliesVolumeDiscount() {
    Order order = anOrder().withQuantity(100).withUnitPrice("2.00").build();

    BigDecimal total = pricing.total(order);

    // FIXED: actually assert the expected outcome
    assertThat(total).isEqualByComparingTo("180.00");   // 10% volume discount
}`,
    explanation: `### The Defect
AssertJ's \`assertThat(x)\` only creates an assertion object. Without a check such as \`isEqualTo\`, nothing is verified, so the test passes no matter what \`total\` is. It still counts toward code coverage, which makes the gap invisible.

### The Fix
Assert the expected value (\`isEqualByComparingTo\` for BigDecimal, which ignores scale). Enable static analysis that flags dangling \`assertThat\` calls (Error Prone, Sonar), and consider mutation testing to find tests that can't fail.`,
  },
  {
    id: 'cd-60',
    title: 'A Test That Depends on Today\'s Date',
    categoryId: 'testing',
    difficulty: 'Solid',
    code: `class TrialService {
    boolean isTrialActive(User u) {
        return LocalDate.now().isBefore(u.signupDate().plusDays(30));
    }
}

@Test
void trialIsActiveDuringFirstMonth() {
    User u = new User(LocalDate.of(2025, 3, 1));
    assertThat(service.isTrialActive(u)).isTrue();
}`,
    defectDescription: 'The test passed when it was written in March 2025 and has failed on every CI run since April.',
    fixedCode: `class TrialService {
    private final Clock clock;
    TrialService(Clock clock) { this.clock = clock; }

    boolean isTrialActive(User u) {
        // FIXED: time comes from an injected Clock
        return LocalDate.now(clock).isBefore(u.signupDate().plusDays(30));
    }
}

@Test
void trialIsActiveDuringFirstMonth() {
    Clock clock = Clock.fixed(Instant.parse("2025-03-15T10:00:00Z"), ZoneOffset.UTC);
    TrialService service = new TrialService(clock);

    assertThat(service.isTrialActive(new User(LocalDate.of(2025, 3, 1)))).isTrue();
}`,
    explanation: `### The Defect
The production code reads the **system clock** directly. The test's outcome therefore depends on the date it runs: it was correct only during the 30 days after it was written. Such tests also fail around midnight, month ends and time zone differences between CI agents.

### The Fix
Inject a \`java.time.Clock\` (a \`Clock.systemUTC()\` bean in production) and use \`now(clock)\`. Tests pass a fixed clock and can explicitly cover boundaries such as day 29, day 30 and day 31.`,
  },

  // ---------------------------------------------------------------- Modern Java
  {
    id: 'cd-61',
    title: 'The Record That Isn\'t Immutable',
    categoryId: 'modern',
    difficulty: 'Solid',
    code: `public record Team(String name, List<String> members) {}

List<String> people = new ArrayList<>(List.of("Ana", "Bo"));
Team team = new Team("core", people);
teams.put(team, budget);            // used as a map key

people.add("Cy");                   // later, elsewhere
teams.get(new Team("core", List.of("Ana", "Bo")));   // null!
team.members().clear();             // also compiles and runs`,
    defectDescription: 'Teams stored as map keys can no longer be found, and a team\'s membership changes unexpectedly after construction.',
    fixedCode: `public record Team(String name, List<String> members) {
    public Team {
        // FIXED: defensive, unmodifiable copy in the compact constructor
        members = List.copyOf(members);
    }
}

List<String> people = new ArrayList<>(List.of("Ana", "Bo"));
Team team = new Team("core", people);
people.add("Cy");                   // no effect on team
team.members().clear();             // throws UnsupportedOperationException`,
    explanation: `### The Defect
Records are only **shallowly** immutable: the \`members\` field can't be reassigned, but the list it points to is the caller's mutable \`ArrayList\`. Mutating that list changes the record, and because the generated \`hashCode\`/\`equals\` include the list, a record used as a map key ends up in the wrong bucket and can't be found.

### The Fix
Make a defensive, unmodifiable copy in the **compact constructor** (\`List.copyOf\`, which also rejects nulls). Apply the same to arrays, dates from legacy APIs, and any other mutable component.`,
  },

  // ---------------------------------------------------------------- Profiling
  {
    id: 'cd-62',
    title: 'Debug Logging That Costs Even When Disabled',
    categoryId: 'profiling',
    difficulty: 'Core',
    code: `public Quote price(Cart cart) {
    log.debug("Pricing cart: " + objectMapper.writeValueAsString(cart));
    Quote quote = engine.price(cart);
    log.debug("Computed quote {}", quote.toDetailedReport());
    return quote;
}`,
    defectDescription: 'Profiling shows 25% of CPU spent in JSON serialisation inside this method, although DEBUG logging is switched off in production.',
    fixedCode: `public Quote price(Cart cart) {
    // FIXED: expensive arguments are computed only when DEBUG is enabled
    log.atDebug().setMessage("Pricing cart: {}")
            .addArgument(() -> toJson(cart))
            .log();
    Quote quote = engine.price(cart);
    if (log.isDebugEnabled()) {
        log.debug("Computed quote {}", quote.toDetailedReport());
    }
    return quote;
}`,
    explanation: `### The Defect
Java evaluates method arguments **before** the call. The string concatenation, the JSON serialisation of the whole cart, and \`toDetailedReport()\` all run on every request, and then the logger discards the result because DEBUG is off. Placeholders (\`{}\`) avoid the **formatting** cost, but not the cost of computing the arguments.

### The Fix
Defer expensive arguments: SLF4J 2's fluent API with suppliers, Log4j2's lambda overloads, or an \`isDebugEnabled()\` guard. Allocation and CPU profiles (async-profiler, JFR) make this kind of hidden cost easy to spot.`,
  },
];
