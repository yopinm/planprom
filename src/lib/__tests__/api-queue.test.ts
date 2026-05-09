// TASK 3.1 — Request Queue Infrastructure tests

import { describe, it, expect } from 'vitest'
import { ApiQueue, lazadaQueue, shopeeQueue } from '@/lib/api-queue'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('ApiQueue', () => {
  describe('basic enqueue and resolve', () => {
    it('resolves the task result', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 5 })
      const result = await q.enqueue(() => Promise.resolve(42))
      expect(result).toBe(42)
    })

    it('rejects when the task throws', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 5 })
      await expect(
        q.enqueue(() => Promise.reject(new Error('task failed')))
      ).rejects.toThrow('task failed')
    })

    it('runs multiple tasks in sequence', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 1 })
      const order: number[] = []
      await Promise.all([
        q.enqueue(async () => { order.push(1) }),
        q.enqueue(async () => { order.push(2) }),
        q.enqueue(async () => { order.push(3) }),
      ])
      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('concurrency cap', () => {
    it('does not exceed maxConcurrent in-flight tasks', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 2 })
      let concurrent = 0
      let maxSeen = 0

      const task = async () => {
        concurrent++
        maxSeen = Math.max(maxSeen, concurrent)
        await sleep(10)
        concurrent--
      }

      await Promise.all([
        q.enqueue(task),
        q.enqueue(task),
        q.enqueue(task),
        q.enqueue(task),
      ])

      expect(maxSeen).toBeLessThanOrEqual(2)
    })
  })

  describe('overflow guard', () => {
    it('rejects immediately when queue depth is exceeded', async () => {
      const q = new ApiQueue({ callsPerMinute: 1, maxConcurrent: 1, maxQueueDepth: 2 })

      // Enqueue a slow task to fill the running slot
      void q.enqueue(() => sleep(200))
      // Fill pending queue
      void q.enqueue(() => sleep(200))
      void q.enqueue(() => sleep(200))
      // This one should overflow
      await expect(
        q.enqueue(() => Promise.resolve('overflow'))
      ).rejects.toThrow('queue overflow')
    })

    it('increments droppedOverflow stat', async () => {
      const q = new ApiQueue({ callsPerMinute: 1, maxConcurrent: 1, maxQueueDepth: 1 })
      void q.enqueue(() => sleep(200))  // fills running
      void q.enqueue(() => sleep(200))  // fills pending
      try { await q.enqueue(() => Promise.resolve()) } catch { /* expected */ }
      expect(q.getStats().droppedOverflow).toBe(1)
    })
  })

  describe('getStats', () => {
    it('returns correct totalEnqueued and totalCompleted', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 5 })
      await q.enqueue(() => Promise.resolve(1))
      await q.enqueue(() => Promise.resolve(2))
      const stats = q.getStats()
      expect(stats.totalEnqueued).toBe(2)
      expect(stats.totalCompleted).toBe(2)
      expect(stats.totalFailed).toBe(0)
    })

    it('increments totalFailed on rejected task', async () => {
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 5 })
      try { await q.enqueue(() => Promise.reject(new Error('x'))) } catch { /* expected */ }
      expect(q.getStats().totalFailed).toBe(1)
      expect(q.getStats().totalCompleted).toBe(0)
    })

    it('reports label from options', () => {
      const q = new ApiQueue({ label: 'test-label' })
      expect(q.getStats().label).toBe('test-label')
    })
  })

  describe('token refill', () => {
    it('tokens start at callsPerMinute', () => {
      const q = new ApiQueue({ callsPerMinute: 15 })
      expect(q.getStats().tokens).toBe(15)
    })

    it('refills tokens based on elapsed time', async () => {
      // 60 calls/min = 1 token per 1000ms
      const q = new ApiQueue({ callsPerMinute: 60, maxConcurrent: 1 })
      // Drain all tokens by enqueueing 60 tasks (but maxConcurrent=1, so most are pending)
      // Easier: just manually confirm via time-based logic
      // Drain 1 token
      await q.enqueue(() => Promise.resolve())
      const before = q.getStats().tokens
      // Wait 1.1 seconds — should gain 1+ token
      await sleep(1100)
      const after = q.getStats().tokens
      expect(after).toBeGreaterThan(before)
    })
  })

  describe('singleton queues', () => {
    it('lazadaQueue has correct label', () => {
      expect(lazadaQueue.getStats().label).toBe('lazada')
    })

    it('shopeeQueue has correct label', () => {
      expect(shopeeQueue.getStats().label).toBe('shopee')
    })

    it('lazadaQueue resolves a task', async () => {
      const result = await lazadaQueue.enqueue(() => Promise.resolve('ok'))
      expect(result).toBe('ok')
    })
  })
})
