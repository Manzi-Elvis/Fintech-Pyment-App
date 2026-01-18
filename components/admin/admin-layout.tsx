"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  HelpCircle,
  LogOut,
  Building,
  FileText,
  Bell,
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
  user: any
  profile: any
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { name: "Merchants", href: "/admin/merchants", icon: Building },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminLayout({ children, user, profile }: AdminLayoutProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const userInitials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : user.email?.[0]?.toUpperCase() || "A"

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border/40">
          <SidebarHeader className="border-b border-border/40 p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Izi Pay</span>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start space-x-3 px-3 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-destructive text-destructive-foreground text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoading ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1" />
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 bg-muted/20">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
