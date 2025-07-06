"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Server, CheckCircle, XCircle, Loader2, Shield, Globe, AlertTriangle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ServerConfigProps {
  onConfigured: (serverUrl: string) => void
}

export function ServerConfig({ onConfigured }: ServerConfigProps) {
  const { toast } = useToast()
  const [serverUrl, setServerUrl] = useState("http://127.0.0.1:8000")
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [customUrl, setCustomUrl] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const presetServers = [
    {
      name: "Local Development",
      url: "http://127.0.0.1:8000",
      description: "FortiVault backend running locally",
    },
    {
      name: "Local Network",
      url: "http://192.168.1.100:8000",
      description: "FortiVault on local network",
    },
    {
      name: "Custom Server",
      url: "custom",
      description: "Enter your own server URL",
    },
  ]

  const testConnection = async (url: string) => {
    setIsTestingConnection(true)
    setConnectionStatus("testing")

    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data = await response.json()
      setServerInfo(data)
      setConnectionStatus("success")

      toast({
        title: "Connection successful!",
        description: `Connected to FortiVault ${data.version || "server"}`,
      })

      return true
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionStatus("error")
      setServerInfo(null)

      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Unable to connect to server",
        variant: "destructive",
      })

      return false
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleServerSelect = async (selectedUrl: string) => {
    if (selectedUrl === "custom") {
      setUseCustom(true)
      return
    }

    setServerUrl(selectedUrl)
    setUseCustom(false)
    await testConnection(selectedUrl)
  }

  const handleCustomUrlTest = async () => {
    if (!customUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid server URL",
        variant: "destructive",
      })
      return
    }

    setServerUrl(customUrl)
    await testConnection(customUrl)
  }

  const handleContinue = () => {
    if (connectionStatus === "success") {
      // Store server configuration
      localStorage.setItem("fortivault_server_url", serverUrl)
      onConfigured(serverUrl)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not tested</Badge>
    }
  }

  // Auto-test default server on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("fortivault_server_url")
    if (savedUrl) {
      setServerUrl(savedUrl)
      testConnection(savedUrl)
    } else {
      testConnection(serverUrl)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-lg bg-primary">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Configure FortiVault Server</CardTitle>
          <CardDescription>Connect to your FortiVault backend server to get started</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">Current Server</p>
                <p className="text-sm text-muted-foreground">{serverUrl}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Server Information */}
          {serverInfo && connectionStatus === "success" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Server Details:</strong>
                <br />
                Version: {serverInfo.version}
                <br />
                Status: {serverInfo.status}
                <br />
                Connected at: {new Date(serverInfo.timestamp).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Error */}
          {connectionStatus === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Failed</strong>
                <br />
                Make sure the FortiVault backend is running and accessible.
                <br />
                <br />
                <strong>To start the backend:</strong>
                <br />
                1. Navigate to the backend folder
                <br />
                2. Run: <code className="bg-muted px-1 rounded">python main.py</code>
                <br />
                3. Or: <code className="bg-muted px-1 rounded">./start.sh</code> (Linux/Mac)
                <br />
                4. Or: <code className="bg-muted px-1 rounded">start.bat</code> (Windows)
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Server Presets */}
          <div className="space-y-4">
            <h3 className="font-medium">Choose Server</h3>
            <div className="grid gap-3">
              {presetServers.map((server) => (
                <button
                  key={server.url}
                  onClick={() => handleServerSelect(server.url)}
                  disabled={isTestingConnection}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-accent ${
                    serverUrl === server.url && !useCustom ? "border-primary bg-accent" : ""
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{server.name}</p>
                    <p className="text-sm text-muted-foreground">{server.description}</p>
                    {server.url !== "custom" && <p className="text-xs text-muted-foreground mt-1">{server.url}</p>}
                  </div>
                  <Globe className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input */}
          {useCustom && (
            <div className="space-y-4">
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="customUrl">Custom Server URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="customUrl"
                    placeholder="https://your-server.com:8000"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <Button onClick={handleCustomUrlTest} disabled={isTestingConnection || !customUrl.trim()}>
                    {isTestingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => testConnection(serverUrl)}
              variant="outline"
              disabled={isTestingConnection}
              className="flex-1"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            <Button onClick={handleContinue} disabled={connectionStatus !== "success"} className="flex-1">
              Continue to Login
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Need help setting up the backend?</p>
            <p>Check the README.md file for installation instructions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
