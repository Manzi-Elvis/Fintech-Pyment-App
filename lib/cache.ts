interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 1000

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    // Clean up expired items if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

export const cache = new MemoryCache()

// Cache decorators for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttlSeconds = 300,
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator
        ? `${propertyName}:${keyGenerator(...args)}`
        : `${propertyName}:${JSON.stringify(args)}`

      // Try to get from cache first
      const cached = cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await method.apply(this, args)

      // Cache the result
      cache.set(cacheKey, result, ttlSeconds)

      return result
    }
  }
}

// Redis-like interface for future Redis integration
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    return cache.get<T>(key)
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    cache.set(key, value, ttlSeconds)
  }

  async del(key: string): Promise<void> {
    cache.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return cache.get(key) !== null
  }

  async flush(): Promise<void> {
    cache.clear()
  }
}

export const cacheService = new CacheService()
