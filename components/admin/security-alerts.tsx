"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Eye, Clock, CheckCircle, X } from "lucide-react"

interface SecurityAlert {
  id: string
  user_id?: string
  alert_type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  status: "open" | "investigating" | "resolved" | "false_positive"
  created_at: string
  user_email?: string
}

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      // Mock data for demonstration
      setAlerts([
        {
          id: "1",
          user_id: "user1",
          alert_type: "multiple_failed_attempts",
          severity: "high",
          description: "5 failed login attempts from IP 192.168.1.100",
          status: "open",
          created_at: "2024-01-15T10:30:00Z",
          user_email: "john.doe@example.com",
        },
        {
          id: "2",
          user_id: "user2",
          alert_type: "unusual_transaction",
          severity: "medium",
          description: "Transaction amount $15,000 exceeds user average by 10x",
          status: "investigating",
          created_at: "2024-01-15T09:15:00Z",
          user_email: "alice.smith@example.com",
        },
        {
          id: "3",
          user_id: "user3",
          alert_type: "suspicious_login",
          severity: "medium",
          description: "Login from new location: New York, NY",
          status: "resolved",
          created_at: "2024-01-15T08:45:00Z",
          user_email: "bob.wilson@example.com",
        },
      ])
    } catch (error) {
      console.error("Failed to fetch security alerts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "investigating":
        return <Eye className="w-4 h-4 text-yellow-600" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "false_positive":
        return <X className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    // Update alert status
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: newStatus as any } : alert)))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
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
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>Monitor and respond to security threats</CardDescription>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(alert.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium">{alert.description}</p>
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{alert.user_email}</span>
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    <Badge variant="outline">{alert.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {alert.status === "open" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(alert.id, "investigating")}>
                      Investigate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(alert.id, "false_positive")}>
                      Mark False
                    </Button>
                  </>
                )}
                {alert.status === "investigating" && (
                  <Button size="sm" onClick={() => handleStatusUpdate(alert.id, "resolved")}>
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
