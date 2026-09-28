import type { Question } from '../../types';

/**
 * System design, part two: the fundamentals every design round assumes,
 * the classic "design X" prompts, and distributed-systems theory at the top.
 */
export const ARCHITECTURE_MORE_QUESTIONS: Question[] = [
  {
    id: 'arch-13',
    categoryId: 'architecture',
    title: 'Vertical vs Horizontal Scaling and Stateless Services',
    difficulty: 'Core',
    tags: ['Scaling', 'Stateless', 'Load Balancing', 'Basics'],
    scenario: "A monolith on one large VM is hitting CPU limits. Adding a second instance behind a load balancer causes users to be logged out randomly.",
    question: "Compare vertical and horizontal scaling, and explain why the second instance broke logins.",
    idealAnswer: `### Vertical scaling
Bigger machine: more CPU, RAM, faster disks. Simple, no code changes, but there's a ceiling, costs grow non-linearly, and one machine is a single point of failure.

### Horizontal scaling
More machines behind a load balancer. Near-linear capacity and fault tolerance, but requires the application to be **stateless**.

### Why logins broke
Sessions were stored **in memory** on the first instance. Requests routed to the second instance found no session. Options:
* **Externalise state**: sessions in Redis (Spring Session) or a database.
* **Stateless tokens** (JWT) carrying identity with each request.
* **Sticky sessions** at the load balancer: a quick fix, but it breaks on instance failure, unbalances load and complicates deploys.

### What 'stateless' means
Any instance can serve any request. State lives in shared stores: databases, caches, object storage, queues. Local files, in-memory caches that must be consistent, and scheduled jobs all need rethinking when scaling out.`,
    pitfalls: [
      "Relying on sticky sessions as the long-term design.",
      "Local file uploads that other instances can't see.",
      "Scheduled jobs running on every instance.",
    ],
    followUpQuestions: [
      "What state is acceptable to keep in memory?",
      "How does autoscaling interact with connection pools to the DB?",
    ],
    faangFocus: "The foundation of every system design round.",
  },
  {
    id: 'arch-14',
    categoryId: 'architecture',
    title: 'Load Balancers: L4 vs L7, Algorithms and Health Checks',
    difficulty: 'Core',
    tags: ['Load Balancing', 'L4', 'L7', 'Health Checks'],
    scenario: "One of four API instances is stuck in a long GC pause, but the load balancer keeps sending it a quarter of the traffic.",
    question: "Explain L4 vs L7 load balancing, common algorithms, and how health checks should work.",
    idealAnswer: `### L4 vs L7
* **L4 (transport)**: routes TCP/UDP connections by IP and port. Fast, protocol-agnostic, can't see HTTP paths or headers. AWS NLB.
* **L7 (application)**: understands HTTP: routes by path, host, header; terminates TLS; can retry, rewrite and rate limit. AWS ALB, Nginx, Envoy.

### Algorithms
* **Round robin**: simple; assumes equal instances and requests.
* **Least connections / least outstanding requests**: adapts to slow instances. This would have sent little traffic to the GC-stuck node.
* **Weighted** variants for heterogeneous capacity or canaries.
* **Consistent hashing** for cache affinity.
* **Power of two random choices**: pick two at random, send to the less loaded one. Near-optimal with little coordination.

### Health checks
* **Active**: periodic probes to a health endpoint; remove after N failures.
* **Passive / outlier detection**: eject instances based on real traffic errors and latency (Envoy).
* Health endpoints should reflect the ability to serve, be cheap, and not cascade failures by checking every dependency.`,
    pitfalls: [
      "Round robin with instances of different health or capacity.",
      "Health checks that only verify the process is up.",
      "Deep health checks that mark every instance unhealthy when one dependency blips.",
    ],
    followUpQuestions: [
      "Where would you terminate TLS and why?",
      "How does connection reuse (HTTP/2, keep-alive) affect balancing?",
    ],
    faangFocus: "Basic building block; algorithm choice and outlier detection add depth.",
  },
  {
    id: 'arch-15',
    categoryId: 'architecture',
    title: 'HTTP Caching and CDNs',
    difficulty: 'Solid',
    tags: ['CDN', 'HTTP Caching', 'Cache-Control', 'ETag'],
    scenario: "A product catalogue API serves 50k rps, 95% of which are identical reads. The origin is struggling, and after a price change some users see old prices for an hour.",
    question: "How would you use HTTP caching and a CDN here, and how do you handle freshness?",
    idealAnswer: `### Cache-Control
* \`public, max-age=60\`: any cache (CDN, browser) may store it for 60s.
* \`s-maxage\`: separate TTL for shared caches (CDN) vs browsers.
* \`private\` / \`no-store\` for user-specific or sensitive data.
* \`stale-while-revalidate\`: serve stale while fetching a fresh copy in the background, hiding origin latency.

### Validation
\`ETag\` / \`Last-Modified\` let caches revalidate with \`If-None-Match\`; the origin replies **304 Not Modified** with no body.

### Freshness after changes
* Short TTLs for volatile data plus CDN **purge/invalidate** APIs when prices change.
* **Versioned URLs** (content hashes) for static assets: cache forever, change the URL on deploy.
* Surrogate keys / cache tags to purge all pages containing product 123.

### Pitfalls
* Caching responses that vary by user without \`Vary\` or a proper cache key: data leakage.
* Cookies or auth headers bypassing CDN caching entirely.
* Cache stampede when popular objects expire: request coalescing at the CDN.`,
    pitfalls: [
      "Caching personalised responses publicly.",
      "Long TTLs without a purge strategy.",
      "Forgetting Vary headers for content negotiation.",
    ],
    followUpQuestions: [
      "How would you cache a page that is 95% shared and 5% personalised?",
      "What is request coalescing?",
    ],
    faangFocus: "Frequently part of read-heavy design questions.",
  },
  {
    id: 'arch-16',
    categoryId: 'architecture',
    title: 'REST Fundamentals: Resources, Safe and Idempotent Methods',
    difficulty: 'Core',
    tags: ['REST', 'HTTP', 'Idempotency', 'API Design'],
    scenario: "An API uses `POST /getOrders`, `GET /deleteOrder?id=5`, and `POST /orders/5/update`. A crawler that follows links deletes production data.",
    question: "What makes an API RESTful, and which HTTP methods are safe or idempotent?",
    idealAnswer: `### Resources, not actions
URLs identify **resources** (nouns): \`/orders\`, \`/orders/5\`, \`/orders/5/lines\`. HTTP methods express the **action**.

### Method semantics
| Method | Use | Safe | Idempotent |
|---|---|---|---|
| GET | Read | Yes | Yes |
| HEAD / OPTIONS | Metadata | Yes | Yes |
| PUT | Replace/create at a known URL | No | **Yes** |
| DELETE | Remove | No | **Yes** |
| POST | Create in a collection / non-idempotent action | No | No |
| PATCH | Partial update | No | Not guaranteed |

**Safe** = no side effects, so crawlers, prefetchers and caches may call it freely. That's why \`GET /deleteOrder\` was catastrophic.
**Idempotent** = repeating the request has the same effect as doing it once, so clients and proxies may **retry** safely.

### Fixing the API
\`GET /orders\`, \`DELETE /orders/5\`, \`PATCH /orders/5\`. For actions that don't map cleanly (\`cancel\`), a sub-resource such as \`POST /orders/5/cancellation\` is acceptable.

### Beyond verbs
Proper status codes, stateless requests, cacheability headers, consistent error bodies, and versioning.`,
    pitfalls: [
      "Side effects on GET.",
      "Verbs in URLs.",
      "Retrying POSTs without idempotency keys.",
    ],
    followUpQuestions: [
      "How do you make POST idempotent?",
      "PUT vs PATCH for partial updates?",
    ],
    faangFocus: "Fundamental API design; interviewers expect precise definitions of safe and idempotent.",
  },
  {
    id: 'arch-17',
    categoryId: 'architecture',
    title: 'Synchronous vs Asynchronous Communication',
    difficulty: 'Core',
    tags: ['Messaging', 'REST', 'Coupling', 'Availability'],
    scenario: "Placing an order calls inventory, payment, email and analytics services synchronously. When the email service is slow, checkout times out.",
    question: "When should services talk synchronously and when asynchronously?",
    idealAnswer: `### Synchronous (REST/gRPC)
The caller waits for the answer.
* Needed when the caller **requires the result now** (payment authorised? stock available?).
* Creates **temporal coupling**: every dependency's latency and availability multiply into yours. Five services at 99.9% each give at most ~99.5%.

### Asynchronous (queues, events)
The caller publishes a message and moves on.
* Decouples availability and load: the consumer can be down or slow; messages wait.
* Natural for **side effects** that don't affect the response: emails, analytics, search indexing, notifications.
* Costs: eventual consistency, harder debugging, duplicate handling (idempotent consumers), message ordering concerns.

### Applying it
Checkout: inventory reservation and payment authorisation are synchronous (the user needs the answer). Email, analytics and loyalty points are async via an \`OrderPlaced\` event, published reliably (outbox).

### Middle ground
Request-reply over messaging, and async APIs (202 Accepted + status endpoint or webhook) for long-running work.`,
    pitfalls: [
      "Chaining synchronous calls for non-critical side effects.",
      "Going fully async where the user needs an immediate answer.",
      "Publishing events without guaranteeing they correspond to committed state.",
    ],
    followUpQuestions: [
      "How do you show order status to the user if processing is async?",
      "What is choreography vs orchestration?",
    ],
    faangFocus: "Core architectural judgement in every microservices discussion.",
  },
  {
    id: 'arch-18',
    categoryId: 'architecture',
    title: 'SQL vs NoSQL: Choosing a Data Store',
    difficulty: 'Core',
    tags: ['SQL', 'NoSQL', 'Data Modeling', 'Databases'],
    scenario: "A startup is building an order management system and a teammate insists on MongoDB 'because it scales'.",
    question: "How do you choose between relational and NoSQL databases?",
    idealAnswer: `### Relational (PostgreSQL, MySQL)
* Strong schema, **ACID transactions**, joins, rich ad-hoc queries, mature tooling.
* Scales vertically very far, plus read replicas; horizontal sharding is possible but work (Citus, Vitess).
* Default choice for transactional business data like orders, payments and inventory.

### NoSQL families
* **Document** (MongoDB): flexible nested documents, good when data is naturally aggregate-shaped and accessed by ID.
* **Key-value** (Redis, DynamoDB): simple access patterns at massive scale and low latency.
* **Wide-column** (Cassandra): huge write throughput, multi-region, query-driven modelling, limited ad-hoc queries.
* **Graph** (Neo4j): relationship-heavy traversals.
* **Search** (Elasticsearch): full-text and faceted search, usually as a secondary store.

### How to decide
Start from **access patterns**, consistency needs and scale. 'It scales' is not a reason until you know you need more than a well-tuned Postgres can offer, which is further than most people think. Many systems use Postgres as the source of truth plus specialised stores fed by events or CDC.`,
    pitfalls: [
      "Choosing NoSQL for scale you don't have.",
      "Modelling relational data in a document store and reimplementing joins in code.",
      "Ignoring transactional requirements.",
    ],
    followUpQuestions: [
      "How would you model orders in DynamoDB?",
      "What is polyglot persistence and what does it cost?",
    ],
    faangFocus: "Asked in nearly every design interview; justification matters more than the choice.",
  },
  {
    id: 'arch-19',
    categoryId: 'architecture',
    title: 'Database Replication and Replica Lag',
    difficulty: 'Solid',
    tags: ['Replication', 'Read Replicas', 'Consistency', 'Failover'],
    scenario: "After moving reads to replicas, users sometimes update their profile and see the old value on the next page load.",
    question: "Explain replication modes and how to handle replica lag.",
    idealAnswer: `### Leader-follower replication
Writes go to the **leader**; changes stream to **followers** that serve reads.
* **Asynchronous**: leader commits without waiting. Low write latency, but followers **lag** and a failover can lose recently committed writes.
* **Synchronous**: leader waits for at least one follower. No loss on failover, higher latency, and a slow follower stalls writes (semi-sync is a compromise).

### Why users see stale data
Their read hit a follower that hadn't yet applied their write: a **read-your-writes** violation.

### Fixes
* Route a user's reads to the **leader for a short window** after they write (e.g. flag in the session for 5s).
* Track the leader's log position (LSN/GTID) at write time and read from a replica only once it has caught up.
* Read from the leader for critical flows (account settings, checkout).
* Monitor replication lag and stop routing to replicas that fall too far behind.

### Other topologies
Multi-leader (multi-region writes, needs conflict resolution) and leaderless quorum systems (Cassandra, Dynamo: R + W > N for overlap).`,
    pitfalls: [
      "Routing all reads to replicas blindly.",
      "Async replication with automatic failover and no data-loss awareness.",
      "Not monitoring lag.",
    ],
    followUpQuestions: [
      "What does R + W > N guarantee?",
      "How does failover work and what can go wrong (split brain)?",
    ],
    faangFocus: "Standard distributed-data question with a common real-world bug.",
  },
  {
    id: 'arch-20',
    categoryId: 'architecture',
    title: 'Sharding Strategies and Hotspots',
    difficulty: 'Solid',
    tags: ['Sharding', 'Partitioning', 'Hotspots', 'Scaling'],
    scenario: "An orders table has 5 billion rows and one Postgres instance can no longer keep up with writes. You're asked to shard it.",
    question: "What are the sharding strategies, how do you choose a shard key, and what gets harder?",
    idealAnswer: `### Strategies
* **Range** (by date, by ID range): efficient range scans, but new data concentrates on the latest shard (hotspot).
* **Hash** (hash of key mod N, or consistent hashing): even distribution, but range queries hit every shard; resharding moves data.
* **Directory / lookup**: a mapping service decides placement; flexible, but it's an extra component.
* **Geo / tenant-based**: shard by region or customer, good for data residency and isolation.

### Choosing a shard key
* High cardinality and even distribution.
* Matches the **dominant access pattern**, so most queries hit one shard. For orders, \`customer_id\` keeps a customer's orders together; \`order_id\` spreads writes but makes 'orders by customer' a scatter-gather.
* Avoid monotonically increasing keys with range sharding.

### What gets harder
Cross-shard queries and joins, cross-shard transactions (sagas), global unique IDs (Snowflake-style IDs), rebalancing, and operations (backups, migrations x N).

### Before sharding
Vertical scaling, read replicas, archiving cold data, partitioning within one database (Postgres declarative partitioning), and caching. Sharding is a one-way door.`,
    pitfalls: [
      "Picking a shard key that doesn't match access patterns.",
      "Range sharding on time with all writes going to one shard.",
      "Sharding before exhausting simpler options.",
    ],
    followUpQuestions: [
      "How would you reshard with no downtime?",
      "How would you generate globally unique, roughly ordered IDs?",
    ],
    faangFocus: "Core scaling question; shard-key reasoning is what's evaluated.",
  },
  {
    id: 'arch-21',
    categoryId: 'architecture',
    title: 'Queues, Pub/Sub and Logs: RabbitMQ vs Kafka',
    difficulty: 'Solid',
    tags: ['Kafka', 'RabbitMQ', 'Messaging', 'Event Streaming'],
    scenario: "Two teams are arguing: one wants RabbitMQ for background jobs, the other wants Kafka for everything.",
    question: "Compare message queues and distributed logs and when each is the better tool.",
    idealAnswer: `### Message broker (RabbitMQ, SQS, ActiveMQ)
* Messages are **delivered to consumers and removed** after acknowledgement.
* Rich routing (exchanges, topics, headers), per-message acks, redelivery, delayed messages, priorities.
* Competing consumers scale out naturally; ordering is weak once you have several consumers.
* Great for **task queues** and work distribution.

### Distributed log (Kafka, Pulsar, Kinesis)
* An append-only, **partitioned, retained** log. Consumers track their own **offsets**; messages stay for the retention period.
* **Replay**: new consumers can read history; you can reprocess after a bug fix.
* Ordering **per partition**; parallelism limited by partition count.
* Very high throughput; the foundation for event streaming, CDC, and stream processing.

### Choosing
* Background jobs with retries, delays and per-message handling: a broker.
* Event backbone, multiple independent consumers, replay, analytics pipelines: Kafka.
* Many companies run both.

### Common Kafka misuse
Using it as a job queue with per-message retries and priorities: it can work, but you end up building broker features on top.`,
    pitfalls: [
      "Using Kafka as a work queue without handling poison messages.",
      "Expecting global ordering in Kafka.",
      "Using a broker when consumers need replay.",
    ],
    followUpQuestions: [
      "How do you choose the number of Kafka partitions?",
      "How would you implement delayed retries on Kafka?",
    ],
    faangFocus: "A common trade-off question in event-driven design.",
  },
  {
    id: 'arch-22',
    categoryId: 'architecture',
    title: 'Delivery Semantics: At-Most-Once, At-Least-Once, Exactly-Once',
    difficulty: 'Solid',
    tags: ['Messaging', 'Delivery Guarantees', 'Idempotency'],
    scenario: "A consumer sends a welcome email per `UserRegistered` event. After a crash, some users get two emails; after a config change, some get none.",
    question: "Explain the delivery semantics and how to build effectively-once processing.",
    idealAnswer: `### The three semantics
* **At-most-once**: ack/commit **before** processing. A crash after acking loses the message. (The 'some get none' config.)
* **At-least-once**: ack **after** processing. A crash after processing but before acking redelivers. (Duplicate emails.) This is the usual default.
* **Exactly-once**: each message affects the system exactly once. True end-to-end exactly-once **delivery** is impossible across arbitrary systems; what you build is **effectively-once processing**.

### Effectively-once = at-least-once + idempotency
* **Idempotent consumers**: record processed message IDs (in the same transaction as the side effect) and skip duplicates.
* **Natural idempotency**: upserts, 'set status to SHIPPED' instead of 'increment'.
* For external side effects (emails, payments), pass an **idempotency key** to the provider or keep a sent-log checked before sending.

### Kafka's exactly-once
Idempotent producers plus transactions give exactly-once for **read-process-write within Kafka**. It doesn't cover your database or an email API.`,
    pitfalls: [
      "Claiming exactly-once delivery end to end.",
      "Dedup tables updated outside the transaction of the side effect.",
      "Non-idempotent increments in consumers.",
    ],
    followUpQuestions: [
      "How long do you keep processed message IDs?",
      "How do you make an email send idempotent?",
    ],
    faangFocus: "Essential distributed-systems vocabulary with a practical twist.",
  },
  {
    id: 'arch-23',
    categoryId: 'architecture',
    title: 'API Gateways and Backend-for-Frontend',
    difficulty: 'Solid',
    tags: ['API Gateway', 'BFF', 'Edge', 'Microservices'],
    scenario: "The mobile app makes 14 calls to render its home screen, each to a different microservice, and struggles on slow networks.",
    question: "What does an API gateway do, and when is a BFF the better pattern?",
    idealAnswer: `### API gateway
A single entry point in front of services that handles **cross-cutting concerns**:
* Routing, TLS termination, authentication (validate tokens), rate limiting, request size limits.
* Observability (access logs, tracing), CORS, sometimes caching and request/response transformation.
Examples: Spring Cloud Gateway, Kong, Envoy, AWS API Gateway.

### Backend-for-Frontend
A service **owned by a frontend team**, tailored to one client type (mobile, web, partner). It **aggregates** calls to downstream services and shapes the response to exactly what the screen needs: 14 calls from the phone become 1 call to the BFF plus 14 fast calls inside the data centre.

### Keep them distinct
The gateway stays generic and thin. Business aggregation logic in the gateway turns it into a bottleneck monolith owned by nobody. BFFs hold client-specific logic and can evolve with their app.

### GraphQL alternative
A GraphQL layer can act as a universal BFF where clients choose their fields, at the cost of query complexity controls, caching difficulty and N+1 resolver issues.`,
    pitfalls: [
      "Business logic in the shared gateway.",
      "One BFF shared by all clients (a new monolith).",
      "BFFs calling downstreams sequentially instead of in parallel.",
    ],
    followUpQuestions: [
      "Where should authorization decisions live?",
      "How would you handle partial failures in a BFF aggregation?",
    ],
    faangFocus: "Common microservice edge-design question.",
  },
  {
    id: 'arch-24',
    categoryId: 'architecture',
    title: 'Timeouts and Retry Budgets Across a Call Chain',
    difficulty: 'Hard',
    tags: ['Timeouts', 'Retries', 'Deadlines', 'Retry Storms'],
    scenario: "Service A calls B calls C calls D. Each layer retries 3 times with a 5s timeout. When D slows down, D receives 64x normal traffic and the incident lasts an hour.",
    question: "What went wrong and how should timeouts and retries be designed across a chain?",
    idealAnswer: `### Retry amplification
Each layer retries independently: 4 attempts per call at each of 3 layers = 4^3 = **64 requests** to D per user request. Retries hit D exactly when it's overloaded, so it never recovers: a **retry storm**.

### Timeout mis-nesting
Inner timeouts equal to outer ones mean the outer caller gives up while inner layers are still working and retrying: wasted work.

### Principles
* **Retry at one layer**, ideally closest to the edge or the failing call, not everywhere.
* **Retry budgets**: cap retries to a fraction of traffic (e.g. 10%) instead of per-request counts; stop retrying when the budget is spent.
* **Exponential backoff with jitter**.
* Only retry **idempotent** operations and **retryable** errors (timeouts, 503), never 4xx.
* **Deadline propagation**: pass the remaining time budget downstream (gRPC deadlines, a header). Each hop uses \`min(own timeout, remaining budget)\`, and nobody works on requests whose caller already gave up.
* **Circuit breakers** to stop calling a failing dependency.
* Server-side: shed load early (429/503) so clients back off.`,
    pitfalls: [
      "Retries at every layer.",
      "Timeouts that are equal or increasing going downstream.",
      "Retrying on client errors.",
    ],
    followUpQuestions: [
      "How would you implement a retry budget?",
      "How do hedged requests differ from retries?",
    ],
    faangFocus: "A classic senior reliability question drawn from real outages.",
  },
  {
    id: 'arch-25',
    categoryId: 'architecture',
    title: 'Design a URL Shortener',
    difficulty: 'Solid',
    tags: ['System Design', 'URL Shortener', 'Hashing', 'Caching'],
    scenario: "Design a service like bit.ly: 100M new links per month, 10B redirects per month, short codes as short as possible, links never expire.",
    question: "Walk through the design.",
    idealAnswer: `### Back of the envelope
* Writes: ~40/s average. Reads: ~4,000/s average, peaks maybe 10x. **Read-heavy**, 100:1.
* 100M/month x 10 years = 12B links. Base62 with 7 characters gives 62^7 ≈ 3.5 trillion codes: plenty.
* Storage: ~500 bytes per link → ~6TB over 10 years.

### Code generation
* **Counter + base62**: unique, short, no collisions. Use a distributed ID source (DB sequence ranges handed to each app instance, or Snowflake IDs). Sequential codes are guessable; if that matters, shuffle with a bijective permutation.
* **Hash of URL** (truncated MD5/SHA): deterministic, but needs collision handling.

### Data and API
\`POST /links {url}\` → code. \`GET /{code}\` → **301** (cacheable, fewer hits, less analytics) or **302** (every hit reaches you, better analytics). Store \`code → url, owner, created_at\` in a key-value store or Postgres; it's a simple primary-key lookup.

### Scaling reads
CDN/edge caching of redirects, Redis cache in front of the DB (hot links follow a power law), read replicas.

### Extras
Analytics via async events (Kafka) from the redirect path, abuse/malware checks on creation, custom aliases with uniqueness checks, rate limiting on creation.`,
    pitfalls: [
      "Doing analytics writes synchronously in the redirect path.",
      "Random codes without collision handling.",
      "Ignoring 301 vs 302 implications.",
    ],
    followUpQuestions: [
      "How do you prevent enumeration of links?",
      "How would you support link expiry?",
    ],
    faangFocus: "One of the most common design prompts; clean estimation and trade-offs win.",
  },
  {
    id: 'arch-26',
    categoryId: 'architecture',
    title: 'Design a Distributed Rate Limiter',
    difficulty: 'Hard',
    tags: ['Rate Limiting', 'Redis', 'Token Bucket', 'System Design'],
    scenario: "A public API must enforce 100 requests per minute per API key across 50 gateway instances.",
    question: "Design the rate limiter: algorithm, storage, and failure behaviour.",
    idealAnswer: `### Algorithms
* **Fixed window counter**: simple; allows 2x bursts at window boundaries.
* **Sliding window log**: exact; stores every timestamp, memory-heavy.
* **Sliding window counter**: weighted blend of current and previous window; accurate enough, cheap.
* **Token bucket**: allows controlled bursts, smooth refill; the most common choice.

### Where state lives
50 instances need a shared view: **Redis**. Implement token bucket or sliding window as a **Lua script** so read-compute-write is atomic, keyed by API key, with TTLs. One round-trip per request.

### Scaling
* Shard keys across a Redis cluster.
* **Local pre-aggregation**: each instance gets a small local allowance and syncs periodically, trading exactness for fewer Redis calls.
* Put coarse limits at the edge/CDN (per IP) and fine limits at the gateway.

### Responses
429 with \`Retry-After\` and \`RateLimit-*\` headers.

### Failure behaviour
If Redis is down: **fail open** (allow, with local fallback limits) for availability, or **fail closed** for abuse-sensitive endpoints like login. Decide per endpoint and alert either way.`,
    pitfalls: [
      "Non-atomic GET then SET in Redis.",
      "Per-instance limits multiplied by instance count.",
      "No decision on Redis failure mode.",
    ],
    followUpQuestions: [
      "How would you implement different tiers (free vs paid)?",
      "How do you rate limit by cost rather than request count?",
    ],
    faangFocus: "A top-5 design question; atomicity and failure mode are the senior details.",
  },
  {
    id: 'arch-27',
    categoryId: 'architecture',
    title: 'REST vs gRPC vs GraphQL',
    difficulty: 'Solid',
    tags: ['gRPC', 'GraphQL', 'REST', 'API Design'],
    scenario: "A platform team must choose an API style for internal service-to-service calls, a public partner API, and a mobile app with many different screens.",
    question: "Compare the three styles and pick one for each case.",
    idealAnswer: `### REST (JSON over HTTP)
Universal, human-readable, cacheable with HTTP semantics, great tooling (OpenAPI). Weaker typing, over/under-fetching, verbose payloads.

### gRPC (Protobuf over HTTP/2)
Strongly typed contracts with code generation, compact binary payloads, multiplexing, **streaming** in both directions, built-in deadlines. Harder to debug by hand, limited browser support (needs gRPC-Web), less cache-friendly.

### GraphQL
Clients ask for exactly the fields they need in one round trip; one schema across many backends. Costs: caching is harder (POST to one endpoint), query complexity must be limited, N+1 resolver problems (DataLoader), authorization per field.

### Choices
* **Internal service-to-service**: gRPC for performance, contracts and deadlines (REST is fine if the org standard).
* **Public partner API**: REST: universally consumable, stable, cacheable, easy to document.
* **Mobile app with many screens**: GraphQL (or a BFF): reduces round trips and lets screens evolve independently.`,
    pitfalls: [
      "GraphQL without query cost limits.",
      "gRPC for public browser-facing APIs without a gateway.",
      "Choosing by hype rather than consumers.",
    ],
    followUpQuestions: [
      "How do you evolve Protobuf schemas safely?",
      "How would you cache GraphQL responses?",
    ],
    faangFocus: "A common trade-off question; tailoring to consumers is the key.",
  },
  {
    id: 'arch-28',
    categoryId: 'architecture',
    title: 'API Pagination: Offset vs Cursor',
    difficulty: 'Solid',
    tags: ['Pagination', 'Keyset', 'API Design', 'Performance'],
    scenario: "Page 5,000 of a transactions API takes 8 seconds, and users scrolling a feed see duplicate items when new entries arrive.",
    question: "Explain both problems and design better pagination.",
    idealAnswer: `### Offset pagination
\`LIMIT 20 OFFSET 100000\`: the database must **produce and discard** 100,000 rows before returning 20, so deep pages get slower and slower. When rows are inserted before the current offset, items **shift**: users see duplicates or miss items.

### Cursor (keyset) pagination
Use the sort key of the last item seen:
\`\`\`sql
SELECT * FROM tx
WHERE (created_at, id) < (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 20;
\`\`\`
* Uses an index seek: constant time regardless of depth.
* Stable under inserts.
* Include a unique tie-breaker (\`id\`).

### API shape
Return an **opaque cursor** (base64 of the last key) and \`hasMore\`: \`GET /tx?cursor=eyJ...&limit=20\`. Clients can't jump to page 5,000, which is usually fine (nobody needs it); offer filters or search instead.

### When offset is OK
Small datasets, admin screens, or when 'jump to page N' is a hard requirement.`,
    pitfalls: [
      "Deep offset pagination on large tables.",
      "Cursor on a non-unique column without a tie-breaker.",
      "Exposing raw internal keys that clients start depending on.",
    ],
    followUpQuestions: [
      "How do you support sorting by different columns with cursors?",
      "How do you get a total count cheaply?",
    ],
    faangFocus: "Practical API design with clear performance reasoning.",
  },
  {
    id: 'arch-29',
    categoryId: 'architecture',
    title: 'Migrating a Monolith With the Strangler Fig Pattern',
    difficulty: 'Hard',
    tags: ['Strangler Fig', 'Migration', 'Monolith', 'Microservices'],
    scenario: "A 12-year-old Java monolith must move to services without a big-bang rewrite. The business will not accept a feature freeze.",
    question: "How would you plan and execute an incremental migration?",
    idealAnswer: `### Strangler fig
Put a **routing layer** (gateway or proxy) in front of the monolith. Build new capabilities, or extract existing ones, as services, and route their traffic to the new service. Over time the monolith shrinks until it can be retired.

### Plan
1. **Map the domain**: find bounded contexts and their coupling (code, database tables, runtime calls). Start with a context that has **high change rate and low coupling**, not the hardest core.
2. **Modularise inside the monolith first** if boundaries are unclear.
3. **Extract the data**: the new service owns its tables. Transitional approaches: CDC from the monolith DB, dual writes via outbox, or the monolith calling the service's API.
4. **Route traffic gradually**: shadow traffic, then a percentage, compare results, then cut over.
5. **Remove the old code**, otherwise you maintain two implementations forever.

### Anti-corruption layer
Translate between the monolith's model and the new service's model, so legacy concepts don't leak into the new design.

### Risks
Distributed monolith (services sharing a database), migrations that stall halfway, and no measurable goal. Define success metrics (deploy frequency, lead time, incident rate) and a timeline per slice.`,
    pitfalls: [
      "Big-bang rewrites.",
      "Services that still share the monolith's database.",
      "Starting with the most entangled core domain.",
    ],
    followUpQuestions: [
      "How do you handle a transaction that spans the monolith and the new service?",
      "How would you verify the new service behaves identically?",
    ],
    faangFocus: "Staff-level migration strategy question.",
  },
  {
    id: 'arch-30',
    categoryId: 'architecture',
    title: 'Design a Notification System',
    difficulty: 'Hard',
    tags: ['System Design', 'Notifications', 'Queues', 'Fan-Out'],
    scenario: "Design a system that sends email, SMS and push notifications for 50 different product events, to 100 million users, respecting user preferences and quiet hours.",
    question: "Walk through the design.",
    idealAnswer: `### Flow
1. **Producers** (product services) publish domain events or call a Notification API with a template ID and recipient.
2. **Notification service** validates, looks up **user preferences** (channels, opt-outs, quiet hours, locale), renders templates, and applies **deduplication** (idempotency key per event) and **rate limits** per user.
3. It enqueues **per-channel** jobs: separate queues for email, SMS and push so a slow SMS provider doesn't block push.
4. **Channel workers** call providers (SES/SendGrid, Twilio, APNs/FCM) with retries, backoff, and failover between providers.
5. **Delivery tracking**: store status; ingest provider callbacks (bounces, delivered, opened).

### Scale concerns
* Campaigns to 100M users: **fan-out** in batches, throttled to provider limits; priority queues so transactional messages (password reset) jump ahead of marketing.
* Scheduled sends and quiet hours: a delay queue or scheduler that releases jobs at the user's local time.
* Preferences read-heavy: cache them.

### Reliability
At-least-once processing with idempotency keys; dead-letter queues; per-provider circuit breakers; auditing for compliance (unsubscribe, GDPR).`,
    pitfalls: [
      "One queue for all channels and priorities.",
      "No dedup, causing duplicate texts on retries.",
      "Ignoring provider rate limits and user time zones.",
    ],
    followUpQuestions: [
      "How do you guarantee a password reset email isn't delayed by a marketing campaign?",
      "How would you A/B test notification templates?",
    ],
    faangFocus: "Common design prompt covering queues, fan-out and reliability.",
  },
  {
    id: 'arch-31',
    categoryId: 'architecture',
    title: 'Design a Distributed Job Scheduler',
    difficulty: 'Expert',
    tags: ['System Design', 'Scheduling', 'Leases', 'Reliability'],
    scenario: "Design a service where teams register millions of jobs (cron-like or one-off at a time), each executed exactly once at approximately the right time, surviving node failures.",
    question: "Design the scheduler.",
    idealAnswer: `### Core data model
Jobs table: \`id, schedule, next_run_at, payload, status, owner, lease_until, attempt\`. An index on \`next_run_at\` for due jobs.

### Finding due work without double execution
* Workers poll for due jobs in small batches and **claim** them atomically: \`UPDATE ... SET lease_until = now() + 30s, owner = me WHERE id IN (SELECT ... WHERE next_run_at <= now() AND (lease_until IS NULL OR lease_until < now()) ... FOR UPDATE SKIP LOCKED)\`. \`SKIP LOCKED\` lets many workers claim different rows concurrently.
* **Leases** rather than locks: if a worker dies, the lease expires and another picks it up.
* Execution is **at-least-once**; handlers must be idempotent, or pass an execution ID (job ID + scheduled time) as an idempotency key.

### Scaling
* Partition jobs by hash across scheduler shards to spread the polling load.
* A **timing wheel** or in-memory priority queue per shard for near-term jobs, loaded from the DB, to avoid hammering it every second.
* Dispatch to execution workers through a queue so scheduling and running scale independently.

### Correctness details
Compute the next cron occurrence on completion (or at claim time), handle time zones and DST explicitly, cap catch-up after downtime (misfire policy), and record history for observability.`,
    pitfalls: [
      "Relying on a single scheduler node.",
      "Locks without expiry, so crashed workers hold jobs forever.",
      "Ignoring DST and misfire handling.",
    ],
    followUpQuestions: [
      "How does a timing wheel work?",
      "How would you prevent a job from running twice when a lease expires mid-execution?",
    ],
    faangFocus: "An expert design prompt blending databases, leases and idempotency.",
  },
  {
    id: 'arch-32',
    categoryId: 'architecture',
    title: 'Distributed Locks, Leader Election and Fencing Tokens',
    difficulty: 'Expert',
    tags: ['Distributed Locks', 'Leader Election', 'Fencing', 'ZooKeeper'],
    scenario: "Two instances both believe they hold a Redis lock for processing the same account after one of them had a long GC pause. The account's balance is corrupted.",
    question: "Why do distributed locks fail this way, and how do fencing tokens and consensus-based systems help?",
    idealAnswer: `### The failure
Instance A acquires a lock with a 10s TTL, then pauses (GC, VM migration, network delay) for 15s. The lock **expires**; B acquires it and writes. A wakes up, still believing it holds the lock, and writes too. Any lease-based lock has this problem: **the holder cannot know it lost the lock** until it checks, and it can pause right after checking.

### Fencing tokens
The lock service issues a **monotonically increasing token** with each acquisition. Every write to the protected resource includes the token, and the **resource rejects** writes with a token lower than the highest it has seen. A's stale write (token 33) is rejected after B's write (token 34). This moves safety to the resource, which is the only place it can be enforced.

### Where locks and leaders come from
* **ZooKeeper / etcd / Consul**: consensus-backed, with sessions, ephemeral nodes, and revision numbers usable as fencing tokens. Appropriate for **correctness**.
* **Redis** single-instance locks (\`SET NX PX\`): fine for **efficiency** (avoid duplicate work) where occasional double execution is harmless. Redlock's safety under clock and pause issues is disputed.
* **Database**: row locks or conditional updates (\`UPDATE ... WHERE version = ?\`) often remove the need for a separate lock entirely.

### Prefer designs that don't need locks
Single-writer per partition (Kafka partition ownership), idempotent operations, and optimistic concurrency.`,
    pitfalls: [
      "Using Redis locks for correctness-critical mutual exclusion.",
      "No fencing at the resource.",
      "Assuming a lock holder can detect expiry in time.",
    ],
    followUpQuestions: [
      "How do etcd leases and revisions implement fencing?",
      "How does Kafka's partition assignment act as leader election?",
    ],
    faangFocus: "A classic expert question (Kleppmann's critique of Redlock is the reference point).",
  },
  {
    id: 'arch-33',
    categoryId: 'architecture',
    title: 'Session Guarantees: Read-Your-Writes and Monotonic Reads',
    difficulty: 'Hard',
    tags: ['Consistency', 'Read-Your-Writes', 'Monotonic Reads', 'Replication'],
    scenario: "A user posts a comment, refreshes and it's gone, refreshes again and it's back, then it disappears once more. The system uses several asynchronously replicated read replicas.",
    question: "Name the consistency anomalies involved and how to provide session guarantees cheaply.",
    idealAnswer: `### The anomalies
* **Read-your-writes violation**: the user's own write isn't visible to them (first refresh).
* **Monotonic reads violation**: they see newer data, then older data again, because successive reads hit replicas at different replication positions (the flip-flopping).
* Related: **monotonic writes** and **writes-follow-reads** (causal ordering between a user's actions).

### Providing session guarantees
* **Sticky replica per session**: always read from the same replica, giving monotonic reads (not read-your-writes).
* **Version tokens**: return the write's log position (LSN, commit timestamp) to the client (cookie/header). Reads include it; a replica serves the read only if it has applied at least that position, otherwise route to the leader or wait briefly. This gives both guarantees.
* **Leader reads after writes** for a short window.
* Client-side: optimistically render the user's own comment locally.

### Why not strong consistency everywhere
Linearizable reads (always from the leader or via quorum) cost latency and capacity. Session guarantees give users a consistent experience at a fraction of the cost, which is what most products actually need.`,
    pitfalls: [
      "Random replica selection per request.",
      "Treating eventual consistency as 'anything goes' in UX.",
      "Forcing all reads to the leader instead of targeted guarantees.",
    ],
    followUpQuestions: [
      "How does causal consistency extend these guarantees?",
      "How do cloud databases expose session consistency (e.g. Cosmos DB)?",
    ],
    faangFocus: "Precise consistency vocabulary tied to a user-visible bug.",
  },
  {
    id: 'arch-34',
    categoryId: 'architecture',
    title: 'Hot Keys and the Celebrity Problem',
    difficulty: 'Hard',
    tags: ['Hotspots', 'Partitioning', 'Caching', 'Scaling'],
    scenario: "A celebrity with 80 million followers posts. The partition holding their post's like counter and comments melts down while the rest of the cluster is idle.",
    question: "How do you handle hot keys in partitioned systems?",
    idealAnswer: `### Why partitioning doesn't help
Partitioning spreads **different keys** across nodes. A single hot key still lives on one partition, whose capacity caps the whole feature.

### Read-hot keys
* **Replicate** the hot item to many cache nodes or suffix keys (\`post:123#0..#15\`) and read from a random copy.
* **Local in-process caching** with short TTLs; request coalescing.
* CDN for public content.

### Write-hot keys (counters)
* **Split the counter** into N sub-counters (\`likes:123:shard-k\`) updated randomly; sum them on read (cache the sum).
* **Buffer and batch**: aggregate increments in memory or a stream processor for a second, then write once.
* Accept approximate, eventually consistent counts for display.

### Detection and adaptation
Track per-key request rates (sampling, Count-Min Sketch), and switch known-hot keys (celebrities) to a special path automatically.

### Related design choice
Feeds: don't fan out celebrity posts on write to 80M timelines; merge them at read time (hybrid fan-out).`,
    pitfalls: [
      "Assuming consistent hashing fixes hot keys.",
      "Exact real-time counters where approximate would do.",
      "No hot-key detection until the incident.",
    ],
    followUpQuestions: [
      "How would you show an accurate like count to the author themselves?",
      "How does DynamoDB adaptive capacity deal with hot partitions?",
    ],
    faangFocus: "A signature problem at social-media scale.",
  },
  {
    id: 'arch-35',
    categoryId: 'architecture',
    title: 'Design a News Feed: Fan-Out on Write vs Read',
    difficulty: 'Expert',
    tags: ['System Design', 'News Feed', 'Fan-Out', 'Caching'],
    scenario: "Design the home timeline for a social network with 300M daily users, where the median user follows 200 accounts and some accounts have 100M followers.",
    question: "Walk through fan-out strategies and the overall design.",
    idealAnswer: `### Fan-out on write (push)
When someone posts, insert the post ID into each follower's precomputed timeline (Redis lists capped at ~800 entries). Reads are a single fast lookup. Cost: a post by a 100M-follower account means 100M writes, and wasted work for inactive followers.

### Fan-out on read (pull)
On timeline request, fetch recent posts from everyone you follow and merge. No write amplification, but reads are expensive (200 lookups + merge) and slow at p99.

### Hybrid (what large networks do)
* Push for normal accounts.
* **Pull for celebrities**: at read time merge the precomputed timeline with recent posts from followed high-follower accounts.
* Skip fan-out to inactive users; build their timeline on next login.

### Components
Post service (source of truth), fan-out workers consuming post events, timeline cache, ranking service (ML scoring of candidate posts), media on object storage + CDN, and a social graph store.

### Details to mention
Pagination by cursor, deletes/edits propagated lazily (filter at read), ordering by ranking rather than pure time, and backfilling when you follow someone new.`,
    pitfalls: [
      "Pure push for celebrity accounts.",
      "Pure pull with high p99 read latency.",
      "Storing full post bodies in every timeline instead of IDs.",
    ],
    followUpQuestions: [
      "How do you handle a user unfollowing someone?",
      "Where does ranking fit and how does it affect caching?",
    ],
    faangFocus: "A canonical FAANG design question.",
  },
  {
    id: 'arch-36',
    categoryId: 'architecture',
    title: 'Schema Evolution for Events',
    difficulty: 'Hard',
    tags: ['Schema Evolution', 'Avro', 'Schema Registry', 'Kafka'],
    scenario: "A producer renamed a field in its JSON event. Three consumer teams broke in production and one silently wrote nulls to its database for two days.",
    question: "How do you evolve event schemas safely in an event-driven architecture?",
    idealAnswer: `### Events are a public API
Consumers you don't know about may depend on every field, and events in a log are **replayed** later, so old versions must remain readable.

### Compatibility modes
* **Backward**: new consumers can read old data (you can add optional fields, remove fields with defaults).
* **Forward**: old consumers can read new data (add fields; old readers ignore them).
* **Full**: both. The safe default for shared topics.
Renaming a field is **both** a removal and an addition: breaking.

### Tooling
Use a schema format with explicit evolution rules (**Avro**, **Protobuf**, JSON Schema) and a **schema registry** that rejects incompatible schemas at publish time (CI and runtime). Consumers deserialize with the writer's schema and project onto their reader schema.

### Practices
* Only additive changes with defaults.
* For breaking changes, publish a **new event type or topic version** and run both during a migration window.
* Tolerant readers: ignore unknown fields, don't fail on missing optional ones.
* Consumer-driven contract tests for critical flows.
* Monitor deserialization failures and nulls in required business fields.`,
    pitfalls: [
      "Renaming fields in place.",
      "No registry or compatibility checks in CI.",
      "Consumers failing hard on unknown fields.",
    ],
    followUpQuestions: [
      "How does Protobuf's field numbering support evolution?",
      "How would you migrate all consumers to a v2 event?",
    ],
    faangFocus: "An important operational concern for event-driven systems.",
  },
  {
    id: 'arch-37',
    categoryId: 'architecture',
    title: 'Exactly-Once Semantics in Kafka',
    difficulty: 'Expert',
    tags: ['Kafka', 'Exactly-Once', 'Transactions', 'Idempotent Producer'],
    scenario: "A payments stream processor reads from `payments`, aggregates per merchant, and writes to `merchant-balances`. Duplicates appear after broker failovers and consumer restarts.",
    question: "How does Kafka achieve exactly-once processing, and what are the limits?",
    idealAnswer: `### Source 1 of duplicates: producer retries
A producer retry after a lost ack writes the record twice. **Idempotent producer** (\`enable.idempotence=true\`, default in recent clients): each producer has an ID and per-partition sequence numbers; the broker drops duplicates.

### Source 2: consume-process-produce
A crash after producing output but before committing input offsets reprocesses the input. **Transactions** fix this: the producer writes output records **and the consumer offsets** in one atomic transaction (\`sendOffsetsToTransaction\`). Either both are visible or neither.
* Consumers downstream must use \`isolation.level=read_committed\` to skip aborted records.
* \`transactional.id\` fences 'zombie' instances: a restarted instance bumps the epoch and the old one's writes are rejected.

Kafka Streams wraps all of this with \`processing.guarantee=exactly_once_v2\`.

### Limits
* Exactly-once applies **within Kafka**. Writing to a database or calling an API from the processor is outside the transaction; you need idempotent writes (upserts keyed by offset/event ID) or the outbox pattern.
* Throughput cost from transaction commits (tune commit interval).
* Read-committed consumers see higher latency (they wait for commits).`,
    pitfalls: [
      "Assuming EOS covers external side effects.",
      "Consumers using read_uncommitted and seeing aborted data.",
      "Reusing transactional.id across different logical producers.",
    ],
    followUpQuestions: [
      "How does zombie fencing work with epochs?",
      "How would you write the aggregate to Postgres exactly once?",
    ],
    faangFocus: "Deep Kafka knowledge expected for streaming platform roles.",
  },
  {
    id: 'arch-38',
    categoryId: 'architecture',
    title: 'Blue-Green, Canary and Feature Flags',
    difficulty: 'Solid',
    tags: ['Deployment', 'Canary', 'Blue-Green', 'Feature Flags'],
    scenario: "A deploy caused a 20-minute outage because a bad release went to all instances at once, and rolling back took 15 minutes.",
    question: "Compare deployment strategies that reduce blast radius and speed up recovery.",
    idealAnswer: `### Rolling update
Replace instances gradually. Default in Kubernetes. Mixed versions run simultaneously; rollback is another rolling update (slow).

### Blue-green
Run the new version (green) alongside the old (blue), switch traffic at the router, keep blue ready. **Instant rollback** by switching back. Costs double capacity during the switch, and database schemas must support both versions.

### Canary
Send a small percentage (1%, then 5%, 25%...) to the new version, compare **error rates and latency against the baseline**, and promote or roll back automatically (Argo Rollouts, Flagger). Catches issues with minimal user impact.

### Feature flags
Decouple **deploy** from **release**: code ships dark, and features are enabled per user, tenant or percentage at runtime. Rollback = flip a flag in seconds. Needs flag hygiene (remove stale flags) and testing of both paths.

### Prerequisites for all of them
Backward-compatible database migrations (expand/contract), versioned APIs, good health metrics, and automated rollback criteria.`,
    pitfalls: [
      "Schema changes that break the old version during rollout.",
      "Canaries without automated comparison metrics.",
      "Hundreds of stale feature flags.",
    ],
    followUpQuestions: [
      "How do you run a canary for a Kafka consumer?",
      "What is the expand/contract pattern?",
    ],
    faangFocus: "Operational excellence question common at every level.",
  },
  {
    id: 'arch-39',
    categoryId: 'architecture',
    title: 'SLIs, SLOs and Error Budgets',
    difficulty: 'Hard',
    tags: ['SRE', 'SLO', 'SLI', 'Error Budget', 'Observability'],
    scenario: "Product wants 100% uptime. The team is paged 30 times a week, mostly for CPU alerts, and still misses real outages.",
    question: "How would you define reliability targets and alerting properly?",
    idealAnswer: `### Definitions
* **SLI**: a measurement of user experience, e.g. 'proportion of checkout requests that succeed in under 500ms'.
* **SLO**: a target for the SLI over a window: 99.9% over 28 days.
* **Error budget**: 1 - SLO. 99.9% allows about 40 minutes of 'bad' per month.

### Why not 100%
Every extra nine costs exponentially more, users can't tell the difference beyond their own network's reliability, and 100% leaves no room to ship changes.

### Using the budget
If budget remains: ship features, take risks. If it's exhausted: freeze risky launches and invest in reliability. This turns reliability into a shared, data-driven decision with product.

### Alerting
Alert on **symptoms** (SLO burn rate), not causes (CPU). **Multi-window burn-rate alerts**: page if you're burning budget 14x faster than sustainable over 1h (and 5m), ticket for slow burns over days. This catches real outages quickly and ignores noise.

### Good SLIs
Measured close to the user (load balancer or client), covering availability, latency, and correctness for the key user journeys, not every endpoint.`,
    pitfalls: [
      "Alerting on resource metrics instead of user impact.",
      "SLOs nobody uses for decisions.",
      "Averages instead of percentiles for latency.",
    ],
    followUpQuestions: [
      "How do you compute a burn rate?",
      "How would you set an SLO for a new service with no history?",
    ],
    faangFocus: "SRE fundamentals increasingly expected of senior engineers.",
  },
  {
    id: 'arch-40',
    categoryId: 'architecture',
    title: 'Raft Consensus in Plain Terms',
    difficulty: 'Expert',
    tags: ['Raft', 'Consensus', 'Leader Election', 'Replication'],
    scenario: "Your system relies on etcd for configuration and leader election. The interviewer asks how etcd stays consistent when nodes fail.",
    question: "Explain how Raft works: leader election, log replication, and safety.",
    idealAnswer: `### Roles and terms
Each node is a **follower**, **candidate** or **leader**. Time is divided into numbered **terms**; each term has at most one leader.

### Leader election
Followers expect heartbeats from the leader. If a randomized **election timeout** expires, a follower becomes a candidate, increments the term, votes for itself and requests votes. A node grants its vote once per term, and only to a candidate whose log is **at least as up to date** as its own. A **majority** of votes makes a leader. Randomized timeouts make split votes rare.

### Log replication
Clients send commands to the leader, which appends them to its log and replicates via \`AppendEntries\`. Once a **majority** has stored an entry, it is **committed** and applied to the state machine. Followers with divergent logs are corrected by the leader (consistency check on the previous entry's index and term, then overwrite).

### Safety
Because elections require an up-to-date log and commitment requires a majority, any new leader **already has every committed entry** (majorities overlap). Committed data is never lost while a majority survives.

### Consequences
* A 5-node cluster tolerates 2 failures; 3 nodes tolerate 1. Even counts add no tolerance.
* Writes need a majority round trip, so latency depends on the slowest node of the fastest majority.
* A minority partition can't make progress: Raft chooses **consistency over availability** (CP).
* Linearizable reads need a leader check (ReadIndex or leases).`,
    pitfalls: [
      "Even-sized clusters.",
      "Spreading a cluster across high-latency regions without accounting for write latency.",
      "Assuming reads from followers are linearizable.",
    ],
    followUpQuestions: [
      "How does Raft handle membership changes?",
      "What is log compaction and why is it needed?",
    ],
    faangFocus: "Infrastructure-heavy teams expect a clear high-level Raft explanation.",
  },
  {
    id: 'arch-41',
    categoryId: 'architecture',
    title: 'Clocks in Distributed Systems',
    difficulty: 'Expert',
    tags: ['Clocks', 'Lamport', 'Vector Clocks', 'HLC'],
    scenario: "A system orders events across services by `System.currentTimeMillis()`. Occasionally a reply appears before the message it replies to, and a last-write-wins store loses updates.",
    question: "Why can't you trust wall clocks, and what are the alternatives?",
    idealAnswer: `### Wall clocks lie
Each machine's clock drifts; NTP corrects it, sometimes **jumping backwards**. Skew between machines of milliseconds (or seconds under misconfiguration) is normal. So a reply stamped on machine B can have an earlier timestamp than the message from A, and LWW keeps the 'later' write that actually happened first.

### Logical clocks
* **Lamport timestamps**: a counter incremented on each event and set to \`max(local, received) + 1\` on message receipt. If A happened-before B, then L(A) < L(B). The converse doesn't hold: it can't detect concurrency.
* **Vector clocks**: one counter per node. They can tell whether two events are ordered or **concurrent**, which is what conflict detection needs (Dynamo-style stores). Cost grows with the number of nodes.

### Hybrid Logical Clocks (HLC)
Combine physical time with a logical counter: close to wall time for humans and TTLs, but respect causality. Used by CockroachDB and others.

### Bounded uncertainty
Google Spanner's TrueTime exposes clock **uncertainty intervals** and waits them out on commit to get externally consistent timestamps: it needs GPS/atomic clocks.

### Practical rules
Use monotonic clocks (\`System.nanoTime\`) for durations, never wall time. Order events causally with sequence numbers from a single writer (e.g. a Kafka partition offset) whenever you can.`,
    pitfalls: [
      "Ordering distributed events by wall-clock timestamps.",
      "Measuring durations with currentTimeMillis.",
      "LWW conflict resolution without understanding clock skew.",
    ],
    followUpQuestions: [
      "How do vector clocks detect concurrent writes?",
      "How does CockroachDB handle clock skew?",
    ],
    faangFocus: "Distributed-systems theory frequently used to probe senior candidates.",
  },
  {
    id: 'arch-42',
    categoryId: 'architecture',
    title: 'Design a Distributed Cache',
    difficulty: 'Expert',
    tags: ['System Design', 'Distributed Cache', 'Replication', 'Eviction'],
    scenario: "Design an in-memory distributed cache (like Redis Cluster or Memcached) serving 2M ops/s with sub-millisecond latency across 100 nodes.",
    question: "Walk through partitioning, replication, eviction and failure handling.",
    idealAnswer: `### Partitioning
* **Consistent hashing with virtual nodes** or **hash slots** (Redis Cluster: 16,384 slots mapped to nodes). Slots make rebalancing explicit: move slots, not individual keys.
* Clients are **topology-aware** (cache the slot map, follow MOVED redirects) to avoid an extra proxy hop, or use a proxy tier (twemproxy, Envoy) for simpler clients.

### Replication and failover
* Each shard has a primary and replicas with async replication.
* Failure detection via gossip or a coordinator; replicas are promoted when a majority agrees the primary is down.
* Async replication means a failover can lose recent writes: acceptable for a cache, not for a database.

### Eviction and memory
LRU/LFU approximations with sampling (exact LRU is too expensive), TTLs with lazy + periodic expiry, max-memory policies, slab allocation to limit fragmentation.

### Performance
Single-threaded event loop per core (Redis) or multi-threaded with sharded locks (Memcached), pipelining, connection pooling, compact encodings for small values.

### Client-side concerns
Hot keys (replicate or local cache), thundering herds (request coalescing, jittered TTLs), cache-aside consistency with the source of truth, and cold start after a node restart.`,
    pitfalls: [
      "Treating a cache as durable storage.",
      "Modulo hashing that remaps everything on scale-out.",
      "No plan for hot keys or stampedes.",
    ],
    followUpQuestions: [
      "Why does Redis Cluster use 16,384 slots?",
      "How would you do cross-region cache invalidation?",
    ],
    faangFocus: "Classic infrastructure design question at large companies.",
  },
  {
    id: 'arch-43',
    categoryId: 'architecture',
    title: 'Active-Active Multi-Region and Conflict Resolution',
    difficulty: 'Master',
    tags: ['Multi-Region', 'Active-Active', 'CRDTs', 'Conflict Resolution'],
    scenario: "A collaborative product needs writes accepted in the US, EU and APAC with local latency, surviving a full region outage, and users editing the same data from different regions.",
    question: "How do you design active-active writes, and how are conflicts resolved?",
    idealAnswer: `### The fundamental trade-off
Synchronous cross-region consensus gives consistency but every write pays 100-200ms round trips. Local-latency writes in every region require **asynchronous replication**, which means **concurrent conflicting writes** are possible.

### Avoid conflicts where you can
* **Home region per entity**: each user/tenant/document is owned by one region that accepts its writes; other regions forward or read replicas. Most 'active-active' systems are actually this.
* Partition data so conflicts are rare.

### Resolve conflicts where you can't
* **Last-writer-wins**: simple, but silently drops data and depends on clocks (use HLC).
* **Application-level merge**: keep siblings (vector clocks detect concurrency) and merge with domain rules (e.g. union of cart items).
* **CRDTs**: data types whose merge is commutative, associative and idempotent, so replicas **converge** automatically: G-counters and PN-counters, OR-sets, LWW-registers, and sequence CRDTs (RGA, Yjs/Automerge) for collaborative text.
* **Operational transformation** for real-time editors (Google Docs style), usually with a central server.

### Operational concerns
Global unique IDs, replication lag monitoring, failover of 'home' ownership (with fencing), idempotent replication, and invariants that can't be merged (bank balance can't go negative) still need a single authority or reservations (escrow).`,
    pitfalls: [
      "LWW for data where losing writes is unacceptable.",
      "Assuming active-active removes the need for consistency design.",
      "Global invariants enforced by eventually consistent replicas.",
    ],
    followUpQuestions: [
      "Design an OR-set and explain add-wins semantics.",
      "How would you keep a global uniqueness constraint (usernames)?",
    ],
    faangFocus: "Principal-level distributed systems question.",
  },
  {
    id: 'arch-44',
    categoryId: 'architecture',
    title: 'Design a Payment Ledger',
    difficulty: 'Expert',
    tags: ['Ledger', 'Double-Entry', 'Payments', 'Consistency'],
    scenario: "Design the ledger for a wallet product: users top up, pay merchants and withdraw. Finance requires every cent to be traceable and balances must never go negative.",
    question: "Design the data model and the write path.",
    idealAnswer: `### Double-entry bookkeeping
Every movement is a **transaction** with two or more **entries** that sum to zero: debit user wallet 50, credit merchant 50. The ledger is **append-only**: never update or delete entries; corrections are new reversing entries. Balances are derived (sum of entries), and can be cached as a materialised balance updated in the same DB transaction.

### Data model
\`accounts(id, type, currency)\`, \`transactions(id, idempotency_key UNIQUE, type, created_at, metadata)\`, \`entries(id, transaction_id, account_id, amount, currency)\`, \`balances(account_id, amount, version)\`. Amounts as integers in minor units (or \`BigDecimal\` with fixed scale), never floating point.

### Write path
1. Receive a request with an **idempotency key**; return the existing result if seen.
2. In one DB transaction: lock or version-check the balance rows (\`SELECT ... FOR UPDATE\` in a consistent account order to avoid deadlocks), check the invariant (no negative balance), insert transaction + entries, update balances.
3. Publish events via an **outbox** for notifications and downstream systems.

### External money movement
Card processors and banks are asynchronous: model states (pending, settled, failed), hold funds with pending entries, and **reconcile** daily against provider reports.

### Scale
Shard by account; for hot accounts (a big merchant) use sub-accounts or batched settlement. Audit trails and immutability simplify compliance.`,
    pitfalls: [
      "Updating balances in place without entries.",
      "Floating-point money.",
      "No idempotency on payment requests.",
    ],
    followUpQuestions: [
      "How do you handle a transfer between accounts on different shards?",
      "How would reconciliation detect a missing settlement?",
    ],
    faangFocus: "Fintech favourite; correctness reasoning outweighs scale discussion.",
  },
  {
    id: 'arch-45',
    categoryId: 'architecture',
    title: 'Back-of-the-Envelope Capacity Planning',
    difficulty: 'Expert',
    tags: ['Capacity Planning', 'Estimation', 'Latency Numbers', 'Scaling'],
    scenario: "The interviewer says: 'We expect 200 million daily active users each making 50 API calls a day, with 20% of traffic in the peak hour. How many servers and how much storage do we need?'",
    question: "Do the estimation out loud and explain the method.",
    idealAnswer: `### Requests
* 200M x 50 = **10B requests/day**.
* Average: 10B / 86,400 ≈ **115k rps**.
* Peak hour carries 20%: 2B / 3,600 ≈ **555k rps**. Add headroom (e.g. 1.5x for spikes and failover): ~**850k rps** of capacity.

### Servers
If one instance handles ~2,000 rps for this workload (measure it; depends on CPU per request), you need ~425 instances, spread across 3 zones with N+1 per zone. Also mind **Little's law**: concurrency = throughput x latency. At 850k rps and 50ms, that's ~42k requests in flight, which sizes thread pools and connection pools.

### Storage
If 10% of calls write 1KB: 1B x 1KB = **1TB/day**, ~365TB/year, x3 for replication ≈ 1PB/year. That changes the architecture (tiered storage, retention).

### Useful numbers to know
Memory reference ~100ns; SSD random read ~100µs; same-DC round trip ~0.5ms; cross-continent ~150ms; 1 day ≈ 10^5 seconds.

### Method
State assumptions, round aggressively, sanity-check orders of magnitude, identify the bottleneck resource (CPU, memory, IOPS, network, DB connections), and revisit the design where numbers cross thresholds.`,
    pitfalls: [
      "Designing for average rather than peak traffic.",
      "False precision instead of stated assumptions.",
      "Forgetting replication and headroom.",
    ],
    followUpQuestions: [
      "How would you verify the 2,000 rps per instance assumption?",
      "What's the bandwidth needed if responses are 5KB?",
    ],
    faangFocus: "Expected in every large-company design round.",
  },
  {
    id: 'arch-46',
    categoryId: 'architecture',
    title: 'Cell-Based Architecture and Blast Radius',
    difficulty: 'Master',
    tags: ['Cells', 'Blast Radius', 'Resilience', 'Multi-Tenancy'],
    scenario: "A bad configuration push took down the entire platform for every customer at once. Leadership asks how to ensure no single failure ever affects more than a small fraction of customers again.",
    question: "Explain cell-based architecture and how you'd adopt it.",
    idealAnswer: `### The idea
Split the system into many **independent, full-stack copies** (cells), each serving a subset of customers: its own services, databases, queues and caches. A thin **cell router** maps each customer (tenant, account, shard key) to a cell. Failures, bad deploys, poison requests and noisy neighbours are contained to one cell.

### Why it limits blast radius
* Deploys roll out **cell by cell** (canary cells first); a bad change hits 2% of customers, not 100%.
* Capacity per cell is bounded and tested, so scaling means adding cells rather than growing one giant, untested cluster.
* Shuffle sharding (each customer mapped to a random combination of resources) further reduces correlated impact.

### Design concerns
* **Cell router** must be extremely simple and highly available; it's the one shared component.
* **Cross-cell** data and operations (global search, admin views, customers moving cells) need separate aggregation paths.
* **Cell migration** tooling to rebalance customers.
* Operational overhead: many copies to deploy and monitor, so automation is a prerequisite.

### Adoption
Start with the stateless tier and routing, then partition data stores by cell. Size cells from load tests, define a maximum cell size, and track blast radius as an explicit metric for every change.`,
    pitfalls: [
      "Shared global dependencies that defeat the isolation.",
      "A complex router that becomes the new single point of failure.",
      "Deploying to all cells simultaneously.",
    ],
    followUpQuestions: [
      "How does shuffle sharding work mathematically?",
      "How would you move a large customer between cells without downtime?",
    ],
    faangFocus: "Principal-level resilience pattern used by AWS and others.",
  },
  {
    id: 'arch-47',
    categoryId: 'architecture',
    title: 'The Twelve-Factor App',
    difficulty: 'Core',
    tags: ['12-Factor', 'Cloud Native', 'Configuration', 'Best Practices'],
    scenario: "A service reads config from a file baked into the image, writes logs to local files, and stores uploads on disk. It struggles on Kubernetes.",
    question: "Which twelve-factor principles does it violate and why do they matter?",
    idealAnswer: `### The factors most relevant here
* **Config** in the environment: config varies per deploy; code and images don't. Baked-in config means rebuilding images per environment. Use env vars, ConfigMaps or a config service.
* **Logs as event streams**: write to stdout; the platform collects and routes logs. Local log files fill disks and vanish with the container.
* **Processes are stateless and share-nothing**: uploads on local disk disappear when the pod moves and aren't visible to other replicas. Use object storage.
* **Disposability**: fast startup and graceful shutdown so instances can be killed and replaced any time.

### The rest, briefly
One codebase per app; explicitly declared dependencies; backing services (DB, queues) as attached resources via config; strict separation of build, release and run; port binding (self-contained server); concurrency by scaling processes; dev/prod parity; admin tasks as one-off processes.

### Why it matters
These properties are exactly what autoscaling, rolling deploys and container schedulers assume. Violating them works on a pet server and fails in the cloud.`,
    pitfalls: [
      "Environment-specific images.",
      "Local state in containers.",
      "Log files inside containers.",
    ],
    followUpQuestions: [
      "How do you handle secrets under the config factor?",
      "What would you add to twelve-factor today (observability, security)?",
    ],
    faangFocus: "Cloud-native basics; a quick check of deployment literacy.",
  },
  {
    id: 'arch-48',
    categoryId: 'architecture',
    title: 'Hexagonal Architecture in Java Services',
    difficulty: 'Solid',
    tags: ['Hexagonal Architecture', 'Clean Architecture', 'Ports and Adapters'],
    scenario: "Business rules in a service are spread across controllers, JPA entities and Kafka listeners. Testing a pricing rule requires a database and a broker.",
    question: "How does hexagonal (ports and adapters) architecture help, and how would you structure the code?",
    idealAnswer: `### The idea
Put **domain logic at the centre**, free of frameworks. The domain defines **ports** (interfaces) for what it needs (\`OrderRepository\`, \`PaymentGateway\`) and what it offers (use cases). **Adapters** on the outside implement them: REST controllers and Kafka listeners (driving side), JPA repositories and HTTP clients (driven side).

### Dependency rule
Dependencies point **inwards**. The domain never imports Spring, JPA or Kafka classes. Adapters depend on the domain, not the reverse.

### Structure
\`\`\`
order/
  domain/        Order, PricingPolicy (pure Java)
  application/   PlaceOrderUseCase, ports (interfaces)
  adapters/
    in/web/      OrderController
    in/kafka/    PaymentEventsListener
    out/jpa/     JpaOrderRepository
    out/http/    StripePaymentGateway
\`\`\`

### Benefits
Pricing rules are tested with plain unit tests; infrastructure can be swapped; business logic is readable in one place.

### Pragmatism
Mapping between domain objects and JPA entities costs code. For CRUD-heavy services, a simpler layered design is fine. Enforce boundaries with ArchUnit tests rather than hoping.`,
    pitfalls: [
      "JPA annotations and Spring dependencies leaking into the domain.",
      "Ports that just mirror database tables.",
      "Applying heavy architecture to trivial CRUD.",
    ],
    followUpQuestions: [
      "Should JPA entities be your domain model?",
      "How would you test the use case layer?",
    ],
    faangFocus: "Common architecture discussion for senior Java roles.",
  },
  {
    id: 'arch-49',
    categoryId: 'architecture',
    title: 'Domain-Driven Design: Bounded Contexts and Aggregates',
    difficulty: 'Hard',
    tags: ['DDD', 'Bounded Context', 'Aggregates', 'Microservices'],
    scenario: "A `Customer` class has 90 fields because sales, billing, support and shipping all added what they needed. Every change breaks another team.",
    question: "How do bounded contexts and aggregates address this?",
    idealAnswer: `### Bounded contexts
A **bounded context** is a boundary within which a model and its language are consistent. 'Customer' means different things to sales (a lead with a pipeline stage), billing (an account with payment methods and invoices) and shipping (a recipient with addresses). Each context gets **its own model** of the customer with only what it needs, linked by a shared ID. The 90-field class is the symptom of a missing boundary.

### Context mapping
Define relationships between contexts: published language/events, customer-supplier, **anti-corruption layers** to translate external models, shared kernel (rarely).

### Aggregates
A cluster of objects treated as **one consistency boundary**, with a root that enforces invariants. Rules:
* Modify one aggregate per transaction.
* Reference other aggregates **by ID**, not object references.
* Keep aggregates small; large ones cause contention and slow loads.
Example: \`Order\` with its \`OrderLines\` is an aggregate enforcing 'total must equal the sum of lines'; \`Customer\` is a separate aggregate referenced by \`customerId\`.

### Connection to microservices
Bounded contexts are the best candidates for service boundaries; cross-aggregate consistency becomes eventual, via domain events.`,
    pitfalls: [
      "One shared canonical model across the enterprise.",
      "Huge aggregates loaded and locked for every change.",
      "Object references between aggregates, leading to accidental cross-aggregate transactions.",
    ],
    followUpQuestions: [
      "How do you find bounded contexts (event storming)?",
      "When is eventual consistency between aggregates unacceptable?",
    ],
    faangFocus: "Architecture-level question common for senior and lead roles.",
  },
  {
    id: 'arch-50',
    categoryId: 'architecture',
    title: 'Load Shedding and Admission Control',
    difficulty: 'Hard',
    tags: ['Load Shedding', "Little's Law", 'Overload', 'Resilience'],
    scenario: "During a traffic spike, a service's latency rises from 50ms to 30s, then everything times out and throughput drops to nearly zero, even though CPU is only at 70%.",
    question: "Explain what happens during overload and how to shed load gracefully.",
    idealAnswer: `### Queueing collapse
Little's law: in-flight requests = arrival rate x latency. When arrivals exceed capacity, **queues grow**, latency rises, clients time out and **retry**, which raises arrivals further. The server spends its time on requests whose clients already gave up: **goodput collapses** even though the machine looks busy but not maxed out (it may be bottlenecked on a pool or lock).

### Admission control
* **Bound concurrency** and queues (per endpoint), and reject quickly with **429/503 + Retry-After** when full. Fast rejection is cheap; slow failure is expensive.
* **Adaptive concurrency limits** (Netflix concurrency-limits, TCP-like AIMD based on latency) that find the capacity automatically.
* **Deadline awareness**: drop queued requests whose deadline has already passed.
* **LIFO queueing** under overload (serve newest requests, which still have waiting clients) with a CoDel-style queue timeout.

### Prioritisation
Classify traffic: checkout over recommendations, user traffic over batch jobs, health checks always. Shed the lowest priority first.

### Client side
Retry budgets, backoff with jitter, circuit breakers, so clients help rather than amplify.`,
    pitfalls: [
      "Unbounded queues that hide overload until latency explodes.",
      "Processing requests whose clients already timed out.",
      "Treating all traffic as equally important.",
    ],
    followUpQuestions: [
      "How does an adaptive concurrency limiter decide the limit?",
      "Why can LIFO be better than FIFO under overload?",
    ],
    faangFocus: "Reliability depth expected for senior backend and SRE roles.",
  },
  {
    id: 'arch-51',
    categoryId: 'architecture',
    title: 'Design a Chat System',
    difficulty: 'Hard',
    tags: ['System Design', 'WebSockets', 'Messaging', 'Presence'],
    scenario: "Design one-to-one and group chat for 50M daily users with online presence, delivery receipts and message history across devices.",
    question: "Walk through the design.",
    idealAnswer: `### Connections
Clients keep a **persistent WebSocket** (or MQTT) connection to a **connection gateway** tier. A session registry (Redis) maps \`userId → gateway node(s)\` for each device. Gateways are stateful per connection, so deploys must drain connections gradually.

### Sending a message
1. Client sends message with a client-generated ID (for dedup and retries).
2. Chat service **persists** it (ordered per conversation), assigns a server sequence number, and acks to the sender (sent ✓).
3. It looks up recipients' gateways and pushes the message; offline recipients get a **push notification** (APNs/FCM).
4. Recipient devices ack delivery and read status; receipts flow back the same way.

### Ordering and storage
Order per conversation using a sequence from a single writer per conversation (partition by conversation ID in Kafka or the DB). Storage: wide-column store (Cassandra/ScyllaDB) keyed by \`(conversation_id, seq)\` for fast history paging. Clients sync by 'give me messages after seq N' for multi-device consistency.

### Group chats
Small groups: fan out to each member. Very large groups/channels: store once, members pull, and push only notifications.

### Presence
Heartbeats update a TTL key; publish changes only to interested contacts and batch/throttle updates, since presence traffic can exceed message traffic.

### Extras
End-to-end encryption (Signal protocol) changes the server to a relay of ciphertext; media via object storage with signed URLs.`,
    pitfalls: [
      "No client message IDs, so retries create duplicates.",
      "Global ordering attempts instead of per-conversation ordering.",
      "Broadcasting presence to everyone.",
    ],
    followUpQuestions: [
      "How do you handle a user connected on three devices?",
      "How would you roll out a new gateway version without dropping connections?",
    ],
    faangFocus: "Popular design prompt testing real-time systems knowledge.",
  },
  {
    id: 'arch-52',
    categoryId: 'architecture',
    title: 'Change Data Capture for Search and Read Models',
    difficulty: 'Expert',
    tags: ['CDC', 'Debezium', 'Elasticsearch', 'Eventual Consistency'],
    scenario: "Product search runs on Elasticsearch, updated by the application writing to both Postgres and ES. The two drift apart, and some products are missing from search.",
    question: "Why do dual writes drift, and how would you build a reliable indexing pipeline with CDC?",
    idealAnswer: `### Dual writes can't be atomic
Writing to Postgres then Elasticsearch: a crash, timeout or ES rejection between the two leaves them inconsistent. Retrying out of order can overwrite newer data with older data. There's no transaction spanning both.

### Change Data Capture
Treat the database's **write-ahead log** as the source of change events. **Debezium** reads the Postgres WAL via logical replication and publishes row-level changes to Kafka, in commit order, including deletes. An indexer consumes and updates Elasticsearch.
* Every committed change is captured; nothing is published for rolled-back transactions.
* No application code changes to 'remember' to publish.

### Making the indexer correct
* **Idempotent upserts** keyed by product ID.
* **Ordering**: partition by product ID so changes for one product are applied in order; use the source LSN or a version as ES \`external\` version to reject stale updates.
* **Denormalisation**: search documents often join several tables; either build them from multiple CDC streams in a stream processor (Kafka Streams/Flink) or re-read the full aggregate on each change.
* **Backfill/reindex**: snapshot mode in Debezium, then stream; blue-green indices with aliases for mapping changes.

### Outbox vs raw CDC
Raw table CDC couples consumers to your schema. The **outbox pattern + CDC** publishes deliberate domain events instead, a better contract for other teams.`,
    pitfalls: [
      "Dual writes without a reconciliation strategy.",
      "Consumers depending on internal table schemas.",
      "Out-of-order updates overwriting newer documents.",
    ],
    followUpQuestions: [
      "How do you rebuild the whole index with zero downtime?",
      "What happens to CDC when you run a schema migration?",
    ],
    faangFocus: "Expert-level data-integration design, common at data-intensive companies.",
  },
];
