"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { ServerConfig } from "@/components/server-config"
import { apiClient } from "@/lib/api-client"
import type React from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const [serverConfigured, setServerConfigured] = useState(false)
  const [checkingServer, setCheckingServer] = useState(true)

  useEffect(() => {
    const checkServerConfig = async () => {
      const savedUrl = localStorage.getItem("fortivault_server_url")

      if (savedUrl) {
        // Test if the saved server is still accessible
        const health = await apiClient.healthCheck()
        if (!health.error) {
          setServerConfigured(true)
        } else {
          // Server is not accessible, need to reconfigure
          localStorage.removeItem("fortivault_server_url")
          setServerConfigured(false)
        }
      } else {
        setServerConfigured(false)
      }

      setCheckingServer(false)
    }

    checkServerConfig()
  }, [])

  const handleServerConfigured = (serverUrl: string) => {
    apiClient.setServerUrl(serverUrl)
    setServerConfigured(true)
  }

  if (isLoading || checkingServer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading FortiVault...</p>
        </div>
      </div>
    )
  }

  // Show server configuration if not configured
  if (!serverConfigured) {
    return <ServerConfig onConfigured={handleServerConfigured} />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    )
  }

  return <>{children}</>
}
