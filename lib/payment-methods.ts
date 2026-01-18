import { createClient } from "@/lib/supabase/server"

export interface PaymentMethod {
  id: string
  user_id: string
  type: "bank_account" | "credit_card" | "debit_card"
  provider?: string
  last_four?: string
  is_verified: boolean
  is_primary: boolean
  metadata?: any
  created_at: string
  updated_at: string
}

export class PaymentMethodService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await this.supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })

    if (error) throw error
    return data || []
  }

  async addPaymentMethod(params: {
    userId: string
    type: PaymentMethod["type"]
    provider?: string
    lastFour?: string
    metadata?: any
  }): Promise<PaymentMethod> {
    const { userId, type, provider, lastFour, metadata } = params

    const { data, error } = await this.supabase
      .from("payment_methods")
      .insert({
        user_id: userId,
        type,
        provider,
        last_four: lastFour,
        is_verified: false,
        is_primary: false,
        metadata,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async setPrimaryPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // First, unset all primary flags for this user
    await this.supabase.from("payment_methods").update({ is_primary: false }).eq("user_id", userId)

    // Then set the selected one as primary
    const { error } = await this.supabase
      .from("payment_methods")
      .update({ is_primary: true })
      .eq("id", paymentMethodId)
      .eq("user_id", userId)

    if (error) throw error
  }

  async verifyPaymentMethod(paymentMethodId: string): Promise<void> {
    const { error } = await this.supabase
      .from("payment_methods")
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentMethodId)

    if (error) throw error
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const { error } = await this.supabase
      .from("payment_methods")
      .delete()
      .eq("id", paymentMethodId)
      .eq("user_id", userId)

    if (error) throw error
  }
}
