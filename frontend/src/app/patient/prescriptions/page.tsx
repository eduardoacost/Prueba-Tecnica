'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { PrescriptionCard } from '@/components/PrescriptionCard';
import { api } from '@/lib/api';
import { Prescription } from '@/types';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const response = await api.get('/me/prescriptions', {
        params: {
          status: status || undefined,
          page: 1,
          limit: 20,
        },
      });

      setPrescriptions(response.data.data);
    } catch {
      toast.error('No se pudieron cargar tus prescripciones');
    } finally {
      setLoading(false);
    }
  }

  async function consume(id: string) {
    try {
      await api.put(`/prescriptions/${id}/consume`, {
        consume: true,
      });

      toast.success('Prescripción marcada como consumida');
      load();
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <ProtectedLayout>
      <main className="page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Mis prescripciones</h1>
            <p className="mt-1 text-sm text-slate-500">
              Puedes ver, consumir y descargar tus prescripciones.
            </p>
          </div>

          <select
            className="input sm:max-w-xs"
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="consumed">Consumidas</option>
          </select>
        </div>

        <section className="mt-6 space-y-4">
          {loading && <div className="card">Cargando...</div>}

          {!loading && prescriptions.length === 0 && (
            <div className="card">No tienes prescripciones.</div>
          )}

          {prescriptions.map(prescription => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              detailHref={`/patient/prescriptions/${prescription.id}`}
              canConsume
              onConsume={() => consume(prescription.id)}
            />
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}