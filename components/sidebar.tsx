"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Shield,
  HardDrive,
  RefreshCw,
  Settings,
  LogOut,
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  folders: any[]
  selectedFolder: string | null
  onFolderSelect: (folderId: string | null) => void
}

export function Sidebar({ activeView, onViewChange, folders, selectedFolder, onFolderSelect }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vault", label: "Password Vault", icon: Shield },
    { id: "backup", label: "Backup", icon: HardDrive },
    { id: "sync", label: "Synchronization", icon: RefreshCw },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  return (
    <div className="w-64 border-r bg-card/50 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">FortiVault</h1>
            <p className="text-xs text-muted-foreground">Decentralized & Secure</p>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", activeView === item.id && "bg-secondary/80")}
                onClick={() => onViewChange(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}

            <Separator className="my-4" />

            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm font-medium text-muted-foreground">Folders</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Button
                variant={selectedFolder === null ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => onFolderSelect(null)}
              >
                <Folder className="h-4 w-4" />
                All Items
                <Badge variant="secondary" className="ml-auto">
                  {folders.reduce((acc, folder) => acc + folder.count, 0)}
                </Badge>
              </Button>

              {folders.map((folder) => (
                <div key={folder.id}>
                  <Button
                    variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 mr-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFolder(folder.id)
                      }}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    <Folder className="h-4 w-4" />
                    {folder.name}
                    <Badge variant="secondary" className="ml-auto">
                      {folder.count}
                    </Badge>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Lock Vault
          </Button>
        </div>
      </div>
    </div>
  )
}
