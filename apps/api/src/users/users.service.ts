import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findAll() {
    // TODO: Return users from database
    return [];
  }

  async invite(email: string, groups: string[]) {
    // Create invitation - user will generate keys locally
    // TODO: Create invitation record in database
    return { email, status: 'PENDING_KEY_EXCHANGE', groups };
  }

  async deactivate(userId: string) {
    // TODO: Deactivate user and revoke all sessions
  }
}
