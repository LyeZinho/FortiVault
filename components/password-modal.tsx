"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, RefreshCw, Copy, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Password } from "@/lib/api"
import { useVault } from "@/hooks/use-vault"
import { useToast } from "@/hooks/use-toast"

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  password?: Password | null
}

export function PasswordModal({ isOpen, onClose, password }: PasswordModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    folder_id: "",
    is_favorite: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLength, setPasswordLength] = useState(16)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const { folders, addPassword, updatePassword, generatePassword } = useVault()
  const { toast } = useToast()

  useEffect(() => {
    if (password) {
      setFormData({
        title: password.title || "",
        username: password.username || "",
        password: password.password || "",
        url: password.url || "",
        notes: password.notes || "",
        folder_id: password.folder_id || "",
        is_favorite: password.is_favorite || false,
      })
    } else {
      setFormData({
        title: "",
        username: "",
        password: "",
        url: "",
        notes: "",
        folder_id: "",
        is_favorite: false,
      })
    }
  }, [password, isOpen])

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0

    let score = 0
    if (password.length >= 8) score += 25
    if (password.length >= 12) score += 25
    if (/[a-z]/.test(password)) score += 10
    if (/[A-Z]/.test(password)) score += 10
    if (/[0-9]/.test(password)) score += 10
    if (/[^A-Za-z0-9]/.test(password)) score += 20

    return Math.min(score, 100)
  }

  const handleGeneratePassword = async () => {
    try {
      setIsGenerating(true)
      const result = await generatePassword({
        length: passwordLength,
        include_uppercase: includeUppercase,
        include_lowercase: includeLowercase,
        include_numbers: includeNumbers,
        include_symbols: includeSymbols,
      })

      setFormData((prev) => ({ ...prev, password: result.password }))
    } catch (error) {
      // Error handled by useVault hook
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Password copied!",
        description: "Password has been copied to clipboard",
        duration: 2000,
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy password to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "bg-green-500"
    if (strength >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return "Strong"
    if (strength >= 60) return "Medium"
    if (strength >= 40) return "Weak"
    return "Very Weak"
  }

  const handleSave = async () => {
    if (!formData.title || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Title and password are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (password) {
        await updatePassword(password.id, formData)
      } else {
        await addPassword(formData)
      }

      onClose()
    } catch (error) {
      // Error handled by useVault hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{password ? "Edit Password" : "Add New Password"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Google, GitHub"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                value={formData.folder_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, folder_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              placeholder="username@example.com"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password *</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    passwordStrength >= 80
                      ? "text-green-600"
                      : passwordStrength >= 60
                        ? "text-yellow-600"
                        : "text-red-600",
                  )}
                >
                  {getStrengthLabel(passwordStrength)}
                </Badge>
              </div>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter or generate password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={copyPassword} className="h-8 w-8 p-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 p-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all", getStrengthColor(passwordStrength))}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Password Generator</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Generate
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Length: {passwordLength}</Label>
                  </div>
                  <Slider
                    value={[passwordLength]}
                    onValueChange={(value) => setPasswordLength(value[0])}
                    max={50}
                    min={4}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                    <Label htmlFor="uppercase" className="text-sm">
                      Uppercase
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                    <Label htmlFor="lowercase" className="text-sm">
                      Lowercase
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                    <Label htmlFor="numbers" className="text-sm">
                      Numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                    <Label htmlFor="symbols" className="text-sm">
                      Symbols
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="favorite"
              checked={formData.is_favorite}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_favorite: checked }))}
            />
            <Label htmlFor="favorite" className="text-sm">
              Add to favorites
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {password ? "Updating..." : "Saving..."}
              </>
            ) : password ? (
              "Update Password"
            ) : (
              "Save Password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
