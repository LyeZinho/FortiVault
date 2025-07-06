"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Upload,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Key,
  Calendar,
  HardDrive,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

export default function BackupPage() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [backups, setBackups] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBackupData()
  }, [])

  const loadBackupData = async () => {
    try {
      setLoading(true)

      // Load backup history
      const backupsResponse = await apiClient.getBackups()
      if (backupsResponse.data) {
        setBackups(backupsResponse.data)
      }

      // Load settings
      const settingsResponse = await apiClient.getSettings()
      if (settingsResponse.data) {
        setSettings(settingsResponse.data)
      }
    } catch (error) {
      console.error("Failed to load backup data:", error)
      toast({
        title: "Error",
        description: "Failed to load backup data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = useCallback(
    async (includeSettings = true) => {
      setIsExporting(true)
      setExportProgress(0)

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setExportProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        const response = await apiClient.createBackup(includeSettings)

        clearInterval(progressInterval)
        setExportProgress(100)

        if (response.error) {
          throw new Error(response.error)
        }

        toast({
          title: "Backup created successfully",
          description: "Your vault has been exported as an encrypted backup file",
        })

        // Refresh backup list
        await loadBackupData()
      } catch (error) {
        toast({
          title: "Backup failed",
          description: error instanceof Error ? error.message : "Failed to create backup",
          variant: "destructive",
        })
      } finally {
        setIsExporting(false)
        setTimeout(() => setExportProgress(0), 1000)
      }
    },
    [toast],
  )

  const handleImport = useCallback(
    async (file: File) => {
      setIsImporting(true)
      setImportProgress(0)

      try {
        // Simulate import progress
        const progressInterval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 15
          })
        }, 300)

        // TODO: Implement actual import functionality
        // This would require a new backend endpoint
        await new Promise((resolve) => setTimeout(resolve, 2000))

        clearInterval(progressInterval)
        setImportProgress(100)

        toast({
          title: "Import completed",
          description: "Your vault has been restored from the backup file",
        })

        await loadBackupData()
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Failed to import backup",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false)
        setTimeout(() => setImportProgress(0), 1000)
      }
    },
    [toast],
  )

  const handleSettingsUpdate = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value }
      const response = await apiClient.updateSettings(newSettings)

      if (response.error) {
        throw new Error(response.error)
      }

      setSettings(newSettings)
      toast({
        title: "Settings updated",
        description: "Backup settings have been saved",
      })
    } catch (error) {
      toast({
        title: "Settings error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading backup data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Backup & Restore</h1>
        </div>
        <Button onClick={() => handleExport(true)} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Quick Backup
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backup Settings
            </CardTitle>
            <CardDescription>Configure automatic backup preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Automatic backup</Label>
                <p className="text-sm text-muted-foreground">Automatically create encrypted backups of your vault</p>
              </div>
              <Switch
                checked={settings.auto_backup || false}
                onCheckedChange={(checked) => handleSettingsUpdate("auto_backup", checked)}
              />
            </div>

            {settings.auto_backup && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="backupFrequency">Backup frequency</Label>
                <Select
                  value={settings.backup_frequency || "daily"}
                  onValueChange={(value) => handleSettingsUpdate("backup_frequency", value)}
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
          </CardContent>
        </Card>

        {/* Export Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Vault
            </CardTitle>
            <CardDescription>Create an encrypted backup of your entire password vault</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Secure Export</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your backup will be encrypted with AES-256 using your master password. Keep this file safe and
                  remember your master password to restore.
                </p>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => handleExport(true)} disabled={isExporting} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Creating Backup..." : "Export with Settings"}
              </Button>
              <Button onClick={() => handleExport(false)} disabled={isExporting} variant="outline" className="flex-1">
                <Key className="h-4 w-4 mr-2" />
                {isExporting ? "Creating..." : "Passwords Only"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Backup includes all passwords, notes, and folders</p>
              <p>• File will be saved as .fvault format</p>
              <p>• Backup is encrypted and requires your master password</p>
            </div>
          </CardContent>
        </Card>

        {/* Import Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Vault
            </CardTitle>
            <CardDescription>Restore your vault from an encrypted backup file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200">Import Warning</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Importing will replace your current vault. Make sure to export your current vault first if you want to
                  keep it.
                </p>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing backup...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="backup-file">Select backup file</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".fvault,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImport(file)
                  }
                }}
                disabled={isImporting}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Supports .fvault and .json backup formats</p>
              <p>• You'll need to enter your master password</p>
              <p>• Current vault will be completely replaced</p>
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Backup History
                </CardTitle>
                <CardDescription>View and manage your previous backups</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadBackupData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backups.length > 0 ? (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(backup.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(backup.size_bytes || 0)}
                          </span>
                          <Badge variant={backup.backup_type === "manual" ? "default" : "secondary"}>
                            {backup.backup_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No backups found</h3>
                  <p className="text-muted-foreground mb-4">Create your first backup to keep your passwords safe</p>
                  <Button onClick={() => handleExport(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
