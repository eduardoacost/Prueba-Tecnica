'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('dr@test.com');
  const [password, setPassword] = useState('dr123');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      setSession(response.data);

      const role = response.data.user.role;

      toast.success('Sesión iniciada');

      if (role === 'admin') router.push('/admin');
      if (role === 'doctor') router.push('/doctor/prescriptions');
      if (role === 'patient') router.push('/patient/prescriptions');
    } catch {
      toast.error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Prueba Tecnica
            </p>
            <h1 className="mt-4 text-4xl font-black">
              Prescripciones
            </h1>
            <p className="mt-4 text-slate-300">
              Roles, JWT, RBAC, PDF, métricas, paginación y UI responsive con TailwindCSS.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
            Usuarios demo:
            <br />
            admin@test.com / admin123
            <br />
            dr@test.com / dr123
            <br />
            patient@test.com / patient123
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa con una cuenta de prueba.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="label">Email</label>
              <input
                className="input"
                value={email}
                onChange={event => setEmail(event.target.value)}
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Password</label>
              <input
                className="input"
                value={password}
                onChange={event => setPassword(event.target.value)}
                type="password"
              />
            </div>

            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@test.com');
                setPassword('admin123');
              }}
              className="rounded-xl border p-2 hover:bg-slate-50"
            >
              Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('dr@test.com');
                setPassword('dr123');
              }}
              className="rounded-xl border p-2 hover:bg-slate-50"
            >
              Médico
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('patient@test.com');
                setPassword('patient123');
              }}
              className="rounded-xl border p-2 hover:bg-slate-50"
            >
              Paciente
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}