'use client';

import Link from 'next/link';
import { Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Prescription } from '@/types';

type Props = {
  prescription: Prescription;
  detailHref: string;
  onConsume?: () => void;
  canConsume?: boolean;
};

export function PrescriptionCard({
  prescription,
  detailHref,
  onConsume,
  canConsume,
}: Props) {
  const statusClass =
    prescription.status === 'consumed' ? 'badge-consumed' : 'badge-pending';

  async function downloadPdf() {
    try {
      const response = await api.get(
        `/prescriptions/${prescription.id}/pdf`,
        {
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescription.code}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el PDF');
    }
  }

  return (
    <article className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{prescription.code}</h3>

            <span className={statusClass}>
              {prescription.status === 'consumed' ? 'Consumida' : 'Pendiente'}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Paciente: {prescription.patient.user.name}
          </p>

          <p className="text-sm text-slate-500">
            Médico: {prescription.author.user.name}
          </p>

          <p className="text-sm text-slate-500">
            Fecha: {new Date(prescription.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={detailHref} className="btn-secondary">
            <Eye size={16} className="mr-2" />
            Ver
          </Link>

          <button type="button" onClick={downloadPdf} className="btn-secondary">
            <Download size={16} className="mr-2" />
            PDF
          </button>

          {canConsume && prescription.status === 'pending' && (
            <button type="button" onClick={onConsume} className="btn-primary">
              Consumir
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {prescription.items.map(item => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-sm font-semibold">{item.name}</p>

            <p className="text-xs text-slate-500">
              {item.dosage || 'Sin dosis'}
            </p>

            <p className="text-xs text-slate-500">
              Cantidad: {item.quantity || '-'}
            </p>

            {item.instructions && (
              <p className="mt-1 text-xs text-slate-500">
                {item.instructions}
              </p>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}