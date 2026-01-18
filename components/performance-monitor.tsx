"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { performanceTracker } from "@/lib/performance"

interface PerformanceMonitorProps {
  children: React.ReactNode
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Monitor Core Web Vitals
    if (typeof window !== "undefined") {
      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            performanceTracker.recordMetric("lcp", entry.startTime)
          }
          if (entry.entryType === "first-input") {
            performanceTracker.recordMetric("fid", (entry as any).processingStart - entry.startTime)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint", "first-input"] })
      } catch (e) {
        // Fallback for browsers that don't support these metrics
      }

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        performanceTracker.recordMetric("cls", clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] })
      } catch (e) {
        // Fallback
      }

      // Monitor navigation timing
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        if (navigation) {
          performanceTracker.recordMetric("page_load_time", navigation.loadEventEnd - navigation.fetchStart)
          performanceTracker.recordMetric(
            "dom_content_loaded",
            navigation.domContentLoadedEventEnd - navigation.fetchStart,
          )
          performanceTracker.recordMetric("first_byte", navigation.responseStart - navigation.fetchStart)
        }
      })

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "resource") {
            const resource = entry as PerformanceResourceTiming
            performanceTracker.recordMetric(`resource_${resource.initiatorType}`, resource.duration)
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ["resource"] })
      } catch (e) {
        // Fallback
      }

      // Cleanup
      return () => {
        observer.disconnect()
        clsObserver.disconnect()
        resourceObserver.disconnect()
      }
    }
  }, [])

  // Only render children on client to avoid hydration issues
  if (!isClient) {
    return null
  }

  return <>{children}</>
}
