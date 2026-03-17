import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VaultsService } from './vaults.service';

class CreateVaultDto {
  name: string;
  type: 'PERSONAL' | 'DEPARTMENT' | 'SHARED';
}

class AddMemberDto {
  userId: string;
  role: string;
}

@Controller('vaults')
export class VaultsController {
  constructor(private vaultsService: VaultsService) {}

  @Get()
  async findAll() {
    return this.vaultsService.findAllForUser('current-user');
  }

  @Post()
  async create(@Body() dto: CreateVaultDto) {
    return this.vaultsService.create('current-user', dto.name, dto.type);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.vaultsService.addMember(id, dto.userId, dto.role);
  }

  @Post(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.vaultsService.removeMember(id, userId);
  }
}
