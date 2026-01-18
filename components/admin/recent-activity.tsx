"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, User, CreditCard } from "lucide-react"

interface ActivityItem {
  id: string
  type: "user_registration" | "transaction" | "dispute" | "security_alert"
  description: string
  user?: string
  amount?: number
  status: "success" | "warning" | "error" | "info"
  timestamp: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      // Mock data for demonstration
      setActivities([
        {
          id: "1",
          type: "user_registration",
          description: "New user registered",
          user: "john.doe@example.com",
          status: "success",
          timestamp: "2 minutes ago",
        },
        {
          id: "2",
          type: "transaction",
          description: "Large transaction flagged for review",
          user: "alice.smith@example.com",
          amount: 15000,
          status: "warning",
          timestamp: "5 minutes ago",
        },
        {
          id: "3",
          type: "dispute",
          description: "New dispute opened",
          user: "bob.wilson@example.com",
          amount: 250,
          status: "error",
          timestamp: "12 minutes ago",
        },
        {
          id: "4",
          type: "security_alert",
          description: "Multiple failed login attempts",
          user: "suspicious.user@example.com",
          status: "error",
          timestamp: "18 minutes ago",
        },
        {
          id: "5",
          type: "transaction",
          description: "Transaction completed successfully",
          user: "mary.johnson@example.com",
          amount: 500,
          status: "success",
          timestamp: "25 minutes ago",
        },
      ])
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case "user_registration":
        return <User className="w-4 h-4" />
      case "transaction":
        return <CreditCard className="w-4 h-4" />
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />
      case "security_alert":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "error":
        return "text-red-600 bg-red-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform events and alerts</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}
              >
                {getActivityIcon(activity.type, activity.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  {activity.user && <p className="text-xs text-muted-foreground">{activity.user}</p>}
                  {activity.amount && (
                    <Badge variant="outline" className="text-xs">
                      ${activity.amount.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
