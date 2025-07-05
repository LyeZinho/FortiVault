/**
 * API client for FortiVault backend integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("fortivault_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication
  async setupVault(masterPassword: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>("/auth/setup", {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    })

    if (response.access_token) {
      this.setToken(response.access_token)
    }

    return response
  }

  async login(masterPassword: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    })

    if (response.access_token) {
      this.setToken(response.access_token)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" })
    } finally {
      this.clearToken()
    }
  }

  async getAuthStatus(): Promise<{ authenticated: boolean; vault_setup: boolean }> {
    return this.request("/auth/status")
  }

  // Vault operations
  async getPasswords(
    search?: string,
    folderId?: string,
  ): Promise<{
    passwords: Password[]
    total: number
  }> {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (folderId) params.append("folder_id", folderId)

    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/vault/passwords${query}`)
  }

  async getPassword(id: number): Promise<Password> {
    return this.request(`/vault/passwords/${id}`)
  }

  async createPassword(passwordData: Omit<Password, "id" | "created_at" | "updated_at">): Promise<{ id: number }> {
    return this.request("/vault/passwords", {
      method: "POST",
      body: JSON.stringify(passwordData),
    })
  }

  async updatePassword(id: number, passwordData: Partial<Password>): Promise<ApiResponse> {
    return this.request(`/vault/passwords/${id}`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    })
  }

  async deletePassword(id: number): Promise<ApiResponse> {
    return this.request(`/vault/passwords/${id}`, {
      method: "DELETE",
    })
  }

  async getFolders(): Promise<{ folders: Folder[] }> {
    return this.request("/vault/folders")
  }

  async createFolder(folderData: { id: string; name: string; icon?: string }): Promise<{ id: string }> {
    return this.request("/vault/folders", {
      method: "POST",
      body: JSON.stringify(folderData),
    })
  }

  async getVaultStats(): Promise<VaultStats> {
    return this.request("/vault/stats")
  }

  async generatePassword(options: {
    length: number
    include_uppercase: boolean
    include_lowercase: boolean
    include_numbers: boolean
    include_symbols: boolean
  }): Promise<{ password: string; strength: number }> {
    return this.request("/vault/generate-password", {
      method: "POST",
      body: JSON.stringify(options),
    })
  }

  // Backup operations
  async createBackup(backupType = "manual"): Promise<{
    backup: BackupInfo
    message: string
  }> {
    return this.request("/backup/create", {
      method: "POST",
      body: JSON.stringify({ backup_type: backupType }),
    })
  }

  async getBackupHistory(): Promise<{ backups: BackupInfo[] }> {
    return this.request("/backup/history")
  }

  async restoreBackup(file: File, backupKey: string, merge = false): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append("backup_file", file)
    formData.append("backup_key", backupKey)
    formData.append("merge", merge.toString())

    return this.request("/backup/restore", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }

  async verifyBackup(file: File, backupKey: string): Promise<BackupVerification> {
    const formData = new FormData()
    formData.append("backup_file", file)
    formData.append("backup_key", backupKey)

    return this.request("/backup/verify", {
      method: "POST",
      body: formData,
      headers: {},
    })
  }

  async deleteBackup(backupId: number): Promise<ApiResponse> {
    return this.request(`/backup/${backupId}`, {
      method: "DELETE",
    })
  }

  async downloadBackup(backupId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/backup/download/${backupId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to download backup")
    }

    return response.blob()
  }

  // Sync operations
  async getSyncStatus(): Promise<SyncStatus> {
    return this.request("/sync/status")
  }

  async enableSync(settings: {
    enabled: boolean
    mode: string
    server_url?: string
  }): Promise<ApiResponse> {
    return this.request("/sync/enable", {
      method: "POST",
      body: JSON.stringify(settings),
    })
  }

  async disableSync(): Promise<ApiResponse> {
    return this.request("/sync/disable", {
      method: "POST",
    })
  }

  async manualSync(): Promise<ApiResponse> {
    return this.request("/sync/manual-sync", {
      method: "POST",
    })
  }

  // Token management
  private setToken(token: string): void {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("fortivault_token", token)
    }
  }

  private clearToken(): void {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("fortivault_token")
    }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Types
export interface Password {
  id: number
  title: string
  username?: string
  password: string
  url?: string
  notes?: string
  folder_id?: string
  strength: number
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  icon?: string
  count: number
  created_at?: string
}

export interface VaultStats {
  total_passwords: number
  weak_passwords: number
  favorite_passwords: number
  recent_passwords: number
}

export interface BackupInfo {
  id?: number
  filename: string
  backup_key?: string
  file_path?: string
  size_bytes: number
  size_mb?: number
  created_at: string
  backup_type: string
  file_exists?: boolean
  total_passwords?: number
}

export interface BackupVerification {
  valid: boolean
  error?: string
  version?: string
  created_at?: string
  total_passwords?: number
  total_folders?: number
  app_version?: string
  file_size_mb?: number
}

export interface SyncStatus {
  enabled: boolean
  mode: string
  last_sync: string
  connected_devices: number
  available_modes: string[]
}

// Export singleton instance
export const apiClient = new ApiClient()
