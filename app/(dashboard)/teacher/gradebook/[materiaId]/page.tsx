'use client';

import React, { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function GradebookPage({ params }: { params: Promise<{ materiaId: string }> }) {
    // Unwrap params properly in Next.js 15+ if needed, or just await
    const { materiaId } = use(params);

    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState<{ studentId: number; lapso: number; currentData: any } | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/teacher/classes/${materiaId}/students`);
            setStudents(res.data);
        } catch (error) {
            console.error("Error fetching gradebook", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [materiaId]);


    // Helper para obtener nota visual
    const getLapsoNota = (lapsoData: any) => {
        if (!lapsoData || !Array.isArray(lapsoData) || lapsoData.length === 0) return '-';
        // Asumiendo una evaluacion unica o promedio simple
        // Devuelve la primera nota encontrada o el promedio
        const nota = lapsoData[0].nota;
        return nota !== undefined ? nota : '-';
    };

    const handleCellClick = (student: any, lapso: number) => {
        const lapsoKey = `lapso${lapso}`;
        const data = student[lapsoKey];
        const currentNota = getLapsoNota(data);

        setSelectedCell({
            studentId: student.id,
            lapso,
            currentData: data
        });
        setEditValue(currentNota === '-' ? '' : String(currentNota));
    };

    const handleSave = async () => {
        if (!selectedCell) return;

        const notaNum = parseFloat(editValue);
        if (isNaN(notaNum) || notaNum < 1 || notaNum > 20) {
            alert("Por favor ingrese una nota válida entre 1 y 20");
            return;
        }

        // Construir objeto de evaluación simple (Evaluación Única)
        // Esto simplifica el modelo para el MVP.
        const newGrades = [
            { descripcion: 'Evaluación Acumulativa', ponderacion: 20, nota: notaNum }
        ];

        try {
            await api.post('/teacher/grades', {
                materiaId,
                studentId: selectedCell.studentId,
                lapso: selectedCell.lapso,
                grades: newGrades
            });

            // Recargar datos optimista o fetch
            setStudents(prev => prev.map(s => {
                if (s.id === selectedCell.studentId) {
                    return { ...s, [`lapso${selectedCell.lapso}`]: newGrades };
                }
                return s;
            }));
            setSelectedCell(null);

        } catch (error) {
            console.error("Error saving grade", error);
            alert("Error al guardar la nota.");
        }
    };

    if (isLoading) return <div className="p-6"><h2 className="text-2xl text-white mb-4">Cargando Notas...</h2><TableSkeleton rows={10} columns={4} /></div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Hoja de Evaluación (Gradebook)</h2>
                    <p className="text-moon-text-secondary">Haga clic en una celda para editar la calificación del lapso.</p>
                </div>
                <button onClick={() => window.history.back()} className="text-moon-purple hover:underline">Volver a Clases</button>
            </header>

            <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                <table className="w-full text-sm text-left text-moon-text">
                    <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                        <tr>
                            <th className="px-6 py-4">Estudiante</th>
                            <th className="px-6 py-4 text-center">Lapso 1</th>
                            <th className="px-6 py-4 text-center">Lapso 2</th>
                            <th className="px-6 py-4 text-center">Lapso 3</th>
                            <th className="px-6 py-4 text-center">Definitiva</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                            const n1 = parseFloat(getLapsoNota(student.lapso1)) || 0;
                            const n2 = parseFloat(getLapsoNota(student.lapso2)) || 0;
                            const n3 = parseFloat(getLapsoNota(student.lapso3)) || 0;
                            const def = ((n1 + n2 + n3) / 3).toFixed(1);

                            return (
                                <tr key={student.id} className="border-b border-moon-border bg-moon-component hover:bg-moon-nav/50">
                                    <td className="px-6 py-4 font-medium text-white">
                                        {student.apellidos}, {student.nombres}
                                        <div className="text-xs text-moon-text-secondary">{student.cedula}</div>
                                    </td>
                                    {[1, 2, 3].map(lapso => (
                                        <td key={lapso} className="px-6 py-4 text-center">
                                            <div
                                                onClick={() => handleCellClick(student, lapso)}
                                                className={`
                                                    mx-auto w-12 h-10 flex items-center justify-center rounded cursor-pointer transition-colors border border-transparent hover:border-moon-purple/50
                                                    ${getLapsoNota(student[`lapso${lapso}`]) === '-' ? 'bg-moon-bg text-moon-text-secondary' : 'bg-moon-nav font-bold text-white'}
                                                `}
                                            >
                                                {getLapsoNota(student[`lapso${lapso}`])}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-center font-bold text-blue-400">
                                        {n1 && n2 && n3 ? def : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edición Rápida */}
            {selectedCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-moon-component border border-moon-border p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Calificación</h3>
                        <p className="text-moon-text-secondary text-sm mb-4">
                            Estudiante ID: {selectedCell.studentId} <br />
                            Lapso: {selectedCell.lapso}
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-moon-text mb-2">Nota (1-20 pts)</label>
                            <input
                                type="number"
                                className="w-full bg-moon-bg border border-moon-border text-white text-center text-3xl font-bold rounded-lg py-4 focus:outline-none focus:border-moon-purple"
                                min="1" max="20"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="px-4 py-2 text-moon-text hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
