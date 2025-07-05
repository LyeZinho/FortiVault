"use client"

import { useState } from "react"
import { VaultItem } from "@/components/vault-item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Grid, List, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVault } from "@/hooks/use-vault"
import type { Password } from "@/lib/api"

interface VaultGridProps {
  onEditPassword: (password: Password) => void
}

export function VaultGrid({ onEditPassword }: VaultGridProps) {
  const { passwords, searchTerm, selectedFolder, isLoading } = useVault()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("updated_at")

  // Filter and sort passwords
  const filteredPasswords = passwords.filter((password) => {
    const matchesSearch =
      !searchTerm ||
      password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.url?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFolder = selectedFolder === null || password.folder_id === selectedFolder

    return matchesSearch && matchesFolder
  })

  const sortedPasswords = [...filteredPasswords].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "updated_at":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case "strength":
        return (b.strength || 0) - (a.strength || 0)
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your passwords...</p>
      </div>
    )
  }

  if (filteredPasswords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-lg font-medium mb-2">No passwords found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm ? "Try adjusting your search terms" : "Start by adding your first password"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filteredPasswords.length} passwords</Badge>
          {searchTerm && <Badge variant="outline">Filtered by: "{searchTerm}"</Badge>}
          {selectedFolder && <Badge variant="outline">Folder: {selectedFolder}</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md bg-background"
          >
            <option value="updated_at">Sort by Date</option>
            <option value="title">Sort by Name</option>
            <option value="strength">Sort by Strength</option>
          </select>

          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2",
        )}
      >
        {sortedPasswords.map((password) => (
          <VaultItem
            key={password.id}
            password={password}
            viewMode={viewMode}
            onEdit={() => onEditPassword(password)}
          />
        ))}
      </div>
    </div>
  )
}
