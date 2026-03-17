// Database schema for FortiVault
import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'PENDING_KEY_EXCHANGE', 'DEACTIVATED']);
export const vaultTypeEnum = pgEnum('vault_type', ['PERSONAL', 'DEPARTMENT', 'SHARED']);
export const secretTypeEnum = pgEnum('secret_type', ['LOGIN', 'API_KEY', 'ENV_VAR', 'SECURE_NOTE', 'CERTIFICATE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  publicKey: text('public_key'),
  encryptedMasterKey: text('encrypted_master_key'), // Encrypted with user's public key
  status: userStatusEnum('status').default('PENDING_KEY_EXCHANGE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vaults = pgTable('vaults', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: vaultTypeEnum('type').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  departmentId: uuid('department_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vaultPermissions = pgTable('vault_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  vaultId: uuid('vault_id').references(() => vaults.id).notNull(),
  role: varchar('role', { length: 50 }).default('VIEWER'), // ADMIN, EDITOR, VIEWER
  encryptedKey: text('encrypted_key'), // Vault key encrypted with user's public key
  createdAt: timestamp('created_at').defaultNow(),
});

export const secrets = pgTable('secrets', {
  id: uuid('id').defaultRandom().primaryKey(),
  vaultId: uuid('vault_id').references(() => vaults.id).notNull(),
  type: secretTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  encryptedPayload: text('encrypted_payload').notNull(), // The actual secret, encrypted
  metadata: jsonb('metadata'), // Non-sensitive metadata (URL, provider, etc.)
  tags: text('tags').array(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  target: varchar('target', { length: 255 }),
  targetType: varchar('target_type', { length: 50 }), // USER, VAULT, SECRET
  status: varchar('status', { length: 20 }).default('SUCCESS'), // SUCCESS, DENIED
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
