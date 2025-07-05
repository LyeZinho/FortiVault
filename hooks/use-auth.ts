"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  isAuthenticated: boolean
  isVaultSetup: boolean
  isLoading: boolean
  login: (masterPassword: string) => Promise<boolean>
  setupVault: (masterPassword: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVaultSetup, setIsVaultSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const status = await apiClient.getAuthStatus()
      setIsAuthenticated(status.authenticated)
      setIsVaultSetup(status.vault_setup)
    } catch (error) {
      console.error("Auth status check failed:", error)
      setIsAuthenticated(false)
      setIsVaultSetup(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(masterPassword)

      if (response.access_token) {
        setIsAuthenticated(true)
        toast({
          title: "Login successful",
          description: "Welcome back to FortiVault!",
        })
        return true
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid master password",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const setupVault = async (masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.setupVault(masterPassword)

      if (response.access_token) {
        setIsAuthenticated(true)
        setIsVaultSetup(true)
        toast({
          title: "Vault setup successful",
          description: "Your secure vault is now ready!",
        })
        return true
      } else {
        throw new Error(response.message || "Setup failed")
      }
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "Could not setup vault",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
      setIsAuthenticated(false)
      toast({
        title: "Logged out",
        description: "Your vault has been locked securely",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isVaultSetup,
        isLoading,
        login,
        setupVault,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
