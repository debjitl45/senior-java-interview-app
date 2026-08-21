import type { Question } from '../types';

export const CONCURRENCY_QUESTIONS: Question[] = [
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
{
    id: 'conc-8',
    categoryId: 'concurrency',
    title: 'volatile, Atomicity and the Happens-Before Relationship',
    difficulty: 'Solid',
    tags: ['volatile', 'JMM', 'Happens-Before', 'Visibility'],
    scenario: 'A worker loop reads a `boolean running` flag set by another thread. Without `volatile`, the loop never exits in production but always exits when a `println` is added inside it. Elsewhere, a `volatile int counter++` still loses updates.',
    question: 'Explain what volatile guarantees and what it does not, and define happens-before precisely.',
    idealAnswer: `### Why the loop never exits
Without \`volatile\`, the JIT is entirely within its rights to **hoist the field read out of the loop** — the Java Memory Model gives it no reason to believe another thread can change it. The loop becomes \`while (true)\`. Adding \`println\` "fixes" it accidentally: \`println\` is synchronized internally, which introduces a memory barrier and prevents the hoist. That is a coincidence, not a fix.

Note the failure is a **compiler optimisation**, not merely a stale CPU cache — hardware caches are coherent on x86. Explaining it as "the value is cached in the CPU" is the common half-right answer.

### What volatile guarantees
1. **Visibility** — a write is visible to any thread that subsequently reads the variable.
2. **Ordering** — reads and writes are not reordered across the volatile access, and it establishes a happens-before edge.
3. **Atomicity of the access itself**, including \`long\` and \`double\`, whose non-volatile reads/writes may otherwise tear on 32-bit VMs.

### What volatile does NOT guarantee
**Compound atomicity.** \`counter++\` is read-modify-write: three separate operations. Two threads can both read 5, both write 6, and one increment is lost. \`volatile\` makes each read and each write visible; it does nothing about the gap between them.

Use \`AtomicInteger.incrementAndGet()\` (a CAS loop), or \`LongAdder\` under high contention (striped cells, far better throughput when you only need the total occasionally).

### Happens-before, precisely
A partial order guaranteeing that if A *happens-before* B, then A's effects are visible to B. The edges the JMM defines:
* **Program order** within a single thread.
* **Monitor lock** — unlock happens-before every subsequent lock of the same monitor.
* **Volatile** — a write happens-before every subsequent read of that variable.
* **Thread start** — \`Thread.start()\` happens-before everything in the started thread.
* **Thread join** — everything in a thread happens-before a successful \`join()\`.
* **Final fields** — correctly constructed final fields are visible without synchronisation, provided \`this\` did not escape the constructor.
* Transitivity, and edges from \`java.util.concurrent\` (e.g. actions before placing an item in a queue happen-before its retrieval).

The essential point: happens-before is about **ordering guarantees the JMM makes**, not about wall-clock time. Without an edge, there is simply **no guarantee** — including no guarantee that the value is stale, which is why these bugs are so intermittent.

### When volatile is enough
A one-way status flag, safe publication of an immutable object, and the \`volatile\` field in double-checked locking. Anything requiring read-then-write needs an atomic or a lock.`,
    codeSnippet: `// Broken: JIT may hoist the read out of the loop
private boolean running = true;
while (running) { work(); }

// Correct for a simple flag
private volatile boolean running = true;

// volatile is NOT enough for compound actions
private volatile int count;
count++;                            // still loses updates

private final AtomicInteger count = new AtomicInteger();
count.incrementAndGet();            // CAS, atomic

private final LongAdder hits = new LongAdder();
hits.increment();                   // striped, far better under contention`,
    pitfalls: [
      'Explaining the visibility failure purely as CPU cache staleness rather than compiler hoisting.',
      'Assuming volatile makes ++ or check-then-act atomic.',
      'Adding synchronization or printing "to fix" a visibility bug by accident.',
      'Believing the absence of an ordering guarantee means values will be stale — it means anything may happen.'
    ],
    followUpQuestions: [
      'Why is AtomicInteger not always better than LongAdder, and vice versa?',
      'What is the final-field freeze and what breaks it?',
      'How does volatile interact with the double-checked locking idiom?'
    ],
    faangFocus: 'A universal concurrency screen. Naming compiler hoisting and reciting the happens-before edge list precisely is what separates strong answers.'
  },
  {
    id: 'conc-9',
    categoryId: 'concurrency',
    title: 'Sizing and Configuring Thread Pools',
    difficulty: 'Solid',
    tags: ['ThreadPoolExecutor', 'Sizing', 'Executors', 'Rejection'],
    scenario: 'A service uses `Executors.newCachedThreadPool()` for downstream HTTP calls. Under a traffic spike it creates 8,000 threads and the JVM dies with `OutOfMemoryError: unable to create native thread`.',
    question: 'Explain why the Executors factory methods are discouraged, how ThreadPoolExecutor parameters interact, and how to size a pool.',
    idealAnswer: `### Why the factory methods are traps
* \`newCachedThreadPool()\` — \`maximumPoolSize = Integer.MAX_VALUE\` with a \`SynchronousQueue\`. Every task that finds no idle thread creates a **new** one. Under a spike this is unbounded thread creation, which is exactly what happened. Each platform thread costs ~1MB of stack, so this exhausts native memory.
* \`newFixedThreadPool(n)\` — bounded threads, but an **unbounded \`LinkedBlockingQueue\`**. Overload becomes heap growth and unbounded latency instead of an error.
* \`newSingleThreadExecutor()\` — same unbounded queue.

Both failure modes are the same mistake: **something is unbounded**. Effective Java and every serious style guide recommend constructing \`ThreadPoolExecutor\` explicitly.

### How the parameters actually interact
This ordering surprises people:
1. Fewer than \`corePoolSize\` threads → **create a new thread**, even if others are idle.
2. Otherwise → **try to queue the task**.
3. Queue full → create threads up to \`maximumPoolSize\`.
4. Queue full **and** at maximum → **reject** via the \`RejectedExecutionHandler\`.

The critical consequence: **with an unbounded queue, step 3 never happens** — the pool never grows beyond \`corePoolSize\`, and \`maximumPoolSize\` is dead configuration. A bounded queue is what makes the maximum meaningful.

### Rejection policies
* \`AbortPolicy\` (default) — throws \`RejectedExecutionException\`. Loud, and usually correct: it makes overload visible.
* \`CallerRunsPolicy\` — the submitting thread runs the task, so the producer slows down. **Real backpressure**, and often the best choice.
* \`DiscardPolicy\` / \`DiscardOldestPolicy\` — silent data loss. Use only when the work is genuinely droppable (e.g. metrics).

### Sizing
* **CPU-bound:** \`threads ≈ cores\` (or cores + 1). More threads only add context switching.
* **IO-bound:** \`threads = cores × (1 + waitTime / serviceTime)\`. A task waiting 90ms and computing 10ms wants ~10× cores. But the real bound is usually the **downstream capacity** — sizing a pool larger than the database or API can serve just moves the queue.
* **Separate pools per dependency** (the bulkhead pattern) so one slow downstream cannot consume the pool everything else shares.

### Virtual threads change this
For blocking IO on Java 21+, \`Executors.newVirtualThreadPerTaskExecutor()\` removes the sizing problem: virtual threads are cheap, so there is no pool to size. **But you still must bound concurrency** against downstream systems — with a semaphore or rate limiter, not with the thread count. Unbounded virtual threads pointed at a database with 20 connections is still an outage.

### Always
Name your threads (a \`ThreadFactory\`), so thread dumps are readable. Export queue depth, active count and rejection count as metrics.`,
    codeSnippet: `// Explicit, bounded everywhere, with backpressure and named threads
ExecutorService pool = new ThreadPoolExecutor(
        16, 32,                                  // core, max
        60L, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(500),           // bounded: makes max meaningful
        new ThreadFactoryBuilder().setNameFormat("http-worker-%d").build(),
        new ThreadPoolExecutor.CallerRunsPolicy());

// Java 21: no sizing, but still bound downstream concurrency explicitly
var exec = Executors.newVirtualThreadPerTaskExecutor();
Semaphore dbGate = new Semaphore(20);            // matches the connection pool`,
    pitfalls: [
      'Using newCachedThreadPool or newFixedThreadPool in production code.',
      'Setting maximumPoolSize with an unbounded queue, where it has no effect.',
      'Sharing one pool across all downstream dependencies.',
      'Assuming virtual threads remove the need to bound concurrency.'
    ],
    followUpQuestions: [
      'Why does an unbounded queue make maximumPoolSize meaningless?',
      'When is CallerRunsPolicy dangerous rather than helpful?',
      'How would you pick a semaphore limit for virtual-thread-based IO?'
    ],
    faangFocus: 'Extremely common. The queue-before-max ordering rule is the specific detail interviewers use to separate real experience from documentation reading.'
  },
  {
    id: 'conc-10',
    categoryId: 'concurrency',
    title: 'Deadlock, Livelock and Lock Ordering',
    difficulty: 'Solid',
    tags: ['Deadlock', 'Lock Ordering', 'Thread Dump', 'tryLock'],
    scenario: 'A transfer method locks the source account then the destination account. Under load, threads hang. A thread dump shows two threads each holding one account lock and waiting for the other.',
    question: 'State the conditions for deadlock, explain how to detect it from a thread dump, and give several structural fixes.',
    idealAnswer: `### The four Coffman conditions
All four must hold simultaneously:
1. **Mutual exclusion** — a resource is held exclusively.
2. **Hold and wait** — a thread holds one resource while requesting another.
3. **No preemption** — resources cannot be forcibly taken back.
4. **Circular wait** — a cycle exists in the wait-for graph.

Break **any one** and deadlock is impossible. In practice, breaking circular wait is the standard approach.

### Detection
* A thread dump (\`jstack\`, \`jcmd Thread.print\`) shows threads \`BLOCKED\` with "waiting to lock <0x...>" and "locked <0x...>". The JVM **explicitly reports** intrinsic-lock deadlocks: "Found one Java-level deadlock". Follow the monitor addresses to see the cycle.
* \`ThreadMXBean.findDeadlockedThreads()\` allows programmatic detection — useful as a watchdog that alerts rather than hangs silently.
* Note: the JVM detects \`synchronized\` and \`ReentrantLock\` deadlocks, but **not** deadlocks formed by semaphores, latches or database locks. Those look like a hang with no diagnosis.

### The fixes, best first
1. **Global lock ordering.** Always acquire in a consistent total order — here, by account id (with a tiebreaker for the equal case). This breaks circular wait structurally and is the standard answer.
2. **Do not hold a lock while acquiring another.** Restructure so each critical section takes one lock. Often the cleanest design.
3. **\`tryLock\` with a timeout.** Acquire both with timeouts; on failure release everything, back off with jitter, and retry. This breaks hold-and-wait — but beware **livelock**: threads politely releasing and retrying in lockstep make no progress. Randomised backoff is what fixes that.
4. **Remove the shared mutable state.** An ordered command queue per account, or a single-writer design, eliminates the locks. At a higher level, the database's atomic conditional update handles the transfer with no application locks at all.

### Livelock and starvation
* **Livelock** — threads are running and changing state but making no progress (mutual retry-and-release). The fix is randomisation or an arbitrator.
* **Starvation** — a thread never gets the resource. \`ReentrantLock(true)\` provides fairness at a significant throughput cost; usually not worth it.

### Prevention as practice
* Keep critical sections **short**, and never perform IO or call foreign code while holding a lock (a callback may acquire locks you know nothing about — "open call" discipline).
* Document lock order in code that must take more than one.
* Add a deadlock-detection watchdog in production so a hang becomes an alert with a thread dump attached, rather than a silent outage.`,
    codeSnippet: `// Deadlock: order depends on the arguments
synchronized (from) { synchronized (to) { transfer(from, to, amount); } }

// Fixed: consistent global ordering by id
Account first  = from.id() < to.id() ? from : to;
Account second = from.id() < to.id() ? to   : from;
synchronized (first) {
    synchronized (second) { transfer(from, to, amount); }
}

// Or break hold-and-wait, with jittered backoff to avoid livelock
if (a.lock.tryLock(50, MILLISECONDS)) {
    try {
        if (b.lock.tryLock(50, MILLISECONDS)) { try { transfer(...); } finally { b.lock.unlock(); } }
    } finally { a.lock.unlock(); }
}`,
    pitfalls: [
      'Using tryLock without randomised backoff and creating livelock instead.',
      'Assuming the JVM detects all deadlocks — it does not detect semaphore or database ones.',
      'Performing IO or invoking callbacks while holding a lock.',
      'Using fair locks by default and paying a large throughput cost for no benefit.'
    ],
    followUpQuestions: [
      'How would you handle the equal-id case in a lock-ordering scheme?',
      'What does an "open call" mean and why does it prevent whole classes of deadlock?',
      'How would you build a production watchdog for deadlock detection?'
    ],
    faangFocus: 'A classic. Naming the Coffman conditions and then choosing which one to break shows structured reasoning rather than pattern recall.'
  },
  {
    id: 'conc-11',
    categoryId: 'concurrency',
    title: 'CompletableFuture vs Virtual Threads for Concurrent IO',
    difficulty: 'Hard',
    tags: ['Virtual Threads', 'Loom', 'Blocking IO', 'Pinning'],
    scenario: 'A service makes 10 downstream HTTP calls per request at 2,000 requests/second. The current implementation uses a 200-thread pool and saturates; a rewrite to reactive types is proposed.',
    question: 'Explain how virtual threads work, why they suit this workload, and what still limits you. Compare with the reactive approach.',
    idealAnswer: `### The arithmetic
2,000 req/s × 10 calls = 20,000 concurrent downstream calls. With platform threads at ~1MB of stack each, that is ~20GB of stack — impossible. Hence the saturation.

### How virtual threads work
A virtual thread is a \`Thread\` scheduled by the JVM, not the OS. It runs on a **carrier** thread from a \`ForkJoinPool\` sized to the core count. When it performs a **blocking** operation that the JDK has been retrofitted for (socket IO, \`Thread.sleep\`, most \`java.util.concurrent\` blocking), the JVM:
1. **Unmounts** it from the carrier,
2. **Copies its stack to the heap** (continuations),
3. Frees the carrier for other virtual threads,
4. **Remounts** it when the operation completes.

Stacks are heap-allocated and grow on demand, so a virtual thread costs a few hundred bytes to a few KB. Millions are feasible.

The crucial property: **blocking code becomes cheap**. You keep ordinary sequential code, working stack traces, ThreadLocals, debuggers and profilers.

### Pinning — the thing to watch
A virtual thread cannot unmount while pinned:
* Inside a \`synchronized\` block spanning a blocking call (this was the major limitation; **JDK 24 largely removed it**, but check your runtime).
* Inside a native frame (JNI, some FFM downcalls).

A pinned virtual thread occupies its carrier, so enough of them starve the scheduler. Detect with \`-Djdk.tracePinnedThreads=full\`, and replace \`synchronized\` with \`ReentrantLock\` around blocking sections on older JDKs.

### What still limits you
Virtual threads remove the **thread** constraint, not every constraint:
* **Downstream capacity.** 20,000 concurrent calls to a service that handles 500 is a denial-of-service you inflicted on yourself. Bound concurrency with a semaphore or rate limiter.
* **Connection pools.** HTTP and database clients still have finite pools; those become the queue.
* **No backpressure.** Virtual threads happily accept unbounded work. Reactive streams' demand signalling has no equivalent here.
* **ThreadLocal footprint** at millions of threads — prefer \`ScopedValue\`.
* Do **not pool** virtual threads. \`newVirtualThreadPerTaskExecutor\` is the correct usage; pooling defeats the design.

### Compared with reactive
Reactive gives the same concurrency plus real backpressure, at the cost of a full-stack rewrite, non-blocking drivers everywhere, unreadable stack traces, and a permanent step up in team cognitive load.

**Recommendation for this scenario:** virtual threads plus \`StructuredTaskScope\` for the fan-out, with a semaphore bounding downstream concurrency. Same throughput as reactive, a fraction of the change, and code anyone can debug. Choose reactive only if you specifically need backpressure or streaming semantics.`,
    codeSnippet: `// One virtual thread per task — never pool them
ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor();

// Fan out with structured concurrency; bound the downstream explicitly
private final Semaphore downstream = new Semaphore(500);

Result handle(Request req) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var tasks = req.targets().stream()
                .map(t -> scope.fork(() -> {
                    downstream.acquire();
                    try { return client.get(t); } finally { downstream.release(); }
                })).toList();
        scope.join().throwIfFailed();
        return combine(tasks);
    }
}

# Find pinning on older JDKs
-Djdk.tracePinnedThreads=full`,
    pitfalls: [
      'Pooling virtual threads.',
      'Assuming virtual threads provide backpressure.',
      'Ignoring pinning on JDKs before the synchronized fix.',
      'Removing the thread limit without adding a concurrency limit, and overwhelming downstream systems.'
    ],
    followUpQuestions: [
      'How does stack copying between heap and carrier work, and what does it cost?',
      'Why must you not pool virtual threads?',
      'What would you monitor to know that pinning is hurting you?'
    ],
    faangFocus: 'The current headline concurrency question. Bounding downstream concurrency unprompted is the detail that marks a senior answer.'
  },
  {
    id: 'conc-12',
    categoryId: 'concurrency',
    title: 'CAS, ABA and Lock-Free Algorithm Design',
    difficulty: 'Expert',
    tags: ['CAS', 'ABA', 'Lock-Free', 'AtomicReference'],
    scenario: 'A lock-free stack built with `AtomicReference` and `compareAndSet` passes all tests but under sustained load occasionally loses or duplicates nodes on a machine with node reuse from a free list.',
    question: 'Explain compare-and-swap, the ABA problem, and the techniques for avoiding it. What does lock-free actually guarantee?',
    idealAnswer: `### CAS
\`compareAndSet(expected, new)\` atomically writes \`new\` only if the current value is \`expected\`, returning whether it succeeded. It compiles to a single instruction (\`LOCK CMPXCHG\` on x86, LL/SC on ARM). Algorithms **retry in a loop** until they win, which is why CAS-based code is optimistic rather than blocking.

### The ABA problem
CAS compares a **value**, not a **history**. Thread 1 reads head = A and is preempted. Meanwhile: A is popped, B is popped, and A is pushed back (reusing the same node object from a free list). Thread 1 resumes, sees head == A, and its CAS **succeeds** — but the stack's internal state has changed completely, and A's \`next\` pointer now refers to a node that is no longer where Thread 1 believes. Nodes are lost or resurrected.

Note that ABA requires **node reuse**. Pure Java with fresh allocations is often accidentally safe because the GC will not recycle a node while a thread still references it — which is exactly why this bug appeared only once a free list was introduced. Explaining that GC usually masks ABA in Java is a strong point.

### The fixes
1. **Version stamping** — \`AtomicStampedReference\` pairs the reference with an int stamp incremented on every change. The CAS compares both, so A-with-stamp-1 never matches A-with-stamp-3. This is the direct, standard answer.
2. **\`AtomicMarkableReference\`** — a single boolean mark; enough for algorithms needing logical deletion (e.g. Harris's lock-free list).
3. **Do not reuse nodes.** Allocate fresh and let the GC handle reclamation. On the JVM this is usually the simplest correct choice, and TLAB allocation is cheap.
4. **Hazard pointers or epoch-based reclamation** — the general solutions in languages without GC. Worth naming to show you know why this problem is much harder in C++.

### Progress guarantees — precise definitions
* **Wait-free** — every thread completes in a bounded number of steps, regardless of others. Strongest, rarest.
* **Lock-free** — **at least one** thread makes progress. Individual threads may starve, so lock-free does *not* mean "no thread ever waits".
* **Obstruction-free** — a thread makes progress if it eventually runs without contention.

\`AtomicInteger.incrementAndGet\` is lock-free but not wait-free (its CAS loop can retry indefinitely). \`getAndAdd\` on x86 uses \`XADD\` and *is* wait-free — a nice illustration that the guarantee depends on the hardware primitive.

### When to go lock-free at all
Rarely. Under high contention, a CAS loop can perform **worse** than a lock: every failed attempt is a wasted cache-line transfer, and the contended line ping-pongs between cores. \`LongAdder\` outperforms \`AtomicLong\` under contention precisely by *avoiding* a single hot CAS target.

Prefer, in order: no shared state → \`java.util.concurrent\` primitives → a plain lock → hand-written lock-free code. Then verify with **jcstress**, because ordinary tests cannot explore the interleavings that break these algorithms.`,
    codeSnippet: `// Vulnerable to ABA when nodes are recycled
AtomicReference<Node> head = new AtomicReference<>();
Node old, next;
do { old = head.get(); next = old.next; } while (!head.compareAndSet(old, next));

// Stamped: the version makes A-then-A distinguishable
AtomicStampedReference<Node> head = new AtomicStampedReference<>(null, 0);
int[] stamp = new int[1];
Node old, next;
do {
    old = head.get(stamp);
    next = old.next;
} while (!head.compareAndSet(old, next, stamp[0], stamp[0] + 1));`,
    pitfalls: [
      'Believing lock-free means no thread ever waits.',
      'Assuming ABA cannot occur in Java without noting that it is the GC, not the algorithm, that usually prevents it.',
      'Hand-rolling lock-free structures where LongAdder or a lock would be faster and correct.',
      'Testing lock-free code with ordinary unit tests instead of jcstress.'
    ],
    followUpQuestions: [
      'Why does LongAdder beat AtomicLong under contention?',
      'How do hazard pointers solve reclamation without a GC?',
      'What is the difference between weak and strong compareAndSet in VarHandle?'
    ],
    faangFocus: 'A staff-level systems question. The observation that Java\'s GC usually hides ABA — and that a free list reintroduces it — is the standout insight.'
  },
  {
    id: 'conc-13',
    categoryId: 'concurrency',
    title: 'Coordination Primitives: Latch, Barrier, Semaphore and Phaser',
    difficulty: 'Solid',
    tags: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser'],
    scenario: 'A pipeline must: wait for 5 initialisation tasks before serving traffic, synchronise 8 worker threads at the end of each of 100 simulation rounds, and limit concurrent calls to a downstream API to 20.',
    question: 'Choose the right primitive for each and explain the semantics and failure modes of each.',
    idealAnswer: `### Initialisation gate → CountDownLatch
A **one-shot** counter. Threads \`await()\` until \`countDown()\` has been called N times. Once it reaches zero it stays there — it **cannot be reset**, which is precisely why it fits a one-time startup gate.

Failure modes: always \`countDown()\` in a \`finally\`, or a failed initialiser hangs every waiter forever. Always use the **timed** \`await(timeout, unit)\` in production so a stuck task becomes a diagnosable failure rather than a silent hang.

### Round synchronisation → CyclicBarrier
**Reusable.** N parties call \`await()\`; when the last arrives, all are released and the barrier **resets** for the next round. It also supports a **barrier action** — a \`Runnable\` executed by the last arriving thread before releasing the others, ideal for aggregating the round's results.

Critical failure mode: the barrier is **all-or-nothing**. If one party fails to arrive, everyone waiting gets \`BrokenBarrierException\` and the barrier is permanently broken until \`reset()\`. That is deliberate — a partial round is meaningless — but it means every \`await()\` needs proper exception handling.

Note the distinction interviewers probe: a latch counts **events** and any thread may count down; a barrier counts **parties** and each must arrive itself.

### Downstream limit → Semaphore
Holds N permits. \`acquire()\` blocks until one is free; \`release()\` returns it. With N = 20 you bound concurrency regardless of how many threads exist — which is exactly the control you need with virtual threads, where the thread count is no longer the limit.

Failure modes: release in a \`finally\`, or permits leak and the semaphore drains to zero permanently. Prefer \`tryAcquire(timeout)\` so overload fails fast instead of queueing unboundedly. Note a semaphore is **not reentrant** — acquiring twice on one thread deadlocks it against itself.

### The others worth knowing
* **Phaser** — a more flexible barrier: parties can **register and deregister dynamically**, and it supports multiple phases with \`arriveAndAwaitAdvance()\`. Use when the number of participants changes over the run, which \`CyclicBarrier\` cannot express.
* **Exchanger** — two threads swap objects at a rendezvous point.
* **\`CompletableFuture.allOf\`** — often a cleaner alternative to a latch when the tasks already return futures.
* **StructuredTaskScope** (Java 21+) — for request-scoped fan-out, this replaces most ad-hoc latch usage with guaranteed cancellation and cleanup.

### The general rule
Reach for \`java.util.concurrent\` before \`wait\`/\`notify\`. These primitives are correct, well-tested, interruptible and timed — hand-rolled coordination on intrinsic monitors is where the subtle bugs live.`,
    codeSnippet: `// One-shot startup gate — always timed, always countDown in finally
CountDownLatch ready = new CountDownLatch(5);
for (var task : initTasks) exec.submit(() -> {
    try { task.run(); } finally { ready.countDown(); }
});
if (!ready.await(30, TimeUnit.SECONDS)) throw new IllegalStateException("init timed out");

// Reusable round barrier, with an aggregation action
CyclicBarrier barrier = new CyclicBarrier(8, () -> results.publishRound());

// Bound downstream concurrency independently of thread count
Semaphore gate = new Semaphore(20);
if (!gate.tryAcquire(2, TimeUnit.SECONDS)) throw new OverloadedException();
try { api.call(); } finally { gate.release(); }`,
    pitfalls: [
      'Trying to reuse a CountDownLatch.',
      'Not releasing a semaphore permit in a finally block, leaking permits.',
      'Ignoring BrokenBarrierException and leaving a permanently broken barrier.',
      'Using untimed await() in production, turning a task failure into a silent hang.'
    ],
    followUpQuestions: [
      'What does Phaser offer that CyclicBarrier cannot?',
      'Why is a Semaphore not reentrant, and when does that bite?',
      'When is CompletableFuture.allOf clearer than a CountDownLatch?'
    ],
    faangFocus: 'A reliable mid-level concurrency question. The latch-counts-events vs barrier-counts-parties distinction is the one interviewers most often probe.'
  },
  {
    id: 'conc-14',
    categoryId: 'concurrency',
    title: 'Immutability and Safe Publication',
    difficulty: 'Hard',
    tags: ['Immutability', 'Safe Publication', 'Final Fields', 'Escape'],
    scenario: 'A configuration object with final fields is assigned to a non-volatile static field during startup. One thread occasionally observes a fully-constructed object with a null collection field, but only on ARM hardware.',
    question: 'Explain safe publication, the final-field guarantee and how it can be defeated, and why the failure is architecture-dependent.',
    idealAnswer: `### The publication problem
Creating an object is not atomic from another thread's perspective. \`config = new Config(...)\` involves allocation, field writes, and the reference store. Without an ordering constraint, the **compiler or the hardware may reorder the reference store before the field writes**, so another thread can see a non-null reference to a partially-initialised object.

### The final-field guarantee
The JMM gives a special guarantee: if an object's \`final\` fields are set in the constructor and \`this\` **does not escape** during construction, then any thread that sees a reference to the object is guaranteed to see the correctly-initialised final fields — **without any synchronisation**. This is implemented by a freeze action (a \`StoreStore\` barrier) at the end of the constructor.

### Why it failed anyway
Two possibilities, both worth naming:
1. **\`this\` escaped during construction** — registering a listener, starting a thread, or passing \`this\` to a callback inside the constructor. The freeze has not happened yet, so another thread can observe the object mid-construction. This is the most common cause and it silently voids the guarantee.
2. **A non-final field.** The guarantee covers final fields only. A blank final assigned outside the constructor, or a plain field, has no such protection.

### Why ARM and not x86
x86 has a **strong memory model**: stores are not reordered with other stores, so the missing barrier is invisible and the bug does not manifest. ARM and POWER are **weakly ordered** and freely reorder stores, exposing the race. This is why "it works on my laptop, it fails on Graviton" is a real category of bug — and why you cannot conclude correctness from testing on x86 alone.

### Safe publication — the four sanctioned mechanisms
1. Initialise the reference from a **static initialiser** (the classloading lock provides the ordering).
2. Store it in a **\`volatile\`** field or an \`AtomicReference\`.
3. Store it in a **\`final\`** field of a properly constructed object.
4. Guard it with a **lock** (write and read both synchronized).

For this scenario, making the static field \`volatile\`, or better, initialising it in a static initialiser or as a \`static final\`, fixes it.

### Why immutability is worth the effort
A genuinely immutable object — all fields final, no mutable state, no \`this\` escape, defensive copies of any mutable components — is **thread-safe for free**. No locks, no visibility reasoning, and it can be shared and cached freely. Records make this the path of least resistance.

But remember: immutability of the *container* does not imply immutability of what it references. \`List.copyOf\` in the constructor is what closes that gap.`,
    codeSnippet: `// Unsafe publication: reference store may be reordered before field writes
static Config config;                     // not volatile
config = new Config(load());              // another thread may see it half-built

// Safe: any of these
private static final Config CONFIG = new Config(load());   // static init
static volatile Config config;                             // volatile

// The escape that silently voids the final-field guarantee
public Config(Registry r) {
    this.hosts = List.copyOf(r.hosts());
    r.register(this);      // 'this' escapes BEFORE the freeze — never do this
}`,
    pitfalls: [
      'Letting `this` escape from a constructor, voiding the final-field guarantee.',
      'Assuming code correct on x86 is correct on ARM.',
      'Believing final fields make an object deeply immutable.',
      'Publishing through a plain non-volatile static field.'
    ],
    followUpQuestions: [
      'What exactly is the freeze action at the end of a constructor?',
      'How does the double-checked locking idiom rely on volatile for safe publication?',
      'Why does a static initialiser give safe publication for free?'
    ],
    faangFocus: 'A deep JMM question at companies running on ARM. The x86-vs-ARM explanation is what convinces interviewers you understand memory models rather than memorised rules.'
  },
  {
    id: 'conc-15',
    categoryId: 'concurrency',
    title: 'ReentrantLock, ReadWriteLock and StampedLock',
    difficulty: 'Hard',
    tags: ['ReentrantLock', 'ReadWriteLock', 'StampedLock', 'AQS'],
    scenario: 'A read-mostly geometry cache is guarded by `synchronized`. Under 64 reader threads it does not scale. A `ReentrantReadWriteLock` helps a little but writers occasionally starve for seconds.',
    question: 'Compare the lock implementations, explain AQS briefly, and describe when StampedLock\'s optimistic read is appropriate.',
    idealAnswer: `### Why synchronized does not scale for readers
An intrinsic monitor is strictly **exclusive**: readers block each other even though they conflict with nothing. With 64 readers you have fully serialised a workload that is inherently parallel.

Note that modern JVMs optimise uncontended \`synchronized\` heavily (and biased locking has been removed as of JDK 15+/18), so \`synchronized\` is excellent when uncontended — but under real contention it has no read parallelism to offer.

### ReentrantLock
Built on **AQS** (\`AbstractQueuedSynchronizer\`): an int state plus a CLH-style FIFO queue of waiting threads. It adds over \`synchronized\`:
* \`tryLock()\` and \`tryLock(timeout)\` — essential for deadlock avoidance.
* \`lockInterruptibly()\`.
* Multiple \`Condition\` objects per lock (\`synchronized\` has one wait set).
* Optional **fairness**.

Cost: you must \`unlock()\` in a \`finally\`. A missing unlock is a permanent hang.

### ReentrantReadWriteLock and writer starvation
Many readers or one writer. Under a continuous stream of readers, a non-fair RW lock can leave a writer waiting indefinitely — exactly the observed starvation.

* \`new ReentrantReadWriteLock(true)\` enables **fair mode**, which queues writers ahead of newly arriving readers. It fixes starvation at a real throughput cost.
* It supports **downgrading** (write → read) but **not upgrading** (read → write), which deadlocks. This is a very common bug.
* Overhead is significant: if critical sections are short, RW lock bookkeeping can cost more than the exclusive lock it replaces.

### StampedLock — the right tool here
Not reentrant, and does not implement \`Lock\`, but offers three modes:
* **Write** — exclusive, returns a stamp.
* **Read** — shared, returns a stamp.
* **Optimistic read** — \`tryOptimisticRead()\` returns a stamp **without acquiring anything**. You read the fields, then call \`validate(stamp)\`; if no write intervened, the read was valid. If validation fails, fall back to a real read lock.

For a read-mostly cache this is dramatically faster: the common path performs **no writes to shared state at all**, so there is no cache-line contention between readers. That is the fundamental reason it scales where a read lock does not — a read lock still mutates a shared counter.

**Rules for optimistic reads:** copy the fields into locals before validating, never dereference a value read optimistically without validating first (it may be torn or stale), and always provide the fallback path.

### Choosing
* Short critical section, low contention → \`synchronized\`. Simplest and fast.
* Need timeout, interruptibility or multiple conditions → \`ReentrantLock\`.
* Long read sections, moderate writes → \`ReentrantReadWriteLock\`, fair if writers starve.
* Very read-heavy, short reads → \`StampedLock\` with optimistic reads.
* Best of all → **remove the shared mutable state**: an immutable snapshot swapped atomically via \`AtomicReference\`, or a \`ConcurrentHashMap\`, needs no lock at all.`,
    codeSnippet: `private final StampedLock sl = new StampedLock();
private double x, y;

double distanceFromOrigin() {
    long stamp = sl.tryOptimisticRead();      // no shared write at all
    double cx = x, cy = y;                    // copy to locals FIRST
    if (!sl.validate(stamp)) {                // a writer intervened
        stamp = sl.readLock();
        try { cx = x; cy = y; } finally { sl.unlockRead(stamp); }
    }
    return Math.hypot(cx, cy);
}

// Or avoid locking entirely: swap an immutable snapshot
private final AtomicReference<Snapshot> snapshot = new AtomicReference<>(Snapshot.EMPTY);`,
    pitfalls: [
      'Attempting to upgrade a read lock to a write lock, which deadlocks.',
      'Using StampedLock reentrantly — it is not reentrant and will deadlock.',
      'Dereferencing optimistically-read values before validating the stamp.',
      'Reaching for a RW lock when critical sections are so short the overhead dominates.'
    ],
    followUpQuestions: [
      'How does AQS represent state and queue waiters?',
      'Why does a shared read lock still cause cache-line contention?',
      'When is an immutable snapshot swapped by AtomicReference better than any lock?'
    ],
    faangFocus: 'A strong senior question. Explaining that optimistic reads win because they write nothing to shared memory is the insight interviewers are listening for.'
  },
];
