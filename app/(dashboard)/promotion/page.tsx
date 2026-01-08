'use client';

import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '@/state/AppContext';
import { api } from '@/lib/api';
import { ActionType } from '@/state/actions';
import { LayersIcon, ArrowRightIcon, CheckCircleIcon, UsersIcon } from '@/components/Icons';

export default function PromotionPage() {
    const { students, grados, secciones } = useAppState();
    const dispatch = useAppDispatch();

    // Estado para "Origen"
    const [sourceGradoId, setSourceGradoId] = useState<number | null>(null);
    const [sourceSeccionId, setSourceSeccionId] = useState<number | null>(null);

    // Estado para "Destino"
    const [targetGradoId, setTargetGradoId] = useState<number | null>(null);
    const [targetSeccionId, setTargetSeccionId] = useState<number | null>(null);

    // Selección de Estudiantes
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [isPromoting, setIsPromoting] = useState(false);

    // Filtrar estudiantes del origen
    const sourceStudents = useMemo(() => {
        if (!sourceGradoId || !sourceSeccionId) return [];
        return students.filter(s => s.id_grado === sourceGradoId && s.id_seccion === sourceSeccionId && s.status === 'Activo');
    }, [students, sourceGradoId, sourceSeccionId]);

    // Manejar checkboxes
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(sourceStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (id: number) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    // Acción de Promover
    const handlePromote = async () => {
        if (selectedStudentIds.length === 0 || !targetGradoId || !targetSeccionId) return;

        if (!confirm(`¿Está seguro de promover a ${selectedStudentIds.length} estudiantes? Esta acción actualizará su grado y sección actual.`)) {
            return;
        }

        setIsPromoting(true);
        try {
            await api.post('/students/promote', {
                studentIds: selectedStudentIds,
                targetGradoId,
                targetSeccionId
            });

            // Actualizar estado local (Optimistic Update o Refetch)
            // Para simplicidad, hacemos update local de los estudiantes afectados
            selectedStudentIds.forEach(id => {
                const student = students.find(s => s.id === id);
                if (student) {
                    dispatch({
                        type: ActionType.SAVE_STUDENT,
                        payload: { ...student, id_grado: targetGradoId, id_seccion: targetSeccionId }
                    });
                }
            });

            alert("Promoción realizada con éxito.");
            setSelectedStudentIds([]);
            // Opcional: Limpiar filtros
        } catch (error) {
            console.error("Error promoting students", error);
            alert("Error al promover estudiantes.");
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-2"><LayersIcon /></span> Promoción de Año Escolar
            </h1>
            <p className="text-moon-text-secondary">Mueva grupos de estudiantes al siguiente nivel académico manteniendo su historial.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel ORIGEN */}
                <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                    <h2 className="text-lg font-semibold text-red-400 mb-4 border-b border-moon-border pb-2">1. Seleccionar Origen (Grado Actual)</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm mb-1 text-moon-text">Grado</label>
                            <select
                                className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white"
                                value={sourceGradoId || ''}
                                onChange={e => setSourceGradoId(Number(e.target.value))}
                            >
                                <option value="" style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>Seleccionar...</option>
                                {grados.map(g => <option key={g.id_grado} value={g.id_grado} style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>{g.nombre_grado}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-moon-text">Sección</label>
                            <select
                                className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white"
                                value={sourceSeccionId || ''}
                                onChange={e => setSourceSeccionId(Number(e.target.value))}
                            >
                                <option value="" style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>Seleccionar...</option>
                                {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion} style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>{s.nombre_seccion}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Lista de Estudiantes */}
                    {sourceStudents.length > 0 ? (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-moon-text-secondary">{sourceStudents.length} Estudiantes encontrados</span>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="selectAll"
                                        checked={sourceStudents.length > 0 && selectedStudentIds.length === sourceStudents.length}
                                        onChange={handleSelectAll}
                                        className="mr-2 rounded bg-moon-bg border-moon-border text-moon-primary focus:ring-moon-primary"
                                    />
                                    <label htmlFor="selectAll" className="text-sm text-white cursor-pointer">Seleccionar Todos</label>
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-moon-border rounded-lg bg-moon-bg">
                                {sourceStudents.map(student => (
                                    <div key={student.id} className="flex items-center p-3 border-b border-moon-border last:border-0 hover:bg-moon-nav">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={() => handleSelectStudent(student.id)}
                                            className="mr-3 rounded bg-moon-bg border-moon-border text-moon-primary focus:ring-moon-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-white">{student.apellidos}, {student.nombres}</p>
                                            <p className="text-xs text-moon-text-secondary">{student.cedula}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-right text-sm mt-2 text-green-400 font-bold">{selectedStudentIds.length} Seleccionados</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-moon-text-secondary bg-moon-bg rounded-lg border border-dashed border-moon-border">
                            {sourceGradoId && sourceSeccionId ? 'No hay estudiantes activos en este curso.' : 'Seleccione grado y sección para ver estudiantes.'}
                        </div>
                    )}
                </div>

                {/* Panel DESTINO y ACCION */}
                <div className="space-y-6">
                    <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                        <h2 className="text-lg font-semibold text-green-400 mb-4 border-b border-moon-border pb-2">2. Seleccionar Destino (Nuevo Grado)</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm mb-1 text-moon-text">Grado</label>
                                <select
                                    className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white"
                                    value={targetGradoId || ''}
                                    onChange={e => setTargetGradoId(Number(e.target.value))}
                                >
                                    <option value="" style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>Seleccionar...</option>
                                    {grados.map(g => <option key={g.id_grado} value={g.id_grado} style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>{g.nombre_grado}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-moon-text">Sección</label>
                                <select
                                    className="w-full bg-moon-bg border border-moon-border rounded-lg p-2 text-white"
                                    value={targetSeccionId || ''}
                                    onChange={e => setTargetSeccionId(Number(e.target.value))}
                                >
                                    <option value="" style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>Seleccionar...</option>
                                    {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion} style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>{s.nombre_seccion}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border-2 text-center transition-all ${selectedStudentIds.length > 0 && targetGradoId && targetSeccionId ? 'bg-green-600/20 border-green-500' : 'bg-moon-bg border-moon-border opacity-50'}`}>
                        <h3 className="text-white font-bold text-lg mb-2">Resumen de Promoción</h3>
                        <p className="text-moon-text mb-4">
                            Se moverán <strong>{selectedStudentIds.length}</strong> estudiantes <br />
                            De: <strong>{grados.find(g => g.id_grado === sourceGradoId)?.nombre_grado || '?'} "{secciones.find(s => s.id_seccion === sourceSeccionId)?.nombre_seccion || '?'}"</strong><br />
                            A: <strong className="text-green-400">{grados.find(g => g.id_grado === targetGradoId)?.nombre_grado || '?'} "{secciones.find(s => s.id_seccion === targetSeccionId)?.nombre_seccion || '?'}"</strong>
                        </p>
                        <button
                            onClick={handlePromote}
                            disabled={selectedStudentIds.length === 0 || !targetGradoId || !targetSeccionId || isPromoting}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform transform active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isPromoting ? 'Procesando...' : (
                                <>
                                    <span className="mr-2"><ArrowRightIcon /></span> Confirmar Promoción
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
