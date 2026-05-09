// src/lib/api-queue.ts
// TASK 3.1 — Request Queue Infrastructure
//
// Rate-limiting queue for outgoing external API calls (Lazada, Shopee).
// Prevents burst calls from exceeding platform rate limits.
//
// Design: lazy-refill token bucket + concurrency cap
//   - No setInterval — tokens are refilled based on elapsed time on each call
//   - Safe in Next.js cluster mode (per-process, not shared across PM2 workers)
//   - Each worker gets its own rate budget (2 workers × 20/min = 40/min actual)
//
// Singleton queues (bottom of file):
//   lazadaQueue — 20 calls/min, max 3 concurrent
//   shopeeQueue — 10 calls/min, max 2 concurrent

export interface QueueOptions {
  callsPerMinute?: number  // token bucket capacity + refill rate (default: 20)
  maxConcurrent?:  number  // parallel in-flight calls allowed (default: 3)
  maxQueueDepth?:  number  // reject enqueue when pending exceeds this (default: 100)
  label?:          string  // for stats / error messages
}

export interface QueueStats {
  label:            string
  pending:          number
  running:          number
  tokens:           number
  totalEnqueued:    number
  totalCompleted:   number
  totalFailed:      number
  droppedOverflow:  number
}

type Task<T> = () => Promise<T>

interface QueueEntry {
  resolve: (value: unknown) => void
  reject:  (reason: unknown) => void
  task:    Task<unknown>
}

export class ApiQueue {
  private readonly callsPerMinute: number
  private readonly maxConcurrent:  number
  private readonly maxQueueDepth:  number
  private readonly label:          string
  private readonly msPerToken:     number

  private tokens:          number
  private lastRefillAt:    number
  private running:         number
  private readonly pending: QueueEntry[]

  private totalEnqueued:   number
  private totalCompleted:  number
  private totalFailed:     number
  private droppedOverflow: number

  constructor(opts: QueueOptions = {}) {
    this.callsPerMinute = opts.callsPerMinute ?? 20
    this.maxConcurrent  = opts.maxConcurrent  ?? 3
    this.maxQueueDepth  = opts.maxQueueDepth  ?? 100
    this.label          = opts.label          ?? 'api-queue'
    this.msPerToken     = 60_000 / this.callsPerMinute

    this.tokens       = this.callsPerMinute
    this.lastRefillAt = Date.now()
    this.running      = 0
    this.pending      = []

    this.totalEnqueued   = 0
    this.totalCompleted  = 0
    this.totalFailed     = 0
    this.droppedOverflow = 0
  }

  // ---------------------------------------------------------------------------
  // Lazy token refill — call before every drain
  // ---------------------------------------------------------------------------

  private refillTokens(): void {
    const now     = Date.now()
    const elapsed = now - this.lastRefillAt
    const gained  = Math.floor(elapsed / this.msPerToken)
    if (gained > 0) {
      this.tokens       = Math.min(this.tokens + gained, this.callsPerMinute)
      this.lastRefillAt = now
    }
  }

  // ---------------------------------------------------------------------------
  // Drain — start as many tasks as tokens + concurrency allow
  // ---------------------------------------------------------------------------

  private drain(): void {
    this.refillTokens()

    while (
      this.pending.length > 0 &&
      this.running < this.maxConcurrent &&
      this.tokens > 0
    ) {
      const entry = this.pending.shift()!
      this.tokens--
      this.running++

      void entry.task().then(
        (result) => {
          this.running--
          this.totalCompleted++
          entry.resolve(result)
          this.drain()
        },
        (err) => {
          this.running--
          this.totalFailed++
          entry.reject(err)
          this.drain()
        },
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Enqueue a task. Returns a Promise that resolves/rejects when the task runs.
   * Throws immediately if the queue is full (overflow guard).
   */
  enqueue<T>(task: Task<T>): Promise<T> {
    if (this.pending.length >= this.maxQueueDepth) {
      this.droppedOverflow++
      return Promise.reject(
        new Error(`${this.label}: queue overflow — ${this.maxQueueDepth} tasks already pending`),
      )
    }

    this.totalEnqueued++

    return new Promise<T>((resolve, reject) => {
      this.pending.push({
        resolve: resolve as (v: unknown) => void,
        reject,
        task:    task as Task<unknown>,
      })
      this.drain()
    })
  }

  getStats(): QueueStats {
    this.refillTokens()
    return {
      label:           this.label,
      pending:         this.pending.length,
      running:         this.running,
      tokens:          Math.floor(this.tokens),
      totalEnqueued:   this.totalEnqueued,
      totalCompleted:  this.totalCompleted,
      totalFailed:     this.totalFailed,
      droppedOverflow: this.droppedOverflow,
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton queues — one per external platform
// ---------------------------------------------------------------------------

export const lazadaQueue = new ApiQueue({
  callsPerMinute: 20,
  maxConcurrent:  3,
  maxQueueDepth:  100,
  label:          'lazada',
})

export const shopeeQueue = new ApiQueue({
  callsPerMinute: 10,
  maxConcurrent:  2,
  maxQueueDepth:  100,
  label:          'shopee',
})
