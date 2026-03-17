export type SecretType = 'LOGIN' | 'API_KEY' | 'ENV_VAR' | 'SECURE_NOTE' | 'CERTIFICATE';

export interface Secret {
  id: string;
  vaultId: string;
  type: SecretType;
  title: string;
  value: string;
  username?: string;
  url?: string;
  totpSecret?: string;
  notes?: string;
  tags: string[];
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface Vault {
  id: string;
  name: string;
  type: 'PERSONAL' | 'DEPARTMENT' | 'SHARED';
  color?: string;
}

export type UserStatus = 'ACTIVE' | 'PENDING_KEY_EXCHANGE' | 'DEACTIVATED';

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  publicKey?: string;
  groups: string[];
  lastActive: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'SUCCESS' | 'DENIED';
}
