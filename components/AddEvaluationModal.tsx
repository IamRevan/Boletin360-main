'use client';

import React, { useState } from 'react';
import { XIcon, PlusIcon, Trash2Icon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';

interface EvaluationModalInfo {
    studentIds: number[];
    materiaId: number;
    añoId: number;
    lapso: 1 | 2 | 3;
}

interface EvaluationForm {
    id: number;
    descripcion: string;
    ponderacion: number;
}

let nextId = 1;

export const AddEvaluationModal: React.FC = () => {
    const { modalState } = useAppState();
    const dispatch = useAppDispatch();
    const info = modalState.data as EvaluationModalInfo;

    const [evaluations, setEvaluations] = useState<EvaluationForm[]>([
        { id: nextId++, descripcion: '', ponderacion: 20 },
    ]);
    
    const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

    const handleAddEvaluation = () => {
        setEvaluations(prev => [...prev, { id: nextId++, descripcion: '', ponderacion: 20 }]);
    };

    const handleRemoveEvaluation = (id: number) => {
        if (evaluations.length > 1) {
            setEvaluations(prev => prev.filter(ev => ev.id !== id));
        }
    };

    const handleChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEvaluations(prev =>
            prev.map(ev => {
                if (ev.id === id) {
                    return { ...ev, [name]: name === 'ponderacion' ? parseInt(value, 10) || 0 : value };
                }
                return ev;
            })
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const descriptions = new Set<string>();
        for (const ev of evaluations) {
            if (!ev.descripcion.trim()) {
                alert('La descripción no puede estar vacía.');
                return;
            }
            if (ev.ponderacion <= 0 || ev.ponderacion > 100) {
                alert(`La ponderación para "${ev.descripcion}" debe ser un porcentaje entre 1 y 100.`);
                return;
            }
            if (descriptions.has(ev.descripcion.trim())) {
                alert(`La descripción "${ev.descripcion}" está duplicada.`);
                return;
            }
            descriptions.add(ev.descripcion.trim());
        }

        const evaluationsToSave = evaluations.map(({ descripcion, ponderacion }) => ({
            descripcion: descripcion.trim(),
            ponderacion,
        }));

        dispatch({
            type: ActionType.ADD_EVALUATIONS,
            payload: { ...info, evaluations: evaluationsToSave }
        });
    };

    if (!info) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-[fade-in_0.2s_ease-out]"
            onClick={onClose}
        >
            <div 
                className="bg-moon-component rounded-xl border border-moon-border w-full max-w-2xl m-4 shadow-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-moon-border flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white">Añadir Evaluaciones al Lapso {info.lapso}</h3>
                        <p className="text-sm text-moon-text-secondary">
                            Las evaluaciones se añadirán para los {info.studentIds.length} estudiantes de esta clase.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {evaluations.map((ev, index) => (
                            <div key={ev.id} className="flex items-center space-x-4 animate-[fade-in_0.2s_ease-out]">
                                <div className="flex-grow">
                                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Descripción</label>
                                    <input
                                        type="text"
                                        name="descripcion"
                                        value={ev.descripcion}
                                        onChange={(e) => handleChange(ev.id, e)}
                                        placeholder={`Ej: Examen ${index + 1}`}
                                        required
                                        className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
                                    />
                                </div>
                                <div className="w-40">
                                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Ponderación (%)</label>
                                    <input
                                        type="number"
                                        name="ponderacion"
                                        value={ev.ponderacion}
                                        onChange={(e) => handleChange(ev.id, e)}
                                        min="1" max="100" required
                                        className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
                                    />
                                </div>
                                <div className="pt-7">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEvaluation(ev.id)}
                                        disabled={evaluations.length <= 1}
                                        className="p-2.5 text-red-400 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                                    >
                                        <Trash2Icon />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleAddEvaluation}
                                className="w-full flex items-center justify-center space-x-2 text-sm font-medium text-moon-purple-light border-2 border-dashed border-moon-border hover:border-moon-purple hover:text-white rounded-lg py-3 transition-colors"
                            >
                                <PlusIcon />
                                <span>Añadir otra evaluación</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-end p-6 border-t border-moon-border rounded-b-xl space-x-3 flex-shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-moon-border hover:bg-opacity-80 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-moon-purple hover:bg-moon-purple-light text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
                            Añadir Evaluaciones
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
