import React, { useState } from 'react';
import { useDataDispatch } from '../state/DataContext';
import { useAuth } from '../state/AuthContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';
import { SaveIcon, XIcon } from './Icons';
import { UserRole } from '../types';

export const CreateAnnouncementModal: React.FC = () => {
    const dispatch = useDataDispatch();
    const { currentUser } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!currentUser) throw new Error("No authenticated user");

            const response = await api.createAnnouncement({
                title,
                content,
                type,
                createdBy: currentUser.id
            });

            // Dispatch to update local state immediately
            dispatch({
                type: ActionType.SAVE_ANNOUNCEMENT,
                payload: response.data
            });

            dispatch({ type: ActionType.CLOSE_MODAL });
        } catch (err) {
            console.error("Failed to create announcement", err);
            setError("No se pudo crear el anuncio. Intente nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        dispatch({ type: ActionType.CLOSE_MODAL });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="bg-moon-component rounded-xl border border-moon-border shadow-2xl w-full max-w-md overflow-hidden animate-[scale-in_0.2s_ease-out]">
                <div className="flex justify-between items-center p-4 border-b border-moon-border bg-moon-nav/50">
                    <h2 className="text-lg font-semibold text-white">Crear Nuevo Anuncio</h2>
                    <button onClick={handleClose} className="text-moon-text-secondary hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white focus:outline-none focus:border-moon-purple transition-colors"
                            placeholder="Ej: Mantenimiento Programado"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-1">Contenido</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={4}
                            className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white focus:outline-none focus:border-moon-purple transition-colors resize-none"
                            placeholder="Escriba el detalle del anuncio..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-1">Tipo</label>
                        <div className="flex gap-2">
                            {(['info', 'warning', 'success'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-1 px-2 rounded text-sm transition-colors border ${type === t
                                        ? t === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                            : t === 'warning' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                                                : 'bg-green-500/20 border-green-500 text-green-300'
                                        : 'border-moon-border text-moon-text-secondary hover:border-moon-text-secondary'
                                        }`}
                                >
                                    {t === 'info' ? 'Información' : t === 'warning' ? 'Advertencia' : 'Éxito'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="mr-3 px-4 py-2 text-sm text-moon-text-secondary hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-moon-purple hover:bg-moon-purple-light text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>Guardando...</>
                            ) : (
                                <><SaveIcon /> Publicar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
