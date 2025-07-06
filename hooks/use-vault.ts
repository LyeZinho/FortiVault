"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface PasswordEntry {
  id: string
  title: string
  username: string
  password: string
  url?: string
  notes?: string
  folder: string
  tags: string[]
  strength: "weak" | "fair" | "good" | "strong"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

interface VaultStats {
  total_passwords: number
  weak_passwords: number
  duplicate_passwords: number
  strong_passwords: number
  last_backup?: string
  security_score: number
}

interface Folder {
  id: string
  name: string
  color: string
  icon?: string
  password_count: number
  created_at: string
}

export function useVault() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadPasswords = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPasswords()

      if (response.error) {
        setError(response.error)
        toast({
          title: "Failed to load passwords",
          description: response.error,
          variant: "destructive",
        })
        return
      }

      setPasswords(response.data || [])
      setError(null)
    } catch (err) {
      const message = "Failed to connect to backend"
      setError(message)
      toast({
        title: "Connection error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      const response = await apiClient.getFolders()

      if (response.error) {
        console.error("Failed to load folders:", response.error)
        return
      }

      setFolders(response.data || [])
    } catch (err) {
      console.error("Folders loading error:", err)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.getVaultStats()

      if (response.error) {
        console.error("Failed to load stats:", response.error)
        return
      }

      setStats(response.data || null)
    } catch (err) {
      console.error("Stats loading error:", err)
    }
  }

  const addPassword = async (passwordData: Partial<PasswordEntry>) => {
    try {
      const response = await apiClient.addPassword(passwordData as any)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Password added",
        description: "New password has been saved to your vault",
      })

      await loadPasswords()
      await loadStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add password"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  const updatePassword = async (id: string, passwordData: Partial<PasswordEntry>) => {
    try {
      const response = await apiClient.updatePassword(id, passwordData)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })

      await loadPasswords()
      await loadStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  const deletePassword = async (id: string) => {
    try {
      const response = await apiClient.deletePassword(id)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Password deleted",
        description: "Password has been removed from your vault",
      })

      await loadPasswords()
      await loadStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete password"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  const createFolder = async (name: string, color: string, icon?: string) => {
    try {
      const response = await apiClient.createFolder(name, color, icon)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Folder created",
        description: `"${name}" folder has been created`,
      })

      await loadFolders()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create folder"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  const generatePassword = async (length = 16, includeSymbols = true) => {
    return apiClient.generatePassword(length, includeSymbols)
  }

  useEffect(() => {
    loadPasswords()
    loadFolders()
    loadStats()
  }, [])

  return {
    passwords,
    folders,
    stats,
    loading,
    error,
    addPassword,
    updatePassword,
    deletePassword,
    createFolder,
    generatePassword,
    reload: () => {
      loadPasswords()
      loadFolders()
      loadStats()
    },
  }
}
