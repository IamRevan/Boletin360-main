'use client';

import { AppProvider } from '../state/AppContext';
import { SocketProvider } from '../components/SocketProvider';

// Componente Providers: Envuelve la aplicación con los proveedores de contexto necesarios
// En este caso, AppProvider maneja el estado global de la aplicación
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            <AppProvider>{children}</AppProvider>
        </SocketProvider>
    );
}
