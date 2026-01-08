'use client';

import React from 'react';
import { AuthProvider, useAuth, useAuthDispatch } from './AuthContext';
import { DataProvider, useData, useDataDispatch } from './DataContext';
import { AppState } from '../types';

// AppProvider combines both Auth and Data providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AuthProvider>
            <DataProvider>
                {children}
            </DataProvider>
        </AuthProvider>
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