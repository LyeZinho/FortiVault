import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SecretsService } from './secrets.service';

class CreateSecretDto {
  vaultId: string;
  type: string;
  title: string;
  encryptedPayload: string;
  metadata?: any;
  tags?: string[];
}

@Controller('secrets')
export class SecretsController {
  constructor(private secretsService: SecretsService) {}

  @Get('vault/:vaultId')
  async findAll(@Param('vaultId') vaultId: string) {
    return this.secretsService.findAllInVault(vaultId);
  }

  @Post()
  async create(@Body() dto: CreateSecretDto) {
    return this.secretsService.create(dto.vaultId, dto.encryptedPayload, dto.metadata);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body('encryptedPayload') encryptedPayload: string) {
    return this.secretsService.update(id, encryptedPayload);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.secretsService.delete(id);
  }
}
