'use client';
import { TeachersPage } from '@/components/TeachersPage';
import { useAppState } from '@/state/AppContext';
import { UserRole } from '@/types';
import { AccessDeniedPage } from '@/components/AccessDeniedPage';

export default function Page() {
    const { currentUser } = useAppState();
    if (currentUser?.role === UserRole.Teacher) return <AccessDeniedPage />;
    return <TeachersPage />;
}
