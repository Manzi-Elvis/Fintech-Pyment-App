import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SecurityOverview } from "@/components/admin/security-overview"
import { SecurityAlerts } from "@/components/admin/security-alerts"
import { AuditLogs } from "@/components/admin/audit-logs"

export default async function SecurityPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <AdminLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Center</h1>
            <p className="text-muted-foreground">Monitor security threats and audit platform activity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overview & Alerts */}
          <div className="lg:col-span-2 space-y-6">
            <SecurityOverview />
            <SecurityAlerts />
          </div>

          {/* Right Column - Audit Logs */}
          <div className="space-y-6">
            <AuditLogs />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
