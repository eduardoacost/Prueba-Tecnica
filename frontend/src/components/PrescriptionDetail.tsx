'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { api } from '@/lib/api';
import { Prescription } from '@/types';

type Props = {
  backHref: string;
};

export function PrescriptionDetail({ backHref }: Props) {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const response = await api.get(`/prescriptions/${id}`);

      setPrescription(response.data);
    } catch {
      toast.error('No se pudo cargar la prescripción');
      router.push(backHref);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    try {
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescription?.code || id}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el PDF');
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  return (
    <ProtectedLayout>
      <main className="page">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="btn-secondary"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </button>

        {loading && <div className="card mt-6">Cargando...</div>}

        {!loading && prescription && (
          <section className="mt-6 space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="page-title">{prescription.code}</h1>

                    <span
                      className={
                        prescription.status === 'consumed'
                          ? 'badge-consumed'
                          : 'badge-pending'
                      }
                    >
                      {prescription.status === 'consumed'
                        ? 'Consumida'
                        : 'Pendiente'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Fecha:{' '}
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>

                  {prescription.consumedAt && (
                    <p className="text-sm text-slate-500">
                      Consumida:{' '}
                      {new Date(prescription.consumedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={downloadPdf}
                  className="btn-primary"
                >
                  <Download size={16} className="mr-2" />
                  Descargar PDF
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card">
                <h2 className="text-lg font-bold">Paciente</h2>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Nombre: {prescription.patient.user.name}</p>
                  <p>Email: {prescription.patient.user.email}</p>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-bold">Médico</h2>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Nombre: {prescription.author.user.name}</p>
                  <p>Email: {prescription.author.user.email}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold">Ítems</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {prescription.items.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{item.name}</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Dosis: {item.dosage || '-'}
                    </p>

                    <p className="text-sm text-slate-500">
                      Cantidad: {item.quantity || '-'}
                    </p>

                    <p className="text-sm text-slate-500">
                      Indicaciones: {item.instructions || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {prescription.notes && (
              <div className="card">
                <h2 className="text-lg font-bold">Notas</h2>
                <p className="mt-3 text-sm text-slate-600">
                  {prescription.notes}
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </ProtectedLayout>
  );
}