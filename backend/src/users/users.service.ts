import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
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
                create: {
                  birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                },
              }
            : undefined,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    const { password: _, refreshToken, ...safeUser } = user;

    return safeUser;
  }

  async findAll(params: {
    role?: Role;
    query?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.role) {
      where.role = params.role;
    }

    if (params.query) {
      where.OR = [
        {
          name: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          doctor: true,
          patient: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async patients() {
    return this.prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });
  }

  async doctors() {
    return this.prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });
  }
}