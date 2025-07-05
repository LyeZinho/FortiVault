"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  Smartphone,
  Monitor,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"

export function Sync() {
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [syncMode, setSyncMode] = useState<"p2p" | "server">("p2p")
  const [serverUrl, setServerUrl] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastSync, setLastSync] = useState("Never")
  const { toast } = useToast()

  const connectedDevices = [
    {
      id: 1,
      name: "MacBook Pro",
      type: "desktop",
      status: "online",
      lastSeen: "2 minutes ago",
      ip: "192.168.1.100",
    },
    {
      id: 2,
      name: "iPhone 15",
      type: "mobile",
      status: "offline",
      lastSeen: "1 hour ago",
      ip: "192.168.1.101",
    },
  ]

  const handleToggleSync = async () => {
    if (!syncEnabled) {
      setIsConnecting(true)
      // Simulate connection process
      setTimeout(() => {
        setIsConnecting(false)
        setSyncEnabled(true)
        setLastSync("Just now")
        toast({
          title: "Sync enabled!",
          description: `Connected via ${syncMode === "p2p" ? "P2P network" : "private server"}`,
        })
      }, 2000)
    } else {
      setSyncEnabled(false)
      toast({
        title: "Sync disabled",
        description: "Your vault is now in offline mode",
      })
    }
  }

  const handleManualSync = () => {
    toast({
      title: "Syncing...",
      description: "Synchronizing with connected devices",
    })
    setTimeout(() => {
      setLastSync("Just now")
      toast({
        title: "Sync completed!",
        description: "All devices are up to date",
      })
    }, 1500)
  }

  const handleConnectServer = () => {
    if (!serverUrl) {
      toast({
        title: "Server URL required",
        description: "Please enter your private server URL",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Connecting to server...",
      description: "Establishing secure connection",
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncEnabled ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-gray-500" />}
            Synchronization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{syncEnabled ? "Sync Enabled" : "Offline Mode"}</span>
                <Badge variant={syncEnabled ? "default" : "secondary"}>
                  {syncEnabled ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {syncEnabled
                  ? `Last sync: ${lastSync} • ${connectedDevices.filter((d) => d.status === "online").length} devices online`
                  : "Enable sync to share passwords across devices"}
              </p>
            </div>

            <div className="flex gap-2">
              {syncEnabled && (
                <Button size="sm" variant="outline" onClick={handleManualSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              )}
              <Button
                onClick={handleToggleSync}
                disabled={isConnecting}
                variant={syncEnabled ? "destructive" : "default"}
              >
                {isConnecting ? "Connecting..." : syncEnabled ? "Disable Sync" : "Enable Sync"}
              </Button>
            </div>
          </div>

          {isConnecting && (
            <div className="space-y-2">
              <Progress value={66} />
              <p className="text-sm text-muted-foreground">Establishing secure connection...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Method */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronization Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                syncMode === "p2p" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setSyncMode("p2p")}
            >
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-blue-500 mt-1" />
                <div className="space-y-1">
                  <h4 className="font-medium">Peer-to-Peer (P2P)</h4>
                  <p className="text-sm text-muted-foreground">
                    Direct sync between your devices without external servers
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Recommended
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      No Server Required
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                syncMode === "server" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setSyncMode("server")}
            >
              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-green-500 mt-1" />
                <div className="space-y-1">
                  <h4 className="font-medium">Private Server</h4>
                  <p className="text-sm text-muted-foreground">Sync via your own NAS or VPS server</p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Self-Hosted
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Always Available
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {syncMode === "server" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="serverUrl">Private Server URL</Label>
                <Input
                  id="serverUrl"
                  placeholder="https://your-server.com:8080"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleConnectServer} className="gap-2">
                <Server className="h-4 w-4" />
                Connect to Server
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Devices */}
      {syncEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Connected Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {device.status === "online" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                      {device.type === "mobile" ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{device.name}</span>
                        <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {device.ip} • Last seen: {device.lastSeen}
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="outline">
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">End-to-End Encryption</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  All data is encrypted on your device before transmission. Even if intercepted, your passwords remain
                  secure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Zero-Knowledge Architecture</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  FortiVault never has access to your master password or decrypted data. Only you can unlock your vault.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Network Security</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Ensure you're on a trusted network when syncing. Consider using a VPN for additional security on
                  public networks.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
