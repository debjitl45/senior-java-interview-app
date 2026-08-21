import type { Question } from '../types';

export const JVM_QUESTIONS: Question[] = [
  {
    id: 'jvm-1',
    categoryId: 'jvm',
    title: 'ZGC vs G1GC: Low Latency vs Throughput',
    difficulty: 'Expert',
    tags: ['ZGC', 'G1GC', 'Garbage Collection', 'Low Latency'],
    scenario: 'You are designing the core order-matching engine for a high-frequency trading platform. The maximum acceptable tail latency (p99.9) for processing an order is under 5 milliseconds. The application heap size is 64GB.',
    question: 'How do you choose between G1GC and ZGC for this service? Explain the internal mechanisms of ZGC that allow it to achieve sub-millisecond pause times regardless of heap size, and discuss the trade-offs regarding CPU throughput and allocation stalls.',
    idealAnswer: `To achieve guaranteed sub-millisecond p99.9 tail latencies on a 64GB heap, **ZGC (Z Garbage Collector)** is the optimal choice over G1GC. 

### 1. Architectural Differences
* **G1GC:** A generational, region-based collector. While it aims for target pause times, its evacuation phase (copying live objects) is a **Stop-The-World (STW)** operation. For a 64GB heap, evacuating heavily populated regions can easily cause pauses exceeding 50-100ms.
* **ZGC:** A scalable, low-latency collector that performs all expensive work—Marking, Relocation, and Evacuation—**concurrently** with application threads. Its STW pauses are limited to root scanning and synchronization, consistently measuring below 1ms.

### 2. Core ZGC Mechanisms
* **Colored Pointers:** ZGC stores metadata directly in the reference bits (using 64-bit pointers). Bits are reserved for \`Marked0\`, \`Marked1\`, \`Remapped\`, and \`Finalizable\`. This lets the collector immediately know the state of an object by inspecting its reference.
* **Load Barriers:** When an application thread loads a reference from the heap, a small JIT-compiled snippet (the load barrier) checks the colored pointer. If the object has been relocated but the reference hasn't been updated, the load barrier intercepts the access, updates the reference, and returns the correct address (Self-Healing). This avoids STW relocation.

### 3. Trade-offs & Risks
* **Throughput Penalty:** Because ZGC runs concurrently, it consumes significant CPU cycles that would otherwise execute business logic. G1GC typically offers 5-15% higher absolute raw throughput.
* **Allocation Stalls:** If application threads allocate new objects faster than the background ZGC threads can reclaim space, the application will experience an "Allocation Stall," temporarily blocking application threads. To mitigate this, adequate CPU headroom and potentially larger heap buffers must be provisioned.`,
    pitfalls: [
      'Claiming ZGC has absolutely zero pauses (it has sub-millisecond root scan pauses).',
      'Ignoring the CPU throughput overhead of concurrent load barriers.',
      'Failing to mention Allocation Stalls as the primary failure mode of ZGC under heavy load.'
    ],
    followUpQuestions: [
      'How does ZGC handle generational collection in Java 21+?',
      'If you observe Allocation Stalls in production with ZGC, how do you remediate them without changing code?'
    ],
    faangFocus: 'Interviewers look for deep understanding of memory layout (Colored Pointers) and the precise mechanics of Concurrent Relocation via Load Barriers. They want to see if you can balance theoretical low latency against production hardware costs.'
  },
{
    id: 'jvm-2',
    categoryId: 'jvm',
    title: 'Escape Analysis and Scalar Replacement',
    difficulty: 'Hard',
    tags: ['JIT', 'Escape Analysis', 'Memory Allocation', 'Performance'],
    scenario: 'A microservice processes millions of JSON events per second. Profiling reveals extremely high object allocation rates for short-lived wrapper objects, causing frequent minor GC pauses.',
    question: 'Explain how the C2 JIT compiler uses Escape Analysis to optimize object allocations. What is Scalar Replacement, and what code patterns can prevent Escape Analysis from succeeding?',
    idealAnswer: `### 1. Escape Analysis Overview
Escape Analysis is a technique used by the C2 JIT compiler to determine if the lifetime of an object reference is confined to the executing method or thread. If the object does not "escape" the current execution context, the JVM can apply aggressive optimizations.

### 2. Scalar Replacement vs. Stack Allocation
* A common misconception is that Java allocates non-escaping objects on the thread stack. In the HotSpot JVM, the actual optimization applied is **Scalar Replacement**.
* **Scalar Replacement:** Instead of creating the actual object header and allocating contiguous memory, the JIT compiler dismantles the object into its constituent primitive fields (scalars) and maps them directly to CPU registers or execution stack slots. The object conceptually ceases to exist at runtime.

### 3. Conditions that Defeat Escape Analysis
To ensure Scalar Replacement occurs, the code must avoid:
* **Escaping via Return or Arguments:** Returning the object or passing it to an external method that the JIT cannot inline.
* **Assigning to Static or Heap Fields:** Storing the reference in a global or long-lived structure.
* **Array Allocations:** If the allocation size of an array is not a compile-time constant, or if it exceeds the \`EliminateAllocationArraySizeLimit\` (default 64), it will not be scalar replaced.
* **Control Flow Complexity:** If the object allocation happens inside complex control flows that prevent full inlining, the compiler must assume it escapes.`,
    codeSnippet: `// Example: Can this Point object be scalar replaced?
public double calculateDistance(double x1, double y1, double x2, double y2) {
    Point p1 = new Point(x1, y1);
    Point p2 = new Point(x2, y2);
    return p1.distanceTo(p2); 
    // If distanceTo is inlined, p1 and p2 do not escape!
}`,
    pitfalls: [
      'Stating that HotSpot allocates objects on the stack (it uses Scalar Replacement).',
      'Assuming Escape Analysis works across un-inlined method boundaries.',
      'Overlooking the impact of array size limits on allocation elimination.'
    ],
    followUpQuestions: [
      'How can you verify if scalar replacement is happening using JVM flags?',
      'What is the impact of partial escape analysis introduced in newer Graal / Hotspot versions?'
    ],
    faangFocus: 'High-frequency and low-latency teams (e.g., Netflix, Uber) look for developers who write allocation-free code paths by designing objects that conform strictly to scalar replacement criteria.'
  },
{
    id: 'jvm-3',
    categoryId: 'jvm',
    title: 'Safepoints and Time-To-Safepoint (TTSP)',
    difficulty: 'Master',
    tags: ['Safepoints', 'TTSP', 'JVM Internals', 'Latency'],
    scenario: 'Your application logs show that while actual GC pause times are low (e.g., 10ms), the total application pause time reported by the JVM is over 200ms. Users are experiencing random lag spikes.',
    question: 'What is a JVM Safepoint? Explain what causes a high Time-To-Safepoint (TTSP) and how you would diagnose and resolve this issue in a low-latency Java service.',
    idealAnswer: `### 1. What is a Safepoint?
A Safepoint is a state during program execution where all application threads are paused, and their execution stacks and registers are in a known, consistent state. The JVM requires safepoints to perform global operations such as:
* Garbage Collection (STW phases)
* JIT Deoptimization
* Thread Dump generation
* Biased lock revocation (in older JDKs)

### 2. Time-To-Safepoint (TTSP)
When the JVM initiates a safepoint, it sets a global flag. Application threads must actively poll this flag and suspend themselves. **TTSP** is the time elapsed between the JVM requesting a safepoint and the last application thread actually reaching a safepoint. The entire application stalls during this waiting period.

### 3. Causes of High TTSP
* **Counted Loops:** In JIT-compiled code, HotSpot historically omits safepoint polls inside "counted loops" (e.g., \`for (int i = 0; i < 1_000_000; i++)\`) to maximize loop throughput. If the loop body is slow or executes many times, the thread cannot reach a safepoint.
* **Heavy I/O or Native Code:** Threads executing unoptimized native code or blocked in kernel space might take time to transition back to the Java context where the safepoint poll occurs.

### 4. Diagnosis and Resolution
* **Diagnosis:** Enable Safepoint logging using \`-Xlog:safepoint=debug\` (Java 9+) or \`-XX:+PrintSafepointStatistics\` (Java 8). Look for entries where the \`spin\` or \`sync\` time is significantly higher than the \`exec\` time.
* **Resolution:** 
  1. Use \`-XX:+UseCountedLoopSafepoints\` to force the JIT compiler to insert safepoint polls inside counted loops.
  2. Refactor long-running integer-based loops to use \`long\` loop counters, which inherently include safepoint polls in HotSpot.
  3. Ensure thread dumps or profiling tools aren't being invoked excessively in production.`,
    pitfalls: [
      'Confusing GC pause time with the total safepoint sync time.',
      'Not knowing that integer-indexed counted loops lack safepoint polls by default.',
      'Attempting to solve TTSP by tuning GC heap sizes.'
    ],
    followUpQuestions: [
      'How does the JVM implement safepoint polling efficiently at the assembly level?',
      'What are Thread-Local Handshakes (JEP 312) and how do they reduce global safepoint pauses?'
    ],
    faangFocus: 'Essential for high-throughput messaging or payment infrastructure. Interviewers test if you understand the boundary between application code execution and JVM runtime orchestration.'
  },
{
    id: 'jvm-4',
    categoryId: 'jvm',
    title: 'Metaspace Internals and ClassLoader Leaks',
    difficulty: 'Hard',
    tags: ['Metaspace', 'ClassLoaders', 'Memory Leaks', 'Internals'],
    scenario: 'An application deployed on a container platform experiences OutOfMemoryError: Metaspace after multiple dynamic plugin reloads. Heap memory remains completely stable.',
    question: 'Explain the internal architecture of Metaspace. Why does dynamically reloading classes lead to Metaspace leaks, and how do you architect a custom ClassLoader implementation to ensure clean unloading?',
    idealAnswer: `### 1. Metaspace Architecture
Unlike the legacy PermGen, Metaspace resides in **native memory** (off-heap). It stores class definitions, vtables, bytecode, and constant pools. 
* Metaspace is allocated in chunks associated with a specific **ClassLoader**.
* **Crucial Rule:** The metadata for a class cannot be deallocated individually. The entire Metaspace chunk belonging to a \`ClassLoader\` is only freed when the \`ClassLoader\` instance itself becomes unreachable and is garbage collected.

### 2. Root Cause of Metaspace Leaks
When plugins or modules are dynamically reloaded, a new \`ClassLoader\` is created to load the new versions of the classes. A Metaspace leak occurs if the **old ClassLoader cannot be garbage collected**.
This typically happens due to lingering references:
* **ThreadLocal Variables:** A thread from a shared pool retains a \`ThreadLocal\` whose value is an instance of a class loaded by the custom \`ClassLoader\`.
* **Registered Listeners/Hooks:** The plugin registered an event listener in a global system registry (loaded by the System ClassLoader) but failed to unregister it.
* **Static Fields:** Cross-classloader references stored in static caches.

### 3. Architecting for Clean Unloading
To ensure a custom \`ClassLoader\` can be cleanly unloaded:
1. **Strict Isolation:** Ensure no references to instances of the dynamically loaded classes escape to the parent/system classloader context. Use generic interfaces loaded by the parent classloader to interact with the plugin.
2. **Lifecycle Management:** Implement a mandatory \`shutdown()\` lifecycle method in the plugin to explicitly clear all \`ThreadLocal\` values, unregister Loggers, and remove event listeners.
3. **Verification:** Use a \`WeakReference\` to the custom \`ClassLoader\` after disposal. If the reference is not cleared after a full GC, trigger an alert and capture a heap dump to trace the GC roots holding the ClassLoader.`,
    pitfalls: [
      'Assuming Metaspace is garbage collected class-by-class rather than per-ClassLoader.',
      'Believing that setting MetaspaceMax limits prevents leaks (it just causes the OOM to happen predictably).',
      'Overlooking ThreadLocals in web containers as the primary culprit for ClassLoader leaks.'
    ],
    followUpQuestions: [
      'How do Compressed Class Pointers work, and what is the role of the CompressedClassSpace?',
      'How would you use Eclipse MAT or VisualVM to find the exact GC root preventing a ClassLoader from being collected?'
    ],
    faangFocus: 'Extremely relevant for platforms that support dynamic code execution, serverless runtimes, or modular monoliths. Tests deep mastery of the Java Classloading hierarchy.'
  },
{
    id: 'jvm-5',
    categoryId: 'jvm',
    title: 'Classloading Exceptions Explained',
    difficulty: 'Hard',
    tags: ['Classloader', 'Exceptions', 'JVM'],
    scenario: 'An application crashes on startup after a recent deployment. It compiled perfectly in the CI/CD pipeline, leaving junior developers confused.',
    question: 'What is the difference between ClassNotFoundException and NoClassDefFoundError?',
    idealAnswer: `### 1. ClassNotFoundException (Checked Exception)
This is thrown when the application explicitly tries to load a class at runtime using reflection (e.g., \`Class.forName()\`, \`ClassLoader.loadClass()\`) and the class is not found in the classpath. Because it is an expected runtime scenario (like missing a JDBC driver), it is a **Checked Exception** and must be handled.

### 2. NoClassDefFoundError (Error)
This is an **Error**, indicating a severe JVM issue. It occurs when a class was present during compile time (so the build succeeds), but is **absent or fails to load at runtime**. For example, compiling against a JAR that is accidentally omitted from the runtime classpath.

### 3. Tricky Scenarios (Static Initialization)
A common and hard-to-debug cause for \`NoClassDefFoundError\` is when a class's **static initialization block throws an exception** (e.g., parsing a bad string into a static int). 
The first time the classloader attempts initialization, it throws an \`ExceptionInInitializerError\`. The JVM caches this failure. Any subsequent attempt to load the class results in a \`NoClassDefFoundError\` because the JVM remembers it failed and refuses to retry.`,
    pitfalls: [
      'Treating both as the same "missing file" problem without understanding the compile-time vs runtime distinction.',
      'Failing to realize NoClassDefFoundError is an Error, not an Exception.',
      'Missing the static initializer failure scenario, which is a favorite follow-up for senior interviews.'
    ],
    followUpQuestions: [
      'How does Java\'s parent-delegation classloading model work?',
      'How would you debug a NoClassDefFoundError caused by a static init failure?'
    ],
    faangFocus: 'Deep understanding of the JVM classloader architecture is required when dealing with complex modular systems, plugins, or custom containers often built at scale.'
  },
{
    id: 'jvm-6',
    categoryId: 'jvm',
    title: 'String Interning and G1GC Deduplication',
    difficulty: 'Hard',
    tags: ['String Pool', 'G1GC', 'Memory Optimization'],
    scenario: 'Your application processes millions of text records, leading to high heap usage. You need to optimize memory footprint without rewriting core business logic.',
    question: 'Explain String interning, String pool, and how Java handles String deduplication in G1GC.',
    idealAnswer: `### 1. String Pool and Interning
The **String pool** is a special memory region in the heap (moved from PermGen in Java 7) that stores String literals. Declaring \`String s1 = "Hello"\` places it in the pool. A subsequent \`String s2 = "Hello"\` reuses the same reference, meaning \`s1 == s2\` is true. Conversely, \`new String("Hello")\` forces allocation on the main heap.
You can manually move a heap string to the pool using \`intern()\`. It returns the pool reference if the content exists, otherwise it adds it.

### 2. Compile-Time vs Runtime Concatenation
Compile-time concatenations (e.g., \`"Hel" + "lo"\`) are optimized by the compiler directly into the pool as \`"Hello"\`. Runtime concatenations involving variables create new objects on the regular heap.

### 3. G1GC String Deduplication (Trade-offs)
Enabled via \`-XX:+UseStringDeduplication\`, this GC feature scans for Strings with identical content and forces them to share the same backing \`char[]\` (or \`byte[]\` in newer Java versions). 
**Trade-offs:** Unlike interning, the String objects themselves remain separate in memory, but the underlying data array is shared. This typically saves 10–25% of heap space in data-heavy apps without requiring code changes, at the cost of slight CPU overhead during GC.`,
    pitfalls: [
      'Confusing String deduplication (shares backing array) with String interning (shares the actual String object).',
      'Believing the String pool is still in the PermGen space (it moved in Java 7).',
      'Assuming runtime string concatenation behaves the same as compile-time.'
    ],
    followUpQuestions: [
      'Since Java 9, how has the internal representation of Strings changed? (Hint: Compact Strings)',
      'Is it a good idea to call intern() on every string you create?'
    ],
    faangFocus: 'Memory efficiency at scale is vital at companies like Amazon and Netflix. Demonstrating knowledge of JVM-level optimizations shows you can scale apps efficiently.'
  },
{
    id: 'jvm-7',
    categoryId: 'jvm',
    title: 'Class Data Sharing (CDS) and Startup Optimization',
    difficulty: 'Expert',
    tags: ['CDS', 'AppCDS', 'Startup Time', 'Microservices'],
    scenario: 'Your Spring Boot microservice deployed on Kubernetes takes 45 seconds to start, causing slow scaling during traffic spikes. You need to reduce startup time to under 5 seconds.',
    question: 'Explain how Class Data Sharing (CDS) and Application Class Data Sharing (AppCDS) work internally. How do they reduce JVM startup time and memory footprint? What are the limitations when used with Spring Boot?',
    idealAnswer: `### 1. What is Class Data Sharing (CDS)?
  **CDS** is a JVM feature that pre-processes and stores core JDK classes (like \`java.lang.String\`, \`java.util.*\`) into a shared archive file (\`classes.jsa\`). When multiple JVMs start on the same machine, they can **memory-map** this archive instead of loading classes individually.
  
  ### 2. How CDS Reduces Startup Time
  * **Traditional Startup:** The JVM must load, verify, and prepare ~15,000+ core classes from JAR files on every startup. This involves disk I/O, bytecode verification, and memory allocation.
  * **With CDS:** The pre-processed classes are memory-mapped directly from the archive. The JVM skips loading and verification, reducing startup time by **30-40%**.
  
  ### 3. Application CDS (AppCDS) - Java 10+
  AppCDS extends CDS to include **application classes** (your code + third-party libraries):
  * **Step 1:** Run the app once with \`-XX:DumpLoadedClassList=classes.lst\` to capture all loaded classes.
  * **Step 2:** Generate the archive: \`java -XX:SharedArchiveFile=app-cds.jsa -XX:SharedClassListFile=classes.lst -Xshare:dump\`
  * **Step 3:** Use the archive: \`java -XX:SharedArchiveFile=app-cds.jsa -Xshare:on -jar myapp.jar\`
  
  ### 4. Spring Boot Integration
  Spring Boot 3.3+ has native AppCDS support via the \`spring-boot-maven-plugin\`:
  * Add \`<excludeDevtools>true</excludeDevtools>\` and enable CDS in the plugin configuration.
  * This can reduce Spring Boot startup from 45s to **8-12s**.
  
  ### 5. Limitations
  * **Dynamic Class Loading:** If your app uses reflection-heavy frameworks that load classes dynamically at runtime, those classes won't be in the archive.
  * **Classpath Sensitivity:** The archive is tied to the exact classpath. Changing dependencies requires regenerating the archive.
  * **Memory Mapping:** Requires the OS to support memory-mapped files (all modern OSes do, but container filesystems like overlayfs can have edge cases).`,
    codeSnippet: `# Generate AppCDS archive for Spring Boot
  java -XX:ArchiveClassesAtExit=app-cds.jsa -jar myapp.jar
  
  # Subsequent runs use the archive
  java -XX:SharedArchiveFile=app-cds.jsa -jar myapp.jar`,
    pitfalls: [
      'Forgetting to regenerate the archive after changing dependencies.',
      'Using CDS with Spring DevTools enabled (causes conflicts).',
      'Assuming CDS helps with runtime performance (it only helps startup time and memory).'
    ],
    followUpQuestions: [
      'How does CDS interact with GraalVM Native Image?',
      'What is the difference between static and dynamic CDS archives?'
    ],
    faangFocus: 'Critical for companies running thousands of microservices on Kubernetes (Netflix, Uber). Startup time directly impacts auto-scaling responsiveness and infrastructure costs.'
  },
{
    id: 'jvm-8',
    categoryId: 'jvm',
    title: 'Shenandoah GC vs ZGC: Ultra-Low Latency Showdown',
    difficulty: 'Master',
    tags: ['Shenandoah', 'ZGC', 'Garbage Collection', 'Red Hat', 'Oracle', 'Latency'],
    scenario: 'You are the Lead JVM Architect at a global fintech company processing 2 million transactions per second. Your CTO mandates that no single request can experience more than a 500-microsecond pause due to garbage collection. You must choose between Red Hat\'s Shenandoah GC and Oracle\'s ZGC for a 128GB heap deployment on Linux.',
    question: 'Compare Shenandoah and ZGC at the architectural level. What are the fundamental differences in their concurrent compaction strategies (Brooks Pointers vs Colored Pointers)? Which one should you choose for this specific fintech use case and why?',
    idealAnswer: '### 1. Core Architectural Differences\nBoth Shenandoah and ZGC are ultra-low-latency concurrent collectors that perform compaction concurrently with application threads.\n\n### 2. Shenandoah (Red Hat / OpenJDK)\n* **Brooks Pointers (Forwarding Pointers):** Shenandoah adds an extra pointer to every object header.\n* **Concurrent Compaction:** During collection, Shenandoah updates Brooks Pointers while application threads continue running.\n* **Generational Mode (JEP 404+):** As of Java 18+, Shenandoah supports generational collection.\n\n### 3. ZGC (Oracle / OpenJDK)\n* **Colored Pointers:** ZGC embeds metadata directly into the unused bits of a 64-bit pointer.\n* **Load Barriers (Self-Healing):** When a Java thread loads a reference, a JIT-compiled load barrier checks the colored bits.\n* **Generational Mode (JEP 439+):** As of Java 21+, ZGC supports generational collection.\n\n### 4. Decision Framework\n| Factor | Shenandoah | ZGC |\n|:---|:---|:---|\n| **Pointer Overhead** | Extra word per object | Zero overhead |\n| **Throughput** | Slightly lower | Slightly higher |\n| **Best For** | Steady allocation | Bursty allocation |\n\n### 5. Recommendation for Fintech\n**Choose ZGC** because its zero-overhead colored pointers result in slightly better raw throughput at 2M TPS.',
    pitfalls: [
      'Claiming ZGC and Shenandoah have identical performance profiles.',
      'Forgetting that both collectors now support generational mode in Java 21+.',
      'Ignoring the Brooks Pointer memory overhead of Shenandoah on very large heaps.',
      'Not mentioning that both require specific JVM flags and are NOT the default collectors.'
    ],
    followUpQuestions: [
      'How does the Brooks Pointer overhead of Shenandoah scale as heap size increases from 16GB to 512GB?',
      'What is the impact of ZGC\'s colored pointers on compressed class pointers (CompressedOops)?',
      'How do you set up automated JFR-based GC pause monitoring in a Kubernetes environment?'
    ],
    faangFocus: 'Red Hat and Oracle engineering teams use this exact question to evaluate whether candidates can make data-driven JVM tuning decisions at extreme scale.'
  },
{
    id: 'jvm-9',
    categoryId: 'jvm',
    title: 'JVM Memory Layout: Heap, Metaspace and Native',
    difficulty: 'Solid',
    tags: ['Memory', 'Metaspace', 'Heap', 'Native Memory'],
    scenario: 'A container with a 2GB limit and `-Xmx1500m` is repeatedly OOM-killed by the kernel, even though heap dumps show only 900MB of live objects and no heap OutOfMemoryError is ever thrown.',
    question: 'Account for the memory the JVM uses beyond the heap, and explain how to size a container correctly.',
    idealAnswer: `### The heap is not the process
A container OOM-kill means **RSS exceeded the limit**, which is a completely different measurement from heap usage. \`-Xmx\` bounds only one region.

### The regions
* **Heap** — objects. Bounded by \`-Xmx\`.
* **Metaspace** — class metadata. **Native memory, not heap**, and unbounded by default (\`-XX:MaxMetaspaceSize\` sets a cap). Frameworks that generate proxies and lambdas grow it; classloader leaks grow it without limit.
* **Code cache** — JIT-compiled native code, typically 240MB reserved (\`-XX:ReservedCodeCacheSize\`).
* **Thread stacks** — \`-Xss\` (default ~1MB) **per platform thread**. 500 threads is 500MB, and this is the item most often forgotten.
* **GC overhead** — mark bitmaps, remembered sets, forwarding tables. G1 and ZGC can use 5-15% of heap size in native structures.
* **Direct byte buffers / FFM** — off-heap, bounded by \`-XX:MaxDirectMemorySize\` (defaults to \`-Xmx\`, which is a large hidden allowance).
* **Compiler and symbol tables, JNI, malloc arenas** — glibc's per-thread malloc arenas can add hundreds of megabytes; \`MALLOC_ARENA_MAX=2\` is a common container fix.

### Diagnosing it
**Native Memory Tracking** is the tool: \`-XX:NativeMemoryTracking=summary\`, then \`jcmd <pid> VM.native_memory summary\`. It attributes reserved and committed memory per category, which is exactly the missing 600MB in this scenario. Compare committed totals against container RSS.

### Sizing a container
Do **not** compute \`-Xmx\` by hand. Modern JVMs are container-aware: use \`-XX:MaxRAMPercentage=70\` (or 60-75 depending on thread count and off-heap usage), so the heap scales with the limit and the remainder is left for everything above.

Then:
* Cap Metaspace explicitly so a classloader leak fails loudly instead of being OOM-killed.
* Bound thread pools — thread stacks are real memory.
* Set \`MaxDirectMemorySize\` deliberately if you use NIO or Netty.
* Verify with NMT under realistic load, not at startup.

### Why no heap OutOfMemoryError appears
The kernel kills the process **before** the heap fills. A container OOM-kill leaves no Java exception and often no heap dump — which is why teams misdiagnose it for so long. Enabling NMT and exporting \`jvm_memory_committed_bytes\` per pool is the preventative measure.`,
    codeSnippet: `# Let the JVM size itself from the container limit
-XX:MaxRAMPercentage=70
-XX:MaxMetaspaceSize=256m        # fail loudly on a classloader leak
-XX:MaxDirectMemorySize=256m
-Xss512k                          # halve stack cost on thread-heavy services
-XX:NativeMemoryTracking=summary

# Find the missing memory
jcmd <pid> VM.native_memory summary
jcmd <pid> GC.heap_info`,
    pitfalls: [
      'Assuming -Xmx bounds total process memory.',
      'Forgetting per-thread stack cost on services with large pools.',
      'Leaving Metaspace unbounded so a classloader leak presents as a container kill.',
      'Hand-computing -Xmx instead of using MaxRAMPercentage.'
    ],
    followUpQuestions: [
      'What does Native Memory Tracking cost in overhead, and is summary mode safe in production?',
      'Why does glibc MALLOC_ARENA_MAX matter in containers?',
      'How do virtual threads change the thread-stack calculation?'
    ],
    faangFocus: 'A very common production debugging question. "Container OOM-kill with no Java OOM" is the specific symptom interviewers want you to recognise.'
  },
  {
    id: 'jvm-10',
    categoryId: 'jvm',
    title: 'Classloading, Delegation and Classloader Leaks',
    difficulty: 'Hard',
    tags: ['Classloader', 'Metaspace Leak', 'Delegation', 'Hot Deploy'],
    scenario: 'An application server redeploys an application 20 times during a working day. Metaspace grows steadily and eventually the JVM fails, even though each old application is fully undeployed.',
    question: 'Explain the classloading model, what keeps a classloader alive, and how a redeploy leaks.',
    idealAnswer: `### The delegation model
Classloaders form a hierarchy: **bootstrap → platform → application (system) → custom**. By default a loader **delegates to its parent first**, and only attempts to load the class itself if the parent fails. This guarantees that \`java.lang.String\` always resolves to the JDK's version and cannot be shadowed.

Servlet containers deliberately **invert** this for web applications (child-first) so an application can use its own version of a library. That is why WAR deployments can override server-provided jars — and also a source of subtle version conflicts.

### Class identity
A class's runtime identity is **(fully-qualified name, defining classloader)**. The same bytes loaded by two loaders are two distinct classes: assigning between them throws \`ClassCastException\` with the famously confusing message "cannot cast Foo to Foo".

### Why redeploys leak
A classloader can only be collected when **it, all classes it defined, and all instances of those classes are unreachable**. A single strong reference from outside the application pins the entire loader — and therefore every class and every static field it holds. Typical culprits:
* A **ThreadLocal** set on a container-managed thread whose value's class comes from the application. The thread outlives the deployment, so the value, its class, and the loader all survive.
* A JDBC **driver registered in \`DriverManager\`**, which is loaded by the system loader and holds a reference to the application's driver class.
* A **shutdown hook**, a running **timer or thread** started by the application and never stopped.
* Listeners registered in a JDK or server-level singleton, custom **log appenders**, JMX MBeans left registered.
* Caches keyed by \`Class\` objects held in a longer-lived loader.

### Finding it
Take a heap dump after several redeploys and look for **more than one instance of the application's classloader**. Then compute the **path to GC root** for the older ones — the reference chain names the culprit directly. Eclipse MAT's "duplicate classes" and leak-suspect reports are built for exactly this.

### Preventing it
* Remove every ThreadLocal in a \`finally\` or a lifecycle listener.
* Deregister drivers, MBeans, listeners and shutdown hooks on undeploy.
* Stop every thread and executor you started.
* Use the container's leak-prevention support (Tomcat's \`JreMemoryLeakPreventionListener\`).
* And pragmatically: prefer **redeploying the process** over hot-redeploying into a long-lived JVM. In containers this problem largely disappears, which is a legitimate architectural answer.`,
    codeSnippet: `// The classic leak: a ThreadLocal on a pooled container thread
private static final ThreadLocal<AppContext> CTX = new ThreadLocal<>();

public void doFilter(...) {
    CTX.set(new AppContext());        // AppContext is loaded by the WEBAPP loader
    try { chain.doFilter(req, res); }
    finally { CTX.remove(); }         // without this, the loader can never be collected
}

// Clean up on undeploy
@Override public void contextDestroyed(ServletContextEvent e) {
    DriverManager.drivers().filter(d -> d.getClass().getClassLoader() == getClass().getClassLoader())
                 .forEach(this::deregister);
    executor.shutdownNow();
}`,
    pitfalls: [
      'Believing undeploy alone releases the classloader.',
      'Missing ThreadLocal.remove() on pooled threads.',
      'Not recognising "cannot cast Foo to Foo" as a two-classloader problem.',
      'Leaving application-started threads, hooks or MBeans running after undeploy.'
    ],
    followUpQuestions: [
      'Why do servlet containers invert the delegation order, and what does that break?',
      'How would you use MAT to prove which reference pins the old classloader?',
      'How do modules and layers change classloading in JPMS?'
    ],
    faangFocus: 'A deep JVM question favoured by platform and middleware teams. The ThreadLocal-on-a-pooled-thread mechanism is the canonical answer.'
  },
  {
    id: 'jvm-11',
    categoryId: 'jvm',
    title: 'Generational Hypothesis, Card Tables and Write Barriers',
    difficulty: 'Hard',
    tags: ['Generational GC', 'Card Table', 'Write Barrier', 'Remembered Set'],
    scenario: 'A service allocates heavily but almost all objects die immediately. A colleague argues that allocation is expensive and proposes object pooling everywhere to reduce GC pressure.',
    question: 'Explain the generational hypothesis, how young collection actually works, and why object pooling is usually counterproductive on the JVM.',
    idealAnswer: `### The weak generational hypothesis
**Most objects die young.** The JVM's collectors are built around this empirical observation, and it holds for the overwhelming majority of workloads.

### Why allocation is nearly free
Allocation happens in a **TLAB** (Thread-Local Allocation Buffer) — a private slab of Eden per thread. Allocating is a **pointer bump** and a bounds check, roughly a dozen instructions with no synchronisation. It is comparable to stack allocation in C.

### Why collecting young garbage is nearly free
A young collection is a **copying collector**: it traces the live objects out of Eden into a survivor space and then declares the whole region empty. The cost is proportional to the **surviving** data, not to the garbage. If 98% of objects are dead, a young GC touches almost nothing.

So: allocating is cheap, and dying young is cheap. That is the whole design.

### The cost of the alternative
Object pooling makes objects **long-lived**, which is the expensive case:
* Pooled objects survive young collections, get **promoted to the old generation**, and now must be traced on every marking cycle.
* They create **old-to-young references** — precisely what card tables and remembered sets exist to track.
* Pool access needs synchronisation, and reused objects must be reset (a common source of bugs where stale state leaks between uses).
* Escape analysis can eliminate a short-lived object entirely (scalar replacement); a pooled object always exists.

### Card tables and write barriers
To collect the young generation without scanning the entire old generation, the JVM must know which old objects point into young space. Every reference store executes a small **write barrier** that marks a **card** (typically a 512-byte region) as dirty in the card table. Young collections then scan only dirty cards as additional roots.

G1 extends this with **remembered sets** per region, and its barrier is correspondingly more expensive — that is part of why G1 has lower throughput than Parallel GC. ZGC uses **load barriers** instead, checking coloured pointers on read.

The consequence for pooling: mutating references in long-lived pooled objects triggers write barriers and dirties cards, adding exactly the work you were trying to avoid.

### When pooling IS right
Objects that are genuinely **expensive to create or represent a limited resource**: threads, database connections, large direct byte buffers, and sometimes very large arrays. Not domain objects, not DTOs, not strings.

**Rule: allocate freely, measure, and only pool what a profiler proves is expensive.**`,
    codeSnippet: `// Fine on the JVM: TLAB bump allocation, dies in Eden, may be scalar-replaced
for (Order o : orders) {
    var key = new CacheKey(o.tenantId(), o.sku());   // escape analysis may erase this
    process(cache.get(key));
}

# Verify what is actually happening
-XX:+PrintGCDetails
-Xlog:gc*,gc+age=trace:file=gc.log:time,uptime,level,tags
-XX:+UnlockDiagnosticVMOptions -XX:+PrintCompilation   # see inlining/EA effects`,
    pitfalls: [
      'Assuming allocation cost dominates when it is a pointer bump.',
      'Pooling domain objects and turning cheap young garbage into expensive old-generation load.',
      'Forgetting that pooled objects must be reset, leaking state between uses.',
      'Not knowing that write barriers exist and cost something on every reference store.'
    ],
    followUpQuestions: [
      'How does escape analysis enable scalar replacement, and when does it fail?',
      'How does G1\'s remembered set differ from a simple card table?',
      'Why does ZGC use load barriers instead of write barriers?'
    ],
    faangFocus: 'A favourite for testing whether a candidate understands the JVM as a system rather than applying C++ intuitions to Java.'
  },
  {
    id: 'jvm-12',
    categoryId: 'jvm',
    title: 'Reading and Tuning GC Logs',
    difficulty: 'Hard',
    tags: ['GC Logs', 'Unified Logging', 'Tuning', 'Allocation Rate'],
    scenario: 'A service shows p99 latency spikes every few minutes. You have SSH access and the ability to restart with new flags, but no APM.',
    question: 'Describe how you would enable and read GC logs to confirm or exclude GC as the cause, and the metrics that drive tuning decisions.',
    idealAnswer: `### Enable unified logging
Java 9+ replaced the old flags with \`-Xlog\`. GC logging is **cheap enough to leave on permanently in production** — and it must be on before the incident, because you cannot log the past.

\`\`\`
-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags:filecount=10,filesize=20M
\`\`\`

Include \`safepoint\` — not every pause is a GC pause, and this is the single most common misdiagnosis.

### The numbers that matter
1. **Pause duration distribution**, not the average. Look at the tail. If p99 latency spikes are 200ms and pauses are 5ms, GC is not your problem.
2. **Pause frequency** — many small pauses can hurt more than a few large ones.
3. **Allocation rate** (MB/s), derived from heap occupancy between collections. A high allocation rate is the root cause behind most GC problems, and the fix is usually in the code, not the flags.
4. **Promotion rate** — how much survives into the old generation. High promotion means objects are living longer than the young generation can absorb, causing expensive old collections.
5. **Live set size** — occupancy right after a full collection. This is the real memory demand, and it determines the minimum sane heap.
6. **Time to safepoint** — a long "time to safepoint" with a short GC means the problem is a thread that will not reach a safepoint (a long counted loop, or a slow JNI call), not the collector.

### The reasoning chain
* Spikes correlate with GC pauses → GC is implicated. Otherwise look at safepoints, JIT deoptimisation, page faults, CPU throttling (cgroup \`throttled_time\`), or a downstream dependency.
* If pauses are long and the live set is large → consider ZGC or Shenandoah for concurrent collection.
* If allocation rate is very high → **fix the allocation**. Look for per-request logging with string concatenation, boxing in hot loops, defensive copies, and oversized DTOs. This usually beats any flag change.
* If promotion is high → the young generation may be too small; check survivor sizing and tenuring age (\`-Xlog:gc+age=trace\`).
* If full GCs appear → check for humongous allocations in G1 (objects larger than half a region), or an actual memory leak (live set growing after each full GC).

### Tuning discipline
* Change **one thing at a time** and measure against a fixed load.
* Set a pause-time goal (\`-XX:MaxGCPauseMillis\`) rather than micromanaging generation sizes; G1 is designed to be steered this way.
* Do not copy flags from a blog. Most GC "tuning" in the wild is cargo cult, and the modern defaults are good.
* Tools: **GCeasy** or **GCViewer** for a quick visual read of the log; **JFR** for correlating pauses with allocation stacks.

### The honest conclusion
The most common outcome of a GC investigation is that the answer is not GC. Ruling it out quickly with data is as valuable as tuning it.`,
    codeSnippet: `# Leave this on in production
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/gc.log:time,uptime,level,tags:filecount=10,filesize=20M

# Long "time to safepoint" with a short GC = not a GC problem
-XX:+SafepointTimeout -XX:SafepointTimeoutDelay=500

# Steer G1 with a goal, do not micromanage sizes
-XX:MaxGCPauseMillis=100`,
    pitfalls: [
      'Enabling GC logging only after the incident.',
      'Reading average pause time instead of the tail.',
      'Assuming every pause is a GC pause and ignoring safepoints.',
      'Changing several flags at once so no conclusion can be drawn.'
    ],
    followUpQuestions: [
      'What causes a long time-to-safepoint, and how do you find the offending thread?',
      'How do you compute allocation rate from a GC log?',
      'What is a humongous allocation in G1 and why does it trigger full GCs?'
    ],
    faangFocus: 'Performance and SRE rounds. The strongest answers spend as much effort ruling GC out as tuning it, and explicitly mention safepoints.'
  },
  {
    id: 'jvm-13',
    categoryId: 'jvm',
    title: 'Reference Types, Finalization and Cleaners',
    difficulty: 'Hard',
    tags: ['WeakReference', 'SoftReference', 'PhantomReference', 'Cleaner'],
    scenario: 'A cache built on `SoftReference` causes unpredictable latency and full GCs under memory pressure. Elsewhere, a class overrides `finalize()` to close a native handle and handles are leaking.',
    question: 'Explain the four reference strengths, why finalization is deprecated, and what to use instead.',
    idealAnswer: `### The four strengths
* **Strong** — an ordinary reference. Prevents collection.
* **Soft** — cleared **at the collector's discretion** when memory is tight, before an OutOfMemoryError. Intended for memory-sensitive caches.
* **Weak** — cleared as soon as the referent is only weakly reachable. Used for canonicalising maps and metadata keyed by object identity.
* **Phantom** — never returns the referent (\`get()\` always returns null). Enqueued **after** the object is finalizable, giving a reliable "this object is gone" signal for resource cleanup.

Reachability ordering: strongly > softly > weakly > phantom reachable.

### Why SoftReference caches behave badly
The clearing policy is JVM-defined and effectively unpredictable: the collector may clear all of them at once under pressure, destroying the cache in a moment and causing a reload storm. Because they survive until memory is tight, they also **inflate the live set**, causing longer marking phases and more full GCs — exactly the symptom described.

**Better:** a bounded cache with an explicit eviction policy (Caffeine with \`maximumSize\` or \`maximumWeight\`). You get predictable memory and predictable behaviour, which is worth more than squeezing out the last megabyte.

### WeakReference done right
\`WeakHashMap\` keys are weak — useful for attaching metadata to objects you do not own. But note the classic trap: if the **value** strongly references the key, the entry never becomes collectable. Caffeine's \`weakKeys()\` (which uses identity comparison) is usually a better choice.

### Why finalize() is deprecated (for removal)
* **No guarantee it ever runs.** If the JVM exits first, it does not.
* **Unpredictable timing** — a single finalizer thread processes a queue; a slow finalizer stalls all others and the queue grows without bound.
* **Resurrection** — a finalizer can make the object reachable again, requiring the collector to re-check every finalizable object, so finalizable objects need **at least two GC cycles** to be collected.
* **Exceptions are swallowed**, so failures are invisible.
* It is a security hazard: a subclass can override \`finalize\` to resurrect a partially-constructed object.

### The replacements
1. **\`AutoCloseable\` + try-with-resources.** Deterministic, visible, and the right answer 95% of the time. The native handle should be closed explicitly.
2. **\`java.lang.ref.Cleaner\`** as a **safety net** only. Register a cleanup action that must **not** capture a reference to the object being cleaned (a lambda capturing \`this\` prevents collection entirely — the single most common Cleaner bug). Use a static nested class holding only the native handle.
3. For off-heap memory specifically, the **FFM \`Arena\`** gives deterministic release and is the modern answer.

**Design rule:** cleanup should be explicit. A Cleaner catches the case where a caller forgot, but it must never be the primary mechanism.`,
    codeSnippet: `public class NativeHandle implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();

    // MUST NOT reference the outer object, or it can never be collected
    private record State(long ptr) implements Runnable {
        @Override public void run() { Native.free(ptr); }
    }

    private final State state;
    private final Cleaner.Cleanable cleanable;

    public NativeHandle(long ptr) {
        this.state = new State(ptr);
        this.cleanable = CLEANER.register(this, state);   // safety net only
    }

    @Override public void close() { cleanable.clean(); }  // the real mechanism
}`,
    pitfalls: [
      'Building a cache on SoftReference and inheriting unpredictable clearing.',
      'Registering a Cleaner action that captures `this`, preventing collection forever.',
      'Using finalize() for resource cleanup.',
      'A WeakHashMap whose values strongly reference their keys.'
    ],
    followUpQuestions: [
      'Why do finalizable objects require at least two GC cycles?',
      'What makes PhantomReference more suitable than WeakReference for cleanup?',
      'How does FFM Arena compare with Cleaner for native memory?'
    ],
    faangFocus: 'A deep-JVM question. The Cleaner-capturing-this trap is the detail that shows you have actually written one.'
  },
  {
    id: 'jvm-14',
    categoryId: 'jvm',
    title: 'JIT Compilation, Deoptimization and Warm-Up',
    difficulty: 'Expert',
    tags: ['JIT', 'C2', 'Deoptimization', 'Inlining'],
    scenario: 'A trading service meets its latency SLO after ten minutes of running, but the first few thousand requests are 50x slower. Occasionally, hours later, latency degrades sharply for a few seconds with no GC activity.',
    question: 'Explain tiered compilation, why warm-up costs what it does, what causes a late deoptimization storm, and how to mitigate both.',
    idealAnswer: `### Tiered compilation
Code progresses through levels:
* **Level 0** — interpreted. Correct, slow, and gathering profile data.
* **Levels 1-3** — **C1**, fast to compile, moderately optimised. Level 3 adds full profiling instrumentation.
* **Level 4** — **C2**, slow to compile, aggressively optimised using the collected profile.

Promotion is driven by invocation and back-edge counters. **On-Stack Replacement (OSR)** allows a long-running loop to switch to compiled code mid-execution.

### Where the 50x comes from
Early requests run interpreted or in profiling C1, which is genuinely an order of magnitude slower. On top of that, the first executions trigger **classloading, verification, and static initialisation** of the whole call path, plus initial cache misses. Warm-up is not one effect but several.

### Speculative optimisation and deoptimization
C2 optimises against the **observed profile**, and those optimisations are **speculative**:
* A call site that has only ever seen one receiver type is **monomorphic**, so C2 inlines it directly with a type guard.
* Branches never taken are compiled as **uncommon traps**.
* Types never seen are assumed not to occur.

When an assumption is violated — a third implementation appears at a bimorphic call site, an unloaded class is finally loaded, an uncommon branch is taken — the JVM **deoptimizes**: it discards the compiled code, reconstructs the interpreter frame, and continues interpreted while recompiling.

### The late latency cliff
That is the "hours later" symptom. A rare code path executes for the first time (an error branch, a new tenant configuration, a lazily-loaded class), invalidating compiled code across a hot call tree. Everything reverts to interpreted, then re-profiles and recompiles. With no GC activity and no external cause, this is the classic signature.

Diagnose with \`-XX:+UnlockDiagnosticVMOptions -XX:+LogCompilation\` and JITWatch, or \`-Xlog:deoptimization\`. JFR also records compilation and deoptimization events.

### Mitigations
* **Warm-up at startup**, before taking traffic: run synthetic requests covering the main paths, and hold readiness until throughput stabilises. This is standard practice in low-latency systems.
* **Exercise the rare paths during warm-up too** — that is what prevents the late cliff.
* **AppCDS** to remove classloading cost from the critical path.
* **Keep hot call sites monomorphic** — avoid megamorphic dispatch (many implementations behind one interface) on the hot path.
* Keep hot methods small: the inlining budget (\`-XX:MaxInlineSize\`, \`FreqInlineSize\`) is measured in bytecode size, and a method that is too large is never inlined.
* Avoid loading new classes on the hot path at steady state.
* For extreme cases, **AOT/native images** eliminate warm-up entirely — at the cost of peak throughput, since there is no profile-guided optimisation.

### The mental model worth stating
The JVM is not a compiler; it is an **adaptive runtime that bets on your program's behaviour**. Warm-up is the cost of collecting evidence, and deoptimization is the cost of a bet that turned out wrong. Both are the price of the peak performance C2 delivers.`,
    codeSnippet: `# See what is compiled, inlined, and deoptimized
-XX:+UnlockDiagnosticVMOptions -XX:+PrintCompilation
-Xlog:deoptimization=info:file=deopt.log
-XX:+PrintInlining          # requires diagnostic options

# Short-lived processes: skip C2 entirely
-XX:TieredStopAtLevel=1

// Warm up the rare paths too, or they cause the cliff later
void warmUp() {
    for (int i = 0; i < 20_000; i++) {
        handle(sampleRequest());
        handleErrorPath(sampleFailure());   // otherwise this deoptimizes in production
    }
}`,
    pitfalls: [
      'Warming only the happy path, leaving rare branches to deoptimize later.',
      'Benchmarking without warm-up and drawing conclusions from interpreted code.',
      'Making a hot call site megamorphic and losing inlining.',
      'Assuming a latency spike with no GC must be the network.'
    ],
    followUpQuestions: [
      'What is an uncommon trap and how does the JVM reconstruct an interpreter frame from compiled code?',
      'Why does a megamorphic call site prevent inlining?',
      'How does OSR let a long-running loop benefit from compilation?'
    ],
    faangFocus: 'A signature question at low-latency and trading firms. Recognising the "no GC, sudden cliff hours later" signature as deoptimization is exactly what they are testing.'
  },
];
