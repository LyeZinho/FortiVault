import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VaultsModule } from './vaults/vaults.module';
import { SecretsModule } from './secrets/secrets.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
    AuthModule,
    UsersModule,
    VaultsModule,
    SecretsModule,
    AuditModule,
  ],
})
export class AppModule {}
