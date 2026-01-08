'use client';


import React, { useState } from 'react';
import { GraduationCapIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { users } = useAppState();
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        console.log('Attempting login with:', { email, passwordLength: password.length });
        try {
            const response = await api.login({ email, password });
            const user = response.data;
            dispatch({ type: ActionType.LOGIN_SUCCESS, payload: user });

            // Fetch initial data now that we have a token (since initial load failed or was skipped)
            try {
                const dataResponse = await api.getInitialData();
                dispatch({ type: ActionType.SET_INITIAL_DATA, payload: dataResponse.data });
            } catch (dataError) {
                console.error("Failed to fetch initial data after login", dataError);
            }

            onLoginSuccess();
        } catch (err) {
            console.error(err);
            setError('Email o contraseña incorrectos.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-moon-dark font-sans p-4 relative z-0">
            <div className="w-full max-w-md relative z-10">
                <div className="flex justify-center items-center mb-6">
                    <div className="w-12 h-12 bg-moon-purple rounded-lg flex items-center justify-center">
                        <GraduationCapIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-white ml-4">Boletín360</h1>
                </div>

                <div className="bg-moon-component rounded-xl border border-moon-border p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Bienvenido de Nuevo</h2>
                    <p className="text-center text-moon-text-secondary mb-8">Inicia sesión para acceder a tu panel.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-moon-text-secondary mb-2">
                                Dirección de Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { console.log('Email changed'); setEmail(e.target.value); }}
                                required
                                className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent cursor-text relative z-20"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-moon-text-secondary">
                                    Contraseña
                                </label>
                                <a href="#" className="text-sm text-moon-purple-light hover:underline relative z-20">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent cursor-text relative z-20"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 text-center bg-red-500/20 p-3 rounded-lg">
                                {error}
                            </p>
                        )}

                        <div>
                            <button
                                type="submit"
                                onClick={() => console.log('Login button clicked')}
                                className="w-full bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 cursor-pointer relative z-20"
                            >
                                Iniciar Sesión
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
