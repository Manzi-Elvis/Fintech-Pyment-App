"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Send, Download, CreditCard, QrCode } from "lucide-react"

export function QuickActions() {
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sendForm, setSendForm] = useState({
    email: "",
    amount: "",
    description: "",
  })

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/transactions/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverEmail: sendForm.email,
          amount: sendForm.amount,
          description: sendForm.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSendMoneyOpen(false)
        setSendForm({ email: "", amount: "", description: "" })
        // Show success message or refresh data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Send money error:", error)
      // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Dialog open={sendMoneyOpen} onOpenChange={setSendMoneyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <Send className="w-6 h-6" />
                <span className="text-sm">Send Money</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
                <DialogDescription>Send money to another Izi Pay user by email address.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMoney} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="recipient@example.com"
                    value={sendForm.email}
                    onChange={(e) => setSendForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this for?"
                    value={sendForm.description}
                    onChange={(e) => setSendForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSendMoneyOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Money"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
            <Download className="w-6 h-6" />
            <span className="text-sm">Request Money</span>
          </Button>

          <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
            <CreditCard className="w-6 h-6" />
            <span className="text-sm">Add Funds</span>
          </Button>

          <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
            <QrCode className="w-6 h-6" />
            <span className="text-sm">QR Code</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
