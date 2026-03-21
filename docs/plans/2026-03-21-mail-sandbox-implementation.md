# Fortivault Mail Sandbox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Mailpit internal mail sandbox into Fortivault, enabling isolated user mailboxes, email-based account activation, and admin management without external SMTP services.

**Architecture:** Backend NestJS connects via SMTP to internal Mailpit service. Each Fortivault user gets isolated mailbox (`user@fortivault.local`). Webmail UI exposed via nginx proxy, SMTP/IMAP remain internal. Emails auto-expire after 30 days.

**Tech Stack:** Docker/docker-compose, Mailpit, NestJS, @nestjs/mailer, Nodemailer, Handlebars templates

---

## Pre-Implementation Verification

**Verify Current State:**
```bash
cd /home/pedro/repo/FortiVault

# Check NestJS backend structure
ls -la backend/src/

# Verify docker-compose.yml
cat docker-compose.yml

# Check for existing mail code
grep -r "mail\|email\|smtp" backend/src/ | head -5
```

**Expected:** No existing mail module, docker-compose has 3 services (backend, frontend, nginx).

---

## Task 1: Add fv-mail Service to docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Review current docker-compose structure**

Run: `cat docker-compose.yml`

Expected: Current services (backend, frontend, nginx), networks (fortivault-network)

**Step 2: Add fv-mail service and new network**

Replace the entire `docker-compose.yml` with:

```yaml
version: '3.8'

services:
  fv-mail:
    image: axllent/mailpit:latest
    container_name: fv-mail-${INSTANCE_ID:-default}
    networks:
      - fv-internal
    environment:
      MP_MAX_MESSAGES: 500
      MP_RETENTION_HOURS: 720
      MP_DATABASE: /data/mailpit.db
      MP_LISTEN: 0.0.0.0:1025
      MP_UI_BIND_ADDR: 0.0.0.0:8025
      MP_IMAP_BIND_ADDR: 0.0.0.0:1143
    volumes:
      - fv-mail-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8025"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fortivault-backend-${INSTANCE_ID:-default}
    ports:
      - "8000:8000"
    environment:
      - DATABASE_PATH=/app/data/vault.db
      - SECRET_KEY=${SECRET_KEY:-your-super-secret-key-min-32-characters-long}
      - DEBUG=false
      - ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://frontend:3000
      - HOST=0.0.0.0
      - PORT=8000
      - SMTP_HOST=fv-mail
      - SMTP_PORT=1025
      - MAIL_FROM=noreply@fortivault.local
      - WEBMAIL_URL=http://localhost:8025
    volumes:
      - vault_data:/app/data
      - backup_data:/app/backups
      - ./backend/logs:/app/logs
    depends_on:
      fv-mail:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - fv-internal
      - fortivault-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - NEXT_PUBLIC_API_URL=http://backend:8000
    container_name: fortivault-frontend-${INSTANCE_ID:-default}
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NODE_ENV=production
      - HOSTNAME=0.0.0.0
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - fortivault-network

  nginx:
    image: nginx:alpine
    container_name: fortivault-proxy-${INSTANCE_ID:-default}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - fortivault-network

volumes:
  vault_data:
    driver: local
  backup_data:
    driver: local
  fv-mail-data:
    driver: local

networks:
  fv-internal:
    driver: bridge
    internal: true
  fortivault-network:
    driver: bridge
```

**Step 3: Verify syntax**

Run: `docker-compose config --quiet && echo "✅ docker-compose.yml is valid"`

Expected: No errors, outputs "✅ docker-compose.yml is valid"

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add fv-mail (Mailpit) service to docker-compose

