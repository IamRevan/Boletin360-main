'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/state/ToastContext';
import { useAppState } from '@/state/AppContext';
import { Skeleton } from '@/components/ui/Skeleton';

type Status = 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
    { value: 'PRESENTE', label: 'P', color: 'bg-green-600 hover:bg-green-500' },
    { value: 'AUSENTE', label: 'A', color: 'bg-red-600 hover:bg-red-500' },
    { value: 'TARDE', label: 'T', color: 'bg-yellow-600 hover:bg-yellow-500' },
    { value: 'JUSTIFICADO', label: 'J', color: 'bg-blue-600 hover:bg-blue-500' },
];

function getTodayString(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

export default function AttendancePage() {
    const { grados, secciones, currentUser } = useAppState();
    const { addToast } = useToast();

    const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
    const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);
    const [fecha, setFecha] = useState(getTodayString());
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const fetchAttendance = useCallback(async () => {
        if (!selectedGradoId || !selectedSeccionId || !fecha) return;
        setIsLoading(true);
        try {
            const res = await api.getAttendance({
                gradoId: selectedGradoId,
                seccionId: selectedSeccionId,
                fecha
            });
            setStudents(res.data.students);
            setDirty(false);
        } catch (err) {
            console.error('Error fetching attendance', err);
            addToast('Error al cargar asistencia', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedGradoId, selectedSeccionId, fecha, addToast]);

    useEffect(() => {
        if (selectedGradoId && selectedSeccionId && fecha) {
            fetchAttendance();
        }
    }, [fetchAttendance]);

    const setStatus = (studentId: number, status: Status) => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, status } : s
        ));
        setDirty(true);
    };

    const markAll = (status: Status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!fecha || students.length === 0) return;
        setIsSaving(true);
        try {
            const records = students
                .filter(s => s.status)
                .map(s => ({ studentId: s.id, status: s.status, observacion: s.observacion }));

            await api.saveAttendance({ fecha, records });
            addToast(`Asistencia registrada (${records.length} estudiantes)`, 'success');
            setDirty(false);
        } catch (err) {
            console.error('Error saving attendance', err);
            addToast('Error al guardar asistencia', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSecciones = secciones.filter((s: any) =>
        !selectedGradoId || s.idGrado === selectedGradoId
    );

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Registro de Asistencia</h2>
                <p className="text-moon-text-secondary mt-1">Registre la asistencia diaria de los estudiantes.</p>
            </div>

            <div className="bg-moon-component rounded-xl border border-moon-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Grado</label>
                        <select
                            value={selectedGradoId || ''}
                            onChange={(e) => { setSelectedGradoId(e.target.value ? Number(e.target.value) : null); setSelectedSeccionId(null); }}
                            className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light"
                        >
                            <option value="">Seleccione...</option>
                            {grados.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.nombreGrado}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Sección</label>
                        <select
                            value={selectedSeccionId || ''}
                            onChange={(e) => setSelectedSeccionId(e.target.value ? Number(e.target.value) : null)}
                            disabled={!selectedGradoId}
                            className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light disabled:opacity-50"
                        >
                            <option value="">Seleccione...</option>
                            {filteredSecciones.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.nombreSeccion}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light"
                        />
                    </div>
                    <div className="flex items-end space-x-2">
                        <button
                            onClick={fetchAttendance}
                            disabled={!selectedGradoId || !selectedSeccionId || !fecha || isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Cargando...' : 'Cargar'}
                        </button>
                    </div>
                </div>
            </div>

            {students.length > 0 && (
                <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                    <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-moon-border">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-moon-text-secondary uppercase mr-2">Marcar todos:</span>
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => markAll(opt.value)}
                                    className={`w-8 h-8 rounded text-white text-xs font-bold transition-colors ${opt.color}`}
                                    title={opt.label}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-2">
                            {dirty && <span className="text-xs text-yellow-400">Hay cambios sin guardar</span>}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !dirty}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-moon-text">
                            <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                                <tr>
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4 text-center">Cédula</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id} className="border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-white">
                                            {student.apellidos}, {student.nombres}
                                        </td>
                                        <td className="px-6 py-3 text-center text-moon-text-secondary">
                                            {student.cedula}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center space-x-2">
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setStatus(student.id, opt.value)}
                                                        className={`w-10 h-10 rounded-lg text-white text-sm font-bold transition-all ${student.status === opt.value
                                                            ? `${opt.color} ring-2 ring-white scale-110`
                                                            : 'bg-moon-bg text-moon-text-secondary hover:bg-moon-nav'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && selectedGradoId && selectedSeccionId && fecha && students.length === 0 && (
                <div className="bg-moon-component p-8 rounded-xl border border-moon-border text-center text-moon-text-secondary">
                    No hay estudiantes en esta sección.
                </div>
            )}
        </div>
    );
}
