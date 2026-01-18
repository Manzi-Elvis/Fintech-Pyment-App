"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, Server, Database, Wifi } from "lucide-react"

interface SystemMetric {
  name: string
  status: "healthy" | "warning" | "critical"
  value: number
  unit: string
  icon: React.ElementType
}

export function SystemHealth() {
  const metrics: SystemMetric[] = [
    {
      name: "API Response Time",
      status: "healthy",
      value: 145,
      unit: "ms",
      icon: Server,
    },
    {
      name: "Database Performance",
      status: "healthy",
      value: 98.5,
      unit: "%",
      icon: Database,
    },
    {
      name: "Network Uptime",
      status: "warning",
      value: 99.2,
      unit: "%",
      icon: Wifi,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "critical":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Real-time platform monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">All Systems Operational</p>
              <p className="text-sm text-green-700">Last updated: 2 minutes ago</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">99.9% Uptime</Badge>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {metric.value}
                    {metric.unit}
                  </span>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              <Progress
                value={metric.unit === "%" ? metric.value : Math.min((metric.value / 200) * 100, 100)}
                className="h-2"
              />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Quick Actions</p>
          <div className="space-y-2">
            <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
              View detailed logs
            </button>
            <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
              Run system diagnostics
            </button>
            <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
              Configure alerts
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
