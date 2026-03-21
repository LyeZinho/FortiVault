# 🏗️ Fortivault Mail Sandbox — Design Document

**Date:** 2026-03-21  
**Status:** Approved  
**Scope:** Internal email infrastructure for Fortivault using Mailpit with isolated mailboxes

---

## 📋 Executive Summary

Instead of integrating external SMTP providers (SendGrid, AWS SES) with complex configuration and potential firewall blocking, Fortivault deploys its own **internal mail sandbox** using **Mailpit**.

**Core Promise:** Deploy in 2 minutes, zero external configuration, emails working immediately.

**Key Constraint:** Only publicly-facing component (Webmail UI) is exposed externally. All backend communication stays within container network.

---

## 🎯 Requirements

### Functional Requirements (FRs)

- **FR-MAIL-01:** Backend (NestJS) can send emails to internal mail system
- **FR-MAIL-02:** Each user has isolated mailbox (`user@fortivault.local`)
- **FR-MAIL-03:** Emails expire after 30 days (via automatic retention policy)
- **FR-MAIL-04:** Users can access their emails via Webmail UI or IMAP client
- **FR-MAIL-05:** Admin can manage email users and view sending queue via Mailpit panel
- **FR-MAIL-06:** System supports: account activation, password resets, department invites, security alerts

### Non-Functional Requirements (NFRs)

- **NFR-MAIL-01:** Air-gapped friendly (works without external internet)
- **NFR-MAIL-02:** Zero dependency on commercial email services
- **NFR-MAIL-03:** Internal network isolation (SMTP, IMAP on `fv-internal` network only)
- **NFR-MAIL-04:** Security: only Webmail UI exposed publicly; backend SMTP/IMAP remain internal
- **NFR-MAIL-05:** Automatic cleanup (emails expire per retention policy)

---

## 🏗️ Architecture

### Container Structure

```yaml
services:
  fv-mail:
    image: axllent/mailpit:latest
    container_name: fv-mail-${INSTANCE_ID}
    networks:
      - fv-internal              # Internal network only
    environment:
      MP_MAX_MESSAGES: 500       # Max emails in database
      MP_RETENTION_HOURS: 720    # 30-day retention
      MP_DATABASE: /data/mailpit.db
    volumes:
      - fv-mail-data:/data       # Persistent storage
    ports:
      - "1025:1025"              # SMTP (backend sends here, internal only)
      - "1143:1143"              # IMAP (users access, internal only)
      - "8025:8025"              # Webmail UI (ONLY this exposed publicly)

  fv-api:
    # Existing backend service
    environment:
      SMTP_HOST: fv-mail         # Internal DNS name
      SMTP_PORT: 1025            # Standard SMTP submission port
      MAIL_FROM: noreply@fortivault.local
      WEBMAIL_URL: https://mail.${DOMAIN}  # Public URL for users to access

volumes:
  fv-mail-data:

networks:
  fv-internal:
    driver: bridge
    internal: true               # Prevents external access to internal network
```

### Port Mapping Strategy

| Port | Service | Access Level | Used By |
|------|---------|--------------|---------|
| 1025 | SMTP | Internal Only | Backend (NestJS) |
| 1143 | IMAP | Internal Only | Email clients (if IMAP-only deployment) |
| 8025 | Webmail UI | **PUBLIC** | Admin + Users (via reverse proxy) |

**Critical:** Only port 8025 should be exposed via nginx/Coolify proxy. Ports 1025 and 1143 remain on `fv-internal` network.

---

## 🔄 Data Flow

### Scenario 1: Admin Creates User → Email Activation

```
1. Admin creates user "alice" in Fortivault UI
2. Backend receives CreateUser event:
   - Generates activation token (JWT, 24h validity)
   - Sends email via SMTP to fv-mail:1025:
     TO: alice@fortivault.local
     FROM: noreply@fortivault.local
     SUBJECT: Activate Your Fortivault Account
     BODY: Click link with token
3. Mailpit receives SMTP:
   - Creates virtual mailbox "alice@fortivault.local"
   - Stores email
   - Sets retention: 720 hours (30 days)
4. Alice accesses mail.vault.com (Webmail):
   - Logs in as alice@fortivault.local
   - Sees activation email
   - Clicks activation link, token validated
   - Account activated in Fortivault ✅
5. After 30 days:
   - Email expires, deleted automatically
   - Mailbox persists for future emails
```

### Scenario 2: Security Alert

```
Backend detects anomalous login attempt:
1. Sends email to user's mailbox via SMTP
2. User receives alert notification
3. Can respond or investigate
```

---

## 🔐 Security Model

### Network Isolation

- **`fv-internal` network:** Backend ↔ Mailpit (isolated, no external access)
- **Public exposure:** Only Webmail UI (port 8025) exposed via nginx reverse proxy
- **SMTP/IMAP:** Never exposed externally

### Authentication & Authorization

