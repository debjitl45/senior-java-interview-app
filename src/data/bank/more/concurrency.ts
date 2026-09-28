import type { Question } from '../../types';

/**
 * Concurrency, part two: a full ramp from "what is a thread" to
 * VarHandle memory modes and lock inflation.
 */
export const CONCURRENCY_MORE_QUESTIONS: Question[] = [
  {
    id: 'conc-16',
    categoryId: 'concurrency',
    title: 'Thread vs Runnable vs Callable',
    difficulty: 'Core',
    tags: ['Threads', 'Runnable', 'Callable', 'Basics'],
    scenario: "A junior developer extends `Thread` for every background job and calls `run()` to start it. The jobs run, but the UI thread freezes and there is no way to get a result back.",
    question: "What are the ways to create a unit of concurrent work in Java, what is wrong with calling `run()` directly, and when would you pick `Callable` over `Runnable`?",
    idealAnswer: `### Three shapes of work
* **Extending \`Thread\`** couples the task to the execution mechanism and burns your one superclass. Almost never the right choice.
* **\`Runnable\`** is a task with \`void run()\`. It cannot return a value or throw a checked exception.
* **\`Callable<V>\`** has \`V call() throws Exception\`. It returns a result and can throw, which surfaces through \`Future.get()\` as an \`ExecutionException\`.

### run() vs start()
\`start()\` asks the JVM to create a new OS (or virtual) thread which then invokes \`run()\`. Calling \`run()\` yourself is just an ordinary method call **on the current thread**, which is why the UI froze. Calling \`start()\` twice throws \`IllegalThreadStateException\`.

### What modern code does
Separate the **task** from the **execution policy**: write a \`Runnable\` or \`Callable\` and submit it to an \`ExecutorService\` (or \`Thread.ofVirtual().start(task)\` on Java 21+). The executor owns thread creation, reuse, naming and shutdown.`,
    codeSnippet: `Callable<Integer> task = () -> expensiveComputation();

try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
    Future<Integer> f = pool.submit(task);
    Integer result = f.get(2, TimeUnit.SECONDS);   // result or exception
}

// Wrong: runs on the calling thread
new Thread(task::call).run();`,
    pitfalls: [
      "Calling run() instead of start() and thinking the work is concurrent.",
      "Extending Thread when implementing Runnable would do.",
      "Creating raw threads per request instead of using an executor.",
    ],
    followUpQuestions: [
      "How does an exception thrown inside a Callable reach the caller?",
      "Why can't a Runnable throw a checked exception?",
      "What does Thread.ofVirtual() change about this picture?",
    ],
    faangFocus: "A warm-up. Interviewers use it to check you separate the task from the execution policy.",
  },
  {
    id: 'conc-17',
    categoryId: 'concurrency',
    title: 'Thread Lifecycle and States',
    difficulty: 'Core',
    tags: ['Threads', 'Thread States', 'Thread Dump'],
    scenario: "A thread dump shows 200 threads, some `BLOCKED`, many `WAITING`, a few `TIMED_WAITING`. The on-call engineer asks which ones are actually a problem.",
    question: "Walk through the `Thread.State` values, what moves a thread between them, and what each one usually means in a thread dump.",
    idealAnswer: `### The six states
| State | Meaning |
|---|---|
| \`NEW\` | Created, \`start()\` not called yet |
| \`RUNNABLE\` | Running **or** ready to run. Also covers threads blocked in native IO (socket reads show as RUNNABLE) |
| \`BLOCKED\` | Waiting to **enter** a \`synchronized\` block/method whose monitor another thread holds |
| \`WAITING\` | Parked indefinitely: \`Object.wait()\`, \`join()\`, \`LockSupport.park()\` (which \`ReentrantLock\` and queues use) |
| \`TIMED_WAITING\` | Same with a timeout: \`sleep\`, \`wait(ms)\`, \`parkNanos\`, \`poll(timeout)\` |
| \`TERMINATED\` | \`run()\` returned or threw |

### Reading a dump
* Many **BLOCKED** threads on the same monitor = lock contention; find the owner.
* Pool workers in **WAITING** on a queue's \`take()\` are idle and healthy.
* A thread **RUNNABLE** in \`SocketInputStream.read\` is waiting on the network, not burning CPU. The JVM cannot tell the difference.
* Note that a thread waiting on a \`ReentrantLock\` shows **WAITING (parking)**, not BLOCKED. BLOCKED is specific to intrinsic monitors.`,
    pitfalls: [
      "Assuming RUNNABLE means consuming CPU.",
      "Expecting ReentrantLock contention to appear as BLOCKED.",
      "Treating idle WAITING pool threads as a problem.",
    ],
    followUpQuestions: [
      "How would you find the thread that owns a contended monitor in a dump?",
      "Can a thread go from TERMINATED back to RUNNABLE?",
    ],
    faangFocus: "Checks you can read production evidence, not just recite the enum.",
  },
  {
    id: 'conc-18',
    categoryId: 'concurrency',
    title: 'synchronized: Monitors, Reentrancy and Scope',
    difficulty: 'Core',
    tags: ['synchronized', 'Monitor', 'Reentrancy', 'Locks'],
    scenario: "A class has a `synchronized` instance method and a `synchronized static` method that both update a shared counter. Updates are still being lost.",
    question: "What does `synchronized` actually lock on, what guarantees does it give, and why are the counter updates being lost?",
    idealAnswer: `### What gets locked
* A \`synchronized\` **instance method** locks \`this\`.
* A \`synchronized static\` method locks the **\`Class\` object**.
* A \`synchronized (obj)\` block locks \`obj\`.

Those are **different monitors**, so the instance and static methods can run at the same time and both mutate the counter. That is the bug: mutual exclusion only exists between code that locks the *same* object.

### Two guarantees, not one
1. **Mutual exclusion**: one thread at a time holds the monitor.
2. **Visibility**: releasing a monitor *happens-before* every later acquisition of the same monitor, so writes made inside are visible to the next holder.

### Reentrancy
Intrinsic locks are reentrant: a thread holding the monitor can re-enter it (e.g. one synchronized method calling another) without deadlocking itself. The JVM keeps a hold count.

### Good habits
* Lock on a \`private final Object lock\` rather than \`this\`, so external code cannot contend for your monitor.
* Keep the critical section small; never do IO while holding the lock.
* Never synchronize on a boxed \`Integer\`, a \`String\` literal or anything else that may be shared or reassigned.`,
    codeSnippet: `class Counter {
    private final Object lock = new Object();
    private long count;

    void increment() { synchronized (lock) { count++; } }
    long get()       { synchronized (lock) { return count; } }
}`,
    pitfalls: [
      "Mixing static and instance synchronized methods on the same state.",
      "Synchronizing writes but not reads, losing visibility.",
      "Locking on a field that is later reassigned.",
    ],
    followUpQuestions: [
      "Why is synchronizing on a String literal dangerous?",
      "What happens to the monitor if an exception is thrown inside the block?",
    ],
    faangFocus: "Basics, but the 'which object is locked' detail filters people out quickly.",
  },
  {
    id: 'conc-19',
    categoryId: 'concurrency',
    title: 'Race Conditions and Why count++ Is Not Atomic',
    difficulty: 'Core',
    tags: ['Race Condition', 'Atomicity', 'Critical Section'],
    scenario: "Ten threads each increment a shared `int` 1,000 times. The final value is sometimes 9,412, sometimes 9,871, never 10,000.",
    question: "Explain exactly why updates are lost and list three correct fixes, with trade-offs.",
    idealAnswer: `### count++ is three operations
\`count++\` compiles to **read** the field, **add** one, **write** it back. Two threads can both read 41, both compute 42 and both write 42. One increment is lost. This read-modify-write interleaving is a **race condition**; the code between the read and write is a **critical section**.

\`volatile\` does **not** help: it makes each read and write visible, but the three steps are still separate.

### Fixes
* **\`synchronized\`** around the increment: simple, correct, serialises threads.
* **\`AtomicInteger.incrementAndGet()\`**: a lock-free CAS loop. Great at low to moderate contention.
* **\`LongAdder\`**: stripes the count across cells so threads rarely collide; \`sum()\` adds them up. Best for hot counters written far more often than read.
* **Avoid sharing**: each thread counts locally and you combine at the end (what a parallel stream reduction does).

### The general lesson
Any **check-then-act** (\`if (!map.containsKey(k)) map.put(k, v)\`) or **read-modify-write** sequence needs to be atomic as a whole, not just step by step.`,
    codeSnippet: `// Broken
private volatile int count;
void inc() { count++; }

// Fixed
private final LongAdder count = new LongAdder();
void inc() { count.increment(); }
long total() { return count.sum(); }`,
    pitfalls: [
      "Believing volatile makes ++ atomic.",
      "Fixing the write but leaving an unsynchronised read.",
      "Using LongAdder where you need an exact, consistent snapshot on every read.",
    ],
    followUpQuestions: [
      "Why is LongAdder faster than AtomicLong under contention?",
      "Give another example of a check-then-act race outside of counters.",
    ],
    faangFocus: "The classic concurrency opener. Mentioning LongAdder and check-then-act lifts the answer above average.",
  },
  {
    id: 'conc-20',
    categoryId: 'concurrency',
    title: 'wait/notify vs sleep vs join',
    difficulty: 'Core',
    tags: ['wait', 'notify', 'sleep', 'join', 'Monitor'],
    scenario: "A developer replaces `Thread.sleep(100)` polling with `wait()` and immediately gets `IllegalMonitorStateException`.",
    question: "Compare `wait`, `sleep` and `join`. Why does `wait()` throw here, and why must it be called in a loop?",
    idealAnswer: `### The differences
| | \`Object.wait()\` | \`Thread.sleep()\` | \`Thread.join()\` |
|---|---|---|---|
| Needs the monitor? | **Yes** | No | No |
| Releases the monitor? | **Yes** | No, keeps any locks held | n/a |
| Woken by | \`notify\`/\`notifyAll\`, interrupt, timeout, spurious wakeup | Timeout or interrupt | Target thread terminating |

\`wait()\` must be called while holding the monitor of the object you wait on, otherwise \`IllegalMonitorStateException\`. The same rule applies to \`notify\`.

### Always wait in a loop
Threads can wake up **spuriously**, and by the time a notified thread reacquires the monitor another thread may have consumed the condition. So you re-check the condition:

\`\`\`java
synchronized (lock) {
    while (queue.isEmpty()) lock.wait();
    return queue.remove();
}
\`\`\`

### notify vs notifyAll
\`notify\` wakes one arbitrary waiter. If waiters wait for **different** conditions, the wrong one may be woken and the signal is lost. \`notifyAll\` is the safe default.

### In practice
Prefer \`BlockingQueue\`, \`CountDownLatch\` or \`Condition\` objects over raw \`wait/notify\`. Sleeping while holding a lock is almost always a bug.`,
    pitfalls: [
      "Using `if` instead of `while` around wait().",
      "Calling sleep() while holding a lock other threads need.",
      "Using notify() when waiters wait on different conditions.",
    ],
    followUpQuestions: [
      "What is a spurious wakeup and why does the JVM allow it?",
      "How does a Condition from ReentrantLock improve on wait/notify?",
    ],
    faangFocus: "Common in service-company interviews; the while-loop rule is the thing they are listening for.",
  },
  {
    id: 'conc-21',
    categoryId: 'concurrency',
    title: 'Daemon Threads and JVM Shutdown',
    difficulty: 'Core',
    tags: ['Daemon Threads', 'Shutdown', 'JVM'],
    scenario: "A CLI tool finishes `main()` but the process never exits. Another tool exits but its audit log is missing the last entries.",
    question: "What decides when the JVM exits, how do daemon threads fit in, and what explains both symptoms?",
    idealAnswer: `### When the JVM exits
The JVM exits when **all non-daemon threads have finished** (or \`System.exit\` is called, or a fatal signal arrives). Daemon threads do not keep it alive; when the last user thread ends they are abandoned mid-execution. No \`finally\` blocks run on them.

### Symptom 1: the process hangs
Something started a **non-daemon** thread and never stopped it, typically an \`ExecutorService\` created with \`Executors.newFixedThreadPool\` that was never shut down. Pool threads are non-daemon by default. Fix: \`shutdown()\` the executor (or use try-with-resources on Java 19+), or give it a daemon \`ThreadFactory\` if abandoning work is truly acceptable.

### Symptom 2: lost audit entries
The audit writer ran on a **daemon** thread with a buffer. When \`main\` finished, the JVM exited and the unflushed buffer died with it. Anything that must complete (flushing, committing, acknowledging) belongs on a non-daemon thread with an orderly shutdown, or in a shutdown hook.

### Setting it
\`thread.setDaemon(true)\` must be called **before** \`start()\`. A thread inherits the daemon status of its creator. Virtual threads are always daemon threads.`,
    pitfalls: [
      "Forgetting to shut down executors in short-lived programs.",
      "Doing critical IO on daemon threads.",
      "Calling setDaemon after start(), which throws IllegalThreadStateException.",
    ],
    followUpQuestions: [
      "What runs during a shutdown hook and what does not?",
      "Why are virtual threads always daemon threads?",
    ],
    faangFocus: "Quick check of JVM lifecycle knowledge that also shows up in real incident stories.",
  },
  {
    id: 'conc-22',
    categoryId: 'concurrency',
    title: 'ExecutorService Shutdown Done Right',
    difficulty: 'Core',
    tags: ['ExecutorService', 'Shutdown', 'Thread Pools'],
    scenario: "During a rolling deploy, in-flight jobs in an `ExecutorService` get cut off halfway and leave half-written records.",
    question: "Explain `shutdown`, `shutdownNow` and `awaitTermination`, and write a graceful shutdown routine.",
    idealAnswer: `### The three calls
* **\`shutdown()\`**: stop accepting new tasks; already-queued and running tasks continue. Returns immediately.
* **\`shutdownNow()\`**: stop accepting, **drain and return** the queued tasks, and **interrupt** running workers. Tasks that ignore interrupts keep running.
* **\`awaitTermination(timeout)\`**: block until all tasks finish or the timeout elapses.

### Graceful pattern
1. \`shutdown()\` so no new work arrives.
2. \`awaitTermination\` with a budget smaller than your platform's kill grace period (e.g. 20s of a 30s SIGTERM window).
3. If it times out, \`shutdownNow()\` and log what was dropped.
4. Preserve the interrupt if the waiting thread itself is interrupted.

Java 19+ \`ExecutorService\` is \`AutoCloseable\`; \`close()\` does steps 1-2 without a timeout.

### Making tasks shutdown-friendly
Half-written records mean the task was not **atomic or idempotent**. Check \`Thread.currentThread().isInterrupted()\` between units of work, commit in transactions, and make reprocessing safe.`,
    codeSnippet: `void stop(ExecutorService pool) {
    pool.shutdown();
    try {
        if (!pool.awaitTermination(20, TimeUnit.SECONDS)) {
            List<Runnable> dropped = pool.shutdownNow();
            log.warn("Dropped {} queued tasks", dropped.size());
            pool.awaitTermination(5, TimeUnit.SECONDS);
        }
    } catch (InterruptedException e) {
        pool.shutdownNow();
        Thread.currentThread().interrupt();
    }
}`,
    pitfalls: [
      "Calling shutdownNow() first and losing queued work.",
      "Waiting forever with no timeout during a deploy.",
      "Tasks that swallow InterruptedException and never stop.",
    ],
    followUpQuestions: [
      "How does Spring's ThreadPoolTaskExecutor expose this behaviour?",
      "What would you do with the list returned by shutdownNow()?",
    ],
    faangFocus: "A practical question that separates people who have run services from people who have only written them.",
  },
  {
    id: 'conc-23',
    categoryId: 'concurrency',
    title: 'Interruption and Cooperative Cancellation',
    difficulty: 'Core',
    tags: ['Interrupt', 'Cancellation', 'InterruptedException'],
    scenario: "A code review finds `catch (InterruptedException e) {}` in twelve places. Services now take minutes to shut down.",
    question: "How does thread interruption work in Java, and what is the correct way to handle `InterruptedException`?",
    idealAnswer: `### Interruption is a request, not a kill
\`thread.interrupt()\` sets a flag. Nothing stops the thread by force. The thread notices in one of two ways:
* Blocking methods (\`sleep\`, \`wait\`, \`join\`, \`BlockingQueue.take\`, \`Future.get\`) throw \`InterruptedException\` **and clear the flag**.
* Running code polls \`Thread.currentThread().isInterrupted()\`.

### Handling it correctly
Swallowing the exception erases the only signal that someone wants this thread to stop, which is why shutdown hangs. Pick one:
1. **Propagate** it: declare \`throws InterruptedException\`.
2. **Restore the flag** if you cannot throw: \`Thread.currentThread().interrupt()\`, then return or wrap.
3. Only swallow it if your code **owns the thread** and is deliberately choosing to exit.

### Non-interruptible blocking
Classic \`java.io\` socket reads and \`synchronized\` do not respond to interrupts. Use timeouts, close the resource from another thread, or use NIO channels (which are interruptible).

### Beware Thread.interrupted()
The static \`Thread.interrupted()\` **clears** the flag as it reads it. Use \`isInterrupted()\` when you only want to check.`,
    codeSnippet: `while (!Thread.currentThread().isInterrupted()) {
    try {
        Job job = queue.take();
        process(job);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // restore and exit the loop
    }
}`,
    pitfalls: [
      "Empty catch blocks for InterruptedException.",
      "Using Thread.interrupted() and accidentally clearing the flag.",
      "Expecting interrupt() to stop a thread blocked on a synchronized monitor.",
    ],
    followUpQuestions: [
      "How does Future.cancel(true) relate to interruption?",
      "Why did Thread.stop() get deprecated and removed?",
    ],
    faangFocus: "A strong signal of production maturity; many candidates have never thought about it.",
  },
  {
    id: 'conc-24',
    categoryId: 'concurrency',
    title: 'Future vs CompletableFuture',
    difficulty: 'Solid',
    tags: ['Future', 'CompletableFuture', 'Async'],
    scenario: "A service calls three downstream APIs using `executor.submit()` and then calls `get()` on each future in order. p99 latency is the sum of all three.",
    question: "What are the limits of `Future`, and how does `CompletableFuture` fix them? Rewrite the fan-out.",
    idealAnswer: `### Future is a handle you can only block on
\`Future\` offers \`get\`, \`isDone\` and \`cancel\`. There is no way to attach a callback, combine two futures or handle errors without blocking a thread. Calling \`get()\` in order is fine for fan-out (the calls do run in parallel), but any **dependent** step needs a thread parked on \`get()\`.

### CompletableFuture adds composition
* \`thenApply\` / \`thenCompose\` / \`thenCombine\` chain and join work without blocking.
* \`allOf\` / \`anyOf\` wait on groups.
* \`exceptionally\`, \`handle\`, \`whenComplete\` deal with failure in the pipeline.
* \`orTimeout\` / \`completeOnTimeout\` (Java 9+) add deadlines.
* It can be completed manually with \`complete()\`, which makes it a good bridge from callback APIs.

### About the sum-of-latencies symptom
If latency is the sum, the calls were actually serial, usually because each \`submit\` was followed immediately by \`get\`, or the executor had a single thread. Start all three, then join.

### Always pass an executor
The \`*Async\` methods default to \`ForkJoinPool.commonPool()\`, which is sized for CPU work. Blocking IO there starves every other user of the pool.`,
    codeSnippet: `var user   = CompletableFuture.supplyAsync(() -> users.get(id), ioPool);
var orders = CompletableFuture.supplyAsync(() -> orders.get(id), ioPool);
var promos = CompletableFuture.supplyAsync(() -> promos.get(id), ioPool)
        .completeOnTimeout(List.of(), 200, TimeUnit.MILLISECONDS);

Profile p = user.thenCombine(orders, Profile::new)
        .thenCombine(promos, Profile::withPromos)
        .orTimeout(1, TimeUnit.SECONDS)
        .join();`,
    pitfalls: [
      "Calling get() right after submit() and serialising the calls.",
      "Running blocking IO on the common pool.",
      "Losing exceptions because no stage handles them and nobody joins.",
    ],
    followUpQuestions: [
      "What is the difference between thenApply and thenCompose?",
      "How would virtual threads change this code?",
    ],
    faangFocus: "Standard backend question; the common-pool trap is the senior detail.",
  },
  {
    id: 'conc-25',
    categoryId: 'concurrency',
    title: 'ThreadPoolExecutor: Core, Max, Queue and Rejection',
    difficulty: 'Solid',
    tags: ['ThreadPoolExecutor', 'Rejection Policy', 'Thread Pools'],
    scenario: "A pool is configured with core=10, max=100 and an unbounded `LinkedBlockingQueue`. Under load it never grows past 10 threads and latency climbs to minutes.",
    question: "Explain the order in which `ThreadPoolExecutor` uses core threads, the queue and max threads, and why this pool never grows.",
    idealAnswer: `### The admission algorithm
When a task is submitted:
1. If fewer than **core** threads exist, start a new thread (even if others are idle).
2. Otherwise try to **offer it to the queue**.
3. If the queue rejects it (full), start a thread up to **max**.
4. If already at max, invoke the **RejectedExecutionHandler**.

With an unbounded queue step 2 never fails, so step 3 never happens. **maxPoolSize is ignored.** Tasks pile up in memory and latency grows without bound. This is exactly what \`Executors.newFixedThreadPool\` does.

### Rejection policies
* \`AbortPolicy\` (default): throw \`RejectedExecutionException\`.
* \`CallerRunsPolicy\`: the submitting thread runs the task, which naturally slows producers. A simple form of backpressure.
* \`DiscardPolicy\` / \`DiscardOldestPolicy\`: silently drop. Only for work that is safe to lose, and meter it.

### A sane configuration
Use a **bounded** queue sized from your latency budget, a max above core if you want burst capacity, a named \`ThreadFactory\`, and an explicit rejection policy. Expose queue depth and active count as metrics.`,
    codeSnippet: `var pool = new ThreadPoolExecutor(
        10, 50, 60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(500),
        Thread.ofPlatform().name("orders-", 0).factory(),
        new ThreadPoolExecutor.CallerRunsPolicy());`,
    pitfalls: [
      "Expecting max threads to kick in with an unbounded queue.",
      "Using a SynchronousQueue with a small max and getting rejections on every burst.",
      "Leaving the default AbortPolicy without handling the exception.",
    ],
    followUpQuestions: [
      "When would you choose a SynchronousQueue?",
      "How does allowCoreThreadTimeOut change behaviour?",
    ],
    faangFocus: "Very frequently asked; the queue-before-max ordering is the key insight.",
  },
  {
    id: 'conc-26',
    categoryId: 'concurrency',
    title: 'ThreadLocal: Uses and Hazards',
    difficulty: 'Solid',
    tags: ['ThreadLocal', 'Context Propagation', 'Memory Leak'],
    scenario: "Tenant IDs are stored in a `ThreadLocal`. Occasionally one customer sees another customer's data, and after moving some work to `CompletableFuture` the tenant is suddenly null.",
    question: "What is ThreadLocal good for, and explain both bugs.",
    idealAnswer: `### What it is for
\`ThreadLocal\` gives each thread its own copy of a value. Legitimate uses: per-thread caches of non-thread-safe objects (the classic \`SimpleDateFormat\`), and request context (security principal, trace IDs, tenant) in thread-per-request servers.

### Bug 1: data bleeding between customers
Server threads are **pooled**. If a request sets the tenant and never removes it, the next request on that thread inherits it when its own set is skipped or fails. Always clear in \`finally\`:
\`\`\`java
TENANT.set(id);
try { chain.doFilter(req, res); } finally { TENANT.remove(); }
\`\`\`
Stale values in long-lived pool threads are also a memory and classloader leak on redeploy.

### Bug 2: null tenant in async code
The value belongs to the thread that set it. \`supplyAsync\` runs on another thread that never saw it. Fixes: pass the context explicitly as a parameter, wrap tasks to capture and restore it (Spring's \`TaskDecorator\`, Micrometer context propagation), or on Java 21+ use **\`ScopedValue\`**, which is inherited by structured-concurrency subtasks.

### InheritableThreadLocal
Copies values to **child threads at creation**, which does nothing for pooled threads created long ago.`,
    pitfalls: [
      "Not calling remove() in pooled environments.",
      "Assuming ThreadLocal values follow work across executors.",
      "Using InheritableThreadLocal with thread pools.",
    ],
    followUpQuestions: [
      "How does ScopedValue differ from ThreadLocal?",
      "Why is ThreadLocal expensive with millions of virtual threads?",
    ],
    faangFocus: "Asked because it connects concurrency to real multi-tenant security incidents.",
  },
  {
    id: 'conc-27',
    categoryId: 'concurrency',
    title: 'Compound Actions on Thread-Safe Classes',
    difficulty: 'Solid',
    tags: ['Atomicity', 'ConcurrentHashMap', 'Check-Then-Act'],
    scenario: "A team switched from `HashMap` to `ConcurrentHashMap` and `Vector`, yet duplicate orders and lost updates still happen.",
    question: "Why doesn't using thread-safe collections make the code thread-safe? Show the atomic alternatives.",
    idealAnswer: `### Thread-safe operations are not thread-safe sequences
Each call on a concurrent collection is atomic. A **sequence** of calls is not. Between \`containsKey\` and \`put\` another thread can act.

\`\`\`java
if (!map.containsKey(k)) map.put(k, v);   // two threads can both put
int c = map.get(k); map.put(k, c + 1);    // lost update
if (!vector.isEmpty()) vector.remove(0);  // can throw
\`\`\`

### Atomic replacements on ConcurrentHashMap
* \`putIfAbsent(k, v)\` / \`computeIfAbsent(k, fn)\`: insert once.
* \`merge(k, 1, Integer::sum)\`: atomic counter per key.
* \`compute(k, (key, old) -> ...)\`: arbitrary read-modify-write on one key.
* \`replace(k, expected, newValue)\`: CAS on a value.

The remapping function runs while the bin is locked, so keep it **short and side-effect-free** and never touch other keys of the same map from inside it.

### When an operation spans several objects
If an invariant covers two maps, or a map and a counter, you need a lock around both (or a single immutable snapshot swapped atomically via \`AtomicReference\`).`,
    pitfalls: [
      "Believing a synchronized collection makes all client code safe.",
      "Doing slow IO inside compute() and blocking other writers on that bin.",
      "Recursively modifying the same ConcurrentHashMap inside computeIfAbsent.",
    ],
    followUpQuestions: [
      "What happens if computeIfAbsent's function returns null?",
      "How would you keep two maps consistent with each other?",
    ],
    faangFocus: "Tests whether you understand atomicity as a property of the whole operation.",
  },
  {
    id: 'conc-28',
    categoryId: 'concurrency',
    title: 'Implement Producer-Consumer With wait/notify',
    difficulty: 'Solid',
    tags: ['Producer-Consumer', 'wait', 'notify', 'Coding'],
    scenario: "Whiteboard round: 'Implement a bounded buffer with capacity N. put() blocks when full, take() blocks when empty. No java.util.concurrent.'",
    question: "Write it, and explain every design decision.",
    idealAnswer: `### Key decisions
* One lock (the buffer's monitor) guards all state.
* Each blocking method **waits in a while loop** on its own condition (full / empty), because of spurious wakeups and competing threads.
* Use **notifyAll**: producers and consumers wait on the same monitor for different conditions, so \`notify\` could wake the wrong kind of thread and lose the signal.
* A circular array avoids shifting elements.
* Methods throw \`InterruptedException\` so callers can cancel.

### In production
Use \`ArrayBlockingQueue\`, which does the same with a \`ReentrantLock\` and two \`Condition\`s (\`notEmpty\`, \`notFull\`), so it can signal only the relevant side.`,
    codeSnippet: `final class BoundedBuffer<T> {
    private final Object[] items;
    private int head, tail, count;

    BoundedBuffer(int capacity) { items = new Object[capacity]; }

    synchronized void put(T item) throws InterruptedException {
        while (count == items.length) wait();
        items[tail] = item;
        tail = (tail + 1) % items.length;
        count++;
        notifyAll();
    }

    @SuppressWarnings("unchecked")
    synchronized T take() throws InterruptedException {
        while (count == 0) wait();
        T item = (T) items[head];
        items[head] = null;              // let GC reclaim it
        head = (head + 1) % items.length;
        count--;
        notifyAll();
        return item;
    }
}`,
    pitfalls: [
      "Using if instead of while.",
      "Using notify() with mixed producers and consumers.",
      "Forgetting to null out the slot, holding references longer than needed.",
    ],
    followUpQuestions: [
      "Rewrite it with ReentrantLock and two Conditions.",
      "How would you add a timeout to take()?",
    ],
    faangFocus: "A classic coding exercise in concurrency rounds; correctness details matter more than speed.",
  },
  {
    id: 'conc-29',
    categoryId: 'concurrency',
    title: 'ScheduledExecutorService and the Silent Task Death',
    difficulty: 'Solid',
    tags: ['ScheduledExecutorService', 'Scheduling', 'Exceptions'],
    scenario: "A cache refresh scheduled with `scheduleAtFixedRate` every minute stopped running three days ago. No error was logged.",
    question: "Why did it stop, and how do `scheduleAtFixedRate` and `scheduleWithFixedDelay` differ?",
    idealAnswer: `### Why it stopped
If a periodic task **throws**, the executor suppresses all future executions. The exception is stored in the returned \`ScheduledFuture\`, which nobody ever calls \`get()\` on, so nothing is logged. One bad response from a downstream system killed the refresh forever.

Fix: catch \`Exception\` (or \`Throwable\` if you really mean it) inside the task, log it and carry on, and alert on the refresh age as a metric.

### Fixed rate vs fixed delay
* **\`scheduleAtFixedRate(task, 0, 60, SECONDS)\`**: aims for starts at 0, 60, 120... If a run takes longer than the period, the next run starts late but **runs never overlap**; missed runs happen back-to-back to catch up.
* **\`scheduleWithFixedDelay(task, 0, 60, SECONDS)\`**: waits 60s **after each run finishes**. Better for work of variable duration, like polling or refreshes.

### Other gotchas
* The default \`ScheduledThreadPoolExecutor\` has a fixed core size; a slow task delays every other task on it.
* For clustered apps, scheduling in every instance runs the job N times. Use a lock (ShedLock) or a single scheduler.`,
    codeSnippet: `scheduler.scheduleWithFixedDelay(() -> {
    try {
        cache.refresh();
    } catch (Exception e) {
        log.error("Cache refresh failed; will retry", e);
    }
}, 0, 1, TimeUnit.MINUTES);`,
    pitfalls: [
      "Letting exceptions escape a periodic task.",
      "Using fixed rate for tasks whose duration can exceed the period.",
      "Running one scheduler per instance in a cluster without coordination.",
    ],
    followUpQuestions: [
      "How does Spring's @Scheduled handle exceptions?",
      "How would you monitor that a scheduled job is still alive?",
    ],
    faangFocus: "A real-world failure mode that interviewers love because it is invisible until it hurts.",
  },
  {
    id: 'conc-30',
    categoryId: 'concurrency',
    title: 'Conditions: Multiple Wait Sets With ReentrantLock',
    difficulty: 'Solid',
    tags: ['Condition', 'ReentrantLock', 'Signalling'],
    scenario: "A bounded buffer built with `notifyAll` wakes 500 consumers every time a single item is produced, and CPU spikes.",
    question: "How do `Condition` objects solve this, and what are the rules for using them?",
    idealAnswer: `### One lock, many wait sets
An intrinsic monitor has exactly **one** wait set, so producers and consumers share it and you must \`notifyAll\`. A \`ReentrantLock\` can create any number of \`Condition\`s. A bounded buffer uses \`notFull\` and \`notEmpty\`, so a \`put\` signals **only consumers**, and only one of them.

### Rules
* Call \`await\`/\`signal\` only while holding the lock.
* Still **loop** on the condition predicate.
* Release the lock in \`finally\`.
* \`signal\` is safe here because each condition has one kind of waiter and each state change enables at most one of them.

### Extras over wait/notify
\`awaitNanos\` returns remaining time, \`awaitUninterruptibly\` exists, and \`lockInterruptibly\` / \`tryLock\` let you bail out of acquiring the lock.`,
    codeSnippet: `private final ReentrantLock lock = new ReentrantLock();
private final Condition notEmpty = lock.newCondition();
private final Condition notFull  = lock.newCondition();

void put(T x) throws InterruptedException {
    lock.lock();
    try {
        while (count == items.length) notFull.await();
        enqueue(x);
        notEmpty.signal();          // wake exactly one consumer
    } finally {
        lock.unlock();
    }
}`,
    pitfalls: [
      "Calling signal without holding the lock (IllegalMonitorStateException).",
      "Using signal when a waiter may be waiting for a different predicate.",
      "Forgetting unlock in finally.",
    ],
    followUpQuestions: [
      "When is signalAll still required with Conditions?",
      "Why is ArrayBlockingQueue implemented this way?",
    ],
    faangFocus: "Follow-up to producer-consumer; shows you understand why the j.u.c primitives exist.",
  },
  {
    id: 'conc-31',
    categoryId: 'concurrency',
    title: 'Exceptions That Vanish in Thread Pools',
    difficulty: 'Solid',
    tags: ['ExecutorService', 'Exceptions', 'UncaughtExceptionHandler'],
    scenario: "A task submitted with `executor.submit()` throws a `NullPointerException`. No stack trace appears anywhere. The same task passed to `execute()` does log it.",
    question: "Explain the difference between `execute` and `submit` for exceptions, and how to make failures visible.",
    idealAnswer: `### execute vs submit
* **\`execute(Runnable)\`**: the exception propagates out of the worker's run loop to the thread's \`UncaughtExceptionHandler\` (default: print to stderr). The worker thread dies and the pool replaces it.
* **\`submit(...)\`**: the task is wrapped in a \`FutureTask\`, which **catches everything** and stores it. You only see it when you call \`Future.get()\`, as an \`ExecutionException\`. If nobody calls \`get()\`, it is silently lost.

### Making failures visible
* Always consume the future, or use \`CompletableFuture\` with \`whenComplete\`/\`exceptionally\` that logs.
* Wrap tasks in a decorator that catches and logs.
* Override \`ThreadPoolExecutor.afterExecute(r, t)\`: \`t\` is non-null for \`execute\`; for \`submit\` you have to unwrap the \`Future\`.
* Set a \`ThreadFactory\` with a proper \`UncaughtExceptionHandler\` that logs through your logging framework, not stderr.`,
    codeSnippet: `ThreadFactory tf = Thread.ofPlatform()
        .name("worker-", 0)
        .uncaughtExceptionHandler((t, e) -> log.error("Uncaught in {}", t.getName(), e))
        .factory();`,
    pitfalls: [
      "Fire-and-forget submit() calls with no error handling.",
      "Relying on stderr output in containers where nobody reads it.",
      "Catching Throwable and swallowing Errors like OutOfMemoryError.",
    ],
    followUpQuestions: [
      "How does Spring's @Async handle exceptions from void methods?",
      "What does CompletableFuture do with an exception nobody observes?",
    ],
    faangFocus: "A realistic debugging question; many production bugs hide here.",
  },
  {
    id: 'conc-32',
    categoryId: 'concurrency',
    title: 'Atomic Classes, LongAdder and Accumulators',
    difficulty: 'Solid',
    tags: ['AtomicInteger', 'LongAdder', 'CAS', 'Contention'],
    scenario: "A metrics counter implemented with `AtomicLong` shows up as the top CPU hotspot on a 64-core machine.",
    question: "How do atomic classes work, why does AtomicLong degrade under contention, and when is LongAdder the answer?",
    idealAnswer: `### Atomics are CAS loops
\`incrementAndGet\` reads the value, computes the new one and does a **compare-and-swap**; if another thread changed it first, it retries. Modern JDKs use a single \`LOCK XADD\` instruction for increments on x86, but every core still fights for **the same cache line**, which bounces between cores. On 64 cores the counter becomes a serial bottleneck.

### LongAdder
Keeps a base value plus an array of padded **cells**. When CAS on the base fails, a thread moves to a cell picked by a per-thread probe hash. Contention spreads out, and \`sum()\` adds base plus cells.

Trade-offs:
* \`sum()\` is **not an atomic snapshot**; concurrent increments may or may not be included.
* More memory per counter.
* No \`compareAndSet\` or \`incrementAndGet\` returning the new value.

### Which to use
* **AtomicLong**: sequence numbers, IDs, anything needing the exact resulting value or CAS.
* **LongAdder**: statistics and metrics, written often, read rarely.
* **LongAccumulator**: same idea for max/min or any associative function.
* \`AtomicReference\` for swapping immutable objects; \`AtomicIntegerArray\` for per-slot atomics.`,
    pitfalls: [
      "Using LongAdder to generate unique IDs.",
      "Assuming atomics are free under heavy contention.",
      "Reading AtomicLong then setting it, instead of using updateAndGet.",
    ],
    followUpQuestions: [
      "How does @Contended padding help LongAdder's cells?",
      "When would updateAndGet's function be called more than once?",
    ],
    faangFocus: "Shows hardware-level awareness of contention, which senior roles expect.",
  },
  {
    id: 'conc-33',
    categoryId: 'concurrency',
    title: 'ForkJoinPool and Work Stealing',
    difficulty: 'Hard',
    tags: ['ForkJoinPool', 'Work Stealing', 'RecursiveTask', 'Parallelism'],
    scenario: "You need to sum 100 million numbers in a large array as fast as possible using all cores.",
    question: "Explain how ForkJoinPool's work stealing works, write a RecursiveTask for it, and name the ways people misuse the common pool.",
    idealAnswer: `### Work stealing
Each worker has its own **double-ended queue**. It pushes and pops subtasks at the **head** (LIFO, cache-friendly, no contention). Idle workers **steal from the tail** of other workers' deques, taking the oldest, usually largest, chunks. That keeps all cores busy with little coordination.

### Divide and conquer
Split until a chunk is below a **threshold** (big enough to amortise task overhead, typically thousands of elements), compute directly, then combine. The idiom is \`fork()\` one half, \`compute()\` the other on the current thread, then \`join()\` the forked one.

### Misuse of the common pool
The common pool (size = cores - 1) is shared by parallel streams, \`CompletableFuture.*Async\` without an executor, and anything else in the JVM.
* **Blocking IO** in it starves every other user.
* Very **small tasks** make overhead dominate.
* Calling \`join()\` in the wrong order (\`left.fork(); right.fork(); left.join()\`) wastes the current thread.

For blocking work in FJ, use \`ForkJoinPool.managedBlock\` or a dedicated pool.`,
    codeSnippet: `class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10_000;
    private final long[] a; private final int lo, hi;

    SumTask(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }

    @Override protected Long compute() {
        if (hi - lo <= THRESHOLD) {
            long s = 0;
            for (int i = lo; i < hi; i++) s += a[i];
            return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();
        long right = new SumTask(a, mid, hi).compute();
        return right + left.join();
    }
}
long total = ForkJoinPool.commonPool().invoke(new SumTask(data, 0, data.length));`,
    pitfalls: [
      "A threshold so small that task creation dominates.",
      "Blocking IO inside ForkJoin tasks.",
      "Forking both halves and joining on the current thread.",
    ],
    followUpQuestions: [
      "Why pop LIFO locally but steal FIFO?",
      "How is this related to parallel streams?",
    ],
    faangFocus: "Common in performance-focused interviews and a lead-in to parallel streams discussions.",
  },
  {
    id: 'conc-34',
    categoryId: 'concurrency',
    title: 'Which Thread Runs My CompletableFuture Callback?',
    difficulty: 'Hard',
    tags: ['CompletableFuture', 'Executors', 'Async'],
    scenario: "A `thenApply` step doing heavy JSON parsing ends up running on the Netty event loop thread and stalls every connection on it.",
    question: "Explain which thread executes `thenApply` vs `thenApplyAsync`, and how to control it.",
    idealAnswer: `### Non-async stages run 'wherever'
A \`thenApply(fn)\` callback runs on:
* the thread that **completes** the previous stage, if it was not complete when \`thenApply\` was registered, or
* the thread **registering** the callback, if the stage was already complete.

So if a Netty I/O thread completes the future, your parsing runs on the event loop. You cannot tell in advance which one it will be.

### Async stages
\`thenApplyAsync(fn)\` always hands the callback to an executor: the **common ForkJoinPool** by default, or the one you pass. Passing an executor is the only way to be explicit.

### Guidelines
* Cheap, non-blocking transforms: plain \`thenApply\` is fine and avoids a thread hop.
* CPU-heavy or blocking steps: \`thenApplyAsync(fn, dedicatedPool)\`.
* Never block (\`join\`, JDBC) inside a callback running on an event loop or the common pool.
* Context (MDC, security) does not follow the hop automatically; decorate the executor.`,
    codeSnippet: `httpClient.sendAsync(req, BodyHandlers.ofString())        // completes on HttpClient thread
    .thenApplyAsync(r -> parse(r.body()), cpuPool)         // explicit hop for heavy work
    .thenAccept(this::publish);                            // cheap, stays on cpuPool`,
    pitfalls: [
      "Assuming thenApply always runs on a background thread.",
      "Doing heavy work on I/O event loop threads.",
      "Using the default common pool for blocking callbacks.",
    ],
    followUpQuestions: [
      "How does Reactor's publishOn/subscribeOn compare?",
      "What happens to MDC logging context across these hops?",
    ],
    faangFocus: "Senior-level async question; the 'completing thread' answer is rarely given correctly.",
  },
  {
    id: 'conc-35',
    categoryId: 'concurrency',
    title: 'Thread Starvation Deadlock in a Bounded Pool',
    difficulty: 'Hard',
    tags: ['Deadlock', 'Thread Pools', 'Starvation'],
    scenario: "A report service has a fixed pool of 8 threads. Each report task submits 4 sub-tasks to the same pool and waits on them. Under load the service hangs with all threads in `WAITING` and zero CPU.",
    question: "What is happening and how do you fix it?",
    idealAnswer: `### Thread starvation deadlock
All 8 workers are running parent tasks. Each parent blocks on \`future.get()\` for children sitting in the **queue of the same pool**. No worker is free to run the children, so nobody makes progress. No lock is involved, so deadlock detectors do not flag it.

### Fixes
* **Separate pools** for parents and children (bulkhead by task level).
* **Do not block**: compose with \`CompletableFuture\` so the parent's continuation runs when children complete, freeing the worker in between.
* **ForkJoinPool**: \`join()\` in FJ helps by running queued tasks while waiting, so recursive decomposition does not starve.
* **Virtual threads**: blocking is cheap and there is no fixed worker count to exhaust (but limit downstream concurrency with a \`Semaphore\`).
* Size the pool so that max concurrent parents x children fits, which is fragile.

### Same pattern elsewhere
Any time a task waits on work scheduled onto a pool it is itself consuming, e.g. \`@Async\` methods calling other \`@Async\` methods and joining, or HTTP handlers calling their own service.`,
    pitfalls: [
      "Looking for a lock cycle when the resource exhausted is threads.",
      "'Fixing' it by making the pool larger until the next load spike.",
      "Nesting blocking joins inside CompletableFuture callbacks on the same executor.",
    ],
    followUpQuestions: [
      "How would you detect this in production?",
      "Why doesn't ForkJoinPool suffer from this for RecursiveTask?",
    ],
    faangFocus: "An excellent senior question because the answer isn't 'lock ordering'.",
  },
  {
    id: 'conc-36',
    categoryId: 'concurrency',
    title: 'Semaphores for Limiting Concurrency',
    difficulty: 'Hard',
    tags: ['Semaphore', 'Bulkhead', 'Rate Limiting', 'Virtual Threads'],
    scenario: "After switching to virtual threads, a service opens 5,000 simultaneous connections to a partner API that allows 50. The partner starts returning 429s.",
    question: "How do you cap concurrency to a downstream when threads are no longer the limiting resource? Discuss Semaphore semantics and pitfalls.",
    idealAnswer: `### The pool was the accidental limiter
With a 50-thread pool you could never have more than 50 in-flight calls. Virtual threads remove that cap, so you must limit **the resource** explicitly. A \`Semaphore(50)\` does exactly that.

### Semaphore semantics
* \`acquire()\` blocks until a permit is free; \`tryAcquire(timeout)\` lets you fail fast.
* Permits are **not owned** by threads. Any thread can release, and releasing without acquiring silently increases capacity, a common bug.
* Fair mode (\`new Semaphore(n, true)\`) gives FIFO ordering at some throughput cost.

### Pitfalls
* Always release in \`finally\`, but only if the acquire succeeded.
* Concurrency limit is not rate limiting: 50 concurrent fast calls can still be 5,000/s. Use a token bucket (Resilience4j \`RateLimiter\`, Guava) when the contract is requests per second.
* Prefer failing fast with a timeout over queueing forever; unbounded waiting just moves the queue.`,
    codeSnippet: `private final Semaphore partnerPermits = new Semaphore(50);

Response call(Request r) throws InterruptedException {
    if (!partnerPermits.tryAcquire(200, TimeUnit.MILLISECONDS)) {
        throw new BusyException("partner saturated");
    }
    try {
        return partner.send(r);
    } finally {
        partnerPermits.release();
    }
}`,
    pitfalls: [
      "Releasing a permit that was never acquired.",
      "Confusing a concurrency limit with a rate limit.",
      "Relying on pool size as a hidden limiter and losing it on migration.",
    ],
    followUpQuestions: [
      "How does Resilience4j's Bulkhead implement this?",
      "How would you coordinate a limit across 20 instances?",
    ],
    faangFocus: "Very topical with Loom adoption; shows system-level thinking.",
  },
  {
    id: 'conc-37',
    categoryId: 'concurrency',
    title: 'Fair vs Unfair Locks and Starvation',
    difficulty: 'Hard',
    tags: ['Fairness', 'ReentrantLock', 'Starvation', 'Throughput'],
    scenario: "Someone suggests making every `ReentrantLock` fair 'to be safe'. Throughput of the order service drops by 10x in a benchmark.",
    question: "Why are locks unfair by default, what does fairness cost, and when is it worth it?",
    idealAnswer: `### Barging
With an **unfair** lock, a thread arriving just as the lock is released can grab it immediately (barging) instead of waiting behind queued threads. The queued thread would first need to be **woken and scheduled**, which takes microseconds; the running thread is already on a CPU with warm caches. Barging keeps the lock busy and throughput high.

### Fairness costs
A **fair** lock hands the lock to the longest-waiting thread. Every handoff now includes a context switch and wake-up latency, so the lock sits idle during transitions. Throughput drops dramatically under contention.

### When fairness matters
* Long critical sections where starvation of some callers is a real risk.
* Latency SLAs where tail latency matters more than throughput.
* Even then, prefer reducing contention (sharding, shorter critical sections) over fairness.

### Notes
* \`synchronized\` is unfair and has no fair option.
* Fair \`tryLock()\` without a timeout **still barges**; \`tryLock(0, unit)\` respects fairness.
* Fair locks do not guarantee fair **thread scheduling** by the OS.`,
    pitfalls: [
      "Making locks fair by default.",
      "Believing fairness removes all starvation.",
      "Not measuring contention before tuning locks.",
    ],
    followUpQuestions: [
      "What is priority inversion and how does it relate to fairness?",
      "How would you detect lock starvation in production?",
    ],
    faangFocus: "Checks that you reason about locks in terms of scheduling costs, not just correctness.",
  },
  {
    id: 'conc-38',
    categoryId: 'concurrency',
    title: 'Lazy Initialization: Holder Idiom, Enum and DCL',
    difficulty: 'Hard',
    tags: ['Singleton', 'Lazy Initialization', 'Double-Checked Locking'],
    scenario: "A code review asks you to make an expensive, lazily-created singleton thread-safe without synchronizing every call.",
    question: "Compare the options for thread-safe lazy initialization and when each is appropriate.",
    idealAnswer: `### 1. Eager static field
\`private static final Foo INSTANCE = new Foo();\` Class initialization is thread-safe by the JLS and the class is only initialized on first use anyway. Often lazy enough.

### 2. Initialization-on-demand holder
A nested static class holds the instance. The JVM initializes \`Holder\` on first access to \`Holder.INSTANCE\`, under the class init lock, and afterwards reads are plain and fast. The best choice for **static** lazy singletons.

### 3. Enum singleton
Thread-safe, serialization-safe and reflection-safe. Awkward if the singleton needs to extend a class or be lazy with parameters.

### 4. Double-checked locking
Needed for **instance fields** (lazy per-object state), where the holder idiom does not apply. The field **must be volatile**; without it another thread may see the reference before the constructor's writes. Read the volatile once into a local.

### 5. Just let the framework do it
In Spring, a singleton bean with \`@Lazy\` is usually the real answer.`,
    codeSnippet: `// Holder idiom
public final class Registry {
    private Registry() {}
    private static class Holder { static final Registry INSTANCE = new Registry(); }
    public static Registry get() { return Holder.INSTANCE; }
}

// DCL for an instance field
private volatile Parser parser;
Parser parser() {
    Parser p = parser;
    if (p == null) {
        synchronized (this) {
            p = parser;
            if (p == null) parser = p = new Parser();
        }
    }
    return p;
}`,
    pitfalls: [
      "DCL without volatile.",
      "Synchronizing the whole getter when the holder idiom would do.",
      "Lazy init that throws leaves the holder class in an erroneous state (NoClassDefFoundError afterwards).",
    ],
    followUpQuestions: [
      "Why does reading the volatile into a local help performance?",
      "How does the enum singleton defend against reflection?",
    ],
    faangFocus: "A long-standing favourite; strong candidates explain the JLS class-init guarantee.",
  },
  {
    id: 'conc-39',
    categoryId: 'concurrency',
    title: 'Weakly Consistent Iterators in Concurrent Collections',
    difficulty: 'Hard',
    tags: ['Iterators', 'ConcurrentHashMap', 'CopyOnWriteArrayList'],
    scenario: "A job iterates over a `ConcurrentHashMap` of sessions while other threads add and remove entries. A teammate asks whether the job can crash or miss entries.",
    question: "Compare fail-fast, weakly consistent and snapshot iterators and what they guarantee.",
    idealAnswer: `### Fail-fast (HashMap, ArrayList)
Track a \`modCount\`; detect structural modification during iteration and throw \`ConcurrentModificationException\` on a best-effort basis. Meant to catch bugs, not to provide safety.

### Weakly consistent (ConcurrentHashMap, ConcurrentLinkedQueue, ConcurrentSkipListMap)
* Never throw CME.
* Each element is returned **at most once**.
* Reflect the state at some point at or after iterator creation: entries added or removed during iteration **may or may not** be seen.
* \`size()\` is an estimate under concurrent updates.

So the job cannot crash, but it may miss a session added mid-iteration, or process one being removed.

### Snapshot (CopyOnWriteArrayList, CopyOnWriteArraySet)
The iterator walks the **array as it was** when the iterator was created. Perfectly stable, but it never sees later changes, and \`iterator.remove()\` is unsupported. Every write copies the array, so only for read-mostly data like listener lists.

### When you need a consistent view
Take an explicit snapshot under a lock, or design state as immutable objects swapped atomically.`,
    pitfalls: [
      "Assuming a CHM iteration is a point-in-time snapshot.",
      "Using CopyOnWriteArrayList for write-heavy data.",
      "Relying on size() of a concurrent map for control logic.",
    ],
    followUpQuestions: [
      "How does ConcurrentHashMap's forEach(parallelismThreshold, ...) work?",
      "Why does CopyOnWriteArrayList suit event listener lists?",
    ],
    faangFocus: "Tests precise knowledge of collection guarantees under concurrency.",
  },
  {
    id: 'conc-40',
    categoryId: 'concurrency',
    title: 'Graceful Shutdown of a Queue Worker',
    difficulty: 'Hard',
    tags: ['Shutdown', 'Poison Pill', 'Kubernetes', 'Workers'],
    scenario: "A Kubernetes pod running message workers gets SIGTERM during deploys. Messages are sometimes processed twice and sometimes lost.",
    question: "Design the shutdown sequence for a pool of worker threads consuming from a queue.",
    idealAnswer: `### The sequence
1. **Stop intake**: on SIGTERM (shutdown hook, Spring \`SmartLifecycle.stop\`), stop polling the broker / mark readiness false so no new work arrives.
2. **Signal workers**: set a volatile \`running = false\`, enqueue a **poison pill** per worker, or interrupt them. Poison pills guarantee workers drain everything queued before them.
3. **Drain with a deadline**: wait for in-flight work, bounded by the pod's \`terminationGracePeriodSeconds\` minus a margin.
4. **Commit acknowledgements** only after processing completes (at-least-once), then close the consumer.
5. **Force stop** what remains and let redelivery handle it.

### Why messages were lost or duplicated
* **Lost**: messages were acked on receipt and still in the local queue when the JVM exited.
* **Duplicated**: work finished but the ack/offset commit never happened before exit. Unavoidable in the limit, so handlers must be **idempotent**.

### Details
* Shutdown hooks run concurrently and must not block forever.
* Kubernetes sends SIGTERM in parallel with endpoint removal; add a short preStop sleep so traffic stops first.`,
    codeSnippet: `private static final Job POISON = new Job(null);

void stop() throws InterruptedException {
    consumer.pause();                             // 1. stop intake
    for (int i = 0; i < workers; i++) queue.put(POISON);   // 2. signal
    if (!pool.awaitTermination(25, SECONDS)) pool.shutdownNow();   // 3. drain
}

// worker loop
for (Job j; (j = queue.take()) != POISON; ) { process(j); ack(j); }`,
    pitfalls: [
      "Acking before processing.",
      "No deadline, so the pod is SIGKILLed mid-work anyway.",
      "Non-idempotent handlers in an at-least-once system.",
    ],
    followUpQuestions: [
      "How do Kafka consumer rebalances interact with shutdown?",
      "How would you test the shutdown path?",
    ],
    faangFocus: "A realistic operations question that blends concurrency with distributed-systems guarantees.",
  },
  {
    id: 'conc-41',
    categoryId: 'concurrency',
    title: 'Timeouts and Cancellation With Futures',
    difficulty: 'Hard',
    tags: ['Timeouts', 'Cancellation', 'CompletableFuture'],
    scenario: "A service uses `future.get(1, SECONDS)` and catches `TimeoutException`, but thread count keeps growing and the downstream still receives the slow requests.",
    question: "What does a timeout on a future actually stop? Compare `Future.cancel`, `orTimeout` and `completeOnTimeout`.",
    idealAnswer: `### A timeout stops the waiting, not the work
\`get(timeout)\` only stops **the caller** from waiting. The task keeps running and holding its thread and connection. That is why threads accumulate.

### Future.cancel(mayInterrupt)
For a \`FutureTask\`, \`cancel(true)\` interrupts the running thread. It helps only if the task responds to interrupts (blocking IO in \`java.io\` often does not).

### CompletableFuture is different
\`cf.cancel(true)\` just completes the CF exceptionally with \`CancellationException\`. It **does not interrupt** the thread computing it; the CF has no link to that thread.
* \`orTimeout(d)\`: completes exceptionally with \`TimeoutException\` after d.
* \`completeOnTimeout(value, d)\`: completes with a fallback value.
Neither stops the underlying computation.

### Actually stopping work
Push the deadline **into the call**: HTTP client read/connect timeouts, JDBC query timeouts, gRPC deadlines. Propagate deadline budgets downstream so the whole chain stops. Structured concurrency cancels sibling subtasks by interrupting their threads.`,
    pitfalls: [
      "Believing a timed-out future stops the task.",
      "Expecting CompletableFuture.cancel to interrupt anything.",
      "Missing client-level timeouts on IO calls.",
    ],
    followUpQuestions: [
      "How would you propagate a deadline across three service hops?",
      "How does StructuredTaskScope handle cancellation?",
    ],
    faangFocus: "Separates people who know APIs from people who have debugged resource leaks under timeouts.",
  },
  {
    id: 'conc-42',
    categoryId: 'concurrency',
    title: 'Thread Confinement and Stack Confinement',
    difficulty: 'Solid',
    tags: ['Thread Confinement', 'Thread Safety', 'Design'],
    scenario: "A reviewer asks why a method that uses a non-thread-safe `StringBuilder` and `ArrayList` needs no synchronization even though it runs on 200 threads.",
    question: "Explain thread confinement and how it makes code thread-safe without locks.",
    idealAnswer: `### The easiest thread safety is not sharing
If only one thread can ever reach an object, it does not need to be thread-safe.

### Stack confinement
Objects referenced only from **local variables** live on one thread's stack. Each invocation gets its own \`StringBuilder\` and \`ArrayList\`; 200 threads means 200 separate objects. This is safe **as long as the reference never escapes**: not stored in a field, not returned into shared structures, not captured by a lambda handed to another thread.

### Thread confinement by design
* Swing/JavaFX: UI objects are touched only from the event thread.
* Actor-style or event-loop designs (Netty channel handlers, Vert.x verticles): state is owned by one thread and messages are passed to it.
* \`ThreadLocal\`: each thread holds its own instance.

### The escape trap
Confinement is a convention the compiler does not check. Returning an internal mutable list, or publishing \`this\` from a constructor, silently breaks it.`,
    pitfalls: [
      "Assuming confinement holds after passing the object to an executor.",
      "Publishing 'this' from a constructor.",
      "Caching a local object in a static field 'for performance'.",
    ],
    followUpQuestions: [
      "How does Netty guarantee a channel handler runs on one thread?",
      "What is 'escape' in the JIT's escape analysis, and how is it related?",
    ],
    faangFocus: "Shows you think about safety by design rather than by adding locks.",
  },
  {
    id: 'conc-43',
    categoryId: 'concurrency',
    title: 'Migrating a Service to Virtual Threads: What Breaks',
    difficulty: 'Expert',
    tags: ['Virtual Threads', 'Migration', 'Pinning', 'Loom'],
    scenario: "Leadership wants the Spring Boot MVC fleet on virtual threads next quarter. You are asked for a risk assessment.",
    question: "What changes, what can break, and how do you roll it out safely?",
    idealAnswer: `### What you gain
Blocking IO no longer holds an OS thread. A thread-per-request app can run tens of thousands of concurrent requests with no reactive rewrite. In Spring Boot 3.2+ it is \`spring.threads.virtual.enabled=true\`.

### What can break
* **Hidden limiters disappear**: the Tomcat pool of 200 was implicitly capping DB and downstream load. Now the connection pool becomes the queue (timeouts) or partners get flooded. Add explicit \`Semaphore\`s/bulkheads.
* **Pinning**: before JDK 24 (JEP 491), blocking inside \`synchronized\` pinned the carrier thread; enough of those and the scheduler stalls. Check libraries (old JDBC drivers, some caches). On JDK 21-23 switch hot paths to \`ReentrantLock\`; detect with \`jdk.VirtualThreadPinned\` JFR events.
* **ThreadLocal-heavy code**: per-thread caches (e.g. object pools, large buffers) now multiply by millions of threads, and reuse disappears. Replace with \`ScopedValue\` or explicit context.
* **Pooling virtual threads** is an anti-pattern; create one per task.
* **CPU-bound work** gains nothing; keep it on a sized platform pool.
* Native calls/JNI pin the carrier.

### Rollout
Upgrade JDK first (24+ ideally), enable on one service behind a flag, load test with production-like downstream limits, watch carrier pool utilisation, pinning events, connection pool wait time and downstream error rates, then expand.`,
    pitfalls: [
      "Treating virtual threads as a free performance boost for CPU work.",
      "Losing the implicit concurrency limit of the old thread pool.",
      "Ignoring ThreadLocal caches that assumed a small number of threads.",
    ],
    followUpQuestions: [
      "What exactly did JEP 491 change about synchronized?",
      "How do you observe carrier thread saturation?",
    ],
    faangFocus: "A current, high-signal Staff question: it tests migration judgement, not API trivia.",
  },
  {
    id: 'conc-44',
    categoryId: 'concurrency',
    title: 'VarHandle Access Modes: Plain, Opaque, Acquire/Release, Volatile',
    difficulty: 'Master',
    tags: ['VarHandle', 'Memory Ordering', 'JMM', 'Lock-Free'],
    scenario: "A lock-free queue in a low-latency trading system uses volatile everywhere. A performance engineer proposes switching some accesses to `setRelease` / `getAcquire`.",
    question: "Explain the VarHandle memory access modes and when weaker modes are correct.",
    idealAnswer: `### The ladder, weakest to strongest
| Mode | Guarantees |
|---|---|
| **Plain** | Like a normal field access. No ordering, may be reordered, may even be torn for long/double |
| **Opaque** | Atomic, coherent per variable, never optimised away, but no ordering relative to other variables. Good for progress flags and stats |
| **Acquire / Release** | \`setRelease\` ensures all earlier writes are visible before this write; \`getAcquire\` ensures later reads happen after it. Enough for **message passing** (publish data, then set a flag) |
| **Volatile** | Sequentially consistent: acquire/release **plus** a total order over all volatile accesses, which costs a full fence (\`StoreLoad\`) on x86 |

### When release/acquire suffices
Single-producer queues and publication patterns: the producer writes the slot then \`setRelease\`s the index; the consumer \`getAcquire\`s the index then reads the slot. There is no need for global ordering, so the expensive StoreLoad fence after a volatile store can be skipped. On x86 \`setRelease\` compiles to a plain store.

### When you need volatile
When correctness depends on a **store followed by a load of a different variable** being ordered, as in Dekker's algorithm or some flag handshakes. Release/acquire allow that reordering.

### Advice
Use these only with a proof or a well-known algorithm, test with jcstress, and document every access. The savings are nanoseconds; the bugs are months.`,
    codeSnippet: `private static final VarHandle TAIL;
static {
    try { TAIL = MethodHandles.lookup().findVarHandle(Ring.class, "tail", long.class); }
    catch (ReflectiveOperationException e) { throw new ExceptionInInitializerError(e); }
}
void publish(long seq, Event e) {
    buffer[(int) (seq & mask)] = e;   // plain write
    TAIL.setRelease(this, seq);       // publish: earlier writes visible first
}`,
    pitfalls: [
      "Using acquire/release for Dekker-style store-then-load protocols.",
      "Optimising without jcstress tests.",
      "Assuming x86 behaviour holds on ARM.",
    ],
    followUpQuestions: [
      "What is the StoreLoad barrier and why is it the expensive one?",
      "What does lazySet on AtomicLong correspond to?",
    ],
    faangFocus: "Only for low-latency or JDK-level roles, but a clear top-tier signal when answered well.",
  },
  {
    id: 'conc-45',
    categoryId: 'concurrency',
    title: 'Designing a Lock-Free Ring Buffer (Disruptor Style)',
    difficulty: 'Master',
    tags: ['Disruptor', 'Ring Buffer', 'Lock-Free', 'Mechanical Sympathy'],
    scenario: "A market data pipeline needs to move 10 million events per second between threads with sub-microsecond latency. `ArrayBlockingQueue` is too slow.",
    question: "Explain the design choices behind an LMAX Disruptor-style ring buffer and why it beats a blocking queue.",
    idealAnswer: `### Why blocking queues are slow here
A lock per operation, head and tail on the **same cache line** (false sharing), allocation of nodes (linked queues), and park/unpark syscalls to wake consumers.

### The design
* **Pre-allocated ring** of mutable event objects, power-of-two size so \`seq & mask\` replaces modulo. No allocation, no GC.
* **Sequences instead of locks**: the producer claims a sequence number (a plain increment for a single producer, CAS for multiple) and publishes with a release store. Consumers track their own sequence.
* **Padding** around every sequence to avoid false sharing.
* **Batching**: a consumer that falls behind reads all available events up to the published cursor in one go, which amortises the synchronisation.
* **Pluggable wait strategies**: busy-spin (lowest latency, burns a core), yield, or blocking (lowest CPU).
* **Dependency graph**: consumers can gate on other consumers' sequences, giving pipelines without queues between stages.
* Producer must not overwrite slots not yet consumed: it checks the **minimum gating sequence** before wrapping.

### Trade-offs
Fixed capacity, busy-spinning costs cores, and the programming model is unusual. Worth it only when latency really is in microseconds.`,
    pitfalls: [
      "Forgetting padding and reintroducing false sharing.",
      "Busy-spin waiting on shared or oversubscribed hardware.",
      "Letting the producer lap slow consumers.",
    ],
    followUpQuestions: [
      "How does multi-producer claiming work without locking?",
      "How would you apply back-pressure with this design?",
    ],
    faangFocus: "HFT and low-latency teams; shows mechanical sympathy thinking.",
  },
  {
    id: 'conc-46',
    categoryId: 'concurrency',
    title: 'Final Fields and the this-Escape Problem',
    difficulty: 'Expert',
    tags: ['final', 'Safe Publication', 'Constructor', 'JMM'],
    scenario: "An immutable `Config` object with only `final` fields is registered as a listener inside its own constructor. Another thread occasionally sees null fields.",
    question: "What does the JMM guarantee for final fields, and why does that guarantee fail here?",
    idealAnswer: `### The final-field guarantee
If an object is **properly constructed**, any thread that obtains a reference to it sees the correctly initialised values of its \`final\` fields (and objects reachable through them as of the end of the constructor), even if the reference was published through a data race. This is why truly immutable objects are thread-safe without synchronization.

### "Properly constructed" means this did not escape
The guarantee is a **freeze** at the end of the constructor. If \`this\` is published before the constructor finishes (registering a listener, starting a thread, storing into a static field, calling an overridable method), another thread can see the object **before the freeze** and read default values.

### Common escape routes
* \`eventBus.register(this)\` in the constructor.
* \`new Thread(this::run).start()\` in the constructor.
* Inner class or lambda instances that capture \`this\`, handed out during construction.
* Calling an overridable method that a subclass uses to publish \`this\`.

### Fix
Construct fully, then publish, e.g. a static factory: create, then register. Start threads in a separate \`start()\` method. JDK 21 added a \`-Xlint:this-escape\` javac warning for exactly this.`,
    codeSnippet: `public final class Config implements Listener {
    private final Map<String, String> values;

    private Config(Map<String, String> v) { this.values = Map.copyOf(v); }

    public static Config create(Map<String, String> v, EventBus bus) {
        Config c = new Config(v);
        bus.register(c);        // published after construction completes
        return c;
    }
}`,
    pitfalls: [
      "Believing final fields are safe no matter how the object is published.",
      "Starting threads from constructors.",
      "Mutable objects referenced by final fields being modified after construction.",
    ],
    followUpQuestions: [
      "Why are String and the boxed types safe to share via a data race?",
      "What does -Xlint:this-escape detect?",
    ],
    faangFocus: "Expert JMM question; strong candidates tie it to immutability and safe publication.",
  },
  {
    id: 'conc-47',
    categoryId: 'concurrency',
    title: 'ConcurrentHashMap Internals (Java 8+)',
    difficulty: 'Expert',
    tags: ['ConcurrentHashMap', 'CAS', 'Internals', 'Resizing'],
    scenario: "An interviewer says: 'Segments are gone since Java 8. So how does ConcurrentHashMap allow concurrent writes now?'",
    question: "Explain how CHM achieves thread safety in Java 8+, including reads, writes, resizing and size().",
    idealAnswer: `### Reads are lock-free
The table is an array of bins read with volatile semantics (\`Unsafe\`/VarHandle \`getAcquire\`). Node \`val\` and \`next\` fields are volatile. \`get\` never locks.

### Writes lock per bin
* Empty bin: insert the first node with a **CAS**; no lock at all.
* Non-empty bin: \`synchronized\` on the **head node** of that bin only. Writers to different bins proceed in parallel. Lock granularity is one bucket, much finer than the old 16 segments.
* Long bins (8+ entries with table size 64+) become **red-black trees** (\`TreeBin\`) to bound lookup cost.

### Cooperative resizing
When the table grows, a new array is allocated and bins are moved in **strides**. Moved bins are replaced by a \`ForwardingNode\` pointing to the new table. Other threads that hit a forwarding node during a write **help transfer** instead of waiting; readers follow it to the new table.

### size() without a global counter
A single \`AtomicLong\` would be a hotspot, so CHM uses a \`baseCount\` plus \`CounterCell[]\`, the same striping idea as \`LongAdder\`. \`size()\`/\`mappingCount()\` sum them, which is why it is an estimate under concurrent updates.

### Why nulls are forbidden
\`get(k) == null\` must unambiguously mean 'absent'. With concurrency you cannot follow up with \`containsKey\` atomically.`,
    pitfalls: [
      "Describing the pre-Java-8 segment design as current.",
      "Assuming size() is exact during concurrent writes.",
      "Doing long work in compute(), holding the bin lock.",
    ],
    followUpQuestions: [
      "What is the sizeCtl field used for?",
      "Why does CHM use synchronized rather than ReentrantLock for bins?",
    ],
    faangFocus: "Frequently asked at product companies; the forwarding-node and counter-cell details signal depth.",
  },
  {
    id: 'conc-48',
    categoryId: 'concurrency',
    title: 'Implement a Thread-Safe Token Bucket Rate Limiter',
    difficulty: 'Expert',
    tags: ['Rate Limiting', 'Token Bucket', 'CAS', 'Coding'],
    scenario: "Live coding: 'Implement `boolean tryAcquire()` for a rate limiter allowing 100 requests per second with bursts up to 100. It will be called from thousands of threads.'",
    question: "Implement it lock-free, and explain correctness and the design decisions.",
    idealAnswer: `### The algorithm
A bucket holds up to \`capacity\` tokens and refills at \`rate\` per second. Each request takes a token or is rejected.

### Lazy refill instead of a timer thread
Store \`(tokens, lastRefillNanos)\`. On each call compute how many tokens accrued since the last refill. No background thread needed.

### Lock-free with an immutable state + CAS
Put both values in one immutable record inside an \`AtomicReference\` so they change together. Compute the next state and \`compareAndSet\`; retry on contention. Use \`System.nanoTime()\` (monotonic), never \`currentTimeMillis\`.

### Trade-offs
* Allocation per attempt (cheap, escape analysis may remove some).
* Under extreme contention, a striped or \`synchronized\` version may actually be faster; measure.
* This is per-JVM. Cluster-wide limits need Redis (Lua script doing the same maths atomically) or an API gateway.`,
    codeSnippet: `final class TokenBucket {
    private record State(double tokens, long lastNanos) {}

    private final double capacity, perNano;
    private final AtomicReference<State> state;

    TokenBucket(int capacity, int perSecond) {
        this.capacity = capacity;
        this.perNano = perSecond / 1e9;
        this.state = new AtomicReference<>(new State(capacity, System.nanoTime()));
    }

    boolean tryAcquire() {
        while (true) {
            State cur = state.get();
            long now = System.nanoTime();
            double refilled = Math.min(capacity, cur.tokens() + (now - cur.lastNanos()) * perNano);
            if (refilled < 1) return false;
            if (state.compareAndSet(cur, new State(refilled - 1, now))) return true;
        }
    }
}`,
    pitfalls: [
      "Keeping tokens and timestamp in two separate atomics.",
      "Using wall-clock time that can jump backwards.",
      "A scheduled refill thread that drifts and adds contention.",
    ],
    followUpQuestions: [
      "How would you make this distributed across instances?",
      "Compare token bucket, leaky bucket and sliding window counters.",
    ],
    faangFocus: "A very common senior live-coding problem that combines concurrency with system design.",
  },
  {
    id: 'conc-49',
    categoryId: 'concurrency',
    title: 'Print Odd and Even Numbers With Two Threads',
    difficulty: 'Solid',
    tags: ['Coding', 'Thread Coordination', 'Semaphore'],
    scenario: "Classic screening exercise: two threads must print 1 to 20 in order, one printing odd numbers and the other even numbers.",
    question: "Implement it, and discuss at least two coordination approaches.",
    idealAnswer: `### Approach 1: shared monitor with wait/notify
A shared counter guarded by a lock. Each thread waits (in a loop) until it is its turn, prints, increments and notifies.

### Approach 2: two semaphores (cleanest)
\`odd\` starts with 1 permit, \`even\` with 0. Each thread acquires its own semaphore, prints, then releases the **other** one. Turn-taking is explicit and there is no shared condition to re-check.

### Approach 3: SynchronousQueue / Exchanger
Pass a token back and forth. Works, but less readable.

### What interviewers look for
* No busy waiting.
* Handling of the termination condition so neither thread hangs.
* Correct interrupt handling.
* Awareness that this is a toy: real systems avoid lockstep threads.`,
    codeSnippet: `Semaphore odd = new Semaphore(1), even = new Semaphore(0);
int max = 20;

Thread t1 = new Thread(() -> {
    for (int i = 1; i <= max; i += 2) {
        odd.acquireUninterruptibly();
        System.out.println(i);
        even.release();
    }
});
Thread t2 = new Thread(() -> {
    for (int i = 2; i <= max; i += 2) {
        even.acquireUninterruptibly();
        System.out.println(i);
        odd.release();
    }
});
t1.start(); t2.start();`,
    pitfalls: [
      "Busy-spinning on a volatile flag.",
      "Using if instead of while with wait().",
      "One thread hanging at the end waiting for a turn that never comes.",
    ],
    followUpQuestions: [
      "Extend it to three threads printing in round-robin.",
      "Which approach scales to N threads most cleanly?",
    ],
    faangFocus: "A staple of screening rounds in India and at many service companies.",
  },
  {
    id: 'conc-50',
    categoryId: 'concurrency',
    title: 'invokeAll, invokeAny and ExecutorCompletionService',
    difficulty: 'Solid',
    tags: ['ExecutorService', 'CompletionService', 'Fan-Out'],
    scenario: "A price aggregator queries 10 suppliers. It must show results as each arrives, and in another mode return the first successful quote.",
    question: "Which ExecutorService helpers fit each mode, and how do they behave?",
    idealAnswer: `### invokeAll
Submits all tasks and **blocks until every one completes** (or the timeout expires, which cancels the unfinished ones). Returns futures in submission order. Good for 'wait for all then aggregate'.

### invokeAny
Returns the result of the **first task that completes successfully** and cancels the rest. Throws \`ExecutionException\` only if all fail. Perfect for 'first good quote' or hedged requests.

### ExecutorCompletionService
Wraps an executor and puts each future on a queue **as it completes**. \`take()\` returns them in completion order, so you can render results as they arrive instead of waiting on the slowest supplier.

### CompletableFuture equivalents
\`allOf\` for all, \`anyOf\` for first (note: \`anyOf\` completes with the first **completion**, including failures), and \`thenAccept\` on each for streaming results.`,
    codeSnippet: `var ecs = new ExecutorCompletionService<Quote>(pool);
suppliers.forEach(s -> ecs.submit(() -> s.quote(item)));

for (int i = 0; i < suppliers.size(); i++) {
    try {
        Quote q = ecs.take().get();
        ui.show(q);                       // in completion order
    } catch (ExecutionException e) {
        log.warn("Supplier failed", e.getCause());
    }
}`,
    pitfalls: [
      "Iterating futures in submission order and waiting on the slowest one first.",
      "Assuming CompletableFuture.anyOf skips failed futures.",
      "Forgetting that invokeAll with a timeout cancels unfinished tasks.",
    ],
    followUpQuestions: [
      "How would you implement a hedged request with a delay?",
      "How would you cap total latency for the aggregator?",
    ],
    faangFocus: "Practical API knowledge that maps to common aggregation problems.",
  },
  {
    id: 'conc-51',
    categoryId: 'concurrency',
    title: 'Async Cache Loading Without a Thundering Herd',
    difficulty: 'Expert',
    tags: ['Caching', 'CompletableFuture', 'Thundering Herd', 'computeIfAbsent'],
    scenario: "When a popular cache key expires, 2,000 concurrent requests all call the database to reload it and the database falls over.",
    question: "Design an in-process cache that loads each key at most once concurrently, without holding locks during the load.",
    idealAnswer: `### Cache the future, not the value
Store \`CompletableFuture<V>\` in a \`ConcurrentHashMap\`. The first caller installs a future and starts the load; everyone else gets the **same** future and waits on it. One DB call per key per expiry.

\`computeIfAbsent\` would also dedupe, but it holds the bin lock for the whole load, blocking unrelated keys in the same bin, and must never be used for slow IO. Installing an **incomplete future** is instant, so the lock is held only for a moment.

### Failure handling
If the load fails, **remove the future** (only if it is still the same one) so the next caller retries, rather than caching the failure forever.

### Refresh without stalls
Refresh-ahead: serve the stale value while one background reload runs. Add jitter to TTLs so keys do not all expire together.

### Just use Caffeine
Caffeine's \`AsyncLoadingCache\` implements exactly this, plus size bounds, expiry, refreshAfterWrite and stats. Hand-roll only in interviews.`,
    codeSnippet: `private final ConcurrentHashMap<K, CompletableFuture<V>> cache = new ConcurrentHashMap<>();

CompletableFuture<V> get(K key) {
    CompletableFuture<V> fresh = new CompletableFuture<>();
    CompletableFuture<V> existing = cache.putIfAbsent(key, fresh);
    if (existing != null) return existing;

    CompletableFuture.supplyAsync(() -> loader.load(key), ioPool)
        .whenComplete((v, err) -> {
            if (err != null) { cache.remove(key, fresh); fresh.completeExceptionally(err); }
            else fresh.complete(v);
        });
    return fresh;
}`,
    pitfalls: [
      "Doing slow IO inside computeIfAbsent.",
      "Caching failed futures permanently.",
      "Synchronised expiry across all keys causing periodic stampedes.",
    ],
    followUpQuestions: [
      "How would you extend this across a cluster (request coalescing in Redis)?",
      "How does Caffeine's refreshAfterWrite differ from expireAfterWrite?",
    ],
    faangFocus: "Combines concurrency with caching strategy; a favourite for backend senior loops.",
  },
  {
    id: 'conc-52',
    categoryId: 'concurrency',
    title: 'Implement a Bounded Blocking Queue With Locks',
    difficulty: 'Hard',
    tags: ['BlockingQueue', 'ReentrantLock', 'Coding', 'Timeouts'],
    scenario: "Follow-up to producer-consumer: 'Now add offer(e, timeout) and poll(timeout), and make producers and consumers not block each other more than necessary.'",
    question: "Implement it and explain how LinkedBlockingQueue reduces contention compared to ArrayBlockingQueue.",
    idealAnswer: `### Timed waits with Conditions
\`Condition.awaitNanos(n)\` returns the remaining time, so the loop decrements the budget until it hits zero and gives up.

### One lock vs two locks
* **ArrayBlockingQueue**: one lock for both ends. Simple; producers and consumers contend.
* **LinkedBlockingQueue**: a \`putLock\` and a \`takeLock\` plus an \`AtomicInteger count\`. Producers touch the tail, consumers the head, so they rarely contend. When a producer adds to an empty queue it briefly takes the take lock to signal \`notEmpty\`, and vice versa. The cost is node allocation per element.

### Choosing
Array: bounded, no allocation, predictable memory. Linked: higher throughput when both sides are busy, but allocation and GC pressure, and it is unbounded by default (always pass a capacity).`,
    codeSnippet: `boolean offer(T x, long timeout, TimeUnit unit) throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    lock.lockInterruptibly();
    try {
        while (count == items.length) {
            if (nanos <= 0) return false;
            nanos = notFull.awaitNanos(nanos);
        }
        enqueue(x);
        notEmpty.signal();
        return true;
    } finally {
        lock.unlock();
    }
}`,
    pitfalls: [
      "Restarting the full timeout after each spurious wakeup.",
      "Using lock() instead of lockInterruptibly() in blocking methods.",
      "Creating a LinkedBlockingQueue without a capacity.",
    ],
    followUpQuestions: [
      "Why does LinkedBlockingQueue need an AtomicInteger count?",
      "What does LinkedTransferQueue add?",
    ],
    faangFocus: "A deeper coding follow-up to test lock and condition fluency.",
  },
  {
    id: 'conc-53',
    categoryId: 'concurrency',
    title: 'Levels of Thread Safety',
    difficulty: 'Core',
    tags: ['Thread Safety', 'Immutability', 'Design'],
    scenario: "A library's Javadoc says 'this class is conditionally thread-safe'. A teammate asks what that means and how to document their own classes.",
    question: "What does 'thread-safe' mean, and what are the common levels of thread safety a class can offer?",
    idealAnswer: `### Definition
A class is thread-safe if it behaves correctly when accessed from multiple threads, **regardless of scheduling or interleaving**, with **no extra synchronization by callers**.

### Levels (from Effective Java)
* **Immutable**: state never changes after construction (\`String\`, \`Integer\`, records with immutable fields). Always safe.
* **Unconditionally thread-safe**: mutable but internally synchronized so any sequence of calls is safe (\`ConcurrentHashMap\`, \`AtomicLong\`).
* **Conditionally thread-safe**: some operations need external synchronization, e.g. iterating a \`Collections.synchronizedList\` requires holding its lock.
* **Not thread-safe**: callers must synchronize (\`ArrayList\`, \`HashMap\`, \`SimpleDateFormat\`).
* **Thread-hostile**: unsafe even with external locking, typically because of unsynchronized static state.

### Ways to achieve it
Don't share, share only immutable data, or synchronize every access to shared mutable state. Prefer them in that order.

### Document it
State the level in Javadoc, and for conditionally safe classes say which lock callers must hold. Annotations like \`@ThreadSafe\` / \`@GuardedBy\` help reviewers and static analysis.`,
    pitfalls: [
      "Assuming 'synchronized collection' means safe to iterate.",
      "Not documenting thread-safety at all.",
      "Calling a class thread-safe because every method is synchronized, while compound use is still unsafe.",
    ],
    followUpQuestions: [
      "Is java.time.LocalDate thread-safe? Why?",
      "What does @GuardedBy communicate?",
    ],
    faangFocus: "An opener that lets the interviewer calibrate your vocabulary.",
  },
  {
    id: 'conc-54',
    categoryId: 'concurrency',
    title: 'Linearizability vs Sequential Consistency',
    difficulty: 'Master',
    tags: ['Linearizability', 'Correctness', 'Consistency Models', 'Lock-Free'],
    scenario: "You are reviewing a lock-free stack. The author says it is 'thread-safe'. You ask for the correctness criterion and the linearization points.",
    question: "Define linearizability and sequential consistency, and explain how you argue a concurrent data structure is correct.",
    idealAnswer: `### Sequential consistency
The result of any execution equals **some** sequential interleaving of all operations, with each thread's operations in program order. It does not respect real time: an operation that finished before another started may still be ordered after it.

### Linearizability
Stronger: every operation appears to take effect **instantaneously at some point between its invocation and its response** (its linearization point). If op A completes before op B starts, A is ordered before B. Linearizability is **composable**: a system built from linearizable objects is linearizable. Sequential consistency is not.

### Arguing correctness
1. Identify each operation's **linearization point**, usually the successful CAS (e.g. the CAS on \`top\` in a Treiber stack) or, for failing operations, the read that observed the state.
2. Show the abstract state changes exactly at that point and nowhere else.
3. Show progress: lock-free (some thread always completes) vs wait-free (every thread completes in bounded steps).
4. Handle ABA and memory reclamation.
5. Test with **jcstress** and model-check small cases; tests alone cannot prove it.

### Where it matters beyond JVM
The same vocabulary describes distributed stores: 'strong consistency' in etcd/ZooKeeper-backed systems is typically linearizability.`,
    pitfalls: [
      "Using 'thread-safe' without a correctness criterion.",
      "Placing linearization points inside retry loops without justification.",
      "Confusing lock-free with wait-free.",
    ],
    followUpQuestions: [
      "Where is the linearization point of a failed pop on an empty Treiber stack?",
      "Is ConcurrentHashMap.size() linearizable?",
    ],
    faangFocus: "Theory-heavy; used for infrastructure and database-engine roles.",
  },
  {
    id: 'conc-55',
    categoryId: 'concurrency',
    title: 'How synchronized Is Implemented: Thin Locks and Inflation',
    difficulty: 'Master',
    tags: ['HotSpot', 'Object Header', 'Lock Inflation', 'Biased Locking'],
    scenario: "After a JDK upgrade from 11 to 17, a legacy service that uses `Vector` and `StringBuffer` heavily got slightly slower. Someone blames the removal of biased locking.",
    question: "Explain how HotSpot implements monitors, lock states, and why biased locking was removed.",
    idealAnswer: `### The mark word
Every object header has a **mark word** that doubles as lock state.

### Lock states
* **Unlocked**.
* **Thin / lightweight lock**: on uncontended entry, the thread CASes a pointer to a lock record on its own stack into the mark word. Cheap, no OS involvement. (JDK 21+ has 'lightweight locking' that keeps a per-thread lock stack instead of displaced headers.)
* **Inflated (fat) lock**: on contention or \`wait()\`, the lock inflates to an \`ObjectMonitor\` with entry and wait queues. Threads may spin adaptively before parking via the OS.
* **Biased locking** (historic): the first thread to lock an object 'owned' it, so later locks by that thread needed no atomic instruction at all.

### Why biased locking went away
Deprecated and disabled by default in **JDK 15** (JEP 374), removed later. Modern CPUs made CAS much cheaper, most code no longer uses always-synchronized collections, and **revocation** required safepoints that caused latency spikes and huge complexity in the VM. So the upgrade may cost legacy \`Vector\`/\`StringBuffer\` code a little, which is exactly the trade the JDK team accepted.

### Practical takeaways
Uncontended \`synchronized\` is cheap. Contended locks are expensive mainly because of parking and cache traffic. Replace legacy synchronized collections rather than tuning flags.`,
    pitfalls: [
      "Assuming synchronized always involves the OS.",
      "Tuning locks based on biased-locking era advice.",
      "Blaming a regression on locks without profiling.",
    ],
    followUpQuestions: [
      "What is adaptive spinning?",
      "How does JDK 24's change for virtual threads relate to ObjectMonitor?",
    ],
    faangFocus: "JVM-internals depth; rarely required, highly differentiating.",
  },
];
