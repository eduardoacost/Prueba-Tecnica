'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { PrescriptionCard } from '@/components/PrescriptionCard';
import { api } from '@/lib/api';
import { Prescription } from '@/types';

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const response = await api.get('/prescriptions', {
        params: {
          status: status || undefined,
          query: query || undefined,
          page: 1,
          limit: 20,
          order: 'desc',
        },
      });

      setPrescriptions(response.data.data);
    } catch {
      toast.error('No se pudieron cargar las prescripciones');
    } finally {
      setLoading(false);
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
            <h1 className="page-title">Prescripciones del médico</h1>
            <p className="mt-1 text-sm text-slate-500">
              Listado de prescripciones propias con filtros.
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <input
            className="input"
            placeholder="Buscar por código, notas o ítem"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />

          <select
            className="input"
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="consumed">Consumidas</option>
          </select>

          <button onClick={load} className="btn-primary">
            Filtrar
          </button>
        </section>

        <section className="mt-6 space-y-4">
          {loading && <div className="card">Cargando...</div>}

          {!loading && prescriptions.length === 0 && (
            <div className="card">No hay prescripciones.</div>
          )}

          {prescriptions.map(prescription => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              detailHref={`/doctor/prescriptions/${prescription.id}`}
            />
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}