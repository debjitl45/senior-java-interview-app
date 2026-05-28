export interface Question {
  id: string;
  title: string;
  categoryId: string;
  difficulty: 'Hard' | 'Expert' | 'Master';
  tags: string[];
  scenario: string;
  question: string;
  idealAnswer: string;
  codeSnippet?: string;
  pitfalls: string[];
  followUpQuestions: string[];
  faangFocus: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
}

export const CATEGORIES: Category[] = [
  {
    id: 'jvm',
    name: 'JVM Internals & GC',
    description: 'Deep dive into Memory Models, ZGC, G1GC, Safepoints, Escape Analysis, and JIT Compilation.',
    icon: 'Cpu',
    questionCount: 8
  },
  {
    id: 'concurrency',
    name: 'High-Performance Concurrency',
    description: 'Java Memory Model, False Sharing, Lock-free structures, VarHandles, and Project Loom Virtual Threads.',
    icon: 'Zap',
    questionCount: 8
  },
  {
    id: 'architecture',
    name: 'Distributed Systems & Design',
    description: 'Event-driven architectures, Sagas, Consensus, High-throughput scaling, and Resilience patterns.',
    icon: 'Layers',
    questionCount: 6
  },
  {
    id: 'spring',
    name: 'Spring Boot 3 & Cloud Internals',
    description: 'Custom BeanPostProcessors, Proxy mechanisms, Transactional anomalies, and Reactive microservices.',
    icon: 'Server',
    questionCount: 6
  },
  {
    id: 'modern',
    name: 'Modern Java (17 to 21+)',
    description: 'Virtual Threads, Pattern Matching, Sealed Classes, Foreign Function & Memory API, and Records.',
    icon: 'Code',
    questionCount: 5
  },
  {
    id: 'profiling',
    name: 'Profiling & Real-world Debugging',
    description: 'JFR, Async-profiler, Native Memory Leaks, DirectByteBuffers, and Thread Dump analysis.',
    icon: 'Activity',
    questionCount: 5
  }
];

