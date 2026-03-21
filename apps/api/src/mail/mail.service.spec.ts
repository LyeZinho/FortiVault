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
