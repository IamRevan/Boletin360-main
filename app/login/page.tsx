'use client'; // Componente de Cliente

import { LoginPage } from '@/components/LoginPage';
import { useRouter } from 'next/navigation';

// Página de Login (Ruta /login)
export default function Login() {
    const router = useRouter();

    // Redirigir al dashboard tras login exitoso
    const handleLoginSuccess = () => {
        router.push('/');
    };

    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}
