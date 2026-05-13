'use client';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Search, UserPlus } from 'lucide-react';

import { ProtectedLayout } from '@/components/ProtectedLayout';
import { api } from '@/lib/api';
import { Role } from '@/types';

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  doctor?: {
    id: string;
    specialty?: string;
    license?: string;
  } | null;
  patient?: {
    id: string;
    birthDate?: string;
  } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<Role>('patient');

  const [specialty, setSpecialty] = useState('');
  const [license, setLicense] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [createdMessage, setCreatedMessage] = useState('');

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('123456');
    setRole('patient');
    setSpecialty('');
    setLicense('');
    setBirthDate('');
  }

  async function loadUsers() {
    try {
      setLoadingUsers(true);

      const response = await api.get('/users', {
        params: {
          query: query || undefined,
          role: roleFilter || undefined,
          page: 1,
          limit: 50,
        },
      });

      setUsers(response.data.data);
    } catch {
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreatedMessage('');

      const response = await api.post('/users', {
        name,
        email,
        password,
        role,
        specialty: role === 'doctor' ? specialty || undefined : undefined,
        license: role === 'doctor' ? license || undefined : undefined,
        birthDate: role === 'patient' ? birthDate || undefined : undefined,
      });

      const createdUser = response.data;

      const message = `Usuario "${createdUser.name}" creado correctamente con rol ${createdUser.role}.`;

      toast.success('Usuario creado correctamente');
      setCreatedMessage(message);

      resetForm();
      await loadUsers();

      window.setTimeout(() => {
        setCreatedMessage('');
      }, 5000);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'No se pudo crear el usuario',
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <ProtectedLayout>
      <main className="page">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Gestión de usuarios</h1>
          <p className="text-sm text-slate-500">
            Panel admin para crear médicos, pacientes y administradores.
          </p>
        </div>

        {createdMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Usuario creado exitosamente</p>
              <p className="text-sm">{createdMessage}</p>
            </div>
          </div>
        )}

        <section className="mt-6 grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3">
                <UserPlus size={22} className="text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-bold">Crear usuario</h2>
                <p className="mt-1 text-sm text-slate-500">
                  El usuario podrá iniciar sesión inmediatamente.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Ej: María Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label">Email</label>
                <input
                  className="input"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="usuario@test.com"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label">Password</label>
                <input
                  className="input"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  type="text"
                  minLength={3}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                <label className="label">Rol</label>
                <select
                  className="input"
                  value={role}
                  onChange={event => setRole(event.target.value as Role)}
                >
                  <option value="patient">Paciente</option>
                  <option value="doctor">Médico</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {role === 'doctor' && (
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="label">Especialidad</label>
                  <input
                    className="input"
                    value={specialty}
                    onChange={event => setSpecialty(event.target.value)}
                    placeholder="Medicina general"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label">Cédula/Licencia</label>
                  <input
                    className="input"
                    value={license}
                    onChange={event => setLicense(event.target.value)}
                    placeholder="MED-12345"
                  />
                </div>
              </div>
            )}

            {role === 'patient' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="label">Fecha de nacimiento</label>
                  <input
                    className="input"
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                    type="date"
                  />
                </div>
              </div>
            )}

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
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>

          <section className="space-y-4">
            <div className="card">
              <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="input pl-9"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Buscar por nombre o email"
                  />
                </div>

                <select
                  className="input"
                  value={roleFilter}
                  onChange={event => setRoleFilter(event.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Médico</option>
                  <option value="patient">Paciente</option>
                </select>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="btn-secondary w-full md:w-auto"
                >
                  Filtrar
                </button>
              </div>
            </div>

            <div className="card">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold">Usuarios registrados</h2>
                <span className="text-sm text-slate-500">
                  {users.length} registros
                </span>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {loadingUsers && (
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                    Cargando...
                  </div>
                )}

                {!loadingUsers &&
                  users.map(user => (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="mt-1 break-all text-sm text-slate-500">
                            {user.email}
                          </p>
                        </div>

                        <span className="badge bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1 text-sm text-slate-500">
                        <p>
                          Perfil:{' '}
                          {user.role === 'doctor'
                            ? user.doctor?.specialty || 'Médico'
                            : user.role === 'patient'
                              ? 'Paciente'
                              : 'Administrador'}
                        </p>
                        <p>
                          Creado:{' '}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </article>
                  ))}

                {!loadingUsers && users.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                    No hay usuarios.
                  </div>
                )}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 pr-4 font-medium">Nombre</th>
                      <th className="py-3 pr-4 font-medium">Email</th>
                      <th className="py-3 pr-4 font-medium">Rol</th>
                      <th className="py-3 pr-4 font-medium">Perfil</th>
                      <th className="py-3 pr-4 font-medium">Creado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingUsers && (
                      <tr>
                        <td className="py-4 text-slate-500" colSpan={5}>
                          Cargando...
                        </td>
                      </tr>
                    )}

                    {!loadingUsers &&
                      users.map(user => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {user.name}
                          </td>

                          <td className="py-3 pr-4 text-slate-500">
                            {user.email}
                          </td>

                          <td className="py-3 pr-4">
                            <span className="badge bg-slate-100 text-slate-700">
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 pr-4 text-slate-500">
                            {user.role === 'doctor'
                              ? user.doctor?.specialty || 'Médico'
                              : user.role === 'patient'
                                ? 'Paciente'
                                : 'Administrador'}
                          </td>

                          <td className="py-3 pr-4 text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}

                    {!loadingUsers && users.length === 0 && (
                      <tr>
                        <td className="py-4 text-slate-500" colSpan={5}>
                          No hay usuarios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>
      </main>
    </ProtectedLayout>
  );
}