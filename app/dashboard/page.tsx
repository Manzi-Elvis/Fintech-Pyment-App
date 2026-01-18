import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { WalletOverview } from "@/components/dashboard/wallet-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { ActivityChart } from "@/components/dashboard/activity-chart"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile?.first_name || "User"}</h1>
            <p className="text-muted-foreground">Here's what's happening with your account today.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <WalletOverview userId={user.id} />
            <QuickActions />
            <ActivityChart userId={user.id} />
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="space-y-6">
            <RecentTransactions userId={user.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
