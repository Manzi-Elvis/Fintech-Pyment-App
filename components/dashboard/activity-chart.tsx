"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ActivityChartProps {
  userId: string
}

// Mock data for demonstration
const mockData = [
  { name: "Jan", sent: 1200, received: 800 },
  { name: "Feb", sent: 1900, received: 1200 },
  { name: "Mar", sent: 800, received: 1500 },
  { name: "Apr", sent: 1600, received: 900 },
  { name: "May", sent: 2200, received: 1800 },
  { name: "Jun", sent: 1800, received: 1400 },
]

export function ActivityChart({ userId }: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>Your payment activity over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value}`, ""]}
              />
              <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" radius={[2, 2, 0, 0]} />
              <Bar dataKey="received" fill="hsl(var(--primary) / 0.6)" name="Received" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
