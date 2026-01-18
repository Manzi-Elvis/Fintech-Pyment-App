import { cache } from "./cache" // Assuming cache is imported from another module

export class PerformanceTracker {
  private metrics = new Map<string, number[]>()

  startTimer(label: string): () => number {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
      return duration
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }

    const values = this.metrics.get(label)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label)
    }
    return result
  }

  clear(): void {
    this.metrics.clear()
  }
}

export const performanceTracker = new PerformanceTracker()

// Database query optimization helper
export function optimizeQuery<T>(queryFn: () => Promise<T>, cacheKey?: string, ttlSeconds = 300): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const timer = performanceTracker.startTimer("database_query")

    try {
      let result: T

      if (cacheKey) {
        const cached = cache.get<T>(cacheKey)
        if (cached !== null) {
          timer() // Record cache hit time
          performanceTracker.recordMetric("cache_hit", 1)
          resolve(cached)
          return
        }
        performanceTracker.recordMetric("cache_miss", 1)
      }

      result = await queryFn()

      if (cacheKey) {
        cache.set(cacheKey, result, ttlSeconds)
      }

      timer() // Record query execution time
      resolve(result)
    } catch (error) {
      timer()
      performanceTracker.recordMetric("database_error", 1)
      reject(error)
    }
  })
}

// API response optimization
export function optimizeApiResponse<T>(
  data: T,
  options?: {
    compress?: boolean
    cache?: boolean
    ttl?: number
  },
) {
  const response = {
    data,
    timestamp: new Date().toISOString(),
    cached: false,
  }

  if (options?.cache) {
    // Add cache headers for client-side caching
    return {
      ...response,
      cache_control: `public, max-age=${options.ttl || 300}`,
    }
  }

  return response
}

// Background job processing for heavy operations
export class BackgroundJobProcessor {
  private jobs = new Map<string, any>()
  private processing = new Set<string>()

  async addJob(id: string, jobFn: () => Promise<any>, priority = 0): Promise<void> {
    this.jobs.set(id, { fn: jobFn, priority, createdAt: Date.now() })

    // Process immediately if not already processing
    if (!this.processing.has(id)) {
      this.processJob(id)
    }
  }

  private async processJob(id: string): Promise<void> {
    if (this.processing.has(id)) return

    this.processing.add(id)
    const job = this.jobs.get(id)

    if (!job) {
      this.processing.delete(id)
      return
    }

    try {
      const timer = performanceTracker.startTimer("background_job")
      await job.fn()
      timer()
      performanceTracker.recordMetric("job_success", 1)
    } catch (error) {
      console.error(`Background job ${id} failed:`, error)
      performanceTracker.recordMetric("job_failure", 1)
    } finally {
      this.jobs.delete(id)
      this.processing.delete(id)
    }
  }

  getQueueStatus() {
    return {
      pending: this.jobs.size,
      processing: this.processing.size,
    }
  }
}

export const backgroundJobs = new BackgroundJobProcessor()
