'use client';

import React, { createContext, useReducer, useContext, Dispatch, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { Action, ActionType } from './actions';
import { api } from '../lib/api';

interface AuthState {
    currentUser: User | null;
}

const initialAuthState: AuthState = {
    currentUser: null,
};

const authReducer = (state: AuthState, action: Action): AuthState => {
    switch (action.type) {
        case ActionType.LOGIN_SUCCESS: {
            return {
                ...state,
                currentUser: action.payload,
            };
        }
        case ActionType.LOGOUT: {
            return {
                ...state,
                currentUser: null,
            };
        }
        case ActionType.UPDATE_CURRENT_USER_PROFILE: {
            const { userId, updates } = action.payload;
            if (!state.currentUser || state.currentUser.id !== userId) {
                return state;
            }
            // Optimistic update
            const newCurrentUser = { ...state.currentUser, ...updates };
            // Remove sensitive fields
            delete (newCurrentUser as any).oldPassword;
            delete (newCurrentUser as any).newPassword;
            delete (newCurrentUser as any).confirmPassword;

            return { ...state, currentUser: newCurrentUser };
        }
        default:
            return state;
    }
};

const AuthStateContext = createContext<AuthState>(initialAuthState);
const AuthDispatchContext = createContext<Dispatch<Action>>(() => null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialAuthState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        // We use getInitialData to validate the token and get the user
                        // This might be redundant if DataContext also fetches, but necessary for AuthContext to own the user state independently
                        const response = await api.getInitialData();
                        if (response.data && response.data.currentUser) {
                            dispatch({ type: ActionType.LOGIN_SUCCESS, payload: response.data.currentUser });
                        }
                    } catch (error) {
                        console.error("Failed to restore session", error);
                        localStorage.removeItem('token');
                    }
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // We can expose loading state or block rendering?
    // For smoothness, we might want to just let it render, but logic relying on currentUser might fail.
    // However, if we block, we show a blank screen or spinner.
    // Given the issues with hydration, let's just return children but maybe exposing loading in the context would be better?
    // checking currentUser vs loading:
    // If we have a token but haven't fetched yet, currentUser is null. Pages might redirect.
    // So we MUST block if we are checking auth.

    if (loading) {
        return null; // Or a splash screen
    }

    return (
        <AuthStateContext.Provider value={state}>
            <AuthDispatchContext.Provider value={dispatch}>
                {children}
            </AuthDispatchContext.Provider>
        </AuthStateContext.Provider>
    );
};

export const useAuth = () => useContext(AuthStateContext);
export const useAuthDispatch = () => useContext(AuthDispatchContext);
