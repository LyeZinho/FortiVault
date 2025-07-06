"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Folder, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface PasswordFolder {
  id: string
  name: string
  color: string
  icon?: string
  passwordCount: number
  createdAt: string
}

interface FolderManagerProps {
  folders: PasswordFolder[]
  onCreateFolder: (folder: Omit<PasswordFolder, "id" | "passwordCount" | "createdAt">) => void
  onUpdateFolder: (id: string, folder: Partial<PasswordFolder>) => void
  onDeleteFolder: (id: string) => void
  selectedFolder?: string
  onSelectFolder: (folderId: string | null) => void
}

const FOLDER_COLORS = [
  { name: "Blue", value: "bg-blue-500", border: "border-blue-500", text: "text-blue-600" },
  { name: "Green", value: "bg-green-500", border: "border-green-500", text: "text-green-600" },
  { name: "Purple", value: "bg-purple-500", border: "border-purple-500", text: "text-purple-600" },
  { name: "Red", value: "bg-red-500", border: "border-red-500", text: "text-red-600" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500", text: "text-orange-600" },
  { name: "Pink", value: "bg-pink-500", border: "border-pink-500", text: "text-pink-600" },
  { name: "Indigo", value: "bg-indigo-500", border: "border-indigo-500", text: "text-indigo-600" },
  { name: "Teal", value: "bg-teal-500", border: "border-teal-500", text: "text-teal-600" },
  { name: "Gray", value: "bg-gray-500", border: "border-gray-500", text: "text-gray-600" },
]

export function FolderManager({
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  selectedFolder,
  onSelectFolder,
}: FolderManagerProps) {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<PasswordFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a folder name",
        variant: "destructive",
      })
      return
    }

    onCreateFolder({
      name: newFolderName.trim(),
      color: selectedColor.value,
    })

    setNewFolderName("")
    setSelectedColor(FOLDER_COLORS[0])
    setIsCreateOpen(false)

    toast({
      title: "Folder created",
      description: `"${newFolderName}" folder has been created`,
    })
  }

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) return

    onUpdateFolder(editingFolder.id, {
      name: newFolderName.trim(),
      color: selectedColor.value,
    })

    setEditingFolder(null)
    setNewFolderName("")
    setSelectedColor(FOLDER_COLORS[0])

    toast({
      title: "Folder updated",
      description: "Folder has been updated successfully",
    })
  }

  const handleDeleteFolder = (folder: PasswordFolder) => {
    if (folder.passwordCount > 0) {
      toast({
        title: "Cannot delete folder",
        description: "Move all passwords from this folder before deleting",
        variant: "destructive",
      })
      return
    }

    onDeleteFolder(folder.id)
    toast({
      title: "Folder deleted",
      description: `"${folder.name}" folder has been deleted`,
    })
  }

  const startEdit = (folder: PasswordFolder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setSelectedColor(FOLDER_COLORS.find((c) => c.value === folder.color) || FOLDER_COLORS[0])
  }

  const getColorInfo = (colorValue: string) => {
    return FOLDER_COLORS.find((c) => c.value === colorValue) || FOLDER_COLORS[0]
  }

  return (
    <div className="space-y-2">
      {/* All Passwords */}
      <div
        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
          selectedFolder === null ? "bg-accent" : "hover:bg-accent/50"
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
          <Folder className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-medium">All Passwords</p>
          <p className="text-xs text-muted-foreground">
            {folders.reduce((sum, f) => sum + f.passwordCount, 0)} passwords
          </p>
        </div>
      </div>

      {/* Folder List */}
      {folders.map((folder) => {
        const colorInfo = getColorInfo(folder.color)
        return (
          <div
            key={folder.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${
              selectedFolder === folder.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectFolder(folder.id)}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${folder.color}`}>
              <Folder className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{folder.name}</p>
              <p className="text-xs text-muted-foreground">{folder.passwordCount} passwords</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEdit(folder)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteFolder(folder)}
                  className="text-destructive"
                  disabled={folder.passwordCount > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}

      {/* Create New Folder */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 p-2 h-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border-2 border-dashed border-muted-foreground/30">
              <Plus className="h-4 w-4" />
            </div>
            <span>New Folder</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Folder Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                      selectedColor.value === color.value
                        ? `${color.border} bg-accent`
                        : "border-transparent hover:bg-accent"
                    }`}
                    onClick={() => setSelectedColor(color)}
                  >
                    <div className={`w-4 h-4 rounded ${color.value}`} />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Folder Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                      selectedColor.value === color.value
                        ? `${color.border} bg-accent`
                        : "border-transparent hover:bg-accent"
                    }`}
                    onClick={() => setSelectedColor(color)}
                  >
                    <div className={`w-4 h-4 rounded ${color.value}`} />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingFolder(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFolder}>Update Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
