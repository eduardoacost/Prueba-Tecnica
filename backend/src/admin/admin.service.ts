import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type StatusRow = {
  status: string;
  count: bigint;
};

type TopDoctorRow = {
  authorId: string;
  count: bigint;
};

type DayRow = {
  date: Date | string;
  count: bigint;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const prescriptionWhere: Prisma.PrescriptionWhereInput = {
      deletedAt: null,
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    const [
      doctors,
      patients,
      prescriptions,
      byStatusRows,
      topDoctorRows,
      byDayRows,
    ] = await Promise.all([
      this.prisma.doctor.count(),

      this.prisma.patient.count(),

      this.prisma.prescription.count({
        where: prescriptionWhere,
      }),

      this.prisma.$queryRaw<StatusRow[]>`
        SELECT "status", COUNT(*) as count
        FROM "Prescription"
        WHERE "deletedAt" IS NULL
        AND (${fromDate}::timestamp IS NULL OR "createdAt" >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR "createdAt" <= ${toDate}::timestamp)
        GROUP BY "status"
        ORDER BY "status" ASC
      `,

      this.prisma.$queryRaw<TopDoctorRow[]>`
        SELECT "authorId", COUNT(*) as count
        FROM "Prescription"
        WHERE "deletedAt" IS NULL
        AND (${fromDate}::timestamp IS NULL OR "createdAt" >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR "createdAt" <= ${toDate}::timestamp)
        GROUP BY "authorId"
        ORDER BY COUNT(*) DESC
        LIMIT 5
      `,

      this.prisma.$queryRaw<DayRow[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "Prescription"
        WHERE "deletedAt" IS NULL
        AND (${fromDate}::timestamp IS NULL OR "createdAt" >= ${fromDate}::timestamp)
        AND (${toDate}::timestamp IS NULL OR "createdAt" <= ${toDate}::timestamp)
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
    ]);

    return {
      totals: {
        doctors,
        patients,
        prescriptions,
      },

      byStatus: byStatusRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),

      byDay: byDayRows.map(row => ({
        date: new Date(row.date).toISOString().slice(0, 10),
        count: Number(row.count),
      })),

      topDoctors: topDoctorRows.map(row => ({
        authorId: row.authorId,
        _count: {
          id: Number(row.count),
        },
      })),
    };
  }

  async auditLogs(page = 1, limit = 20) {
  const safePage = Number(page || 1);
  const safeLimit = Number(limit || 20);
  const skip = (safePage - 1) * safeLimit;

  const [data, total] = await this.prisma.$transaction([
    this.prisma.auditLog.findMany({
      skip,
      take: safeLimit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        prescription: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
      },
    }),

    this.prisma.auditLog.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    },
  };
}
}