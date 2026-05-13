import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionStatus, Role } from '../generated/prisma/client';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { EmailService } from '../email/email.service';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly emailService: EmailService,
) {}

  async create(dto: CreatePrescriptionDto, user: any) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!doctor) {
      throw new ForbiddenException('El usuario no tiene perfil de médico');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        code: this.generateCode(),
        notes: dto.notes,
        patientId: patient.id,
        authorId: doctor.id,
        items: {
          create: dto.items,
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        author: {
          include: {
            user: true,
          },
        },
        items: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'prescription_created',
        userId: user.id,
        prescriptionId: prescription.id,
        metadata: {
          code: prescription.code,
        },
      },
    });

    await this.emailService
  .sendPrescriptionCreated({
    to: prescription.patient.user.email,
    patientName: prescription.patient.user.name,
    doctorName: prescription.author.user.name,
    code: prescription.code,
    prescriptionUrl: `${process.env.APP_ORIGIN}/patient/prescriptions/${prescription.id}`,
  })
  .catch(() => undefined);

    return prescription;
  }

  async findAll(query: QueryPrescriptionsDto, user: any) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;
    const order = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.from || query.to) {
      where.createdAt = {};

      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }

      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    if (query.query) {
      where.OR = [
        {
          notes: {
            contains: query.query,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: query.query,
            mode: 'insensitive',
          },
        },
        {
          items: {
            some: {
              name: {
                contains: query.query,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    if (user.role === Role.doctor) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      });

      where.authorId = doctor?.id || '__none__';
    }

    if (user.role === Role.patient) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      where.patientId = patient?.id || '__none__';
    }

    if (user.role === Role.admin) {
      if (query.doctorId) where.authorId = query.doctorId;
      if (query.patientId) where.patientId = query.patientId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: order,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          items: true,
        },
      }),
      this.prisma.prescription.count({ where }),
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

  async findOne(id: string, user: any) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        author: {
          include: {
            user: true,
          },
        },
        items: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada');
    }

    await this.assertAccess(prescription, user);

    return prescription;
  }

  async consume(id: string, user: any) {
    const prescription = await this.findOne(id, user);

    if (user.role !== Role.patient) {
      throw new ForbiddenException('Solo el paciente puede consumir la prescripción');
    }

    if (prescription.status === PrescriptionStatus.consumed) {
      return prescription;
    }

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.consumed,
        consumedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        author: {
          include: {
            user: true,
          },
        },
        items: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'prescription_consumed',
        userId: user.id,
        prescriptionId: id,
        metadata: {
          consumedAt: updated.consumedAt,
        },
      },
    });

    return updated;
  }

  async generatePdf(id: string, user: any): Promise<Buffer> {
    const prescription = await this.findOne(id, user);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));

    const qrUrl = `${process.env.APP_ORIGIN}/patient/prescriptions/${prescription.id}`;
    const qr = await QRCode.toDataURL(qrUrl);

    doc.fontSize(20).text('Prescripción médica', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).text(`Código: ${prescription.code}`);
    doc.text(`Estado: ${prescription.status}`);
    doc.text(`Fecha: ${prescription.createdAt.toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Paciente');
    doc.fontSize(11).text(`Nombre: ${prescription.patient.user.name}`);
    doc.text(`Email: ${prescription.patient.user.email}`);
    doc.moveDown();

    doc.fontSize(14).text('Médico');
    doc.fontSize(11).text(`Nombre: ${prescription.author.user.name}`);
    doc.text(`Email: ${prescription.author.user.email}`);

    if (prescription.author.license) {
      doc.text(`Cédula/Firma: ${prescription.author.license}`);
    }

    doc.moveDown();

    doc.fontSize(14).text('Ítems');
    doc.moveDown(0.5);

    prescription.items.forEach((item, index) => {
      doc.fontSize(11).text(`${index + 1}. ${item.name}`);
      if (item.dosage) doc.text(`   Dosis: ${item.dosage}`);
      if (item.quantity) doc.text(`   Cantidad: ${item.quantity}`);
      if (item.instructions) doc.text(`   Indicaciones: ${item.instructions}`);
      doc.moveDown(0.5);
    });

    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(14).text('Notas');
      doc.fontSize(11).text(prescription.notes);
    }

    doc.moveDown();
    doc.fontSize(10).text('QR de consulta');
    doc.image(qr, {
      fit: [120, 120],
    });

    doc.end();

    return new Promise(resolve => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  private async assertAccess(prescription: any, user: any) {
    if (user.role === Role.admin) return;

    if (user.role === Role.doctor) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      });

      if (doctor?.id !== prescription.authorId) {
        throw new ForbiddenException('No puedes acceder a esta prescripción');
      }
    }

    if (user.role === Role.patient) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      if (patient?.id !== prescription.patientId) {
        throw new ForbiddenException('No puedes acceder a esta prescripción');
      }
    }
  }

  private generateCode() {
    return `RX-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  }
}