| Component | Auth Method | Details |
|-----------|------------|---------|
| **Webmail UI** | HTTP Basic Auth (Mailpit) | Optional, add via nginx proxy if needed |
| **IMAP Access** | Mailbox credentials | Each user has unique password (managed by Mailpit) |
| **Backend SMTP** | None (internal network) | Trusted because isolated on `fv-internal` |

### Data Privacy

- Each user's mailbox is isolated (IMAP enforces per-mailbox access)
- Admin has full visibility (intended, for debugging + management)
- Emails are encrypted at rest in Mailpit database
- No emails leave the container system (air-gapped friendly)

### Credential Management

- Email credentials (username/password) are **separate** from Fortivault account credentials
- Admin can reset email passwords via Mailpit UI if needed
- No credential sharing between systems (security by isolation)

---

## 📧 Email Types & Flows

### Supported Email Categories

1. **Account Management**
   - Activation email (new user signup)
   - Password reset
   - Email verification

2. **Collaboration**
   - Department invite
   - Vault share notification
   - Role assignment

3. **Security Alerts**
   - Anomalous login detected
   - Failed authentication attempts (threshold)
   - Permission changes

4. **System Notifications**
   - Audit log exports
   - Backup completion
   - Health status

---

## 🛠️ Backend Integration (NestJS)

### Dependencies

```json
{
  "@nestjs/mailer": "^1.11.0",
  "nodemailer": "^6.9.0",
  "@types/nodemailer": "^6.4.0"
}
```

### Module Structure

```
backend/
├── src/
│   ├── mail/
│   │   ├── mail.module.ts         # Module definition
│   │   ├── mail.service.ts        # Email sending logic
│   │   ├── dto/
│   │   │   └── send-email.dto.ts
│   │   └── templates/
│   │       ├── activation.html
│   │       ├── reset-password.html
│   │       ├── department-invite.html
│   │       └── security-alert.html
│   ├── auth/
│   │   └── auth.service.ts        # Triggers MailService on events
│   └── app.module.ts              # Imports MailModule
```

### Configuration

```typescript
// mail.module.ts
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'fv-mail',
        port: parseInt(process.env.SMTP_PORT) || 1025,
        secure: false,                         // HTTP (internal, no TLS needed)
        auth: null,                            // No auth (trusted internal network)
      },
      defaults: {
        from: process.env.MAIL_FROM || 'noreply@fortivault.local',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

### Email Service

```typescript
// mail.service.ts
@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendActivationEmail(email: string, token: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Activate Your Fortivault Account',
      template: 'activation',
      context: { token, activationUrl: `${process.env.ACTIVATION_URL}?token=${token}` },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Similar pattern
  }

  async sendDepartmentInvite(email: string, deptName: string, inviteToken: string): Promise<void> {
    // Similar pattern
  }

  async sendSecurityAlert(email: string, alertType: string, details: Record<string, any>): Promise<void> {
    // Similar pattern
  }
}
```

---

## 👨‍💼 Admin Management

### Mailpit Admin Panel

Admin accesses `https://mail.vault.meudominio.com` to:

- View all mailboxes and message counts
- Monitor sending queue
- Test email delivery
- View email details (headers, body, attachments)
- Manually create/delete mailboxes (if needed)
- Reset mailbox passwords

### User Management Flow

**Preferred:** Backend automatically creates mailbox when user is created in Fortivault.

**Fallback:** Admin can manually create mailboxes via Mailpit UI.

---

## 📊 Deployment Checklist

- [ ] Add `fv-mail` service to docker-compose.yml
- [ ] Set environment variables (SMTP_HOST, MAIL_FROM, WEBMAIL_URL)
- [ ] Configure nginx to proxy port 8025 → `mail.vault.${DOMAIN}` (HTTPS)
- [ ] Restrict SMTP/IMAP ports to `fv-internal` network only
- [ ] Add `MailModule` to NestJS backend
- [ ] Create email templates (HTML templates for each email type)
- [ ] Add event listeners in Auth/User services to trigger MailService
- [ ] Test: Create user → Verify activation email received → Complete activation
- [ ] Document Mailpit credentials in admin guide

---

## 🔮 Future Enhancements (Out of Scope)

- Email forwarding to external SMTP (conditional, if user sets up)
- Email templates as user-configurable
- Rate limiting on email sends (prevent spam)
- Webhook integration (on email open, click, etc.)
- S3/cloud backup of mail database
- Multi-language email templates

---

## ✅ Success Criteria

1. ✅ Docker-compose starts with `fv-mail` service, no manual setup required
2. ✅ Admin can create user → User receives activation email
3. ✅ User can access `mail.vault.com` → View and interact with emails
4. ✅ SMTP/IMAP ports are internal only (no external exposure)
5. ✅ Emails expire after 30 days automatically
6. ✅ System works in air-gapped environments
7. ✅ No external email service required

---

## 📝 Approval Sign-Off

- **Designed by:** Sisyphus (AI Agent)
- **Approved by:** User (2026-03-21)
- **Constraint:** Only Webmail UI exposed publicly; backend communication internal
- **Next Step:** Invoke writing-plans skill for implementation plan
