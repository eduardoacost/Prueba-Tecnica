import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';

import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';
import { ConsumePrescriptionDto } from './dto/consume-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(Role.doctor)
  @Post('prescriptions')
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: any) {
    return this.prescriptionsService.create(dto, user);
  }

  @Roles(Role.doctor, Role.admin)
  @Get('prescriptions')
  findAll(@Query() query: QueryPrescriptionsDto, @CurrentUser() user: any) {
    return this.prescriptionsService.findAll(query, user);
  }

  @Roles(Role.patient)
  @Get('me/prescriptions')
  myPrescriptions(
    @Query() query: QueryPrescriptionsDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAll(query, user);
  }

  @Roles(Role.admin)
  @Get('admin/prescriptions')
  adminPrescriptions(
    @Query() query: QueryPrescriptionsDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAll(query, user);
  }

  @Roles(Role.doctor, Role.patient, Role.admin)
  @Get('prescriptions/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user);
  }

  @Roles(Role.patient)
  @Put('prescriptions/:id/consume')
  consume(
    @Param('id') id: string,
    @Body() _: ConsumePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.consume(id, user);
  }

  @Roles(Role.patient, Role.doctor, Role.admin)
  @Get('prescriptions/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const pdf = await this.prescriptionsService.generatePdf(id, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescription-${id}.pdf"`,
    });

    res.send(pdf);
  }
}