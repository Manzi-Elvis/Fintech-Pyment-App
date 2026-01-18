import { createClient } from "@/lib/supabase/server"
import { cache } from "./cache"
import { optimizeQuery, performanceTracker } from "./performance"

export class OptimizedWalletService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  // Cached wallet balance lookup
  async getUserWallets(userId: string): Promise<any[]> {
    return optimizeQuery(
      async () => {
        const { data, error } = await this.supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .order("is_primary", { ascending: false })

        if (error) throw error
        return data || []
      },
      `wallets:${userId}`,
      60, // Cache for 1 minute
    )
  }

  // Optimized transaction history with pagination
  async getUserTransactions(
    userId: string,
    options: {
      limit?: number
      offset?: number
      status?: string
      startDate?: string
      endDate?: string
    } = {},
  ): Promise<{ transactions: any[]; total: number }> {
    const { limit = 50, offset = 0, status, startDate, endDate } = options

    return optimizeQuery(
      async () => {
        let query = this.supabase
          .from("transactions")
          .select("*, profiles!sender_id(first_name, last_name), profiles!receiver_id(first_name, last_name)", {
            count: "exact",
          })
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

        if (status) query = query.eq("status", status)
        if (startDate) query = query.gte("created_at", startDate)
        if (endDate) query = query.lte("created_at", endDate)

        query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) throw error

        return {
          transactions: data || [],
          total: count || 0,
        }
      },
      `transactions:${userId}:${JSON.stringify(options)}`,
      30, // Cache for 30 seconds
    )
  }

  // Batch wallet updates for better performance
  async batchUpdateWallets(
    updates: Array<{
      walletId: string
      amount: number
      type: "credit" | "debit"
    }>,
  ): Promise<void> {
    const timer = performanceTracker.startTimer("batch_wallet_update")

    try {
      // Use database transaction for consistency
      const { error } = await this.supabase.rpc("batch_update_wallets", {
        updates: updates,
      })

      if (error) throw error

      // Invalidate relevant caches
      for (const update of updates) {
        const { data: wallet } = await this.supabase
          .from("wallets")
          .select("user_id")
          .eq("id", update.walletId)
          .single()

        if (wallet) {
          cache.delete(`wallets:${wallet.user_id}`)
        }
      }
    } finally {
      timer()
    }
  }

  // Optimized balance calculation with caching
  async getAggregatedBalance(userId: string): Promise<{
    totalBalance: number
    availableBalance: number
    pendingBalance: number
  }> {
    return optimizeQuery(
      async () => {
        const { data, error } = await this.supabase.rpc("get_user_balance_summary", { user_id: userId })

        if (error) throw error

        return (
          data || {
            totalBalance: 0,
            availableBalance: 0,
            pendingBalance: 0,
          }
        )
      },
      `balance_summary:${userId}`,
      120, // Cache for 2 minutes
    )
  }
}
