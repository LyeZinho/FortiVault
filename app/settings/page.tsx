"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Download,
  FolderSyncIcon as Sync,
  Key,
  Smartphone,
  AlertTriangle,
  Save,
  User,
  Bell,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, setup2FA } = useAuth() // Call useAuth at the top level
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSettings()

      if (response.error) {
        throw new Error(response.error)
      }

      setSettings(response.data || {})
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await apiClient.updateSettings(settings)

      if (response.error) {
        throw new Error(response.error)
      }

      setHasChanges(false)
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeMasterPassword = () => {
    // TODO: Implement master password change flow
    toast({
      title: "Master password change",
      description: "This feature will open a secure authentication flow",
    })
  }

  const handleSetup2FA = async () => {
    try {
      const response = await setup2FA() // Use setup2FA from useAuth
      if (response) {
        toast({
          title: "2FA Setup",
          description: "Two-factor authentication setup initiated",
        })
      }
    } catch (error) {
      toast({
        title: "2FA Setup Error",
        description: "Failed to setup 2FA",
        variant: "destructive",
      })
    }
  }

  const handleExport = async (includeSettings = true) => {
    try {
      const response = await apiClient.createBackup(includeSettings)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Backup created successfully",
        description: "Your vault has been exported as an encrypted backup file",
      })
    } catch (error) {
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Settings</h1>
            {hasChanges && <Badge variant="outline">Unsaved changes</Badge>}
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={user?.username || "User"} disabled />
              <p className="text-sm text-muted-foreground">Username cannot be changed</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Server Connection</Label>
              <div className="flex items-center gap-2">
                <Input value={apiClient.getBaseUrl()} disabled />
                <Badge variant="outline" className="text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your vault security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-lock vault</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically lock the vault after a period of inactivity
                </p>
              </div>
              <Switch
                checked={settings.auto_lock || false}
                onCheckedChange={(checked) => handleSettingChange("auto_lock", checked)}
              />
            </div>

            {settings.auto_lock && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="autoLockTime">Auto-lock after (minutes)</Label>
                <Select
                  value={String(settings.auto_lock_time || 15)}
                  onValueChange={(value) => handleSettingChange("auto_lock_time", Number.parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Two-factor authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {user?.is_2fa_enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleSetup2FA}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {user?.is_2fa_enabled ? "Manage" : "Setup"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-base">Master password</Label>
              <p className="text-sm text-muted-foreground">Change your master password used to encrypt your vault</p>
              <Button variant="outline" onClick={handleChangeMasterPassword}>
                <Key className="h-4 w-4 mr-2" />
                Change Master Password
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="clipboardTimeout">Clipboard timeout (seconds)</Label>
              <p className="text-sm text-muted-foreground">Automatically clear clipboard after copying passwords</p>
              <Select
                value={String(settings.clipboard_timeout || 30)}
                onValueChange={(value) => handleSettingChange("clipboard_timeout", Number.parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of FortiVault</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme || "dark"} onValueChange={(value) => handleSettingChange("theme", value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Show password strength</Label>
                <p className="text-sm text-muted-foreground">Display password strength indicators in the vault</p>
              </div>
              <Switch
                checked={settings.show_password_strength !== false}
                onCheckedChange={(checked) => handleSettingChange("show_password_strength", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup & Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup & Sync
            </CardTitle>
            <CardDescription>Configure automatic backups and synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Automatic backup</Label>
                <p className="text-sm text-muted-foreground">Automatically create encrypted backups of your vault</p>
              </div>
              <Switch
                checked={settings.auto_backup || false}
                onCheckedChange={(checked) => handleSettingChange("auto_backup", checked)}
              />
            </div>

            {settings.auto_backup && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="backupFrequency">Backup frequency</Label>
                <Select
                  value={settings.backup_frequency || "daily"}
                  onValueChange={(value) => handleSettingChange("backup_frequency", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Device synchronization</Label>
                <p className="text-sm text-muted-foreground">
                  Sync your vault across devices using P2P or private server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
                <Switch
                  checked={settings.sync_enabled || false}
                  onCheckedChange={(checked) => handleSettingChange("sync_enabled", checked)}
                />
              </div>
            </div>

            {settings.sync_enabled && (
              <div className="ml-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Synchronization is enabled. Configure sync settings in the Sync tab.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/sync">
                    <Sync className="h-4 w-4 mr-2" />
                    Configure Sync
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Security alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified about weak passwords and security issues</p>
              </div>
              <Switch
                checked={settings.security_alerts !== false}
                onCheckedChange={(checked) => handleSettingChange("security_alerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Backup reminders</Label>
                <p className="text-sm text-muted-foreground">Remind me to create backups regularly</p>
              </div>
              <Switch
                checked={settings.backup_reminders !== false}
                onCheckedChange={(checked) => handleSettingChange("backup_reminders", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Advanced
            </CardTitle>
            <CardDescription>Advanced settings for power users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">Danger Zone</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      These actions are irreversible. Please proceed with caution.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="destructive" className="w-full" onClick={() => handleExport(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <p className="text-xs text-muted-foreground">Export all vault data as encrypted backup file</p>
              </div>

              <div className="space-y-2">
                <Button variant="destructive" className="w-full" disabled>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset Vault
                </Button>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all passwords and reset the application (Coming soon)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
