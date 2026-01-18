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

// Process payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateRequest(request)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { payment_method_id, customer_email } = body

    if (!payment_method_id || !customer_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await merchantAPI.processPayment(id, {
      paymentMethodId: payment_method_id,
      customerEmail: customer_email,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      id: result.paymentIntent.id,
      status: result.paymentIntent.status,
      amount: result.paymentIntent.amount,
      currency: result.paymentIntent.currency,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
