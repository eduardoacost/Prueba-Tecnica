'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Plus, Trash } from 'lucide-react';
import toast from 'react-hot-toast';

import { ProtectedLayout } from '@/components/ProtectedLayout';
import { api } from '@/lib/api';

type Patient = {
  id: string;
  user: {
    name: string;
    email: string;
  };
};

type ItemForm = {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
};

const initialItem: ItemForm = {
  name: '',
  dosage: '',
  quantity: '',
  instructions: '',
};

export default function NewPrescriptionPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([initialItem]);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  async function loadPatients() {
    try {
      setLoadingPatients(true);

      const response = await api.get('/patients');

      setPatients(response.data);

      if (response.data[0]) {
        setPatientId(response.data[0].id);
      }
    } catch {
      toast.error('No se pudieron cargar los pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }

  function resetForm() {
    setNotes('');
    setItems([initialItem]);

    if (patients[0]) {
      setPatientId(patients[0].id);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems(current =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems(current => [
      ...current,
      {
        name: '',
        dosage: '',
        quantity: '',
        instructions: '',
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!patientId) {
      toast.error('Debes seleccionar un paciente');
      return;
    }

    const validItems = items.filter(item => item.name.trim().length > 0);

    if (validItems.length === 0) {
      toast.error('Debes agregar al menos un ítem');
      return;
    }

    try {
      setCreating(true);
      setSuccessMessage('');

      const response = await api.post('/prescriptions', {
        patientId,
        notes: notes || undefined,
        items: validItems.map(item => ({
          name: item.name.trim(),
          dosage: item.dosage || undefined,
          quantity: item.quantity ? Number(item.quantity) : undefined,
          instructions: item.instructions || undefined,
        })),
      });

      const prescriptionCode = response.data.code;

      setSuccessMessage(
        `La prescripción ${prescriptionCode} fue creada correctamente.`,
      );

      toast.success('Prescripción creada correctamente');

      resetForm();

      window.setTimeout(() => {
        router.push('/doctor/prescriptions');
      }, 1500);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Error creando prescripción',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <ProtectedLayout>
      <main className="page">
        <div>
          <h1 className="page-title">Nueva prescripción</h1>
          <p className="mt-1 text-sm text-slate-500">
            Los ítems se escriben manualmente, sin catálogo de productos.
          </p>
        </div>

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Prescripción creada exitosamente</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {loadingPatients ? (
          <div className="card mt-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              <p className="text-sm text-slate-500">
                Cargando pacientes disponibles...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <section className="card space-y-4">
              <div className="space-y-2">
                <label className="label">Paciente</label>
                <select
                  className="input"
                  value={patientId}
                  onChange={event => setPatientId(event.target.value)}
                  disabled={creating}
                >
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user.name} - {patient.user.email}
                    </option>
                  ))}
                </select>

                {patients.length === 0 && (
                  <p className="text-sm text-red-600">
                    No hay pacientes registrados. Crea uno desde el panel admin.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="label">Notas</label>
                <textarea
                  className="input min-h-28"
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  disabled={creating}
                  placeholder="Notas generales de la prescripción"
                />
              </div>
            </section>

            <section className="card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Ítems</h2>
                  <p className="text-sm text-slate-500">
                    Agrega medicamentos o indicaciones manualmente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={creating}
                >
                  <Plus size={16} className="mr-2" />
                  Agregar
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <label className="label">Nombre</label>
                        <input
                          className="input"
                          placeholder="Amoxicilina 500mg"
                          value={item.name}
                          onChange={event =>
                            updateItem(index, 'name', event.target.value)
                          }
                          disabled={creating}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="label">Dosis</label>
                        <input
                          className="input"
                          placeholder="1 cada 8h"
                          value={item.dosage}
                          onChange={event =>
                            updateItem(index, 'dosage', event.target.value)
                          }
                          disabled={creating}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="label">Cantidad</label>
                        <input
                          className="input"
                          placeholder="15"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={event =>
                            updateItem(index, 'quantity', event.target.value)
                          }
                          disabled={creating}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="label">Indicaciones</label>
                        <input
                          className="input"
                          placeholder="Después de comer"
                          value={item.instructions}
                          onChange={event =>
                            updateItem(
                              index,
                              'instructions',
                              event.target.value,
                            )
                          }
                          disabled={creating}
                        />
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-3 inline-flex items-center text-sm font-medium text-red-600"
                        disabled={creating}
                      >
                        <Trash size={16} className="mr-1" />
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary w-full sm:w-auto"
                disabled={creating}
              >
                Limpiar
              </button>

              <button
                className="btn-primary w-full sm:w-auto"
                disabled={creating || patients.length === 0}
              >
                {creating ? (
                  <span className="inline-flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creando...
                  </span>
                ) : (
                  'Crear prescripción'
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </ProtectedLayout>
  );
}