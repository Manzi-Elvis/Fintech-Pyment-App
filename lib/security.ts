import { createClient } from "@/lib/supabase/server"
import { AuditLogger } from "./audit"

export interface SecurityAlert {
  id: string
  user_id?: string
  alert_type:
    | "suspicious_login"
    | "multiple_failed_attempts"
    | "unusual_transaction"
    | "account_takeover"
    | "fraud_detected"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  metadata?: any
  status: "open" | "investigating" | "resolved" | "false_positive"
  created_at: string
}

export class SecurityService {
  private supabase
  private auditLogger: AuditLogger

  constructor() {
    this.supabase = createClient()
    this.auditLogger = new AuditLogger()
  }

  async createSecurityAlert(alert: Omit<SecurityAlert, "id" | "created_at" | "status">): Promise<SecurityAlert> {
    const { data, error } = await this.supabase
      .from("security_alerts")
      .insert({
        ...alert,
        status: "open",
      })
      .select()
      .single()

    if (error) throw error

    // Log the security alert creation
    await this.auditLogger.log({
      user_id: alert.user_id,
      action: "security_alert_created",
      resource_type: "security_alert",
      resource_id: data.id,
      new_values: alert,
    })

    return data
  }

  async checkSuspiciousActivity(userId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    // Check for multiple failed login attempts in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: failedAttempts } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("action", "login_failed")
      .gte("created_at", oneHourAgo)

    if (failedAttempts && failedAttempts.length >= 5) {
      await this.createSecurityAlert({
        user_id: userId,
        alert_type: "multiple_failed_attempts",
        severity: "high",
        description: `User ${userId} has ${failedAttempts.length} failed login attempts in the last hour`,
        metadata: { ip_address: ipAddress, user_agent: userAgent, attempt_count: failedAttempts.length },
      })
      return true
    }

    // Check for login from new location/device
    const { data: recentLogins } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("action", "login_success")
      .order("created_at", { ascending: false })
      .limit(10)

    const hasLoginFromSameIP = recentLogins?.some((log) => log.ip_address === ipAddress)

    if (!hasLoginFromSameIP && recentLogins && recentLogins.length > 0) {
      await this.createSecurityAlert({
        user_id: userId,
        alert_type: "suspicious_login",
        severity: "medium",
        description: `Login from new IP address: ${ipAddress}`,
        metadata: { ip_address: ipAddress, user_agent: userAgent },
      })
    }

    return false
  }

  async analyzeTransaction(transactionData: {
    userId: string
    amount: number
    receiverId?: string
    ipAddress?: string
  }): Promise<{ isSuspicious: boolean; riskScore: number; reasons: string[] }> {
    const { userId, amount, receiverId, ipAddress } = transactionData
    let riskScore = 0
    const reasons: string[] = []

    // Check transaction amount against user's history
    const { data: userTransactions } = await this.supabase
      .from("transactions")
      .select("amount")
      .eq("sender_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20)

    if (userTransactions && userTransactions.length > 0) {
      const avgAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length
      const maxAmount = Math.max(...userTransactions.map((t) => t.amount))

      // Flag if transaction is significantly larger than usual
      if (amount > avgAmount * 5) {
        riskScore += 30
        reasons.push("Transaction amount significantly higher than user average")
      }

      if (amount > maxAmount * 2) {
        riskScore += 20
        reasons.push("Transaction amount exceeds previous maximum by 2x")
      }
    }

    // Check for rapid successive transactions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentTransactions } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("sender_id", userId)
      .gte("created_at", fiveMinutesAgo)

    if (recentTransactions && recentTransactions.length >= 3) {
      riskScore += 25
      reasons.push("Multiple transactions in short time period")
    }

    // Check for high-value transactions
    if (amount > 10000) {
      riskScore += 15
      reasons.push("High-value transaction")
    }

    // Check if receiver is new
    if (receiverId) {
      const { data: previousTransactions } = await this.supabase
        .from("transactions")
        .select("*")
        .eq("sender_id", userId)
        .eq("receiver_id", receiverId)
        .limit(1)

      if (!previousTransactions || previousTransactions.length === 0) {
        riskScore += 10
        reasons.push("Transaction to new recipient")
      }
    }

    const isSuspicious = riskScore >= 40

    if (isSuspicious) {
      await this.createSecurityAlert({
        user_id: userId,
        alert_type: "unusual_transaction",
        severity: riskScore >= 60 ? "high" : "medium",
        description: `Suspicious transaction detected: $${amount}`,
        metadata: {
          amount,
          receiver_id: receiverId,
          risk_score: riskScore,
          reasons,
          ip_address: ipAddress,
        },
      })
    }

    return { isSuspicious, riskScore, reasons }
  }

  async getSecurityAlerts(filters?: {
    userId?: string
    alertType?: string
    severity?: string
    status?: string
    limit?: number
  }): Promise<SecurityAlert[]> {
    let query = this.supabase.from("security_alerts").select("*")

    if (filters?.userId) query = query.eq("user_id", filters.userId)
    if (filters?.alertType) query = query.eq("alert_type", filters.alertType)
    if (filters?.severity) query = query.eq("severity", filters.severity)
    if (filters?.status) query = query.eq("status", filters.status)

    query = query.order("created_at", { ascending: false }).limit(filters?.limit || 50)

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch security alerts:", error)
      return []
    }

    return data || []
  }

  async updateAlertStatus(alertId: string, status: SecurityAlert["status"], adminUserId: string): Promise<void> {
    const { error } = await this.supabase
      .from("security_alerts")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", alertId)

    if (error) throw error

    await this.auditLogger.log({
      user_id: adminUserId,
      action: "security_alert_updated",
      resource_type: "security_alert",
      resource_id: alertId,
      new_values: { status },
    })
  }
}
