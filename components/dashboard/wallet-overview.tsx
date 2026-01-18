"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Eye, EyeOff, TrendingUp } from "lucide-react"

interface WalletData {
  id: string
  currency: string
  balance: number
  available_balance: number
  pending_balance: number
  is_primary: boolean
}

interface WalletOverviewProps {
  userId: string
}

export function WalletOverview({ userId }: WalletOverviewProps) {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [showBalance, setShowBalance] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWallets()
  }, [userId])

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallet/balance")
      const data = await response.json()
      setWallets(data.wallets || [])
    } catch (error) {
      console.error("Failed to fetch wallets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const primaryWallet = wallets.find((w) => w.is_primary) || wallets[0]
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.available_balance, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Primary Wallet */}
      <Card className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Primary Wallet</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Wallet className="w-4 h-4 opacity-90" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {showBalance ? `$${primaryWallet?.available_balance?.toFixed(2) || "0.00"}` : "••••••"}
          </div>
          <p className="text-xs opacity-90 mt-1">{primaryWallet?.currency || "USD"} • Available Balance</p>
          {primaryWallet?.pending_balance > 0 && (
            <div className="mt-2">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                ${primaryWallet.pending_balance.toFixed(2)} pending
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Portfolio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{showBalance ? `$${totalBalance.toFixed(2)}` : "••••••"}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.5% this month
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
