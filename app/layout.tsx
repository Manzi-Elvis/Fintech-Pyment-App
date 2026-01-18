import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Izi Pay - The Future of Digital Payments",
  description:
    "Experience lightning-fast, secure payments with Izi Pay. Send money globally, manage your finances, and grow your business with our advanced fintech platform.",
  generator: "MRE Corp",
  keywords: "fintech, payments, digital wallet, money transfer, secure payments",
  authors: [{ name: "Izi Pay Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Izi Pay - The Future of Digital Payments",
    description: "Experience lightning-fast, secure payments with Izi Pay.",
    type: "website",
    locale: "en_US",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#000000" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <PerformanceMonitor>{children}</PerformanceMonitor>
          </ThemeProvider>
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
