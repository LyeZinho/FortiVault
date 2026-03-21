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
