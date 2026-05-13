'use client';

import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    LineChart,
} from 'recharts';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Metrics = {
    totals: {
        doctors: number;
        patients: number;
        prescriptions: number;
    };
    byStatus: Record<string, number>;
    byDay: {
        date: string;
        count: number;
    }[];
    topDoctors: {
        authorId: string;
        _count: {
            id: number;
        };
    }[];
};

export default function AdminPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const accessToken = useAuthStore(state => state.accessToken);

    async function load() {
        try {
            const response = await api.get('/admin/metrics', {
                params: {
                    from: from || undefined,
                    to: to || undefined,
                },
            });

            setMetrics(response.data);
        } catch {
            toast.error('No se pudieron cargar las métricas');
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!accessToken) return;

        const params = new URLSearchParams({
            token: accessToken,
        });

        if (from) params.set('from', from);
        if (to) params.set('to', to);

        const eventSource = new EventSource(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/metrics/live?${params.toString()}`,
        );

        eventSource.onmessage = event => {
            const data = JSON.parse(event.data);
            setMetrics(data);
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [accessToken, from, to]);

    const statusData = metrics
        ? Object.entries(metrics.byStatus).map(([name, value]) => ({
            name,
            value,
        }))
        : [];

    return (
        <ProtectedLayout>
            <main className="page">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="page-title">Dashboard admin</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Métricas generales, por estado y por día.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <input
                            className="input"
                            type="date"
                            value={from}
                            onChange={event => setFrom(event.target.value)}
                        />

                        <input
                            className="input"
                            type="date"
                            value={to}
                            onChange={event => setTo(event.target.value)}
                        />

                        <button onClick={load} className="btn-primary">
                            Filtrar
                        </button>
                    </div>
                </div>

                {!metrics && <div className="card mt-6">Cargando...</div>}

                {metrics && (
                    <>
                        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="card">
                                <p className="text-sm text-slate-500">Médicos</p>
                                <p className="mt-2 text-3xl font-black">
                                    {metrics.totals.doctors}
                                </p>
                            </div>

                            <div className="card">
                                <p className="text-sm text-slate-500">Pacientes</p>
                                <p className="mt-2 text-3xl font-black">
                                    {metrics.totals.patients}
                                </p>
                            </div>

                            <div className="card sm:col-span-2 lg:col-span-1">
                                <p className="text-sm text-slate-500">Prescripciones</p>
                                <p className="mt-2 text-3xl font-black">
                                    {metrics.totals.prescriptions}
                                </p>
                            </div>
                        </section>

                        <section className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="card">
                                <h2 className="font-bold">Por estado</h2>

                                <div className="mt-4 h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="value" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="font-bold">Serie por día</h2>

                                <div className="mt-4 h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metrics.byDay}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </ProtectedLayout>
    );
}