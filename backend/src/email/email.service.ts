import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type SendPrescriptionCreatedParams = {
  to: string;
  patientName: string;
  doctorName: string;
  code: string;
  prescriptionUrl: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no configurado. Los emails se mostrarán en logs.',
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPrescriptionCreated(params: SendPrescriptionCreatedParams) {
    const subject = `Nueva prescripción ${params.code}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Nueva prescripción creada</h2>
        <p>Hola ${params.patientName},</p>
        <p>El médico <strong>${params.doctorName}</strong> creó una nueva prescripción para ti.</p>
        <p><strong>Código:</strong> ${params.code}</p>
        <p>
          Puedes verla desde la aplicación:
          <br />
          <a href="${params.prescriptionUrl}">${params.prescriptionUrl}</a>
        </p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`Email simulado para ${params.to}: ${subject}`);
      return;
    }

    await this.transporter.sendMail({
      from:
        this.config.get<string>('SMTP_FROM') ||
        'Prescriptions App <no-reply@test.com>',
      to: params.to,
      subject,
      html,
    });
  }
}