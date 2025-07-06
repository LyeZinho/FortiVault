"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  FolderSyncIcon as Sync,
  Wifi,
  WifiOff,
  Server,
  Smartphone,
  Laptop,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  QrCode,
  Copy,
  RefreshCw,
  Monitor,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SyncPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>({})
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [p2pEnabled, setP2pEnabled] = useState(true)
  const [serverSyncEnabled, setServerSyncEnabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncProgress, setSyncProgress] = useState(0)
  const [serverConfig, setServerConfig] = useState({
    url: "",
    token: "",
    interval: "15",
  })

  // Mock connected devices - in real implementation this would come from backend
  const [connectedDevices, setConnectedDevices] = useState([
    {
      id: "1",
      name: "Current Device",
      type: "laptop",
      status: "online",
      lastSeen: "Active now",
      ip: "127.0.0.1",
      isCurrent: true,
    },
  ])

  const [pairingCode, setPairingCode] = useState("FVLT-8X9K-2M4N-7P3Q")

  useEffect(() => {
    loadSyncSettings()
  }, [])

  const loadSyncSettings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSettings()

      if (response.data) {
        const data = response.data
        setSettings(data)
        setSyncEnabled(data.sync_enabled || false)
        setLastSync(data.last_sync || null)
      }
    } catch (error) {
      console.error("Failed to load sync settings:", error)
      toast({
        title: "Error",
        description: "Failed to load sync settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSyncSettings = async (newSettings: any) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      const response = await apiClient.updateSettings(updatedSettings)

      if (response.error) {
        throw new Error(response.error)
      }

      setSettings(updatedSettings)
      toast({
        title: "Settings updated",
        description: "Sync settings have been saved",
      })
    } catch (error) {
      toast({
        title: "Settings error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const handleToggleSync = async () => {
    const newSyncEnabled = !syncEnabled
    setSyncEnabled(newSyncEnabled)

    await updateSyncSettings({
      sync_enabled: newSyncEnabled,
      last_sync: newSyncEnabled ? new Date().toISOString() : null,
    })

    toast({
      title: newSyncEnabled ? "Sync enabled" : "Sync disabled",
      description: newSyncEnabled
        ? "Device synchronization is now active"
        : "Device synchronization has been turned off",
    })
  }

  const handleForceSync = async () => {
    if (!syncEnabled) return

    setIsConnecting(true)
    setSyncProgress(0)

    // Simulate sync progress
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Simulate sync operation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setSyncProgress(100)

      const now = new Date().toISOString()
      setLastSync(now)
      await updateSyncSettings({ last_sync: now })

      toast({
        title: "Sync completed",
        description: "Your vault has been synchronized across all devices",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to synchronize devices",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
      setTimeout(() => setSyncProgress(0), 1000)
    }
  }

  const handleTestServerConnection = async () => {
    if (!serverConfig.url.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid server URL",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      // Test connection to custom server
      const response = await fetch(`${serverConfig.url}/health`)

      if (response.ok) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to your private server",
        })
      } else {
        throw new Error(`Server responded with status ${response.status}`)
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const generateNewPairingCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const segments = []

    for (let i = 0; i < 4; i++) {
      let segment = ""
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      segments.push(segment)
    }

    setPairingCode(segments.join("-"))
    toast({
      title: "New pairing code generated",
      description: "Use this code to connect a new device",
    })
  }

  const copyPairingCode = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode)
      toast({
        title: "Copied!",
        description: "Pairing code copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy pairing code",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "laptop":
        return <Laptop className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      case "desktop":
        return <Monitor className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return "Never"

    const date = new Date(lastSync)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sync settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Synchronization</h1>
            <Badge variant={syncEnabled ? "default" : "secondary"}>{syncEnabled ? "Active" : "Inactive"}</Badge>
          </div>
          <Button onClick={handleForceSync} disabled={!syncEnabled || isConnecting} variant="outline">
            {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isConnecting ? "Syncing..." : "Force Sync"}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sync Status
            </CardTitle>
            <CardDescription>Current synchronization status and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable synchronization</Label>
                <p className="text-sm text-muted-foreground">Sync your vault across multiple devices securely</p>
              </div>
              <Switch checked={syncEnabled} onCheckedChange={handleToggleSync} />
            </div>

            {syncEnabled && (
              <>
                <Separator />

                {isConnecting && syncProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Synchronizing...</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <Progress value={syncProgress} />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="font-medium">Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {connectedDevices.filter((d) => d.status === "online").length} devices
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="font-medium">Last Sync</p>
                    <p className="text-sm text-muted-foreground">{formatLastSync()}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Shield className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="font-medium">Encrypted</p>
                    <p className="text-sm text-muted-foreground">AES-256</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {syncEnabled && (
          <Tabs defaultValue="p2p" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="p2p">P2P Sync</TabsTrigger>
              <TabsTrigger value="server">Server Sync</TabsTrigger>
            </TabsList>

            {/* P2P Sync */}
            <TabsContent value="p2p" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Peer-to-Peer Synchronization
                  </CardTitle>
                  <CardDescription>Sync directly between your devices without a central server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">Maximum Privacy</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your data never leaves your local network. All communication is encrypted end-to-end using your
                        master password.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable P2P sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow devices on your network to sync automatically
                      </p>
                    </div>
                    <Switch checked={p2pEnabled} onCheckedChange={setP2pEnabled} />
                  </div>

                  {p2pEnabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Connected Devices</h4>
                        <div className="space-y-2">
                          {connectedDevices.map((device) => (
                            <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                                  {getDeviceIcon(device.type)}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {device.name}
                                    {device.isCurrent && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Current
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{device.ip}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={device.status === "online" ? "default" : "secondary"}>
                                  {device.status === "online" ? (
                                    <>
                                      <Wifi className="h-3 w-3 mr-1" />
                                      Online
                                    </>
                                  ) : (
                                    <>
                                      <WifiOff className="h-3 w-3 mr-1" />
                                      Offline
                                    </>
                                  )}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{device.lastSeen}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Add New Device</h4>
                          <Button variant="outline" size="sm" onClick={generateNewPairingCode}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            New Code
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-center w-16 h-16 bg-background rounded-lg">
                            <QrCode className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Pairing Code</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Use this code on another device to connect
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-background rounded text-sm font-mono">{pairingCode}</code>
                              <Button variant="outline" size="sm" onClick={copyPairingCode}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Server Sync */}
            <TabsContent value="server" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Private Server Synchronization
                  </CardTitle>
                  <CardDescription>Sync using your own private server or NAS device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">Advanced Feature</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        This feature requires technical setup. Your data remains encrypted even on your private server.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable server sync</Label>
                      <p className="text-sm text-muted-foreground">Connect to your private FortiVault server</p>
                    </div>
                    <Switch checked={serverSyncEnabled} onCheckedChange={setServerSyncEnabled} />
                  </div>

                  {serverSyncEnabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="server-url">Server URL</Label>
                            <Input
                              id="server-url"
                              placeholder="https://your-server.com:8443"
                              value={serverConfig.url}
                              onChange={(e) => setServerConfig((prev) => ({ ...prev, url: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="server-token">Access Token</Label>
                            <Input
                              id="server-token"
                              type="password"
                              placeholder="Your server access token"
                              value={serverConfig.token}
                              onChange={(e) => setServerConfig((prev) => ({ ...prev, token: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sync-interval">Sync Interval</Label>
                          <Select
                            value={serverConfig.interval}
                            onValueChange={(value) => setServerConfig((prev) => ({ ...prev, interval: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">Every 5 minutes</SelectItem>
                              <SelectItem value="15">Every 15 minutes</SelectItem>
                              <SelectItem value="30">Every 30 minutes</SelectItem>
                              <SelectItem value="60">Every hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={handleTestServerConnection} disabled={isConnecting}>
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Settings className="h-4 w-4 mr-2" />
                            )}
                            {isConnecting ? "Testing..." : "Test Connection"}
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            Save Configuration
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!syncEnabled && (
          <Card>
            <CardContent className="text-center py-12">
              <Sync className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Synchronization Disabled</h3>
              <p className="text-muted-foreground mb-4">
                Enable synchronization to keep your passwords in sync across all your devices
              </p>
              <Button onClick={handleToggleSync}>
                <Sync className="h-4 w-4 mr-2" />
                Enable Sync
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
