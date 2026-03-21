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
            secure: false,
            auth: null,
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
