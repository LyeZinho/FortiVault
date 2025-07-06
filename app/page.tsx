"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Key,
  Shield,
  AlertTriangle,
  Download,
  FolderSyncIcon as Sync,
  Plus,
  Eye,
  Clock,
  TrendingUp,
  Activity,
  Users,
  Server,
} from "lucide-react"
import Link from "next/link"
import { useVault } from "@/hooks/use-vault"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { stats, passwords, loading } = useVault()
  const { toast } = useToast()
  const [backups, setBackups] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load backups
      const backupsResponse = await apiClient.getBackups()
      if (backupsResponse.data) {
        setBackups(backupsResponse.data)
      }

      // Load settings
      const settingsResponse = await apiClient.getSettings()
      if (settingsResponse.data) {
        setSettings(settingsResponse.data)
      }

      // Generate recent activity from passwords
      if (passwords.length > 0) {
        const recent = passwords
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
          .map((password) => ({
            name: password.title,
            username: password.username,
            lastAccessed: formatRelativeTime(password.updated_at),
            action: "Updated",
          }))
        setRecentActivity(recent)
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getLastBackupTime = () => {
    if (backups.length === 0) return "Never"
    const lastBackup = backups[0]
    return formatRelativeTime(lastBackup.created_at)
  }

  const handleQuickBackup = async () => {
    try {
      const response = await apiClient.createBackup(true)
      if (response.error) {
        toast({
          title: "Backup failed",
          description: response.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Backup created",
          description: "Your vault has been backed up successfully",
        })
        loadDashboardData() // Refresh data
      }
    } catch (error) {
      toast({
        title: "Backup error",
        description: "Failed to create backup",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back to your secure vault</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Secured
        </Badge>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_passwords || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Your digital identity vault
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.security_score || 0}%</div>
              <Progress value={stats?.security_score || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats?.weak_passwords || 0}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{getLastBackupTime()}</div>
              <p className="text-xs text-muted-foreground">
                {settings.auto_backup ? "Auto backup enabled" : "Manual backup only"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts */}
        {(stats?.weak_passwords > 0 || stats?.duplicate_passwords > 0) && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.weak_passwords > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">You have {stats.weak_passwords} weak passwords</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vault?filter=weak">Fix Now</Link>
                  </Button>
                </div>
              )}
              {stats?.duplicate_passwords > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">You have {stats.duplicate_passwords} duplicate passwords</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vault?filter=duplicate">Review</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Recently updated passwords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.lastAccessed}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.action}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
              <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                <Link href="/vault">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Passwords
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/vault?action=new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Password
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleQuickBackup}>
                <Download className="h-4 w-4 mr-2" />
                Create Backup Now
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/sync">
                  <Sync className="h-4 w-4 mr-2" />
                  Sync Devices
                </Link>
              </Button>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Sync Status:</span>
                  <Badge variant="outline" className={settings.sync_enabled ? "text-green-600" : "text-gray-600"}>
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${settings.sync_enabled ? "bg-green-500" : "bg-gray-500"}`}
                    />
                    {settings.sync_enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Shield className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="font-medium">Vault Status</p>
                <p className="text-sm text-muted-foreground">Encrypted & Secure</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="font-medium">Connected Devices</p>
                <p className="text-sm text-muted-foreground">1 device</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="font-medium">Session</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
