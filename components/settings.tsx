"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Shield, Key, Palette, Download, Upload, Smartphone, AlertTriangle } from "lucide-react"

export function Settings() {
  const [autoLockTime, setAutoLockTime] = useState("15")
  const [autoBackup, setAutoBackup] = useState(true)
  const [biometricAuth, setBiometricAuth] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [clipboardTimeout, setClipboardTimeout] = useState("30")
  const { toast } = useToast()

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    })
  }

  const handleChangeMasterPassword = () => {
    toast({
      title: "Master password change",
      description: "This feature will be implemented with backend integration",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Export initiated",
      description: "Your encrypted vault will be downloaded shortly",
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Master Password</Label>
                <p className="text-sm text-muted-foreground">Change your master password to access the vault</p>
              </div>
              <Button onClick={handleChangeMasterPassword}>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="auto-lock">Auto-lock timeout</Label>
                <Select value={autoLockTime} onValueChange={setAutoLockTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clipboard-timeout">Clipboard timeout</Label>
                <Select value={clipboardTimeout} onValueChange={setClipboardTimeout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="never">Never clear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Biometric Authentication</Label>
                <p className="text-sm text-muted-foreground">Use fingerprint or face recognition to unlock</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={biometricAuth} onCheckedChange={setBiometricAuth} />
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Desktop Only
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup & Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Automatic Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically create encrypted backups daily</p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExportData} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Vault
            </Button>

            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Import Vault
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Backup Security</p>
                <p className="text-xs text-muted-foreground">
                  All backups are encrypted with your master password. Keep your master password safe - without it,
                  backups cannot be restored.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Use dark theme for better visibility in low light</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mb-4">
              These actions are irreversible. Please proceed with caution.
            </p>
            <div className="space-y-2">
              <Button variant="destructive" size="sm">
                Clear All Data
              </Button>
              <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="gap-2">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
