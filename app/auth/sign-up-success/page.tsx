import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Izi Pay!</CardTitle>
              <CardDescription>Please verify your email to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                We've sent a verification link to your email address. Please check your inbox and click the link to
                activate your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
