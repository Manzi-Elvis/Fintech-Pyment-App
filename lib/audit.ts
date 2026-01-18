import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  id?: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export class AuditLogger {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async log(entry: Omit<AuditLogEntry, "id" | "created_at">): Promise<void> {
    try {
      const { error } = await this.supabase.from("audit_logs").insert({
        user_id: entry.user_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      })

      if (error) {
        console.error("Failed to log audit entry:", error)
      }
    } catch (error) {
      console.error("Audit logging error:", error)
    }
  }

  async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: { oldValues?: any; newValues?: any; ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: metadata?.oldValues,
      new_values: metadata?.newValues,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
    })
  }

  async getAuditLogs(filters?: {
    userId?: string
    action?: string
    resourceType?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<AuditLogEntry[]> {
    let query = this.supabase.from("audit_logs").select("*")

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId)
    }
    if (filters?.action) {
      query = query.eq("action", filters.action)
    }
    if (filters?.resourceType) {
      query = query.eq("resource_type", filters.resourceType)
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    query = query.order("created_at", { ascending: false }).limit(filters?.limit || 100)

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch audit logs:", error)
      return []
    }

    return data || []
  }
}
