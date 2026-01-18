import { type NextRequest, NextResponse } from "next/server"
import { MerchantAPIService } from "@/lib/merchant-api"
import { headers } from "next/headers"

const merchantAPI = new MerchantAPIService()

// Rate limiting helper
async function checkRateLimit(apiKey: string, endpoint: string): Promise<boolean> {
  // Simple rate limiting: 100 requests per minute per API key
  // In production, use Redis or similar for distributed rate limiting
  return true // Simplified for demo
}

// Authenticate API request
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

  const rateLimitOk = await checkRateLimit(apiKey, request.nextUrl.pathname)
  if (!rateLimitOk) {
    return { error: "Rate limit exceeded", status: 429 }
  }

  return { merchant }
}

// Create payment intent
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { amount, currency, description, customer_email, customer_id, metadata } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const paymentIntent = await merchantAPI.createPaymentIntent(auth.merchant.id, {
      amount: Number.parseFloat(amount),
      currency,
      description,
      customerEmail: customer_email,
      customerId: customer_id,
      metadata,
    })

    return NextResponse.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created_at: paymentIntent.created_at,
    })
  } catch (error) {
    console.error("Payment intent creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// Get merchant payments
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const startDate = searchParams.get("start_date") || undefined
    const endDate = searchParams.get("end_date") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const payments = await merchantAPI.getMerchantPayments(auth.merchant.id, {
      status,
      startDate,
      endDate,
      limit,
    })

    return NextResponse.json({
      data: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        customer_email: payment.customer_email,
        created_at: payment.created_at,
      })),
      count: payments.length,
    })
  } catch (error) {
    console.error("Payments fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
