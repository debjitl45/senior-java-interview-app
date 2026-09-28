import type { Question } from '../../types';

/**
 * JVM internals, part two: from JDK vs JRE up to load barriers and
 * class unloading.
 */
export const JVM_MORE_QUESTIONS: Question[] = [
  {
    id: 'jvm-15',
    categoryId: 'jvm',
    title: 'JDK vs JRE vs JVM',
    difficulty: 'Core',
    tags: ['JDK', 'JRE', 'JVM', 'Basics'],
    scenario: "A Dockerfile uses a full JDK image to run a production Spring Boot jar. A reviewer asks whether that is necessary.",
    question: "Explain the difference between the JVM, the JRE and the JDK, and what you should ship in production.",
    idealAnswer: `### JVM
The **virtual machine** that loads bytecode, verifies it, interprets and JIT-compiles it, manages memory with garbage collection, and runs threads. There are several implementations (HotSpot, OpenJ9, GraalVM).

### JRE
The JVM **plus the standard class libraries** needed to run applications. Since Java 11, Oracle and most vendors no longer ship a separate JRE download; you build one with \`jlink\`.

### JDK
The JRE **plus development tools**: \`javac\`, \`jar\`, \`javadoc\`, \`jshell\`, and diagnostic tools like \`jcmd\`, \`jstack\`, \`jmap\`, \`jfr\`.

### What to ship
* A **runtime-only image**: vendor JRE images (e.g. Temurin JRE) or a custom runtime with \`jlink --add-modules ...\` containing only needed modules. Smaller image, smaller attack surface.
* Trade-off: without the JDK tools you lose \`jcmd\`/\`jstack\` inside the container for troubleshooting. Many teams include \`jdk.jcmd\` in the jlink image or attach an ephemeral debug container.`,
    pitfalls: [
      "Shipping a full JDK plus build tools in production images.",
      "Stripping diagnostic tools and being unable to take a thread dump during an incident.",
      "Confusing the Java version with the JVM vendor.",
    ],
    followUpQuestions: [
      "How does jlink decide which modules to include?",
      "What is the difference between OpenJDK builds from different vendors?",
    ],
    faangFocus: "A quick fundamentals check with a practical deployment angle.",
  },
  {
    id: 'jvm-16',
    categoryId: 'jvm',
    title: 'Stack vs Heap: What Lives Where',
    difficulty: 'Core',
    tags: ['Stack', 'Heap', 'Memory', 'Basics'],
    scenario: "An interviewer writes `Order o = new Order(5);` inside a method and asks where each part lives in memory.",
    question: "Explain stack and heap memory in the JVM and trace this line.",
    idealAnswer: `### Thread stacks
Each thread has its own **stack** of frames, one per active method call. A frame holds **local variables** (primitives and **references**), operand stack and return info. Frames are pushed on call and popped on return, so stack memory is freed automatically and very cheaply. Size is fixed per thread (\`-Xss\`, typically 512KB-1MB).

### Heap
Shared by all threads. Holds **all objects and arrays**. Managed by the garbage collector.

### Tracing the line
* The \`Order\` object (its header and fields, including the int 5) is allocated on the **heap**.
* The variable \`o\` is a **reference** stored in the current frame's local variable slot on the **stack**.
* When the method returns, the reference disappears; the object becomes garbage if nothing else references it.

### Nuances
* **Escape analysis** may let the JIT avoid the heap allocation entirely (scalar replacement) if \`o\` never escapes the method.
* Static fields live with the class's mirror object on the heap; class metadata lives in **Metaspace** (native memory).
* Deep recursion exhausts the stack (\`StackOverflowError\`); too many live objects exhaust the heap (\`OutOfMemoryError\`).`,
    pitfalls: [
      "Saying objects created in a method live on the stack.",
      "Saying primitives always live on the stack (fields of objects are on the heap).",
      "Forgetting that each thread has its own stack.",
    ],
    followUpQuestions: [
      "Why is stack allocation cheaper than heap allocation?",
      "Where do static variables live?",
    ],
    faangFocus: "A fundamental question used to calibrate candidates early.",
  },
  {
    id: 'jvm-17',
    categoryId: 'jvm',
    title: 'String Immutability, the String Pool and == vs equals',
    difficulty: 'Core',
    tags: ['String', 'String Pool', 'Immutability', 'equals'],
    scenario: "`\"hello\" == \"hello\"` is true, `new String(\"hello\") == \"hello\"` is false, and `(\"hel\" + lo) == \"hello\"` is false when `lo` is a variable.",
    question: "Explain each result and why Strings are immutable.",
    idealAnswer: `### == compares references, equals compares content
Always compare strings with \`equals\` (or \`equalsIgnoreCase\`). \`==\` only tells you whether two references point to the **same object**.

### The results
* Two identical **literals** are interned into the **string pool** at class load, so both refer to the same object: true.
* \`new String("hello")\` explicitly creates a **new heap object**: false.
* \`"hel" + lo\` with a non-final variable is concatenated **at runtime**, producing a new object: false. With a \`final\` constant, the compiler folds it into a literal and the result would be true.
* \`s.intern()\` returns the pooled instance.

### Why immutable
* **Safety**: strings are used for class names, file paths, URLs and map keys; mutating them after validation would be a security hole.
* **Hash caching**: \`hashCode\` is computed once and cached, making strings excellent map keys.
* **Thread safety** without synchronization.
* **Pooling** is only possible because sharing can't be observed.

### Modern details
Since Java 9, **compact strings** store Latin-1 text in one byte per char. The pool lives on the heap (since Java 7) and is garbage collected.`,
    pitfalls: [
      "Comparing strings with ==.",
      "Calling intern() on arbitrary user input (pool growth, contention).",
      "Using new String(literal) needlessly.",
    ],
    followUpQuestions: [
      "Why are passwords often stored in char[] instead of String?",
      "How does string concatenation compile since Java 9?",
    ],
    faangFocus: "Classic Java question; the compile-time constant folding detail earns extra credit.",
  },
  {
    id: 'jvm-18',
    categoryId: 'jvm',
    title: 'How Garbage Collection Decides What to Free',
    difficulty: 'Core',
    tags: ['GC', 'GC Roots', 'Reachability', 'Basics'],
    scenario: "A teammate asks: 'If two objects reference each other but nothing else references them, will they ever be collected? Java doesn't use reference counting, right?'",
    question: "Explain reachability, GC roots and how tracing collectors work.",
    idealAnswer: `### Reachability, not reference counts
Java collectors are **tracing** collectors. An object is live if it is **reachable** by following references from a **GC root**; everything else is garbage, including cycles. So yes, the two objects referencing each other are collected.

### GC roots
* Local variables and operand stack slots of **active frames** in all threads.
* **Static fields** of loaded classes.
* JNI references, synchronized monitors, and JVM internal references.

### Mark, then reclaim
1. **Mark**: traverse from roots, marking reachable objects.
2. **Reclaim**: sweep unmarked memory (free lists), or **copy/compact** live objects together so free space is contiguous and allocation is a pointer bump.

### Generational collection
Most objects die young. Young-generation collections copy the few survivors out of a small region frequently and cheaply; long-lived objects are **promoted** to the old generation, collected less often.

### Memory leaks still happen
A 'leak' in Java is an object that is **unintentionally reachable**: a static map that grows forever, listeners never removed, ThreadLocals in pooled threads.`,
    pitfalls: [
      "Believing cycles leak in Java.",
      "Calling System.gc() to 'fix' memory issues.",
      "Thinking a leak is impossible because of GC.",
    ],
    followUpQuestions: [
      "Why is copying collection efficient for the young generation?",
      "What is a stop-the-world pause and why is it needed?",
    ],
    faangFocus: "Basic GC literacy expected from all Java engineers.",
  },
  {
    id: 'jvm-19',
    categoryId: 'jvm',
    title: 'The Different Kinds of OutOfMemoryError',
    difficulty: 'Core',
    tags: ['OutOfMemoryError', 'StackOverflowError', 'Troubleshooting'],
    scenario: "Over a month, one service threw `OutOfMemoryError: Java heap space`, another `Metaspace`, a third `unable to create native thread`, and a fourth `StackOverflowError`.",
    question: "What does each error mean, and where do you start investigating?",
    idealAnswer: `| Error | Meaning | First steps |
|---|---|---|
| \`Java heap space\` | Heap can't fit a new object even after GC | Heap dump (\`-XX:+HeapDumpOnOutOfMemoryError\`), find the dominator; leak or undersized heap |
| \`GC overhead limit exceeded\` | Spending >98% time in GC, recovering <2% | Almost always a leak or a heap far too small |
| \`Metaspace\` | Class metadata exceeded \`MaxMetaspaceSize\` | Class loader leaks (redeploys), runaway dynamic proxies or generated classes |
| \`unable to create native thread\` | OS refused a new thread (ulimit, container pids limit, native memory) | Thread dump count; unbounded thread creation |
| \`Direct buffer memory\` | Off-heap NIO buffers exceeded \`MaxDirectMemorySize\` | Buffer leaks, Netty pooled allocator config |
| \`Requested array size exceeds VM limit\` | Array larger than the VM allows | Bug computing a size |
| \`StackOverflowError\` | Thread stack exhausted | Infinite or very deep recursion; stack trace shows the repeating frames |

### Always-on settings
\`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...\` and \`-XX:+ExitOnOutOfMemoryError\` (let the orchestrator restart a broken JVM rather than limping on). Note that an \`Error\` can leave the JVM in an inconsistent state: don't catch and continue.`,
    pitfalls: [
      "Catching OutOfMemoryError and continuing.",
      "Increasing -Xmx without finding the leak.",
      "Missing heap dump settings when the incident happens.",
    ],
    followUpQuestions: [
      "Why might a container be OOM-killed with no Java OOM error at all?",
      "How do you analyse a 20GB heap dump?",
    ],
    faangFocus: "Production troubleshooting basics; interviewers love the variety question.",
  },
  {
    id: 'jvm-20',
    categoryId: 'jvm',
    title: 'Java Is Always Pass-by-Value',
    difficulty: 'Core',
    tags: ['Pass-by-Value', 'References', 'Basics'],
    scenario: "A method `void reset(List<String> list) { list.clear(); list = new ArrayList<>(); list.add(\"x\"); }` is called. The caller's list ends up empty, not containing \"x\".",
    question: "Explain why, and settle the pass-by-value vs pass-by-reference debate.",
    idealAnswer: `### Always by value
Java passes **copies of values** to methods. For objects, the value is a **reference** (a pointer), so the method receives a copy of the pointer.

### Tracing the example
* \`list.clear()\` follows the copied reference to the **same object** the caller has and mutates it: the caller sees an empty list.
* \`list = new ArrayList<>()\` changes only the **local copy** of the reference. The caller's variable still points to the original (now empty) list.
* \`list.add("x")\` adds to the new local list, which is discarded on return.

### The test for pass-by-reference
In a true pass-by-reference language (C++ \`&\`, C# \`ref\`), assigning to the parameter changes the caller's variable. A Java \`swap(a, b)\` method can't swap the caller's variables, which proves Java is pass-by-value.

### Practical implications
Methods can mutate objects they receive (defensive copies and immutable types prevent surprises) but can't rebind the caller's variables; return the new value instead.`,
    pitfalls: [
      "Saying 'objects are passed by reference'.",
      "Reassigning parameters and expecting the caller to see it.",
      "Mutating arguments unexpectedly (surprising callers).",
    ],
    followUpQuestions: [
      "How would you write a method that 'returns' two values?",
      "Why are immutable parameters easier to reason about?",
    ],
    faangFocus: "A perennial trick question; the swap argument is the crisp proof.",
  },
  {
    id: 'jvm-21',
    categoryId: 'jvm',
    title: 'Class Loading Lifecycle and Initialization Order',
    difficulty: 'Solid',
    tags: ['Class Loading', 'Initialization', 'Static Blocks'],
    scenario: "A static field initialised from another class's static field is null at runtime, and a class's static block runs later than a developer expected.",
    question: "Walk through loading, linking and initialization, and when initialization is triggered.",
    idealAnswer: `### Phases
1. **Loading**: a class loader finds the bytes and creates the \`Class\` object.
2. **Linking**:
   * **Verification**: bytecode is checked for type safety.
   * **Preparation**: static fields are allocated and set to **default values** (0, null, false).
   * **Resolution**: symbolic references are resolved to real ones (often lazily).
3. **Initialization**: static initialisers and static field assignments run **in textual order**, once, under a lock.

### What triggers initialization
First **active use**: \`new\`, calling a static method, reading/writing a non-constant static field, reflection like \`Class.forName(name)\`, initialising a subclass (superclass first), or being the main class. Merely referencing \`Foo.class\` or declaring a variable of type \`Foo\` does not. Compile-time \`static final\` constants are inlined and don't trigger it either.

### Why the field was null
Circular static dependencies: A's initialiser reads \`B.X\`; B's initialiser reads \`A.Y\` while A is still initializing, so it sees A's **default** value (null). Order within a class matters too: a static field declared after a static block that uses it is still at its default.

### Instance initialization order
Superclass constructor chain first, then instance field initialisers and instance blocks in textual order, then the constructor body. Calling an overridable method from a constructor can see subclass fields still at defaults.`,
    pitfalls: [
      "Circular static initialisation between classes.",
      "Calling overridable methods from constructors.",
      "Assuming a class is initialised when it is merely loaded.",
    ],
    followUpQuestions: [
      "What is the initialization-on-demand holder idiom and why does it work?",
      "What happens if a static initialiser throws?",
    ],
    faangFocus: "A solid JVM fundamentals question with a realistic bug.",
  },
  {
    id: 'jvm-22',
    categoryId: 'jvm',
    title: 'Sizing the Heap in Containers',
    difficulty: 'Solid',
    tags: ['Containers', 'Heap Sizing', 'MaxRAMPercentage', 'Kubernetes'],
    scenario: "A service in a pod with a 2GB memory limit and `-Xmx2g` gets OOM-killed by Kubernetes regularly, but never throws a Java `OutOfMemoryError`.",
    question: "Why, and how should JVM memory be configured in containers?",
    idealAnswer: `### Heap is not the whole process
JVM process memory = heap **plus** metaspace, thread stacks (~1MB x threads), code cache, GC data structures, direct/NIO buffers, JNI and malloc arenas. With \`-Xmx\` equal to the container limit, the non-heap parts push the process over the limit and the **kernel OOM killer** terminates it. The JVM never sees an OOM.

### Container awareness
Modern JVMs (10+, backported to 8u191) read cgroup limits. Rather than a fixed \`-Xmx\`:
* \`-XX:MaxRAMPercentage=70\` (or 60-75%) sizes the heap relative to the container limit, leaving room for native memory.
* \`-XX:InitialRAMPercentage\` for the starting size; set min = max if you want predictable behaviour.

### Tuning the rest
* Cap known consumers: \`-XX:MaxMetaspaceSize\`, \`-XX:MaxDirectMemorySize\`, \`-Xss\` if you have many threads.
* Use **Native Memory Tracking** (\`-XX:NativeMemoryTracking=summary\` + \`jcmd VM.native_memory\`) to see where non-heap memory goes.
* glibc malloc arenas can bloat; \`MALLOC_ARENA_MAX=2\` or jemalloc helps some workloads.
* Set Kubernetes **requests = limits** for memory to avoid surprise evictions.`,
    pitfalls: [
      "Xmx equal to the container limit.",
      "Ignoring thread stacks with thousands of platform threads.",
      "Relying on old JVMs that ignore cgroup limits.",
    ],
    followUpQuestions: [
      "How does the JVM detect CPU limits, and what does that affect?",
      "How would you investigate native memory growth?",
    ],
    faangFocus: "Extremely common real-world problem; expected knowledge for cloud deployments.",
  },
  {
    id: 'jvm-23',
    categoryId: 'jvm',
    title: 'Object Headers and the Real Size of Objects',
    difficulty: 'Solid',
    tags: ['Object Layout', 'Compressed Oops', 'JOL', 'Memory'],
    scenario: "A `class Point { int x; int y; }` is expected to use 8 bytes. A heap histogram shows 24 bytes per instance, and a `Long` uses 24 bytes for 8 bytes of data.",
    question: "Explain object layout in HotSpot and how to measure it.",
    idealAnswer: `### The header
Every object starts with a header:
* **Mark word** (8 bytes on 64-bit): hash code, GC age, lock state.
* **Class pointer** (4 bytes with compressed class pointers, else 8).
* Arrays add a 4-byte **length**.
So a header is **12 bytes** typically (8 bytes with the compact object headers of JEP 450, experimental in JDK 24).

### Alignment
Objects are aligned to **8 bytes**. \`Point\` = 12 header + 4 + 4 = 20, padded to **24**. \`Long\` = 12 + 8 = 20 → **24** (the 8-byte long must be 8-byte aligned, so it starts at offset 16), while an \`Integer\` is 12 + 4 = **16**. Either way the overhead dwarfs the payload.

### Field layout
The JVM reorders fields (longs/doubles first, then ints, shorts, bytes, references) to minimise padding. Inherited fields come first.

### Measuring
**JOL** (Java Object Layout) prints exact layouts and deep sizes. Heap histograms (\`jcmd GC.class_histogram\`) give totals per class.

### Why it matters
Millions of small objects (boxed numbers, map entries) cost 3-10x their data size. That's why primitive arrays, compact encodings and Valhalla value classes matter for memory-heavy services.`,
    pitfalls: [
      "Estimating memory by summing field sizes.",
      "Forgetting per-entry overhead in collections.",
      "Ignoring alignment padding.",
    ],
    followUpQuestions: [
      "What changes with -XX:+UseCompactObjectHeaders?",
      "How much memory does a HashMap<Long, Long> entry use?",
    ],
    faangFocus: "Memory-efficiency awareness for data-heavy services.",
  },
  {
    id: 'jvm-24',
    categoryId: 'jvm',
    title: 'Minor, Major and Full GC, Promotion and Tenuring',
    difficulty: 'Solid',
    tags: ['GC', 'Young Generation', 'Promotion', 'Tenuring'],
    scenario: "GC logs show frequent short young collections, then every 20 minutes a long pause labelled 'Pause Full'. The team wants to understand the difference.",
    question: "Explain minor, major/mixed and full GCs, promotion, and what causes premature promotion.",
    idealAnswer: `### Generational layout
* **Young generation**: **Eden** (new allocations) + two **survivor** spaces.
* **Old generation**: long-lived objects.

### Minor (young) GC
Triggered when Eden fills. Live objects in Eden and the active survivor are copied to the other survivor; each survival increments the object's **age**. Objects reaching the **tenuring threshold** (up to 15), or that don't fit in survivor space, are **promoted** to old gen. Cost is proportional to **live** young objects, which is usually few, so pauses are short.

### Major / mixed
Collecting the old generation. G1 does **concurrent marking** of old regions, then **mixed** collections that evacuate young plus some old regions incrementally.

### Full GC
A stop-the-world collection of the **entire heap**, often single- or limited-threaded compaction. In G1 it's a fallback when concurrent collection can't keep up: **evacuation failure** (no free regions to copy into), humongous allocation failure, or metaspace exhaustion. Frequent full GCs mean a leak, an undersized heap, or tuning problems.

### Premature promotion
Medium-lived objects (e.g. request buffers held a few seconds, or large batches) survive a few young GCs, get promoted, then die in old gen, filling it and triggering expensive old collections. Fixes: larger young gen/survivor spaces, reduce object lifetime, stream instead of batching.`,
    pitfalls: [
      "Treating any old-gen collection as a full GC.",
      "Tuning GC flags before fixing allocation patterns.",
      "Ignoring 'to-space exhausted' messages in G1 logs.",
    ],
    followUpQuestions: [
      "How does G1 decide which old regions to include in mixed GCs?",
      "What does the tenuring distribution in GC logs tell you?",
    ],
    faangFocus: "GC fundamentals interviewers use before diving into tuning.",
  },
  {
    id: 'jvm-25',
    categoryId: 'jvm',
    title: 'When Serial and Parallel GC Still Win',
    difficulty: 'Solid',
    tags: ['Serial GC', 'Parallel GC', 'Throughput', 'GC Selection'],
    scenario: "A nightly batch job and a tiny CLI tool both use G1 by default. Someone suggests switching them to other collectors.",
    question: "When are the Serial and Parallel collectors better choices than G1 or ZGC?",
    idealAnswer: `### Serial GC (\`-XX:+UseSerialGC\`)
Single-threaded, stop-the-world, very low overhead and memory footprint. The JVM picks it automatically on machines with 1 CPU or under ~1.8GB memory (common in small containers!).
Good for: small heaps (<~100MB-1GB), CLI tools, serverless functions, tiny containers where extra GC threads would compete for one CPU.

### Parallel GC (\`-XX:+UseParallelGC\`)
Multi-threaded stop-the-world for both generations, **no concurrent phases**, minimal barrier overhead. It maximises **throughput**: the highest ratio of application time to GC time, at the cost of longer pauses.
Good for: batch jobs, ETL, offline computation, where total runtime matters and nobody waits on individual pauses.

### G1 (default)
Balanced: region-based, pause-time goals (\`MaxGCPauseMillis\`, default 200ms), concurrent marking. Good general-purpose choice for services.

### ZGC / Shenandoah
Sub-millisecond pauses independent of heap size, at some throughput and memory cost. For latency-sensitive services with large heaps.

### The decision
Choose by goal: **footprint** (Serial), **throughput** (Parallel), **balanced** (G1), **latency** (ZGC). Then measure with realistic workloads.`,
    pitfalls: [
      "Using latency-oriented collectors for batch throughput jobs.",
      "Not noticing the JVM silently chose Serial GC in a tiny container.",
      "Picking a GC by reputation rather than goals.",
    ],
    followUpQuestions: [
      "How does the JVM decide it's a 'server-class' machine?",
      "What is GC throughput and how do you measure it?",
    ],
    faangFocus: "Shows GC choices are about workload goals, not fashion.",
  },
  {
    id: 'jvm-26',
    categoryId: 'jvm',
    title: 'Autoboxing and the Integer Cache',
    difficulty: 'Solid',
    tags: ['Autoboxing', 'Integer Cache', 'equals', 'NullPointerException'],
    scenario: "`Integer a = 127, b = 127; a == b` is true, but with 128 it's false. Elsewhere, `int total = map.get(key);` throws an NPE.",
    question: "Explain both behaviours and the costs of autoboxing.",
    idealAnswer: `### The Integer cache
Autoboxing calls \`Integer.valueOf(int)\`, which returns **cached instances for -128 to 127** (upper bound configurable with \`-XX:AutoBoxCacheMax\`). Within the range, \`==\` compares the same object: true. Outside it, two different objects: false. \`Short\`, \`Byte\`, \`Character\` (0-127), \`Long\` and \`Boolean\` cache similarly; \`Float\`/\`Double\` do not.
**Lesson**: never compare wrapper objects with \`==\`; use \`equals\` or unbox.

### The NPE
\`int total = map.get(key)\` auto-**unboxes** by calling \`intValue()\` on the result. A missing key returns \`null\` → NPE. Use \`getOrDefault(key, 0)\` or check for null. The same trap appears with ternaries mixing \`Integer\` and \`int\`.

### Costs
* Each boxed value outside the cache is an **allocation** (16 bytes+).
* Collections of wrappers use pointers + objects: 4-5x the memory of primitive arrays.
* Boxing in hot loops (\`Long sum = 0L; sum += x\`) allocates on every iteration.
Use primitive streams (\`IntStream\`), primitive arrays, or primitive collection libraries in hot paths.`,
    pitfalls: [
      "Comparing Integer objects with ==.",
      "Unboxing possibly-null values.",
      "Accidental boxing in accumulator loops.",
    ],
    followUpQuestions: [
      "What does `Long l = 1L; l.equals(1)` return and why?",
      "How does escape analysis sometimes remove boxing?",
    ],
    faangFocus: "A classic 'what does this print' question with production relevance.",
  },
  {
    id: 'jvm-27',
    categoryId: 'jvm',
    title: 'Class Initialization Deadlocks',
    difficulty: 'Hard',
    tags: ['Class Initialization', 'Deadlock', 'Static Initializers'],
    scenario: "A service occasionally hangs at startup. Thread dumps show two threads in `RUNNABLE` state inside `<clinit>` of two different classes, with no Java-level lock reported.",
    question: "Explain how class initialization can deadlock and how to avoid it.",
    idealAnswer: `### Initialization is locked
The JVM guarantees each class is initialised exactly once: the first thread to trigger initialization holds the class's **initialization lock** while running \`<clinit>\`; other threads needing that class **wait** until it completes.

### The deadlock
* Thread 1 starts initialising \`A\`; A's static initialiser touches \`B\`.
* Thread 2 simultaneously starts initialising \`B\`; B's static initialiser touches \`A\`.
* Each waits for the other's initialization to finish. Forever.

Thread dumps are confusing: threads often show as RUNNABLE or 'in Object.wait()' within \`<clinit>\`, and \`jstack\` deadlock detection may not report it because these aren't ordinary monitors. Look for frames in \`<clinit>\` of different classes each referencing the other.

### Common real-world trigger
A superclass's static initializer referencing a subclass (e.g. a \`static final Base DEFAULT = new Sub()\`), while another thread initialises the subclass first (which needs the superclass).

### Avoiding it
* No circular dependencies between static initialisers.
* Keep static initialisers trivial; do heavy setup lazily (holder idiom) or explicitly at startup on one thread.
* Never start threads from a static initialiser that then use the class being initialised (that deadlocks even with one class).`,
    pitfalls: [
      "Superclass static fields that instantiate subclasses.",
      "Starting threads or thread pools in static initialisers.",
      "Relying on jstack's deadlock detector to catch it.",
    ],
    followUpQuestions: [
      "What happens to a class whose initialiser throws an exception?",
      "How would you reproduce this reliably in a test?",
    ],
    faangFocus: "A rare but memorable production bug that shows deep JVM understanding.",
  },
  {
    id: 'jvm-28',
    categoryId: 'jvm',
    title: 'Reading Bytecode: The invoke Instructions',
    difficulty: 'Hard',
    tags: ['Bytecode', 'javap', 'invokedynamic', 'Dispatch'],
    scenario: "During a performance discussion, someone runs `javap -c` on a class and asks you to explain `invokevirtual`, `invokeinterface`, `invokespecial`, `invokestatic` and `invokedynamic` in the output.",
    question: "What does each invoke instruction do, and why does the distinction matter for performance?",
    idealAnswer: `### The five invocation instructions
* **\`invokestatic\`**: static methods. No receiver, no dispatch. The target is known at link time.
* **\`invokespecial\`**: constructors (\`<init>\`), private methods (before Java 11 nestmates), and \`super.method()\` calls. No virtual dispatch.
* **\`invokevirtual\`**: instance methods on classes. Dispatched through the **vtable** based on the receiver's runtime class.
* **\`invokeinterface\`**: methods called through an interface type. Dispatch is more involved (**itable** lookup) since a class can implement many interfaces.
* **\`invokedynamic\`**: the call site is linked at runtime by a **bootstrap method** returning a \`CallSite\`. Used for lambdas, string concatenation (Java 9+), records' \`toString/equals/hashCode\`, and pattern-matching switches.

### Why it matters
In practice the JIT removes most dispatch cost: **class hierarchy analysis** and **inline caches** turn monomorphic virtual/interface calls into direct calls and **inline** them. Costs appear at **megamorphic** call sites (3+ receiver types seen), where the JIT falls back to real vtable/itable dispatch and can't inline.

### Tools
\`javap -c -p -v\` shows bytecode and the constant pool; JITWatch and \`-XX:+PrintInlining\` show what the JIT did with it.`,
    pitfalls: [
      "Assuming interface calls are always slower in optimised code.",
      "Micro-optimising dispatch without measuring.",
      "Not knowing that string concatenation uses invokedynamic since Java 9.",
    ],
    followUpQuestions: [
      "What is an inline cache?",
      "How are records' equals/hashCode generated at runtime?",
    ],
    faangFocus: "Deep JVM question for performance-focused teams.",
  },
  {
    id: 'jvm-29',
    categoryId: 'jvm',
    title: 'TLABs and the Allocation Fast Path',
    difficulty: 'Hard',
    tags: ['TLAB', 'Allocation', 'Performance', 'Eden'],
    scenario: "A teammate claims 'object allocation in Java is expensive, so we should pool objects'. You're asked to evaluate this.",
    question: "How does HotSpot allocate objects, and when is pooling actually worthwhile?",
    idealAnswer: `### Thread-Local Allocation Buffers
Eden is carved into **TLABs**, one per thread. Allocating an object is a **pointer bump** inside the thread's own TLAB: check there's room, advance the pointer, write the header. No locks, no atomic operations, roughly 10 instructions. When a TLAB fills, the thread grabs a new one from Eden (a CAS, rare). Very large objects may bypass TLABs.

### Why short-lived objects are cheap
Young GC cost is proportional to **live** objects, not allocated ones. Objects that die before the next minor GC cost only their allocation. Escape analysis may remove some allocations entirely.

### Why pooling usually loses
* Pooled objects become **long-lived**, get promoted to old gen, and create old-to-young references that make young GCs more expensive (card scanning).
* Pools need synchronisation, reset logic and are a source of bugs (use-after-return, leaked state).
* Cache-unfriendly compared with fresh, contiguous allocation.

### When pooling is right
Objects whose **construction** is expensive for reasons other than memory: threads, database connections, large direct \`ByteBuffer\`s (Netty's pooled allocator), heavy parsers. And in ultra-low-latency systems aiming for zero allocation on the hot path.

### Measure
JFR allocation profiling (\`jdk.ObjectAllocationSample\`) and async-profiler's alloc mode show where allocation pressure actually comes from.`,
    pitfalls: [
      "Pooling small, cheap objects.",
      "Assuming allocation rate doesn't matter at all (it drives GC frequency).",
      "Ignoring promotion side effects of long-lived pools.",
    ],
    followUpQuestions: [
      "What is allocation rate and how does it relate to GC frequency?",
      "How does Netty's pooled ByteBuf allocator work?",
    ],
    faangFocus: "Corrects a common myth with solid JVM reasoning.",
  },
  {
    id: 'jvm-30',
    categoryId: 'jvm',
    title: 'Compressed Oops and the 32GB Heap Cliff',
    difficulty: 'Hard',
    tags: ['Compressed Oops', 'Heap Sizing', 'Memory'],
    scenario: "A team raises a service's heap from 31GB to 34GB to fit more cache, and the amount of cache that fits actually goes down.",
    question: "Explain compressed ordinary object pointers and the 32GB threshold.",
    idealAnswer: `### Compressed oops
On 64-bit JVMs, object references would naturally be 8 bytes. With **compressed oops** (on by default for heaps under ~32GB), references are stored as **32-bit offsets** scaled by the 8-byte object alignment: 2^32 x 8 bytes = **32GB** addressable. Decoding is a shift (plus a base add if the heap isn't at address zero), which is nearly free.

### The cliff
Above ~32GB (a bit less in practice, depending on heap base), compressed oops are **disabled**. Every reference field, array slot and class pointer grows to 8 bytes. Reference-heavy data (maps, lists, object graphs) can grow **30-50%**, so a 34GB heap may hold less than a 31GB heap did.

### Options
* Stay just under the threshold (check with \`-XX:+PrintFlagsFinal | grep UseCompressedOops\`).
* Increase object alignment (\`-XX:ObjectAlignmentInBytes=16\`) to address up to 64GB with compressed oops, at the cost of more padding per object.
* If you truly need a much larger heap, go well beyond (e.g. 48GB+) so the gain outweighs the loss, and use ZGC for pauses.
* Or move bulk data off-heap / out of process.`,
    pitfalls: [
      "Setting -Xmx to 32g or slightly above.",
      "Assuming more heap always means more capacity.",
      "Not verifying the flag in production.",
    ],
    followUpQuestions: [
      "What are compressed class pointers?",
      "How does zero-based compressed oops differ from heap-based?",
    ],
    faangFocus: "A classic JVM sizing gotcha known by experienced operators.",
  },
  {
    id: 'jvm-31',
    categoryId: 'jvm',
    title: 'Humongous Objects in G1',
    difficulty: 'Hard',
    tags: ['G1', 'Humongous Objects', 'Region Size', 'Tuning'],
    scenario: "G1 logs show frequent 'Pause Young (Concurrent Start) (G1 Humongous Allocation)' and occasional full GCs, even though the heap is only 50% used on average.",
    question: "What are humongous objects, why do they hurt G1, and how do you fix it?",
    idealAnswer: `### Definition
G1 splits the heap into equal **regions** (1-32MB, chosen from heap size). An object **at least half a region** in size is **humongous**: it's allocated directly in one or more contiguous regions in the old generation, bypassing Eden.

### Why they hurt
* Allocation requires **contiguous free regions**; fragmentation can make it fail even with plenty of total free space, leading to **full GCs**.
* The space after the object in its last region is wasted.
* Each humongous allocation can trigger a concurrent cycle start.
* Short-lived humongous objects (e.g. a 4MB byte[] per request) are reclaimed only at specific points (eager reclaim helps for primitive arrays with no references).

### Finding them
GC logs (\`-Xlog:gc+heap=debug\`, humongous region counts), JFR \`ObjectAllocationOutsideTLAB\` events, async-profiler alloc profiles for big arrays.

### Fixes
* **Avoid giant arrays**: stream data instead of buffering whole payloads, chunk large collections, reuse or pool large buffers.
* Increase **\`-XX:G1HeapRegionSize\`** so those objects fall below the half-region threshold.
* Presize collections sensibly instead of letting them double into huge arrays.
* Consider ZGC, which handles large objects differently.`,
    pitfalls: [
      "Reading whole files or HTTP bodies into byte[] per request.",
      "Ignoring humongous allocation reasons in GC logs.",
      "Only increasing the heap.",
    ],
    followUpQuestions: [
      "How does G1 choose its default region size?",
      "What is eager reclaim of humongous objects?",
    ],
    faangFocus: "Practical G1 tuning knowledge for latency-sensitive services.",
  },
  {
    id: 'jvm-32',
    categoryId: 'jvm',
    title: 'Inlining, Megamorphic Call Sites and Class Hierarchy Analysis',
    difficulty: 'Expert',
    tags: ['JIT', 'Inlining', 'Megamorphic', 'CHA'],
    scenario: "Adding a third implementation of a `Codec` interface made an unrelated hot path 30% slower, even though the new implementation is rarely used there.",
    question: "Explain why, in terms of JIT inlining.",
    idealAnswer: `### Inlining is the mother of optimisations
Inlining replaces a call with the callee's body. It enables everything else: constant folding, escape analysis, loop optimisations, dead code elimination across the call boundary.

### How the JIT inlines virtual calls
* **Class hierarchy analysis (CHA)**: if only one loaded class implements a method, the call is treated as direct (with a dependency that triggers **deoptimisation** if another implementation loads later).
* **Profile-based inline caches**: the interpreter/C1 records receiver types at each call site.
  * **Monomorphic** (1 type): inline with a cheap type guard.
  * **Bimorphic** (2 types): inline both behind a type check.
  * **Megamorphic** (3+): C2 gives up on inlining and emits a real vtable/itable dispatch.

### The regression
The hot call site had seen 2 \`Codec\` types. Loading and using a third type there (maybe during warm-up, tests or rare paths through shared code) made it **megamorphic**. The loss of inlining also killed downstream optimisations like escape analysis, hence 30%.

### Mitigations
* Keep hot call sites monomorphic: split code paths per type, or dispatch once outside the hot loop.
* Be aware that shared utility methods called with many lambda types become megamorphic (a known stream performance factor).
* Diagnose with \`-XX:+PrintInlining\`, JITWatch, or async-profiler.`,
    pitfalls: [
      "Assuming virtual calls are always cheap or always expensive.",
      "Benchmarks that only exercise one implementation (monomorphic) and mislead.",
      "Ignoring deoptimisation events after new classes load.",
    ],
    followUpQuestions: [
      "What does 'hot method too big' mean in PrintInlining?",
      "How does type profile pollution happen in shared library code?",
    ],
    faangFocus: "Top-tier JIT knowledge for performance engineering roles.",
  },
  {
    id: 'jvm-33',
    categoryId: 'jvm',
    title: 'JIT Intrinsics',
    difficulty: 'Hard',
    tags: ['JIT', 'Intrinsics', 'Performance', 'SIMD'],
    scenario: "A developer rewrites `System.arraycopy` and `String.indexOf` with hand-written loops 'to avoid JNI overhead' and performance drops.",
    question: "What are JIT intrinsics and why do some JDK methods beat any Java you could write?",
    idealAnswer: `### Intrinsics
For selected JDK methods, HotSpot ignores the Java (or native) implementation and emits **hand-tuned machine code** directly when compiling. These methods are annotated \`@IntrinsicCandidate\` in the JDK source.

### Examples
* \`System.arraycopy\`, \`Arrays.fill\`, \`Arrays.equals\`, \`Arrays.mismatch\`: vectorised memory operations.
* \`String.indexOf\`, \`equals\`, \`compareTo\`, compact string encoding/decoding: SIMD instructions.
* \`Math\` functions (\`sqrt\`, \`fma\`, \`multiplyHigh\`), \`Integer.bitCount\`/\`numberOfLeadingZeros\` → single CPU instructions (POPCNT, LZCNT).
* CRC32/CRC32C, AES, SHA and Base64 → dedicated CPU instructions.
* \`Unsafe\`/\`VarHandle\` operations, \`Thread.onSpinWait\` → PAUSE.

### Why rewriting loses
Your loop can't use AVX-512 or specialised crypto instructions and isn't guaranteed to be auto-vectorised. There's also no 'JNI overhead' to avoid: intrinsics aren't JNI calls.

### Takeaways
Prefer JDK methods for bulk and bit-level operations. For custom SIMD, the **Vector API** (incubating) lets you write portable vector code the JIT maps to hardware instructions.`,
    pitfalls: [
      "Replacing JDK primitives with hand-written loops.",
      "Assuming native methods imply JNI cost.",
      "Benchmarking in the interpreter where intrinsics don't apply.",
    ],
    followUpQuestions: [
      "How can you list the intrinsics available on your JVM?",
      "What does the Vector API add over auto-vectorisation?",
    ],
    faangFocus: "Shows you know where the JVM's performance really comes from.",
  },
  {
    id: 'jvm-34',
    categoryId: 'jvm',
    title: 'The JVM and CPU Limits in Containers',
    difficulty: 'Hard',
    tags: ['Containers', 'CPU Quota', 'availableProcessors', 'Throttling'],
    scenario: "A service in a pod with a CPU limit of 2 on a 64-core node shows high latency spikes. Metrics reveal heavy CFS throttling, and a thread dump shows 60+ GC and ForkJoin threads.",
    question: "How does the JVM see CPU limits, and how should CPU be configured for Java in Kubernetes?",
    idealAnswer: `### What the JVM sizes from CPU count
\`Runtime.availableProcessors()\` drives the number of GC threads, JIT compiler threads, the \`ForkJoinPool.commonPool\` parallelism, and many library defaults (Netty event loops, HTTP client pools).

### Container awareness
Modern JVMs read cgroup CPU **quotas** (limits) and report a matching count. Older JVMs (or ones with container support disabled) saw 64 cores, created 64-core-sized thread pools, and then got **throttled** by the CFS quota: the process burns its 200ms-per-100ms budget in bursts and is frozen for the rest of the period, causing latency spikes. Note: since JDK 19/21 the JVM no longer uses CPU **shares** (requests) to compute the count, only quotas.

### Recommendations
* Verify with \`jcmd <pid> VM.info\` or by logging \`availableProcessors()\`.
* Set \`-XX:ActiveProcessorCount=N\` explicitly if detection is wrong or you want control.
* Many teams set CPU **requests** without **limits** (to avoid throttling) for latency-sensitive Java services; then set \`ActiveProcessorCount\` to the request so pools are sized sensibly.
* Size GC threads (\`ParallelGCThreads\`, \`ConcGCThreads\`) appropriately for small CPU budgets.
* Monitor \`container_cpu_cfs_throttled_periods_total\`.

### Startup
JIT compilation is CPU-heavy at startup; tiny CPU limits make warm-up slow, which is one reason to allow burst (no limit) or use CDS/AOT.`,
    pitfalls: [
      "Tight CPU limits causing throttling during GC or JIT bursts.",
      "Thread pools sized from the node's core count.",
      "Assuming requests influence the JVM's CPU count on recent JDKs.",
    ],
    followUpQuestions: [
      "How does CFS throttling produce latency spikes?",
      "How would you size Tomcat threads for a 2-CPU pod?",
    ],
    faangFocus: "A common production issue at any company running Java on Kubernetes.",
  },
  {
    id: 'jvm-35',
    categoryId: 'jvm',
    title: 'Native Memory: Where Non-Heap Memory Goes',
    difficulty: 'Hard',
    tags: ['Native Memory', 'NMT', 'Metaspace', 'Thread Stacks'],
    scenario: "A JVM with `-Xmx4g` has an RSS of 7.5GB and keeps growing slowly. Heap usage looks flat.",
    question: "What consumes native memory in a JVM, and how do you investigate growth?",
    idealAnswer: `### Non-heap consumers
* **Metaspace**: class metadata. Grows with loaded classes (frameworks, proxies, generated classes).
* **Thread stacks**: \`-Xss\` x number of platform threads (committed lazily, but thousands of threads add up).
* **Code cache**: JIT-compiled code (up to 240MB by default with tiered compilation).
* **GC structures**: remembered sets, mark bitmaps, card tables (G1 can use 10-20% of heap size).
* **Direct ByteBuffers** and memory-mapped files (NIO, Netty, Kafka clients).
* **JNI / native libraries** (compression, crypto, RocksDB) and their **malloc** usage.
* **Symbol tables**, interned strings metadata, internal JVM arenas.
* **glibc malloc arenas**: fragmentation and per-thread arenas can bloat RSS.

### Investigation
1. **Native Memory Tracking**: start with \`-XX:NativeMemoryTracking=summary\`, take a \`jcmd <pid> VM.native_memory baseline\` and later \`summary.diff\` to see which category grows.
2. If NMT shows nothing growing, the leak is outside JVM-tracked memory: native libraries or malloc. Use jemalloc with profiling, or \`pmap\` to look at anonymous mappings.
3. Check direct buffers with \`BufferPoolMXBean\` metrics.

### Common culprits
Unclosed \`Inflater\`/\`Deflater\`/\`GZIPInputStream\` objects (native zlib memory until finalization/cleaner), thread leaks, class loader leaks, and malloc arena fragmentation (\`MALLOC_ARENA_MAX\`).`,
    pitfalls: [
      "Assuming RSS ≈ Xmx.",
      "Not enabling NMT until after the incident.",
      "Forgetting to close native-backed resources like Inflater.",
    ],
    followUpQuestions: [
      "What is the overhead of enabling NMT?",
      "Why does jemalloc sometimes reduce RSS dramatically?",
    ],
    faangFocus: "Advanced production debugging often probed for platform roles.",
  },
  {
    id: 'jvm-36',
    categoryId: 'jvm',
    title: 'Code Cache Full: When the JIT Stops Compiling',
    difficulty: 'Expert',
    tags: ['Code Cache', 'JIT', 'Performance Degradation'],
    scenario: "After running for several days, a large service gradually becomes 3x slower. A restart fixes it. The logs contain 'CodeCache is full. Compiler has been disabled.'",
    question: "What happened and how do you prevent it?",
    idealAnswer: `### The code cache
JIT-compiled machine code lives in a fixed-size native region: the **code cache**, segmented (since JDK 9) into non-method, profiled and non-profiled segments. Default reserved size with tiered compilation is about **240MB**.

### What happened
Large applications with many classes, heavy use of generated code (proxies, lambdas, scripting engines) or frequent **deoptimisation/recompilation** cycles can fill it. When full, the JIT is **disabled**: new hot methods stay **interpreted** (10-50x slower). Performance decays gradually as the workload shifts to code that never got compiled.

### Prevention
* Increase \`-XX:ReservedCodeCacheSize\` (e.g. 512MB) for large apps.
* Ensure code cache flushing is enabled (\`UseCodeCacheFlushing\`, default on) so cold compiled methods are evicted.
* Monitor usage: \`jcmd <pid> Compiler.codecache\`, the \`CodeHeap\` memory pool MXBeans, and JFR code cache events. Alert well before full.
* Investigate excessive recompilation (\`-XX:+PrintCompilation\`, JFR deoptimisation events), which can indicate unstable type profiles.`,
    pitfalls: [
      "Missing the warning in logs because it only appears once.",
      "Assuming the JIT always recovers after the cache fills.",
      "Disabling tiered compilation without understanding the trade-off.",
    ],
    followUpQuestions: [
      "What are the three code heap segments for?",
      "How does tiered compilation affect code cache usage?",
    ],
    faangFocus: "A rare, dramatic failure mode that experienced JVM engineers recognise.",
  },
  {
    id: 'jvm-37',
    categoryId: 'jvm',
    title: 'GraalVM Native Image: The Closed-World Trade-Off',
    difficulty: 'Expert',
    tags: ['GraalVM', 'Native Image', 'AOT', 'Startup'],
    scenario: "A team wants to compile all its Spring Boot microservices to native images to cut startup from 8s to 0.1s and memory by half.",
    question: "How does native image work, and what are the trade-offs?",
    idealAnswer: `### How it works
\`native-image\` performs **static analysis** from the entry points to find all reachable code (**closed-world assumption**), compiles it ahead of time into a standalone executable, and can run static initialisers at build time, snapshotting the resulting heap into the binary.

### Benefits
* Startup in tens of milliseconds, no warm-up JIT.
* Lower memory footprint (no JIT, no class metadata for unused classes).
* Great for serverless, CLI tools, scale-to-zero and dense deployments.

### Costs
* **Dynamic features need configuration**: reflection, dynamic proxies, resources, JNI and serialisation must be declared (reachability metadata). Spring Boot AOT generates most of it, but libraries without metadata break at runtime.
* **Peak throughput** is often lower than a warmed-up JIT (PGO in Oracle GraalVM narrows the gap), and GC options are more limited.
* **Build time and memory**: minutes and many GB per build.
* Debugging and profiling tools differ from the standard JVM toolbox.
* Behaviour differences between JVM and native mode require testing both.

### Alternatives
**CDS/AppCDS**, **Project Leyden** AOT caches (JDK 24+), and **CRaC** checkpoint/restore improve JVM startup without the closed world.

### Recommendation
Use native images where startup and footprint dominate (functions, CLIs, bursty autoscaling). Keep long-running, high-throughput services on the JVM.`,
    pitfalls: [
      "Converting services whose startup time doesn't matter.",
      "Libraries using reflection without metadata failing only in production paths.",
      "Assuming native is faster at peak.",
    ],
    followUpQuestions: [
      "What does build-time initialisation risk?",
      "How does Leyden's approach differ?",
    ],
    faangFocus: "Modern JVM landscape knowledge with trade-off reasoning.",
  },
  {
    id: 'jvm-38',
    categoryId: 'jvm',
    title: 'Faster Startup: CDS, Leyden AOT Cache and CRaC',
    difficulty: 'Expert',
    tags: ['Startup', 'CDS', 'Project Leyden', 'CRaC'],
    scenario: "Autoscaling adds pods during traffic spikes, but each new pod takes 25 seconds to start and another minute to reach full speed, so the spike is over before capacity arrives.",
    question: "What JVM-level options improve startup and warm-up without going native?",
    idealAnswer: `### Where time goes
Class loading and verification, framework initialisation (component scanning, reflection), and JIT warm-up (interpreted and C1 code until C2 kicks in).

### Class Data Sharing
* **CDS** (default archive for JDK classes) and **AppCDS** for your classes: pre-parsed class metadata mapped from an archive, skipping parsing and verification.
* Spring Boot 3.3+ can train and use a CDS archive (\`-XX:SharedArchiveFile\`), typically cutting startup by 30-50%.

### Project Leyden AOT cache (JDK 24+)
JEP 483 (**AOT class loading and linking**) records a training run and stores loaded **and linked** classes in an AOT cache (\`-XX:AOTCache\`). Later JEPs add AOT method profiles and compiled code, attacking warm-up too.

### CRaC (Coordinated Restore at Checkpoint)
Snapshot a **fully warmed JVM** process (CRIU-based) and restore it in milliseconds. Applications must close and reopen resources (sockets, files) at checkpoint/restore via the CRaC API; Spring supports it. Requires specific JDK builds and Linux privileges, and secrets in the snapshot need care.

### Operational tactics
Readiness only after warm-up (send synthetic traffic), right-sized CPU at startup (JIT is CPU-hungry), predictive autoscaling, and trimming framework work (lazy initialisation, fewer auto-configurations).`,
    pitfalls: [
      "Marking pods ready before warm-up, causing latency spikes.",
      "Snapshotting secrets or open connections with CRaC.",
      "Tight CPU limits that stretch JIT warm-up.",
    ],
    followUpQuestions: [
      "How do you create an AppCDS archive for a Spring Boot app?",
      "What must an application do to support CRaC?",
    ],
    faangFocus: "Current JVM startup techniques; strong signal of staying up to date.",
  },
  {
    id: 'jvm-39',
    categoryId: 'jvm',
    title: 'Generational ZGC',
    difficulty: 'Expert',
    tags: ['ZGC', 'Generational GC', 'Low Latency', 'JDK 21'],
    scenario: "A service on non-generational ZGC has great pause times but needs a heap 2x its live set to avoid allocation stalls. JDK 21 offers generational ZGC.",
    question: "Why did ZGC add generations, and what changes in practice?",
    idealAnswer: `### Non-generational ZGC's weakness
Original ZGC collected the **whole heap** each cycle, concurrently. Pauses were tiny, but the collector had to mark all live objects every cycle, even though most allocated objects die young. With high allocation rates, collection cycles couldn't keep up unless the heap had lots of **headroom**, otherwise threads hit **allocation stalls** (which don't show as GC pauses but hurt latency just as much).

### Generational ZGC (JEP 439, JDK 21; default ZGC mode from JDK 23)
Separate young and old generations, collected independently and concurrently. Young collections focus on the region where most garbage is, so:
* Much **lower CPU overhead** for the same allocation rate.
* **Less heap headroom** needed: smaller heaps for the same workload.
* Fewer allocation stalls.
Pauses remain sub-millisecond.

### Implementation notes
Uses **store barriers** (in addition to load barriers) to track old-to-young references, and new colored-pointer metadata. No multi-mapped memory anymore, which simplifies memory accounting.

### In practice
\`-XX:+UseZGC\` (plus \`-XX:+ZGenerational\` on JDK 21-22). Watch for allocation stalls in JFR/GC logs rather than just pause times, and size the heap from observed live set plus headroom.`,
    pitfalls: [
      "Judging ZGC only by pause times and missing allocation stalls.",
      "Oversizing heaps unnecessarily with generational ZGC.",
      "Assuming ZGC has zero throughput cost.",
    ],
    followUpQuestions: [
      "What is an allocation stall?",
      "How do load barriers enable concurrent relocation?",
    ],
    faangFocus: "Current GC knowledge for latency-sensitive roles.",
  },
  {
    id: 'jvm-40',
    categoryId: 'jvm',
    title: 'How Concurrent Compaction Works: Load Barriers and Colored Pointers',
    difficulty: 'Master',
    tags: ['ZGC', 'Load Barriers', 'Colored Pointers', 'Concurrent Relocation'],
    scenario: "An interviewer asks: 'G1 must stop the world to move objects. How can ZGC move objects while application threads are still reading them?'",
    question: "Explain the mechanism behind concurrent relocation.",
    idealAnswer: `### The problem
Moving an object requires updating **every reference** to it. If application threads keep running, they could read a stale reference to the old copy, or write to it after it was copied.

### Colored pointers
ZGC stores **metadata bits in the pointer itself** (e.g. marked, remapped states). Every reference encodes 'how fresh' it is relative to the current GC phase.

### Load barriers
The JIT inserts a small check on every **reference load from the heap**. If the loaded pointer's color is 'good' for the current phase (the fast path, a test and branch), use it. Otherwise take the **slow path**: if the object has been relocated, look up the **forwarding table** to find the new address (or relocate it right now, 'self-healing'), and **overwrite the field** with the good pointer so the next load is fast.

### The cycle
1. Short pause: scan roots.
2. Concurrent mark (barriers help mark objects as they're loaded).
3. Short pause, then concurrent **relocation** of selected regions (pages), with forwarding tables.
4. References are fixed lazily by barriers and by the next marking phase ('remapping').

Pauses only cover thread stacks and roots, so they don't grow with heap size. Shenandoah achieves similar results with **Brooks-style forwarding** and load-reference barriers.

### Costs
Barrier overhead on reference loads (a few % throughput), extra CPU for concurrent GC threads, and memory headroom for relocation.`,
    pitfalls: [
      "Believing ZGC never pauses.",
      "Confusing load barriers with memory fences.",
      "Ignoring the throughput cost of barriers.",
    ],
    followUpQuestions: [
      "How does generational ZGC track old-to-young references?",
      "How does Shenandoah's approach differ?",
    ],
    faangFocus: "GC internals at the level expected for JVM or runtime engineering roles.",
  },
  {
    id: 'jvm-41',
    categoryId: 'jvm',
    title: 'Reflection vs MethodHandles Performance',
    difficulty: 'Expert',
    tags: ['Reflection', 'MethodHandles', 'Performance', 'Frameworks'],
    scenario: "A custom mapping library calls `Method.invoke` for every field of every object and dominates CPU profiles in a high-throughput service.",
    question: "What does reflection cost, and how do MethodHandles, LambdaMetafactory and code generation compare?",
    idealAnswer: `### Reflection costs
* **Lookup** (\`getDeclaredMethod\`, \`getField\`) is slow: always cache the \`Method\`/\`Field\` objects.
* **Invocation**: access checks, argument boxing into \`Object[]\`, and a call the JIT can't easily inline. Since **JDK 18 (JEP 416)** core reflection is implemented with method handles internally, improving it, but it's still hard to optimise at megamorphic sites.
* \`setAccessible(true)\` is restricted by the module system for JDK internals.

### MethodHandles
Typed, directly invokable references. When stored in a **\`static final\` field**, the JIT treats them as constants and can **inline through them**, often reaching direct-call performance. Non-constant handles are slower.

### LambdaMetafactory
Generate a real implementation of a functional interface (e.g. a \`Function<Order, String>\` getter) at runtime: then calls are ordinary interface calls the JIT can inline. Popular in fast serialisers.

### Code generation
Libraries like ByteBuddy, or annotation processors (MapStruct generates plain Java at compile time), avoid runtime reflection entirely. Compile-time generation is also friendly to GraalVM native images.

### Practical advice
For mapping, prefer compile-time generation (MapStruct, records, hand-written mappers). If runtime reflection is unavoidable, cache metadata and convert to MethodHandles or generated lambdas once per class.`,
    pitfalls: [
      "Looking up Method objects per call.",
      "Non-final MethodHandle fields that the JIT can't constant-fold.",
      "Runtime reflection that breaks native-image builds.",
    ],
    followUpQuestions: [
      "Why does static final matter for MethodHandle performance?",
      "How does Jackson avoid reflection overhead (afterburner/blackbird)?",
    ],
    faangFocus: "Framework-level performance knowledge for senior engineers.",
  },
  {
    id: 'jvm-42',
    categoryId: 'jvm',
    title: 'Tuning G1 for a Latency SLA',
    difficulty: 'Expert',
    tags: ['G1', 'GC Tuning', 'MaxGCPauseMillis', 'IHOP'],
    scenario: "A service on G1 with a 16GB heap has a p99 latency SLA of 100ms. GC pauses of 150-400ms appear several times an hour.",
    question: "How would you approach tuning G1 for this SLA?",
    idealAnswer: `### Start with evidence
Enable detailed logs (\`-Xlog:gc*,safepoint:file=gc.log:time,uptime\`). Classify the long pauses: young, mixed, remark/cleanup, **full GC**, or **safepoint** time outside GC. Different causes, different fixes.

### Common causes and fixes
* **Full GCs / evacuation failures** ('to-space exhausted'): old gen fills before concurrent marking finishes. Start marking earlier (\`-XX:InitiatingHeapOccupancyPercent\`, or let adaptive IHOP work), increase heap headroom, add \`G1ReservePercent\`, and fix allocation spikes.
* **Long mixed collections**: too many old regions per pause. Tune \`G1MixedGCCountTarget\` (spread work over more pauses) and \`G1HeapWastePercent\`.
* **Long young pauses**: large young gen with many survivors. Lower \`MaxGCPauseMillis\` (G1 then shrinks young gen), or reduce the live set in young gen.
* **Humongous allocations**: increase region size or avoid huge arrays.
* **Reference processing** time: enable parallel reference processing (default in recent JDKs) or reduce soft/weak references.
* **Time-to-safepoint** issues: counted loops, long-running native calls.

### Realism
\`MaxGCPauseMillis\` is a **goal**, not a guarantee. If G1 can't meet 100ms with reasonable settings and the heap is large, **ZGC** is often the simplest answer. And reducing **allocation rate** and **live set** helps every collector.

### Validate
Change one thing at a time, replay production-like load, and compare pause distributions (not averages).`,
    pitfalls: [
      "Setting many flags at once based on blog posts.",
      "Setting MaxGCPauseMillis extremely low and causing throughput collapse.",
      "Ignoring safepoint time that isn't GC.",
    ],
    followUpQuestions: [
      "What is adaptive IHOP?",
      "When would you give up on G1 and switch collectors?",
    ],
    faangFocus: "Practical GC tuning methodology for senior backend roles.",
  },
  {
    id: 'jvm-43',
    categoryId: 'jvm',
    title: 'Hidden Classes, Class Unloading and Metaspace Growth',
    difficulty: 'Master',
    tags: ['Hidden Classes', 'Class Unloading', 'Metaspace', 'Dynamic Code'],
    scenario: "A rules engine compiles user-defined expressions into classes at runtime. Metaspace grows by 50MB a day until the service crashes, even though old rules are deleted.",
    question: "When can classes be unloaded, and how do hidden classes help dynamic code generation?",
    idealAnswer: `### Class unloading rules
A class can be unloaded only when its **defining class loader** becomes unreachable, along with all its classes and their instances. Classes loaded by the application or system loader essentially **never unload**. So generating classes into a long-lived loader leaks metaspace forever.

### Traditional workaround
Create a **separate class loader per generated unit** (or per batch) and drop all references to it when the rule is deleted. Any lingering reference (a cache, a ThreadLocal, a registered listener, a static field in a shared class) keeps the whole loader alive.

### Hidden classes (JEP 371, Java 15)
\`Lookup.defineHiddenClass(bytes, initialize, options)\`:
* Not discoverable by name, not linkable by other classes.
* Can be unloaded **independently** of their defining loader when unreachable (unless defined with the \`STRONG\` option).
* Can be a **nestmate** of the lookup class to access its private members.
This is what the JDK uses for lambdas and what frameworks (ByteBuddy, dynamic proxies in newer versions) should use for generated code.

### Diagnosis
\`jcmd <pid> VM.metaspace\` and \`VM.classloader_stats\`, class histograms by loader, and heap dumps to find what keeps loaders reachable (path to GC roots of the \`ClassLoader\` object).`,
    pitfalls: [
      "Generating classes into the application class loader.",
      "Hidden references keeping throwaway class loaders alive.",
      "Setting MaxMetaspaceSize without fixing the leak.",
    ],
    followUpQuestions: [
      "Why do lambdas use hidden classes?",
      "How would you test that a generated class is unloaded?",
    ],
    faangFocus: "Deep runtime knowledge for teams building engines, frameworks or plugin systems.",
  },
  {
    id: 'jvm-44',
    categoryId: 'jvm',
    title: 'Essential JVM Flags for Production',
    difficulty: 'Solid',
    tags: ['JVM Flags', 'Production', 'Diagnostics', 'Configuration'],
    scenario: "You're reviewing the JVM options for a new production service that currently has none besides `-Xmx`.",
    question: "Which JVM flags would you set by default for a production service, and why?",
    idealAnswer: `### Memory
* \`-XX:MaxRAMPercentage=70\` (or explicit \`-Xmx\`) sized for the container, with room for native memory.
* \`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps\` on a volume that survives the container.
* \`-XX:+ExitOnOutOfMemoryError\` so the orchestrator restarts a broken JVM.

### GC and logging
* Choose the collector deliberately (\`-XX:+UseG1GC\` default, or \`-XX:+UseZGC\` for latency).
* \`-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags:filecount=5,filesize=20m\` with rotation.

### Observability
* **JFR continuously**: \`-XX:StartFlightRecording=disk=true,maxsize=250m,maxage=6h,settings=default\` for low-overhead flight recording you can dump after an incident.
* \`-XX:NativeMemoryTracking=summary\` if native memory is a concern (small overhead).

### Behaviour
* \`-XX:+UseContainerSupport\` is default; verify CPU count, and set \`-XX:ActiveProcessorCount\` if needed.
* \`-Djava.security.egd\` / DNS TTL (\`networkaddress.cache.ttl\`) for environments where endpoints change.

### Checking what you got
\`java -XX:+PrintFlagsFinal -version\` and \`jcmd <pid> VM.flags\` show effective values. Keep flags in version control, documented, and minimal: every tuning flag should have a measured reason.`,
    pitfalls: [
      "Copying flag lists from old blog posts (e.g. CMS or PermGen flags).",
      "Heap dumps written inside ephemeral container filesystems.",
      "No GC logging when the first incident happens.",
    ],
    followUpQuestions: [
      "How much overhead does continuous JFR add?",
      "How do you get a heap dump out of a Kubernetes pod?",
    ],
    faangFocus: "Operational readiness checklist expected from senior engineers.",
  },
];
