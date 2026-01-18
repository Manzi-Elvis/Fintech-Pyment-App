"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Plus, Minus } from "lucide-react"

interface Transaction {
  id: string
  sender_id?: string
  receiver_id?: string
  amount: number
  currency: string
  fee: number
  net_amount: number
  transaction_type: "send" | "receive" | "deposit" | "withdrawal" | "refund"
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded"
  description?: string
  reference_id?: string
  created_at: string
}

interface RecentTransactionsProps {
  userId: string
}

export function RecentTransactions({ userId }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [userId])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?limit=5`)
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (type: string, isOutgoing: boolean) => {
    if (type === "deposit") return <Plus className="w-4 h-4 text-green-600" />
    if (type === "withdrawal") return <Minus className="w-4 h-4 text-red-600" />
    return isOutgoing ? (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
      refunded: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest payment activity</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start by sending money or adding funds to your wallet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isOutgoing = transaction.sender_id === userId
              const amount = isOutgoing ? -transaction.amount : transaction.net_amount

              return (
                <div
                  key={transaction.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.transaction_type, isOutgoing)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {transaction.description || (isOutgoing ? "Money Sent" : "Money Received")}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {amount >= 0 ? "+" : ""}${Math.abs(amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