export const QUESTIONS: Question[] = [
  // JVM & GC
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

  // CONCURRENCY
  {
    id: 'conc-1',
    categoryId: 'concurrency',
    title: 'The Java Memory Model (JMM) and False Sharing',
    difficulty: 'Expert',
    tags: ['JMM', 'False Sharing', 'CPU Cache', 'Volatile'],
    scenario: 'You have designed a high-throughput multi-threaded ring buffer. Despite having distinct head and tail pointers updated by different threads, the performance plateaus and CPU cache miss rates are extremely high.',
    question: 'Explain the concept of False Sharing in the context of the Java Memory Model and CPU cache coherency (e.g., MESI protocol). How does the @Contended annotation resolve this, and what are its internal mechanics?',
    idealAnswer: `### 1. CPU Cache Coherency & The MESI Protocol
Modern CPUs fetch main memory into Cache Lines (typically 64 bytes). To maintain consistency across multiple CPU cores, cache controllers use protocols like **MESI** (Modified, Exclusive, Shared, Invalid). 
When a core modifies a value in its local cache line, it must broadcast an **Invalidation** message to all other cores that hold a copy of that cache line, forcing them to reload it from main memory.

### 2. What is False Sharing?
**False Sharing** occurs when two logically independent variables (e.g., \`head\` and \`tail\` pointers of a queue) happen to reside on the **same 64-byte cache line**.
* If Thread A on Core 1 updates \`head\`, the entire cache line is marked Invalid for Core 2.
* When Thread B on Core 2 attempts to update \`tail\`, it suffers a cache miss and must stall to reload the line, even though it does not care about the \`head\` variable.
* This creates high interconnect traffic and drastically degrades multi-threaded scalability.

### 3. Resolution via @Contended
To eliminate False Sharing, we must ensure that heavily contended variables reside on **distinct cache lines**.
* **Legacy Approach:** Manually adding unused primitive fields (e.g., \`long p1, p2, p3, p4, p5, p6, p7;\`) before and after the variable to pad it out to 64 bytes. This is fragile because the JVM can optimize away or reorder dead fields.
* **Modern Approach (\`@Contended\`):** Introduced in JEP 142, the \`jdk.internal.vm.annotation.Contended\` annotation instructs the JVM to automatically insert the appropriate amount of padding (typically 128 bytes to accommodate pre-fetching) around the annotated field or class during object layout.

*Note: To use \`@Contended\` in custom code, you must start the JVM with \`-XX:-RestrictContended\`.*`,
    codeSnippet: `public class PaddedRingBuffer {
    // The JVM will pad this field so it sits on its own cache line
    @jdk.internal.vm.annotation.Contended
    private volatile long head;
    
    @jdk.internal.vm.annotation.Contended
    private volatile long tail;
}`,
    pitfalls: [
      'Confusing False Sharing with standard lock contention or race conditions.',
      'Assuming the \`volatile\` keyword prevents False Sharing (it actually exacerbates the performance hit due to immediate cache invalidation).',
      'Not knowing that \`@Contended\` requires a JVM flag to be active for user classes.'
    ],
    followUpQuestions: [
      'How does the JMM define the "happens-before" relationship for volatile variables?',
      'What is the difference between a StoreStore barrier and a LoadLoad barrier?'
    ],
    faangFocus: 'Core knowledge for writing ultra-low latency frameworks like LMAX Disruptor. Demonstrates that you can bridge high-level Java code with bare-metal CPU architecture.'
  },
  {
    id: 'conc-2',
    categoryId: 'concurrency',
    title: 'Project Loom: Virtual Threads Internals',
    difficulty: 'Expert',
    tags: ['Virtual Threads', 'Project Loom', 'Concurrency', 'Java 21'],
    scenario: 'Your team is migrating a legacy high-throughput API gateway from a reactive framework (Project Reactor/WebFlux) back to a simple blocking model using Java 21 Virtual Threads.',
    question: 'Explain how Virtual Threads are scheduled onto Platform Threads. What is "Pinning," what common coding patterns cause it, and how does it impact the scalability of a Virtual Thread-based application?',
    idealAnswer: `### 1. Virtual Threads Architecture
Virtual threads are lightweight threads managed directly by the JVM rather than the underlying OS. 
* **Carrier Threads:** The JVM uses a dedicated \`ForkJoinPool\` of OS platform threads (called **Carrier Threads**) to execute virtual threads.
* **Continuation Mechanism:** When a virtual thread executes a blocking I/O operation (e.g., fetching from a socket), the JVM captures its call stack, unmounts the virtual thread from the carrier thread, and stores its state in the heap. The carrier thread is then immediately free to execute another virtual thread. When the I/O completes, the virtual thread is rescheduled and remounted.

### 2. What is Virtual Thread Pinning?
**Pinning** occurs when a virtual thread attempts to perform a blocking operation but the JVM is **unable to unmount** it from its carrier thread. The virtual thread remains "pinned" to the carrier thread, effectively blocking the underlying OS thread and defeating the scalability benefits of Project Loom.

### 3. Causes of Pinning
There are two primary scenarios that cause pinning in Java 21:
1. **Inside a \`synchronized\` Block or Method:** If a virtual thread enters a \`synchronized\` block, it acquires a native monitor. The current HotSpot implementation cannot unmount a thread while it holds a native monitor.
2. **Executing Native Code:** If the thread is executing a \`synchronized\` native method or calling through the JNI/Foreign Function Interface.

### 4. Mitigation and Remediation
* **Refactoring:** Replace \`synchronized\` blocks with \`java.util.concurrent.locks.ReentrantLock\`. \`ReentrantLock\` is fully Loom-aware and allows clean unmounting.
* **Detection:** Start the JVM with \`-Djdk.tracePinnedThreads=short\` or \`full\` to log stack traces whenever a thread is pinned. Use JDK Flight Recorder (JFR) to monitor the \`jdk.VirtualThreadPinned\` event.`,
    codeSnippet: `// BAD: Causes Pinning if databaseCall() blocks!
public synchronized void processOrder() {
    databaseCall(); 
}

// GOOD: Loom-friendly approach
private final ReentrantLock lock = new ReentrantLock();

public void processOrder() {
    lock.lock();
    try {
        databaseCall(); // Virtual thread unmounts cleanly!
    } finally {
        lock.unlock();
    }
}`,
    pitfalls: [
      'Assuming Virtual Threads are faster than Platform Threads (they do not increase single-thread speed; they provide massive concurrency/throughput).',
      'Believing that Virtual Threads eliminate all concurrency issues like race conditions.',
      'Failing to identify \`synchronized\` as the primary trigger for pinning.'
    ],
    followUpQuestions: [
      'How do Virtual Threads interact with ThreadLocal variables, and why should you be cautious?',
      'What is Scoped Values (JEP 446) and how does it provide a better alternative to ThreadLocals for Virtual Threads?'
    ],
    faangFocus: 'Highly topical for modern backend engineering. Companies want to know if you can safely refactor massive codebases to Java 21 without introducing catastrophic thread-pool starvation.'
  },
  {
    id: 'conc-3',
    categoryId: 'concurrency',
    title: 'Lock-Free Algorithms and Compare-And-Swap (CAS)',
    difficulty: 'Hard',
    tags: ['CAS', 'Lock-Free', 'Atomic', 'ABA Problem'],
    scenario: 'You are building a custom high-concurrency non-blocking stack. You implement the push and pop operations using AtomicReference and Compare-And-Swap (CAS). During stress testing, the stack occasionally corrupts its internal linked structure.',
    question: 'Explain the mechanics of Compare-And-Swap (CAS) at the hardware level. What is the ABA problem, how did it cause your lock-free stack to corrupt, and what specific Java classes or techniques can prevent it?',
    idealAnswer: `### 1. Hardware Mechanics of CAS
Compare-And-Swap is an atomic instruction supported by modern processors (e.g., \`CMPXCHG\` on x86). It takes three arguments: a memory location (V), the expected old value (A), and the new value (B). The processor atomically updates V to B *only if* the current value at V equals A. If it does not, the operation fails, and the caller typically retries in a spin-loop.

### 2. The ABA Problem Explained
The **ABA problem** occurs when a lock-free algorithm relies on the observation that a memory location still contains the original value 'A' to assume that *no modifications have occurred* since the value was last read.
* **The Failure Scenario in a Stack:**
  1. Thread 1 wants to pop the top node **A**. It reads \`head == A\` and notes \`A.next == B\`. It prepares to CAS the head from \`A\` to \`B\`, but gets preempted.
  2. Thread 2 swoops in, pops **A**, and then pops **B**. The stack now has node **C** at the top.
  3. Thread 2 then pushes node **A** back onto the stack. Now \`head == A\` again, but \`A.next\` is now **C**.
  4. Thread 1 wakes up and executes its CAS: \`CAS(head, A, B)\`. Since \`head\` is indeed **A**, the CAS succeeds! Thread 1 sets the head to **B**.
  5. **Catastrophe:** Node **B** was already popped and potentially deleted! The stack is now pointing to a deallocated or stale node, and node **C** is lost.

### 3. Resolution in Java
To solve the ABA problem, we must validate not just the reference, but also ensure the reference hasn't been recycled.
* **\`AtomicStampedReference\`:** This class pairs the object reference with an integer stamp (acting as a version counter). Both the reference and the stamp must match for the CAS to succeed. Every time a node is modified or pushed, the stamp is incremented, making the 'A' to 'B' to 'A' transition uniquely identifiable (e.g., A1 → B2 → A3).`,
    codeSnippet: `// Solving ABA with AtomicStampedReference
AtomicStampedReference<Node> head = new AtomicStampedReference<>(initialNode, 0);

public void safePop() {
    int[] stampHolder = new int[1];
    Node oldHead;
    Node newHead;
    do {
        oldHead = head.get(stampHolder);
        if (oldHead == null) return;
        newHead = oldHead.next;
        // CAS requires both the reference and the stamp to match!
    } while (!head.compareAndSet(oldHead, newHead, stampHolder[0], stampHolder[0] + 1));
}`,
    pitfalls: [
      'Stating that CAS is purely a software construct rather than a hardware-level atomic instruction.',
      'Struggling to articulate the exact sequence of events that triggers the ABA problem.',
      'Confusing \`AtomicStampedReference\` with \`AtomicMarkableReference\`.'
    ],
    followUpQuestions: [
      'What is the performance overhead of using AtomicStampedReference compared to a plain AtomicReference?',
      'How does the \`VarHandle\` API introduced in Java 9 improve upon the legacy \`Unsafe\` class for custom lock-free structures?'
    ],
    faangFocus: 'Core systems engineering. Demonstrates your ability to reason about highly interleaved execution states without relying on coarse-grained OS locks.'
  },
  {
    id: 'conc-4',
    categoryId: 'concurrency',
    title: 'StampedLock vs ReentrantReadWriteLock',
    difficulty: 'Hard',
    tags: ['Locks', 'StampedLock', 'Concurrency', 'Optimization'],
    scenario: 'An in-memory cache experiences severe thread contention. It uses a ReentrantReadWriteLock to allow concurrent reads, but writes are frequently starved, and the overhead of updating the read-lock counters is causing CPU spikes.',
    question: 'Why does ReentrantReadWriteLock suffer from scalability issues and write-starvation? How does StampedLock address these problems, and what is the specific coding pattern for its Optimistic Reading mode?',
    idealAnswer: `### 1. Flaws of ReentrantReadWriteLock (RRWL)
While RRWL allows multiple concurrent readers, it has two major performance bottlenecks:
* **Cache Line Bouncing:** Every time a thread acquires or releases the read lock, it must atomically update the shared read-count variable. Under high read concurrency, this causes intense cache-line invalidation across CPU cores.
* **Write Starvation:** If the read lock is continuously acquired by incoming readers, a waiting writer can be starved indefinitely unless complex fairness policies are enabled (which further destroy throughput).

### 2. The StampedLock Solution
Introduced in Java 8, \`StampedLock\` provides three modes of access: Writing, Reading, and **Optimistic Reading**.
* **Optimistic Reading:** This is the game-changer. Acquiring an optimistic read lock does **not** perform any atomic CAS operations or update any shared counters! It simply returns a \`long\` stamp.
* Because no shared state is modified, there is **zero cache line bouncing**. Readers operate at near raw-memory speeds.

### 3. The Optimistic Read Pattern
Because an optimistic read doesn't actually block writers, a writer *can* acquire the write lock and modify the data while a reader is in the middle of reading it. Therefore, the reader must **validate** the stamp after reading the fields. If the stamp was invalidated by a write, the reader must fallback to acquiring a full pessimistic read lock.`,
    codeSnippet: `public class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    public double distanceFromOrigin() {
        // 1. Acquire Optimistic Read Stamp (Extremely cheap!)
        long stamp = sl.tryOptimisticRead();
        double currentX = x;
        double currentY = y;
        
        // 2. Validate if a write occurred while we were reading
        if (!sl.validate(stamp)) {
            // 3. Fallback to a true pessimistic read lock
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.hypot(currentX, currentY);
    }
}`,
    pitfalls: [
      'Forgetting that StampedLock is **not reentrant**. If a thread holding a StampedLock attempts to acquire it again, it can deadlock.',
      'Omitting the \`validate()\` step in the optimistic read pattern.',
      'Using StampedLock without a \`try-finally\` block for the pessimistic fallback.'
    ],
    followUpQuestions: [
      'What happens if a thread calling \`StampedLock.readLock()\` is interrupted?',
      'How would you convert a read lock to a write lock conditionally using StampedLock?'
    ],
    faangFocus: 'Shows that you know the standard library deeply and can choose the exact right synchronization primitive for extreme read-heavy vs write-heavy workloads.'
  },
  {
    id: 'conc-5',
    categoryId: 'concurrency',
    title: 'Volatile vs Atomic for Counters',
    difficulty: 'Hard',
    tags: ['Volatile', 'CAS', 'Multithreading'],
    scenario: 'A highly concurrent API rate limiter is showing lower traffic counts than expected in production under heavy load.',
    question: 'Two threads updating a counter result in incorrect values even though you used volatile. Why? Provide the fix.',
    idealAnswer: `### 1. The Volatile Misconception
Many assume \`volatile\` makes operations atomic, but it only guarantees **visibility** (changes are immediately visible across threads) and prevents instruction reordering. 
When writing \`counter++\`, it translates to three distinct operations: **Read, Add, Write**. If two threads read the value simultaneously (e.g., 0), increment it, and write it back, they overwrite each other. The net result is 1 instead of 2. This is a classic race condition.

### 2. The Fix: AtomicInteger vs LongAdder
To fix this, you need atomicity. 
For simple atomic counters, use **\`AtomicInteger\`**. Its \`incrementAndGet()\` method uses a hardware-level Compare-And-Swap (CAS) operation, which is lock-free and efficient.
For high-concurrency scenarios, use **\`LongAdder\`**. Instead of a single value causing heavy CAS contention, \`LongAdder\` maintains multiple internal cells. Threads increment different cells independently, and the total is summed up when needed.

### 3. Trade-offs
- **\`AtomicInteger\`**: Best when you need the exact current value immediately. Under extreme contention, CAS spins waste CPU cycles.
- **\`LongAdder\`**: Offers vastly superior throughput under heavy write contention, but reading the final sum is slightly more expensive and only eventually consistent during the read.`,
    pitfalls: [
      'Saying volatile provides atomicity for compound operations like ++.',
      'Suggesting synchronized blocks for a simple counter, which is a performance killer compared to CAS.',
      'Not knowing about LongAdder (introduced in Java 8) and only mentioning AtomicInteger.'
    ],
    followUpQuestions: [
      'How exactly does the Compare-And-Swap (CAS) mechanism work under the hood?',
      'When would you be forced to use synchronized or ReentrantLock over atomics?'
    ],
    faangFocus: 'High-throughput system design is a staple at top tech companies. Showing you know how to reduce thread contention via LongAdder proves you can optimize for scale.'
  },
  {
    id: 'conc-6',
    categoryId: 'concurrency',
    title: 'The Happens-Before Relationship',
    difficulty: 'Expert',
    tags: ['JMM', 'Happens-Before', 'Visibility'],
    scenario: 'You are reviewing a custom lock-free data structure. The code works fine on x86 architectures but behaves unpredictably on ARM-based servers.',
    question: 'Explain the happens-before relationship in Java Memory Model. Why is it critical?',
    idealAnswer: `### 1. What is Happens-Before?
The Java Memory Model (JMM) relies on the **happens-before** relationship to guarantee memory visibility between threads. Without it, compilers, the JVM, or CPUs are free to reorder instructions for optimization. If Action A happens-before Action B, the JMM guarantees that the results of A are visible to B, and A is executed before B.

### 2. Key Rules
Several rules establish this guarantee:
1. **Program Order**: Actions in a single thread happen-before subsequent actions in that same thread.
2. **Volatile Variable Rule**: A write to a volatile variable happens-before any subsequent read of that same volatile variable.
3. **Monitor Lock Rule**: Unlocking a monitor (exiting a synchronized block) happens-before any subsequent locking of that same monitor.
4. **Thread Start/Join**: \`Thread.start()\` happens-before any code inside the thread. All actions in a thread happen-before \`Thread.join()\` returns.

### 3. Why It Is Critical (Trade-offs)
Without happens-before, multithreading is completely non-deterministic. For example, a thread might see a \`volatile boolean isReady = true\` flag, but due to reordering, it might read stale values of the actual data the flag was supposed to protect.
By leveraging happens-before, developers can write safe concurrent code while allowing the JVM maximum leeway to aggressively optimize and reorder everything else.`,
    pitfalls: [
      'Confusing the JMM happens-before relationship with simple chronological execution time.',
      'Failing to understand that hardware architectures (like ARM vs x86) handle memory barriers differently, making JMM guarantees essential.',
      'Thinking synchronization only prevents race conditions, ignoring its critical role in memory visibility.'
    ],
    followUpQuestions: [
      'Can you explain the double-checked locking singleton pattern and why volatile is required for it to work?',
      'What are memory barriers (memory fences) and how do they relate to happens-before?'
    ],
    faangFocus: 'Concurrency bugs are notoriously difficult to reproduce. Mastery of the JMM demonstrates you can write thread-safe frameworks from scratch, a highly valued skill for core infrastructure teams.'
  },
  {
    id: 'conc-7',
    categoryId: 'concurrency',
    title: 'Structured Concurrency in Java 21',
    difficulty: 'Expert',
    tags: ['Structured Concurrency', 'Virtual Threads', 'Java 21', 'JEP 453'],
    scenario: 'You have a request handler that must concurrently fetch user profile data, order history, and recommendation scores from three different microservices. If any one fails, the entire request should fail fast.',
    question: 'Compare traditional ExecutorService-based concurrency with the new Structured Concurrency API (JEP 453). How does Structured Concurrency simplify error handling and cancellation?',
    idealAnswer: `### 1. The Problem with Traditional Concurrency
  Using \`ExecutorService\` and \`CompletableFuture\` for concurrent subtasks creates several issues:
  * **Orphaned Tasks:** If one subtask fails, the others continue running, wasting resources.
  * **Complex Cancellation:** Manually tracking and cancelling related tasks requires verbose boilerplate.
  * **Debugging Nightmares:** Thread dumps show disconnected tasks with no clear parent-child relationship.
  
  ### 2. Structured Concurrency (JEP 453)
  Structured Concurrency treats multiple concurrent tasks running in different threads as a **single unit of work**. Key principles:
  * **Single Entry/Exit Point:** All subtasks must complete (successfully or with failure) before the parent scope exits.
  * **Automatic Cancellation:** If one subtask fails, all sibling subtasks are automatically cancelled.
  * **Clear Ownership:** The lifecycle of subtasks is tied to the parent scope.
  
  ### 3. Using StructuredTaskScope
  \`\`\`java
  try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
      Subtask<UserProfile> profile = scope.fork(() -> fetchProfile(userId));
      Subtask<OrderHistory> orders = scope.fork(() -> fetchOrders(userId));
      Subtask<Recommendations> recs = scope.fork(() -> fetchRecommendations(userId));
      
      scope.join();            // Wait for all subtasks
      scope.throwIfFailed();   // Propagate errors
      
      return new UserDashboard(profile.get(), orders.get(), recs.get());
  }
  \`\`\`
  
  ### 4. Shutdown Policies
  * **\`ShutdownOnFailure\`:** Cancels all subtasks if any one fails (fail-fast).
  * **\`ShutdownOnSuccess\`:** Cancels all subtasks once any one succeeds (useful for redundant computation, like querying multiple caches).
  
  ### 5. Benefits
  * **Fail-Fast:** No wasted compute on orphaned tasks.
  * **Observability:** Thread dumps show the parent-child relationship clearly.
  * **Simplicity:** Eliminates boilerplate \`Future.get()\` error handling.`,
    pitfalls: [
      'Forgetting to call \`scope.join()\` before accessing subtask results.',
      'Using Structured Concurrency for fire-and-forget tasks (use Virtual Threads directly for those).',
      'Not understanding that \`ShutdownOnFailure\` cancels siblings on first failure, which may not be desired for all use cases.'
    ],
    followUpQuestions: [
      'How does Structured Concurrency interact with Scoped Values (JEP 446)?',
      'Can you nest StructuredTaskScopes?'
    ],
    faangFocus: 'Essential for modern Java 21+ microservices. Companies like Amazon and Google are actively refactoring legacy CompletableFuture code to Structured Concurrency for better reliability.'
  },

  // DISTRIBUTED SYSTEMS & ARCHITECTURE
  {
    id: 'arch-1',
    categoryId: 'architecture',
    title: 'Distributed Transactions: Sagas vs 2PC',
    difficulty: 'Expert',
    tags: ['Microservices', 'Saga', '2PC', 'Eventual Consistency'],
    scenario: 'You are architecting an e-commerce checkout system spanning three microservices: Orders, Payments, and Inventory. Each service has its own isolated database. You must ensure that if a payment fails, the reserved inventory is released.',
    question: 'Compare the Two-Phase Commit (2PC) protocol with the Saga Pattern for this architecture. Explain the difference between Choreography and Orchestration in Sagas, and discuss how you handle lack of isolation (e.g., lost updates, dirty reads) in a Saga.',
    idealAnswer: `### 1. Two-Phase Commit (2PC) vs Saga Pattern
* **2PC (Pessimistic / ACID):** A coordinator asks all participating databases to prepare to commit. If all agree, it sends the final commit. 
  * *Flaws:* It is a **blocking protocol**. Locks are held across all databases for the entire duration of the network calls. It scales poorly, and if the coordinator fails during the commit phase, the system is left in a blocking state. It also violates microservice database autonomy.
* **Saga Pattern (Optimistic / BASE):** A sequence of local transactions. Each service updates its own database and publishes an event/message to trigger the next local transaction. If a step fails, the Saga executes **Compensating Transactions** backward to undo the preceding steps.

### 2. Choreography vs Orchestration
* **Choreography:** Services listen to each other's events and decide what action to take. There is no central brain. Excellent for simple workflows (2-3 services), but becomes a tangled "event hairball" as complexity grows.
* **Orchestration:** A dedicated service (the Saga Orchestrator) explicitly tells each participating service what local transaction to execute via command messages. It maintains the overall state machine. Best for complex, mission-critical workflows.

### 3. Handling the Lack of Isolation in Sagas
Because a Saga commits local transactions immediately, other concurrent requests can see partial states (Dirty Reads). To mitigate this, we apply specific design countermeasures:
* **Semantic Lock:** Set a flag on the record (e.g., \`order_status = PENDING_PAYMENT\`) to prevent other transactions from modifying it until the Saga completes.
* **Commutative Updates:** Design operations so they can be executed in any order (e.g., \`UPDATE inventory SET count = count - 1\` rather than setting absolute values).
* **Pessimistic View:** Reorder the Saga steps so that the most risky down-stream operations (like Payments) happen as early as possible, reducing the window for compensation.`,
    pitfalls: [
      'Assuming compensating transactions are automatically generated by the framework (they must be explicitly coded business logic).',
      'Failing to make compensating transactions **idempotent** (network retries can cause them to execute multiple times).',
      'Ignoring the complexity of read-isolation anomalies in BASE architectures.'
    ],
    followUpQuestions: [
      'How do you guarantee that the local database update and the outgoing Kafka event are published atomically? (Outbox Pattern)',
      'What happens if the Saga Orchestrator crashes mid-workflow?'
    ],
    faangFocus: 'Absolute core requirement for Senior/Staff roles. You must be able to prove you can design systems that survive partial network failures without distributed locking.'
  },
  {
    id: 'arch-2',
    categoryId: 'architecture',
    title: 'The Transactional Outbox Pattern',
    difficulty: 'Hard',
    tags: ['Outbox Pattern', 'Kafka', 'Atomicity', 'Microservices'],
    scenario: 'Your microservice needs to update a User entity in a PostgreSQL database and simultaneously publish a "UserCreated" event to a Kafka topic. You notice that during network blips, sometimes the database commits but the Kafka message is lost, or vice versa.',
    question: 'Explain the Dual-Write Problem. How does the Transactional Outbox Pattern solve this? Compare the two primary approaches for relaying messages from the outbox table to the message broker: Polling Publisher vs. Transaction Log Tailing (CDC).',
    idealAnswer: `### 1. The Dual-Write Problem
You cannot achieve distributed atomicity between a relational database and a message broker like Kafka using standard local transactions. If you commit the DB first, the network call to Kafka might fail. If you publish to Kafka first, the DB commit might fail, leaving downstream consumers reacting to phantom data.

### 2. The Transactional Outbox Solution
Instead of publishing directly to Kafka, the service uses a single **local ACID transaction** to:
1. Update the business entities (e.g., \`users\` table).
2. Insert a message record into a dedicated \`outbox\` table within the **same database**.
Because both inserts participate in the same local transaction, they are guaranteed to either both commit or both rollback.

### 3. Relaying Mechanisms: Polling vs CDC
Once the messages are safely in the outbox table, a separate asynchronous process relays them to Kafka.
* **Polling Publisher:** A scheduled background thread runs \`SELECT * FROM outbox WHERE processed = false\`, publishes to Kafka, and then marks them as processed.
  * *Pros:* Simple to implement; no external infrastructure needed.
  * *Cons:* Polling introduces latency; frequent queries stress the database; hard to scale horizontally without cluster locks.
* **Transaction Log Tailing (Change Data Capture - CDC):** Using a tool like **Debezium**, the relay directly monitors the database's internal transaction log (e.g., Postgres WAL). When it detects an insert into the \`outbox\` table, it streams the event directly to Kafka.
  * *Pros:* Extremely low latency; zero performance impact on the database query engine; highly scalable.
  * *Cons:* Requires managing additional infrastructure (Kafka Connect / Debezium).

### 4. Delivery Guarantees
Both approaches provide **At-Least-Once delivery**. Because the relay could crash after publishing to Kafka but before updating the outbox status/offset, downstream consumers must be **idempotent**.`,
    pitfalls: [
      'Believing that wrapping the DB call and Kafka call in a \`@Transactional\` annotation makes them atomic.',
      'Forgetting that the Outbox pattern requires consumers to handle duplicate messages.',
      'Not considering the database cleanup strategy for the outbox table (it will grow infinitely without a cleanup job).'
    ],
    followUpQuestions: [
      'How does Debezium handle schema evolution of the outbox table?',
      'If you use the Polling approach, how do you prevent multiple instances of your service from publishing the same outbox rows?'
    ],
    faangFocus: 'Standard architectural pattern for event-driven systems at scale. Proves you understand the boundaries of ACID transactions and network reliability.'
  },
  {
    id: 'arch-3',
    categoryId: 'architecture',
    title: 'Idempotency Key Architecture in Payment APIs',
    difficulty: 'Expert',
    tags: ['Idempotency', 'API Design', 'Payments', 'Distributed Systems'],
    scenario: 'You are designing the core /v1/charges API for a payment gateway. Clients will call this endpoint to charge credit cards. If a client experiences a gateway timeout, they will blindly retry the request.',
    question: 'How do you architect an Idempotency mechanism to ensure a user is never double-charged? Detail the exact lifecycle of an idempotency key, the storage layer you would choose, and how you handle concurrent identical requests arriving at the same time.',
    idealAnswer: `### 1. The Idempotency Lifecycle
To guarantee exactly-once charging, clients must provide a unique \`Idempotency-Key\` header (e.g., a V4 UUID) with every mutation request.

The API gateway/service executes the following lifecycle:
1. **Lookup:** Attempt to fetch the key from the Idempotency Store.
2. **First Seen:** If the key is not present, atomically save the key with a status of \`IN_FLIGHT\` and execute the payment. Once the payment completes, update the key's payload with the final HTTP response and status \`COMPLETED\`.
3. **Seen & Completed:** If the key is found with status \`COMPLETED\`, completely bypass the payment logic and directly return the cached HTTP response.
4. **Seen & In-Flight (Concurrency Control):** If the key is found with status \`IN_FLIGHT\`, it means the client sent a concurrent retry before the original request finished. **Do not execute the payment.** Return an HTTP \`409 Conflict\` or \`425 Too Early\` to force the client to back off.

### 2. Storage Layer Selection
* **Redis:** The ideal choice. We can use Redis's atomic \`SET key value NX EX 86400\` command to simultaneously check if the key exists, set it if it doesn't, and apply a 24-hour expiration (TTL) to prevent infinite storage growth.
* **Relational DB:** Can also be used via a unique constraint on the \`idempotency_key\` column, catching duplicates via \`DataIntegrityViolationException\`.

### 3. Edge Cases & Error Handling
* **Client Errors (4xx):** If the request fails due to a validation error (e.g., invalid card number), we can either not store the key or store it with a \`FAILED\` status, allowing the client to fix the payload and retry with the same key.
* **Server Errors (5xx):** If our internal payment processor fails transiently, we must atomically evict the idempotency key so a subsequent retry can attempt the call again.`,
    pitfalls: [
      'Using the hash of the request payload as the idempotency key (prevents legitimate identical distinct orders).',
      'Failing to handle the \`IN_FLIGHT\` race condition, leading to concurrent execution of the same payment.',
      'Not setting a TTL on the idempotency store, leading to memory exhaustion.'
    ],
    followUpQuestions: [
      'What happens if the Redis instance storing the idempotency keys experiences a failover and loses the latest keys?',
      'How do you ensure the HTTP response cached in Redis doesn\'t violate data privacy laws (e.g., PCI-DSS)?'
    ],
    faangFocus: 'Stripe, Square, and Amazon interviewers love this. It tests your ability to handle real-world distributed edge cases, race conditions, and atomic storage operations.'
  },
  {
    id: 'arch-4',
    categoryId: 'architecture',
    title: 'Event Sourcing and CQRS at Scale',
    difficulty: 'Expert',
    tags: ['Event Sourcing', 'CQRS', 'Domain Events', 'Eventual Consistency'],
    scenario: 'You are designing a banking ledger system where every transaction must be auditable, reversible, and queryable in multiple ways. The system must handle 50,000 transactions per second.',
    question: 'Explain the Event Sourcing pattern combined with CQRS. How do you handle event schema evolution over time? What are the trade-offs compared to traditional CRUD?',
    idealAnswer: `### 1. Event Sourcing Fundamentals
  Instead of storing the **current state** of an entity, Event Sourcing stores the **sequence of events** that led to that state.
  * **Traditional CRUD:** \`UPDATE accounts SET balance = 100 WHERE id = 123\`
  * **Event Sourcing:** \`AccountCreated(id=123)\`, \`MoneyDeposited(id=123, amount=50)\`, \`MoneyDeposited(id=123, amount=50)\`
  
  The current state is derived by **replaying** all events.
  
  ### 2. CQRS (Command Query Responsibility Segregation)
  CQRS separates the **write model** (commands) from the **read model** (queries):
  * **Command Side:** Writes events to an append-only event store (e.g., EventStoreDB, Kafka).
  * **Query Side:** Projects events into optimized read models (e.g., Elasticsearch, Redis, PostgreSQL).
  
  ### 3. Event Schema Evolution
  This is the hardest part of Event Sourcing. Strategies include:
  * **Weak Schema:** Events are stored as loosely-typed JSON. New fields are added, old fields are ignored.
  * **Upcasting:** When loading old events, an upcaster transforms them to the new schema on-the-fly.
  * **Versioned Events:** Each event has a version number. The system maintains handlers for all versions.
  * **Event Replacement:** Rarely used, but allows rewriting history (breaks auditability).
  
  ### 4. Trade-offs vs CRUD
  **Pros:**
  * **Complete Audit Trail:** Every change is recorded.
  * **Temporal Queries:** You can reconstruct state at any point in time.
  * **Decoupling:** Events can feed multiple read models without coupling.
  
  **Cons:**
  * **Complexity:** Significantly harder to implement than CRUD.
  * **Eventual Consistency:** Read models lag behind writes.
  * **Storage:** Event stores grow indefinitely (requires snapshotting).
  
  ### 5. Performance at Scale
  To handle 50K TPS:
  * **Partitioning:** Shard events by aggregate ID.
  * **Snapshots:** Periodically snapshot aggregate state to avoid replaying millions of events.
  * **Async Projections:** Use Kafka Streams or Flink to project events into read models asynchronously.`,
    pitfalls: [
      'Storing mutable state in events (events must be immutable facts).',
      'Forgetting to implement snapshotting (replay performance degrades over time).',
      'Over-engineering: Event Sourcing is overkill for simple CRUD use cases.'
    ],
    followUpQuestions: [
      'How do you handle GDPR "right to be forgotten" with immutable events?',
      'What is the difference between Event Sourcing and Event-Driven Architecture?'
    ],
    faangFocus: 'Core pattern at companies like Netflix, Uber, and financial institutions. Tests your ability to design systems with complex auditability and scalability requirements.'
  },

  // SPRING BOOT & CLOUD INTERNALS
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

  // MODERN JAVA
  {
    id: 'mod-1',
    categoryId: 'modern',
    title: 'Pattern Matching and Sealed Classes for Domain Modeling',
    difficulty: 'Hard',
    tags: ['Java 17', 'Java 21', 'Sealed Classes', 'Pattern Matching'],
    scenario: 'You are designing the domain layer for a payment processing engine. A payment can be in one of three exhaustive states: Authorized, Settled, or Failed. You want to ensure at compile-time that all business logic handles every possible state without relying on default switch cases.',
    question: 'How do you use Sealed Classes and Interfaces combined with Pattern Matching for switch (Java 21) to achieve Data-Oriented Programming and compile-time exhaustiveness? What is the architectural benefit over traditional class hierarchies?',
    idealAnswer: `### 1. Domain Modeling with Sealed Classes
Introduced in Java 17, **Sealed Classes** allow an interface or class to explicitly define which classes are permitted to extend or implement it using the \`permits\` keyword. This gives the architect complete control over the domain hierarchy.

### 2. Compile-Time Exhaustiveness in Java 21
When you combine Sealed Classes with **Pattern Matching for \`switch\`** (Java 21), the Java compiler can definitively determine if your \`switch\` statement has covered all possible subtypes.
* If you add a new permitted subclass to the sealed interface in the future, the compiler will immediately throw an **error** at every \`switch\` statement that does not handle the new state.
* This completely eliminates the need for a defensive \`default\` clause, preventing runtime errors where new domain states are silently ignored.

### 3. Architectural Benefits (Data-Oriented Programming)
* **Separation of Data and Logic:** Traditional Object-Oriented Programming encourages embedding behavior inside the domain objects. Data-Oriented Programming (DOP) models data as pure, immutable records and places the polymorphic behavior in highly cohesive functions using pattern matching.
* **Enhanced Readability:** Complex visitor patterns can be entirely replaced with clean, multi-line \`switch\` expressions that destructure records directly.`,
    codeSnippet: `// 1. Define the exhaustive domain using Sealed Interfaces and Records
public sealed interface PaymentEvent permits Authorized, Settled, Failed {}

public record Authorized(String txId, BigDecimal amount) implements PaymentEvent {}
public record Settled(String txId, Instant settledAt) implements PaymentEvent {}
public record Failed(String txId, String errorCode) implements PaymentEvent {}

// 2. Process events with compile-time exhaustiveness
public String process(PaymentEvent event) {
    // No 'default' branch needed! The compiler guarantees exhaustiveness.
    return switch (event) {
        case Authorized a -> "Authorizing " + a.amount();
        case Settled s    -> "Settled at " + s.settledAt();
        case Failed f     -> "Failed with code: " + f.errorCode();
    };
}`,
    pitfalls: [
      'Including a \`default\` clause in an exhaustive switch (it defeats the compile-time safety if new subclasses are added).',
      'Forgetting that subclasses of a sealed class must explicitly be declared \`final\`, \`sealed\`, or \`non-sealed\`.',
      'Not leveraging Record destructuring directly in the switch cases.'
    ],
    followUpQuestions: [
      'How do you handle null values in a Java 21 pattern matching switch?',
      'What are Guarded Patterns (using the \`when\` clause) and how do they impact switch exhaustiveness?'
    ],
    faangFocus: 'Shows you are writing modern, highly maintainable Java that leverages the latest language features to prevent entire classes of production bugs.'
  },
  {
    id: 'mod-2',
    categoryId: 'modern',
    title: 'Foreign Function & Memory API (FFM) vs JNI',
    difficulty: 'Expert',
    tags: ['Java 21', 'FFM API', 'JNI', 'Off-Heap', 'Performance'],
    scenario: 'Your Java application needs to interface with a high-performance C++ machine learning library and manipulate multi-gigabyte off-heap memory buffers.',
    question: 'Compare the legacy Java Native Interface (JNI) with the modern Foreign Function & Memory API (JEP 454). Explain how the FFM API provides safe, deterministic off-heap memory management using Arenas, and discuss its performance advantages.',
    idealAnswer: `### 1. The Flaws of JNI
For decades, JNI was the only way to call native code or manage specialized memory. However, it has severe drawbacks:
* **Safety & Stability:** JNI is inherently unsafe. A single pointer error or buffer overflow in the native C/C++ code will instantly crash the entire JVM (Segmentation Fault).
* **Performance Overhead:** JNI requires complex boilerplate, and crossing the Java-to-Native boundary involves significant overhead (e.g., marshaling data, transitioning thread states, and disabling certain JIT optimizations).
* **Memory Leaks:** Direct allocation via \`Unsafe\` or JNI lacks deterministic lifecycle management, easily leading to native memory leaks.

### 2. The Foreign Function & Memory API (FFM)
The FFM API (finalized in Java 22, preview in Java 21) provides a pure-Java, highly optimized toolset for calling native code and managing off-heap memory.

### 3. Deterministic Memory Management via Arenas
Instead of relying on the Garbage Collector or dangerous manual \`free()\` calls, the FFM API introduces **Arenas**.
* An \`Arena\` controls the lifecycle of native memory segments.
* **\`Arena.ofConfined()\`:** Allocates memory that can only be accessed by the thread that created it. When the \`Arena\` is closed (typically using a \`try-with-resources\` block), the off-heap memory is **instantly and deterministically deallocated**.
* **Spatial & Temporal Safety:** The JVM actively tracks the bounds of the \`MemorySegment\`. If you attempt to access memory outside the allocated segment or after the Arena is closed, it throws a safe Java \`IndexOutOfBoundsException\` or \`IllegalStateException\` instead of crashing the JVM.

### 4. Performance Advantages
* FFM uses **Method Handles** to link native functions directly. The C2 JIT compiler can aggressively inline these calls, reducing the boundary-crossing overhead by up to 90% compared to JNI.`,
    codeSnippet: `// Deterministic, safe off-heap memory management
try (Arena arena = Arena.ofConfined()) {
    // Allocate 100 bytes of native off-heap memory
    MemorySegment segment = arena.allocate(100);
    
    // Write an integer to the native memory safely
    segment.set(ValueLayout.JAVA_INT, 0, 42);
    
    // Memory is instantly and safely freed when exiting this block!
}`,
    pitfalls: [
      'Assuming FFM completely eliminates the need to understand native memory layouts.',
      'Trying to pass confined memory segments across multiple threads without using a shared Arena.',
      'Forgetting that accessing native functions still requires enabling the \`--enable-native-access\` JVM flag.'
    ],
    followUpQuestions: [
      'How does the FFM API handle native downcalls vs upcalls (calling Java from C)?',
      'What is the difference between \`Arena.ofShared()\` and \`Arena.ofConfined()\` regarding memory synchronization?'
    ],
    faangFocus: 'Extremely relevant for database internals, game engines, and AI/ML infrastructure teams bridging Java with native hardware acceleration.'
  },
  { 
    id: 'mod-3',
    categoryId: 'modern',
    title: 'HashMap Internal Working and Treeification',
    difficulty: 'Hard',
    tags: ['Data Structures', 'Java 8+', 'Collections API'],
    scenario: 'You need to choose the right data structure for a high-read application and must explain its memory and performance characteristics under heavy hash collisions.',
    question: 'Explain the complete internal working of HashMap in Java 8+. What happens during hash collision, resize, and treeification?',
    idealAnswer: `### 1. Hashing and Index Calculation
When you put a key-value pair, the HashMap first computes the hash code of the key. It then uses the formula **hash AND (capacity - 1)** to find the bucket index, which is mathematically faster than a modulo operation. To spread entropy and reduce collisions in smaller maps, it XORs the hash with its upper 16 bits.

### 2. Collisions and Treeification (Java 8+)
If the target bucket is empty, a new \`Node\` is created. If not, a collision occurs. The map checks if the key exists using the \`equals()\` method. If it matches, the value is updated; otherwise, it appends the new \`Node\` to a linked list. 
Crucially, in **Java 8**, if a single bucket accumulates more than 8 entries (\`TREEIFY_THRESHOLD\`) and the table size is at least 64, the linked list is converted to a **Red-Black tree**. This optimizes worst-case lookup time from O(n) to O(log n).

### 3. Resizing and Trade-offs
When the map's size exceeds the **load factor threshold (default 0.75)**, it triggers a resize. It creates a new array of double the size and rehashes all entries. The 0.75 load factor is a mathematical sweet spot: a lower value reduces collisions but wastes memory, while a higher value saves memory but increases collisions.`,
    pitfalls: [
      'Forgetting that treeification requires a minimum table capacity of 64 in addition to the 8-node threshold.',
      'Failing to explain why the bitwise AND operation is used instead of modulo for index calculation.',
      'Not mentioning the XOR operation applied to the hash code to spread entropy.'
    ],
    followUpQuestions: [
      'What happens if two objects have the same hash code but are not equal?',
      'How does ConcurrentHashMap differ from HashMap in Java 8+?'
    ],
    faangFocus: 'FAANG interviewers dive deep into data structures. Knowing how HashMap mitigates worst-case O(n) scenarios (via Red-Black trees) demonstrates a deep understanding of algorithmic complexity and Java internals.'
  },

  // PROFILING & DEBUGGING
  {
    id: 'prof-1',
    categoryId: 'profiling',
    title: 'Diagnosing Native Memory Leaks (DirectByteBuffers)',
    difficulty: 'Expert',
    tags: ['Memory Leak', 'Off-Heap', 'DirectByteBuffer', 'Profiling'],
    scenario: 'Your high-throughput Netty-based API gateway is experiencing a steady increase in RSS (Resident Set Size) memory inside its Linux container, eventually being killed by the kernel (OOMKilled). The JVM heap size remains perfectly stable and well below the limit.',
    question: 'How do you diagnose and resolve a native memory leak caused by DirectByteBuffers? Explain the internal lifecycle of a DirectByteBuffer, how the JVM reclaims its native memory, and what specific tools (e.g., NMT, jemalloc) you would use to find the root cause.',
    idealAnswer: `### 1. The Lifecycle of DirectByteBuffer
Netty and other high-performance I/O frameworks use **\`DirectByteBuffer\`** to allocate memory directly in native OS memory (off-heap) to avoid copying data between the JVM heap and kernel space during socket operations.
* **The Catch:** The \`DirectByteBuffer\` object itself is a small Java object residing on the **JVM Heap**. It contains a raw \`long\` address pointing to the actual native memory block.
* **Reclamation:** Because the native memory is not directly tracked by the GC, the JVM uses a **\`Cleaner\`** (a phantom reference mechanism). When the small heap object becomes unreachable, the \`Cleaner\` executes in a background thread to call \`Unsafe.freeMemory()\`.

### 2. Why Direct Memory Leaks Occur
If your application creates native buffers rapidly but the JVM heap is large and not filling up, the GC will not run frequently. Consequently, the small \`DirectByteBuffer\` heap objects are not collected, their \`Cleaners\` are not triggered, and the native memory grows until the OS kernel kills the process!

### 3. Diagnosis Strategy
1. **Native Memory Tracking (NMT):** Start the JVM with \`-XX:NativeMemoryTracking=summary\` or \`detail\`. Use \`jcmd <pid> VM.native_memory baseline\` and later \`jcmd <pid> VM.native_memory detail.diff\` to see exactly which internal JVM subsystem (e.g., Internal, Symbol, Thread) is consuming the memory.
2. **Jemalloc / Valgrind:** If NMT shows the memory is not tracked by the JVM directly (e.g., allocated by a native JNI library), preload a custom allocator like **jemalloc** (\`LD_PRELOAD=/usr/lib/libjemalloc.so\`) and enable its leak profiling to capture native stack traces of the allocations.

### 4. Resolution
* **Explicit Release:** In Netty, always ensure buffers are explicitly released using \`ReferenceCountUtil.release(buffer)\` in a \`finally\` block, bypassing the GC entirely.
* **MaxDirectMemorySize:** Explicitly cap the direct memory using \`-XX:MaxDirectMemorySize=2G\`. This forces the JVM to throw a catchable \`OutOfMemoryError: Direct buffer memory\` rather than letting the OS silently kill the container.`,
    pitfalls: [
      'Capturing a standard heap dump to find a native memory leak (the native payloads do not appear in a heap dump).',
      'Confusing Metaspace leaks with Direct Memory leaks.',
      'Relying on \`System.gc()\` to clean up direct buffers in production.'
    ],
    followUpQuestions: [
      'How does Netty\'s \`ByteBufAllocator\` use pooling to mitigate the cost of direct memory allocation?',
      'What is the role of the \`jdk.internal.misc.Unsafe\` class in direct memory allocation?'
    ],
    faangFocus: 'A classic Senior/Staff interview question for infrastructure roles. Tests if you can debug at the intersection of the JVM, the OS kernel, and container resource limits.'
  },
  {
    id: 'prof-2',
    categoryId: 'profiling',
    title: 'Production Profiling: JFR vs Async-Profiler',
    difficulty: 'Hard',
    tags: ['JFR', 'Async-Profiler', 'Profiling', 'Safepoints'],
    scenario: 'You need to profile a highly sensitive, low-latency production service to find CPU hot-spots. You cannot afford any significant performance degradation while profiling.',
    question: 'Compare JDK Flight Recorder (JFR) with Async-profiler for production profiling. What is the "Safepoint Bias" problem inherent in traditional profilers (like VisualVM), and how do JFR and Async-profiler avoid it?',
    idealAnswer: `### 1. The Safepoint Bias Problem
Traditional sampling profilers (like older versions of VisualVM or JConsole) work by periodically sending a signal to the JVM to capture the stack traces of all threads. 
* **The Flaw:** To capture a consistent stack trace, these profilers require the threads to reach a **Safepoint**. 
* Because threads only poll for safepoints at specific locations (e.g., method boundaries, non-counted loops), the profiler disproportionately captures stack traces at these safepoint polling sites! It completely misses hot-spots inside unoptimized compiled loops or native code, leading to highly misleading profiles.

### 2. JDK Flight Recorder (JFR)
* **Mechanism:** JFR is built directly into the HotSpot JVM kernel. It uses internal JVM APIs to sample thread stacks without requiring global safepoints.
* **Pros:** Extremely low overhead (< 1% in default mode), making it safe for continuous production use. Captures rich semantic events (GC pauses, memory allocation, lock contention, file I/O).
* **Cons:** While it avoids global safepoints, its stack sampling historically still had minor biases depending on the exact JDK version.

### 3. Async-Profiler
* **Mechanism:** A low-overhead native profiler that uses the **\`AsyncGetCallTrace\`** internal JVM API combined with Linux **\`perf_events\`**.
* **Pros:** It is completely immune to Safepoint Bias. It can sample hardware and OS events (CPU cycles, cache misses, page faults) and seamlessly traverse both Java and native C/C++ stack frames. It is the gold standard for finding absolute CPU hot-spots.
* **Cons:** Requires native OS access (Linux/macOS) and specific security capabilities (e.g., \`--cap-add=SYS_ADMIN\` or \`perf_event_paranoid\` tweaks in containers).

### 4. Recommendation
Use **JFR** for continuous, always-on monitoring and broad JVM telemetry (memory, locks, I/O). Use **Async-profiler** for targeted, deep-dive CPU and wall-clock profiling when optimizing specific ultra-low-latency code paths.`,
    pitfalls: [
      'Using a traditional debugger or attaching a standard profiler to a production low-latency service.',
      'Not knowing that Async-profiler requires specific Linux kernel permissions to operate inside Docker.',
      'Failing to generate Flame Graphs to visualize Async-profiler output.'
    ],
    followUpQuestions: [
      'How do you start a JFR recording dynamically from the command line using \`jcmd\`?',
      'What is the difference between CPU profiling and Wall-clock profiling in Async-profiler?'
    ],
    faangFocus: 'Performance engineering absolute basics. If you claim to write high-performance code, you must know how to measure it without observing the "observer effect".'
  },
  {
    id: 'prof-3',
    categoryId: 'profiling',
    title: 'Mutable Objects as HashMap Keys',
    difficulty: 'Expert',
    tags: ['Memory Leak', 'Hash Code', 'Best Practices'],
    scenario: 'A production application is experiencing a slow memory leak and frequently failing to retrieve cached items that are confirmed to be in the map.',
    question: 'You have a custom object as HashMap key. After putting it in the map, you modify a field used in hashCode(). What happens and why?',
    idealAnswer: `### 1. The Core Mechanism of Hashing
When you create a custom object and use its fields in the \`hashCode()\` method, you dictate that the bucket position for this key depends on those specific fields. If you calculate a hash code (e.g., 5432) and place the entry in bucket 12, the map expects to find it there.

### 2. The Consequence of Mutation
If you modify a field used in the hash calculation after insertion, a subsequent call to \`hashCode()\` returns a different value (e.g., 7891), mapping to a new bucket (e.g., 15). When you call \`get()\` with this modified key, the map searches bucket 15, but the entry is still physically sitting in bucket 12. The method returns \`null\` and the key is effectively lost.

### 3. Memory Leaks and Trade-offs
Because the object cannot be retrieved via standard \`get()\` operations but is still referenced in the underlying array (found via iteration), it becomes **unreachable garbage** from an application logic standpoint, causing a **memory leak**. 
**Trade-off/Fix:** Always use immutable objects (like \`String\` or \`Integer\`) as HashMap keys. If custom objects are necessary, make them immutable (final class, final fields, defensive copying).`,
    pitfalls: [
      'Thinking the HashMap automatically updates the bucket when the object mutates.',
      'Failing to recognize that this scenario directly causes a memory leak.',
      'Assuming the object can be safely garbage collected.'
    ],
    followUpQuestions: [
      'How would you design a fully immutable custom class in Java?',
      'What happens if we override equals() but not hashCode()?'
    ],
    faangFocus: 'Top tier companies test for defensive programming. Identifying how mutable state leads to memory leaks proves you can write resilient, production-grade code.'
  },
  {
    id: 'prof-4',
    categoryId: 'profiling',
    title: 'Diagnosing GC Overhead Limit Exceeded',
    difficulty: 'Expert',
    tags: ['OutOfMemoryError', 'GC Tuning', 'Heap Dump'],
    scenario: 'The production server has completely frozen. Logs show OutOfMemoryError: GC overhead limit exceeded, and SLA alerts are firing.',
    question: 'Your application is throwing OutOfMemoryError: GC overhead limit exceeded. How do you diagnose and fix it?',
    idealAnswer: `### 1. Understanding the Error and Immediate Action
This error indicates the JVM spent more than **98% of CPU time** doing garbage collection, but recovered less than **2% of heap space**. The application is effectively paralyzed by GC pauses.
Immediate relief might involve increasing the heap size (\`-Xmx\`) or switching to a modern GC like **G1GC** or **ZGC** (\`-XX:+UseZGC\`) for lower pause times. 

### 2. Diagnosis Strategy
I would enable GC logging (\`-Xlog:gc*\` in Java 9+, or \`-XX:+PrintGCDetails\` historically) and add \`-XX:+HeapDumpOnOutOfMemoryError\` to automatically capture the state of memory upon crashing.
Next, I'd analyze the heap dump using Eclipse MAT or VisualVM to identify the largest objects (retained heap) and find the GC roots preventing collection.

### 3. Identifying Root Causes
Common culprits include:
1. **Memory Leaks**: Static collections that continually grow without clearing.
2. **Tight Loops**: Loading entire large files into memory (e.g., \`Files.readAllLines()\`) instead of lazy streaming (\`Files.lines()\`).
3. **Session Bloat**: Storing massive objects in HTTP sessions.
4. **Library Bugs**: Third-party caches or loggers leaking references.`,
    pitfalls: [
      'Blindly increasing heap size without investigating the root cause, which just delays the inevitable crash.',
      'Failing to configure automatic heap dumps in production environments.',
      'Confusing this error with a standard heap space OOM (this specifically denotes CPU thrashing).'
    ],
    followUpQuestions: [
      'How would you safely capture a heap dump from a live, running JVM without crashing it?',
      'Explain the difference between shallow heap and retained heap in MAT.'
    ],
    faangFocus: 'FAANG roles heavily involve maintaining high availability. Proving you have a structured, tool-driven methodology to troubleshoot JVM crashes is critical.'
  },
  {
    id: 'prof-5',
    categoryId: 'profiling',
    title: 'Detecting Deadlocks in Production',
    difficulty: 'Expert',
    tags: ['Deadlock', 'Thread Dump', 'jstack'],
    scenario: 'The application suddenly stops processing new requests. CPU usage drops to near zero, but the Java process is still running and consuming memory.',
    question: 'Your application has a deadlock in production. How do you detect and diagnose it without restarting?',
    idealAnswer: `### 1. Generating a Thread Dump
To detect a deadlock without killing the process, you must capture a thread dump of the running JVM. 
On Linux systems, you can send a \`SIGQUIT\` signal using \`kill -3 <pid>\`, which safely dumps the thread states to standard output or the application log. For a more controlled approach across operating systems, I use the JDK utility **\`jstack <pid>\`** to output the thread trace to a text file.

### 2. Analyzing the Dump
Once I have the thread dump, I look for threads stuck in the **BLOCKED** state. 
Modern JVMs are smart—the bottom of a \`jstack\` output will often explicitly identify deadlocks. It will print "Found one Java-level deadlock:" and display the exact threads, the object monitors (locks) they hold, and the locks they are waiting for, clearly revealing the circular dependency.

### 3. Resolution and Prevention
Once the offending code block is identified, the immediate fix usually requires restarting the application. 
**Long-term fixes (Trade-offs):** Deadlocks occur due to circular wait. I would refactor the code to ensure all threads acquire locks in a strictly defined, globally consistent order. Alternatively, I would replace \`synchronized\` blocks with \`ReentrantLock\` and use \`tryLock(timeout)\` to gracefully fail and back off instead of waiting infinitely.`,
    pitfalls: [
      'Suggesting restarting the server immediately, destroying the diagnostic evidence.',
      'Recommending heavy profiling tools (like attaching a debugger) which can freeze or crash a production environment.',
      'Not knowing the difference between BLOCKED (waiting for monitor lock) and WAITING (waiting for a signal/condition).'
    ],
    followUpQuestions: [
      'What are the four necessary conditions for a deadlock to occur (Coffman conditions)?',
      'How would you resolve a situation where threads are not deadlocked, but livelocked?'
    ],
    faangFocus: 'Operational excellence is expected at senior levels. Knowing standard, non-invasive CLI tools like jstack ensures you can debug zero-downtime, mission-critical production systems safely.'
  }
];

export interface CodeDefect {
  id: string;
  title: string;
  categoryId: string;
  difficulty: 'Hard' | 'Expert';
  code: string;
  defectDescription: string;
  fixedCode: string;
  explanation: string;
}

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
  }
];
