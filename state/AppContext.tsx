'use client';

import React from 'react';
import { AuthProvider, useAuth, useAuthDispatch } from './AuthContext';
import { DataProvider, useData, useDataDispatch } from './DataContext';
import { ToastProvider } from './ToastContext';
import { AppState } from '../types';

// AppProvider combines Auth, Data, and Toast providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
            <AuthProvider>
                <DataProvider>
                    {children}
                </DataProvider>
            </AuthProvider>
        </ToastProvider>
    );
};

// Facade hooks for backward compatibility and unified access
export const useAppState = (): AppState => {
    const authState = useAuth();
    const dataState = useData();

    return {
        ...authState,
        ...dataState,
    };
};

export const useAppDispatch = () => {
    const authDispatch = useAuthDispatch();
    const dataDispatch = useDataDispatch();

    return (action: any) => {
        // Dispatch to key reducers
        // Note: For actions like Login that affect both, we call both.
        // For others, calling both is harmless as they (should) ignore unknown actions.
        authDispatch(action);
        dataDispatch(action);
    };
};