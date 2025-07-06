"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Filter,
  Globe,
  User,
  Key,
  MoreHorizontal,
  Star,
  StarOff,
  Folder,
  FolderOpen,
} from "lucide-react"
import { PasswordModal } from "@/components/password-modal"
import { PasswordStrength } from "@/components/password-strength"
import { FolderManager, type PasswordFolder } from "@/components/folder-manager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useVault } from "@/hooks/use-vault"

interface PasswordEntry {
  id: string
  title: string
  username: string
  password: string
  url?: string
  notes?: string
  folder: string
  strength: "weak" | "fair" | "good" | "strong"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export default function VaultPage() {
  const { toast } = useToast()
  const { passwords, loading, addPassword, updatePassword, deletePassword, generatePassword } = useVault()
  const [searchQuery, setSearchQuery] = useState("")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null)
  const [filter, setFilter] = useState<"all" | "weak" | "strong" | "favorites">("all")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Mock folders - in real app this would come from backend
  const [folders, setFolders] = useState<PasswordFolder[]>([
    {
      id: "1",
      name: "Work",
      color: "bg-blue-500",
      passwordCount: 12,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Personal",
      color: "bg-green-500",
      passwordCount: 8,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      name: "Banking",
      color: "bg-red-500",
      passwordCount: 3,
      createdAt: "2024-01-12",
    },
  ])

  const filteredPasswords = passwords.filter((password) => {
    const matchesSearch =
      password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filter === "all" ||
      (filter === "weak" && password.strength === "weak") ||
      (filter === "strong" && password.strength === "strong") ||
      (filter === "favorites" && password.is_favorite)

    const matchesFolder = selectedFolder === null || password.folder === selectedFolder

    return matchesSearch && matchesFilter && matchesFolder
  })

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = async (password: PasswordEntry) => {
    try {
      await updatePassword(password.id, {
        ...password,
        is_favorite: !password.is_favorite,
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleEdit = (password: PasswordEntry) => {
    setEditingPassword(password)
    setIsModalOpen(true)
  }

  const handleSave = async (passwordData: Partial<PasswordEntry>) => {
    try {
      if (editingPassword) {
        await updatePassword(editingPassword.id, passwordData)
      } else {
        await addPassword(passwordData)
      }

      setIsModalOpen(false)
      setEditingPassword(null)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePassword(id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  // Folder management
  const handleCreateFolder = (folderData: Omit<PasswordFolder, "id" | "passwordCount" | "createdAt">) => {
    const newFolder: PasswordFolder = {
      ...folderData,
      id: Date.now().toString(),
      passwordCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setFolders((prev) => [...prev, newFolder])
  }

  const handleUpdateFolder = (id: string, folderData: Partial<PasswordFolder>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...folderData } : f)))
  }

  const handleDeleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (selectedFolder === id) {
      setSelectedFolder(null)
    }
  }

  const getSelectedFolderName = () => {
    if (selectedFolder === null) return "All Passwords"
    const folder = folders.find((f) => f.id === selectedFolder)
    return folder ? folder.name : "Unknown Folder"
  }

  const getSelectedFolderColor = () => {
    if (selectedFolder === null) return "bg-muted"
    const folder = folders.find((f) => f.id === selectedFolder)
    return folder ? folder.color : "bg-muted"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded ${getSelectedFolderColor()}`}>
            {selectedFolder === null ? (
              <FolderOpen className="h-3 w-3 text-white" />
            ) : (
              <Folder className="h-3 w-3 text-white" />
            )}
          </div>
          <h1 className="text-xl font-semibold">{getSelectedFolderName()}</h1>
          <Badge variant="outline">{filteredPasswords.length} passwords</Badge>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Password
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Folders */}
        <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="font-semibold mb-3">Folders</h2>
            <FolderManager
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search passwords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilter("all")}>All Passwords</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("favorites")}>Favorites</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilter("strong")}>Strong Passwords</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("weak")}>Weak Passwords</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Password List */}
            <div className="grid gap-4">
              {filteredPasswords.map((password) => (
                <Card key={password.id} className="animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                          <Globe className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{password.title}</h3>
                            {password.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            <PasswordStrength strength={password.strength} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{password.username}</p>
                          {password.url && <p className="text-xs text-muted-foreground truncate">{password.url}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type={showPasswords[password.id] ? "text" : "password"}
                            value={password.password}
                            readOnly
                            className="w-32 text-sm"
                          />
                          <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(password.id)}>
                            {showPasswords[password.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(password.password, "Password")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(password)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(password.username, "Username")}>
                              <User className="h-4 w-4 mr-2" />
                              Copy Username
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(password.password, "Password")}>
                              <Key className="h-4 w-4 mr-2" />
                              Copy Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleFavorite(password)}>
                              {password.is_favorite ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Favorites
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(password.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPasswords.length === 0 && (
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No passwords found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedFolder
                    ? "Try adjusting your search terms or filters"
                    : "Get started by adding your first password"}
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Password
                </Button>
              </div>
            )}
          </main>

          <PasswordModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingPassword(null)
            }}
            onSave={handleSave}
            password={editingPassword}
            folders={folders}
            selectedFolder={selectedFolder}
            onGeneratePassword={generatePassword}
          />
        </div>
      </div>
    </div>
  )
}
