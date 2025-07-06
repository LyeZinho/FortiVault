"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  setupMasterPassword: (password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        // Simulate auth check
        const token = localStorage.getItem("fortivault_token")
        if (token) {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      // Simulate login
      if (password === "demo") {
        localStorage.setItem("fortivault_token", "demo-token")
        setIsAuthenticated(true)
        toast({
          title: "Welcome back!",
          description: "Successfully logged into your vault",
        })
        return true
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "Failed to connect to FortiVault backend",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("fortivault_token")
    setIsAuthenticated(false)
    toast({
      title: "Logged out",
      description: "Your vault has been locked",
    })
  }

  const setupMasterPassword = async (password: string): Promise<boolean> => {
    try {
      // Simulate setup
      localStorage.setItem("fortivault_setup", "true")
      toast({
        title: "Master password set",
        description: "Your vault has been initialized successfully",
      })
      return true
    } catch (error) {
      toast({
        title: "Setup error",
        description: "Failed to setup master password",
        variant: "destructive",
      })
      return false
    }
  }

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    setupMasterPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
