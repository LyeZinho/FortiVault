"use client"

import { useState, useEffect } from "react"
import { apiClient, type Password, type Folder, type VaultStats } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function useVault() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load initial data
  const loadVaultData = async () => {
    try {
      setIsLoading(true)

      // Load passwords, folders, and stats in parallel
      const [passwordsResponse, foldersResponse, statsResponse] = await Promise.all([
        apiClient.getPasswords(searchTerm || undefined, selectedFolder || undefined),
        apiClient.getFolders(),
        apiClient.getVaultStats(),
      ])

      setPasswords(passwordsResponse.passwords)
      setFolders(foldersResponse.folders)
      setStats(statsResponse)
    } catch (error: any) {
      console.error("Failed to load vault data:", error)
      toast({
        title: "Failed to load vault data",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Search passwords
  const searchPasswords = async (query: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.getPasswords(query || undefined, selectedFolder || undefined)
      setPasswords(response.passwords)
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter by folder
  const filterByFolder = async (folderId: string | null) => {
    try {
      setIsLoading(true)
      setSelectedFolder(folderId)
      const response = await apiClient.getPasswords(searchTerm || undefined, folderId || undefined)
      setPasswords(response.passwords)
    } catch (error: any) {
      toast({
        title: "Filter failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add password
  const addPassword = async (passwordData: Omit<Password, "id" | "created_at" | "updated_at" | "strength">) => {
    try {
      const response = await apiClient.createPassword(passwordData)

      toast({
        title: "Password added",
        description: `${passwordData.title} has been saved securely`,
      })

      // Reload data to get updated list
      await loadVaultData()
      return response.id
    } catch (error: any) {
      toast({
        title: "Failed to add password",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Update password
  const updatePassword = async (id: number, passwordData: Partial<Password>) => {
    try {
      await apiClient.updatePassword(id, passwordData)

      toast({
        title: "Password updated",
        description: "Changes have been saved securely",
      })

      // Reload data to get updated list
      await loadVaultData()
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Delete password
  const deletePassword = async (id: number) => {
    try {
      await apiClient.deletePassword(id)

      toast({
        title: "Password deleted",
        description: "Password has been removed from your vault",
      })

      // Remove from local state immediately
      setPasswords((prev) => prev.filter((p) => p.id !== id))

      // Reload stats
      const statsResponse = await apiClient.getVaultStats()
      setStats(statsResponse)
    } catch (error: any) {
      toast({
        title: "Failed to delete password",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Add folder
  const addFolder = async (folderData: { id: string; name: string; icon?: string }) => {
    try {
      await apiClient.createFolder(folderData)

      toast({
        title: "Folder created",
        description: `${folderData.name} folder has been created`,
      })

      // Reload folders
      const foldersResponse = await apiClient.getFolders()
      setFolders(foldersResponse.folders)
    } catch (error: any) {
      toast({
        title: "Failed to create folder",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Generate password
  const generatePassword = async (options: {
    length: number
    include_uppercase: boolean
    include_lowercase: boolean
    include_numbers: boolean
    include_symbols: boolean
  }) => {
    try {
      const response = await apiClient.generatePassword(options)
      return response
    } catch (error: any) {
      toast({
        title: "Failed to generate password",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Effects
  useEffect(() => {
    loadVaultData()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        searchPasswords(searchTerm)
      } else {
        loadVaultData()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  return {
    // State
    passwords,
    folders,
    stats,
    searchTerm,
    selectedFolder,
    isLoading,

    // Actions
    setSearchTerm,
    setSelectedFolder: filterByFolder,
    addPassword,
    updatePassword,
    deletePassword,
    addFolder,
    generatePassword,
    loadVaultData,
  }
}
