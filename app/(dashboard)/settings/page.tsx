'use client';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppState } from '@/state/AppContext';
import { UserRole } from '@/types';
import { AccessDeniedPage } from '@/components/AccessDeniedPage';

export default function Page() {
    const { currentUser } = useAppState();
    if (currentUser?.role !== UserRole.Admin) return <AccessDeniedPage />;
    return <SettingsPage />;
}
