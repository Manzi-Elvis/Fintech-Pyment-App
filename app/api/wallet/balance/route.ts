import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletService } from "@/lib/wallet"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const walletService = new WalletService()
    const wallets = await walletService.getUserWallets(user.id)

    return NextResponse.json({ wallets })
  } catch (error) {
    console.error("Wallet balance error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wallet balance" },
      { status: 500 },
    )
  }
}
