import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminOverview } from "@/components/admin/admin-overview"
import { RecentActivity } from "@/components/admin/recent-activity"
import { SystemHealth } from "@/components/admin/system-health"
import { QuickStats } from "@/components/admin/quick-stats"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user has admin privileges (you might want to add an admin role check here)
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // For demo purposes, we'll allow access. In production, add proper role checking
  // if (!profile?.is_admin) {
  //   redirect("/dashboard")
  // }

  return (
    <AdminLayout user={user} profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage your Izi Pay platform</p>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overview & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <AdminOverview />
            <RecentActivity />
          </div>

          {/* Right Column - System Health */}
          <div className="space-y-6">
            <SystemHealth />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
