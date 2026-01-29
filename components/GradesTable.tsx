'use client';


import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { type Student, type Calificacion, type Evaluacion } from '../types';
import { useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { MoreVerticalIcon, EditIcon, Trash2Icon } from './Icons';

// --- Helper Components ---

const GradeCell: React.FC<{
    studentId: number;
    evaluation: Evaluacion | undefined;
    evaluationDef: { descripcion: string; ponderacion: number };
    materiaId: number;
    añoId: number;
    lapso: 1 | 2 | 3;
}> = ({ studentId, evaluation, evaluationDef, materiaId, añoId, lapso }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [grade, setGrade] = useState(evaluation?.nota?.toString() ?? '');
    const [error, setError] = useState(false);
    const dispatch = useAppDispatch();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        const newNota = parseFloat(grade);
        if (isNaN(newNota) || newNota < 0 || newNota > 20) {
            setGrade(evaluation?.nota?.toString() ?? ''); // Revert on invalid input
            setError(true);
            setTimeout(() => setError(false), 2000); // Show error feedback for 2s
            return;
        }
        if (newNota === evaluation?.nota) return; // No change

        dispatch({
            type: ActionType.UPSERT_GRADE,
            payload: {
                studentId,
                materiaId,
                añoId,
                lapso,
                description: evaluationDef.descripcion,
                ponderacion: evaluationDef.ponderacion,
                newNota
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setGrade(evaluation?.nota?.toString() ?? '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`w-20 bg-moon-dark border rounded-md text-center py-1 transition-all ${error ? 'border-red-500 ring-2 ring-red-500/50' : 'border-moon-purple'}`}
            />
        );
    }

    const displayNota = evaluation?.nota?.toFixed(1);
    const isApproved = evaluation && evaluation.nota >= 10;
    const colorClass = evaluation ? (isApproved ? 'text-moon-green' : 'text-moon-orange') : 'text-moon-text-secondary';


    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`w-20 h-8 flex items-center justify-center rounded-md hover:bg-moon-border transition-colors cursor-pointer ${colorClass} font-semibold`}
        >
            {displayNota ?? '-'}
        </div>
    );
};

const EvaluationHeader: React.FC<{
    description: string;
    onDelete: () => void;
}> = ({ description, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);

    return (
        <div className="relative group" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-1">
                <span>{description}</span>
                <MoreVerticalIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-moon-component rounded-lg shadow-lg border border-moon-border z-10 animate-[fade-in_0.1s_ease-out]">
                    <div className="p-2">
                        <button onClick={onDelete} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
                            <Trash2Icon /> <span className="ml-3">Eliminar Columna</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Table Component ---

interface GradesTableProps {
    students: Student[];
    materiaId: number;
    añoId: number;
    lapso: 1 | 2 | 3;
    calificaciones: Calificacion[];
}

export const GradesTable: React.FC<GradesTableProps> = ({ students, materiaId, añoId, lapso, calificaciones }) => {
    const dispatch = useAppDispatch();
    const lapsoKey = `lapso${lapso}` as const;

    const getCalificacionForStudent = useCallback((studentId: number): Calificacion | undefined => {
        return calificaciones.find(c => c.id === studentId && c.id_materia === materiaId && c.id_año_escolar === añoId);
    }, [calificaciones, materiaId, añoId]);

    const evaluationDefinitions = useMemo(() => {
        const allEvaluations = calificaciones
            .filter(c => c.id_materia === materiaId && c.id_año_escolar === añoId)
            .flatMap(c => c[lapsoKey]);

        const uniqueEvals = new Map<string, { ponderacion: number }>();
        allEvaluations.forEach(ev => {
            if (!uniqueEvals.has(ev.descripcion)) {
                uniqueEvals.set(ev.descripcion, { ponderacion: ev.ponderacion });
            }
        });
        return Array.from(uniqueEvals.entries()).map(([descripcion, { ponderacion }]) => ({ descripcion, ponderacion }));
    }, [calificaciones, materiaId, añoId, lapso]);

    const handleDeleteColumn = (description: string) => {
        if (window.confirm(`¿Está seguro que desea eliminar la evaluación "${description}" y todas sus notas para esta clase? Esta acción no se puede deshacer.`)) {
            dispatch({
                type: ActionType.DELETE_EVALUATION_COLUMN,
                payload: { materiaId, añoId, lapso, description }
            });
        }
    };

    const calculateLapsoAverage = useCallback((evals: Evaluacion[]): number | null => {
        if (evals.length === 0) return null;
        const totalPonderacion = evals.reduce((sum, e) => sum + e.ponderacion, 0);
        if (totalPonderacion === 0) return null;
        const weightedSum = evals.reduce((sum, e) => sum + (e.nota * e.ponderacion), 0);
        // The average is the sum of (nota * weight) divided by the sum of weights.
        return weightedSum / totalPonderacion;
    }, []);

    return (
        <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden animate-[fade-in_0.3s_ease-out]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-moon-text">
                    <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                        <tr>
                            <th scope="col" className="px-6 py-3 sticky left-0 bg-moon-nav z-20 w-1/3 min-w-[200px]">Estudiante</th>
                            {evaluationDefinitions.map(def => (
                                <th key={def.descripcion} scope="col" className="px-6 py-3 text-center">
                                    <EvaluationHeader
                                        description={`${def.descripcion} (${def.ponderacion}%)`}
                                        onDelete={() => handleDeleteColumn(def.descripcion)}
                                    />
                                </th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-center">Promedio Lapso {lapso}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={evaluationDefinitions.length + 2} className="text-center py-10 text-moon-text-secondary">No hay estudiantes en esta sección.</td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const calificacion = getCalificacionForStudent(student.id);
                                const lapsoEvals = calificacion?.[lapsoKey] ?? [];
                                const lapsoAverage = calculateLapsoAverage(lapsoEvals);
                                const isApproved = lapsoAverage !== null && lapsoAverage >= 9.5;
                                const averageColor = lapsoAverage === null ? '' : isApproved ? 'text-moon-green' : 'text-moon-orange';

                                return (
                                    <tr key={student.id} className="group border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                                        <td className="px-6 py-2 font-medium text-white whitespace-nowrap sticky left-0 bg-moon-component group-hover:bg-moon-nav/50 z-10 transition-colors">
                                            {student.nombres} {student.apellidos}
                                        </td>
                                        {evaluationDefinitions.map(def => {
                                            const evaluation = lapsoEvals.find(e => e.descripcion === def.descripcion);
                                            return (
                                                <td key={def.descripcion} className="px-6 py-2">
                                                    <div className="flex justify-center">
                                                        <GradeCell
                                                            studentId={student.id}
                                                            evaluation={evaluation}
                                                            evaluationDef={def}
                                                            materiaId={materiaId}
                                                            añoId={añoId}
                                                            lapso={lapso}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className={`px-6 py-2 text-center font-bold text-lg ${averageColor}`}>
                                            {lapsoAverage?.toFixed(2) ?? '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
