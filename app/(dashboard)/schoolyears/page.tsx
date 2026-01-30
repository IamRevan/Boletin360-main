'use client';
import { SchoolYearsPage } from '@/components/SchoolYearsPage';
import { useAppState } from '@/state/AppContext';
import { UserRole } from '@/types';
import { AccessDeniedPage } from '@/components/AccessDeniedPage';

export default function Page() {
    const { currentUser } = useAppState();
    if (currentUser?.role === UserRole.DOCENTE) return <AccessDeniedPage />;
    return <SchoolYearsPage />;
}
