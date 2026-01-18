import { NextResponse } from "next/server"
import { performanceTracker } from "@/lib/performance"
import { cache } from "@/lib/cache"

export async function GET() {
  try {
    const metrics = performanceTracker.getAllMetrics()
    const cacheStats = cache.getStats()

    return NextResponse.json({
      performance_metrics: metrics,
      cache_stats: cacheStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    performanceTracker.clear()
    cache.clear()

    return NextResponse.json({ message: "Metrics cleared successfully" })
  } catch (error) {
    console.error("Failed to clear metrics:", error)
    return NextResponse.json({ error: "Failed to clear metrics" }, { status: 500 })
  }
}
