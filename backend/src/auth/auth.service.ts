import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        name: dto.name,
        role: dto.role,
        doctor:
          dto.role === Role.doctor
            ? {
                create: {
                  specialty: dto.specialty,
                  license: dto.license,
                },
              }
            : undefined,
        patient:
          dto.role === Role.patient
            ? {
                create: {},
              }
            : undefined,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(dto.password, user.password);

    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!user?.refreshToken) {
        throw new UnauthorizedException();
      }

      const validRefresh = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!validRefresh) {
        throw new UnauthorizedException();
      }

      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password, refreshToken, ...safeUser } = user;

    return safeUser;
  }

  private async buildAuthResponse(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessTokenOptions: JwtSignOptions = {
      secret: accessSecret,
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ??
        '15m') as JwtSignOptions['expiresIn'],
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: refreshSecret,
      expiresIn: (this.config.get<string>('JWT_REFRESH_TTL') ??
        '7d') as JwtSignOptions['expiresIn'],
    };

    const accessToken = await this.jwt.signAsync(payload, accessTokenOptions);

    const newRefreshToken = await this.jwt.signAsync(
      payload,
      refreshTokenOptions,
    );

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    const { password, refreshToken, ...safeUser } = user;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: safeUser,
    };
  }
}