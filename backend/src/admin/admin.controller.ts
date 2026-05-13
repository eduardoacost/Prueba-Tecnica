import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  metrics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.metrics(from, to);
  }
  @Get('audit-logs')
auditLogs(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.adminService.auditLogs(
    Number(page || 1),
    Number(limit || 20),
  );
}
}