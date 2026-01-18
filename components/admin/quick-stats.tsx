"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, AlertTriangle, TrendingUp, DollarSign, Activity } from "lucide-react"

interface StatsData {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  transactionVolume: number
  pendingDisputes: number
  systemUptime: number
}

export function QuickStats() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    transactionVolume: 0,
    pendingDisputes: 0,
    systemUptime: 99.9,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Mock data for demonstration
      setStats({
        totalUsers: 12543,
        activeUsers: 8921,
        totalTransactions: 45678,
        transactionVolume: 2847392.5,
        pendingDisputes: 23,
        systemUptime: 99.9,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.activeUsers.toLocaleString()} active this month`,
      icon: Users,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Transaction Volume",
      value: `$${(stats.transactionVolume / 1000000).toFixed(1)}M`,
      description: `${stats.totalTransactions.toLocaleString()} transactions`,
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Pending Disputes",
      value: stats.pendingDisputes.toString(),
      description: "Requires attention",
      icon: AlertTriangle,
      trend: "-15.3%",
      trendUp: false,
    },
    {
      title: "System Uptime",
      value: `${stats.systemUptime}%`,
      description: "Last 30 days",
      icon: Activity,
      trend: "+0.1%",
      trendUp: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div className={`flex items-center text-xs ${stat.trendUp ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className={`w-3 h-3 mr-1 ${!stat.trendUp ? "rotate-180" : ""}`} />
                {stat.trend}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
