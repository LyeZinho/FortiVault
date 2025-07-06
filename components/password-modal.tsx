"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, RefreshCw, Copy, Globe, User, Key, FileText, Folder } from "lucide-react"
import { PasswordStrength } from "./password-strength"
import { useToast } from "@/hooks/use-toast"
import type { PasswordFolder } from "./folder-manager"

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

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (password: Partial<PasswordEntry>) => void
  password?: PasswordEntry | null
  folders: PasswordFolder[]
  selectedFolder?: string | null
  onGeneratePassword: (length?: number, includeSymbols?: boolean) => Promise<string>
}

export function PasswordModal({
  isOpen,
  onClose,
  onSave,
  password,
  folders,
  selectedFolder,
  onGeneratePassword,
}: PasswordModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    folder: selectedFolder || "Default",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "good" | "strong">("weak")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (password) {
      setFormData({
        title: password.title,
        username: password.username,
        password: password.password,
        url: password.url || "",
        notes: password.notes || "",
        folder: password.folder,
      })
    } else {
      setFormData({
        title: "",
        username: "",
        password: "",
        url: "",
        notes: "",
        folder: selectedFolder || "Default",
      })
    }
  }, [password, selectedFolder, isOpen])

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const calculatePasswordStrength = (password: string): "weak" | "fair" | "good" | "strong" => {
    if (password.length < 6) return "weak"
    if (password.length < 8) return "fair"

    let score = 0
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score < 3) return "fair"
    if (score === 3) return "good"
    return "strong"
  }

  const generatePassword = async () => {
    try {
      setIsGenerating(true)
      const newPassword = await onGeneratePassword(16, true)
      setFormData((prev) => ({ ...prev, password: newPassword }))
      toast({
        title: "Password generated",
        description: "A strong password has been generated for you",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate password",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.username || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    onSave({
      ...formData,
      strength: passwordStrength,
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getFolderColor = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    return folder ? folder.color : "bg-muted"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{password ? "Edit Password" : "Add New Password"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site/Service Name *
            </Label>
            <Input
              id="title"
              placeholder="e.g., GitHub, Google, Netflix"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username/Email *
            </Label>
            <Input
              id="username"
              placeholder="username or email@example.com"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password *
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={generatePassword} disabled={isGenerating}>
                <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(formData.password)}
                disabled={!formData.password}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {formData.password && (
              <div className="flex items-center gap-2">
                <PasswordStrength strength={passwordStrength} />
                <span className="text-sm text-muted-foreground capitalize">{passwordStrength} password</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folder
            </Label>
            <Select value={formData.folder} onValueChange={(value) => handleChange("folder", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-muted" />
                    Default
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${folder.color}`} />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (optional)"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{password ? "Update Password" : "Save Password"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
