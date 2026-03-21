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
