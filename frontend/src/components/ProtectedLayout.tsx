'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Pill, LayoutDashboard, FileText, PlusCircle, Users, } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) return null;

    const links =
        user.role === 'doctor'
            ? [
                {
                    href: '/doctor/prescriptions',
                    label: 'Prescripciones',
                    icon: FileText,
                },
                {
                    href: '/doctor/prescriptions/new',
                    label: 'Nueva',
                    icon: PlusCircle,
                },
            ]
            : user.role === 'patient'
                ? [
                    {
                        href: '/patient/prescriptions',
                        label: 'Mis prescripciones',
                        icon: Pill,
                    },
                ]
                : [
                    {
                        href: '/admin',
                        label: 'Dashboard',
                        icon: LayoutDashboard,
                    },
                    {
                        href: '/admin/users',
                        label: 'Usuarios',
                        icon: Users,
                    },
                ];

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div>
                        <p className="text-lg font-bold text-slate-900">Prescriptions App</p>
                        <p className="text-xs text-slate-500">
                            {user.name} · {user.role}
                        </p>
                    </div>

                    <nav className="flex flex-wrap items-center gap-2">
                        {links.map(link => {
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    <Icon size={16} />
                                    {link.label}
                                </Link>
                            );
                        })}
                        <ThemeToggle />

                        <button
                            onClick={() => {
                                logout();
                                router.push('/login');
                            }}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >

                            <LogOut size={16} />
                            Salir
                        </button>
                    </nav>
                </div>
            </header>

            {children}
        </div>
    );
}