import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TransactionService } from "@/lib/wallet"

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

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const transactionService = new TransactionService()
    const transactions = await transactionService.getUserTransactions(user.id, limit)

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Transactions fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transactions" },
      { status: 500 },
    )
  }
}
