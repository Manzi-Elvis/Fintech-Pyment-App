import { createClient } from "@/lib/supabase/server"
import { AuditLogger } from "./audit"
import { SecurityService } from "./security"
import crypto from "crypto"

export interface MerchantAccount {
  id: string
  user_id: string
  business_name: string
  business_type?: string
  website?: string
  api_key: string
  webhook_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentIntent {
  id: string
  merchant_id: string
  amount: number
  currency: string
  description?: string
  customer_email?: string
  customer_id?: string
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled"
  payment_method?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export class MerchantAPIService {
  private supabase
  private auditLogger: AuditLogger
  private securityService: SecurityService

  constructor() {
    this.supabase = createClient()
    this.auditLogger = new AuditLogger()
    this.securityService = new SecurityService()
  }

  // Generate secure API key
  generateApiKey(): string {
    const prefix = "izp_"
    const randomBytes = crypto.randomBytes(32).toString("hex")
    return `${prefix}${randomBytes}`
  }

  // Verify API key and get merchant account
  async verifyApiKey(apiKey: string): Promise<MerchantAccount | null> {
    const { data, error } = await this.supabase
      .from("merchant_accounts")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (error || !data) return null
    return data
  }

  // Create merchant account
  async createMerchantAccount(params: {
    userId: string
    businessName: string
    businessType?: string
    website?: string
    webhookUrl?: string
  }): Promise<MerchantAccount> {
    const apiKey = this.generateApiKey()

    const { data, error } = await this.supabase
      .from("merchant_accounts")
      .insert({
        user_id: params.userId,
        business_name: params.businessName,
        business_type: params.businessType,
        website: params.website,
        api_key: apiKey,
        webhook_url: params.webhookUrl,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await this.auditLogger.log({
      user_id: params.userId,
      action: "merchant_account_created",
      resource_type: "merchant_account",
      resource_id: data.id,
      new_values: { business_name: params.businessName },
    })

    return data
  }

  // Create payment intent
  async createPaymentIntent(
    merchantId: string,
    params: {
      amount: number
      currency?: string
      description?: string
      customerEmail?: string
      customerId?: string
      metadata?: any
    },
  ): Promise<PaymentIntent> {
    const { data, error } = await this.supabase
      .from("payment_intents")
      .insert({
        merchant_id: merchantId,
        amount: params.amount,
        currency: params.currency || "USD",
        description: params.description,
        customer_email: params.customerEmail,
        customer_id: params.customerId,
        status: "pending",
        metadata: params.metadata,
      })
      .select()
      .single()

    if (error) throw error

    await this.auditLogger.log({
      action: "payment_intent_created",
      resource_type: "payment_intent",
      resource_id: data.id,
      new_values: { merchant_id: merchantId, amount: params.amount },
    })

    return data
  }

  // Process payment
  async processPayment(
    paymentIntentId: string,
    params: {
      paymentMethodId: string
      customerEmail: string
    },
  ): Promise<{ success: boolean; paymentIntent: PaymentIntent; error?: string }> {
    try {
      // Get payment intent
      const { data: paymentIntent, error: fetchError } = await this.supabase
        .from("payment_intents")
        .select("*")
        .eq("id", paymentIntentId)
        .single()

      if (fetchError || !paymentIntent) {
        return { success: false, paymentIntent: null as any, error: "Payment intent not found" }
      }

      // Update status to processing
      await this.supabase.from("payment_intents").update({ status: "processing" }).eq("id", paymentIntentId)

      // Simulate payment processing (in real implementation, integrate with payment processor)
      const isSuccessful = Math.random() > 0.1 // 90% success rate for demo

      const newStatus = isSuccessful ? "succeeded" : "failed"

      // Update payment intent status
      const { data: updatedIntent, error: updateError } = await this.supabase
        .from("payment_intents")
        .update({
          status: newStatus,
          payment_method: params.paymentMethodId,
          customer_email: params.customerEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentIntentId)
        .select()
        .single()

      if (updateError) throw updateError

      // Send webhook notification
      if (updatedIntent.merchant_id) {
        await this.sendWebhookNotification(updatedIntent.merchant_id, {
          event: "payment.succeeded",
          data: updatedIntent,
        })
      }

      await this.auditLogger.log({
        action: "payment_processed",
        resource_type: "payment_intent",
        resource_id: paymentIntentId,
        new_values: { status: newStatus },
      })

      return {
        success: isSuccessful,
        paymentIntent: updatedIntent,
        error: isSuccessful ? undefined : "Payment processing failed",
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      return {
        success: false,
        paymentIntent: null as any,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Send webhook notification
  async sendWebhookNotification(merchantId: string, payload: any): Promise<void> {
    try {
      const { data: merchant } = await this.supabase
        .from("merchant_accounts")
        .select("webhook_url")
        .eq("id", merchantId)
        .single()

      if (!merchant?.webhook_url) return

      // In a real implementation, you would queue this for reliable delivery
      await fetch(merchant.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Izi-Pay-Signature": this.generateWebhookSignature(payload),
        },
        body: JSON.stringify(payload),
      })

      await this.auditLogger.log({
        action: "webhook_sent",
        resource_type: "webhook",
        resource_id: merchantId,
        new_values: { url: merchant.webhook_url, event: payload.event },
      })
    } catch (error) {
      console.error("Webhook delivery failed:", error)
    }
  }

  // Generate webhook signature for security
  private generateWebhookSignature(payload: any): string {
    const secret = process.env.WEBHOOK_SECRET || "default_secret"
    return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
  }

  // Get merchant payments
  async getMerchantPayments(
    merchantId: string,
    filters?: {
      status?: string
      startDate?: string
      endDate?: string
      limit?: number
    },
  ): Promise<PaymentIntent[]> {
    let query = this.supabase.from("payment_intents").select("*").eq("merchant_id", merchantId)

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.startDate) query = query.gte("created_at", filters.startDate)
    if (filters?.endDate) query = query.lte("created_at", filters.endDate)

    query = query.order("created_at", { ascending: false }).limit(filters?.limit || 100)

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch merchant payments:", error)
      return []
    }

    return data || []
  }

  // Refund payment
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ success: boolean; refund?: any; error?: string }> {
    try {
      const { data: paymentIntent, error: fetchError } = await this.supabase
        .from("payment_intents")
        .select("*")
        .eq("id", paymentIntentId)
        .single()

      if (fetchError || !paymentIntent) {
        return { success: false, error: "Payment intent not found" }
      }

      if (paymentIntent.status !== "succeeded") {
        return { success: false, error: "Can only refund successful payments" }
      }

      const refundAmount = amount || paymentIntent.amount

      // Create refund record
      const { data: refund, error: refundError } = await this.supabase
        .from("refunds")
        .insert({
          payment_intent_id: paymentIntentId,
          amount: refundAmount,
          reason,
          status: "succeeded",
        })
        .select()
        .single()

      if (refundError) throw refundError

      // Send webhook notification
      await this.sendWebhookNotification(paymentIntent.merchant_id, {
        event: "payment.refunded",
        data: { payment_intent: paymentIntent, refund },
      })

      await this.auditLogger.log({
        action: "payment_refunded",
        resource_type: "payment_intent",
        resource_id: paymentIntentId,
        new_values: { refund_amount: refundAmount, reason },
      })

      return { success: true, refund }
    } catch (error) {
      console.error("Refund processing error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refund failed",
      }
    }
  }
}
