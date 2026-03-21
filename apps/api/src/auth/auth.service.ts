import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../common/events/user-created.event';

@Injectable()
export class AuthService {
  constructor(private eventEmitter: EventEmitter2) {}

  async validateToken(token: string): Promise<{ userId: string; email: string } | null> {
    // TODO: Validate JWT token from Redis/DB
    return null;
  }

  async createSession(userId: string, email: string): Promise<string> {
    // TODO: Create JWT session token stored in Redis
    return 'session-token-placeholder';
  }

  async registerPublicKey(userId: string, publicKey: string): Promise<void> {
    // Store user's public key for encryption
    // TODO: Update user record in database
  }

  async revokeSession(token: string): Promise<void> {
    // TODO: Remove session from Redis
  }

  async emitUserCreatedEvent(
    userId: string,
    email: string,
    activationToken: string,
    activationUrl: string,
  ): Promise<void> {
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(userId, email, activationToken, activationUrl),
    );
  }
}
