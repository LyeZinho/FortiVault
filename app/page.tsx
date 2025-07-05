"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { VaultGrid } from "@/components/vault-grid"
import { Dashboard } from "@/components/dashboard"
import { Settings } from "@/components/settings"
import { Backup } from "@/components/backup"
import { Sync } from "@/components/sync"
import { PasswordModal } from "@/components/password-modal"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { useVault } from "@/hooks/use-vault"
import type { Password } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isVaultSetup, isLoading } = useAuth()
  const { folders } = useVault()
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [editingPassword, setEditingPassword] = useState<Password | null>(null)

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading FortiVault...</p>
        </div>
      </div>
    )
  }

  // Show setup form if vault is not setup
  if (!isVaultSetup) {
    return <LoginForm isSetup={true} />
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm isSetup={false} />
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "vault":
        return (
          <VaultGrid
            onEditPassword={(password) => {
              setEditingPassword(password)
              setIsPasswordModalOpen(true)
            }}
          />
        )
      case "backup":
        return <Backup />
      case "sync":
        return <Sync />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          onNewPassword={() => {
            setEditingPassword(null)
            setIsPasswordModalOpen(true)
          }}
          currentView={activeView}
        />

        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false)
          setEditingPassword(null)
        }}
        password={editingPassword}
      />
    </div>
  )
}
