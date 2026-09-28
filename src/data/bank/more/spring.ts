import type { Question } from '../../types';

/**
 * Spring, part two: from the container basics every interview opens with
 * to transaction internals and reactive backpressure.
 */
export const SPRING_MORE_QUESTIONS: Question[] = [
  {
    id: 'spring-16',
    categoryId: 'spring',
    title: 'IoC, the Container and ApplicationContext vs BeanFactory',
    difficulty: 'Core',
    tags: ['IoC', 'ApplicationContext', 'BeanFactory', 'Basics'],
    scenario: "An interviewer opens with: 'Forget annotations for a minute. What problem does Spring's container actually solve?'",
    question: "Explain Inversion of Control and dependency injection, and the difference between `BeanFactory` and `ApplicationContext`.",
    idealAnswer: `### Inversion of Control
Normally an object creates or looks up its own dependencies. With IoC, **something else** (the container) creates objects and hands them their dependencies. Your classes only declare what they need. Dependency injection is the most common form of IoC.

Benefits: loose coupling (depend on interfaces), easy substitution in tests, and one place that manages lifecycle, configuration and cross-cutting behaviour such as transactions via proxies.

### BeanFactory
The core interface: create beans from definitions, resolve dependencies, return them by name or type. Lazy by default.

### ApplicationContext
A \`BeanFactory\` plus the enterprise features you actually use:
* **Eager** creation of singletons at startup, so wiring errors fail fast.
* Automatic registration of \`BeanPostProcessor\`s and \`BeanFactoryPostProcessor\`s (which is what makes \`@Autowired\`, \`@Transactional\` and \`@Value\` work).
* Event publishing, i18n (\`MessageSource\`), resource loading, \`Environment\` and profiles.

In practice you always use an \`ApplicationContext\`; Spring Boot creates one for you.`,
    pitfalls: [
      "Describing DI as 'Spring creates objects with new for me' without the decoupling point.",
      "Calling context.getBean() throughout business code (service locator, not DI).",
      "Not knowing that singletons are created eagerly at startup.",
    ],
    followUpQuestions: [
      "What is a BeanDefinition?",
      "Why is failing fast at startup valuable?",
    ],
    faangFocus: "Almost every Spring interview starts here. Keep it crisp and conceptual.",
  },
  {
    id: 'spring-17',
    categoryId: 'spring',
    title: '@Component vs @Service vs @Repository vs @Controller',
    difficulty: 'Core',
    tags: ['Stereotypes', 'Component Scan', 'Annotations'],
    scenario: "A developer asks whether it matters that all their classes are annotated with `@Component`, since everything works.",
    question: "What are the stereotype annotations, and do they behave differently?",
    idealAnswer: `### All are @Component
\`@Service\`, \`@Repository\` and \`@Controller\` are meta-annotated with \`@Component\`, so component scanning registers all of them as beans.

### Where behaviour differs
* **\`@Repository\`**: a \`PersistenceExceptionTranslationPostProcessor\` wraps these beans so vendor exceptions (JDBC, Hibernate) are translated into Spring's \`DataAccessException\` hierarchy.
* **\`@Controller\`**: picked up by Spring MVC as a handler; methods with \`@RequestMapping\` become endpoints. \`@RestController\` adds \`@ResponseBody\`.
* **\`@Service\`**: no extra behaviour today. It documents intent.

### Why use the right one
Readability, layered architecture rules (ArchUnit tests can assert 'controllers do not call repositories'), pointcuts that target a layer, and the repository exception translation.`,
    pitfalls: [
      "Claiming @Service adds transactions.",
      "Missing exception translation by using @Component on DAOs.",
      "Classes outside the component-scan base package never being registered.",
    ],
    followUpQuestions: [
      "How does component scanning find classes?",
      "How would you enforce layer rules automatically?",
    ],
    faangFocus: "A quick check; mentioning exception translation is what earns the point.",
  },
  {
    id: 'spring-18',
    categoryId: 'spring',
    title: '@Bean vs @Component and @Configuration proxyBeanMethods',
    difficulty: 'Solid',
    tags: ['@Bean', '@Configuration', 'CGLIB', 'proxyBeanMethods'],
    scenario: "Two `@Bean` methods in a class annotated `@Component` both call `dataSource()`. The app ends up with two connection pools.",
    question: "When do you use `@Bean` vs `@Component`, and why did calling `dataSource()` twice create two pools?",
    idealAnswer: `### @Component vs @Bean
* **\`@Component\`** on your own class: Spring discovers and instantiates it.
* **\`@Bean\`** on a factory method: you control construction. Needed for third-party classes you cannot annotate, or when construction needs logic.

### Full vs lite mode
In a **\`@Configuration\`** class (default \`proxyBeanMethods = true\`), Spring subclasses the class with CGLIB. Calls between \`@Bean\` methods are intercepted and return the **existing singleton**.

In a \`@Component\` class, or \`@Configuration(proxyBeanMethods = false)\`, \`@Bean\` methods run in **lite mode**: \`dataSource()\` is a plain Java call and creates a new object each time. Hence two pools.

### Which to use
Spring Boot's own auto-configurations use \`proxyBeanMethods = false\` for faster startup and native-image friendliness. Then you must express dependencies as **method parameters**, not inter-method calls:

\`\`\`java
@Bean JdbcTemplate jdbc(DataSource ds) { return new JdbcTemplate(ds); }
\`\`\``,
    pitfalls: [
      "Calling other @Bean methods inside a lite-mode class.",
      "Making @Configuration classes or @Bean methods final (CGLIB cannot proxy them).",
      "Using @Bean for your own classes when @Component would do.",
    ],
    followUpQuestions: [
      "Why is proxyBeanMethods = false better for GraalVM native images?",
      "What is a static @Bean method used for?",
    ],
    faangFocus: "Separates people who use Spring from people who understand its proxies.",
  },
  {
    id: 'spring-19',
    categoryId: 'spring',
    title: 'How @Autowired Resolves Candidates',
    difficulty: 'Core',
    tags: ['@Autowired', '@Qualifier', '@Primary', 'DI'],
    scenario: "After adding a second `PaymentGateway` implementation, startup fails with `NoUniqueBeanDefinitionException`.",
    question: "How does Spring pick a bean for an injection point, and what are the ways to resolve ambiguity?",
    idealAnswer: `### Resolution order
1. Match by **type** (including generics).
2. If several match, prefer the one marked **\`@Primary\`**.
3. Otherwise use a **\`@Qualifier\`** on the injection point.
4. Otherwise fall back to matching the **parameter or field name** against bean names.
5. Still ambiguous: \`NoUniqueBeanDefinitionException\`. None: \`NoSuchBeanDefinitionException\` (unless optional).

### Options
* \`@Primary\` on the default implementation.
* \`@Qualifier("stripe")\` or a custom qualifier annotation for readability.
* Inject **all** of them: \`List<PaymentGateway>\` (ordered by \`@Order\`) or \`Map<String, PaymentGateway>\` keyed by bean name. This is the clean way to implement a strategy pattern.
* \`ObjectProvider<T>\` for optional or lazy lookup.
* \`@ConditionalOnProperty\` so only one is registered per environment.

### Prefer constructor injection
Final fields, easy tests, and missing dependencies fail at startup. With a single constructor, \`@Autowired\` is not needed.`,
    codeSnippet: `@Service
class CheckoutService {
    private final Map<String, PaymentGateway> gateways;

    CheckoutService(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }

    Receipt pay(Order o) { return gateways.get(o.provider()).charge(o); }
}`,
    pitfalls: [
      "Relying on parameter names matching bean names by accident.",
      "Field injection that hides dependencies and blocks immutability.",
      "Using @Primary and then being surprised a qualifier-less test picks it.",
    ],
    followUpQuestions: [
      "How does Spring order a List<T> injection?",
      "What does ObjectProvider give you over Optional<T>?",
    ],
    faangFocus: "A practical DI question that appears in nearly every Spring interview.",
  },
  {
    id: 'spring-20',
    categoryId: 'spring',
    title: 'What @SpringBootApplication Really Does',
    difficulty: 'Core',
    tags: ['Spring Boot', 'Component Scan', 'Auto-Configuration'],
    scenario: "A new service puts its main class in `com.acme.app.boot` and controllers in `com.acme.app.web`. None of the endpoints are registered.",
    question: "Break down `@SpringBootApplication` and explain why the controllers are missing.",
    idealAnswer: `### Three annotations in one
* **\`@SpringBootConfiguration\`**: a \`@Configuration\`, so the class can declare beans.
* **\`@EnableAutoConfiguration\`**: loads auto-configuration classes listed in \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`, each guarded by \`@Conditional\`s.
* **\`@ComponentScan\`**: scans the **package of the annotated class and its sub-packages**.

### Why the controllers are missing
\`com.acme.app.web\` is a **sibling** of \`com.acme.app.boot\`, not a sub-package, so it is never scanned. Fix: move the main class to the root package \`com.acme.app\` (the convention), or set \`scanBasePackages\`.

### What SpringApplication.run does
Creates the right \`ApplicationContext\` type (servlet, reactive or none), loads properties, applies auto-configuration, refreshes the context, starts the embedded server and runs \`CommandLineRunner\`/\`ApplicationRunner\` beans.`,
    pitfalls: [
      "Main class in a sub-package, missing half the beans.",
      "Scanning too broadly (e.g. 'com') and picking up library classes.",
      "Excluding auto-configurations blindly instead of reading the conditions report.",
    ],
    followUpQuestions: [
      "How do you see which auto-configurations applied and why?",
      "How would you exclude a specific auto-configuration?",
    ],
    faangFocus: "Entry-level Spring Boot; the package-structure bug is a very common real problem.",
  },
  {
    id: 'spring-21',
    categoryId: 'spring',
    title: '@RestController vs @Controller and Message Converters',
    difficulty: 'Core',
    tags: ['Spring MVC', '@RestController', 'Jackson', 'HttpMessageConverter'],
    scenario: "A controller method returns a `User` object but Spring throws an error looking for a view named 'user'.",
    question: "What's the difference between `@Controller` and `@RestController`, and how does a returned object become JSON?",
    idealAnswer: `### The difference
\`@RestController\` = \`@Controller\` + \`@ResponseBody\` on every method. Without \`@ResponseBody\`, the return value is treated as a **view name** (or model attribute) and resolved by a \`ViewResolver\`, which explains the error.

### From object to JSON
1. The handler returns an object.
2. Spring picks an \`HttpMessageConverter\` based on the return type and the client's \`Accept\` header (content negotiation).
3. With Jackson on the classpath, \`MappingJackson2HttpMessageConverter\` serialises it to JSON.
The same mechanism in reverse turns a \`@RequestBody\` into an object.

### ResponseEntity
Return \`ResponseEntity<T>\` when you need to control the status code and headers (201 with a Location header, 204, etc.).

### Serialisation tips
Return **DTOs**, not JPA entities: entities cause lazy-loading exceptions, infinite recursion on bidirectional relations and leak internal fields.`,
    pitfalls: [
      "Returning JPA entities directly from controllers.",
      "Mixing view controllers and REST controllers without @ResponseBody.",
      "Ignoring the Accept header and producing the wrong media type.",
    ],
    followUpQuestions: [
      "How do you customise the ObjectMapper in Spring Boot?",
      "What happens if no converter supports the requested media type?",
    ],
    faangFocus: "Basic but frequently asked; the DTO-vs-entity advice shows real-world experience.",
  },
  {
    id: 'spring-22',
    categoryId: 'spring',
    title: '@PathVariable vs @RequestParam vs @RequestBody',
    difficulty: 'Core',
    tags: ['Spring MVC', 'REST', 'Request Binding'],
    scenario: "You're designing `GET /orders/{id}`, `GET /orders?status=OPEN&page=2` and `POST /orders`.",
    question: "Which binding annotations fit each endpoint, and what are the REST design reasons?",
    idealAnswer: `### The three
* **\`@PathVariable\`**: part of the resource's **identity**. \`/orders/{id}\`.
* **\`@RequestParam\`**: optional **filters, sorting, paging** for a collection. \`?status=OPEN&page=2\`. Can have defaults and be optional.
* **\`@RequestBody\`**: the **payload** of a create/update, deserialised by a message converter. Add \`@Valid\` to run bean validation.

### Also useful
\`@RequestHeader\` (e.g. \`Idempotency-Key\`), \`@CookieValue\`, \`@ModelAttribute\` for form posts, and binding query params to a record for complex filters.

### Design rules
* GET must not have a body you rely on; use query parameters.
* Do not put sensitive data in URLs (they end up in logs).
* Validate everything and return 400 with a clear error body when binding fails.`,
    codeSnippet: `@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id) { ... }

@GetMapping("/orders")
Page<OrderDto> list(@RequestParam(defaultValue = "OPEN") Status status, Pageable page) { ... }

@PostMapping("/orders")
ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrder cmd) { ... }`,
    pitfalls: [
      "Putting filters in the path.",
      "Sending sensitive values as query parameters.",
      "Forgetting @Valid, so annotations on the DTO are ignored.",
    ],
    followUpQuestions: [
      "How does Pageable get bound from query parameters?",
      "How do you return a 201 with a Location header?",
    ],
    faangFocus: "Basic REST fluency, often combined with a short API design question.",
  },
  {
    id: 'spring-23',
    categoryId: 'spring',
    title: 'Starters, Embedded Servers and the Executable Jar',
    difficulty: 'Solid',
    tags: ['Spring Boot', 'Starters', 'Fat Jar', 'Tomcat'],
    scenario: "Ops asks why a Spring Boot service is deployed as a single jar with no application server, and how `java -jar` finds nested dependencies.",
    question: "Explain starters, the embedded server, and how Boot's executable jar works.",
    idealAnswer: `### Starters
A starter is a dependency descriptor with **no code**: \`spring-boot-starter-web\` pulls in Spring MVC, Jackson, validation and embedded Tomcat at versions tested together (managed by the Boot BOM). Auto-configuration then reacts to what is on the classpath.

### Embedded server
Instead of deploying a WAR into Tomcat, the application **starts Tomcat itself** (or Jetty, Undertow, or Netty for WebFlux). The app owns its server version and config, which fits containers and 12-factor deployments. Swap servers by excluding one starter and adding another.

### The executable jar
The Boot Maven/Gradle plugin repackages into a jar with:
* \`BOOT-INF/classes\` (your code) and \`BOOT-INF/lib\` (dependency jars, **nested, not unpacked**).
* A \`Main-Class\` of Boot's \`JarLauncher\`, with your class as \`Start-Class\`.
The launcher creates a class loader that can read nested jars, then calls your main method.

### For containers
Use **layered jars** (dependencies, snapshot deps, app) or buildpacks so image layers cache well and a code change does not reship 80MB of libraries.`,
    pitfalls: [
      "Overriding versions managed by the Boot BOM and getting incompatible libraries.",
      "Building one fat layer in Docker so every change reuploads everything.",
      "Pulling in both Tomcat and Netty starters and getting an unexpected server.",
    ],
    followUpQuestions: [
      "How do you exclude Tomcat and use Undertow?",
      "What does spring-boot-dependencies provide?",
    ],
    faangFocus: "Checks deployment understanding; layered jars show container experience.",
  },
  {
    id: 'spring-24',
    categoryId: 'spring',
    title: 'Bean Validation: @Valid, @Validated, Groups and Custom Constraints',
    difficulty: 'Solid',
    tags: ['Validation', '@Valid', '@Validated', 'Jakarta Validation'],
    scenario: "Constraints on a nested `Address` object are ignored, and a `@Min` on a service method parameter never fires.",
    question: "How does validation work in Spring, and why are those constraints being skipped?",
    idealAnswer: `### Controller-level validation
\`@Valid @RequestBody CreateUser dto\` runs Jakarta Bean Validation (Hibernate Validator) during binding. Failures raise \`MethodArgumentNotValidException\` (400).

### Nested objects need cascading
Constraints on a nested field are only checked if the field itself is annotated **\`@Valid\`**. That is why \`Address\` was skipped.

### Method validation needs @Validated
Constraints on **service method parameters** only run when the class is annotated **\`@Validated\`**, which creates an AOP proxy (\`MethodValidationPostProcessor\`). Same proxy caveats apply: self-invocation skips it.

### Groups
\`@Validated(OnCreate.class)\` validates only constraints in that group, e.g. \`id\` must be null on create but not null on update.

### Custom constraints
An annotation with \`@Constraint(validatedBy = ...)\` plus a \`ConstraintValidator\`. Use class-level constraints for cross-field rules (end date after start date).`,
    codeSnippet: `record CreateUser(@NotBlank String name,
                  @Email String email,
                  @Valid @NotNull Address address) {}

@Validated
@Service
class TransferService {
    void transfer(@Positive BigDecimal amount) { ... }
}`,
    pitfalls: [
      "Missing @Valid on nested objects and collections.",
      "Expecting method validation without @Validated on the class.",
      "Putting business rules requiring DB access into validators.",
    ],
    followUpQuestions: [
      "How do you return a consistent error body for validation failures?",
      "How would you validate elements of a List<Item>?",
    ],
    faangFocus: "Everyday Spring knowledge; the cascade and proxy details show depth.",
  },
  {
    id: 'spring-25',
    categoryId: 'spring',
    title: 'Filters vs HandlerInterceptors vs AOP',
    difficulty: 'Solid',
    tags: ['Filter', 'HandlerInterceptor', 'AOP', 'Cross-Cutting'],
    scenario: "You need to add request logging, a correlation ID, per-endpoint authorization checks and method timing. A teammate wants to put all of it in one filter.",
    question: "Where does each mechanism sit in the request path, and which fits each concern?",
    idealAnswer: `### Order in the request path
1. **Servlet \`Filter\`**: before Spring MVC, wraps the whole request. Sees raw request/response and can wrap them. Spring Security is a filter chain.
2. **\`DispatcherServlet\`** picks a handler.
3. **\`HandlerInterceptor\`**: \`preHandle\`, \`postHandle\`, \`afterCompletion\` around the handler. Knows **which controller method** was selected (\`HandlerMethod\`), so it can read its annotations.
4. **AOP advice**: around any Spring bean method, not only web requests.

### Matching concerns
* **Correlation ID / MDC, request logging, compression, CORS**: filter. Must cover everything including errors and security rejections.
* **Authorization tied to endpoint annotations**: Spring Security method security, or an interceptor if custom.
* **Method timing, auditing of service calls**: AOP (or Micrometer's \`@Timed\`/\`@Observed\`).

### Gotchas
* Reading the request body in a filter consumes the stream; use \`ContentCachingRequestWrapper\`.
* Always clear MDC in \`finally\`.
* Filter order matters; use \`@Order\` or \`FilterRegistrationBean\`.`,
    pitfalls: [
      "Reading the body in a filter and breaking @RequestBody.",
      "Putting logic that needs handler info into a filter.",
      "Forgetting that AOP doesn't apply to self-invocation.",
    ],
    followUpQuestions: [
      "Where does Spring Security sit relative to your filters?",
      "How would you log response bodies safely?",
    ],
    faangFocus: "A design question that reveals whether you know the request pipeline.",
  },
  {
    id: 'spring-26',
    categoryId: 'spring',
    title: '@Transactional(readOnly = true): What It Really Does',
    difficulty: 'Solid',
    tags: ['@Transactional', 'readOnly', 'Hibernate', 'Performance'],
    scenario: "A teammate claims `readOnly = true` prevents writes to the database. Another says it's a performance optimization. A third says it does nothing.",
    question: "Who's right? Explain the effects of a read-only transaction in a Spring + Hibernate stack.",
    idealAnswer: `### Mostly an optimisation hint, partly all three
* **Hibernate**: the session's flush mode becomes \`MANUAL\` and entities are loaded read-only, so **no dirty checking and no snapshot copies** are kept. Real memory and CPU savings when loading many entities.
* **JDBC**: Spring calls \`Connection.setReadOnly(true)\`. What that does depends on the driver: PostgreSQL issues \`SET TRANSACTION READ ONLY\`, so writes **do fail**; MySQL may route to replicas or optimise.
* **Routing**: with an \`AbstractRoutingDataSource\` you can send read-only transactions to replicas (use \`LazyConnectionDataSourceProxy\` so the flag is known before the connection is picked).

### What it does not guarantee
It is not a security control. Depending on the database, a native write statement may still succeed. Use DB permissions for that.

### Common pattern
\`@Transactional(readOnly = true)\` at class level on query services, and plain \`@Transactional\` on write methods.`,
    pitfalls: [
      "Relying on readOnly to prevent writes.",
      "Routing to replicas and forgetting replication lag for read-your-writes.",
      "Adding readOnly on a method that is called from inside a read-write transaction (the outer one wins).",
    ],
    followUpQuestions: [
      "How does replica lag affect a read right after a write?",
      "What does FlushMode.MANUAL change?",
    ],
    faangFocus: "Checks whether you know what annotations do at the driver and ORM level.",
  },
  {
    id: 'spring-27',
    categoryId: 'spring',
    title: 'Spring Data Repositories: From Interface to Query',
    difficulty: 'Solid',
    tags: ['Spring Data JPA', 'Repositories', 'Projections', 'Pagination'],
    scenario: "A developer is amazed that an interface with a method `findByEmailAndStatus` works without an implementation, but a query method named `findTop10ByOrderByCreatedAtDesc` loads entire entities with 40 columns.",
    question: "How does Spring Data create repository implementations, and how do you keep queries efficient?",
    idealAnswer: `### Where the implementation comes from
At startup Spring Data scans for repository interfaces and creates a **JDK proxy** for each, backed by \`SimpleJpaRepository\`. Query methods are parsed from their **names** into JPQL (\`findByEmailAndStatus\` becomes a WHERE on both fields), validated at startup, so typos fail fast.

### Query options
* **Derived queries**: great for simple lookups; unreadable beyond two or three conditions.
* **\`@Query\`**: explicit JPQL or native SQL.
* **Specifications / Querydsl**: dynamic filters.
* **Custom fragments**: an interface + \`Impl\` class for hand-written code.

### Efficiency
* **Projections**: return an interface or record DTO with only needed columns instead of whole entities.
* **Pagination**: \`Pageable\` issues a count query too; use \`Slice\` if you do not need the total, and keyset pagination for deep pages.
* **Fetching**: \`@EntityGraph\` or join fetch to avoid N+1.
* **Modifying queries**: \`@Modifying\` bulk updates bypass the persistence context; clear it afterwards.`,
    codeSnippet: `interface OrderRepository extends JpaRepository<Order, Long> {
    record OrderSummary(Long id, BigDecimal total, Instant createdAt) {}

    List<OrderSummary> findTop10ByCustomerIdOrderByCreatedAtDesc(long customerId);

    @EntityGraph(attributePaths = "lines")
    Optional<Order> findWithLinesById(long id);
}`,
    pitfalls: [
      "Very long derived method names that nobody can read.",
      "Loading full entities for list screens.",
      "Page<T> count queries on huge tables.",
    ],
    followUpQuestions: [
      "How does save() decide between persist and merge?",
      "When would you drop to JdbcTemplate?",
    ],
    faangFocus: "Common for backend roles; projections and pagination costs show production awareness.",
  },
  {
    id: 'spring-28',
    categoryId: 'spring',
    title: '@Async: How It Works and How It Fails',
    difficulty: 'Solid',
    tags: ['@Async', 'Executors', 'Proxies', 'Exceptions'],
    scenario: "A method annotated `@Async` runs synchronously when called from another method in the same class, and elsewhere exceptions from `@Async void` methods disappear.",
    question: "Explain how @Async is implemented and fix both issues.",
    idealAnswer: `### Implementation
\`@EnableAsync\` registers a post-processor that wraps beans with \`@Async\` methods in an **AOP proxy**. The proxy submits the call to an executor and returns immediately.

### Issue 1: runs synchronously
Calling \`this.sendEmail()\` from the same class bypasses the proxy, so no async. Move the method to another bean (or inject the proxy of self).

### Issue 2: lost exceptions
* For \`void\` methods there is no future to carry the exception; it goes to the \`AsyncUncaughtExceptionHandler\` (default: log at error level). Configure one that reports properly.
* Return \`CompletableFuture<T>\` so callers can observe results and failures.

### Configure the executor
Spring Boot auto-configures a \`ThreadPoolTaskExecutor\` (\`spring.task.execution.*\`), or virtual threads when enabled. Define your own for isolation: bounded queue, name prefix, rejection policy, and a \`TaskDecorator\` to propagate MDC/security context.

### Other caveats
The method must be public (for interface-based proxies); transactions do not span into the async method; the caller's \`ThreadLocal\`s are gone.`,
    pitfalls: [
      "Self-invocation of @Async methods.",
      "Fire-and-forget void methods with no error handling.",
      "Assuming the caller's transaction or security context carries over.",
    ],
    followUpQuestions: [
      "How do you propagate the SecurityContext to @Async threads?",
      "What happens when the executor's queue is full?",
    ],
    faangFocus: "Common Spring question, usually paired with proxy knowledge.",
  },
  {
    id: 'spring-29',
    categoryId: 'spring',
    title: '@Scheduled: The Single-Thread Default and Clustered Jobs',
    difficulty: 'Solid',
    tags: ['@Scheduled', 'ShedLock', 'Scheduling', 'Clustering'],
    scenario: "A service has two `@Scheduled` jobs. When the nightly export runs for 40 minutes, the every-minute heartbeat job stops. After scaling to 3 pods, the export runs three times.",
    question: "Explain both problems and how to fix them.",
    idealAnswer: `### Problem 1: one scheduler thread
By default Spring's scheduler is a **single-threaded** \`ThreadPoolTaskScheduler\`. A long job blocks every other job. Fix: \`spring.task.scheduling.pool.size\`, or have the scheduled method hand off long work to a separate executor. With virtual threads enabled, Boot uses a virtual-thread scheduler.

### Problem 2: every instance runs it
\`@Scheduled\` is per JVM. Options:
* **ShedLock**: a lock row in the DB (or Redis) ensures only one instance runs each execution; set \`lockAtMostFor\` for crash safety.
* Run scheduled work in a **separate deployment** with one replica, or use a Kubernetes \`CronJob\`.
* Use Quartz in clustered mode for complex scheduling.

### Other gotchas
* \`fixedRate\` vs \`fixedDelay\` semantics (fixedDelay is usually safer).
* Cron expressions in Spring have **six fields** (seconds first) and use the server time zone unless \`zone\` is set.
* Exceptions are logged and the next run still happens (unlike raw \`ScheduledExecutorService\`).`,
    pitfalls: [
      "Assuming each @Scheduled method has its own thread.",
      "Running singleton jobs on every replica.",
      "Using a five-field Unix cron expression and getting a startup error.",
    ],
    followUpQuestions: [
      "How does ShedLock handle a pod that dies holding the lock?",
      "When would you prefer a Kubernetes CronJob?",
    ],
    faangFocus: "Very common production gotcha; clustered scheduling is the senior part.",
  },
  {
    id: 'spring-30',
    categoryId: 'spring',
    title: 'Logging in Spring Boot and Correlation IDs With MDC',
    difficulty: 'Solid',
    tags: ['Logging', 'SLF4J', 'Logback', 'MDC', 'Observability'],
    scenario: "Logs from 30 concurrent requests are interleaved and impossible to follow. The team also logs at DEBUG in production to diagnose issues.",
    question: "How is logging set up in Spring Boot, and how do you make logs traceable per request?",
    idealAnswer: `### The stack
Code logs through **SLF4J**. Spring Boot defaults to **Logback**; levels are set per package with \`logging.level.com.acme=DEBUG\` and can be changed at runtime through the Actuator \`loggers\` endpoint, so you do not need DEBUG everywhere permanently.

### Correlation with MDC
The **Mapped Diagnostic Context** is a per-thread map whose entries can be included in every log line. A filter takes the incoming \`traceparent\`/\`X-Request-Id\` (or generates one), puts it in MDC and clears it in \`finally\`. With Micrometer Tracing, trace and span IDs are added automatically.

### Across threads
MDC is ThreadLocal-based. Propagate it to \`@Async\` and executors with a \`TaskDecorator\`, and to Reactor with context propagation.

### Production hygiene
* **Structured JSON logs** (Boot 3.4+ has built-in structured logging) for aggregation in ELK/Loki.
* Parameterised messages \`log.info("Order {}", id)\` instead of string concatenation.
* Never log secrets or full PII; mask them.
* Async appenders for high-volume logging.`,
    codeSnippet: `@Component
class CorrelationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String id = Optional.ofNullable(req.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
        MDC.put("requestId", id);
        res.setHeader("X-Request-Id", id);
        try { chain.doFilter(req, res); } finally { MDC.remove("requestId"); }
    }
}`,
    pitfalls: [
      "Not clearing MDC, leaking IDs to the next request on the thread.",
      "String concatenation in disabled debug logs.",
      "Logging PII or tokens.",
    ],
    followUpQuestions: [
      "How do trace IDs propagate between services?",
      "How would you change a log level in production without redeploying?",
    ],
    faangFocus: "Observability basics expected of any senior backend engineer.",
  },
  {
    id: 'spring-31',
    categoryId: 'spring',
    title: 'RestTemplate vs WebClient vs RestClient vs HTTP Interfaces',
    difficulty: 'Solid',
    tags: ['RestClient', 'WebClient', 'RestTemplate', 'HTTP'],
    scenario: "A new MVC service needs to call five downstream APIs. The team debates RestTemplate, WebClient, and the newer RestClient.",
    question: "Compare the options and describe the configuration every HTTP client needs in production.",
    idealAnswer: `### The options
* **\`RestTemplate\`**: classic synchronous client. In maintenance mode; fine in existing code.
* **\`WebClient\`**: reactive, non-blocking. Right for WebFlux apps or heavy concurrent fan-out; pulling in Reactor just to call \`.block()\` in MVC is a poor trade.
* **\`RestClient\`** (Spring 6.1+): synchronous with a fluent API, the modern choice for MVC apps, especially with virtual threads.
* **HTTP interfaces** (\`@HttpExchange\`): declare an interface, Spring generates the client, backed by RestClient or WebClient. A built-in alternative to Feign.

### Production configuration (any client)
* **Timeouts**: connect, read/response, and connection-pool acquisition. Defaults are often infinite.
* **Connection pooling** with sensible max per route.
* **Retries** only for idempotent requests, with backoff and jitter, and a circuit breaker.
* **Observability**: build clients from the auto-configured \`RestClient.Builder\` so Micrometer metrics and trace propagation are wired.
* Error handling: map 4xx/5xx to domain exceptions instead of leaking HTTP details.`,
    codeSnippet: `@HttpExchange("/customers")
interface CustomerClient {
    @GetExchange("/{id}") CustomerDto get(@PathVariable long id);
}

@Bean
CustomerClient customerClient(RestClient.Builder builder) {
    var factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(2));
    RestClient rc = builder.baseUrl("https://customers.internal")
            .requestFactory(factory)
            .build();
    return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(rc)).build()
            .createClient(CustomerClient.class);
}`,
    pitfalls: [
      "No timeouts, so one slow dependency exhausts all threads.",
      "Creating clients with new instead of the observed builder.",
      "Retrying non-idempotent POSTs.",
    ],
    followUpQuestions: [
      "How do you add a circuit breaker to RestClient calls?",
      "Why does blocking on WebClient inside WebFlux cause trouble?",
    ],
    faangFocus: "Practical and current: knowing RestClient and timeout discipline signals up-to-date experience.",
  },
  {
    id: 'spring-32',
    categoryId: 'spring',
    title: 'Conditional Beans and Writing Your Own Auto-Configuration',
    difficulty: 'Hard',
    tags: ['Auto-Configuration', '@Conditional', 'Starters'],
    scenario: "Your platform team wants every service to get an audit client bean automatically, but services must be able to override it or turn it off.",
    question: "How do you build this with auto-configuration and conditions?",
    idealAnswer: `### The building blocks
* An \`@AutoConfiguration\` class registered in \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`.
* **Conditions**:
  * \`@ConditionalOnClass\`: only if the library is on the classpath.
  * \`@ConditionalOnMissingBean\`: back off if the application defined its own bean. This is what makes it **overridable**.
  * \`@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", matchIfMissing = true)\`: switch it off.
* \`@EnableConfigurationProperties\` with a typed properties class for settings.

### Ordering
User configuration is processed before auto-configurations, so \`@ConditionalOnMissingBean\` sees user beans. Use \`@AutoConfiguration(after = ...)\` when depending on another auto-config.

### Packaging
Put the auto-configuration in an \`acme-audit-autoconfigure\` module and a thin \`acme-audit-spring-boot-starter\` that depends on it and the library.

### Testing
\`ApplicationContextRunner\` tests each condition quickly without starting a server.`,
    codeSnippet: `@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    AuditClient auditClient(AuditProperties props, RestClient.Builder http) {
        return new AuditClient(http.baseUrl(props.url()).build());
    }
}`,
    pitfalls: [
      "Using @ComponentScan in auto-configuration (it leaks beans into every app).",
      "Forgetting @ConditionalOnMissingBean, making overrides impossible.",
      "Registering in the old spring.factories location for Boot 3.",
    ],
    followUpQuestions: [
      "How do you debug why an auto-configuration did not apply?",
      "How do you test conditions with ApplicationContextRunner?",
    ],
    faangFocus: "Platform-engineering flavour; shows you understand how Boot itself is built.",
  },
  {
    id: 'spring-33',
    categoryId: 'spring',
    title: 'Stateful Singletons and Thread Safety',
    difficulty: 'Solid',
    tags: ['Singleton', 'Thread Safety', 'Bean Scope'],
    scenario: "A `@Service` stores the current user's cart in an instance field between two method calls. Under load, customers see each other's carts.",
    question: "Why does this happen, and how should request-specific state be handled in Spring?",
    idealAnswer: `### Singletons are shared by every request
The default scope is **singleton**: one instance per container, called concurrently by every request thread. An instance field is therefore **shared mutable state** across all users. Two requests interleave and overwrite each other's cart.

### Rules for singleton beans
* Keep them **stateless**: only final references to other beans and immutable config.
* Pass request data through **method parameters** and return values.
* Put per-user state where it belongs: the database, a cache keyed by user, or the HTTP session.
* If a bean truly needs per-request state, use \`@RequestScope\` (which injects a scoped proxy), but that is rarely the cleanest design.
* Shared caches or counters inside a singleton must be thread-safe structures.

### Catching it early
Code review rule: any non-final field in a \`@Service\` needs justification. Static analysis tools flag this too.`,
    pitfalls: [
      "Using instance fields as scratch space between method calls.",
      "Making beans prototype scoped and expecting Spring to create one per request.",
      "Non-thread-safe helpers (SimpleDateFormat) stored as fields.",
    ],
    followUpQuestions: [
      "What happens when you inject a prototype bean into a singleton?",
      "How does @RequestScope work with a proxy?",
    ],
    faangFocus: "A realistic bug; it checks you connect bean scope to concurrency.",
  },
  {
    id: 'spring-34',
    categoryId: 'spring',
    title: 'Graceful Shutdown and Kubernetes Probes in Spring Boot',
    difficulty: 'Hard',
    tags: ['Graceful Shutdown', 'Kubernetes', 'Probes', 'SmartLifecycle'],
    scenario: "Every deploy causes a burst of 502s and a few half-processed Kafka messages.",
    question: "How do you configure a Spring Boot service to shut down and start up cleanly in Kubernetes?",
    idealAnswer: `### Shutdown
* \`server.shutdown=graceful\`: on SIGTERM the web server stops accepting new requests and waits for in-flight ones, up to \`spring.lifecycle.timeout-per-shutdown-phase\`.
* Kubernetes removes the pod from Service endpoints **at the same time** as sending SIGTERM, and propagation is not instant. Add a \`preStop\` sleep (5-10s) so the load balancer stops routing first. This is the usual cause of 502s.
* Message listeners, schedulers and executors stop via \`SmartLifecycle\` phases; make sure they drain and commit offsets before the context closes.
* \`terminationGracePeriodSeconds\` must exceed preStop + drain time.

### Startup and probes
* Actuator exposes \`/actuator/health/liveness\` and \`/actuator/health/readiness\` (enabled automatically on Kubernetes).
* **Readiness** gates traffic: include dependencies required to serve (carefully; a DB blip should not take the whole fleet out of rotation).
* **Liveness** should only reflect the JVM being wedged, never downstream health, or you get restart storms.
* Use a **startupProbe** for slow-starting apps instead of large initial delays.`,
    codeSnippet: `server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 25s
management:
  endpoint.health.probes.enabled: true

# deployment.yaml
lifecycle:
  preStop:
    exec: { command: ["sh", "-c", "sleep 10"] }
terminationGracePeriodSeconds: 45`,
    pitfalls: [
      "Liveness probes that check the database.",
      "No preStop delay, so traffic arrives after shutdown starts.",
      "Grace period shorter than the drain timeout.",
    ],
    followUpQuestions: [
      "How do you mark the app not-ready during a long cache warm-up?",
      "What does AvailabilityChangeEvent do?",
    ],
    faangFocus: "Operational maturity; very commonly probed for senior backend roles.",
  },
  {
    id: 'spring-35',
    categoryId: 'spring',
    title: '@TransactionalEventListener and Publishing After Commit',
    difficulty: 'Hard',
    tags: ['Events', '@TransactionalEventListener', 'Transactions'],
    scenario: "An `OrderPlaced` event triggers a welcome email. Sometimes the email is sent for orders that were rolled back, and sometimes the email listener can't find the order in the database.",
    question: "Explain both bugs and how transaction-bound events fix them. What guarantees remain missing?",
    idealAnswer: `### Why the bugs happen
A plain \`@EventListener\` runs **synchronously, inside the publisher's transaction**, at the moment of publishing.
* Rolled-back orders: the email is sent before the transaction later fails.
* Order not found: if the listener runs async or in a new transaction, it may query before the commit is visible.

### @TransactionalEventListener
Binds the listener to a transaction phase:
* \`AFTER_COMMIT\` (default): runs only if the transaction committed. Fixes both bugs.
* \`AFTER_ROLLBACK\`, \`AFTER_COMPLETION\`, \`BEFORE_COMMIT\`.
If no transaction is active, the event is dropped unless \`fallbackExecution = true\`.

### Traps
* In \`AFTER_COMMIT\`, the original transaction is finished; writing to the DB requires \`@Transactional(propagation = REQUIRES_NEW)\` on the listener.
* Combine with \`@Async\` so slow listeners do not extend request latency.

### What is still missing
The event lives in memory. If the JVM dies between commit and the listener finishing, the email is **lost**. For guaranteed delivery use the **transactional outbox**: write the event to a table in the same transaction and relay it (Spring Modulith's event publication registry does this).`,
    pitfalls: [
      "Using @EventListener for side effects that must follow a commit.",
      "Writing to the DB in an AFTER_COMMIT listener without REQUIRES_NEW.",
      "Assuming in-memory events survive crashes.",
    ],
    followUpQuestions: [
      "How does Spring Modulith persist event publications?",
      "What happens if an AFTER_COMMIT listener throws?",
    ],
    faangFocus: "A strong senior question tying Spring internals to consistency guarantees.",
  },
  {
    id: 'spring-36',
    categoryId: 'spring',
    title: 'Spring Cloud in the Kubernetes Era',
    difficulty: 'Hard',
    tags: ['Spring Cloud', 'Service Discovery', 'Config Server', 'Kubernetes'],
    scenario: "A team migrating to Kubernetes asks whether they still need Eureka, Spring Cloud Config, Ribbon and Zuul.",
    question: "Which Spring Cloud components still earn their place on Kubernetes, and which are replaced by the platform?",
    idealAnswer: `### Replaced or largely redundant
* **Eureka service discovery**: Kubernetes Services + DNS already give stable names and load balancing.
* **Ribbon / Zuul / Hystrix**: in maintenance or removed. Replaced by Spring Cloud LoadBalancer, Spring Cloud Gateway and Resilience4j.
* **Config Server**: ConfigMaps and Secrets mounted as files or env vars cover most needs; Spring Boot reads them natively (\`spring.config.import=configtree:\`).

### Still valuable
* **Spring Cloud Gateway**: edge routing, auth, rate limiting, if you do not already have an ingress/API gateway doing it.
* **Resilience4j via Spring Cloud CircuitBreaker**: client-side resilience is still your job.
* **Config Server** when you need versioned, audited config across many environments or non-Kubernetes deployments.
* **Spring Cloud Stream** for broker-agnostic messaging.

### Platform alternatives to weigh
A **service mesh** (Istio, Linkerd) can do retries, mTLS and traffic shifting outside the app. Avoid doing retries in both the mesh and the client, which multiplies load.`,
    pitfalls: [
      "Running Eureka on Kubernetes out of habit.",
      "Retries in the mesh and in the client, causing retry storms.",
      "Hot-reloading config without thinking about consistency across pods.",
    ],
    followUpQuestions: [
      "When would client-side load balancing still be useful on Kubernetes?",
      "How would you roll out a config change safely?",
    ],
    faangFocus: "Checks whether your Spring Cloud knowledge is current and platform-aware.",
  },
  {
    id: 'spring-37',
    categoryId: 'spring',
    title: '@Cacheable: Keys, Proxies, TTLs and Stampedes',
    difficulty: 'Hard',
    tags: ['@Cacheable', 'Caching', 'Redis', 'Caffeine'],
    scenario: "`@Cacheable` on a product lookup gives a 90% hit rate in dev, 0% in production (where calls come from within the same class), and occasionally returns another tenant's data.",
    question: "Explain how Spring's caching abstraction works and fix the problems.",
    idealAnswer: `### How it works
\`@EnableCaching\` wraps beans in a **proxy**. On a \`@Cacheable\` call the proxy computes a key, checks the \`CacheManager\` (Caffeine, Redis...), and only invokes the method on a miss.

### 0% hit rate
Self-invocation bypasses the proxy, the same as \`@Transactional\`. Call through another bean.

### Wrong tenant's data
The default key uses **only the method parameters**. If tenant comes from a ThreadLocal, two tenants asking for product 42 share a key. Include it explicitly: \`key = "#tenant + ':' + #id"\` or a custom \`KeyGenerator\`.

### Other essentials
* **TTL/size limits** are configured on the cache provider, not the annotation. Unbounded caches are memory leaks.
* **Stampede protection**: \`@Cacheable(sync = true)\` makes concurrent misses on one key wait for a single load (per JVM).
* \`@CacheEvict\` / \`@CachePut\` on writes, but in a cluster with local caches you need invalidation messages or a shared cache.
* \`unless = "#result == null"\` to avoid caching empty results where appropriate.
* Cached objects in Redis must be serialisable and versioned; a class change can break deserialisation.`,
    pitfalls: [
      "Self-invocation.",
      "Keys missing tenant, locale or user context.",
      "No TTL, or local caches that go stale across replicas.",
    ],
    followUpQuestions: [
      "How do you invalidate local caches across 20 pods?",
      "Two-level caching: when is it worth the complexity?",
    ],
    faangFocus: "Caching bugs are common in practice; the tenant-key bug is a strong real-world signal.",
  },
  {
    id: 'spring-38',
    categoryId: 'spring',
    title: 'Retries in Spring: @Retryable and Transaction Boundaries',
    difficulty: 'Hard',
    tags: ['Spring Retry', 'Resilience4j', 'Transactions', 'Idempotency'],
    scenario: "A method annotated `@Transactional @Retryable` retries after an optimistic lock failure, but every retry fails with the same stale entity.",
    question: "Why don't the retries help, and how should retries and transactions be combined?",
    idealAnswer: `### The retry is inside the transaction
Both annotations create proxies. If the **transaction advice is outside** the retry advice, all attempts run within the **same transaction** and the same persistence context, with the same stale entity. Worse, after an optimistic lock failure the transaction is marked **rollback-only**, so nothing can succeed.

### The fix: retry outside, transaction inside
Each attempt must start a **new transaction** that re-reads fresh data:
* Put \`@Retryable\` on an outer bean method that calls a separate \`@Transactional\` bean, or
* Set advice order so retry wraps the transaction.

### What to retry
* Transient errors: optimistic locking conflicts, deadlock victims, timeouts, 503s.
* **Not** validation errors or 4xx.
* Use exponential backoff **with jitter** and a small max attempts.
* Only retry operations that are **idempotent**, or protected by idempotency keys.

### Library choice
Spring Retry is fine for simple cases; Resilience4j combines retry with circuit breakers, bulkheads and metrics.`,
    codeSnippet: `@Service
class TransferFacade {
    private final TransferService tx;

    @Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
               maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2, random = true))
    public void transfer(TransferCmd cmd) { tx.transfer(cmd); }   // new transaction per attempt
}`,
    pitfalls: [
      "Retrying inside a transaction that is already rollback-only.",
      "Retrying non-idempotent side effects like sending emails.",
      "Retrying without backoff and jitter, synchronising clients.",
    ],
    followUpQuestions: [
      "How do retries interact with a circuit breaker?",
      "How would you make a payment call safe to retry?",
    ],
    faangFocus: "A senior-level trap combining AOP ordering, transactions and distributed-systems thinking.",
  },
  {
    id: 'spring-39',
    categoryId: 'spring',
    title: 'Kafka Consumers in Spring: Errors, Retries and DLTs',
    difficulty: 'Hard',
    tags: ['Kafka', '@KafkaListener', 'Dead Letter Topic', 'Error Handling'],
    scenario: "One malformed message causes a `@KafkaListener` to throw forever. The partition stops moving and consumer lag grows to millions.",
    question: "How do you handle errors in Spring Kafka consumers without blocking the partition or losing data?",
    idealAnswer: `### The poison pill problem
By default the container seeks back and redelivers a failed record. A message that can never succeed blocks its partition forever.

### DefaultErrorHandler + DLT
Configure a \`DefaultErrorHandler\` with a \`BackOff\` (e.g. 3 attempts) and a \`DeadLetterPublishingRecoverer\`: after retries are exhausted, the record goes to \`orders.DLT\` with headers describing the exception, and consumption continues.
* Mark **non-retryable** exceptions (deserialisation errors, validation failures) so they go straight to the DLT.
* Use \`ErrorHandlingDeserializer\` so bad payloads do not crash the container before your code runs.

### Non-blocking retries
\`@RetryableTopic\` sends failed records to retry topics with increasing delays, so the main partition keeps flowing. The cost is **ordering**: retried messages are processed out of order.

### Commit semantics
Offsets are committed after the listener returns (at-least-once). Handlers must be **idempotent**. Keep processing time under \`max.poll.interval.ms\` or the consumer is kicked out of the group and rebalances.

### Operate the DLT
Alert on DLT volume and have a tool to inspect and replay.`,
    pitfalls: [
      "No DLT, so poison pills block partitions.",
      "Non-blocking retries where ordering matters.",
      "Long processing exceeding max.poll.interval.ms.",
    ],
    followUpQuestions: [
      "How would you replay DLT messages safely?",
      "How does listener concurrency relate to partition count?",
    ],
    faangFocus: "Event-driven services are everywhere; this is a standard senior question.",
  },
  {
    id: 'spring-40',
    categoryId: 'spring',
    title: 'The Spring MVC Request Lifecycle',
    difficulty: 'Solid',
    tags: ['DispatcherServlet', 'Spring MVC', 'HandlerMapping'],
    scenario: "An interviewer asks: 'Walk me through what happens from the moment a request hits Tomcat until JSON leaves the server.'",
    question: "Describe the Spring MVC request processing pipeline.",
    idealAnswer: `### Step by step
1. **Tomcat** accepts the connection and assigns a worker thread (or virtual thread).
2. The **servlet filter chain** runs: encoding, security, correlation IDs, CORS.
3. **\`DispatcherServlet\`** receives the request.
4. **\`HandlerMapping\`** (\`RequestMappingHandlerMapping\`) finds the controller method matching path, method, headers and content types.
5. **Interceptors'** \`preHandle\` run.
6. **\`HandlerAdapter\`** invokes the method. **Argument resolvers** bind path variables, params, headers and \`@RequestBody\` (via \`HttpMessageConverter\`s), and run validation.
7. The controller runs (through any AOP proxies of services it calls).
8. **Return value handlers** write the result: \`@ResponseBody\` goes through message converters (Jackson) based on content negotiation; otherwise a view is resolved and rendered.
9. \`postHandle\` / \`afterCompletion\` interceptors.
10. If anything threw, **\`HandlerExceptionResolver\`s** (including \`@ControllerAdvice\`) turn it into a response.

### Why it matters
Knowing the pipeline tells you where to hook in: filters for everything, interceptors for handler-aware logic, argument resolvers for custom parameter types, advice for errors.`,
    pitfalls: [
      "Putting handler-aware logic in filters.",
      "Not knowing that exceptions in filters bypass @ControllerAdvice.",
      "Custom parameter parsing inside every controller instead of an argument resolver.",
    ],
    followUpQuestions: [
      "How would you add a custom @CurrentUser argument?",
      "Where does async (DeferredResult/Callable) processing fit in?",
    ],
    faangFocus: "A classic whiteboard walk-through for Spring-heavy teams.",
  },
  {
    id: 'spring-41',
    categoryId: 'spring',
    title: 'Multiple DataSources and Read/Write Routing',
    difficulty: 'Hard',
    tags: ['DataSource', 'Routing', 'Replicas', 'Transactions'],
    scenario: "A service must write to a primary Postgres and read reports from a replica. After configuring two DataSources manually, Boot's JPA auto-configuration stops working.",
    question: "How do you configure multiple data sources in Spring Boot, and how do you route reads to replicas safely?",
    idealAnswer: `### Why auto-config backed off
Boot's \`DataSourceAutoConfiguration\` is \`@ConditionalOnMissingBean(DataSource.class)\`. Once you define your own, you own the whole setup: mark one \`@Primary\`, and define an \`EntityManagerFactory\` and \`TransactionManager\` per data source if they hold different schemas.

### Two separate databases
Separate packages of entities and repositories, \`@EnableJpaRepositories(basePackages, entityManagerFactoryRef, transactionManagerRef)\` per database. Transactions **do not span** both; you need an outbox/saga instead of XA in most systems.

### Same schema, primary + replica
Use \`AbstractRoutingDataSource\` choosing the key from \`TransactionSynchronizationManager.isCurrentTransactionReadOnly()\`, wrapped in \`LazyConnectionDataSourceProxy\` so the connection is acquired **after** the transaction's read-only flag is set.

### Replica pitfalls
* **Replication lag**: reading right after writing may miss the write. Route read-your-writes flows to the primary.
* Failover and health of each pool.
* Separate pool sizes per data source.`,
    pitfalls: [
      "Routing decided before the read-only flag is known.",
      "Assuming a transaction spans two databases.",
      "Ignoring replica lag for read-after-write flows.",
    ],
    followUpQuestions: [
      "Why is XA rarely used in microservices?",
      "How do you test routing logic?",
    ],
    faangFocus: "Common in scaling discussions; LazyConnectionDataSourceProxy is the expert detail.",
  },
  {
    id: 'spring-42',
    categoryId: 'spring',
    title: 'Reactor Threading: publishOn, subscribeOn and Blocking Calls',
    difficulty: 'Expert',
    tags: ['WebFlux', 'Reactor', 'Schedulers', 'Blocking'],
    scenario: "A WebFlux service handles 5,000 req/s until someone adds a JDBC call inside a `map`. Throughput drops to 40 req/s.",
    question: "Explain Reactor's threading model and how to integrate unavoidable blocking calls.",
    idealAnswer: `### Event loops are few and precious
WebFlux on Netty runs on a small number of **event-loop threads** (about one per core). Every operator in a pipeline runs on whatever thread emits the signal. A blocking JDBC call in \`map\` parks an event-loop thread, and every other connection on that loop waits. With 8 loops, 8 slow queries stall the server.

### Schedulers
* **\`subscribeOn(s)\`**: where the **subscription and source** run. Position in the chain does not matter; the first one wins.
* **\`publishOn(s)\`**: switches the thread for **downstream** operators from that point.
* \`Schedulers.parallel()\`: CPU work. \`Schedulers.boundedElastic()\`: **blocking** work, capped threads and queue.

### Wrapping blocking calls
\`\`\`java
Mono.fromCallable(() -> jdbcRepo.find(id))
    .subscribeOn(Schedulers.boundedElastic());
\`\`\`
Better: use non-blocking drivers (R2DBC, reactive Mongo/Redis clients).

### Detecting it
**BlockHound** fails tests when blocking calls happen on non-blocking threads.

### Honest assessment
If most of your dependencies block, WebFlux gives you complexity without benefit; MVC with virtual threads is often the better trade today.`,
    pitfalls: [
      "Blocking in map/flatMap on event-loop threads.",
      "Expecting subscribeOn placement to affect only later operators.",
      "Calling block() inside a reactive pipeline.",
    ],
    followUpQuestions: [
      "How do you propagate MDC/trace context in Reactor?",
      "When is WebFlux still the right choice with virtual threads available?",
    ],
    faangFocus: "Reactive teams ask this to check that you understand the model, not just the API.",
  },
  {
    id: 'spring-43',
    categoryId: 'spring',
    title: 'Backpressure in Project Reactor',
    difficulty: 'Expert',
    tags: ['Backpressure', 'Reactor', 'Reactive Streams', 'Flux'],
    scenario: "A Flux reading from a fast Kafka topic and writing to a slow database causes `OverflowException` and occasional OOMs.",
    question: "Explain how backpressure works in Reactive Streams, and the strategies Reactor gives you when a source cannot be slowed down.",
    idealAnswer: `### Demand-driven flow
Reactive Streams defines \`request(n)\`: a subscriber tells its upstream how many items it can take. Sources that honour it (a paging DB query, a well-behaved Kafka receiver) produce only what is requested. Operators like \`flatMap(fn, concurrency)\` and \`limitRate(n)\` shape demand.

### Hot sources ignore demand
Sources like UI events, \`Sinks.many()\` misused, or \`Flux.interval\` emit regardless. When downstream cannot keep up you must choose:
* \`onBackpressureBuffer(max, onOverflow)\`: buffer with a **bound** and an explicit overflow action.
* \`onBackpressureDrop(dropped -> metrics)\`: drop new items.
* \`onBackpressureLatest()\`: keep only the most recent (good for prices, telemetry).
* \`onBackpressureError()\`: fail fast.
An unbounded buffer is where the OOM comes from.

### Fixing the Kafka to DB case
* Use Reactor Kafka's receiver, which only polls when there is demand.
* \`flatMap(write, 16)\` to cap concurrent DB writes, or \`bufferTimeout(500, 1s)\` for batching.
* Commit offsets after successful writes.

### Beyond one process
Backpressure ends at the process boundary. Across services it becomes rate limiting, bounded queues and 429/503 responses.`,
    pitfalls: [
      "Unbounded onBackpressureBuffer().",
      "flatMap with default concurrency (256) hammering a DB.",
      "Assuming backpressure propagates over HTTP automatically.",
    ],
    followUpQuestions: [
      "What does limitRate do to request sizes?",
      "How does RSocket carry backpressure over the network?",
    ],
    faangFocus: "Deep reactive knowledge; also a good lead-in to system-level flow control.",
  },
  {
    id: 'spring-44',
    categoryId: 'spring',
    title: 'Open Session in View and Long-Held Connections',
    difficulty: 'Hard',
    tags: ['open-in-view', 'JPA', 'Connection Pool', 'Transactions'],
    scenario: "Connection pool exhaustion happens during a partner API slowdown, even though that partner call is outside every `@Transactional` method.",
    question: "What holds the connection, and what should you change?",
    idealAnswer: `### Open Session in View
Spring Boot enables \`spring.jpa.open-in-view=true\` by default (with a startup warning). An \`OpenEntityManagerInViewInterceptor\` binds an \`EntityManager\` to the thread **for the whole web request**, so lazy associations can load during JSON rendering.

Once that EntityManager has used a connection, the connection can stay bound until the request completes. A slow partner call anywhere in the request now **holds a DB connection** for its duration. Twenty slow calls exhaust a pool of twenty.

### The fix
* Set \`spring.jpa.open-in-view=false\`.
* Load what the view needs **inside the service transaction**: fetch joins, entity graphs or DTO projections.
* Map to DTOs before leaving the service layer.
* Do remote calls **outside** transactions; if a flow needs both, split it into short transactions around the DB work.

### Also check
\`@Transactional\` methods that call remote APIs, and pool metrics (\`hikaricp.connections.pending\`, usage time) to find long holders. Hikari's \`leakDetectionThreshold\` logs the stack of long-held connections.`,
    pitfalls: [
      "Leaving open-in-view on because lazy loading 'just works'.",
      "Remote calls inside transactions.",
      "Fixing LazyInitializationException with EAGER fetching everywhere.",
    ],
    followUpQuestions: [
      "How do you find which code path holds connections longest?",
      "What does Hikari's leak detection actually detect?",
    ],
    faangFocus: "A real production incident pattern; knowing the Boot default is a strong signal.",
  },
  {
    id: 'spring-45',
    categoryId: 'spring',
    title: 'Spring Batch: Chunks, Restartability and Skips',
    difficulty: 'Hard',
    tags: ['Spring Batch', 'ETL', 'Chunk Processing', 'Restartability'],
    scenario: "A nightly job imports 20 million rows from a file. It fails at row 14 million and restarting starts over from the beginning.",
    question: "How does Spring Batch structure jobs, and how do you make them restartable and fault-tolerant?",
    idealAnswer: `### Model
* **Job** made of **Steps**.
* A chunk-oriented step: **ItemReader** reads items one by one, **ItemProcessor** transforms/filters, **ItemWriter** writes a **chunk** (e.g. 1,000 items) in one transaction.
* The **JobRepository** (DB tables) stores job instances, executions and step **ExecutionContext**s.

### Restartability
After every committed chunk, the reader's position (line number, last key) is saved in the ExecutionContext in the same transaction. On restart with the **same job parameters**, the failed execution resumes from the last committed chunk. Readers must be restartable (the built-in \`FlatFileItemReader\` and paging readers are); custom readers implement \`ItemStream\`.

### Fault tolerance
\`faultTolerant()\` with \`skip(ParseException.class).skipLimit(100)\` and \`retry(TransientDataAccessException.class)\`. Skipped items go to a \`SkipListener\` for a reject file.

### Scaling
Multi-threaded steps (reader must be thread-safe), **partitioning** (split by key range across threads or workers), and remote chunking.

### Writes
Make writers idempotent (upserts) so reprocessing a partially written chunk is harmless.`,
    pitfalls: [
      "Changing job parameters on restart, creating a new instance that starts over.",
      "Non-restartable custom readers.",
      "Huge chunk sizes causing long transactions and lock contention.",
    ],
    followUpQuestions: [
      "When would you partition vs multi-thread a step?",
      "How do you choose a chunk size?",
    ],
    faangFocus: "Common in enterprise and fintech interviews where batch processing is core.",
  },
  {
    id: 'spring-46',
    categoryId: 'spring',
    title: 'Modular Monoliths With Spring Modulith',
    difficulty: 'Expert',
    tags: ['Modular Monolith', 'Spring Modulith', 'Architecture', 'Boundaries'],
    scenario: "A 400k-line Spring monolith has become a ball of mud. Leadership wants microservices; you propose a modular monolith first.",
    question: "How would you enforce module boundaries inside a Spring application, and how does Spring Modulith help?",
    idealAnswer: `### Why modules first
Most of the benefit of microservices (clear ownership, independent evolution) comes from **boundaries**, not from the network. A modular monolith gets boundaries without distributed transactions, network failures and deployment sprawl, and makes later extraction straightforward.

### Spring Modulith's conventions
* Each **direct sub-package** of the application's main package is a module; its top-level package is the **public API**, sub-packages are internal.
* \`ApplicationModules.of(App.class).verify()\` in a test fails the build on illegal dependencies or cycles.
* Modules communicate through **application events**; the **event publication registry** persists events so listeners are retried after crashes (an outbox inside the monolith).
* \`@ApplicationModuleTest\` boots just one module for integration tests.
* Generates documentation (C4 / PlantUML diagrams) of module relationships.

### Design practice
Align modules to **bounded contexts**, give each its own tables, avoid shared entities across modules, and reference other modules by ID. Those rules are what make extraction into a service a mechanical step later.`,
    pitfalls: [
      "Modules sharing JPA entities and joining across each other's tables.",
      "Synchronous calls everywhere so modules are coupled at runtime.",
      "Splitting into microservices before boundaries are stable.",
    ],
    followUpQuestions: [
      "How would you extract one module into a service later?",
      "How do you handle a query that needs data from three modules?",
    ],
    faangFocus: "An architecture-leaning Spring question common for Staff and lead roles.",
  },
  {
    id: 'spring-47',
    categoryId: 'spring',
    title: 'Transactions in Reactive Spring (R2DBC)',
    difficulty: 'Expert',
    tags: ['R2DBC', 'Reactive Transactions', 'WebFlux', 'Context'],
    scenario: "A WebFlux service uses `@Transactional` on a method that returns `Mono`, but calls a blocking JPA repository inside. Some writes are not rolled back on errors.",
    question: "How are transactions managed in reactive Spring, and why doesn't mixing in JPA work?",
    idealAnswer: `### Imperative transactions are thread-bound
\`PlatformTransactionManager\` stores the transaction and connection in \`ThreadLocal\`s via \`TransactionSynchronizationManager\`. In a reactive pipeline, work hops between threads, so thread-bound state is meaningless.

### Reactive transactions use the Reactor Context
\`ReactiveTransactionManager\` (e.g. \`R2dbcTransactionManager\`) stores the transaction in the **subscriber \`Context\`**, which travels with the pipeline regardless of thread. \`@Transactional\` on a method returning \`Mono\`/\`Flux\` is applied by wrapping the returned publisher: commit on completion, rollback on error, and on **cancel** it depends on configuration.

### Why the JPA writes escaped
JPA/JDBC calls use the **imperative** transaction manager on whatever thread they happen to run on. They are not part of the R2DBC transaction, so they commit or roll back independently.

### Rules
* Use one stack end to end: R2DBC for reactive, JPA for imperative.
* Programmatic alternative: \`TransactionalOperator.transactional(flux)\`.
* The whole transactional work must be in the **returned** publisher; subscribing to something inside a \`doOnNext\` escapes it.`,
    pitfalls: [
      "Mixing blocking JPA inside reactive transactions.",
      "Subscribing to side pipelines inside a transactional flow.",
      "Assuming ThreadLocal-based context works in Reactor.",
    ],
    followUpQuestions: [
      "What happens to a reactive transaction if the client cancels the request?",
      "How does Reactor Context differ from ThreadLocal?",
    ],
    faangFocus: "Separates people who used WebFlux from those who understand it.",
  },
  {
    id: 'spring-48',
    categoryId: 'spring',
    title: 'Runtime Configuration Changes and @RefreshScope',
    difficulty: 'Expert',
    tags: ['@RefreshScope', 'Configuration', 'Feature Flags', 'Spring Cloud'],
    scenario: "The team uses `@RefreshScope` to change timeouts at runtime. After a refresh, some in-flight requests fail and a scheduled task keeps using the old value.",
    question: "How does @RefreshScope work, what are its hazards, and what alternatives exist?",
    idealAnswer: `### Mechanism
\`@RefreshScope\` beans are behind a **scoped proxy**. On a refresh event (\`/actuator/refresh\` or Spring Cloud Bus) the scope's cache is cleared; the **next** method call through the proxy creates a new instance with fresh properties, and the old one is destroyed.

### Hazards
* **In-flight calls** may be running on the old instance while it is destroyed (e.g. its connection pool closed), causing failures.
* Beans holding a **direct reference** obtained elsewhere (a scheduled task capturing the target, not the proxy) keep the old value.
* Recreating expensive beans (pools, clients) causes latency spikes.
* Refreshes across 50 pods are **not atomic**; the fleet runs mixed configuration for a while.
* \`@ConfigurationProperties\` beans are rebound on refresh without \`@RefreshScope\`, which is usually the better option for simple values.

### Alternatives
* Read dynamic values on each use from a small config service or \`@ConfigurationProperties\` bean.
* **Feature flags** (OpenFeature, LaunchDarkly, Unleash) for behavioural switches with targeting and audit.
* Redeploy for structural changes; config-as-code with rollouts is safer than hot mutation.`,
    pitfalls: [
      "Putting connection pools in refresh scope.",
      "Assuming all pods switch at the same moment.",
      "Capturing refreshed beans outside the proxy.",
    ],
    followUpQuestions: [
      "How would you roll out a config change gradually?",
      "When is a restart simply safer?",
    ],
    faangFocus: "Senior operational judgement about dynamic configuration.",
  },
  {
    id: 'spring-49',
    categoryId: 'spring',
    title: 'How @Transactional Works Internally',
    difficulty: 'Master',
    tags: ['@Transactional', 'TransactionInterceptor', 'TransactionSynchronizationManager', 'Internals'],
    scenario: "Deep-dive round: 'Trace a call to a @Transactional service method through Spring's internals, down to the JDBC connection, and explain how a repository called three layers deeper joins the same transaction.'",
    question: "Explain the internals end to end.",
    idealAnswer: `### 1. The proxy
An infrastructure \`BeanPostProcessor\` wraps the bean in a JDK or CGLIB proxy with a **\`TransactionInterceptor\`**. \`AnnotationTransactionAttributeSource\` reads \`@Transactional\` to get propagation, isolation, timeout, readOnly and rollback rules (cached per method).

### 2. Starting the transaction
\`TransactionInterceptor.invokeWithinTransaction\` calls \`PlatformTransactionManager.getTransaction(definition)\`. For \`DataSourceTransactionManager\`/\`JpaTransactionManager\`:
* Check whether a transaction is already bound to the thread, and apply the propagation rules (join, suspend, nested savepoint, fail).
* Otherwise get a connection, \`setAutoCommit(false)\`, apply isolation/readOnly, and **bind a \`ConnectionHolder\` (or \`EntityManagerHolder\`) to the thread** in \`TransactionSynchronizationManager\`, which is a set of \`ThreadLocal\` maps keyed by the DataSource.

### 3. Joining deeper down
\`JdbcTemplate\` gets connections through \`DataSourceUtils.getConnection(ds)\`, which **looks up the thread-bound holder first**. JPA repositories use a shared \`EntityManager\` proxy that resolves the thread-bound one. That is how code three layers deep joins without any parameter passing, and why it breaks when work moves to another thread.

### 4. Completion
On return, \`commitTransactionAfterReturning\`; on exception, \`completeTransactionAfterThrowing\` checks rollback rules (**unchecked exceptions and Errors roll back by default, checked do not**). Registered \`TransactionSynchronization\`s get \`beforeCommit\`, \`afterCommit\`, \`afterCompletion\` callbacks, which is how \`@TransactionalEventListener\` works. Finally resources are unbound and the connection is returned to the pool.

### Consequences to mention
Self-invocation skips the interceptor; new threads do not see the transaction; a participating method throwing marks the shared transaction **rollback-only**, leading to \`UnexpectedRollbackException\` at the outer commit.`,
    pitfalls: [
      "Believing the annotation itself does something at runtime.",
      "Not knowing why transactions don't cross thread boundaries.",
      "Catching an exception from an inner participating method and expecting the outer commit to succeed.",
    ],
    followUpQuestions: [
      "How does NESTED propagation use savepoints?",
      "Where does UnexpectedRollbackException come from exactly?",
    ],
    faangFocus: "The deepest Spring question commonly asked; answering it fully is rare.",
  },
  {
    id: 'spring-50',
    categoryId: 'spring',
    title: 'Inside ApplicationContext.refresh()',
    difficulty: 'Master',
    tags: ['ApplicationContext', 'Startup', 'BeanFactoryPostProcessor', 'Internals'],
    scenario: "You are debugging why a `@Value` placeholder isn't resolved in a bean created by a custom `BeanFactoryPostProcessor`, and why a `BeanPostProcessor` bean itself doesn't get proxied.",
    question: "Walk through the phases of `refresh()` and use them to explain both problems.",
    idealAnswer: `### The phases (simplified)
1. **prepareRefresh**: environment and property sources validated.
2. **obtainFreshBeanFactory**: bean **definitions** loaded (component scan, \`@Configuration\` parsing happens in the next step). No beans yet.
3. **invokeBeanFactoryPostProcessors**: \`BeanDefinitionRegistryPostProcessor\`s (e.g. \`ConfigurationClassPostProcessor\`, which parses \`@Configuration\`, \`@ComponentScan\`, \`@Import\` and auto-configuration) then \`BeanFactoryPostProcessor\`s, which may **modify definitions**.
4. **registerBeanPostProcessors**: BPPs are instantiated **early**, ordered by \`PriorityOrdered\`, \`Ordered\`, then the rest.
5. initMessageSource, initApplicationEventMulticaster, **onRefresh** (Boot creates the embedded web server here), registerListeners.
6. **finishBeanFactoryInitialization**: instantiate all non-lazy singletons: constructor, dependency injection, \`Aware\` callbacks, BPP before-init, \`@PostConstruct\`/\`afterPropertiesSet\`, BPP after-init (where **AOP proxies** are created).
7. **finishRefresh**: lifecycle beans start (web server begins accepting), \`ContextRefreshedEvent\` published.

### Explaining the bugs
* A \`BeanFactoryPostProcessor\` is created in phase 3, **before** the post-processors that resolve \`@Value\` and \`@Autowired\` exist. Beans it instantiates eagerly get no injection. Declare BFPP \`@Bean\` methods as **static** and avoid instantiating other beans from them.
* \`BeanPostProcessor\` beans (and the beans they depend on) are created in phase 4, before all BPPs are registered, so they are **not eligible for full post-processing** (Spring logs 'not eligible for getting processed by all BeanPostProcessors'). Keep BPP dependencies minimal and lazy (\`ObjectProvider\`).`,
    pitfalls: [
      "Injecting business beans into a BeanPostProcessor.",
      "Non-static @Bean methods for BeanFactoryPostProcessors.",
      "Assuming definitions and instances exist at the same time.",
    ],
    followUpQuestions: [
      "Where do Boot's auto-configurations get evaluated?",
      "Why does Spring Boot AOT pre-compute parts of phase 3?",
    ],
    faangFocus: "Framework-author level; used by teams that build internal platforms on Spring.",
  },
  {
    id: 'spring-51',
    categoryId: 'spring',
    title: 'Spring Framework vs Spring Boot',
    difficulty: 'Core',
    tags: ['Spring Boot', 'Spring Framework', 'Basics'],
    scenario: "A candidate lists 'Spring and Spring Boot' on their CV. The interviewer asks what the difference is.",
    question: "What does Spring Boot add on top of the Spring Framework?",
    idealAnswer: `### Spring Framework
The foundation: IoC container, AOP, transaction management, Spring MVC/WebFlux, data access support, events. It is flexible but historically needed lots of configuration: XML or Java config for data sources, view resolvers, message converters, server deployment.

### Spring Boot
An opinionated layer that makes a production-ready app with minimal setup:
* **Auto-configuration**: sensible beans based on the classpath and properties, which back off when you define your own.
* **Starters**: curated dependency sets with compatible versions.
* **Embedded server** and executable jars; no external app server.
* **Externalised configuration**: \`application.yml\`, profiles, env vars, with defined precedence.
* **Actuator**: health, metrics, info, loggers.
* Test support (\`@SpringBootTest\`, slices), DevTools, Docker Compose/Testcontainers integration.

### In one line
Spring provides the building blocks; Boot assembles them with conventions so you write business code on day one, while still letting you override every decision.`,
    pitfalls: [
      "Saying Boot is a different framework rather than a layer on Spring.",
      "Not knowing that auto-configuration backs off for user beans.",
      "Confusing Spring Boot with Spring Cloud.",
    ],
    followUpQuestions: [
      "How do you see what Boot configured for you?",
      "When would you not use Boot?",
    ],
    faangFocus: "Warm-up question; clarity and brevity score best.",
  },
  {
    id: 'spring-52',
    categoryId: 'spring',
    title: 'ResponseEntity and Correct HTTP Status Codes',
    difficulty: 'Core',
    tags: ['REST', 'ResponseEntity', 'HTTP Status', 'API Design'],
    scenario: "An API returns 200 with `{\"error\": \"not found\"}` for missing orders, and 500 for validation failures. Client teams are unhappy.",
    question: "Which status codes should a REST API return for common situations, and how do you return them in Spring?",
    idealAnswer: `### The usual map
| Situation | Status |
|---|---|
| Read OK | 200 |
| Created | **201** + \`Location\` header |
| Accepted for async processing | 202 |
| Success, no body (delete) | 204 |
| Invalid input / validation | **400** |
| Not authenticated | 401 |
| Authenticated but not allowed | 403 |
| Resource missing | **404** |
| Conflict (duplicate, version mismatch) | 409 |
| Precondition failed (If-Match) | 412 |
| Business rule violated with valid syntax | 422 |
| Rate limited | 429 + \`Retry-After\` |
| Server bug | 500 |
| Dependency down / overloaded | 503 |

### In Spring
* \`ResponseEntity.created(uri).body(dto)\`, \`ResponseEntity.noContent().build()\`.
* \`@ResponseStatus\` on a method or exception.
* Throw domain exceptions and translate them centrally in \`@RestControllerAdvice\`, returning **\`ProblemDetail\`** (RFC 9457) bodies.

### Why it matters
Clients, retries, caches and monitoring all depend on status codes. A 200 with an error body defeats every one of them.`,
    pitfalls: [
      "200 for errors.",
      "500 for client mistakes, triggering alerts and retries.",
      "Confusing 401 and 403.",
    ],
    followUpQuestions: [
      "Which status codes are safe for clients to retry?",
      "What does ProblemDetail contain?",
    ],
    faangFocus: "API design basics, often part of a larger design exercise.",
  },
  {
    id: 'spring-53',
    categoryId: 'spring',
    title: 'CORS in Spring: Why the Browser Blocks Your Call',
    difficulty: 'Solid',
    tags: ['CORS', 'Spring Security', 'Browser', 'Web'],
    scenario: "A React app on `app.acme.com` calls `api.acme.com`. Postman works, but the browser shows a CORS error. Adding `@CrossOrigin` fixes GET but not POST with a JSON body.",
    question: "Explain CORS and configure Spring correctly.",
    idealAnswer: `### What CORS is
A **browser** protection: scripts from one origin cannot read responses from another unless the server allows it with \`Access-Control-Allow-*\` headers. Postman is not a browser, so it does not care. CORS is not a server-side security control against non-browser clients.

### Preflight
Non-simple requests (JSON content type, custom headers like \`Authorization\`, methods like PUT/DELETE) trigger an **OPTIONS preflight**. The server must answer it with allowed origin, methods and headers. The POST failed because the preflight was rejected, typically by **Spring Security** running before the MVC \`@CrossOrigin\` handling and requiring authentication for OPTIONS.

### Correct setup
Configure CORS once, and enable it in the security chain so preflights are handled before authentication:
\`\`\`java
http.cors(Customizer.withDefaults());
\`\`\`
with a \`CorsConfigurationSource\` bean listing exact origins, methods, headers, and \`allowCredentials\` if cookies are used.

### Rules
* Never combine \`allowedOrigins("*")\` with credentials (browsers reject it, and it's unsafe).
* Prefer an explicit allowlist from configuration.
* Cache preflights with \`maxAge\`.`,
    pitfalls: [
      "Thinking CORS protects the API from attackers.",
      "Configuring CORS in MVC but not in Spring Security.",
      "Wildcard origins with credentials.",
    ],
    followUpQuestions: [
      "What makes a request 'simple'?",
      "How does CORS differ from CSRF protection?",
    ],
    faangFocus: "Extremely common real-world issue; the Security-chain detail is the key.",
  },
  {
    id: 'spring-54',
    categoryId: 'spring',
    title: 'OpenFeign Clients and Their Pitfalls',
    difficulty: 'Solid',
    tags: ['OpenFeign', 'HTTP Clients', 'Timeouts', 'Error Handling'],
    scenario: "A service uses Feign clients everywhere. During an incident, calls hang for 60 seconds and 404s from a partner surface as 500s to your users.",
    question: "How do Feign clients work, and how should they be configured in production?",
    idealAnswer: `### How it works
\`@EnableFeignClients\` scans \`@FeignClient\` interfaces and creates proxies that turn method calls into HTTP requests using Spring MVC annotations. It integrates with Spring Cloud LoadBalancer and CircuitBreaker.

### Production configuration
* **Timeouts** per client: \`spring.cloud.openfeign.client.config.partner.connect-timeout\` and \`read-timeout\`. Defaults are long.
* **Error decoding**: a custom \`ErrorDecoder\` maps 404 to a domain \`NotFound\`, 409 to conflict, and 5xx to retryable exceptions, so a partner 404 does not become your 500.
* **Retries**: Feign's retryer is off by default in Spring Cloud; add retries only for idempotent calls and prefer Resilience4j.
* **Logging** at \`BASIC\` level in production; \`FULL\` leaks bodies and secrets.
* **Underlying client**: use Apache HttpClient 5 or OkHttp for pooling instead of the default.

### Status
OpenFeign is feature-complete/maintenance in Spring Cloud; for new code Spring's **HTTP interfaces** (\`@HttpExchange\`) cover the same need natively.`,
    pitfalls: [
      "Default timeouts during partner outages.",
      "Leaking downstream error codes to your clients.",
      "FULL logging in production.",
    ],
    followUpQuestions: [
      "How do you add a circuit breaker to a Feign client?",
      "How would you migrate Feign clients to HTTP interfaces?",
    ],
    faangFocus: "Common in microservice shops; error mapping and timeouts are the practical signals.",
  },
  {
    id: 'spring-55',
    categoryId: 'spring',
    title: 'An Internal Platform Starter for 200 Services',
    difficulty: 'Expert',
    tags: ['Platform Engineering', 'Starters', 'BOM', 'Governance'],
    scenario: "Your company has 200 Spring Boot services with inconsistent logging, metrics, security and dependency versions. You are asked to design a paved road.",
    question: "How would you design and roll out an internal Spring Boot platform (BOM + starters) that teams actually adopt?",
    idealAnswer: `### Components
* **Platform BOM / parent**: imports the Spring Boot BOM plus pinned versions of approved libraries, so upgrading Boot means bumping one version.
* **Starters** with auto-configuration for cross-cutting concerns: structured logging and correlation IDs, Micrometer tags and tracing, security defaults (resource server config), standard error format (\`ProblemDetail\`), HTTP client defaults (timeouts, observability), health groups for Kubernetes.
* Every auto-configuration uses \`@ConditionalOnMissingBean\` and properties, so teams can **override**, not fork.

### Adoption
* Make it the easiest path: a project generator (Spring Initializr custom instance or Backstage template).
* Automated upgrade PRs (Renovate) against the BOM; **OpenRewrite** recipes for breaking migrations.
* Conformance checks in CI (ArchUnit rules, dependency policies) that warn first, then enforce.
* Versioning policy: support N and N-1, publish changelogs and migration guides.

### Pitfalls to avoid
* Hidden magic: document every default and expose it in \`/actuator/configprops\`.
* A giant starter pulling everything in; keep them modular.
* Platform team as a bottleneck; accept contributions (inner source).

### Measuring success
Share of services on the latest BOM, time to roll out a CVE fix fleet-wide, incident classes eliminated.`,
    pitfalls: [
      "Forcing defaults with no way to override.",
      "One monolithic starter with every dependency.",
      "No automated upgrade path, so the fleet drifts again.",
    ],
    followUpQuestions: [
      "How would you roll out a breaking security change across 200 services?",
      "How do you keep the platform from becoming a bottleneck?",
    ],
    faangFocus: "Staff/Principal question on technical leadership through tooling.",
  },
];
