"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, Lock, Users } from "lucide-react"

interface SecurityMetrics {
  totalAlerts: number
  criticalAlerts: number
  activeThreats: number
  securityScore: number
  monitoredUsers: number
  blockedAttempts: number
}

export function SecurityOverview() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAlerts: 0,
    criticalAlerts: 0,
    activeThreats: 0,
    securityScore: 0,
    monitoredUsers: 0,
    blockedAttempts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSecurityMetrics()
  }, [])

  const fetchSecurityMetrics = async () => {
    try {
      // Mock data for demonstration
      setMetrics({
        totalAlerts: 47,
        criticalAlerts: 3,
        activeThreats: 2,
        securityScore: 87,
        monitoredUsers: 12543,
        blockedAttempts: 156,
      })
    } catch (error) {
      console.error("Failed to fetch security metrics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const securityCards = [
    {
      title: "Security Alerts",
      value: metrics.totalAlerts.toString(),
      description: `${metrics.criticalAlerts} critical alerts`,
      icon: AlertTriangle,
      color: metrics.criticalAlerts > 0 ? "text-red-600" : "text-yellow-600",
      bgColor: metrics.criticalAlerts > 0 ? "bg-red-100" : "bg-yellow-100",
    },
    {
      title: "Active Threats",
      value: metrics.activeThreats.toString(),
      description: "Requires immediate attention",
      icon: Shield,
      color: metrics.activeThreats > 0 ? "text-red-600" : "text-green-600",
      bgColor: metrics.activeThreats > 0 ? "bg-red-100" : "bg-green-100",
    },
    {
      title: "Security Score",
      value: `${metrics.securityScore}%`,
      description: "Overall platform security",
      icon: Lock,
      color: metrics.securityScore >= 80 ? "text-green-600" : "text-yellow-600",
      bgColor: metrics.securityScore >= 80 ? "bg-green-100" : "bg-yellow-100",
    },
    {
      title: "Monitored Users",
      value: metrics.monitoredUsers.toLocaleString(),
      description: `${metrics.blockedAttempts} blocked attempts today`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
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
    <div className="space-y-6">
      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {securityCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.bgColor}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Score Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Posture</span>
          </CardTitle>
          <CardDescription>Current security status and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Security Score</span>
              <span className="text-sm text-muted-foreground">{metrics.securityScore}%</span>
            </div>
            <Progress value={metrics.securityScore} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Authentication: Strong</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Monitoring: Good</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Encryption: Strong</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enable 2FA for all admin accounts</li>
              <li>• Review and update security policies</li>
              <li>• Conduct security audit for high-risk users</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
