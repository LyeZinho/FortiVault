// Types for FortiVault

export type SecretType = 'LOGIN' | 'API_KEY' | 'ENV_VAR' | 'SECURE_NOTE' | 'CERTIFICATE';

export interface Secret {
  id: string;
  vaultId: string;
  type: SecretType;
  title: string;
  value?: string; // Only populated after decryption from Desktop
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

export type Language = 'en' | 'es' | 'pt';

export type RecoveryShareHolderRole = 'USER' | 'ADMIN' | 'COLLEAGUE' | 'EXTERNAL';

export interface RecoveryShareHolder {
  id: string;
  name: string;
  email?: string;
  role: RecoveryShareHolderRole;
  shareEncrypted?: string;
  verified: boolean;
}

export interface RecoveryConfig {
  threshold: number;
  totalShares: number;
  shareHolders: RecoveryShareHolder[];
  createdAt: string;
  status: 'ACTIVE' | 'PENDING' | 'USED';
}

export interface Translations {
  title: string;
  newSecret: string;
  vaults: string;
  filters: string;
  searchPlaceholder: string;
  emptyState: string;
  reveal: string;
  revealing: string;
  edit: string;
  save: string;
  cancel: string;
  delete: string;
  status: string;
  connected: string;
  offline: string;
  tags: string;
  username: string;
  url: string;
  notes: string;
  totp: string;
  metadata: string;
  details: string;
  autoLockMsg: string;
  seconds: string;
  darkMode: string;
  language: string;
  personal: string;
  department: string;
  shared: string;
  allTags: string;
  admin: string;
  users: string;
  auditTrail: string;
  inviteUser: string;
  active: string;
  pending: string;
  deactivated: string;
  groups: string;
  lastActive: string;
  publicKey: string;
  vaultView: string;
  login: string;
  password: string;
  masterPassword: string;
  unlock: string;
  loginTitle: string;
  loginSubtitle: string;
  errorLogin: string;
}
