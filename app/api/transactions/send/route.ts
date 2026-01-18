import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TransactionService } from "@/lib/wallet"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { receiverEmail, amount, description } = body

    if (!receiverEmail || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Find receiver by email
    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", receiverEmail)
      .single()

    if (receiverError || !receiverProfile) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 })
    }

    const transactionService = new TransactionService()

    // Create the transaction
    const transaction = await transactionService.createTransaction({
      senderId: user.id,
      receiverId: receiverProfile.id,
      amount: Number.parseFloat(amount),
      type: "send",
      description,
    })

    // Process the transaction immediately
    await transactionService.processTransaction(transaction.id)

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        reference_id: transaction.reference_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
      },
    })
  } catch (error) {
    console.error("Transaction error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transaction failed" }, { status: 500 })
  }
}
