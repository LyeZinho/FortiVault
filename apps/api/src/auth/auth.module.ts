import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserCreatedListener } from './listeners/user-created.listener';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [EventEmitterModule.forRoot(), MailModule],
  controllers: [AuthController],
  providers: [AuthService, UserCreatedListener],
  exports: [AuthService],
})
export class AuthModule {}
