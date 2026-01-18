import { type NextRequest, NextResponse } from "next/server"
import { MerchantAPIService } from "@/lib/merchant-api"
import { headers } from "next/headers"

const merchantAPI = new MerchantAPIService()

async function authenticateRequest(request: NextRequest) {
  const headersList = await headers()
  const authorization = headersList.get("authorization")

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401 }
  }

  const apiKey = authorization.replace("Bearer ", "")
  const merchant = await merchantAPI.verifyApiKey(apiKey)

  if (!merchant) {
    return { error: "Invalid API key", status: 401 }
  }

  return { merchant }
}

// Refund payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateRequest(request)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { amount, reason } = body

    const result = await merchantAPI.refundPayment(id, amount ? Number.parseFloat(amount) : undefined, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      id: result.refund?.id,
      amount: result.refund?.amount,
      status: result.refund?.status,
      reason: result.refund?.reason,
      created_at: result.refund?.created_at,
    })
  } catch (error) {
    console.error("Refund processing error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
