import type { Question } from '../types';

export const PERSISTENCE_QUESTIONS: Question[] = [
  {
    id: 'per-1',
    categoryId: 'persistence',
    title: 'The N+1 Select Problem',
    difficulty: 'Core',
    tags: ['JPA', 'N+1', 'Lazy Loading', 'Hibernate'],
    scenario: 'An endpoint returning 100 orders with their line items takes 3 seconds. The SQL log shows 101 queries: one for orders, then one per order for its items.',
    question: 'Explain the N+1 problem, why lazy loading causes it, and give at least three distinct fixes with their trade-offs.',
    idealAnswer: `### The mechanism
\`@OneToMany\` is \`LAZY\` by default. Hibernate returns a **proxy collection**. The moment your serializer or business code touches \`order.getItems()\`, the proxy fires a separate \`SELECT\`. One query for the parents plus N queries for the children = **N+1**.

Each round trip costs network latency plus statement parsing. At 100 orders and a 25ms round trip you have burned 2.5 seconds before doing any work.

### Fix 1: JOIN FETCH
\`\`\`
@Query("select distinct o from Order o join fetch o.items where o.status = :s")
\`\`\`
One query, everything loaded. **Trade-offs:** you cannot combine \`join fetch\` on a collection with \`setFirstResult\`/\`setMaxResults\` — Hibernate silently pages **in memory**, loading the whole table. It also produces a Cartesian product across multiple collection fetches (the "MultipleBagFetchException" problem).

### Fix 2: @EntityGraph
Declarative and reusable, and works with Spring Data repository methods. Same underlying join semantics, so the same pagination caveat applies, but it keeps the query and the fetch plan separate.

### Fix 3: batch fetching
\`@BatchSize(size = 50)\` on the collection or \`hibernate.default_batch_fetch_size\`. Hibernate then loads children with \`... WHERE parent_id IN (?, ?, ...)\`, turning N+1 into roughly N/50 + 1. **This is the best default** because it fixes the problem globally, plays nicely with pagination, and needs no query rewriting.

### Fix 4: projections
If the endpoint only needs a few fields, do not load entities at all. A DTO projection or a native query returning exactly the needed columns is faster than any fetch strategy, and it dodges the whole lazy-loading model.

### Detection
Do not rely on reading logs. Add an assertion in tests — \`datasource-proxy\` or a query counter that fails the build when an endpoint exceeds a query budget. N+1 always comes back otherwise.`,
    codeSnippet: `// Global default: turns N+1 into N/batch + 1 without changing any query
spring.jpa.properties.hibernate.default_batch_fetch_size=50

// Targeted fetch plan, reusable across queries
@EntityGraph(attributePaths = {"items", "customer"})
List<Order> findByStatus(Status status);

// Projection: fastest of all when you only need a few columns
@Query("select new com.acme.OrderSummary(o.id, o.total, count(i)) " +
       "from Order o join o.items i group by o.id, o.total")
List<OrderSummary> findSummaries();`,
    pitfalls: [
      'Switching everything to EAGER, which just moves the problem and makes every query heavy.',
      'Combining join fetch on a collection with pagination — Hibernate pages in memory.',
      'Fetching two collections in one query and hitting a Cartesian product.',
      'Having no automated detection, so N+1 reappears with the next feature.'
    ],
    followUpQuestions: [
      'Why does Hibernate warn about "firstResult/maxResults specified with collection fetch"?',
      'How does MultipleBagFetchException arise and how do you avoid it?',
      'How would you write a test that fails the build on N+1?'
    ],
    faangFocus: 'The most commonly asked ORM question anywhere. Naming batch fetching as the pragmatic global default distinguishes practitioners from textbook answers.'
  },
  {
    id: 'per-2',
    categoryId: 'persistence',
    title: 'Transaction Isolation Levels and Their Anomalies',
    difficulty: 'Solid',
    tags: ['Isolation', 'ACID', 'Phantom Read', 'MVCC'],
    scenario: 'A booking service occasionally double-books the last seat. It reads the seat count, checks availability, then inserts a booking. The default isolation level is READ COMMITTED.',
    question: 'Name the four standard isolation levels and the anomalies each prevents. Explain precisely why READ COMMITTED allows this bug and what you would do about it.',
    idealAnswer: `### The four levels and what they prevent
| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | allowed | allowed | allowed |
| READ COMMITTED | prevented | allowed | allowed |
| REPEATABLE READ | prevented | prevented | allowed* |
| SERIALIZABLE | prevented | prevented | prevented |

*In PostgreSQL's MVCC implementation, REPEATABLE READ also prevents phantoms; in the SQL standard it does not. Naming that divergence is a strong signal.

* **Dirty read** — seeing another transaction's uncommitted data.
* **Non-repeatable read** — reading the same row twice and getting different values.
* **Phantom read** — re-running the same range query and getting different *rows*.

### Why READ COMMITTED double-books
The bug is not any of the three anomalies. It is a **write skew / lost update** in a read-then-write sequence:
1. T1 reads seats_left = 1.
2. T2 reads seats_left = 1.
3. Both pass the check.
4. Both insert.

Each read was of committed data, so no anomaly occurred by definition. The isolation level cannot help, because the *decision* was made outside the database.

### The real fixes, best first
1. **Let the database enforce the invariant.** A unique constraint on (event_id, seat_no) makes double-booking structurally impossible. Catch the constraint violation and translate it. This is the most robust answer — invariants belong where the data is.
2. **Atomic conditional update.** \`UPDATE events SET seats_left = seats_left - 1 WHERE id = ? AND seats_left > 0\` and check the affected row count. One statement, no read-then-write gap.
3. **Pessimistic lock.** \`SELECT ... FOR UPDATE\` (\`@Lock(PESSIMISTIC_WRITE)\`) serialises contenders on that row. Correct but serialising, and it invites deadlocks if lock ordering is inconsistent.
4. **Optimistic locking.** A \`@Version\` column: the update fails if the row changed, and you retry. Great under low contention, wasteful under high.
5. **SERIALIZABLE.** Correct, but on PostgreSQL it uses SSI and will abort transactions with serialization failures that you must retry. Never use it without retry logic.

### The framing that matters
Isolation levels protect you from *reading* inconsistently. They do not protect an application-level check-then-act. Push the invariant into the database or into a single atomic statement.`,
    codeSnippet: `// Race: read, decide, write
if (repo.seatsLeft(eventId) > 0) { repo.book(eventId, userId); }

// Atomic: the database decides, one statement
@Modifying
@Query("update Event e set e.seatsLeft = e.seatsLeft - 1 " +
       "where e.id = :id and e.seatsLeft > 0")
int reserveSeat(@Param("id") Long id);

if (reserveSeat(eventId) == 0) throw new SoldOutException();

// Or let the schema make it impossible
// ALTER TABLE booking ADD CONSTRAINT uq_seat UNIQUE (event_id, seat_no);`,
    pitfalls: [
      'Believing a higher isolation level fixes an application-level check-then-act.',
      'Using SERIALIZABLE with no retry handling for serialization failures.',
      'Assuming REPEATABLE READ behaves identically across MySQL and PostgreSQL.',
      'Relying on application checks for invariants the schema could enforce.'
    ],
    followUpQuestions: [
      'What is write skew and why does it survive REPEATABLE READ?',
      'How does PostgreSQL Serializable Snapshot Isolation differ from lock-based SERIALIZABLE?',
      'When is optimistic locking better than pessimistic, and how do you measure that?'
    ],
    faangFocus: 'Backend design rounds at payments and ticketing companies use exactly this scenario. The winning move is pushing the invariant into the database.'
  },
  {
    id: 'per-3',
    categoryId: 'persistence',
    title: 'The JPA Entity Lifecycle and Dirty Checking',
    difficulty: 'Solid',
    tags: ['JPA', 'Persistence Context', 'Dirty Checking', 'Detached'],
    scenario: 'A service loads an entity, modifies a field, and never calls `save()` — yet the change is persisted. Elsewhere, a service calls `save()` on a detached entity and a second row appears instead of an update.',
    question: 'Explain the four entity states, the first-level cache, and how dirty checking and merge work.',
    idealAnswer: `### The four states
* **Transient** — a new object the persistence context has never seen. No identity in the database.
* **Managed** — attached to an open persistence context. Every change is tracked.
* **Detached** — was managed, but the context closed (or \`detach()\`/\`clear()\` was called). Has an id but is no longer tracked.
* **Removed** — scheduled for deletion at flush.

### The first-level cache and dirty checking
The \`EntityManager\` **is** the first-level cache. When it loads an entity it keeps both the instance and a **snapshot** of its loaded state. At flush time — before a query that might be affected, or at commit — it compares each managed entity to its snapshot and issues \`UPDATE\` for anything that changed.

That is why the first service works without \`save()\`: inside a transaction, the entity is managed, so mutation alone is enough. **Automatic dirty checking is the intended JPA programming model**, not a bug.

It also means the first-level cache guarantees **identity**: loading the same id twice in one context returns the *same object reference*.

### Why the detached save() inserted a row
\`save()\` in Spring Data delegates to \`persist()\` if the entity is considered new, and \`merge()\` otherwise. "New" is decided by the id being null (or by \`Persistable.isNew()\`). If your entity uses an assigned id, or the version field is null, Spring can misjudge, call \`persist()\`, and insert.

\`merge()\` itself is subtle: it does **not** attach your instance. It copies your state onto a managed instance and **returns that managed copy**. Continuing to use the original detached object is a classic bug — your later changes go nowhere.

### Practical rules
* Inside a transaction, mutate managed entities; do not call \`save()\` for updates.
* Always use the **return value** of \`merge()\`/\`save()\`.
* Watch out for \`LazyInitializationException\`: touching a lazy association after the context closes. Fix it by fetching what you need inside the transaction or mapping to a DTO — never by enabling \`open-in-view\`, which keeps the context open for the entire request and hides N+1 problems in the view layer.`,
    codeSnippet: `@Transactional
public void applyDiscount(Long id) {
    Order o = repo.findById(id).orElseThrow();
    o.setTotal(o.getTotal() * 0.9);   // managed: dirty checking persists this
    // no save() needed, and calling it changes nothing
}

// merge returns the managed copy — use it
@Transactional
public Order update(Order detached) {
    Order managed = em.merge(detached);
    managed.setStatus(PAID);   // tracked
    return managed;            // NOT 'detached'
}`,
    pitfalls: [
      'Calling save() inside a transaction for an already-managed entity, believing it is required.',
      'Discarding the return value of merge() and mutating the detached instance.',
      'Enabling spring.jpa.open-in-view to silence LazyInitializationException.',
      'Assuming a detached entity with a non-null id will always be merged rather than persisted.'
    ],
    followUpQuestions: [
      'When exactly does Hibernate flush, and what does FlushMode.AUTO change?',
      'What are the risks of the second-level cache, and when is it worth enabling?',
      'How does Persistable.isNew() help with assigned identifiers?'
    ],
    faangFocus: 'Spring-heavy shops probe this hard. "Dirty checking means you do not call save()" is the sentence that separates people who understand JPA from people who fight it.'
  },
  {
    id: 'per-4',
    categoryId: 'persistence',
    title: 'Optimistic vs Pessimistic Locking Under Contention',
    difficulty: 'Hard',
    tags: ['Locking', 'Version', 'Deadlock', 'Retry'],
    scenario: 'An inventory service uses `@Version` optimistic locking. During flash sales, 40% of requests fail with `OptimisticLockException` on a handful of hot SKUs, while the other 10,000 SKUs are fine.',
    question: 'Explain both locking strategies, why optimistic locking degrades here, and design a solution that keeps the good behaviour for cold rows.',
    idealAnswer: `### The two strategies
* **Optimistic** — a \`@Version\` column. Every update includes \`WHERE id = ? AND version = ?\` and bumps the version. If zero rows are affected, someone else won and you get \`OptimisticLockException\`. No locks are held; conflicts are detected at write time.
* **Pessimistic** — \`SELECT ... FOR UPDATE\`. The row is locked for the transaction's duration; contenders block. Conflicts are *prevented* rather than detected.

### Why optimistic fails on hot rows
Optimistic locking assumes conflicts are **rare**. Its cost model is: cheap when you win, full transaction rollback and retry when you lose. Under N concurrent writers on the same row, the probability of losing approaches (N−1)/N, and each loss wastes the entire transaction's work. This is a livelock-flavoured failure: throughput collapses precisely when demand is highest.

Pessimistic locking has the opposite profile: constant cost per writer, but strict serialisation and a risk of deadlock and lock-wait timeouts.

### The hybrid design
1. **Keep optimistic locking as the default.** It is right for 10,000 cold SKUs.
2. **Detect hot keys** and switch those to pessimistic — or better, to an atomic single-statement decrement (\`UPDATE ... SET qty = qty - ? WHERE id = ? AND qty >= ?\`), which needs no lock at all and no retry.
3. **Bounded retry with jitter** for the optimistic path. Retry 3 times with exponential backoff plus randomisation; without jitter, retries collide again in lockstep.
4. **Reduce the conflict window.** Load late, write early, and keep the transaction as short as physically possible. Never do HTTP calls inside it.
5. **Split the hot row.** Sharding one counter into K sub-counters (each request picks one at random, total = sum) removes the single contention point entirely — the same trick as \`LongAdder\`.
6. **Move it out of the database.** For extreme cases, a Redis \`DECR\` with a reconciliation job, or a queue that serialises per-SKU, converts contention into ordering.

### Also mention
\`OPTIMISTIC_FORCE_INCREMENT\` bumps the version even when only children changed, which lets you version an aggregate root. And always order lock acquisition consistently to avoid deadlocks under pessimistic locking.`,
    codeSnippet: `// Atomic decrement: no lock, no retry, no version conflict
@Modifying
@Query("update Stock s set s.qty = s.qty - :n " +
       "where s.sku = :sku and s.qty >= :n")
int take(@Param("sku") String sku, @Param("n") int n);

// Pessimistic, only for known-hot keys
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
Optional<Stock> findBySku(String sku);`,
    pitfalls: [
      'Retrying optimistic failures with no backoff or jitter, amplifying the storm.',
      'Holding a pessimistic lock across a network call.',
      'Unbounded retries, turning a conflict into a thread-pool exhaustion incident.',
      'Acquiring locks in inconsistent order across code paths, creating deadlocks.'
    ],
    followUpQuestions: [
      'How does the LongAdder-style sharded counter trick apply to a database row?',
      'What is the difference between OPTIMISTIC and OPTIMISTIC_FORCE_INCREMENT?',
      'How do you set and monitor lock timeouts so a stuck lock does not cascade?'
    ],
    faangFocus: 'Flash-sale inventory is a standard senior design prompt. Recognising that the right fix is often "no lock at all, just an atomic conditional update" is the key insight.'
  },
  {
    id: 'per-5',
    categoryId: 'persistence',
    title: 'Connection Pool Sizing and Exhaustion',
    difficulty: 'Hard',
    tags: ['HikariCP', 'Connection Pool', 'Saturation', 'Little\'s Law'],
    scenario: 'A service with `maximumPoolSize=200` against a Postgres instance with `max_connections=250` shows p99 latency of 8 seconds and frequent `Connection is not available, request timed out` errors. CPU on the database is at 100% but throughput is low.',
    question: 'Explain why a bigger pool made things worse, and how you would size it properly.',
    idealAnswer: `### Why a bigger pool is slower
A database is not infinitely parallel. It has a fixed number of cores and a finite set of disk spindles or IOPS. Beyond that point, extra concurrent connections do not add throughput — they add **context switching, lock contention, and memory pressure** (each Postgres connection is a process with its own work_mem).

At 200 in-flight queries on an 8-core database, every query is time-slicing. Each individual query gets slower, transactions hold locks longer, contention rises, and throughput *decreases*. This is classic **congestion collapse**, and it is why the pool timeout fires: connections are checked out, just not doing useful work.

### Sizing it properly
The widely used starting formula (from the HikariCP docs, derived from PostgreSQL experience) is:

\`\`\`
connections = ((core_count * 2) + effective_spindle_count)
\`\`\`

For an 8-core database with SSDs, that is roughly **17-20 connections** — an order of magnitude smaller than 200, and it will be dramatically faster.

Reason about it with **Little's Law**: \`concurrency = throughput × latency\`. If you need 1,000 req/s and each query takes 5ms, you need \`1000 × 0.005 = 5\` concurrent connections. Sizing beyond what the law requires only buys queueing.

### Where the queue should live
A small pool means requests queue **in the application**, waiting for a connection. That is correct and desirable: a bounded queue in front of a saturated resource is backpressure. A large pool moves the queue **into the database**, where it is unbounded, invisible, and harms every other query.

### The operational checklist
* Set \`connectionTimeout\` (fail fast, ~2-5s) and monitor \`hikaricp_connections_pending\`.
* Set \`leakDetectionThreshold\` — a connection held for minutes is a bug, usually a missing try-with-resources or a transaction spanning an HTTP call.
* Never call external services inside a transaction; you are holding a database connection for the duration of someone else's latency.
* Count **all** consumers: N app instances × pool size + batch jobs + migrations must fit under \`max_connections\`.
* Consider **PgBouncer** in transaction-pooling mode if you genuinely have many app instances.`,
    codeSnippet: `spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # not 200 — sized to the DB, not to hope
      minimum-idle: 20             # fixed-size pool avoids churn
      connection-timeout: 3000     # fail fast; queueing is backpressure
      leak-detection-threshold: 20000
      validation-timeout: 2000

# Watch: hikaricp_connections_pending, hikaricp_connections_usage_seconds`,
    pitfalls: [
      'Treating pool size as a throughput knob and raising it under load.',
      'Forgetting to multiply pool size by the number of application instances.',
      'Making network calls while holding a connection.',
      'No leak detection, so a single leaked connection slowly drains the pool.'
    ],
    followUpQuestions: [
      'How do you apply Little\'s Law to pick a pool size from an SLO?',
      'What does PgBouncer transaction pooling break (hint: prepared statements, session state)?',
      'How would you detect a connection leak from metrics alone?'
    ],
    faangFocus: 'A signature SRE-flavoured backend question. "Smaller pool, faster system" is counter-intuitive and shows real production experience.'
  },
  {
    id: 'per-6',
    categoryId: 'persistence',
    title: 'Indexes: What Gets Used and What Does Not',
    difficulty: 'Solid',
    tags: ['Indexes', 'Query Plan', 'Composite Index', 'Cardinality'],
    scenario: 'A query filtering on `(tenant_id, status)` and sorting by `created_at` does a sequential scan despite three single-column indexes existing on those columns.',
    question: 'Explain why the indexes are not used, how composite index column order works, and what would actually help.',
    idealAnswer: `### Why three single-column indexes lose
A B-tree index is a **sorted structure over its key prefix**. Three separate indexes let the planner use one of them (or, in Postgres, combine them via a bitmap scan, which is often not worth it). It then has to fetch and re-filter the rest. If the estimated selectivity is poor, a sequential scan genuinely is cheaper — the planner is usually right.

### The leftmost-prefix rule
A composite index on \`(a, b, c)\` can serve predicates on \`a\`, \`(a, b)\`, and \`(a, b, c)\` — but **not** on \`b\` alone or \`(b, c)\`. The index is sorted by \`a\` first, so without a constraint on \`a\` there is no contiguous range to scan.

### Ordering the columns
1. **Equality predicates first**, in descending order of selectivity.
2. **Range predicates next** — a range consumes the ordering, so nothing after it can be used for further seeking.
3. **ORDER BY columns last**, so the index also satisfies the sort and the planner can skip a separate sort step.

For this query the right index is \`(tenant_id, status, created_at)\`: two equalities, then the sort column. The planner can seek to the matching range and read it already ordered.

### Covering indexes
Adding the selected columns via \`INCLUDE\` (Postgres) or as trailing key columns (MySQL) lets the query be answered **entirely from the index** — an index-only scan, no heap access. This is often a 5-10x win on wide tables.

### What defeats an index
* Applying a function to the column: \`WHERE lower(email) = ?\` cannot use an index on \`email\`. Create an expression index on \`lower(email)\` instead.
* Implicit type casts (\`WHERE varchar_col = 123\`).
* Leading wildcards: \`LIKE '%foo'\`.
* \`OR\` across different columns — often better rewritten as a \`UNION\`.
* Very low cardinality: an index on a boolean rarely helps unless it is a **partial index** (\`WHERE deleted = false\`), which is frequently the best tool for soft-delete patterns.

### The method
Always read \`EXPLAIN (ANALYZE, BUFFERS)\`. Compare **estimated vs actual** rows — a large divergence means stale statistics, and \`ANALYZE\` may fix the plan without any new index. Then verify the index is actually used, and check \`pg_stat_user_indexes\` for indexes that are never used but still cost you on every write.`,
    codeSnippet: `-- Serves the equality filters AND the sort, in one index-only scan
CREATE INDEX idx_orders_tenant_status_created
    ON orders (tenant_id, status, created_at DESC)
    INCLUDE (total, customer_id);

-- Function on the column defeats a plain index; index the expression
CREATE INDEX idx_users_lower_email ON users (lower(email));

-- Partial index: small, and perfect for soft deletes
CREATE INDEX idx_active_orders ON orders (tenant_id, created_at)
    WHERE deleted_at IS NULL;`,
    pitfalls: [
      'Creating one index per column and expecting them to combine well.',
      'Getting composite column order wrong, especially putting a range column before an equality column.',
      'Indexing a column that is always wrapped in a function at query time.',
      'Adding indexes without checking write amplification or removing unused ones.'
    ],
    followUpQuestions: [
      'Why does a range predicate "consume" the index ordering for subsequent columns?',
      'When does the planner prefer a sequential scan even with a perfect index?',
      'What is the write cost of each additional index, and how do you decide it is worth it?'
    ],
    faangFocus: 'Database rounds at every serious backend company. Reading EXPLAIN ANALYZE and comparing estimated vs actual rows is the practical skill they are testing.'
  },
  {
    id: 'per-7',
    categoryId: 'persistence',
    title: 'Spring @Transactional: Propagation, Rollback and Self-Invocation',
    difficulty: 'Hard',
    tags: ['Spring', 'Transactional', 'Propagation', 'AOP'],
    scenario: 'A method annotated `@Transactional` calls another `@Transactional(propagation = REQUIRES_NEW)` method in the same class to write an audit row. When the outer method throws, the audit row disappears too. Separately, a checked exception fails to roll anything back.',
    question: 'Explain both behaviours precisely, then describe the propagation levels and the default rollback rules.',
    idealAnswer: `### Bug 1: self-invocation bypasses the proxy
Spring implements \`@Transactional\` with an **AOP proxy**. Callers get the proxy; the proxy opens a transaction and delegates to the real object. A call from one method of the target to another (\`this.audit()\`) goes **directly to the target instance** — the proxy is never involved, so \`REQUIRES_NEW\` is silently ignored and the audit write joins the outer transaction. When the outer transaction rolls back, so does the audit.

**Fixes:**
* Move the audit method to a **separate bean** (the standard, cleanest answer).
* Inject a self-reference (\`@Lazy\` or \`ObjectProvider\`) and call through it — works, but obscure.
* Use \`TransactionTemplate\` programmatically, which is explicit and proxy-free.
* AspectJ load-time weaving, which weaves the advice into the class itself. Powerful, heavy.

### Bug 2: checked exceptions do not roll back
Spring's default rollback rule is **unchecked exceptions and \`Error\` only**. A checked exception commits, because the EJB-era convention Spring inherited treats checked exceptions as expected business outcomes. Override with \`@Transactional(rollbackFor = Exception.class)\`, or throw unchecked exceptions from your service layer (the more common modern choice).

Also: once a transaction is marked rollback-only, catching the exception higher up does not save it — you get \`UnexpectedRollbackException\` at commit. That surprises people.

### Propagation levels
* **REQUIRED** (default) — join an existing transaction, or start one.
* **REQUIRES_NEW** — always suspend the current one and start a genuinely independent transaction. **Uses a second connection**, so nested use can exhaust the pool.
* **SUPPORTS** — join if one exists, otherwise run non-transactionally.
* **MANDATORY** — must be called inside a transaction, else throw.
* **NOT_SUPPORTED** — suspend any transaction and run without one.
* **NEVER** — throw if a transaction exists.
* **NESTED** — a JDBC **savepoint** inside the current transaction. The inner part can roll back independently, but it commits with the outer. Only supported by \`DataSourceTransactionManager\`.

### The other classic gotchas
* \`@Transactional\` on a \`private\` or \`final\` method does nothing (nothing to proxy).
* A read-only transaction (\`readOnly = true\`) lets Hibernate skip dirty-checking snapshots — a real performance win for query paths.
* The transaction ends at the method boundary; lazy loading after that throws.`,
    codeSnippet: `// Broken: self-invocation, REQUIRES_NEW ignored
@Transactional
public void process(Order o) {
    save(o);
    this.audit(o);          // proxy bypassed
    throw new IllegalStateException();
}

// Fixed: separate bean, so the call goes through a proxy
@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void audit(Order o) { ... }
}

// Roll back on checked exceptions too
@Transactional(rollbackFor = Exception.class)
public void transfer() throws InsufficientFundsException { ... }`,
    pitfalls: [
      'Expecting @Transactional to work on self-invocation, private or final methods.',
      'Assuming checked exceptions trigger rollback.',
      'Nesting REQUIRES_NEW deeply and exhausting the connection pool.',
      'Catching an exception after the transaction is marked rollback-only and expecting a commit.'
    ],
    followUpQuestions: [
      'When does Spring use a JDK dynamic proxy versus a CGLIB subclass, and what changes?',
      'How does NESTED differ from REQUIRES_NEW at the JDBC level?',
      'What exactly does readOnly = true optimise in Hibernate?'
    ],
    faangFocus: 'The self-invocation trap is the single most-asked Spring question. Explaining it in terms of the proxy boundary — not "Spring is weird" — is what earns the point.'
  },
  {
    id: 'per-8',
    categoryId: 'persistence',
    title: 'Database Migrations With Zero Downtime',
    difficulty: 'Hard',
    tags: ['Flyway', 'Migrations', 'Zero Downtime', 'Expand-Contract'],
    scenario: 'You must rename a column `usr_nm` to `username` on a 500-million-row table, in a service running 30 instances behind a load balancer, with no maintenance window.',
    question: 'Design the migration. Explain the expand-contract pattern and the rules that make schema changes safe under rolling deploys.',
    idealAnswer: `### The core constraint
During a rolling deploy, **old and new application code run simultaneously** against **one** schema. Therefore every schema change must be compatible with both versions. A rename is not — it breaks old code instantly.

### Expand-contract (a.k.a. parallel change), in four deploys
1. **Expand** — add the new column \`username\`, nullable, no default that rewrites the table. Backfill in **batches** (e.g. 10k rows per statement with a sleep) so you never hold a long transaction or bloat the WAL. Add a trigger, or dual-write in the application, so new writes populate both columns.
2. **Migrate reads** — deploy code that writes both columns and reads the new one, falling back to the old if null. Both old and new instances are fine.
3. **Stop using the old column** — deploy code that only touches \`username\`. Verify with monitoring that nothing reads \`usr_nm\` (log or metric on the fallback path).
4. **Contract** — drop \`usr_nm\`, and the trigger. Only now, and only when you are certain no rollback target needs it.

Each step is independently deployable and independently reversible. That is the entire value.

### Rules for safe DDL
* **Additive only** in any single deploy: add columns, add tables, add nullable fields.
* **Never** rename, drop, or narrow a type in the same deploy as the code change.
* Adding a \`NOT NULL\` column **with a default** rewrites the whole table on older Postgres/MySQL versions — take a full lock. On Postgres 11+ a constant default is metadata-only, but confirm the version.
* Create indexes **concurrently** (\`CREATE INDEX CONCURRENTLY\`) — a plain create takes a write lock for the duration.
* Set a **short lock_timeout** on migrations. A DDL statement waiting on a lock queues every subsequent query behind it and takes the service down — this is the most common self-inflicted migration outage.
* Keep migrations **forward-only**. Down-migrations are usually untested fiction; roll forward instead.

### Tooling
Flyway or Liquibase, versioned in the repository, applied by an init container or a dedicated job — **not** by every application instance racing on startup. Flyway takes a lock, so it is safe, but a dedicated step gives you a clean failure signal.

For very large tables consider \`gh-ost\` or \`pt-online-schema-change\` (MySQL), which build a shadow table and swap it.`,
    codeSnippet: `-- V12: expand (fast, additive, no lock)
ALTER TABLE users ADD COLUMN username varchar(255);
CREATE INDEX CONCURRENTLY idx_users_username ON users (username);

-- V13: batched backfill, never one giant UPDATE
-- repeat until 0 rows affected
UPDATE users SET username = usr_nm
WHERE username IS NULL AND id IN (
    SELECT id FROM users WHERE username IS NULL LIMIT 10000
);

-- V15: contract, only after all instances stopped reading usr_nm
ALTER TABLE users DROP COLUMN usr_nm;

-- Always, on every migration connection:
SET lock_timeout = '3s';`,
    pitfalls: [
      'Renaming a column in one deploy and breaking every instance still running old code.',
      'Backfilling 500M rows in a single UPDATE, holding a transaction for hours.',
      'Creating an index without CONCURRENTLY and locking writes.',
      'No lock_timeout, so a blocked DDL statement queues all traffic behind it.'
    ],
    followUpQuestions: [
      'Why are down-migrations usually a bad idea, and what replaces them?',
      'How do you verify nothing reads the old column before dropping it?',
      'How does gh-ost perform an online schema change without locking?'
    ],
    faangFocus: 'A staple of senior and staff interviews at any company with real uptime requirements. Expand-contract by name, plus lock_timeout, marks operational maturity.'
  },
  {
    id: 'per-9',
    categoryId: 'persistence',
    title: 'Caching Strategies and Invalidation',
    difficulty: 'Hard',
    tags: ['Cache', 'Redis', 'Invalidation', 'Consistency'],
    scenario: 'A product service caches records in Redis with a 10-minute TTL. After a price update, some users see the old price for minutes. Occasionally a cache miss storm on a popular product takes the database down.',
    question: 'Explain the common caching patterns, how to handle invalidation correctly, and how to prevent stampedes.',
    idealAnswer: `### The patterns
* **Cache-aside (lazy loading)** — application reads cache, on miss loads from the database and populates. Simple, resilient (a cache outage degrades rather than fails), but every miss hits the database and there is a consistency window. This is what the scenario uses.
* **Read-through** — the cache itself loads on miss. Same semantics, moved behind an abstraction.
* **Write-through** — write to cache and database synchronously. Cache stays fresh, writes are slower.
* **Write-behind** — write to cache, flush to the database asynchronously. Fast, but you can lose data and it is genuinely hard to make correct.
* **Refresh-ahead** — proactively refresh hot keys before expiry, so users never pay the miss.

### Invalidation done properly
On write, **delete** the key rather than updating it. Updating creates a race: two concurrent writers can interleave read-modify-write and leave a stale value permanently. Deletion is idempotent and the next reader repopulates from the source of truth.

Even so, the classic race remains: reader loads from DB, writer updates DB and deletes the key, reader then writes its stale value. Mitigations:
* **Delete after commit**, not before, and consider a short second delete after a delay ("delayed double delete").
* Bind the cache entry to a **version** or \`updated_at\` and reject writes older than what is cached.
* Best of all: drive invalidation from the **database changelog** (Debezium/CDC). The cache follows committed reality instead of guessing.

### Preventing stampedes
When a hot key expires, thousands of requests miss simultaneously and all hit the database — this took the service down.
* **Per-key locking / single-flight**: only one loader per key, others wait for its result. In-process this is \`computeIfAbsent\`; distributed, a short-lived Redis lock.
* **Probabilistic early expiry (XFetch)**: each reader independently decides, with probability rising as the TTL approaches, to refresh early. Spreads the refresh naturally with no coordination.
* **Stale-while-revalidate**: serve the stale value immediately and refresh in the background. Best user experience for read-heavy data.
* **TTL jitter**: never use a fixed TTL for a whole population of keys, or they all expire together.
* **Negative caching** for misses, with a short TTL, so a missing id cannot be used to hammer the database.

### And measure
Hit ratio, load latency, and stampede events must be metrics. A cache you cannot observe is a liability, not an optimisation.`,
    codeSnippet: `// Invalidate AFTER the transaction commits, and delete rather than update
@Transactional
public void updatePrice(long id, Money price) {
    repo.updatePrice(id, price);
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
            @Override public void afterCommit() { redis.delete(key(id)); }
        });
}

// TTL with jitter so a key population does not expire in lockstep
Duration ttl = Duration.ofMinutes(10)
        .plusSeconds(ThreadLocalRandom.current().nextInt(120));`,
    pitfalls: [
      'Updating the cache on write instead of deleting it, creating a permanent-stale race.',
      'Invalidating before commit, so a reader can repopulate with pre-commit data.',
      'Uniform TTLs across a key population, causing synchronised expiry.',
      'No single-flight protection, so one hot key can take down the database.'
    ],
    followUpQuestions: [
      'How does CDC-driven invalidation change the consistency guarantees?',
      'What is probabilistic early expiration and why does it need no coordination?',
      'When is a local (Caffeine) tier in front of Redis worth the extra staleness?'
    ],
    faangFocus: 'Cache invalidation appears in nearly every senior system-design round. Stampede protection and TTL jitter are the details that separate a real answer from a diagram.'
  },
  {
    id: 'per-10',
    categoryId: 'persistence',
    title: 'SQL Injection, PreparedStatement and Dynamic Queries',
    difficulty: 'Core',
    tags: ['SQL Injection', 'PreparedStatement', 'Security', 'JDBC'],
    scenario: 'A search endpoint builds SQL by string concatenation for a dynamic filter and a user-supplied sort column. A pen test extracts the entire users table.',
    question: 'Explain how a PreparedStatement actually prevents injection, and how to handle the parts of a query that cannot be parameterised.',
    idealAnswer: `### Why concatenation is fatal
String-built SQL merges **code and data** into one text stream. The parser cannot tell which characters came from the developer and which from the attacker, so \`' OR '1'='1\` becomes executable syntax.

### How PreparedStatement prevents it
The statement is sent to the database **with placeholders**, parsed and planned as a template. Parameters are then transmitted **separately, out of band**, and bound to the already-built plan. They are never parsed as SQL, so no parameter value can change the query's structure. This is a structural guarantee, not escaping — which is why it is far stronger than any sanitisation routine.

It also gives you plan caching and correct type handling for free.

### What cannot be parameterised
Placeholders bind **values**, not identifiers or syntax. You cannot parameterise:
* table or column names
* \`ORDER BY\` direction
* \`LIMIT\` in some drivers
* whole clauses

For the user-supplied sort column, the only safe approach is an **allowlist**: map the incoming string to a known-safe column name, and reject anything not in the map. Never escape-and-interpolate an identifier.

### Dynamic filters
Build the query with a safe builder — JPA Criteria API, jOOQ, QueryDSL, or MyBatis dynamic SQL — which appends **placeholders** for each active filter rather than values. Or build the SQL text yourself but only ever append \`?\` and collect the parameters in a parallel list.

### Beyond the query layer
* **Least privilege**: the application's database user should not own the schema and should not have \`DROP\`.
* Never expose raw driver errors to users; they leak schema.
* \`@Query\` with \`nativeQuery = true\` and string concatenation is just as vulnerable — the annotation is not protection.
* Watch for injection in \`LIKE\` patterns (escape \`%\` and \`_\`) and in ORDER BY built from JSON payloads.
* Add a static analysis rule (SpotBugs/Semgrep) that fails the build on string-concatenated SQL, so this cannot regress.`,
    codeSnippet: `// Vulnerable
String sql = "SELECT * FROM users WHERE name = '" + name + "' ORDER BY " + sort;

// Values: bound out of band, structurally safe
PreparedStatement ps = con.prepareStatement(
        "SELECT * FROM users WHERE name = ? AND tenant_id = ?");
ps.setString(1, name);
ps.setLong(2, tenantId);

// Identifiers: allowlist, never interpolate
private static final Map<String, String> SORTABLE = Map.of(
        "name", "name", "created", "created_at", "total", "total_amount");

String column = SORTABLE.get(sortKey);
if (column == null) throw new BadRequestException("invalid sort");`,
    pitfalls: [
      'Believing escaping user input is equivalent to parameter binding.',
      'Interpolating identifiers because "they cannot be parameterised anyway".',
      'Assuming an ORM or @Query annotation is inherently safe when using native SQL with concatenation.',
      'Granting the application database user schema-owner privileges.'
    ],
    followUpQuestions: [
      'Why does parameter binding also improve performance?',
      'How would you safely support a user-defined dynamic filter DSL?',
      'What is second-order SQL injection and how does it evade a single review?'
    ],
    faangFocus: 'Assumed knowledge — but interviewers listen for the *mechanism* (out-of-band binding to a pre-parsed plan), not just "use PreparedStatement".'
  },
  {
    id: 'per-11',
    categoryId: 'persistence',
    title: 'The Outbox Pattern and Dual-Write Consistency',
    difficulty: 'Expert',
    tags: ['Outbox', 'Kafka', 'CDC', 'Consistency'],
    scenario: 'An order service writes to Postgres and then publishes an `OrderCreated` event to Kafka. Under partial failures, some orders exist with no event, and after a retry some events are published twice.',
    question: 'Explain the dual-write problem and design a correct solution end to end, including consumer-side guarantees.',
    idealAnswer: `### The dual-write problem
Writing to two systems that do not share a transaction can never be made atomic by ordering alone:
* Commit DB → crash before publish = **event lost**.
* Publish → DB rollback = **phantom event** for an order that does not exist.
* Publish → success but ack lost → retry = **duplicate**.

Distributed transactions (XA/2PC) would solve it in theory, but Kafka does not support XA properly, and 2PC introduces blocking locks and a coordinator single point of failure. It is the wrong tool for microservices.

### The transactional outbox
Make the event part of the **same local transaction** as the business data:
1. In one transaction, insert the order **and** insert a row into an \`outbox\` table (aggregate id, event type, payload, created_at).
2. Commit. Now the event is as durable as the order, atomically.
3. A separate relay publishes outbox rows to Kafka and marks them sent.

The relay can be:
* **CDC-based (preferred)** — Debezium tails the Postgres WAL and publishes outbox inserts. No polling load, very low latency, and it cannot miss a committed row.
* **Polling publisher** — a scheduled query for unsent rows. Simpler, no extra infrastructure, but adds database load and latency. Use \`SELECT ... FOR UPDATE SKIP LOCKED\` so multiple instances can poll safely.

### Delivery semantics
The outbox gives **at-least-once**, not exactly-once. Duplicates are unavoidable across a network boundary. Therefore:
* Every event carries a stable **event id** (and ideally a per-aggregate sequence number).
* **Consumers must be idempotent** — either a processed-ids table checked inside the consumer's own transaction, or naturally idempotent operations (upserts keyed by event id).
* Preserve **ordering per aggregate** by using the aggregate id as the Kafka partition key. Global ordering is not achievable and almost never actually needed.

### Operational details
* Prune the outbox (partition by day and drop old partitions; deleting row-by-row bloats the table).
* Monitor **outbox lag** — unsent row age is your early warning that the relay is down.
* Add a dead-letter path for events that repeatedly fail to publish or process.
* Kafka's idempotent producer and transactions reduce duplicates *within* Kafka but do nothing about the DB-to-Kafka boundary — that is exactly what the outbox is for.

### The alternative worth naming
**Event sourcing** removes the dual write entirely, because the event log *is* the state. It is a much larger commitment and changes how every query works.`,
    codeSnippet: `@Transactional
public void createOrder(OrderRequest req) {
    Order order = repo.save(Order.from(req));

    // Same transaction — atomic with the business write
    outbox.save(new OutboxEvent(
            UUID.randomUUID(),           // stable event id for dedup
            "Order", order.getId().toString(),
            "OrderCreated",
            json.write(OrderCreated.from(order))));
}

-- Relay-side polling that is safe with multiple instances
SELECT * FROM outbox WHERE sent_at IS NULL
ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED;`,
    pitfalls: [
      'Proposing 2PC/XA between a database and Kafka.',
      'Claiming the outbox gives exactly-once delivery.',
      'Forgetting consumer-side idempotency, so duplicates cause double charges.',
      'Never pruning the outbox table, or polling it without SKIP LOCKED.'
    ],
    followUpQuestions: [
      'How does Debezium guarantee it does not miss or reorder committed rows?',
      'How do you keep per-aggregate ordering when consumers scale out?',
      'What does the inbox pattern add on the consumer side?'
    ],
    faangFocus: 'Core senior/staff distributed-systems material at any event-driven company. The sentence that lands is "at-least-once plus idempotent consumers, not exactly-once".'
  },
  {
    id: 'per-12',
    categoryId: 'persistence',
    title: 'Batch Processing 50 Million Rows Without Killing the Database',
    difficulty: 'Expert',
    tags: ['Batch', 'JDBC', 'Keyset Pagination', 'Bulk Insert'],
    scenario: 'A nightly job must read 50 million rows, transform them, and write results back. The current implementation uses JPA with `findAll()` and `OFFSET/LIMIT` paging, runs for 14 hours, and causes OOMs and replication lag.',
    question: 'Redesign it. Address memory, pagination, write throughput and impact on the live system.',
    idealAnswer: `### Problem 1: OFFSET pagination is O(n²)
\`OFFSET 10000000 LIMIT 1000\` makes the database scan and discard ten million rows for every page. Total work grows quadratically, which is most of the 14 hours.

**Fix: keyset (seek) pagination.** Order by an indexed unique key and carry the last seen value forward: \`WHERE id > :lastId ORDER BY id LIMIT 1000\`. Every page costs the same. This is the single biggest win available.

### Problem 2: the persistence context grows without bound
Every entity loaded stays managed in the \`EntityManager\`, along with its dirty-checking snapshot. Fifty million entities is a guaranteed OOM.

**Fixes:**
* \`em.flush()\` then \`em.clear()\` every batch.
* Better, avoid JPA for bulk work entirely. Use \`JdbcTemplate\` with a **streaming ResultSet** (\`setFetchSize\`; on Postgres this also requires autocommit off, or the driver buffers everything client-side) and map to lightweight records.
* Set \`hibernate.jdbc.batch_size\`, \`order_inserts\` and \`order_updates\` if you stay on JPA.

### Problem 3: write throughput
Row-by-row \`INSERT\` is dominated by round trips.
* Use **JDBC batching** (\`addBatch\`/\`executeBatch\`) with \`rewriteBatchedStatements=true\` on MySQL.
* For very large loads, \`COPY\` (Postgres) or \`LOAD DATA INFILE\` (MySQL) are an order of magnitude faster than any INSERT path.
* Consider writing to a staging table and doing one set-based \`INSERT ... SELECT\` or \`MERGE\` at the end. Set-based work inside the database beats shipping rows to the JVM and back.

### Problem 4: impact on the live system
* **Throttle deliberately.** Add a small sleep between batches, or a rate limiter. A batch job that finishes in 2 hours without hurting anyone beats one that finishes in 40 minutes and causes an incident.
* **Keep transactions short** — commit per batch. One giant transaction bloats the WAL, blocks vacuum, and causes the replication lag you are seeing.
* **Read from a replica** where correctness allows.
* **Run in a maintenance window** or during the traffic trough.

### Make it restartable
Fifty million rows will fail somewhere. Checkpoint the last processed key after each batch so a restart resumes rather than starting over, and make each batch **idempotent** (upsert rather than insert). Spring Batch gives you chunk-oriented processing, checkpointing and restart semantics out of the box — worth naming as the framework answer.`,
    codeSnippet: `// Keyset pagination: constant cost per page
long lastId = checkpoint.load();
while (true) {
    List<Row> batch = jdbc.query(
        "SELECT id, payload FROM src WHERE id > ? ORDER BY id LIMIT 5000",
        rowMapper, lastId);
    if (batch.isEmpty()) break;

    jdbc.batchUpdate("INSERT INTO dest (id, val) VALUES (?, ?) " +
                     "ON CONFLICT (id) DO UPDATE SET val = EXCLUDED.val",
                     toArgs(transform(batch)));

    lastId = batch.get(batch.size() - 1).id();
    checkpoint.save(lastId);        // restartable
    Thread.sleep(20);               // deliberate throttle
}`,
    pitfalls: [
      'Using OFFSET pagination on a large table.',
      'Letting the persistence context accumulate entities without flush/clear.',
      'Wrapping the whole job in one transaction, bloating the WAL and blocking vacuum.',
      'No checkpointing, so any failure means starting from zero.'
    ],
    followUpQuestions: [
      'Why does Postgres require autocommit off for a streaming ResultSet to actually stream?',
      'When is INSERT ... SELECT inside the database better than any JVM-side approach?',
      'How does Spring Batch implement restartability, and what state does it persist?'
    ],
    faangFocus: 'Data-platform and backend rounds love this. Keyset pagination plus restartable checkpointing is the pair of ideas they are listening for.'
  },
];
