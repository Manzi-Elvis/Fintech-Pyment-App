"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

// Mock data for charts
const transactionData = [
  { name: "Jan", transactions: 4000, volume: 240000 },
  { name: "Feb", transactions: 3000, volume: 180000 },
  { name: "Mar", transactions: 5000, volume: 320000 },
  { name: "Apr", transactions: 4500, volume: 290000 },
  { name: "May", transactions: 6000, volume: 380000 },
  { name: "Jun", transactions: 5500, volume: 350000 },
]

const userGrowthData = [
  { name: "Jan", users: 1000 },
  { name: "Feb", users: 1200 },
  { name: "Mar", users: 1800 },
  { name: "Apr", users: 2200 },
  { name: "May", users: 2800 },
  { name: "Jun", users: 3200 },
]

export function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* Transaction Volume Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction Overview</CardTitle>
            <CardDescription>Monthly transaction count and volume</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="transactions" fill="hsl(var(--primary))" name="Transactions" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
