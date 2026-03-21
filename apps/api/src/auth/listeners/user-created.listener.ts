import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../common/events/user-created.event';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class UserCreatedListener {
  private readonly logger = new Logger(UserCreatedListener.name);

  constructor(private mailService: MailService) {}

  @OnEvent('user.created')
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Received user.created event for ${event.email}`);

    try {
      await this.mailService.sendActivationEmail(
        event.email,
        event.activationToken,
        event.activationUrl,
      );
      this.logger.log(`Activation email sent to ${event.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send activation email to ${event.email}:`,
        error,
      );
      // Do not rethrow - event handling should not block other processes
    }
  }
}
