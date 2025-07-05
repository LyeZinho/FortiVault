"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Folder, Download, Upload } from "lucide-react"

interface TopBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onNewPassword: () => void
  currentView: string
}

export function TopBar({ searchTerm, onSearchChange, onNewPassword, currentView }: TopBarProps) {
  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard"
      case "vault":
        return "Password Vault"
      case "backup":
        return "Backup & Restore"
      case "sync":
        return "Synchronization"
      case "settings":
        return "Settings"
      default:
        return "FortiVault"
    }
  }

  return (
    <div className="border-b bg-card/30 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{getViewTitle()}</h2>
          <Badge variant="outline" className="text-xs">
            🔒 Encrypted Locally
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {currentView === "vault" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Button onClick={onNewPassword} className="gap-2">
                <Plus className="h-4 w-4" />
                New Password
              </Button>

              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Folder className="h-4 w-4" />
                New Folder
              </Button>
            </>
          )}

          {currentView === "backup" && (
            <>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
