
import React from 'react';

interface ResumenReportProps {
    data: any; // { grado, seccion, anoEscolar, acta: [] }
    logoUrl?: string; // Optional custom logo
}

export const ResumenReport: React.FC<ResumenReportProps> = ({ data }) => {
    const { grado, seccion, anoEscolar, acta } = data;

    // Obtener lista única de materias para las columnas
    const materiasMap = new Map();
    acta.forEach((student: any) => {
        student.materias.forEach((m: any) => {
            materiasMap.set(m.materia_id, m.nombre_materia);
        });
    });
    const materiasIds = Array.from(materiasMap.keys()).sort();

    // Helper para calcular definitiva
    const getDefinitiva = (materia: any) => {
        const getLapsoNota = (lapso: any[]) => {
            if (!lapso || lapso.length === 0) return 0;
            return lapso.reduce((acc, curr) => acc + Number(curr.nota), 0) / lapso.length;
        };
        const def = (getLapsoNota(materia.lapso1) + getLapsoNota(materia.lapso2) + getLapsoNota(materia.lapso3)) / 3;
        return def.toFixed(0);
    };

    return (
        <div className="bg-white text-black p-8 mx-auto w-full max-w-[28cm] min-h-[21cm] shadow-2xl print:shadow-none font-sans text-xs landscape:w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="w-24 h-24 flex items-center justify-center">
                    <img src="/images/escudo_venezuela.png" alt="Escudo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div className="text-center flex-1 mx-4">
                    <h2 className="font-bold text-sm tracking-wide">REPUBLICA BOLIVARIANA DE VENEZUELA</h2>
                    <h2 className="font-bold text-sm tracking-wide">MINISTERIO DEL PODER POPULAR PARA LA EDUCACION</h2>
                    <h1 className="font-extrabold text-base mt-1">U.E.N "PEDRO EMILIO COLL"</h1>
                    <h3 className="font-bold text-sm mt-1">RESUMEN DE EVALUACION</h3>
                </div>
                <div className="w-24 h-24 flex items-center justify-center">
                    <img src="/images/logo_school.png" alt="Logo Escuela" className="w-full h-full object-contain" />
                </div>
            </div>

            <div className="text-center mb-4 border-b-2 border-black pb-1">
                <h2 className="text-lg font-bold">AÑO ESCOLAR: {anoEscolar.nombre}</h2>
                <h3 className="text-md font-semibold">GRADO: {grado.nombre_grado}  SECCIÓN: "{seccion.nombre_seccion}"</h3>
            </div>

            {/* Tabla Sábana */}
            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black px-1 py-1 w-8">N°</th>
                        <th className="border border-black px-1 py-1 w-20">Cédula</th>
                        <th className="border border-black px-1 py-1 text-left">Estudiante</th>
                        {materiasIds.map(mId => (
                            <th key={mId} className="border border-black px-1 py-1 w-12 text-center rotate-head">
                                <div className="transform -rotate-90 h-24 flex items-center justify-center whitespace-nowrap">
                                    {materiasMap.get(mId)}
                                </div>
                            </th>
                        ))}
                        <th className="border border-black px-1 py-1 w-10 text-center font-bold">PROM</th>
                    </tr>
                </thead>
                <tbody>
                    {acta.map((student: any, index: number) => {
                        // Mapa de notas por materia para acceso rápido
                        const studentGrades = new Map();
                        let totalDef = 0;
                        let countDef = 0;

                        student.materias.forEach((m: any) => {
                            const def = getDefinitiva(m);
                            studentGrades.set(m.materia_id, def);
                            totalDef += Number(def);
                            countDef++;
                        });

                        const promedioGeneral = countDef > 0 ? (totalDef / countDef).toFixed(0) : '';

                        return (
                            <tr key={student.student_id}>
                                <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                                <td className="border border-black px-1 py-1 text-center">{student.cedula}</td>
                                <td className="border border-black px-1 py-1 font-bold">{student.apellidos}, {student.nombres}</td>
                                {materiasIds.map(mId => (
                                    <td key={mId} className="border border-black px-1 py-1 text-center">
                                        {studentGrades.get(mId) || '-'}
                                    </td>
                                ))}
                                <td className="border border-black px-1 py-1 text-center font-bold bg-gray-100">{promedioGeneral}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Firmas */}
            <div className="mt-12 grid grid-cols-2 gap-20 text-center">
                <div className="border-t border-black pt-2 w-64 mx-auto">
                    <p>Director(a)</p>
                </div>
                <div className="border-t border-black pt-2 w-64 mx-auto">
                    <p>Control de Estudios</p>
                </div>
            </div>
        </div>
    );
};
