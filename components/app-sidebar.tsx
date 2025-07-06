"use client"

import { Shield, Home, Key, Settings, Download, FolderSyncIcon as Sync, LogOut, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Vault",
    url: "/vault",
    icon: Key,
  },
  {
    title: "Backup",
    url: "/backup",
    icon: Download,
  },
  {
    title: "Sync",
    url: "/sync",
    icon: Sync,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">FortiVault</span>
          <span className="truncate text-xs text-muted-foreground">Password Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Navigation</div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.url
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">User</span>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-green-500" />
              <span className="truncate text-xs text-muted-foreground">Secured</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
