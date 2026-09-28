import type { Question } from '../../types';

/**
 * Databases & persistence, part two: SQL and JPA fundamentals, the
 * Hibernate behaviours that surprise people, and storage-engine internals.
 */
export const PERSISTENCE_MORE_QUESTIONS: Question[] = [
  {
    id: 'per-13',
    categoryId: 'persistence',
    title: 'ACID Explained With a Bank Transfer',
    difficulty: 'Core',
    tags: ['ACID', 'Transactions', 'Basics'],
    scenario: "An interviewer asks you to explain ACID using a transfer of 100 from account A to account B.",
    question: "Define each ACID property and what could go wrong without it.",
    idealAnswer: `### Atomicity
All steps succeed or none do. Debit A and credit B form one unit: if the credit fails, the debit is **rolled back**. Without it, money disappears.

### Consistency
A transaction moves the database from one valid state to another, respecting **constraints** (balance ≥ 0, foreign keys, uniqueness). Largely the application's and schema's job; the database enforces declared constraints.

### Isolation
Concurrent transactions don't interfere in ways that break correctness. Without it, two transfers reading A's balance at the same time could both succeed and overdraw it. Databases offer **levels** (Read Committed, Repeatable Read, Serializable) trading anomalies for concurrency.

### Durability
Once committed, the change survives crashes. Implemented with a **write-ahead log** flushed to disk (\`fsync\`) before acknowledging the commit, plus replication for machine loss.

### In code
\`\`\`java
@Transactional
public void transfer(long from, long to, BigDecimal amount) {
    Account a = repo.findByIdForUpdate(from);
    Account b = repo.findByIdForUpdate(to);
    a.debit(amount);    // throws if insufficient funds -> rollback
    b.credit(amount);
}
\`\`\``,
    pitfalls: [
      "Confusing ACID consistency with CAP consistency.",
      "Assuming the default isolation level prevents all anomalies.",
      "Thinking durability means 'written to memory'.",
    ],
    followUpQuestions: [
      "Which isolation level would you use for the transfer?",
      "How is durability affected by asynchronous replication?",
    ],
    faangFocus: "The opening database question in most interviews.",
  },
  {
    id: 'per-14',
    categoryId: 'persistence',
    title: 'JDBC Fundamentals and Resource Handling',
    difficulty: 'Core',
    tags: ['JDBC', 'PreparedStatement', 'try-with-resources', 'Basics'],
    scenario: "A legacy DAO opens connections manually, builds SQL with string concatenation, and closes resources only on the happy path. The pool runs dry after a few errors.",
    question: "Write correct JDBC code and explain each part.",
    idealAnswer: `### The core objects
* **\`DataSource\`**: a factory for connections, normally backed by a pool (HikariCP). Never use \`DriverManager\` in servers.
* **\`Connection\`**: a session with the database; holds transaction state.
* **\`PreparedStatement\`**: precompiled SQL with \`?\` placeholders. Prevents SQL injection and allows plan reuse.
* **\`ResultSet\`**: a cursor over rows.

### Why the pool ran dry
If an exception occurs before \`close()\`, the connection is **never returned** to the pool. Use **try-with-resources**, which closes in reverse order even when exceptions are thrown.

### Correct code
\`\`\`java
String sql = "SELECT id, total FROM orders WHERE customer_id = ? AND status = ?";
try (Connection c = dataSource.getConnection();
     PreparedStatement ps = c.prepareStatement(sql)) {
    ps.setLong(1, customerId);
    ps.setString(2, "OPEN");
    try (ResultSet rs = ps.executeQuery()) {
        List<OrderRow> out = new ArrayList<>();
        while (rs.next()) out.add(new OrderRow(rs.getLong("id"), rs.getBigDecimal("total")));
        return out;
    }
}
\`\`\`

### Transactions in plain JDBC
\`c.setAutoCommit(false)\`, then \`commit()\` or \`rollback()\` in a catch. In Spring, \`JdbcTemplate\` + \`@Transactional\` does all of this for you.`,
    pitfalls: [
      "Closing resources only on success.",
      "String concatenation for parameters.",
      "Using getDouble for money instead of getBigDecimal.",
    ],
    followUpQuestions: [
      "What does fetch size control?",
      "How does JdbcTemplate map exceptions?",
    ],
    faangFocus: "Basic but essential; resource leaks are a classic production issue.",
  },
  {
    id: 'per-15',
    categoryId: 'persistence',
    title: 'JPA vs Hibernate vs Spring Data JPA',
    difficulty: 'Core',
    tags: ['JPA', 'Hibernate', 'Spring Data', 'ORM'],
    scenario: "A candidate says 'I know Hibernate' and 'I know JPA' as if they were the same thing. The interviewer asks them to clarify.",
    question: "Explain the relationship between JPA, Hibernate and Spring Data JPA.",
    idealAnswer: `### JPA (Jakarta Persistence)
A **specification**: annotations (\`@Entity\`, \`@OneToMany\`), the \`EntityManager\` API, JPQL, the entity lifecycle. No implementation of its own.

### Hibernate ORM
The most popular **implementation** of JPA (others: EclipseLink). It also has **extra features** beyond the spec: its own annotations (\`@BatchSize\`, \`@Formula\`, \`@NaturalId\`), second-level caching integrations, statistics, filters, and multi-tenancy support.

### Spring Data JPA
A layer **on top of JPA** that generates repository implementations from interfaces, derives queries from method names, and adds paging, sorting, specifications and auditing. It uses the \`EntityManager\` underneath, so all JPA/Hibernate behaviour (lazy loading, dirty checking, flushing) still applies.

### Why it matters
Most performance problems (N+1, huge persistence contexts, unexpected updates) come from **JPA/Hibernate semantics**, not from Spring Data. Knowing which layer you're dealing with tells you where to look and which documentation applies.`,
    pitfalls: [
      "Believing Spring Data replaces understanding JPA.",
      "Using Hibernate-specific features while claiming provider independence.",
      "Treating the repository as a DAO without knowing the persistence context exists.",
    ],
    followUpQuestions: [
      "What does the EntityManager do that a repository hides?",
      "When have you needed a Hibernate-specific feature?",
    ],
    faangFocus: "Clarifies vocabulary before deeper persistence questions.",
  },
  {
    id: 'per-16',
    categoryId: 'persistence',
    title: 'Primary Keys: Sequences, IDENTITY and UUIDs',
    difficulty: 'Solid',
    tags: ['Primary Keys', 'UUID', 'Sequences', 'Hibernate'],
    scenario: "A team switches from `GenerationType.IDENTITY` to UUIDs to 'make inserts faster' and notices inserts got slower. Another team can't get Hibernate batch inserts to work at all.",
    question: "Compare key generation strategies and explain both observations.",
    idealAnswer: `### Surrogate vs natural keys
Surrogate keys (generated IDs) are stable and compact; natural keys (email, ISBN) can change and are often wide. Use surrogate primary keys with **unique constraints** on natural keys.

### Generation strategies in JPA
* **\`IDENTITY\`** (auto-increment column): the ID is only known **after the INSERT executes**, so Hibernate must insert immediately and **cannot batch inserts**. That's the second team's problem.
* **\`SEQUENCE\`**: Hibernate fetches IDs from a sequence ahead of time; with an **allocationSize** (e.g. 50) and the pooled optimizer it needs one sequence call per 50 rows. IDs are known before insert, so **JDBC batching works**. Preferred on PostgreSQL and Oracle.
* **UUIDs**: generated in the application, no round trip, globally unique, good for distributed systems and not guessable.

### Why UUIDs slowed inserts
**Random UUIDv4** values scatter inserts across the whole B-tree index: page splits, poor cache locality and index bloat. Sequential keys append to the right edge of the index. **UUIDv7** (time-ordered) fixes most of this while keeping global uniqueness. Also store UUIDs as native \`uuid\`/binary(16), not strings.

### Exposure
Sequential IDs in URLs leak volume information and invite enumeration; expose UUIDs or opaque IDs publicly if that matters.`,
    pitfalls: [
      "IDENTITY with expectations of batch inserts.",
      "Random UUIDv4 primary keys on large, write-heavy tables.",
      "Storing UUIDs as varchar(36).",
    ],
    followUpQuestions: [
      "What does allocationSize do and what happens if it mismatches the sequence increment?",
      "How is UUIDv7 structured?",
    ],
    faangFocus: "A practical schema design question with performance consequences.",
  },
  {
    id: 'per-17',
    categoryId: 'persistence',
    title: 'SQL Joins in Practice',
    difficulty: 'Core',
    tags: ['SQL', 'Joins', 'LEFT JOIN', 'Basics'],
    scenario: "A report of 'customers and their order counts' is missing customers with zero orders, and another query returns duplicate rows after joining two one-to-many tables.",
    question: "Explain join types and fix both issues.",
    idealAnswer: `### Join types
* **INNER JOIN**: only rows with matches on both sides.
* **LEFT (OUTER) JOIN**: all rows from the left table, with NULLs where the right has no match.
* **RIGHT JOIN**: the mirror image (rarely used; rewrite as LEFT).
* **FULL OUTER JOIN**: all rows from both sides.
* **CROSS JOIN**: every combination.

### Missing customers
An inner join drops customers without orders. Use a LEFT JOIN and count a column from the right table (\`COUNT(*)\` would count the NULL row as 1):
\`\`\`sql
SELECT c.id, c.name, COUNT(o.id) AS order_count
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
\`\`\`

### Duplicate rows
Joining a customer to **orders** and to **addresses** (both one-to-many) produces orders x addresses rows per customer: a Cartesian explosion. Aggregate each child separately in subqueries/CTEs, or use \`EXISTS\` when you only need to filter.

### A filter trap
Putting a condition on the right table in \`WHERE\` (\`WHERE o.status = 'OPEN'\`) turns a LEFT JOIN back into an inner join. Put it in the \`ON\` clause instead.`,
    pitfalls: [
      "COUNT(*) with LEFT JOIN.",
      "Joining multiple one-to-many relations at once.",
      "WHERE conditions on the outer side of a LEFT JOIN.",
    ],
    followUpQuestions: [
      "When is EXISTS better than a JOIN?",
      "How does the same Cartesian problem appear in JPA fetch joins?",
    ],
    faangFocus: "SQL basics still frequently tested for backend roles.",
  },
  {
    id: 'per-18',
    categoryId: 'persistence',
    title: 'Normalisation vs Denormalisation',
    difficulty: 'Core',
    tags: ['Normalization', 'Denormalization', 'Schema Design'],
    scenario: "An orders table stores the customer's name and address on every row. When customers change their address, some old orders show the new address and some the old.",
    question: "Explain normalisation, when to denormalise, and whether this schema is wrong.",
    idealAnswer: `### Normalisation
Organise data so each fact is stored **once**, removing update anomalies:
* **1NF**: atomic values, no repeating groups.
* **2NF**: no partial dependency on part of a composite key.
* **3NF**: no transitive dependencies (non-key columns depend only on the key).
Customer details belong in a \`customer\` table referenced by \`customer_id\`.

### But: point-in-time data is not duplication
An order's **shipping address at the time of purchase** is a different fact from the customer's **current** address. Storing a snapshot on the order is correct; it must just be written once and **never updated** from the customer record. The bug here is that some process updated old orders.

### When to denormalise deliberately
* Read-heavy paths where joins are too expensive (pre-computed counts, reporting tables, search indexes).
* Historical snapshots (prices, addresses at order time).
* Analytics (star schemas).
Keep a clear source of truth and a mechanism to update copies (triggers, events, CDC), and accept the consistency cost knowingly.`,
    pitfalls: [
      "Updating historical snapshots when master data changes.",
      "Premature denormalisation without measured need.",
      "Over-normalising into dozens of tiny tables that are always joined.",
    ],
    followUpQuestions: [
      "How would you keep a denormalised order count up to date?",
      "What is a star schema?",
    ],
    faangFocus: "Classic schema design question with a subtle real-world twist.",
  },
  {
    id: 'per-19',
    categoryId: 'persistence',
    title: 'Lazy vs Eager Fetching and LazyInitializationException',
    difficulty: 'Solid',
    tags: ['Lazy Loading', 'FetchType', 'LazyInitializationException', 'JPA'],
    scenario: "Returning an entity from a controller throws `LazyInitializationException: could not initialize proxy - no Session`. A developer changes every relationship to `FetchType.EAGER` and the app gets much slower.",
    question: "Explain lazy loading, why the exception happens, and the right fixes.",
    idealAnswer: `### Lazy loading
With \`FetchType.LAZY\`, associations are **proxies** or uninitialised collections. The SQL runs when you first access them, which requires an **open persistence context** (session).

Defaults: \`@ManyToOne\` and \`@OneToOne\` are **EAGER** by default (a common trap); \`@OneToMany\` and \`@ManyToMany\` are LAZY.

### Why the exception
The transaction and persistence context closed when the service method returned. Jackson then serialised the entity, touched a lazy collection, and there was no session left.

### Why EAGER everywhere is worse
EAGER loads associations **every time**, whether needed or not, often via extra queries (N+1) or huge joins. It can't be turned off per query.

### Correct fixes
* Load what the use case needs **inside the transaction**: \`JOIN FETCH\`, \`@EntityGraph\`, or batch fetching (\`@BatchSize\`, \`hibernate.default_batch_fetch_size\`).
* Return **DTOs/projections** from the service layer instead of entities.
* Make \`@ManyToOne\` explicitly \`LAZY\`.
* Don't rely on Open Session in View to hide it.`,
    pitfalls: [
      "Switching to EAGER to silence the exception.",
      "Serialising entities directly in controllers.",
      "Forgetting that ToOne associations are eager by default.",
    ],
    followUpQuestions: [
      "What does hibernate.default_batch_fetch_size do?",
      "How do you fetch two collections without a Cartesian product?",
    ],
    faangFocus: "Top JPA interview question; the default-eager ToOne detail is a bonus.",
  },
  {
    id: 'per-20',
    categoryId: 'persistence',
    title: 'Mapping Relationships: Owning Side and mappedBy',
    difficulty: 'Solid',
    tags: ['JPA', '@OneToMany', 'mappedBy', 'Bidirectional'],
    scenario: "Adding an `OrderLine` to `order.getLines()` and saving the order doesn't persist the foreign key; the line's `order_id` stays null.",
    question: "Explain owning vs inverse sides in JPA relationships and fix the bug.",
    idealAnswer: `### The owning side controls the foreign key
In a bidirectional \`@OneToMany\`/\`@ManyToOne\`, the side with the **foreign key column** (\`OrderLine.order\`, the \`@ManyToOne\`) is the **owning side**. The \`@OneToMany(mappedBy = "order")\` side is the **inverse**: JPA **ignores** it when writing the foreign key.

### The bug
The code added the line to \`order.lines\` but never set \`line.order\`. The owning side was null, so \`order_id\` was null.

### Keep both sides in sync
Add helper methods on the parent:
\`\`\`java
@Entity
class Order {
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> lines = new ArrayList<>();

    public void addLine(OrderLine line) { lines.add(line); line.setOrder(this); }
    public void removeLine(OrderLine line) { lines.remove(line); line.setOrder(null); }
}
\`\`\`

### Other mapping advice
* Prefer **bidirectional** \`@OneToMany\` with \`mappedBy\`, or just a unidirectional \`@ManyToOne\`. Unidirectional \`@OneToMany\` without \`@JoinColumn\` creates a **join table** and extra statements.
* For \`@ManyToMany\`, use a \`Set\` and consider mapping the join table as its own entity when it has attributes.`,
    pitfalls: [
      "Only updating the inverse side.",
      "Unidirectional @OneToMany creating an unexpected join table.",
      "List-based @ManyToMany causing delete-all-and-reinsert behaviour.",
    ],
    followUpQuestions: [
      "Why does Hibernate delete and reinsert all rows for some List mappings?",
      "When would you model a join table as an entity?",
    ],
    faangFocus: "A common JPA mapping mistake that interviewers like to probe.",
  },
  {
    id: 'per-21',
    categoryId: 'persistence',
    title: 'Cascade Types and orphanRemoval',
    difficulty: 'Solid',
    tags: ['Cascade', 'orphanRemoval', 'JPA', 'Aggregates'],
    scenario: "Deleting a `Customer` also deleted a shared `Country` entity used by thousands of other customers, because someone put `cascade = CascadeType.ALL` on `@ManyToOne country`.",
    question: "What do cascade types and orphanRemoval do, and how do you choose them safely?",
    idealAnswer: `### Cascading
Cascade propagates entity-manager operations (\`PERSIST\`, \`MERGE\`, \`REMOVE\`, \`REFRESH\`, \`DETACH\`, or \`ALL\`) from a parent to associated entities.
* Saving an \`Order\` also persists its new \`OrderLines\` (\`PERSIST\`).
* Removing the \`Order\` removes its lines (\`REMOVE\`).

### orphanRemoval
Deletes a child when it is **removed from the parent's collection** (or the reference is set to null), not just when the parent is deleted. Right for children that can't exist on their own.

### The rule of thumb
Cascade only **from an aggregate root to the entities it owns** (parent → children in a composition). Never cascade:
* on \`@ManyToOne\` towards shared reference data (the Country bug);
* across aggregate boundaries (Order → Customer).

### Performance notes
\`CascadeType.REMOVE\` loads each child and deletes it one by one. For large collections, bulk delete with a query or rely on \`ON DELETE CASCADE\` in the database (keeping the persistence context in mind).`,
    pitfalls: [
      "CascadeType.ALL copied onto every relationship.",
      "Cascading REMOVE on @ManyToOne.",
      "Expecting orphanRemoval to work on reassigning a whole new collection instance.",
    ],
    followUpQuestions: [
      "What's the difference between orphanRemoval and CascadeType.REMOVE?",
      "Why can replacing the collection instance break orphanRemoval?",
    ],
    faangFocus: "Practical JPA safety knowledge.",
  },
  {
    id: 'per-22',
    categoryId: 'persistence',
    title: 'equals and hashCode for JPA Entities',
    difficulty: 'Hard',
    tags: ['JPA', 'equals', 'hashCode', 'Entities'],
    scenario: "New entities added to a `HashSet` before persisting 'disappear' from the set after `persist()`, and Lombok's `@Data` on entities triggers lazy loading and stack overflows.",
    question: "How should equals and hashCode be implemented for JPA entities?",
    idealAnswer: `### Why it's hard
An entity's identity is its database ID, but a **new** entity has no ID until persisted (or flushed, for IDENTITY). If \`hashCode\` uses the ID, it **changes** after persist, so the entity sits in the wrong HashSet bucket and can't be found: the 'disappearing' bug.

### Options
* **Business/natural key** (\`isbn\`, \`email\`) that is immutable and set at creation: use it for equals/hashCode. Cleanest if you have one.
* **Application-assigned ID** (UUID generated in the constructor): stable from the start, so equals/hashCode on the ID just works.
* **Generated ID** with a stable hash: \`equals\` compares IDs only when **both are non-null**; \`hashCode\` returns a **constant per class** (\`getClass().hashCode()\`). Constant hashes make big hash sets slower, but entity collections are usually small.

### Handle proxies
Compare with \`Hibernate.getClass(o)\` / \`instanceof\` rather than \`getClass() ==\`, since lazy proxies are subclasses.

### Why @Data is dangerous
Lombok's \`@Data\`/\`@EqualsAndHashCode\` includes **all fields**, including lazy collections (triggering loads or exceptions) and bidirectional references (infinite recursion). \`toString\` has the same problem.`,
    codeSnippet: `@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Book other)) return false;
    return id != null && id.equals(other.getId());
}

@Override public int hashCode() { return getClass().hashCode(); }`,
    pitfalls: [
      "hashCode based on a generated ID.",
      "Including collections or lazy associations in equals/hashCode/toString.",
      "getClass() comparisons that fail for Hibernate proxies.",
    ],
    followUpQuestions: [
      "When is the default Object identity equality acceptable for entities?",
      "Why is a constant hashCode acceptable here?",
    ],
    faangFocus: "Deep JPA question that separates experienced users.",
  },
  {
    id: 'per-23',
    categoryId: 'persistence',
    title: 'JPQL, Criteria, Native Queries and DTO Projections',
    difficulty: 'Solid',
    tags: ['JPQL', 'Criteria API', 'Native Queries', 'Projections'],
    scenario: "A dashboard query loads 5,000 full `Order` entities with their lines just to display ID, date and total, and takes 4 seconds.",
    question: "Compare the query options in JPA and choose the right one for this dashboard.",
    idealAnswer: `### JPQL
Object-oriented query language over entities: portable, type-aware joins through mapped associations. Good default for most queries.

### Criteria API
Programmatic, type-safe (with the metamodel) query building for **dynamic** filters. Verbose; Spring Data **Specifications** or **Querydsl** make it bearable.

### Native SQL
Full database power: window functions, CTEs, vendor-specific features, hints. Loses portability and entity-level abstraction; results can still map to DTOs.

### Projections for read-only screens
Loading entities means: all columns, entity instantiation, **dirty-checking snapshots** in the persistence context, and possibly lazy loads. For a dashboard, select only the needed columns into a DTO:
\`\`\`java
record OrderSummary(Long id, Instant createdAt, BigDecimal total) {}

@Query("""
       select new com.acme.OrderSummary(o.id, o.createdAt, o.total)
       from Order o where o.customer.id = :customerId
       order by o.createdAt desc""")
List<OrderSummary> summaries(long customerId, Pageable page);
\`\`\`
Also consider \`readOnly\` transactions and pagination.

### Rule of thumb
Entities for **writes** (use cases that change state); projections for **reads** that feed screens and APIs.`,
    pitfalls: [
      "Loading full entity graphs for list views.",
      "String-built JPQL with user input (injection).",
      "Native queries returning entities that then get dirty-checked.",
    ],
    followUpQuestions: [
      "How do interface-based projections work in Spring Data?",
      "When would you use a database view?",
    ],
    faangFocus: "Common performance question in JPA-heavy codebases.",
  },
  {
    id: 'per-24',
    categoryId: 'persistence',
    title: 'Hibernate First-Level, Second-Level and Query Caches',
    difficulty: 'Solid',
    tags: ['Hibernate', 'Caching', 'Persistence Context', 'Second-Level Cache'],
    scenario: "A developer enables the second-level cache and query cache for everything to fix slow pages. Soon users see stale data, and memory usage climbs.",
    question: "Explain Hibernate's cache layers and when each is appropriate.",
    idealAnswer: `### First-level cache (persistence context)
Always on, **per EntityManager/transaction**. Loading the same entity twice in one transaction returns the same instance without a second query. It's also the basis for dirty checking. Not a performance cache across requests.

### Second-level cache (L2)
Optional, **shared across sessions** (per application instance, or distributed with providers like Infinispan, Hazelcast, Redis via JCache). Caches entity **data by ID**. Configured per entity with \`@Cache(usage = READ_WRITE / READ_ONLY / NONSTRICT_READ_WRITE)\`.
Good for **read-mostly reference data** (countries, product categories, configuration). Poor for frequently updated data or data changed outside Hibernate (other services, SQL scripts) since the cache won't know.

### Query cache
Caches **IDs returned by a query** for given parameters; entities are then looked up in L2. It's invalidated whenever **any** table involved changes, so on write-heavy tables it's pure overhead.

### Guidance
Fix queries first (projections, indexes, fetch plans). Cache selectively where data is read-mostly, with bounded size and TTLs. In multi-instance deployments, a local L2 cache needs invalidation across nodes or it serves stale data.`,
    pitfalls: [
      "Enabling query cache globally.",
      "Caching entities updated by other systems.",
      "Assuming the first-level cache spans requests.",
    ],
    followUpQuestions: [
      "How does READ_WRITE concurrency strategy avoid stale reads?",
      "Would you use L2 cache or an application-level cache like Caffeine?",
    ],
    faangFocus: "Standard Hibernate knowledge with an operational twist.",
  },
  {
    id: 'per-25',
    categoryId: 'persistence',
    title: 'Making Hibernate Batch Inserts Actually Batch',
    difficulty: 'Hard',
    tags: ['Batching', 'Hibernate', 'Performance', 'saveAll'],
    scenario: "`repository.saveAll(list)` with 100,000 entities takes 3 minutes and SQL logs show 100,000 individual INSERT statements.",
    question: "Why isn't it batching, and what settings and code changes fix it?",
    idealAnswer: `### Checklist
1. **Enable JDBC batching**: \`spring.jpa.properties.hibernate.jdbc.batch_size=50\` (off by default).
2. **Don't use IDENTITY** generation: Hibernate must execute each insert immediately to get the ID, which **silently disables batching**. Use a \`SEQUENCE\` with a pooled allocation size, or application-assigned UUIDs.
3. **Order statements**: \`hibernate.order_inserts=true\` and \`order_updates=true\` group statements by table so batches aren't broken when entities of different types interleave.
4. **Flush and clear periodically**: the persistence context holds all 100,000 entities and their snapshots; flushing and clearing every batch keeps memory flat and dirty checking cheap.
5. **Driver-level rewrite**: PostgreSQL \`reWriteBatchedInserts=true\` or MySQL \`rewriteBatchedStatements=true\` turns a batch into multi-row INSERTs, often another 2-5x.

### Code
\`\`\`java
@Transactional
public void importAll(List<Product> products) {
    for (int i = 0; i < products.size(); i++) {
        em.persist(products.get(i));
        if (i % 50 == 49) { em.flush(); em.clear(); }
    }
}
\`\`\`

### When to skip JPA
For millions of rows, \`JdbcTemplate.batchUpdate\`, PostgreSQL \`COPY\`, or bulk loaders are much faster and avoid entity overhead entirely.

### Verifying
Look at datasource-proxy or \`hibernate.generate_statistics\` output to confirm batch counts; SQL logs alone show individual statements even when batched.`,
    pitfalls: [
      "IDENTITY IDs with batching expectations.",
      "Never clearing the persistence context.",
      "Assuming SQL logs prove batching isn't happening.",
    ],
    followUpQuestions: [
      "What does saveAll do for entities with assigned IDs (merge vs persist)?",
      "How would you batch updates of existing rows?",
    ],
    faangFocus: "A practical Hibernate performance question with several layers.",
  },
  {
    id: 'per-26',
    categoryId: 'persistence',
    title: 'Reading an EXPLAIN Plan',
    difficulty: 'Solid',
    tags: ['EXPLAIN', 'Query Plans', 'PostgreSQL', 'Performance'],
    scenario: "A query filtering orders by customer and status takes 2 seconds. You run `EXPLAIN ANALYZE` and get a plan with a `Seq Scan`, `Rows Removed by Filter: 4,999,120`, and an estimate of 10 rows vs 880 actual.",
    question: "How do you read this plan and what would you do?",
    idealAnswer: `### Reading plans (PostgreSQL)
* Plans are trees; read from the **innermost** node outward. Each node shows estimated cost and rows, and with \`ANALYZE\`, **actual time, rows and loops**.
* **Seq Scan**: reads the whole table. Fine for small tables or when most rows match; bad here, where 99.98% of rows are thrown away.
* **Index Scan / Index Only Scan / Bitmap Index Scan**: uses an index; index-only scans avoid touching the table at all.
* Join nodes: **Nested Loop** (good for few outer rows), **Hash Join**, **Merge Join**.
* **Estimates vs actuals**: large mismatches (10 vs 880) mean the planner had bad statistics and may choose poor strategies.

### Actions
1. Add a **composite index** matching the filter: \`(customer_id, status)\`, possibly including columns needed by the SELECT for an index-only scan.
2. Refresh statistics: \`ANALYZE orders\`; for correlated columns, **extended statistics** (\`CREATE STATISTICS\`).
3. Re-run \`EXPLAIN (ANALYZE, BUFFERS)\` to confirm reduced buffers read.

### Also check
Functions on columns (\`WHERE lower(email) = ...\` needs an expression index), implicit type casts, leading wildcards in LIKE, and OR conditions that defeat indexes.`,
    pitfalls: [
      "Using EXPLAIN without ANALYZE and trusting estimates.",
      "Adding single-column indexes for multi-column filters.",
      "Running EXPLAIN ANALYZE on writes in production (it executes them).",
    ],
    followUpQuestions: [
      "What does BUFFERS tell you?",
      "When would the planner correctly ignore your index?",
    ],
    faangFocus: "Hands-on database performance skill expected at senior level.",
  },
  {
    id: 'per-27',
    categoryId: 'persistence',
    title: 'Database Deadlocks',
    difficulty: 'Hard',
    tags: ['Deadlocks', 'Locking', 'Transactions', 'Retries'],
    scenario: "During peak hours, the logs show 'deadlock detected' errors from PostgreSQL when two transfer requests between the same accounts run at the same time in opposite directions.",
    question: "Explain how database deadlocks occur and how to prevent and handle them.",
    idealAnswer: `### How it happens
* Transaction 1 (A→B) locks account A's row, then tries to lock B.
* Transaction 2 (B→A) locks B, then tries to lock A.
Each waits for the other. The database's deadlock detector notices the cycle and **aborts one** transaction with an error; the other proceeds.

### Prevention
* **Consistent lock ordering**: always lock rows in a deterministic order (e.g. by account ID ascending), regardless of transfer direction. This removes cycles.
* **Lock everything up front**: \`SELECT ... WHERE id IN (:a, :b) ORDER BY id FOR UPDATE\`.
* **Keep transactions short**: no remote calls or user interaction while holding locks.
* Watch for hidden locks: foreign key checks, unique index inserts, and \`UPDATE\` statements touching rows in different orders (e.g. bulk updates without ORDER BY).

### Handling
Deadlocks can't always be eliminated. Treat the deadlock error (SQLState \`40P01\` in PostgreSQL) as **retryable**: retry the whole transaction with backoff, which requires the operation to be idempotent or fully transactional.

### Diagnosis
PostgreSQL logs the involved queries (\`log_lock_waits\`, deadlock details); monitor \`pg_locks\` / \`pg_stat_activity\` for lock waits.`,
    pitfalls: [
      "Locking rows in request-dependent order.",
      "Retrying only part of a transaction.",
      "Long transactions that hold locks during network calls.",
    ],
    followUpQuestions: [
      "How would you implement the retry in Spring?",
      "Can optimistic locking deadlock?",
    ],
    faangFocus: "A practical concurrency question at the database level.",
  },
  {
    id: 'per-28',
    categoryId: 'persistence',
    title: 'MVCC, VACUUM and Table Bloat in PostgreSQL',
    difficulty: 'Hard',
    tags: ['PostgreSQL', 'MVCC', 'VACUUM', 'Bloat'],
    scenario: "A table with 1 million rows that are updated constantly occupies 40GB on disk, queries keep getting slower, and a long-running analytics transaction has been open for 6 hours.",
    question: "Explain PostgreSQL MVCC and how it leads to this situation.",
    idealAnswer: `### MVCC in PostgreSQL
Readers don't block writers and vice versa because each row can have **multiple versions** (tuples). An \`UPDATE\` doesn't overwrite in place: it writes a **new tuple** and marks the old one dead (setting \`xmax\`). Each transaction sees the versions visible to its **snapshot**.

### Dead tuples and VACUUM
Old versions can only be removed once **no running transaction could still see them**. **VACUUM** (usually autovacuum) reclaims their space for reuse (not returned to the OS, except by \`VACUUM FULL\` or tools like pg_repack) and updates the visibility map for index-only scans.

### What went wrong
* Constant updates create dead tuples quickly.
* The **6-hour open transaction** holds back the "oldest visible" horizon, so VACUUM **can't remove anything** newer than its snapshot. Dead tuples accumulate: **bloat** (40GB for 1M rows), and every scan reads more pages.

### Fixes
* Kill or avoid long-running transactions on the primary; run analytics on a replica (with care: \`hot_standby_feedback\` pushes the problem back).
* Tune autovacuum for hot tables (lower \`autovacuum_vacuum_scale_factor\`, higher cost limit).
* Use \`fillfactor\` < 100 to enable **HOT updates** (no index updates when indexed columns don't change).
* Reclaim existing bloat with \`pg_repack\` (online) rather than \`VACUUM FULL\` (locks the table).
* Monitor \`n_dead_tup\`, oldest transaction age, and **transaction ID wraparound** risk.`,
    pitfalls: [
      "Idle-in-transaction sessions left open by applications.",
      "Disabling autovacuum.",
      "VACUUM FULL on a busy production table.",
    ],
    followUpQuestions: [
      "What is transaction ID wraparound?",
      "How does MySQL InnoDB's undo-log MVCC differ?",
    ],
    faangFocus: "Deep operational PostgreSQL knowledge, highly valued for senior backend roles.",
  },
  {
    id: 'per-29',
    categoryId: 'persistence',
    title: 'Designing Indexes: Column Order, Covering and Partial Indexes',
    difficulty: 'Hard',
    tags: ['Indexes', 'Composite Index', 'Covering Index', 'Partial Index'],
    scenario: "An orders table has separate indexes on `customer_id`, `status` and `created_at`. The main query `WHERE customer_id = ? AND status = 'OPEN' ORDER BY created_at DESC LIMIT 20` is still slow.",
    question: "Design the right index and explain the principles.",
    idealAnswer: `### Composite index column order
A B-tree index on \`(a, b, c)\` is sorted by a, then b, then c. It serves queries that constrain a **leftmost prefix**.
Rules of thumb:
1. **Equality** columns first.
2. Then the **sort** or **range** column.
For this query: \`CREATE INDEX ON orders (customer_id, status, created_at DESC);\` The database seeks directly to (customer, OPEN), reads rows already in \`created_at\` order and stops after 20: no sort, no scanning of other customers.

Separate single-column indexes can only be combined with bitmap operations, which can't provide the ordering, so the database must fetch and sort.

### Covering indexes
If the index includes every column the query needs, the database answers from the index alone (index-only scan). In PostgreSQL: \`INCLUDE (total)\` adds non-key columns without affecting ordering.

### Partial indexes
If queries mostly target OPEN orders (a small fraction), index only those rows:
\`CREATE INDEX ON orders (customer_id, created_at DESC) WHERE status = 'OPEN';\`
Smaller, faster, cheaper to maintain.

### Costs
Every index slows writes and uses memory/disk. Remove unused indexes (\`pg_stat_user_indexes\`) and avoid redundant ones (an index on \`(a)\` is redundant with \`(a, b)\`).`,
    pitfalls: [
      "Many single-column indexes instead of one well-ordered composite.",
      "Putting the range column before equality columns.",
      "Never removing unused indexes.",
    ],
    followUpQuestions: [
      "When would you use a hash, GIN or BRIN index?",
      "How does low selectivity affect index usefulness?",
    ],
    faangFocus: "Applied indexing skill, frequently tested with a concrete query.",
  },
  {
    id: 'per-30',
    categoryId: 'persistence',
    title: 'Job Queues With SELECT FOR UPDATE SKIP LOCKED',
    difficulty: 'Hard',
    tags: ['SKIP LOCKED', 'Job Queue', 'PostgreSQL', 'Concurrency'],
    scenario: "Ten worker instances poll a `jobs` table. With a plain `SELECT ... FOR UPDATE`, workers block each other and throughput is terrible; without locking, jobs get processed twice.",
    question: "How does SKIP LOCKED solve this, and how do you build a robust DB-backed queue?",
    idealAnswer: `### The pattern
\`\`\`sql
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'PENDING' AND run_at <= now()
  ORDER BY run_at
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs SET status = 'RUNNING', locked_by = :worker, locked_until = now() + interval '5 minutes'
FROM next WHERE jobs.id = next.id
RETURNING jobs.*;
\`\`\`
\`FOR UPDATE\` locks the selected rows; **\`SKIP LOCKED\`** makes other workers **skip** rows already locked instead of waiting. Each worker grabs a different batch concurrently.

### Robustness
* **Lease timeout**: if a worker dies, \`locked_until\` expires and a reaper resets the job (or the query also picks expired RUNNING jobs).
* **At-least-once**: a job can run twice after a lease expiry, so handlers must be idempotent.
* **Retries and dead jobs**: attempts counter, exponential backoff via \`run_at\`, and a failed state after N attempts.
* **Index**: partial index on \`(run_at) WHERE status = 'PENDING'\`.
* **Short transactions**: claim in one transaction, process outside it, then mark done. Don't hold row locks while processing.

### When it fits
Moderate throughput (hundreds to thousands of jobs/s) with transactional enqueueing alongside business data (same DB transaction as the order insert). Libraries: JobRunr, db-scheduler, Quartz JDBC store. For very high throughput or fan-out, use a real broker.`,
    pitfalls: [
      "Holding the lock for the whole job duration.",
      "No lease or recovery for crashed workers.",
      "Missing index causing sequential scans on every poll.",
    ],
    followUpQuestions: [
      "How would you add priorities?",
      "How do you avoid polling with LISTEN/NOTIFY?",
    ],
    faangFocus: "A practical pattern many teams use; knowing it signals database fluency.",
  },
  {
    id: 'per-31',
    categoryId: 'persistence',
    title: 'Lost Updates, Write Skew and Serializable Isolation',
    difficulty: 'Expert',
    tags: ['Isolation', 'Write Skew', 'SSI', 'Lost Update'],
    scenario: "A hospital rota requires at least one doctor on call. Two doctors each check 'is someone else on call?' in separate transactions, both see yes, both go off call. The invariant is broken under Repeatable Read.",
    question: "Name this anomaly, explain why Repeatable Read allows it, and how to prevent it.",
    idealAnswer: `### Lost update vs write skew
* **Lost update**: two transactions read the same row, modify, and write back; one overwrites the other. Prevented by \`SELECT FOR UPDATE\`, atomic updates (\`SET x = x + 1\`), or optimistic version checks. PostgreSQL's Repeatable Read detects concurrent updates to the **same row** and aborts one.
* **Write skew**: two transactions read an **overlapping set**, then each updates a **different row** based on what it read. No row is written by both, so row-level conflict detection doesn't trigger. That's the doctors case.

### Why Repeatable Read allows it
Snapshot isolation gives each transaction a consistent snapshot and only checks **write-write** conflicts. The invariant depends on rows the other transaction wrote, which neither saw.

### Prevention
* **SERIALIZABLE**: PostgreSQL implements **Serializable Snapshot Isolation (SSI)**, tracking read/write dependencies and aborting one transaction when a dangerous pattern forms. Retry on serialization failure (\`40001\`).
* **Materialise the conflict**: lock the rows you read (\`SELECT ... FOR UPDATE\` on all on-call doctors for that shift), or lock a shared parent row (the shift).
* **Constraints** where expressible (exclusion constraints, unique partial indexes).

### Other write-skew examples
Double-booking meeting rooms, usernames checked then inserted (use a unique constraint), spending from multiple accounts with a combined limit.`,
    pitfalls: [
      "Assuming Repeatable Read equals serializability.",
      "Using SERIALIZABLE without retry logic.",
      "Check-then-insert patterns without constraints.",
    ],
    followUpQuestions: [
      "What is a phantom and how does it relate to write skew?",
      "How does MySQL's Repeatable Read differ (gap locks)?",
    ],
    faangFocus: "Isolation-level depth expected for senior data-intensive roles.",
  },
  {
    id: 'per-32',
    categoryId: 'persistence',
    title: 'Soft Deletes: Pros, Cons and Alternatives',
    difficulty: 'Solid',
    tags: ['Soft Delete', 'Schema Design', 'GDPR', 'Unique Constraints'],
    scenario: "A team adds a `deleted` flag to every table. Months later, unique email constraints block re-registration, queries forget the filter and show deleted data, and legal asks for real erasure under GDPR.",
    question: "Evaluate soft deletes and describe better options.",
    idealAnswer: `### Why teams use them
Undo/restore, audit history, and keeping foreign key references intact.

### The problems
* **Every query must filter** \`deleted = false\`. Missing it leaks deleted data. Hibernate's \`@SoftDelete\` (6.4+) or \`@SQLRestriction\` helps but native queries and reports still slip.
* **Unique constraints** break: a deleted user's email blocks re-registration. Fix with **partial unique indexes** (\`WHERE deleted = false\`).
* Tables and indexes grow with dead data; performance degrades.
* **Legal erasure** (GDPR right to be forgotten) isn't satisfied by a flag.
* Cascading semantics become manual.

### Alternatives
* **Archive tables**: move deleted rows to \`orders_archive\` (or an audit log) on delete. Live tables stay clean.
* **Audit/history tables** or event logs (Envers, CDC to a warehouse) for 'who changed what'.
* **Status fields** that model real business states (\`CANCELLED\`, \`CLOSED\`) instead of a generic 'deleted'.
* For GDPR, true deletion or anonymisation of personal data, possibly crypto-shredding (delete the per-user key).

### When soft delete is fine
Small admin-managed datasets with a real 'restore' requirement, implemented with partial indexes and centralised filtering.`,
    pitfalls: [
      "Global unique constraints on soft-deleted tables.",
      "Relying on every developer to remember the filter.",
      "Treating a deleted flag as GDPR erasure.",
    ],
    followUpQuestions: [
      "How would you implement restore with an archive table?",
      "What is crypto-shredding?",
    ],
    faangFocus: "A design judgement question drawn from common real-world regret.",
  },
  {
    id: 'per-33',
    categoryId: 'persistence',
    title: 'Auditing and Temporal Data',
    difficulty: 'Hard',
    tags: ['Auditing', 'Envers', 'Temporal Tables', 'History'],
    scenario: "Compliance asks: 'Show us what this customer's credit limit was on March 3rd and who changed it.' The system only stores the current value.",
    question: "What are the options for auditing and historical queries?",
    idealAnswer: `### Simple auditing columns
\`created_at\`, \`created_by\`, \`updated_at\`, \`updated_by\` (Spring Data's \`@CreatedDate\`, \`@LastModifiedBy\`). Tells you the **latest** change only.

### History tables
Keep every version:
* **Hibernate Envers**: \`@Audited\` entities get \`_AUD\` tables and a revision table (who, when). Query past states with \`AuditReader\`.
* **Database triggers** writing to history tables: captures changes made outside the application too.
* **SQL:2011 system-versioned tables** (MariaDB, SQL Server, DB2; PostgreSQL via extensions): \`FOR SYSTEM_TIME AS OF '2024-03-03'\`.
* **CDC** (Debezium) streaming changes to an audit store or warehouse.

### Bitemporal data
Two time axes:
* **Valid time**: when the fact was true in the real world (credit limit effective from April 1).
* **Transaction time**: when the system recorded it (entered on March 28, corrected on April 5).
Needed in finance and insurance to answer 'what did we believe on date X about date Y'.

### Event sourcing
Storing every change as an event makes history first-class, at the cost of complexity; justified when history is central to the domain.

### Practical design
Immutable history rows, include the actor and reason, index by entity ID and time, and define retention (history can be larger than the live data).`,
    pitfalls: [
      "Only storing updated_at/updated_by and calling it an audit trail.",
      "Application-only auditing missing direct DB changes.",
      "Confusing valid time with transaction time.",
    ],
    followUpQuestions: [
      "How would you query 'as of' a date with Envers?",
      "When is event sourcing worth it for audit needs?",
    ],
    faangFocus: "Relevant for fintech, healthcare and any regulated domain.",
  },
  {
    id: 'per-34',
    categoryId: 'persistence',
    title: 'Table Partitioning and Partition Pruning',
    difficulty: 'Expert',
    tags: ['Partitioning', 'PostgreSQL', 'Partition Pruning', 'Data Retention'],
    scenario: "An events table grows by 200 million rows a month. Deleting data older than 13 months takes hours and bloats the table, and queries on recent data slow down as the table grows.",
    question: "How would you use partitioning here, and what are the pitfalls?",
    idealAnswer: `### Declarative partitioning (PostgreSQL)
The parent table is split into child **partitions** by a key:
* **Range** (by \`created_at\` month): ideal for time-series.
* **List** (by region, tenant tier).
* **Hash** (spread load evenly).

\`\`\`sql
CREATE TABLE events (id bigint, created_at timestamptz NOT NULL, payload jsonb)
  PARTITION BY RANGE (created_at);
CREATE TABLE events_2025_06 PARTITION OF events
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
\`\`\`

### Benefits here
* **Retention**: \`DROP TABLE events_2024_05\` (or \`DETACH PARTITION\`) is instant, with no bloat. Huge win over \`DELETE\`.
* **Partition pruning**: queries filtering on \`created_at\` only touch relevant partitions.
* Smaller per-partition indexes; maintenance (VACUUM, reindex) per partition.

### Pitfalls
* Queries that **don't filter on the partition key** scan all partitions (plus planning overhead with many partitions).
* Primary keys and unique constraints **must include the partition key**.
* Too many partitions (thousands) hurt planning time; choose a sensible granularity.
* Automate partition creation ahead of time (\`pg_partman\`) or inserts fail.

### Partitioning is not sharding
All partitions still live on one server. It helps manageability and pruning, not write scalability beyond one node.`,
    pitfalls: [
      "Partition key not used in common queries.",
      "Forgetting to pre-create future partitions.",
      "Expecting partitioning to scale writes across machines.",
    ],
    followUpQuestions: [
      "How do global unique IDs work across partitions?",
      "How would you migrate an existing large table to a partitioned one online?",
    ],
    faangFocus: "Expert data-management question for high-volume systems.",
  },
  {
    id: 'per-35',
    categoryId: 'persistence',
    title: 'Hibernate Flush Order and Surprising Constraint Violations',
    difficulty: 'Expert',
    tags: ['Hibernate', 'Flush', 'Action Queue', 'Unique Constraints'],
    scenario: "Code deletes an entity with a unique `code` and then persists a new one with the same `code` in the same transaction. The commit fails with a unique constraint violation, even though the delete came first in the code.",
    question: "Why, and how does Hibernate decide the order of SQL statements?",
    idealAnswer: `### Write-behind and the action queue
Hibernate doesn't execute SQL when you call \`persist\` or \`remove\`. It queues actions and executes them at **flush** (before commit, before some queries, or on explicit \`flush()\`). At flush it executes in a **fixed order by type**, not the order you called them:
1. Inserts
2. Updates
3. Collection element removals
4. Collection element inserts/updates
5. **Deletes**

So the **INSERT** of the new entity runs **before** the **DELETE** of the old one, and the unique constraint fires.

### Fixes
* Call \`em.flush()\` (or \`repository.flush()\`) after the remove, forcing the delete first.
* Better: **update the existing row** instead of delete + insert, if it represents the same thing.
* Or make the constraint **deferrable** (\`DEFERRABLE INITIALLY DEFERRED\` in PostgreSQL) so it's checked at commit.

### Related flush behaviours
* **AUTO flush mode**: Hibernate flushes before a JPQL query that touches affected tables, so queries see pending changes (native queries may trigger a full flush).
* Bulk JPQL updates/deletes bypass the persistence context: loaded entities become stale; clear the context afterwards.
* Exceptions often surface at flush/commit, far from the line that caused them, which makes stack traces confusing.`,
    pitfalls: [
      "Assuming SQL runs in method-call order.",
      "Delete-then-insert patterns for 'replacing' rows.",
      "Mixing bulk updates with managed entities.",
    ],
    followUpQuestions: [
      "When does AUTO flush happen before native queries?",
      "How would you replace all children of an entity efficiently?",
    ],
    faangFocus: "Deep Hibernate internals that explain confusing production errors.",
  },
  {
    id: 'per-36',
    categoryId: 'persistence',
    title: 'Connection Leaks and Idle-in-Transaction Sessions',
    difficulty: 'Hard',
    tags: ['Connection Leaks', 'HikariCP', 'Transactions', 'Monitoring'],
    scenario: "Every few days, a service starts timing out with `Connection is not available, request timed out after 30000ms`. The database shows dozens of sessions in state `idle in transaction`.",
    question: "What's happening and how do you find and fix it?",
    idealAnswer: `### Two related problems
* **Leaked connections**: code borrowed a connection and never returned it (no try-with-resources, a streamed result never closed, a manually managed \`EntityManager\`). The pool gradually empties.
* **Idle in transaction**: a transaction was opened but the application went off to do something else (remote call, long computation, waiting on a queue) without committing. The connection stays checked out, and the open transaction holds locks and blocks VACUUM.

### Finding the culprit
* **HikariCP leak detection**: \`leakDetectionThreshold=20000\` logs the stack trace of where a connection was borrowed if it's held longer than 20s.
* Pool metrics: active, idle, pending, and **usage time** histograms (Micrometer \`hikaricp.connections.usage\`).
* Database: \`pg_stat_activity\` shows \`idle in transaction\` sessions with their last query and \`xact_start\`.

### Fixes
* Keep \`@Transactional\` boundaries tight; no remote calls inside transactions.
* Close streams and cursors (try-with-resources).
* Disable Open Session in View.
* Safety nets: \`idle_in_transaction_session_timeout\` in PostgreSQL, statement timeouts, and a sensible pool \`connectionTimeout\` so failures are fast and visible.`,
    pitfalls: [
      "Increasing the pool size to hide leaks.",
      "Remote calls inside transactional methods.",
      "No leak detection or pool metrics in production.",
    ],
    followUpQuestions: [
      "Why does an idle transaction block VACUUM?",
      "What are good default HikariCP timeouts?",
    ],
    faangFocus: "A realistic incident-response question.",
  },
  {
    id: 'per-37',
    categoryId: 'persistence',
    title: 'When to Use JPA and When to Use jOOQ or Plain SQL',
    difficulty: 'Solid',
    tags: ['JPA', 'jOOQ', 'JdbcTemplate', 'Architecture'],
    scenario: "A reporting-heavy service fights Hibernate constantly: complex window-function queries, huge projections and bulk updates. A teammate proposes dropping JPA for jOOQ.",
    question: "What are the strengths of each approach, and how do you decide?",
    idealAnswer: `### JPA/Hibernate shines at
* **Rich domain models with state changes**: load an aggregate, modify it, let dirty checking write changes.
* Unit of work, optimistic locking, cascades, lazy loading, second-level cache.
* CRUD-heavy applications with moderate query complexity.

### SQL-first tools shine at
* **jOOQ**: type-safe SQL generated from your schema. Full SQL power (CTEs, window functions, upserts, vendor features), compile-time checking of queries against the schema.
* **JdbcTemplate / JDBC Client**: simple, explicit, zero magic.
* Reporting, analytics, bulk operations, and schemas designed around SQL rather than objects.

### Decision factors
* Is the service mostly **commands on aggregates** (JPA) or **queries and bulk data** (SQL)?
* Team SQL expertise.
* Performance predictability: SQL-first tools do exactly what you write; ORMs can generate surprising queries.

### Mixing is normal
Use JPA for writes and jOOQ/JdbcTemplate/projections for complex reads in the same service (a light form of CQRS). They can share the same \`DataSource\` and Spring-managed transactions.`,
    pitfalls: [
      "Forcing complex reporting through JPQL.",
      "Rewriting a working JPA codebase wholesale.",
      "Mixing tools without shared transaction management.",
    ],
    followUpQuestions: [
      "How do jOOQ and JPA share a transaction in Spring?",
      "What does Spring's JdbcClient add?",
    ],
    faangFocus: "A pragmatic architecture question; balanced answers win.",
  },
  {
    id: 'per-38',
    categoryId: 'persistence',
    title: 'Database Constraints vs Application Validation',
    difficulty: 'Solid',
    tags: ['Constraints', 'Validation', 'Data Integrity', 'Unique Index'],
    scenario: "Duplicate user accounts with the same email exist in production even though the service checks `existsByEmail()` before inserting.",
    question: "Why did the check fail, and what's the right split between database constraints and application validation?",
    idealAnswer: `### Check-then-insert is a race
Two concurrent sign-ups both call \`existsByEmail\` (false for both), then both insert. Application checks are **not atomic** with the write. Only the database can guarantee uniqueness across concurrent transactions.

### Use constraints for invariants
* \`UNIQUE\` (email, possibly on \`lower(email)\`), \`NOT NULL\`, \`CHECK (amount >= 0)\`, foreign keys, **exclusion constraints** (no overlapping bookings).
* They protect data from **every** writer: other services, scripts, migrations and bugs.

### Application validation still matters
It gives **good error messages** and fails fast before touching the database (format checks, required fields, business rules that need context).

### Combining them
Keep the pre-check for a friendly message, but **also** handle the constraint violation: catch \`DataIntegrityViolationException\`, map it to a 409 Conflict with a clear message.

### Idempotency with constraints
Unique constraints on idempotency keys or natural keys turn retries into safe no-ops: \`INSERT ... ON CONFLICT DO NOTHING\`.`,
    pitfalls: [
      "Relying only on application checks for uniqueness.",
      "Exposing raw constraint errors to users.",
      "Missing case-insensitive uniqueness for emails.",
    ],
    followUpQuestions: [
      "How do you enforce uniqueness across a sharded database?",
      "When would you use ON CONFLICT DO UPDATE?",
    ],
    faangFocus: "A fundamental data-integrity question with a concurrency twist.",
  },
  {
    id: 'per-39',
    categoryId: 'persistence',
    title: 'B-Tree Internals and Why Random Keys Hurt',
    difficulty: 'Expert',
    tags: ['B-Tree', 'Indexes', 'UUID', 'Page Splits'],
    scenario: "Insert throughput on a table with a UUIDv4 primary key falls steadily as the table grows past the size of RAM, while a similar table with a bigint sequence key stays fast.",
    question: "Explain B-tree index structure and why the key choice matters so much.",
    idealAnswer: `### B+ trees
Indexes are balanced trees of fixed-size **pages** (8KB in PostgreSQL, 16KB in InnoDB). Internal pages hold keys and child pointers; leaf pages hold keys and row pointers (or the rows themselves, for InnoDB's clustered primary key). Depth is small (3-4 levels for billions of keys) because each page holds hundreds of entries.

### Sequential keys
Monotonically increasing keys always go to the **rightmost leaf**. Only that path of pages needs to be in memory, pages fill completely, and splits are cheap appends.

### Random keys
UUIDv4 values land on **random leaf pages** across the whole index. Once the index exceeds the buffer pool:
* Nearly every insert needs a page **read from disk** (random IO).
* **Page splits** everywhere leave pages ~half full, so the index is larger and less cache-efficient.
* More WAL volume (full-page writes after checkpoints touch many distinct pages).
* In InnoDB the **table itself** is clustered by primary key, so the table data is scattered too.

### Remedies
Time-ordered IDs (**UUIDv7**, ULID, Snowflake) keep global uniqueness with locality. Or keep a bigint surrogate primary key and a random UUID as a secondary public identifier.`,
    pitfalls: [
      "Random UUID primary keys on large InnoDB tables.",
      "Measuring insert speed only on small tables that fit in memory.",
      "Storing UUIDs as text, doubling index size.",
    ],
    followUpQuestions: [
      "What is a clustered index and which databases use them by default?",
      "How does fillfactor affect page splits?",
    ],
    faangFocus: "Storage-engine depth that explains a very common performance problem.",
  },
  {
    id: 'per-40',
    categoryId: 'persistence',
    title: 'Write-Ahead Logging, fsync and Durability',
    difficulty: 'Master',
    tags: ['WAL', 'Durability', 'fsync', 'Replication'],
    scenario: "An engineer proposes setting `synchronous_commit = off` and using faster disks without write caches disabled to double write throughput. The DBA objects.",
    question: "Explain how WAL provides durability and what each of these changes risks.",
    idealAnswer: `### Write-ahead logging
Before a change to data pages is considered committed, a record describing it is appended to the **WAL**. On commit, the WAL up to that record is **flushed to durable storage** (\`fsync\`/\`fdatasync\`). Data pages are written lazily later (checkpoints). After a crash, the database **replays** the WAL from the last checkpoint to reconstruct committed changes. Sequential appends are fast; random page writes are deferred and batched.

### Group commit
Many concurrent commits share one fsync, which is why throughput scales with concurrency.

### \`synchronous_commit = off\` (PostgreSQL)
The commit returns **before** the WAL flush. A crash can lose the last few hundred milliseconds of **acknowledged** transactions, but it can't corrupt the database. Acceptable for data you can regenerate (analytics events, caches); unacceptable for payments. It can be set **per transaction**, so use it selectively.

### Volatile write caches
If the disk acknowledges writes held in a **volatile cache** without power-loss protection, \`fsync\` lies: a power loss can lose or **tear** writes, and **corrupt** the database. Only use drives with power-loss protection (or battery-backed controllers), and never disable fsync (\`fsync = off\`) in production.

### Replication and durability
Durability against machine loss needs replicas: \`synchronous_commit = remote_apply/on\` with synchronous standbys waits for replicas too, trading latency for zero data loss on failover.`,
    pitfalls: [
      "Turning off fsync to 'speed up' production.",
      "Unaware use of consumer SSDs without power-loss protection.",
      "Assuming async replication means no data loss on failover.",
    ],
    followUpQuestions: [
      "What are full-page writes and why are they needed?",
      "How do checkpoints trade recovery time for IO?",
    ],
    faangFocus: "Deep database internals question for infrastructure and data roles.",
  },
  {
    id: 'per-41',
    categoryId: 'persistence',
    title: 'Multi-Tenant Database Design',
    difficulty: 'Expert',
    tags: ['Multi-Tenancy', 'Schema Design', 'Row-Level Security', 'SaaS'],
    scenario: "A SaaS product with 5,000 tenants (a few huge, most tiny) must choose a database tenancy model. Some enterprise customers demand data isolation and regional residency.",
    question: "Compare the tenancy models and recommend a design.",
    idealAnswer: `### Shared schema (tenant_id column)
All tenants in the same tables, with \`tenant_id\` on every row.
* Cheapest and simplest to operate; one migration for everyone.
* Risk of **cross-tenant leaks** from a missing filter; mitigate with Hibernate filters/tenant resolver plus **PostgreSQL row-level security** as a backstop.
* Noisy neighbours; huge tenants dominate indexes and caches.

### Schema per tenant
Same database, separate schemas.
* Better isolation, per-tenant backup/restore easier.
* Thousands of schemas make migrations slow and catalog-heavy; connection pooling per schema is awkward.

### Database per tenant
* Strongest isolation, per-tenant performance tuning, **regional placement**, easy deletion.
* Highest operational cost; needs automation for provisioning, migrations and monitoring at scale.

### Recommended: a hybrid
Put the long tail of small tenants in **shared-schema pools** (sharded by tenant across several databases), and give large or regulated enterprise tenants **dedicated databases** in their required region. A **tenant catalog** maps tenant → database/shard, used by a routing \`DataSource\`. Tenants can be moved between tiers as they grow.

### Must-haves regardless
Tenant ID in every key and index prefix, tenant context propagated safely (not leaking across thread pools), per-tenant rate limits, and tests that assert isolation.`,
    pitfalls: [
      "Relying only on application filters for isolation.",
      "Database-per-tenant without automation.",
      "No way to move a tenant between shards.",
    ],
    followUpQuestions: [
      "How does PostgreSQL row-level security work with connection pools?",
      "How would you migrate a tenant to a dedicated database with no downtime?",
    ],
    faangFocus: "Core SaaS architecture question for senior and staff engineers.",
  },
  {
    id: 'per-42',
    categoryId: 'persistence',
    title: 'LSM Trees vs B-Trees',
    difficulty: 'Master',
    tags: ['LSM Tree', 'B-Tree', 'Storage Engines', 'Cassandra', 'RocksDB'],
    scenario: "A telemetry platform ingesting 2 million writes per second is choosing between PostgreSQL and a store based on RocksDB or Cassandra. The interviewer asks you to explain the storage engine trade-offs.",
    question: "Compare LSM-tree and B-tree storage engines.",
    idealAnswer: `### B-trees (PostgreSQL, MySQL InnoDB)
Update data **in place** in fixed-size pages, with a WAL for durability.
* Reads: one tree traversal, predictable latency.
* Writes: random page writes (amortised by the buffer pool), **write amplification** from writing whole pages for small changes.
* Good all-rounders, strong for read-heavy and transactional workloads.

### LSM trees (RocksDB, Cassandra, ScyllaDB, HBase, LevelDB)
Writes go to a WAL and an in-memory **memtable**. When full, it's flushed as an immutable, sorted **SSTable**. Background **compaction** merges SSTables, discarding overwritten and deleted entries (tombstones).
* Writes: **sequential**, very high throughput.
* Reads: may check the memtable and several SSTables; **Bloom filters** skip files that can't contain the key, and compaction limits how many files exist.
* **Read amplification** (several files per read), **space amplification** (stale versions until compaction), and compaction CPU/IO spikes.
* Compaction strategies: **leveled** (better reads, more write amp) vs **size-tiered** (better writes, more space amp).

### Choosing for telemetry
Append-heavy, time-ordered, mostly recent reads: LSM-based stores (or purpose-built time-series databases) fit well. Tune TTL-aware compaction (e.g. time-window compaction) so expired data drops as whole files.

### The RUM conjecture
You can optimise two of Read, Update, and Memory (space) overheads, but not all three.`,
    pitfalls: [
      "Ignoring compaction when capacity planning an LSM store.",
      "Many deletes in LSM stores creating tombstone-heavy reads.",
      "Assuming LSM is faster for every workload.",
    ],
    followUpQuestions: [
      "Why do tombstones cause read latency problems in Cassandra?",
      "How does leveled compaction bound read amplification?",
    ],
    faangFocus: "Storage-engine theory from 'Designing Data-Intensive Applications', popular in top-tier loops.",
  },
];
