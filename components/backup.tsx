"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, Shield, Clock, CheckCircle, FileText, Key, Loader2 } from "lucide-react"
import { apiClient, type BackupInfo } from "@/lib/api"

export function Backup() {
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([])
  const [backupKey, setBackupKey] = useState("")
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load backup history on component mount
  useState(() => {
    loadBackupHistory()
  })

  const loadBackupHistory = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getBackupHistory()
      setBackupHistory(response.backups)
    } catch (error: any) {
      toast({
        title: "Failed to load backup history",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setIsCreating(true)
      const response = await apiClient.createBackup("manual")

      toast({
        title: "Backup created successfully!",
        description: `Your vault has been backed up securely`,
      })

      // Show backup key to user
      if (response.backup.backup_key) {
        toast({
          title: "Backup Key",
          description: `Save this key: ${response.backup.backup_key}`,
          duration: 10000,
        })
      }

      // Reload backup history
      await loadBackupHistory()
    } catch (error: any) {
      toast({
        title: "Backup creation failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setRestoreFile(file)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile || !backupKey) {
      toast({
        title: "Missing information",
        description: "Please select a backup file and enter the backup key",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRestoring(true)

      // First verify the backup
      const verification = await apiClient.verifyBackup(restoreFile, backupKey)

      if (!verification.valid) {
        toast({
          title: "Invalid backup",
          description: verification.error || "The backup file or key is invalid",
          variant: "destructive",
        })
        return
      }

      // Proceed with restore
      const response = await apiClient.restoreBackup(restoreFile, backupKey, mergeMode)

      toast({
        title: "Backup restored successfully!",
        description: `Restored ${response.result?.restored_passwords || 0} passwords`,
      })

      // Clear form
      setRestoreFile(null)
      setBackupKey("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      toast({
        title: "Backup restore failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDownloadBackup = async (backupId: number) => {
    try {
      const blob = await apiClient.downloadBackup(backupId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fortivault_backup_${backupId}.fvault`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Backup downloaded",
        description: "Backup file has been downloaded to your device",
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return
    }

    try {
      await apiClient.deleteBackup(backupId)
      toast({
        title: "Backup deleted",
        description: "Backup has been removed",
      })

      // Reload backup history
      await loadBackupHistory()
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Create Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Secure Backup</p>
                <p className="text-xs text-muted-foreground">
                  Your vault will be exported as an encrypted file (.fvault) that can only be opened with your backup
                  key. This ensures your data remains secure even if the backup file is compromised.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleCreateBackup} disabled={isCreating} className="gap-2">
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore from Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Restore from Backup</p>
                <p className="text-xs text-muted-foreground">
                  Select a .fvault backup file to restore your passwords. You'll need the backup key that was provided
                  when creating the backup.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="backupFile">Backup File</Label>
              <Input
                ref={fileInputRef}
                id="backupFile"
                type="file"
                accept=".fvault,.json"
                onChange={handleFileSelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupKey">Backup Key</Label>
              <Input
                id="backupKey"
                type="password"
                placeholder="Enter your backup key"
                value={backupKey}
                onChange={(e) => setBackupKey(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mergeMode"
                checked={mergeMode}
                onChange={(e) => setMergeMode(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="mergeMode" className="text-sm">
                Merge with existing passwords (don't replace)
              </Label>
            </div>

            <Button onClick={handleRestore} disabled={isRestoring || !restoreFile || !backupKey} className="gap-2">
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Restore Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-muted rounded"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-8 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No backups found</p>
              <p className="text-sm text-muted-foreground">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{new Date(backup.created_at).toLocaleString()}</span>
                        <Badge variant={backup.backup_type === "automatic" ? "secondary" : "outline"}>
                          {backup.backup_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {backup.total_passwords || 0} passwords • {backup.size_mb?.toFixed(2) || 0} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownloadBackup(backup.id!)}>
                      Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteBackup(backup.id!)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
