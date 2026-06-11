'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast } from '@/state/ToastContext';
import { PlusIcon } from '@/components/Icons';
import { useKeyboardShortcut } from '@/lib/useKeyboardShortcut';

interface Evaluation {
    id: number;
    descripcion: string;
    nota: number;
    ponderacion: number;
}

interface StudentWithGrades {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    isLocked: boolean;
    lapso1: Evaluation[];
    lapso2: Evaluation[];
    lapso3: Evaluation[];
}

export default function GradebookPage({ params }: { params: Promise<{ materiaId: string }> }) {
    const { addToast } = useToast();
    const { materiaId } = React.use(params);

    const [students, setStudents] = useState<StudentWithGrades[]>([]);
    const [anoEscolarId, setAnoEscolarId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 0>(1);
    const [editCell, setEditCell] = useState<{ studentId: number; evalIndex: number; lapso: 1 | 2 | 3 } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showAddEval, setShowAddEval] = useState(false);
    const [newEvalDesc, setNewEvalDesc] = useState('');
    const [newEvalWeight, setNewEvalWeight] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/teacher/classes/${materiaId}/students`);
            setStudents(res.data.students);
            setAnoEscolarId(res.data.anoEscolarId);
        } catch (error) {
            console.error('Error fetching gradebook', error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [materiaId, addToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useKeyboardShortcut('n', () => { if (activeTab !== 0) setShowAddEval(true); }, { enabled: !showAddEval && !editCell });
    useKeyboardShortcut('Escape', () => { setEditCell(null); setShowAddEval(false); }, { enabled: !!(editCell || showAddEval) });

    const evaluationDefs = useMemo(() => {
        if (activeTab === 0) return [];
        const lapsoKey = `lapso${activeTab}` as 'lapso1' | 'lapso2' | 'lapso3';
        const allEvals = students.flatMap(s => s[lapsoKey]);
        const unique = new Map<string, { ponderacion: number }>();
        allEvals.forEach(ev => {
            if (!unique.has(ev.descripcion)) {
                unique.set(ev.descripcion, { ponderacion: ev.ponderacion });
            }
        });
        return Array.from(unique.entries()).map(([descripcion, { ponderacion }]) => ({ descripcion, ponderacion }));
    }, [students, activeTab]);

    const handleCellClick = (studentId: number, evalIndex: number, lapso: 1 | 2 | 3) => {
        const lapsoKey = `lapso${lapso}` as 'lapso1' | 'lapso2' | 'lapso3';
        const student = students.find(s => s.id === studentId);
        if (!student || student.isLocked) return;
        const evals = student[lapsoKey];
        const currentNota = evals[evalIndex]?.nota;
        setEditCell({ studentId, evalIndex, lapso });
        setEditValue(currentNota != null ? String(currentNota) : '');
    };

    const handleSaveCell = async () => {
        if (!editCell) return;
        const { studentId, evalIndex, lapso } = editCell;
        const notaNum = parseFloat(editValue);
        if (isNaN(notaNum) || notaNum < 1 || notaNum > 20) {
            addToast('Ingrese una nota válida entre 1 y 20', 'warning');
            return;
        }

        const lapsoKey = `lapso${lapso}` as 'lapso1' | 'lapso2' | 'lapso3';
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        const currentEvals = [...student[lapsoKey]];
        currentEvals[evalIndex] = { ...currentEvals[evalIndex], nota: notaNum };

        try {
            setIsSaving(true);
            const payload: Record<string, any> = {
                studentId,
                materiaId: Number(materiaId),
                anoEscolarId,
                lapso1: [],
                lapso2: [],
                lapso3: []
            };
            payload[lapsoKey] = currentEvals.map(e => ({
                descripcion: e.descripcion,
                ponderacion: e.ponderacion,
                nota: e.nota
            }));

            await api.post('/calificaciones/sync', payload);

            setStudents(prev => prev.map(s =>
                s.id === studentId ? { ...s, [lapsoKey]: currentEvals } : s
            ));
            setEditCell(null);
            addToast('Nota guardada correctamente', 'success');
        } catch (error) {
            console.error('Error saving grade', error);
            addToast('Error al guardar la nota', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddEvaluation = async () => {
        if (!newEvalDesc.trim()) {
            addToast('Ingrese una descripción para la evaluación', 'warning');
            return;
        }
        const weight = parseFloat(newEvalWeight);
        if (isNaN(weight) || weight <= 0 || weight > 100) {
            addToast('Ingrese una ponderación válida (1-100)', 'warning');
            return;
        }

        const lapsoKey = `lapso${activeTab}` as 'lapso1' | 'lapso2' | 'lapso3';
        const existingWeight = students.reduce((sum, s) => {
            const evals = s[lapsoKey];
            return Math.max(sum, evals.reduce((a, e) => a + e.ponderacion, 0));
        }, 0);

        if (existingWeight + weight > 100) {
            addToast(`La suma de ponderaciones del Lapso ${activeTab} no puede exceder 100%. Peso actual: ${existingWeight}%`, 'warning');
            return;
        }

        try {
            setIsSaving(true);
            const studentIds = students.map(s => s.id);
            await api.post('/calificaciones/sync-batch', {
                materiaId: Number(materiaId),
                anoEscolarId,
                lapso: activeTab,
                evaluations: [{ descripcion: newEvalDesc.trim(), ponderacion: weight }],
                studentIds
            });
            setShowAddEval(false);
            setNewEvalDesc('');
            setNewEvalWeight('');
            addToast('Evaluación agregada correctamente', 'success');
            fetchData();
        } catch (error) {
            console.error('Error adding evaluation', error);
            addToast('Error al agregar evaluación', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getLapsoAverage = (student: StudentWithGrades, lapso: 1 | 2 | 3): number | null => {
        const lapsoKey = `lapso${lapso}` as 'lapso1' | 'lapso2' | 'lapso3';
        const evals = student[lapsoKey];
        if (!evals || evals.length === 0) return null;
        const totalWeight = evals.reduce((s, e) => s + e.ponderacion, 0);
        if (totalWeight === 0) return null;
        const weightedSum = evals.reduce((s, e) => s + (e.nota * e.ponderacion), 0);
        return weightedSum / totalWeight;
    };

    const getDefinitiva = (student: StudentWithGrades): number | null => {
        const promedios = [1, 2, 3].map(l => getLapsoAverage(student, l as 1 | 2 | 3));
        const valid = promedios.filter((p): p is number => p !== null);
        if (valid.length === 0) return null;
        return valid.reduce((s, v) => s + v, 0) / valid.length;
    };

    const TabButton = ({ tab, label }: { tab: number; label: string }) => (
        <button
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-moon-purple text-white' : 'text-moon-text-secondary hover:bg-moon-component hover:text-white'}`}
        >
            {label}
        </button>
    );

    if (isLoading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl text-white mb-4">Cargando Notas...</h2>
                <TableSkeleton rows={10} columns={4} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Hoja de Evaluación</h2>
                    <p className="text-moon-text-secondary">Gestione las calificaciones de sus estudiantes.</p>
                </div>
                <button onClick={() => window.history.back()} className="text-moon-purple hover:underline">Volver a Clases</button>
            </header>

            <div className="bg-moon-component rounded-xl border border-moon-border p-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <TabButton tab={1} label="Lapso 1" />
                    <TabButton tab={2} label="Lapso 2" />
                    <TabButton tab={3} label="Lapso 3" />
                    <TabButton tab={0} label="Resumen Final" />
                </div>
                {activeTab !== 0 && (
                    <button
                        onClick={() => setShowAddEval(true)}
                        className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    >
                        <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Evaluación</span>
                    </button>
                )}
            </div>

            {activeTab === 0 ? (
                <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-moon-text">
                            <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                                <tr>
                                    <th className="px-6 py-4 sticky left-0 bg-moon-nav z-20">Estudiante</th>
                                    <th className="px-6 py-4 text-center">Lapso 1</th>
                                    <th className="px-6 py-4 text-center">Lapso 2</th>
                                    <th className="px-6 py-4 text-center">Lapso 3</th>
                                    <th className="px-6 py-4 text-center">Definitiva</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const l1 = getLapsoAverage(student, 1);
                                    const l2 = getLapsoAverage(student, 2);
                                    const l3 = getLapsoAverage(student, 3);
                                    const def = getDefinitiva(student);
                                    const isApproved = def !== null && def >= 9.5;
                                    return (
                                        <tr key={student.id} className="border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white sticky left-0 bg-moon-component z-10">
                                                {student.apellidos}, {student.nombres}
                                                <div className="text-xs text-moon-text-secondary">{student.cedula}</div>
                                            </td>
                                            {[l1, l2, l3].map((p, i) => (
                                                <td key={i} className={`px-6 py-4 text-center font-bold ${p !== null ? 'text-white' : 'text-moon-text-secondary'}`}>
                                                    {p !== null ? p.toFixed(1) : '-'}
                                                </td>
                                            ))}
                                            <td className={`px-6 py-4 text-center font-bold text-lg ${def !== null ? (isApproved ? 'text-green-400' : 'text-orange-400') : 'text-moon-text-secondary'}`}>
                                                {def !== null ? def.toFixed(1) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-moon-text">
                            <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                                <tr>
                                    <th className="px-6 py-4 sticky left-0 bg-moon-nav z-20 min-w-[200px]">Estudiante</th>
                                    {evaluationDefs.map(def => (
                                        <th key={def.descripcion} className="px-6 py-4 text-center">
                                            {def.descripcion} ({def.ponderacion}%)
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center">Promedio Lapso {activeTab}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={evaluationDefs.length + 2} className="text-center py-10 text-moon-text-secondary">
                                            No hay estudiantes en esta sección.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map(student => {
                                        const lapsoKey = `lapso${activeTab}` as 'lapso1' | 'lapso2' | 'lapso3';
                                        const evals = student[lapsoKey];
                                        const promedio = getLapsoAverage(student, activeTab as 1 | 2 | 3);
                                        const isApproved = promedio !== null && promedio >= 9.5;

                                        return (
                                            <tr key={student.id} className="border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-white sticky left-0 bg-moon-component z-10">
                                                    <div className={student.isLocked ? 'opacity-60' : ''}>
                                                        {student.apellidos}, {student.nombres}
                                                        <div className="text-xs text-moon-text-secondary">{student.cedula}</div>
                                                        {student.isLocked && <span className="text-xs text-orange-400">(bloqueado)</span>}
                                                    </div>
                                                </td>
                                                {evaluationDefs.map((def, idx) => {
                                                    const evaluation = evals.find(e => e.descripcion === def.descripcion);
                                                    const nota = evaluation?.nota;
                                                    const displayNota = nota != null ? nota.toFixed(1) : '-';
                                                    const isApprovedEval = nota != null && nota >= 9.5;
                                                    const colorClass = nota != null ? (isApprovedEval ? 'text-green-400' : 'text-orange-400') : 'text-moon-text-secondary';

                                                    return (
                                                        <td key={def.descripcion} className="px-6 py-3 text-center">
                                                            <div
                                                                onClick={() => {
                                                                    const evalIdx = evals.findIndex(e => e.descripcion === def.descripcion);
                                                                    if (evalIdx >= 0 && !student.isLocked) {
                                                                        handleCellClick(student.id, evalIdx, activeTab as 1 | 2 | 3);
                                                                    }
                                                                }}
                                                                className={`inline-flex w-12 h-8 items-center justify-center rounded-md transition-colors cursor-pointer font-semibold ${colorClass} ${student.isLocked ? '' : 'hover:bg-moon-border'}`}
                                                            >
                                                                {displayNota}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-6 py-3 text-center font-bold text-lg ${promedio !== null ? (isApproved ? 'text-green-400' : 'text-orange-400') : 'text-moon-text-secondary'}`}>
                                                    {promedio?.toFixed(1) ?? '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {editCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-moon-component border border-moon-border p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Calificación</h3>
                        <p className="text-moon-text-secondary text-sm mb-4">
                            Estudiante ID: {editCell.studentId}<br />
                            Lapso: {editCell.lapso}
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-moon-text mb-2">Nota (1-20 pts)</label>
                            <input
                                type="number"
                                className="w-full bg-moon-bg border border-moon-border text-white text-center text-3xl font-bold rounded-lg py-4 focus:outline-none focus:border-moon-purple"
                                min="1" max="20" step="0.1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCell(); if (e.key === 'Escape') setEditCell(null); }}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setEditCell(null)}
                                className="px-4 py-2 text-moon-text hover:text-white transition-colors"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveCell}
                                className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddEval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-moon-component border border-moon-border p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Añadir Evaluación</h3>
                        <p className="text-moon-text-secondary text-sm mb-4">Lapso {activeTab}</p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-moon-text mb-2">Descripción</label>
                            <input
                                type="text"
                                className="w-full bg-moon-bg border border-moon-border text-white rounded-lg py-2 px-3 focus:outline-none focus:border-moon-purple"
                                placeholder="Ej: Examen Parcial"
                                value={newEvalDesc}
                                onChange={(e) => setNewEvalDesc(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-moon-text mb-2">Ponderación (%)</label>
                            <input
                                type="number"
                                className="w-full bg-moon-bg border border-moon-border text-white rounded-lg py-2 px-3 focus:outline-none focus:border-moon-purple"
                                placeholder="Ej: 30"
                                min="1" max="100"
                                value={newEvalWeight}
                                onChange={(e) => setNewEvalWeight(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddEvaluation(); }}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setShowAddEval(false); setNewEvalDesc(''); setNewEvalWeight(''); }}
                                className="px-4 py-2 text-moon-text hover:text-white transition-colors"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddEvaluation}
                                className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Creando...' : 'Crear Evaluación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
