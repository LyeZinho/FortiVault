"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  login: (username: string, password: string, totpCode?: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  setup2FA: () => Promise<{ secret: string; qrCode: string } | null>
  verify2FA: (totpCode: string) => Promise<string[] | null>
  disable2FA: (totpCode: string) => Promise<boolean>
  setupMasterPassword: (password: string) => Promise<boolean>
  verifyMasterPassword: (password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      if (apiClient.loadToken()) {
        const health = await apiClient.healthCheck()
        if (!health.error) {
          setIsAuthenticated(true)
          // TODO: Get user info
        } else {
          apiClient.logout()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.register(username, email, password)

      if (response.error) {
        toast({
          title: "Registration failed",
          description: response.error,
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials",
      })
      return true
    } catch (error) {
      toast({
        title: "Registration error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
      return false
    }
  }

  const login = async (username: string, password: string, totpCode?: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(username, password, totpCode)

      if (response.error) {
        if (response.error === "2FA code required") {
          toast({
            title: "2FA Required",
            description: "Please enter your 2FA code",
            variant: "default",
          })
        } else {
          toast({
            title: "Login failed",
            description: response.error,
            variant: "destructive",
          })
        }
        return false
      }

      setIsAuthenticated(true)
      setUser({ username }) // TODO: Get full user info
      toast({
        title: "Welcome back!",
        description: "Successfully logged into your vault",
      })
      return true
    } catch (error) {
      toast({
        title: "Login error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    setIsAuthenticated(false)
    setUser(null)
    toast({
      title: "Logged out",
      description: "Your vault has been locked",
    })
  }

  const setup2FA = async (): Promise<{ secret: string; qrCode: string } | null> => {
    try {
      const response = await apiClient.setup2FA()

      if (response.error) {
        toast({
          title: "2FA Setup Failed",
          description: response.error,
          variant: "destructive",
        })
        return null
      }

      return {
        secret: response.data.secret,
        qrCode: response.data.qr_code,
      }
    } catch (error) {
      toast({
        title: "2FA Setup Error",
        description: "Failed to setup 2FA",
        variant: "destructive",
      })
      return null
    }
  }

  const verify2FA = async (totpCode: string): Promise<string[] | null> => {
    try {
      const response = await apiClient.verify2FA(totpCode)

      if (response.error) {
        toast({
          title: "2FA Verification Failed",
          description: response.error,
          variant: "destructive",
        })
        return null
      }

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled",
      })

      return response.data.backup_codes
    } catch (error) {
      toast({
        title: "2FA Verification Error",
        description: "Failed to verify 2FA",
        variant: "destructive",
      })
      return null
    }
  }

  const disable2FA = async (totpCode: string): Promise<boolean> => {
    try {
      const response = await apiClient.disable2FA(totpCode)

      if (response.error) {
        toast({
          title: "2FA Disable Failed",
          description: response.error,
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      })
      return true
    } catch (error) {
      toast({
        title: "2FA Disable Error",
        description: "Failed to disable 2FA",
        variant: "destructive",
      })
      return false
    }
  }

  const setupMasterPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await apiClient.setupMasterPassword(password)

      if (response.error) {
        toast({
          title: "Master Password Setup Failed",
          description: response.error,
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Master Password Set",
        description: "Your vault encryption has been configured",
      })
      return true
    } catch (error) {
      toast({
        title: "Master Password Error",
        description: "Failed to setup master password",
        variant: "destructive",
      })
      return false
    }
  }

  const verifyMasterPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await apiClient.verifyMasterPassword(password)

      if (response.error) {
        toast({
          title: "Invalid Master Password",
          description: response.error,
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      toast({
        title: "Master Password Error",
        description: "Failed to verify master password",
        variant: "destructive",
      })
      return false
    }
  }

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    setup2FA,
    verify2FA,
    disable2FA,
    setupMasterPassword,
    verifyMasterPassword,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
