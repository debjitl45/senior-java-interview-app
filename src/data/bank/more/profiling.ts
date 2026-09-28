import type { Question } from '../../types';

/**
 * Profiling & debugging, part two: the JDK toolbox, production incident
 * workflows, and the low-level tools for when everything else fails.
 */
export const PROFILING_MORE_QUESTIONS: Question[] = [
  {
    id: 'prof-10',
    categoryId: 'profiling',
    title: 'The JDK Diagnostic Toolbox',
    difficulty: 'Core',
    tags: ['jcmd', 'jstack', 'jmap', 'jstat', 'Tools'],
    scenario: "During an incident, a junior engineer asks which command-line tools they can use on a running JVM and what each one is for.",
    question: "Describe the main JDK diagnostic tools and when you'd use each.",
    idealAnswer: `### jcmd: the Swiss army knife
Sends diagnostic commands to a running JVM (\`jcmd <pid> help\` lists them):
* \`Thread.print\`: thread dump.
* \`GC.heap_dump /tmp/heap.hprof\`: heap dump.
* \`GC.class_histogram\`: live object counts and sizes per class.
* \`JFR.start\`, \`JFR.dump\`, \`JFR.stop\`: flight recordings.
* \`VM.flags\`, \`VM.system_properties\`, \`VM.info\`, \`VM.native_memory\`, \`Compiler.codecache\`.

### Older, specialised tools
* **jstack**: thread dumps (use \`jcmd Thread.print\` today).
* **jmap**: heap dumps and histograms (use jcmd).
* **jstat**: live GC statistics, e.g. \`jstat -gcutil <pid> 1000\` prints heap occupancy and GC counts every second.
* **jinfo**: flags and system properties.
* **jps**: list Java processes.

### GUI tools
**JDK Mission Control** (analyse JFR recordings), **VisualVM** (live monitoring, sampling profiler), **Eclipse MAT** (heap dump analysis).

### In containers
Tools must run as the **same user** as the JVM and see the same \`/tmp\` (attach mechanism). Use \`kubectl exec\` into the container, or an ephemeral debug container sharing the process namespace, and make sure the image includes \`jcmd\` (or \`jdk.jcmd\` in a jlink image).`,
    pitfalls: [
      "Stripping jcmd from production images.",
      "Running tools as a different user and failing to attach.",
      "Heap dumps on a full disk or into ephemeral storage.",
    ],
    followUpQuestions: [
      "How does the JVM attach mechanism work?",
      "What's the cost of a heap dump on a 16GB heap?",
    ],
    faangFocus: "Baseline operational skill for any Java engineer on call.",
  },
  {
    id: 'prof-11',
    categoryId: 'profiling',
    title: 'Capturing Thread and Heap Dumps in Production',
    difficulty: 'Core',
    tags: ['Thread Dump', 'Heap Dump', 'Kubernetes', 'Incident Response'],
    scenario: "A pod in Kubernetes is unresponsive. You have minutes before the liveness probe restarts it and the evidence disappears.",
    question: "How do you capture diagnostics quickly and safely before the pod dies?",
    idealAnswer: `### Thread dumps (cheap, do these first)
* \`kubectl exec <pod> -- jcmd 1 Thread.print > dump1.txt\` (PID 1 if the JVM is the container's main process).
* Or \`kill -3 <pid>\` (SIGQUIT): the JVM prints the dump to **stdout**, so it lands in the container logs.
* Take **3 dumps, 5-10 seconds apart**: comparing them shows which threads are stuck versus merely busy.

### Heap dumps (expensive)
* \`jcmd 1 GC.heap_dump /dumps/heap.hprof\` pauses the application (proportional to live heap) and writes a file roughly the size of the used heap. Write to a volume with enough space, **not** the container's ephemeral layer.
* \`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps\` captures automatically on OOM.
* Copy out with \`kubectl cp\`, or upload from the pod to object storage.

### Buy time
Temporarily relax the liveness probe or remove the pod from the Service (change a label) so it stops receiving traffic but keeps running for investigation.

### Also capture
A JFR dump if continuous recording is on (\`jcmd 1 JFR.dump filename=/dumps/rec.jfr\`), GC logs, and \`top -H\` output for per-thread CPU.

### Security
Heap dumps contain **all in-memory data**: passwords, tokens, PII. Store and share them accordingly.`,
    pitfalls: [
      "Only one thread dump.",
      "Heap dumps filling the node's disk.",
      "Sharing heap dumps casually despite sensitive contents.",
    ],
    followUpQuestions: [
      "How would you automate evidence capture before restarts?",
      "Why take multiple thread dumps?",
    ],
    faangFocus: "A practical on-call skill that interviewers like to hear concrete commands for.",
  },
  {
    id: 'prof-12',
    categoryId: 'profiling',
    title: 'Reading Stack Traces: Caused By, Suppressed and Truncation',
    difficulty: 'Core',
    tags: ['Stack Traces', 'Exceptions', 'Debugging', 'Basics'],
    scenario: "A log shows a 200-line stack trace ending in `... 87 more`, with several `Caused by:` sections and a `Suppressed:` block. The team keeps fixing the top exception, which is just a wrapper.",
    question: "How do you read a complex Java stack trace efficiently?",
    idealAnswer: `### Structure
* The first line: exception type and message.
* Frames from the **most recent call** (top) to the entry point (bottom).
* **Caused by:** the exception that triggered this one (wrapping via \`new X(msg, cause)\`). The **root cause is usually the last 'Caused by'**: start there.
* **\`... N more\`**: those frames are identical to the enclosing trace's frames, omitted to save space; nothing is lost.
* **Suppressed:** exceptions thrown while closing resources in try-with-resources, attached to the primary exception rather than replacing it.

### Finding the relevant frame
Skip framework frames (Spring proxies, reflection, servlet container) and look for the **first frame in your own packages** near the root cause. IDEs and log tools can fold framework frames.

### Common patterns
* \`UndeclaredThrowableException\` / \`InvocationTargetException\`: reflection or proxies wrapping a checked exception; look at the cause.
* \`CompletionException\` / \`ExecutionException\`: async wrappers.
* A \`NullPointerException\` with a helpful message (Java 14+) tells you exactly which reference was null.

### When the stack trace is missing
The JIT may **omit stack traces** for frequently thrown built-in exceptions (\`-XX:-OmitStackTraceInFastThrow\` disables this). Earlier occurrences in the logs have the full trace.`,
    pitfalls: [
      "Fixing the wrapper exception instead of the root cause.",
      "Wrapping exceptions without passing the cause.",
      "Logging only e.getMessage() and losing the trace.",
    ],
    followUpQuestions: [
      "Why would a NullPointerException have no stack trace?",
      "When should you wrap an exception vs let it propagate?",
    ],
    faangFocus: "Basic but frequently observed in debugging exercises.",
  },
  {
    id: 'prof-13',
    categoryId: 'profiling',
    title: 'Remote Debugging a JVM and Its Risks',
    difficulty: 'Solid',
    tags: ['JDWP', 'Remote Debugging', 'Security', 'Debugging'],
    scenario: "A bug only reproduces in the staging environment. A developer wants to attach IntelliJ's debugger remotely, and someone suggests enabling it in production too.",
    question: "How does remote debugging work, and what are the risks and safer alternatives?",
    idealAnswer: `### How it works
Start the JVM with the **JDWP** agent:
\`-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005\`
The IDE connects over TCP and can set breakpoints, inspect variables and step through code. In Kubernetes, use \`kubectl port-forward pod 5005\` rather than exposing the port.

### Risks
* **Security**: JDWP has **no authentication**. Anyone who can reach the port can execute arbitrary code in the JVM. Never expose it beyond localhost/port-forward, never enable it in production.
* **Availability**: a breakpoint **suspends threads**. A suspended request thread can hold locks and connections, block others, fail health checks and trigger restarts.
* Performance overhead is small when no breakpoints are active, but some optimisations are affected.

### Safer techniques in shared or production environments
* **Non-suspending breakpoints / logpoints** (IntelliJ 'evaluate and log' without suspend).
* Dynamic observability tools: **Arthas** (\`watch\`, \`trace\` commands), BTrace, or production debuggers that take snapshots without stopping threads (Lightrun, Rookout).
* Better logs, metrics and traces; JFR recordings.
* Reproduce locally with the same data (sanitised) and configuration.`,
    pitfalls: [
      "Exposing JDWP ports publicly.",
      "Suspending all threads on a shared environment.",
      "Leaving debug agents enabled after the session.",
    ],
    followUpQuestions: [
      "How do conditional breakpoints affect performance?",
      "How does Arthas instrument code at runtime?",
    ],
    faangFocus: "Checks both debugging skill and security awareness.",
  },
  {
    id: 'prof-14',
    categoryId: 'profiling',
    title: 'Logs, Metrics and Traces',
    difficulty: 'Core',
    tags: ['Observability', 'Metrics', 'Tracing', 'Logging'],
    scenario: "Users report checkout is 'sometimes slow'. The team has only application logs and no way to tell how often, where or why.",
    question: "What are the three pillars of observability and what question does each answer?",
    idealAnswer: `### Metrics: is something wrong, and how much?
Numeric time series aggregated over time: request rate, error rate, latency **percentiles**, pool usage, GC time. Cheap to store and query, ideal for **dashboards and alerting**. Limited detail per request.
Tools: Micrometer → Prometheus/Grafana, Datadog, CloudWatch.

### Traces: where is the time going?
A distributed trace follows **one request** across services as a tree of **spans** (HTTP calls, DB queries, message publishing) with timings and attributes. It shows which hop or query made the slow request slow.
Tools: OpenTelemetry, Micrometer Tracing → Tempo, Jaeger, Zipkin, vendor APMs.

### Logs: what exactly happened?
Discrete events with full detail: errors, business events, decision points. Best when **structured** (JSON) and correlated via **trace ID** in each line.

### Together
Metrics alert you ('p99 checkout latency > 2s'), exemplars or traces show a slow request's path ('the tax service call took 1.8s'), and logs for that trace ID explain why ('retrying after timeout').

### Add profiles
Continuous profiling (JFR, Pyroscope) is often called the fourth pillar: it answers 'which code is consuming CPU or memory'.`,
    pitfalls: [
      "Using logs as the only signal.",
      "Averages instead of percentiles.",
      "Traces without log correlation.",
    ],
    followUpQuestions: [
      "What are exemplars in Prometheus?",
      "How do you control tracing cost at high traffic (sampling)?",
    ],
    faangFocus: "Observability basics expected of every backend engineer.",
  },
  {
    id: 'prof-15',
    categoryId: 'profiling',
    title: 'Finding the Thread Behind High CPU',
    difficulty: 'Solid',
    tags: ['High CPU', 'top -H', 'Thread Dump', 'nid'],
    scenario: "A JVM process is using 400% CPU on a 4-core machine. The application isn't under unusual load.",
    question: "Walk through how you identify which code is burning CPU.",
    idealAnswer: `### Step 1: per-thread CPU
\`top -H -p <pid>\` (or \`ps -L -o tid,pcpu -p <pid>\`) lists **native thread IDs** and their CPU usage. Note the hottest TIDs.

### Step 2: map to Java threads
Take a thread dump (\`jcmd <pid> Thread.print\`). Each thread has \`nid=0x...\`, the native ID in **hex**. Convert the TIDs: \`printf '%x' 12345\`. Find those threads and read their stacks.

### Step 3: interpret
* **GC threads** (\`GC Thread#\`, \`G1 Conc#\`) hot → memory pressure or leak: check GC logs and heap usage.
* **C2 CompilerThread** hot → JIT activity (startup, deoptimisation storms).
* **Application threads** in the same method across several dumps → hot loop, e.g. an infinite loop, catastrophic regex backtracking, a \`HashMap\` corrupted by concurrent modification, or spinning retries.

### Better: profile it
A single stack is a snapshot. **async-profiler** (\`asprof -d 30 -e cpu -f cpu.html <pid>\`) or a JFR recording produces a **flame graph** of where CPU time actually goes, without safepoint bias. Take it while the problem is happening.

### Containers
Inside a container, \`top\` may show container PIDs; tools must run in the same PID namespace.`,
    pitfalls: [
      "Forgetting the decimal-to-hex conversion.",
      "Judging from one dump.",
      "Restarting before capturing evidence.",
    ],
    followUpQuestions: [
      "How would you tell GC-driven CPU from application CPU in metrics?",
      "What does a flame graph of catastrophic regex backtracking look like?",
    ],
    faangFocus: "A classic hands-on troubleshooting question.",
  },
  {
    id: 'prof-16',
    categoryId: 'profiling',
    title: 'Watching GC Live With jstat',
    difficulty: 'Solid',
    tags: ['jstat', 'GC', 'Monitoring', 'Memory'],
    scenario: "A service's latency degrades over several hours. You want a quick live view of GC behaviour on the box without enabling new logging or restarting.",
    question: "How do you use jstat to diagnose GC problems, and what patterns do you look for?",
    idealAnswer: `### The command
\`jstat -gcutil <pid> 1000\` prints every second:
* \`S0\`, \`S1\`, \`E\`, \`O\`, \`M\`: survivor, Eden, old gen and metaspace occupancy in %.
* \`YGC\`/\`YGCT\`: young GC count and total time.
* \`FGC\`/\`FGCT\`: full GC count and time (for G1, concurrent cycles show in \`CGC\`/\`CGCT\`).
* \`GCT\`: total GC time.

\`jstat -gc\` shows absolute sizes; \`-gccause\` shows the reason for the last GC.

### Patterns
* **Old gen (O) climbs after every young GC and never drops** after concurrent/full cycles → a **leak** (or a cache without bounds). Take a heap histogram or dump.
* **O near 100% with FGC increasing rapidly** → the JVM is thrashing; OOM is imminent.
* **YGC increasing very fast** → high allocation rate; profile allocations.
* **Metaspace (M) growing continuously** → class loader leak or generated classes.
* **GCT growing by a large fraction of wall time** → GC overhead is eating throughput.

### Complements
GC logs (\`-Xlog:gc*\`) give pause durations and causes; Micrometer's JVM metrics give the same data over time in dashboards, which is better for trend analysis.`,
    pitfalls: [
      "Judging a leak from a single snapshot.",
      "Misreading occupancy right before a GC as a problem.",
      "Ignoring metaspace.",
    ],
    followUpQuestions: [
      "Which Micrometer JVM metrics would you alert on?",
      "How do you estimate allocation rate from jstat output?",
    ],
    faangFocus: "Quick diagnostic literacy for GC issues.",
  },
  {
    id: 'prof-17',
    categoryId: 'profiling',
    title: 'Micrometer Metrics Done Right',
    difficulty: 'Solid',
    tags: ['Micrometer', 'Metrics', 'Cardinality', 'Prometheus'],
    scenario: "A team adds a Micrometer timer tagged with `userId` and `url` to every request. Prometheus memory explodes and dashboards time out.",
    question: "How do you design application metrics with Micrometer, and what went wrong here?",
    idealAnswer: `### Meter types
* **Counter**: monotonically increasing (requests, errors, messages processed).
* **Gauge**: current value sampled on read (queue size, pool usage). Pass a reference to the object, not a value snapshot.
* **Timer**: count, total time and max of durations; optionally **histograms/percentiles**.
* **DistributionSummary**: like a timer for non-time values (payload sizes).
* **LongTaskTimer**: in-flight long operations.

### The bug: tag cardinality
Every unique combination of tag values creates a **new time series**. \`userId\` (millions of values) and raw \`url\` (with IDs in paths) create an unbounded number of series. Keep tags **low-cardinality**: HTTP method, route **template** (\`/orders/{id}\`), status class, outcome, service. Put high-cardinality details in **traces and logs**, not metrics.

### Percentiles
* Client-side \`publishPercentiles(0.99)\` can't be aggregated across instances.
* Prefer \`publishPercentileHistogram()\` so Prometheus can compute percentiles across the fleet (\`histogram_quantile\`), with SLO boundaries configured for useful buckets.

### Conventions
Use Spring Boot's auto-instrumentation (HTTP server/client, JDBC pools, JVM, executors), consistent naming (\`orders.created\`), common tags (service, region) via \`MeterFilter\`, and \`MeterFilter.maximumAllowableTags\` as a safety net.`,
    pitfalls: [
      "High-cardinality tags (user IDs, raw URLs, error messages).",
      "Averaging client-side percentiles across instances.",
      "Gauges holding stale values.",
    ],
    followUpQuestions: [
      "How does the @Observed annotation relate to metrics and traces?",
      "How would you measure an SLO with Micrometer?",
    ],
    faangFocus: "Practical observability design with a very common production mistake.",
  },
  {
    id: 'prof-18',
    categoryId: 'profiling',
    title: 'Why Averages Lie: Latency Percentiles and Histograms',
    difficulty: 'Solid',
    tags: ['Latency', 'Percentiles', 'Histograms', 'Tail Latency'],
    scenario: "The dashboard shows an average latency of 45ms, yet customers complain about frequent multi-second waits.",
    question: "Why can averages hide problems, and how should latency be measured and reported?",
    idealAnswer: `### Latency distributions are skewed
Most requests are fast; a few are very slow (GC pauses, cold caches, lock contention, retries). The **mean** blends them into a number no user experiences. 98 requests at 20ms and 2 at 1.3s average 45ms.

### Percentiles
* **p50**: typical experience.
* **p95/p99/p99.9**: the tail. At scale, the tail is what many users hit: a page making 20 backend calls sees the backend's p95+ on most page loads (**tail amplification**).
* **max**: useful for spotting pathological cases.

### Measure correctly
* Use **histograms** (HdrHistogram, Prometheus histograms) so percentiles can be aggregated across instances and time windows. You **can't average percentiles** from different instances.
* Watch out for **coordinated omission** in load tests.
* Measure at the edge (load balancer / client) as well as in the service; queueing before your code isn't in your service timer.

### Report and alert
Dashboards with p50/p95/p99 over time, heatmaps for distribution shape, and SLOs defined on percentiles or on 'fraction of requests under X ms'.

### Finding causes of tail latency
Correlate slow traces with GC pauses, pool wait time, specific tenants or payloads, and downstream p99s.`,
    pitfalls: [
      "Alerting on averages.",
      "Averaging p99s across instances.",
      "Ignoring tail amplification in fan-out architectures.",
    ],
    followUpQuestions: [
      "How do hedged requests reduce tail latency?",
      "What does a latency heatmap reveal that percentiles don't?",
    ],
    faangFocus: "Classic performance-engineering insight valued at scale-focused companies.",
  },
  {
    id: 'prof-19',
    categoryId: 'profiling',
    title: 'Heap Dump Analysis With Eclipse MAT',
    difficulty: 'Solid',
    tags: ['Eclipse MAT', 'Heap Dump', 'Dominator Tree', 'Retained Size'],
    scenario: "You have a 6GB heap dump from an OOM. Opening it shows 40 million objects. You need to find the leak quickly.",
    question: "How do you analyse a heap dump effectively with Eclipse MAT?",
    idealAnswer: `### Key concepts
* **Shallow size**: memory of the object itself.
* **Retained size**: memory that would be freed if the object were collected (everything only reachable through it). This is what matters for leaks.
* **Dominator**: X dominates Y if every path from GC roots to Y goes through X. The **dominator tree** groups memory under its 'owners'.

### Workflow
1. **Leak Suspects report**: MAT's automatic analysis often points directly at the culprit ('one instance of ConcurrentHashMap loaded by ... occupies 4.1GB').
2. **Dominator tree** sorted by retained size: find the few objects holding most memory.
3. **Path to GC Roots** (excluding weak/soft references) for a suspect: shows *why* it's still reachable, e.g. a static field → cache map → entries, or a ThreadLocal in a pool thread.
4. **Histogram** grouped by class or class loader to spot unexpected counts (1M \`Session\` objects).
5. **OQL** for targeted queries (e.g. find all \`HashMap\`s with size > 100,000).

### Comparing dumps
Two dumps taken some time apart, compared by histogram, show which classes **grow**, separating leaks from merely large caches.

### Practical notes
Large dumps need a machine with enough RAM (MAT's parsing index); use \`ParseHeapDump.sh\` headless on a big server for huge dumps. Remember the dump contains sensitive data.`,
    pitfalls: [
      "Focusing on shallow size (byte[] and String always top the list).",
      "Not checking the path to GC roots.",
      "Opening a huge dump on a laptop with too little RAM.",
    ],
    followUpQuestions: [
      "Why do char[]/byte[] dominate histograms, and why is that usually misleading?",
      "How would you analyse a 60GB heap dump?",
    ],
    faangFocus: "Hands-on memory debugging skill.",
  },
  {
    id: 'prof-20',
    categoryId: 'profiling',
    title: 'Diagnosing Thread Pool Exhaustion',
    difficulty: 'Solid',
    tags: ['Thread Pools', 'Tomcat', 'Timeouts', 'Thread Dump'],
    scenario: "The API stops responding. CPU is at 5%, memory is fine, and health checks time out. The database looks healthy.",
    question: "What's a likely cause, and how do you confirm and fix it?",
    idealAnswer: `### Low CPU + unresponsive = threads waiting
When CPU is idle but requests hang, request-handling threads are almost certainly **blocked** on something: a slow downstream, a connection pool, a lock, or a queue.

### Confirm with a thread dump
All \`http-nio-8080-exec-*\` threads (Tomcat's pool, default 200) will show the same frames, typically:
* \`SocketInputStream.socketRead\` / \`HttpClient\` → waiting on a **slow downstream** without timeouts.
* \`HikariPool.getConnection\` → **connection pool exhausted** (maybe by long transactions or leaks).
* \`parking to wait for <lock>\` → contention on a shared lock.
Group identical stacks (tools like fastthread.io, or \`jstack | sort | uniq -c\` style analysis).

### Metrics that would have shown it
Tomcat busy threads = max, request queue growing, HTTP client pool pending, Hikari pending connections, downstream latency.

### Fixes
* **Timeouts** on every outbound call (connect, read, pool acquisition).
* **Circuit breakers** and bulkheads so one slow dependency can't consume all threads.
* Separate thread pools for different dependencies.
* Fail fast when pools are saturated (return 503 instead of queueing).
* Virtual threads remove thread exhaustion, but not the downstream limit: you still need timeouts and concurrency limits.`,
    pitfalls: [
      "Increasing the thread pool size as the fix.",
      "Missing read timeouts on HTTP clients.",
      "Health checks sharing the saturated pool.",
    ],
    followUpQuestions: [
      "How would a bulkhead have contained this?",
      "Why can health checks fail even when the app is 'alive'?",
    ],
    faangFocus: "A very common real incident pattern; the low-CPU clue is key.",
  },
  {
    id: 'prof-21',
    categoryId: 'profiling',
    title: 'Allocation Profiling',
    difficulty: 'Hard',
    tags: ['Allocation Profiling', 'JFR', 'async-profiler', 'GC Pressure'],
    scenario: "A service performs 60 young GCs per minute with an allocation rate of 2GB/s. CPU profiles show GC threads taking 30% of CPU, but they don't show which code allocates so much.",
    question: "How do you find allocation hotspots, and what are common culprits?",
    idealAnswer: `### Tools
* **JFR**: \`jdk.ObjectAllocationSample\` events (low overhead, throttled sampling) show allocation stack traces weighted by bytes. View in JDK Mission Control's 'Memory > Allocations'.
* **async-profiler**: \`asprof -e alloc -d 30 -f alloc.html <pid>\` produces an **allocation flame graph** using TLAB-refill sampling, with very low overhead.
Both are safe to run in production.

### Reading allocation flame graphs
Wide frames = many bytes allocated there. Look for:
* **Boxing** in hot paths (\`Stream<Integer>\`, \`Map<Long, Long>\`).
* **String building**: concatenation in loops, \`String.format\`, logging arguments evaluated even when the level is off.
* **Serialisation**: Jackson creating intermediate trees (\`readTree\` then convert) instead of streaming or direct binding; re-creating \`ObjectMapper\`s.
* **Copying**: \`new ArrayList<>(list)\`, \`toArray\`, \`substring\`, byte[] copies in I/O paths.
* **Lambdas capturing** state in hot loops, iterators, varargs arrays (\`Objects.hash\`).
* Large temporary buffers per request.

### Fix and verify
Reduce or reuse (e.g. reuse buffers, primitive collections, streaming parsers), then compare the allocation rate and GC frequency before and after. Remember that short-lived allocations are cheap individually; volume is what hurts.`,
    pitfalls: [
      "Pooling objects without evidence.",
      "Optimising allocations that aren't in the hot path.",
      "Using heap dumps to find allocation hotspots (they show retained objects, not allocation sites).",
    ],
    followUpQuestions: [
      "How does TLAB-based sampling work?",
      "How do you compute allocation rate from GC logs?",
    ],
    faangFocus: "Performance engineering skill for high-throughput services.",
  },
  {
    id: 'prof-22',
    categoryId: 'profiling',
    title: 'Profiling Lock Contention',
    difficulty: 'Hard',
    tags: ['Lock Contention', 'JFR', 'async-profiler', 'Concurrency'],
    scenario: "Throughput stops increasing beyond 8 cores even though CPU usage is only 40%. Adding more instances helps; adding more cores to one instance doesn't.",
    question: "How do you confirm and locate lock contention?",
    idealAnswer: `### Symptoms
Throughput plateaus with **idle CPU**; threads spend time waiting rather than working. Thread dumps show many threads \`BLOCKED\` on the same monitor or \`WAITING (parking)\` on the same \`ReentrantLock\`.

### Tools
* **JFR**: \`jdk.JavaMonitorEnter\` (synchronized contention) and \`jdk.ThreadPark\` (j.u.c locks) events above a threshold (e.g. 10ms), with stack traces and the lock's class. JMC's 'Lock Instances' view aggregates total blocked time per lock.
* **async-profiler** lock mode: \`asprof -e lock -d 30 -f lock.html <pid>\` shows where threads wait for locks, weighted by wait time.
* Wall-clock profiling shows time spent waiting in general.

### Common culprits
* \`synchronized\` caches or singletons (\`Collections.synchronizedMap\`).
* Logging with synchronous appenders under heavy logging.
* Connection pools or other shared resources.
* Legacy synchronized classes (\`Hashtable\`, \`StringBuffer\`, \`Vector\`).
* \`SecureRandom\` or \`UUID.randomUUID\` contention in some configurations.
* Class loading or static initialisation under concurrency.

### Fixes
Concurrent data structures, lock striping, shorter critical sections, read/write separation, per-thread or per-core state (\`LongAdder\`), asynchronous logging, and immutable snapshots.`,
    pitfalls: [
      "Adding CPUs to a contention-bound service.",
      "Looking for contention only in your own code.",
      "Confusing lock contention with slow IO (both show waiting threads).",
    ],
    followUpQuestions: [
      "How does Amdahl's law explain the plateau?",
      "How would you detect contention on a synchronized block in a library?",
    ],
    faangFocus: "Performance diagnosis beyond CPU profiling.",
  },
  {
    id: 'prof-23',
    categoryId: 'profiling',
    title: 'Wall-Clock vs CPU Profiling',
    difficulty: 'Hard',
    tags: ['Wall-Clock Profiling', 'Off-CPU', 'async-profiler', 'Latency'],
    scenario: "An endpoint takes 800ms, but a CPU profile of the service shows nothing interesting: the endpoint's code barely appears.",
    question: "Why doesn't the CPU profile explain the latency, and what should you use instead?",
    idealAnswer: `### CPU profiles show on-CPU time
A CPU profiler samples threads that are **running** on a CPU. If a request spends 780ms **waiting** (network I/O, DB queries, locks, sleeps, pool acquisition), those threads aren't on-CPU and don't appear in the profile.

### Wall-clock profiling
Samples **all threads regardless of state** at regular intervals: \`asprof -e wall -t -d 30 -f wall.html <pid>\` (\`-t\` splits by thread). The flame graph then shows where threads spend **time**, including waiting in \`socketRead\`, \`HikariPool.getConnection\` or \`Object.wait\`. Filter to the request-handling threads to see the latency breakdown.

JFR equivalents: socket read/write events, thread park, monitor enter, and file I/O events with thresholds.

### Off-CPU analysis
At the OS level, off-CPU analysis (eBPF tools such as \`offcputime\`) shows why threads were descheduled, including kernel-level waits.

### Tracing complements profiling
Distributed traces show **which** downstream call was slow for a particular request; wall-clock profiles show where waiting happens in aggregate across all requests. Use both.

### Choosing the event
* CPU-bound service with high CPU → CPU profile.
* Latency problem with low CPU → wall-clock profile + traces.
* GC pressure → allocation profile.
* Contention → lock profile.`,
    pitfalls: [
      "Using CPU profiles to explain latency in IO-bound services.",
      "Wall-clock profiles without thread filtering (idle pool threads dominate).",
      "Profiling outside the time window of the problem.",
    ],
    followUpQuestions: [
      "Why do idle threads dominate unfiltered wall-clock profiles?",
      "How would you profile a single slow request type?",
    ],
    faangFocus: "Distinguishes engineers who profile effectively from those who just run a profiler.",
  },
  {
    id: 'prof-24',
    categoryId: 'profiling',
    title: 'Diagnosing Slow Spring Boot Startup',
    difficulty: 'Solid',
    tags: ['Startup', 'Spring Boot', 'ApplicationStartup', 'JFR'],
    scenario: "A Spring Boot service takes 70 seconds to start, which slows deploys and autoscaling. Nobody knows where the time goes.",
    question: "How do you find and fix what makes startup slow?",
    idealAnswer: `### Measure the phases
* Spring's **\`ApplicationStartup\`** instrumentation: \`BufferingApplicationStartup\` + the Actuator \`/actuator/startup\` endpoint lists steps (bean creation, post-processing, context refresh) with durations. Look for individual **beans** that take seconds.
* A **JFR** recording from JVM start (\`-XX:StartFlightRecording\`) shows CPU hotspots, class loading counts, and I/O waits during startup. Spring also emits JFR events with \`FlightRecorderApplicationStartup\`.
* Logs with timestamps around known phases.

### Common causes
* Beans doing **remote calls** in constructors or \`@PostConstruct\` (warming caches, fetching config, checking connectivity) with slow or timing-out dependencies.
* Database **migrations** (Flyway) running at startup.
* Hibernate schema validation or metamodel building for huge entity sets.
* Excessive classpath scanning (\`@ComponentScan\` on broad packages), many auto-configurations.
* Too little CPU in the container: the JIT and class loading are CPU-hungry.
* DNS or entropy (\`SecureRandom\`) blocking.

### Fixes
* Move warm-ups to background tasks after readiness, or make them lazy.
* \`spring.main.lazy-initialization=true\` selectively (trades startup for first-request latency).
* Run migrations as a separate job before deployment.
* AppCDS / Leyden AOT cache / Spring AOT; allow CPU burst during startup.`,
    pitfalls: [
      "Remote calls in bean constructors.",
      "Global lazy initialisation hiding errors until the first request.",
      "Tight CPU limits during startup.",
    ],
    followUpQuestions: [
      "How does CDS reduce startup time?",
      "Should migrations run on application startup?",
    ],
    faangFocus: "A practical question tied to deployment speed and autoscaling.",
  },
  {
    id: 'prof-25',
    categoryId: 'profiling',
    title: 'GC Pauses vs Other Stalls',
    difficulty: 'Hard',
    tags: ['Pauses', 'Safepoints', 'Swap', 'Transparent Huge Pages'],
    scenario: "Latency graphs show periodic 1.5-second stalls. GC logs show pauses of only 20ms. The team is puzzled.",
    question: "What else can stall a JVM, and how do you find out which one it is?",
    idealAnswer: `### Not every pause is GC
GC logs report **GC work**. Other stalls are invisible there.

### Candidates
* **Time to safepoint (TTSP)**: the JVM requested a safepoint (for GC, deoptimisation, biased-lock revocation in old JDKs, thread dumps), and the pause includes waiting for all threads to reach it. A thread in a long **counted loop** without safepoint polls delays everyone. Enable \`-Xlog:safepoint\` to see 'reaching safepoint' vs 'at safepoint' times.
* **OS swapping**: part of the heap swapped out; GC touches it and waits on disk. Check \`vmstat\` (si/so), and disable swap for JVM hosts or lock memory.
* **Transparent Huge Pages** compaction/defragmentation causing kernel stalls. Set THP to \`madvise\` and use \`-XX:+UseTransparentHugePages\` deliberately, or disable.
* **CPU throttling** in containers (CFS quota exhausted), visible in cgroup throttling metrics.
* **Log writes blocking** on a slow disk (synchronous appenders), or GC log writes themselves on a stalled disk.
* **VM-level steal time** or noisy neighbours on shared hosts.
* Application-level stalls: lock convoys, stop-the-world operations like large synchronized cache rebuilds.

### Method
Correlate the stall timestamps with safepoint logs, GC logs, OS metrics (\`vmstat\`, \`pidstat\`, cgroup stats), and JFR (\`jdk.SafepointBegin\`, thread CPU load). Tools like jHiccup measure JVM-level hiccups independently of the application.`,
    pitfalls: [
      "Assuming GC logs capture all pauses.",
      "Swap enabled on latency-sensitive hosts.",
      "Ignoring container throttling.",
    ],
    followUpQuestions: [
      "What are counted loops and why can they delay safepoints?",
      "How does jHiccup work?",
    ],
    faangFocus: "Expert-level JVM operations knowledge.",
  },
  {
    id: 'prof-26',
    categoryId: 'profiling',
    title: 'Debugging Network Timeouts From the JVM',
    difficulty: 'Hard',
    tags: ['Networking', 'DNS', 'Timeouts', 'Ephemeral Ports'],
    scenario: "A service intermittently gets `ConnectException: Connection timed out` and `UnknownHostException` when calling other services, especially after a partner migrated to new IPs.",
    question: "What JVM and OS-level causes should you investigate?",
    idealAnswer: `### DNS caching in the JVM
The JVM caches DNS results (\`networkaddress.cache.ttl\`). With a security manager (legacy) it cached **forever**; otherwise the default is 30 seconds. After a partner changes IPs, stale entries cause timeouts. Negative lookups are also cached (\`networkaddress.cache.negative.ttl\`). Set TTLs appropriate for cloud environments, and remember connection pools keep **existing connections** to old IPs until they're recycled: set a max connection lifetime.

### Ephemeral port exhaustion
Opening a new connection per request (no pooling, or \`Connection: close\`) leaves thousands of sockets in \`TIME_WAIT\`; the host runs out of ephemeral ports and new connects fail. Check \`ss -s\` / \`netstat\`. Fix: connection pooling and keep-alive.

### Connection pool and keep-alive mismatches
Load balancers or NAT gateways silently drop idle connections (e.g. after 350s on AWS NAT). The pool hands out a dead connection → hang until read timeout. Set pool idle timeouts below the infrastructure's idle timeout, or enable TCP keep-alive / validation.

### Other suspects
* Missing connect/read timeouts in clients (defaults can be infinite).
* Conntrack table full on Kubernetes nodes.
* MTU issues (large packets dropped) in overlay networks.
* TLS handshake failures from expired certs or protocol mismatches.

### Tools
\`tcpdump\`/Wireshark, \`ss\`, \`dig\`, \`curl -v\` from inside the pod, JFR socket events, \`-Djavax.net.debug=ssl:handshake\` for TLS issues.`,
    pitfalls: [
      "No max lifetime on pooled connections.",
      "Creating a new HTTP client per request.",
      "Default infinite timeouts.",
    ],
    followUpQuestions: [
      "How would you debug a TLS handshake failure?",
      "What is TIME_WAIT and why does it exist?",
    ],
    faangFocus: "Real-world production networking issues in JVM services.",
  },
  {
    id: 'prof-27',
    categoryId: 'profiling',
    title: 'Root-Causing a p99 Latency Spike',
    difficulty: 'Expert',
    tags: ['Latency', 'Incident Analysis', 'Tracing', 'Methodology'],
    scenario: "Every day around 14:00, p99 latency of the order API jumps from 150ms to 1.2s for about 20 minutes. p50 barely changes. There are no errors.",
    question: "Describe your investigation methodology step by step.",
    idealAnswer: `### 1. Characterise the symptom
p99 up, p50 flat → a **subset** of requests is slow, not everything. Daily at the same time → something scheduled or traffic-pattern-related. Ask: which endpoints, tenants, instances, regions?

### 2. Slice the data
Break latency down by endpoint, instance, availability zone, tenant, request size. If one instance is slow, it's local (GC, noisy neighbour, throttling). If all are, it's shared (database, downstream, traffic).

### 3. Look at slow traces
Pull traces above 1s from the window. Where is time spent: DB queries, a downstream, pool acquisition, or inside the service?

### 4. Correlate with resource and system signals
* DB: slow query log, lock waits, CPU, IO, **replication or backup jobs**, autovacuum, cache hit ratio.
* JVM: GC pauses, safepoints, allocation rate, thread pool saturation.
* Infrastructure: CPU throttling, network, other workloads on the same nodes.
* Scheduled jobs: **batch jobs, cache refreshes, reports, cron jobs, ETL** starting at 14:00, perhaps in another team's service sharing the database.

### 5. Form and test a hypothesis
For example: 'the 14:00 reporting job runs a heavy query that evicts hot pages from the buffer pool'. Validate by moving the job, running it in staging, or observing the query's timing precisely.

### 6. Fix and prevent
Move analytics to a replica, add resource isolation, rate-limit the batch job; add alerts on the specific signal; document in a postmortem.`,
    pitfalls: [
      "Jumping to a fix before slicing the data.",
      "Looking only at your own service's metrics.",
      "Ignoring scheduled jobs in other systems.",
    ],
    followUpQuestions: [
      "How do exemplars link metrics to traces?",
      "How would you prove the batch job is the cause?",
    ],
    faangFocus: "A senior debugging-methodology question; structure matters more than the answer.",
  },
  {
    id: 'prof-28',
    categoryId: 'profiling',
    title: 'Custom JFR Events and Event Streaming',
    difficulty: 'Expert',
    tags: ['JFR', 'Custom Events', 'Event Streaming', 'Observability'],
    scenario: "A trading engine needs to record the duration of each order-matching cycle with negligible overhead, and alert in real time when cycles exceed 5ms.",
    question: "How do you define custom JFR events and consume JFR data in real time?",
    idealAnswer: `### Custom events
Extend \`jdk.jfr.Event\`, annotate with metadata, and commit it. When the event is disabled, the JIT removes almost all the cost; when enabled, recording is very cheap (thread-local buffers, no locks).
\`\`\`java
@Name("com.acme.MatchCycle")
@Label("Match Cycle")
@Category("Trading")
@Threshold("1 ms")
class MatchCycleEvent extends Event {
    @Label("Orders") int orders;
    @Label("Instrument") String instrument;
}

var e = new MatchCycleEvent();
e.begin();
int matched = engine.matchCycle();
e.orders = matched;
e.instrument = symbol;
e.commit();   // recorded only if duration >= threshold and event enabled
\`\`\`
\`shouldCommit()\` lets you skip expensive field population when the event won't be recorded.

### Event streaming (JDK 14+, JEP 349)
Consume events **while recording**, in-process or from another process's repository:
\`\`\`java
try (var rs = new RecordingStream()) {
    rs.enable("com.acme.MatchCycle").withThreshold(Duration.ofMillis(5));
    rs.onEvent("com.acme.MatchCycle", ev -> alerts.slowCycle(ev.getDuration()));
    rs.startAsync();
}
\`\`\`
Use it to export JFR data (GC pauses, lock contention, custom events) as metrics, or to trigger dumps when anomalies happen. Remote streaming works over JMX (\`RemoteRecordingStream\`).

### Why JFR instead of logging or metrics
Extremely low overhead, rich context (thread, stack trace on demand), correlation with JVM events (GC, safepoints) on the same timeline, and it's always available in production JDKs.`,
    pitfalls: [
      "Populating expensive fields without checking shouldCommit().",
      "Enabling stack traces on very frequent events.",
      "Using logging for microsecond-level timing.",
    ],
    followUpQuestions: [
      "How does JFR keep overhead so low?",
      "How would you correlate custom events with GC pauses in JMC?",
    ],
    faangFocus: "Advanced observability for low-latency and performance-critical teams.",
  },
  {
    id: 'prof-29',
    categoryId: 'profiling',
    title: 'async-profiler in Depth',
    difficulty: 'Expert',
    tags: ['async-profiler', 'perf_events', 'Containers', 'Native Frames'],
    scenario: "You need to profile a Java service running in Kubernetes, including time spent in native code and the kernel, and the security team restricts container privileges.",
    question: "How does async-profiler work, what can it profile, and how do you use it in containers?",
    idealAnswer: `### How it works
It combines **\`AsyncGetCallTrace\`** (a HotSpot API that walks Java stacks at any point, not only at safepoints) with **Linux \`perf_events\`** for native and kernel stacks. The result: accurate profiles without **safepoint bias**, including JIT-compiled, interpreted, native (JNI, libc, zlib) and kernel frames in one flame graph.

### Profiling modes (\`-e\`)
* \`cpu\`: on-CPU time (perf_events or itimer fallback).
* \`wall\`: all threads regardless of state.
* \`alloc\`: allocations via TLAB sampling.
* \`lock\`: contended locks.
* \`nativemem\`/\`malloc\`: native allocations (for native leaks).
* Hardware counters: \`cache-misses\`, \`branch-misses\`, etc.
* Java method or native function tracing (\`-e java.lang.String.intern\`).
Output: interactive HTML flame graphs, JFR format (viewable in JMC), collapsed stacks.

### Containers
* perf_events may be restricted by \`kernel.perf_event_paranoid\` and seccomp; without them, use \`-e itimer\` or \`-e ctimer\` (no kernel stacks, but safe and still bias-free).
* Run the profiler **inside the container's namespace** (copy the binary in, or use an ephemeral debug container with a shared process namespace), with matching user.
* Mount paths must match for symbol resolution of native libraries.

### Production use
Low overhead (typically ~1-2% at default sampling), start/stop on demand (\`asprof start/stop\`), or continuous via Pyroscope or other agents.`,
    pitfalls: [
      "Relying on safepoint-biased profilers (older VisualVM sampling).",
      "Failing to attach due to user or namespace mismatch.",
      "Too-high sampling frequency adding overhead.",
    ],
    followUpQuestions: [
      "What is safepoint bias and why does it mislead?",
      "How do you profile native memory leaks with it?",
    ],
    faangFocus: "Deep tooling knowledge for performance engineers.",
  },
  {
    id: 'prof-30',
    categoryId: 'profiling',
    title: 'Diagnosing JIT Problems',
    difficulty: 'Expert',
    tags: ['JIT', 'Deoptimization', 'PrintCompilation', 'JITWatch'],
    scenario: "After a release, a service's CPU usage is 40% higher at the same traffic. Profiles show time spread across interpreted frames and C1-compiled code, and JFR shows thousands of deoptimisation events per minute.",
    question: "How do you investigate JIT-related performance problems?",
    idealAnswer: `### Signals
* Profiles with many **interpreted** or C1 frames in hot code long after warm-up.
* JFR events: \`jdk.Deoptimization\` (with reason and method), \`jdk.Compilation\` (durations, failures), \`jdk.CodeCacheFull\`.
* Compiler threads busy long after startup.

### Tools
* \`-XX:+PrintCompilation\` (or \`-Xlog:jit+compilation\`): which methods compile at which tier; 'made not entrant' lines indicate deoptimisation.
* \`-XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining\`: inlining decisions and reasons ('too big', 'megamorphic').
* **JITWatch**: visualises compilation logs (\`-XX:+LogCompilation\`), inlining and assembly.
* \`jcmd <pid> Compiler.queue\` / \`Compiler.codecache\`.

### Common causes
* **Deoptimisation storms**: code compiled with assumptions (a branch never taken, a single receiver type, class hierarchy facts) that later break. If a type profile keeps flipping (e.g. a new implementation introduced in the release), methods recompile repeatedly.
* **Huge methods** that exceed inlining or compilation limits (\`HugeMethodLimit\`, 8000 bytecodes): they stay interpreted or aren't inlined.
* **Code cache full**: JIT disabled.
* Exceptions used for control flow in hot paths.

### Fixes
Split huge methods, keep hot call sites monomorphic where it matters, fix the code path that triggers repeated deopts, raise code cache size if needed. Verify with the same tools after the change.`,
    pitfalls: [
      "Ignoring deoptimisation events.",
      "Huge generated methods (templates, parsers) that never compile.",
      "Changing JIT flags without identifying the cause.",
    ],
    followUpQuestions: [
      "What does 'made not entrant' mean?",
      "Why is 8000 bytecodes a significant limit?",
    ],
    faangFocus: "Rare but high-value performance diagnosis skill.",
  },
  {
    id: 'prof-31',
    categoryId: 'profiling',
    title: 'Debugging Live Production JVMs With Arthas and BTrace',
    difficulty: 'Expert',
    tags: ['Arthas', 'BTrace', 'Dynamic Instrumentation', 'Production Debugging'],
    scenario: "A calculation returns wrong results only for a few production customers. You can't reproduce it locally, and adding logs requires a release that takes two days.",
    question: "How can you inspect a running production JVM without redeploying, and what safeguards are needed?",
    idealAnswer: `### Dynamic instrumentation
Java agents can **attach at runtime** and rewrite bytecode via the Instrumentation API, adding observation code to specific methods without restarting.

### Arthas (Alibaba)
An interactive diagnostic console attached to a live JVM:
* \`watch com.acme.PriceService calculate '{params, returnObj, throwExp}' 'params[0].customerId == 42'\`: print arguments and results for matching calls only.
* \`trace\`: time spent in each sub-call of a method.
* \`stack\`: who called this method.
* \`thread\`, \`dashboard\`: live thread and resource views.
* \`jad\`: decompile the class actually loaded (verify which version is deployed).
* \`ognl\`: evaluate expressions (read config, static fields).
* \`redefine\`/\`retransform\`: hot-patch classes (very dangerous).

### BTrace
Scripted, safe-by-design tracing: probes are restricted (no loops, no arbitrary calls) to reduce risk.

### Safeguards
* Access tightly controlled and audited; these tools can read any data in memory.
* Use **conditions and limits** (\`-n 5\` executions) so instrumentation doesn't flood output or add latency to hot paths.
* Detach and reset instrumentation afterwards (\`reset\`, \`stop\`).
* Try on one instance (or a canary) first.
* Prefer observability you can plan for: structured logs, feature-flagged debug logging per customer, and tracing with attributes.

### Alternatives
Commercial production debuggers (non-breaking breakpoints/snapshots) offer similar power with more guardrails.`,
    pitfalls: [
      "Hot-patching production classes casually.",
      "Unconditional watches on hot methods.",
      "Leaving agents attached and instrumentation active.",
    ],
    followUpQuestions: [
      "How does the JVM attach API load an agent?",
      "How would you add per-customer debug logging safely?",
    ],
    faangFocus: "Advanced production-debugging capability with a strong safety angle.",
  },
  {
    id: 'prof-32',
    categoryId: 'profiling',
    title: 'Analysing Very Large Heap Dumps',
    difficulty: 'Hard',
    tags: ['Heap Dump', 'Large Heaps', 'OQL', 'Memory Analysis'],
    scenario: "A 64GB-heap service leaks memory. Taking a heap dump pauses it for over a minute, produces a 50GB file, and MAT on a laptop crashes opening it.",
    question: "How do you handle memory analysis on very large heaps?",
    idealAnswer: `### Try cheaper evidence first
* **Class histogram** (\`jcmd <pid> GC.class_histogram\`): seconds, small output. Two histograms minutes apart often reveal the growing class directly.
* JFR's \`OldObjectSample\` event (with \`path-to-gc-roots=true\`) samples long-lived objects and records their reference chains, at low overhead, without a full dump.
* Metrics on cache sizes, queue lengths, and session counts.

### When you need a full dump
* Take it from an instance **removed from traffic** (pause lasts proportional to live heap).
* \`jcmd GC.heap_dump -gz=1\` (JDK 15+) writes a compressed dump; ensure disk space and fast storage.
* Consider \`-all=false\` default (live objects only, triggering a full GC first) to shrink it.

### Analysing it
* Run MAT **headless on a large-memory server** (\`ParseHeapDump.sh dump.hprof org.eclipse.mat.api:suspects\`), with \`-Xmx\` set in \`MemoryAnalyzer.ini\` to a large fraction of the dump size. Index files are reused for later interactive sessions.
* Use **OQL** to query directly for suspects instead of browsing.
* Alternatives: YourKit/JProfiler, or tools that stream-parse hprof for specific questions.

### Reduce the problem
Reproduce the leak in a smaller environment (a 4GB heap leaks the same way, just sooner) where dumps are easy to analyse.`,
    pitfalls: [
      "Taking a full dump from a serving instance.",
      "Opening huge dumps on underpowered machines.",
      "Skipping histograms, which often answer the question.",
    ],
    followUpQuestions: [
      "How does JFR OldObjectSample find leak candidates?",
      "What does -all=false do in a heap dump?",
    ],
    faangFocus: "Practical skill for teams running large-heap services.",
  },
  {
    id: 'prof-33',
    categoryId: 'profiling',
    title: 'Detecting False Sharing With Hardware Counters',
    difficulty: 'Master',
    tags: ['False Sharing', 'perf c2c', 'Hardware Counters', 'CPU Caches'],
    scenario: "A multi-threaded statistics aggregator gets slower as threads are added, even though each thread writes only to its own counter object. CPU profiles show time in trivial increment methods.",
    question: "How would you confirm false sharing and fix it?",
    idealAnswer: `### What's happening
Each thread's counter lives in its own object, but those small objects are allocated **next to each other** and share a 64-byte **cache line**. When one core writes, the cache coherence protocol (MESI) invalidates the line in other cores' caches; they must fetch it again. The line ping-pongs between cores, making each increment cost a cross-core transfer (tens to hundreds of cycles). The profile shows 'time in trivial code', which is the telltale sign.

### Confirming it
* **\`perf c2c\`** (cache-to-cache) on Linux records loads and stores that hit **modified lines in other cores' caches** (HITM events) and reports the contended cache lines with offsets and the code accessing them. Map addresses to Java objects/fields using async-profiler or JIT symbol maps (perf-map-agent).
* Hardware counters via async-profiler (\`-e cache-misses\`) or \`perf stat\` show elevated misses and cycles per instruction.
* A quick experiment: add padding and measure. A large speedup confirms it.

### Fixing it
* **\`@jdk.internal.vm.annotation.Contended\`** on fields/classes (needs \`-XX:-RestrictContended\` outside the JDK) pads to separate lines.
* Manual padding with long fields (less reliable, the JVM reorders fields; inheritance-based padding is the classic trick).
* Use **\`LongAdder\`**, which already pads its cells.
* Better: **thread-local accumulation** and periodic merging, so threads don't write shared memory at all.`,
    pitfalls: [
      "Assuming separate objects mean separate cache lines.",
      "Manual padding the JVM reorders away.",
      "Optimising without hardware-level evidence.",
    ],
    followUpQuestions: [
      "What is the MESI protocol?",
      "Why does @Contended require a JVM flag outside the JDK?",
    ],
    faangFocus: "Mechanical-sympathy question for low-latency and systems roles.",
  },
  {
    id: 'prof-34',
    categoryId: 'profiling',
    title: 'Observing and Debugging Virtual Threads',
    difficulty: 'Expert',
    tags: ['Virtual Threads', 'Thread Dumps', 'Pinning', 'JFR'],
    scenario: "A service running 200,000 virtual threads hangs. `jstack` output shows only a handful of carrier threads and nothing useful.",
    question: "How do you observe and debug applications that use virtual threads?",
    idealAnswer: `### Thread dumps for virtual threads
Classic \`jstack\`/\`Thread.print\` focus on **platform threads**. Use the new dump format:
\`jcmd <pid> Thread.dump_to_file -format=json /tmp/threads.json\`
It includes **virtual threads**, grouped by their thread containers (executors, \`StructuredTaskScope\`s), so you can see what each is blocked on. With hundreds of thousands of threads, analyse the JSON programmatically (group by top frames).

### JFR events
* \`jdk.VirtualThreadPinned\`: a virtual thread blocked while pinned to its carrier (in \`synchronized\` before JDK 24, or native frames), with stack traces and duration.
* \`jdk.VirtualThreadSubmitFailed\`, \`jdk.VirtualThreadStart/End\` (disabled by default, high volume).
* Carrier pool behaviour via \`jdk.virtualThreadScheduler\` settings and JMX.

### Common hang causes
* **Pinning** exhausting carriers (JDK 21-23): all carriers pinned inside synchronized blocks waiting on IO.
* Waiting on a **bounded resource** (connection pool, semaphore) that is exhausted: thousands of virtual threads parked on \`getConnection\`.
* Deadlocks between virtual threads (same as platform threads, visible in the JSON dump).

### Debuggers and profilers
Modern IDEs support stepping through virtual threads. Profilers need recent versions to attribute samples to virtual threads rather than carriers.

### Diagnostic flag
\`-Djdk.tracePinnedThreads=full\` printed stacks when pinning occurred (removed in JDK 24 along with most pinning); prefer JFR.`,
    pitfalls: [
      "Relying on jstack for virtual thread visibility.",
      "Ignoring pinning events on JDK 21-23.",
      "Assuming no thread limit means no resource limit.",
    ],
    followUpQuestions: [
      "How do thread containers help structure the dump?",
      "How would you alert on excessive pinning?",
    ],
    faangFocus: "Modern Java operations knowledge that few candidates have yet.",
  },
  {
    id: 'prof-35',
    categoryId: 'profiling',
    title: 'Reproducing Production Bugs',
    difficulty: 'Solid',
    tags: ['Reproduction', 'Debugging Methodology', 'Minimal Reproducer'],
    scenario: "A bug occurs for about one in 10,000 orders in production. Every attempt to reproduce it locally fails, and the team keeps guessing at fixes.",
    question: "How do you systematically reproduce hard-to-reproduce bugs?",
    idealAnswer: `### Gather evidence first
* Collect **all** occurrences: logs, trace IDs, request payloads, timestamps, instance IDs, versions.
* Look for **what the failing cases have in common**: a tenant, a currency, a time of day, a specific instance or version, concurrent requests on the same entity, a feature flag, input size, locale or time zone.
* Compare with successful cases that look similar.

### Form hypotheses about the category
* **Data-dependent**: a particular combination of values → reproduce with the same (anonymised) data.
* **Timing/concurrency**: races, retries, duplicate messages → reproduce with concurrent load, injected delays, or repeated runs.
* **Environment**: config, JVM version, time zone, DNS, resource limits → diff the environments.
* **State-dependent**: caches, long uptime, leaks → run long enough, or recreate the state.

### Make reproduction cheap
* Write a **failing automated test** as soon as you have a reproduction; shrink it to the **minimal** case.
* Capture production requests (sanitised) for replay.
* Add targeted logging/tracing (behind a flag) to capture missing context on the next occurrence.

### Avoid
Shotgun fixes that aren't verified by a reproduction: they often mask the symptom, and you won't know if the bug is gone.`,
    pitfalls: [
      "Guessing fixes without reproducing.",
      "Looking only at failing cases without comparing successful ones.",
      "Not preserving evidence from production occurrences.",
    ],
    followUpQuestions: [
      "How would you reproduce a race condition reliably?",
      "How do you safely use production data for reproduction?",
    ],
    faangFocus: "Debugging methodology is often assessed through a story from your experience.",
  },
  {
    id: 'prof-36',
    categoryId: 'profiling',
    title: 'Too Many Open Files',
    difficulty: 'Solid',
    tags: ['File Descriptors', 'Resource Leaks', 'Sockets', 'ulimit'],
    scenario: "After running for a few days, a service fails with `java.net.SocketException: Too many open files`, and log rotation stops working.",
    question: "What causes this and how do you find the leak?",
    idealAnswer: `### File descriptors
Every open file, socket, pipe and some other resources consume a **file descriptor**. Processes have a limit (\`ulimit -n\`, often 1024 by default outside containers; container runtimes typically set higher). When exhausted, any open or accept fails.

### Confirm
* \`ls /proc/<pid>/fd | wc -l\` over time: steadily growing → leak.
* \`lsof -p <pid>\` or \`ls -l /proc/<pid>/fd\`: what they point to. Many \`socket:[...]\` entries → network connections; many files with the same path → file handles not closed.
* JMX \`OpenFileDescriptorCount\` (Micrometer \`process.files.open\`) for dashboards and alerts.

### Common Java causes
* Streams, readers or \`Files.lines\`/\`Files.list\` not closed (missing try-with-resources).
* HTTP clients created per request with their own connection pools.
* \`HttpURLConnection\` responses not fully read or closed.
* \`ZipFile\`/\`JarFile\` opened repeatedly.
* Child processes (\`ProcessBuilder\`) whose streams are never closed.
* Relying on GC/finalisation to close resources.

### Fixes
Close resources deterministically (try-with-resources everywhere), reuse clients, and set limits sensibly (raising \`ulimit\` buys time but doesn't fix a leak). Static analysis (SpotBugs, Error Prone, Sonar) flags unclosed resources.`,
    pitfalls: [
      "Raising ulimit as the only fix.",
      "Files.lines without try-with-resources.",
      "Creating HTTP clients per request.",
    ],
    followUpQuestions: [
      "Why doesn't garbage collection solve resource leaks?",
      "How would you alert on descriptor growth?",
    ],
    faangFocus: "A classic resource-leak incident question.",
  },
  {
    id: 'prof-37',
    categoryId: 'profiling',
    title: 'Blameless Postmortems',
    difficulty: 'Solid',
    tags: ['Postmortem', 'Incident Management', 'Root Cause Analysis', 'Culture'],
    scenario: "After a two-hour outage, a manager wants to know 'who caused it'. You're asked to lead the postmortem.",
    question: "How do you run an effective postmortem, and what should the document contain?",
    idealAnswer: `### Blameless by design
People act reasonably given the information and tools they had. Blame makes people hide information, and the same failure happens again with someone else. Focus on **how the system allowed** the failure: missing guardrails, confusing tooling, unclear alerts.

### Document structure
* **Summary**: what happened, impact (users affected, duration, revenue, SLO budget burned).
* **Timeline**: detection, escalation, key decisions, mitigation, resolution (with timestamps).
* **Root cause and contributing factors**: usually several (a bug + missing test + no canary + alert too slow). Techniques: '5 whys' (keep asking why until you reach systemic causes) and fault trees.
* **What went well / what went poorly / where we got lucky.**
* **Action items**: specific, owned, prioritised, with due dates, that address detection, prevention and mitigation (e.g. add canary analysis, add timeouts, improve runbook).

### Process
Draft within days while memories are fresh, review with everyone involved, share widely, and **track action items to completion**; unfinished actions are the most common failure of postmortem processes.

### Metrics
Time to detect, time to mitigate, recurrence of similar incidents.`,
    pitfalls: [
      "Naming individuals as root causes.",
      "Single root cause oversimplification.",
      "Action items that are never completed.",
    ],
    followUpQuestions: [
      "How do you decide which incidents need a full postmortem?",
      "How would you handle an incident caused by a manual production change?",
    ],
    faangFocus: "A behavioural-technical question common for senior roles.",
  },
  {
    id: 'prof-38',
    categoryId: 'profiling',
    title: 'OS-Level Tools for JVM Troubleshooting',
    difficulty: 'Hard',
    tags: ['vmstat', 'pidstat', 'strace', 'tcpdump', 'Linux'],
    scenario: "JVM-level tools show nothing obviously wrong, yet the service is slow on one particular host.",
    question: "Which Linux tools would you use, and what does each reveal?",
    idealAnswer: `### The 60-second checklist (Brendan Gregg style)
* \`uptime\`: load averages trend.
* \`dmesg -T | tail\`: OOM killer, hardware errors, TCP issues.
* \`vmstat 1\`: run queue (\`r\` > CPU count = saturation), swapping (\`si/so\`), CPU **steal** (\`st\`, noisy neighbours on VMs), IO wait.
* \`mpstat -P ALL 1\`: imbalance across CPUs (one core at 100%: a single hot thread or interrupt).
* \`pidstat 1\` / \`pidstat -t -p <pid> 1\`: per-process/thread CPU, including context switches (\`-w\`).
* \`iostat -xz 1\`: disk utilisation and latency (log writes, heap dumps, swap).
* \`free -m\`: memory and page cache.
* \`sar -n DEV,TCP,ETCP 1\`: network throughput, retransmits.

### Deeper tools
* \`strace -f -p <pid>\` (or \`-c\` for a summary): system calls; reveals blocking file/network calls. Heavy overhead: use briefly.
* \`tcpdump\`: packet-level view of slow or failing connections.
* \`ss -tanp\`: socket states, queue sizes.
* \`perf\` / eBPF tools (\`offcputime\`, \`biolatency\`, \`tcpretrans\`): low-overhead kernel-level insight.

### In containers
cgroup metrics (\`/sys/fs/cgroup/.../cpu.stat\` for throttling, \`memory.stat\`), and node-level tools via a privileged debug pod.

### Why it matters
Many 'JVM problems' are host problems: steal time, disk contention, throttling, swapping, or network retransmits.`,
    pitfalls: [
      "Only looking at JVM metrics.",
      "Leaving strace attached on a production process.",
      "Ignoring CPU steal time on virtualised hosts.",
    ],
    followUpQuestions: [
      "What does high CPU steal indicate?",
      "How would you detect TCP retransmits affecting latency?",
    ],
    faangFocus: "Systems-level debugging expected from senior engineers who go on call.",
  },
  {
    id: 'prof-39',
    categoryId: 'profiling',
    title: 'Investigating a JVM Crash',
    difficulty: 'Master',
    tags: ['hs_err', 'Core Dump', 'SIGSEGV', 'Native Crashes'],
    scenario: "A service occasionally dies with no Java exception. The container restarts, and a file named `hs_err_pid1.log` appears in the working directory, mentioning `SIGSEGV` in `libzip.so`.",
    question: "How do you investigate a JVM crash?",
    idealAnswer: `### The hs_err file
When the JVM itself crashes (a fatal signal or internal error), it writes \`hs_err_pid<pid>.log\` (location configurable with \`-XX:ErrorFile\`). Key sections:
* **Header**: signal (\`SIGSEGV\`, \`SIGBUS\`), the problematic frame, and whether it's in Java (J), compiled code, the VM (V), or **native code (C)**.
* **Current thread and its stack**: mixed Java/native frames at the crash.
* **Registers, memory map, loaded libraries, VM flags, environment, OS info**.

### Common causes
* **Native libraries or JNI**: bugs in native code (compression, crypto, image processing, database drivers, agents). A crash in \`libzip.so\` often means a **JAR or zip file was modified while in use** (overwritten during a deploy, or a mmap'd file truncated), which also causes SIGBUS.
* \`sun.misc.Unsafe\` or FFM misuse writing to invalid memory.
* JVM bugs, especially in the JIT (crash in compiled code; check for known bugs and upgrade).
* Hardware or OS issues (bad memory, full \`/tmp\` for mmap'd files).
* Native memory exhaustion.

### Deeper analysis
* Enable **core dumps** (\`ulimit -c unlimited\`, container config) and analyse with \`gdb\` or the JDK's \`jhsdb\` (\`jhsdb jstack --core core --exe java\`) to see Java stacks from a core file.
* Reproduce with \`-Xcheck:jni\` to validate JNI usage; try disabling a suspect agent.
* Search the JDK bug database with the problematic frame.

### Operational hygiene
Persist hs_err files and core dumps to a volume (they vanish with containers), and alert on restarts without Java-level errors.`,
    pitfalls: [
      "Losing hs_err files when containers restart.",
      "Overwriting JARs in place while the JVM runs.",
      "Ignoring native agents and libraries as suspects.",
    ],
    followUpQuestions: [
      "How does jhsdb analyse a core file?",
      "What does -Xcheck:jni do?",
    ],
    faangFocus: "Rare, expert troubleshooting that impresses in infrastructure interviews.",
  },
];
