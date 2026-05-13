import {
  Controller,
  MessageEvent,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Observable,
  from as rxFrom,
  map,
  switchMap,
  timer,
} from 'rxjs';

import { AdminService } from './admin.service';
import { Role } from '../generated/prisma/client';

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

@Controller('admin')
export class AdminLiveController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Sse('metrics/live')
  metricsLive(
    @Query('token') token?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    return rxFrom(this.validateAdminToken(token)).pipe(
      switchMap(() => timer(0, 5000)),
      switchMap(() =>
        rxFrom(this.adminService.metrics(fromDate, toDate)),
      ),
      map(data => ({
        data,
      })),
    );
  }

  private async validateAdminToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.role !== Role.admin) {
        throw new UnauthorizedException('Solo admin');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}