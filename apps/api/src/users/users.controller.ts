import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

class InviteUserDto {
  email: string;
  groups?: string[];
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('invite')
  async invite(@Body() dto: InviteUserDto) {
    return this.usersService.invite(dto.email, dto.groups || ['Default']);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
