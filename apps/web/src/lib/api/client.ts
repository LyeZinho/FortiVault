// API Client for FortiVault Backend
import type { Secret, Vault, User, AuditLog } from '$lib/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fortivault_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('fortivault_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fortivault_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async registerPublicKey(userId: string, publicKey: string) {
    return this.request('/auth/register-key', {
      method: 'POST',
      body: JSON.stringify({ userId, publicKey }),
    });
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async verify() {
    return this.request<{ userId: string; email: string }>('/auth/verify');
  }

  // Users
  async getUsers() {
    return this.request<User[]>('/users');
  }

  async inviteUser(email: string, groups?: string[]) {
    return this.request<User>('/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, groups }),
    });
  }

  async deactivateUser(userId: string) {
    return this.request(`/users/${userId}/deactivate`, { method: 'POST' });
  }

  // Vaults
  async getVaults() {
    return this.request<Vault[]>('/vaults');
  }

  async createVault(name: string, type: 'PERSONAL' | 'DEPARTMENT' | 'SHARED') {
    return this.request<Vault>('/vaults', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  }

  async addVaultMember(vaultId: string, userId: string, role: string) {
    return this.request(`/vaults/${vaultId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeVaultMember(vaultId: string, userId: string) {
    return this.request(`/vaults/${vaultId}/members/${userId}`, { method: 'POST' });
  }

  // Secrets
  async getSecrets(vaultId: string) {
    return this.request<Secret[]>(`/secrets/vault/${vaultId}`);
  }

  async createSecret(secret: Omit<Secret, 'id' | 'createdAt'>) {
    return this.request<Secret>('/secrets', {
      method: 'POST',
      body: JSON.stringify(secret),
    });
  }

  async updateSecret(id: string, encryptedPayload: string) {
    return this.request(`/secrets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedPayload }),
    });
  }

  async deleteSecret(id: string) {
    return this.request(`/secrets/${id}`, { method: 'DELETE' });
  }

  // Audit
  async getAuditLogs(limit = 100) {
    return this.request<AuditLog[]>(`/audit?limit=${limit}`);
  }
}

export const api = new ApiClient();
export default api;
