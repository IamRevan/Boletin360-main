'use client';

import { useAppState, useAppDispatch } from '@/state/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ActionType } from '@/state/actions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAppState();
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
        }
    }, [currentUser, router]);

    if (!currentUser) return null;

    const handleLogout = () => {
        dispatch({ type: ActionType.LOGOUT });
        router.push('/login');
    };

    const handleNavigate = (page: string) => {
        if (page === 'dashboard') router.push('/');
        else router.push(`/${page}`);
    };

    const getCurrentPage = () => {
        if (pathname === '/') return 'dashboard';
        return pathname.substring(1);
    };

    return (
        <div className="flex h-screen bg-moon-dark font-sans">
            <div className="print:hidden">
                <Sidebar currentPage={getCurrentPage()} setCurrentPage={handleNavigate} userRole={currentUser.role} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="print:hidden">
                    <Header onLogout={handleLogout} currentUser={currentUser} onNavigate={handleNavigate} />
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-moon-dark p-6 lg:p-10 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}
