import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; 
import * as bcrypt from 'bcrypt'; 

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('dr123', 10);
  const patientPassword = await bcrypt.hash('patient123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Admin Demo',
      role: Role.admin,
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      password: doctorPassword,
      name: 'Dr. Juan Pérez',
      role: Role.doctor,
      doctor: {
        create: {
          specialty: 'Medicina general',
          license: 'MED-12345',
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password: patientPassword,
      name: 'Paciente Demo',
      role: Role.patient,
      patient: {
        create: {
          birthDate: new Date('1995-05-10'),
        },
      },
    },
    include: {
      patient: true,
    },
  });

  if (!doctorUser.doctor || !patientUser.patient) {
    throw new Error('No se pudieron crear los perfiles doctor/patient');
  }

  for (let i = 1; i <= 8; i++) {
    const consumed = i % 3 === 0;
    const prescription = await prisma.prescription.create({
      data: {
        code: `RX-${Date.now()}-${i}`,
        status: consumed ? 'consumed' : 'pending',
        consumedAt: consumed ? new Date() : null,
        notes: `Prescripción de ejemplo ${i}`,
        patientId: patientUser.patient.id,
        authorId: doctorUser.doctor.id,
        items: {
          create: [
            {
              name: 'Amoxicilina 500mg',
              dosage: '1 cada 8h',
              quantity: 15,
              instructions: 'Después de comer',
            },
            {
              name: 'Ibuprofeno 400mg',
              dosage: '1 cada 12h',
              quantity: 10,
              instructions: 'Si hay dolor',
            },
          ],
        },
      },
    });
    await prisma.auditLog.create({
      data: {
        action: consumed ? 'prescription_consumed' : 'prescription_created',
        userId: doctorUser.id,
        prescriptionId: prescription.id,
        metadata: {
          seed: true,
        },
      },
    });
  }
}
main()
  .then(async () => {
    console.log('Seed ejecutado correctamente');
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });