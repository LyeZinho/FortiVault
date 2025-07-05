"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface LoginFormProps {
  isSetup?: boolean
}

export function LoginForm({ isSetup = false }: LoginFormProps) {
  const [masterPassword, setMasterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, setupVault } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSetup && masterPassword !== confirmPassword) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isSetup) {
        await setupVault(masterPassword)
      } else {
        await login(masterPassword)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordsMatch = !isSetup || masterPassword === confirmPassword
  const isValid = masterPassword.length >= 8 && passwordsMatch

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{isSetup ? "Setup FortiVault" : "Unlock FortiVault"}</CardTitle>
          <CardDescription>
            {isSetup
              ? "Create your master password to secure your vault"
              : "Enter your master password to access your vault"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masterPassword">{isSetup ? "Master Password" : "Master Password"}</Label>
              <div className="relative">
                <Input
                  id="masterPassword"
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {isSetup && <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>}
            </div>

            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Master Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                  required
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSetup ? "Setting up..." : "Unlocking..."}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {isSetup ? "Setup Vault" : "Unlock Vault"}
                </>
              )}
            </Button>
          </form>

          {isSetup && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">🔐 Security Notice</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your master password encrypts all your data</li>
                <li>• We cannot recover your password if you forget it</li>
                <li>• Choose a strong, memorable password</li>
                <li>• All data is encrypted locally on your device</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
