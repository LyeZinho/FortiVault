"""
Tests for mail module - SMTP integration
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from mail import MailService, MailConfig


class TestMailConfig:
    """Test mail configuration"""
    
    def test_config_defaults(self):
        """Test default configuration"""
        config = MailConfig()
        assert config.smtp_host == "fv-mail"
        assert config.smtp_port == 1025
        assert config.mail_from == "noreply@fortivault.local"
        assert config.webmail_url == "http://localhost:8025"


class TestMailService:
    """Test mail service"""
    
    def test_activation_email_send(self):
        """Test sending activation email"""
        service = MailService()
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = service.send_activation_email(
                "user@example.com",
                "token123",
                "http://localhost:3000/activate?token=token123"
            )
            
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_password_reset_email_send(self):
        """Test sending password reset email"""
        service = MailService()
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = service.send_password_reset_email(
                "user@example.com",
                "reset_token",
                "http://localhost:3000/reset?token=reset_token"
            )
            
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_department_invite_email_send(self):
        """Test sending department invite email"""
        service = MailService()
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = service.send_department_invite_email(
                "user@example.com",
                "admin@fortivault.local",
                "Engineering",
                "invite_token",
                "http://localhost:3000/invite?token=invite_token"
            )
            
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_security_alert_email_send(self):
        """Test sending security alert email"""
        service = MailService()
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = service.send_security_alert_email(
                "user@example.com",
                "Unauthorized Login Attempt",
                {"IP": "192.168.1.1", "Time": "2024-03-21 16:30", "Location": "Unknown"}
            )
            
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_smtp_connection_failure(self):
        """Test handling SMTP connection failure"""
        service = MailService()
        with patch('smtplib.SMTP') as mock_smtp:
            mock_smtp.side_effect = Exception("Connection refused")
            
            result = service.send_activation_email(
                "user@example.com",
                "token",
                "http://localhost:3000/activate"
            )
            
            assert result is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
