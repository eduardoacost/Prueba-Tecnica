import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { Role } from '../generated/prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock: any = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configMock: any = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access_secret',
        JWT_REFRESH_SECRET: 'refresh_secret',
        JWT_ACCESS_TTL: '15m',
        JWT_REFRESH_TTL: '7d',
      };

      return values[key];
    }),

    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access_secret',
        JWT_REFRESH_SECRET: 'refresh_secret',
      };

      return values[key];
    }),
  };

  const bcryptMock = bcrypt as any;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(
      prismaMock,
      jwtMock as JwtService,
      configMock as ConfigService,
    );
  });

  it('debe hacer login correctamente con credenciales válidas', async () => {
    const fakeUser = {
      id: 'user-1',
      email: 'dr@test.com',
      password: 'hashed-password',
      name: 'Dr. Juan Pérez',
      role: Role.doctor,
      deletedAt: null,
      doctor: {
        id: 'doctor-1',
      },
      patient: null,
    };

    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    prismaMock.user.update.mockResolvedValue(fakeUser);

    bcryptMock.compare.mockResolvedValue(true);
    bcryptMock.hash.mockResolvedValue('hashed-refresh');

    jwtMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: 'dr@test.com',
      password: 'dr123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('dr@test.com');
    expect(result.user.password).toBeUndefined();

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'dr@test.com',
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('debe rechazar login con password inválido', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'dr@test.com',
      password: 'hashed-password',
      role: Role.doctor,
      deletedAt: null,
    });

    bcryptMock.compare.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'dr@test.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('debe rechazar login cuando el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@test.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});