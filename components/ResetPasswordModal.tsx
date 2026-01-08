import React, { useState } from 'react';
import { useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { User } from '../types';
import { api } from '../lib/api';

interface ResetPasswordModalProps {
    user: User;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const dispatch = useAppDispatch();

    const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await api.resetPassword(user.id, newPassword);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: unknown) {
            console.error(err);
            setError('Error al restablecer la contraseña.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="bg-moon-component rounded-xl border border-moon-border w-full max-w-md shadow-2xl relative animate-[scale-in_0.2s_ease-out]">
                <div className="p-6 border-b border-moon-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Restablecer Contraseña</h3>
                    <button onClick={onClose} className="text-moon-text-secondary hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center text-green-400 py-4">
                            <p className="text-lg font-bold">¡Contraseña restablecida!</p>
                            <p className="text-sm mt-2">Cerrando ventana...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-moon-text-secondary mb-4">
                                Estás cambiando la contraseña para el usuario <strong>{user.email}</strong>.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-moon-text-secondary mb-1">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-moon-text-secondary mb-1">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-moon-text hover:bg-moon-nav transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Guardar Contraseña
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
