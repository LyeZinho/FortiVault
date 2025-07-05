"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, Edit, Trash2, MoreVertical, ExternalLink, Star, StarOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Password } from "@/lib/api"
import { useVault } from "@/hooks/use-vault"

interface VaultItemProps {
  password: Password
  viewMode: "grid" | "list"
  onEdit: () => void
}

export function VaultItem({ password, viewMode, onEdit }: VaultItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const { updatePassword, deletePassword } = useVault()

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: `${type} copied!`,
        description: `${type} has been copied to clipboard`,
        duration: 2000,
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = async () => {
    try {
      setIsUpdating(true)
      await updatePassword(password.id, { is_favorite: !password.is_favorite })
    } catch (error) {
      // Error handled by useVault hook
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${password.title}"?`)) {
      return
    }

    try {
      setIsDeleting(true)
      await deletePassword(password.id)
    } catch (error) {
      // Error handled by useVault hook
    } finally {
      setIsDeleting(false)
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-500"
    if (strength >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return "Strong"
    if (strength >= 60) return "Medium"
    return "Weak"
  }

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {password.url && getFaviconUrl(password.url) ? (
                  <img
                    src={getFaviconUrl(password.url) || "/placeholder.svg"}
                    alt=""
                    className="w-5 h-5"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <span className="text-sm font-medium">{password.title.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{password.title}</h3>
                  {password.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </div>
                <p className="text-sm text-muted-foreground truncate">{password.username || "No username"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", getStrengthColor(password.strength || 0))}>
                {getStrengthLabel(password.strength || 0)}
              </Badge>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(password.username || "", "Username")}
                disabled={!password.username}
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(password.password, "Password")}>
                <Copy className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={isDeleting || isUpdating}>
                    {isDeleting || isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleFavorite}>
                    {password.is_favorite ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                    {password.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  {password.url && (
                    <DropdownMenuItem onClick={() => window.open(password.url, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {password.url && getFaviconUrl(password.url) ? (
                <img
                  src={getFaviconUrl(password.url) || "/placeholder.svg"}
                  alt=""
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <span className="text-lg font-medium">{password.title.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {password.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isDeleting || isUpdating}
              >
                {isDeleting || isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFavorite}>
                {password.is_favorite ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                {password.is_favorite ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
              {password.url && (
                <DropdownMenuItem onClick={() => window.open(password.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open URL
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium truncate">{password.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{password.username || "No username"}</p>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("text-xs", getStrengthColor(password.strength || 0))}>
              {getStrengthLabel(password.strength || 0)}
            </Badge>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(password.username || "", "Username")}
                className="h-8 w-8 p-0"
                disabled={!password.username}
              >
                <Copy className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(password.password, "Password")}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
