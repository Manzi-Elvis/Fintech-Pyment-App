import { createClient } from "@/lib/supabase/server"

export interface Wallet {
  id: string
  user_id: string
  currency: string
  balance: number
  available_balance: number
  pending_balance: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  sender_id?: string
  receiver_id?: string
  sender_wallet_id?: string
  receiver_wallet_id?: string
  amount: number
  currency: string
  fee: number
  net_amount: number
  transaction_type: "send" | "receive" | "deposit" | "withdrawal" | "refund"
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded"
  description?: string
  reference_id?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export class WalletService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getPrimaryWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  }

  async createWallet(userId: string, currency = "USD"): Promise<Wallet> {
    const { data, error } = await this.supabase
      .from("wallets")
      .insert({
        user_id: userId,
        currency,
        is_primary: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getWalletBalance(walletId: string): Promise<number> {
    const { data, error } = await this.supabase.from("wallets").select("available_balance").eq("id", walletId).single()

    if (error) throw error
    return data.available_balance
  }

  async updateWalletBalance(walletId: string, amount: number, type: "credit" | "debit"): Promise<void> {
    const { data: wallet, error: fetchError } = await this.supabase
      .from("wallets")
      .select("balance, available_balance")
      .eq("id", walletId)
      .single()

    if (fetchError) throw fetchError

    const newBalance = type === "credit" ? wallet.balance + amount : wallet.balance - amount

    const newAvailableBalance =
      type === "credit" ? wallet.available_balance + amount : wallet.available_balance - amount

    if (newAvailableBalance < 0) {
      throw new Error("Insufficient funds")
    }

    const { error } = await this.supabase
      .from("wallets")
      .update({
        balance: newBalance,
        available_balance: newAvailableBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", walletId)

    if (error) throw error
  }
}

export class TransactionService {
  private supabase
  private walletService: WalletService

  constructor() {
    this.supabase = createClient()
    this.walletService = new WalletService()
  }

  async createTransaction(params: {
    senderId?: string
    receiverId?: string
    amount: number
    currency?: string
    type: Transaction["transaction_type"]
    description?: string
    metadata?: any
  }): Promise<Transaction> {
    const { senderId, receiverId, amount, currency = "USD", type, description, metadata } = params

    // Calculate fee (2.9% + $0.30 for external transactions)
    const fee = type === "send" ? amount * 0.029 + 0.3 : 0
    const netAmount = amount - fee

    // Generate reference ID
    const referenceId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    let senderWalletId, receiverWalletId

    if (senderId) {
      const senderWallet = await this.walletService.getPrimaryWallet(senderId)
      if (!senderWallet) throw new Error("Sender wallet not found")
      senderWalletId = senderWallet.id
    }

    if (receiverId) {
      const receiverWallet = await this.walletService.getPrimaryWallet(receiverId)
      if (!receiverWallet) throw new Error("Receiver wallet not found")
      receiverWalletId = receiverWallet.id
    }

    const { data, error } = await this.supabase
      .from("transactions")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        sender_wallet_id: senderWalletId,
        receiver_wallet_id: receiverWalletId,
        amount,
        currency,
        fee,
        net_amount: netAmount,
        transaction_type: type,
        status: "pending",
        description,
        reference_id: referenceId,
        metadata,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async processTransaction(transactionId: string): Promise<void> {
    const { data: transaction, error: fetchError } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (fetchError) throw fetchError

    if (transaction.status !== "pending") {
      throw new Error("Transaction is not in pending status")
    }

    try {
      // For send transactions, debit sender and credit receiver
      if (transaction.transaction_type === "send") {
        if (transaction.sender_wallet_id) {
          await this.walletService.updateWalletBalance(transaction.sender_wallet_id, transaction.amount, "debit")
        }

        if (transaction.receiver_wallet_id) {
          await this.walletService.updateWalletBalance(transaction.receiver_wallet_id, transaction.net_amount, "credit")
        }
      }

      // For deposit transactions, credit the wallet
      if (transaction.transaction_type === "deposit" && transaction.receiver_wallet_id) {
        await this.walletService.updateWalletBalance(transaction.receiver_wallet_id, transaction.net_amount, "credit")
      }

      // For withdrawal transactions, debit the wallet
      if (transaction.transaction_type === "withdrawal" && transaction.sender_wallet_id) {
        await this.walletService.updateWalletBalance(transaction.sender_wallet_id, transaction.amount, "debit")
      }

      // Update transaction status to completed
      const { error } = await this.supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      if (error) throw error
    } catch (error) {
      // Mark transaction as failed
      await this.supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      throw error
    }
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await this.supabase.from("transactions").select("*").eq("id", transactionId).single()

    if (error && error.code !== "PGRST116") throw error
    return data
  }
}
