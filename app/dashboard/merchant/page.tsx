import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MerchantOverview } from "@/components/merchant/merchant-overview"
import { APIKeyManagement } from "@/components/merchant/api-key-management"
import { PaymentHistory } from "@/components/merchant/payment-history"

export default async function MerchantDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user has merchant account
  const { data: merchantAccount } = await supabase.from("merchant_accounts").select("*").eq("user_id", user.id).single()

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Merchant Dashboard</h1>
            <p className="text-muted-foreground">Manage your payment integrations and API access</p>
          </div>
        </div>

        {merchantAccount ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <MerchantOverview merchantAccount={merchantAccount} />
              <PaymentHistory merchantId={merchantAccount.id} />
            </div>
            <div className="space-y-6">
              <APIKeyManagement merchantAccount={merchantAccount} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Merchant Account Found</h2>
            <p className="text-muted-foreground mb-6">Create a merchant account to start accepting payments</p>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg">Create Merchant Account</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
