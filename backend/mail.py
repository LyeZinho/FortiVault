"""
FortiVault Mail Module - SMTP Integration
Minimal mail support for FastAPI backend, integrating with internal Mailpit
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Any
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape


class MailConfig:
    """Mail configuration from environment"""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "fv-mail")
        self.smtp_port = int(os.getenv("SMTP_PORT", "1025"))
        self.mail_from = os.getenv("MAIL_FROM", "noreply@fortivault.local")
        self.webmail_url = os.getenv("WEBMAIL_URL", "http://localhost:8025")
        self.smtp_secure = os.getenv("SMTP_SECURE", "false").lower() == "true"
        self.smtp_user = os.getenv("SMTP_AUTH_USER", "")
        self.smtp_pass = os.getenv("SMTP_AUTH_PASS", "")


class MailService:
    """Mail service for sending emails via Mailpit"""
    
    def __init__(self):
        self.config = MailConfig()
        self.template_dir = Path(__file__).parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    def _get_template(self, template_name: str) -> str:
        """Load and render template"""
        try:
            template = self.env.get_template(f"{template_name}.html")
            return template.render()
        except Exception as e:
            print(f"Error loading template {template_name}: {e}")
            return ""
    
    def _send_smtp(self, to: str, subject: str, html_content: str, text_content: str = "") -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.config.mail_from
            msg["To"] = to
            
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            if html_content:
                msg.attach(MIMEText(html_content, "html"))
            
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.smtp_secure:
                    server.starttls()
                if self.config.smtp_user and self.config.smtp_pass:
                    server.login(self.config.smtp_user, self.config.smtp_pass)
                server.send_message(msg)
            
            print(f"Email sent to {to}: {subject}")
            return True
        except Exception as e:
            print(f"Failed to send email to {to}: {e}")
            return False
    
    def send_activation_email(self, email: str, token: str, activation_url: str) -> bool:
        """Send account activation email"""
        subject = "Activate Your Fortivault Account"
        html = f"""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h1>Welcome to Fortivault</h1>
                <p>Please activate your account by clicking the link below:</p>
                <p><a href="{activation_url}">Activate Account</a></p>
                <p>This link expires in 24 hours.</p>
                <hr>
                <p><small>Token: {token}</small></p>
            </body>
        </html>
        """
        return self._send_smtp(email, subject, html)
    
    def send_password_reset_email(self, email: str, token: str, reset_url: str) -> bool:
        """Send password reset email"""
        subject = "Reset Your Fortivault Password"
        html = f"""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h1>Password Reset</h1>
                <p>You requested a password reset. Click below to set a new password:</p>
                <p><a href="{reset_url}">Reset Password</a></p>
                <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
                <hr>
                <p><small>Token: {token}</small></p>
            </body>
        </html>
        """
        return self._send_smtp(email, subject, html)
    
    def send_department_invite_email(
        self, 
        email: str, 
        invited_by: str, 
        department_name: str, 
        invite_token: str, 
        invite_url: str
    ) -> bool:
        """Send department invitation email"""
        subject = f"You're invited to department: {department_name}"
        html = f"""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h1>Department Invitation</h1>
                <p><strong>{invited_by}</strong> has invited you to join department <strong>{department_name}</strong></p>
                <p><a href="{invite_url}">Accept Invitation</a></p>
                <p>This invitation expires in 7 days.</p>
                <hr>
                <p><small>Token: {invite_token}</small></p>
            </body>
        </html>
        """
        return self._send_smtp(email, subject, html)
    
    def send_security_alert_email(
        self, 
        email: str, 
        alert_type: str, 
        details: Dict[str, Any]
    ) -> bool:
        """Send security alert email"""
        subject = f"[Fortivault Security Alert] {alert_type}"
        details_html = "".join([
            f"<li><strong>{k}:</strong> {v}</li>" 
            for k, v in details.items()
        ])
        html = f"""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h1>⚠️ Security Alert</h1>
                <p><strong>Alert Type:</strong> {alert_type}</p>
                <ul>{details_html}</ul>
                <p>If this wasn't you, please change your password immediately.</p>
            </body>
        </html>
        """
        return self._send_smtp(email, subject, html)


# Singleton instance
mail_service = MailService()