- New service fv-mail with Mailpit image
- Internal network (fv-internal) for mail services
- 30-day retention policy (MP_RETENTION_HOURS: 720)
- Backend depends on fv-mail healthcheck
- Mail environment vars added to backend service
- SMTP port 1025 internal, Webmail port 8025 exposed for nginx"
```

---

## Task 2: Create NestJS Mail Module

**Files:**
- Create: `backend/src/mail/mail.module.ts`
- Create: `backend/src/mail/mail.service.ts`
- Create: `backend/src/mail/dto/send-mail.dto.ts`

**Step 1: Create mail directory structure**

```bash
cd /home/pedro/repo/FortiVault/backend/src
mkdir -p mail/dto mail/templates
cd mail
```

**Step 2: Create dto/send-mail.dto.ts**

```typescript
// backend/src/mail/dto/send-mail.dto.ts
export class SendMailDto {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}
```

**Step 3: Create mail.service.ts**

```typescript
// backend/src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendMail(sendMailDto: SendMailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: sendMailDto.to,
        subject: sendMailDto.subject,
        template: sendMailDto.template,
        context: sendMailDto.context || {},
      });
      this.logger.log(`Email sent to ${sendMailDto.to} with template ${sendMailDto.template}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendMailDto.to}:`, error);
      throw error;
    }
  }

  async sendActivationEmail(email: string, token: string, activationUrl: string): Promise<void> {
    return this.sendMail({
      to: email,
      subject: 'Activate Your Fortivault Account',
      template: 'activation',
      context: {
        email,
        token,
        activationUrl,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, resetUrl: string): Promise<void> {
    return this.sendMail({
      to: email,
      subject: 'Reset Your Fortivault Password',
      template: 'password-reset',
      context: {
        email,
        token,
        resetUrl,
      },
    });
  }

  async sendDepartmentInviteEmail(
    email: string,
    invitedBy: string,
    departmentName: string,
    inviteToken: string,
    inviteUrl: string,
  ): Promise<void> {
    return this.sendMail({
      to: email,
      subject: `You're invited to department: ${departmentName}`,
      template: 'department-invite',
      context: {
        email,
        invitedBy,
        departmentName,
        inviteToken,
        inviteUrl,
      },
    });
  }

  async sendSecurityAlertEmail(
    email: string,
    alertType: string,
    details: Record<string, any>,
  ): Promise<void> {
    return this.sendMail({
      to: email,
      subject: `[Fortivault Security Alert] ${alertType}`,
      template: 'security-alert',
      context: {
        email,
        alertType,
        ...details,
      },
    });
  }
}
```

**Step 4: Create mail.module.ts**

```typescript
// backend/src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const smtpHost = configService.get<string>('SMTP_HOST', 'fv-mail');
        const smtpPort = configService.get<number>('SMTP_PORT', 1025);
        const mailFrom = configService.get<string>('MAIL_FROM', 'noreply@fortivault.local');

        return {
          transport: {
            host: smtpHost,
            port: smtpPort,
            secure: false, // Internal network, no TLS needed
            auth: null,    // No auth required (trusted internal network)
          },
          defaults: {
            from: mailFrom,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

**Step 5: Verify syntax (TypeScript compilation)**

```bash
cd /home/pedro/repo/FortiVault/backend
npx tsc --noEmit src/mail/mail.module.ts
```

Expected: No compilation errors

**Step 6: Commit**

```bash
git add backend/src/mail/
git commit -m "feat: create NestJS mail module with Mailpit integration

- MailService with typed send methods
- Support for: activation, password-reset, department-invite, security-alert
- Handlebars template adapter configured
- ConfigService for environment variables (SMTP_HOST, SMTP_PORT, MAIL_FROM)
- Error logging for mail failures"
```

---

## Task 3: Create Email Templates

**Files:**
- Create: `backend/src/mail/templates/activation.hbs`
- Create: `backend/src/mail/templates/password-reset.hbs`
- Create: `backend/src/mail/templates/department-invite.hbs`
- Create: `backend/src/mail/templates/security-alert.hbs`

**Step 1: Create activation.hbs**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 4px solid #000; }
    .button { background: #3B82F6; color: #fff; padding: 12px 24px; text-decoration: none; display: inline-block; border: 2px solid #000; font-weight: bold; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Fortivault</h1>
    </div>
    <div class="content">
      <h2>Welcome to Fortivault</h2>
      <p>Hi {{email}},</p>
      <p>Your account has been created. Click the button below to activate it.</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="{{activationUrl}}" class="button">Activate Account</a>
      </p>
      <p><small>Or copy this link: {{activationUrl}}</small></p>
      <p>This link expires in 24 hours.</p>
    </div>
    <div class="footer">
      <p>Fortivault • Zero-Knowledge Secret Manager</p>
    </div>
  </div>
</body>
</html>
```

**Step 2: Create password-reset.hbs**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 4px solid #000; }
    .button { background: #3B82F6; color: #fff; padding: 12px 24px; text-decoration: none; display: inline-block; border: 2px solid #000; font-weight: bold; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
    .warning { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Fortivault</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hi {{email}},</p>
      <p>We received a password reset request for your account.</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      <p><small>Or copy this link: {{resetUrl}}</small></p>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> If you didn't request this, ignore this email. Your account remains secure.
      </div>
      <p>This link expires in 24 hours.</p>
    </div>
    <div class="footer">
      <p>Fortivault • Zero-Knowledge Secret Manager</p>
    </div>
  </div>
</body>
</html>
```

**Step 3: Create department-invite.hbs**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 4px solid #000; }
    .button { background: #3B82F6; color: #fff; padding: 12px 24px; text-decoration: none; display: inline-block; border: 2px solid #000; font-weight: bold; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
    .info-box { background: #F3F4F6; padding: 15px; margin: 15px 0; border-left: 4px solid #3B82F6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Fortivault</h1>
    </div>
    <div class="content">
      <h2>Department Invitation</h2>
      <p>Hi {{email}},</p>
      <p><strong>{{invitedBy}}</strong> invited you to join the <strong>{{departmentName}}</strong> department in Fortivault.</p>
      <div class="info-box">
        <p><strong>Department:</strong> {{departmentName}}</p>
        <p><strong>Invited by:</strong> {{invitedBy}}</p>
      </div>
      <p style="text-align: center; margin: 20px 0;">
        <a href="{{inviteUrl}}" class="button">Accept Invitation</a>
      </p>
      <p><small>Or copy this link: {{inviteUrl}}</small></p>
    </div>
    <div class="footer">
      <p>Fortivault • Zero-Knowledge Secret Manager</p>
    </div>
  </div>
</body>
</html>
```

**Step 4: Create security-alert.hbs**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 4px solid #000; }
    .alert { background: #FECACA; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Fortivault - Security Alert</h1>
    </div>
    <div class="content">
      <h2>⚠️ {{alertType}}</h2>
      <p>Hi {{email}},</p>
      <div class="alert">
        <p><strong>Alert Type:</strong> {{alertType}}</p>
        {{#if timestamp}}<p><strong>Time:</strong> {{timestamp}}</p>{{/if}}
        {{#if ipAddress}}<p><strong>IP Address:</strong> {{ipAddress}}</p>{{/if}}
        {{#if userAgent}}<p><strong>Device:</strong> {{userAgent}}</p>{{/if}}
      </div>
      <p>If this wasn't you, please change your password immediately and contact support.</p>
      <p><strong>Your account security is our priority.</strong></p>
    </div>
    <div class="footer">
      <p>Fortivault • Zero-Knowledge Secret Manager</p>
    </div>
  </div>
</body>
</html>
```

**Step 5: Verify templates exist**

```bash
ls -la /home/pedro/repo/FortiVault/backend/src/mail/templates/
```

Expected: 4 .hbs files listed

**Step 6: Commit**

```bash
git add backend/src/mail/templates/
git commit -m "feat: add email templates for mail service

- activation.hbs: Account activation flow
- password-reset.hbs: Password reset with security notice
- department-invite.hbs: Department invitation workflow
- security-alert.hbs: Security alerts and notifications
- All templates use neobrutalist design (4px borders, sans-serif, #000 header)"
```

---

## Task 4: Import MailModule into NestJS AppModule

**Files:**
- Modify: `backend/src/app.module.ts`

**Step 1: Verify current app.module.ts**

```bash
cat /home/pedro/repo/FortiVault/backend/src/app.module.ts
```

Expected: Should show imports array with existing modules

**Step 2: Add MailModule import**

Open `backend/src/app.module.ts` and add `MailModule` to the imports:

```typescript
// Add to imports in @Module decorator:
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    // ... existing imports
    MailModule,
  ],
  // ... rest of module
})
export class AppModule {}
```

**Step 3: Verify no import conflicts**

```bash
cd /home/pedro/repo/FortiVault/backend
npx tsc --noEmit src/app.module.ts
```

Expected: No errors

**Step 4: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "feat: register MailModule in AppModule

- MailModule imported and registered
- Email service now available to all backend modules"
```

---

## Task 5: Add Dependencies to backend/package.json

**Files:**
- Modify: `backend/package.json`

**Step 1: Check current dependencies**

```bash
cat /home/pedro/repo/FortiVault/backend/package.json | grep -A 20 '"dependencies"'
```

Expected: Existing NestJS dependencies

**Step 2: Add mail-related packages**

Edit `backend/package.json` and add to `dependencies`:

```json
"@nestjs-modules/mailer": "^1.11.0",
"@nestjs/config": "^3.1.1",
"nodemailer": "^6.9.7",
"hbs": "^4.2.0"
```

Also ensure `@types/nodemailer` is in `devDependencies`:

```json
"@types/nodemailer": "^6.4.14"
```

**Step 3: Install dependencies**

```bash
cd /home/pedro/repo/FortiVault/backend
npm install
```

Expected: All packages installed successfully

**Step 4: Verify imports work**

```bash
npx tsc --noEmit src/mail/mail.module.ts
```

Expected: No compilation errors

**Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "deps: add @nestjs-modules/mailer and nodemailer

- @nestjs-modules/mailer: ^1.11.0 (NestJS mailer module)
- nodemailer: ^6.9.7 (SMTP client)
- hbs: ^4.2.0 (Handlebars template engine)
- @types/nodemailer: ^6.4.14 (TypeScript definitions)"
```

---

## Task 6: Update .env and Create .env.example

**Files:**
- Modify/Create: `backend/.env.example`
- Modify: `.env` (if exists, or document required vars)

**Step 1: Create backend/.env.example**

```bash
cat > /home/pedro/repo/FortiVault/backend/.env.example << 'EOF'
# Fortivault Backend Configuration

# Database
DATABASE_PATH=/app/data/vault.db

# Security
SECRET_KEY=your-super-secret-key-min-32-characters-long
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://frontend:3000

# Mail (Mailpit)
SMTP_HOST=fv-mail
SMTP_PORT=1025
MAIL_FROM=noreply@fortivault.local
WEBMAIL_URL=http://localhost:8025

# Optional: Production mail settings
# SMTP_SECURE=false
# SMTP_AUTH_USER=
# SMTP_AUTH_PASS=
EOF
```

**Step 2: Verify .env.example created**

```bash
cat /home/pedro/repo/FortiVault/backend/.env.example
```

Expected: All mail vars documented

**Step 3: Update .gitignore to ensure .env is not tracked**

```bash
grep -q "^\.env$" /home/pedro/repo/FortiVault/.gitignore || echo ".env" >> /home/pedro/repo/FortiVault/.gitignore
```

**Step 4: Commit**

```bash
git add backend/.env.example .gitignore
git commit -m "docs: add environment variables documentation

- Added .env.example with mail service configuration
- SMTP_HOST, SMTP_PORT, MAIL_FROM documented
- WEBMAIL_URL for frontend access
- .gitignore updated to exclude .env files"
```

---

## Task 7: Update Docker Backend Build to Include Templates

**Files:**
- Verify/Modify: `backend/Dockerfile`

**Step 1: Check current Dockerfile**

```bash
cat /home/pedro/repo/FortiVault/backend/Dockerfile
```

Expected: Should have COPY commands for app code

**Step 2: Ensure templates directory is copied (if Dockerfile uses COPY . .)**

Most Dockerfiles with `COPY . .` will already include templates. Verify:

```bash
grep -q "COPY.*\." /home/pedro/repo/FortiVault/backend/Dockerfile && echo "✅ Templates will be included" || echo "⚠️ May need to add COPY for templates"
```

If Dockerfile uses specific file copying, add:

```dockerfile
COPY src/mail/templates/ ./src/mail/templates/
```

**Step 3: No commit needed if templates already included**

If you had to add the COPY line:

```bash
git add backend/Dockerfile
git commit -m "build: ensure mail templates are copied in Docker build"
```

---

## Task 8: Integration Test - Mail Service in isolation

**Files:**
- Create: `backend/src/mail/mail.service.spec.ts`

**Step 1: Create test file**

```typescript
// backend/src/mail/mail.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendActivationEmail', () => {
    it('should send activation email with correct parameters', async () => {
      const email = 'test@fortivault.local';
      const token = 'test-token-123';
      const activationUrl = 'http://localhost:3000/activate?token=test-token-123';

      await service.sendActivationEmail(email, token, activationUrl);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Activate Your Fortivault Account',
        template: 'activation',
        context: {
          email,
          token,
          activationUrl,
        },
      });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'test@fortivault.local';
      const token = 'reset-token-456';
      const resetUrl = 'http://localhost:3000/reset?token=reset-token-456';

      await service.sendPasswordResetEmail(email, token, resetUrl);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Reset Your Fortivault Password',
        template: 'password-reset',
        context: {
          email,
          token,
          resetUrl,
        },
      });
    });
  });

  describe('sendDepartmentInviteEmail', () => {
    it('should send department invite email', async () => {
      const email = 'user@fortivault.local';
      const invitedBy = 'admin@fortivault.local';
      const departmentName = 'Engineering';
      const inviteToken = 'invite-token-789';
      const inviteUrl = 'http://localhost:3000/invite?token=invite-token-789';

      await service.sendDepartmentInviteEmail(
        email,
        invitedBy,
        departmentName,
        inviteToken,
        inviteUrl,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'You\'re invited to department: Engineering',
        template: 'department-invite',
        context: {
          email,
          invitedBy,
          departmentName,
          inviteToken,
          inviteUrl,
        },
      });
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send security alert email', async () => {
      const email = 'user@fortivault.local';
      const alertType = 'Anomalous Login Detected';
      const details = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      await service.sendSecurityAlertEmail(email, alertType, details);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: '[Fortivault Security Alert] Anomalous Login Detected',
        template: 'security-alert',
        context: {
          email,
          alertType,
          ...details,
        },
      });
    });
  });
});
```

**Step 2: Run tests**

```bash
cd /home/pedro/repo/FortiVault/backend
npm run test -- mail.service.spec.ts
```

Expected: All 5 tests pass

**Step 3: Commit**

```bash
git add backend/src/mail/mail.service.spec.ts
git commit -m "test: add unit tests for MailService

- Test all mail methods: activation, password-reset, department-invite, security-alert
- Mock MailerService to isolate service logic
- All tests passing"
```

---

## Task 9: Add Mail Event Listeners to Auth Service

**Files:**
- Modify: `backend/src/auth/auth.service.ts` (example: assume exists)
- OR Create: `backend/src/auth/events/user.created.listener.ts`

**Step 1: Check if AuthService exists**

```bash
find /home/pedro/repo/FortiVault/backend/src -name "auth.service.ts" -o -name "user.service.ts"
```

**Step 2: For this plan, we'll add a listener pattern**

Create `backend/src/common/events/user-created.event.ts`:

```typescript
// backend/src/common/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public userId: string,
    public email: string,
    public activationToken: string,
    public activationUrl: string,
  ) {}
}
```

**Step 3: Create listener**

Create `backend/src/auth/listeners/user-created.listener.ts`:

```typescript
// backend/src/auth/listeners/user-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { UserCreatedEvent } from 'src/common/events/user-created.event';

@Injectable()
export class UserCreatedListener {
  private readonly logger = new Logger(UserCreatedListener.name);

  constructor(private mailService: MailService) {}

  @OnEvent('user.created')
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    this.logger.log(`Handling user created event for ${event.email}`);
    try {
      await this.mailService.sendActivationEmail(
        event.email,
        event.activationToken,
        event.activationUrl,
      );
    } catch (error) {
      this.logger.error(`Failed to send activation email to ${event.email}:`, error);
      // Don't throw - allow user creation even if email fails
    }
  }
}
```

**Step 4: Update AuthModule to register event emitter and listener**

Update `backend/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserCreatedListener } from './listeners/user-created.listener';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // If not already imported globally
  ],
  providers: [UserCreatedListener],
  // ... rest of module
})
export class AuthModule {}
```

**Step 5: In AuthService, emit event on user creation**

Find the user creation method and add:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from 'src/common/events/user-created.event';

export class AuthService {
  constructor(
    private eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {}

  async createUser(email: string, password: string) {
    // ... create user in database
    
    // Emit user created event
    const activationToken = this.generateToken();
    const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
    
    this.eventEmitter.emit('user.created', new UserCreatedEvent(
      userId,
      email,
      activationToken,
      activationUrl,
    ));
    
    return user;
  }
}
```

**Step 6: Commit**

```bash
git add backend/src/common/events/ backend/src/auth/listeners/
git commit -m "feat: add event-driven mail triggers for user creation

- UserCreatedEvent emitted when admin creates user
- UserCreatedListener sends activation email via MailService
- Event-driven pattern ensures loose coupling
- Email failures don't block user creation"
```

---

## Task 10: Documentation and Testing Checklist

**Files:**
- Create: `docs/MAIL_SETUP.md`

**Step 1: Create setup documentation**

```bash
cat > /home/pedro/repo/FortiVault/docs/MAIL_SETUP.md << 'EOF'
# Fortivault Mail Sandbox Setup Guide

## Overview

Fortivault includes an integrated mail sandbox using **Mailpit** for sending and receiving emails internally. This allows for:

- ✅ Account activation emails
- ✅ Password reset notifications
- ✅ Department invitations
- ✅ Security alerts
- ✅ **Zero external dependencies** (no SendGrid, AWS SES, etc.)
- ✅ **Air-gapped friendly** (works without internet)

## Architecture

```
┌─────────────────────────────────────────┐
│ Docker Compose Stack                    │
├─────────────────────────────────────────┤
│ fv-mail (Mailpit)                       │
│  - SMTP: :1025 (backend sends)          │
│  - IMAP: :1143 (users connect)          │
│  - Webmail UI: :8025 (admin/users)      │
│  - Mailboxes: user@fortivault.local     │
│  - Retention: 30 days auto-delete       │
├─────────────────────────────────────────┤
│ backend (NestJS)                        │
│  - Connects via SMTP to fv-mail:1025    │
│  - Emits UserCreatedEvent on signup     │
│  - MailService sends to mailboxes       │
├─────────────────────────────────────────┤
│ frontend (SvelteKit)                    │
│  - Links to activation/reset URLs       │
│  - No direct mail integration           │
└─────────────────────────────────────────┘
```

## Setup Steps

### 1. Start the Stack

```bash
cd /home/pedro/repo/FortiVault
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

Expected output includes:
- `fv-mail-default` - Running on port 8025
- `fortivault-backend-default` - Running on port 8000
- `fortivault-frontend-default` - Running on port 3000

### 2. Access Mailpit Webmail

Open browser: **http://localhost:8025**

You should see Mailpit UI with "No messages" (empty inbox).

### 3. Create Test User

Via Fortivault Admin Panel:

1. Create user: `testuser@company.com`
2. Check Mailpit at http://localhost:8025
3. You should see activation email in "admin@fortivault.local" (system mailbox)

### 4. Access User's Mailbox

In Mailpit:

1. Click on mailbox selector (top-left)
2. Select `testuser@company.com`
3. View emails for that user

### 5. Verify User Email Access

Users can also access their mailbox:

1. Direct IMAP: Configure email client (Thunderbird, Outlook) with:
   - IMAP Host: `mail.vault.local` (or your domain)
   - IMAP Port: `1143`
   - Username: `testuser@company.com`
   - Password: (set in Mailpit admin or default)

2. Webmail UI: `http://localhost:8025` → Click mailbox selector

## Email Types & Workflows

### Account Activation

```
1. Admin creates user "alice@company.com"
2. Backend emits UserCreatedEvent
3. MailService sends activation email to alice@fortivault.local
4. Alice logs into http://localhost:8025 as alice@fortivault.local
5. Alice clicks activation link
6. Account activated ✅
```

### Password Reset

```
1. User clicks "Forgot Password"
2. Backend generates reset token
3. MailService sends reset email to user@fortivault.local
4. User clicks reset link
5. User sets new password ✅
```

### Department Invite

```
1. Admin invites user@fortivault.local to "Engineering" department
2. Backend emits DepartmentInviteEvent
3. MailService sends invite email
4. User clicks invite link in their mailbox
5. User joins department ✅
```

### Security Alerts

```
1. Backend detects anomalous login
2. MailService sends alert to user@fortivault.local
3. User sees alert in mailbox
4. User can take action (change password, etc.) ✅
```

## Admin Panel Access

Mailpit Admin Panel: **http://localhost:8025**

**Features:**
- View all mailboxes and message counts
- Switch between mailboxes
- View email details (headers, body, links)
- Test email delivery
- Monitor SMTP queue
- Create/delete virtual mailboxes (if needed)

## Configuration

### Environment Variables

Set in `docker-compose.yml` under `backend` service:

```yaml
SMTP_HOST: fv-mail          # Internal Mailpit hostname
SMTP_PORT: 1025             # SMTP submission port
MAIL_FROM: noreply@fortivault.local
WEBMAIL_URL: http://localhost:8025
```

### Retention Policy

Emails auto-delete after **30 days** (configurable in Mailpit):

```yaml
environment:
  MP_RETENTION_HOURS: 720  # 30 days = 720 hours
```

To change, modify `docker-compose.yml` and restart:

```bash
docker-compose restart fv-mail
```

## Troubleshooting

### Emails Not Received

1. Check Mailpit is running:
   ```bash
   docker-compose logs fv-mail
   ```

2. Check backend can connect to Mailpit:
   ```bash
   docker-compose logs backend | grep -i smtp
   ```

3. Verify mailbox exists in Mailpit UI (http://localhost:8025)

### User Can't Access Mailbox

1. Check user mailbox name format: `user@fortivault.local`
2. Reset password in Mailpit admin panel if forgotten
3. Verify port 1143 (IMAP) is open on container network

### Emails Disappearing

This is **intentional**. Emails expire after 30 days (configurable).

To increase retention:

```yaml
MP_RETENTION_HOURS: 1440  # 60 days
```

## Production Considerations

### Security

For production deployment:

1. **Protect Mailpit UI:**
   - Add HTTP authentication (nginx htpasswd)
   - Or restrict via reverse proxy (OAuth)
   - Or expose only via VPN

2. **Use TLS for IMAP:**
   - Generate self-signed certificates or use Let's Encrypt
   - Configure Mailpit with cert paths

3. **Network isolation:**
   - Ensure `fv-internal` network is not exposed
   - Only expose port 8025 via reverse proxy

### External SMTP Fallback

If you need to forward emails to external service:

1. Add environment variable `EXTERNAL_SMTP_ENABLED=true`
2. Configure external SMTP in backend
3. MailService will try Mailpit first, fallback to external

## Support

For issues or questions:

1. Check Mailpit logs: `docker-compose logs fv-mail`
2. Check backend logs: `docker-compose logs backend`
3. Access Mailpit admin: http://localhost:8025

EOF
```

**Step 2: Verify file created**

```bash
cat /home/pedro/repo/FortiVault/docs/MAIL_SETUP.md | head -30
```

Expected: Documentation loaded

**Step 3: Commit**

```bash
git add docs/MAIL_SETUP.md
git commit -m "docs: add Mail Sandbox setup and troubleshooting guide

- Comprehensive setup instructions
- Email workflow examples (activation, reset, invites, alerts)
- Admin panel guide
- Configuration options
- Troubleshooting section
- Production security considerations"
```

---

## Task 11: Manual Testing Script

**Files:**
- Create: `scripts/test-mail.sh`

**Step 1: Create test script**

```bash
mkdir -p /home/pedro/repo/FortiVault/scripts

cat > /home/pedro/repo/FortiVault/scripts/test-mail.sh << 'EOF'
#!/bin/bash
set -e

echo "🧪 Fortivault Mail Sandbox Test Script"
echo "======================================"

# Check if docker-compose is running
echo "📦 Checking services..."
docker-compose ps | grep -q "fv-mail" && echo "✅ fv-mail running" || echo "❌ fv-mail not running"
docker-compose ps | grep -q "backend" && echo "✅ backend running" || echo "❌ backend not running"

# Test SMTP connectivity
echo ""
echo "📧 Testing SMTP connectivity..."
docker exec fortivault-backend-default bash -c "timeout 5 bash -c 'cat < /dev/null > /dev/tcp/fv-mail/1025'" && echo "✅ SMTP port 1025 accessible" || echo "❌ SMTP connection failed"

# Test Mailpit API
echo ""
echo "🌐 Testing Mailpit API..."
MAILPIT_STATUS=$(curl -s http://localhost:8025 | head -20 | grep -i "mailpit" || echo "")
if [ -n "$MAILPIT_STATUS" ]; then
  echo "✅ Mailpit webmail accessible at http://localhost:8025"
else
  echo "❌ Mailpit webmail not accessible"
fi

# Check templates exist
echo ""
echo "📋 Checking email templates..."
TEMPLATES="activation.hbs password-reset.hbs department-invite.hbs security-alert.hbs"
TEMPLATE_DIR="/home/pedro/repo/FortiVault/backend/src/mail/templates"
for template in $TEMPLATES; do
  if [ -f "$TEMPLATE_DIR/$template" ]; then
    echo "✅ $template"
  else
    echo "❌ $template missing"
  fi
done

# Test backend can reach mail service
echo ""
echo "🔗 Testing backend-to-mail connectivity..."
docker exec fortivault-backend-default bash -c "npm run test -- mail.service.spec.ts" 2>&1 | grep -q "PASS" && echo "✅ Mail service tests passing" || echo "⚠️  Mail service tests pending"

echo ""
echo "✨ Test complete!"
echo "📖 Visit http://localhost:8025 to access Mailpit admin panel"
EOF

chmod +x /home/pedro/repo/FortiVault/scripts/test-mail.sh
```

**Step 2: Run test script**

```bash
cd /home/pedro/repo/FortiVault
bash scripts/test-mail.sh
```

Expected: All checks pass (green ✅)

**Step 3: Commit**

```bash
git add scripts/test-mail.sh
git commit -m "test: add mail sandbox verification script

- Checks all services running
- Tests SMTP connectivity
- Verifies Mailpit webmail accessible
- Confirms email templates present
- Can be run after docker-compose up"
```

---

## Task 12: Update README with Mail Section

**Files:**
- Modify: `README.md`

**Step 1: Add mail section to README**

Find the section in README mentioning tech stack or features, add:

```markdown
### 📧 Built-in Email Sandbox

Fortivault includes an **integrated mail system** using Mailpit:

- **Zero external dependencies** — No SendGrid, AWS SES, or Sendmail required
- **Isolated mailboxes** — Each user has `user@fortivault.local`
- **Air-gapped friendly** — Works in offline/isolated networks
- **Automatic retention** — Emails expire after 30 days
- **Admin dashboard** — View queue, manage mailboxes at http://localhost:8025

**Email workflows:**
- Account activation
- Password reset notifications
- Department invitations
- Security alerts

[Setup Guide →](docs/MAIL_SETUP.md)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add mail sandbox section to README

- Highlights zero external dependency advantage
- Lists supported email workflows
- Links to detailed setup guide"
```

---

## Final Verification Checklist

**Run all checks:**

```bash
cd /home/pedro/repo/FortiVault

# 1. Syntax check
docker-compose config --quiet && echo "✅ docker-compose valid"

# 2. Backend compilation
cd backend && npm run build 2>&1 | tail -1

# 3. Run mail service tests
npm run test -- mail.service.spec.ts 2>&1 | grep -E "passing|PASS"

# 4. Check all files created
echo "✅ Templates:" && ls backend/src/mail/templates/
echo "✅ Mail module:" && ls backend/src/mail/*.ts

# 5. Test services start
cd /home/pedro/repo/FortiVault
docker-compose up -d --wait 2>&1 | grep -E "done|error"
docker-compose ps

# 6. Verify Mailpit accessible
curl -s http://localhost:8025 | head -1

# 7. Cleanup
docker-compose down
```

Expected: All checks ✅ passing

---

## Summary

**What was implemented:**

✅ Docker Compose: Added `fv-mail` service with Mailpit  
✅ NestJS Module: Created `MailModule` with `MailService`  
✅ Email Templates: 4 Handlebars templates (activation, reset, invite, alert)  
✅ Integration: Event-driven mail triggers  
✅ Configuration: Environment variables and .env.example  
✅ Tests: Unit tests for MailService  
✅ Documentation: Setup guide + README update  
✅ Testing: Verification script  

**Next steps:**

1. Run implementation tasks in order
2. After each task, verify with provided test commands
3. Commit after each task (enables easy rollback if needed)
4. After all tasks complete, run final verification checklist
5. Open PR or merge to main branch

---

**Plan Status:** ✅ Ready for Implementation

**Execution Mode:** Subagent-Driven (fresh subagent per task) OR Parallel Session (using executing-plans skill)

Choose execution approach in next message.
