import type { Question } from '../types';

export const PROFILING_QUESTIONS: Question[] = [
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
  },
{
    id: 'prof-6',
    categoryId: 'profiling',
    title: 'Reading a Thread Dump Under Pressure',
    difficulty: 'Solid',
    tags: ['Thread Dump', 'jstack', 'BLOCKED', 'Triage'],
    scenario: 'A service stops responding. CPU is near zero, memory is stable, and no errors are logged. You have SSH access and 10 minutes before a restart is forced.',
    question: 'Describe exactly what you would capture and how you would read a thread dump to find the cause.',
    idealAnswer: `### Capture first, analyse second
Take **three dumps, 10 seconds apart** — a single dump is a snapshot and cannot distinguish "stuck" from "busy". Comparing them shows whether threads are progressing.

\`\`\`
jcmd <pid> Thread.print > td1.txt
\`\`\`
Also capture \`jcmd <pid> VM.native_memory summary\`, \`GC.heap_info\`, and \`top -H -p <pid>\` for per-thread CPU. Only then restart — the artefacts are the entire investigation.

### The signature: low CPU, no progress
Zero CPU with no response means threads are **waiting**, not spinning. Look for a large number of threads in the same state at the same stack frame.

### Thread states and what they mean
* **RUNNABLE** — executing, *or* blocked in a native socket read (the JVM cannot tell). A "RUNNABLE" thread sitting in \`socketRead0\` is actually waiting on the network — one of the most commonly misread states.
* **BLOCKED** — waiting to enter a \`synchronized\` block. The dump names the monitor and who holds it.
* **WAITING** — in \`Object.wait\`, \`park\`, \`join\` with no timeout.
* **TIMED_WAITING** — the same with a timeout.

### The reading method
1. **Group by stack.** Hundreds of threads at the same frame is the smoking gun. Most tools (fastThread, or a simple sort) will cluster them.
2. **Check for a reported deadlock** — the JVM prints "Found one Java-level deadlock" for intrinsic and \`ReentrantLock\` cycles.
3. **Follow the monitor chain.** For BLOCKED threads, find "waiting to lock <0x...>" and then the thread that "locked <0x...>". Look at *that* thread — the root cause is what the holder is doing, which is frequently a slow IO call inside a synchronized block.
4. **Look at pool threads.** All HTTP worker threads in \`socketRead0\` against one downstream host means that dependency is hanging and you have no timeout configured. **This is by far the most common cause of this exact symptom.**
5. **Check for exhausted pools** — every thread busy and a queue behind them means saturation, not a hang.
6. Compare the three dumps: identical stacks across all three confirms stuck; changing stacks means slow, not stuck.

### The usual verdict
Low CPU + unresponsive + all worker threads in a socket read = a **missing or infinite read timeout** on a downstream call. The fix is a timeout plus a bulkhead so one dependency cannot consume the shared pool.

### Prepare in advance
* Name your threads (\`ThreadFactory\`) — "pool-3-thread-17" tells you nothing at 3am.
* Automate capture: a watchdog that dumps threads when the request queue exceeds a threshold, so the artefact exists before a human logs in.
* Keep JFR running continuously; it captures far more than a thread dump and costs ~1%.`,
    codeSnippet: `# Capture everything before restarting
for i in 1 2 3; do jcmd $PID Thread.print > td$i.txt; sleep 10; done
jcmd $PID VM.native_memory summary > nmt.txt
jcmd $PID GC.heap_info > heap.txt
top -H -b -n1 -p $PID > threads.txt        # per-thread CPU: 0% confirms waiting

# The tell: many threads here means a downstream call with no timeout
#   java.lang.Thread.State: RUNNABLE
#     at java.net.SocketInputStream.socketRead0(Native Method)`,
    pitfalls: [
      'Restarting before capturing the dump, destroying all evidence.',
      'Taking a single dump and guessing.',
      'Reading RUNNABLE as "working" when it is a native socket read.',
      'Looking only at the blocked threads instead of at the lock holder.'
    ],
    followUpQuestions: [
      'How do you correlate a native thread id from top -H with a Java thread in the dump?',
      'What does a thread dump look like when virtual threads are in use?',
      'How would you automate dump capture when a queue depth threshold is exceeded?'
    ],
    faangFocus: 'A practical triage question. Interviewers want a method — capture three dumps, group by stack, follow the monitor chain — not a list of thread states.'
  },
  {
    id: 'prof-7',
    categoryId: 'profiling',
    title: 'Flame Graphs and CPU Profiling Without Safepoint Bias',
    difficulty: 'Hard',
    tags: ['async-profiler', 'Flame Graph', 'Safepoint Bias', 'perf'],
    scenario: 'A service uses 80% CPU at moderate load. A traditional sampling profiler blames a logging call that a code review shows is trivially cheap.',
    question: 'Explain safepoint bias, how async-profiler avoids it, and how to read a flame graph correctly.',
    idealAnswer: `### Safepoint bias
Profilers built on \`ThreadMXBean.getStackTrace\` or JVMTI's \`GetAllStackTraces\` can only sample when threads are at a **safepoint** — a location where the JVM knows the exact state of every stack frame (method returns, loop back-edges, allocations).

Two consequences:
1. Samples are attributed to the **nearest safepoint**, not the actual instruction, so hot code gets credited to whatever safepoint follows it.
2. Code the JIT has optimised — inlined methods, counted loops with safepoint polls elided — is **systematically underrepresented**, while methods near safepoints are overrepresented.

The result is exactly this scenario: a cheap method sitting near a safepoint absorbs samples that belong to inlined hot code. The profiler is not wrong about the samples, it is wrong about the attribution.

### How async-profiler avoids it
It uses \`AsyncGetCallTrace\`, a JVM internal callable from a **signal handler**, so it can sample at any instruction. It combines:
* **\`perf_events\`** for CPU sampling — so kernel and native frames appear too, not just Java. Cache misses, syscalls and GC threads become visible.
* Allocation profiling via TLAB-fill events.
* Lock contention, wall-clock and cache-miss modes.

Overhead is low (typically 1-2% at 100Hz), so it is usable in production. JFR's method sampler is similarly non-safepoint-biased and is the built-in alternative.

### Reading a flame graph
* **X axis is NOT time.** It is alphabetically sorted stacks; width is the **proportion of samples**. Left-to-right ordering means nothing.
* **Y axis is stack depth**, with callers below callees.
* A **wide plateau at the top** is where CPU is actually spent — that frame is on-CPU with nothing below it.
* A wide frame with narrow children means **self time** in that frame.
* Look for **unexpected width**: serialisation, logging, reflection, regex, string formatting, hashing.

**Differential flame graphs** (comparing before and after) are the fastest way to see what a change actually did.

### Choosing the mode
* **CPU mode** — where CPU cycles go. Use when CPU-bound, as here.
* **Wall-clock mode** — where *time* goes, including blocking. Use when latency is high but CPU is low; CPU mode will show nothing useful there.
* **Alloc mode** — where allocation pressure originates. Often the real fix for a GC problem.
* **Lock mode** — contention hot spots.

Picking the wrong mode is the most common profiling mistake: profiling CPU on a latency problem caused by blocking IO finds nothing.

### The method
1. Reproduce under **realistic load** — profiles are workload-dependent.
2. Profile in **CPU mode**, generate a flame graph.
3. Find the widest unexpected plateau.
4. Change one thing, re-profile, and use a differential graph to confirm.
5. Verify the end-to-end metric improved — a faster method that was not the bottleneck changes nothing.`,
    codeSnippet: `# CPU flame graph, low overhead, safe in production
./profiler.sh -e cpu -d 60 -f cpu.html <pid>

# Latency problem with low CPU? Use wall-clock, not CPU
./profiler.sh -e wall -t -d 60 -f wall.html <pid>

# Allocation pressure — often the real cause of a "GC problem"
./profiler.sh -e alloc -d 60 -f alloc.html <pid>

# Built-in alternative, always available
jcmd <pid> JFR.start settings=profile duration=60s filename=rec.jfr`,
    pitfalls: [
      'Trusting a safepoint-biased profiler and optimising the wrong method.',
      'Reading the flame graph X axis as time.',
      'Profiling CPU when the problem is blocking, where wall-clock mode is needed.',
      'Optimising a wide frame that is not on the critical path for the metric you care about.'
    ],
    followUpQuestions: [
      'What is AsyncGetCallTrace and why is it not part of the public JVMTI API?',
      'How does a differential flame graph make a regression obvious?',
      'When does allocation profiling find a problem that CPU profiling misses?'
    ],
    faangFocus: 'Performance-engineering rounds. Explaining safepoint bias precisely is a strong signal, and knowing when to switch to wall-clock mode is the practical follow-up.'
  },
  {
    id: 'prof-8',
    categoryId: 'profiling',
    title: 'Diagnosing a Memory Leak From a Heap Dump',
    difficulty: 'Hard',
    tags: ['Heap Dump', 'MAT', 'Dominator Tree', 'Leak'],
    scenario: 'A service OOMs every 36 hours. The heap grows steadily; full GCs reclaim less each time. You have a 6GB heap dump.',
    question: 'Describe your analysis method, the concepts you would use, and the leak patterns you would look for.',
    idealAnswer: `### Confirm it is a leak first
A leak means the **live set grows monotonically**: occupancy right after each full GC trends upward. If occupancy returns to a stable baseline, it is not a leak — it is an undersized heap or a burst allocation problem. Read the GC log before opening the dump.

### Capture properly
\`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/dumps\` should already be set — a dump taken at OOM is far more informative than one taken by hand. On demand: \`jcmd <pid> GC.heap_dump /path/file.hprof\` (note it triggers a full GC and pauses the process).

### Shallow vs retained size — the key concept
* **Shallow size** — the object's own bytes.
* **Retained size** — everything that would be freed if this object were collected, i.e. the objects it **exclusively** keeps alive.

Retained size is what matters. A \`HashMap\` with a shallow size of 48 bytes can retain 4GB.

The **dominator tree** organises the heap by retained size: X dominates Y if every path from a GC root to Y goes through X. Sorting the dominator tree by retained size takes you to the culprit in a couple of clicks — this is the single most useful view in Eclipse MAT.

### The method
1. Open the dump in **Eclipse MAT** and run the **Leak Suspects** report — it is right surprisingly often.
2. Sort the **dominator tree** by retained heap. Look at the top few entries.
3. For the suspect, compute **path to GC roots, excluding weak/soft references**. This names the exact reference chain holding it, and usually names the bug directly.
4. Inspect the contents (\`List objects\` / OQL) to identify *what* is accumulating — that usually tells you which feature is responsible.
5. If two dumps are available, use MAT's **compare** to see what grew between them. Far faster than reasoning about one dump.

### Common leak patterns
* **An unbounded cache** — a \`HashMap\` used as a cache with no eviction. The most common leak by a wide margin.
* **Listeners and callbacks never deregistered** — the observer keeps the observed alive.
* **ThreadLocals on pooled threads** without \`remove()\`.
* **Classloader leaks** on redeploy (many instances of the same class).
* **Growing collections in a long-lived object** — an audit list, a metrics map keyed by an unbounded dimension (request id, user id).
* **String interning** or key objects with unbounded cardinality.
* Off-heap: NMT is the tool, not a heap dump. A "leak" with a stable heap and growing RSS is not in the dump at all.

### Prevention
* Every cache must be **bounded** — Caffeine with \`maximumSize\`, never a bare map.
* Export live-set-after-full-GC as a metric and alert on the trend, so you find leaks before the OOM rather than after.
* Add a heap-usage assertion to load tests: run for an hour and assert the post-GC baseline is flat.`,
    codeSnippet: `# Always on in production
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/dumps
-Xlog:gc*:file=gc.log:time,uptime

# On demand (pauses the JVM and triggers a full GC)
jcmd <pid> GC.heap_dump /var/dumps/manual.hprof

# MAT OQL: find suspiciously large maps
SELECT * FROM java.util.HashMap m WHERE m.size > 100000

// The most common leak, and its fix
private final Map<String, Result> cache = new HashMap<>();          // unbounded
private final Cache<String, Result> cache =
        Caffeine.newBuilder().maximumSize(10_000).build();           // bounded`,
    pitfalls: [
      'Sorting by shallow size and missing the small object retaining gigabytes.',
      'Analysing a heap dump for what is actually an off-heap or native leak.',
      'Not excluding weak/soft references when computing paths to GC roots.',
      'Concluding "leak" from rising heap usage without checking post-full-GC occupancy.'
    ],
    followUpQuestions: [
      'How does the dominator tree get computed, and why is it the right view?',
      'How would you distinguish a heap leak from a Metaspace or native leak?',
      'What would you monitor to catch this leak before the OOM?'
    ],
    faangFocus: 'A production-debugging staple. Retained size, the dominator tree and path-to-GC-roots are the three concepts interviewers listen for.'
  },
  {
    id: 'prof-9',
    categoryId: 'profiling',
    title: 'Continuous Profiling and JFR in Production',
    difficulty: 'Expert',
    tags: ['JFR', 'Continuous Profiling', 'Event Streaming', 'Production'],
    scenario: 'Performance incidents are investigated only after the fact, when the evidence is gone. Leadership asks for a way to always have the data, without meaningfully slowing production.',
    question: 'Design a continuous profiling strategy with JFR. Explain what it records, its cost, and how you would operate it.',
    idealAnswer: `### Why continuous
The fundamental problem with on-demand profiling is that **you cannot profile the past**. By the time someone notices, reproduces and attaches a profiler, the conditions have changed. Continuous profiling inverts this: the data already exists when the incident starts.

### What JFR is
A **built-in, low-overhead event recorder** in the JVM (open-source since Java 11, backported to 8u262). It records structured events with timestamps and stack traces:
* Execution samples (method profiling, **not** safepoint-biased)
* Allocation events — TLAB and outside-TLAB, with allocating stack traces
* GC phases, pause times, heap summaries
* Lock contention (\`JavaMonitorEnter\`) with the blocking stack
* Thread parks, socket and file IO with duration and peer
* Exceptions thrown, class loading, JIT compilation and **deoptimization**
* Safepoint duration and time-to-safepoint

The breadth is the point: a single recording answers "was it GC, a lock, IO, or the JIT?" without guessing which tool to reach for.

### Cost
* \`default\` profile: roughly **1%** overhead. Designed to be always-on.
* \`profile\` profile: 2-5%, with denser sampling. Fine for a bounded investigation window.
* Custom settings let you disable expensive events (exception sampling with deep stacks is the usual culprit) and tune sampling periods.

### Operating it
1. **Enable at startup** with a continuous recording and a bounded disk repository, so there is always a rolling window.
2. **Dump on trigger** — on OOM, on a health-check failure, or on demand from an operator. Also dump periodically and ship to object storage.
3. **Event streaming (Java 14+)** — \`RecordingStream\` lets the application subscribe to its own events in-process and export them as metrics. This turns JFR into a live telemetry source rather than a post-mortem artefact.
4. **Retention:** keep a rolling window locally, plus longer retention for dumps captured around incidents.

### Analysis
* **JDK Mission Control** for interactive analysis, with its automated-analysis rules highlighting likely problems.
* \`jfr summary\` and \`jfr print\` for scripting in CI and for automated regression checks.
* Convert to flame graphs for a familiar view.
* Compare a **baseline** recording against an incident recording — differential analysis is far more productive than staring at one profile.

### Team-wide continuous profiling
Per-JVM recordings solve one host. Fleet-wide continuous profilers (Pyroscope, Parca, and commercial equivalents) aggregate profiles across every instance, so you can ask "which method got slower after last Tuesday's deploy across the whole fleet?" That is a qualitatively different capability, and it is where the real organisational value is.

### The organisational point worth making
Continuous profiling changes performance work from **reactive archaeology** to **routine analysis**. The cost is 1% of CPU; the benefit is that every incident starts with evidence instead of hypotheses. That trade is easy to defend to leadership.`,
    codeSnippet: `# Always-on rolling recording with a bounded repository
-XX:StartFlightRecording=settings=default,disk=true,maxsize=512m,maxage=6h,\\
name=continuous,dumponexit=true
-XX:FlightRecorderOptions=repository=/var/jfr

# Dump the current window during an incident
jcmd <pid> JFR.dump name=continuous filename=/var/jfr/incident.jfr

// Stream your own events as live metrics (Java 14+)
try (var rs = new RecordingStream()) {
    rs.enable("jdk.GCPhasePause").withoutThreshold();
    rs.onEvent("jdk.GCPhasePause", e ->
            metrics.record("gc.pause", e.getDuration().toMillis()));
    rs.startAsync();
}`,
    pitfalls: [
      'Enabling the profile settings continuously and paying 5% forever when default costs 1%.',
      'Recording to disk with no size or age bound and filling the volume.',
      'Capturing recordings but never establishing a baseline to compare against.',
      'Treating JFR as post-mortem only and ignoring event streaming.'
    ],
    followUpQuestions: [
      'Which JFR events are expensive enough to disable in a continuous recording?',
      'How would you automate a performance regression check in CI using jfr print?',
      'What does fleet-wide profile aggregation give you that per-JVM recordings cannot?'
    ],
    faangFocus: 'A staff-level observability question. Framing it as "you cannot profile the past" and quantifying the 1% cost is what makes the case persuasive.'
  },
];
