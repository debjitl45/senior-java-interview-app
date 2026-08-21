import type { Question } from '../types';

export const SPRING_QUESTIONS: Question[] = [
  {
    id: 'spring-1',
    categoryId: 'spring',
    title: 'Spring AOP Internals and Self-Invocation',
    difficulty: 'Hard',
    tags: ['Spring', 'AOP', 'Proxies', 'Transactions'],
    scenario: 'A developer annotates a method with @Transactional. However, when that method is called from another method within the same service class, the transaction is not started, and database operations fail to rollback on exception.',
    question: 'Explain the internal mechanics of Spring AOP proxies (JDK Dynamic Proxies vs CGLIB). Why does the "self-invocation" problem occur, and what are three distinct architectural ways to solve it?',
    idealAnswer: `### 1. Spring AOP Proxy Mechanics
Spring AOP does not modify the actual original bytecode of your classes. Instead, it wraps your target bean in a **Proxy** object.
* **JDK Dynamic Proxies:** Used if the target class implements at least one interface. Spring creates a proxy class that implements the same interfaces and delegates calls to the target.
* **CGLIB Proxies:** Used if the target class does not implement an interface (or if CGLIB is explicitly forced, which is the default in Spring Boot 2+). CGLIB dynamically generates a **subclass** of your target class and overrides its non-final methods to inject the cross-cutting concerns (like Transaction Management).

### 2. The Self-Invocation Problem
When a client injects your service, they are actually receiving the **Proxy** reference. 
* When the client calls \`proxy.outerMethod()\`, the proxy intercepts the call, starts the transaction, and delegates to \`target.outerMethod()\`.
* If \`outerMethod()\` internally calls \`this.innerTransactionalMethod()\`, the call is made directly on the **target instance** (\`this\`), completely bypassing the Proxy! Therefore, the AOP interceptor for \`@Transactional\` is never triggered.

### 3. Three Solutions
1. **Self-Injection:** Inject the service into itself using \`@Autowired\` or constructor injection (requires \`@Lazy\` to avoid circular dependency errors). Call the inner method via the injected proxy reference.
2. **AopContext:** Enable \`@EnableAspectJAutoProxy(exposeProxy = true)\` and retrieve the current proxy via \`((MyService) AopContext.currentProxy()).innerTransactionalMethod()\`.
3. **Compile-Time / Load-Time Weaving (AspectJ):** Bypass Spring's runtime proxies entirely by using the full AspectJ compiler to weave the transactional logic directly into the actual class bytecode. This completely eliminates the self-invocation issue.`,
    codeSnippet: `@Service
public class OrderService {

    // Solution 1: Inject the proxy into itself
    @Autowired
    @Lazy
    private OrderService self;

    public void createOrder() {
        // This routes through the proxy! Transaction will start.
        self.saveToDatabase(); 
    }

    @Transactional
    public void saveToDatabase() {
        // DB logic
    }
}`,
    pitfalls: [
      'Believing that Spring AOP modifies the original class bytecode by default.',
      'Trying to fix self-invocation by changing the method visibility to \`private\` (Spring AOP only intercepts \`public\` methods).',
      'Forgetting that CGLIB cannot proxy \`final\` methods or \`final\` classes.'
    ],
    followUpQuestions: [
      'What are the performance differences between JDK Dynamic Proxies and CGLIB?',
      'How does Spring Boot 3 / Spring Framework 6 handle native images (GraalVM) where dynamic CGLIB subclassing is restricted?'
    ],
    faangFocus: 'Tests if you understand the actual mechanics of the frameworks you use daily, rather than just treating annotations as "magic".'
  },
{
    id: 'spring-2',
    categoryId: 'spring',
    title: 'Custom BeanPostProcessors and Startup Optimization',
    difficulty: 'Expert',
    tags: ['Spring', 'BeanPostProcessor', 'Internals', 'Startup'],
    scenario: 'You are building a custom Spring Boot starter for your enterprise. You need to scan all beans during startup, find methods annotated with a custom @SecureRpc annotation, and wrap them in a custom security client.',
    question: 'Explain the role of the BeanPostProcessor interface in the Spring ApplicationContext lifecycle. What is the difference between postProcessBeforeInitialization and postProcessAfterInitialization? How do you ensure your custom BPP does not cause early bean instantiation?',
    idealAnswer: `### 1. The Role of BeanPostProcessor (BPP)
The \`BeanPostProcessor\` interface is the primary extension point for modifying bean instances after the Spring IoC container has instantiated them. It allows you to inject custom logic, resolve custom annotations, or wrap beans in dynamic proxies.

### 2. Lifecycle Hooks
* **\`postProcessBeforeInitialization\`:** Executed *after* the bean has been instantiated and its properties have been populated (dependency injection completed), but *before* any explicit initialization callbacks (like \`@PostConstruct\` or \`InitializingBean.afterPropertiesSet\`) are invoked. Ideal for custom property injection.
* **\`postProcessAfterInitialization\`:** Executed *after* the initialization callbacks have finished. This is the correct place to **wrap the bean in a Proxy** (e.g., for our \`@SecureRpc\` requirement), because you want the original bean to fully initialize itself before proxying it.

### 3. Preventing Early Bean Instantiation
A critical danger when writing a custom BPP is causing **early bean instantiation**. 
* If your custom BPP directly injects other beans (e.g., \`@Autowired SecurityConfig\`), Spring must instantiate those dependencies *before* the BPP itself is fully registered. 
* Consequently, those dependencies will miss out on being processed by all other BPPs in the system! They might not get their \`@Transactional\` proxies or custom configurations.
* **Solution:** Implement the BPP carefully by retrieving dependencies **lazily** using \`ObjectProvider<T>\` or \`ApplicationContext.getBean()\` inside the actual post-processing methods, rather than field-injecting them. Furthermore, mark the BPP bean itself as \`static\` in the \`@Configuration\` class so it can be instantiated without initializing the outer configuration class.`,
    codeSnippet: `@Configuration
public class SecurityStarterConfig {

    // Must be static to avoid early instantiation of the outer config!
    @Bean
    public static SecureRpcBeanPostProcessor secureRpcBeanPostProcessor(
            ObjectProvider<SecurityClient> clientProvider) {
        return new SecureRpcBeanPostProcessor(clientProvider);
    }
}`,
    pitfalls: [
      'Confusing \`BeanPostProcessor\` with \`BeanFactoryPostProcessor\` (which operates on bean *definitions* before instantiation).',
      'Attempting to create dynamic proxies in \`postProcessBeforeInitialization\`.',
      'Ignoring the log warnings Spring emits when beans are not eligible for all BeanPostProcessors.'
    ],
    followUpQuestions: [
      'How does Spring use \`MergedBeanDefinitionPostProcessor\` to cache annotation metadata?',
      'What is the order of execution if multiple BeanPostProcessors are registered?'
    ],
    faangFocus: 'Essential for Platform/Core teams who build shared libraries and frameworks for hundreds of other microservices.'
  },
{
    id: 'spring-3',
    categoryId: 'spring',
    title: 'Circular Dependencies in Spring Boot 3',
    difficulty: 'Hard',
    tags: ['Spring Boot 3', 'Circular Dependency', 'Architecture', 'Refactoring'],
    scenario: 'You are upgrading a large monolithic application from Spring Boot 2.7 to Spring Boot 3.x. Upon startup, the application immediately crashes with a BeanCurrentlyInCreationException due to multiple circular dependencies.',
    question: 'Why did this code work in Spring Boot 2 but fail in Spring Boot 3? Explain the internal mechanism Spring historically used to resolve circular dependencies (early bean references and the 3-level cache). How should you architecturally refactor the code to eliminate the cycle?',
    idealAnswer: `### 1. The Spring Boot 3 Breaking Change
In Spring Boot 2.x, circular dependencies were permitted by default. In **Spring Boot 3.0**, the default value of \`spring.main.allow-circular-references\` was changed to **\`false\`**. The Spring team made this change because circular dependencies are a strong indicator of poor component design and tight coupling.

### 2. How Spring Historically Resolved Cycles (The 3-Level Cache)
If Bean A injects Bean B, and Bean B injects Bean A, Spring resolved this using a **Three-Level Cache** inside \`DefaultSingletonBeanRegistry\`:
1. **\`singletonObjects\` (1st Level):** Cache of fully initialized beans.
2. **\`earlySingletonObjects\` (2nd Level):** Cache of raw beans that have been instantiated but not yet subjected to dependency injection.
3. **\`singletonFactories\` (3rd Level):** Cache of \`ObjectFactory\` instances capable of producing the early bean reference (and applying early AOP proxies if necessary).

*Mechanism:* When Bean A is instantiated, Spring places its factory in the 3rd level cache. When Bean A requests Bean B, Spring starts creating Bean B. When Bean B requests Bean A, Spring retrieves the early reference of Bean A from the 3rd level cache, moves it to the 2nd level cache, and injects it into Bean B. Bean B completes, and is injected into Bean A.

### 3. Architectural Refactoring Strategies
Instead of simply setting the config back to \`true\`, you should eliminate the cycle using one of these patterns:
* **Redesign (Extract Component):** If Service A and Service B depend on each other, extract the shared cohesive logic into a new **Service C** that both A and B can inject.
* **Event-Driven (Decoupling):** Instead of Service A directly calling Service B, have Service A publish a Spring \`ApplicationEvent\`. Service B can implement an \`@EventListener\` to react to the event asynchronously.
* **Lazy Injection:** If the dependency is only needed at runtime (not during startup), annotate the injection point with **\`@Lazy\`**. Spring will inject a dynamic proxy instead of the actual bean, deferring the real bean resolution until the first method call.`,
    pitfalls: [
      'Enabling \`allow-circular-references=true\` as a permanent fix rather than a temporary migration bridge.',
      'Not understanding that constructor injection *cannot* be resolved by the 3-level cache (it only works for field/setter injection).',
      'Overusing \`@Lazy\` without addressing the underlying architectural domain bleed.'
    ],
    followUpQuestions: [
      'Why does constructor-based circular dependency always fail, even if circular references are allowed?',
      'How does the use of \`@Async\` on a method inside a circularly dependent bean complicate early proxy creation?'
    ],
    faangFocus: 'Tests your ability to drive significant architectural migrations and enforce clean code boundaries in legacy enterprise systems.'
  },
{
    id: 'spring-4',
    categoryId: 'spring',
    title: 'How Spring Boot Auto-Configuration Actually Works',
    difficulty: 'Solid',
    tags: ['Auto-Configuration', 'Conditional', 'Starter', 'Boot'],
    scenario: 'A service unexpectedly starts an embedded Tomcat even though it is a batch job, and a custom `ObjectMapper` bean is silently ignored in one module but honoured in another.',
    question: 'Explain the auto-configuration mechanism end to end: how candidates are discovered, how conditions are evaluated, and how ordering and user-defined beans interact.',
    idealAnswer: `### Discovery
\`@SpringBootApplication\` includes \`@EnableAutoConfiguration\`, which triggers \`AutoConfigurationImportSelector\`. It reads every jar's \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\` (the \`spring.factories\` mechanism in Boot 2) to collect **candidate** configuration classes — typically a few hundred.

Candidates are then filtered, first by \`@ConditionalOnClass\` using an ASM-based metadata scan that avoids actually loading classes, then by the full condition evaluation.

### The conditions
* \`@ConditionalOnClass\` / \`@ConditionalOnMissingClass\` — is the type on the classpath? This is why adding \`spring-boot-starter-web\` alone starts Tomcat: \`ServletWebServerFactoryAutoConfiguration\` sees the servlet classes.
* \`@ConditionalOnBean\` / \`@ConditionalOnMissingBean\` — **the backbone of "sensible defaults you can override"**. Boot's \`ObjectMapper\` is declared \`@ConditionalOnMissingBean\`, so your own bean wins.
* \`@ConditionalOnProperty\`, \`@ConditionalOnResource\`, \`@ConditionalOnWebApplication\`, \`@ConditionalOnExpression\`.

### Why the custom ObjectMapper was ignored in one module
\`@ConditionalOnMissingBean\` is evaluated **in bean-definition registration order**, and auto-configurations run **after** user configuration by design. If your bean is defined in a \`@Configuration\` class that is not component-scanned (wrong package), or is itself created by another auto-configuration ordered later, the condition sees no bean and Boot registers its own.

This ordering sensitivity is exactly why the correct way to customise Boot's \`ObjectMapper\` is a \`Jackson2ObjectMapperBuilderCustomizer\` rather than replacing the bean — you contribute to Boot's construction instead of racing it.

### Ordering
\`@AutoConfiguration(before = ..., after = ...)\`, or the older \`@AutoConfigureBefore/After/Order\`. Ordering applies **only among auto-configurations**; user configuration always precedes them.

### The batch job starting Tomcat
Something on the classpath pulled in \`spring-boot-starter-web\` transitively. Fixes: exclude the starter, set \`spring.main.web-application-type=none\`, or exclude the specific auto-configuration class.

### Debugging it
Run with \`--debug\` (or \`-Ddebug\`) to print the **condition evaluation report**: every positive match with its reason, and every negative match with the condition that failed. This answers "why is this bean here / not here" definitively, and is the single most useful Spring Boot debugging tool.`,
    codeSnippet: `@AutoConfiguration(after = DataSourceAutoConfiguration.class)
@ConditionalOnClass(RedisTemplate.class)
@ConditionalOnProperty(prefix = "acme.cache", name = "enabled", havingValue = "true")
public class AcmeCacheAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean          // user's bean always wins
    CacheManager acmeCacheManager(RedisConnectionFactory cf) { ... }
}

// Customise Boot's ObjectMapper instead of replacing it
@Bean
Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
    return b -> b.failOnUnknownProperties(true).modulesToInstall(new JavaTimeModule());
}`,
    pitfalls: [
      'Replacing an auto-configured bean from a class that is not component-scanned, so the condition never sees it.',
      'Assuming @ConditionalOnMissingBean is order-independent.',
      'Not knowing about the --debug condition evaluation report.',
      'Adding a starter transitively and inheriting behaviour you did not intend.'
    ],
    followUpQuestions: [
      'Why does Boot use ASM metadata rather than loading candidate classes?',
      'How do you write and test your own starter?',
      'What is the difference between @Conditional evaluation for configuration classes and for @Bean methods?'
    ],
    faangFocus: 'Spring-heavy interviews use this to separate framework users from framework understanders. The condition evaluation report is the detail practitioners know.'
  },
  {
    id: 'spring-5',
    categoryId: 'spring',
    title: 'Dependency Injection: Constructor, Field and Circular Dependencies',
    difficulty: 'Core',
    tags: ['Dependency Injection', 'Constructor Injection', 'Circular Dependency'],
    scenario: 'A service uses `@Autowired` fields. Unit tests need reflection to inject mocks, one bean is null at runtime in a `@PostConstruct`, and startup now fails with a circular dependency error after a Boot upgrade.',
    question: 'Compare the injection styles, explain why constructor injection is recommended, and describe how Spring handles (and no longer handles) circular dependencies.',
    idealAnswer: `### The three styles
* **Constructor injection** — dependencies are parameters. The object is **fully initialised and valid the moment it exists**, fields can be \`final\`, and it works with plain \`new\` in tests.
* **Setter injection** — for genuinely optional or reconfigurable dependencies. Rare.
* **Field injection** (\`@Autowired\` on a field) — concise, and problematic.

### Why field injection is discouraged
* **Untestable without a container.** You must use reflection or Spring to construct the object. Constructor injection makes tests plain Java.
* **Fields cannot be final**, so the object is mutable and not safely publishable across threads.
* **Null during construction.** \`@PostConstruct\` and constructor bodies run before field injection completes for some orderings — hence the null.
* **Hides bad design.** A constructor with nine parameters is *visibly* wrong; nine \`@Autowired\` fields look tidy. The pain is a useful signal that the class does too much.

Spring itself has recommended constructor injection since 4.3, and a single-constructor bean needs no \`@Autowired\` annotation at all.

### Circular dependencies
A depends on B and B depends on A. With **constructor injection this is impossible to satisfy** — neither can be built first — so Spring reports it at startup.

Historically Spring resolved cycles that involved field or setter injection using the **three-level cache** in \`DefaultSingletonBeanRegistry\`: it exposes an early reference to a partially-constructed singleton so the other bean can hold it. That works, but it means a bean can observe a half-built collaborator, and it breaks with proxies (AOP) in subtle ways.

**Since Boot 2.6, circular references are disallowed by default** (\`spring.main.allow-circular-references=false\`). That flag is a migration escape hatch, not a fix.

### Fixing a cycle properly
The cycle is a **design smell**, not a configuration problem:
* Extract the shared behaviour into a third component both depend on.
* Invert one direction with an event (\`ApplicationEventPublisher\`) so the dependency becomes one-way.
* Introduce an interface at the seam so the cycle disappears at the module level.
* As a last resort, \`@Lazy\` on one injection point injects a proxy and defers resolution — this works but preserves the tangle.`,
    codeSnippet: `// Testable with plain 'new', immutable, cycle-proof
@Service
public class OrderService {
    private final OrderRepository repo;
    private final PricingClient pricing;

    public OrderService(OrderRepository repo, PricingClient pricing) {  // no @Autowired needed
        this.repo = repo;
        this.pricing = pricing;
    }
}

@Test void appliesDiscount() {
    var service = new OrderService(new FakeRepo(), stubPricing());   // no Spring
}`,
    pitfalls: [
      'Using field injection and then needing reflection in tests.',
      'Setting allow-circular-references=true instead of fixing the design.',
      'Relying on a dependency inside a constructor before field injection has run.',
      'Treating a 10-parameter constructor as a reason to switch to field injection rather than to split the class.'
    ],
    followUpQuestions: [
      'How did Spring\'s three-level singleton cache resolve setter-injection cycles?',
      'Why do circular dependencies interact badly with AOP proxies?',
      'When is @Lazy a legitimate solution rather than a workaround?'
    ],
    faangFocus: 'A reliable early-round question. The strongest framing is "constructor injection makes invalid objects unconstructable".'
  },
  {
    id: 'spring-6',
    categoryId: 'spring',
    title: 'Bean Scopes and Scoped Proxies',
    difficulty: 'Solid',
    tags: ['Scopes', 'Prototype', 'Request Scope', 'Proxy'],
    scenario: 'A singleton service injects a prototype-scoped bean and always sees the same instance. A request-scoped bean injected into a singleton throws "No thread-bound request found" from a background thread.',
    question: 'Explain the scopes, why injection of a shorter-lived bean into a longer-lived one fails, and the mechanisms available to fix it.',
    idealAnswer: `### The scopes
* **singleton** (default) — one instance per container.
* **prototype** — a new instance on every *lookup*. Note: Spring does **not** manage a prototype's full lifecycle; destruction callbacks are not called.
* **request**, **session**, **application** — web scopes.
* **websocket**, plus custom scopes via \`Scope\`.

### The core problem: scope mismatch
Injection happens **once**, when the singleton is created. Whatever instance is injected then is the instance forever. So a prototype injected into a singleton is resolved exactly once — you get one instance for the singleton's lifetime, which is precisely what was observed.

The same reasoning explains the request-scope failure: the singleton was built at startup, when no request existed.

### The mechanisms
1. **Scoped proxy** (\`@Scope(value = "request", proxyMode = TARGET_CLASS)\`). Spring injects a **proxy** into the singleton. Every method call on it resolves the *current* request's instance from the scope and delegates. This is the standard fix for web scopes.
2. **\`ObjectProvider<T>\` / \`Provider<T>\`** — inject a factory and call \`getObject()\` when you need a fresh instance. Explicit, no proxy magic, and the cleanest solution for prototypes.
3. **\`@Lookup\`** — Spring overrides an abstract method with CGLIB to return a fresh bean per call. Works, but obscure.
4. **\`ApplicationContext.getBean()\`** — works, but couples your code to the container. Avoid.

### Why the background thread fails even with a proxy
A request-scoped proxy resolves the target through \`RequestContextHolder\`, which is backed by a **ThreadLocal**. A task submitted to an executor runs on a different thread with no bound request, so resolution fails — the proxy cannot help.

Fixes: capture the values you need **before** dispatching, or propagate context explicitly (\`RequestContextHolder.setRequestAttributes\`, a \`TaskDecorator\` on the executor, or Micrometer's context propagation library). This matters even more with virtual threads and structured concurrency, where the temptation to fan out is stronger.

### The design note
Scoped state injected into singletons is a frequent source of subtle bugs. Passing the request-derived value as a **method parameter** is often simpler and always clearer than making it ambient.`,
    codeSnippet: `// Prototype into singleton: use a provider, not direct injection
@Service
public class ReportService {
    private final ObjectProvider<ReportBuilder> builders;   // factory

    public Report build(Spec spec) {
        return builders.getObject().with(spec).build();     // fresh each call
    }
}

// Propagate request context onto pool threads
@Bean
TaskDecorator requestContextDecorator() {
    return runnable -> {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        return () -> {
            RequestContextHolder.setRequestAttributes(attrs);
            try { runnable.run(); } finally { RequestContextHolder.resetRequestAttributes(); }
        };
    };
}`,
    pitfalls: [
      'Injecting a prototype into a singleton and expecting a new instance per use.',
      'Assuming a scoped proxy works on a thread with no bound request.',
      'Relying on Spring to destroy prototype beans.',
      'Using ApplicationContext.getBean() to work around scope mismatch.'
    ],
    followUpQuestions: [
      'How does a scoped proxy resolve its target on each invocation?',
      'What breaks when a ThreadLocal-based context meets an async executor or virtual threads?',
      'When would you write a custom Scope?'
    ],
    faangFocus: 'The prototype-in-singleton trap is a classic. Connecting the request-scope failure to ThreadLocal propagation is the senior-level extension.'
  },
  {
    id: 'spring-7',
    categoryId: 'spring',
    title: 'Spring MVC vs WebFlux: Choosing a Concurrency Model',
    difficulty: 'Hard',
    tags: ['WebFlux', 'Reactive', 'Virtual Threads', 'Backpressure'],
    scenario: 'A gateway service fans out to six downstream APIs per request and must handle 20,000 concurrent requests. The team debates rewriting from Spring MVC to WebFlux. The application also uses blocking JDBC.',
    question: 'Compare the models honestly. Explain when WebFlux pays off, what it costs, and how Java 21 virtual threads change the calculus.',
    idealAnswer: `### The two models
* **Spring MVC (thread-per-request)** — a platform thread is occupied for the whole request. Simple, debuggable, works with every blocking library. Each platform thread costs ~1MB of stack, so 20,000 concurrent blocked requests means 20,000 threads: unaffordable in memory and scheduler overhead.
* **WebFlux (event loop)** — a small number of event-loop threads (typically one per core) handle many connections. A thread is never blocked; work resumes via callbacks/operators. Memory per connection is tiny, so high concurrency is cheap.

### What WebFlux actually costs
* **The whole stack must be non-blocking.** One blocking JDBC call on an event-loop thread stalls every request assigned to that loop. This scenario uses blocking JDBC — that alone disqualifies a naive migration. You would need R2DBC, which is less mature and unsupported by JPA.
* **Debuggability.** Stack traces are not call histories. ThreadLocal-based tooling (MDC logging, security context, tracing) needs the Reactor Context instead.
* **Cognitive cost.** The whole team must think in operators, and backpressure semantics must be understood, not just tolerated.

### What it buys
* **Backpressure**, natively — a genuinely important property for streaming and fan-out, and something neither thread-per-request nor virtual threads give you.
* Very high connection concurrency at low memory.
* Excellent fit for streaming (SSE, WebSocket) and for gateways doing IO orchestration.

### Virtual threads change the answer
Java 21 virtual threads make **blocking code cheap**. A virtual thread parks without pinning a platform thread, so 20,000 concurrent blocking requests are entirely feasible on a thread-per-request model. Set \`spring.threads.virtual.enabled=true\` and Spring MVC scales to the concurrency that previously demanded WebFlux — while keeping ordinary blocking code, working stack traces, ThreadLocals, and JDBC.

Caveats: pinning on \`synchronized\` blocks around blocking IO (largely addressed in JDK 24, but check your runtime), and connection pools become the real limit — 20,000 virtual threads still cannot share 20 database connections.

### The recommendation for this scenario
**Stay on Spring MVC, enable virtual threads, and parallelise the fan-out with structured concurrency.** You get the concurrency benefit without an ecosystem rewrite. Choose WebFlux only if you specifically need backpressure or streaming semantics, or you are already reactive end to end.

Being able to say "WebFlux is no longer the default answer for concurrency" — and why — is the mark of an up-to-date engineer.`,
    codeSnippet: `# One line, and blocking controllers scale to tens of thousands of requests
spring.threads.virtual.enabled=true

// Fan-out with structured concurrency: blocking code, high concurrency
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var user    = scope.fork(() -> userClient.get(id));
    var orders  = scope.fork(() -> orderClient.list(id));
    var credit  = scope.fork(() -> creditClient.score(id));
    scope.join().throwIfFailed();
    return new Profile(user.get(), orders.get(), credit.get());
}`,
    pitfalls: [
      'Migrating to WebFlux while keeping blocking JDBC on the event loop.',
      'Choosing reactive for "performance" when the bottleneck is a downstream service or a connection pool.',
      'Forgetting that MDC and SecurityContext need Reactor Context in WebFlux.',
      'Assuming virtual threads remove the need to bound downstream concurrency.'
    ],
    followUpQuestions: [
      'What is backpressure, and why can virtual threads not provide it?',
      'How do you propagate MDC and security context through a reactive pipeline?',
      'What causes carrier-thread pinning and how do you detect it?'
    ],
    faangFocus: 'A current, opinionated question. Candidates who still say "reactive is faster" without qualification are marked down; the virtual-thread answer is what interviewers now expect.'
  },
  {
    id: 'spring-8',
    categoryId: 'spring',
    title: 'Configuration Properties, Profiles and Externalised Config',
    difficulty: 'Solid',
    tags: ['Configuration', 'Profiles', 'ConfigurationProperties', 'Validation'],
    scenario: 'A misconfigured timeout typo (`connect-timout`) silently fell back to a default and caused a production incident. Configuration is spread across `@Value` annotations in 40 classes and nobody knows the full set of settings.',
    question: 'Design a configuration approach that makes typos fail at startup and the full configuration surface discoverable. Explain property precedence and profiles.',
    idealAnswer: `### Why @Value is the wrong default
\`@Value("\${acme.connect-timeout:5000}")\` scatters configuration across the codebase, provides no type safety beyond a conversion, gives no central inventory, and — with a default — silently swallows typos. Nothing validates that \`acme.connect-timout\` is not a real property.

### @ConfigurationProperties instead
Bind a whole prefix to a typed object:
* **Type-safe and centralised** — one class per concern is the inventory.
* **Validatable** — add \`@Validated\` and \`jakarta.validation\` constraints, and invalid config fails **at startup**, not at first use in production.
* **Immutable** — constructor binding with a \`record\` or final fields.
* **Documented** — the annotation processor generates \`spring-configuration-metadata.json\`, giving IDE autocompletion and inline docs.

### Catching the typo
Constructor binding plus \`spring.jackson.*\`-style strictness is not enough on its own; the specific control is:
\`\`\`
@ConfigurationProperties(prefix = "acme", ignoreUnknownFields = false)
\`\`\`
Now an unrecognised \`acme.*\` key fails the context. Combined with \`@Validated\` and no inline defaults, a typo becomes a startup failure — which is exactly what you want.

### Property precedence (highest wins)
1. Command-line arguments
2. \`SPRING_APPLICATION_JSON\`
3. Servlet init parameters
4. JNDI
5. Java system properties
6. OS environment variables
7. Profile-specific \`application-{profile}.yml\` (external, then internal)
8. \`application.yml\` (external, then internal)
9. \`@PropertySource\`
10. Default properties

The practical consequence: environment variables override files, which is what makes twelve-factor deployment work. Relaxed binding means \`ACME_CONNECT_TIMEOUT\` maps to \`acme.connect-timeout\`.

### Profiles
\`@Profile\` on beans and \`application-{profile}.yml\` for values. Discipline matters:
* Keep profiles for **environment shape** (which beans exist), not for business logic variants.
* Avoid deep profile nesting; profile groups (\`spring.profiles.group\`) express composition more clearly.
* Never let a profile be the thing that decides whether security is on.
* Prefer property-driven behaviour over bean-swapping where possible, so the same wiring runs everywhere.

### Runtime refresh
For settings that must change without a restart, \`@RefreshScope\` with Spring Cloud Config, or a feature-flag service. Be explicit about which properties are refreshable — most are not.`,
    codeSnippet: `@ConfigurationProperties(prefix = "acme.http", ignoreUnknownFields = false)
@Validated
public record HttpProperties(
        @NotNull @DurationMin(millis = 100) Duration connectTimeout,   // typo => startup failure
        @NotNull @DurationMax(seconds = 30) Duration readTimeout,
        @Min(1) @Max(500) int maxConnections,
        @NotBlank String baseUrl) { }

// Fails fast at startup with a clear message, not at 3am on first use
@EnableConfigurationProperties(HttpProperties.class)
class HttpConfig { }`,
    pitfalls: [
      'Using @Value with inline defaults, which turn typos into silent fallbacks.',
      'Not enabling validation, so invalid configuration surfaces at first use.',
      'Using profiles to switch business logic rather than environment wiring.',
      'Assuming a property is refreshable at runtime when it was bound once at startup.'
    ],
    followUpQuestions: [
      'What is relaxed binding and how do environment variables map to property names?',
      'How does @RefreshScope actually re-create beans, and what are the risks?',
      'How would you audit which properties an application supports?'
    ],
    faangFocus: 'A practical operations question. "Invalid configuration should fail at startup" is a principle interviewers strongly reward.'
  },
  {
    id: 'spring-9',
    categoryId: 'spring',
    title: 'Exception Handling and API Error Contracts',
    difficulty: 'Solid',
    tags: ['Exception Handling', 'RestControllerAdvice', 'Problem Details', 'API Design'],
    scenario: 'An API returns HTML stack traces for some errors, `500` for validation failures, and inconsistent JSON shapes across controllers. A client team cannot write reliable error handling.',
    question: 'Design a consistent error-handling strategy for a Spring Boot REST API, including status-code semantics and how to avoid leaking internals.',
    idealAnswer: `### Centralise with @RestControllerAdvice
One \`@RestControllerAdvice\` class handles exception-to-response mapping for the whole application. Extending \`ResponseEntityExceptionHandler\` lets you also override Spring's own handling of framework exceptions (binding, media type, method not allowed) so **every** error path is consistent.

### Use RFC 7807 Problem Details
Spring Framework 6 / Boot 3 support \`ProblemDetail\` natively, giving a standard shape: \`type\`, \`title\`, \`status\`, \`detail\`, \`instance\`, plus custom extensions. Adopting a standard means clients can write one error handler rather than one per endpoint, and tooling understands it.

Always include a **correlation/trace id** as an extension property, so a user-reported error maps directly to logs and traces.

### Status code semantics
* **400** — malformed syntax or failed validation.
* **401** — not authenticated. **403** — authenticated but not permitted.
* **404** — resource does not exist (also used deliberately instead of 403 to avoid leaking existence).
* **409** — conflict, e.g. optimistic-lock failure or a duplicate.
* **422** — syntactically valid but semantically unprocessable (a useful distinction from 400 if you use it consistently).
* **429** — rate limited, with \`Retry-After\`.
* **5xx** — **your** fault. A validation failure returning 500 is a bug: it tells clients to retry something that will never succeed, and it pollutes error-rate SLOs.

### Do not leak internals
* Never return stack traces. Set \`server.error.include-stacktrace=never\` and \`include-message=on-param\` or \`never\`.
* Do not surface exception class names, SQL, or file paths.
* Log the full detail server-side with the same correlation id, and return a safe summary.
* The HTML page comes from Boot's default \`BasicErrorController\`; a proper advice plus \`ErrorAttributes\` customisation replaces it.

### Validation errors deserve structure
A single \`detail\` string is not enough. Return a list of field errors — field name, rejected value (careful with sensitive data), and message — so clients can highlight the right input. Map \`MethodArgumentNotValidException\` and \`ConstraintViolationException\` to that shape.

### Distinguish expected from unexpected
Business exceptions (insufficient funds, order already shipped) are **expected**: map them to specific 4xx codes with stable, documented error codes clients can branch on. Unexpected exceptions get a generic 500 and an alert. Mixing the two makes both alerting and client logic unreliable.`,
    codeSnippet: `@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(InsufficientStockException.class)
    ProblemDetail handleStock(InsufficientStockException e) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
        pd.setType(URI.create("https://api.acme.com/errors/insufficient-stock"));
        pd.setTitle("Insufficient stock");
        pd.setProperty("errorCode", "STOCK_001");        // stable, documented
        pd.setProperty("traceId", Span.current().getSpanContext().getTraceId());
        return pd;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception e) {
        log.error("unhandled", e);                        // full detail server-side only
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
    }
}`,
    pitfalls: [
      'Returning 500 for validation failures, corrupting error-rate SLOs and misleading clients on retry.',
      'Leaking stack traces, SQL or class names in responses.',
      'Inconsistent error shapes per controller.',
      'No correlation id, making user-reported errors untraceable.'
    ],
    followUpQuestions: [
      'When is 422 the right status rather than 400?',
      'How do you keep error codes stable as an API evolves?',
      'How should a client distinguish retryable from non-retryable errors?'
    ],
    faangFocus: 'API-design rounds. Knowing RFC 7807 by name and insisting on stable machine-readable error codes reads as production experience.'
  },
  {
    id: 'spring-10',
    categoryId: 'spring',
    title: 'Resilience Patterns: Retry, Circuit Breaker and Bulkhead',
    difficulty: 'Hard',
    tags: ['Resilience4j', 'Circuit Breaker', 'Retry', 'Bulkhead'],
    scenario: 'A downstream payment provider slows to 30-second responses. Within two minutes the entire service is unresponsive — even endpoints that never call payments. Retries are configured at three attempts with no backoff.',
    question: 'Explain the cascading failure, then design the resilience layer. Cover retry, circuit breaking, bulkheads, timeouts and fallbacks, and how they interact.',
    idealAnswer: `### The cascade
1. Payment calls take 30 seconds instead of 100ms.
2. Each request thread is blocked for 30s (×3 with retries = 90s).
3. The shared servlet thread pool fills with blocked threads.
4. **Unrelated endpoints now have no threads**, so the whole service is down.

This is **resource-pool contagion**: one slow dependency consumes a shared resource and takes down everything sharing it. Note that retries made it three times worse — retrying a *slow* dependency amplifies load on something already struggling.

### The layers, in order of importance
**1. Timeouts — non-negotiable.** Every network call needs an explicit connect and read timeout, derived from the SLO, not from the library default (which is often infinite). Without timeouts nothing else matters.

**2. Bulkhead — isolate the resource.** Give the payment integration its **own bounded pool** (thread-pool bulkhead) or a semaphore limiting concurrent calls. Now payment saturation can only exhaust payment's budget; other endpoints keep their threads. This is the specific fix for the cascade described.

**3. Circuit breaker — stop calling a broken dependency.** Track the failure/slow-call rate over a sliding window. On breach, **open** and fail fast without a call. After a wait, move to **half-open** and let a few probes through; success closes it, failure reopens. Critically, configure the **slow-call threshold**, not just the error threshold — this outage produced slow successes, not errors, and an error-only breaker would never have tripped.

**4. Retry — carefully.** Retry only **idempotent** operations, and only **transient** failures (connection refused, 503, timeout on a read-only call). Never retry a 400. Use exponential backoff **with jitter**; without jitter, all clients retry in lockstep and produce a thundering herd. Cap total attempts, and account for the fact that retries multiply load precisely when the system is weakest. Retry belongs **inside** the circuit breaker so the breaker sees the final outcome.

**5. Fallback — degrade, do not fail.** Cached value, default, queue-for-later, or a clear partial response. A checkout that can accept an order and settle payment asynchronously beats one that returns 500.

### Composition order
\`Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(call)))))\` — Resilience4j's recommended nesting. The breaker should observe the outcome of a *complete* attempt including its timeout.

### Observability
Export breaker state transitions, bulkhead saturation, retry counts and timeout rates. A breaker that opens silently is an outage you learn about from customers.`,
    codeSnippet: `resilience4j:
  bulkhead:
    instances.payments: { maxConcurrentCalls: 20 }     # contain the blast radius
  timelimiter:
    instances.payments: { timeoutDuration: 2s }
  circuitbreaker:
    instances.payments:
      slidingWindowSize: 100
      failureRateThreshold: 50
      slowCallRateThreshold: 50                        # catches slow successes
      slowCallDurationThreshold: 1s
      waitDurationInOpenState: 30s
      permittedNumberOfCallsInHalfOpenState: 5
  retry:
    instances.payments:
      maxAttempts: 3
      waitDuration: 200ms
      enableExponentialBackoff: true
      enableRandomizedWait: true                       # jitter

@Bulkhead(name = "payments")
@CircuitBreaker(name = "payments", fallbackMethod = "queueForLater")
@Retry(name = "payments")
public Receipt charge(Payment p) { ... }`,
    pitfalls: [
      'No timeouts, making every other control ineffective.',
      'Configuring only an error-rate threshold, so a slow-but-successful dependency never trips the breaker.',
      'Retrying non-idempotent operations, or retrying without jitter.',
      'Sharing one thread pool across all downstream calls, allowing contagion.'
    ],
    followUpQuestions: [
      'Why must retry sit inside the circuit breaker rather than outside it?',
      'How do you choose bulkhead size and breaker thresholds from an SLO?',
      'What is the risk of a fallback that itself calls a dependency?'
    ],
    faangFocus: 'A core senior backend question. Identifying the slow-call threshold as the control that would have caught this specific outage is the standout detail.'
  },
  {
    id: 'spring-11',
    categoryId: 'spring',
    title: 'Actuator, Metrics and Production Observability',
    difficulty: 'Solid',
    tags: ['Actuator', 'Micrometer', 'Metrics', 'Health Checks'],
    scenario: 'A Kubernetes deployment flaps: pods are killed and restarted during a slow database failover, and a rolling deploy drops requests. Actuator is exposed on the main port with all endpoints enabled.',
    question: 'Explain liveness vs readiness, how Actuator supports them, what to instrument with Micrometer, and how to expose Actuator safely.',
    idealAnswer: `### Liveness vs readiness — the distinction that caused the outage
* **Liveness** — "is this process irrecoverably broken?" Failing it means **kill and restart the pod**. It must depend on **nothing external**.
* **Readiness** — "should this instance receive traffic right now?" Failing it removes the pod from the load balancer but leaves it running.

Putting a database check in the **liveness** probe is the bug: during a failover every pod fails liveness, Kubernetes restarts them all, and restarting does not fix a database. That is a self-inflicted outage.

The database belongs in **readiness** (or nowhere — if every instance depends on the same database, removing them all from the load balancer achieves nothing except turning a degraded service into a dead one). A common, defensible choice is: readiness reflects only *this instance's* ability to serve, and downstream health is handled by circuit breakers and alerting.

Spring Boot exposes \`/actuator/health/liveness\` and \`/actuator/health/readiness\` via \`ApplicationAvailability\`, and you can control which indicators contribute to each group.

### Graceful shutdown — the dropped requests
Enable \`server.shutdown=graceful\` with a \`spring.lifecycle.timeout-per-shutdown-phase\`. On SIGTERM the app stops accepting new connections and finishes in-flight requests. Pair with a \`preStop\` sleep so the load balancer removes the pod **before** it stops accepting — otherwise you drop requests during the propagation delay. This is the standard rolling-deploy fix.

### What to instrument
Micrometer is a facade over Prometheus, OTLP, Datadog and others.
* **RED for services** — Rate, Errors, Duration, as histograms so you get real percentiles (\`management.metrics.distribution.percentiles-histogram\`). Never average latency.
* **USE for resources** — Utilisation, Saturation, Errors: thread pools, connection pools, queues.
* **Business metrics** — orders placed, payments failed. These catch bugs that are invisible to technical metrics.
* Beware **cardinality**: never tag with user id, request id or raw URL path. High-cardinality tags are the most common way to take down a metrics backend.

### Exposing Actuator safely
* Put it on a **separate management port** (\`management.server.port\`) not exposed publicly.
* Expose only what is needed: \`management.endpoints.web.exposure.include=health,info,prometheus\`.
* \`/actuator/heapdump\`, \`/actuator/env\` and \`/actuator/threaddump\` leak secrets and memory contents — never expose them publicly.
* Secure the management port with authentication even internally.
* \`management.endpoint.health.show-details=when-authorized\`, so an anonymous probe does not learn your topology.`,
    codeSnippet: `management:
  server.port: 9090                       # separate from application traffic
  endpoints.web.exposure.include: health,info,prometheus
  endpoint.health:
    probes.enabled: true                  # /health/liveness and /health/readiness
    show-details: when-authorized
    group:
      liveness: { include: livenessState }          # nothing external
      readiness: { include: readinessState,db }     # db here, never in liveness
  metrics.distribution.percentiles-histogram.http.server.requests: true

server.shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 30s`,
    pitfalls: [
      'Putting external dependencies in the liveness probe, causing restart storms.',
      'Exposing heapdump, env or threaddump endpoints publicly.',
      'Tagging metrics with high-cardinality values like user or request ids.',
      'No graceful shutdown or preStop delay, dropping requests on every deploy.'
    ],
    followUpQuestions: [
      'Why does a preStop sleep matter even with graceful shutdown enabled?',
      'How do histograms give accurate percentiles when averaged summaries cannot?',
      'When should a health check deliberately NOT reflect a downstream dependency?'
    ],
    faangFocus: 'An SRE-flavoured question that separates people who have run Spring in Kubernetes from those who have only deployed it. The liveness/readiness mistake is extremely common.'
  },
  {
    id: 'spring-12',
    categoryId: 'spring',
    title: 'Spring AOP: Proxies, Pointcuts and Their Limits',
    difficulty: 'Hard',
    tags: ['AOP', 'Proxy', 'CGLIB', 'AspectJ'],
    scenario: 'A custom `@Audited` aspect works on some beans and silently does nothing on others. It also fails to fire for a method called from within the same class, and for a `final` method.',
    question: 'Explain Spring AOP\'s proxy model in detail: JDK vs CGLIB, what can and cannot be advised, and when to move to AspectJ.',
    idealAnswer: `### The proxy model
Spring AOP is **proxy-based**, not bytecode weaving. At bean creation, \`AbstractAutoProxyCreator\` wraps the bean in a proxy when any advisor matches. Callers that get the bean from the container get the proxy; the proxy runs the advice and delegates to the target.

Two proxy strategies:
* **JDK dynamic proxy** — used when the bean implements at least one interface. The proxy implements the same interfaces. Consequence: **only interface methods can be advised**, and injecting by concrete class fails with a \`ClassCastException\` unless you also proxy the class.
* **CGLIB** — a runtime-generated **subclass**. Used when there is no interface, or when \`proxyTargetClass = true\` (Spring Boot's default). Consequence: \`final\` classes cannot be proxied and \`final\`, \`private\` and \`static\` methods cannot be overridden, so they are never advised.

That explains two of the three symptoms: the \`final\` method cannot be intercepted, and if a bean was proxied via JDK proxies, a method not on the interface is invisible to the aspect.

### Self-invocation
\`this.audited()\` calls the **target object directly**, bypassing the proxy entirely. No proxy, no advice. This is the same root cause as the \`@Transactional\` self-invocation trap, and it applies to \`@Cacheable\`, \`@Async\`, \`@PreAuthorize\` — every proxy-based annotation.

Workarounds: split into two beans (best), inject a self-reference through \`ObjectProvider\`, or use \`AopContext.currentProxy()\` (requires \`exposeProxy = true\`, and is ugly).

### Other limits
* Advice does not apply to calls made **before** the bean is fully proxied, e.g. from a constructor or \`@PostConstruct\`.
* Only **Spring-managed beans** are proxied. \`new MyService()\` gets nothing.
* Pointcut expressions matching \`execution(* com.acme..*(..))\` on everything are a real startup and runtime cost — keep them narrow.

### When to move to AspectJ
Load-time or compile-time weaving modifies the bytecode itself, so it can advise:
* Self-invocations
* \`final\`, \`private\` and \`static\` methods
* Constructors and field access
* Non-Spring objects

The cost is build/agent complexity and a much larger footgun surface — woven advice is invisible in the source. Use it only when proxy limitations genuinely block a cross-cutting requirement (fine-grained tracing, certain security models).

### Debugging
Check whether a bean is proxied at all (\`AopUtils.isAopProxy\`), print the proxy class name, and remember that ordering between multiple aspects is controlled by \`@Order\` — a misordered transaction and audit aspect can log a state that later rolls back.`,
    codeSnippet: `@Aspect
@Component
@Order(20)                       // runs inside @Transactional (default order)
public class AuditAspect {

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        long t0 = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            log.info("action={} args={} tookMs={}",
                     audited.value(), pjp.getArgs(), (System.nanoTime() - t0) / 1_000_000);
        }
    }
}

// Never advised: self-invocation, final, private, or a non-Spring object
public void outer() { this.inner(); }        // proxy bypassed`,
    pitfalls: [
      'Expecting advice on self-invoked, final, private or static methods.',
      'Injecting by concrete class when JDK proxies are in use.',
      'Broad pointcut expressions that proxy far more beans than intended.',
      'Ignoring aspect ordering relative to @Transactional, so audits record uncommitted state.'
    ],
    followUpQuestions: [
      'How does Spring decide between JDK and CGLIB proxies, and what changed in Boot defaults?',
      'What exactly can AspectJ load-time weaving do that proxies cannot?',
      'How do you verify at runtime that a given bean is proxied and by which advisors?'
    ],
    faangFocus: 'Spring internals rounds. Being able to explain @Transactional, @Cacheable and @Async failures as one shared proxy-boundary problem is the unifying insight.'
  },
  {
    id: 'spring-13',
    categoryId: 'spring',
    title: 'Spring Bean Lifecycle and Extension Points',
    difficulty: 'Expert',
    tags: ['Lifecycle', 'BeanPostProcessor', 'BeanFactoryPostProcessor', 'Aware'],
    scenario: 'A `BeanPostProcessor` that wraps beans with instrumentation causes some beans to lose their AOP proxies, and a `@Value` in another `BeanPostProcessor` is never resolved.',
    question: 'Walk through the container startup and bean lifecycle in order, and explain where each extension point runs and why these two bugs occur.',
    idealAnswer: `### Container startup (\`refresh()\`)
1. \`prepareRefresh\` — set up the environment.
2. \`obtainFreshBeanFactory\` — load bean **definitions** (no instances yet).
3. \`invokeBeanFactoryPostProcessors\` — **\`BeanFactoryPostProcessor\`** runs here and can modify bean *definitions*. \`BeanDefinitionRegistryPostProcessor\` runs first and can *register new* definitions (this is how \`ConfigurationClassPostProcessor\` processes \`@Configuration\` and how Spring Data registers repositories).
4. \`registerBeanPostProcessors\` — instantiate and register \`BeanPostProcessor\`s.
5. \`initMessageSource\`, \`initApplicationEventMulticaster\`, \`onRefresh\` (web server starts here).
6. \`registerListeners\`.
7. \`finishBeanFactoryInitialization\` — instantiate all remaining **non-lazy singletons**.
8. \`finishRefresh\` — publish \`ContextRefreshedEvent\`, start \`SmartLifecycle\` beans.

### Per-bean lifecycle
1. Instantiate (constructor injection happens here).
2. Populate properties (field/setter injection).
3. \`*Aware\` callbacks — \`BeanNameAware\`, \`BeanFactoryAware\`, \`ApplicationContextAware\`.
4. **\`BeanPostProcessor.postProcessBeforeInitialization\`**.
5. \`@PostConstruct\` → \`InitializingBean.afterPropertiesSet()\` → custom \`initMethod\`.
6. **\`BeanPostProcessor.postProcessAfterInitialization\`** — **this is where AOP proxies are created** (\`AbstractAutoProxyCreator\` is itself a BPP).
7. Bean is ready.
8. On shutdown: \`@PreDestroy\` → \`DisposableBean.destroy()\` → custom \`destroyMethod\`. (Not called for prototypes.)

### Bug 1: lost AOP proxies
\`BeanPostProcessor\`s run in order (\`PriorityOrdered\` → \`Ordered\` → the rest). If the custom BPP runs **after** \`AbstractAutoProxyCreator\` and returns a *new* wrapper around the bean, that wrapper replaces the proxy — advice is gone. If it runs **before**, the auto-proxy creator may not recognise the wrapped type and skip it.

**Fix:** implement \`Ordered\` and place the BPP deliberately, and wrap by **delegating to** rather than replacing the object; better still, express the instrumentation as an AOP advisor so it composes with the existing proxy instead of fighting it.

### Bug 2: unresolved @Value
\`BeanPostProcessor\`s are instantiated **very early**, in step 4 of \`refresh()\` — before \`PropertySourcesPlaceholderConfigurer\` (a \`BeanFactoryPostProcessor\`) has necessarily processed placeholders for them, and before ordinary bean initialisation infrastructure applies to them. A BPP is not itself post-processed by other BPPs.

**Fix:** make the BPP depend on the \`Environment\` directly (implement \`EnvironmentAware\`) and read the property programmatically, or inject an \`ObjectProvider\` and resolve lazily on first use.

### The general rule
Anything that participates in the container's own bootstrap must not depend on container features that run later. Declare such beans \`static\` when they are \`@Bean\` methods on a \`@Configuration\` class, so the configuration class itself is not forced into premature instantiation.`,
    codeSnippet: `// A BPP is created before placeholder resolution applies to it — read config directly
public class MetricsBeanPostProcessor
        implements BeanPostProcessor, Ordered, EnvironmentAware {

    private boolean enabled;

    @Override public void setEnvironment(Environment env) {
        this.enabled = env.getProperty("acme.metrics.enabled", Boolean.class, true);
    }

    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }  // after auto-proxying

    @Override public Object postProcessAfterInitialization(Object bean, String name) {
        return enabled ? instrumentWithoutReplacing(bean) : bean;
    }
}

// Declare infrastructure @Bean methods static so the config class is not created early
@Bean static PropertySourcesPlaceholderConfigurer placeholders() { ... }`,
    pitfalls: [
      'Injecting @Value into a BeanPostProcessor and expecting it to be resolved.',
      'Returning a plain wrapper from a BPP and destroying the AOP proxy.',
      'Not declaring infrastructure @Bean methods static, forcing early instantiation of the configuration class.',
      'Confusing BeanFactoryPostProcessor (definitions) with BeanPostProcessor (instances).'
    ],
    followUpQuestions: [
      'Why does declaring a @Bean method static matter for BeanFactoryPostProcessors?',
      'How does AbstractAutoProxyCreator decide whether to proxy a bean?',
      'What is the difference between SmartLifecycle and @PostConstruct for startup ordering?'
    ],
    faangFocus: 'A genuine framework-internals question, asked at companies with platform teams. Knowing that AOP happens in postProcessAfterInitialization is the linchpin.'
  },
  {
    id: 'spring-14',
    categoryId: 'spring',
    title: 'Spring Boot Startup Time, AOT and Native Images',
    difficulty: 'Expert',
    tags: ['GraalVM', 'AOT', 'Startup Time', 'CDS'],
    scenario: 'A serverless deployment suffers 4-second cold starts on a Spring Boot service. The team is asked to evaluate GraalVM native images.',
    question: 'Explain where Spring Boot startup time actually goes, what Spring AOT does, and the real trade-offs of native images. What cheaper options exist first?',
    idealAnswer: `### Where startup time goes
1. **Classloading and verification** — thousands of classes read, parsed and verified.
2. **Classpath scanning** — component scanning and auto-configuration condition evaluation across every jar.
3. **Reflection and proxy generation** — CGLIB subclasses, JDK proxies, annotation metadata.
4. **JIT warm-up** — everything runs interpreted at first, so the first requests are slow even after the context is up.
5. **Connection pool and client initialisation** — often the largest single item, and frequently overlooked.

### Cheaper wins first
Do these before reaching for native images:
* **Lazy initialisation** (\`spring.main.lazy-initialization=true\`) — defers bean creation. Big win, but moves cost to first request and hides startup failures.
* **Trim the classpath.** Every unnecessary starter costs scanning and conditions.
* **Narrow component scanning**, and exclude auto-configurations you do not need.
* **\`-XX:TieredStopAtLevel=1\`** and \`-Xshare:on\` for short-lived processes: skip C2 and use the shared class archive.
* **CDS / AppCDS** — dump a class archive of your application's loaded classes. Spring Boot 3.3+ supports training runs that generate one; typical gains are 20-40% of startup with **no code changes and no framework restrictions**. This is the best effort-to-reward ratio available.
* **Project Leyden** (premain/AOT cache in recent JDKs) continues in this direction.

### Spring AOT
\`spring-boot-maven-plugin:process-aot\` runs the context **at build time** and generates:
* Explicit bean-registration Java source, replacing runtime condition evaluation and scanning.
* Reflection, resource and proxy hints for the native compiler.

AOT alone (on the JVM) removes scanning and condition evaluation, cutting startup meaningfully. It is also the prerequisite for a native image.

### Native images: the real trade-offs
**Gains:** startup in tens of milliseconds, memory footprint often 3-5x lower, no warm-up.

**Costs:**
* **Closed-world assumption.** Everything reachable must be known at build time. Reflection, dynamic proxies, resource loading and serialisation all need explicit hints. Spring supplies hints for its own ecosystem; third-party libraries may not.
* **Build times** of several minutes, and high memory during build.
* **No JIT.** Peak throughput is typically **lower** than a warmed-up JVM, because C2's profile-guided optimisation is unavailable. For a long-running high-throughput service, native can be a net loss.
* **Different debugging and profiling** story; some agents do not work.
* Conditional beans are fixed at build time, so \`@Profile\` behaviour must be decided during the build.

### The recommendation
For a **serverless** workload with frequent cold starts and modest per-instance throughput, native images are a strong fit — that is exactly the shape they were designed for. But measure first: try lazy initialisation, classpath trimming, AppCDS and AOT on the JVM. If 4 seconds becomes 1.2 seconds, the operational simplicity of staying on the JVM may well win.`,
    codeSnippet: `# Cheapest meaningful win: AppCDS via a training run (Boot 3.3+)
java -Dspring.context.exit=onRefresh -XX:ArchiveClassesAtExit=app.jsa -jar app.jar
java -XX:SharedArchiveFile=app.jsa -jar app.jar        # 20-40% faster startup

# Build-time context evaluation, still on the JVM
mvn spring-boot:process-aot

# Native image
mvn -Pnative native:compile

// Reflection that Graal cannot see must be declared
@RegisterReflectionForBinding(LegacyPayload.class)
class ReflectionConfig { }`,
    pitfalls: [
      'Reaching for native images before trying lazy init, classpath trimming and AppCDS.',
      'Assuming native images improve peak throughput — they usually reduce it.',
      'Forgetting that reflection and dynamic proxies need explicit hints.',
      'Using lazy initialisation without realising it defers startup failures to first request.'
    ],
    followUpQuestions: [
      'What does the closed-world assumption forbid, and how do runtime hints work around it?',
      'How does AppCDS reduce startup, and what are its limits?',
      'For which workload shapes is a warmed-up JVM strictly better than a native image?'
    ],
    faangFocus: 'A modern platform question. The mature answer measures first and is explicit that native trades peak throughput for startup and footprint.'
  },
  {
    id: 'spring-15',
    categoryId: 'spring',
    title: 'Spring Events and Decoupling Within a Monolith',
    difficulty: 'Solid',
    tags: ['ApplicationEvent', 'Async', 'Transaction Events', 'Modular Monolith'],
    scenario: 'Order placement directly calls the email service, the analytics service and the loyalty service. The method is slow, the classes are tightly coupled, and a failure in analytics rolls back a valid order.',
    question: 'Redesign with Spring application events. Explain synchronous vs async listeners, transaction-bound events, and where events are the wrong tool.',
    idealAnswer: `### The problem
Direct calls make the order service depend on three unrelated concerns, and bind their **failure modes and latency** to the core transaction. An analytics outage must not prevent an order.

### Publishing an event instead
\`ApplicationEventPublisher.publishEvent(new OrderPlaced(...))\`. The order service now depends on nothing but the event type. Listeners are registered with \`@EventListener\` and are discovered automatically.

By default listeners are **synchronous and run in the publisher's thread and transaction** — which is often what you want for consistency, but does not solve the latency or failure-isolation problem on its own.

### Transaction-bound events — the key mechanism
\`@TransactionalEventListener(phase = AFTER_COMMIT)\` defers the listener until the publishing transaction **commits**. This is exactly right for side effects that must not happen if the order is rolled back — you never send an email for an order that did not persist.

Phases: \`BEFORE_COMMIT\`, \`AFTER_COMMIT\` (default), \`AFTER_ROLLBACK\`, \`AFTER_COMPLETION\`.

Important caveat: an \`AFTER_COMMIT\` listener runs **outside** the transaction. Writing to the database there needs \`REQUIRES_NEW\`, or nothing is committed.

### Async listeners
Add \`@Async\` (with \`@EnableAsync\` and an explicit executor) so the listener runs on another thread. Now analytics latency and failures are fully isolated.

But be explicit about what you lose:
* **The event is not durable.** If the JVM dies between commit and listener execution, the event is gone. For anything that must not be lost, use the **transactional outbox** instead — the same argument as for cross-service messaging.
* Exceptions in an async listener do not propagate to the publisher; you need an \`AsyncUncaughtExceptionHandler\` and a metric, or failures are silent.
* Context (security, MDC, tenant) does not propagate automatically — use a \`TaskDecorator\`.
* Always configure your own bounded executor. The default \`SimpleAsyncTaskExecutor\` creates a new thread per task, which is unbounded (though it is a reasonable choice with virtual threads enabled).

### Where events are the wrong tool
* When the caller needs the **result**. Events are fire-and-forget; a return value means it is a method call.
* When ordering across listeners matters — \`@Order\` works but the coupling is now implicit and fragile.
* When the flow must be **auditable and traceable**; a chain of events is harder to follow than an explicit orchestrator. For complex multi-step processes, an explicit saga or workflow is clearer than a cascade of listeners.
* Across process boundaries — that is a message broker's job, not \`ApplicationEventPublisher\`.

Used well, events are the backbone of a **modular monolith**: modules communicate through published contracts, which is also what makes later extraction into services tractable.`,
    codeSnippet: `// Publisher knows nothing about email, analytics or loyalty
@Transactional
public Order place(OrderRequest req) {
    Order order = repo.save(Order.from(req));
    events.publishEvent(new OrderPlaced(order.id(), order.total()));
    return order;
}

// Runs only if the order actually committed, on a separate thread
@Async("notificationExecutor")
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderPlaced(OrderPlaced e) {
    email.sendConfirmation(e.orderId());
}

// Writing to the DB after commit needs its own transaction
@Transactional(propagation = Propagation.REQUIRES_NEW)
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void recordLoyalty(OrderPlaced e) { loyalty.award(e); }`,
    pitfalls: [
      'Writing to the database in an AFTER_COMMIT listener without REQUIRES_NEW.',
      'Treating in-process events as durable messaging.',
      'Async listeners with no exception handler, so failures vanish silently.',
      'Relying on @Order between listeners, recreating hidden coupling.'
    ],
    followUpQuestions: [
      'Why does an AFTER_COMMIT listener need a new transaction to persist anything?',
      'How would you make these events durable without introducing a broker?',
      'How do you propagate security context and MDC into an @Async listener?'
    ],
    faangFocus: 'Modular-monolith design questions are increasingly common. The strong answer names the durability gap and points at the outbox pattern.'
  },
];
