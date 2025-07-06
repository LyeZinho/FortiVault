// Enhanced API client with server configuration support

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

interface User {
  id: number
  username: string
  email: string
  is_2fa_enabled: boolean
}

interface PasswordEntry {
  id?: string
  title: string
  username: string
  password: string
  url?: string
  notes?: string
  folder?: string
  tags?: string[]
  strength?: string
  is_favorite?: boolean
  created_at?: string
  updated_at?: string
}

interface VaultStats {
  total_passwords: number
  weak_passwords: number
  duplicate_passwords: number
  strong_passwords: number
  last_backup?: string
  security_score: number
}

interface Folder {
  id: string
  name: string
  color: string
  icon?: string
  password_count: number
  created_at: string
}

interface Settings {
  theme: string
  auto_lock: boolean
  auto_lock_time: number
  auto_backup: boolean
  backup_frequency: string
  sync_enabled: boolean
  biometric_auth: boolean
  show_password_strength: boolean
  clipboard_timeout: number
}

class FortiVaultApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    // Get server URL from localStorage or use default
    this.baseUrl = this.getServerUrl()
  }

  private getServerUrl(): string {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fortivault_server_url")
      if (saved) return saved
    }
    return "http://127.0.0.1:8000"
  }

  public setServerUrl(url: string): void {
    this.baseUrl = url
    if (typeof window !== "undefined") {
      localStorage.setItem("fortivault_server_url", url)
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        return { error: data.detail || data.message || `HTTP ${response.status}: ${response.statusText}` }
      }

      return { data }
    } catch (error) {
      console.error("API request failed:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return { error: "Request timeout - server may be unavailable" }
        }
        if (error.message.includes("fetch")) {
          return { error: `Cannot connect to server at ${this.baseUrl}. Make sure the backend is running.` }
        }
        return { error: error.message }
      }

      return { error: "Network error - please check your connection and server status" }
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string; timestamp: string }>> {
    return this.request<{ status: string; version: string; timestamp: string }>("/health")
  }

  // Authentication
  async register(username: string, email: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    })
  }

  async login(
    username: string,
    password: string,
    totpCode?: string,
  ): Promise<ApiResponse<{ access_token: string; expires_in: number }>> {
    const response = await this.request<{ access_token: string; expires_in: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        totp_code: totpCode,
      }),
    })

    if (response.data?.access_token) {
      this.token = response.data.access_token
      if (typeof window !== "undefined") {
        localStorage.setItem("fortivault_token", this.token)
      }
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request("/auth/logout", { method: "POST" })
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("fortivault_token")
    }
    return response
  }

  loadToken(): boolean {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fortivault_token")
      if (stored) {
        this.token = stored
        return true
      }
    }
    return false
  }

  // 2FA
  async setup2FA(): Promise<ApiResponse<{ secret: string; qr_code: string }>> {
    return this.request<{ secret: string; qr_code: string }>("/auth/2fa/setup", {
      method: "POST",
    })
  }

  async verify2FA(totpCode: string): Promise<ApiResponse<{ backup_codes: string[] }>> {
    return this.request<{ backup_codes: string[] }>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ totp_code: totpCode }),
    })
  }

  async disable2FA(totpCode: string): Promise<ApiResponse> {
    return this.request("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ totp_code: totpCode }),
    })
  }

  // Master Password
  async setupMasterPassword(masterPassword: string): Promise<ApiResponse> {
    return this.request("/vault/master-password/setup", {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    })
  }

  async verifyMasterPassword(masterPassword: string): Promise<ApiResponse> {
    return this.request("/vault/master-password/verify", {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    })
  }

  // Vault operations
  async getVaultStats(): Promise<ApiResponse<VaultStats>> {
    return this.request<VaultStats>("/vault/stats")
  }

  async getPasswords(): Promise<ApiResponse<PasswordEntry[]>> {
    return this.request<PasswordEntry[]>("/vault/passwords")
  }

  async addPassword(password: PasswordEntry): Promise<ApiResponse> {
    return this.request("/vault/passwords", {
      method: "POST",
      body: JSON.stringify(password),
    })
  }

  async updatePassword(id: string, password: Partial<PasswordEntry>): Promise<ApiResponse> {
    return this.request(`/vault/passwords/${id}`, {
      method: "PUT",
      body: JSON.stringify(password),
    })
  }

  async deletePassword(id: string): Promise<ApiResponse> {
    return this.request(`/vault/passwords/${id}`, {
      method: "DELETE",
    })
  }

  // Folders
  async getFolders(): Promise<ApiResponse<Folder[]>> {
    return this.request<Folder[]>("/vault/folders")
  }

  async createFolder(name: string, color: string, icon?: string): Promise<ApiResponse> {
    return this.request("/vault/folders", {
      method: "POST",
      body: JSON.stringify({ name, color, icon }),
    })
  }

  // Settings
  async getSettings(): Promise<ApiResponse<Settings>> {
    return this.request<Settings>("/settings")
  }

  async updateSettings(settings: Partial<Settings>): Promise<ApiResponse> {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify({ settings }),
    })
  }

  // Backup operations
  async createBackup(includeSettings = true): Promise<ApiResponse> {
    return this.request("/vault/backup", {
      method: "POST",
      body: JSON.stringify({ include_settings: includeSettings }),
    })
  }

  async getBackups(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/vault/backups")
  }

  // Password generation (client-side for security)
  generatePassword(length = 16, includeSymbols = true): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    const charset = chars + (includeSymbols ? symbols : "")

    let password = ""

    // Ensure at least one character from each category
    password += chars.charAt(Math.floor(Math.random() * 26)) // lowercase
    password += chars.charAt(Math.floor(Math.random() * 26) + 26) // uppercase
    password += chars.charAt(Math.floor(Math.random() * 10) + 52) // digit

    if (includeSymbols) {
      password += symbols.charAt(Math.floor(Math.random() * symbols.length))
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")
  }
}

export const apiClient = new FortiVaultApiClient()
