import { Secret, Vault, User, AuditLog } from './types';

export const MOCK_VAULTS: Vault[] = [
  { id: 'v1', name: 'Pessoal', type: 'PERSONAL' },
  { id: 'v2', name: 'Engenharia', type: 'DEPARTMENT', color: 'neo-blue' },
  { id: 'v3', name: 'Shared: Projeto X', type: 'SHARED' },
];

export const MOCK_SECRETS: Secret[] = [
  {
    id: 's1',
    vaultId: 'v1',
    type: 'LOGIN',
    title: 'Github Personal Token',
    value: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
    username: 'pedrokaleb',
    url: 'https://github.com',
    totpSecret: 'JBSWY3DPEHPK3PXP',
    tags: ['dev', 'personal', 'github'],
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 's2',
    vaultId: 'v2',
    type: 'API_KEY',
    title: 'AWS_PROD_SECRET',
    value: 'AKIAIOSFODNN7EXAMPLE/wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    metadata: { provider: 'AWS', region: 'us-east-1' },
    tags: ['cloud', 'prod', 'aws'],
    createdAt: '2024-03-16T14:30:00Z',
  },
  {
    id: 's3',
    vaultId: 'v2',
    type: 'ENV_VAR',
    title: 'STRIPE_WEBHOOK_SECRET',
    value: 'whsec_abcdef123456\nwhsec_test_789012',
    metadata: { environment: 'Production' },
    tags: ['finance', 'webhooks', 'stripe'],
    createdAt: '2024-03-17T09:00:00Z',
  },
  {
    id: 's4',
    vaultId: 'v3',
    type: 'SECURE_NOTE',
    title: 'Server Access Protocol',
    value: '1. Connect to VPN\n2. SSH into bastion\n3. Access internal nodes\n4. Use 2FA for root',
    tags: ['security', 'internal', 'servers'],
    createdAt: '2024-03-14T11:20:00Z',
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'pedrokalebdej1@gmail.com',
    status: 'ACTIVE',
    publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...',
    groups: ['Admin', 'Engineering'],
    lastActive: '2024-03-17T09:00:00Z',
  },
  {
    id: 'u2',
    email: 'joao.silva@fortivault.io',
    status: 'PENDING_KEY_EXCHANGE',
    groups: ['Engineering'],
    lastActive: 'Never',
  },
  {
    id: 'u3',
    email: 'maria.dev@fortivault.io',
    status: 'ACTIVE',
    publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAJ...',
    groups: ['Engineering', 'Manager'],
    lastActive: '2024-03-16T18:45:00Z',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l1',
    actor: 'pedrokalebdej1@gmail.com',
    action: 'INVITED',
    target: 'joao.silva@fortivault.io',
    timestamp: '2024-03-17T08:30:00Z',
    status: 'SUCCESS',
  },
  {
    id: 'l2',
    actor: 'maria.dev@fortivault.io',
    action: 'ACCESS_VAULT',
    target: 'Engenharia',
    timestamp: '2024-03-17T08:45:00Z',
    status: 'SUCCESS',
  },
  {
    id: 'l3',
    actor: 'unknown_ip',
    action: 'LOGIN_ATTEMPT',
    target: 'pedrokalebdej1@gmail.com',
    timestamp: '2024-03-17T09:10:00Z',
    status: 'DENIED',
  },
];
