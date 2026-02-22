'use client';

import React, { useMemo } from 'react';
import { type Student, type Calificacion, type Evaluacion } from '../types';

interface GradesSummaryTableProps {
  students: Student[];
  materiaId: number;
  añoId: number;
  calificaciones: Calificacion[];
}

export const GradesSummaryTable: React.FC<GradesSummaryTableProps> = ({ students, materiaId, añoId, calificaciones }) => {

  const getEvaluationDefinitions = (lapsoKey: 'lapso1' | 'lapso2' | 'lapso3') => {
    const allEvaluations = calificaciones
      .filter(c => c.materiaId === materiaId && c.anoEscolarId === añoId)
      .flatMap(c => c[lapsoKey] || []);
    const uniqueEvals = new Map<string, { ponderacion: number }>();
    allEvaluations.forEach(ev => {
      if (!uniqueEvals.has(ev.descripcion)) {
        uniqueEvals.set(ev.descripcion, { ponderacion: ev.ponderacion });
      }
    });
    return Array.from(uniqueEvals.values());
  };

  const defs1 = useMemo(() => getEvaluationDefinitions('lapso1'), [calificaciones, materiaId, añoId]);
  const defs2 = useMemo(() => getEvaluationDefinitions('lapso2'), [calificaciones, materiaId, añoId]);
  const defs3 = useMemo(() => getEvaluationDefinitions('lapso3'), [calificaciones, materiaId, añoId]);

  const calculateLapsoAverage = (evals: Evaluacion[], defs: { ponderacion: number }[]): number | null => {
    if (defs.length === 0) return null;
    const totalPonderacion = defs.reduce((sum, e) => sum + e.ponderacion, 0);
    if (totalPonderacion === 0) return null;
    const weightedSum = evals.reduce((sum, e) => sum + (e.nota * e.ponderacion), 0);
    return weightedSum / totalPonderacion;
  };

  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden animate-[fade-in_0.3s_ease-out]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3 sticky left-0 bg-moon-nav z-20 w-1/3 min-w-[200px]">Estudiante</th>
              <th scope="col" className="px-6 py-3 text-center">Lapso 1</th>
              <th scope="col" className="px-6 py-3 text-center">Lapso 2</th>
              <th scope="col" className="px-6 py-3 text-center">Lapso 3</th>
              <th scope="col" className="px-6 py-3 text-center font-bold text-white">Definitiva</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-moon-text-secondary">No hay estudiantes en esta sección.</td>
              </tr>
            ) : (
              students.map((student) => {
                const calificacion = calificaciones.find(c => c.studentId === student.id && c.materiaId === materiaId && c.anoEscolarId === añoId);

                const avg1 = calculateLapsoAverage(calificacion?.lapso1 || [], defs1);
                const avg2 = calculateLapsoAverage(calificacion?.lapso2 || [], defs2);
                const avg3 = calculateLapsoAverage(calificacion?.lapso3 || [], defs3);

                // Running definitive average
                const validavgs = [avg1, avg2, avg3].filter(a => a !== null) as number[];
                const sumAvgs = validavgs.reduce((a, b) => a + b, 0);
                const definitive = validavgs.length > 0 ? sumAvgs / validavgs.length : null;

                const getColor = (val: number | null) => {
                  if (val === null) return 'text-moon-text-secondary';
                  return val >= 9.5 ? 'text-moon-green' : 'text-moon-orange';
                };

                return (
                  <tr key={student.id} className="group border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap sticky left-0 bg-moon-component group-hover:bg-moon-nav/50 z-10 transition-colors">
                      {student.nombres} {student.apellidos}
                    </td>
                    <td className={`px-6 py-4 text-center font-semibold ${getColor(avg1)}`}>
                      {avg1?.toFixed(2) ?? '-'}
                    </td>
                    <td className={`px-6 py-4 text-center font-semibold ${getColor(avg2)}`}>
                      {avg2?.toFixed(2) ?? '-'}
                    </td>
                    <td className={`px-6 py-4 text-center font-semibold ${getColor(avg3)}`}>
                      {avg3?.toFixed(2) ?? '-'}
                    </td>
                    <td className={`px-6 py-4 text-center font-bold text-lg ${getColor(definitive)}`}>
                      {definitive?.toFixed(2) ?? '-'}
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
