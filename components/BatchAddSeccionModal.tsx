'use client';

import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

export const BatchAddSeccionModal: React.FC = () => {
    const { modalState, grados } = useAppState();
    const dispatch = useAppDispatch();
    const [nombres, setNombres] = useState('');
    const [idGrado, setIdGrado] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombres.trim() || !idGrado) return;

        setLoading(true);
        try {
            // Split by comma or newline, trim spaces, and filter out empties
            const nombresArray = nombres
                .split(/[,\n]/)
                .map(n => n.trim())
                .filter(n => n.length > 0);

            const seccionesPayload = nombresArray.map(nombreSeccion => ({
                nombreSeccion,
                idGrado: Number(idGrado)
            }));

            await api.createBatchSecciones({ secciones: seccionesPayload });

            const refresh = await api.getInitialData();
            dispatch({ type: ActionType.SET_INITIAL_DATA, payload: refresh.data });

            onClose();
        } catch (error) {
            console.error('Failed to create batch secciones:', error);
            alert('Hubo un error al crear las secciones en lote.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-[fade-in_0.2s_ease-out]">
            <div className="bg-moon-component border border-moon-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-[slide-up_0.3s_ease-out]">
                <div className="bg-moon-nav border-b border-moon-border px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Añadir Secciones en Lote</h3>
                    <button onClick={onClose} className="text-moon-text-secondary hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Grado Destino</label>
                            <select
                                value={idGrado}
                                onChange={(e) => setIdGrado(e.target.value ? Number(e.target.value) : '')}
                                required
                                className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
                            >
                                <option value="" disabled>Seleccione un Grado...</option>
                                {grados.map(g => (
                                    <option key={g.id} value={g.id}>{g.nombreGrado}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombres de Secciones (separados por comas o saltos de línea)</label>
                            <textarea
                                value={nombres}
                                onChange={(e) => setNombres(e.target.value)}
                                placeholder="Ej: A, B, C"
                                required
                                rows={4}
                                className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end p-6 border-t border-moon-border space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="text-moon-text-secondary bg-transparent border border-moon-border hover:bg-moon-nav hover:text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="text-white bg-moon-purple hover:bg-moon-purple-light disabled:opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors shadow-[0_0_15px_rgba(107,76,220,0.4)]"
                        >
                            {loading ? 'Guardando...' : 'Añadir Secciones'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
